import type { Tr } from "./i18n";
// Rule-based feedback that works without any API key.

export interface OfflineCorrection {
  found: string;
  better: string;
  why: string;
  /** A short hint in the learner's language. */
  tr?: Tr;
}

export interface OfflineReview {
  words: number;
  wpm: number | null;
  fillers: { word: string; count: number }[];
  coveredTerms: string[];
  missedTerms: string[];
  corrections: OfflineCorrection[];
  hasCyrillic: boolean;
  notes: string[];
}

const FILLERS = ["um", "uh", "erm", "you know", "actually", "kind of", "sort of", "i mean"];

// Typical mistakes of Russian-speaking developers.
const RULES: { re: RegExp; better: string; why: string; tr?: Tr }[] = [
  {
    re: /\bi am agree\b/gi,
    better: "I agree",
    why: "“agree” is a verb, no “am”.",
    tr: { ru: "не «я есть согласен»", uk: "не «я є згоден»" },
  },
  { re: /\bdepends? of\b/gi, better: "depends on", why: "The preposition is “on”." },
  { re: /\bexplain me\b/gi, better: "explain to me", why: "explain something TO someone." },
  { re: /\bdiscuss about\b/gi, better: "discuss", why: "“discuss” takes a direct object: discuss the problem." },
  { re: /\bsay me\b/gi, better: "tell me", why: "tell someone / say something." },
  {
    re: /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten) years experience\b/gi,
    better: "$1 years of experience",
    why: "You need “of”: three years of experience.",
  },
  { re: /\bon the other side\b(?! of)/gi, better: "on the other hand", why: "Fixed expression for contrasting ideas." },
  { re: /\bin the internet\b(?! (?:age|era|of things))/gi, better: "on the internet", why: "We say “on the internet”." },
  { re: /\binformations\b/gi, better: "information", why: "Uncountable noun, no plural." },
  { re: /\badvices\b/gi, better: "advice / pieces of advice", why: "Uncountable noun." },
  { re: /\bfeedbacks\b/gi, better: "feedback", why: "Uncountable noun." },
  { re: /\bsoftwares\b/gi, better: "software", why: "Uncountable noun." },
  { re: /\bmore (better|faster|easier|bigger)\b/gi, better: "$1", why: "Don't combine “more” with -er comparatives." },
  { re: /\baccording to me\b/gi, better: "in my opinion", why: "“According to” is used for other sources." },
  {
    re: /\bi work (here |there |at \w+ )?since\b/gi,
    better: "I've been working … since",
    why: "With “since/for” use Present Perfect.",
    tr: { ru: "работаю с … → have been working since", uk: "працюю з … → have been working since" },
  },
  {
    re: /\bi am working here (since|for (?:\d+|a|two|three|several) (?:years?|months?))\b/gi,
    better: "I have been working here $1",
    why: "Present Perfect Continuous for duration up to now.",
  },
  {
    re: /\bdid (?:(?:you|we|they|he|she|it|i)\s+)?(?!need|succeed|exceed|proceed|embed|feed|speed|seed|shed|bleed|breed|heed)(\w+ed)\b/gi,
    better: "did + base verb",
    why: "After “did”, use the base form: did you try, not did you tried.",
  },
  { re: /\bhow it works\?/gi, better: "how does it work?", why: "Questions need inversion (in indirect speech “how it works” is fine)." },
  { re: /\bmake a research\b/gi, better: "do research", why: "“research” is uncountable and goes with “do”." },
  { re: /\bvery (unique|perfect|essential)\b/gi, better: "$1", why: "These adjectives are already absolute." },
  { re: /\bit is depend\b/gi, better: "it depends", why: "Present simple: it depends." },
  {
    re: /\b(we|they|you) was\b/gi,
    better: "$1 were",
    why: "were with we / they / you.",
    tr: { ru: "мы были → we were", uk: "ми були → we were" },
  },
  {
    re: /\b(he|she|it) (have|do|don't|were)\b(?! to\b)/gi,
    better: "$1 has / does / doesn't / was",
    why: "he / she / it takes has, does, doesn't, was.",
  },
  { re: /\b(I|we|they|you) has\b/gi, better: "$1 have", why: "has is only for he / she / it." },
  {
    re: /\b(didn't|did not|doesn't|does not|don't|do not|can't|cannot|couldn't|won't|should|must) (\w+ed|knew|went|saw|took|made|found|gave|came|wrote|got|thought)\b(?<!\b(?:need|feed|seed|speed|embed|exceed|succeed|proceed))/gi,
    better: "$1 + base verb",
    why: "After did / does / can / should and similar, use the base verb: didn't know, not didn't knew.",
  },
  {
    re: /\bI founded (a|the|that|it|this|out)\b/gi,
    better: "I found $1",
    why: "found is the past of find; founded means started a company.",
    tr: { ru: "found = нашёл; founded = основал компанию", uk: "found = знайшов; founded = заснував компанію" },
  },
  {
    re: /\b(?:a|the|no) possibility to\b/gi,
    better: "possibility of …ing / chance to",
    why: "“possibility” usually takes “of + -ing”: the possibility of losing data.",
  },
];

