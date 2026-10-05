import { DICT } from "../i18n/dict";
/**
 * Hint languages. The app itself is in English; hints, translations and short
 * explanations can be shown in the learner's own language.
 * To add a language: add its code here and a translation next to every `tr` in src/data.
 */
export const HINT_LANGS = {
  none: { label: "English only", native: "English only" },
  ru: { label: "Russian", native: "Русский" },
  uk: { label: "Ukrainian", native: "Українська" },
} as const;

export type HintLang = keyof typeof HINT_LANGS;
export type Lang = Exclude<HintLang, "none">;
export const LANGS = Object.keys(HINT_LANGS).filter((l) => l !== "none") as Lang[];

/** A text with a translation for every hint language. */
export type Tr = Record<Lang, string>;

/** The translation in the chosen language, or undefined for "English only". */
export function t(tr: Tr | undefined, lang: HintLang): string | undefined {
  return tr && lang !== "none" ? tr[lang] : undefined;
}

/** Translation of an English UI or learning text, if there is one. */
export function tx(en: string, lang: HintLang): string | undefined {
  return t(DICT[en], lang);
}

/** First supported language from the browser settings, else Russian (the app is made for Russian speakers). */
export function detectHintLang(langs: readonly string[] = typeof navigator !== "undefined" ? (navigator.languages ?? []) : []): HintLang {
  for (const l of langs) {
    const code = l.slice(0, 2).toLowerCase();
    if ((LANGS as string[]).includes(code)) return code as Lang;
  }
  return "ru";
}
