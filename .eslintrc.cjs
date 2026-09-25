module.exports = {
  root: true, env: { browser: true, es2022: true }, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['react', 'react-hooks'], settings: { react: { version: '18.3' } },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],
  rules: { 'react/prop-types': 'off', 'react/no-unescaped-entities': 'off', 'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], 'react/jsx-no-undef': 'error', 'no-undef': 'error' },
};
