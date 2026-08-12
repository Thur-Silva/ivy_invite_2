import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Configuração separada para o smoke test que **envia e-mail de verdade**.
 *
 * Existe para que a suíte normal (`npm run verify`) não possa disparar envio por
 * acidente: `vitest.config.mts` só inclui `*.spec.ts`, e este só inclui
 * `*.live.ts`. Nenhum arquivo casa nos dois.
 *
 * Sem timeout curto: um envio real leva ~1,2s por mensagem, e o teste de
 * idempotência faz dois seguidos.
 *
 * O `alias` de `server-only` existe porque o repositório Neon começa com
 * `import 'server-only'`, que é um marcador resolvido pelo bundler do Next e não
 * existe fora dele. Aqui ele vira um módulo vazio. Trocar por um stub é seguro:
 * o pacote não tem comportamento, só quebra o build quando alguém o importa do
 * navegador, e este teste roda em Node.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      'server-only': fileURLToPath(
        new URL('./src/shared/testing/server-only.stub.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.live.ts'],
    testTimeout: 60_000,
    // Sequencial: os casos compartilham a mesma cota do serviço, e paralelizar
    // só aumentaria a chance de bater no limite de pico.
    fileParallelism: false,
    reporters: ['default'],
  },
});
