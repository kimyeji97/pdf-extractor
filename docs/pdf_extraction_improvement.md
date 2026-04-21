# PDF 문항 추출 개선 분석

> 기존 로직 상세: [pdf_extraction_analysis.md](./pdf_extraction_analysis.md)

---

## 1. 현재 문항 추출 방식

### 동작 흐름

```
1패스: _compute_global_font_threshold()
  - 전체 PDF를 pdfplumber로 스캔
  - 헤더(상단 11%) / 푸터(하단 9%) 제외
  - "문항 번호처럼 보이는 단어" 중 13pt 이상의 최빈 폰트 크기 × 0.92 = 임계값

2패스: detect_question_boundaries()
  - PDF를 다시 열어 페이지별로 단어 + 좌표 + 폰트 크기 추출
  - 헤더/푸터 제거 → 컬럼 감지 → 폰트 필터링 → 정규식 매칭
  - y_bottom 보정 (다음 문항의 y_top)
  - 중복 제거 (다중문항 페이지 우선)

Fallback: Tesseract OCR (절반 이상 누락 시)
  - 전체 페이지 → 200 DPI 이미지 변환
  - kor+eng OCR → 텍스트 기반 경계 감지 (좌표 없음, 페이지 단위)
```

### 문항 위치를 찾는 기준

| 기준 | 설명 |
|------|------|
| **폰트 크기** | 지배적 폰트 크기의 92% 이상인 단어만 후보로 허용 |
| **정규식 패턴** | 11개 패턴 (숫자 단독, `14.`, `[14]`, `문14.`, `예제3` 등) |
| **유효 범위** | 1~500 (오탐 방지) |
| **위치** | 헤더/푸터 영역 제외 |
| **컬럼** | X좌표 히스토그램으로 1단/2단 자동 감지 |

---

## 2. 성능 이슈

### 정상 경로 (OCR 없음)

| 단계 | 시간 추정 (50페이지, 10MB PDF) |
|------|------|
| 1패스 pdfplumber open + extract_words (전 페이지) | 1~3초 |
| 2패스 pdfplumber open + extract_words (전 페이지) | 1~3초 |
| PyMuPDF 크롭 + PDF 빌드 | 0.5~2초 |
| **합계** | **약 3~8초** ✅ |

→ 정상 경로는 5분 제한 이내 충분히 가능.

### 위험 경로: OCR Fallback

| 단계 | 시간 추정 |
|------|------|
| 페이지 → 200 DPI 이미지 변환 | ~0.5초/페이지 |
| Tesseract OCR `kor+eng` (`--psm 6 --oem 3`) | **2~10초/페이지** |
| 50페이지 전체 처리 합계 | **100~500초 = 2~8분** ⚠️ |

**결론: OCR Fallback이 발동되면 10MB/50페이지 기준 최대 8분 이상 소요 → 5분 초과 위험.**

### 추가 비효율

| 항목 | 설명 |
|------|------|
| **PDF 2회 open** | `_compute_global_font_threshold`와 `detect_question_boundaries`가 각각 pdfplumber로 열어 전 페이지 스캔 |
| **extra_attrs=["size"]** | 폰트 정보 추출이 기본 추출보다 느림 |
| **OCR 전 페이지 처리** | 이미 감지된 페이지까지 재처리 |

---

## 3. 새 양식 대응 문제

### 현재 한계

- **정규식 11개 패턴에 종속** → 새 양식이 기존 패턴에 맞지 않으면 추출률 0%
- **폰트 크기 임계값 의존** → 문항 번호와 본문이 같은 폰트 크기인 양식은 오탐/미탐
- **헤더/푸터 비율 하드코딩** (11%/9%) → 비율이 다른 양식이면 누락
- 매 신규 양식마다 개발자가 패턴을 수동 등록해야 함

---

## 4. 개선 방향 및 구현 내용

### 4-A. 단일 패스 통합 (성능 개선)

`_compute_global_font_threshold`와 `detect_question_boundaries`를 **1번의 pdfplumber open**으로 합쳐 전 페이지를 한 번만 순회한다.

```python
# 변경 전: 2번 open × 전 페이지
threshold = _compute_global_font_threshold(path)   # open 1
boundaries = detect_question_boundaries(path)       # open 2 (내부서 재호출)

# 변경 후: 1번 open으로 threshold 계산 + 경계 감지 동시 처리
boundaries = detect_question_boundaries(path)       # 단일 패스로 통합
```

**예상 효과:** 정상 경로 처리 시간 약 30~40% 단축.

---

### 4-B. 연속 증가 수열 기반 형식-독립 감지 (핵심 개선)

**"같은 양식(prefix+suffix)으로 +1씩 증가하는 숫자 수열 → 문항 번호로 간주"**

새로운 `detect_question_boundaries_adaptive()` 함수로 구현.

#### 알고리즘

```
1. 모든 단어에서 (prefix, number, suffix) 분해 시도
   예) "문14." → prefix="문", number=14, suffix="."
       "확인예제3" → prefix="확인예제", number=3, suffix=""
       "14" → prefix="", number=14, suffix=""

2. (prefix, suffix, 폰트 클러스터) 키로 그룹핑

3. 그룹 내 페이지·컬럼·Y 순 정렬 후 연속 정수 수열 탐색
   - 3개 이상 연속 정수(n, n+1, n+2 ...)가 있으면 유효 수열로 판정

4. 가장 긴 수열을 문항 경계로 채택
```

#### 정규식 방식 vs 수열 방식 비교

| 항목 | 정규식 방식 | 수열 방식 |
|------|------------|----------|
| 새 양식 대응 | 패턴 추가 개발 필요 | 자동 적응 |
| 오탐 방지 | 유효 범위(1~500) | 연속성 검증으로 강화 |
| 처리 속도 | 빠름 | 약간 느림 (그룹핑 추가) |
| 복잡 양식 | 사전 등록된 것만 처리 | 임의 prefix 허용 |

---

### 4-C. OCR 대상 페이지 제한 (성능 개선)

OCR fallback 발동 시 **전 페이지 대신 미감지 구간 페이지만** 처리.

```python
# 변경 전: 전 페이지 OCR (50페이지 전부)
pages_text = _pdf_to_tesseract_texts(pdf_path)

# 변경 후: 누락 문항이 있을 법한 페이지 범위만
ocr_pages = _estimate_missing_page_ranges(detected, missing, total_pages)
pages_text = _pdf_to_tesseract_texts(pdf_path, page_indices=ocr_pages)
```

`_estimate_missing_page_ranges()`: 감지된 문항의 앞뒤 페이지 위치 기준으로 누락 구간을 추정하고 앞뒤 2페이지 여유를 더해 반환.

**예상 효과:** OCR 처리 페이지 수 50~80% 감소 → OCR 시간 대폭 단축.

---

## 5. 감지 파이프라인 (변경 후)

```
정규식 기반 (단일 패스)
  └→ 절반 이상 누락 시: 연속 증가 수열 기반 (adaptive)
       └→ 여전히 절반 이상 누락 시: OCR (미감지 구간 페이지만)
```

---

## 6. 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/utils/question_parser.py` | 단일 패스 통합, `detect_question_boundaries_adaptive()` 추가 |
| `app/services/pdf_service.py` | 3단계 파이프라인 연결, `_estimate_missing_page_ranges()` 추가 |
| `app/services/textract_service.py` | `page_indices` 파라미터 추가 (부분 페이지 OCR 지원) |
