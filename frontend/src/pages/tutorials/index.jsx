import { useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { Icon } from "@iconify/react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";

import PageHeader from "components/PageHeader";
import { WorkCanvas, CardRow, PanelCard, PanelCardHeader } from "components/WorkCanvas";
import { useAuth } from "contexts/AuthContext";
import { TUTORIALS } from "utils/tutorials";
import { markSeen, seenIds } from "utils/tutorialSeen";

/**
 * 튜토리얼 화면 (REQ-F20 Phase 4). 왼쪽 묶음·슬라이드 목차, 오른쪽 큰 슬라이드.
 *
 * `?auto=1`은 자동 모드다(`TutorialGate`가 보낸다). 안 본 묶음을 차례로 보여 주고,
 * 다시 보지 않기와 마지막 슬라이드 넘김을 본 기록으로 남긴다. 다 보면 이 화면에 머문다(2026-10-23 사용자 결정).
 * 그 밖(? 버튼)은 다시 보기다. 본 기록을 읽지도 쓰지도 않고 [다시 보지 않기]도 없다.
 * 목차에서 고르는 것(묶음·슬라이드 모두)은 사용자가 직접 고른 다시 보기라 자동 모드를 끝낸다.
 *
 * `?auto`만 바뀌는 이동은 라우트가 같아 다시 마운트되지 않는다(`SuspenseOutlet` key = pathname).
 * 그래서 모드를 key로 써서 다시 마운트한다 — 안 하면 자동 모드를 다 본 뒤 ? 버튼이 "모두 봤습니다"에 머문다(리뷰 회차 2).
 */
export default function TutorialsPage(props) {
  const [searchParams] = useSearchParams();
  const auto = searchParams.get("auto") === "1";
  return <TutorialsView key={auto ? "auto" : "replay"} auto={auto} {...props} />;
}

function TutorialsView({ auto, tutorials = TUTORIALS }) {
  const userEmail = useAuth()?.userEmail;
  const [, setSearchParams] = useSearchParams();
  const picked = useLocation().state?.tutorialPick; // 자동 모드에서 목차로 고른 자리 — 다시 마운트 뒤 그 자리에서 시작

  // 자동 모드에서 볼 묶음 — 들어온 순간의 기록으로 한 번 정한다
  const [queue] = useState(() => {
    const seen = new Set(userEmail ? seenIds(userEmail) : []);
    return tutorials.filter((t) => !seen.has(t.id)).map((t) => t.id);
  });
  const [current, setCurrent] = useState(() =>
    auto ? { id: queue[0] ?? null, step: 0 } : (picked ?? { id: tutorials[0]?.id, step: 0 }));

  const tutorial = tutorials.find((t) => t.id === current.id);
  const slide = tutorial?.slides[current.step];
  const last = tutorial ? current.step >= tutorial.slides.length - 1 : false;
  const nextInQueue = auto && tutorial ? queue[queue.indexOf(tutorial.id) + 1] : undefined;

  const go = (id, step = 0) => setCurrent({ id, step });

  // 다시 보기는 묶음 경계를 넘는다 — 묶음 끝 [다음]은 다음 묶음 첫 장, 묶음 첫 장 [이전]은 앞 묶음 마지막 장 (Phase 6)
  const index = tutorials.findIndex((t) => t.id === current.id);
  const nextBundle = tutorials[index + 1];
  const prevBundle = index > 0 ? tutorials[index - 1] : undefined;
  const goPrev = () => (current.step > 0 ? go(tutorial.id, current.step - 1) : go(prevBundle.id, prevBundle.slides.length - 1));

  // 자동 모드에서 이 묶음을 끝낸다 — 기록하고 다음 안 본 묶음으로, 없으면 다 봤다는 안내
  const finish = () => {
    if (userEmail) markSeen(userEmail, tutorial.id);
    go(nextInQueue ?? null);
  };

  const pick = (id, step = 0) => {
    if (auto) setSearchParams({}, { replace: true, state: { tutorialPick: { id, step } } });
    else go(id, step);
  };

  return (
    <WorkCanvas>
      <PageHeader title="튜토리얼" crumbs={[{ label: "홈", to: "/" }, { label: "튜토리얼" }]} />

      <CardRow sx={{ gap: 2 }}>
        <PanelCard sx={{ width: 260, flexShrink: 0 }}>
          <PanelCardHeader>
            <Icon icon="material-symbols:help-outline-rounded" style={{ fontSize: 18, flexShrink: 0 }} />
            <Typography variant="subtitle2" fontWeight={700}>목차</Typography>
          </PanelCardHeader>
          <List dense sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {tutorials.map((t) => (
              <Box key={t.id}>
                <ListItemButton selected={t.id === current.id} onClick={() => pick(t.id)}>
                  <Typography variant="body2" fontWeight={600}>{t.title}</Typography>
                </ListItemButton>
                {t.id === current.id &&
                  t.slides.map((s, i) => (
                    <ListItemButton key={i} sx={{ pl: 4 }} onClick={() => pick(t.id, i)}>
                      <Typography
                        variant="body2"
                        color={i === current.step ? "primary.main" : "text.secondary"}
                      >
                        {s.title}
                      </Typography>
                    </ListItemButton>
                  ))}
              </Box>
            ))}
          </List>
        </PanelCard>

        <PanelCard sx={{ flex: 1, minWidth: 0 }}>
          {slide ? (
            <>
              <PanelCardHeader>
                <Typography variant="subtitle2" fontWeight={700} noWrap>{tutorial.title}</Typography>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.disabled">
                  {current.step + 1} / {tutorial.slides.length}
                </Typography>
              </PanelCardHeader>
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 3 }}>
                {slide.image && (
                  <Box
                    component="img"
                    src={slide.image}
                    alt={slide.title}
                    // 높이 상한 — 헤더·버튼 줄·설명 두세 줄 자리(약 440px)를 남겨 설명 글이 화면 밖으로 밀리지 않게
                    sx={{ display: "block", maxWidth: "100%", maxHeight: "calc(100dvh - 440px)", mx: "auto", mb: 2, borderRadius: 1, border: 1, borderColor: "divider" }}
                  />
                )}
                <Typography variant="h6" sx={{ mb: 1 }}>{slide.title}</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary", typography: "body1" }}>
                  {slide.body.map((line, i) => (
                    <Box component="li" key={i} sx={{ mb: 0.5 }}>{line}</Box>
                  ))}
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1, px: 3, py: 1.5, borderTop: 1, borderColor: "divider", flexShrink: 0 }}>
                {auto && <Button color="inherit" onClick={finish}>다시 보지 않기</Button>}
                <Box sx={{ flex: 1 }} />
                {(current.step > 0 || (!auto && prevBundle)) && <Button onClick={goPrev}>이전</Button>}
                {!last ? (
                  <Button variant="contained" onClick={() => go(tutorial.id, current.step + 1)}>다음</Button>
                ) : auto ? (
                  <Button variant="contained" onClick={finish}>{nextInQueue ? "다음" : "확인"}</Button>
                ) : (
                  <Button variant="contained" disabled={!nextBundle} onClick={() => go(nextBundle.id)}>다음</Button>
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
              <Typography color="text.secondary">
                안 본 튜토리얼을 모두 봤습니다. 다시 보려면 왼쪽 목차에서 고르세요.
              </Typography>
            </Box>
          )}
        </PanelCard>
      </CardRow>
    </WorkCanvas>
  );
}
