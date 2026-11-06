import eslintShared from '@gaclib-shared/eslint-shared';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    ...eslintShared,
    {
        ignores: ['build-cli.mjs'],
    },
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    }
);
