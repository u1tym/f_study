/**
 * 認証 API と Study API は **別々のベース URL**（別ホスト／別パスプレフィックス）を想定する。
 * 末尾スラッシュは無視される。パスプレフィックスまで含めて指定する
 * （例: `https://auth.example.com/api/auth` および `https://study.example.com/study`）。
 *
 * Study のベース URL には **API 仕様の `/study` プレフィックスまで含める**。
 * クライアントの相対パスは `API_STUDY.md` の **先頭の `/study` を除いた**パス
 * （例: `/lectures/top`, `/questions/{lid}`）を baseURL に結合する。
 *
 * 認証は `/login` `/refresh` `/me` 等を `API_LOGIN_ORIGIN` に対して結合する。
 */
export const API_STUDY_ORIGIN = (
  import.meta.env.VITE_API_STUDY_ORIGIN ?? ''
).replace(/\/$/, '');

export const API_LOGIN_ORIGIN = (
  import.meta.env.VITE_API_LOGIN_ORIGIN ?? ''
).replace(/\/$/, '');
