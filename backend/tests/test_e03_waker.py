"""
REQ-E03 Phase 3 — 웨이커 (꺼진 prod 를 깨우는 Lambda)

검증 계약: docs/plans/PLAN-E03-prod-idle-scale-to-zero.md `## 검증 계약` (E03-19 ~ E03-23)

- 운영 구간은 확장 대상의 현재 `MaxCapacity ≥ 1` 로 판정한다(Q8: on~off 동안만 max 가 1).
- 운영 구간 밖이면 거절(403). 쿨다운은 없다. 이미 desired ≥ 1 이면 다시 부르지 않고 202(Q12).

Lambda 코드는 백엔드 이미지 밖(`scripts/waker/`)에 있어 파일 경로로 불러온다. 실제 AWS 는 부르지 않는다.
모듈은 케이스 안에서 불러온다 — 아직 없을 때 수집 에러로 파일 전체가 죽지 않고 케이스마다 실패하게.
"""
import importlib.util
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_WAKER = _ROOT / "scripts" / "waker" / "lambda_function.py"
RESOURCE = "service/pdf-extractor-cluster/pdf-extractor-backend-prod-svc"


def _waker():
    spec = importlib.util.spec_from_file_location("e03_waker", _WAKER)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class _FakeAutoscaling:
    def __init__(self, max_capacity):
        self.max_capacity = max_capacity  # None 이면 확장 대상 없음
        self.calls = []

    def describe_scalable_targets(self, **kwargs):
        self.calls.append(kwargs)
        if self.max_capacity is None:
            return {"ScalableTargets": []}
        return {"ScalableTargets": [{"ResourceId": RESOURCE, "MinCapacity": 0, "MaxCapacity": self.max_capacity}]}


class _FakeEcs:
    def __init__(self, desired):
        self.desired = desired
        self.updates = []

    def describe_services(self, **kwargs):
        return {"services": [{"serviceName": kwargs["services"][0], "desiredCount": self.desired}]}

    def update_service(self, **kwargs):
        self.updates.append(kwargs)
        return {"service": {"desiredCount": kwargs.get("desiredCount")}}


def test_E03_19_open_window_wakes_service():
    ecs = _FakeEcs(desired=0)
    res = _waker().wake(ecs, _FakeAutoscaling(max_capacity=1), RESOURCE)
    assert (res["statusCode"], ecs.updates) == (
        202,
        [{"cluster": "pdf-extractor-cluster", "service": "pdf-extractor-backend-prod-svc", "desiredCount": 1}],
    )


def test_E03_20_closed_window_is_rejected():
    ecs = _FakeEcs(desired=0)
    res = _waker().wake(ecs, _FakeAutoscaling(max_capacity=0), RESOURCE)
    assert (res["statusCode"], ecs.updates) == (403, [])


def test_E03_21_missing_scalable_target_is_rejected():
    ecs = _FakeEcs(desired=0)
    res = _waker().wake(ecs, _FakeAutoscaling(max_capacity=None), RESOURCE)
    assert (res["statusCode"], ecs.updates) == (403, [])


def test_E03_22_already_running_is_not_called_again():
    ecs = _FakeEcs(desired=1)
    res = _waker().wake(ecs, _FakeAutoscaling(max_capacity=1), RESOURCE)
    assert (res["statusCode"], ecs.updates) == (202, [])


def test_E03_23_handler_uses_wake_resource_id(monkeypatch):
    mod = _waker()
    ecs, autoscaling = _FakeEcs(desired=0), _FakeAutoscaling(max_capacity=1)
    clients = {"ecs": ecs, "application-autoscaling": autoscaling}
    monkeypatch.setattr(mod.boto3, "client", lambda name, **kw: clients[name])
    monkeypatch.setenv("WAKE_RESOURCE_ID", "service/c1/s1")

    mod.lambda_handler({}, None)

    assert (autoscaling.calls[0]["ResourceIds"], ecs.updates[0]["cluster"], ecs.updates[0]["service"]) == (
        ["service/c1/s1"],
        "c1",
        "s1",
    )
