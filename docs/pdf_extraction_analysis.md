# PDF 문항 추출 로직 분석

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `app/services/pdf_service.py` | 메인 오케스트레이터 (`extract_questions`, `extract_questions_v2`) |
| `app/services/question_parser.py` | 좌표 기반 경계 감지 핵심 로직 |
| `app/services/textract_service.py` | Tesseract OCR Fallback |

---

## 전체 추출 흐름

```
입력 PDF + 문항 번호 문자열 ("1,3,5-7")
  │
  ├─→ [Step 1] 요청 문항 파싱
  │   └─ "1,3,5-7" → [1, 3, 5, 6, 7]
  │
  ├─→ [Step 2] pdfplumber 좌표 기반 경계 감지
  │   ├─ 1패스: 글로벌 폰트 임계값 계산
  │   └─ 2패스: 페이지별 문항 번호 추출
  │
  ├─→ [Step 3] OCR Fallback (절반 이상 미감지 시)
  │   └─ Tesseract (200 DPI, kor+eng)
  │
  ├─→ [Step 4] 문항 번호 → CropRegion 매핑
  │   └─ 케이스 A~D 분기
  │
  └─→ [Step 5] PyMuPDF로 결과 PDF 빌드
      └─ 크롭 또는 전체 페이지 삽입
```

---

## Step 2 상세: pdfplumber 좌표 기반 감지

### 1패스 — 글로벌 폰트 임계값 계산 (`_compute_global_font_threshold`)

- 전체 PDF를 한 번 스캔
- 헤더(상단 11%) / 푸터(하단 9%) 제외
- 13pt 이상 폰트 중 가장 빈도 높은 크기의 **92%** 를 임계값으로 설정
- 목적: 문항 번호 폰트와 본문/답안 폰트 구분

### 2패스 — 페이지별 처리

```python
words = page.extract_words(
    keep_blank_chars=False,
    x_tolerance=3, y_tolerance=3,
    extra_attrs=["size"]   # 폰트 크기 포함
)
```

1. 헤더/푸터 영역 단어 제거
2. `_detect_column_split()` 으로 2단 레이아웃 자동 감지
3. 왼쪽 컬럼 → 오른쪽 컬럼 순으로 Y축 상→하 탐색
4. 폰트 크기 필터링 후 정규식으로 문항 번호 매칭

### 2단 레이아웃 감지 (`_detect_column_split`)

- 페이지 중앙 ±20% 구간에서 X히스토그램 최대 공백 탐색
- 공백이 page_width * 3% 미만 → 단단(1-column) 레이아웃
- 이상이면 공백 중간점을 컬럼 분할점으로 설정

### 문항 번호 패턴 (`_extract_question_number`)

```python
_Q_PATTERNS = [
    r"^(\d{1,3})$",              # "14"
    r"^(\d{1,3})\.$",            # "14."
    r"^\[(\d{1,3})\]$",          # "[14]"
    r"^<(\d{1,3})>$",            # "<14>"
    r"^문\s*(\d{1,3})[\..\s]",   # "문14." / "문 14 "
    r"^제\s*(\d{1,3})\s*문",     # "제14문"
    r"^(\d{1,3})번",             # "14번"
    r"^확인예제\s*(\d{1,3})",    # "확인예제3"
    r"^예제\s*(\d{1,3})",        # "예제3"
    r"^유제\s*(\d{1,3})",        # "유제3"
    r"^(\d{1,2})\s*\.",          # "14 ." (공백 허용)
]
```

유효 범위: 1~500 (오탐 방지)

### y_bottom 채우기 (`_fill_y_bottom`)

- 현재 문항의 끝 = 다음 문항의 `y_top`
- 마지막 문항은 페이지 높이를 `y_bottom` 으로 사용

### 중복 제거 (`_deduplicate_boundaries`)

같은 번호가 여러 페이지에 나타날 때:
1. **다중문항 페이지 우선** (같은 페이지에 2개 이상 문항 존재)
2. 동순위면 첫 등장 (페이지 순 → 컬럼 순 → Y 순)

---

