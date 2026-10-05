import { describe, expect, it } from "vitest";
import { addDays, daysBetween, grade, newCard, pickWarmup, INTERVALS } from "./srs";
import { STAGES, advanceCareer, chooseFormat, isLight, seededRng, weekDays, type Format } from "./mission";
import { compareSpoken, reviewSpeech, sentences } from "./offlineReview";
import { topCorrections, compareWithPast } from "../mission/Mission";
import { approachChecks, offlineScore, verdict } from "../mission/formats";
import { PATTERNS } from "../data/patterns";
import { cardFront, initialState } from "./store";
import { detectHintLang, t } from "./i18n";
import { offlineToCorrections } from "../components";

describe("dates", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-01", "2026-10-05")).toBe(4);
  });
});

describe("spaced repetition", () => {
  const today = "2026-10-05";

  it("schedules 1, 3, 7, 16, 35 days while remembered", () => {
    let c = newCard("phrase", "front", "back", today);
    let day = today;
    const gaps: number[] = [];
    for (let i = 0; i < 5; i++) {
      c = grade(c, true, day);
      gaps.push(daysBetween(day, c.due));
      day = c.due;
    }
    expect(gaps).toEqual(INTERVALS.slice(0, 5));
  });

  it("resets to tomorrow when forgotten", () => {
    let c = newCard("phrase", "f", "b", today);
    c = grade(grade(grade(c, true, today), true, today), false, today);
    expect(c.step).toBe(0);
    expect(c.due).toBe(addDays(today, 1));
    expect(c.lapses).toBe(1);
  });

  it("puts overdue cards first, your own mistakes before others, then mixes new decks", () => {
    const overduePhrase = { ...newCard("phrase", "p-old", "x", "2026-09-01"), reviews: 2, due: "2026-10-01" };
    const dueMistake = { ...newCard("mistake", "m-old", "x", "2026-09-01"), reviews: 1, due: "2026-10-01" };
    const future = { ...newCard("phrase", "later", "x", today), reviews: 1, due: "2026-10-20" };
    const fresh = [newCard("phrase", "p1", "x", today), newCard("phrase", "p2", "x", today), newCard("pattern", "q1", "x", today)];
    const picked = pickWarmup([future, overduePhrase, ...fresh, dueMistake], today, 4);
    expect(picked.map((c) => c.front)).toEqual(["m-old", "p-old", "q1", "p1"]);
    expect(picked).not.toContain(future);
  });

  it("seeds pattern and phrase decks with unique ids", () => {
    const s = initialState(today);
    expect(s.cards.filter((c) => c.deck === "pattern")).toHaveLength(PATTERNS.length);
    expect(new Set(s.cards.map((c) => c.id)).size).toBe(s.cards.length);
  });
});

describe("mission planning", () => {
  const today = "2026-10-05";
  const tech = STAGES[1];

  it("never repeats one of the last two formats and skips snoozed ones", () => {
    for (let seed = 0; seed < 50; seed++) {
      const f = chooseFormat({
        stage: tech,
        recent: ["interview", "approach"],
        snoozed: { blitz: "2026-10-10" },
        today,
        light: false,
        rng: seededRng(String(seed)),
      });
      expect(f).toBe("shadowing");
    }
  });

  it("an expired snooze no longer blocks a format", () => {
    const picks = new Set<Format>();
    for (let seed = 0; seed < 50; seed++)
      picks.add(
        chooseFormat({ stage: tech, recent: [], snoozed: { blitz: "2026-10-01" }, today, light: false, rng: seededRng(String(seed)) }),
      );
    expect(picks.has("blitz")).toBe(true);
  });

  it("a light day picks an easy format", () => {
    for (let seed = 0; seed < 30; seed++) {
      const f = chooseFormat({ stage: STAGES[0], recent: [], snoozed: {}, today, light: true, rng: seededRng(String(seed)) });
      expect(["shadowing", "blitz"]).toContain(f);
    }
  });

  it("the final stage always runs the final interview", () => {
    expect(chooseFormat({ stage: STAGES[4], recent: ["final"], snoozed: {}, today, light: true })).toBe("final");
  });

  it("the same seed gives the same plan", () => {
    const a = chooseFormat({ stage: tech, recent: [], snoozed: {}, today, light: false, rng: seededRng("x") });
    const b = chooseFormat({ stage: tech, recent: [], snoozed: {}, today, light: false, rng: seededRng("x") });
    expect(a).toBe(b);
  });

  it("a break of 4+ days makes the mission light", () => {
    expect(isLight([], today)).toBe(false);
    expect(isLight(["2026-10-02"], today)).toBe(false);
    expect(isLight(["2026-10-01"], today)).toBe(true);
  });

  it("counts practice days from Monday", () => {
    // 2026-10-05 is a Monday.
    expect(weekDays(["2026-10-04", "2026-10-05"], "2026-10-05")).toBe(1);
    expect(weekDays(["2026-10-05", "2026-10-07", "2026-10-11"], "2026-10-11")).toBe(3);
  });
});

