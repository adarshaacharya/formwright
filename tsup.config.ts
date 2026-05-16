import { defineConfig } from "tsup";

export default defineConfig({
  tsconfig: "tsconfig.build.json",
  entry: {
    index: "src/index.ts",
    core: "src/core.ts",
    schema: "src/schema.ts",
    react: "src/react.ts",
    plugins: "src/plugins.ts",
    remote: "src/remote.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  treeshake: true,
  external: ["react", "react-dom", "react-hook-form"],
});