## Step 3 상세: Tesseract OCR Fallback

**발동 조건:** `len(missing) > len(requested) / 2`

```python
# 각 페이지를 200 DPI 이미지로 변환
mat = fitz.Matrix(200/72, 200/72)
pix = page.get_pixmap(matrix=mat)
img = Image.open(io.BytesIO(pix.tobytes("png")))

# Tesseract OCR
text = pytesseract.image_to_string(
    img,
    lang="kor+eng",
    config="--psm 6 --oem 3"
)
```

- `--psm 6`: 단일 블록 텍스트 가정 (기출문제 레이아웃 최적)
- `--oem 3`: LSTM 엔진 (가장 정확)
- 200 DPI: A4 기준 ~1654×2339px, t2.micro(1GB) 내 안전

---

## Step 4 상세: CropRegion 매핑 케이스

| 케이스 | 상황 | 처리 |
|--------|------|------|
| A | 같은 페이지, 같은 컬럼 | Y 범위 클리핑만 |
| B | 같은 페이지, 다른 컬럼 | 현재 컬럼 잔여 + 다음 컬럼 초반 |
| C | 다음 문항이 다른 페이지 | 중간 페이지 전체 포함 |
| D | 마지막 문항 | 현재 컬럼 끝까지 |

---

## Step 5 상세: PyMuPDF PDF 빌드

```python
# 전체 페이지 → 텍스트·이미지·벡터 완전 보존
dst.insert_pdf(src, from_page=idx, to_page=idx)

# 부분 크롭 → 벡터 기반 클리핑 (선명, 빠름)
new_page.show_pdf_page(rect, src, pno=region.page_index, clip=clip_rect)

# 최대 압축 저장
dst.save(output_path, garbage=4, deflate=True)
```

---

## 핵심 데이터 구조

```python
@dataclass
class QuestionBoundary:
    number: int        # 문항 번호
    page_index: int    # 0-based 페이지
    y_top: float       # 시작 Y 좌표
    y_bottom: float    # 끝 Y 좌표
    col: int           # 0=왼쪽, 1=오른쪽
    col_x0: float      # 컬럼 왼쪽 경계
    col_x1: float      # 컬럼 오른쪽 경계

@dataclass
class CropRegion:
    page_index: int
    x0: float          # left
    y0: float          # top
    x1: float          # right
    y1: float          # bottom

@dataclass
class SourcedCropRegion:   # v2 복수 소스용
    src_path: str
    page_index: int
    x0: float
    y0: float
    x1: float
    y1: float
```

---

## 주요 설정값

| 설정 | 값 | 설명 |
|------|-----|------|
| 헤더 제외 | 상단 11% | 섹션 타이틀 헤더 제외 |
| 푸터 제외 | 하단 9% | 페이지 번호, 주석 제외 |
| 폰트 필터링 | 지배적 크기의 92% | 1~2pt 크기 차이 허용 |
| 컬럼 간격 임계값 | page_width * 3% | 이상이면 2단 레이아웃 |
| OCR 발동 임계값 | 절반 이상 누락 | > len(requested)/2 개 미감지 |
| Tesseract DPI | 200 | 권장 150 이상 |
| 전체 페이지 허용 오차 | ±6pt | 크롭 좌표가 페이지 경계에 가까울 때 |

---

## API 흐름

### 단일 PDF 추출 (`POST /api/extract`)

```
Client → POST /api/extract { job_id, question_numbers }
  └─ 백그라운드: _process_extraction()
     ├─ status → PROCESSING
     ├─ extract_questions() 실행
     ├─ result.pdf 생성 및 업로드
     └─ status → DONE / FAILED
```

### 복수 PDF 추출 (`POST /api/extract-v2`)

```
Client → POST /api/extract-v2 { selections: [...] }
  └─ extract_questions_v2()
     ├─ job_id별 PDF 다운로드 (중복 방지 캐시)
     ├─ job_id별 경계 데이터 확보 (캐시 우선)
     ├─ selections → SourcedCropRegion 변환
     └─ _build_pdf_from_multi_sources() → 결과 PDF
```
