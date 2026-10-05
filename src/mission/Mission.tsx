import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Meh, PartyPopper, Trophy, X } from "lucide-react";
import { PROBLEMS } from "../data/problems";
import type { Correction } from "../lib/api";
import { COMPANIES, FORMATS, STAGES, chooseFormat, isLight, seededRng, weekDays, type Format, type MissionLog } from "../lib/mission";
import { type Card as SrsCard, dateKey, pickWarmup } from "../lib/srs";
import { addMistakeCards, completeMission, getState, snoozeFormat, useStore } from "../lib/store";
import { Workspace } from "../pages/LiveCoding";
import { Card, Corrections, Gloss, Ring } from "../components";
import { Approach, Blitz, Final, InterviewFormat, Shadowing, StoryFormat, pick, type TaskResult } from "./formats";
import { Warmup, type WarmupStats } from "./Warmup";

export interface Plan {
  cards: SrsCard[];
  format: Format;
  light: boolean;
  /** Free practice: doesn't move you through the hiring stages. */
  practice: boolean;
}

export const WEEKLY_GOAL = 4;

export function makePlan(forced?: Format): Plan {
  const s = getState();
  const today = dateKey();
  const light = isLight(s.days, today);
  const stage = STAGES[s.career.stage];
  return {
    cards: forced ? [] : pickWarmup(s.cards, today, light ? 3 : 5),
    format:
      forced ??
      chooseFormat({
        stage,
        recent: s.missions.map((m) => m.format),
        snoozed: s.snoozed,
        today,
        light,
        rng: seededRng(`${today}:${s.missions.length}`),
      }),
    light,
    practice: Boolean(forced),
  };
}

type Step = "warmup" | "main" | "review" | "done";

