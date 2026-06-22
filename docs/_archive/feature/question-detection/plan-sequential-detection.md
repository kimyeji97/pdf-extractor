# plan-sequential-detection — 연속 증분 패턴 기반 문항 번호 자동 감지

> **요구사항**: REQ-A (양식 무관 문항 자동 추출)
> **작성일**: 2026-04-19
> **관련 spec**: [spec.md](../spec.md)
> **변경 범위**: 백엔드 단독 (프론트엔드/ API 스키마 무변경)

---

## 1. 목표

현재 `detect_question_boundaries()`는 사전 정의된 11개의 정규식 패턴(`_Q_PATTERNS`)과 폰트 크기 임계값에 의존한다. 이 두 축에 동시에 부합하지 않는 번호는 감지에서 탈락한다.

본 설계는 **"페이지 내에서 같은 컬럼 위치에 1씩 증가하는 숫자가 반복되는 패턴"**을 추가 시그널로 사용해, 미리 정의하지 않은 번호 포맷과 본문 크기 수준의 작은 번호 폰트까지 포괄적으로 감지하는 것을 목표로 한다.

### 1.1 커버 확대 대상 포맷

| 포맷                          | 현재 감지 | 목표 (연속 체인)          |
| ----------------------------- | --------- | ------------------------- |
| `13.` `14.` `15.`             | O         | O                         |
| `①` `②` `③` (원문자 유니코드) | X         | O (정규화 후 정수 파싱)   |
| `(1)` `(2)` `(3)` (괄호)      | X         | O (괄호 제거 후 정수)     |
| `Q1` `Q2` `Q3` (영어 접두)    | X         | O (접두 제거 후 정수)     |
| 본문과 동일 폰트 크기         | X (필터) | O (체인 시그널로 필터 우회) |
| `1)`, `1:` 등 사소한 구두점   | 부분       | O                         |

### 1.2 비목표 (Out of Scope)

- 새로운 API 엔드포인트 / 프론트엔드 UI 변경 없음.
- `map_questions_to_regions()` 로직 변경 없음 — 감지된 `QuestionBoundary` 만 개선.
- OCR 기반 이미지형 번호 감지 (`detect_question_boundaries_from_text()` 레거시 경로)는 범위 밖.

---

## 2. 설계 개요

### 2.1 현재 흐름 vs 개선 흐름

```
[현재]
  pdfplumber words → 헤더/푸터 제거 → 폰트 임계값 필터 →
  정규식 패턴 매칭(_Q_PATTERNS) → QuestionBoundary 수집 → 중복 제거

[개선]
  pdfplumber words → 헤더/푸터 제거
    ├─ Path-1 (기존): 폰트 필터 + _Q_PATTERNS 매칭    → raw_regex
    └─ Path-2 (신규): 정수 후보 수집 + 연속 체인 탐색 → raw_chain
  raw_regex ∪ raw_chain → 신뢰도 병합 → 중복 제거 → QuestionBoundary
```

Path-1은 손대지 않는다. 기존 회귀 위험을 최소화하고 새 경로를 **보강(augmentation)**으로만 추가한다.

### 2.2 연속 증분 체인 알고리즘

한 페이지에서 감지된 정수 후보들의 집합 `C`에서, 다음 조건을 모두 만족하는 부분 수열 `S = [c₁, c₂, …, cₙ]` 을 찾는다.

1. **값의 단조 증가**: `cᵢ₊₁.num = cᵢ.num + 1`
2. **같은 컬럼 소속**: 모든 `cᵢ.col` 이 동일.
3. **x 좌표 일관성**: `max(cᵢ.x0) − min(cᵢ.x0) ≤ X_TOL` (예: 15pt).
4. **y 좌표 단조 증가**: `cᵢ₊₁.top > cᵢ.top − Y_SLACK` (문항은 위→아래로 등장).
5. **체인 길이 하한**: `n ≥ 2` (단일 숫자는 연도/페이지번호 오탐 가능).

여러 체인이 병립 가능하므로, 동적 계획으로 **각 페이지에서 가장 긴 체인(들)**을 뽑는다.

