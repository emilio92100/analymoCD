import { motion } from 'framer-motion';

/**
 * Loader premium utilisé sur les pages du dashboard (HomeView, MesAnalyses, Compare, Support…)
 * Affiche le logo Verimo avec un anneau orbital animé.
 */
export default function DashboardLoader({ message }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        gap: 20,
      }}
    >
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2.5px solid #edf2f7',
            borderTopColor: '#2a7d9c',
          }}
        />
        <div style={{ position: 'absolute', inset: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={48} height={48} viewBox="0 0 72 72">
            <path d="M36 10 L60 20 L60 40 Q60 58 36 66 Q12 58 12 40 L12 20 Z" fill="#2a7d9c" />
            <path d="M22 32 L36 50 L50 32" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f2d3d', margin: '0 0 4px' }}>Verimo</p>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', margin: 0 }}>
          {message || 'Chargement…'}
        </p>
      </div>
    </motion.div>
  );
}
