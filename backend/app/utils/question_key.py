"""
자동 문항 식별 — 같은 쪽·같은 번호 안 순번 k (ADR-0006, REQ-B20)

B18 위치 병합 뒤로 한 쪽에 같은 번호가 공존한다(내신마스터 "유형 01" 제목 ↔ "1."). 목록 ID·썸네일 키·
제목 수정·삭제·PDF 생성이 **모두 이 모듈의 순서**로 k 를 매겨야 서로 같은 경계를 가리킨다.
k 순서는 (단, y) — 왼쪽 단 위→아래, 그다음 오른쪽 단. **k 가 없으면 0**(옛 ID·옛 요청·옛 저장 선택).
경계는 dict(캐시 원본)·QuestionBoundary 둘 다 받는다.
"""
from typing import Optional


def _get(b, name):
    return b.get(name) if isinstance(b, dict) else getattr(b, name)


def _order(b) -> tuple:
    return (_get(b, "col"), _get(b, "y_top"))


def ordinals(boundaries: list) -> list[int]:
    """boundaries 와 같은 순서로 각 경계의 k 를 돌려준다."""
    ks = [0] * len(boundaries)
    seen: dict[tuple, int] = {}
    for i in sorted(range(len(boundaries)), key=lambda i: (_get(boundaries[i], "page_index"), _order(boundaries[i]))):
        key = (_get(boundaries[i], "page_index"), _get(boundaries[i], "number"))
        ks[i] = seen.get(key, 0)
        seen[key] = ks[i] + 1
    return ks


def find_index(boundaries: list, page_index: int, number: int, k: int = 0) -> Optional[int]:
    """(쪽, 번호, k) 경계의 boundaries 안 인덱스. 없으면 None."""
    same = sorted(
        (i for i, b in enumerate(boundaries)
         if _get(b, "page_index") == page_index and _get(b, "number") == number),
        key=lambda i: _order(boundaries[i]),
    )
    return same[k] if 0 <= k < len(same) else None


def question_id(job_id: str, page_num: int, number: int, k: int) -> str:
    return f"{job_id}:{page_num}:{number}:{k}"


def k_of(qid: Optional[str]) -> int:
    """`question_id` 의 k. 옛 3자리 형식·없음·수동 문항이면 0."""
    parts = (qid or "").split(":")
    if len(parts) == 4 and parts[2] != "manual" and parts[3].isdigit():
        return int(parts[3])
    return 0


def normalize_id(qid: Optional[str]) -> Optional[str]:
    """옛 형식 `{job}:{쪽}:{번호}` → `…:0`. 새 형식·수동·None 은 그대로."""
    if not qid:
        return qid
    parts = qid.split(":")
    if len(parts) == 3 and parts[2].isdigit():
        return f"{qid}:0"
    return qid