### 2.3 교차 페이지 연속성 검증

단일 페이지 체인은 단독으로는 신뢰도가 낮다. PDF 전체를 본 뒤 **체인이 페이지를 넘어 이어지는지** 확인해 신뢰도를 올린다.

```
Page N-1  [... 23, 24, 25, 26]
Page N      [27, 28, 29, 30]     ← 앞 체인의 마지막(26)+1=27로 시작 → 이어짐
Page N+1    [31, 32, 33]         ← 이어짐
```

`page_n.chain[0] == page_{n-1}.chain[-1] + 1` 이면 두 체인을 같은 `chain_family`로 묶는다. `chain_family` 길이가 늘수록 해당 체인 구성원의 오탐 확률이 낮아진다.

### 2.4 오탐 방지 전략

| 오탐 유형 | 방어 |
| --------- | ---- |
| 연도 (2023, 2024) | 단조 증가이나 체인 길이가 보통 ≤ 2 → 길이 하한 3 이상 또는 교차 페이지 검증으로 배제 |
| 페이지 번호 푸터 | 헤더/푸터 영역(상단 11%, 하단 9%)에서 이미 제외 |
| 본문 중 나열 (예: 표 "1, 2, 3") | x0 일관성 검사로 탈락 (표 셀은 x 위치가 흩어짐) |
| 수식 첨자 / 주석 번호 | 폰트 크기가 매우 작으면 `MIN_SIZE_HARD_FLOOR` 이하는 체인에서도 배제 |
| 체인 중간에 다른 숫자 끼어듦 | DP 기반 "longest increasing by 1" 으로만 채집하므로 자동 제외 |

### 2.5 기존 패턴과의 병합 정책

같은 `(page_index, col, y_top 근접)` 위치에 두 경로가 각기 번호를 감지했을 때:

| 상황 | 결정 |
| ---- | ---- |
| regex 번호 == chain 번호 | 둘 다 수용, 중복은 `_deduplicate_boundaries` 가 처리. confidence 가중치 상승. |
| regex 번호 ≠ chain 번호 (동일 좌표) | regex 우선. regex는 포맷이 일치해야 매칭되는 반면 체인은 오탐 여지가 있음. |
| 한쪽만 감지 | 그대로 수용. |
| 체인 only + 교차 페이지 검증 실패 + 길이 2 | 수용 안 함 (보수적). |
| 체인 only + 교차 페이지 검증 성공 | 수용. |

---

## 3. 데이터 구조 (신규)

`backend/app/utils/question_parser.py` 내부에 추가.

```python
@dataclass
class _NumberCandidate:
    """폰트 필터 이전 단계의 순수 정수 후보."""
    number: int
    page_index: int
    col: int
    x0: float
    top: float
    size: float
    source_text: str          # 원본 단어 ("(3)", "③" 등 — 디버깅용)

@dataclass
class _SequentialChain:
    """한 페이지·한 컬럼 내부의 연속 증분 체인."""
    page_index: int
    col: int
    members: list[_NumberCandidate]   # 오름차순 정렬

    @property
    def start(self) -> int: return self.members[0].number
    @property
    def end(self)   -> int: return self.members[-1].number
    @property
    def length(self) -> int: return len(self.members)

@dataclass
class _ChainFamily:
    """교차 페이지로 이어진 체인 묶음."""
    chains: list[_SequentialChain]    # page_index 오름차순
    total_length: int                 # ∑ chain.length
```

`QuestionBoundary` 구조는 변경하지 않는다. 하위 호환성을 위해 `confidence` 같은 필드는 추가하지 않고, 대신 내부 선정 로직에서만 사용한다.

---

## 4. 알고리즘 상세

### 4.1 정수 파싱 확장

기존 `_extract_question_number()`는 "정해진 포맷이 맞을 때만" 번호를 돌려준다. 신규 경로는 "포맷 무시하고 정수만 뽑되 유효 범위와 최소한의 맥락을 본다."

