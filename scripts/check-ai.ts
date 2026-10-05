// Calls the real Claude API through the app's own server code and checks the answers.
// Needs ANTHROPIC_API_KEY. Usage: npm run check:ai
import "../server/env";
import { aiEnabled, reviewAnswer, reviewCoding } from "../server/ai";
import type { AnswerReview, CodingReview } from "../src/lib/api";

if (!aiEnabled) {
  console.error("ANTHROPIC_API_KEY is not set, so there is nothing to check.");
  process.exit(1);
}

let failed = 0;
function expect(name: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : `  ${detail}`}`);
  if (!ok) failed++;
}
const score = (n: unknown) => typeof n === "number" && n >= 0 && n <= 10;

console.log("Answer review…");
const a = (await reviewAnswer({
  question: "Tell me about yourself.",
  category: "behavioral",
  answer: "I am agree that I am good developer. I have 3 years experience with React and I make many projects.",
  durationSec: 25,
})) as AnswerReview;
expect("scores are numbers from 0 to 10", score(a.english_score) && score(a.content_score), JSON.stringify([a.english_score, a.content_score]));
expect("finds the grammar mistakes", a.corrections.length >= 2, JSON.stringify(a.corrections));
expect("mentions “I agree”", JSON.stringify(a.corrections).includes("I agree"));
expect("gives a better version and a follow-up question", a.better_version.length > 40 && a.follow_up_question.endsWith("?"));

console.log("Coding review…");
const c = (await reviewCoding({
  title: "Two Sum",
  statement: "Return the indices of two numbers that add up to the target.",
  code: "function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++)\n    for (let j = i + 1; j < nums.length; j++)\n      if (nums[i] + nums[j] === target) return [i, j];\n}",
  explanation: "I check every pair, it is O(n) time.",
  testsPassed: 4,
  testsTotal: 4,
})) as CodingReview;
expect("scores are numbers from 0 to 10", score(c.communication_score) && score(c.code_score));
expect("catches the wrong complexity claim", /n\s*(\^|²|squared|2)/i.test(c.complexity_check), c.complexity_check);
expect("gives a model explanation", c.model_explanation.length > 40);

console.log(failed ? `\n${failed} check(s) failed` : "\nThe real AI interviewer works.");
process.exit(failed ? 1 : 0);
