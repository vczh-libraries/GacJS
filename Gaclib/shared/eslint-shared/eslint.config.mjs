import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        ignores: [
            "eslint.config.mjs",
            "vitest.config.js",
            "node_modules/**/*",
            "lib/**/*",
            "dist/**/*"
        ]
    },
    {
        files: [
            "src/**/*.ts",
            "test/**/*.ts"
        ]
    },
    {
        rules: {
            "@typescript-eslint/no-base-to-string": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/strict-boolean-expressions": ["error", {
                "allowString": false,           // Disallow if (str) - could be empty string
                "allowNumber": false,           // Disallow if (num) - could be 0
                "allowNullableObject": true,    // Allow if (obj) - checking for null/undefined is OK
                "allowNullableBoolean": false,  // Disallow if (bool) when bool can be null
                "allowNullableString": false,   // Disallow if (str) when str can be null/empty
                "allowNullableNumber": false,   // Disallow if (num) when num can be null/0
                "allowAny": false               // Disallow if (any)
            }],
            "quotes": ["error", "single", {
                "avoidEscape": true,
                "allowTemplateLiterals": true
            }]
        }
    }
);
