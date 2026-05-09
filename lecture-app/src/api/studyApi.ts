import { studyHttp } from '@/api/http';

export type TopLecture = { lid: number; ttl: string };

export type QuestionSummary = { qid: number; ttl: string | null };

export type QuestionListResponse = {
  lid: number;
  qes: QuestionSummary[];
};

/** C-5 設問取得の選択肢。`is_right` は API 追加以降で正解フラグとして返る */
export type ChoiceOpt = {
  cid: number;
  typ: string | null;
  opt: string | null;
  img: string | null;
  is_right?: boolean;
};

export type QuestionDetail = {
  lid: number;
  ttl: string | null;
  pb1: string | null;
  im1: string | null;
  pb2: string | null;
  im2: string | null;
  pb3: string | null;
  /** C-5: `plane` | `tex`（省略時は plane 相当） */
  pb1_type?: string | null;
  /** C-5: `plane` | `tex` | null（なしは Part2 文字列なし） */
  pb2_type?: string | null;
  /** C-5: `plane` | `tex` | null */
  pb3_type?: string | null;
  num: number;
  opt: ChoiceOpt[];
};

export type ChoiceInput = {
  typ: string | null;
  opt: string | null;
  img: string | null;
  is_right: boolean;
};

export async function createTopLecture(lecture_name: string): Promise<void> {
  await studyHttp.post('/lectures/top', { lecture_name });
}

export async function listTopLectures(): Promise<TopLecture[]> {
  const { data } = await studyHttp.get<TopLecture[]>('/lectures/top');
  return data;
}

export async function listQuestions(lid: number): Promise<QuestionListResponse> {
  const { data } = await studyHttp.get<QuestionListResponse>(
    `/questions/${lid}`,
  );
  return data;
}

export async function getQuestion(
  lid: number,
  qid: number,
): Promise<QuestionDetail> {
  const { data } = await studyHttp.get<QuestionDetail>(
    `/questions/${lid}/${qid}`,
  );
  return data;
}

export async function createQuestion(body: {
  lid: number;
  ttl: string | null;
  pb1: string;
  im1: string | null;
  pb2: string | null;
  im2: string | null;
  pb3: string | null;
  pb1_type: 'plane' | 'tex';
  pb2_type: 'plane' | 'tex' | null;
  pb3_type: 'plane' | 'tex' | null;
  choices: ChoiceInput[];
}): Promise<void> {
  await studyHttp.post('/questions', body);
}

export async function updateQuestion(body: {
  lid: number;
  qid: number;
  ttl: string | null;
  pb1: string;
  im1: string | null;
  pb2: string | null;
  im2: string | null;
  pb3: string | null;
  pb1_type: 'plane' | 'tex';
  pb2_type: 'plane' | 'tex' | null;
  pb3_type: 'plane' | 'tex' | null;
  choices: ChoiceInput[];
}): Promise<void> {
  await studyHttp.post('/questions/update', body);
}

export async function deleteQuestion(lid: number, qid: number): Promise<void> {
  await studyHttp.post('/questions/delete', { lid, qid });
}

export async function submitAnswer(body: {
  lid: number;
  qid: number;
  answer: number[];
}): Promise<{ result: boolean; right: number[] }> {
  const { data } = await studyHttp.post<{ result: boolean; right: number[] }>(
    '/questions/answer',
    body,
  );
  return data;
}
