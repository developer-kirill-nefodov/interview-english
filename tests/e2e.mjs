// End-to-end check of the real app in a real browser: real server, real code paths, no mocks.
// Speech recognition can't run headless, so answers are typed into the same text boxes.
// Usage: npm run e2e   (builds first; screenshots go to tests/screenshots/)
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shots = path.join(root, "tests", "screenshots");
mkdirSync(shots, { recursive: true });
const PORT = 5199;
const BASE = `http://localhost:${PORT}`;

const ANSWER =
  "I am agree that measuring first is important. I have 3 years experience with React. First, I would check the network tab and the bundle size, then add lazy loading and a cache. As a result, the page would load faster, and I would verify it with Lighthouse.";
const EXPLAIN =
  "The brute-force approach checks every pair, which is O(n squared). Instead, I would use a hash map, two pointers, a stack, a window, a heap or sorting depending on the problem, so the time complexity is O(n) and the space complexity is O(n) memory in the worst case. Let me walk through an example to check the edge cases.";
const SOLUTIONS = {
  "Two Sum": "function twoSum(nums, target) {\nconst seen = new Map();\nfor (let i = 0; i < nums.length; i++) {\nif (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];\nseen.set(nums[i], i);\n}\n}",
  "Valid Parentheses": "function isValid(s) {\nconst st = []; const m = { ')': '(', ']': '[', '}': '{' };\nfor (const c of s) { if ('([{'.includes(c)) st.push(c); else if (st.pop() !== m[c]) return false; }\nreturn st.length === 0;\n}",
  "Valid Palindrome": "function isPalindrome(s) {\nconst t = s.toLowerCase().replace(/[^a-z0-9]/g, '');\nreturn t === [...t].reverse().join('');\n}",
  "Group Anagrams": "function groupAnagrams(words) {\nconst m = new Map();\nfor (const w of words) { const k = [...w].sort().join(''); if (!m.has(k)) m.set(k, []); m.get(k).push(w); }\nreturn [...m.values()].map((g) => g.sort());\n}",
  "Merge Intervals": "function merge(intervals) {\nconst a = [...intervals].sort((x, y) => x[0] - y[0]); const out = [];\nfor (const [s, e] of a) { if (out.length && s <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], e); else out.push([s, e]); }\nreturn out;\n}",
  "Maximum Subarray": "function maxSubArray(nums) {\nlet cur = nums[0], best = nums[0];\nfor (let i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); best = Math.max(best, cur); }\nreturn best;\n}",
};

