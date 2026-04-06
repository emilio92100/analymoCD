import { useState } from 'react';
import { ChevronDown, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Support() {
  const faqs = [
    {
      q: "Quels documents puis-je analyser ?",
      a: "Vous pouvez analyser tous les documents liés à un bien immobilier : PV d'assemblée générale (AG), règlement de copropriété, appel de charges, budget prévisionnel, diagnostic de performance énergétique (DPE), diagnostics techniques (électricité, gaz, amiante, plomb), état daté, compromis ou promesse de vente, et bien d'autres. Seuls les fichiers PDF sont acceptés. Les fichiers Word doivent être convertis en PDF avant l'upload."
    },
    {
      q: "Quelle est la différence entre l'analyse simple et l'analyse complète ?",
      a: "L'analyse simple (4,90€) porte sur un seul document PDF — idéale pour comprendre rapidement un PV d'AG ou un diagnostic précis. L'analyse complète (19,90€) accepte jusqu'à 20 documents d'un même bien et génère un rapport détaillé avec un score /20, une recommandation (Acheter / Négocier / Risqué), l'estimation des risques financiers, les travaux à prévoir et un avis Verimo personnalisé."
    },
    {
      q: "Combien de temps prend une analyse ?",
      a: "Moins de 2 minutes en général. Pour une analyse complète avec plusieurs documents, comptez 1 à 3 minutes selon le nombre et la taille des fichiers. Vous pouvez quitter la page pendant ce temps — l'analyse continue en arrière-plan et le résultat sera disponible dans 'Mes analyses' dès qu'elle sera terminée."
    },
    {
      q: "Mes documents sont-ils sécurisés ?",
      a: "Oui, absolument. Vos documents sont transmis via une connexion chiffrée SSL/TLS et traités en mémoire uniquement. Conformément au RGPD, ils sont supprimés de nos serveurs immédiatement après l'analyse — nous ne conservons que le rapport généré. Vos documents ne sont jamais partagés avec des tiers."
    },
    {
      q: "Comment fonctionnent les crédits ?",
      a: "Chaque achat vous attribue des crédits utilisables à tout moment, sans date d'expiration. 4,90€ = 1 crédit analyse document. 19,90€ = 1 crédit analyse complète. 29,90€ = 2 crédits complets (Pack 2 biens). 39,90€ = 3 crédits complets (Pack 3 biens). Vos crédits restants sont visibles en permanence dans la barre latérale gauche."
    },
    {
      q: "Puis-je utiliser un code promo ?",
      a: "Oui. Au moment de l'achat, un champ 'Code promo' est disponible dans la fenêtre de paiement. Les codes peuvent offrir une réduction en pourcentage, une réduction fixe en euros, ou des crédits gratuits directement sans paiement. Chaque code est à usage unique par compte."
    },
    {
      q: "Verimo remplace-t-il un notaire ou un expert immobilier ?",
      a: "Non. Verimo est un outil d'aide à la décision qui analyse les documents que vous fournissez et vous aide à les comprendre. Il ne remplace pas l'avis d'un notaire, d'un avocat ou d'un expert immobilier. Les rapports Verimo sont établis uniquement à partir des documents analysés et ne constituent pas un conseil juridique ou financier."
    },
    {
      q: "Que faire si mon PDF est protégé par un mot de passe ?",
      a: "Les PDF protégés ne peuvent pas être analysés. Vous devez d'abord retirer la protection depuis Adobe Acrobat Reader (Fichier → Propriétés → Sécurité → Aucune sécurité) ou tout autre logiciel PDF, puis uploader la version déverrouillée."
    },
    {
      q: "Comment fonctionne la comparaison de biens ?",
      a: "La fonctionnalité 'Comparer mes biens' se débloque automatiquement dès que vous avez 2 analyses complètes ou plus dans votre compte. Elle vous permet de comparer côte à côte les scores, travaux, charges et recommandations de plusieurs biens pour vous aider à faire le meilleur choix."
    },
    {
      q: "Comment supprimer mon compte ?",
      a: "Vous pouvez supprimer votre compte depuis 'Mon compte' → section 'Zone de danger'. La suppression est définitive et irréversible — toutes vos analyses et données associées seront effacées. Si vous rencontrez un problème, contactez-nous à hello@verimo.fr."
    },
  ];

  const [open, setOpen] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: dbError } = await supabase.from('contact_messages').insert({
        name: user?.user_metadata?.full_name || 'Utilisateur',
        email: user?.email || '',
        subject: subject || 'Message depuis le support',
        message: msg,
      });
      if (dbError) throw dbError;
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Réessayez ou écrivez-nous directement à hello@verimo.fr');
    }
    setSending(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 24 }}>Support / Aide</h1>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Questions fréquentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ borderRadius: 12, border: '1px solid #edf2f7', overflow: 'hidden', background: '#fff' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{f.q}</span>
                <ChevronDown size={15} color="#2a7d9c" style={{ flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {open === i && <div style={{ padding: '0 18px 16px' }}><p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.75 }}>{f.a}</p></div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Nous contacter</h2>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18 }}>Réponse garantie sous 24h — ou écrivez-nous directement à <a href="mailto:hello@verimo.fr" style={{ color: '#2a7d9c', fontWeight: 600 }}>hello@verimo.fr</a></p>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Message envoyé !</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>Votre message a été envoyé.<br />Nous reviendrons vers vous rapidement.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Sujet (optionnel)"
              style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#0f172a' }} />
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5} placeholder="Décrivez votre question ou problème…"
              style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#0f172a' }} />
            {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
            <button onClick={handleSend} disabled={!msg.trim() || sending}
              style={{ alignSelf: 'flex-start', padding: '10px 22px', borderRadius: 9, background: msg.trim() && !sending ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#edf2f7', border: 'none', color: msg.trim() && !sending ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 700, cursor: msg.trim() && !sending ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 7 }}>
              {sending ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Envoi…</> : <><Send size={14} /> Envoyer</>}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
