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
 * 회원가입 화면 (REQ-27 Phase 4). 가입 성공 직후 같은 자격증명으로 자동 로그인된다
 * (`AuthContext.signup()` — 계획서 § 결정(Phase 4) — 회원가입 직후 동작).
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup(email, password);
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
          회원가입
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
          회원가입
        </Button>

        <Typography variant="body2" textAlign="center">
          이미 계정이 있으신가요?{" "}
          <Link component={RouterLink} to={paths.login}>
            로그인
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
