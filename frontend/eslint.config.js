// ESLint (flat config): typescript-eslint med typeinformation, React Hooks, jsx-a11y og Prettier.
// Projektets kodestil fra rules/typescript-react.md håndhæves med reglerne nederst.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const enumDeclaration = {
  selector: "TSEnumDeclaration",
  message: "Brug en string literal union i stedet for enum.",
};
const defaultExport = {
  selector: "ExportDefaultDeclaration",
  message: "Brug named exports.",
};
const dangerousHtml = {
  selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
  message: "dangerouslySetInnerHTML må ikke bruges.",
};
const inlineStyle = {
  selector: "JSXAttribute[name.name='style']",
  message: "Ingen inline styles. Brug Tailwind-klasser.",
};
const throwStatement = {
  selector: "ThrowStatement",
  message: "Egen kode throw'er ikke. Returnér et Result<T>.",
};

export default defineConfig([
  globalIgnores(["dist", "coverage", "playwright-report", "test-results", "node_modules"]),

  // Alle TypeScript-filer.
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-console": "error",
      "no-var": "error",
      "prefer-const": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },

  // Egen kode i src (ikke shadcn-genererede komponenter).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      "no-restricted-syntax": [
        "error",
        enumDeclaration,
        defaultExport,
        dangerousHtml,
        inlineStyle,
        throwStatement,
      ],
    },
  },

  // shadcn-genererede komponenter holdes tæt på det genererede (Progress bruger fx style til
  // indikatorens position), men enum, default export og dangerouslySetInnerHTML er stadig forbudt.
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", enumDeclaration, defaultExport, dangerousHtml],
    },
  },

  // ViewModels må kaste inde i TanStack Querys queryFn (eneste tilladte undtagelse).
  {
    files: ["src/widgets/**/use*Widget.ts"],
    rules: {
      "no-restricted-syntax": ["error", enumDeclaration, defaultExport, dangerousHtml, inlineStyle],
    },
  },

  // Konfigurationsfiler og browsertests kører i Node.
  {
    files: ["*.config.ts", "build/**/*.ts", "e2e/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Selve ESLint-konfigurationen er JavaScript uden typeinformation.
  {
    files: ["**/*.js"],
    extends: [js.configs.recommended, prettier],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Service workeren kører i browserens service worker-miljø, ikke i Node.
  {
    files: ["build/serviceWorker.template.js"],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
]);
