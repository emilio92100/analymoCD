import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, LifeBuoy, FileText, CreditCard,
  ChevronDown, Lock, Lightbulb,
  Plus, ChevronLeft, CheckCircle, MessageSquare, HelpCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Ticket = { id: string; subject: string; status: 'open' | 'resolved'; created_at: string; updated_at: string; resolved_at: string | null; unread_by_user: boolean };
type Message = { id: string; ticket_id: string; sender_type: 'user' | 'admin'; sender_name?: string | null; message: string; created_at: string };

type FaqItem = { q: string; a: string };
type FaqCategory = { id: string; label: string; icon: typeof FileText; color: string; bg: string; questions: FaqItem[] };

const faqCategories: FaqCategory[] = [
  { id: 'analyses', label: 'Analyses & documents', icon: FileText, color: '#2a7d9c', bg: '#f0f7fb', questions: [
    { q: "Quels documents puis-je analyser ?", a: "Vous pouvez analyser tous les documents liés à un bien immobilier : PV d'assemblée générale, règlement de copropriété, appel de charges, DPE, diagnostics techniques, état daté, compromis, et bien d'autres. Seuls les fichiers PDF sont acceptés." },
    { q: "Quelle est la différence entre l'analyse simple et l'analyse complète ?", a: "L'analyse simple (4,90€) porte sur un seul document PDF. L'analyse complète (19,90€) accepte jusqu'à 15 documents d'un même bien et génère un rapport détaillé avec un score /20, une recommandation Verimo, les travaux à prévoir et un avis personnalisé." },
    { q: "Combien de temps prend une analyse ?", a: "Moins de 2 minutes en général. Pour une analyse complète avec plusieurs documents, comptez 1 à 5 minutes. Vous pouvez quitter la page — l'analyse continue en arrière-plan." },
  ]},
  { id: 'compte', label: 'Compte & crédits', icon: CreditCard, color: '#16a34a', bg: '#f0fdf4', questions: [
    { q: "Comment fonctionnent les crédits ?", a: "Vous achetez des crédits d'analyse (simple ou complète). Chaque analyse consomme 1 crédit du type correspondant. Les crédits n'expirent jamais." },
  ]},
  { id: 'securite', label: 'Sécurité & données', icon: Lock, color: '#7c3aed', bg: '#f5f3ff', questions: [
    { q: "Mes documents sont-ils en sécurité ?", a: "Oui. Vos documents sont chiffrés et supprimés immédiatement après l'analyse (conformément au RGPD). Seul le rapport d'analyse est conservé dans votre espace." },
    { q: "Qui a accès à mes données ?", a: "Personne. Vos analyses et rapports sont strictement privés. L'équipe Verimo ne consulte vos données qu'en cas de demande de support explicite de votre part." },
  ]},
];

const SUBJECT_OPTIONS = [
  "Problème avec mon analyse",
  "Question sur mon abonnement",
  "Bug technique",
  "Question sur les crédits",
  "Autre",
];

export async function getUnreadTicketCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('unread_by_user', true);
  return count || 0;
}

