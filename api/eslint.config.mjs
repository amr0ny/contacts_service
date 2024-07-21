import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["**/dist/**"],  // Игнорировать все файлы в директории dist и ее поддиректориях
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      // Здесь вы можете добавить или переопределить правила
    }
  }
];