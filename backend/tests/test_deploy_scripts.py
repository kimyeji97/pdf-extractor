"""
REQ-E02 Phase 3 — 배포 스크립트 검증 계약

검증 계약: docs/plans/PLAN-E02-prod-environment.md `## 검증 계약`
케이스: E02-16 ~ E02-23, E02-25 ~ E02-31 (E02-24는 실측 — 코드 없음)

스크립트(`scripts/deploy/*.sh`)를 임시 git 저장소에 복사해 실행한다. HEAD·미커밋 상태를
테스트가 정해야 하고, 실제 레포 작업 트리 상태에 끌려가면 안 되기 때문이다.

`npm`·`npx`·`docker`·`aws`는 PATH 앞에 둔 가짜 실행 파일이다 — 호출 인자를 기록만 하고
실제 빌드·배포는 하지 않는다. 가짜 `aws`는 실제 응답 형태(전체 JSON)를 돌려주고
`--query`·`--output text`를 jmespath(boto3 의존성)로 흉내 낸다. 스크립트가 AWS를 어떤
방식으로 부르든(쿼리·JSON 파싱) 테스트가 구현을 정하지 않기 위해서다.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

_ROOT = Path(__file__).resolve().parents[2]
_DEPLOY = _ROOT / "scripts" / "deploy"
_WRANGLER = _ROOT / "frontend" / "wrangler.jsonc"

_DEV_API = "https://dailystudy-workbook-api-dev.yejicraft-cf.com/api"
_PROD_API = "https://dailystudy-workbook-api.yejicraft-cf.com/api"
_REPO = "504233295989.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend"
_FAMILY = "pdf-extractor-backend-prod"
_TD_ARN = f"arn:aws:ecs:ap-northeast-2:504233295989:task-definition/{_FAMILY}"
_SECRET = "arn:aws:secretsmanager:ap-northeast-2:504233295989:secret:pdf-extractor/prod-zegiKY"

# 현재 prod 리비전(rev 1) — describe-task-definition 응답 그대로의 모양(등록 불가 필드 포함)
_CURRENT_TD = {
    "taskDefinitionArn": f"{_TD_ARN}:1",
    "family": _FAMILY,
    "revision": 1,
    "status": "ACTIVE",
    "cpu": "2048",
    "memory": "4096",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "compatibilities": ["EC2", "FARGATE"],
    "executionRoleArn": "arn:aws:iam::504233295989:role/pdf-extractor-ecs-execution-role",
    "requiresAttributes": [{"name": "com.amazonaws.ecs.capability.logging-driver.awslogs"}],
    "registeredAt": "2026-10-05T13:55:00.000000+09:00",
    "registeredBy": "arn:aws:iam::504233295989:user/someone",
    "volumes": [],
    "placementConstraints": [],
    "containerDefinitions": [
        {
            "name": "backend",
            "image": f"{_REPO}:prod-2cc43de",
            "essential": True,
            "portMappings": [{"containerPort": 8000, "hostPort": 8000, "protocol": "tcp"}],
            "secrets": [
                {"name": "JWT_SECRET_KEY", "valueFrom": f"{_SECRET}:JWT_SECRET_KEY::"},
                {"name": "CORS_ALLOWED_ORIGINS", "valueFrom": f"{_SECRET}:CORS_ALLOWED_ORIGINS::"},
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/pdf-extractor-prod",
                    "awslogs-region": "ap-northeast-2",
                    "awslogs-stream-prefix": "ecs",
                },
            },
        },
        {
            "name": "cloudflared",
            "image": "cloudflare/cloudflared:latest",
            "essential": True,
            "command": ["tunnel", "--no-autoupdate", "run"],
            "secrets": [{"name": "TUNNEL_TOKEN", "valueFrom": f"{_SECRET}:TUNNEL_TOKEN::"}],
        },
    ],
}

# 가짜 aws — 호출을 기록하고 실제 응답 모양을 돌려준다. --query/--output text 는 jmespath 로 흉내.
_FAKE_AWS = r'''
import json, os, sys
import jmespath

argv = sys.argv[1:]
state_path = os.environ["FAKE_STATE"]
state = json.load(open(state_path))
current = state["current_td"]

def opt(name):
    for i, a in enumerate(argv):
        if a == name and i + 1 < len(argv):
            return argv[i + 1]
        if a.startswith(name + "="):
            return a.split("=", 1)[1]
    return None

def load(v):
    if v is None:
        return None
    if v.startswith("file://"):
        return json.load(open(v[len("file://"):]))
    return json.loads(v)

record = {"cmd": "aws", "argv": argv}
cmd = [a for a in argv if not a.startswith("-")][:2]
resp = {}
if cmd[:2] == ["ecr", "get-login-password"]:
    print("fake-password")
    resp = None
elif cmd[:2] == ["ecs", "describe-services"]:
    resp = {"services": [{"serviceName": "pdf-extractor-backend-prod-svc", "status": "ACTIVE",
                          "taskDefinition": current["taskDefinitionArn"], "desiredCount": 1, "runningCount": 1}]}
elif cmd[:2] == ["ecs", "describe-task-definition"]:
    resp = {"taskDefinition": current}
elif cmd[:2] == ["ecs", "register-task-definition"]:
    body = load(opt("--cli-input-json")) or {}
    flag_map = {"--family": "family", "--cpu": "cpu", "--memory": "memory", "--network-mode": "networkMode",
                "--execution-role-arn": "executionRoleArn", "--task-role-arn": "taskRoleArn"}
    for flag, key in flag_map.items():
        if opt(flag) is not None:
            body[key] = opt(flag)
    for flag, key in {"--container-definitions": "containerDefinitions",
                      "--requires-compatibilities": "requiresCompatibilities"}.items():
        v = opt(flag)
        if v is not None:
            try:
                body[key] = load(v)
            except ValueError:
                body[key] = [v]
    record["registered"] = body
    rev = state["next_rev"]
    state["next_rev"] = rev + 1
    resp = {"taskDefinition": dict(body, taskDefinitionArn=f"{state['td_arn']}:{rev}", revision=rev, status="ACTIVE")}
elif cmd[:2] == ["ecs", "update-service"]:
    resp = {"service": {"serviceName": opt("--service"), "taskDefinition": opt("--task-definition"), "desiredCount": 1}}
elif cmd[:2] == ["ecs", "wait"]:
    resp = None
elif cmd[:2] == ["ecs", "deregister-task-definition"]:
    resp = {"taskDefinition": {"taskDefinitionArn": opt("--task-definition"), "status": "INACTIVE"}}
elif cmd[:2] == ["sts", "get-caller-identity"]:
    resp = {"Account": "504233295989", "Arn": "arn:aws:iam::504233295989:user/someone"}

with open(os.environ["FAKE_LOG"], "a") as f:
    f.write(json.dumps(record) + "\n")
json.dump(state, open(state_path, "w"))

if resp is not None:
    q = opt("--query")
    out = jmespath.search(q, resp) if q else resp
    if opt("--output") == "text":
        def text(v):
            if isinstance(v, list):
                if v and all(isinstance(x, list) for x in v):
                    return "\n".join(text(x) for x in v)
                return "\t".join("" if x is None else (json.dumps(x) if isinstance(x, (dict, list)) else str(x)) for x in v)
            if isinstance(v, dict):
                return "\t".join(str(x) for x in v.values())
            return "None" if v is None else str(v)
        print(text(out))
    else:
        print(json.dumps(out))
'''

# 가짜 npm·npx·docker — 호출 인자와 VITE_API_BASE_URL 만 기록
_FAKE_RECORDER = r'''
import json, os, sys
if not sys.stdin.isatty():
    try:
        sys.stdin.read()
    except Exception:
        pass
with open(os.environ["FAKE_LOG"], "a") as f:
    f.write(json.dumps({"cmd": os.path.basename(sys.argv[0]), "argv": sys.argv[1:],
                        "VITE_API_BASE_URL": os.environ.get("VITE_API_BASE_URL")}) + "\n")
'''


def _git(cwd, *args):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


@pytest.fixture
def sandbox(tmp_path):
    """스크립트를 복사한 임시 git 저장소 + 가짜 실행 파일 디렉토리."""
    repo = tmp_path / "sbx"
    (repo / "scripts" / "deploy").mkdir(parents=True)
    (repo / "backend").mkdir()
    (repo / "frontend").mkdir()
    (repo / "backend" / "Dockerfile").write_text("FROM scratch\n")
    for script in _DEPLOY.glob("*.sh"):
        shutil.copy2(script, repo / "scripts" / "deploy" / script.name)
    shutil.copy2(_WRANGLER, repo / "frontend" / "wrangler.jsonc")
    _git(repo, "init", "-q")
    _git(repo, "add", ".")
    _git(repo, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "init")

    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    for name, src in [("aws", _FAKE_AWS), ("npm", _FAKE_RECORDER), ("npx", _FAKE_RECORDER), ("docker", _FAKE_RECORDER)]:
        p = bin_dir / name
        p.write_text(f"#!{sys.executable}\n{src}")
        p.chmod(0o755)

    state = tmp_path / "state.json"
    state.write_text(json.dumps({"current_td": _CURRENT_TD, "next_rev": 2, "td_arn": _TD_ARN}))
    log = tmp_path / "calls.jsonl"
    log.write_text("")
    return {"repo": repo, "bin": bin_dir, "state": state, "log": log}


def _run(sb, script, *args):
    path = sb["repo"] / "scripts" / "deploy" / script
    if not path.exists():
        pytest.fail(f"scripts/deploy/{script} 가 없다 (아직 구현 전)")
    env = dict(os.environ, PATH=f"{sb['bin']}{os.pathsep}{os.environ['PATH']}",
               FAKE_LOG=str(sb["log"]), FAKE_STATE=str(sb["state"]))
    env.pop("VITE_API_BASE_URL", None)
    proc = subprocess.run(["bash", str(path), *args], cwd=sb["repo"], env=env,
                          capture_output=True, text=True, timeout=60)
    calls = [json.loads(l) for l in sb["log"].read_text().splitlines() if l.strip()]
    return proc, calls


def _of(calls, *names):
    return [c for c in calls if c["cmd"] in names]


def _head_tag(sb):
    return f"prod-{_git(sb['repo'], 'rev-parse', '--short', 'HEAD')}"


def _strip_jsonc(text):
    """문자열 밖의 // 주석만 지운다 (URL 안의 // 는 남긴다)."""
    out, i, in_str = [], 0, False
    while i < len(text):
        ch = text[i]
        if in_str:
            out.append(ch)
            if ch == "\\":
                out.append(text[i + 1])
                i += 1
            elif ch == '"':
                in_str = False
        elif ch == '"':
            in_str = True
            out.append(ch)
        elif text.startswith("//", i):
            while i < len(text) and text[i] != "\n":
                i += 1
            continue
        else:
            out.append(ch)
        i += 1
    return re.sub(r",(\s*[}\]])", r"\1", "".join(out))


