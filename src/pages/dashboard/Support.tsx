import { useState } from 'react';
import {
  Send, LifeBuoy, Mail, FileText, CreditCard, Shield,
  ChevronDown, Clock, Lock, Key, Users, Scale,
  Sparkles, Copy, BadgeCheck, Eye, UserX, FileCheck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════

type FaqItem = {
  q: string;
  a: string;
  icon: typeof FileText;
  iconColor: string;
  iconBg: string;
};

type FaqCategory = {
  id: string;
  label: string;
  icon: typeof FileText;
  color: string;
  bg: string;
  questions: FaqItem[];
};

const faqCategories: FaqCategory[] = [
  {
    id: 'analyses',
    label: 'Analyses & documents',
    icon: FileText,
    color: '#2a7d9c',
    bg: '#f0f7fb',
    questions: [
      {
        q: "Quels documents puis-je analyser ?",
        a: "Vous pouvez analyser tous les documents liés à un bien immobilier : PV d'assemblée générale (AG), règlement de copropriété, appel de charges, budget prévisionnel, diagnostic de performance énergétique (DPE), diagnostics techniques (électricité, gaz, amiante, plomb), état daté, compromis ou promesse de vente, et bien d'autres. Seuls les fichiers PDF sont acceptés. Les fichiers Word doivent être convertis en PDF avant l'upload.",
        icon: FileText, iconColor: '#2a7d9c', iconBg: '#f0f7fb',
      },
      {
        q: "Quelle est la différence entre l'analyse simple et l'analyse complète ?",
        a: "L'analyse simple (4,90€) porte sur un seul document PDF — idéale pour comprendre rapidement un PV d'AG ou un diagnostic précis. L'analyse complète (19,90€) accepte jusqu'à 20 documents d'un même bien et génère un rapport détaillé avec un score /20, une recommandation (Acheter / Négocier / Risqué), l'estimation des risques financiers, les travaux à prévoir et un avis Verimo personnalisé.",
        icon: Sparkles, iconColor: '#7c3aed', iconBg: '#f5f3ff',
      },
      {
        q: "Combien de temps prend une analyse ?",
        a: "Moins de 2 minutes en général. Pour une analyse complète avec plusieurs documents, comptez 1 à 3 minutes selon le nombre et la taille des fichiers. Vous pouvez quitter la page pendant ce temps — l'analyse continue en arrière-plan et le résultat sera disponible dans 'Mes analyses' dès qu'elle sera terminée.",
        icon: Clock, iconColor: '#d97706', iconBg: '#fffbeb',
      },
      {
        q: "Puis-je compléter un dossier après une analyse ?",
        a: "Oui. Vous avez 7 jours après une analyse complète pour ajouter jusqu'à 5 documents supplémentaires et régénérer votre rapport enrichi, sans payer de crédit supplémentaire. Utile si vous recevez un document important après coup (un nouveau PV d'AG, un diagnostic manquant…).",
        icon: FileCheck, iconColor: '#16a34a', iconBg: '#f0fdf4',
      },
      {
        q: "J'ai plusieurs biens à analyser, comment faire ?",
        a: "Chaque bien s'analyse séparément pour un rapport précis. Vous pouvez utiliser 1 crédit par bien, ou profiter de nos packs à tarif réduit : Pack 2 biens (29,90€) ou Pack 3 biens (39,90€). Une fois vos biens analysés, vous pourrez les comparer côte à côte depuis l'onglet 'Comparer mes biens'.",
        icon: Copy, iconColor: '#2a7d9c', iconBg: '#f0f7fb',
      },
      {
        q: "Comment fonctionne la comparaison de biens ?",
        a: "L'onglet 'Comparer mes biens' se débloque automatiquement dès que vous avez 2 analyses complètes ou plus dans votre espace. Vous pouvez alors sélectionner 2 ou 3 biens pour obtenir un rapport comparatif côte à côte : scores /20, travaux à prévoir, charges, recommandation Verimo et bien à privilégier. Idéal pour trancher entre plusieurs coups de cœur.",
        icon: Users, iconColor: '#7c3aed', iconBg: '#f5f3ff',
      },
    ],
  },
  {
    id: 'paiement',
    label: 'Paiement & crédits',
    icon: CreditCard,
    color: '#7c3aed',
    bg: '#f5f3ff',
    questions: [
      {
        q: "Comment fonctionnent les crédits ?",
        a: "Chaque achat vous attribue des crédits utilisables à tout moment. 4,90€ = 1 crédit analyse document. 19,90€ = 1 crédit analyse complète. 29,90€ = 2 crédits complets (Pack 2 biens). 39,90€ = 3 crédits complets (Pack 3 biens). Vos crédits restants sont visibles en permanence dans la barre latérale gauche.",
        icon: CreditCard, iconColor: '#7c3aed', iconBg: '#f5f3ff',
      },
      {
        q: "Les crédits expirent-ils ?",
        a: "Non, jamais. Vos crédits restent disponibles tant que votre compte est actif, sans date limite. Vous pouvez acheter des crédits aujourd'hui et les utiliser dans 6 mois ou dans 2 ans.",
        icon: Clock, iconColor: '#16a34a', iconBg: '#f0fdf4',
      },
      {
        q: "Puis-je utiliser un code promo ?",
        a: "Oui. Au moment de l'achat, un champ 'Code promo' est disponible dans la fenêtre de paiement. Les codes peuvent offrir une réduction en pourcentage, une réduction fixe en euros, ou des crédits gratuits directement sans paiement. Chaque code est à usage unique par compte.",
        icon: BadgeCheck, iconColor: '#d97706', iconBg: '#fffbeb',
      },
      {
        q: "Puis-je être remboursé si je change d'avis ?",
        a: "Conformément au droit français, vous pouvez demander le remboursement de vos crédits non utilisés dans les 14 jours suivant votre achat. Contactez-nous à hello@verimo.fr avec l'email de votre compte — nous vérifions votre achat et procédons au remboursement sous quelques jours. Les crédits déjà utilisés (analyse lancée, rapport généré) ne sont pas remboursables : le service est alors considéré comme exécuté, conformément à l'exception prévue par le Code de la consommation pour les contenus numériques.",
        icon: Scale, iconColor: '#2a7d9c', iconBg: '#f0f7fb',
      },
    ],
  },
  {
    id: 'securite',
    label: 'Sécurité & compte',
    icon: Shield,
    color: '#16a34a',
    bg: '#f0fdf4',
    questions: [
      {
        q: "Mes documents sont-ils sécurisés ?",
        a: "Oui, absolument. Vos documents sont transmis via une connexion chiffrée SSL/TLS et traités en mémoire uniquement. Conformément au RGPD, ils sont supprimés de nos serveurs immédiatement après l'analyse — nous ne conservons que le rapport généré. Vos documents ne sont jamais partagés avec des tiers.",
        icon: Lock, iconColor: '#16a34a', iconBg: '#f0fdf4',
      },
      {
        q: "Puis-je partager mon rapport avec quelqu'un ?",
        a: "Oui. Depuis n'importe quel rapport, vous pouvez générer un lien de partage sécurisé. La personne qui reçoit le lien peut consulter le rapport sans avoir besoin de créer un compte Verimo — pratique pour le transmettre à votre notaire, votre famille ou votre conjoint.",
        icon: Eye, iconColor: '#2a7d9c', iconBg: '#f0f7fb',
      },
      {
        q: "Que faire si mon PDF est protégé par un mot de passe ?",
        a: "Les PDF protégés ne peuvent pas être analysés. Vous devez d'abord retirer la protection depuis Adobe Acrobat Reader (Fichier → Propriétés → Sécurité → Aucune sécurité) ou tout autre logiciel PDF, puis uploader la version déverrouillée.",
        icon: Key, iconColor: '#d97706', iconBg: '#fffbeb',
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Vous pouvez supprimer votre compte depuis 'Mon compte' → section 'Zone de danger'. La suppression est définitive et irréversible — toutes vos analyses et données associées seront effacées. Si vous rencontrez un problème, contactez-nous à hello@verimo.fr.",
        icon: UserX, iconColor: '#dc2626', iconBg: '#fef2f2',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

export default function Support() {
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openQ, setOpenQ] = useState<string | null>(null);
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

  const totalQuestions = faqCategories.reduce((sum, c) => sum + c.questions.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.35s ease both' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* FORMULAIRE EN HAUT */}
      <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '22px 26px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderBottom: '1px solid #fed7aa', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(217,119,6,0.25)' }}>
            <Mail size={20} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>Comment pouvons-nous vous aider ?</div>
            <div style={{ fontSize: 13.5, color: '#78350f', lineHeight: 1.6 }}>
              Écrivez-nous, nous revenons vers vous sous 24h en moyenne.
            </div>
            <div style={{ fontSize: 13.5, color: '#78350f', lineHeight: 1.6, marginTop: 6 }}>
              💡 <strong>Astuce</strong> : la réponse se trouve peut-être déjà dans notre FAQ juste en dessous — jetez-y un œil avant !
            </div>
          </div>
        </div>

        <div style={{ padding: '26px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none"><path d="M6 15l6 6 12-12" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Message envoyé !</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>Merci pour votre message. Notre équipe vous répondra très rapidement à l'adresse email de votre compte.</p>
              <button onClick={() => { setSent(false); setMsg(''); setSubject(''); }}
                style={{ marginTop: 20, padding: '10px 22px', borderRadius: 10, background: '#fff', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: '0.02em' }}>Sujet <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optionnel)</span></label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex : Question sur une analyse, bug, remboursement…"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#0f172a', transition: 'border-color 0.2s ease' }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#edf2f7'} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: '0.02em' }}>Votre message</label>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5} placeholder="Décrivez votre question ou problème avec le plus de détails possible. Nous revenons vers vous sous 24h."
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#0f172a', lineHeight: 1.6, transition: 'border-color 0.2s ease', minHeight: 120 }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#edf2f7'} />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>{error}</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} style={{ color: '#94a3b8' }} />
                  Ou écrivez directement à <a href="mailto:hello@verimo.fr" style={{ color: '#2a7d9c', fontWeight: 700, textDecoration: 'none' }}>hello@verimo.fr</a>
                </div>
                <button onClick={handleSend} disabled={!msg.trim() || sending}
                  style={{ padding: '12px 26px', borderRadius: 11, background: msg.trim() && !sending ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#edf2f7', border: 'none', color: msg.trim() && !sending ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 700, cursor: msg.trim() && !sending ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, boxShadow: msg.trim() && !sending ? '0 4px 14px rgba(42,125,156,0.3)' : 'none', transition: 'all 0.2s ease' }}>
                  {sending ? (
                    <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Envoi…</>
                  ) : (
                    <><Send size={15} /> Envoyer mon message</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#0f2d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LifeBuoy size={17} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Questions fréquentes</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{totalQuestions} questions, classées par thème</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqCategories.map(cat => {
            const isOpen = openCat === cat.id;
            const CatIcon = cat.icon;
            return (
              <div key={cat.id} style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 14, overflow: 'hidden' }}>
                <button
                  onClick={() => { setOpenCat(isOpen ? null : cat.id); setOpenQ(null); }}
                  style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, background: isOpen ? cat.bg : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.25s ease' }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CatIcon size={17} style={{ color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{cat.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{cat.questions.length} question{cat.questions.length > 1 ? 's' : ''}</div>
                  </div>
                  <ChevronDown size={18} style={{ color: cat.color, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', flexShrink: 0 }} />
                </button>

                {/* Conteneur animé : grid 0fr → 1fr */}
                <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s ease' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '4px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {cat.questions.map((item, qi) => {
                        const qKey = `${cat.id}-${qi}`;
                        const qOpen = openQ === qKey;
                        const ItemIcon = item.icon;
                        return (
                          <div key={qi} style={{ background: qOpen ? cat.bg : '#f8fafc', borderRadius: 10, border: `1px solid ${qOpen ? cat.color + '40' : '#edf2f7'}`, overflow: 'hidden', transition: 'background 0.25s ease, border-color 0.25s ease' }}>
                            <button
                              onClick={() => setOpenQ(qOpen ? null : qKey)}
                              style={{ width: '100%', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                            >
                              <div style={{ width: 34, height: 34, borderRadius: 9, background: qOpen ? item.iconColor : '#fff', border: qOpen ? 'none' : '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.25s ease, border-color 0.25s ease' }}>
                                <ItemIcon size={15} style={{ color: qOpen ? '#fff' : item.iconColor, transition: 'color 0.25s ease' }} />
                              </div>
                              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: qOpen ? cat.color : '#0f172a', lineHeight: 1.4, transition: 'color 0.25s ease' }}>{item.q}</span>
                              <span style={{ width: 22, height: 22, borderRadius: '50%', background: qOpen ? cat.color : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0, transition: 'background 0.25s ease, transform 0.3s ease', transform: qOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                {qOpen ? '−' : '+'}
                              </span>
                            </button>

                            <div style={{ display: 'grid', gridTemplateRows: qOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease' }}>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '0 15px 14px 61px', fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
                                  {item.a}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA FINAL — rappel contact si la FAQ ne répond pas */}
      <div style={{ background: 'linear-gradient(135deg, #f0f7fb 0%, #e0eef5 100%)', border: '1.5px solid #bae3f5', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: '#2a7d9c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(42,125,156,0.25)' }}>
          <Mail size={18} style={{ color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>Vous n'avez pas trouvé votre réponse ?</div>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>Remontez en haut de page pour nous écrire, nous revenons vers vous rapidement.</div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
