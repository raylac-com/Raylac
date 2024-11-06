import pluginSecurity from 'eslint-plugin-security';
import pluginReact from "eslint-plugin-react";
import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';

export default tseslint.config(
  eslint.configs.recommended,
  pluginSecurity.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/**/*.ts', 'packages/**/*.tsx', 'packages/**/*.js'],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ["packages/app/**"],
    plugins: {
      react: pluginReact,
    },
    rules: {
      "react/jsx-no-literals": "error"
    }
  },
  {
    files: ['packages/sync/**', 'packages/scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      'packages/contracts/dependencies',
      'packages/scripts/',
      '**/out/',
      '**/metro.config.js',
    ],
  }
);
