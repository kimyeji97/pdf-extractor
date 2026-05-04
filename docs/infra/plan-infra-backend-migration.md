# 백엔드 마이그레이션 Plan — Java 전환 + DB 구성

## 주요 내용

- **원칙**: Java 전환과 DB 전환을 동시에 진행 (Python에서 먼저 DB 전환 시 이중 작업 발생)
- **Phase 1**: DynamoDB 테이블 3개 설계/생성 (jobs, workbooks, files) — 온디맨드 모드, 개인 서비스 수준 무료
- **Phase 2**: Java 기술 스택 선택 (Spring Boot 3.x, Java 21, SnapStart, DynamoDB Enhanced Client)
- **Phase 3**: Python 라우터 → Java 이전 범위 — browse/upload/workbook/cover. **extract는 Python 유지**
- **Phase 4**: 추출↔관리 서버 통신 — DynamoDB 공유로 자연 해결. 장기적으로 SQS 전환 검토
- **Phase 5**: Java api Lambda 이미지 교체 배포 + SnapStart 활성화 (콜드 스타트 10초 → 1초 미만)
- **Phase 6**: extractor Lambda(Python) 상태 저장을 R2 → DynamoDB로 교체
- **Phase 7–8**: R2 JSON → DynamoDB 마이그레이션 스크립트 실행 → R2 JSON 파일 정리

---

> **버전**: 1.0 | **작성일**: 2026-05-04
> **관련 spec**: [spec-infra.md](spec-infra.md)
> **선행 조건**: [plan-infra-backend-extractor.md](plan-infra-backend-extractor.md), [plan-infra-backend-api.md](plan-infra-backend-api.md) 완료
> **시점**: 취업 후 본격 진행 예정

---

## 개요

현재 Python FastAPI 기반 서버를 아래 구조로 전환한다.

| 서버 | 현재 | 전환 후 |
|------|------|---------|
| 추출 서버 | Python FastAPI Lambda | **Python 유지** (PDF 처리 특성상) |
| 관리 서버 | Python FastAPI Lambda | **Java Spring Boot Lambda** |
| 데이터 저장 | R2 JSON 파일 | **DynamoDB** (상태/메타데이터) + R2 (파일) |

**Java 마이그레이션과 DB 전환은 동시에 진행한다.**
Python에서 먼저 DB로 전환하면, Java 이전 시 이중 작업이 발생한다.

---

## 전체 작업 순서

```
Phase 1: DynamoDB 테이블 설계 및 생성
Phase 2: Java Spring Boot 프로젝트 구성
Phase 3: 관리 서버 Java 구현 (workbook / upload / browse)
Phase 4: 추출 서버 ↔ 관리 서버 통신 방식 확정 및 구현
Phase 5: Java api Lambda 배포 (이미지 교체)
Phase 6: 추출 서버 DynamoDB 연동 (상태 저장 R2 → DynamoDB)
Phase 7: R2 JSON 데이터 DynamoDB 마이그레이션
Phase 8: R2 JSON 파일 정리
```

---

## Phase 1 — DynamoDB 테이블 설계 및 생성

**무료 티어**: 25GB 스토리지, 읽기/쓰기 25 unit — 개인 서비스 수준에서 사실상 무료.

### 테이블 구성 (안)

| 테이블명 | Partition Key | Sort Key | 용도 |
|---------|--------------|----------|------|
| `pdf-extractor-jobs-dev` | `job_id` (S) | — | 추출 작업 상태 |
| `pdf-extractor-workbooks-dev` | `workbook_id` (S) | — | 문제집 메타데이터 |
| `pdf-extractor-files-dev` | `file_id` (S) | — | 업로드 파일 목록 |

> 테이블 설계는 Java 구현 시 실제 액세스 패턴을 확인한 후 확정한다.

AWS 콘솔 → DynamoDB → 테이블 생성

| 항목 | 값 |
|------|-----|
| 용량 모드 | **온디맨드** (초기. 트래픽 예측 어려운 경우) 또는 프로비저닝 1/1 (비용 최소화) |

---

## Phase 2 — Java Spring Boot 프로젝트 구성

### 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Spring Boot 3.x |
| Java 버전 | Java 21 (SnapStart 지원, 가상 스레드) |
| Lambda 어댑터 | AWS Lambda Web Adapter 또는 `aws-serverless-java-container` |
| DynamoDB 클라이언트 | AWS SDK v2 DynamoDB Enhanced Client |
| 빌드 도구 | Gradle (또는 Maven) |

### Lambda SnapStart 설정 (콜드 스타트 단축)

```yaml
# serverless.yml 또는 Lambda 콘솔 설정
SnapStart:
  ApplyOn: PublishedVersions
```

> SnapStart 활성화 시 JVM 콜드 스타트 ~10초 → 1초 미만으로 단축.
> Java 21 런타임 + Container Image Lambda에서 사용 가능.

---

## Phase 3 — 관리 서버 Java 구현

현재 Python 라우터 대응 Java 구현 범위:

| Python 라우터 | Java 구현 대상 |
|--------------|---------------|
| `routers/browse.py` | 파일 목록 조회 API |
| `routers/upload.py` | PDF 업로드 API (R2 업로드 유지) |
| `routers/workbook.py` | 문제집 CRUD API |
| `routers/cover.py` | 표지 관련 API |

**추출 라우터는 Java 이전 대상 아님:**