```python
# 1) 유니코드 원문자 → ASCII 정수
_CIRCLED = str.maketrans({
    "①":"1","②":"2","③":"3","④":"4","⑤":"5",
    "⑥":"6","⑦":"7","⑧":"8","⑨":"9","⑩":"10",
    # 11~20: ⑪~⑳  (multi-char → 별도 매핑)
})

_TOKEN_SANITIZE = re.compile(r"[\s\.\)\]\>:\-]+$")   # 뒤쪽 구두점 제거
_TOKEN_PREFIX   = re.compile(r"^[\[\(\<Q문제]+")       # 앞쪽 접두 제거
_INT_ONLY       = re.compile(r"^\d{1,3}$")

def _loose_extract_integer(text: str) -> Optional[int]:
    """포맷 무관하게 정수만 뽑는다. 유효 범위 밖이면 None."""
    t = text.strip().translate(_CIRCLED)
    t = _TOKEN_PREFIX.sub("", t)
    t = _TOKEN_SANITIZE.sub("", t)
    if not _INT_ONLY.match(t):
        return None
    n = int(t)
    return n if _Q_MIN <= n <= _Q_MAX else None
```

### 4.2 후보 수집

페이지 단어 목록에서 헤더/푸터 제거 후 모든 단어에 대해 `_loose_extract_integer` 를 적용. 폰트 크기는 **체인 탐색 자체에는 필터로 쓰지 않는다.** (체인 시그널로 폰트 필터를 우회하는 것이 목적이므로.)

단, 너무 작은 폰트(`size < MIN_SIZE_HARD_FLOOR`, 예: 6.0pt)는 수식 첨자/각주이므로 배제.

### 4.3 체인 탐색 (페이지 내)

같은 `(page_idx, col)` 내에서 `(top, x0)` 기준 정렬 후, "값이 1씩 증가하는 가장 긴 부분수열"을 찾는다. x0 일관성까지 함께 본다.

```python
def _extract_chains_in_column(
    cands: list[_NumberCandidate],
) -> list[_SequentialChain]:
    """
    동일 page_index + col 의 후보들을 top 오름차순으로 정렬한 뒤,
    값이 정확히 +1씩 증가하는 연속 구간들을 모두 수집한다.
    """
    if len(cands) < 2:
        return []
    sorted_c = sorted(cands, key=lambda c: (c.top, c.x0))

    chains: list[list[_NumberCandidate]] = []
    cur: list[_NumberCandidate] = [sorted_c[0]]

    for nxt in sorted_c[1:]:
        prev = cur[-1]
        same_col_x = abs(nxt.x0 - prev.x0) <= X_TOL        # 기본 15pt
        monotonic_y = nxt.top >= prev.top - Y_SLACK        # 기본 2pt
        incr_by_one = nxt.number == prev.number + 1

        if same_col_x and monotonic_y and incr_by_one:
            cur.append(nxt)
        else:
            if len(cur) >= 2:
                chains.append(cur)
            cur = [nxt]

    if len(cur) >= 2:
        chains.append(cur)
    return [_SequentialChain(
                page_index=m[0].page_index,
                col=m[0].col,
                members=m,
            ) for m in chains]
```

시간 복잡도: O(W log W) (정렬). PDF당 페이지 수 × 컬럼 수 × 후보 수이므로 현실적으로 부담 없음.

### 4.4 교차 페이지 결합

문서 전체에서 수집한 모든 `_SequentialChain` 을 `(page_index, col, start)` 로 정렬. 앞 체인의 `end + 1 == 다음 체인.start` 이고 컬럼이 동일/인접(0→1, 1→0 새 페이지)하면 한 family 로 묶는다.

```python
def _build_chain_families(
    chains: list[_SequentialChain],
) -> list[_ChainFamily]:
    """
    전체 체인을 교차 페이지로 이어붙여 family 를 구성.
    이어지는 조건: next.start == prev.end + 1
                  and next.page_index >= prev.page_index
    """
    ...
```

### 4.5 최종 Boundary 선정