export default function Support() {
  const [view, setView] = useState<'list' | 'chat' | 'new' | 'suggestion'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  const loadTickets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    setTickets(data || []);
    // Check if pro
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role === 'pro') setIsPro(true);
    setLoading(false);
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const openTickets = tickets.filter(t => t.status === 'open');
  const [showOpenTicketWarning, setShowOpenTicketWarning] = useState(false);

  const handleNewTicket = () => {
    if (openTickets.length > 0) {
      setShowOpenTicketWarning(true);
    } else {
      setView('new');
    }
  };
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');

  if (view === 'new') return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}><NewTicketView onBack={() => { loadTickets(); setView('list'); }} onCreated={(id) => { loadTickets(); setSelectedTicketId(id); setView('chat'); }} /></motion.div>;
  if (view === 'chat' && selectedTicketId) return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}><ChatView ticketId={selectedTicketId} onBack={() => { setView('list'); loadTickets(); }} /></motion.div>;
  if (view === 'suggestion') return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}><SuggestionView onBack={() => setView('list')} /></motion.div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`@media (max-width: 640px) { .support-mobile-only { display: flex !important; } } @media (min-width: 641px) { .support-mobile-only { display: none !important; } }`}</style>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {isPro && (
          <button onClick={() => setView('suggestion')}
            className="support-mobile-only"
            style={{ display: 'none', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: '#fffbeb', color: '#92400e', border: '1.5px solid #fde68a', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            <Lightbulb size={14} /> J&apos;ai une idée
          </button>
        )}
        <button onClick={handleNewTicket}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 12px rgba(15,45,61,0.2)' }}>
          <Plus size={14} /> Nouveau ticket
        </button>
      </div>

      {/* Tickets ouverts */}
      {openTickets.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={14} style={{ color: '#2a7d9c' }} /> Tickets en cours
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', background: '#f0f7fb', padding: '2px 8px', borderRadius: 100 }}>{openTickets.length}</span>
            </h3>
          </div>
          {openTickets.map((t, i) => <TicketRow key={t.id} ticket={t} isLast={i === openTickets.length - 1} onClick={() => { setSelectedTicketId(t.id); setView('chat'); }} />)}
        </div>
      )}

      {/* Tickets résolus */}
      {resolvedTickets.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={14} style={{ color: '#16a34a' }} /> Résolus
            </h3>
          </div>
          {resolvedTickets.map((t, i) => <TicketRow key={t.id} ticket={t} isLast={i === resolvedTickets.length - 1} onClick={() => { setSelectedTicketId(t.id); setView('chat'); }} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && tickets.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <LifeBuoy size={28} style={{ color: '#2a7d9c' }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Aucun ticket pour le moment</h3>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Si vous avez une question ou un problème, ouvrez un ticket et notre équipe vous répondra rapidement.</p>
          <button onClick={() => setView('new')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 11, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            <Plus size={14} /> Ouvrir un ticket
          </button>
        </div>
      )}

      {/* ═══ QUESTIONS FRÉQUENTES ═══ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HelpCircle size={16} style={{ color: '#2a7d9c' }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Questions fréquentes</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqCategories.map(cat => {
            const isOpen = openCat === cat.id;
            const Icon = cat.icon;
            return (
              <div key={cat.id} style={{ borderRadius: 14, border: '1px solid #edf2f7', overflow: 'hidden', background: '#fff' }}>
                <button onClick={() => setOpenCat(isOpen ? null : cat.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} style={{ color: cat.color }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{cat.label}</span>
                  <ChevronDown size={14} style={{ color: '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 18px 14px' }}>
                        {cat.questions.map((q, qi) => {
                          const qOpen = openQ === `${cat.id}-${qi}`;
                          return (
                            <div key={qi} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <button onClick={() => setOpenQ(qOpen ? null : `${cat.id}-${qi}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#334155' }}>{q.q}</span>
                                <ChevronDown size={12} style={{ color: '#cbd5e1', transform: qOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                              </button>
                              <AnimatePresence>
                                {qOpen && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                                    style={{ overflow: 'hidden' }}>
                                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: '0 0 12px', paddingLeft: 0 }}>{q.a}</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
      {/* Popup ticket déjà en cours */}
      {showOpenTicketWarning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,45,61,0.5)', padding: 20, backdropFilter: 'blur(3px)' }}
          onClick={() => setShowOpenTicketWarning(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 520, boxShadow: '0 32px 80px rgba(0,0,0,0.2)', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #fde68a' }}>
              <MessageSquare size={28} style={{ color: '#d97706' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Vous avez déjà un ticket en cours</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 8px' }}>
              Un ticket de support est actuellement ouvert. Vous pouvez y répondre ou le clôturer avant d&apos;en créer un nouveau.
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>
              Cela nous permet de mieux suivre vos demandes.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setShowOpenTicketWarning(false); setSelectedTicketId(openTickets[0]?.id); setView('chat'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                <MessageSquare size={15} /> Voir mon ticket
              </button>
              <button onClick={() => setShowOpenTicketWarning(false)}
                style={{ padding: '12px 24px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

function TicketRow({ ticket, isLast, onClick }: { ticket: Ticket; isLast: boolean; onClick: () => void }) {
  const isOpen = ticket.status === 'open';
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'none', border: 'none', borderBottom: isLast ? 'none' : '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s' }}
      onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#fafcfd'; }}
      onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: isOpen ? '#f0f7fb' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isOpen ? <MessageSquare size={14} style={{ color: '#2a7d9c' }} /> : <CheckCircle size={14} style={{ color: '#16a34a' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{ticket.subject}</span>
          {ticket.unread_by_user && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', flexShrink: 0 }} />}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
          {fmtDate(ticket.created_at)} · {isOpen ? 'En cours' : `Résolu le ${fmtDate(ticket.resolved_at!)}`}
        </div>
      </div>
      <ChevronDown size={14} style={{ color: '#cbd5e1', transform: 'rotate(-90deg)', flexShrink: 0 }} />
    </button>
  );
}

function NewTicketView({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentTicketId, setSentTicketId] = useState<string | null>(null);

  const finalSubject = subject === 'Autre' ? customSubject.trim() : subject;

  const handleSubmit = async () => {
    if (!finalSubject || !message.trim()) { setError('Veuillez remplir tous les champs.'); return; }
    setSending(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Vous devez être connecté.'); setSending(false); return; }
    const { data: ticket, error: err } = await supabase.from('support_tickets').insert({ user_id: user.id, subject: finalSubject }).select().single();
    if (err || !ticket) { setError('Erreur lors de la création.'); setSending(false); return; }
    await supabase.from('support_messages').insert({ ticket_id: ticket.id, sender_type: 'user', message: message.trim() });
    setSentTicketId(ticket.id);
  };

  if (sentTicketId) {
    return (
      <div style={{ maxWidth: 700 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid #bbf7d0' }}>
            <CheckCircle size={32} style={{ color: '#16a34a' }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Message envoyé !</h3>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 8, maxWidth: 400, margin: '0 auto 24px' }}>
            Votre demande a bien été enregistrée. Notre équipe vous répondra dès que possible directement dans cette discussion.
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>
            Vous recevrez une notification dès qu'une réponse sera disponible.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onCreated(sentTicketId)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              <MessageSquare size={15} /> Voir la discussion
            </button>
            <button onClick={onBack}
              style={{ padding: '12px 24px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Retour au support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f7fb', border: '1px solid #d0e8f0', borderRadius: 10, cursor: 'pointer', color: '#2a7d9c', fontSize: 14, fontWeight: 700, marginBottom: 20, padding: '8px 16px' }}>
        <ChevronLeft size={15} /> Retour
      </button>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LifeBuoy size={22} style={{ color: '#2a7d9c' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Besoin d&apos;aide ?</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Décrivez votre problème, nous vous répondrons rapidement.</p>
          </div>
        </div>
        {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 16 }}>{error}</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Objet</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: subject === 'Autre' ? 10 : 0 }}>
            {SUBJECT_OPTIONS.map(opt => (
              <button key={opt} onClick={() => setSubject(opt)}
                style={{ padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: subject === opt ? '1.5px solid #2a7d9c' : '1px solid #edf2f7', background: subject === opt ? '#f0f7fb' : '#fff', color: subject === opt ? '#2a7d9c' : '#64748b', transition: 'all 0.15s' }}>
                {opt}
              </button>
            ))}
          </div>
          {subject === 'Autre' && (
            <input value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="Précisez votre sujet..."
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          )}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Votre message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Décrivez votre problème ou votre question en détail..."
            rows={5} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
        </div>
        <button onClick={handleSubmit} disabled={sending}
          style={{ width: '100%', padding: '14px', borderRadius: 12, background: sending ? '#94a3b8' : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(15,45,61,0.2)' }}>
          <Send size={15} /> {sending ? 'Envoi en cours...' : 'Envoyer mon message'}
        </button>
      </div>
    </div>
  );
}

function ChatView({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadChat = useCallback(async () => {
    const [{ data: t }, { data: msgs }] = await Promise.all([
      supabase.from('support_tickets').select('*').eq('id', ticketId).single(),
      supabase.from('support_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }),
    ]);
    if (t) setTicket(t);
    setMessages(msgs || []);
    setLoading(false);
    if (t?.unread_by_user) await supabase.from('support_tickets').update({ unread_by_user: false }).eq('id', ticketId);
  }, [ticketId]);

  useEffect(() => { loadChat(); }, [loadChat]);
  useEffect(() => { const i = setInterval(loadChat, 10000); return () => clearInterval(i); }, [loadChat]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !ticket || ticket.status === 'resolved') return;
    setSending(true);
    await supabase.from('support_messages').insert({ ticket_id: ticketId, sender_type: 'user', message: newMsg.trim() });
    await supabase.from('support_tickets').update({ unread_by_admin: true }).eq('id', ticketId);
    setNewMsg('');
    await loadChat();
    setSending(false);
  };

  const handleCloseTicket = async () => {
    setClosing(true);
    // Insérer un message système visible par l'admin et le client
    await supabase.from('support_messages').insert({ ticket_id: ticketId, sender_type: 'user', message: '✅ J\'ai clôturé ce ticket — mon problème est résolu. Merci !' });
    await supabase.from('support_tickets').update({ status: 'resolved', resolved_at: new Date().toISOString(), unread_by_admin: true }).eq('id', ticketId);
    await loadChat();
    setClosing(false);
    setShowCloseConfirm(false);
  };

  const fmtTime = (d: string) => new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #edf2f7', borderTopColor: '#2a7d9c', animation: 'spin 0.9s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f7fb', border: '1px solid #d0e8f0', borderRadius: 10, cursor: 'pointer', color: '#2a7d9c', fontSize: 13, fontWeight: 700, padding: '8px 14px' }}>
          <ChevronLeft size={14} /> Retour
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{ticket?.subject}</h2>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {ticket?.status === 'resolved' ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Résolu</span> : <span style={{ color: '#d97706', fontWeight: 600 }}>En cours</span>}
          </div>
        </div>
        {/* Bouton clôturer ticket */}
        {ticket?.status === 'open' && (
          <button onClick={() => setShowCloseConfirm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#fff', border: '1.5px solid #edf2f7', cursor: 'pointer', color: '#64748b', fontSize: 12, fontWeight: 700, transition: 'all 0.15s' }}
            onMouseOver={e => { const el = e.currentTarget; el.style.borderColor = '#16a34a'; el.style.color = '#16a34a'; el.style.background = '#f0fdf4'; }}
            onMouseOut={e => { const el = e.currentTarget; el.style.borderColor = '#edf2f7'; el.style.color = '#64748b'; el.style.background = '#fff'; }}>
            <CheckCircle size={13} /> Clôturer
          </button>
        )}
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '16px', minHeight: 0, background: '#f8fafc', borderRadius: 14, border: '1px solid #edf2f7' }}>
        {messages.map(m => {
          const isUser = m.sender_type === 'user';
          const senderLabel = isUser ? 'Vous' : (m.sender_name || 'Verimo');
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '12px 16px',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isUser ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#fff',
                color: isUser ? '#fff' : '#0f172a',
                border: isUser ? 'none' : '1px solid #edf2f7',
                fontSize: 14, lineHeight: 1.6,
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                <div style={{ fontSize: 11, marginTop: 6, opacity: 0.6, textAlign: 'right' }}>{senderLabel} · {fmtTime(m.created_at)}</div>
              </div>
            </div>
          );
        })}
        {ticket?.status === 'resolved' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 100, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <CheckCircle size={14} style={{ color: '#16a34a' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>Ce ticket a été résolu</span>
            </div>
          </div>
        )}
      </div>
      {ticket?.status === 'open' && (
        <div style={{ display: 'flex', gap: 10, padding: '16px 0', borderTop: '1px solid #edf2f7', flexShrink: 0 }}>
          <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Votre réponse..."
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <button onClick={handleSend} disabled={sending || !newMsg.trim()}
            style={{ padding: '12px 18px', borderRadius: 12, background: !newMsg.trim() ? '#e2e8f0' : '#2a7d9c', color: '#fff', border: 'none', cursor: !newMsg.trim() ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            <Send size={14} /> {sending ? '...' : 'Envoyer'}
          </button>
        </div>
      )}

      {/* Modal confirmation clôture */}
      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,45,61,0.5)', padding: 20, backdropFilter: 'blur(3px)' }}
            onClick={() => { if (!closing) setShowCloseConfirm(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.2)', padding: '36px 32px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #bbf7d0' }}>
                <CheckCircle size={28} style={{ color: '#16a34a' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Clôturer ce ticket ?</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 340, margin: '0 auto 24px' }}>
                Si votre problème est résolu, vous pouvez clôturer ce ticket. Vous pourrez toujours en ouvrir un nouveau si besoin.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setShowCloseConfirm(false)} disabled={closing}
                  style={{ padding: '12px 24px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  Annuler
                </button>
                <button onClick={handleCloseTicket} disabled={closing}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: 'none', cursor: closing ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, opacity: closing ? 0.7 : 1 }}>
                  <CheckCircle size={15} /> {closing ? 'Clôture...' : 'Oui, clôturer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   VUE SUGGESTION (pro uniquement)
═══════════════════════════════════════════ */
function SuggestionView({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const categories = [
    { id: 'feature', label: '🔧 Fonctionnalité manquante', placeholder: 'Décrivez la fonctionnalité que vous aimeriez voir...' },
    { id: 'improvement', label: '✨ Amélioration existante', placeholder: 'Quelle fonctionnalité pourrait être améliorée ?' },
    { id: 'report', label: '📊 Nouveau type de rapport', placeholder: 'Quel type de document ou rapport aimeriez-vous ?' },
    { id: 'other', label: '💡 Autre idée', placeholder: 'Partagez votre idée...' },
  ];

  const selectedCat = categories.find(c => c.id === category);

  const handleSend = async () => {
    if (!message.trim() || !category) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }
    await supabase.from('pro_suggestions').insert({ user_id: user.id, message: message.trim(), category });
    setSending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💡</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Merci pour votre suggestion !</h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
          Votre idée a bien été transmise à notre équipe. Nous la prendrons en compte pour améliorer Verimo.
        </p>
        <button onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          Retour au support
        </button>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <button onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}>
        <ChevronLeft size={16} /> Retour au support
      </button>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lightbulb size={18} style={{ color: '#d97706' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Proposer une idée</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Aidez-nous à améliorer Verimo</p>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Type de suggestion</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 20 }}>
            {categories.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: category === c.id ? '2px solid #d97706' : '1.5px solid #edf2f7', background: category === c.id ? '#fffbeb' : '#fff', color: category === c.id ? '#92400e' : '#64748b', transition: 'all 0.15s', textAlign: 'left' as const }}>
                {c.label}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Votre idée</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder={selectedCat?.placeholder || 'Décrivez votre suggestion...'}
            rows={5} style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit', resize: 'vertical', marginBottom: 16 }} />

          <button onClick={handleSend}
            disabled={sending || !category || !message.trim()}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: (!category || !message.trim()) ? '#e2e8f0' : 'linear-gradient(135deg, #d97706, #b45309)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: (!category || !message.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Lightbulb size={15} /> {sending ? 'Envoi en cours...' : 'Envoyer ma suggestion'}
          </button>
        </div>
      </div>
    </div>
  );
}
