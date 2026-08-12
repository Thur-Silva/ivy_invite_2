import { spawn } from 'node:child_process';

/**
 * Bateria completa do smoke test de e-mail. **Manda cinco e-mails de verdade.**
 *
 * Existe como script separado por dois motivos. Primeiro, descoberta: quem abre
 * o `package.json` vê que a versão completa existe, o que uma variável de
 * ambiente escondida num comentário não garante. Segundo, portabilidade:
 * `RSVP_SMOKE_FULL=1 npm run ...` é sintaxe de shell POSIX e não funciona no
 * PowerShell, que é onde este projeto é desenvolvido.
 *
 * O padrão (`npm run email:smoke`) manda **um** e-mail. Use este só quando
 * estiver mexendo nos templates e precisar ver todos os fluxos na caixa.
 */
const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vitest', 'run', '--config', 'vitest.live.config.mts'],
  { stdio: 'inherit', env: { ...process.env, RSVP_SMOKE_FULL: '1' } },
);

child.on('exit', (code) => process.exit(code ?? 1));
