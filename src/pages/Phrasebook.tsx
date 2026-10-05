import { PHRASEBOOK } from "../data/phrases";
import { Volume2 } from "lucide-react";
import { t } from "../lib/i18n";
import { speak } from "../lib/speech";
import { useStore } from "../lib/store";
import { HintLangPicker } from "../components";

export function Phrasebook() {
  const lang = useStore().hintLang;
  return (
    <div className="page">
      <div className="row spread">
        <div className="page-head">
          <span className="eyebrow">Learn</span>
          <h1>Phrasebook</h1>
        </div>
        <HintLangPicker />
      </div>
      <p className="lead">Learn these by heart. Click a phrase to hear it, then repeat it out loud.</p>
      {PHRASEBOOK.map((g) => (
        <section key={g.title} className="card">
          <h3>
            {g.title} {t(g.tr, lang) && <span className="muted small">· {t(g.tr, lang)}</span>}
          </h3>
          <ul className="phrases">
            {g.phrases.map((p) => (
              <li key={p.en}>
                <button className="icon-btn" onClick={() => speak(p.en.replace(/…/g, ""))} aria-label={`Listen: ${p.en}`}>
                  <Volume2 size={15} />
                </button>
                <span>
                  {p.en}
                  {t(p.tr, lang) && <span className="muted small"> — {t(p.tr, lang)}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
