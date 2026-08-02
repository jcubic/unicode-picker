import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM library + tree-shakable data/adapters subpaths
  {
    entry: {
      index: 'src/index.ts',
      'data/index': 'providers/data/index.ts',
      adapters: 'providers/adapters.ts',
    },
    format: ['esm'],
    target: 'es2022',
    dts: true,
    sourcemap: true,
    treeshake: true,
    splitting: true,
    clean: true,
    outDir: 'dist',
  },
  // Browser IIFE: exposes window.Picker (bundles the core, no character data)
  {
    entry: { 'unicode-picker': 'src/iife.ts' },
    format: ['iife'],
    target: 'es2020',
    minify: true,
    sourcemap: true,
    dts: false,
    clean: false,
    outDir: 'dist',
  },
  // Browser IIFE: full character dataset -> window.UnicodePickerData (heavy, opt-in)
  {
    entry: { 'unicode-picker-data': 'providers/data/iife.ts' },
    format: ['iife'],
    globalName: 'UnicodePickerData',
    target: 'es2020',
    minify: true,
    sourcemap: true,
    dts: false,
    clean: false,
    outDir: 'dist',
  },
]);
