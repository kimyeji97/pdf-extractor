"""운영 콘솔 — 이용 현황 조회 + admin 부여/회수 + 가입 승인(REQ-C12). 내 맥에서만 뜬다(127.0.0.1).

prod API 에 새 엔드포인트를 만들지 않고, promote-admin.sh 처럼 **저장소(R2)를 직접** 읽고 쓴다.
자격증명은 Secrets Manager(`pdf-extractor/<env>`)에서 받아 프로세스 env 로만 넣는다 — 디스크에 안 남긴다.
서버 부하는 CloudWatch(AWS/ECS)의 태스크 CPU·메모리다. 비용은 그 지표로 센 **실제 가동 분**에 정가를 곱한 추정이다.

사용: scripts/ops/admin-console.sh [prod|dev|local] [포트]
"""
import json
import os
import sys
import time
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import boto3

ENV = sys.argv[1] if len(sys.argv) > 1 else "prod"
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8765
REGION = "ap-northeast-2"
CLUSTER = "pdf-extractor-cluster"
SERVICE = {"prod": "pdf-extractor-backend-prod-svc", "dev": "pdf-extractor-backend-dev-svc"}.get(ENV)
HTML = Path(__file__).with_name("admin-console.html")
LOG_GROUP = {"prod": "/ecs/pdf-extractor-prod", "dev": "/ecs/pdf-extractor-dev"}.get(ENV)
WORKER = {"prod": "dailystudy-workbook-prod", "dev": "twilight-base-302d"}.get(ENV)
KST = timezone(timedelta(hours=9))

# 정가(USD) — AWS Price List API 로 2026-10-06 확인한 서울(ap-northeast-2) 값. 세금·크레딧·무료 티어 미반영.
# ponytail: 상수 단가 — 단가가 바뀌거나 실제 청구액이 필요하면 Cost Explorer(get_cost_and_usage)로 바꿀 것
FARGATE_VCPU_H = 0.04656     # APN2-Fargate-vCPU-Hours:perCPU (x86)
FARGATE_GB_H = 0.00511       # APN2-Fargate-GB-Hours
PUBLIC_IPV4_H = 0.005        # APN2-PublicIPv4:InUseAddress — 서비스가 assignPublicIp=ENABLED
SECRET_MONTH = 0.40          # Secrets Manager 시크릿 1개(pdf-extractor/<env>)
R2_GB_MONTH = 0.015          # R2 Standard 저장 — 계정 전체 10GB 무료(여기선 빼지 않는다)

# 저장소 설정은 어떤 app.* 임포트보다 먼저 — storage 가 임포트 시점에 백엔드를 고른다(계약 #24)
if ENV in ("prod", "dev"):
    secret = json.loads(boto3.client("secretsmanager", region_name=REGION)
                        .get_secret_value(SecretId=f"pdf-extractor/{ENV}")["SecretString"])
    for k in ("STORAGE_BACKEND", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY",
              "R2_BUCKET_NAME", "R2_PUBLIC_DOMAIN", "R2_ROOT_PREFIX"):
        os.environ[k] = secret.get(k, "")
elif ENV == "local":
    os.environ["STORAGE_BACKEND"] = "local"
else:
    sys.exit(f"env 는 prod|dev|local: {ENV}")

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
from app.services import auth_service, storage  # noqa: E402


def _day(v) -> str:
    return str(v)[:10] if v else ""


def _users():
    return sorted(storage.list_users(), key=lambda u: u.get("created_at", ""))


