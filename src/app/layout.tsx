import type { Metadata, Viewport } from 'next';
import { Cinzel_Decorative, Great_Vibes, Quicksand } from 'next/font/google';
import type { ReactNode } from 'react';
import { EnchantedPond } from '@/graphics/enchanted-pond/EnchantedPond';
import './globals.css';
import { SmoothScroll } from './_components/SmoothScroll';

/**
 * Type scale of the invitation:
 *  - Cinzel Decorative — regal display type for names and headings;
 *  - Great Vibes — the storybook script used sparingly, for asides;
 *  - Quicksand — rounded, friendly body type that stays legible at 14px.
 *
 * `latin-ext` is required: "não", "presença" and "vitória-régia" all need it.
 */
const displayFont = Cinzel_Decorative({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});

const scriptFont = Great_Vibes({
  subsets: ['latin', 'latin-ext'],
  weight: ['400'],
  variable: '--font-vibes',
  display: 'swap',
});

const bodyFont = Quicksand({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ivy faz 2 anos • A Princesa e o Sapo',
  description:
    'Convite para o aniversário de 2 anos da Ivy. Confirme sua presença e veja como chegar à festa.',
  applicationName: 'Convite da Ivy',
  openGraph: {
    title: 'Ivy faz 2 anos — A Princesa e o Sapo',
    description: 'Um convite do reino encantado. Confirme sua presença!',
    locale: 'pt_BR',
    type: 'website',
  },
  // A private family invitation has no business in search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Never block pinch-zoom: it is an accessibility feature, not a nuisance.
  maximumScale: 5,
  themeColor: '#0b2e23',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${displayFont.variable} ${scriptFont.variable} ${bodyFont.variable}`}
    >
      <body className="antialiased">
        <EnchantedPond />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