def _wrangler():
    return json.loads(_strip_jsonc(_WRANGLER.read_text()))


# ── frontend-deploy.sh ───────────────────────────────────────────


def test_E02_16_인자_없으면_실패하고_빌드·배포를_부르지_않는다(sandbox):
    proc, calls = _run(sandbox, "frontend-deploy.sh")
    assert (proc.returncode != 0, _of(calls, "npm", "npx")) == (True, [])


def test_E02_17_dev·prod가_아닌_인자는_실패하고_빌드·배포를_부르지_않는다(sandbox):
    proc, calls = _run(sandbox, "frontend-deploy.sh", "stage")
    assert (proc.returncode != 0, _of(calls, "npm", "npx")) == (True, [])


def test_E02_18_dev_빌드는_dev_API_URL을_주입한다(sandbox):
    _, calls = _run(sandbox, "frontend-deploy.sh", "dev")
    builds = [c["VITE_API_BASE_URL"] for c in _of(calls, "npm") if c["argv"][:2] == ["run", "build"]]
    assert builds == [_DEV_API]


def test_E02_19_dev_배포는_env_없이_wrangler_deploy(sandbox):
    _, calls = _run(sandbox, "frontend-deploy.sh", "dev")
    assert [c["argv"] for c in _of(calls, "npx")] == [["wrangler", "deploy"]]


