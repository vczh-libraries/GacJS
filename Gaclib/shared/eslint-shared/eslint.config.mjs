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
            "@typescript-eslint/restrict-template-expressions": "off"
        }
    }
);
