import { useCallback, useEffect, useRef, useState } from "react";

export function speak(text: string, rate = 0.95) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  const voice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang === "en-US" && /natural|google|samantha/i.test(v.name));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
};

function createRecognition(): Recognition | null {
  const w = window as any;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? (new Ctor() as Recognition) : null;
}

export const speechRecognitionSupported =
  typeof window !== "undefined" &&
  Boolean((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition);

/**
 * Continuous English speech-to-text. `transcript` accumulates final results;
 * `interim` holds the phrase currently being recognized.
 */
export function useDictation(onAppend: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const wantRef = useRef(false);
  const appendRef = useRef(onAppend);
  appendRef.current = onAppend;

  const start = useCallback(() => {
    const rec = createRecognition();
    if (!rec) {
      setError("Speech recognition isn't supported in this browser. Try Chrome or Edge, or type your answer.");
      return;
    }
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) appendRef.current(r[0].transcript.trim());
        else live += r[0].transcript;
      }
      setInterim(live);
    };
    rec.onerror = (e) => {
      // Silence and our own abort are normal; anything else would just loop, so stop.
      if (e.error === "no-speech" || e.error === "aborted") return;
      wantRef.current = false;
      setError(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Microphone access was blocked. Allow it in the browser and try again."
          : e.error === "audio-capture"
            ? "No microphone found. Plug one in, or type your answer."
            : "Speech recognition stopped working (it needs the internet in Chrome). You can type your answer.",
      );
    };
    // Chrome stops after silence; restart while the user still wants to dictate.
    rec.onend = () => {
      setInterim("");
      // Only the current recognizer restarts, so a quick Stop → Speak never runs two at once.
      if (wantRef.current && recRef.current === rec) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      if (recRef.current === rec) setListening(false);
    };
    recRef.current = rec;
    wantRef.current = true;
    setError(null);
    rec.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(
    () => () => {
      // abort() drops pending results, and the no-op stops a late result from landing in the next answer box.
      wantRef.current = false;
      appendRef.current = () => {};
      recRef.current?.abort();
    },
    [],
  );

  return { listening, interim, error, start, stop };
}