def test_E02_20_prod_빌드는_prod_API_URL을_주입한다(sandbox):
    _, calls = _run(sandbox, "frontend-deploy.sh", "prod")
    builds = [c["VITE_API_BASE_URL"] for c in _of(calls, "npm") if c["argv"][:2] == ["run", "build"]]
    assert builds == [_PROD_API]


def test_E02_21_prod_배포는_wrangler_deploy_env_prod(sandbox):
    _, calls = _run(sandbox, "frontend-deploy.sh", "prod")
    deploys = [" ".join(c["argv"]) for c in _of(calls, "npx")]
    assert [bool(re.fullmatch(r"wrangler deploy (--env prod|--env=prod)", d)) for d in deploys] == [True]


# ── frontend/wrangler.jsonc ─────────────────────────────────────


def test_E02_22_wrangler_최상위_name은_dev_Worker_그대로():
    assert _wrangler()["name"] == "twilight-base-302d"


def test_E02_23_wrangler_env_prod는_prod_Worker_이름과_커스텀_도메인을_가진다():
    prod = _wrangler().get("env", {}).get("prod", {})
    has_domain = any(
        r.get("pattern") == "dailystudy-workbook.yejicraft-cf.com" and r.get("custom_domain") is True
        for r in prod.get("routes", [])
    )
    assert (prod.get("name"), has_domain) == ("dailystudy-workbook-prod", True)


