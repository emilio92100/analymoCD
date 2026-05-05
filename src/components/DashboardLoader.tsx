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
          <img src="/favicon.svg" alt="Verimo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
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
