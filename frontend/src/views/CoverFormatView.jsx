/**
 * 문제집 포멧 — 표지 이미지 관리
 *
 * 표지 이미지를 업로드하고 관리한다.
 * 업로드된 표지는 "문제집 생성" 탭에서 선택하여 사용할 수 있다.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { listCovers, uploadCover, deleteCover } from "../api/client";

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

export default function CoverFormatView() {
  const [covers, setCovers]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState("");
  const [coverName, setCoverName]   = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const inputRef = useRef(null);

  const fetchCovers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCovers();
      setCovers(data.covers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCovers(); }, [fetchCovers]);

  useEffect(() => {
    if (!previewFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      alert("JPEG 또는 PNG 이미지만 업로드할 수 있습니다.");
      return;
    }
    setPreviewFile(file);
    setError("");
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!previewFile || uploading) return;
    setUploading(true);
    setError("");
    try {
      await uploadCover(previewFile, coverName);
      setPreviewFile(null);
      setPreviewUrl(null);
      setCoverName("");
      fetchCovers();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (coverId) => {
    if (!confirm("이 표지를 삭제하시겠습니까?")) return;
    try {
      await deleteCover(coverId);
      setCovers((prev) => prev.filter((c) => c.cover_id !== coverId));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="cfv-layout view-layout">
      <div className="cfv-content">

        {/* 업로드 섹션 */}
        <div className="cfv-upload-section">
          <h3 className="cfv-section-title">표지 이미지 업로드</h3>
          <p className="cfv-section-desc">
            JPEG 또는 PNG 이미지를 업로드하세요. 문제집 생성 시 첫 페이지(표지)로 사용됩니다.
          </p>

          <div className="cfv-upload-form">
            <div
              className={`cfv-dropzone${previewFile ? " cfv-dropzone--has-file" : ""}`}
              onClick={() => inputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="미리보기" className="cfv-preview-img" />
              ) : (
                <div className="cfv-dropzone-hint">
                  <span className="cfv-dropzone-icon">🖼</span>
                  <p>이미지를 클릭해서 선택하세요<br />(JPEG · PNG)</p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>

            <div className="cfv-upload-meta">
              <input
                className="cfv-name-input"
                type="text"
                placeholder="표지 이름 (선택)"
                value={coverName}
                onChange={(e) => setCoverName(e.target.value)}
                disabled={uploading}
              />
              <button
                className="cfv-upload-btn"
                onClick={handleUpload}
                disabled={!previewFile || uploading}
              >
                {uploading ? "업로드 중..." : "업로드"}
              </button>
            </div>
            {error && <p className="cfv-error">{error}</p>}
          </div>
        </div>

        {/* 표지 목록 */}
        <div className="cfv-list-section">
          <div className="cfv-list-header">
            <h3 className="cfv-section-title">저장된 표지</h3>
            <button className="cfv-refresh-btn" onClick={fetchCovers} disabled={loading}>
              {loading ? "..." : "↺"}
            </button>
          </div>

          {!loading && covers.length === 0 ? (
            <div className="cfv-empty">업로드된 표지가 없습니다.</div>
          ) : (
            <div className="cfv-grid">
              {covers.map((c) => (
                <div key={c.cover_id} className="cfv-card">
                  <img
                    src={`${API_ROOT}${c.thumbnail_url}`}
                    alt={c.name}
                    className="cfv-card-img"
                  />
                  <div className="cfv-card-name" title={c.name}>{c.name}</div>
                  <button
                    className="cfv-card-delete"
                    onClick={() => handleDelete(c.cover_id)}
                    title="삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
