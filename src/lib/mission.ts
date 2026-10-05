import type { Tr } from "./i18n";
import type { Category } from "../data/questions";
import { addDays, daysBetween } from "./srs";

export type Format = "blitz" | "interview" | "approach" | "coding" | "shadowing" | "story" | "final";
export type Skill = "fluency" | "clarity" | "algorithms" | "vocabulary";

export const FORMATS: Record<Format, { title: string; tr: Tr; blurb: string }> = {
  blitz: { title: "Blitz", tr: { ru: "Блиц", uk: "Бліц" }, blurb: "Quick questions, 30 seconds each. Speak first, polish later." },
  interview: {
    title: "Deep question",
    tr: { ru: "Глубокий вопрос", uk: "Глибоке питання" },
    blurb: "One real interview question with a full review.",
  },
  approach: {
    title: "Approach only",
    tr: { ru: "Только подход", uk: "Лише підхід" },
    blurb: "Explain how you'd solve a problem out loud, no code.",
  },
  coding: {
    title: "Mini live coding",
    tr: { ru: "Мини лайв-кодинг", uk: "Міні лайв-кодинг" },
    blurb: "Solve a short problem while thinking aloud.",
  },
  shadowing: {
    title: "Shadowing",
    tr: { ru: "Тень", uk: "Тінь" },
    blurb: "Listen to a strong answer and repeat it, sentence by sentence.",
  },
  story: { title: "My story", tr: { ru: "Моя история", uk: "Моя історія" }, blurb: "Build one story from your experience with STAR." },
  final: {
    title: "Final interview",
    tr: { ru: "Финальное собеседование", uk: "Фінальна співбесіда" },
    blurb: "Three questions in a row. The hiring decision is at the end.",
  },
};

export const SKILL_LABELS: Record<Skill, string> = {
  fluency: "Fluency",
  clarity: "Clarity",
  algorithms: "Algorithms",
  vocabulary: "Vocabulary",
};

export interface Stage {
  id: string;
  title: string;
  tr: Tr;
  missions: number;
  formats: Format[];
  categories: Category[];
}

export const STAGES: Stage[] = [
  {
    id: "recruiter",
    title: "Recruiter screen",
    tr: { ru: "Звонок с рекрутером", uk: "Дзвінок із рекрутером" },
    missions: 3,
    formats: ["story", "blitz", "shadowing", "interview"],
    categories: ["behavioral"],
  },
  {
    id: "tech",
    title: "Technical screen",
    tr: { ru: "Техническое интервью", uk: "Технічна співбесіда" },
    missions: 4,
    formats: ["interview", "approach", "blitz", "shadowing"],
    categories: ["frontend", "backend", "cs"],
  },
  {
    id: "coding",
    title: "Live coding round",
    tr: { ru: "Лайв-кодинг", uk: "Лайв-кодинг" },
    missions: 4,
    formats: ["coding", "approach", "coding", "approach"],
    categories: ["cs"],
  },
  {
    id: "design",
    title: "System design",
    tr: { ru: "Системный дизайн", uk: "Системний дизайн" },
    missions: 3,
    formats: ["interview", "shadowing", "blitz"],
    categories: ["design"],
  },
  {
    id: "final",
    title: "Final round",
    tr: { ru: "Финал", uk: "Фінал" },
    missions: 1,
    formats: ["final"],
    categories: ["behavioral", "frontend", "backend", "cs", "design"],
  },
];

export const COMPANIES = ["Brightloop", "Quillstack", "Orbitly", "Fernwave", "Tidecraft"];

export interface MissionLog {
  date: string;
  format: Format;
  durationSec: number;
  words?: number;
  fillerRate?: number;
  wpm?: number;
}

export interface Career {
  company: number;
  stage: number;
  /** Missions done in the current stage. */
  done: number;
  offers: number;
}

/** Days since the last practice; null if never practiced. */
export function daysAway(days: string[], today: string): number | null {
  const past = days.filter((d) => d < today).sort();
  return past.length ? daysBetween(past[past.length - 1], today) : null;
}

/** After a break of 4+ days the mission is lighter, so coming back is easy. */
export function isLight(days: string[], today: string) {
  const away = daysAway(days, today);
  return away !== null && away >= 4;
}

/**
 * Choose today's main format: one the current stage needs, not snoozed as boring,
 * and not one of the last two you did.
 */
export function chooseFormat(opts: {
  stage: Stage;
  recent: Format[];
  snoozed: Partial<Record<Format, string>>;
  today: string;
  light: boolean;
  rng?: () => number;
}): Format {
  const rng = opts.rng ?? Math.random;
  if (opts.stage.formats.includes("final")) return "final";
  const active = (f: Format) => !(opts.snoozed[f] && opts.snoozed[f]! > opts.today);
  let pool = [...new Set(opts.stage.formats)].filter(active);
  if (opts.light) {
    const easy = pool.filter((f) => f === "shadowing" || f === "blitz" || f === "approach");
    if (easy.length) pool = easy;
  }
  if (!pool.length) pool = ["shadowing", "blitz"].filter((f) => active(f as Format)) as Format[];
  if (!pool.length) pool = ["blitz"];
  const fresh = pool.filter((f) => !opts.recent.slice(-2).includes(f));
  const choices = fresh.length ? fresh : pool;
  return choices[Math.floor(rng() * choices.length)];
}

export function snoozeUntil(today: string) {
  return addDays(today, 7);
}

/** Advance the career after a finished mission. Returns what changed for the UI. */
export function advanceCareer(c: Career, hired?: boolean): { career: Career; stagePassed: boolean; newCompany: boolean } {
  const stage = STAGES[c.stage];
  if (stage.id === "final") {
    // Pass or fail, the season ends and a new company starts: no grinding the same final.
    return {
      career: { company: (c.company + 1) % COMPANIES.length, stage: 0, done: 0, offers: c.offers + (hired ? 1 : 0) },
      stagePassed: Boolean(hired),
      newCompany: true,
    };
  }
  const done = c.done + 1;
  if (done >= stage.missions) return { career: { ...c, stage: c.stage + 1, done: 0 }, stagePassed: true, newCompany: false };
  return { career: { ...c, done }, stagePassed: false, newCompany: false };
}

export function weekDays(days: string[], today: string) {
  // Week starts on Monday.
  const [y, m, d] = today.split("-").map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
  const monday = addDays(today, -dow);
  return days.filter((x) => x >= monday && x <= today).length;
}

export function level(xp: number) {
  const lvl = Math.floor(xp / 100) + 1;
  return { level: lvl, progress: (xp % 100) / 100 };
}

export const SKILL_XP: Record<Format, Partial<Record<Skill, number>>> = {
  blitz: { fluency: 30, vocabulary: 10 },
  interview: { clarity: 25, vocabulary: 15 },
  approach: { algorithms: 25, clarity: 15 },
  coding: { algorithms: 30, clarity: 10 },
  shadowing: { fluency: 20, vocabulary: 20 },
  story: { clarity: 30, fluency: 10 },
  final: { fluency: 20, clarity: 20, algorithms: 10, vocabulary: 10 },
};

/** Small deterministic RNG, so today's plan doesn't change on every reload. */
export function seededRng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let a = (h << 13) | (h >>> 19);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
