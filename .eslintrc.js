const options = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'eslint-plugin-local-rules'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'linebreak-style': ['error', 'unix'],
    'wrap-iife': ['error', 'inside'],
    'no-constant-condition': ['error', {checkLoops: false}],
    'no-restricted-syntax': ['error', 'BinaryExpression[operator="in"]'],
    'semi': ['error', 'always'],
    '@typescript-eslint/explicit-module-boundary-types': 0,
    'local-rules/validate-l10n': ['error'],
  },

  overrides: [
    {
      files: ['**/?(*.)+(spec|test).ts'],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
      rules: {
        'jest/expect-expect': 0,
      },
    },
  ],
};

const errorRules = [
  'guard-for-in',
  'no-extra-bind',
  'no-extra-label',
  'no-floating-decimal',
  'no-lone-blocks',
  'no-loop-func',
  'no-new',
  'no-new-wrappers',
  'no-octal-escape',
  'no-proto',
  'no-return-assign',
  'no-self-compare',
  'no-sequences',
  'no-unmodified-loop-condition',
  'no-unused-expressions',
  'no-useless-call',
  'no-useless-return',
  'require-await',
  'no-label-var',
];

const warningRules = [
  'block-scoped-var',
  'dot-notation',
  'radix',
  //   'no-console',
  'no-mixed-spaces-and-tabs',
];

errorRules.forEach(function (x) {
  options.rules[x] = 'error';
});

warningRules.forEach(function (x) {
  options.rules[x] = 'warn';
});

module.exports = options;
