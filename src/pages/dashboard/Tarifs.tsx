import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, GitCompare, BarChart2, CreditCard, CheckCircle, AlertTriangle, Lock, X, Star, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { markFreePreviewUsed } from '../../lib/analyses';
import { useCredits, type Credits } from '../../hooks/useCredits';
import DashboardLoader from '../../components/DashboardLoader';

type PromoResult = {
  id: string;
  code: string;
  type: 'credits' | 'percent' | 'fixed';
  value: number;
  credit_type?: string;
};

function CheckoutModal({ plan, onClose }: {
  plan: { id: string; label: string; price: string; priceNum: number; color: string; creditLabel: string };
  onClose: (type?: 'credits_applied', count?: number, creditType?: string) => void;
}) {
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoError(''); setPromoResult(null); setPromoApplied(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');
      const { data: promo, error } = await supabase.from('promo_codes').select('*').eq('code', promoCode.trim().toUpperCase()).eq('active', true).single();
      if (error || !promo) { setPromoError('Code invalide ou expiré.'); setPromoLoading(false); return; }
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) { setPromoError('Ce code a expiré.'); setPromoLoading(false); return; }
      if (promo.max_uses && promo.uses_count >= promo.max_uses) { setPromoError("Ce code a atteint sa limite d'utilisation."); setPromoLoading(false); return; }
      if (promo.restricted_email && promo.restricted_email !== user.email) { setPromoError("Ce code n'est pas disponible pour votre compte."); setPromoLoading(false); return; }
      const { data: alreadyUsed } = await supabase.from('promo_uses').select('id').eq('code_id', promo.id).eq('user_id', user.id).single();
      if (alreadyUsed) { setPromoError('Vous avez déjà utilisé ce code.'); setPromoLoading(false); return; }
      setPromoResult(promo); setPromoApplied(true);
    } catch { setPromoError('Erreur lors de la vérification du code.'); }
    setPromoLoading(false);
  };

  const removePromo = () => { setPromoResult(null); setPromoApplied(false); setPromoCode(''); setPromoError(''); };

  const basePrice = plan.priceNum;
  let finalPrice = basePrice;
  let promoLabel = '';
  if (promoResult) {
    if (promoResult.type === 'percent') { finalPrice = Math.max(0, basePrice * (1 - promoResult.value / 100)); promoLabel = `−${promoResult.value}%`; }
    else if (promoResult.type === 'fixed') { finalPrice = Math.max(0, basePrice - promoResult.value); promoLabel = `−${promoResult.value.toFixed(2).replace('.', ',')}€`; }
    else if (promoResult.type === 'credits') { finalPrice = basePrice; promoLabel = `+${promoResult.value} crédit${promoResult.value > 1 ? 's' : ''} offert${promoResult.value > 1 ? 's' : ''}`; }
  }

  const PRICE_IDS: Record<string, string> = {
    'document': 'price_1TIb1LBO4ekMbwz0020eqcR0',
    'complete': 'price_1TIb3XBO4ekMbwz0a7m7E7gD',
    'pack2': 'price_1TIb4KBO4ekMbwz0gGF2gI1S',
    'pack3': 'price_1TIb51BO4ekMbwz0mmEez47o',
  };

  const handleApplyCredits = async () => {
    if (!promoResult || promoResult.type !== 'credits') return;
    setPayLoading(true); setPayError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Vérification anti-doublon (au cas où)
      const { data: alreadyUsed } = await supabase.from('promo_uses').select('id').eq('code_id', promoResult.id).eq('user_id', user.id).single();
      if (alreadyUsed) throw new Error('Vous avez déjà utilisé ce code.');

      // Lire les crédits actuels
      const creditCol = promoResult.credit_type === 'document' ? 'credits_document'
        : promoResult.credit_type === 'complete' ? 'credits_complete'
        : 'credits_complete'; // par défaut complete si credit_type non défini

      const { data: profile } = await supabase.from('profiles').select(creditCol).eq('id', user.id).single();
      if (!profile) throw new Error('Profil introuvable.');

      const current = (profile as Record<string, number>)[creditCol] || 0;
      const toAdd = promoResult.value;

      // Ajouter les crédits
      const { error: updateError } = await supabase.from('profiles').update({ [creditCol]: current + toAdd }).eq('id', user.id);
      if (updateError) throw new Error('Impossible d\'ajouter les crédits. Veuillez réessayer.');

      // Enregistrer l'usage du code
      await supabase.from('promo_uses').insert({ code_id: promoResult.id, user_id: user.id });

      // Incrémenter uses_count
      await supabase.rpc('increment_promo_uses', { code_id: promoResult.id });

      // Enregistrer dans l'historique payments
      const creditTypeLabel = creditCol === 'credits_document' ? 'simple' : 'complet';
      const creditTypeLabelPlural = creditCol === 'credits_document' ? 'simples' : 'complets';
      await supabase.from('payments').insert({
        user_id: user.id,
        amount: 0,
        currency: 'eur',
        description: `${toAdd} crédit${toAdd > 1 ? 's' : ''} ${toAdd > 1 ? creditTypeLabelPlural : creditTypeLabel} offert${toAdd > 1 ? 's' : ''} · Code ${promoResult.code}`,
        promo_code: promoResult.code,
        credits_added: toAdd,
        credit_type: creditCol === 'credits_document' ? 'document' : 'complete',
        status: 'completed',
      });

      // Fermer la modale et afficher un toast de succès
      onClose('credits_applied', toAdd, creditCol === 'credits_document' ? 'simple' : 'complet');
    } catch (e) { setPayError((e as Error).message); }
    setPayLoading(false);
  };

  const handlePay = async () => {
    // Si code de type credits → pas de Stripe, on applique directement
    if (promoResult?.type === 'credits') { await handleApplyCredits(); return; }

    setPayLoading(true); setPayError('');
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      const session = refreshData.session;
      if (refreshError || !session) {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (!existingSession) { window.location.href = '/connexion'; return; }
      }
      const finalSession = refreshData.session || (await supabase.auth.getSession()).data.session;
      if (!finalSession) throw new Error('Session expirée — veuillez vous reconnecter');
      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${finalSession.access_token}`, 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk' },
        body: JSON.stringify({ priceId: PRICE_IDS[plan.id], userId: finalSession.user.id, promoCodeId: promoResult?.id ?? null }),
      });
      if (!res.ok) { const err = await res.text(); throw new Error(err || `Erreur ${res.status}`); }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
      else throw new Error('Lien de paiement non reçu');
    } catch (e) { setPayError((e as Error).message); }
    setPayLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', marginBottom: 3 }}>RÉCAPITULATIF</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{plan.label}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{plan.creditLabel}</div>
          </div>
          <button onClick={() => onClose()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><X size={15} /></button>
        </div>
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', borderRadius: 12, border: '1.5px solid #edf2f7' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Total</span>
            <div style={{ textAlign: 'right' }}>
              {promoResult && promoResult.type !== 'credits' && <div style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through', marginBottom: 2 }}>{plan.price}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {promoResult && <span style={{ fontSize: 11, fontWeight: 800, color: promoResult.type === 'credits' ? '#7c3aed' : '#16a34a', background: promoResult.type === 'credits' ? '#f5f3ff' : '#f0fdf4', border: `1px solid ${promoResult.type === 'credits' ? '#ddd6fe' : '#d1fae5'}`, padding: '2px 8px', borderRadius: 100 }}>{promoLabel}</span>}
                <span style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                  {promoResult && promoResult.type !== 'credits' ? `${finalPrice.toFixed(2).replace('.', ',')}€` : plan.price}
                </span>
              </div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Code promo <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optionnel)</span></label>
            {promoApplied && promoResult ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 11 }}>
                <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', flex: 1 }}>Code <strong>{promoResult.code}</strong> appliqué — {promoLabel}</span>
                <button onClick={removePromo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}><X size={14} /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }} onKeyDown={e => e.key === 'Enter' && applyPromo()} placeholder="EX : VERIMO20"
                  style={{ flex: 1, padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1.5px solid ${promoError ? '#fca5a5' : '#e2e8f0'}`, outline: 'none', letterSpacing: '0.05em', fontFamily: 'monospace', background: promoError ? '#fef2f2' : '#fff', color: '#0f172a' }} />
                <button onClick={applyPromo} disabled={promoLoading || !promoCode.trim()}
                  style={{ padding: '11px 16px', borderRadius: 10, border: 'none', background: plan.color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: promoLoading || !promoCode.trim() ? 'not-allowed' : 'pointer', opacity: promoLoading || !promoCode.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  {promoLoading ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> : 'Appliquer'}
                </button>
              </div>
            )}
            {promoError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={12} /> {promoError}</div>}
          </div>
          <button onClick={handlePay} disabled={payLoading}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: promoResult?.type === 'credits' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, color: '#fff', fontSize: 15, fontWeight: 800, cursor: payLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: promoResult?.type === 'credits' ? '0 6px 20px rgba(124,58,237,0.35)' : `0 6px 20px ${plan.color}40`, opacity: payLoading ? 0.75 : 1 }}>
            {payLoading
              ? <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> {promoResult?.type === 'credits' ? 'Application en cours…' : 'Redirection…'}</>
              : promoResult?.type === 'credits'
                ? (() => {
                    const n = promoResult.value;
                    const isDoc = promoResult.credit_type === 'document';
                    const plural = n > 1;
                    if (isDoc) return <><CheckCircle size={15} /> {plural ? `Recevoir mes ${n} crédits d'analyse d'un seul document gratuitement` : 'Recevoir mon crédit d\'analyse d\'un seul document gratuitement'}</>;
                    return <><CheckCircle size={15} /> {plural ? `Recevoir mes ${n} crédits d'analyse complète d'un bien gratuitement` : 'Recevoir mon crédit d\'analyse complète d\'un bien gratuitement'}</>;
                  })()
                : <><Lock size={15} /> Continuer vers le paiement</>
            }
          </button>
          {promoResult?.type === 'credits' && !payLoading && (
            <div style={{ textAlign: 'center', fontSize: 11, color: '#7c3aed', marginTop: -8, fontWeight: 600 }}>
              ✨ Aucun paiement requis — crédits ajoutés instantanément
            </div>
          )}
          {promoResult?.type !== 'credits' && <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: -8 }}>🔒 Paiement sécurisé par Stripe — vos données sont chiffrées</div>}
          {payError && <div style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><AlertTriangle size={12} /> {payError}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Tarifs() {
  const [creditsToast, setCreditsToast] = useState<string | null>(null);
  const { credits, fetchCredits, loadingCredits } = useCredits();
  const [detailPlan, setDetailPlan] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<null | { id: string; label: string; price: string; priceNum: number; color: string; creditLabel: string }>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cancelled') === 'true') { window.history.replaceState({}, '', '/dashboard/tarifs'); return; }
    if (params.get('success') === 'true') {
      window.history.replaceState({}, '', '/dashboard/tarifs');
      const freePreviewUsed = localStorage.getItem('verimo_free_preview_used') === 'true';
      if (!freePreviewUsed) { markFreePreviewUsed(); setSuccessToast("🎉 Vous aviez une analyse gratuite disponible, mais pourquoi regarder par le trou de la serrure quand on peut ouvrir la porte en grand ? En payant directement, votre offre gratuite a été remplacée par l'analyse que vous venez d'acheter. Bonne analyse !"); }
      else { setSuccessToast("✅ Paiement confirmé ! Vos crédits ont été ajoutés. 🔒 P.S. : vos documents ont été supprimés de nos serveurs après votre analyse simplifiée (RGPD nous y oblige !). Re-uploadez-les sur votre analyse pour générer le rapport complet — promis, c'est rapide !"); }
    }
  }, []);

  const plans: { id: string; label: string; price: string; priceNum: number; desc: string; creditLabel: string; creditType: keyof Credits; color: string; icon: React.ElementType; popular?: boolean; badge?: string; details: string[] }[] = [
    { id: 'document', label: 'Analyse Document', price: '4,90€', priceNum: 4.90, desc: 'Idéal pour lever un doute sur un document précis.', creditLabel: '1 crédit simple', creditType: 'document', color: '#2a7d9c', icon: FileText, details: ['1 fichier PDF (tout document lié à votre achat)', 'Points forts et vigilances détectés', 'Avis Verimo personnalisé', 'Résultat en 30 secondes*'] },
    { id: 'complete', label: 'Analyse Complète', price: '19,90€', priceNum: 19.90, desc: "Audit global d'un bien avec score et verdict d'achat.", creditLabel: '1 crédit complet', creditType: 'complete', color: '#0f2d3d', icon: ShieldCheck, popular: true, details: ["Jusqu'à 15 documents simultanés", 'Score /20 + verdict d\'achat', 'Travaux votés et à prévoir', 'Santé financière copro', 'Pistes de négociation (si score < 17)', 'Avis Verimo personnalisé', 'Compléter le dossier sous 7 jours', 'Rapport PDF téléchargeable'] },
    { id: 'pack2', label: 'Pack 2 Biens', price: '29,90€', priceNum: 29.90, desc: 'Comparez 2 biens côte à côte. 14,95€ / bien.', creditLabel: '2 crédits complets', creditType: 'complete', color: '#1a5068', icon: GitCompare, badge: '−25%', details: ['2 analyses complètes incluses', 'Tout ce qui est dans l\'analyse complète', 'Comparaison côte à côte', 'Économisez 10€ vs 2 achats séparés'] },
    { id: 'pack3', label: 'Pack 3 Biens', price: '39,90€', priceNum: 39.90, desc: 'Le meilleur rapport qualité/prix. 13,30€ / bien.', creditLabel: '3 crédits complets', creditType: 'complete', color: '#1a5068', icon: BarChart2, badge: '−33%', details: ['3 analyses complètes incluses', 'Tout ce qui est dans l\'analyse complète', 'Comparaison et classement', 'Économisez 20€ vs 3 achats séparés'] },
  ];

  if (loadingCredits) return <DashboardLoader message="Chargement des tarifs…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {creditsToast && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', borderRadius: 20, padding: '28px 24px', maxWidth: 420, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 32 }}>✨</span>
              <button onClick={() => setCreditsToast(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}><X size={14} /></button>
            </div>
            <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.7, fontWeight: 500 }}>{creditsToast}</div>
            <button onClick={() => setCreditsToast(null)} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Parfait !</button>
          </div>
        </div>
      )}

      {successToast && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0f2d3d', borderRadius: 20, padding: '28px 24px', maxWidth: 420, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 32 }}>🎉</span>
              <button onClick={() => setSuccessToast(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}><X size={14} /></button>
            </div>
            <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.7, fontWeight: 500 }}>{successToast}</div>
            <button onClick={() => setSuccessToast(null)} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Compris !</button>
          </div>
        </div>
      )}

      <div>
        <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 6 }}>Choisissez votre analyse</h1>
        <p style={{ fontSize: 14, color: '#64748b' }}>Achetez des crédits selon votre besoin — ils n'expirent jamais.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: '#fff', borderRadius: 12, border: '1px solid #edf2f7', flexWrap: 'wrap' }}>
        <CreditCard size={15} style={{ color: '#2a7d9c', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Vos crédits :</span>
        <span style={{ padding: '3px 11px', borderRadius: 7, background: credits.document > 0 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${credits.document > 0 ? '#bbf7d0' : '#e2e8f0'}`, fontSize: 13, fontWeight: 700, color: credits.document > 0 ? '#16a34a' : '#94a3b8' }}>{credits.document} simple</span>
        <span style={{ padding: '3px 11px', borderRadius: 7, background: credits.complete > 0 ? '#eff6ff' : '#f8fafc', border: `1px solid ${credits.complete > 0 ? '#bfdbfe' : '#e2e8f0'}`, fontSize: 13, fontWeight: 700, color: credits.complete > 0 ? '#1d4ed8' : '#94a3b8' }}>{credits.complete} complet{credits.complete > 1 ? 's' : ''}</span>
        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>♾️ Sans expiration</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {plans.map(plan => {
          const Icon = plan.icon;
          const hasCredits = credits[plan.creditType] > 0;
          return (
            <div key={plan.id} style={{ background: '#fff', borderRadius: 16, border: plan.popular ? '2px solid #0f2d3d' : '1.5px solid #edf2f7', boxShadow: plan.popular ? '0 8px 28px rgba(15,45,61,0.12)' : '0 1px 6px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s, transform 0.2s', position: 'relative' }}
              onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = plan.popular ? '0 14px 44px rgba(15,45,61,0.18)' : '0 6px 20px rgba(0,0,0,0.08)'; el.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = plan.popular ? '0 8px 28px rgba(15,45,61,0.12)' : '0 1px 6px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)'; }}>
              {plan.popular && (
                <div style={{ background: 'linear-gradient(90deg, #0f2d3d, #1a5068)', padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 7, borderRadius: '14px 14px 0 0' }}>
                  <Star size={11} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '0.1em' }}>LE PLUS POPULAIRE</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Recommandé par Verimo</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', padding: '20px 22px', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: `${plan.color}0e`, border: `1.5px solid ${plan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={21} style={{ color: plan.color }} /></div>
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{plan.label}</span>
                    {plan.badge && <span style={{ fontSize: 10, fontWeight: 800, color: '#d97706', background: '#fef3c7', border: '1px solid #fde68a', padding: '2px 7px', borderRadius: 100 }}>{plan.badge}</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, marginBottom: 5 }}>{plan.desc}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: plan.color, background: `${plan.color}09`, border: `1px solid ${plan.color}18`, padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>{plan.creditLabel}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>{plan.price}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>paiement unique</div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <button onClick={() => setDetailPlan(detailPlan === plan.id ? null : plan.id)}
                    style={{ width: 30, height: 30, borderRadius: '50%', background: detailPlan === plan.id ? `${plan.color}15` : '#f8fafc', border: `1.5px solid ${detailPlan === plan.id ? `${plan.color}40` : '#edf2f7'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: detailPlan === plan.id ? plan.color : '#94a3b8', transition: 'all 0.15s' }}>
                    <Info size={13} />
                  </button>
                </div>
                <button onClick={() => setCheckoutPlan({ id: plan.id, label: plan.label, price: plan.price, priceNum: plan.priceNum, color: plan.color, creditLabel: plan.creditLabel })}
                  style={{ flexShrink: 0, padding: '11px 22px', borderRadius: 11, border: 'none', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 14px ${plan.color}30`, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1)'; }}>
                  {hasCredits ? 'Racheter' : 'Acheter'}
                </button>
              </div>
              {hasCredits && (
                <div style={{ padding: '9px 22px', background: '#f0fdf4', borderTop: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: 7, borderRadius: '0 0 14px 14px' }}>
                  <CheckCircle size={12} style={{ color: '#16a34a' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>{credits[plan.creditType]} crédit{credits[plan.creditType] > 1 ? 's' : ''} disponible{credits[plan.creditType] > 1 ? 's' : ''} — utilisez-les depuis "Nouvelle analyse"</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {[{ icon: '🔒', title: 'Stripe sécurisé', sub: 'Paiement chiffré' }, { icon: '♾️', title: 'Sans expiration', sub: 'Utilisez quand vous voulez' }, { icon: '⚡', title: '< 30 secondes*', sub: 'Rapport immédiat' }, { icon: '🗑️', title: 'Données supprimées', sub: 'Après chaque analyse' }].map(g => (
          <div key={g.title} style={{ background: '#fff', borderRadius: 11, border: '1px solid #edf2f7', padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{g.icon}</span>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{g.title}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{g.sub}</div></div>
          </div>
        ))}
      </div>

      {detailPlan && (() => {
        const plan = plans.find(p => p.id === detailPlan);
        if (!plan) return null;
        const Icon = plan.icon;
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDetailPlan(null)}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,45,61,0.45)', backdropFilter: 'blur(3px)' }} />
            <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '28px 26px 24px', maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(15,45,61,0.25)', animation: 'fadeUp 0.2s ease both' }}>
              <button onClick={() => setDetailPlan(null)} style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 15, fontWeight: 700 }}>×</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${plan.color}0e`, border: `1.5px solid ${plan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={20} style={{ color: plan.color }} /></div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{plan.label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{plan.creditLabel} · {plan.price}</div>
                </div>
              </div>
              <div style={{ height: 1, background: '#f1f5f9', marginBottom: 16 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 12 }}>INCLUS DANS CETTE OFFRE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.details.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <CheckCircle size={14} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>{d}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setDetailPlan(null); setCheckoutPlan({ id: plan.id, label: plan.label, price: plan.price, priceNum: plan.priceNum, color: plan.color, creditLabel: plan.creditLabel }); }}
                style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 11, border: 'none', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 14px ${plan.color}25` }}>
                Acheter
              </button>
            </div>
          </div>
        );
      })()}

      {checkoutPlan && <CheckoutModal plan={checkoutPlan} onClose={(type, count, creditType) => {
        setCheckoutPlan(null);
        if (type === 'credits_applied' && count) {
          fetchCredits();
          setCreditsToast(`🎉 ${count} crédit${count > 1 ? 's' : ''} ${count > 1 ? (creditType === 'simple' ? 'simples' : 'complets') : creditType} ajouté${count > 1 ? 's' : ''} à votre compte ! Vous pouvez les utiliser dès maintenant depuis "Nouvelle analyse".`);
        }
      }} />}
    </div>
  );
}
