var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
export default (function (_a) {
    var mode = _a.mode;
    process.env = __assign(__assign({}, process.env), loadEnv(mode, process.cwd()));
    return defineConfig({
        plugins: [
            tsconfigPaths(),
            react(),
        ],
        server: {
            host: '0.0.0.0',
            port: Number(process.env.VITE_APP_PORT || 5173),
        },
        // 테스트 환경 (REQ-F09 Phase 2에서 도입, 2026-08-07 승인)
        //
        // jsdom 을 쓰는 이유는 DOM 렌더 때문만이 아니다 — 탭 감속/재동기 케이스가
        // `document.visibilityState` 와 visibilitychange 이벤트를 요구한다.
        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: ['./src/setupTests.js'],
        },
    });
});
