import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { getJobInfo } from "api/client";
import paths from "routes/paths";
import { isEntryBlocked } from "utils/jobStatus";

/**
 * 감지 중인 파일의 상세(작업) 화면 진입을 막는다 (REQ-F11 Phase 1).
 *
 * 목록 카드의 클릭 차단만으로는 **URL 직접 입력과 뒤로가기**가 그대로 열려 있었다.
 * 판정은 마운트 시 1회다 — 화면에 머무는 동안 상태가 바뀌어도 쫓아내지 않는다.
 * 상세에서 직접 '재감지'를 누른 사용자가 자기 화면에서 튕겨나가면 기능이 아니라 버그다.
 *
 * ⚠️ **상태 조회를 새로 만들지 않는다.** `GET /api/jobs/{id}`가 `boundaries_status`와
 *    `original_pdf_url`을 함께 준다. 화면이 따로 부르고 훅이 또 부르면 같은 응답을 두 번
 *    받게 되므로(`getJobInfo`는 dedup 대상이 아닌 raw fetch다) **이 훅이 유일한 호출자**가
 *    되고 결과를 `jobInfo`로 넘겨준다.
 *
 * ⚠️ 완료를 기다리려고 폴링하지 않는다(계약 #27). 감지 완료는 전역 알림이 알려 준다.
 *
 * @param {string} jobId
 * @returns {{ blocked: boolean, reason: 'processing'|'unavailable'|null,
 *             jobInfo: object|null, loading: boolean, confirm: () => void }}
 */
export function useAnalysisEntryGuard(jobId) {
  const navigate = useNavigate();

  const [state, setState] = useState({
    blocked: false,
    reason: null,
    jobInfo: null,
    loading: true,
  });

  useEffect(() => {
    if (!jobId) return undefined;

    let alive = true;
    setState({ blocked: false, reason: null, jobInfo: null, loading: true });

    getJobInfo(jobId)
      .then((info) => {
        if (!alive) return;
        setState({
          blocked: isEntryBlocked(info),
          reason: isEntryBlocked(info) ? "processing" : null,
          jobInfo: info,
          loading: false,
        });
      })
      .catch(() => {
        if (!alive) return;
        // 상태를 모르면 막는다 (2026-08-10 결정). 열어 두면 네트워크가 흔들릴 때마다
        // 감지 중 화면이 열리고 **가드가 조용히 무력해진다.**
        //
        // 사유를 'processing'과 구분하는 것이 중요하다 — 실패에 "재감지 중입니다"라고
        // 말하면 없는 사실을 알리는 것이고, 사용자는 기다리면 끝난다고 믿는다.
        setState({ blocked: true, reason: "unavailable", jobInfo: null, loading: false });
      });

    return () => {
      alive = false;
    };
  }, [jobId]);

  const confirm = useCallback(() => {
    navigate(paths.analysis);
  }, [navigate]);

  return { ...state, confirm };
}
