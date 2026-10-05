import { useState } from "react";
import { Layers, Play } from "lucide-react";
import { dateKey, deckStats, pickWarmup, type Card as SrsCard, type Deck } from "../lib/srs";
import { useStore } from "../lib/store";
import { Bar, Card } from "../components";
import { DECK_INFO, Warmup, type WarmupStats } from "../mission/Warmup";

export function Cards() {
  const state = useStore();
  const today = dateKey();
  const [session, setSession] = useState<SrsCard[] | null>(null);
  const [deck, setDeck] = useState<Deck>("mistake");
  const [summary, setSummary] = useState<WarmupStats | null>(null);

  if (session)
    return (
      <div className="page">
        <div className="page-head">
          <span className="eyebrow">Review</span>
          <h1>Remember out loud</h1>
        </div>
        <Warmup
          cards={session}
          mode="review"
          onDone={(s) => {
            setSession(null);
            setSummary(s);
          }}
        />
      </div>
    );

  const due = pickWarmup(state.cards, today, 10);
  const list = state.cards.filter((c) => c.deck === deck);

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">Spaced repetition</span>
        <h1>Cards</h1>
        {summary && summary.reviewed + summary.learned > 0 && (
          <p className="chip ok" style={{ alignSelf: "flex-start" }}>
            Session done: {summary.remembered} of {summary.reviewed} remembered
            {summary.learned ? `, ${summary.learned} new learned` : ""}. Forgotten ones come back tomorrow.
          </p>
        )}
        <p className="lead">
          Cards come back after 1, 3, 7, 16 and 35 days while you remember them. Your own mistakes from reviews are added automatically.
        </p>
      </div>
      <div className="grid-3">
        {(Object.keys(DECK_INFO) as Deck[]).map((d) => {
          const st = deckStats(
            state.cards.filter((c) => c.deck === d),
            today,
          );
          return (
            <Card key={d}>
              <div className="row spread">
                <h3>{d === "mistake" ? "Your mistakes" : d === "phrase" ? "Phrases" : "Patterns"}</h3>
                <span className="chip">{st.total}</span>
              </div>
              <p className="muted small" style={{ margin: "8px 0" }}>
                {st.learned} learned · {st.due} to repeat · {st.fresh} new
              </p>
              <Bar value={st.total ? st.learned / st.total : 0} />
            </Card>
          );
        })}
      </div>
      <div>
        <button className="btn primary" disabled={!due.length} onClick={() => setSession(due)}>
          <Play size={16} /> Review {due.length} cards now
        </button>
      </div>

      <Card
        title={
          <span className="row">
            <Layers size={18} /> Browse
          </span>
        }
        actions={
          <div className="chips">
            {(Object.keys(DECK_INFO) as Deck[]).map((d) => (
              <button key={d} className={`chip toggle ${deck === d ? "on" : ""}`} onClick={() => setDeck(d)}>
                {d === "mistake" ? "mistakes" : `${d}s`}
              </button>
            ))}
          </div>
        }
      >
        {list.length === 0 ? (
          <p className="muted">No mistakes yet. They appear here after your first missions.</p>
        ) : (
          <table className="history">
            <thead>
              <tr>
                <th>Front</th>
                <th>Answer</th>
                <th>Next</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, 60).map((c) => (
                <tr key={c.id}>
                  <td>{c.deck === "mistake" ? <s>{c.front}</s> : c.front}</td>
                  <td>{c.back}</td>
                  <td className="faint">{c.reviews === 0 ? "new" : c.due <= today ? "today" : c.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="My stories">
        {state.stories.length === 0 ? (
          <p className="muted">Stories from your experience appear here after a “My story” mission.</p>
        ) : (
          <div className="stack">
            {state.stories.map((s) => (
              <details key={s.id}>
                <summary>
                  {s.prompt} <span className="faint">· told {s.tellings}×</span>
                </summary>
                <p>
                  <b>Situation.</b> {s.situation}
                </p>
                <p>
                  <b>Task.</b> {s.task}
                </p>
                <p>
                  <b>Action.</b> {s.action}
                </p>
                <p>
                  <b>Result.</b> {s.result}
                </p>
              </details>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
