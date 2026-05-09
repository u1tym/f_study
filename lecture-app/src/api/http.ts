import axios, { type AxiosInstance } from 'axios';
import { API_LOGIN_ORIGIN, API_STUDY_ORIGIN } from '@/config/api';

const withCreds = { withCredentials: true };

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
    if (status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  },
);

loginHttp.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err?.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  },
);
