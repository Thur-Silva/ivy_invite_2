import { GuestAccount } from '@/contexts/rsvp/domain/value-objects/guest-account';
import { RsvpForm } from '@/contexts/rsvp/presentation/RsvpForm';
import { SignInCard } from '@/contexts/rsvp/presentation/SignInCard';
import { auth, enabledProviders, type SupportedProvider } from '@/shared/auth/auth';
import { Reveal } from '@/ui/Reveal';
import { invitationCopy } from '../_content/invitation-copy';
import { SectionShell } from './SectionShell';

/**
 * A razão de o site existir.
 *
 * Server Component com duas caras. Sem sessão, mostra "Faça login para
 * confirmar presença"; com sessão, o mesmo cartão dá lugar ao formulário de
 * sempre, agora com o primeiro nome já preenchido.
 *
 * A decisão acontece **no servidor**, e é isso que torna a porta real: o
 * formulário nem chega ao navegador de quem não entrou. Um controle apenas
 * visual seria contornável pelo DevTools, e a Server Action confere a sessão de
 * novo antes de gravar qualquer coisa.
 *
 * Ler a sessão torna a página dinâmica, o que ela não era. É o preço do login, e
 * vale: o convite continua leve porque o conteúdo pesado (lago WebGL, mapa,
 * confete) já carregava sob demanda.
 */
export async function RsvpSection() {
  const session = await auth();

  const isSignedIn =
    session !== null &&
    session.provider !== undefined &&
    session.providerSubject !== undefined &&
    typeof session.user?.email === 'string';

  return (
    <SectionShell
      id="presenca"
      title={invitationCopy.rsvp.title}
      subtitle={invitationCopy.rsvp.subtitle}
    >
      <Reveal>
        {isSignedIn ? (
          <RsvpForm
            suggestedName={suggestFirstName(
              session.provider,
              session.providerSubject,
              session.user,
            )}
            accountEmail={session.user?.email ?? ''}
          />
        ) : (
          <SignInCard providers={enabledProviders.map((provider) => provider.id)} />
        )}
      </Reveal>
    </SectionShell>
  );
}

/**
 * Deduz o primeiro nome pela mesma regra do domínio.
 *
 * Passa pelo Value Object de propósito, em vez de repetir a lógica aqui: o
 * palpite que a pessoa vê no campo é exatamente o que o domínio produziria, e
 * existe um único lugar para mudar a regra. Se a conta não montar (dado
 * inesperado do provedor), o campo fica em branco e ela digita, em vez de a
 * seção inteira quebrar.
 */
function suggestFirstName(
  provider: string | undefined,
  subject: string | undefined,
  user: { email?: string | null; name?: string | null } | undefined,
): string {
  try {
    return GuestAccount.create({
      provider: provider ?? '',
      subject: subject ?? '',
      email: user?.email ?? '',
      displayName: user?.name ?? '',
    }).suggestedFirstName();
  } catch {
    return '';
  }
}

/** Reexportado só para o tipo ficar visível a quem lê a seção. */
export type { SupportedProvider };
