export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface AnswerReview {
  english_score: number;
  content_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  corrections: Correction[];
  better_version: string;
  useful_phrases: string[];
  follow_up_question: string;
}

export interface CodingReview {
  communication_score: number;
  code_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  corrections: Correction[];
  complexity_check: string;
  model_explanation: string;
  follow_up_question: string;
}

export async function getStatus(): Promise<{ ai: boolean }> {
  try {
    const r = await fetch("/api/status");
    return r.ok ? r.json() : { ai: false };
  } catch {
    return { ai: false };
  }
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error ?? `Request failed (${r.status})`);
  return data as T;
}

export const reviewAnswer = (body: { question: string; category: string; answer: string; durationSec?: number }) =>
  post<AnswerReview>("/api/review/answer", body);

export const reviewCoding = (body: {
  title: string;
  statement: string;
  code: string;
  explanation: string;
  testsPassed: number;
  testsTotal: number;
}) => post<CodingReview>("/api/review/coding", body);
