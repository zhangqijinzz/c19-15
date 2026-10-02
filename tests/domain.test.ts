import { describe, expect, it } from 'vitest';
import { analyzeLayout, findBoundsIssues, findNarrowChannels, findOverlaps, planExampleContent } from '../src/domain';
import type { ExpoElement } from '../src/types';

const item = (id: string, x: number, y: number, width = 4, height = 3): ExpoElement => ({ id, kind: 'booth', name: id, x, y, width, height, rotation: 0 });

describe('layout domain rules', () => {
  it('detects overlap area between two elements', () => {
    expect(findOverlaps([item('a', 1, 1), item('b', 3, 2)])).toEqual([{ firstId: 'a', secondId: 'b', amount: 4 }]);
  });

  it('detects field overflow and rotated bounds', () => {
    const rotated = { ...item('rotated', 8, 2, 2, 5), rotation: 90 };
    expect(findBoundsIssues({ width: 10, height: 10 }, [rotated])).toEqual([{ elementId: 'rotated', overflow: 3 }]);
  });

  it('flags a pass narrower than the minimum channel', () => {
    expect(findNarrowChannels([item('a', 1, 1), item('b', 5.5, 1)])).toEqual([{ firstId: 'a', secondId: 'b', gap: 0.5 }]);
  });

  it('returns a path when entrance and focus area exist', () => {
    const analysis = analyzeLayout({ version: 1, title: 'x', field: { width: 20, height: 12 }, elements: [{ ...item('entry', 1, 5, 2, 1), kind: 'entrance' }, { ...item('stage', 10, 2, 5, 3), kind: 'stage' }] });
    expect(analysis.path?.points).toHaveLength(3);
    expect(analysis.path?.distance).toBeGreaterThan(0);
  });

  it('fits example elements into a smaller field without leaving them out of bounds', () => {
    const plan = planExampleContent({ width: 12, height: 10 });
    expect(plan.skipped).toHaveLength(0);
    expect(plan.elements.every((element) => element.x >= 0 && element.y >= 0 && element.x + element.width <= 12 && element.y + element.height <= 10)).toBe(true);
    expect(findBoundsIssues(plan.field, plan.elements)).toHaveLength(0);
    // 手作展位 x=19 超出小场地，应被夹回界内并明确登记为已挪动
    const booth = plan.elements.find((element) => element.id === 'booth-2');
    expect(booth?.x).toBe(7);
    expect(plan.adjusted.map((element) => element.id)).toContain('booth-2');
  });

  it('keeps example coordinates untouched when the field matches the example size', () => {
    const plan = planExampleContent({ width: 28, height: 18 });
    expect(plan.adjusted).toHaveLength(0);
    expect(plan.skipped).toHaveLength(0);
    expect(plan.elements).toHaveLength(5);
  });

  it('skips example elements larger than the field instead of placing them out of bounds', () => {
    const plan = planExampleContent({ width: 4, height: 3 });
    expect(plan.skipped.map((element) => element.name)).toContain('分享舞台');
    expect(plan.elements.every((element) => element.width <= 4 && element.height <= 3)).toBe(true);
    expect(findBoundsIssues(plan.field, plan.elements)).toHaveLength(0);
  });
});
