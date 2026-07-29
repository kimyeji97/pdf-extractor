const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// ── API 로딩 상태 (전역 딤 처리용) ─────────────────────────
let _activeCount = 0;
let _onLoadingChange = null;

export function setLoadingCallback(fn) {
  _onLoadingChange = fn;
}

function _setLoading(delta) {
  _activeCount = Math.max(0, _activeCount + delta);
  _onLoadingChange?.(_activeCount > 0);
}

// ── GET 요청 중복 방지 (REQ-P02-03) ────────────────────────
// 리렌더·동시 마운트로 같은 GET이 겹치면 진행 중인 fetch Promise를 공유한다.
// Response.clone()으로 반환해 여러 호출자가 각자 독립적으로 res.json()을 호출할 수 있게 한다.
const _inflightGets = new Map();

async function apiFetch(url, options) {
  const method = (options?.method || "GET").toUpperCase();
  if (method !== "GET") {
    _setLoading(+1);
    try {
      return await fetch(url, options);
    } finally {
      _setLoading(-1);
    }
  }

  if (_inflightGets.has(url)) {
    const res = await _inflightGets.get(url);
    return res.clone();
  }

  _setLoading(+1);
  const promise = fetch(url, options).finally(() => _setLoading(-1));
  _inflightGets.set(url, promise);
  try {
    const res = await promise;
    return res.clone();
  } finally {
    _inflightGets.delete(url);
  }
}

/**
 * POST /api/upload
 * @param {string} [filename]
 * @param {{ workbook_name?: string, workbook_types?: string[] }} [meta]
 */
export async function requestUploadUrl(filename, meta = {}) {
  const res = await apiFetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: filename || null, ...meta }),
  });
  if (!res.ok) throw new Error("업로드 URL 요청 실패");
  return res.json(); // { job_id, upload_url }
}

/**
 * GET /api/jobs
 * 업로드된 파일 목록 반환 (페이지네이션 + 서버 검색, REQ-P03-03)
 * job_type은 백엔드 JobType enum 값이라 대문자여야 한다 (소문자는 422).
 * @param {{ jobType?: "SOURCE"|"EXPORT", skip?: number, limit?: number,
 *           name?: string, types?: string }} [opts]
 */
/**
 * 요약 통계 (REQ-D07 2안 통계 카드).
 *
 * 목록 API가 페이지네이션되므로 프론트에서 합계를 낼 수 없어 서버가 전체를 세서 준다.
 * @returns {Promise<{source_count:number, question_count:number, workbook_count:number}>}
 */
export async function getStats() {
  const res = await apiFetch(`${BASE_URL}/stats`);
  if (!res.ok) throw new Error("통계 조회 실패");
  return res.json();
}

export async function listJobs(opts = {}) {
  const { jobType = "SOURCE", skip = 0, limit = 20, name = "", types = "" } = opts;
  const qs = new URLSearchParams({ job_type: jobType, skip: String(skip), limit: String(limit) });
  if (name.trim()) qs.set("name", name.trim());
  if (types.trim()) qs.set("types", types.trim());

  const res = await apiFetch(`${BASE_URL}/jobs?${qs}`);
  if (!res.ok) throw new Error("파일 목록 조회 실패");
  return res.json(); // { items: [...], total, skip, limit }
}

/**
 * GET /api/jobs/{jobId}
 * 단일 job 상세 정보 반환 (boundaries_status, total_question_count 포함)
 * 재감지 완료 폴링 시 사용
 */
export async function getJobInfo(jobId) {
  const res = await fetch(`${BASE_URL}/jobs/${jobId}`);
  if (!res.ok) throw new Error("job 정보 조회 실패");
  return res.json();
  // { job_id, filename, status, boundaries_status, total_question_count, ... }
}

/**
 * GET /api/jobs/{jobId}/pages
 * 페이지 목록 + 썸네일 URL 반환
 * 썸네일 이미지는 <img src={page.thumbnail_url} /> 로 직접 사용
 */
