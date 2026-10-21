import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import { Icon } from "@iconify/react";

import { listShares, addShare, updateShare, removeShare } from "api/client";
import { resolveDocumentName } from "utils/documentName";
import { ROLE_LABEL } from "utils/jobRole";
import { tintSx } from "theme/tint";

const ROLES = ["owner", "editor", "viewer"]; // owner 로 주면 공동 소유자(PLAN-28 Phase 6)

const ROLE_HINT = {
  owner: "공유 관리 · 재감지 · 삭제까지",
  editor: "문항 추가·수정 가능",
  viewer: "보기 · 문제집 생성만",
};

const roleItems = ROLES.map((r) => (
  <MenuItem key={r} value={r}>
    <Box>
      <Typography variant="body2">{ROLE_LABEL[r]}</Typography>
      <Typography variant="caption" color="text.secondary">{ROLE_HINT[r]}</Typography>
    </Box>
  </MenuItem>
));

// 닫힌 Select 에는 설명 없이 역할 이름만
const renderRole = (r) => ROLE_LABEL[r];

/** 한 사람 행 — 이니셜 아바타 · 이메일 · 오른쪽 컨트롤 */
function PersonRow({ email, caption, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
      <Avatar
        sx={(theme) => ({ width: 32, height: 32, fontSize: 14, fontWeight: 700, ...tintSx("primary")(theme) })}
      >
        {(email || "?")[0].toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap>{email}</Typography>
        {caption && <Typography variant="caption" color="text.secondary">{caption}</Typography>}
      </Box>
      {children}
    </Box>
  );
}

/**
 * 분석 결과 공유 (REQ-28) — 소유자(공동 소유자 포함)만 연다.
 * 상대는 이메일로 지정하고 기본 역할은 편집자다(생성 담당자가 미탐을 바로 고칠 수 있게, PLAN-28 § 결정).
 * 업로더는 맨 위 고정 행이다 — 인덱스 밖이라 해제·역할 변경 대상이 아니다(§ 결정 "업로더 보호").
 */
export default function ShareDialog({ job, open, onClose }) {
  const [owner, setOwner] = useState(null);
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !job) return;
    setEmail("");
    setRole("editor");
    setError("");
    listShares(job.job_id)
      .then((res) => {
        setOwner(res.owner ?? null);
        setShares(res.shares);
      })
      .catch((e) => setError(e.message));
  }, [open, job]);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () => run(async () => {
    const added = await addShare(job.job_id, email.trim(), role);
    setShares((prev) => [...prev.filter((s) => s.user_id !== added.user_id), added]);
    setEmail("");
  });

  const handleRole = (userId, next) => run(async () => {
    await updateShare(job.job_id, userId, next);
    setShares((prev) => prev.map((s) => (s.user_id === userId ? { ...s, role: next } : s)));
  });

  const handleRemove = (userId) => run(async () => {
    await removeShare(job.job_id, userId);
    setShares((prev) => prev.filter((s) => s.user_id !== userId));
  });

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Icon icon="material-symbols:group-add-outline-rounded" style={{ fontSize: 22 }} />
          분석 결과 공유
        </Box>
        <Typography component="div" variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
          {job && resolveDocumentName(job)}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
          <TextField
            size="small" fullWidth autoFocus
            label="이메일"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && email.trim()) handleAdd(); }}
            disabled={busy}
          />
          <Select
            size="small" value={role} disabled={busy} data-testid="share-new-role"
            onChange={(e) => setRole(e.target.value)} renderValue={renderRole}
            sx={{ minWidth: 104 }}
          >
            {roleItems}
          </Select>
          <Button variant="contained" onClick={handleAdd} disabled={busy || !email.trim()} sx={{ flexShrink: 0, height: 40 }}>
            추가
          </Button>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            접근할 수 있는 사람
          </Typography>
          {owner && (
            <PersonRow email={owner.email} caption="업로더">
              <Typography variant="body2" color="text.secondary" sx={{ px: 1.5 }}>{ROLE_LABEL.owner}</Typography>
            </PersonRow>
          )}
          {shares.map((s) => (
            <Box key={s.user_id}>
              <Divider />
              <PersonRow email={s.email}>
                <Select
                  size="small" variant="standard" disableUnderline value={s.role} disabled={busy}
                  onChange={(e) => handleRole(s.user_id, e.target.value)} renderValue={renderRole}
                  sx={{ fontSize: 14, color: "text.secondary" }}
                >
                  {roleItems}
                </Select>
                <Tooltip title="공유 해제">
                  <span>
                    <IconButton size="small" aria-label="공유 해제" onClick={() => handleRemove(s.user_id)} disabled={busy}>
                      <Icon icon="material-symbols:close-rounded" style={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </PersonRow>
            </Box>
          ))}
          {shares.length === 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", pt: 1 }}>
              아직 공유한 사람이 없습니다.
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={busy} variant="outlined" color="inherit">완료</Button>
      </DialogActions>
    </Dialog>
  );
}
