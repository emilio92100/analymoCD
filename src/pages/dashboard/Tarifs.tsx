import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, GitCompare, BarChart2, CreditCard, CheckCircle, AlertTriangle, Lock, X, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { markFreePreviewUsed } from '../../lib/analyses';
import { useCredits, type Credits } from '../../hooks/useCredits';

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
  const { credits, fetchCredits } = useCredits();
  const [checkoutPlan, setCheckoutPlan] = useState<null | { id: string; label: string; price: string; priceNum: number; color: string; creditLabel: string }>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);

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

  const plans: { id: string; label: string; subtitle: string; price: string; priceNum: number; perUnit?: string; creditLabel: string; creditType: keyof Credits; color: string; gradient: string; icon: React.ElementType; popular?: boolean; badge?: string; features: string[] }[] = [
    { id: 'document', label: 'Simple', subtitle: "Analyse d'un document", price: '4,90€', priceNum: 4.90, creditLabel: '1 crédit simple', creditType: 'document', color: '#2a7d9c', gradient: 'linear-gradient(135deg, #2a7d9c, #1a5e78)', icon: FileText, features: ["1 fichier PDF analysé", "Points forts et vigilances", 'Avis Verimo personnalisé', 'Résultat en moins de 2 min'] },
    { id: 'complete', label: 'Complète', subtitle: "Audit global d'un bien", price: '19,90€', priceNum: 19.90, creditLabel: '1 crédit complet', creditType: 'complete', color: '#0f2d3d', gradient: 'linear-gradient(135deg, #0f2d3d, #1a5068)', icon: ShieldCheck, popular: true, features: ["Jusqu'à 15 documents", 'Score /20 + recommandation', 'Travaux, finances, diagnostics', 'Pistes de négociation', 'Compléter sous 7 jours', 'Rapport PDF téléchargeable'] },
    { id: 'pack2', label: 'Pack 2', subtitle: 'Comparez 2 biens', price: '29,90€', priceNum: 29.90, perUnit: '14,95€ / bien', creditLabel: '2 crédits complets', creditType: 'complete', color: '#1a5068', gradient: 'linear-gradient(135deg, #1a5068, #2a7d9c)', icon: GitCompare, badge: '−25%', features: ['2 analyses complètes', 'Comparaison côte à côte', 'Verdict : quel bien choisir', 'Économisez 10€'] },
    { id: 'pack3', label: 'Pack 3', subtitle: 'Analysez et classez', price: '39,90€', priceNum: 39.90, perUnit: '13,30€ / bien', creditLabel: '3 crédits complets', creditType: 'complete', color: '#0f2d3d', gradient: 'linear-gradient(135deg, #0f2d3d, #1e3a4f)', icon: BarChart2, badge: '−33%', features: ['3 analyses complètes', 'Comparaison et classement', 'Recommandation finale', 'Économisez 20€'] },
  ];

  const tableRows: { label: string; vals: (boolean | string)[] }[] = [
    { label: 'Avis Verimo personnalisé', vals: [true, true, true, true] },
    { label: 'Documents analysés', vals: ['1 doc', "Jusqu'à 15", '2 × 15', '3 × 15'] },
    { label: "Score /20 du bien", vals: [false, true, true, true] },
    { label: "Recommandation d'achat", vals: [false, true, true, true] },
    { label: 'Travaux votés et à prévoir', vals: [false, true, true, true] },
    { label: 'Santé financière copro', vals: [false, true, true, true] },
    { label: 'Pistes de négociation', vals: [false, true, true, true] },
    { label: 'Compléter le dossier (7j)', vals: [false, true, true, true] },
    { label: 'Rapport PDF téléchargeable', vals: [false, true, true, true] },
    { label: 'Comparaison de biens', vals: [false, false, true, true] },
    { label: 'Économie vs achats séparés', vals: ['—', '—', '−10€', '−20€'] },
  ];

  const buy = (plan: typeof plans[0]) => setCheckoutPlan({ id: plan.id, label: plan.label, price: plan.price, priceNum: plan.priceNum, color: plan.color, creditLabel: plan.creditLabel });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <style>{`
        @keyframes tarif-fadeIn { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes tarif-scaleIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .tarif-card { animation: tarif-fadeIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .tarif-card:nth-child(1) { animation-delay: 0s; }
        .tarif-card:nth-child(2) { animation-delay: 0.08s; }
        .tarif-card:nth-child(3) { animation-delay: 0.16s; }
        .tarif-card:nth-child(4) { animation-delay: 0.24s; }
        .tarif-card:hover { transform: translateY(-4px) !important; }
        .tarif-card:hover .tarif-card-glow { opacity: 1 !important; }
        .tarif-cards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .tarif-table-desktop { display: block; }
        .tarif-table-mobile { display: none; }
        .tarif-guarantees { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 900px) { .tarif-cards-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 600px) {
          .tarif-cards-grid { grid-template-columns: 1fr !important; }
          .tarif-table-desktop { display: none !important; }
          .tarif-table-mobile { display: flex !important; }
          .tarif-guarantees { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

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

      <div style={{ animation: 'tarif-fadeIn 0.4s ease both' }}>
        <h1 style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 6 }}>Choisissez votre analyse</h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>Sans abonnement · paiement unique · crédits sans expiration</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', flexWrap: 'wrap', animation: 'tarif-fadeIn 0.4s 0.05s ease both' }}>
        <CreditCard size={16} style={{ color: '#2a7d9c', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Vos crédits :</span>
        <span style={{ padding: '4px 12px', borderRadius: 8, background: credits.document > 0 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${credits.document > 0 ? '#bbf7d0' : '#e2e8f0'}`, fontSize: 13, fontWeight: 700, color: credits.document > 0 ? '#16a34a' : '#94a3b8' }}>{credits.document} simple{credits.document > 1 ? 's' : ''}</span>
        <span style={{ padding: '4px 12px', borderRadius: 8, background: credits.complete > 0 ? '#eff6ff' : '#f8fafc', border: `1px solid ${credits.complete > 0 ? '#bfdbfe' : '#e2e8f0'}`, fontSize: 13, fontWeight: 700, color: credits.complete > 0 ? '#1d4ed8' : '#94a3b8' }}>{credits.complete} complet{credits.complete > 1 ? 's' : ''}</span>
        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>♾️ Sans expiration</span>
      </div>

      <div className="tarif-cards-grid">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const hasCredits = credits[plan.creditType] > 0;
          const isPop = plan.popular;
          return (
            <div key={plan.id} className="tarif-card" style={{ background: isPop ? plan.gradient : '#fff', borderRadius: 20, border: isPop ? 'none' : '1.5px solid #edf2f7', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: isPop ? '0 12px 40px rgba(15,45,61,0.2)' : '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)', cursor: 'default' }}>
              <div className="tarif-card-glow" style={{ position: 'absolute', inset: 0, borderRadius: 20, background: isPop ? 'radial-gradient(circle at 30% 20%, rgba(42,125,156,0.2), transparent 60%)' : 'radial-gradient(circle at 30% 20%, rgba(42,125,156,0.06), transparent 60%)', opacity: 0, transition: 'opacity 0.3s', pointerEvents: 'none' }} />
              {isPop && (
                <div style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 7, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Star size={12} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.12em' }}>RECOMMANDÉ</span>
                </div>
              )}
              {plan.badge && !isPop && (
                <div style={{ position: 'absolute', top: 16, right: 16, padding: '4px 10px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a', fontSize: 11, fontWeight: 800, color: '#92400e' }}>{plan.badge}</div>
              )}
              <div style={{ padding: isPop ? '22px 22px 20px' : '24px 22px 20px', display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: isPop ? 'rgba(255,255,255,0.1)' : plan.color + '08', border: isPop ? '1px solid rgba(255,255,255,0.15)' : '1.5px solid ' + plan.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={21} style={{ color: isPop ? '#fff' : plan.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: isPop ? '#fff' : '#0f172a', letterSpacing: '-0.02em' }}>{plan.label}</div>
                    <div style={{ fontSize: 12, color: isPop ? 'rgba(255,255,255,0.55)' : '#94a3b8', marginTop: 1 }}>{plan.subtitle}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: isPop ? '#fff' : '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{plan.price}</span>
                  </div>
                  <div style={{ fontSize: 11, color: isPop ? 'rgba(255,255,255,0.45)' : '#94a3b8', marginTop: 4 }}>
                    {plan.perUnit ? plan.perUnit + ' · paiement unique' : 'paiement unique'}
                  </div>
                </div>
                <div style={{ height: 1, background: isPop ? 'rgba(255,255,255,0.1)' : '#f1f5f9', marginBottom: 16 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 20 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: isPop ? 'rgba(255,255,255,0.12)' : '#f0fdf4', border: isPop ? '1px solid rgba(255,255,255,0.2)' : '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <CheckCircle size={10} style={{ color: isPop ? '#4ade80' : '#16a34a' }} />
                      </div>
                      <span style={{ fontSize: 13, color: isPop ? 'rgba(255,255,255,0.8)' : '#374151', lineHeight: 1.45 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => buy(plan)}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: isPop ? '1px solid rgba(255,255,255,0.2)' : 'none', background: isPop ? 'rgba(255,255,255,0.12)' : plan.gradient, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: isPop ? 'none' : '0 4px 16px ' + plan.color + '30', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = isPop ? 'rgba(255,255,255,0.2)' : plan.gradient; (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = isPop ? 'rgba(255,255,255,0.12)' : plan.gradient; (e.currentTarget as HTMLElement).style.filter = 'brightness(1)'; }}>
                  {hasCredits ? 'Racheter un crédit' : 'Acheter'}
                </button>
              </div>
              {hasCredits && (
                <div style={{ padding: '10px 22px', background: isPop ? 'rgba(0,0,0,0.15)' : '#f0fdf4', borderTop: isPop ? '1px solid rgba(255,255,255,0.08)' : '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <CheckCircle size={12} style={{ color: isPop ? '#4ade80' : '#16a34a' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: isPop ? 'rgba(255,255,255,0.8)' : '#16a34a' }}>{credits[plan.creditType]} crédit{credits[plan.creditType] > 1 ? 's' : ''} disponible{credits[plan.creditType] > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="tarif-table-desktop" style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf2f7', overflow: 'hidden', animation: 'tarif-scaleIn 0.5s 0.3s ease both', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#0f2d3d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={14} style={{ color: '#fbbf24' }} /></div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Comparatif détaillé</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', width: '30%' }}>FONCTIONNALITÉ</th>
              {plans.map(p => (
                <th key={p.id} style={{ textAlign: 'center', padding: '16px 12px', background: p.popular ? 'rgba(42,125,156,0.04)' : 'transparent', borderLeft: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: p.popular ? '#2a7d9c' : '#0f172a' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 3 }}>{p.price}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < tableRows.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.15s' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#fafcfe'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <td style={{ padding: '14px 24px', fontSize: 13, fontWeight: 600, color: '#374151' }}>{row.label}</td>
                {row.vals.map((val, j) => {
                  const isHL = plans[j].popular;
                  const bg = isHL ? 'rgba(42,125,156,0.04)' : 'transparent';
                  if (val === true) return <td key={j} style={{ textAlign: 'center', padding: '14px 8px', background: bg, borderLeft: '1px solid #f1f5f9' }}><div style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #86efac', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={12} color="#16a34a" /></div></td>;
                  if (val === false) return <td key={j} style={{ textAlign: 'center', padding: '14px 8px', background: bg, borderLeft: '1px solid #f1f5f9' }}><div style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', alignItems: 'center', justifyContent: 'center' }}><X size={10} color="#cbd5e1" /></div></td>;
                  const isGreen = val !== '—' && val !== '1 doc';
                  return <td key={j} style={{ textAlign: 'center', padding: '14px 8px', background: bg, borderLeft: '1px solid #f1f5f9', fontSize: 13, fontWeight: 700, color: val === '—' ? '#dde3ea' : isGreen ? '#16a34a' : '#2a7d9c' }}>{val as string}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tarif-table-mobile" style={{ flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0f2d3d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={12} style={{ color: '#fbbf24' }} /></div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Comparatif détaillé</h2>
        </div>
        {tableRows.map((row, i) => (
          <div key={i} style={{ borderRadius: 12, border: '1.5px solid ' + (openRow === i ? '#2a7d9c' : '#edf2f7'), background: '#fff', overflow: 'hidden', transition: 'border-color 0.2s' }}>
            <button onClick={() => setOpenRow(openRow === i ? null : i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{row.label}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: openRow === i ? '#2a7d9c' : '#cbd5e1', flexShrink: 0, transform: openRow === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
            </button>
            {openRow === i && (
              <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f0f5f9', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
                {plans.map((p, j) => {
                  const val = row.vals[j];
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, background: j === 1 ? 'rgba(42,125,156,0.04)' : '#f8fafc', border: '1px solid ' + (j === 1 ? 'rgba(42,125,156,0.12)' : '#f1f5f9') }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: j === 1 ? '#2a7d9c' : '#0f172a' }}>{p.label}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.price}</div>
                      </div>
                      {val === true && <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={11} color="#16a34a" /></div>}
                      {val === false && <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} color="#cbd5e1" /></div>}
                      {typeof val === 'string' && <span style={{ fontSize: 12, fontWeight: 700, color: val === '—' ? '#dde3ea' : '#16a34a' }}>{val}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="tarif-guarantees" style={{ animation: 'tarif-fadeIn 0.5s 0.4s ease both' }}>
        {[
          { icon: '🔒', title: 'Stripe sécurisé', sub: 'Paiement 100% chiffré' },
          { icon: '♾️', title: 'Sans expiration', sub: 'Utilisez quand vous voulez' },
          { icon: '⚡', title: 'Résultat rapide', sub: 'Rapport en moins de 2 min' },
          { icon: '🗑️', title: 'RGPD conforme', sub: 'Données supprimées après analyse' },
        ].map(g => (
          <div key={g.title} style={{ background: '#fff', borderRadius: 13, border: '1px solid #edf2f7', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, transition: 'box-shadow 0.2s' }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{g.icon}</span>
            <div><div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{g.title}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{g.sub}</div></div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center', fontStyle: 'italic' }}>* Pour les documents PDF nativement numériques. Les documents scannés peuvent nécessiter un délai supplémentaire.</p>

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
