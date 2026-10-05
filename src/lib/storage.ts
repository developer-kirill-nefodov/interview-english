export interface HistoryEntry {
  id: string;
  kind: "interview" | "coding";
  title: string;
  date: string;
  durationSec: number;
  /** 1–10 scores, whichever are available. */
  scores: Record<string, number>;
}

const KEY = "interview-english:history";

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "date">) {
  const all = loadHistory();
  all.unshift({ ...entry, id: crypto.randomUUID(), date: new Date().toISOString() });
  try {
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
  } catch {
    /* storage unavailable */
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
