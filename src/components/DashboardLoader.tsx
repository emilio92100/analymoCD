import { motion } from 'framer-motion';

/**
 * Loader premium utilisé sur les pages du dashboard (HomeView, MesAnalyses, Compare)
 * Évite le flash "vide → rempli" le temps que les analyses se chargent depuis Supabase.
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
        gap: 16,
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '3px solid #edf2f7',
          borderTopColor: '#2a7d9c',
        }}
      />
      <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: 0 }}>
        {message || 'Chargement…'}
      </p>
    </motion.div>
  );
}