export function Mission({ plan, ai, onExit }: { plan: Plan; ai: boolean; onExit: () => void }) {
  const state = useStore();
  const [step, setStep] = useState<Step>(plan.cards.length ? "warmup" : "main");
  const [format, setFormat] = useState<Format>(plan.format);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [outcome, setOutcome] = useState<DoneOutcome | null>(null);
  const [warm, setWarm] = useState<WarmupStats | null>(null);
  const started = useRef(Date.now());
  const stage = STAGES[state.career.stage];
  const company = COMPANIES[state.career.company];

  const swapFormat = () => {
    snoozeFormat(format);
    const s = getState();
    setFormat(
      chooseFormat({
        stage,
        recent: [...s.missions.map((m) => m.format), format],
        snoozed: { ...s.snoozed, [format]: "9999-12-31" },
        today: dateKey(),
        light: plan.light,
      }),
    );
  };

  const leave = () => {
    if (step !== "main" || window.confirm("Leave the mission? Your answers so far won't be saved.")) onExit();
  };

  const top = useMemo(() => topCorrections(result?.corrections ?? []), [result]);

  useEffect(() => {
    if (step === "review" && top.length) addMistakeCards(top);
  }, [step]);

  const finish = () => {
    const log: Omit<MissionLog, "date"> = {
      format,
      durationSec: Math.round((Date.now() - started.current) / 1000),
      words: result?.words,
      fillerRate: result?.fillerRate,
      wpm: result?.wpm,
    };
    const praise = compareWithPast(state.missions, log);
    setOutcome({ ...completeMission(log, { hired: result?.hired, career: !plan.practice }), praise });
    setStep("done");
  };

  const steps: { key: Step; label: string }[] = [
    ...(plan.cards.length ? [{ key: "warmup" as Step, label: "Warm-up" }] : []),
    { key: "main", label: FORMATS[format].title },
    { key: "review", label: "Review" },
  ];
  const order: Step[] = ["warmup", "main", "review", "done"];

  return (
    <div className={`page ${step === "main" && format === "coding" ? "wide" : ""}`}>
      <div className="row spread">
        <div className="steps-dots">
          {steps.map((s, k) => {
            const done = order.indexOf(step) > order.indexOf(s.key);
            return (
              <div key={s.key} className="row" style={{ gap: 8 }}>
                {k > 0 && <span className="line" />}
                <div className={`s ${s.key === step ? "on" : ""} ${done ? "done" : ""}`}>
                  <i>{done ? <Check size={13} /> : k + 1}</i>
                  <span>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        {step !== "done" && (
          <button className="btn ghost small" onClick={leave} title="Leave the mission">
            <X size={16} /> Leave
          </button>
        )}
      </div>

      {step === "warmup" && (
        <>
          <div className="page-head">
            <span className="eyebrow">Warm-up · 2 minutes</span>
            <h1>Remember out loud</h1>
            <Gloss en="Remember out loud" block />
          </div>
          <Warmup
            cards={plan.cards}
            onDone={(r) => {
              setWarm(r);
              setStep("main");
            }}
          />
        </>
      )}

      {step === "main" && (
        <>
          <div className="row spread">
            <div className="page-head">
              <span className="eyebrow">{plan.practice ? "Free practice" : `${company} · ${stage.title}`}</span>
              <h1>{FORMATS[format].title}</h1>
              <p className="muted">{FORMATS[format].blurb}</p>
              <Gloss en={FORMATS[format].blurb} block />
            </div>
            {!plan.practice && format !== "final" && (
              <button className="btn ghost small" onClick={swapFormat} title="Hide this format for a week and pick another one">
                <Meh size={16} /> Boring, swap it
              </button>
            )}
          </div>
          <MainTask
            key={format}
            format={format}
            plan={plan}
            ai={ai}
            company={company}
            categories={stage.categories}
            solved={state.solved}
            onDone={(r) => {
              setResult(r);
              setStep("review");
            }}
          />
        </>
      )}

      {step === "review" && (
        <div className="stack fade-in">
          <div className="page-head">
            <span className="eyebrow">Review · 1 minute</span>
            <h1>
              {top.length === 1
                ? "One thing to fix"
                : top.length
                  ? "Two things to fix"
                  : format === "shadowing"
                    ? "Good repeating"
                    : "Nothing flagged"}
            </h1>
            <p className="muted">
              {top.length
                ? "Just these. They're now cards, so they'll come back in your warm-ups until they stick."
                : format === "shadowing"
                  ? "Repeating strong answers is how the phrases stick. Nothing to fix here."
                  : ai
                    ? "The AI interviewer found no English mistakes this time. Nice."
                    : "The quick checks didn't find any of the common mistakes they look for. They only know typical ones, so the AI interviewer would catch more."}
            </p>
          </div>
          {top.length > 0 && (
            <Card>
              <Corrections items={top} />
            </Card>
          )}
          {warm && warm.reviewed + warm.learned > 0 && (
            <p className="muted">
              Warm-up: {warm.reviewed > 0 && `you remembered ${warm.remembered} of ${warm.reviewed} cards`}
              {warm.reviewed > 0 && warm.learned > 0 && ", and "}
              {warm.learned > 0 && `${warm.learned} new card${warm.learned > 1 ? "s" : ""} learned`}.
            </p>
          )}
          <button className="btn primary big" onClick={finish}>
            Finish the mission <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === "done" && outcome && <Done outcome={outcome} practice={plan.practice} onExit={onExit} />}
    </div>
  );
}

function MainTask(props: {
  format: Format;
  plan: Plan;
  ai: boolean;
  company: string;
  categories: Parameters<typeof Blitz>[0]["categories"];
  solved: string[];
  onDone: (r: TaskResult) => void;
}) {
  const problem = useMemo(() => {
    const easy = props.plan.light ? PROBLEMS.filter((p) => p.difficulty === "easy") : PROBLEMS;
    const unsolved = easy.filter((p) => !props.solved.includes(p.id));
    return pick(unsolved.length ? unsolved : easy);
  }, []);
  const light = props.plan.light;
  switch (props.format) {
    case "blitz":
      return <Blitz categories={props.categories} count={light ? 3 : 5} ai={props.ai} onDone={props.onDone} />;
    case "interview":
      return <InterviewFormat categories={props.categories} ai={props.ai} onDone={props.onDone} />;
    case "approach":
      return <Approach ai={props.ai} onDone={props.onDone} />;
    case "coding":
      return <Workspace problem={problem} ai={props.ai} onExit={() => props.onDone({ corrections: [] })} onComplete={props.onDone} />;
    case "shadowing":
      return <Shadowing categories={props.categories} count={light ? 2 : 3} onDone={props.onDone} />;
    case "story":
      return <StoryFormat ai={props.ai} onDone={props.onDone} />;
    case "final":
      return <Final company={props.company} ai={props.ai} practice={props.plan.practice} onDone={props.onDone} />;
  }
}

/** The first n distinct corrections; the rest would only overwhelm. */
export function topCorrections(items: Correction[], n = 2): Correction[] {
  const seen = new Set<string>();
  const out: Correction[] = [];
  for (const c of items) {
    const k = c.original.trim().toLowerCase();
    if (!k || seen.has(k) || c.original.trim() === c.corrected.trim()) continue;
    seen.add(k);
    out.push(c);
    if (out.length === n) break;
  }
  return out;
}

/** One honest positive comparison with earlier missions, if there is one. */
export function compareWithPast(past: MissionLog[], now: Omit<MissionLog, "date">): string | null {
  const withWords = past.filter((m) => m.words);
  if (withWords.length >= 2 && now.words) {
    const early = withWords.slice(0, 3);
    const avg = early.reduce((s, m) => s + (m.words ?? 0), 0) / early.length;
    if (now.words > avg * 1.15) return `You said ${now.words} words today. In your first missions it was about ${Math.round(avg)}.`;
  }
  const withFillers = past.filter((m) => m.fillerRate !== undefined);
  if (withFillers.length >= 2 && now.fillerRate !== undefined) {
    const avg = withFillers.slice(0, 3).reduce((s, m) => s + (m.fillerRate ?? 0), 0) / Math.min(3, withFillers.length);
    if (now.fillerRate < avg * 0.8 && avg > 0)
      return `Fewer filler words than in your first missions: ${Math.round(now.fillerRate * 100)}% vs ${Math.round(avg * 100)}%.`;
  }
  if (past.length === 0) return "First mission done. The hardest one is always the first.";
  return null;
}

type DoneOutcome = ReturnType<typeof completeMission> & { praise: string | null };

function Done({ outcome, practice, onExit }: { outcome: DoneOutcome; practice: boolean; onExit: () => void }) {
  const state = useStore();
  const week = weekDays(state.days, dateKey());
  const prevStage = STAGES[outcome.before.stage];
  const stage = STAGES[state.career.stage];
  return (
    <div className="stack fade-in">
      <div className="card celebrate">
        <div className="big-icon">{outcome.newCompany ? <Trophy size={40} /> : <PartyPopper size={40} />}</div>
        <h1>{practice ? "Practice done" : "Done for today"}</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          {outcome.newCompany
            ? outcome.stagePassed
              ? `Offer from ${COMPANIES[outcome.before.company]}! A new company is waiting: ${COMPANIES[state.career.company]}.`
              : `That was the final at ${COMPANIES[outcome.before.company]}. On to ${COMPANIES[state.career.company]}, with everything you've learned.`
            : outcome.stagePassed
              ? `Stage passed: ${prevStage.title}. Next up: ${stage.title}.`
              : "That's it. Stop here while it's still easy, and come back tomorrow."}
        </p>
        {outcome.praise && (
          <p className="chip ok" style={{ marginTop: 6 }}>
            {outcome.praise}
          </p>
        )}
      </div>
      <div className="grid-2">
        <Card>
          <div className="row" style={{ gap: 18 }}>
            <Ring value={week / WEEKLY_GOAL} label={`${week}/${WEEKLY_GOAL}`} sub="this week" />
            <div>
              <h3>{week >= WEEKLY_GOAL ? "Weekly goal reached" : "Weekly goal"}</h3>
              <p className="muted small">
                {week >= WEEKLY_GOAL
                  ? "Anything more this week is a bonus."
                  : `${WEEKLY_GOAL - week} more day(s) this week. Missing a day is fine.`}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <h3>
            {COMPANIES[state.career.company]} · {stage.title}
          </h3>
          <p className="muted small">
            Mission {Math.min(state.career.done + 1, stage.missions)} of {stage.missions} in this stage is next.
          </p>
        </Card>
      </div>
      <button className="btn primary big" onClick={onExit}>
        Back to Today
      </button>
    </div>
  );
}
