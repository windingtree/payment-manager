module.exports = {
    'extends': 'eslint:recommended',
    'env': {
        'es6': true,
        'browser': true,
        'node': true,
        'mocha': true,
        'jest': true
    },
    'globals': {
        'artifacts': false,
        'contract': false,
        'assert': false,
        'web3': false
    },
    'parserOptions': {
        'ecmaVersion': 8
    },
    'rules': {
        'indent': ['error', 4, {
            'SwitchCase': 1
        }],
        'quotes': [2, 'single']
    }
};