export async function getPages(jobId) {
  const res = await apiFetch(`${BASE_URL}/jobs/${jobId}/pages`);
  if (!res.ok) throw new Error("페이지 목록 조회 실패");
  return res.json(); // { job_id, page_count, pages: [{page_num, thumbnail_url, width, height}] }
}

/**
 * PDF 업로드
 *
 * R2 모드  : presigned URL로 PUT → 완료 후 /api/upload/notify 호출
 * 로컬 모드 : /api/upload/direct 로 multipart POST (notify 불필요)
 *            upload_url 에 "upload/direct" 가 포함되면 로컬로 판단
 */
export async function uploadPdf(uploadUrl, file, jobId) {
  const isLocal = uploadUrl.includes("upload/direct");

  if (isLocal) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(uploadUrl, { method: "POST", body: form });
    if (!res.ok) throw new Error("로컬 업로드 실패");
  } else {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": "application/pdf" },
    });
    if (!res.ok) throw new Error("R2 업로드 실패");
    await notifyUploadComplete(jobId);
  }
}

/**
 * POST /api/upload/notify
 * R2 업로드 완료 후 백엔드에 알려 문항 경계 감지를 시작한다.
 */
export async function notifyUploadComplete(jobId) {
  const res = await apiFetch(`${BASE_URL}/upload/notify?job_id=${jobId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("업로드 완료 알림 실패");
  return res.json();
}

/**
 * POST /api/extract
 */
export async function startExtract(jobId, questionNumbers) {
  const res = await apiFetch(`${BASE_URL}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, question_numbers: questionNumbers }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "추출 요청 실패");
  }
  return res.json();
}

/**
 * GET /api/status/{jobId}
 * 내보내기 작업 상태 조회 (extract-v2 폴링용)
 */
export async function getStatus(jobId) {
  const res = await fetch(`${BASE_URL}/status/${jobId}`);
  if (!res.ok) throw new Error("상태 조회 실패");
  return res.json();
}

/**
 * GET /api/jobs/{jobId}/pages/{pageNum}/questions
 * 해당 페이지의 감지된 문항 목록 반환
 */
export async function getPageQuestions(jobId, pageNum) {
  const res = await apiFetch(`${BASE_URL}/jobs/${jobId}/pages/${pageNum}/questions`);
  if (!res.ok) throw new Error("문항 목록 조회 실패");
  return res.json();
  // { job_id, page_num, questions: [{question_num, question_id, thumbnail_url, bbox, col}] }
}

/**
 * GET /api/jobs/{jobId}/questions
 * 전체 페이지 문항 일괄 조회 (REQ-P01)
 */
export async function getAllQuestions(jobId) {
  const res = await apiFetch(`${BASE_URL}/jobs/${jobId}/questions`);
  if (!res.ok) throw new Error("전체 문항 조회 실패");
  return res.json();
  // { job_id, total_count, pages: [{ page_num, questions: [...] }] }
}

/**
 * POST /api/jobs/{jobId}/refresh
 * 전체 문서 재감지 요청 (비동기).
 * 즉시 { job_id, boundaries_status: "PROCESSING" } 를 반환.
 * 완료 여부는 getJobInfo(jobId).boundaries_status 를 폴링하여 확인.
 */
