import { extractCardName } from '../cardParser';

// ML Kit gives us blocks of lines, each line has text and a y position (frame.y).
// These helpers build fake ML Kit output for tests.
function line(text, y) {
  return { text, frame: { y } };
}

function blocksFrom(lines) {
  return [{ lines }];
}

describe('extractCardName', () => {
  test('picks the first real line as the card name', () => {
    const blocks = blocksFrom([
      line('Lightning Bolt', 10),
      line('{R}', 10),
      line('Instant', 40),
      line('Deal 3 damage to any target.', 60),
    ]);
    expect(extractCardName(blocks)).toBe('Lightning Bolt');
  });

  test('skips mana symbols, power/toughness, and type line to find the name', () => {
    const blocks = blocksFrom([
      line('{2}{G}{G}', 5),
      line('Craterhoof Behemoth', 8),
      line('Creature — Beast', 35),
      line('7/6', 90),
    ]);
    expect(extractCardName(blocks)).toBe('Craterhoof Behemoth');
  });

  test('ignores artist credit and trademark lines below the name', () => {
    const blocks = blocksFrom([
      line('Sol Ring', 5),
      line('{1}', 5),
      line('Artifact', 30),
      line('illustrated by Mark Tedin', 300),
      line('™ Wizards of the Coast', 310),
    ]);
    expect(extractCardName(blocks)).toBe('Sol Ring');
  });

  test('does not throw out a card name just because it contains a type word as a substring', () => {
    const blocks = blocksFrom([
      line('Wasteland', 5),
      line('Land', 40),
    ]);
    expect(extractCardName(blocks)).toBe('Wasteland');
  });

  test('still skips an actual type line like "Legendary Creature — Human"', () => {
    const blocks = blocksFrom([
      line('Legendary Creature — Human', 5),
      line('Some Wizard Name', 40),
    ]);
    expect(extractCardName(blocks)).toBe('Some Wizard Name');
  });

  test('handles messy OCR spacing without crashing', () => {
    const blocks = blocksFrom([
      line('   Sol  Ring   ', 5),
      line('{1}', 6),
    ]);
    expect(extractCardName(blocks)).toBe('Sol  Ring');
  });

  test('reads lines out of ML Kit block order by sorting on y position', () => {
    const blocks = [
      { lines: [line('Instant', 40), line('Deal 3 damage.', 60)] },
      { lines: [line('Shock', 5)] },
    ];
    expect(extractCardName(blocks)).toBe('Shock');
  });

  test('returns null for empty blocks', () => {
    expect(extractCardName([])).toBeNull();
  });

  test('returns null when blocks is missing', () => {
    expect(extractCardName(null)).toBeNull();
    expect(extractCardName(undefined)).toBeNull();
  });

  test('ignores lines that are only whitespace or a single stray character', () => {
    const blocks = blocksFrom([
      line('   ', 1),
      line('l', 2),
      line('Goblin Guide', 10),
    ]);
    expect(extractCardName(blocks)).toBe('Goblin Guide');
  });

  test('falls back to concatenated text, capped at 50 chars, when every line looks like noise', () => {
    const blocks = blocksFrom([
      line('{R}', 5),
      line('7', 10),
      line('Creature', 20),
    ]);
    expect(extractCardName(blocks)).toBe('{R} 7 Creature');
  });

  test('caps the fallback text at 50 characters', () => {
    // a line of only digits is ignorable, so this goes through the no-good-line fallback path
    const blocks = blocksFrom([
      line('123456789012345678901234567890123456789012345678901234567890', 5),
    ]);
    const result = extractCardName(blocks);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  test('handles a line with no frame position without crashing', () => {
    const blocks = [{ lines: [{ text: 'Birds of Paradise' }] }];
    expect(extractCardName(blocks)).toBe('Birds of Paradise');
  });

  test('handles a block with no lines property without crashing', () => {
    const blocks = [{}, blocksFrom([line('Counterspell', 5)])[0]];
    expect(extractCardName(blocks)).toBe('Counterspell');
  });
});