const results = [];
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    results.push(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    results.push(`  ✗ ${name}\n      ${String(e.message ?? e).split("\n")[0]}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Test the production build, the way the app is actually served.
const build = spawn("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
if ((await new Promise((r) => build.on("exit", r))) !== 0) throw new Error("build failed");
const server = spawn("npx", ["tsx", "server/index.ts"], {
  cwd: root,
  env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), ANTHROPIC_API_KEY: "", ANTHROPIC_AUTH_TOKEN: "" },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true, // own process group, so the server and its children all stop at the end
});
const stopServer = () => {
  try {
    process.kill(-server.pid);
  } catch {}
};
process.on("exit", stopServer);
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("server did not start")), 30000);
  server.stdout.on("data", (d) => String(d).includes("running at") && (clearTimeout(t), resolve()));
});

const browser = await chromium.launch();
const errors = [];
const newPage = async (opts = {}) => {
  // Reduced motion: screenshots without half-faded content, and it exercises that CSS path too.
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, reducedMotion: "reduce", ...opts });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("dialog", (d) => d.accept()); // "Leave? Your answers won't be saved" → yes
  return page;
};

// ── Format drivers ─────────────────────────────────────────
async function answerTask(page, nextLabel) {
  await page.locator(".dictation textarea").first().fill(ANSWER);
  await page.getByRole("button", { name: "Get feedback" }).click();
  await page.getByRole("button", { name: nextLabel ?? "Continue" }).click();
}

async function runMain(page) {
  const title = (await page.locator(".page-head h1").first().textContent()).trim();
  switch (title) {
    case "Blitz": {
      for (let k = 0; k < 10; k++) {
        const next = page.getByRole("button", { name: /^(Next question|Finish)$/ });
        if (!(await next.count())) break;
        await page.locator(".dictation textarea").fill(ANSWER);
        await next.click();
      }
      await page.getByText("Blitz results").waitFor();
      await page.getByRole("button", { name: "Continue" }).click();
      break;
    }
    case "Deep question":
      await answerTask(page);
      break;
    case "Approach only":
      await page.locator(".dictation textarea").fill(EXPLAIN);
      await page.getByRole("button", { name: "Check my explanation" }).click();
      await page.getByText("How you did").waitFor();
      await page.getByRole("button", { name: "Continue" }).click();
      break;
    case "Mini live coding": {
      const heading = await page.locator(".card-head h3").first().textContent();
      const name = Object.keys(SOLUTIONS).find((n) => heading.includes(n));
      assert(name, `unknown problem: ${heading}`);
      await page.locator(".cm-content").click();
      await page.keyboard.press("Control+A");
      await page.keyboard.insertText(SOLUTIONS[name]);
      await page.getByRole("button", { name: "Run tests" }).click();
      const passed = await page.locator(".ok-text, .bad-text").textContent();
      assert(/^(\d+)\/\1 passed$/.test(passed.trim()), `${name}: ${passed}`);
      await page.locator(".dictation textarea").fill(EXPLAIN);
      await page.getByRole("button", { name: "Finish and get feedback" }).click();
      await page.getByRole("button", { name: "Continue" }).click();
      break;
    }
    case "Shadowing":
      for (let k = 0; k < 5; k++) {
        await page.getByRole("button", { name: "Show text" }).click();
        const line = (await page.locator(".target-words").textContent()).trim();
        await page.locator(".dictation textarea").fill(line);
        await page.getByRole("button", { name: "Check" }).click();
        const score = await page.locator(".ok-text, .bad-text").first().textContent();
        assert(score.startsWith("100%"), `shadowing exact repeat scored ${score}`);
        const next = page.getByRole("button", { name: /^(Next sentence|Finish)$/ });
        const label = await next.textContent();
        await next.click();
        if (label.includes("Finish")) break;
      }
      break;
    case "My story": {
      const boxes = page.locator(".dictation textarea");
      for (let k = 0; k < 4; k++) await boxes.nth(k).fill(`Part ${k + 1}. ${ANSWER}`);
      await page.getByRole("button", { name: "Save and tell it out loud" }).click();
      await answerTask(page);
      break;
    }
    case "Final interview":
      await answerTask(page, "Next question");
      await answerTask(page, "Next question");
      await answerTask(page, "See the decision");
      await page.locator(".eyebrow", { hasText: /hiring decision|Practice round/ }).waitFor();
      await page.screenshot({ path: path.join(shots, "final-decision.png"), fullPage: true });
      await page.getByRole("button", { name: "Continue" }).click();
      break;
    default:
      throw new Error(`unknown format page: ${title}`);
  }
}

async function finishMission(page) {
  await page.getByRole("button", { name: "Finish the mission" }).click();
  await page.getByRole("heading", { name: /Done for today|Practice done/ }).waitFor();
}

async function warmup(page) {
  for (let k = 0; k < 12; k++) {
    const gotIt = page.getByRole("button", { name: "Got it" });
    const show = page.getByRole("button", { name: "Show answer" });
    if (await gotIt.count()) await gotIt.click(); // a new card: read and repeat
    else if (await show.count()) {
      await show.click();
      await page.getByRole("button", { name: k % 2 ? "Forgot" : "Remembered" }).click();
    } else break;
  }
}

// ── Scenarios ──────────────────────────────────────────────
const page = await newPage();
await page.goto(BASE);

const post = (url, body, type = "application/json") => fetch(`${BASE}${url}`, { method: "POST", headers: { "Content-Type": type }, body });

await check("server reports AI off without a key, and a valid AI request gets 503", async () => {
  const status = await (await fetch(`${BASE}/api/status`)).json();
  assert(status.ai === false, JSON.stringify(status));
  const r = await post("/api/review/answer", JSON.stringify({ question: "Q?", category: "cs", answer: "A." }));
  assert(r.status === 503, `got ${r.status}`);
});

await check("bad API requests get a short 400, never a stack trace", async () => {
  for (const [body, type] of [
    ["{}", "application/json"],
    ["{not json", "application/json"],
    ["answer=1", "text/plain"],
    [JSON.stringify({ question: "Q", category: "cs", answer: "x".repeat(9000) }), "application/json"],
  ]) {
    const r = await post("/api/review/answer", body, type);
    const text = await r.text();
    assert(r.status === 400, `${body.slice(0, 20)}: got ${r.status}`);
    assert(!/node_modules|at \w+ \(/.test(text), `leaks internals: ${text.slice(0, 80)}`);
  }
});

await check("Today shows the first mission of the first company", async () => {
  await page.getByText("Brightloop · stage 1 of 5: Recruiter screen").waitFor();
  await page.getByText("Warm-up · 5 cards").waitFor();
  await page.getByRole("heading", { name: "How it works" }).waitFor();
  await page.screenshot({ path: path.join(shots, "today.png"), fullPage: true });
});

await check("today's plan stays the same after a reload", async () => {
  const before = await page.locator(".hero .chips").textContent();
  await page.reload();
  const after = await page.locator(".hero .chips").textContent();
  assert(before === after, `${before} vs ${after}`);
});

await check("free practice doesn't count as today's mission", async () => {
  await page.goto(`${BASE}/#/practice`);
  await page.locator("button.card", { hasText: "Shadowing" }).click();
  await runMain(page);
  await finishMission(page);
  await page.getByRole("button", { name: "Back to Today" }).click();
  await page.getByRole("heading", { name: "Today's mission" }).waitFor();
});

