import { describe, expect, it, vi } from 'vitest';
import { createStarterDocument } from '../src/domain';
import type { LayoutRepository } from '../src/repository';
import type { LayoutDocument } from '../src/types';
import { ExpoSketchViewModel } from '../src/viewModel';

const fakeRepository = (initial: LayoutDocument | null = null): LayoutRepository => ({
  load: vi.fn(async () => initial ?? createStarterDocument()),
  save: vi.fn(async (_document) => {}),
});

describe('ExpoSketchViewModel', () => {
  it('initializes and updates the selected layout', async () => {
    const repository = fakeRepository();
    const vm = new ExpoSketchViewModel(repository);
    await vm.initialize();
    expect(vm.state.phase).toBe('ready');
    const count = vm.state.document.elements.length;
    vm.addElement('booth');
    expect(vm.state.document.elements).toHaveLength(count + 1);
    expect(vm.state.selectedId).toContain('booth-');
  });

  it('updates analysis immediately after moving an element into an overlap', () => {
    const vm = new ExpoSketchViewModel(fakeRepository());
    vm.moveElement('stage-1', 4.5, 2.5);
    expect(vm.state.analysis.overlaps.length).toBeGreaterThan(0);
  });

  it('recovers the example if repository loading fails', async () => {
    const repository: LayoutRepository = { load: vi.fn(async () => { throw new Error('bad storage'); }), save: vi.fn(async () => {}) };
    const vm = new ExpoSketchViewModel(repository);
    await vm.initialize();
    expect(vm.state.phase).toBe('error');
    expect(vm.state.document.title).toContain('春日创意市集');
  });

  it('shows a save error without dropping the working document', async () => {
    const repository: LayoutRepository = { load: vi.fn(async () => createStarterDocument()), save: vi.fn(async () => { throw new Error('quota'); }) };
    const vm = new ExpoSketchViewModel(repository);
    await vm.initialize();
    vm.addElement('stage');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(vm.state.document.elements.some((element) => element.kind === 'stage' && element.id.startsWith('stage-'))).toBe(true);
    expect(vm.state.notice.tone).toBe('error');
  });

  it('ignores invalid dimensions instead of corrupting the working selection', () => {
    const vm = new ExpoSketchViewModel(fakeRepository());
    const before = vm.state.document.elements[0].width;
    vm.resizeSelected(0, 0);
    expect(vm.state.document.elements[0].width).toBe(before);
  });

  it('applies only the example content while keeping the custom field size intact', () => {
    const vm = new ExpoSketchViewModel(fakeRepository());
    vm.resizeField(12, 10);
    expect(vm.state.document.field).toEqual({ width: 12, height: 10 });

    vm.applyExampleContent();

    expect(vm.state.document.field).toEqual({ width: 12, height: 10 });
    expect(vm.state.document.elements).toHaveLength(createStarterDocument().elements.length);
    expect(vm.state.analysis.bounds).toEqual([]);
    expect(vm.state.notice.message).toContain('12 × 10');
  });

  it('keeps example elements untouched when they already fit the current field', () => {
    const vm = new ExpoSketchViewModel(fakeRepository());
    vm.resizeField(40, 20);
    const example = createStarterDocument().elements;
    vm.applyExampleContent();
    expect(vm.state.document.field).toEqual({ width: 40, height: 20 });
    expect(vm.state.document.elements).toEqual(example);
    expect(vm.state.analysis.bounds).toEqual([]);
  });

  it('restores the whole example document including the starter field size', () => {
    const vm = new ExpoSketchViewModel(fakeRepository());
    vm.resizeField(12, 10);
    vm.restoreExampleDocument();
    expect(vm.state.document).toEqual(createStarterDocument());
    expect(vm.state.document.field).toEqual({ width: 28, height: 18 });
  });
});
