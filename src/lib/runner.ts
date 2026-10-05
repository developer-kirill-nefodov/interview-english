import type { TestCase } from "../data/problems";

export interface TestResult {
  args: unknown[];
  expected: unknown;
  actual?: unknown;
  error?: string;
  passed: boolean;
}

export interface RunResult {
  results: TestResult[];
  logs: string[];
  error?: string;
}

// The worker evaluates user code in isolation so an infinite loop can be killed.
const WORKER_SRC = `
self.onmessage = (e) => {
  const { code, fn, tests } = e.data;
  const logs = [];
  const fmt = (v) => { try { return typeof v === "string" ? v : JSON.stringify(v); } catch { return String(v); } };
  const console = { log: (...a) => logs.push(a.map(fmt).join(" ")), error: (...a) => logs.push(a.map(fmt).join(" ")), warn: (...a) => logs.push(a.map(fmt).join(" ")) };
  const canon = (v, unordered) => {
    if (!unordered || !Array.isArray(v)) return JSON.stringify(v);
    return JSON.stringify(v.map((x) => Array.isArray(x) ? [...x].sort() : x).map((x) => JSON.stringify(x)).sort());
  };
  let fnRef;
  try {
    fnRef = new Function("console", code + "\\n;return typeof " + fn + " === 'function' ? " + fn + " : undefined;")(console);
  } catch (err) {
    self.postMessage({ results: [], logs, error: String(err) });
    return;
  }
  if (!fnRef) {
    self.postMessage({ results: [], logs, error: "Function " + fn + " is not defined." });
    return;
  }
  const results = tests.map((t) => {
    try {
      const actual = fnRef(...structuredClone(t.args));
      return { args: t.args, expected: t.expected, actual, passed: canon(actual, t.unordered) === canon(t.expected, t.unordered) };
    } catch (err) {
      return { args: t.args, expected: t.expected, error: String(err), passed: false };
    }
  });
  self.postMessage({ results, logs });
};
`;

export function runTests(code: string, fn: string, tests: TestCase[], timeoutMs = 3000): Promise<RunResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
    const worker = new Worker(url);
    const done = (r: RunResult) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(r);
    };
    const timer = setTimeout(
      () => done({ results: [], logs: [], error: `Timed out after ${timeoutMs / 1000}s. Is there an infinite loop?` }),
      timeoutMs,
    );
    worker.onmessage = (e) => done(e.data as RunResult);
    worker.onerror = (e) => done({ results: [], logs: [], error: e.message });
    worker.postMessage({ code, fn, tests });
  });
}
