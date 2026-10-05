import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, ChevronDown, ChevronRight, Circle, PartyPopper, Play } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { CODING_STEPS, PROBLEMS, type Problem } from "../data/problems";
import { reviewCoding, type CodingReview } from "../lib/api";
import { reviewExplanation, reviewSpeech } from "../lib/offlineReview";
import { runTests, type RunResult } from "../lib/runner";
import { speak, stopSpeaking } from "../lib/speech";
import { addHistory } from "../lib/storage";
import { markSolved, useStore } from "../lib/store";
import { t } from "../lib/i18n";
import type { TaskResult } from "../mission/formats";
import {
  Card,
  Corrections,
  DictationBox,
  PhraseList,
  Score,
  SpeakButton,
  fmtTime,
  offlineToCorrections,
  useStopwatch,
} from "../components";

export function LiveCoding({ ai }: { ai: boolean }) {
  const [problem, setProblem] = useState<Problem | null>(null);
  if (!problem) return <ProblemList onPick={setProblem} />;
  return <Workspace key={problem.id} problem={problem} ai={ai} onExit={() => setProblem(null)} />;
}

function ProblemList({ onPick }: { onPick: (p: Problem) => void }) {
  const { solved, hintLang } = useStore();
  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">Free practice</span>
        <h1>Live coding</h1>
      </div>
      <p className="lead">
        Solve a problem in JavaScript while explaining your thinking out loud in English, like in a real interview. Turn on the microphone
        and keep talking: clarify → approach → code → test → complexity.
      </p>
      <div className="grid">
        {PROBLEMS.map((p) => (
          <button key={p.id} className="card problem-card" onClick={() => onPick(p)}>
            <div className="row spread">
              <b>{p.title}</b>
              <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>
            </div>
            <span className="muted small clamp-2" title={t(p.tr, hintLang)}>
              {p.statement.replace(/`/g, "")}
            </span>
            {solved.includes(p.id) && (
              <span className="chip ok" style={{ alignSelf: "flex-start" }}>
                <BadgeCheck size={14} /> solved
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const prefersDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches;

export function Workspace({
  problem,
  ai,
  onExit,
  onComplete,
}: {
  problem: Problem;
  ai: boolean;
  onExit: () => void;
  onComplete?: (r: TaskResult) => void;
}) {
  const { hintLang } = useStore();
  const [code, setCode] = useState(problem.starter);
  const [run, setRun] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [hints, setHints] = useState(0);
  const [showClarify, setShowClarify] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finished, setFinished] = useState(false);
  const [nudged, setNudged] = useState(false);
  const [sec] = useStopwatch(!finished);
  // Survives "Back to code", so finishing again with the same code doesn't re-run the AI or log twice.
  const memo = useRef<Memo | null>(null);
  const logged = useRef(false);

  const leave = () => {
    if (code === problem.starter || window.confirm("Leave this problem? Your code won't be saved.")) onExit();
  };
  const finish = () => {
    if (!transcript.trim() && !nudged) {
      setNudged(true);
      return;
    }
    setFinished(true);
  };

  useEffect(() => {
    const t = setTimeout(() => speak(`${problem.title}. ${problem.statement.replace(/`/g, "")}`), 400);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [problem]);

  const doRun = async () => {
    setRunning(true);
    setRun(await runTests(code, problem.fn, problem.tests));
    setRunning(false);
  };

  const passed = run?.results.filter((r) => r.passed).length ?? 0;
  const current = CODING_STEPS[step];

  if (finished)
    return (
      <Results
        problem={problem}
        code={code}
        transcript={transcript}
        durationSec={sec}
        ai={ai}
        onBack={() => setFinished(false)}
        onExit={onExit}
        onComplete={onComplete}
        memo={memo}
        logged={logged}
      />
    );

  return (
    <div className="page wide">
      <div className="row spread">
        {onComplete ? (
          <span />
        ) : (
          <button className="btn ghost small" onClick={leave}>
            <ArrowLeft size={16} /> Problems
          </button>
        )}
        <span className="timer">{fmtTime(sec)}</span>
      </div>
      <div className="workspace">
        <div className="col ws-problem">
          <Card
            title={
              <>
                {problem.title} <span className={`badge ${problem.difficulty}`}>{problem.difficulty}</span>
              </>
            }
            actions={<SpeakButton text={`${problem.title}. ${problem.statement.replace(/`/g, "")}`} />}
          >
            <p>{problem.statement.split("`").map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}</p>
            {t(problem.tr, hintLang) && <p className="muted small">{t(problem.tr, hintLang)}</p>}
            <pre className="examples">{problem.examples.join("\n")}</pre>
          </Card>
        </div>

        <div className="col ws-help">
          <Card title="Interview steps">
            <div className="steps">
              {CODING_STEPS.map((s, i) => (
                <button key={s.key} className={`step ${i === step ? "on" : ""} ${i < step ? "done" : ""}`} onClick={() => setStep(i)}>
                  {s.title}
                </button>
              ))}
            </div>
            <p>
              <b>{current.goal}</b>
            </p>
            <PhraseList phrases={current.phrases} />
            {step === 0 && (
              <div className="reveal">
                <button className="btn small" aria-expanded={showClarify} onClick={() => setShowClarify(!showClarify)}>
                  Questions a strong candidate would ask <ChevronDown size={15} className={showClarify ? "flip" : ""} />
                </button>
                {showClarify && <PhraseList phrases={problem.clarify} />}
              </div>
            )}
            {step < CODING_STEPS.length - 1 && (
              <button className="btn small" onClick={() => setStep(step + 1)}>
                Next step <ChevronRight size={15} />
              </button>
            )}
          </Card>

          <Card
            title="Hints"
            actions={
              hints < problem.hints.length && (
                <button className="btn ghost small" onClick={() => setHints(hints + 1)}>
                  Show hint {hints + 1}/{problem.hints.length}
                </button>
              )
            }
          >
            {hints === 0 ? (
              <p className="muted small">Try to ask the interviewer first: “Could you give me a hint?”</p>
            ) : (
              <ol>
                {problem.hints.slice(0, hints).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="col ws-code">
          <div className="editor">
            <CodeMirror
              value={code}
              height="340px"
              theme={prefersDark() ? oneDark : "light"}
              extensions={[javascript()]}
              onChange={setCode}
              basicSetup={{ tabSize: 2 }}
            />
          </div>
          <div className="row">
            <button className="btn primary" onClick={doRun} disabled={running}>
              <Play size={15} /> Run tests
            </button>
            {run && !run.error && (
              <span className={passed === run.results.length ? "ok-text" : "bad-text"}>
                {passed}/{run.results.length} passed
              </span>
            )}
          </div>
          {run && <TestOutput run={run} />}

          <Card title="Think aloud" actions={<span className="muted small">Keep the mic on while you code</span>}>
            <DictationBox
              value={transcript}
              onChange={setTranscript}
              rows={6}
              label="Your explanation"
              placeholder="Explain your clarifying questions, approach, and complexity here, by voice or by typing."
            />
          </Card>
          {nudged && !transcript.trim() && (
            <p className="note">
              You haven't explained anything yet. In a real interview, talking through your approach counts as much as the code. Say a
              couple of sentences, or press Finish again to skip.
            </p>
          )}
          <button className="btn primary big" onClick={finish}>
            Finish and get feedback
          </button>
        </div>
      </div>
    </div>
  );
}

function TestOutput({ run }: { run: RunResult }) {
  return (
    <div className="tests">
      {run.error && <div className="error">{run.error}</div>}
      {run.results.map((r, i) => (
        <div key={i} className={`test ${r.passed ? "pass" : "fail"}`}>
          <span>{r.passed ? "✓" : "✗"}</span>
          <code>
            ({r.args.map((a) => JSON.stringify(a)).join(", ")}) → expected {JSON.stringify(r.expected)}
            {!r.passed && (r.error ? `, threw ${r.error}` : `, got ${JSON.stringify(r.actual) ?? "undefined"}`)}
          </code>
        </div>
      ))}
      {run.logs.length > 0 && <pre className="logs">{run.logs.join("\n")}</pre>}
    </div>
  );
}

interface Memo {
  key: string;
  run: RunResult;
  review: CodingReview | null;
}

function Results(props: {
  problem: Problem;
  code: string;
  transcript: string;
  durationSec: number;
  ai: boolean;
  onBack: () => void;
  onExit: () => void;
  onComplete?: (r: TaskResult) => void;
  memo: { current: Memo | null };
  logged: { current: boolean };
}) {
  const { problem } = props;
  const [run, setRun] = useState<RunResult | null>(null);
  const [review, setReview] = useState<CodingReview | null>(null);
  const [error, setError] = useState("");
  const checks = reviewExplanation(props.transcript, problem.complexity);
  const speech = reviewSpeech(props.transcript, null, []);

  useEffect(() => {
    (async () => {
      const key = `${props.code}\n---\n${props.transcript}`;
      if (props.memo.current?.key === key) {
        setRun(props.memo.current.run);
        setReview(props.memo.current.review);
        return;
      }
      const r = await runTests(props.code, problem.fn, problem.tests);
      setRun(r);
      const passed = r.results.filter((x) => x.passed).length;
      if (passed === problem.tests.length) markSolved(problem.id);
      let aiReview: CodingReview | null = null;
      if (props.ai) {
        try {
          aiReview = await reviewCoding({
            title: problem.title,
            statement: problem.statement,
            code: props.code,
            explanation: props.transcript,
            testsPassed: passed,
            testsTotal: problem.tests.length,
          });
          setReview(aiReview);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
      props.memo.current = { key, run: r, review: aiReview };
      // In a mission, the mission itself goes into the history.
      if (!props.onComplete && !props.logged.current) {
        props.logged.current = true;
        const scores: Record<string, number> = {};
        if (aiReview) {
          scores.Communication = aiReview.communication_score;
          scores.Code = aiReview.code_score;
        }
        addHistory({ kind: "coding", title: problem.title, durationSec: props.durationSec, scores });
      }
    })();
  }, []);

  const passed = run?.results.filter((r) => r.passed).length ?? 0;
  const solved = Boolean(run) && passed === problem.tests.length;

  return (
    <div className="page">
      {solved ? (
        <div className="card celebrate fade-in">
          <div className="big-icon">
            <PartyPopper size={36} />
          </div>
          <h1>
            Solved! {passed}/{problem.tests.length} tests pass
          </h1>
          <p className="muted">{problem.title} works. Below is how your explanation sounded.</p>
        </div>
      ) : (
        <div className="page-head">
          <span className="eyebrow">Live coding</span>
          <h1>{problem.title}: results</h1>
        </div>
      )}
      <Card>
        <div className="row">
          <div className="score">
            <b>
              {run ? passed : "…"}/{problem.tests.length}
            </b>
            <small>tests</small>
          </div>
          <div className="score">
            <b>{fmtTime(props.durationSec)}</b>
            <small>time</small>
          </div>
          {review && <Score label="Communication" value={review.communication_score} />}
          {review && <Score label="Code" value={review.code_score} />}
        </div>
      </Card>

      {props.ai && !review && !error && <p className="muted">The AI interviewer is reviewing your solution…</p>}
      {error && <p className="error">AI feedback failed: {error}</p>}

      {review && (
        <Card title="Interviewer feedback">
          <p>{review.summary}</p>
          <div className="two-col">
            <div>
              <h4>Strengths</h4>
              <ul>
                {review.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>To improve</h4>
              <ul>
                {review.improvements.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <h4>Complexity</h4>
          <p>{review.complexity_check}</p>
          {review.corrections.length > 0 && (
            <>
              <h4>English corrections</h4>
              <Corrections items={review.corrections} />
            </>
          )}
          <h4 className="row">
            How to explain it out loud <SpeakButton text={review.model_explanation} />
          </h4>
          <p className="better">{review.model_explanation}</p>
          <div className="follow-up">
            <span>
              <b>Follow-up:</b> {review.follow_up_question}
            </span>
            <SpeakButton text={review.follow_up_question} />
          </div>
        </Card>
      )}

      <Card title="Bonus points: how you explained it">
        <ul className="checklist">
          {checks.map((c) => (
            <li key={c.text} className={c.ok ? "ok" : "miss"}>
              {c.ok ? <BadgeCheck size={17} /> : <Circle size={17} />} {c.text}
            </li>
          ))}
        </ul>
        <p className="muted small">
          Optimal: time {problem.complexity.time}, space {problem.complexity.space}.
        </p>
        {!props.ai && (
          <p className="muted small">
            Offline checks only. Add an Anthropic API key on the server for a full review of your code and English.
          </p>
        )}
      </Card>

      {run && <TestOutput run={run} />}

      <div className="row">
        <button className="btn ghost" onClick={props.onBack}>
          <ArrowLeft size={16} /> Back to code
        </button>
        {props.onComplete ? (
          <button
            className="btn primary"
            onClick={() =>
              props.onComplete!({
                corrections: review ? review.corrections : offlineToCorrections(speech),
                words: speech.words,
              })
            }
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn primary" onClick={props.onExit}>
            Next problem <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
