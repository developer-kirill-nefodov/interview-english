import { BookOpenText, Code2, Footprints, Mic, Repeat2, Timer, Trophy, Waypoints, type LucideIcon } from "lucide-react";
import { FORMATS, type Format } from "../lib/mission";

const ICONS: Record<Format, LucideIcon> = {
  blitz: Timer,
  interview: Mic,
  approach: Waypoints,
  coding: Code2,
  shadowing: Repeat2,
  story: BookOpenText,
  final: Trophy,
};

export function Practice({ go, onFormat }: { go: (r: string) => void; onFormat: (f: Format) => void }) {
  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">Free practice</span>
        <h1>Practice anything</h1>
        <p className="lead">The daily mission is the main path. Use this when you want something specific. It doesn't move you through the hiring stages.</p>
      </div>
      <div className="grid-2">
        <button className="card mode" onClick={() => go("interview")}>
          <span className="mode-icon">
            <Mic size={22} />
          </span>
          <h3>Mock interview</h3>
          <span className="muted small">Pick topics and level, answer 3–10 questions in a row.</span>
        </button>
        <button className="card mode" onClick={() => go("coding")}>
          <span className="mode-icon">
            <Code2 size={22} />
          </span>
          <h3>Live coding</h3>
          <span className="muted small">Choose a problem, code in the browser, run tests, think aloud.</span>
        </button>
      </div>
      <h2 style={{ marginTop: 10 }}>Formats</h2>
      <div className="grid">
        {(Object.keys(FORMATS) as Format[]).map((f) => {
          const Icon = ICONS[f] ?? Footprints;
          return (
            <button key={f} className="card mode" onClick={() => onFormat(f)}>
              <span className="mode-icon">
                <Icon size={22} />
              </span>
              <h3>{FORMATS[f].title}</h3>
              <span className="muted small">{FORMATS[f].blurb}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