await check("the phone's Back button leaves a mission and returns to the page", async () => {
  await page.goto(`${BASE}/#/practice`);
  await page.locator("button.card", { hasText: "Blitz" }).click();
  await page.getByRole("heading", { name: "Blitz" }).waitFor();
  await page.goBack();
  await page.getByRole("heading", { name: "Practice" }).first().waitFor();
  await page.goto(`${BASE}/#/today`);
});

await check("daily mission: warm-up, main task, review, done", async () => {
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("heading", { name: "Remember out loud" }).waitFor();
  await page.screenshot({ path: path.join(shots, "warmup.png"), fullPage: true });
  await warmup(page);
  await page.screenshot({ path: path.join(shots, "main-task.png"), fullPage: true });
  await runMain(page);
  await page.screenshot({ path: path.join(shots, "review.png"), fullPage: true });
  await finishMission(page);
  await page.screenshot({ path: path.join(shots, "done.png"), fullPage: true });
});

await check("after the mission, Today says it's done and the week shows 1/4", async () => {
  await page.getByRole("button", { name: "Back to Today" }).click();
  await page.getByText("Today's mission is done").waitFor();
  await page.locator(".ring-label", { hasText: "1/4" }).first().waitFor();
});

await check("progress survives a reload", async () => {
  await page.reload();
  await page.getByText("Today's mission is done").waitFor();
  await page.getByText("Mission", { exact: false }).first().waitFor();
});

await check("“Boring, swap it” replaces the format with a different one", async () => {
  await page.getByRole("button", { name: /One more/ }).click();
  await warmup(page);
  const before = await page.locator(".page-head h1").first().textContent();
  await page.getByRole("button", { name: /Boring/ }).click();
  const after = await page.locator(".page-head h1").first().textContent();
  assert(before !== after, `still ${after}`);
  await page.getByRole("button", { name: "Leave" }).click();
});

await check("three missions pass the recruiter stage and unlock the technical screen", async () => {
  for (let k = 0; k < 2; k++) {
    await page.getByRole("button", { name: /One more/ }).click();
    await warmup(page);
    await runMain(page);
    await finishMission(page);
    if (k === 1) await page.getByText("Stage passed: Recruiter screen").waitFor();
    await page.getByRole("button", { name: "Back to Today" }).click();
  }
  await page.getByText("stage 2 of 5: Technical screen").waitFor();
});

for (const fmt of ["Blitz", "Deep question", "Approach only", "Mini live coding", "Shadowing", "My story", "Final interview"]) {
  await check(`free practice: ${fmt} works end to end`, async () => {
    await page.goto(`${BASE}/#/practice`);
    await page.locator("button.card", { hasText: fmt }).click();
    await runMain(page);
    await finishMission(page);
    await page.getByRole("button", { name: "Back to Today" }).click();
  });
}

