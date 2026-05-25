// src/components/CallbackRequestModal.tsx
import { useState } from 'react';
import { X, Phone, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CallbackRequestModalProps {
  open: boolean;
  onClose: () => void;
  context?: 'demo_expired' | 'abonnement_agence' | 'other';
  defaultPhone?: string;
}

const SLOTS = [
  { id: 'matinee', label: 'Matinée', hint: '9h-12h' },
  { id: 'dejeuner', label: 'Heure du déjeuner', hint: '12h-14h' },
  { id: 'apres_midi', label: 'Après-midi', hint: '14h-18h' },
  { id: 'soiree', label: 'Soirée', hint: '18h-20h' },
];

export default function CallbackRequestModal({
  open,
  onClose,
  context = 'other',
  defaultPhone = '',
}: CallbackRequestModalProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const toggleSlot = (id: string) => {
    setSelectedSlots(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation tel : 8 chiffres minimum (souple, accepte formats internationaux)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      setError('Veuillez saisir un numéro de téléphone valide.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Vous devez être connecté pour faire cette demande.');
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('callback_requests')
        .insert({
          user_id: user.id,
          phone: phone.trim(),
          preferred_slots: selectedSlots,
          message: message.trim() || null,
          context,
        });

      if (insertError) {
        console.error('[CallbackRequestModal] insert error:', insertError);
        setError("Une erreur est survenue. Réessayez ou contactez pro@verimo.fr.");
        setSubmitting(false);
        return;
      }

      // Déclencher l'edge function de notification (cloche + email pro@verimo.fr)
      try {
        await supabase.functions.invoke('notify-callback', {
          body: { user_id: user.id, context, phone: phone.trim(), preferred_slots: selectedSlots, message: message.trim() || null },
        });
      } catch (notifErr) {
        // Non bloquant : la demande est bien enregistrée même si la notif échoue
        console.warn('[CallbackRequestModal] notif failed (non-blocking):', notifErr);
      }

      setSuccess(true);
      setSubmitting(false);

      // Fermer auto après 3 secondes
      setTimeout(() => {
        onClose();
        // Reset pour réouverture future
        setSuccess(false);
        setSelectedSlots([]);
        setMessage('');
      }, 3000);
    } catch (err) {
      console.error('[CallbackRequestModal] exception:', err);
      setError('Une erreur est survenue. Réessayez plus tard.');
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 18,
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #4a9fc1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Être rappelé</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Sous 24h ouvrées</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#64748b" />
          </button>
        </div>

        {/* Body */}
        {success ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Check size={28} color="#16a34a" />
            </div>
            <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Demande envoyée ✓</h4>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Nous vous rappelons sous 24h ouvrées sur le créneau qui vous convient.
            </p>
          </div>
        ) : (
          <div style={{ padding: '20px 24px 24px' }}>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              Laissez-nous votre numéro, nous vous rappelons pour configurer votre compte et répondre à vos questions.
            </p>

            {/* Téléphone */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Téléphone <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Créneaux */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Préférence de rappel <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>(plusieurs choix possibles)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {SLOTS.map(slot => {
                  const active = selectedSlots.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => toggleSlot(slot.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${active ? '#2a7d9c' : '#e2e8f0'}`,
                        background: active ? '#f0f7fb' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#2a7d9c' : '#0f172a' }}>{slot.label}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{slot.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Message <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>(optionnel)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ex : Je suis directeur d'une agence de 4 agents, je souhaite des infos sur le forfait agence."
                rows={3}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box', lineHeight: 1.5 }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12.5, color: '#991b1b', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: 11,
                background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #2a7d9c, #4a9fc1)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(42,125,156,0.25)',
              }}
            >
              {submitting ? 'Envoi en cours…' : 'Demander à être rappelé'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
