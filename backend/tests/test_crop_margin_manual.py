"""
REQ-B13 Phase 1 — 수동 문항에는 여백을 더하지 않는다 (소스 스캔)

검증 계약: docs/plans/PLAN-B13-crop-margin-uniform.md `## 검증 계약`
케이스: B13-11

수동 문항은 `storage.get_manual_questions()` 에서 좌표를 읽어 그대로 쓰고
`question_parser` 를 **아예 타지 않는다** — 즉 지금은 구조적으로 이미 분리돼 있다.
그래서 파서 쪽 테스트로는 이 계약을 검증할 수 없다.

⚠️ **진짜 위험은 다른 곳에 있다.** 구현자가 여유 10pt 를 파서가 아니라
`extract_questions_v2` 의 `all_regions` 조립 지점 — **자동·수동이 합류하는 유일한 곳** —
에 넣으면 수동 문항도 함께 밀린다. 사용자가 드래그한 영역이 곧 의도인데 그게 바뀐다.
그 배선을 소스 스캔으로 고정한다(REQ-29 29-13~15, REQ-30 30-19 와 같은 방식).

`extract_questions_v2` 는 이 레포에 렌더 무대가 없다 — 직접 테스트한 선례가 없고
(`test_notification_hooks.py` 도 함수 전체를 monkeypatch 로 갈아치운다) PDF·스토리지가
모두 필요하다. 소스 스캔이 이 배선을 덮는 현실적인 수단이다.
"""
import re


def _extract_questions_v2_body() -> str:
    """`extract_questions_v2` 함수 본문만 잘라낸다 — 다음 top-level `def` 전까지."""
    with open("app/services/pdf_service.py", encoding="utf-8") as f:
        code = f.read()

    start = code.index("def extract_questions_v2(")
    rest = code[start:]
    m = re.search(r"\ndef \w", rest[1:])
    end = m.start() + 1 if m else len(rest)
    return rest[:end]


def test_B13_11_수동_문항_분기는_좌표를_그대로_쓴다():
    """근거: PLAN § 제약 — "**수동 문항에는 적용하지 않는다.**"

    수동 분기는 저장된 region 을 **가공 없이** SourcedCropRegion 에 넣어야 한다.
    여기에 여유를 더하면 사용자가 드래그한 영역이 아닌 것이 크롭된다.
    """
    body = _extract_questions_v2_body()

    assert 'x0=r["x0"], y0=r["y0"], x1=r["x1"], y1=r["y1"],' in body