def summary() -> dict:
    users = _users()
    email = {u["user_id"]: u.get("email", "") for u in users}
    jobs = storage.list_jobs()
    sources = [j for j in jobs if j.job_type.value == "SOURCE"]
    exports = [j for j in jobs if j.job_type.value == "EXPORT"]
    workbooks = storage.list_workbooks()

    per_user = defaultdict(lambda: {"uploads": 0, "pages": 0, "workbooks": 0, "last": ""})
    for j in sources:
        s = per_user[j.owner_id]
        s["uploads"] += 1
        s["pages"] += j.total_pages or 0
        s["last"] = max(s["last"], str(j.uploaded_at or ""))
    for w in workbooks:
        s = per_user[w.get("owner_id")]
        s["workbooks"] += 1
        s["last"] = max(s["last"], str(w.get("created_at", "")))

    since = (datetime.now(timezone.utc) - timedelta(days=13)).date()
    days = [str(since + timedelta(days=i)) for i in range(14)]
    up_by_day = Counter(_day(j.uploaded_at) for j in sources)
    wb_by_day = Counter(_day(w.get("created_at")) for w in workbooks)
    su_by_day = Counter(_day(u.get("created_at")) for u in users)

    return {
        "env": ENV,
        "now": datetime.now(timezone.utc).isoformat(),
        "users": [{
            "user_id": u["user_id"], "email": u.get("email", ""), "role": u.get("role", "user"),
            "status": auth_service.user_status(u),
            "created_at": u.get("created_at", ""), **per_user[u["user_id"]],
        } for u in users],
        "orphan": per_user.get(None),   # owner_id 없는 옛 레코드
        "daily": [{"day": d, "signups": su_by_day[d], "uploads": up_by_day[d], "workbooks": wb_by_day[d]}
                  for d in days],
        "analysis": {
            "by_status": Counter((j.boundaries_status.value if j.boundaries_status else "NONE") for j in sources),
            "files": len(sources),
            "pages": sum(j.total_pages or 0 for j in sources),
            "questions": sum(j.total_question_count or 0 for j in sources),
            "recent": [{
                "name": j.workbook_name or j.filename, "owner": email.get(j.owner_id, "—"),
                "status": j.boundaries_status.value if j.boundaries_status else "NONE",
                "pages": j.total_pages, "questions": j.total_question_count,
                "at": str(j.uploaded_at or ""),
            } for j in sources[:30]],
            "failed": [{"id": j.job_id, "name": j.workbook_name or j.filename, "owner": email.get(j.owner_id, "—"),
                        "error": (j.error or "")[:200], "at": str(j.uploaded_at or "")}
                       for j in sources if j.boundaries_status and j.boundaries_status.value == "FAILED"][:10],
        },
        "generation": {
            "by_status": Counter(j.status.value for j in exports),
            "workbooks": len(workbooks),
            "questions": sum(w.get("question_count", 0) for w in workbooks),
            "recent": [{
                "name": w.get("name") or w.get("filename"), "owner": email.get(w.get("owner_id"), "—"),
                "layout": w.get("layout"), "questions": w.get("question_count"), "at": w.get("created_at", ""),
            } for w in workbooks[:30]],
            "failed": [{"id": j.job_id, "error": (j.error or "")[:200], "at": str(j.uploaded_at or "")}
                       for j in exports if j.status.value == "FAILED"][:10],
        },
    }


def server(hours: int) -> dict:
    if SERVICE is None:
        return {"service": None, "links": {}}
    ecs = boto3.client("ecs", region_name=REGION)
    svc = ecs.describe_services(cluster=CLUSTER, services=[SERVICE])["services"][0]
    tasks = ecs.list_tasks(cluster=CLUSTER, serviceName=SERVICE)["taskArns"]
    started = [t.get("startedAt") for t in ecs.describe_tasks(cluster=CLUSTER, tasks=tasks)["tasks"]] if tasks else []
    td = ecs.describe_task_definition(taskDefinition=svc["taskDefinition"])["taskDefinition"]

    end = datetime.now(timezone.utc)
    period = 60 if hours <= 3 else 300 if hours <= 24 else 3600
    dims = [{"Name": "ClusterName", "Value": CLUSTER}, {"Name": "ServiceName", "Value": SERVICE}]
    queries = [{"Id": f"{m.lower()}{s[:3].lower()}", "MetricStat": {
        "Metric": {"Namespace": "AWS/ECS", "MetricName": f"{m}Utilization", "Dimensions": dims},
        "Period": period, "Stat": s}} for m in ("CPU", "Memory") for s in ("Average", "Maximum")]
    res = boto3.client("cloudwatch", region_name=REGION).get_metric_data(
        MetricDataQueries=queries, StartTime=end - timedelta(hours=hours), EndTime=end, ScanBy="TimestampAscending")
    series = {r["Id"]: [[t.isoformat(), round(v, 1)] for t, v in zip(r["Timestamps"], r["Values"])]
              for r in res["MetricDataResults"]}
    return {
        "service": SERVICE, "desired": svc["desiredCount"], "running": svc["runningCount"],
        "task_def": svc["taskDefinition"].split("/")[-1], "cpu": td.get("cpu"), "memory": td.get("memory"),
        "image": next((c["image"].split(":")[-1] for c in td["containerDefinitions"] if c["name"] == "backend"), ""),
        "started": [str(s) for s in started if s], "period": period, "series": series,
        "hourly_usd": _hourly(td), "links": links(),
    }


def _cw_logs_url(pattern: str = "") -> str:
    group = LOG_GROUP.replace("/", "$252F")
    q = f"$3FfilterPattern$3D$2522{pattern}$2522$26start$3D-1209600000" if pattern else ""
    return (f"https://{REGION}.console.aws.amazon.com/cloudwatch/home?region={REGION}"
            f"#logsV2:log-groups/log-group/{group}/log-events{q}")


