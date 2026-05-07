import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([
  globalIgnores([".next/**", ".next-dev/**", "out/**", "build/**"]),
  {
    extends: [...next],
  },
]);
