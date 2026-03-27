import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/app.ts'],
  format: ['esm'],
  outDir: 'api/.build',
  dts: false,
  noExternal: ['@kanbambam/shared'],
  clean: true,
})
