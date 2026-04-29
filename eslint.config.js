import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// ── Tier-authority guardrail ─────────────────────────────────────────────────
// Bans direct reads of `profile.subscription_tier` and `profile.effective_tier`.
// The only allowed source for the user's tier is the canonical `tier` /
// `isPro` / `isUltra` / `canUseAgent()` exposed by AuthContext (see
// src/context/AuthContext.jsx). Reading the raw column elsewhere causes
// the cross-component drift the user hit in Apr 2026 (sidebar said FREE
// while Settings said ULTRA PRO). This rule keeps it from coming back.
//
// The two AuthContext files are exempted via the per-file override below
// because they are the ones legitimately reading `profile.effective_tier`
// to compute the canonical `tier`.
const TIER_FIELD_BAN = [
  {
    selector: "MemberExpression[object.name='profile'][property.name='subscription_tier']",
    message:
      "Read `tier` / `isPro` / `isUltra` from useAuth() instead. " +
      "Direct reads of profile.subscription_tier ignore subscription expiry.",
  },
  {
    selector: "MemberExpression[object.name='profile'][property.name='effective_tier']",
    message:
      "Read `tier` from useAuth() instead. AuthContext is the single source of truth.",
  },
  // Catch the optional-chained variants too: `profile?.subscription_tier`.
  {
    selector: "ChainExpression > MemberExpression[object.name='profile'][property.name='subscription_tier']",
    message:
      "Read `tier` / `isPro` / `isUltra` from useAuth() instead. " +
      "Direct reads of profile.subscription_tier ignore subscription expiry.",
  },
  {
    selector: "ChainExpression > MemberExpression[object.name='profile'][property.name='effective_tier']",
    message:
      "Read `tier` from useAuth() instead. AuthContext is the single source of truth.",
  },
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]', destructuredArrayIgnorePattern: '^[A-Z_]' }],
      'no-restricted-syntax': ['error', ...TIER_FIELD_BAN],
    },
  },
  {
    // Auth context owns the legitimate read of profile.effective_tier so
    // it can compute the canonical `tier` everyone else consumes.
    files: [
      'src/context/AuthContext.jsx',
      'src/context/auth-context-instance.js',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