# ── backend-deploy-prod.sh — 거부 경로 ─────────────────────────────


def test_E02_25_태그_없으면_실패하고_docker·aws를_부르지_않는다(sandbox):
    proc, calls = _run(sandbox, "backend-deploy-prod.sh")
    assert (proc.returncode != 0, _of(calls, "docker", "aws")) == (True, [])


def test_E02_26_태그가_latest면_실패하고_docker·aws를_부르지_않는다(sandbox):
    proc, calls = _run(sandbox, "backend-deploy-prod.sh", "latest")
    assert (proc.returncode != 0, _of(calls, "docker", "aws")) == (True, [])


def test_E02_27_태그가_HEAD와_다르면_실패하고_docker·aws를_부르지_않는다(sandbox):
    proc, calls = _run(sandbox, "backend-deploy-prod.sh", "prod-0000000")
    assert (proc.returncode != 0, _of(calls, "docker", "aws")) == (True, [])


def test_E02_28_커밋_안_된_변경이_있으면_실패하고_docker·aws를_부르지_않는다(sandbox):
    (sandbox["repo"] / "backend" / "Dockerfile").write_text("FROM scratch\n# 미커밋 변경\n")
    proc, calls = _run(sandbox, "backend-deploy-prod.sh", _head_tag(sandbox))
    assert (proc.returncode != 0, _of(calls, "docker", "aws")) == (True, [])


# ── backend-deploy-prod.sh — 정상 실행 ─────────────────────────────


def test_E02_29_정상_실행은_backend_latest를_어디에도_쓰지_않는다(sandbox):
    proc, calls = _run(sandbox, "backend-deploy-prod.sh", _head_tag(sandbox))
    assert proc.returncode == 0, proc.stderr
    leaked = [c for c in _of(calls, "docker", "aws")
              if "pdf-extractor-backend:latest" in json.dumps(c)]
    assert leaked == []


def test_E02_30_새_리비전은_이미지만_바꾼_현재_리비전의_복제다(sandbox):
    tag = _head_tag(sandbox)
    proc, calls = _run(sandbox, "backend-deploy-prod.sh", tag)
    assert proc.returncode == 0, proc.stderr
    registered = [c["registered"] for c in _of(calls, "aws") if "registered" in c]
    keys = ["family", "cpu", "memory", "networkMode", "requiresCompatibilities", "executionRoleArn",
            "containerDefinitions"]
    expected = json.loads(json.dumps({k: _CURRENT_TD[k] for k in keys}))
    expected["containerDefinitions"][0]["image"] = f"{_REPO}:{tag}"
    assert [{k: r.get(k) for k in keys} for r in registered] == [expected]


def test_E02_31_서비스_갱신·안정화_대기_뒤에_이전_리비전을_deregister한다(sandbox):
    proc, calls = _run(sandbox, "backend-deploy-prod.sh", _head_tag(sandbox))
    assert proc.returncode == 0, proc.stderr
    steps = []
    for c in _of(calls, "aws"):
        argv, joined = c["argv"], " ".join(c["argv"])
        if "update-service" in argv and re.search(rf"{_FAMILY}:2(\s|$)", joined):
            steps.append("update")
        elif "wait" in argv and "services-stable" in argv:
            steps.append("wait")
        elif "deregister-task-definition" in argv and re.search(rf"{_FAMILY}:1(\s|$)", joined):
            steps.append("deregister")
    assert steps == ["update", "wait", "deregister"]
