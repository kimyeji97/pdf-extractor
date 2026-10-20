/**
 * 분석 결과 역할 판정 (REQ-28) — 백엔드 `my_role`(owner | editor | viewer)로 컨트롤을 가른다.
 *
 * `my_role`이 없으면(옛 응답) 소유자로 본다 — 공유 전에는 자기 것만 보였다.
 * 화면은 버튼을 숨길 뿐이고 막는 건 서버다(뷰어 쓰기 403).
 */
const roleOf = (job) => job?.my_role ?? "owner";

export const ROLE_LABEL = { owner: "소유자", editor: "편집자", viewer: "뷰어" };

/** 문항·메타를 고칠 수 있나 (편집자 이상) */
export const canEdit = (job) => roleOf(job) !== "viewer";

/** 재감지·삭제·공유 관리를 할 수 있나 (소유자만) */
export const isOwner = (job) => roleOf(job) === "owner";
