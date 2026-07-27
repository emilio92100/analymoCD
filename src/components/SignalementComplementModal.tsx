import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, LifeBuoy, CheckCircle, Send } from 'lucide-react';
import { creerSignalementComplement } from '../lib/complement-support';

type Props = {
  analyseId: string;
  adresse: string;
  nomsFichiers?: string[];
  onClose: () => void;
  /** Prévient le parent que le ticket est créé, pour figer l'UI côté rapport. */
  onEnvoye?: () => void;
};

export default function SignalementComplementModal({ analyseId, adresse, nomsFichiers, onClose, onEnvoye }: Props) {
  const [message, setMessage] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Bloque le scroll du body tant que le modal est ouvert
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleEnvoyer = async () => {
    if (envoi) return;
    setEnvoi(true);
    setErreur(null);
    const res = await creerSignalementComplement({ analyseId, adresse, messageClient: message, nomsFichiers });
    if (res.ok) { setEnvoye(true); onEnvoye?.(); }
    else { setErreur(res.error || 'Une erreur est survenue.'); setEnvoi(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>

      <div onClick={!envoi ? onClose : undefined}
        style={{ position: 'absolute', inset: 0, background: 'rgba(15,45,61,0.6)', backdropFilter: 'blur(4px)' }} />

      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        style={{ position: 'relative', width: '100%', maxWidth: 560, background: '#fff', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {envoye ? (
          /* ── Écran de confirmation ── */
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 260 }}
              style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
              <CheckCircle size={36} style={{ color: '#16a34a' }} />
            </motion.div>

            <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
              Votre signalement a bien été envoyé
            </div>
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, maxWidth: 400, margin: '0 auto' }}>
              Notre équipe a été prévenue et va traiter votre dossier rapidement.
              Nous revenons vers vous dès que la mise à jour est de nouveau disponible.
              <br /><br />
              Vous pouvez suivre l'échange à tout moment depuis l'onglet <strong>Support</strong> de votre espace.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
              {/* Navigation dure : on quitte le rapport pour l'espace support,
                  qui vit dans une autre route du dashboard. */}
              <button onClick={() => { window.location.href = '/dashboard/support'; }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 10, border: 'none', background: '#0f2d3d', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <LifeBuoy size={15} /> Voir ma demande
              </button>
              <button onClick={onClose}
                style={{ padding: '11px 22px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Retour au rapport
              </button>
            </div>
          </div>
        ) : (
          /* ── Formulaire ── */
          <>
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LifeBuoy size={18} style={{ color: '#c2410c' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Signaler au support</div>
                  <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 1 }}>Nous prenons le relais sur votre dossier</div>
                </div>
              </div>
              {!envoi && (
                <button onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={16} color="#64748b" />
                </button>
              )}
            </div>

            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7, marginBottom: 18 }}>
                La mise à jour de votre dossier n'a pas abouti après plusieurs tentatives.
                Votre rapport d'origine reste intact. En envoyant ce signalement, notre équipe
                reçoit automatiquement le détail technique et reprend la main sur votre dossier.
              </div>

              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 7 }}>
                Précisez ce que vous cherchiez à ajouter <span style={{ fontWeight: 500, color: '#94a3b8' }}>(facultatif)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={envoi}
                rows={4}
                placeholder="Ex : j'essayais d'ajouter le pré-état daté et les deux derniers PV d'AG…"
                style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13.5, fontFamily: 'inherit', resize: 'vertical', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />

              {erreur && (
                <div style={{ marginTop: 12, padding: '10px 13px', borderRadius: 9, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12.5, color: '#b91c1c' }}>
                  {erreur}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                {!envoi && (
                  <button onClick={onClose}
                    style={{ flex: '0 0 auto', padding: '11px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Annuler
                  </button>
                )}
                <button onClick={handleEnvoyer} disabled={envoi}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, border: 'none', background: envoi ? '#94a3b8' : '#0f2d3d', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: envoi ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                  <Send size={14} />
                  {envoi ? 'Envoi en cours…' : 'Envoyer le signalement'}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
