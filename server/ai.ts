import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";

export const aiEnabled = Boolean(
  process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN,
);

const client = aiEnabled ? new Anthropic() : null;

const str = { type: "string" } as const;
const strList = { type: "array", items: str } as const;
const corrections = {
  type: "array",
  items: {
    type: "object",
    properties: { original: str, corrected: str, explanation: str },
    required: ["original", "corrected", "explanation"],
    additionalProperties: false,
  },
} as const;

const answerSchema = {
  type: "object",
  properties: {
    english_score: { type: "integer", description: "1-10, grammar, vocabulary, fluency" },
    content_score: { type: "integer", description: "1-10, how well it answers the question" },
    summary: str,
    strengths: strList,
    improvements: strList,
    corrections,
    better_version: { type: "string", description: "The candidate's answer rewritten as a strong, natural spoken answer" },
    useful_phrases: strList,
    follow_up_question: { type: "string", description: "What a real interviewer would ask next" },
  },
  required: [
    "english_score", "content_score", "summary", "strengths", "improvements",
    "corrections", "better_version", "useful_phrases", "follow_up_question",
  ],
  additionalProperties: false,
};

const codingSchema = {
  type: "object",
  properties: {
    communication_score: { type: "integer", description: "1-10, how clearly the candidate explained their thinking in English" },
    code_score: { type: "integer", description: "1-10, correctness, readability and efficiency of the code" },
    summary: str,
    strengths: strList,
    improvements: strList,
    corrections,
    complexity_check: { type: "string", description: "Is the stated time/space complexity right? What is the real one?" },
    model_explanation: { type: "string", description: "How a strong candidate would explain this solution out loud, 4-6 sentences" },
    follow_up_question: str,
  },
  required: [
    "communication_score", "code_score", "summary", "strengths", "improvements",
    "corrections", "complexity_check", "model_explanation", "follow_up_question",
  ],
  additionalProperties: false,
};

const SYSTEM = `You are a friendly but honest senior engineer running a mock technical interview in English.
The candidate is a software developer whose native language is Russian and who is practicing both interviewing and English at the same time.
Give feedback on two things separately: the substance of the answer, and the English (grammar, word choice, naturalness, typical Russian-speaker mistakes such as missing articles or wrong tenses).
Be specific and quote their words. Keep explanations short and plain. Write all feedback in English, except that each correction's explanation may add a short Russian hint in parentheses when it helps.
If the input was produced by speech recognition, ignore missing punctuation and capitalization.`;

async function ask<T>(schema: Record<string, unknown>, prompt: string): Promise<T> {
  if (!client) throw new Error("AI feedback is not configured");
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("The model declined this request");
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Empty response from the model");
  return JSON.parse(text.text) as T;
}

export function reviewAnswer(input: {
  question: string;
  category: string;
  answer: string;
  durationSec?: number;
}) {
  return ask(answerSchema, `Interview category: ${input.category}
Question: ${input.question}
${input.durationSec ? `The candidate spoke for ${input.durationSec} seconds.\n` : ""}
Candidate's answer:
"""
${input.answer}
"""`);
}

export function reviewCoding(input: {
  title: string;
  statement: string;
  code: string;
  explanation: string;
  testsPassed: number;
  testsTotal: number;
}) {
  return ask(codingSchema, `This is a live coding round. The candidate solved the problem below and explained their approach in English.

Problem: ${input.title}
${input.statement}

Tests passed: ${input.testsPassed}/${input.testsTotal}

Candidate's code:
\`\`\`js
${input.code}
\`\`\`

Candidate's explanation (clarifying questions, approach, complexity):
"""
${input.explanation}
"""`);
}
