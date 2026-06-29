/**
 * PDF 미리보기 패널 (REQ-F06)
 *
 * 실제 PDF를 렌더링하여 미리보기를 제공한다.
 * 기능: 확대/축소, 페이지 번호 입력 이동, 스크롤 기반 페이지 탐색
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const SCALE_MIN = 0.5;
const SCALE_MAX = 3.0;
const SCALE_STEP = 0.25;

export default function PdfPreviewPanel({ pdfUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageInput, setPageInput] = useState("1");

  const containerRef = useRef(null);
  const pageRefs = useRef([]);

  // ── PDF 로드 완료 ────────────────────────────────────────
  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
    setCurrentPage(1);
    setPageInput("1");
    setLoading(false);
    setError("");
    pageRefs.current = Array(n).fill(null);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    setLoading(false);
    setError("PDF를 불러올 수 없습니다.");
    console.error("PDF load error:", err);
  }, []);

  // ── IntersectionObserver: 스크롤 시 현재 페이지 추적 ────
  useEffect(() => {
    if (!numPages) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let visiblePage = currentPage;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const idx = pageRefs.current.indexOf(entry.target);
            if (idx >= 0) visiblePage = idx + 1;
          }
        });
        if (visiblePage !== currentPage) {
          setCurrentPage(visiblePage);
          setPageInput(String(visiblePage));
        }
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages, scale, currentPage]);

  // ── 페이지 이동 ──────────────────────────────────────────
  const scrollToPage = useCallback((pageNum) => {
    const el = pageRefs.current[pageNum - 1];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handlePageInputKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const n = parseInt(pageInput, 10);
    if (!isNaN(n) && n >= 1 && n <= numPages) {
      setCurrentPage(n);
      scrollToPage(n);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputBlur = () => {
    const n = parseInt(pageInput, 10);
    if (isNaN(n) || n < 1 || n > numPages) {
      setPageInput(String(currentPage));
    }
  };

  const goPrev = () => {
    if (currentPage > 1) {
      const p = currentPage - 1;
      setCurrentPage(p);
      setPageInput(String(p));
      scrollToPage(p);
    }
  };

  const goNext = () => {
    if (currentPage < numPages) {
      const p = currentPage + 1;
      setCurrentPage(p);
      setPageInput(String(p));
      scrollToPage(p);
    }
  };

  // ── 줌 ───────────────────────────────────────────────────
  const zoomIn = () => setScale((s) => Math.min(SCALE_MAX, +(s + SCALE_STEP).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(SCALE_MIN, +(s - SCALE_STEP).toFixed(2)));

  if (!pdfUrl) {
    return (
      <div className="pdf-empty">
        <div className="pdf-empty-icon">📄</div>
        <p>PDF URL을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      {/* 툴바 */}
      {numPages && (
        <div className="pdf-toolbar">
          <div className="pdf-toolbar-group">
            <button className="pdf-toolbar-btn" onClick={zoomOut} disabled={scale <= SCALE_MIN} title="축소">
              −
            </button>
            <span className="pdf-toolbar-scale">{Math.round(scale * 100)}%</span>
            <button className="pdf-toolbar-btn" onClick={zoomIn} disabled={scale >= SCALE_MAX} title="확대">
              +
            </button>
          </div>

          <div className="pdf-toolbar-divider" />

          <div className="pdf-toolbar-group">
            <button className="pdf-toolbar-btn" onClick={goPrev} disabled={currentPage <= 1} title="이전 페이지">
              ◀
            </button>
            <input
              className="pdf-page-input"
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageInputKeyDown}
              onBlur={handlePageInputBlur}
            />
            <span className="pdf-toolbar-page-total">/ {numPages}</span>
            <button className="pdf-toolbar-btn" onClick={goNext} disabled={currentPage >= numPages} title="다음 페이지">
              ▶
            </button>
          </div>
        </div>
      )}

      {/* PDF 페이지 스크롤 영역 */}
      <div className="pdf-scroll-container" ref={containerRef}>
        {loading && (
          <div className="pdf-loading">PDF 로딩 중...</div>
        )}
        {error && (
          <div className="pdf-error">{error}</div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
        >
          {numPages &&
            Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                className="pdf-page-wrapper"
                ref={(el) => { pageRefs.current[i] = el; }}
              >
                <Page
                  pageNumber={i + 1}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
        </Document>
      </div>
    </div>
  );
}
