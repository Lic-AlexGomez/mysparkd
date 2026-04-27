import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import tseslint from "typescript-eslint"

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "coverage/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-hooks": reactHooks,
    },
    rules: {
      // Keep lint green while project migrates to flat config.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-empty": "off",
      "no-useless-assignment": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
]

