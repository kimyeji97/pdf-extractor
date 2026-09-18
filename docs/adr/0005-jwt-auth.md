# ADR-0005 · 인증은 세션 쿠키가 아니라 JWT(access+refresh)로 한다

> 상태: 채택 · 날짜: 2026-09-14 · 출처: [PLAN-27-login-registration](../plans/PLAN-27-login-registration.md)

## 맥락

REQ-27(로그인/회원가입) 착수 시점까지 인증·인가가 전무했고 CORS는 `*`로 전체 허용돼 있었다.
인증 방식을 정해야 나머지(보호 라우트·CORS 제한·프론트 토큰 처리)가 갈린다.

이 레포의 백엔드는 세션을 들고 있을 상태 저장소가 없다 — 스토리지는 로컬 파일시스템 또는
Cloudflare R2(파일 기반)뿐이고 Redis 같은 캐시·세션 스토어가 인프라에 없다. 운영도 ECS
Fargate 태스크를 `desired-count 0`으로 내렸다 올리는 패턴이라(비용 절감, 상시 운영 아님)
태스크가 살아있다는 보장이 약하다. 프론트(Cloudflare Workers 정적 자산)와 백엔드(API 도메인)는
서로 다른 도메인이라 쿠키 기반이면 cross-origin 쿠키(`SameSite=None; Secure` + CORS
`credentials`) 설정이 필요한데, 이번 REQ가 CORS 제한 자체도 처음 도입하는 단계라 그 위에
credentials 흐름까지 얹으면 복잡도가 커진다.

## 결정

**JWT(access 1시간 + refresh 7일, rolling refresh)를 택한다.** refresh 토큰은 프론트
`localStorage`에 저장하고 API 요청마다 `Authorization` 헤더로 부착한다. 서버는 세션 상태를
전혀 들고 있지 않는다.

## 기각한 안

- **세션 쿠키(서버 상태 보유)** — 세션을 저장할 인프라(Redis 등)가 이 레포에 아예 없어
  새 컴포넌트를 들여와야 한다. ECS `desired-count 0` 토글 운영과도 안 맞는다 — 세션이
  메모리에 있으면 태스크 재시작마다 전원 로그아웃된다. 프론트·백엔드가 다른 도메인이라
  cross-origin 쿠키 설정이 CORS 제한 작업과 겹쳐 이번 REQ 범위를 더 키운다.
  **재검토 조건**: ①다른 이유로 Redis 등 세션 스토어가 이미 인프라에 들어오는 시점,
  ②로그아웃 즉시 강제 무효화 요구가 커져 결국 서버 측 토큰 revocation 리스트를 둬야 하는
  시점 — 그 순간부터는 JWT의 무상태 이점이 사라지므로 세션 방식이 다시 경쟁력을 가진다.

## 결과

- **즉시 폐기(로그아웃 강제 무효화)가 안 된다** — rolling refresh로 최대 7일 슬라이딩 윈도우가
  남아, 탈취된 토큰은 별도 revocation 리스트 없이는 만료 전까지 유효하다.
- **`localStorage` 저장은 httpOnly 쿠키보다 XSS에 취약하다.** 이번 REQ 범위에서 CSP 등
  XSS 방어를 별도로 강화하지 않으므로, 그 위험은 그대로 남겨 둔 채 진행한다.