```python
def _chain_to_boundary(
    c: _NumberCandidate,
    page_h: float,
    col_x_bounds: dict[int, tuple[float, float]],
) -> QuestionBoundary:
    cx0, cx1 = col_x_bounds[c.col]
    return QuestionBoundary(
        number=c.number, page_index=c.page_index,
        y_top=c.top, y_bottom=page_h,        # _fill_y_bottom 에서 확정
        col=c.col, col_x0=cx0, col_x1=cx1,
    )
```

**수용 규칙**:

1. `family.total_length ≥ 3` 이면 해당 family 의 모든 member 를 수용.
2. `family.total_length == 2` 인 경우 — regex 경로에서 같은 번호가 이미 감지됐다면 수용, 아니면 탈락 (보수적).
3. regex 경로에서 감지된 번호와 좌표가 유사(같은 페이지·같은 컬럼·|Δtop| ≤ 5pt)하면 regex 결과를 **유지**하고 체인 쪽은 버린다 (중복 제거 단계에서 동작).

---

## 5. 구현 변경점

### 5.1 변경/신규 파일

| 파일 | 변경 내용 |
| ---- | --------- |
| `backend/app/utils/question_parser.py` | `_loose_extract_integer`, `_collect_number_candidates`, `_extract_chains_in_column`, `_build_chain_families`, `_merge_with_regex_boundaries` 함수 추가. `detect_question_boundaries` 내부에 Path-2 호출 및 병합 단계 삽입. |
| `backend/app/utils/question_parser.py` | 상수 블록에 `X_TOL`, `Y_SLACK`, `MIN_SIZE_HARD_FLOOR`, `MIN_FAMILY_LENGTH_STRICT` 추가. |
| `backend/tests/test_question_parser.py` (신규 또는 확장) | 단위 테스트 케이스 추가 (§7). |
| `backend/app/services/boundary_cache_service.py` | 변경 없음 — 캐시 스키마는 `QuestionBoundary` 리스트 그대로이므로 영향 없음. 단, 기존 캐시 무효화가 필요하므로 **캐시 버전 키 증가** 필요 (`boundaries/{job_id}.v2.json`). |

### 5.2 상수 초안

```python
X_TOL                     = 15.0   # 같은 컬럼 x0 허용 편차 (pt)
Y_SLACK                   =  2.0   # 같은 라인 간주 허용치
MIN_SIZE_HARD_FLOOR       =  6.0   # 이보다 작은 폰트는 후보 제외 (각주/첨자)
MIN_FAMILY_LENGTH_STRICT  =  3     # family 단독 수용 최소 길이
MIN_CHAIN_LENGTH          =  2     # 페이지 내 체인 최소 길이
```

튜닝은 교재 샘플 셋(유형편·개념편·수능 기출)으로 회귀 평가 후 확정.

### 5.3 `detect_question_boundaries` 변경 요지 (pseudo-diff)

```python
def detect_question_boundaries(pdf_path: str) -> list[QuestionBoundary]:
    global_font_threshold = _compute_global_font_threshold(pdf_path)

    regex_boundaries: list[QuestionBoundary] = []
    all_candidates: list[_NumberCandidate]   = []   # (신규)

    with pdfplumber.open(pdf_path) as pdf:
        page_heights = [p.height for p in pdf.pages]
        for page_idx, page in enumerate(pdf.pages):
            words, col_x_bounds, content_words = _prepare_page(page)  # 기존 로직 추출

            # Path-1: 기존 regex 감지 (변경 없음)
            regex_boundaries.extend(
                _detect_via_regex(content_words, col_x_bounds, page_idx,
                                  page.height, global_font_threshold)
            )

            # Path-2: 정수 후보 수집 (신규)
            all_candidates.extend(
                _collect_number_candidates(content_words, col_x_bounds, page_idx)
            )

    # Path-2 체인 → family → Boundary
    chains   = _extract_chains_all(all_candidates)
    families = _build_chain_families(chains)
    chain_boundaries = _families_to_boundaries(families, page_heights,
                                               regex_hint=regex_boundaries)

    # 병합 & 후처리
    merged = _merge_with_regex_boundaries(regex_boundaries, chain_boundaries)
    _fill_y_bottom(merged, page_heights)
    unique = _deduplicate_boundaries(merged)
    return sorted(unique, key=lambda b: b.number)
```

