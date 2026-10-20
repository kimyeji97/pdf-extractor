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
import Alert from "@mui/material/Alert";
import { Icon } from "@iconify/react";

import { listShares, addShare, updateShare, removeShare } from "api/client";
import { resolveDocumentName } from "utils/documentName";
import { ROLE_LABEL } from "utils/jobRole";

const ROLES = ["editor", "viewer"]; // 소유자는 공유로 줄 수 없다

/**
 * 분석 결과 공유 (REQ-28) — 소유자만 연다.
 * 상대는 이메일로 지정하고 기본 역할은 편집자다(생성 담당자가 미탐을 바로 고칠 수 있게, PLAN-28 § 결정).
 */
export default function ShareDialog({ job, open, onClose }) {
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
      .then((res) => setShares(res.shares))
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
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>분석 결과 공유</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
        {error && <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>}
        <Typography variant="body2" fontWeight={700}>{job && resolveDocumentName(job)}</Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small" fullWidth autoFocus
            label="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && email.trim()) handleAdd(); }}
            disabled={busy}
          />
          <Select size="small" value={role} onChange={(e) => setRole(e.target.value)} disabled={busy}>
            {ROLES.map((r) => <MenuItem key={r} value={r}>{ROLE_LABEL[r]}</MenuItem>)}
          </Select>
          <Button variant="contained" onClick={handleAdd} disabled={busy || !email.trim()}>
            추가
          </Button>
        </Box>

        {shares.length === 0 ? (
          <Typography variant="caption" color="text.disabled">아직 공유한 사람이 없습니다.</Typography>
        ) : (
          shares.map((s) => (
            <Box key={s.user_id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>{s.email}</Typography>
              <Select
                size="small" value={s.role} disabled={busy}
                onChange={(e) => handleRole(s.user_id, e.target.value)}
              >
                {ROLES.map((r) => <MenuItem key={r} value={r}>{ROLE_LABEL[r]}</MenuItem>)}
              </Select>
              <Tooltip title="공유 해제">
                <span>
                  <IconButton size="small" onClick={() => handleRemove(s.user_id)} disabled={busy}>
                    <Icon icon="material-symbols:close-rounded" style={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy} color="inherit">닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
