/** Lower-case label text and smooth out typography so plain-text search is reliable. */
export function normalizeText(text: string): string {
  return text.replace(/[‘’ʼ]/g, "'").replace(/[‐-―]/g, "-").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Abbreviations whose full stop doesn't end a sentence ("St. John's wort", "e.g. garlic"). */
const NOT_SENTENCE_END = /(?<!\b(?:St|Dr|Mr|Ms|No|Nos|vs|Fig|approx|e\.g|i\.e|etc|U\.S|[A-Z]))/;

/** Split text into sentences, keeping list items that end with ";" as their own pieces. */
export function splitSentences(text: string): string[] {
  const boundary = new RegExp(`(?<=[;:!?]|${NOT_SENTENCE_END.source}\\.)\\s+(?=[A-Z0-9(•\\-])`);
  return normalizeText(text)
    .split(boundary)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface MatchOptions {
  /** Ignore a match when the next word(s) start with one of these (e.g. "channel"). */
  ignoreWhenFollowedBy?: readonly string[];
}

const MAX_EXCERPT = 320;
const CONTEXT_BEFORE = 200;

/** Shorten a long sentence around the match, always keeping the matched words whole. */
function trimExcerpt(sentence: string, index: number, length: number): string {
  if (sentence.length <= MAX_EXCERPT) return sentence;
  let start = Math.max(0, index - CONTEXT_BEFORE);
  let end = Math.min(sentence.length, Math.max(index + length, start + MAX_EXCERPT));
  // Move the cut points to word boundaries.
  if (start > 0) start = sentence.indexOf(" ", start) + 1 || start;
  if (start > index) start = index;
  if (end < sentence.length) {
    const space = sentence.lastIndexOf(" ", end);
    end = space > index + length ? space : end;
  }
  return `${start > 0 ? "…" : ""}${sentence.slice(start, end).trim()}${end < sentence.length ? "…" : ""}`;
}

/**
 * Find the first sentence in `text` that mentions any of `terms` as a whole word or phrase.
 * Returns the sentence (shortened around the match if long), or null.
 */
export function findMention(
  text: string,
  terms: readonly string[],
  options: MatchOptions = {},
): string | null {
  const usable = terms.map((t) => t.trim().toLowerCase()).filter((t) => t.length >= 3);
  if (usable.length === 0) return null;
  const pattern = new RegExp(
    `(?<![a-z0-9])(?:${usable.map((t) => escapeRegExp(normalizeText(t))).join("|")})(?![a-z0-9])`,
    "gi",
  );
  const ignore = (options.ignoreWhenFollowedBy ?? []).map((w) => w.toLowerCase());

  const sentences = splitSentences(text);
  for (const [index, sentence] of sentences.entries()) {
    for (const match of sentence.matchAll(pattern)) {
      const after = sentence
        .slice(match.index + match[0].length)
        .trimStart()
        .toLowerCase();
      if (ignore.some((word) => after.startsWith(word))) continue;
      // A heading on its own ("Pregnant Women:") says nothing; include what follows it.
      const next = sentences[index + 1];
      const full = sentence.endsWith(":") && next ? `${sentence} ${next}` : sentence;
      return trimExcerpt(full, match.index, match[0].length);
    }
  }
  return null;
}
