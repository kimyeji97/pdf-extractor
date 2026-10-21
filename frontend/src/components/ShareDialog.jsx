import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
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
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.75 }}>
      <Avatar
        sx={(theme) => ({ width: 28, height: 28, fontSize: 13, fontWeight: 700, ...tintSx("primary")(theme) })}
      >
        {(email || "?")[0].toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap title={email}>{email}</Typography>
        {caption && <Typography variant="caption" color="text.secondary">{caption}</Typography>}
      </Box>
      {children}
    </Box>
  );
}

const FixedRole = ({ role }) => (
  <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>{ROLE_LABEL[role]}</Typography>
);

/**
 * 분석 결과 공유 패널 (REQ-28) — 소유자(공동 소유자 포함)만 연다. 파일 이름은 옛 다이얼로그 그대로(계약 #28).
 *
 * 현황판 상세와 같은 오른쪽 패널이다(PLAN-28 § 결정 "공유 화면"). `jobs`가 공유 대상이고
 * 패널이 열린 동안 목록 카드를 누르면 페이지가 여기에 더한다.
 * - 1개면 사람 목록까지 — 업로더 고정 행, 내 행은 바꾸거나 해제할 수 없다
 * - 2개 이상이면 추가만 — 분석마다 기존 API를 부르고 되는 것만 공유, 실패는 이름·이유로 보인다
 */
export default function ShareDialog({ jobs = [], open, onClose, onRemoveJob, myEmail = null }) {
  const [owner, setOwner] = useState(null);
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { total, failed: [{ name, message }] }

  const single = jobs.length === 1 ? jobs[0] : null;
  const singleId = single?.job_id;

  useEffect(() => {
    setResult(null);
    setError("");
    setOwner(null);
    setShares([]);
    if (!open || !singleId) return undefined;
    let alive = true;
    listShares(singleId)
      .then((res) => {
        if (!alive) return;
        setOwner(res.owner ?? null);
        setShares(res.shares);
      })
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [open, singleId]);

  if (!open) return null;

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

  const handleShare = () => run(async () => {
    const target = email.trim();
    const failed = [];
    let added = null;
    for (const job of jobs) {
      try {
        added = await addShare(job.job_id, target, role);
      } catch (e) {
        failed.push({ name: resolveDocumentName(job), message: e.message });
      }
    }
    if (single && added) {
      setShares((prev) => [...prev.filter((s) => s.user_id !== added.user_id), added]);
    }
    if (failed.length < jobs.length) setEmail("");
    setResult({ total: jobs.length, failed });
  });

  const handleRole = (userId, next) => run(async () => {
    await updateShare(singleId, userId, next);
    setShares((prev) => prev.map((s) => (s.user_id === userId ? { ...s, role: next } : s)));
  });

  const handleRemove = (userId) => run(async () => {
    await removeShare(singleId, userId);
    setShares((prev) => prev.filter((s) => s.user_id !== userId));
  });

  const isMe = (e) => Boolean(myEmail) && e === myEmail;

  return (
    <Paper
      data-testid="share-panel"
      elevation={0}
      sx={(theme) => ({
        width: { xs: "100%", md: 340 },
        maxHeight: { xs: "50%", md: "none" },
        flexShrink: 0,
        minHeight: 0,
        borderRadius: 2,
        p: 2,
        boxShadow: theme.customShadows?.card,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflowY: "auto",
      })}
    >
      {/* 머리 — 현황판 상세와 같은 제목 + 닫기 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ display: "flex", color: "primary.main" }}>
          <Icon icon="material-symbols:group-add-outline-rounded" style={{ fontSize: 20 }} />
        </Box>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>분석 결과 공유</Typography>
        <IconButton size="small" aria-label="닫기" onClick={onClose} disabled={busy}>
          <Icon icon="material-symbols:close-rounded" style={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* 공유 대상 */}
      <Box>
        <Typography variant="caption" color="text.secondary">
          공유할 분석 {jobs.length}개 · 목록에서 카드를 눌러 더하거나 뺍니다
        </Typography>
        <Box sx={{ mt: 0.75, display: "flex", flexDirection: "column", gap: 0.5 }}>
          {jobs.map((job) => (
            <Box
              key={job.job_id}
              sx={(theme) => ({
                display: "flex", alignItems: "center", gap: 1, pl: 1.25, pr: 0.5, py: 0.5, borderRadius: 1,
                ...tintSx("primary")(theme),
              })}
            >
              <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>{resolveDocumentName(job)}</Typography>
              {jobs.length > 1 && (
                <IconButton size="small" aria-label="대상에서 빼기" onClick={() => onRemoveJob?.(job.job_id)} disabled={busy}>
                  <Icon icon="material-symbols:close-rounded" style={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* 입력 */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <TextField
          size="small" fullWidth autoFocus
          label="이메일"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && email.trim() && jobs.length) handleShare(); }}
          disabled={busy}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Select
            size="small" value={role} disabled={busy} data-testid="share-new-role"
            onChange={(e) => setRole(e.target.value)} renderValue={renderRole}
            sx={{ flex: 1 }}
          >
            {roleItems}
          </Select>
          <Button variant="contained" onClick={handleShare} disabled={busy || !email.trim() || jobs.length === 0}>
            공유
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {result && (jobs.length > 1 || result.failed.length > 0) && (
        <Alert severity={result.failed.length ? "warning" : "success"}>
          {result.total}개 중 {result.total - result.failed.length}개 공유됨
          {result.failed.map((f) => (
            <Typography key={f.name} variant="caption" component="div">{`${f.name} — ${f.message}`}</Typography>
          ))}
        </Alert>
      )}

      {/* 사람 목록 — 1개일 때만 */}
      {single && (
        <Box>
          <Typography variant="caption" color="text.secondary">접근할 수 있는 사람</Typography>
          {owner && (
            <PersonRow email={owner.email} caption={isMe(owner.email) ? "업로더 · 나" : "업로더"}>
              <FixedRole role="owner" />
            </PersonRow>
          )}
          {shares.map((s) => (
            <Box key={s.user_id}>
              <Divider />
              {isMe(s.email) ? (
                <PersonRow email={s.email} caption="나">
                  <FixedRole role={s.role} />
                </PersonRow>
              ) : (
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
                        <Icon icon="material-symbols:close-rounded" style={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </PersonRow>
              )}
            </Box>
          ))}
          {shares.length === 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", pt: 1 }}>
              아직 공유한 사람이 없습니다.
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}
