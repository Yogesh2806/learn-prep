// Curated lists (fixed): WHICH words and topics we teach. What each one means, and how
// to teach it, comes from the dictionary and the teaching layer at runtime.

/**
 * Word pool for Word of the Day and the Vocabulary deck. Selection rule, per the brief:
 * words you hear in interviews, reviews, podcasts and speeches — familiar sound, fuzzy
 * meaning — never rarity for its own sake. Roughly ordered friendliest first, which is
 * the order new Vocabulary cards are introduced.
 */
export const WORD_POOL = `visceral ubiquitous nuanced candid pragmatic resilient meticulous eloquent ambivalent cathartic
poignant nostalgic surreal polarizing authentic vulnerable catalyst paradigm zeitgeist hubris
cynical esoteric mundane ephemeral serendipity epiphany quintessential charisma holistic intrinsic
aesthetic articulate cognizant complacent compelling conducive contentious conundrum cryptic dichotomy
diligent discerning disparity eclectic egregious elusive enigmatic ethos exacerbate facetious
fickle flamboyant frivolous gregarious hypocrisy idiosyncrasy impeccable imperative implicit inadvertent
incessant inevitable innate insidious intuitive jaded juxtaposition lethargic lucid magnanimous
melancholy mitigate nonchalant notorious obsolete ominous opulent paradox pensive perseverance
pervasive philanthropy pivotal plausible poised precarious prolific provocative prudent quirky
rapport reciprocate relentless reminisce resonate reticent rhetoric sanctimonious scrutiny skeptical
spontaneous stoic subtle succinct superficial tenacious tentative transcend transient trivial
unanimous unprecedented versatile vicarious volatile whimsical wholesome zealous laconic
benevolent bespoke bittersweet coherent conscientious debacle defiant euphoria finesse
frugal galvanize grandiose haphazard hedonistic impetus incognito ingenious instigate lackadaisical
liaison lucrative nemesis oblivious optics ostentatious palpable persona platitude pretentious
quaint reckoning reverie riveting salient savvy segue serene solace stigma
tangible trope underwhelming unapologetic understated vindicate vitriol wanderlust wistful`
  .split(/\s+/)
  .filter(Boolean);

export const GRAMMAR_TOPICS = [
  "Subject–verb agreement",
  "Articles: a, an, the",
  "Countable vs uncountable nouns",
  "Fewer vs less",
  "Who vs whom",
  "Me vs I",
  "Its vs it's",
  "Their, there, they're",
  "Affect vs effect",
  "Lay vs lie",
  "Comparatives and superlatives",
  "Conditionals (zero to third)",
  "Passive voice — when to use it",
  "Reported speech",
  "Modal verbs: should, would, could",
  "Gerund vs infinitive",
  "Prepositions of time: in, on, at",
  "That vs which",
  "Dangling modifiers",
  "Parallel structure",
] as const;

export const PUNCTUATION_TOPICS = [
  "Commas in lists and the Oxford comma",
  "Comma splices",
  "Commas after introductory phrases",
  "Semicolons",
  "Colons",
  "Apostrophes for possession",
  "Apostrophes in contractions",
  "Hyphens in compound adjectives",
  "Em dashes",
  "Quotation marks and punctuation",
  "Question marks in indirect questions",
  "Capital letters after a colon",
] as const;
