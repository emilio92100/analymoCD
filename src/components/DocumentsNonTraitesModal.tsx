import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileWarning, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export type DocNonTraite = { nom: string; raison?: string; phase?: string };

type Props = {
  analyseId: string;
  documents: DocNonTraite[];
  /** Le bouton n'est proposé que si le complément est encore possible. */
  complementDisponible?: boolean;
  onComplement?: () => void;
  onClose: () => void;
};

/**
 * Traduit la raison technique en une phrase compréhensible.
 * On reste factuel et rassurant : le client n'a pas à décoder un code d'erreur,
 * et dans la plupart des cas le problème vient du fichier, pas de lui.
 */
function expliquer(raison?: string): string {
  switch (raison) {
    case 'timeout':
      return "Le document était trop long à traiter dans le temps imparti.";
    case 'overload':
    case 'rate_limit':
      return "Notre service connaissait un pic d'activité au moment du traitement.";
    case 'auth':
    case 'api_billing':
      return "Un incident technique de notre côté a interrompu le traitement.";
    case 'json_invalide':
    case 'erreur_interne':
      return "Le traitement de ce document n'a pas abouti.";
    case 'envoi':
    case 'other':
      return "Le fichier n'a pas pu être ouvert — il est peut-être protégé par mot de passe, scanné en très basse qualité, ou endommagé.";
    default:
      return "Ce document n'a pas pu être exploité.";
  }
}

export default function DocumentsNonTraitesModal({
  analyseId, documents, complementDisponible, onComplement, onClose,
}: Props) {
  const [fermeture, setFermeture] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Marque comme vu pour ne plus rouvrir la popup à chaque visite du rapport.
  // L'information reste consultable, seule la popup ne se represente pas.
  const acquitter = async (puis?: () => void) => {
    if (fermeture) return;
    setFermeture(true);
    try {
      await supabase
        .from('analyses')
        .update({ documents_non_traites: { vu: true, items: documents } })
        .eq('id', analyseId);
    } catch (e) {
      console.error('[Verimo] Acquittement docs non traités:', e);
    }
    puis ? puis() : onClose();
  };

  const pluriel = documents.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>

      <div onClick={() => acquitter()}
        style={{ position: 'absolute', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)' }} />

      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        style={{ position: 'relative', width: '100%', maxWidth: 540, background: '#fff', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {/* Bandeau ambre : information, pas erreur — le rapport est bien là */}
        <div style={{ padding: '22px 26px 18px', background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(180,83,9,0.12)' }}>
            <FileWarning size={21} style={{ color: '#b45309' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: '#78350f', lineHeight: 1.35 }}>
              {pluriel ? `${documents.length} documents n'ont pas pu être analysés` : "Un document n'a pas pu être analysé"}
            </div>
            <div style={{ fontSize: 13, color: '#92400e', marginTop: 5, lineHeight: 1.55 }}>
              Votre rapport a tout de même été établi à partir des autres pièces du dossier.
            </div>
          </div>
          <button onClick={() => acquitter()}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #fde68a', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={15} color="#b45309" />
          </button>
        </div>

        <div style={{ padding: '20px 26px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, maxHeight: 260, overflowY: 'auto' }}>
            {documents.map((d, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 11, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.nom}
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3, lineHeight: 1.5 }}>
                  {expliquer(d.raison)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, marginBottom: 20 }}>
            {complementDisponible
              ? <>Vous pouvez {pluriel ? 'les' : 'le'} redéposer via <strong>Compléter mon dossier</strong> : le rapport sera mis à jour et le score recalculé, sans frais supplémentaires.</>
              : <>Le délai d'ajout de documents est écoulé pour ce dossier. Contactez notre support si vous souhaitez {pluriel ? 'les' : 'le'} faire intégrer.</>}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={() => acquitter()} disabled={fermeture}
              style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Consulter mon rapport
            </button>
            {complementDisponible && onComplement && (
              <button onClick={() => acquitter(onComplement)} disabled={fermeture}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 10, border: 'none', background: '#2a7d9c', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <RefreshCw size={14} /> Redéposer {pluriel ? 'ces documents' : 'ce document'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
