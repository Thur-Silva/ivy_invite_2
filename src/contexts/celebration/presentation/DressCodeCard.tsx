import type { CelebrationView } from '../application/dto/celebration.view';

/**
 * Traje sugerido, com a paleta como amostras de cor.
 *
 * Mostrar a cor vale mais que descrevê-la: "verde musgo" significa uma coisa
 * diferente para cada convidado, enquanto o círculo pintado não deixa dúvida — e
 * o nome fica embaixo para quem não distingue bem as cores e para leitor de tela.
 */
export function DressCodeCard({ celebration }: { celebration: CelebrationView }) {
  const { dressCode } = celebration;

  return (
    <div className="surface-pad flex flex-col items-center gap-5 rounded-3xl px-6 py-7 text-center">
      <p className="font-display text-gold-400 text-xl">{dressCode.headline}</p>

      <p className="text-cream/80 max-w-[34ch] text-sm leading-relaxed text-balance">
        {dressCode.guidance}
      </p>

      <ul className="flex flex-wrap items-start justify-center gap-4">
        {dressCode.palette.map((color) => (
          <li key={color.hex} className="flex w-16 flex-col items-center gap-2">
            <span
              // A cor vem do domínio, então é estilo inline mesmo: não há como
              // uma classe estática do Tailwind conhecer um hex configurável.
              style={{ backgroundColor: color.hex }}
              className="border-cream/25 block h-11 w-11 rounded-full border shadow-[0_6px_18px_-8px_rgba(0,0,0,0.9)]"
            />
            <span className="text-cream/60 text-[0.7rem] leading-tight">{color.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