describe("career", () => {
  it("moves to the next stage after enough missions", () => {
    let c = { company: 0, stage: 0, done: 0, offers: 0 };
    for (let i = 0; i < STAGES[0].missions - 1; i++) {
      const r = advanceCareer(c);
      expect(r.stagePassed).toBe(false);
      c = r.career;
    }
    const r = advanceCareer(c);
    expect(r.stagePassed).toBe(true);
    expect(r.career).toMatchObject({ stage: 1, done: 0 });
  });

  it("the final starts a new company and counts the offer only when hired", () => {
    const final = { company: 0, stage: STAGES.length - 1, done: 0, offers: 0 };
    expect(advanceCareer(final, true).career).toEqual({ company: 1, stage: 0, done: 0, offers: 1 });
    expect(advanceCareer(final, false).career).toEqual({ company: 1, stage: 0, done: 0, offers: 0 });
  });
});

describe("offline speech review", () => {
  it("catches typical mistakes and keeps the number", () => {
    const r = reviewSpeech("I am agree. I have 3 years experience and it depends of the team.", 30, []);
    expect(r.corrections.map((c) => c.better)).toEqual(["I agree", "3 years of experience", "depends on"]);
  });

  it("doesn't flag correct English", () => {
    const r = reviewSpeech("I agree. I have three years of experience, and it depends on the team. I have worked here since 2023.", 40, []);
    expect(r.corrections).toEqual([]);
  });

  it("counts filler words as whole words only, and not “like” as in “something like Redis”", () => {
    const r = reviewSpeech("Um, I use something like Redis. I mean, ummm it is fine.", null, []);
    expect(r.fillers.find((f) => f.word === "um")?.count).toBe(1);
    expect(r.fillers.find((f) => f.word === "i mean")?.count).toBe(1);
    expect(r.fillers.find((f) => f.word === "like")).toBeUndefined();
  });

  it("doesn't flag correct sentences that look like typical mistakes", () => {
    for (const ok of [
      "On the other side of the connection, the server sends an ACK.",
      "This happened in the internet era.",
      "We did need a cache, and the rollout did succeed.",
      "I am working here for a client in Berlin.",
    ])
      expect(reviewSpeech(ok, null, []).corrections, ok).toEqual([]);
    expect(reviewSpeech("Did you tried it?", null, []).corrections).toHaveLength(1);
    for (const ok of [
      "It was a hard bug, and they were happy. You were right.",
      "He has to leave. She doesn't care. It does work. It has to be fast.",
      "I didn't know. We should need less. It didn't succeed. I didn't feed it.",
      "I found a bug. They founded the company in 2010.",
    ])
      expect(reviewSpeech(ok, null, []).corrections, ok).toEqual([]);
    const bad = reviewSpeech("We was late, and she have a plan. I has it. I didn't knew. I founded a bug.", null, []);
    expect(bad.corrections.map((c) => c.found)).toEqual(["We was", "she have", "I has", "didn't knew", "I founded a"]);
  });

  it("matches key terms from the start of a word", () => {
    const r = reviewSpeech("I'd version the API and add caching.", null, ["version", "cach", "I"]);
    expect(r.coveredTerms).toEqual(["version", "cach", "I"]);
    expect(reviewSpeech("one thing", null, ["in"]).missedTerms).toEqual(["in"]);
  });

  it("notices Russian words and only-“we” answers", () => {
    const r = reviewSpeech("we built a кэш for the team and we shipped it", null, []);
    expect(r.hasCyrillic).toBe(true);
    expect(r.notes.join(" ")).toMatch(/YOU did/);
  });
});

