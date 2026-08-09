// Parses raw OCR text from ML Kit to extract the most likely MTG card name.
// Card names appear at the top of the card, before type line / mana cost.
// They never contain special characters like {W} {U} {B} {R} {G} or numbers alone.

const IGNORE_PATTERNS = [
  /^\d+$/,                    // pure numbers (power/toughness, mana values)
  /^[WUBRGC0-9{}\/]+$/,       // mana symbols
  /illustrated by/i,          // artist credit
  /™|®|©/,                    // trademark symbols
  /^\s*$/,                    // empty/whitespace
  /^[^a-zA-Z]+$/,             // no letters at all
];

const TYPE_KEYWORDS = [
  'creature', 'instant', 'sorcery', 'enchantment', 'artifact',
  'planeswalker', 'land', 'tribal', 'legendary', 'basic',
];

function shouldIgnoreLine(line) {
  const trimmed = line.trim();
  if (trimmed.length < 2) return true;
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  // Skip type lines
  const lower = trimmed.toLowerCase();
  for (const kw of TYPE_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  return false;
}

/**
 * Given the array of text blocks returned by ML Kit TextRecognizer,
 * returns the best candidate for the card name.
 *
 * ML Kit returns blocks with a `frame` property: { x, y, width, height }
 * The card name is near the top of the image.
 */
export function extractCardName(blocks) {
  if (!blocks || blocks.length === 0) return null;

  // Sort all lines by their Y position (top of image first)
  const allLines = [];
  for (const block of blocks) {
    for (const line of (block.lines || [])) {
      const text = line.text?.trim();
      if (text) {
        allLines.push({ text, y: line.frame?.y ?? 0 });
      }
    }
  }

  allLines.sort((a, b) => a.y - b.y);

  // The first non-ignored line is most likely the card name
  for (const line of allLines) {
    if (!shouldIgnoreLine(line.text)) {
      return line.text.trim();
    }
  }

  // Last resort: return all text concatenated for Scryfall to try
  return allLines.map(l => l.text).join(' ').trim().slice(0, 50);
}
