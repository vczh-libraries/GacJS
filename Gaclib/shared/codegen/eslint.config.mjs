import eslintShared from 'eslint-shared';
import tseslint from 'typescript-eslint';

export default tseslint.config(
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
