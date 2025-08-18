import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disable for now due to issues
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-redux'],
});