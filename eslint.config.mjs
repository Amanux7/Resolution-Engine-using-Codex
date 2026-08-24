import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });
const eslintConfig = [{ ignores: [".next/**", "data/local/**", "work/**"] }, ...compat.extends("next/core-web-vitals")];
export default eslintConfig;
