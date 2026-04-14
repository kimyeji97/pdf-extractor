import { useEffect, useRef, useState } from "react";
import { getStatus } from "../api/client";

const POLL_INTERVAL_MS = 2000;

const STATUS_LABEL = {
  PENDING: "대기 중",
  PROCESSING: "처리 중",
  DONE: "완료",
  FAILED: "실패",
};

export default function StatusPoller({ jobId, onDone }) {
  const [status, setStatus] = useState("PENDING");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [extractedCount, setExtractedCount] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const data = await getStatus(jobId);
        setStatus(data.status);

        if (data.status === "DONE") {
          setDownloadUrl(data.download_url);
          setExtractedCount(data.extracted_count);
          onDone?.();
          clearInterval(timerRef.current);
        } else if (data.status === "FAILED") {
          setError(data.error || "알 수 없는 오류");
          clearInterval(timerRef.current);
        }
      } catch (e) {
        setError(e.message);
        clearInterval(timerRef.current);
      }
    };

    poll(); // 즉시 1회 호출
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => clearInterval(timerRef.current);
  }, [jobId]);

  if (!jobId) return null;

  return (
    <div className="status-poller">
      <p>
        상태: <strong>{STATUS_LABEL[status] ?? status}</strong>
      </p>

      {status === "PROCESSING" && (
        <div className="spinner" aria-label="처리 중" />
      )}

      {status === "DONE" && downloadUrl && (
        <div className="done-box">
          <p>{extractedCount}개 문항이 추출되었습니다.</p>
          <a href={downloadUrl} download="result.pdf" className="download-btn">
            결과 PDF 다운로드
          </a>
        </div>
      )}

      {status === "FAILED" && (
        <p className="error-msg">오류: {error}</p>
      )}
    </div>
  );
}
