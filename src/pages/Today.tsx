import { useMemo } from "react";
import { Building2, Clock, Coffee, Layers, Play, RotateCcw, Sparkles } from "lucide-react";
import { COMPANIES, FORMATS, SKILL_LABELS, STAGES, level, weekDays, type Skill } from "../lib/mission";
import { dateKey, deckStats } from "../lib/srs";
import { useStore } from "../lib/store";
import { Bar, Card, HintLangPicker, Ring } from "../components";
import { WEEKLY_GOAL, makePlan, type Plan } from "../mission/Mission";

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Hello" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function Today({ onStart, ai }: { onStart: (p: Plan) => void; ai: boolean }) {
  const state = useStore();
  const today = dateKey();
  const doneToday = state.days.includes(today);
  const plan = useMemo(() => makePlan(), [state.career.stage, state.missions.length]);
  const stage = STAGES[state.career.stage];
  const company = COMPANIES[state.career.company];
  const week = weekDays(state.days, today);
  const cards = deckStats(state.cards, today);

  return (
    <div className="page">
      <div className="row spread">
        <div className="page-head">
          <span className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          <h1>{greeting()}</h1>
        </div>
        <HintLangPicker />
      </div>

      <section className="hero fade-in">
        <div className="stack" style={{ position: "relative", zIndex: 1, gap: 16 }}>
          <div className="row" style={{ gap: 8, opacity: 0.9 }}>
            <Building2 size={16} />
            <span className="small">
              {company} · stage {state.career.stage + 1} of {STAGES.length}: {stage.title}
            </span>
          </div>
          <div className="stage-track">
            {STAGES.map((s, k) => (
              <span
                key={s.id}
                className={`seg ${k < state.career.stage ? "done" : k === state.career.stage ? "now" : ""}`}
                title={s.title}
                style={
                  k === state.career.stage
                    ? { background: `linear-gradient(90deg, #fff ${(state.career.done / s.missions) * 100}%, rgba(255,255,255,.45) 0)` }
                    : undefined
                }
              />
            ))}
          </div>
          {doneToday ? (
            <>
              <h2>Today's mission is done</h2>
              <p>Stopping now is part of the plan. Tomorrow's mission is waiting.</p>
              <div className="row">
                <button
                  className="btn small"
                  style={{ background: "rgba(255,255,255,.14)", color: "#fff", borderColor: "transparent" }}
                  onClick={() => onStart(makePlan())}
                >
                  <RotateCcw size={15} /> One more, if you really want
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>{plan.light ? "Welcome back! A light mission today" : "Today's mission"}</h2>
              <p>
                {stage.missions > 1 ? `Mission ${state.career.done + 1} of ${stage.missions} in this stage. ` : "The final round. "}
                {FORMATS[plan.format].blurb}
              </p>
              <div className="chips">
                {plan.cards.length > 0 && (
                  <span className="chip">
                    <Layers size={14} /> Warm-up · {plan.cards.length} cards
                  </span>
                )}
                <span className="chip">
                  <Sparkles size={14} /> {FORMATS[plan.format].title}
                </span>
                <span className="chip">
                  <Clock size={14} /> ~{plan.format === "final" ? 15 : plan.light ? 6 : 10} min
                </span>
              </div>
              <div>
                <button className="btn big light" onClick={() => onStart(plan)}>
                  <Play size={18} fill="currentColor" /> Start
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <div className={state.missions.length ? "grid-3" : "grid-2"}>
        <Card>
          <div className="row" style={{ gap: 16 }}>
            <Ring value={week / WEEKLY_GOAL} label={`${week}/${WEEKLY_GOAL}`} sub="days" size={84} />
            <div>
              <h3>This week</h3>
              <p className="muted small">Goal: {WEEKLY_GOAL} days. Missing a day is fine.</p>
            </div>
          </div>
        </Card>
        {state.missions.length === 0 ? (
          <Card>
            <h3>How it works</h3>
            <p className="muted small">
              About 10 minutes a day: a short warm-up, one task, and two things to fix. Your mistakes become cards, and every few missions
              you move to the next interview stage.
            </p>
          </Card>
        ) : (
          <>
            <Card>
              <h3>Cards</h3>
              <div className="row" style={{ gap: 22, marginTop: 10 }}>
                <div className="stat">
                  <b>{cards.due}</b>
                  <small>to repeat</small>
                </div>
                <div className="stat">
                  <b>{cards.learned}</b>
                  <small>learned</small>
                </div>
                <div className="stat">
                  <b>{state.cards.filter((c) => c.deck === "mistake").length}</b>
                  <small>your mistakes</small>
                </div>
              </div>
            </Card>
            <Card>
              <h3>Offers</h3>
              <div className="row" style={{ gap: 22, marginTop: 10 }}>
                <div className="stat">
                  <b>{state.career.offers}</b>
                  <small>offers</small>
                </div>
                <div className="stat">
                  <b>{state.missions.length}</b>
                  <small>missions</small>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <Card title="Skills">
        <div className="grid-2" style={{ gap: 18 }}>
          {(Object.keys(SKILL_LABELS) as Skill[]).map((k) => {
            const l = level(state.skills[k]);
            return (
              <div className="skill" key={k}>
                <div className="row">
                  <b>{SKILL_LABELS[k]}</b>
                  <span className="muted">Level {l.level}</span>
                </div>
                <Bar value={l.progress} />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="faint small" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Coffee size={15} style={{ flex: "none", marginTop: 3 }} />
        <span>
          Tip: tie the mission to something you already do every day, like your morning coffee.
          {!ai && " The AI interviewer is off, so feedback uses built-in checks."}
        </span>
      </div>
    </div>
  );
}