`_prepare_page()` 는 기존 `detect_question_boundaries` 본문을 함수화하는 리팩터링. 동작 불변.

---

## 6. 경계 캐시 마이그레이션

`boundary_cache_service` 가 저장한 기존 결과는 Path-1 만 반영된 구형이다. 새 로직으로는 다른(더 많은) 번호가 감지될 수 있으므로 재계산이 필요하다.

전략: **키 버전 상승**

```
# 기존
local_storage/boundaries/{job_id}.json

# 신규
local_storage/boundaries/{job_id}.v2.json
```

- v2 키로 조회 → 없으면 새 로직으로 감지 후 v2 에 저장.
- 구형 파일은 삭제하지 않고 방치 (추후 정리 잡에서 일괄 제거 가능).
- 프론트엔드/ API 응답 스키마 변경 없음 → 클라이언트 영향 0.

---

## 7. 수용 조건 (Acceptance Criteria)

### 7.1 기능

- [ ] **원문자 감지**: `①②③④⑤` 로 번호가 표기된 샘플 PDF에서 1~5번이 모두 `QuestionBoundary` 로 반환된다.
- [ ] **괄호 포맷 감지**: `(1) (2) (3)` 포맷에서 1~3번이 모두 감지된다.
- [ ] **영어 접두 감지**: `Q1 Q2 Q3` 포맷에서 1~3번이 모두 감지된다.
- [ ] **본문 크기 번호 감지**: 폰트 크기 필터에서 탈락하던 본문 크기의 연속 번호가 체인 경로로 감지된다.
- [ ] **교차 페이지 연속성**: 한 체인이 여러 페이지에 걸쳐 있을 때, 모든 구성원이 감지된다.

### 7.2 회귀 (Regression)

- [ ] 기존 유형편 / 수능 기출 샘플 PDF 에서 **기존 감지 번호 집합이 축소되지 않는다** (superset).
- [ ] 다중 컬럼 문항의 컬럼(col=0/1) 배정이 기존과 동일하다.
- [ ] `map_questions_to_regions()` 결과가 기존 샘플에서 동일 CropRegion 을 반환한다.

### 7.3 오탐 방지

- [ ] 연도(`2023, 2024, 2025`)만 있는 페이지에서는 문항으로 잘못 감지되지 않는다.
- [ ] 본문 표 안의 `1, 2, 3, 4` 나열은 x0 일관성 검사로 탈락한다.
- [ ] 수식 첨자(`x₁, x₂, x₃` 로 렌더된 6pt 이하 숫자)는 감지되지 않는다.

### 7.4 성능

- [ ] 20페이지 PDF 기준 `detect_question_boundaries` 총 시간이 기존 대비 **+30% 이내**.
- [ ] 캐시 적중 시(두 번째 호출) 실행 시간은 변화 없음.

---

## 8. 테스트 계획

### 8.1 단위 테스트 (`backend/tests/test_question_parser.py`)

```python
def test_loose_extract_integer_circled():
    assert _loose_extract_integer("①") == 1
    assert _loose_extract_integer("⑩") == 10

def test_loose_extract_integer_paren():
    assert _loose_extract_integer("(3)") == 3

def test_loose_extract_integer_prefix():
    assert _loose_extract_integer("Q7")  == 7
    assert _loose_extract_integer("문제14.") == 14

def test_loose_extract_integer_rejects_year():
    assert _loose_extract_integer("2024") is None  # 범위 초과

def test_chain_extraction_happy_path():
    cands = [_mk_cand(n=i, top=i*100, x0=30, col=0, page=0) for i in [1,2,3,4]]
    chains = _extract_chains_in_column(cands)
    assert len(chains) == 1 and chains[0].length == 4

def test_chain_breaks_on_x_drift():
    cands = [_mk_cand(1, top=100, x0=30), _mk_cand(2, top=200, x0=80)]  # x 튐
    assert _extract_chains_in_column(cands) == []

def test_chain_ignores_non_increment():
    cands = [_mk_cand(1, 100, 30), _mk_cand(3, 200, 30)]  # 2가 빠짐
    assert _extract_chains_in_column(cands) == []
```

