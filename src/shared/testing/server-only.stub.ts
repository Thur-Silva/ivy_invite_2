/**
 * Substituto de `server-only` para rodar código de servidor fora do Next.
 *
 * O pacote real não tem comportamento: é um marcador que o bundler do Next usa
 * para transformar em erro de build qualquer import vindo do navegador. Fora do
 * Next ele não resolve, e o smoke test precisa instanciar o repositório Neon.
 *
 * Só o `vitest.live.config.mts` aponta para cá. A suíte normal não toca em
 * adapter de banco, então nada nela depende deste arquivo.
 */
export {};