function countPhrase(text: string, phrase: string) {
  const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
  return (text.match(re) ?? []).length;
}

export function reviewSpeech(text: string, durationSec: number | null, keyTerms: string[]): OfflineReview {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const wpm = durationSec && durationSec > 10 ? Math.round((words / durationSec) * 60) : null;

  const fillers = FILLERS.map((w) => ({ word: w, count: countPhrase(text, w) }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  // A term counts only from the start of a word ("cache" matches "caching", not "i" inside "in").
  const has = (t: string) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(text);
  const coveredTerms = keyTerms.filter(has);
  const missedTerms = keyTerms.filter((t) => !has(t));

  const found: (OfflineCorrection & { at: number })[] = [];
  for (const rule of RULES) {
    for (const m of text.matchAll(rule.re)) {
      const better = rule.better.includes("$1") ? m[0].replace(rule.re, rule.better) : rule.better;
      found.push({ found: m[0], better, why: rule.why, tr: rule.tr, at: m.index ?? 0 });
    }
  }
  // In the order they appear in the answer.
  const corrections: OfflineCorrection[] = found.sort((a, b) => a.at - b.at).map(({ at: _, ...c }) => c);

  const notes: string[] = [];
  const hasCyrillic = /[а-яё]/i.test(text);
  if (hasCyrillic) notes.push("Some words are in Russian. Try to describe them in English, even with simpler words.");
  if (words > 0 && words < 40) notes.push("The answer is quite short. Aim for at least 60–150 words (about 1 minute).");
  if (words > 350) notes.push("The answer is long. Interviewers prefer 1–2 minutes; keep the main points and stop.");
  if (wpm !== null && wpm < 90)
    notes.push(`Your pace was ${wpm} words/min. That's slow; aim for 110–150. Prepare a few linking phrases to avoid pauses.`);
  if (wpm !== null && wpm > 180) notes.push(`Your pace was ${wpm} words/min. Slow down a little so the interviewer can follow.`);
  const fillerTotal = fillers.reduce((s, f) => s + f.count, 0);
  if (words > 0 && fillerTotal / words > 0.04)
    notes.push("Lots of filler words. A short pause sounds more confident than “um” or “you know”.");
  if (/\bwe\b/i.test(text) && !/\bI\b/.test(text))
    notes.push("You only said “we”. In stories about your work, use “I” for your own actions: interviewers want to know what YOU did.");

  return { words, wpm, fillers, coveredTerms, missedTerms, corrections, hasCyrillic, notes };
}

export function reviewExplanation(text: string, expected: { time: string; space: string }) {
  const notes: { ok: boolean; text: string }[] = [];
  const lower = text.toLowerCase();
  notes.push({
    ok: /\?|can i assume|should i|what if|edge case|empty/.test(lower),
    text: "Asked clarifying questions or mentioned edge cases",
  });
  notes.push({
    ok: /brute|naive|straightforward|better|optimi[sz]e|instead/.test(lower),
    text: "Compared a simple approach with an optimized one",
  });
  notes.push({ ok: /o\(/.test(lower), text: "Stated the time/space complexity in Big O" });
  const norm = (s: string) => s.toLowerCase().replace(/\s/g, "");
  notes.push({
    ok: norm(text).includes(norm(expected.time)),
    text: `Got the optimal time complexity (${expected.time})`,
  });
  notes.push({ ok: text.trim().split(/\s+/).length >= 50, text: "Explanation is detailed enough (50+ words)" });
  return notes;
}

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

/**
 * Compare what was said with the target sentence (word-level LCS).
 * Returns the share of target words that were said, in order, and which ones were missed.
 */
export function compareSpoken(target: string, said: string) {
  const t = target.split(/\s+/).filter((w) => norm(w));
  const s = said.split(/\s+/).map(norm).filter(Boolean);
  const tn = t.map(norm);
  const dp = Array.from({ length: tn.length + 1 }, () => new Array<number>(s.length + 1).fill(0));
  for (let i = tn.length - 1; i >= 0; i--)
    for (let j = s.length - 1; j >= 0; j--) dp[i][j] = tn[i] === s[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const words: { word: string; hit: boolean }[] = [];
  let i = 0;
  let j = 0;
  while (i < tn.length) {
    if (j < s.length && tn[i] === s[j]) {
      words.push({ word: t[i], hit: true });
      i++;
      j++;
    } else if (j < s.length && dp[i][j + 1] > dp[i + 1][j]) j++;
    else {
      words.push({ word: t[i], hit: false });
      i++;
    }
  }
  return { score: tn.length ? Math.round((dp[0][0] / tn.length) * 100) : 0, words };
}

/** Split a paragraph into sentences for shadowing. */
export function sentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+["”]?/g) ?? [text]).map((x) => x.trim()).filter(Boolean);
}
