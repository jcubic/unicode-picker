import { describe, it, expect, beforeEach } from 'vitest';
import Picker from '../../src/index';
import type { PickerBlock } from '../../src/data/types';

const DATA: PickerBlock[] = [{ name: 'Arrows', characters: '←↑→' }];

function sr(picker: { element: HTMLElement }): ShadowRoot {
  return picker.element.shadowRoot!;
}

describe('async data states', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('shows a loading state while an async source is pending', async () => {
    let resolveIt!: (b: PickerBlock[]) => void;
    const pending = new Promise<PickerBlock[]>((res) => {
      resolveIt = res;
    });
    const picker = Picker({ include: () => pending }).append(document.body).show();

    expect(sr(picker).querySelector('.state')!.textContent).toContain('Loading');

    resolveIt(DATA);
    await pending;
    await new Promise((r) => setTimeout(r, 0));

    expect(sr(picker).querySelector('.state')).toBeNull();
    expect(sr(picker).querySelectorAll('.cells button')).toHaveLength(3);
  });

  it('shows an error state when the source rejects', async () => {
    const picker = Picker({ include: async () => Promise.reject(new Error('offline')) })
      .append(document.body)
      .show();

    for (let i = 0; i < 50; i++) {
      if (sr(picker).querySelector('.state')?.textContent?.includes('Failed')) break;
      await new Promise((r) => setTimeout(r, 0));
    }
    const state = sr(picker).querySelector('.state')!;
    expect(state.textContent).toContain('Failed to load');
    expect(state.textContent).toContain('offline');
  });

  it('loads data only once across multiple shows', async () => {
    let calls = 0;
    const picker = Picker({
      include: () => {
        calls++;
        return DATA;
      },
    }).append(document.body);

    picker.show();
    await new Promise((r) => setTimeout(r, 0));
    picker.hide();
    picker.show();
    await new Promise((r) => setTimeout(r, 0));

    expect(calls).toBe(1);
  });
});
