const splunkConfig = require('@splunk/eslint-config/browser-prettier');

module.exports = [
    ...splunkConfig,
    {
        // webpack's DefinePlugin substitutes process.env.* at build time; process itself
        // is never referenced at runtime, but eslint needs to know it's a valid global.
        languageOptions: {
            globals: {
                process: 'readonly',
            },
        },
        rules: {
            // `_id` is MongoDB's/the backend API's field name, not a private-member convention.
            'no-underscore-dangle': ['error', { allow: ['_id'] }],
        },
    },
    {
        // avoid a single brace-glob ('*.{js,jsx}') here: this monorepo's forced
        // `brace-expansion` resolution is incompatible with the hoisted `minimatch` major,
        // and minimatch only exercises that code path for brace patterns.
        files: ['src/tests/**/*.js', 'src/tests/**/*.jsx'],
        languageOptions: {
            globals: {
                jest: 'readonly',
            },
        },
    },
];