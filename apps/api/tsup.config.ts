import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  sourcemap: true,
  clean: true,
  // Bundle everything (workspace packages and npm dependencies) into one file, so the production
  // container needs only Node and dist/, with no node_modules.
  noExternal: [/.*/],
  // Some CommonJS dependencies call require() for Node built-ins; give the ESM bundle one.
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
});
