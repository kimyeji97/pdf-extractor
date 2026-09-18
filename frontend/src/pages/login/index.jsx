import { useState } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router";

import { useAuth } from "contexts/AuthContext";
import paths from "routes/paths";

/**
 * 로그인 화면 (REQ-27 Phase 4) — `auth-layout` 슬롯 연결이 아니라 신규 구현이다
 * (계획서 § 배경 정정 참조).
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(paths.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          로그인
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="이메일"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="비밀번호"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ mb: 2 }}>
          로그인
        </Button>

        <Typography variant="body2" textAlign="center">
          계정이 없으신가요?{" "}
          <Link component={RouterLink} to={paths.signup}>
            회원가입
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
