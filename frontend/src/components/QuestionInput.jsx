import { useState } from "react";

// 입력값 유효성 검사: "1,3,5" 또는 "1-5" 또는 "1,3,7-10" 형식
const VALID_PATTERN = /^(\d+(-\d+)?)(,(\d+(-\d+)?))*$/;

export default function QuestionInput({ value, onChange, disabled }) {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\s/g, ""); // 공백 제거
    onChange(raw);

    if (raw && !VALID_PATTERN.test(raw)) {
      setError("형식이 올바르지 않습니다. 예: 1,3,5 또는 1-5 또는 1,3,7-10");
    } else {
      setError("");
    }
  };

  return (
    <div className="question-input">
      <label htmlFor="q-input">추출할 문항 번호</label>
      <input
        id="q-input"
        type="text"
        placeholder="예: 1,3,5 또는 1-5 또는 1,3,7-10"
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
      {error && <p className="error-msg">{error}</p>}
      <p className="hint">쉼표(,)로 개별 번호, 하이픈(-)으로 범위를 입력하세요.</p>
    </div>
  );
}
