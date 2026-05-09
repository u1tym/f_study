import { loginHttp } from '@/api/http';

export type MeResponse = {
  user: { id: number; username: string };
};

export async function login(username: string, password: string): Promise<void> {
  await loginHttp.post('/login', { username, password });
}

export async function logout(): Promise<void> {
  await loginHttp.post('/logout');
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await loginHttp.get<MeResponse>('/me');
  return data;
}
