// 운영 구간 (REQ-F19 Phase 4) — 꺼짐 예고 배너 판정 · 브라우저 저장 · 다운 화면 표기.
// windows 는 `GET /api/operating-windows` 응답(`[{start, end}]`, ISO·시간대 포함) 그대로다.

const STORAGE_KEY = "operating_windows"; // ⚠️ token·mode 가 들어가지 않는 이름(F19-37 이 이 키만 막는다)
const WARN_MS = 60 * 60 * 1000; // 꺼지기 1시간 전부터
const TZ = "Asia/Seoul";

/** 지금이 들어 있는 구간의 끝까지 1시간 이내면 그 끝(Date), 아니면 null. */
export function bannerEnd(windows, now) {
  for (const w of windows) {
    const start = new Date(w.start);
    const end = new Date(w.end);
    if (start <= now && now < end) return end - now <= WARN_MS ? end : null;
  }
  return null;
}

/** 끝나지 않은 첫 구간 — 운영 중 장애면 지금 구간(2026-10-08 결정). 없으면 null. */
export function upcomingWindow(windows, now) {
  return windows.find((w) => new Date(w.end) > now) ?? null;
}

// 저장소는 비공개 창 등에서 막힐 수 있다 — 막혀도 화면은 뜨고 운영 시간만 빠진다(계획서 함정)
export function saveWindows(windows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(windows));
  } catch {
    // 저장 못 하면 다운 화면에 운영 시간이 안 나올 뿐이다
  }
}

export function loadWindows() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const _dayFmt = new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, month: "numeric", day: "numeric", weekday: "short" });
const _timeFmt = new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

function _part(parts, type) {
  return parts.find((p) => p.type === type)?.value ?? "";
}

/** "10월 8일(목) 15:00 ~ 23:00" — 운영 시간은 서비스 기준(KST)으로 적는다. */
export function formatWindow(w) {
  const d = _dayFmt.formatToParts(new Date(w.start));
  const day = `${_part(d, "month")}월 ${_part(d, "day")}일(${_part(d, "weekday")})`;
  return `${day} ${_timeFmt.format(new Date(w.start))} ~ ${_timeFmt.format(new Date(w.end))}`;
}
