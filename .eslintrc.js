module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
  },
  extends: ["eslint:recommended", "plugin:jest/all"],
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
    "jest/valid-title": 0,
  },
  plugins: ["jest"],
};
