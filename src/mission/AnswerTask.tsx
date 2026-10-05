import { useEffect, useState } from "react";
import { ChevronRight, Lightbulb, RotateCcw, Snail, UserRound } from "lucide-react";
import { reviewAnswer, type AnswerReview, type Correction } from "../lib/api";
import { reviewSpeech, type OfflineReview } from "../lib/offlineReview";
import { speak, stopSpeaking } from "../lib/speech";
import {
  Card,
  Corrections,
  DictationBox,
  OfflineFeedback,
  PhraseList,
  Score,
  SpeakButton,
  fmtTime,
  offlineToCorrections,
  useStopwatch,
} from "../components";

export interface TaskQuestion {
  text: string;
  category: string;
  ru?: string;
  tips?: string[];
  phrases?: string[];
  sample?: string;
  /** Heading for the sample; "Model answer" unless it's something else, like your own notes. */
  sampleTitle?: string;
  keyTerms?: string[];
}

export interface AnswerResult {
  answer: string;
  durationSec: number;
  offline: OfflineReview;
  ai?: AnswerReview;
  aiError?: string;
}

export function correctionsOf(r: AnswerResult): Correction[] {
  return r.ai ? r.ai.corrections : offlineToCorrections(r.offline);
}

/** Ask the AI interviewer for a review; never throws, so offline feedback always works. */
export async function reviewAll(q: TaskQuestion, answer: string, durationSec: number, ai: boolean): Promise<AnswerResult> {
  const offline = reviewSpeech(answer, durationSec || null, q.keyTerms ?? []);
  const base: AnswerResult = { answer, durationSec, offline };
  if (!ai) return base;
  try {
    return { ...base, ai: await reviewAnswer({ question: q.text, category: q.category, answer, durationSec: durationSec || undefined }) };
  } catch (e) {
    return { ...base, aiError: e instanceof Error ? e.message : String(e) };
  }
}

/** One interview question: listen, answer out loud, get feedback. */
export function AnswerTask(props: {
  question: TaskQuestion;
  ai: boolean;
  label?: string;
  hideText?: boolean;
  continueLabel?: string;
  /** When set, the AI's follow-up question gets an "Answer it" button. */
  onFollowUp?: (question: string) => void;
  onDone: (r: AnswerResult) => void;
}) {
  const q = props.question;
  const [answer, setAnswer] = useState("");
  const [recording, setRecording] = useState(false);
  const [sec, setSec] = useStopwatch(recording);
  const [showText, setShowText] = useState(!props.hideText);
  const [showRu, setShowRu] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => speak(q.text), 300);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [q.text]);

  const submit = async () => {
    setBusy(true);
    setResult(await reviewAll(q, answer, sec, props.ai));
    setBusy(false);
  };

  return (
    <div className="stack fade-in">
      <Card>
        <div className="interviewer">
          <div className="avatar">
            <UserRound size={22} />
          </div>
          <div className="bubble">
            {props.label && <span className="eyebrow">{props.label}</span>}
            {showText ? <p className="question">{q.text}</p> : <p className="question hidden">• • • listen</p>}
            {showRu && q.ru && <p className="muted">{q.ru}</p>}
            <div className="row">
              <SpeakButton text={q.text} label="Repeat" />
              <button className="btn ghost small" onClick={() => speak(q.text, 0.75)}>
                <Snail size={15} /> Slower
              </button>
              {!showText && (
                <button className="btn ghost small" onClick={() => setShowText(true)}>
                  Show text
                </button>
              )}
              {q.ru && (
                <button className="btn ghost small" onClick={() => setShowRu(!showRu)}>
                  RU
                </button>
              )}
              {(q.tips?.length || q.phrases?.length) && (
                <button className="btn ghost small" onClick={() => setShowTips(!showTips)}>
                  <Lightbulb size={15} /> Hints
                </button>
              )}
            </div>
          </div>
        </div>
        {showTips && (
          <div className="tips">
            {q.tips && (
              <ul>
                {q.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            {q.phrases && (
              <>
                <h4>Useful phrases</h4>
                <PhraseList phrases={q.phrases} />
              </>
            )}
          </div>
        )}
      </Card>

      {!result && (
        <Card title="Your answer" actions={<span className="timer">{fmtTime(sec)}</span>}>
          <DictationBox
            value={answer}
            onChange={setAnswer}
            onListeningChange={setRecording}
            placeholder="Press Speak and answer out loud. The text appears here and you can edit it."
          />
          <div className="row">
            <button className="btn primary" disabled={!answer.trim() || recording || busy} onClick={submit}>
              {busy ? "Reviewing…" : "Get feedback"}
            </button>
          </div>
        </Card>
      )}

      {result && (
        <>
          <Card title="Feedback">
            {result.aiError && <p className="error">AI feedback failed: {result.aiError}. Showing quick checks only.</p>}
            {result.ai ? (
              <AiAnswerFeedback
                review={result.ai}
                onFollowUp={
                  props.onFollowUp &&
                  ((text) => {
                    props.onFollowUp!(text);
                    props.onDone(result);
                  })
                }
              />
            ) : (
              <>
                {!props.ai && (
                  <p className="note">Quick offline checks. With an Anthropic API key on the server you also get a full review from an AI interviewer.</p>
                )}
                <OfflineFeedback review={result.offline} />
              </>
            )}
            {result.ai && (
              <details>
                <summary>Quick checks</summary>
                <OfflineFeedback review={result.offline} />
              </details>
            )}
          </Card>
          {q.sample && (
            <Card title={q.sampleTitle ?? "Model answer"} actions={<SpeakButton text={q.sample} />}>
              <p>{q.sample}</p>
              {q.phrases && (
                <>
                  <h4>Phrases to steal</h4>
                  <PhraseList phrases={q.phrases} />
                </>
              )}
            </Card>
          )}
          <div className="row">
            <button
              className="btn ghost"
              onClick={() => {
                setResult(null);
                setAnswer("");
                setSec(0);
              }}
            >
              <RotateCcw size={16} /> Try again
            </button>
            <button className="btn primary" onClick={() => props.onDone(result)}>
              {props.continueLabel ?? "Continue"} <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AiAnswerFeedback({ review, onFollowUp }: { review: AnswerReview; onFollowUp?: (q: string) => void }) {
  return (
    <div className="stack">
      <div className="row">
        <Score label="English" value={review.english_score} />
        <Score label="Content" value={review.content_score} />
      </div>
      <p>{review.summary}</p>
      <div className="grid-2">
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
      {review.corrections.length > 0 && (
        <div>
          <h4>English corrections</h4>
          <Corrections items={review.corrections} />
        </div>
      )}
      <div>
        <h4 className="row">
          A stronger version of your answer <SpeakButton text={review.better_version} />
        </h4>
        <p className="better">{review.better_version}</p>
      </div>
      {review.useful_phrases.length > 0 && (
        <div>
          <h4>Useful phrases</h4>
          <PhraseList phrases={review.useful_phrases} />
        </div>
      )}
      <div className="follow-up">
        <span>
          <b>Follow-up:</b> {review.follow_up_question}
        </span>
        <div className="row">
          <SpeakButton text={review.follow_up_question} />
          {onFollowUp && (
            <button className="btn small" onClick={() => onFollowUp(review.follow_up_question)}>
              Answer it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
