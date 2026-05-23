import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".next", "node_modules", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      // Empty arrow functions are a legitimate pattern for default/no-op callbacks
      // (e.g., `onChange = () => {}`, `.catch(() => {})`). Empty function declarations
      // and methods usually signal forgotten implementation and stay flagged.
      "@typescript-eslint/no-empty-function": [
        "error",
        { allow: ["arrowFunctions"] },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      // Disabled: False positives with lucide-react ForwardRefExoticComponent types.
      // Code is still type-safe via explicit interface typing (e.g., NavItem, StudioTab).
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // Prevent tabnabbing: any <a target="_blank"> must set rel="noopener noreferrer".
      // Codebase is already compliant; this rule guards against regression. See issue #510.
      "react/jsx-no-target-blank": "error",
      // React Compiler advisory rules (introduced in eslint-plugin-react-hooks v6).
      // These flag patterns that block compiler memoization — useful guidance, but
      // they don't represent bugs and we don't auto-rewrite components for them
      // in this template. Demoted to warn so forkers see the hints without CI breaking.
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    // Tests use node:test, where describe()/it() return promises by protocol —
    // you don't await them at the call site, so no-floating-promises misfires.
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);