### 8.2 통합 테스트

- 3종 교재 샘플 PDF (`유형편`, `개념편`, `수능기출`) 각 1개 이상 → 기대 번호 목록 고정 후 `detect_question_boundaries` 결과 비교.
- 신규 커버 포맷 샘플 PDF (원문자/괄호/영어접두) 최소 1개씩 → 새 로직으로만 잡힘을 단언.

### 8.3 오탐 회귀 샘플

- TOC(목차)만 있는 페이지 → 문항 0건 유지.
- 표지 + 연도 표기 페이지 → 연도가 번호로 잡히지 않음을 단언.

---

## 9. 작업 순서 (Task Breakdown)

| # | 작업 | 레이어 | 우선순위 |
|---|------|--------|----------|
| 1 | `_loose_extract_integer` + 원문자 매핑 테이블 | Backend | P0 |
| 2 | `_NumberCandidate`, `_SequentialChain`, `_ChainFamily` 데이터 구조 | Backend | P0 |
| 3 | `_collect_number_candidates` — 후보 수집 (헤더/푸터·HARD_FLOOR 적용) | Backend | P0 |
| 4 | `_extract_chains_in_column` — 페이지 내 체인 추출 | Backend | P0 |
| 5 | `_build_chain_families` — 교차 페이지 결합 | Backend | P0 |
| 6 | `_families_to_boundaries` — family → Boundary, 수용 규칙 적용 | Backend | P0 |
| 7 | `_merge_with_regex_boundaries` — regex 결과와 병합 | Backend | P0 |
| 8 | `detect_question_boundaries` 리팩터(`_prepare_page` 추출) | Backend | P0 |
| 9 | 상수(`X_TOL`, `Y_SLACK`, ...) 튜닝 — 샘플 셋 회귀 | Backend | P1 |
| 10 | 경계 캐시 키 v2 승격 (`boundary_cache_service`) | Backend | P0 |
| 11 | 단위 테스트 (§8.1) | Backend | P0 |
| 12 | 통합 / 회귀 테스트 (§8.2 ~ §8.3) | Backend | P1 |

---

## 10. 위험 요소 및 완화

| 위험 | 영향 | 완화 |
| ---- | ---- | ---- |
| 기존 정상 감지 번호가 체인 경로에 의해 재정렬/덮어쓰여짐 | 회귀 | 병합 단계에서 **regex 우선**, 체인은 "추가"만 가능하도록 제한 |
| 오탐 증가로 문항 수가 과다 감지 | UX 악화 | family 길이 하한 + x0 일관성 + HARD_FLOOR 3중 방어 |
| 체인 탐색 O(W²) 위험 | 성능 | 정렬 후 순차 스캔 O(W log W) 로 구현 |
| 캐시 불일치 (구형 v1 이 재사용됨) | 잘못된 결과 표시 | 캐시 키 버전 승격으로 강제 재계산 |
| 특정 교재의 2열 레이아웃이 오히려 체인을 끊는다 | 커버 감소 | 체인 탐색은 `(page, col)` 단위이므로 컬럼 경계는 이미 고려됨. 단, `_detect_column_split` 실패 시 모든 후보가 한 컬럼으로 뭉침 — 기존 동작과 동일한 실패 모드 |

---

## 11. 향후 확장 여지 (비범위)

- **포맷 자체 학습**: 수집된 체인의 토큰 패턴(`source_text`)을 샘플로 모아 `_Q_PATTERNS` 를 자동 갱신하는 러닝 루프.
- **Vision LLM fallback**: 체인도 regex 도 감지 실패한 페이지만 VLM 으로 보내 번호 추출.
- **신뢰도(confidence) 노출**: `QuestionBoundary` 에 감지 경로(regex/chain/both)를 필드로 추가해 프론트에서 "자동 감지 확신 낮음" 표시.

위 항목은 본 plan 범위 밖이며 별도 요구사항 번호로 승급 시 처리한다.
