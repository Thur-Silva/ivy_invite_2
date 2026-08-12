import type { SupportedProvider } from '@/shared/auth/auth';
import { CrownGlyph } from '@/ui/ornaments/Glyphs';
import { signInWithProvider } from './actions/auth.actions';
import { GoogleGlyph } from './GoogleGlyph';

/**
 * Ocupa o lugar do campo de nome até o convidado entrar.
 *
 * Server Component: os botões são `<form>` com Server Action, então funcionam
 * sem JavaScript, igual ao resto do convite. O Auth.js precisa de um POST para
 * gerar o state de CSRF do fluxo OAuth, o que descarta usar um link simples.
 *
 * A promessa de privacidade não é enfeite. Pedir login num convite de festa
 * levanta a pergunta "por que vocês querem minha conta?", e a resposta precisa
 * estar visível antes do clique, não escondida numa política.
 *
 * Continua percorrendo uma lista mesmo com um provedor só. Custa uma linha e
 * deixa o caminho aberto para voltar a ter dois sem reescrever a tela.
 */
export function SignInCard({ providers }: { providers: readonly SupportedProvider[] }) {
  return (
    <div className="surface-pad flex flex-col items-center gap-5 rounded-3xl px-6 py-8 text-center">
      <span className="text-gold-400">
        <CrownGlyph className="h-10 w-10" />
      </span>

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-gold-400 text-xl">Faça login para confirmar presença</h3>
        <p className="text-cream/70 max-w-[34ch] text-sm leading-relaxed text-balance">
          É só para garantir uma resposta por convidado. Usamos apenas seu primeiro nome, e você
          pode corrigi-lo depois.
        </p>
      </div>

      {providers.length === 0 ? (
        <p className="border-blush-500/40 bg-blush-500/10 text-blush-300 rounded-2xl border px-4 py-3 text-xs leading-relaxed">
          Login ainda não configurado. Preencha <code className="font-mono">AUTH_GOOGLE_ID</code> e{' '}
          <code className="font-mono">AUTH_GOOGLE_SECRET</code> para liberar esta etapa.
        </p>
      ) : (
        <div className="flex w-full flex-col gap-3">
          {providers.map((provider) => (
            <form key={provider} action={signInWithProvider.bind(null, provider)}>
              <button
                type="submit"
                className="bg-cream text-pond-950 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full px-5 py-3.5 text-sm font-semibold transition hover:bg-white active:scale-[0.98]"
              >
                <GoogleGlyph className="h-5 w-5" />
                Entrar com Google
              </button>
            </form>
          ))}
        </div>
      )}

      <p className="text-cream/40 text-[0.7rem] leading-relaxed">
        Não publicamos nada e não guardamos sua senha.
      </p>
    </div>
  );
}
