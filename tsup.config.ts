import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["source/index.ts"],
  format: "esm",
  dts: true,
  sourcemap: false,
  clean: true,
  minify: true,
  treeshake: true,
  skipNodeModulesBundle: true,
  splitting: true,
  outDir: "dist",
  target: "esnext",
  swc: true,
});
