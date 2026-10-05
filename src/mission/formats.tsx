import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, ChevronRight, CircleX, Clock, Eye, Mic } from "lucide-react";
import { PATTERNS, STORY_PROMPTS, type Pattern } from "../data/patterns";
import { CATEGORY_LABELS, QUESTIONS, type Category, type Question } from "../data/questions";
import type { Correction } from "../lib/api";
import { compareSpoken, reviewSpeech, sentences } from "../lib/offlineReview";
import { speak, stopSpeaking } from "../lib/speech";
import { saveStory, useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { Card, DictationBox, OfflineFeedback, Score, SpeakButton, fmtTime, offlineToCorrections, useCountdown } from "../components";
import { AnswerTask, correctionsOf, reviewAll, type AnswerResult } from "./AnswerTask";

export interface TaskResult {
  corrections: Correction[];
  words?: number;
  fillerRate?: number;
  wpm?: number;
  hired?: boolean;
}

export const pick = <T,>(xs: T[], rng = Math.random) => xs[Math.floor(rng() * xs.length)];
const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5);

function metricsOf(results: AnswerResult[]): Omit<TaskResult, "corrections"> {
  const words = results.reduce((s, r) => s + r.offline.words, 0);
  const fillers = results.reduce((s, r) => s + r.offline.fillers.reduce((a, f) => a + f.count, 0), 0);
  const secs = results.reduce((s, r) => s + r.durationSec, 0);
  return {
    words,
    fillerRate: words ? fillers / words : undefined,
    wpm: secs > 10 ? Math.round((words / secs) * 60) : undefined,
  };
}

export const toTaskQuestion = (q: Question) => ({
  text: q.text,
  category: CATEGORY_LABELS[q.category],
  tr: q.tr,
  tips: q.tips,
  phrases: q.phrases,
  sample: q.sample,
  keyTerms: q.keyTerms,
});

// ── Deep question ─────────────────────────────────────────
export function InterviewFormat(props: { categories: Category[]; ai: boolean; onDone: (r: TaskResult) => void }) {
  const q = useMemo(() => pick(QUESTIONS.filter((x) => props.categories.includes(x.category))), []);
  return (
    <AnswerTask
      question={toTaskQuestion(q)}
      ai={props.ai}
      label={CATEGORY_LABELS[q.category]}
      onDone={(r) => props.onDone({ corrections: correctionsOf(r), ...metricsOf([r]) })}
    />
  );
}

// ── Blitz ─────────────────────────────────────────────────
const BLITZ_SECONDS = 30;

