import { describe, expect, it } from 'vitest';
import { analyzeLayout, createStarterDocument, findBoundsIssues, findNarrowChannels, findOverlaps, fitExampleElements } from '../src/domain';
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

  it('keeps the starter arrangement unchanged when it fits the field without resizing', () => {
    const example = createStarterDocument().elements;
    const result = fitExampleElements({ width: 28, height: 18 }, example);
    expect(result.resized).toBe(false);
    expect(result.scale).toBe(1);
    expect(result.elements).toBe(example);
  });

  it('scales the starter arrangement down to a smaller field without any element going out of bounds', () => {
    const field = { width: 12, height: 10 };
    const result = fitExampleElements(field, createStarterDocument().elements);
    expect(result.resized).toBe(true);
    expect(result.scale).toBeLessThan(1);
    expect(result.scale).toBeCloseTo(0.48, 2);
    expect(findBoundsIssues(field, result.elements)).toEqual([]);
  });

  it('preserves the relative arrangement and never scales content up', () => {
    const example = createStarterDocument().elements;
    const field = { width: 40, height: 30 };
    const result = fitExampleElements(field, example);
    expect(result.resized).toBe(false);
    expect(result.elements).toBe(example);

    const small = fitExampleElements({ width: 12, height: 10 }, example).elements;
    const byId = (elements: ExpoElement[], id: string) => elements.find((element) => element.id === id)!;
    const stage = byId(small, 'stage-1');
    const booth = byId(small, 'booth-1');
    expect(stage.x).toBeGreaterThan(booth.x);
    expect(stage.y).toBeLessThan(byId(small, 'seating-1').y);
    expect(small).toHaveLength(example.length);
  });

  it('leaves an empty example untouched', () => {
    expect(fitExampleElements({ width: 12, height: 10 }, [])).toEqual({ elements: [], scale: 1, resized: false });
  });
});
