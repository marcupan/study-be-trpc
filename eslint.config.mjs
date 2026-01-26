import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';

export default tseslint.config(
    // Base configurations
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,

    // Import plugin configuration
    {
        plugins: {
            'import-x': importX,
        },
        rules: {
            // Import order is handled by Prettier via @ianvs/prettier-plugin-sort-imports
            // Disabling ESLint import ordering to avoid conflicts
            'import-x/order': 'off',
            'import-x/first': 'error',
            'import-x/newline-after-import': 'error',
            'import-x/no-duplicates': 'error',
            'import-x/no-unresolved': 'off', // TypeScript handles this
            'import-x/no-default-export': 'off', // Next.js requires default exports
        },
    },

    // TypeScript-specific rules
    {
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.json', './packages/*/tsconfig.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // Variables and parameters
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',

            // Promises and async
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/promise-function-async': 'error',

            // Type safety (relaxed for practicality)
            '@typescript-eslint/strict-boolean-expressions': [
                'error',
                {
                    allowString: true, // Allow strings in conditionals (common pattern)
                    allowNumber: false, // Disallow numbers (prevent 0/NaN bugs)
                    allowNullableObject: true, // Allow nullable objects (common pattern)
                    allowNullableBoolean: true, // Allow nullable booleans
                    allowNullableString: true, // Allow nullable strings
                    allowNullableNumber: false, // Disallow nullable numbers
                    allowAny: false, // Disallow any type
                },
            ],
            '@typescript-eslint/no-unnecessary-condition': 'error',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',

            // Best practices
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'inline-type-imports',
                },
            ],
            '@typescript-eslint/no-import-type-side-effects': 'error',
            '@typescript-eslint/array-type': ['error', {default: 'array-simple'}],
            '@typescript-eslint/prefer-for-of': 'error',
            '@typescript-eslint/prefer-includes': 'error',
            '@typescript-eslint/prefer-string-starts-ends-with': 'error',

            // Naming conventions
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
                {
                    selector: 'interface',
                    format: ['PascalCase'],
                    custom: {
                        regex: '^I[A-Z]',
                        match: false,
                    },
                },
            ],
        },
    },

    // Client package overrides for tRPC type inference
    {
        files: ['packages/client/**/*.ts', 'packages/client/**/*.tsx'],
        rules: {
            // Relax strict rules for tRPC's complex type inference
            // tsc validates these correctly, but ESLint's parser struggles with deeply nested generics
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',
            // Allow flexible boolean expressions (e.g., if (loading), if (data))
            '@typescript-eslint/strict-boolean-expressions': 'off',
        },
    },

    // Files to ignore
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/.turbo/**',
            '**/build/**',
            '**/coverage/**',
            '**/*.config.js',
            '**/*.config.mjs',
            '**/next-env.d.ts',
            '**/prisma/migrations/**',
        ],
    }
);
