import { useState } from "react";
import { PHRASEBOOK } from "../data/phrases";
import { Volume2 } from "lucide-react";
import { speak } from "../lib/speech";

export function Phrasebook() {
  const [showRu, setShowRu] = useState(true);
  return (
    <div className="page">
      <div className="row spread">
        <div className="page-head">
          <span className="eyebrow">Learn</span>
          <h1>Phrasebook</h1>
        </div>
        <label className="check">
          <input type="checkbox" checked={showRu} onChange={(e) => setShowRu(e.target.checked)} /> Russian
        </label>
      </div>
      <p className="lead">Learn these by heart. Click a phrase to hear it, then repeat it out loud.</p>
      {PHRASEBOOK.map((g) => (
        <section key={g.title} className="card">
          <h3>
            {g.title} {showRu && <span className="muted small">· {g.ru}</span>}
          </h3>
          <ul className="phrases">
            {g.phrases.map((p) => (
              <li key={p.en}>
                <button className="icon-btn" onClick={() => speak(p.en.replace(/…/g, ""))} aria-label={`Listen: ${p.en}`}>
                  <Volume2 size={15} />
                </button>
                <span>
                  {p.en}
                  {showRu && <span className="muted small"> — {p.ru}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
