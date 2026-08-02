// IIFE entry: exposes the factory as `window.Picker` for <script> usage.
import Picker from './index';

declare global {
  interface Window {
    Picker: typeof Picker;
  }
}

window.Picker = Picker;
