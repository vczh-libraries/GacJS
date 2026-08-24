import eslintShared from '@gaclib-shared/eslint-shared';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    ...eslintShared,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: [
                        'test/GeneratedRuntime.test.ts',
                        'test/GeneratorTest.ts',
                    ],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    }
);
