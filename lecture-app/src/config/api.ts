/**
 * 認証 API と Study API は **別々のベース URL**（別ホスト／別パスプレフィックス）を想定する。
 * 末尾スラッシュは無視される。パスプレフィックスまで含めて指定する
 * （例: `https://auth.example.com/api/auth` および `https://study.example.com`）。
 *
 * クライアントからの相対パスは、auth では `/login` `/refresh` `/me` 等、
 * study では `/study/...`（API_STUDY.md）を axios の baseURL に対して結合する。
 */
export const API_STUDY_ORIGIN = (
  import.meta.env.VITE_API_STUDY_ORIGIN ?? ''
).replace(/\/$/, '');

export const API_LOGIN_ORIGIN = (
  import.meta.env.VITE_API_LOGIN_ORIGIN ?? ''
).replace(/\/$/, '');
