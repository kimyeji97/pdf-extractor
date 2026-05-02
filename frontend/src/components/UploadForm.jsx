import { useRef, useState } from "react";

/**
 * PDF 파일 선택 컴포넌트.
 * 파일을 선택해도 즉시 업로드하지 않고, onFileSelected(file)로 파일 객체만 전달한다.
 * 실제 업로드는 부모에서 [업로드] 버튼 클릭 시 수행한다.
 */
export default function UploadForm({ onFileSelected, selectedFile, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || file.type !== "application/pdf") {
      alert("PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }
    onFileSelected(file);
  };

  return (
    <div
      className={`upload-zone ${dragging ? "dragging" : ""} ${disabled ? "disabled" : ""} ${selectedFile ? "has-file" : ""}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }}
      />
      {selectedFile ? (
        <p>📄 {selectedFile.name}</p>
      ) : (
        <p>PDF를 드래그하거나 클릭해서 선택<br />(최대 10MB)</p>
      )}
    </div>
  );
}