export async function refreshJobQuestions(jobId) {
  const res = await apiFetch(`${BASE_URL}/jobs/${jobId}/refresh`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("문항 재감지 요청 실패");
  return res.json();
  // { job_id, boundaries_status: "PROCESSING", message }
}

/**
 * POST /api/extract-v2
 * @param {Array<{
 *   jobId: string,
 *   pageNum: number,
 *   questionNum?: number,
 *   manualId?: string,
 *   customRegion?: {x0, y0, x1, y1},
 *   label?: string,
 * }>} selections
 * @param {string} layout - 레이아웃: "2단" | "4단" | "6단" (기본 "2단")
 */
export async function startExtractV2(selections, layout = "2단", coverId = null) {
  const body = {
    layout,
    ...(coverId ? { cover_id: coverId } : {}),
    selections: selections.map((s) => {
      const item = { job_id: s.jobId, page_num: s.pageNum };
      if (s.questionId != null)   item.question_id   = s.questionId;
      if (s.questionNum != null)  item.question_num  = s.questionNum;
      if (s.manualId != null)     item.manual_id     = s.manualId;
      if (s.customRegion != null) item.custom_region = s.customRegion;
      if (s.label != null)        item.label         = s.label;
      return item;
    }),
  };
  const res = await apiFetch(`${BASE_URL}/extract-v2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "추출 요청 실패");
  }
  return res.json(); // { job_id, message }
}


// ━━━ v3 신규 API 함수 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/jobs/{jobId}/pages/{pageNum}/questions/manual
 * 수동 추가 문항 저장 (REQ-13)
 * @param {string} jobId
 * @param {number} pageNum
 * @param {{ title: string, region: {x0, y0, x1, y1} }} param
 */
export async function addManualQuestion(jobId, pageNum, { title, region }) {
  const res = await apiFetch(
    `${BASE_URL}/jobs/${jobId}/pages/${pageNum}/questions/manual`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, region }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "수동 문항 추가 실패");
  }
  return res.json(); // ManualQuestion
}

/**
 * PATCH /api/jobs/{jobId}/pages/{pageNum}/questions/{questionNum}
 * 자동 감지 문항 타이틀 수정 (REQ-12)
 */
export async function updateQuestionTitle(jobId, pageNum, questionNum, title) {
  const res = await apiFetch(
    `${BASE_URL}/jobs/${jobId}/pages/${pageNum}/questions/${questionNum}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }
  );
  if (!res.ok) throw new Error("타이틀 수정 실패");
  return res.json();
}

/**
 * PATCH /api/jobs/{jobId}/pages/{pageNum}/questions/manual/{manualId}
 * 수동 추가 문항 타이틀 수정 (REQ-12)
 */
export async function updateManualQuestionTitle(jobId, pageNum, manualId, title) {
  const res = await apiFetch(
    `${BASE_URL}/jobs/${jobId}/pages/${pageNum}/questions/manual/${manualId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }
  );
  if (!res.ok) throw new Error("수동 문항 타이틀 수정 실패");
  return res.json();
}

/**
 * DELETE /api/jobs/{jobId}/pages/{pageNum}/questions/{questionNum}
 * 자동 감지 문항 삭제 (REQ-14)
 */
export async function deleteQuestion(jobId, pageNum, questionNum) {
  const res = await apiFetch(
    `${BASE_URL}/jobs/${jobId}/pages/${pageNum}/questions/${questionNum}`,
    { method: "DELETE" }
  );
  if (!res.ok && res.status !== 204) throw new Error("문항 삭제 실패");
}

/**
 * DELETE /api/jobs/{jobId}/pages/{pageNum}/questions/manual/{manualId}
 * 수동 추가 문항 삭제 (REQ-14)
 */
export async function deleteManualQuestion(jobId, pageNum, manualId) {
  const res = await apiFetch(
    `${BASE_URL}/jobs/${jobId}/pages/${pageNum}/questions/manual/${manualId}`,
    { method: "DELETE" }
  );
  if (!res.ok && res.status !== 204) throw new Error("수동 문항 삭제 실패");
}

/**
 * POST /api/jobs/{jobId}/pages/{pageNum}/questions/bulk-delete
 * 자동/수동 문항을 한 번에 삭제 (REQ-B06)
 * 단건 DELETE 동시 호출의 경쟁 상태를 피하기 위해 캐시별 1회 갱신으로 처리한다.
 */
export async function bulkDeleteQuestions(jobId, pageNum, questionNums = [], manualIds = []) {
  const res = await apiFetch(
    `${BASE_URL}/jobs/${jobId}/pages/${pageNum}/questions/bulk-delete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_nums: questionNums, manual_ids: manualIds }),
    }
  );
  if (!res.ok) throw new Error("문항 삭제 실패");
  return res.json();
}