describe("shadowing comparison", () => {
  it("scores an exact repeat as 100", () => {
    expect(compareSpoken("Let me think about it.", "let me think about it").score).toBe(100);
  });

  it("marks missed words in order", () => {
    const r = compareSpoken("I would measure first, then optimize.", "I would measure then optimize");
    expect(r.score).toBe(83);
    expect(r.words.filter((w) => !w.hit).map((w) => w.word)).toEqual(["first,"]);
  });

  it("splits a paragraph into sentences", () => {
    expect(sentences("First, I measure. Then I fix it! Done?")).toEqual(["First, I measure.", "Then I fix it!", "Done?"]);
  });
});

describe("mission review helpers", () => {
  it("keeps the first two distinct real corrections", () => {
    const c = (o: string, n: string) => ({ original: o, corrected: n, explanation: "" });
    expect(topCorrections([c("a", "a"), c("I am agree", "I agree"), c("i am agree", "I agree"), c("x", "y"), c("p", "q")])).toEqual([
      c("I am agree", "I agree"),
      c("x", "y"),
    ]);
  });

  it("praises only a real improvement over the first missions", () => {
    const past = [
      { date: "1", format: "blitz" as const, durationSec: 60, words: 80 },
      { date: "2", format: "blitz" as const, durationSec: 60, words: 90 },
    ];
    expect(compareWithPast(past, { format: "blitz", durationSec: 60, words: 120 })).toMatch(/120 words/);
    expect(compareWithPast(past, { format: "blitz", durationSec: 60, words: 85 })).toBeNull();
    expect(compareWithPast([], { format: "blitz", durationSec: 60 })).toMatch(/First mission/);
  });
});

describe("approach and final scoring", () => {
  it("checks an explanation for the key idea and complexity", () => {
    const p = PATTERNS.find((x) => x.id === "hash-map")!;
    const good = approachChecks(p, p.explain);
    expect(good.every((c) => c.ok)).toBe(true);
    const weak = approachChecks(p, "I would loop.");
    expect(weak.filter((c) => c.ok)).toHaveLength(0);
  });

  it("every model explanation passes its own checklist", () => {
    const failures = Object.fromEntries(
      PATTERNS.map((p) => [
        p.id,
        approachChecks(p, p.explain)
          .filter((c) => !c.ok)
          .map((c) => c.text),
      ]).filter(([, f]) => f.length),
    );
    expect(failures).toEqual({});
  });

  it("hires on a strong offline answer and not on a weak one", () => {
    const strong =
      "As a result, ".repeat(1) +
      "I measured the page with Lighthouse, then split the bundle and added lazy loading and a cache. ".repeat(6);
    const r = (answer: string) => ({
      answer,
      durationSec: 60,
      offline: reviewSpeech(answer, 60, ["Lighthouse", "bundle", "lazy", "cache"]),
    });
    expect(offlineScore(r(strong))).toBeGreaterThanOrEqual(7);
    expect(offlineScore(r("um I don't know"))).toBeLessThan(5);
    expect(verdict([r(strong), r(strong), r(strong)]).hired).toBe(true);
    expect(verdict([r("no"), r(strong), r("no")]).hired).toBe(false);
  });
});

describe("hint languages", () => {
  it("picks the first supported browser language, else Russian", () => {
    expect(detectHintLang(["en-US", "uk-UA", "ru"])).toBe("uk");
    expect(detectHintLang(["ru-RU"])).toBe("ru");
    expect(detectHintLang(["en-GB", "ro"])).toBe("ru"); // made for Russian speakers; switchable
  });

  it("shows translations only for the chosen language", () => {
    const tr = { ru: "Привет", uk: "Привіт" };
    expect(t(tr, "uk")).toBe("Привіт");
    expect(t(tr, "none")).toBeUndefined();
  });

  it("phrase cards ask in the chosen language, or with an English cue", () => {
    const card = initialState("2026-10-05").cards.find((c) => c.deck === "phrase" && c.back.startsWith("Sorry, could you repeat"))!;
    expect(cardFront(card, "ru")).toMatch(/[а-я]/i);
    expect(cardFront(card, "uk")).toMatch(/[іїєґ]/i);
    expect(cardFront(card, "none")).not.toMatch(/[а-яіїєґ]/i);
    expect(cardFront(card, "none")).toContain("Sorry, could …");
  });

  it("rule hints follow the language", () => {
    const r = reviewSpeech("I am agree.", null, []);
    expect(offlineToCorrections(r, "uk")[0].explanation).toContain("згоден");
    expect(offlineToCorrections(r, "none")[0].explanation).not.toMatch(/[а-яіїєґ]/i);
  });
});
