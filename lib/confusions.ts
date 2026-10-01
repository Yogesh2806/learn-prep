import nlp from "compromise";
import type { LTMatch } from "./languagetool";

// The public LanguageTool API catches its/it's, your/you're and "could of", but not
// "their going" or "there not" (measured). This fills that one gap on the device, with
// care for real nouns: "Their meeting got moved" is fine, "Their coming tomorrow" isn't.

const FINITE = /PresentTense|PastTense|Copula|Modal|Auxiliary/;

export function confusionChecks(text: string): LTMatch[] {
  const out: LTMatch[] = [];
  for (const m of text.matchAll(/\b(their|there)\s+([a-z']+)/gi)) {
    const [whole, word, next] = m;
    const start = m.index ?? 0;
    const rest = text.slice(start + whole.length);
    const end = rest.search(/[,;.!?]/);
    const tail = end < 0 ? rest : rest.slice(0, end);

    let wrong = /^(not|gonna)$/i.test(next);
    if (!wrong && /ing$/i.test(next)) {
      const terms = nlp(`${word} ${next}${tail}`).terms().json().map((x: { terms: { tags: string[] }[] }) => x.terms[0]);
      const gerund = terms[1]?.tags.includes("Gerund") && !terms[1].tags.includes("Noun");
      // "Their leaving was sudden" has its own verb, so "leaving" is a noun there.
      const ownVerb = terms.slice(2).some((t: { tags: string[] }) => FINITE.test(t.tags.join(" ")) && !t.tags.includes("Gerund"));
      wrong = gerund && !ownVerb;
    }
    if (!wrong) continue;

    const fix = word[0] === word[0].toUpperCase() ? "They're" : "they're";
    out.push({
      offset: start,
      length: word.length,
      text: word,
      message: `Use “they're” (they are) here: “${fix} ${next}”.`,
      short: "Their / there / they're",
      replacements: [fix],
      rule: "LOCAL_THEYRE",
      category: "Confused words",
      type: "grammar",
    });
  }
  return out;
}

/** Local findings the checker didn't already report at the same spot. */
export function mergeMatches(checker: LTMatch[], local: LTMatch[]) {
  const overlaps = (a: LTMatch, b: LTMatch) => a.offset < b.offset + b.length && b.offset < a.offset + a.length;
  return [...checker, ...local.filter((l) => !checker.some((c) => overlaps(c, l)))].sort((a, b) => a.offset - b.offset);
}
