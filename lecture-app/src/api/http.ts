import axios, { type AxiosInstance } from 'axios';
import { API_LOGIN_ORIGIN, API_STUDY_ORIGIN } from '@/config/api';

/** セッション切れ（401）時の遷移先（Cookie 認証のログイン画面） */
export const SESSION_EXPIRED_LOGIN_URL = '/mobile/login/#/login';

const withCreds = { withCredentials: true };

function isSessionExpiredLoginPage(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/$/, '');
  const hash = window.location.hash;
  return path.endsWith('/mobile/login') && hash === '#/login';
}

function redirectToSessionLogin(): void {
  if (typeof window === 'undefined') return;
  if (isSessionExpiredLoginPage()) return;
  window.location.assign(SESSION_EXPIRED_LOGIN_URL);
}

export const loginHttp: AxiosInstance = axios.create({
  baseURL: API_LOGIN_ORIGIN,
  ...withCreds,
});

export const studyHttp: AxiosInstance = axios.create({
  baseURL: API_STUDY_ORIGIN,
  ...withCreds,
});

let refreshInFlight: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = loginHttp
      .post('/refresh', null, withCreds)
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  await refreshInFlight;
}

studyHttp.interceptors.request.use(async (config) => {
  await refreshSession();
  return config;
});

studyHttp.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err?.response?.status;
    if (status === 401) redirectToSessionLogin();
    return Promise.reject(err);
  },
);

loginHttp.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err?.response?.status;
    if (status === 401) redirectToSessionLogin();
    return Promise.reject(err);
  },
);