/**
 * GET /api/workbooks
 * 생성된 문제집 이력 목록 (REQ-21 / 페이지네이션 REQ-P03-03)
 * 목록 응답은 selections를 제외한 요약(WorkbookSummary)이다.
 * @param {{ skip?: number, limit?: number, name?: string }} [opts]
 */
export async function getWorkbooks(opts = {}) {
  const { skip = 0, limit = 20, name = "" } = opts;
  const qs = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (name.trim()) qs.set("name", name.trim());

  const res = await apiFetch(`${BASE_URL}/workbooks?${qs}`);
  if (!res.ok) throw new Error("문제집 이력 조회 실패");
  return res.json(); // { items: [...], total, skip, limit }
}

/**
 * GET /api/workbooks/{workbookId}
 * 문제집 메타데이터 단건 조회 (REQ-20 편집 복원)
 */
export async function getWorkbook(workbookId) {
  const res = await apiFetch(`${BASE_URL}/workbooks/${workbookId}`);
  if (!res.ok) throw new Error("문제집 조회 실패");
  return res.json(); // WorkbookMeta
}

/**
 * DELETE /api/jobs/{jobId}
 * 업로드한 문제집(원본 PDF)과 연관 저장물 전체 삭제 — 되돌릴 수 없음
 */
export async function deleteJob(jobId) {
  const res = await apiFetch(`${BASE_URL}/jobs/${jobId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("문제집 삭제 실패");
}

/**
 * DELETE /api/workbooks/{workbookId}
 * 생성된 문제집과 결과 PDF 삭제 (REQ-C08) — 되돌릴 수 없음
 */
export async function deleteWorkbook(workbookId) {
  const res = await apiFetch(`${BASE_URL}/workbooks/${workbookId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("문제집 삭제 실패");
}

/**
 * PATCH /api/jobs/{jobId}
 * job의 문제집 이름/유형 수정
 * @param {string} jobId
 * @param {{ workbook_name?: string, workbook_types?: string[] }} meta
 */
export async function updateJobMeta(jobId, meta) {
  const res = await apiFetch(`${BASE_URL}/jobs/${jobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meta),
  });
  if (!res.ok) throw new Error("메타데이터 수정 실패");
  return res.json();
}

/**
 * POST /api/workbooks
 * 문제집 메타데이터 저장 (extract-v2 완료 후 호출)
 * @param {object} meta - WorkbookMeta 형식
 */
export async function createWorkbookMeta(meta) {
  const res = await apiFetch(`${BASE_URL}/workbooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meta),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "문제집 저장 실패");
  }
  return res.json(); // WorkbookMeta
}

// ── 표지 이미지 API ────────────────────────────────────────

/**
 * POST /api/covers
 * 표지 이미지 업로드
 */
export async function uploadCover(file, name = "") {
  const form = new FormData();
  form.append("file", file);
  form.append("name", name);
  const res = await fetch(`${BASE_URL}/covers`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "표지 업로드 실패");
  }
  return res.json(); // { cover_id, name, thumbnail_url, created_at }
}

/**
 * GET /api/covers
 * 표지 목록 조회
 */
export async function listCovers() {
  const res = await apiFetch(`${BASE_URL}/covers`);
  if (!res.ok) throw new Error("표지 목록 조회 실패");
  return res.json(); // { covers: [...] }
}

/**
 * DELETE /api/covers/{coverId}
 */
export async function deleteCover(coverId) {
  const res = await apiFetch(`${BASE_URL}/covers/${coverId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("표지 삭제 실패");
  return res.json();
}
