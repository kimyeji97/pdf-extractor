/**
 * PDF 미리보기 패널 (REQ-F06, REQ-F07 확장)
 *
 * 실제 PDF를 렌더링하여 미리보기를 제공한다.
 * 기능: 확대/축소, 페이지 번호 입력 이동, 스크롤 기반 페이지 탐색
 *
 * REQ-F07 확장 (모두 optional — 생성 이력 등 기존 소비처는 무변경 동작):
 *   - onPageChange(pageNum):        현재 페이지 변경 통지 (1-based)
 *   - renderPageOverlay(pageNum, {scale, pageSize}):
 *       각 페이지 래퍼(.pdf-page-wrapper, position:relative) 안에 렌더할
 *       오버레이 노드 반환. pageSize는 PDF pt 기준 {width, height}.
 *       CSS px ↔ PDF pt 변환: pt = px / scale, px = pt * scale
 *   - ref.scrollToPage(pageNum):    외부에서 페이지 이동 (1-based)
 *
 * ⚠️ 소비처 계약: 부모가 display:flex; flexDirection:column; minHeight:0 를
 *    제공해야 내부 스크롤이 동작한다 (REQ-B05).
 */
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
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

const PdfPreviewPanel = forwardRef(function PdfPreviewPanel(
  { pdfUrl, onPageChange, renderPageOverlay },
  ref
) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageInput, setPageInput] = useState("1");
  // 페이지별 원본 크기 (PDF pt, scale=1 기준) — 오버레이 좌표 변환용
  const [pageSizes, setPageSizes] = useState({});
  // 가상화(REQ-P02-01): 뷰포트 근처에 들어온 적 있는 페이지만 실제 <Page> 렌더.
  // 한 번 렌더된 페이지는 계속 유지(다시 스크롤해 지나갈 때 재마운트 방지).
  const [renderedPages, setRenderedPages] = useState(() => new Set([1]));

  const containerRef = useRef(null);
  const pageRefs = useRef([]);

  // ── 현재 페이지 변경 통지 (REQ-F07) ─────────────────────
  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  });
  useEffect(() => {
    if (numPages) onPageChangeRef.current?.(currentPage);
  }, [currentPage, numPages]);

  // ── PDF 로드 완료 ────────────────────────────────────────
  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
    setCurrentPage(1);
    setPageInput("1");
    setLoading(false);
    setError("");
    setPageSizes({});
    setRenderedPages(new Set([1]));
    pageRefs.current = Array(n).fill(null);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    setLoading(false);
    setError("PDF를 불러올 수 없습니다.");
    console.error("PDF load error:", err);
  }, []);

  const onPageLoadSuccess = useCallback((page) => {
    // originalWidth/Height = scale 1 기준 = PDF pt
    setPageSizes((prev) => {
      const cur = prev[page.pageNumber];
      if (cur && cur.width === page.originalWidth && cur.height === page.originalHeight) return prev;
      return {
        ...prev,
        [page.pageNumber]: { width: page.originalWidth, height: page.originalHeight },
      };
    });
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

  // ── 가상화(REQ-P02-01): 뷰포트 근처 페이지만 실제 렌더 ──
  // 대형 PDF(200+ 페이지)에서 전체 페이지를 동시에 <Page>로 렌더하면 캔버스가
  // 한꺼번에 생성돼 메모리·CPU를 대량 소비한다. 위아래 여유(rootMargin)를 넉넉히
  // 두어 스크롤이 실제 뷰포트에 닿기 전에 미리 렌더되도록 한다.
  useEffect(() => {
    if (!numPages) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const toAdd = [];
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = pageRefs.current.indexOf(entry.target);
            if (idx >= 0) toAdd.push(idx + 1);
          }
        });
        if (toAdd.length === 0) return;
        setRenderedPages((prev) => {
          if (toAdd.every((p) => prev.has(p))) return prev;
          const next = new Set(prev);
          toAdd.forEach((p) => next.add(p));
          return next;
        });
      },
      { root: container, rootMargin: "1000px 0px" },
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages]);

  // 아직 렌더되지 않은(placeholder) 페이지의 예상 크기 — 같은 문서는 대부분
  // 페이지 크기가 동일하므로, 이미 로드된 페이지 중 하나의 크기를 재사용한다.
  // 하나도 없으면 A4 세로 기준(595×842pt)으로 추정.
  const firstLoadedPageSize = Object.values(pageSizes)[0];
  const fallbackWidthPt  = firstLoadedPageSize?.width  ?? 595;
  const fallbackHeightPt = firstLoadedPageSize?.height ?? 842;

  // ── 페이지 이동 ──────────────────────────────────────────
  // scrollIntoView는 스크롤 조상을 자동 선택하고, smooth 애니메이션은
  // react-pdf Page의 지속적 리페인트에 취소되어 동작하지 않는다.
  // 스크롤 컨테이너를 명시적으로 지정해 목표 좌표로 즉시 스크롤한다.
  //
  // 가상화 대상 페이지로 점프하는 경우, 대상 페이지를 먼저 렌더 큐에 추가한 뒤
  // 실제 DOM에 반영될 다음 프레임에 위치를 계산해야 정확히 이동한다.
  const scrollToPage = useCallback((pageNum) => {
    // 대상 페이지의 "앞" 페이지들은 강제 렌더하지 않는다 — 앞 페이지까지 함께
    // 실제 <Page>로 전환하면 그 페이지가 아직 크기를 잡기 전(0px) 상태에서
    // 누적 높이를 계산하게 되어 스크롤 위치가 한 페이지만큼 짧게 계산되는
    // 버그가 있었다(실측: 150페이지 이동 시 149로 안착). 대상 페이지 이전은
    // 이미 정확한 크기의 placeholder이므로 그대로 두고, 대상(및 다음 페이지)만
    // 렌더 큐에 추가한다.
    setRenderedPages((prev) => {
      if (prev.has(pageNum)) return prev;
      const next = new Set(prev);
      next.add(pageNum);
      if (numPages && pageNum < numPages) next.add(pageNum + 1);
      return next;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = pageRefs.current[pageNum - 1];
        const container = containerRef.current;
        if (el && container) {
          const top =
            el.getBoundingClientRect().top -
            container.getBoundingClientRect().top +
            container.scrollTop;
          container.scrollTo({ top, behavior: "instant" });
        }
      });
    });
  }, [numPages]);

  // ── 외부 제어 (REQ-F07): ref.scrollToPage(n) ────────────
  useImperativeHandle(
    ref,
    () => ({
      scrollToPage: (pageNum) => {
        if (!numPages || pageNum < 1 || pageNum > numPages) return;
        setCurrentPage(pageNum);
        setPageInput(String(pageNum));
        scrollToPage(pageNum);
      },
    }),
    [numPages, scrollToPage]
  );

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
            Array.from({ length: numPages }, (_, i) => {
              const pageNum = i + 1;
              const isRendered = renderedPages.has(pageNum);
              return (
                <div
                  key={i}
                  className="pdf-page-wrapper"
                  ref={(el) => { pageRefs.current[i] = el; }}
                >
                  {isRendered ? (
                    <>
                      <Page
                        pageNumber={pageNum}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadSuccess={onPageLoadSuccess}
                      />
                      {renderPageOverlay?.(pageNum, { scale, pageSize: pageSizes[pageNum] ?? null })}
                    </>
                  ) : (
                    <div
                      style={{
                        width: (pageSizes[pageNum]?.width ?? fallbackWidthPt) * scale,
                        height: (pageSizes[pageNum]?.height ?? fallbackHeightPt) * scale,
                      }}
                    />
                  )}
                </div>
              );
            })}
        </Document>
      </div>
    </div>
  );
});

export default PdfPreviewPanel;
