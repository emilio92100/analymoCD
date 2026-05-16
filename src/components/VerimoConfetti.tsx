import { motion } from 'framer-motion';

/**
 * Palette confettis Verimo — référence aux couleurs du score
 * Partagée entre HomePage, TarifsPage, MethodePage, ContactPage, MandatairesPage.
 */
export const VERIMO_CONFETTI_COLORS = {
  green: '#10b981',   // score haut
  orange: '#f97316',  // vigilance
  red: '#ef4444',     // alerte
  blue: '#2a7d9c',    // bleu Verimo
};

export type ConfettiItem = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: number;
  color: string;
  shape: 'circle' | 'square';
  delay?: number;
};

// Détection low-perf (iOS Safari + mobile) — animations désactivées
const isIOS = () =>
  typeof window !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  !(window as any).MSStream;
const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
const _lp = isIOS() || isMobile();

/**
 * Composant confettis Verimo — utilise position absolute pour être posé
 * dans un parent en position relative.
 * Sur low-perf devices, les animations sont automatiquement désactivées (les confettis restent visibles mais statiques).
 */
export function VerimoConfetti({ items }: { items: ConfettiItem[] }) {
  return (
    <>
      {items.map((c, i) => (
        <motion.div
          key={i}
          animate={_lp ? {} : { y: [0, -8, 0], rotate: c.shape === 'square' ? [45, 90, 45] : [0, 360, 0] }}
          transition={_lp ? {} : { duration: 4 + i * 0.3, repeat: Infinity, delay: c.delay || 0, ease: 'easeInOut' }}
          style={{
            position: 'absolute' as const,
            top: c.top,
            bottom: c.bottom,
            left: c.left,
            right: c.right,
            width: c.size,
            height: c.size,
            background: c.color,
            borderRadius: c.shape === 'circle' ? '50%' : '2px',
            transform: c.shape === 'square' ? 'rotate(45deg)' : undefined,
            opacity: 0.6,
            pointerEvents: 'none' as const,
            zIndex: 1,
          }}
        />
      ))}
    </>
  );
}
