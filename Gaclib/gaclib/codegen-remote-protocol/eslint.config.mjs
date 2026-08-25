import eslintShared from '@gaclib-shared/eslint-shared';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['prepare.js', 'src/Import/**'],
    },
    ...eslintShared,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    }
);
