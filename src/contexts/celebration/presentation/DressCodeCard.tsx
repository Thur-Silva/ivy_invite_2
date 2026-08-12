import type { CelebrationView } from '../application/dto/celebration.view';

/**
 * Traje sugerido, com a paleta como amostras de cor.
 *
 * Mostrar a cor vale mais que descrevê-la: "verde musgo" significa uma coisa
 * diferente para cada convidado, enquanto o círculo pintado não deixa dúvida. E
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

      {/*
        Grade de 4 colunas, não `flex-wrap`.

        Com `flex-wrap` e itens de largura fixa, quatro amostras somavam 304px
        contra os ~272px disponíveis num celular de 360px: a quarta caía sozinha
        numa segunda linha, centralizada, e o conjunto lia como quebrado. Na
        grade as colunas dividem o que existe, então as quatro ficam sempre na
        mesma linha e alinhadas entre si, com os nomes quebrando de forma igual.
      */}
      <ul className="grid w-full grid-cols-4 gap-x-2 gap-y-3">
        {dressCode.palette.map((color) => (
          <li key={color.hex} className="flex flex-col items-center gap-2">
            <span
              // A cor vem do domínio, então é estilo inline mesmo: não há como
              // uma classe estática do Tailwind conhecer um hex configurável.
              style={{ backgroundColor: color.hex }}
              className="border-cream/25 block aspect-square w-11 max-w-full rounded-full border shadow-[0_6px_18px_-8px_rgba(0,0,0,0.9)]"
            />
            <span className="text-cream/60 text-center text-[0.7rem] leading-tight text-balance">
              {color.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