export function Blitz(props: { categories: Category[]; count: number; ai: boolean; onDone: (r: TaskResult) => void }) {
  const qs = useMemo(() => {
    const pool = QUESTIONS.filter((x) => props.categories.includes(x.category));
    return shuffle(pool.length >= props.count ? pool : QUESTIONS).slice(0, props.count);
  }, []);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<AnswerResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [durations, setDurations] = useState<number[]>([]);
  // The clock pauses while you type, so a typed answer isn't cut off mid-sentence.
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onType = () => {
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 2500);
  };
  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const finishQuestion = () => {
    const all = [...answers, text];
    const secs = [...durations, Math.max(1, BLITZ_SECONDS - left)];
    setAnswers(all);
    setDurations(secs);
    setText("");
    setRunning(false);
    setTyping(false);
    if (i + 1 < qs.length) setI(i + 1);
    else void review(all, secs);
  };
  const [left, setLeft] = useCountdown(BLITZ_SECONDS, running && !typing, finishQuestion);

  useEffect(() => {
    if (results || busy) return;
    setLeft(BLITZ_SECONDS);
    speak(qs[i].text);
    const t = setTimeout(() => setRunning(true), 1200);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [i]);

  const review = async (all: string[], secs: number[]) => {
    setBusy(true);
    // Offline checks for every answer; the AI reviews only the longest one to keep it fast.
    const offline = all.map((a, k) => ({
      answer: a,
      durationSec: secs[k],
      offline: reviewSpeech(a, null, qs[k].keyTerms),
    })) as AnswerResult[];
    const longest = all.reduce((best, a, k) => (a.length > all[best].length ? k : best), 0);
    if (props.ai && all[longest].trim()) {
      offline[longest] = await reviewAll(toTaskQuestion(qs[longest]), all[longest], secs[longest], true);
    }
    setResults(offline);
    setBusy(false);
  };

  if (busy) return <div className="card center muted">Reviewing your answers…</div>;

  if (results) {
    const corrections = results.flatMap(correctionsOf);
    const m = metricsOf(results);
    return (
      <div className="stack fade-in">
        <Card title="Blitz results">
          <div className="stats">
            <div className="stat">
              <b>
                {results.filter((r) => r.answer.trim()).length}/{qs.length}
              </b>
              <small>answered</small>
            </div>
            <div className="stat">
              <b>{m.words}</b>
              <small>words spoken</small>
            </div>
            <div className="stat">
              <b>{m.fillerRate !== undefined ? `${Math.round(m.fillerRate * 100)}%` : "—"}</b>
              <small>filler words</small>
            </div>
          </div>
          {results.map((r, k) => (
            <details key={k}>
              <summary>
                {qs[k].text} <span className="faint">· {r.offline.words} words</span>
              </summary>
              <p className="answer-text">{r.answer || <span className="faint">No answer</span>}</p>
              {r.ai && (
                <div className="row">
                  <Score label="English" value={r.ai.english_score} />
                  <Score label="Content" value={r.ai.content_score} />
                </div>
              )}
              <p className="better small">{r.ai?.better_version ?? qs[k].sample}</p>
            </details>
          ))}
        </Card>
        <button className="btn primary big" onClick={() => props.onDone({ corrections, ...m })}>
          Continue <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  const q = qs[i];
  return (
    <div className="stack fade-in" key={i}>
      <Card>
        <div className="row spread">
          <span className="eyebrow">
            Question {i + 1} of {qs.length}
          </span>
          <span className={`timer ${left <= 5 && !typing ? "urgent" : ""}`}>
            <Clock size={15} /> {typing && running ? "paused while you type" : `${left}s`}
          </span>
        </div>
        <p className="question" style={{ margin: "10px 0" }}>
          {q.text}
        </p>
        <div className="bar">
          <span style={{ width: `${(left / BLITZ_SECONDS) * 100}%` }} />
        </div>
      </Card>
      <Card>
        <DictationBox
          value={text}
          onChange={setText}
          onType={onType}
          rows={4}
          autoStart
          placeholder="Answer right away. Short and imperfect is fine."
        />
        <div className="row">
          <button className="btn primary" onClick={finishQuestion}>
            {i + 1 < qs.length ? "Next question" : "Finish"} <ChevronRight size={16} />
          </button>
          <span className="faint small">No time to think. That's the point.</span>
        </div>
      </Card>
    </div>
  );
}

// ── Approach only ─────────────────────────────────────────
const PATTERN_WORDS: Record<string, RegExp> = {
  "hash-map": /hash|map|dictionary|set/i,
  "two-pointers": /pointer/i,
  "sliding-window": /window/i,
  stack: /stack/i,
  "sort-sweep": /sort/i,
  "binary-search": /binary|half/i,
  kadane: /running|kadane|current/i,
  bfs: /breadth|bfs|queue|level/i,
  dfs: /depth|dfs|recurs|flood/i,
  heap: /heap|priority/i,
  "prefix-sum": /prefix|cumulative/i,
  "group-by-key": /key|sort/i,
  frequency: /count|frequen/i,
  "fast-slow": /fast|slow|floyd|tortoise/i,
  backtracking: /backtrack|recurs|include/i,
};

export function approachChecks(p: Pattern, text: string) {
  const lower = text.toLowerCase();
  return [
    { ok: (PATTERN_WORDS[p.id] ?? /$^/).test(text), text: `Named the key idea (${p.name.toLowerCase()})` },
    { ok: /brute|naive|straightforward|instead|better|every pair|nested/.test(lower), text: "Compared with a simpler or slower approach" },
    {
      ok: /o\s*\(|big o|linear|constant|logarithmic|log n|quadratic|exponential|n squared/.test(lower),
      text: "Stated the time complexity",
    },
    { ok: /space|memory/.test(lower), text: "Mentioned memory (space complexity)" },
    { ok: text.trim().split(/\s+/).length >= 40, text: "Explained in enough detail (40+ words)" },
  ];
}

export function Approach(props: { ai: boolean; onDone: (r: TaskResult) => void }) {
  const p = useMemo(() => pick(PATTERNS), []);
  const question = { text: `How would you solve this? ${p.problem}`, category: "Algorithms (explain the approach)", keyTerms: [] };
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => speak(p.problem), 300);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, []);

  const checks = result ? approachChecks(p, result.answer) : [];

  return (
    <div className="stack fade-in">
      <Card>
        <span className="eyebrow">Explain the approach. No code.</span>
        <p className="question" style={{ margin: "10px 0" }}>
          {p.problem}
        </p>
        <p className="muted small">Aim for about 1–2 minutes: the simple idea first, then the better one, then complexity.</p>
      </Card>
      {!result ? (
        <Card title="Your explanation">
          <DictationBox
            value={text}
            onChange={setText}
            placeholder="“The brute-force way would be… We can do better by… The time complexity is…”"
          />
          <button
            className="btn primary"
            disabled={!text.trim() || busy}
            onClick={async () => {
              setBusy(true);
              setResult(await reviewAll(question, text, 0, props.ai));
              setBusy(false);
            }}
          >
            {busy ? "Reviewing…" : "Check my explanation"}
          </button>
        </Card>
      ) : (
        <>
          <Card title="How you did">
            <ul className="checklist">
              {checks.map((c) => (
                <li key={c.text} className={c.ok ? "ok" : "miss"}>
                  {c.ok ? <BadgeCheck size={17} /> : <CircleX size={17} />} {c.text}
                </li>
              ))}
            </ul>
            {result.ai && (
              <div className="row" style={{ marginTop: 12 }}>
                <Score label="English" value={result.ai.english_score} />
                <Score label="Content" value={result.ai.content_score} />
              </div>
            )}
            {result.ai && <p style={{ marginTop: 10 }}>{result.ai.summary}</p>}
            {result.aiError && <p className="error">AI feedback failed: {result.aiError}</p>}
          </Card>
          <Card title={`Pattern: ${p.name}`} actions={<SpeakButton text={p.explain} />}>
            <p>
              <b>{p.answer}</b> <span className="muted">{p.complexity}.</span>
            </p>
            <h4>How to say it</h4>
            <p className="better">{p.explain}</p>
          </Card>
          <button className="btn primary big" onClick={() => props.onDone({ corrections: correctionsOf(result), ...metricsOf([result]) })}>
            Continue <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

// ── Shadowing ─────────────────────────────────────────────
export function Shadowing(props: { categories: Category[]; count: number; onDone: (r: TaskResult) => void }) {
  const source = useMemo(() => pick(QUESTIONS.filter((x) => props.categories.includes(x.category))), []);
  const lines = useMemo(() => sentences(source.sample).slice(0, props.count), [source]);
  const [i, setI] = useState(0);
  const [said, setSaid] = useState("");
  const [check, setCheck] = useState<ReturnType<typeof compareSpoken> | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [peek, setPeek] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => speak(lines[i], 0.9), 300);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [i]);

  const line = lines[i];
  const next = () => {
    setScores([...scores, check?.score ?? 0]);
    setSaid("");
    setCheck(null);
    setPeek(false);
    if (i + 1 < lines.length) setI(i + 1);
    else props.onDone({ corrections: [] });
  };

  return (
    <div className="stack fade-in" key={i}>
      <Card>
        <div className="row spread">
          <span className="eyebrow">
            Sentence {i + 1} of {lines.length}
          </span>
          <span className="faint small">From: “{source.text}”</span>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Listen, then repeat it out loud with the same rhythm. Read the text only if you're stuck.
        </p>
        <div className="row">
          <SpeakButton text={line} label="Listen" rate={0.9} />
          <SpeakButton text={line} label="Slower" rate={0.7} />
          <button className="btn ghost small" onClick={() => setPeek(!peek)}>
            <Eye size={15} /> {peek ? "Hide text" : "Show text"}
          </button>
        </div>
        {(peek || check) && (
          <p className="target-words" style={{ marginTop: 12 }}>
            {check
              ? check.words.map((w, k) => (
                  <span key={k} className={w.hit ? "hit" : "miss"}>
                    {w.word}{" "}
                  </span>
                ))
              : line}
          </p>
        )}
      </Card>
      <Card>
        <DictationBox value={said} onChange={setSaid} rows={3} placeholder="Press Speak and repeat the sentence." />
        <div className="row">
          {!check ? (
            <button className="btn primary" disabled={!said.trim()} onClick={() => setCheck(compareSpoken(line, said))}>
              <Mic size={16} /> Check
            </button>
          ) : (
            <>
              <span className={check.score >= 80 ? "ok-text" : check.score >= 50 ? "muted" : "bad-text"}>
                {check.score}% matched
                {check.score >= 80
                  ? ". Nice rhythm!"
                  : check.score >= 50
                    ? ". Close. Listen once more and repeat."
                    : ". Listen to it slower and try again."}
              </span>
              <button
                className="btn ghost"
                onClick={() => {
                  setSaid("");
                  setCheck(null);
                }}
              >
                Try again
              </button>
              <button className="btn primary" onClick={next}>
                {i + 1 < lines.length ? "Next sentence" : "Finish"} <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── My story (STAR) ───────────────────────────────────────
const STAR = [
  { key: "situation", label: "Situation", hint: "Where and when? One or two sentences of context.", starter: "At my previous job, we …" },
  { key: "task", label: "Task", hint: "What was your responsibility or the problem?", starter: "My task was to …" },
  { key: "action", label: "Action", hint: "What did YOU do, step by step? This is the main part.", starter: "First, I … Then, I …" },
  {
    key: "result",
    label: "Result",
    hint: "What changed? Numbers if possible. What did you learn?",
    starter: "As a result, … I learned that …",
  },
] as const;

export function StoryFormat(props: { ai: boolean; onDone: (r: TaskResult) => void }) {
  const { stories, hintLang } = useStore();
  const prompt = useMemo(() => {
    const untold = STORY_PROMPTS.find((p) => !stories.some((s) => s.id === p.id));
    return (
      untold ??
      [...STORY_PROMPTS].sort(
        (a, b) => (stories.find((s) => s.id === a.id)?.tellings ?? 0) - (stories.find((s) => s.id === b.id)?.tellings ?? 0),
      )[0]
    );
  }, []);
  const existing = stories.find((s) => s.id === prompt.id);
  const storyTr = t(prompt.tr, hintLang);
  const [fields, setFields] = useState<Record<string, string>>({
    situation: existing?.situation ?? "",
    task: existing?.task ?? "",
    action: existing?.action ?? "",
    result: existing?.result ?? "",
  });
  const [step, setStep] = useState<"build" | "tell">("build");
  const filled = STAR.every((s) => fields[s.key].trim());

  if (step === "tell")
    return (
      <AnswerTask
        question={{
          text: prompt.prompt,
          category: "Behavioral (STAR story)",
          tr: prompt.tr,
          tips: ["Tell the story in one go, without reading your notes.", "Aim for 1–2 minutes.", "Use “I” for what you did."],
          sample: STAR.map((s) => fields[s.key]).join(" "),
          sampleTitle: "Your notes",
          keyTerms: [],
        }}
        ai={props.ai}
        label="Now tell it in one go"
        onDone={(r) => props.onDone({ corrections: correctionsOf(r), ...metricsOf([r]) })}
      />
    );

  return (
    <div className="stack fade-in">
      <Card>
        <span className="eyebrow">
          {existing ? `Polish your story · told ${existing.tellings}×` : "Build a story from your experience"}
        </span>
        <p className="question" style={{ margin: "10px 0" }}>
          {prompt.prompt}
        </p>
        <p className="muted small">
          {storyTr && `${storyTr.replace(/\.$/, "")}. `}A real story from your work, in four short parts. You'll reuse it for many
          behavioral questions.
        </p>
      </Card>
      <div className="grid-2">
        {STAR.map((s) => (
          <Card key={s.key} title={s.label}>
            <p className="muted small">{s.hint}</p>
            <DictationBox
              value={fields[s.key]}
              onChange={(v) => setFields((f) => ({ ...f, [s.key]: v }))}
              rows={3}
              compact
              label={s.label}
              placeholder={s.starter}
            />
          </Card>
        ))}
      </div>
      <div className="row">
        <button
          className="btn primary big"
          disabled={!filled}
          onClick={() => {
            saveStory({
              id: prompt.id,
              prompt: prompt.prompt,
              situation: fields.situation,
              task: fields.task,
              action: fields.action,
              result: fields.result,
            });
            setStep("tell");
          }}
        >
          Save and tell it out loud <ChevronRight size={18} />
        </button>
        {!filled && (
          <span className="muted small">
            {STAR.filter((s) => fields[s.key].trim()).length} of 4 parts filled. A sentence or two each is enough.
          </span>
        )}
      </div>
    </div>
  );
}

// ── Final interview ───────────────────────────────────────
/** 1–10 score from offline metrics, used when there is no AI review. */
export function offlineScore(r: AnswerResult) {
  const o = r.offline;
  let s = 5;
  if (o.words >= 60) s += 2;
  if (o.words >= 100 && o.words <= 350) s += 1;
  if (o.words < 30) s -= 2;
  const terms = o.coveredTerms.length + o.missedTerms.length;
  if (terms && o.coveredTerms.length / terms >= 0.4) s += 1;
  const fillers = o.fillers.reduce((a, f) => a + f.count, 0);
  if (o.words && fillers / o.words > 0.04) s -= 1;
  if (o.hasCyrillic) s -= 2;
  s -= Math.min(2, o.corrections.length);
  return Math.max(1, Math.min(10, s));
}

export function verdict(results: AnswerResult[]) {
  const scores = results.map((r) => (r.ai ? (r.ai.english_score + r.ai.content_score) / 2 : offlineScore(r)));
  const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  return { scores, avg: Math.round(avg * 10) / 10, hired: avg >= 7 };
}

export function Final(props: { company: string; ai: boolean; practice: boolean; onDone: (r: TaskResult) => void }) {
  const qs = useMemo(() => {
    const by = (c: Category[]) => pick(QUESTIONS.filter((q) => c.includes(q.category)));
    return [by(["behavioral"]), by(["frontend", "backend", "cs"]), by(["design"])];
  }, []);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<AnswerResult[]>([]);

  if (results.length === qs.length) {
    const v = verdict(results);
    const reasons = results.map((r, k) => ({ q: qs[k].text, score: v.scores[k], words: r.offline.words }));
    // Free practice shows the score only; the hire/no-hire verdict is for the real final.
    const judged = !props.practice;
    return (
      <div className="stack fade-in">
        {!judged ? (
          <Card className="center">
            <span className="eyebrow">Practice round</span>
            <h1 style={{ margin: "10px 0" }}>{v.avg}/10</h1>
            <p className="muted">
              Practice doesn't count toward offers, so there's no verdict.
              {!props.ai && " Scored by quick checks (length, key ideas, typical mistakes), so treat it as a rough guide."}
            </p>
          </Card>
        ) : (
          <Card className="center">
            <span className="eyebrow">{props.company} · hiring decision</span>
            <h1 style={{ margin: "10px 0", color: v.hired ? "var(--good)" : "var(--warn)" }}>{v.hired ? "Hire" : "No hire, yet"}</h1>
            <p className="muted">
              Average {v.avg}/10.{" "}
              {v.hired ? "You'd get the offer. Next company!" : "Close. The next company starts fresh, and your cards keep the lessons."}
            </p>
            {!props.ai && (
              <p className="faint small">Scored by quick checks (length, key ideas, typical mistakes). Aim for 60+ words per answer.</p>
            )}
          </Card>
        )}
        <Card title="Per question">
          {reasons.map((r) => (
            <div key={r.q} className="row spread" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{r.q}</span>
              <span className="faint small">
                {r.words} words · <b>{r.score}/10</b>
              </span>
            </div>
          ))}
        </Card>
        <button
          className="btn primary big"
          onClick={() =>
            props.onDone({ corrections: results.flatMap(correctionsOf), ...metricsOf(results), hired: judged ? v.hired : undefined })
          }
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <AnswerTask
      key={i}
      question={toTaskQuestion(qs[i])}
      ai={props.ai}
      label={`Final round · question ${i + 1} of 3`}
      continueLabel={i < 2 ? "Next question" : "See the decision"}
      onDone={(r) => {
        setResults((x) => [...x, r]);
        setI(i + 1);
      }}
    />
  );
}

export { OfflineFeedback, fmtTime, offlineToCorrections };
