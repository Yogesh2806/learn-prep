import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";
import { KEYS, readJSON, writeJSON } from "./storage";
import { dayKey } from "./utils";

// Spaced repetition (FSRS) for the English decks. Cards are stored as JSON, so dates
// come back as strings — ts-fsrs accepts them, but we revive them for our own maths.

export { Rating };
export type { Grade };
export const GRADES: { rating: Grade; label: string; key: string }[] = [
  { rating: Rating.Again, label: "Again", key: "1" },
  { rating: Rating.Hard, label: "Hard", key: "2" },
  { rating: Rating.Good, label: "Good", key: "3" },
  { rating: Rating.Easy, label: "Easy", key: "4" },
];

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.9 }));
export const NEW_PER_DAY = 8;

type Stored = Omit<Card, "due" | "last_review"> & { due: string; last_review?: string };
export type Deck = { cards: Record<string, Stored>; introduced: { day: string; count: number } };

const revive = (c: Stored): Card => ({ ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined });
const store = (c: Card): Stored => ({ ...c, due: c.due.toISOString(), last_review: c.last_review?.toISOString() });

export function loadDeck(): Deck {
  const d = readJSON<Deck>(KEYS.fsrs, { cards: {}, introduced: { day: dayKey(), count: 0 } });
  if (d.introduced?.day !== dayKey()) d.introduced = { day: dayKey(), count: 0 };
  return d;
}
export const saveDeck = (d: Deck) => writeJSON(KEYS.fsrs, d);

export function getCard(deck: Deck, id: string): Card | null {
  const c = deck.cards[id];
  return c ? revive(c) : null;
}

export function rate(deck: Deck, id: string, rating: Grade, now = new Date()): Deck {
  const existing = getCard(deck, id);
  const isNew = !existing;
  const { card } = scheduler.next(existing ?? createEmptyCard(now), now, rating);
  const introduced = isNew ? { day: dayKey(now), count: (deck.introduced.day === dayKey(now) ? deck.introduced.count : 0) + 1 } : deck.introduced;
  return { cards: { ...deck.cards, [id]: store(card) }, introduced };
}

/** What each grade would schedule — shown under the buttons so the choice is honest. */
export function preview(deck: Deck, id: string, now = new Date()) {
  const rec = scheduler.repeat(getCard(deck, id) ?? createEmptyCard(now), now);
  return Object.fromEntries(GRADES.map((g) => [g.rating, formatInterval(rec[g.rating].card.due.getTime() - now.getTime())])) as Record<Grade, string>;
}

export function formatInterval(ms: number) {
  const min = Math.round(ms / 60_000);
  if (min < 1) return "<1 min";
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} day${d === 1 ? "" : "s"}`;
  const mo = Math.round(d / 30);
  return `${mo} mo`;
}

/** Due reviews first (most overdue first), then today's allowance of new words. */
export function buildQueue(deck: Deck, pool: string[], now = new Date()) {
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const due = Object.entries(deck.cards)
    .filter(([id, c]) => pool.includes(id) && new Date(c.due) <= endOfDay)
    .sort((a, b) => +new Date(a[1].due) - +new Date(b[1].due))
    .map(([id]) => id);
  const room = Math.max(0, NEW_PER_DAY - (deck.introduced.day === dayKey(now) ? deck.introduced.count : 0));
  const fresh = pool.filter((w) => !deck.cards[w]).slice(0, room);
  return { due, fresh, queue: [...due, ...fresh] };
}

export function stats(deck: Deck) {
  const all = Object.values(deck.cards);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return {
    seen: all.length,
    learned: all.filter((c) => c.state === State.Review).length,
    dueToday: all.filter((c) => new Date(c.due) <= endOfDay).length,
  };
}

/** A miss in Quiz or Recall enrols the word for review now (PRD: missed items auto-enrol). */
export const enrolMiss = (deck: Deck, id: string) => rate(deck, id, Rating.Again);
