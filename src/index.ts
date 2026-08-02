import { Picker as PickerImpl, INSERT_EVENT } from './picker';
import type { PickerInstance, PickerOptions } from './types';

/**
 * Create a Unicode character picker.
 *
 * ```ts
 * import Picker from 'unicode-picker';
 * import { emoji, greek } from 'unicode-picker/data';
 *
 * const picker = Picker({ include: [emoji, greek] });
 * picker.append(document.body);
 * button.onclick = () => picker.toggle({ anchor: button });
 * picker.on('insert', ({ char }) => editor.insert(char));
 * ```
 */
export default function Picker(options?: PickerOptions): PickerInstance {
  return new PickerImpl(options);
}

export { INSERT_EVENT };
export type {
  PickerOptions,
  PickerInstance,
  ShowOptions,
  Theme,
  InsertDetail,
  SelectDetail,
  CopyDetail,
  PickerEvent,
  PickerEventMap,
} from './types';
export type { PickerChar, PickerBlock, BlockData, BlockSource } from './data/types';
