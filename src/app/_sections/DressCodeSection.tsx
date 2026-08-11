import type { CelebrationView } from '@/contexts/celebration/application/dto/celebration.view';
import { DressCodeCard } from '@/contexts/celebration/presentation/DressCodeCard';
import { Reveal } from '@/ui/Reveal';
import { invitationCopy } from '../_content/invitation-copy';
import { SectionShell } from './SectionShell';

/** O que vestir. Fica depois da confirmação: primeiro o "sim", depois o resto. */
export function DressCodeSection({ celebration }: { celebration: CelebrationView }) {
  return (
    <SectionShell
      id="traje"
      title={invitationCopy.dressCode.title}
      subtitle={invitationCopy.dressCode.subtitle}
    >
      <Reveal>
        <DressCodeCard celebration={celebration} />
      </Reveal>
    </SectionShell>
  );
}
