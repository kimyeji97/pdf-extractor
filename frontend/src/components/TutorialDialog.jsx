import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { Icon } from "@iconify/react";

/**
 * 튜토리얼 슬라이드 모달 (REQ-F20). 첫 화면 노출(`TutorialGate`)과 다시 보기(`TutorialMenu`)가 같이 쓴다.
 * 본 기록은 부르는 쪽이 정한다 — `onDismiss`가 없으면 [다시 보지 않기]를 안 보여 준다.
 * 다른 튜토리얼로 바꿀 땐 `key`를 바꿔 슬라이드 위치를 처음으로 돌린다.
 */
export default function TutorialDialog({ tutorial, onClose, onDismiss }) {
  const [step, setStep] = useState(0);
  const slide = tutorial.slides[step] ?? tutorial.slides[0];
  const last = step >= tutorial.slides.length - 1;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1 }}>{tutorial.title}</Box>
        <IconButton size="small" aria-label="닫기" onClick={onClose}>
          <Icon icon="material-symbols:close-rounded" style={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>{slide.title}</Typography>
        <Typography variant="body2" color="text.secondary">{slide.body}</Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 2 }}>
          {step + 1} / {tutorial.slides.length}
        </Typography>
      </DialogContent>
      <DialogActions>
        {onDismiss && <Button color="inherit" onClick={onDismiss} sx={{ mr: "auto" }}>다시 보지 않기</Button>}
        {step > 0 && <Button onClick={() => setStep(step - 1)}>이전</Button>}
        {last
          ? <Button variant="contained" onClick={onClose}>확인</Button>
          : <Button variant="contained" onClick={() => setStep(step + 1)}>다음</Button>}
      </DialogActions>
    </Dialog>
  );
}