| Python 라우터 | 처리 |
|--------------|------|
| `routers/extract.py` | Python 추출 서버 유지 |

---

## Phase 4 — 추출 서버 ↔ 관리 서버 통신 방식

현재 추출 작업 흐름:
```
프론트엔드 → POST /api/extract (api Lambda)
           → extractor Lambda 비동기 호출
           → GET /api/status/{job_id} 폴링
```

Java 전환 후에도 동일한 흐름을 유지한다. DB 전환으로 상태 공유가 DynamoDB 기반이 되므로
별도 통신 인터페이스 추가 없이 자연스럽게 해결된다.

| 방식 | 현재 | 전환 후 |
|------|------|---------|
| 상태 저장 | R2 JSON | DynamoDB |
| 추출 호출 | Lambda 비동기 invoke | Lambda 비동기 invoke (유지) |
| 상태 조회 | R2 JSON 읽기 | DynamoDB 읽기 |

> 트래픽 증가 시 Lambda invoke → SQS 트리거 방식으로 전환 검토.

---

## Phase 5 — Java api Lambda 배포

### 5-1. Container Image 빌드

```bash
# Java 프로젝트 빌드
cd backend-java
./gradlew bootBuildImage  # 또는 docker build

docker buildx build \
  --platform linux/amd64 \
  -t {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-api:latest \
  .

docker push {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-api:latest
```

### 5-2. Lambda 이미지 업데이트

```bash
aws lambda update-function-code \
  --function-name pdf-extractor-api-dev \
  --image-uri {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-api:latest \
  --region ap-northeast-2
```

### 5-3. Lambda SnapStart 활성화

AWS 콘솔 → Lambda → `pdf-extractor-api-dev` → 구성 → 일반 구성

| 항목 | 값 |
|------|-----|
| SnapStart | **PublishedVersions** |
| 메모리 | 512 MB → 필요시 조정 |
| 타임아웃 | 30초 유지 |

> API Gateway, IAM, Secrets Manager, Cloudflare DNS 변경 없음.

---

## Phase 6 — 추출 서버 DynamoDB 연동

extractor Lambda(Python)의 상태 저장을 R2 JSON → DynamoDB로 전환한다.

**변경 범위:**

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| job 상태 저장 | `R2: {prefix}/status/{job_id}.json` | `DynamoDB: pdf-extractor-jobs-dev` |
| job 상태 조회 | R2 JSON 읽기 | DynamoDB GetItem |

**extractor Lambda 환경변수 추가:**

| 키 | 값 |
|----|-----|
| `DYNAMODB_TABLE_JOBS` | `pdf-extractor-jobs-dev` |
| `AWS_REGION` | `ap-northeast-2` |

**IAM 역할에 DynamoDB 권한 추가:**

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem"
  ],
  "Resource": "arn:aws:dynamodb:ap-northeast-2:{AWS_ACCOUNT_ID}:table/pdf-extractor-jobs-dev"
}
```

---

## Phase 7 — R2 JSON 데이터 DynamoDB 마이그레이션

기존 R2에 저장된 workbook / status JSON 파일을 DynamoDB로 이전한다.

```python
# 마이그레이션 스크립트 (일회성 실행)
import boto3
import json

s3 = boto3.client('s3', ...)  # R2 엔드포인트
dynamodb = boto3.resource('dynamodb', region_name='ap-northeast-2')

# workbooks
objects = s3.list_objects_v2(Bucket=BUCKET, Prefix='dev/workbooks/')
table = dynamodb.Table('pdf-extractor-workbooks-dev')
for obj in objects.get('Contents', []):
    body = s3.get_object(Bucket=BUCKET, Key=obj['Key'])['Body'].read()
    item = json.loads(body)
    table.put_item(Item=item)
```

> 마이그레이션 완료 후 R2 JSON 파일은 일정 기간 백업으로 보관 후 삭제.

---

## Phase 8 — R2 JSON 파일 정리

DynamoDB 전환 및 검증 완료 후:

- `{prefix}/status/` 경로 JSON 파일 삭제
- `{prefix}/workbooks/` 경로 JSON 파일 삭제
- R2는 이후 원본 PDF + 생성 PDF 파일 보관 전용으로만 사용

---

## 완료 체크리스트

- [ ] DynamoDB 테이블 3개 생성 (jobs, workbooks, files)
- [ ] Java Spring Boot 프로젝트 초기 구성
- [ ] 관리 서버 Java 구현 (browse / upload / workbook / cover)
- [ ] 추출 서버 DynamoDB 연동 (Python)
- [ ] Java api Lambda 이미지 빌드 및 ECR 푸시
- [ ] Lambda 이미지 업데이트 및 SnapStart 활성화
- [ ] R2 JSON → DynamoDB 마이그레이션 스크립트 실행
- [ ] E2E 동작 확인
- [ ] R2 JSON 파일 정리

---

## prod 환경 적용

dev 안정화 후 동일 절차로 진행. 차이점:

| 항목 | dev | prod |
|------|-----|------|
| DynamoDB 테이블 | `*-dev` | `*-prod` |
| Lambda 함수명 | `*-dev` | `*-prod` |
| R2_ROOT_PREFIX | `dev` | `prod` |
| Secrets Manager | `pdf-extractor/dev` | `pdf-extractor/prod` |
| Lambda 예약 동시성 | 미설정 | 필요시 설정 |
