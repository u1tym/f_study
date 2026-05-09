import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  /** 開発時: 認証 API の転送先（Study と別ポート・別サービスにできる） */
  const loginTarget = env.VITE_DEV_LOGIN_TARGET || 'http://127.0.0.1:8000';
  /** 開発時: Study API の転送先 */
  const studyTarget = env.VITE_DEV_STUDY_TARGET || 'http://127.0.0.1:8000';

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    base: '/mobile/study/',
    server: {
      proxy: {
        '/__proxy_study': {
          target: studyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/__proxy_study/, ''),
        },
        '/__proxy_login': {
          target: loginTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/__proxy_login/, ''),
        },
      },
    },
  };
});