def links() -> dict:
    acct = os.environ.get("R2_ACCOUNT_ID", "")
    return {
        "ecs": f"https://{REGION}.console.aws.amazon.com/ecs/v2/clusters/{CLUSTER}/services/{SERVICE}/health?region={REGION}",
        "logs": _cw_logs_url(),
        "logs_pattern": _cw_logs_url("__PATTERN__"),   # 페이지가 job_id 로 바꿔 끼운다
        "worker": f"https://dash.cloudflare.com/{acct}/workers/services/view/{WORKER}/production" if acct else "",
        "billing": "https://us-east-1.console.aws.amazon.com/costmanagement/home#/cost-explorer",
    }


def _hourly(td: dict) -> float:
    return round(int(td["cpu"]) / 1024 * FARGATE_VCPU_H + int(td["memory"]) / 1024 * FARGATE_GB_H + PUBLIC_IPV4_H, 5)


_r2_cache: dict = {}
_fx_cache: dict = {}


def _usd_krw() -> dict | None:
    """USD→KRW 환율(exchangerate-api.com 무료 엔드포인트, 하루 1회 갱신). 6시간 캐시, 실패하면 None — 원화만 빠진다."""
    hit = _fx_cache.get("v")
    if hit and time.monotonic() - hit[0] < 6 * 3600:
        return hit[1]
    try:
        with urllib.request.urlopen("https://open.er-api.com/v6/latest/USD", timeout=5) as r:
            d = json.load(r)
        fx = {"krw": d["rates"]["KRW"], "at": d["time_last_update_utc"], "source": "exchangerate-api.com"}
    except Exception:
        return hit[1] if hit else None
    _fx_cache["v"] = (time.monotonic(), fx)
    return fx


def _r2_bytes() -> int:
    """버킷의 이 앱 prefix 아래 총 바이트. 객체 수만큼 목록을 넘기므로 10분 캐시."""
    if os.environ.get("STORAGE_BACKEND") != "s3":
        return 0
    hit = _r2_cache.get("v")
    if hit and time.monotonic() - hit[0] < 600:
        return hit[1]
    from app.services import s3_service
    total = 0
    for page in s3_service.r2.get_paginator("list_objects_v2").paginate(
            Bucket=s3_service.BUCKET, Prefix=s3_service._key("")):
        total += sum(o["Size"] for o in page.get("Contents", []))
    _r2_cache["v"] = (time.monotonic(), total)
    return total


def cost() -> dict:
    """KST 일별 가동 분 → 비용. CPU 지표는 태스크가 떠 있을 때만 1분에 1개 찍힌다 — SampleCount = 가동 분.
    (배포 중 태스크 2개가 겹치는 몇 분은 1개로 센다 — 과소 추정 몇 센트)"""
    if SERVICE is None:
        return {"service": None}
    ecs = boto3.client("ecs", region_name=REGION)
    svc = ecs.describe_services(cluster=CLUSTER, services=[SERVICE])["services"][0]
    hourly = _hourly(ecs.describe_task_definition(taskDefinition=svc["taskDefinition"])["taskDefinition"])

    now = datetime.now(KST)
    month0 = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev0 = (month0 - timedelta(days=1)).replace(day=1)
    next0 = (month0 + timedelta(days=32)).replace(day=1)
    res = boto3.client("cloudwatch", region_name=REGION).get_metric_statistics(
        Namespace="AWS/ECS", MetricName="CPUUtilization", Period=86400, Statistics=["SampleCount"],
        Dimensions=[{"Name": "ClusterName", "Value": CLUSTER}, {"Name": "ServiceName", "Value": SERVICE}],
        StartTime=prev0, EndTime=now)
    minutes = {p["Timestamp"].astimezone(KST).date().isoformat(): int(p["SampleCount"]) for p in res["Datapoints"]}

    days, d = [], prev0
    while d.date() <= now.date():
        m = minutes.get(d.date().isoformat(), 0)
        days.append({"day": d.date().isoformat(), "minutes": m, "usd": round(m / 60 * hourly, 3)})
        d += timedelta(days=1)
    this = [x for x in days if x["day"] >= month0.date().isoformat()]
    prev = [x for x in days if x["day"] < month0.date().isoformat()]
    last7 = days[-7:]

    r2_gb = _r2_bytes() / 1024 ** 3
    fixed = SECRET_MONTH + r2_gb * R2_GB_MONTH
    remain_h = (next0 - now).total_seconds() / 3600
    mtd = sum(x["usd"] for x in this)
    return {
        "service": SERVICE, "hourly": hourly, "running": svc["runningCount"], "days": days,
        "prev_month": {"month": prev0.strftime("%Y-%m"), "compute": round(sum(x["usd"] for x in prev), 2)},
        "this_month": {"month": month0.strftime("%Y-%m"), "compute": round(mtd, 2), "fixed": round(fixed, 2)},
        "forecast": {
            "keep_state": round(mtd + (remain_h * hourly if svc["runningCount"] else 0) + fixed, 2),
            "pace_7d": round(mtd + sum(x["usd"] for x in last7) / 7 * remain_h / 24 + fixed, 2),
            "always_on": round(hourly * 730 + fixed, 2),
        },
        "r2_gb": round(r2_gb, 3), "fx": _usd_krw(),
        "rates": {"vcpu_h": FARGATE_VCPU_H, "gb_h": FARGATE_GB_H, "ipv4_h": PUBLIC_IPV4_H,
                  "secret_month": SECRET_MONTH, "r2_gb_month": R2_GB_MONTH},
    }


