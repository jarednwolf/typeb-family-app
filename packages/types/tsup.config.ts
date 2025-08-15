import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disable for now, we'll handle types differently
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  bundle: true,
  skipNodeModulesBundle: true,
});