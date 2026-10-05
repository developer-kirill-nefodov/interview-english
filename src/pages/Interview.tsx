import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { CATEGORY_LABELS, QUESTIONS, type Category, type Question } from "../data/questions";
import { addHistory } from "../lib/storage";
import { addMistakeCards } from "../lib/store";
import { Card, Corrections, Score, fmtTime } from "../components";
import { AnswerTask, correctionsOf, type AnswerResult, type TaskQuestion } from "../mission/AnswerTask";
import { toTaskQuestion } from "../mission/formats";

type Level = Question["level"];

interface Settings {
  categories: Category[];
  levels: Level[];
  count: number;
  listening: boolean;
}

function shuffle<T>(a: T[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function Interview({ ai }: { ai: boolean }) {
  const [settings, setSettings] = useState<Settings>({
    categories: ["behavioral", "frontend"],
    levels: ["junior", "middle"],
    count: 5,
    listening: false,
  });
  const [queue, setQueue] = useState<TaskQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<AnswerResult[]>([]);

  const pool = useMemo(
    () => QUESTIONS.filter((q) => settings.categories.includes(q.category) && settings.levels.includes(q.level)),
    [settings],
  );

  if (!queue)
    return (
      <Setup
        settings={settings}
        setSettings={setSettings}
        poolSize={pool.length}
        onStart={() => {
          setQueue(shuffle(pool).slice(0, settings.count).map(toTaskQuestion));
          setIndex(0);
          setResults([]);
        }}
      />
    );

  if (index >= queue.length) return <Summary results={results} onRestart={() => setQueue(null)} />;

  return (
    <div className="page">
      <div className="row spread">
        <span className="muted">
          Question {index + 1} of {queue.length}
        </span>
        <button className="btn ghost small" onClick={() => setIndex(queue.length)}>
          <X size={16} /> Finish session
        </button>
      </div>
      <AnswerTask
        key={index}
        question={queue[index]}
        ai={ai}
        label={queue[index].category}
        hideText={settings.listening}
        continueLabel={index + 1 < queue.length ? "Next question" : "Finish"}
        onFollowUp={(text) => {
          const base = queue[index];
          const follow: TaskQuestion = {
            text,
            category: base.category,
            tips: ["This is a follow-up. Answer briefly and connect it to what you said before."],
            keyTerms: [],
          };
          setQueue([...queue.slice(0, index + 1), follow, ...queue.slice(index + 1)]);
        }}
        onDone={(r) => {
          setResults((prev) => [...prev, r]);
          addMistakeCards(correctionsOf(r).slice(0, 2));
          setIndex(index + 1);
        }}
      />
    </div>
  );
}

function Setup(props: { settings: Settings; setSettings: (s: Settings) => void; poolSize: number; onStart: () => void }) {
  const { settings: s, setSettings } = props;
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">Free practice</span>
        <h1>Mock interview</h1>
        <p className="lead">
          The interviewer asks a question out loud. You answer by voice (or typing), then get feedback on both the content and your English.
        </p>
      </div>
      <Card title="Topics">
        <div className="chips">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <button
              key={c}
              className={`chip toggle ${s.categories.includes(c) ? "on" : ""}`}
              onClick={() => setSettings({ ...s, categories: toggle(s.categories, c) })}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </Card>
      <Card title="Level">
        <div className="chips">
          {(["junior", "middle", "senior"] as Level[]).map((l) => (
            <button
              key={l}
              className={`chip toggle ${s.levels.includes(l) ? "on" : ""}`}
              onClick={() => setSettings({ ...s, levels: toggle(s.levels, l) })}
            >
              {l}
            </button>
          ))}
        </div>
      </Card>
      <Card title="Session">
        <label className="field">
          Questions
          <select value={s.count} onChange={(e) => setSettings({ ...s, count: Number(e.target.value) })}>
            {[3, 5, 7, 10].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={s.listening} onChange={(e) => setSettings({ ...s, listening: e.target.checked })} />
          Listening mode: hide the question text, so you have to understand it by ear, like on a real call
        </label>
      </Card>
      <div className="row">
        <button className="btn primary big" disabled={props.poolSize === 0} onClick={props.onStart}>
          Start interview
        </button>
        <span className="muted">{props.poolSize} questions match</span>
      </div>
    </div>
  );
}

function Summary({ results, onRestart }: { results: AnswerResult[]; onRestart: () => void }) {
  const avg = (key: "english_score" | "content_score") => {
    const xs = results.filter((r) => r.ai).map((r) => r.ai![key]);
    return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;
  };
  const totalSec = results.reduce((s, r) => s + r.durationSec, 0);
  const words = results.reduce((s, r) => s + r.offline.words, 0);
  const english = avg("english_score");
  const content = avg("content_score");

  const saved = useRef(false);
  useEffect(() => {
    if (!results.length || saved.current) return;
    saved.current = true;
    const scores: Record<string, number> = {};
    if (english !== null) scores.English = english;
    if (content !== null) scores.Content = content;
    addHistory({ kind: "interview", title: `${results.length} questions`, durationSec: totalSec, scores });
  }, []);

  const allCorrections = results.flatMap(correctionsOf);

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">Mock interview</span>
        <h1>Session complete</h1>
      </div>
      <Card>
        <div className="row">
          {english !== null && <Score label="English" value={english} />}
          {content !== null && <Score label="Content" value={content} />}
          <div className="score">
            <b>{results.length}</b>
            <small>answers</small>
          </div>
          <div className="score">
            <b>{fmtTime(totalSec)}</b>
            <small>speaking</small>
          </div>
          <div className="score">
            <b>{words}</b>
            <small>words</small>
          </div>
        </div>
      </Card>
      {allCorrections.length > 0 && (
        <Card title="Your English mistakes this session">
          <Corrections items={allCorrections} />
          <p className="faint small" style={{ marginTop: 10 }}>
            The first two from each answer were added to your cards.
          </p>
        </Card>
      )}
      <div>
        <button className="btn primary big" onClick={onRestart}>
          New session
        </button>
      </div>
    </div>
  );
}
