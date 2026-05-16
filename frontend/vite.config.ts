import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [
      tsconfigPaths(),
      react(),
    ],
    server: {
      host: '0.0.0.0',
      port: Number(process.env.VITE_APP_PORT || 5173),
    },
  });
};
