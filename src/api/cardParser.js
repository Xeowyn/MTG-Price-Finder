// Takes the raw text the camera read off a card and figures out the card's name.
// The name is always the first line on the card, above the mana cost and type line.

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
  // Skip type lines, but only match whole words — otherwise a card
  // like "Wasteland" would get wrongly thrown out because it contains "land"
  const lower = trimmed.toLowerCase();
  for (const kw of TYPE_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`).test(lower)) return true;
  }
  return false;
}

// Takes the text blocks ML Kit found in the photo and picks the most likely card name.
export function extractCardName(blocks) {
  if (!blocks || blocks.length === 0) return null;

  const allLines = [];
  for (const block of blocks) {
    for (const line of (block.lines || [])) {
      const text = line.text?.trim();
      if (text) {
        allLines.push({ text, y: line.frame?.y ?? 0 });
      }
    }
  }

  // Put the lines in order from top of the image to bottom
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
