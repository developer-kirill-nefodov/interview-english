import { useEffect, useRef, useState, type ReactNode } from "react";
import { Languages, Mic, Square, Volume2 } from "lucide-react";
import { speak, speechRecognitionSupported, useDictation } from "./lib/speech";
import type { Correction } from "./lib/api";
import type { OfflineReview } from "./lib/offlineReview";
import { HINT_LANGS, t, type HintLang } from "./lib/i18n";
import { getState, setHintLang, useStore } from "./lib/store";

export function useStopwatch(running: boolean) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  return [sec, setSec] as const;
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function SpeakButton({ text, label = "Listen", rate }: { text: string; label?: string; rate?: number }) {
  return (
    <button className="btn ghost small" onClick={() => speak(text, rate)} title="Read aloud">
      <Volume2 size={15} /> {label}
    </button>
  );
}

export function PhraseList({ phrases }: { phrases: readonly string[] }) {
  return (
    <ul className="phrases">
      {phrases.map((p) => (
        <li key={p}>
          <button className="icon-btn" onClick={() => speak(p.replace(/…/g, ""))} title="Listen" aria-label={`Listen: ${p}`}>
            <Volume2 size={15} />
          </button>
          <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}

/** Text area with a microphone: speech is appended as it is recognized, and stays editable. */
export function DictationBox(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  onListeningChange?: (on: boolean) => void;
  autoStart?: boolean;
  /** Accessible name of the text box. */
  label?: string;
  /** Secondary-looking mic button, for screens with several boxes. */
  compact?: boolean;
  onType?: () => void;
}) {
  const valueRef = useRef(props.value);
  valueRef.current = props.value;
  const { listening, interim, error, start, stop } = useDictation((text) => {
    const cur = valueRef.current;
    props.onChange(cur ? `${cur.replace(/\s+$/, "")} ${text}` : text);
  });
  useEffect(() => props.onListeningChange?.(listening), [listening]);
  useEffect(() => {
    if (!props.autoStart || !speechRecognitionSupported) return;
    // Wait until the question has been read aloud, so the mic doesn't transcribe it.
    let waited = 0;
    const t = setInterval(() => {
      waited += 200;
      if (waited < 600 || (window.speechSynthesis?.speaking && waited < 20000)) return;
      clearInterval(t);
      start();
    }, 200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="dictation">
      <div className="dictation-bar">
        {speechRecognitionSupported ? (
          listening ? (
            <button className="btn danger" onClick={stop}>
              <Square size={15} /> Stop
            </button>
          ) : (
            <button className={props.compact ? "btn small" : "btn primary"} onClick={start}>
              <Mic size={16} /> Speak
            </button>
          )
        ) : (
          <span className="muted small">Voice input works in Chrome and Edge. Here you can type, but say it out loud too.</span>
        )}
        {listening && <span className="rec">Listening</span>}
      </div>
      <textarea
        rows={props.rows ?? 6}
        value={props.value}
        placeholder={props.placeholder}
        aria-label={props.label ?? "Your answer"}
        onChange={(e) => {
          props.onChange(e.target.value);
          props.onType?.();
        }}
      />
      {interim && <div className="interim">{interim}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export function Score({ label, value }: { label: string; value: number }) {
  const tone = value >= 8 ? "good" : value >= 5 ? "ok" : "bad";
  return (
    <div className={`score ${tone}`}>
      <b>
        {value}
        <span>/10</span>
      </b>
      <small>{label}</small>
    </div>
  );
}

export function Corrections({ items }: { items: Correction[] }) {
  if (!items.length) return null;
  return (
    <div className="corrections">
      {items.map((c, i) => (
        <div key={i} className="correction">
          <div>
            <s>{c.original}</s> → <b>{c.corrected}</b>
          </div>
          <div className="muted small">{c.explanation}</div>
        </div>
      ))}
    </div>
  );
}

/** Rule-based corrections in the shared shape; the hint in the learner's language goes in brackets. */
export const offlineToCorrections = (r: OfflineReview, lang: HintLang = getState().hintLang): Correction[] =>
  r.corrections.map((c) => {
    const hint = t(c.tr, lang);
    return { original: c.found, corrected: c.better, explanation: hint ? `${c.why} (${hint})` : c.why };
  });

export function OfflineFeedback({ review }: { review: OfflineReview }) {
  return (
    <div className="offline">
      <div className="stats">
        <div className="stat">
          <b>{review.words}</b>
          <small>words</small>
        </div>
        {review.wpm !== null && (
          <div className="stat">
            <b>{review.wpm}</b>
            <small>words / min</small>
          </div>
        )}
        <div className="stat">
          <b>{review.fillers.reduce((s, f) => s + f.count, 0)}</b>
          <small>filler words</small>
        </div>
      </div>
      {review.notes.length > 0 && (
        <ul className="notes">
          {review.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {review.corrections.length > 0 && (
        <>
          <h4>Grammar to fix</h4>
          <Corrections items={offlineToCorrections(review)} />
        </>
      )}
      {review.fillers.length > 0 && (
        <p className="small muted">Fillers: {review.fillers.map((f) => `“${f.word}” ×${f.count}`).join(", ")}</p>
      )}
      {review.coveredTerms.length + review.missedTerms.length > 0 && (
        <>
          <h4>Key ideas</h4>
          <div className="chips">
            {review.coveredTerms.map((t) => (
              <span key={t} className="chip ok">
                ✓ {t}
              </span>
            ))}
            {review.missedTerms.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
          <p className="faint small" style={{ marginTop: 8 }}>
            Green: you mentioned it. Grey: a strong answer often mentions it too.
          </p>
        </>
      )}
    </div>
  );
}

export function Card({
  title,
  children,
  actions,
  className = "",
}: {
  title?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="card-head">
          {title && <h3>{title}</h3>}
          {actions && <div className="row">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Bar({ value }: { value: number }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Ring({ value, size = 96, label, sub }: { value: number; size?: number; label: ReactNode; sub?: string }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="ring-label">
        <b>{label}</b>
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

/** Countdown that calls onEnd once when it reaches zero. */
export function useCountdown(seconds: number, running: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (running && left === 0) endRef.current();
  }, [left, running]);
  return [left, setLeft] as const;
}

/** Choose the language for hints and translations. */
export function HintLangPicker({ compact }: { compact?: boolean }) {
  const lang = useStore().hintLang;
  return (
    <label className={`lang-picker ${compact ? "compact" : ""}`}>
      <Languages size={15} aria-hidden />
      {!compact && <span>Hints in</span>}
      <select value={lang} onChange={(e) => setHintLang(e.target.value as HintLang)} aria-label="Language for hints and translations">
        {(Object.keys(HINT_LANGS) as HintLang[]).map((l) => (
          <option key={l} value={l}>
            {HINT_LANGS[l].native}
          </option>
        ))}
      </select>
    </label>
  );
}
