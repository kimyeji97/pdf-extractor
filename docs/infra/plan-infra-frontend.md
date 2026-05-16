# 프론트엔드 배포 Plan — Cloudflare Pages

## 주요 내용

- **선행 조건**: API Gateway 커스텀 도메인 구성 완료 (`api.dailystudy-workbook-dev.yejicraft-cf.com` 응답 확인)
- **Phase 1**: `npm run build` 로컬 빌드 확인 (`frontend/dist/` 생성 및 환경변수 사용 여부)
- **Phase 2**: Cloudflare Pages → GitHub 연결, `main` 브랜치 push 시 자동 빌드 트리거
- **Phase 3**: 빌드 설정 (루트 디렉토리 `frontend`, 출력 `dist`) + 환경변수 `VITE_API_BASE_URL` 설정
- **Phase 4**: 커스텀 도메인 `dailystudy-workbook-dev.yejicraft-cf.com` 연결 (같은 Cloudflare 계정 — DNS 자동 추가)
- **Phase 5**: HTTPS 접속, CORS 응답 헤더, E2E 기능(업로드→추출→문제집) 확인
- **브랜치 프리뷰**: `main` 외 브랜치 push 시 자동 프리뷰 URL 생성

---

> **버전**: 2.0 | **작성일**: 2026-05-16
> **관련 spec**: [spec-infra.md](spec-infra.md)
> **선행 조건**: 백엔드 ECS + Cloudflare Tunnel 구성 완료 (`dailystudy-workbook-api-dev.yejicraft-cf.com` 응답 확인)
> **목표**: React 프론트엔드를 Cloudflare Pages에 배포하고 커스텀 도메인을 연결한다.

---

## 전체 작업 순서

```
Phase 1: 로컬 빌드 확인
Phase 2: Cloudflare Pages 프로젝트 생성 (Git 연결)
Phase 3: 빌드 설정 및 환경변수 구성
Phase 4: 커스텀 도메인 연결
Phase 5: 배포 확인
```

---

## Phase 1 — 로컬 빌드 확인

배포 전 로컬에서 프로덕션 빌드가 정상 동작하는지 확인한다.

```bash
cd frontend

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 빌드 결과 로컬 미리보기
npm run preview
```

**확인 항목:**
- `frontend/dist/` 디렉토리 생성 여부
- 빌드 에러 없음
- API 호출이 `VITE_API_BASE_URL` 환경변수를 사용하는지 확인

---

## Phase 2 — Cloudflare Pages 프로젝트 생성

Cloudflare 대시보드 → Workers & Pages → Pages → 새 프로젝트 생성

### 2-1. Git 연결 방식 (권장)

**Git에 연결** 탭 선택 → GitHub 계정 연결 → 리포지토리 선택

| 항목 | 값 |
|------|-----|
| 리포지토리 | `pdf-extractor` |
| 프로덕션 브랜치 | `main` |

> `main` 브랜치 push 시 자동 빌드·배포가 트리거된다.

---

## Phase 3 — 빌드 설정 및 환경변수 구성

### 3-1. 빌드 설정

| 항목 | 값 |
|------|-----|
| 프레임워크 프리셋 | `Vite` (자동 감지되거나 직접 선택) |
| 빌드 명령 | `npm run build` |
| 빌드 출력 디렉토리 | `dist` |
| 루트 디렉토리 | `frontend` |

### 3-2. 환경변수 설정

**프로덕션 환경변수:**

| 키 | 값 |
|----|-----|
| `VITE_API_BASE_URL` | `https://dailystudy-workbook-api-dev.yejicraft-cf.com/api` |

> Cloudflare Pages → 설정 → 환경 변수 → 프로덕션에 추가.
> 프리뷰 배포에는 별도 dev API URL을 사용하거나 동일 URL을 사용한다.

### 3-3. 첫 배포 트리거

설정 완료 후 **저장 및 배포** 클릭 → 빌드 로그 확인.

```
빌드 완료 예상 시간: 1–3분
배포 URL 예시: https://pdf-extractor-xxxx.pages.dev
```

---

## Phase 4 — 커스텀 도메인 연결

### 4-1. Pages 커스텀 도메인 추가

Cloudflare Pages → 해당 프로젝트 → 커스텀 도메인 → 커스텀 도메인 설정

| 항목 | 값 |
|------|-----|
| 도메인 | `dailystudy-workbook-dev.yejicraft-cf.com` |

> 동일 Cloudflare 계정의 도메인이므로 DNS 레코드가 자동으로 추가된다.
> (CNAME `dailystudy-dev` → Cloudflare Pages 도메인, 프록시 ON)

### 4-2. DNS 전파 확인

```bash
dig dailystudy-workbook-dev.yejicraft-cf.com
# Cloudflare IP 응답 확인
```

---

## Phase 5 — 배포 확인

### 5-1. 기본 접속 확인

```
https://dailystudy-workbook-dev.yejicraft-cf.com
```

**확인 항목:**
- [ ] 페이지 정상 로드
- [ ] 브라우저 콘솔 에러 없음
- [ ] HTTPS 인증서 정상 (자물쇠 아이콘)

### 5-2. API 연동 확인

| 기능 | 확인 내용 |
|------|----------|
| 파일 목록 | 업로드된 PDF 목록이 표시됨 |
| PDF 업로드 | 파일 업로드 후 목록에 추가됨 |
| 문항 추출 | 추출 시작 → 상태 폴링 → 완료 표시 |
| 문제집 목록 | 생성된 문제집 이력이 표시됨 |

### 5-3. CORS 확인

브라우저 개발자 도구 → Network 탭에서 API 요청의 응답 헤더 확인:

```
Access-Control-Allow-Origin: https://dailystudy-workbook-dev.yejicraft-cf.com
```

> CORS 오류 발생 시 API Gateway CORS 설정의 허용 오리진을 확인한다.

---

## 완료 체크리스트

- [ ] 로컬 `npm run build` 에러 없음 확인
- [ ] Cloudflare Pages 프로젝트 생성 및 GitHub 연결
- [ ] 빌드 설정 (루트 디렉토리 `frontend`, 출력 `dist`)
- [ ] 환경변수 `VITE_API_BASE_URL` 설정
- [ ] 첫 배포 성공 확인 (빌드 로그)
- [ ] 커스텀 도메인 `dailystudy-workbook-dev.yejicraft-cf.com` 연결
- [ ] HTTPS 접속 확인
- [ ] API 연동 E2E 확인 (업로드 → 추출 → 문제집)

---

## 이후 배포 업데이트

`main` 브랜치에 push하면 자동으로 빌드·배포가 트리거된다.

```bash
git push origin main
# → Cloudflare Pages 자동 빌드 시작 (1–3분)
# → 완료 후 https://dailystudy-workbook-dev.yejicraft-cf.com 에 반영
```

**브랜치 프리뷰:**
`main` 외 브랜치 push 시 `https://{branch}.pdf-extractor-xxxx.pages.dev` 형태의 프리뷰 URL이 자동 생성된다.

---

## prod 환경 적용

dev 안정화 후 동일 절차로 진행. 차이점:

| 항목 | dev | prod |
|------|-----|------|
| 커스텀 도메인 | `dailystudy-workbook-dev.yejicraft-cf.com` | `dailystudy.yejicraft-cf.com` |
| `VITE_API_BASE_URL` | `https://dailystudy-workbook-api-dev.yejicraft-cf.com/api` | `https://api.dailystudy.yejicraft-cf.com` |
