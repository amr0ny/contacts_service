module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // This line adds Prettier
  ],
  parserOptions: {
    ecmaVersion: 2016,
    sourceType: 'commonjs',
  },
  rules: {
    // You can add custom rules here
  },
};