def tail_logs(since_ms: int, which: str) -> dict:
    """since_ms 이후 로그(최대 200줄). which = backend|cloudflared|all."""
    if LOG_GROUP is None:
        return {"events": [], "next": since_ms}
    kw = {"logGroupName": LOG_GROUP, "startTime": since_ms, "limit": 200, "interleaved": True}
    if which in ("backend", "cloudflared"):
        kw["logStreamNamePrefix"] = "ecs/" if which == "backend" else "cloudflared/"
    evs = boto3.client("logs", region_name=REGION).filter_log_events(**kw)["events"]
    return {
        "events": [{"t": e["timestamp"], "src": e["logStreamName"].split("/")[0], "msg": e["message"][:2000]}
                   for e in evs],
        "next": (evs[-1]["timestamp"] + 1) if evs else since_ms,
    }


def set_role(user_id: str, role: str) -> dict:
    if role not in ("admin", "user"):
        raise ValueError("role 은 admin|user")
    user = storage.get_user(user_id)
    if user is None:
        raise ValueError("사용자 없음")
    if role == "user" and user.get("role") == "admin" and \
            sum(u.get("role") == "admin" for u in storage.list_users()) <= 1:
        raise ValueError("마지막 admin 은 회수할 수 없습니다")
    user["role"] = role
    storage.save_user(user_id, user)
    return {"user_id": user_id, "email": user.get("email"), "role": role}


def set_status(user_id: str, status: str) -> dict:
    """REQ-C12 — 승인(active)·차단(blocked). 값 검사는 auth_service 가 한다."""
    user = auth_service.set_user_status(user_id, status)
    return {"user_id": user_id, "email": user.get("email"), "status": status}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _run(self, fn):
        try:
            self._send(200, fn())
        except ValueError as e:
            self._send(400, {"error": str(e)})
        except Exception as e:  # 콘솔은 원인을 그대로 보여 주는 쪽이 낫다
            self._send(500, {"error": f"{type(e).__name__}: {e}"})

    def do_GET(self):
        path, _, query = self.path.partition("?")
        q = dict(p.split("=", 1) for p in query.split("&") if "=" in p)
        if path == "/":
            self._send(200, HTML.read_bytes(), "text/html; charset=utf-8")
        elif path == "/api/summary":
            self._run(summary)
        elif path == "/api/server":
            hours = int(q.get("hours", 6))
            self._run(lambda: server(max(1, min(hours, 24 * 14))))
        elif path == "/api/cost":
            self._run(cost)
        elif path == "/api/logs":
            since = int(q.get("since", 0)) or int((time.time() - 300) * 1000)   # 처음엔 최근 5분
            self._run(lambda: tail_logs(since, q.get("which", "backend")))
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        # 다른 사이트가 브라우저를 통해 localhost 로 쏘는 요청 차단 — 같은 오리진에서 온 것만
        if self.headers.get("Origin") not in (f"http://127.0.0.1:{PORT}", f"http://localhost:{PORT}"):
            return self._send(403, {"error": "origin"})
        if self.path not in ("/api/role", "/api/status"):
            return self._send(404, {"error": "not found"})
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        if self.path == "/api/status":
            return self._run(lambda: set_status(body.get("user_id", ""), body.get("status", "")))
        self._run(lambda: set_role(body.get("user_id", ""), body.get("role", "")))

    def log_message(self, fmt, *args):
        if self.command == "POST":
            sys.stderr.write(f"[{datetime.now():%H:%M:%S}] {self.command} {self.path}\n")


if __name__ == "__main__":
    print(f"운영 콘솔 [{ENV}] → http://127.0.0.1:{PORT}  (Ctrl+C 종료)")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
