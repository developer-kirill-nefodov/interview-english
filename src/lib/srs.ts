// Spaced repetition: a card comes back after 1, 3, 7, 16, 35, 80 days while you
// remember it; forgetting resets it to tomorrow.

export type Deck = "mistake" | "phrase" | "pattern";

export interface Card {
  id: string;
  deck: Deck;
  front: string;
  back: string;
  note?: string;
  /** Number of successful reviews in a row. */
  step: number;
  /** Local date key (YYYY-MM-DD) when the card is due. */
  due: string;
  reviews: number;
  lapses: number;
  created: string;
}

export const INTERVALS = [1, 3, 7, 16, 35, 80];

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + days));
}

export function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 864e5);
}

export function newCard(deck: Deck, front: string, back: string, today: string, note?: string, id?: string): Card {
  return {
    id: id ?? `${deck}:${front.toLowerCase().replace(/\s+/g, " ").trim()}`,
    deck,
    front,
    back,
    note,
    step: 0,
    due: today,
    reviews: 0,
    lapses: 0,
    created: today,
  };
}

export function grade(card: Card, remembered: boolean, today: string): Card {
  if (!remembered) {
    return { ...card, step: 0, due: addDays(today, 1), reviews: card.reviews + 1, lapses: card.lapses + 1 };
  }
  const interval = INTERVALS[Math.min(card.step, INTERVALS.length - 1)];
  return { ...card, step: card.step + 1, due: addDays(today, interval), reviews: card.reviews + 1 };
}

const DECK_PRIORITY: Record<Deck, number> = { mistake: 0, pattern: 1, phrase: 2 };

/**
 * Pick cards for a warm-up: overdue reviews first (oldest first, your own mistakes before
 * the rest), then never-seen cards to fill the remaining slots.
 */
export function pickWarmup(cards: Card[], today: string, count: number): Card[] {
  const due = cards
    .filter((c) => c.reviews > 0 && c.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due) || DECK_PRIORITY[a.deck] - DECK_PRIORITY[b.deck]);
  const fresh = cards
    .filter((c) => c.reviews === 0)
    .sort((a, b) => DECK_PRIORITY[a.deck] - DECK_PRIORITY[b.deck] || a.created.localeCompare(b.created));
  // Interleave decks among the new cards so one warm-up mixes phrases and patterns.
  const mixed: Card[] = [];
  const byDeck = (["mistake", "pattern", "phrase"] as Deck[]).map((d) => fresh.filter((c) => c.deck === d));
  while (byDeck.some((l) => l.length)) for (const l of byDeck) if (l.length) mixed.push(l.shift()!);
  return [...due, ...mixed].slice(0, count);
}

export function deckStats(cards: Card[], today: string) {
  const stats = { total: cards.length, due: 0, learned: 0, fresh: 0 };
  for (const c of cards) {
    if (c.reviews === 0) stats.fresh++;
    else if (c.due <= today) stats.due++;
    if (c.step >= 3) stats.learned++;
  }
  return stats;
}
