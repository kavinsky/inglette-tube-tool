import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: ['dist/**', '**/*.d.ts'],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    // Node environment for config files
    files: ['vite.config.*', 'eslint.config.*'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    rules: {
      // Domain uses single-letter physics notation (R, D, t, n) — allow as-is
      'vue/prop-name-casing': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'never', component: 'always' } }],
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },
]
