import { describe, expect, it } from 'vitest';
import { visualSlots, villageBackgroundSlot } from './visual-slots';

describe('visual asset slots', () => {
  it('keeps static slots unique and in their declared asset directories', () => {
    expect(new Set(visualSlots.map(slot => slot.id)).size).toBe(22);
    expect(visualSlots.filter(slot => slot.kind === 'background')).toHaveLength(12);
    expect(visualSlots.filter(slot => slot.kind === 'scene')).toHaveLength(10);
    expect(visualSlots.every(slot => slot.file.startsWith(`${slot.kind}s/`) && slot.file.endsWith('.webp'))).toBe(true);
  });

  it('resolves a usable village backdrop without coupling it to the save', () => {
    expect(villageBackgroundSlot('Mizuhara').file).toBe('backgrounds/mizuhara-canals.webp');
    expect(villageBackgroundSlot('Unknown').file).toBe('backgrounds/hoshigakure-square.webp');
  });
});
