import { useSyncExternalStore } from "react";
import { PATTERNS } from "../data/patterns";
import { PHRASEBOOK } from "../data/phrases";
import type { Correction } from "./api";
import type { Career, Format, MissionLog, Skill } from "./mission";
import { SKILL_XP, advanceCareer, snoozeUntil } from "./mission";
import { type Card, dateKey, grade, newCard } from "./srs";
import { addHistory } from "./storage";

export interface Story {
  id: string;
  prompt: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  updated: string;
  tellings: number;
}

export interface State {
  version: 2;
  cards: Card[];
  days: string[];
  missions: MissionLog[];
  snoozed: Partial<Record<Format, string>>;
  stories: Story[];
  skills: Record<Skill, number>;
  career: Career;
  solved: string[];
}

const KEY = "interview-english:v2";

export function seedCards(today: string): Card[] {
  const phrases = PHRASEBOOK.flatMap((g) =>
    g.phrases.map((p) => newCard("phrase", `${g.ru}: «${p.ru}»`, p.en, today, g.title)),
  );
  const patterns = PATTERNS.map((p) =>
    newCard("pattern", p.problem, `${p.name}. ${p.answer} ${p.complexity}.`, today, undefined, `pattern:${p.id}`),
  );
  return [...patterns, ...phrases];
}

export function initialState(today = dateKey()): State {
  return {
    version: 2,
    cards: seedCards(today),
    days: [],
    missions: [],
    snoozed: {},
    stories: [],
    skills: { fluency: 0, clarity: 0, algorithms: 0, vocabulary: 0 },
    career: { company: 0, stage: 0, done: 0, offers: 0 },
    solved: [],
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.version === 2) {
        // Cards added to the app later reach people who already have saved progress.
        const fresh = initialState();
        const ids = new Set(s.cards.map((c) => c.id));
        return { ...fresh, ...s, cards: [...s.cards, ...fresh.cards.filter((c) => !ids.has(c.id))] };
      }
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return initialState();
}

let state: State = load();
const listeners = new Set<() => void>();

// Another tab saved progress: take it, so this tab doesn't overwrite it with stale state.
if (typeof window !== "undefined")
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    state = load();
    listeners.forEach((l) => l());
  });

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export function getState() {
  return state;
}

export function setState(update: (s: State) => State) {
  state = update(state);
  save();
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** The whole app state; re-renders when anything changes. */
export function useStore(): State {
  return useSyncExternalStore(subscribe, getState);
}

export function resetAll() {
  setState(() => initialState());
}

// ── Actions ──────────────────────────────────────────────

export function gradeCard(id: string, remembered: boolean) {
  const today = dateKey();
  setState((s) => ({ ...s, cards: s.cards.map((c) => (c.id === id ? grade(c, remembered, today) : c)) }));
}

/** Turn corrections into "mistake" cards; duplicates of an existing card are skipped. */
export function addMistakeCards(items: Correction[]) {
  const today = dateKey();
  setState((s) => {
    const ids = new Set(s.cards.map((c) => c.id));
    const fresh = items
      .filter((c) => c.original.trim() && c.corrected.trim() && c.original.trim() !== c.corrected.trim())
      .map((c) => newCard("mistake", c.original.trim(), c.corrected.trim(), today, c.explanation))
      .filter((c) => !ids.has(c.id) && (ids.add(c.id), true));
    return fresh.length ? { ...s, cards: [...fresh, ...s.cards] } : s;
  });
}

export function snoozeFormat(f: Format) {
  const today = dateKey();
  setState((s) => ({ ...s, snoozed: { ...s.snoozed, [f]: snoozeUntil(today) } }));
}

export function saveStory(story: Omit<Story, "updated" | "tellings">) {
  const today = dateKey();
  setState((s) => {
    const prev = s.stories.find((x) => x.id === story.id);
    const next: Story = { ...story, updated: today, tellings: (prev?.tellings ?? 0) + 1 };
    return { ...s, stories: prev ? s.stories.map((x) => (x.id === story.id ? next : x)) : [next, ...s.stories] };
  });
}

export function markSolved(problemId: string) {
  setState((s) => (s.solved.includes(problemId) ? s : { ...s, solved: [...s.solved, problemId] }));
}

/**
 * Record a finished mission: XP and history always; the practice day and progress
 * through the current company's hiring stages only for real missions, not free practice.
 */
export function completeMission(log: Omit<MissionLog, "date">, opts: { hired?: boolean; career?: boolean } = {}) {
  const today = dateKey();
  const before = state.career;
  const result = opts.career === false
    ? { career: before, stagePassed: false, newCompany: false }
    : advanceCareer(before, opts.hired);
  setState((s) => {
    const skills = { ...s.skills };
    for (const [k, v] of Object.entries(SKILL_XP[log.format])) skills[k as Skill] += v ?? 0;
    return {
      ...s,
      // Free practice is a bonus: it doesn't count as today's mission.
      days: opts.career === false || s.days.includes(today) ? s.days : [...s.days, today],
      missions: [...s.missions, { ...log, date: today }],
      skills,
      career: result.career,
    };
  });
  addHistory({
    kind: log.format === "coding" ? "coding" : "interview",
    title: `Mission: ${log.format}`,
    durationSec: log.durationSec,
    scores: {},
  });
  return { ...result, before };
}
