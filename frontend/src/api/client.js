const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * POST /api/upload
 * presigned URL(또는 로컬 direct upload URL)과 job_id 반환
 * @param {string} [filename] - 원본 파일명 (선택)
 */
export async function requestUploadUrl(filename) {
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: filename || null }),
  });
  if (!res.ok) throw new Error("업로드 URL 요청 실패");
  return res.json(); // { job_id, upload_url }
}

/**
 * GET /api/jobs
 * 업로드된 파일 목록 반환
 */
export async function listJobs() {
  const res = await fetch(`${BASE_URL}/jobs`);
  if (!res.ok) throw new Error("파일 목록 조회 실패");
  return res.json(); // { source_jobs: [...], export_jobs: [...] }
}

/**
 * GET /api/jobs/{jobId}/pages
 * 페이지 목록 + 썸네일 URL 반환
 * 썸네일 이미지는 <img src={page.thumbnail_url} /> 로 직접 사용
 */
export async function getPages(jobId) {
  const res = await fetch(`${BASE_URL}/jobs/${jobId}/pages`);
  if (!res.ok) throw new Error("페이지 목록 조회 실패");
  return res.json(); // { job_id, page_count, pages: [{page_num, thumbnail_url, width, height}] }
}

/**
 * PDF 업로드
 *
 * S3 모드  : presigned URL로 PUT (Content-Type: application/pdf)
 * 로컬 모드 : /api/upload/direct 로 multipart POST
 *            upload_url 에 "upload/direct" 가 포함되면 로컬로 판단
 */
export async function uploadPdf(uploadUrl, file) {
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
    if (!res.ok) throw new Error("S3 업로드 실패");
  }
}

/**
 * POST /api/extract
 */
export async function startExtract(jobId, questionNumbers) {
  const res = await fetch(`${BASE_URL}/extract`, {
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
  const res = await fetch(`${BASE_URL}/jobs/${jobId}/pages/${pageNum}/questions`);
  if (!res.ok) throw new Error("문항 목록 조회 실패");
  return res.json();
  // { job_id, page_num, questions: [{question_num, question_id, thumbnail_url, bbox, col}] }
}

/**
 * POST /api/extract-v2
 * @param {Array<{jobId: string, pageNum: number, questionNum: number}>} selections
 */
export async function startExtractV2(selections) {
  const body = {
    selections: selections.map((s) => ({
      job_id: s.jobId,
      page_num: s.pageNum,
      question_num: s.questionNum,
    })),
  };
  const res = await fetch(`${BASE_URL}/extract-v2`, {
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
