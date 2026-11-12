import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/**',
      'storybook-static/**',
      'node_modules/**',
      'public/mockServiceWorker.js',
      '.stryker-tmp/**',
      'reports/**',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // 외부 패키지 → 레이어 별칭(@/) → 같은 slice의 상대 경로 → 스타일(*.styles) 순서로 묶는다.
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^(?!@/)@?\\w'],
            ['^@/app/', '^@/pages/', '^@/features/', '^@/shared/'],
            ['^\\.'],
            ['^.+\\.styles$'],
          ],
        },
      ],
      'no-undef': 'off',
      // 전역 스타일은 Emotion의 injectGlobal 태그 템플릿으로 넣는다.
      '@typescript-eslint/no-unused-expressions': ['error', { allowTaggedTemplates: true }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^React$',
        },
      ],
      // TypeScript 사용 기준(docs/typescript.md)에서 도구로 강제하는 항목이다.
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'enum 대신 문자열 리터럴 유니온이나 as const 객체를 쓴다. (docs/typescript.md)',
        },
      ],
    },
  },
  {
    // Window에 속성을 더하는 전역 선언 병합은 interface로만 된다. type으로 쓰면 병합되지 않고 이름이 겹친다.
    files: ['src/global.d.ts', 'src/shared/lib/native-app/nativeApp.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  {
    files: ['test/**/*.{ts,tsx}'],
    rules: {
      // 테스트에서는 값이 없으면 그 줄에서 TypeError가 나 테스트가 실패하므로, 단언을 막아도 얻는 것이 없다.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // vi.mock의 importOriginal<typeof import('...')>() 관용구를 쓸 수 있게 한다.
      '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/app/**', '**/pages/**', '**/features/**'],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/app/**', '**/pages/**'],
        },
      ],
    },
  },
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/app/**'],
        },
      ],
    },
  },
);
