import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, X, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CURRENT_CGV_PRO_VERSION } from '../lib/cgv-version';

/**
 * Popup de consentement CGV Pro affichée avant le tout premier paiement pro.
 *
 * S'affiche uniquement si le pro n'a JAMAIS accepté les CGV Pro
 * (profiles.cgv_pro_accepted_at IS NULL).
 *
 * Une fois acceptée, plus jamais affichée pour ce user — même en cas de
 * changement de version des CGV (cf cgv-version.ts).
 */

type Props = {
  isOpen: boolean;
  userId: string;
  /** Récap de l'action (ex: "Souscription au plan Starter — 49,90 € HT/mois") */
  actionLabel: string;
  /** Appelé quand le pro accepte ET que l'UPDATE BDD a réussi → lance le paiement */
  onAccept: () => void;
  /** Appelé quand le pro ferme la popup sans accepter */
  onCancel: () => void;
};

export default function CgvProConsentDialog({ isOpen, userId, actionLabel, onAccept, onCancel }: Props) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset l'état à chaque ouverture
  useEffect(() => {
    if (isOpen) {
      setChecked(false);
      setLoading(false);
      setError('');
    }
  }, [isOpen]);

  // Empêche le scroll body quand la popup est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  async function handleConfirm() {
    if (!checked || loading) return;
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          cgv_pro_accepted_at: new Date().toISOString(),
          cgv_pro_version: CURRENT_CGV_PRO_VERSION,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // L'acceptation est tracée en BDD → on déclenche le paiement
      onAccept();
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={!loading ? onCancel : undefined}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 45, 61, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 9998,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {/* Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: 20,
                maxWidth: 520,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(15, 45, 61, 0.35)',
                position: 'relative',
              }}
            >
              {/* Bouton fermer (en haut à droite) */}
              {!loading && (
                <button
                  onClick={onCancel}
                  aria-label="Fermer"
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#f1f5f9',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    transition: 'all 0.15s',
                    zIndex: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <X size={18} />
                </button>
              )}

              {/* Header avec icône */}
              <div style={{ padding: '32px 32px 0 32px', textAlign: 'center' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <ShieldCheck size={32} color="#0369a1" strokeWidth={2} />
                </div>
                <h2 style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  marginBottom: 8,
                  letterSpacing: '-0.02em',
                }}>
                  Conditions Générales de Vente Pro
                </h2>
                <p style={{
                  fontSize: 14,
                  color: '#64748b',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  Avant de finaliser votre premier paiement, merci de valider nos CGV Pro.
                </p>
              </div>

              {/* Récap action */}
              <div style={{ padding: '20px 32px 0 32px' }}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FileText size={16} color="#0369a1" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 2 }}>
                      VOTRE COMMANDE
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>
                      {actionLabel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox + lien CGV */}
              <div style={{ padding: '20px 32px 0 32px' }}>
                <label
                  htmlFor="cgv-pro-consent"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    cursor: 'pointer',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `2px solid ${checked ? '#0369a1' : '#e2e8f0'}`,
                    background: checked ? '#f0f9ff' : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    id="cgv-pro-consent"
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    disabled={loading}
                    style={{
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      accentColor: '#0369a1',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  />
                  <span style={{
                    fontSize: 14,
                    color: '#0f172a',
                    lineHeight: 1.5,
                  }}>
                    Je confirme avoir lu et accepté les{' '}
                    <Link
                      to="/cgv-pro"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: '#0369a1',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      Conditions Générales de Vente Pro
                      <ExternalLink size={12} />
                    </Link>
                    {' '}de Verimo.
                  </span>
                </label>
              </div>

              {/* Erreur */}
              {error && (
                <div style={{ padding: '12px 32px 0 32px' }}>
                  <div style={{
                    fontSize: 13,
                    color: '#b91c1c',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}>
                    {error}
                  </div>
                </div>
              )}

              {/* Footer boutons */}
              <div style={{ padding: '24px 32px 28px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleConfirm}
                  disabled={!checked || loading}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: !checked || loading
                      ? '#e2e8f0'
                      : 'linear-gradient(135deg, #0d3045 0%, #2a7d9c 100%)',
                    color: !checked || loading ? '#94a3b8' : '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: !checked || loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: !checked || loading ? 'none' : '0 4px 12px rgba(42, 125, 156, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                        }}
                      />
                      Enregistrement…
                    </>
                  ) : (
                    'Continuer vers le paiement'
                  )}
                </button>
                {!loading && (
                  <button
                    onClick={onCancel}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: 12,
                      border: 'none',
                      background: 'transparent',
                      color: '#64748b',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
