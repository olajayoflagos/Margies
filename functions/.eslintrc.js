module.exports = {
  env: {
    node: true,
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
      "no-process-env": "off", // Allow process.env
    "global-require": "off" // Allow require() anywhere
  },
};