await check("your mistakes became cards, and a card review ends with a summary", async () => {
  await page.goto(`${BASE}/#/cards`);
  await page.getByRole("cell", { name: "I am agree" }).waitFor();
  await page.getByRole("cell", { name: "3 years experience" }).waitFor();
  await page.screenshot({ path: path.join(shots, "cards.png"), fullPage: true });
  await page.getByRole("button", { name: /Review \d+ cards now/ }).click();
  await warmup(page);
  await page.getByText(/Session done: \d+ of \d+ remembered/).waitFor();
});

await check("the mission review shows the first two mistakes", async () => {
  await page.goto(`${BASE}/#/practice`);
  await page.locator("button.card", { hasText: "Deep question" }).click();
  await runMain(page);
  await page.getByRole("heading", { name: "Two things to fix" }).waitFor();
  await page.locator(".correction", { hasText: "I agree" }).first().waitFor();
  await finishMission(page);
});

await check("Leave asks first, then drops the mission", async () => {
  await page.goto(`${BASE}/#/practice`);
  await page.locator("button.card", { hasText: "Deep question" }).click();
  await page.locator(".dictation textarea").first().fill("half an answer");
  await page.getByRole("button", { name: "Leave" }).click();
  await page.getByRole("heading", { name: /Today's mission/ }).waitFor();
});

await check("the story is saved in “My stories”", async () => {
  await page.goto(`${BASE}/#/cards`);
  await page.locator("details summary", { hasText: "told 1×" }).first().waitFor();
});

await check("mock interview page: one-question session", async () => {
  await page.goto(`${BASE}/#/interview`);
  await page.getByRole("combobox").selectOption("3");
  await page.getByRole("button", { name: "Start interview" }).click();
  await answerTask(page, "Next question");
  await page.getByRole("button", { name: "Finish session" }).click();
  await page.getByRole("heading", { name: "Session complete" }).waitFor();
});

await check("live coding page: a correct solution celebrates", async () => {
  await page.goto(`${BASE}/#/coding`);
  await page.locator("button.card", { hasText: "Valid Palindrome" }).click();
  await page.locator(".cm-content").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText(SOLUTIONS["Valid Palindrome"]);
  await page.getByRole("button", { name: "Finish and get feedback" }).click();
  await page.getByText(/haven't explained anything yet/).waitFor(); // a nudge first, not a block
  await page.getByRole("button", { name: "Finish and get feedback" }).click();
  await page.getByRole("heading", { name: /Solved! \d+\/\d+ tests pass/ }).waitFor();
});

await check("live coding page: wrong code shows failures, an infinite loop is stopped", async () => {
  await page.locator('.sidebar a[href="#/coding"]').click(); // same page: back to the problem list
  await page.locator("button.card", { hasText: "Two Sum" }).click();
  await page.locator(".cm-content").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("function twoSum() { return [0, 0]; }");
  await page.getByRole("button", { name: "Run tests" }).click();
  await page.locator(".test.fail").first().waitFor();
  await page.locator(".cm-content").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("function twoSum() { while (true) {} }");
  await page.getByRole("button", { name: "Run tests" }).click();
  await page.getByText(/Timed out after 3s/).waitFor({ timeout: 8000 });
});

await check("progress page lists the sessions", async () => {
  await page.goto(`${BASE}/#/progress`);
  await page.getByRole("cell", { name: /Mission: / }).first().waitFor();
});

for (const [name, opts] of [
  ["phone", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ["dark", { colorScheme: "dark" }],
]) {
  await check(`${name}: pages render without horizontal scrolling`, async () => {
    const p = await newPage(opts);
    for (const r of ["today", "practice", "cards", "phrases", "progress", "interview", "coding"]) {
      await p.goto(`${BASE}/#/${r}`);
      await p.waitForTimeout(150);
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 0, `${r} overflows by ${overflow}px`);
      await p.screenshot({ path: path.join(shots, `${name}-${r}.png`), fullPage: true });
    }
    await p.goto(`${BASE}/#/today`);
    await p.getByRole("button", { name: "Start" }).click();
    await p.screenshot({ path: path.join(shots, `${name}-mission.png`), fullPage: true });
    await p.context().close();
  });
}

await check("no errors in the browser console", async () => {
  assert(errors.length === 0, errors.slice(0, 3).join(" | "));
});

await browser.close();
stopServer();
console.log(results.join("\n"));
console.log(failed ? `\n${failed} check(s) failed` : `\nAll ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
