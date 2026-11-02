"""
웨이커 (REQ-E03 Phase 3) — 유휴 스케일인으로 꺼진 ECS 서비스를 깨우는 Lambda (Function URL, 무인증).

- 운영 구간은 확장 대상의 현재 `MaxCapacity ≥ 1` 로 판정한다. `on` 예약이 max 1 로 열고 `off` 가 max 0 으로 닫는다(Q8).
  밖이면 403. 그래서 아무나 불러도 최악은 운영 구간 내내 켜져 있는 것이다(Q5·Q12, 쿨다운 없음).
- 이미 desired ≥ 1 이면 다시 부르지 않고 202.
- 환경변수 `WAKE_RESOURCE_ID` = `service/<cluster>/<service>`.
- 백엔드 이미지 밖에서 돈다. Lambda 런타임에 있는 boto3 와 stdlib 만 쓴다.
"""
import json
import os

import boto3


def _response(status: int, state: str) -> dict:
    return {"statusCode": status, "headers": {"Content-Type": "application/json"}, "body": json.dumps({"status": state})}


def wake(ecs, autoscaling, resource_id: str) -> dict:
    targets = autoscaling.describe_scalable_targets(
        ServiceNamespace="ecs",
        ResourceIds=[resource_id],
        ScalableDimension="ecs:service:DesiredCount",
    )["ScalableTargets"]
    if not targets or targets[0].get("MaxCapacity", 0) < 1:
        return _response(403, "closed")

    _, cluster, service = resource_id.split("/", 2)
    services = ecs.describe_services(cluster=cluster, services=[service])["services"]
    if services and services[0].get("desiredCount", 0) >= 1:
        return _response(202, "running")

    ecs.update_service(cluster=cluster, service=service, desiredCount=1)
    return _response(202, "starting")


def lambda_handler(event, context):
    return wake(boto3.client("ecs"), boto3.client("application-autoscaling"), os.environ["WAKE_RESOURCE_ID"])
