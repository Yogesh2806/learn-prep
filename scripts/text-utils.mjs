// Wiktionary inlines <style> blocks (e.g. ".mw-parser-output .defdate{…}"): drop them with their text.
export const stripTags = (html) =>
  String(html).replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, "").replace(/\.mw-parser-output[^}]*\}/g, "").replace(/\s+([,.;:])/g, "$1").replace(/\s{2,}/g, " ").replace(/^[\s:]+/, "").trim();
export const decodeEntities = (s) =>
  String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
