import { useState } from "react";
import { Check, Eye, RotateCcw } from "lucide-react";
import type { Card as SrsCard, Deck } from "../lib/srs";
import { cardFront, gradeCard, useStore } from "../lib/store";
import { speak } from "../lib/speech";
import { Gloss, SpeakButton } from "../components";
import { PATTERNS } from "../data/patterns";
import { tx } from "../lib/i18n";

export const DECK_INFO: Record<Deck, { label: string; prompt: string }> = {
  mistake: { label: "Your mistake", prompt: "Say it correctly, out loud" },
  phrase: { label: "Phrase", prompt: "Say it in English, out loud" },
  pattern: { label: "Pattern", prompt: "Which approach? Say it out loud, with complexity" },
};

export interface WarmupStats {
  /** Cards you'd seen before and graded. */
  reviewed: number;
  remembered: number;
  /** Cards seen for the first time. */
  learned: number;
}

/**
 * Flashcard review: recall out loud, reveal, then grade yourself.
 * Brand-new cards are shown with the answer to read and repeat, not tested.
 */
export function Warmup({
  cards,
  onDone,
  mode = "warmup",
}: {
  cards: SrsCard[];
  onDone: (stats: WarmupStats) => void;
  mode?: "warmup" | "review";
}) {
  const { hintLang } = useStore();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [stats, setStats] = useState<WarmupStats>({ reviewed: 0, remembered: 0, learned: 0 });

  if (!cards.length) {
    return (
      <div className="card flash fade-in">
        <p className="front">Nothing to repeat today.</p>
        <button className="btn primary" style={{ alignSelf: "center" }} onClick={() => onDone(stats)}>
          {mode === "warmup" ? "Go to the main task" : "Done"}
        </button>
      </div>
    );
  }

  const card = cards[i];
  const info = DECK_INFO[card.deck];
  const pattern = card.deck === "pattern" && hintLang !== "none" ? PATTERNS.find((p) => card.id === `pattern:${p.id}`) : undefined;
  const isNew = card.reviews === 0;
  const next = (ok: boolean) => {
    gradeCard(card.id, ok);
    const s = isNew
      ? { ...stats, learned: stats.learned + 1 }
      : { ...stats, reviewed: stats.reviewed + 1, remembered: stats.remembered + (ok ? 1 : 0) };
    setStats(s);
    setShown(false);
    if (i + 1 >= cards.length) onDone(s);
    else setI(i + 1);
  };

  return (
    <div className="stack">
      <div className="row spread">
        <span className="muted small">
          Card {i + 1} of {cards.length}
        </span>
        <button className="btn ghost small" onClick={() => onDone(stats)}>
          {mode === "warmup" ? "Skip warm-up" : "End review"}
        </button>
      </div>
      <div className="card flash fade-in" key={card.id}>
        <div className="row" style={{ justifyContent: "center", gap: 6 }}>
          <span className="chip accent deck">{info.label}</span>
          {isNew && <span className="chip ok deck">New</span>}
        </div>
        <div className="front">{card.deck === "mistake" ? <s className="faint">{card.front}</s> : cardFront(card, hintLang)}</div>
        {card.deck === "pattern" && <Gloss en={card.front} block />}
        {isNew ? (
          <>
            <div className="back">{card.back}</div>
            {pattern && (
              <p className="gloss">
                {tx(pattern.name, hintLang)}. {tx(pattern.answer, hintLang)}
              </p>
            )}
            {card.note && <p className="muted small">{card.note}</p>}
            <p className="muted small">New card: listen, then say it out loud twice. Next time you'll recall it on your own.</p>
            <div className="row" style={{ justifyContent: "center" }}>
              <SpeakButton text={card.back} />
              <button className="btn good" onClick={() => next(true)}>
                <Check size={16} /> Got it
              </button>
            </div>
          </>
        ) : !shown ? (
          <>
            <p className="muted small">
              {info.prompt}
              <Gloss en={info.prompt} block />
            </p>
            <button
              className="btn primary"
              style={{ alignSelf: "center" }}
              onClick={() => {
                setShown(true);
                speak(card.back);
              }}
            >
              <Eye size={16} /> Show answer
            </button>
          </>
        ) : (
          <>
            <div className="back">{card.back}</div>
            {pattern && (
              <p className="gloss">
                {tx(pattern.name, hintLang)}. {tx(pattern.answer, hintLang)}
              </p>
            )}
            {card.note && <p className="muted small">{card.note}</p>}
            <div className="row" style={{ justifyContent: "center" }}>
              <SpeakButton text={card.back} />
            </div>
            <div className="row" style={{ justifyContent: "center" }}>
              <button className="btn" onClick={() => next(false)}>
                <RotateCcw size={16} /> Forgot
              </button>
              <button className="btn good" onClick={() => next(true)}>
                <Check size={16} /> Remembered
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
