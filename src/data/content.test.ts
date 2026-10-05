import { describe, expect, it } from "vitest";
import { PROBLEMS } from "./problems";
import { QUESTIONS } from "./questions";
import { PATTERNS, STORY_PROMPTS } from "./patterns";
import { PHRASEBOOK } from "./phrases";
import { STAGES } from "../lib/mission";
import { reviewSpeech } from "../lib/offlineReview";

/** Reference solutions: if a problem's expected values are wrong, these fail. */
export const SOLUTIONS: Record<string, string> = {
  "two-sum": "function twoSum(nums, target) { const seen = new Map(); for (let i = 0; i < nums.length; i++) { if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i]; seen.set(nums[i], i); } }",
  "valid-parentheses": "function isValid(s) { const st = []; const m = { ')': '(', ']': '[', '}': '{' }; for (const c of s) { if ('([{'.includes(c)) st.push(c); else if (st.pop() !== m[c]) return false; } return st.length === 0; }",
  palindrome: "function isPalindrome(s) { const t = s.toLowerCase().replace(/[^a-z0-9]/g, ''); return t === [...t].reverse().join(''); }",
  "group-anagrams": "function groupAnagrams(words) { const m = new Map(); for (const w of words) { const k = [...w].sort().join(''); if (!m.has(k)) m.set(k, []); m.get(k).push(w); } return [...m.values()].map((g) => g.sort()); }",
  "merge-intervals": "function merge(intervals) { const a = [...intervals].sort((x, y) => x[0] - y[0]); const out = []; for (const [s, e] of a) { if (out.length && s <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], e); else out.push([s, e]); } return out; }",
  "max-subarray": "function maxSubArray(nums) { let cur = nums[0], best = nums[0]; for (let i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); best = Math.max(best, cur); } return best; }",
};

// Same comparison as the in-browser runner (src/lib/runner.ts).
const canon = (v: unknown, unordered?: boolean) => {
  if (!unordered || !Array.isArray(v)) return JSON.stringify(v);
  return JSON.stringify(v.map((x) => (Array.isArray(x) ? [...x].sort() : x)).map((x) => JSON.stringify(x)).sort());
};

describe("coding problems", () => {
  for (const p of PROBLEMS) {
    it(`${p.id}: the reference solution passes every test`, () => {
      const fn = new Function(`${SOLUTIONS[p.id]}; return ${p.fn};`)();
      for (const t of p.tests) expect(canon(fn(...structuredClone(t.args)), t.unordered)).toBe(canon(t.expected, t.unordered));
    });
    it(`${p.id}: the starter code defines ${p.fn}`, () => {
      expect(typeof new Function(`${p.starter}; return ${p.fn};`)()).toBe("function");
    });
  }
});

describe("content", () => {
  it("every question has a sample answer, tips, phrases and key terms", () => {
    for (const q of QUESTIONS) {
      expect(q.sample.split(" ").length, q.id).toBeGreaterThan(40);
      expect(q.tips.length, q.id).toBeGreaterThan(0);
      expect(q.phrases.length, q.id).toBeGreaterThan(0);
      expect(q.keyTerms.length, q.id).toBeGreaterThan(0);
    }
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });

  it("model answers don't trigger our own grammar warnings", () => {
    for (const q of QUESTIONS) expect(reviewSpeech(q.sample, null, []).corrections, q.id).toEqual([]);
    for (const p of PATTERNS) expect(reviewSpeech(p.explain, null, []).corrections, p.id).toEqual([]);
  });

  it("model answers cover their own key terms and use no filler words", () => {
    const gaps: Record<string, string[]> = {};
    for (const q of QUESTIONS) {
      const r = reviewSpeech(q.sample, null, q.keyTerms);
      const g = [...r.missedTerms, ...r.fillers.map((f) => f.word)];
      if (g.length) gaps[q.id] = g;
    }
    expect(gaps).toEqual({});
  });

  it("every stage has enough questions for blitz and shadowing", () => {
    for (const s of STAGES) {
      const pool = QUESTIONS.filter((q) => s.categories.includes(q.category));
      expect(pool.length, s.id).toBeGreaterThan(0);
    }
  });

  it("phrases and stories have Russian hints", () => {
    for (const g of PHRASEBOOK) for (const p of g.phrases) expect(p.ru.length, p.en).toBeGreaterThan(0);
    for (const s of STORY_PROMPTS) expect(s.ru.length).toBeGreaterThan(0);
  });
});
