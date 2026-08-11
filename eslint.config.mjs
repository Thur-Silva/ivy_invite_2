import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * The Dependency Rule, enforced by the linter.
 *
 * DDD layering is worthless if it is only a folder convention: the first time
 * someone imports Drizzle into an aggregate "just this once", the architecture
 * is gone. These `no-restricted-imports` zones make each violation a CI failure
 * instead of a code-review argument.
 *
 *   domain        -> may import: shared/kernel only
 *   application   -> may import: domain, shared/kernel, shared/application
 *   infrastructure-> may import: everything inward (adapters live here)
 *   presentation  -> may import: application DTOs, its own context, shared, ui
 *   contexts      -> must NOT import each other (integrate at src/app instead)
 *
 * Docs: docs/architecture/README.md
 */
const DOMAIN_FORBIDDEN = [
  {
    group: [
      '**/application/**',
      '**/infrastructure/**',
      '**/presentation/**',
      'next/**',
      'react',
      'react-dom',
      'drizzle-orm',
      'drizzle-orm/**',
      '@neondatabase/**',
      'zod',
      'motion',
      'motion/**',
      'three',
      '@react-three/**',
    ],
    message:
      'Camada de domínio: só pode depender de si mesma e de @/shared/kernel. ' +
      'Frameworks, ORMs e UI ficam em infrastructure/ ou presentation/.',
  },
];

const APPLICATION_FORBIDDEN = [
  {
    group: [
      '**/infrastructure/**',
      '**/presentation/**',
      'next/**',
      'react',
      'react-dom',
      'drizzle-orm',
      'drizzle-orm/**',
      '@neondatabase/**',
      'motion',
      'motion/**',
      'three',
      '@react-three/**',
    ],
    message:
      'Camada de aplicação: orquestra o domínio através de portas. ' +
      'Adapters concretos são resolvidos no composition root.',
  },
];

const CROSS_CONTEXT_FORBIDDEN = [
  {
    group: ['@/contexts/rsvp/**'],
    message:
      'Bounded Contexts não se importam mutuamente. Integre em src/app/ ' +
      '(composição de página) ou via evento de domínio.',
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    name: 'ddd/domain-layer',
    files: ['src/contexts/*/domain/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: DOMAIN_FORBIDDEN }],
    },
  },

  {
    name: 'ddd/application-layer',
    files: ['src/contexts/*/application/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: APPLICATION_FORBIDDEN }],
    },
  },

  {
    name: 'ddd/context-isolation',
    files: ['src/contexts/celebration/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: CROSS_CONTEXT_FORBIDDEN }],
    },
  },

  {
    name: 'ddd/shared-kernel-is-pure',
    files: ['src/shared/kernel/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/contexts/**', 'next/**', 'react', 'drizzle-orm/**'],
              message:
                'O Shared Kernel é compartilhado por todos os contextos: ' +
                'não pode conhecer nenhum deles nem depender de framework.',
            },
          ],
        },
      ],
    },
  },

  globalIgnores(['.next/**', 'out/**', 'build/**', 'drizzle/**', 'next-env.d.ts']),
]);

export default eslintConfig;
