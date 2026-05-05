import { motion } from 'framer-motion';

/**
 * Loader premium utilisé sur les pages du dashboard (HomeView, MesAnalyses, Compare, Support…)
 * Affiche le logo Verimo avec un spinner animé.
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
        gap: 24,
      }}
    >
      <img src="/logo.png" alt="Verimo" style={{ width: 200, maxWidth: '60%', height: 'auto', objectFit: 'contain' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2.5px solid #edf2f7',
            borderTopColor: '#2a7d9c',
          }}
        />
        <p style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', margin: 0 }}>
          {message || 'Chargement…'}
        </p>
      </div>
    </motion.div>
  );
}
