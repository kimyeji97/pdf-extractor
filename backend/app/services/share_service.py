"""
분석 결과 공유 (REQ-28) — 역할 판정 + 공유 인덱스

역할은 owner > editor > viewer. admin 은 owner 로 본다(소유권 필터를 받지 않는 기존 규칙 그대로).
권한이 모자라면 **읽을 수 있는 사람에겐 403, 못 읽는 사람에겐 404**(존재를 숨긴다) — PLAN-28 § 결정.

공유는 job 상태 파일이 아니라 인덱스 파일 하나(`shares/index.json`)에 둔다. 상태 파일을 쓰는 곳은
읽어 둔 job 을 통째로 다시 쓰므로(재감지는 수십 초 뒤에) 거기 두면 그 사이 추가한 공유가 지워진다.
"""
import threading
from typing import Optional

from fastapi import HTTPException

from app.services import storage

OWNER, EDITOR, VIEWER = "owner", "editor", "viewer"
_RANK = {VIEWER: 1, EDITOR: 2, OWNER: 3}

# 인덱스 읽고-고치고-쓰기. ponytail: 프로세스 안 잠금 — 태스크·워커가 2개 이상이면 깨진다(PLAN-28 § 제약)
_index_lock = threading.Lock()


def role_of(user: dict, job, shares: Optional[dict] = None) -> Optional[str]:
    """이 사용자의 이 job 역할. 없으면 None. `shares` 를 넘기면 인덱스를 다시 읽지 않는다(목록용)."""
    if user.get("role") == "admin":
        return OWNER
    if job.owner_id is None:
        return None  # 소유자 없는 옛 레코드는 admin 만 — 공유가 있어도 그대로(계약 #32)
    if job.owner_id == user.get("user_id"):
        return OWNER
    entries = (storage.get_shares() if shares is None else shares).get(job.job_id, [])
    return next((e["role"] for e in entries if e["user_id"] == user.get("user_id")), None)


def ensure_role(user: dict, job, need: str) -> str:
    """`need` 이상이 아니면 막는다 — 못 읽으면 404, 읽을 수는 있으면 403. 통과하면 역할을 돌려준다."""
    role = role_of(user, job)
    if role is None:
        raise HTTPException(status_code=404, detail="찾을 수 없습니다.")
    if _RANK[role] < _RANK[need]:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    return role


def visible(user: dict, jobs: list) -> list:
    """목록·현황판 필터 — 소유했거나 공유받은 job 만. 인덱스는 한 번만 읽는다."""
    if user.get("role") == "admin":
        return jobs
    shares = storage.get_shares()
    return [j for j in jobs if role_of(user, j, shares) is not None]


def drop_job(job_id: str) -> None:
    """job 삭제 때 그 job 의 공유 항목을 지운다."""
    with _index_lock:
        data = storage.get_shares()
        if data.pop(job_id, None) is not None:
            storage.save_shares(data)


def shares_of(job_id: str) -> list:
    return storage.get_shares().get(job_id, [])


def put_share(job_id: str, user_id: str, role: str) -> None:
    """추가 또는 역할 변경 — 같은 사람은 한 항목만 둔다."""
    with _index_lock:
        data = storage.get_shares()
        entries = [e for e in data.get(job_id, []) if e["user_id"] != user_id]
        data[job_id] = entries + [{"user_id": user_id, "role": role}]
        storage.save_shares(data)


def update_share(job_id: str, user_id: str, role: str) -> bool:
    """이미 있는 항목의 역할만 바꾼다. 없으면 False — 확인과 쓰기를 한 잠금 안에서 해야 동시 해제가 되살아나지 않는다."""
    with _index_lock:
        data = storage.get_shares()
        entries = data.get(job_id, [])
        if not any(e["user_id"] == user_id for e in entries):
            return False
        data[job_id] = [{**e, "role": role} if e["user_id"] == user_id else e for e in entries]
        storage.save_shares(data)
        return True


def remove_share(job_id: str, user_id: str) -> bool:
    with _index_lock:
        data = storage.get_shares()
        entries = data.get(job_id, [])
        kept = [e for e in entries if e["user_id"] != user_id]
        if len(kept) == len(entries):
            return False
        if kept:
            data[job_id] = kept
        else:
            data.pop(job_id)
        storage.save_shares(data)
        return True
