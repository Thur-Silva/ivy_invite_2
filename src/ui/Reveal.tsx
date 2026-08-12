'use client';

import { motion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

const variants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Reveals its children once, when they scroll into view.
 *
 * `whileInView` + `once` rather than a scroll-linked animation: on a phone the
 * guest scrolls fast, and content that keeps re-animating reads as broken.
 * Users with `prefers-reduced-motion` get the content immediately. Motion
 * respects the media query and snaps to the final state.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'p' | 'span';
}) {
  const Component = motion[as];

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25, margin: '0px 0px -10% 0px' }}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}
