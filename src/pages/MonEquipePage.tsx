// ════════════════════════════════════════════════════════════════════════
// VERIMO — Mon équipe (responsable agence)
// Liste des membres + invitations + bouton inviter + actions
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Mail, Crown, User, Trash2, RefreshCw,
  AlertTriangle, CheckCircle, X, Send, ChevronRight,
  Shield,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AgenceMember {
  id: string;
  user_id: string;
  role: 'responsable' | 'co_responsable' | 'agent';
  joined_at: string;
  removed_at: string | null;
  last_active_at: string | null;
  email: string;
  full_name: string;
  color_hex: string;
  analyses_count?: number;
}

interface AgenceInvitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
  invited_by_name: string | null;
  resend_count: number;
}

interface AgenceInfo {
  id: string;
  raison_sociale: string;
  nb_users_max: number;
  status: string;
  credits_complete: number;
  credits_document: number;
}

interface Props {
  userId: string;
  agenceId: string;
  userRole: 'responsable' | 'co_responsable' | 'agent';
}

export default function MonEquipePage({ userId, agenceId, userRole }: Props) {
  const [agence, setAgence] = useState<AgenceInfo | null>(null);
  const [members, setMembers] = useState<AgenceMember[]>([]);
  const [invitations, setInvitations] = useState<AgenceInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AgenceMember | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const isManager = userRole === 'responsable' || userRole === 'co_responsable';

  // ────────────────────────────────────────────────────────────
  // Chargement
  // ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Agence
      const { data: agenceData } = await supabase
        .from('agences')
        .select('id, raison_sociale, nb_users_max, status, credits_complete, credits_document')
        .eq('id', agenceId)
        .single();
      if (agenceData) setAgence(agenceData as AgenceInfo);

      // Membres actifs (sans jointure embarquée — on récupère les profiles séparément)
      const { data: membersData } = await supabase
        .from('agence_members')
        .select('id, user_id, role, joined_at, removed_at, last_active_at, color_hex')
        .eq('agence_id', agenceId)
        .is('removed_at', null)
        .order('joined_at', { ascending: true });

      if (membersData && membersData.length > 0) {
        // Récupérer les profils en une seule requête séparée
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        const profilesMap = new Map<string, { email: string; full_name: string }>(
          (profilesData || []).map(p => [p.id, { email: p.email || '', full_name: p.full_name || 'Sans nom' }])
        );

        // Enrichir avec compteur d'analyses
        const enriched = await Promise.all(membersData.map(async (m) => {
          const { count } = await supabase
            .from('analyses')
            .select('id', { count: 'exact', head: true })
            .eq('agence_id', agenceId)
            .eq('created_by_user_id', m.user_id)
            .is('deleted_at', null);

          const profile = profilesMap.get(m.user_id);

          return {
            id: m.id,
            user_id: m.user_id,
            role: m.role,
            joined_at: m.joined_at,
            removed_at: m.removed_at,
            last_active_at: m.last_active_at,
            color_hex: m.color_hex || '#0e3a4a',
            email: profile?.email || '',
            full_name: profile?.full_name || 'Sans nom',
            analyses_count: count || 0,
          };
        }));
        setMembers(enriched);
      } else {
        setMembers([]);
      }

      // Invitations (responsable uniquement)
      if (isManager) {
        const { data: invitationsData } = await supabase
          .from('agence_invitations')
          .select('id, email, status, created_at, expires_at, invited_by_name, resend_count')
          .eq('agence_id', agenceId)
          .in('status', ['pending', 'expired'])
          .order('created_at', { ascending: false });

        if (invitationsData) setInvitations(invitationsData as AgenceInvitation[]);
      }
    } catch (e) {
      console.error('Erreur loadData:', e);
    }
    setLoading(false);
  }, [agenceId, isManager]);

  useEffect(() => { loadData(); }, [loadData]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ────────────────────────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────────────────────────
  const handleInvite = async (email: string) => {
    try {
      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/send-agence-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ agence_id: agenceId, email, invited_by: userId }),
      });
      const data = await res.json();
      if (!data.success) {
        setToast({ msg: data.error || 'Erreur lors de l\'envoi', type: 'error' });
        return false;
      }
      setToast({ msg: `Invitation envoyée à ${email}`, type: 'success' });
      await loadData();
      return true;
    } catch {
      setToast({ msg: 'Erreur de connexion', type: 'error' });
      return false;
    }
  };

  const handleCancelInvitation = async (invId: string) => {
    if (!confirm('Annuler cette invitation ?')) return;
    await supabase.from('agence_invitations').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', invId);
    setToast({ msg: 'Invitation annulée', type: 'success' });
    await loadData();
  };

  const handleResendInvitation = async (inv: AgenceInvitation) => {
    // Renvoyer = créer une nouvelle invitation (annule l'ancienne automatiquement via la fonction SQL)
    const ok = await handleInvite(inv.email);
    if (ok) setToast({ msg: `Invitation renvoyée à ${inv.email}`, type: 'success' });
  };

  const handleRemoveMember = async (member: AgenceMember) => {
    if (!confirm(`Retirer ${member.full_name} de l'agence ?\n\nSes ${member.analyses_count} analyse${(member.analyses_count || 0) > 1 ? 's' : ''} resteront dans l'agence avec la mention "ancien membre".`)) return;
    const { error } = await supabase.rpc('remove_agence_member', {
      p_agence_id: agenceId,
      p_user_id: member.user_id,
      p_removed_by: userId,
    });
    if (error) {
      setToast({ msg: error.message, type: 'error' });
    } else {
      setToast({ msg: `${member.full_name} a été retiré(e)`, type: 'success' });
      setSelectedMember(null);
      await loadData();
    }
  };

  const handlePromote = async (member: AgenceMember) => {
    if (!confirm(`Promouvoir ${member.full_name} en co-responsable ?\n\nIl aura les mêmes droits que vous : inviter/retirer des utilisateurs, gérer la facturation.`)) return;
    const { error } = await supabase
      .from('agence_members')
      .update({ role: 'co_responsable' })
      .eq('id', member.id);
    if (error) {
      setToast({ msg: error.message, type: 'error' });
    } else {
      setToast({ msg: `${member.full_name} est maintenant co-responsable`, type: 'success' });
      setSelectedMember(null);
      await loadData();
    }
  };

  const handleDemote = async (member: AgenceMember) => {
    if (!confirm(`Rétrograder ${member.full_name} en agent ?`)) return;
    const { error } = await supabase
      .from('agence_members')
      .update({ role: 'agent' })
      .eq('id', member.id);
    if (error) {
      setToast({ msg: error.message, type: 'error' });
    } else {
      setToast({ msg: `${member.full_name} est maintenant agent`, type: 'success' });
      setSelectedMember(null);
      await loadData();
    }
  };

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2a7d9c', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!agence) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Impossible de charger les informations de l'agence.
      </div>
    );
  }

  const slotsUsed = members.length;
  const slotsAvailable = agence.nb_users_max - slotsUsed;
  const pendingCount = invitations.filter(i => i.status === 'pending').length;
  const canInviteMore = slotsAvailable - pendingCount > 0;

  return (
    <div style={{ padding: '24px 28px 60px', maxWidth: 1080, margin: '0 auto' }}>

      {/* ═══ Header ═══ */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #0e3a4a, #2a7d9c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Mon équipe</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
              {agence.raison_sociale} · {slotsUsed}/{agence.nb_users_max} utilisateur{slotsUsed > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Bandeau infos agence (responsable uniquement) ═══ */}
      {isManager && (
        <div style={{ background: 'linear-gradient(135deg, #0e3a4a 0%, #134454 50%, #1a526a 100%)', borderRadius: 16, padding: 22, marginBottom: 24, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={22} color="#7dd3fc" />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Votre rôle</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '4px 0 0' }}>
                {userRole === 'responsable' ? '👑 Responsable' : '🤝 Co-responsable'} de l'agence
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Places restantes</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '2px 0 0' }}>{slotsAvailable - pendingCount}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Crédits agence</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '2px 0 0' }}>{agence.credits_complete + agence.credits_document}</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Section invitations en cours ═══ */}
      {isManager && invitations.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              ✉️ Invitations en cours ({pendingCount})
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {invitations.map(inv => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                onResend={() => handleResendInvitation(inv)}
                onCancel={() => handleCancelInvitation(inv.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══ Liste des membres ═══ */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            👥 Membres ({slotsUsed})
          </h2>
          {isManager && (
            <button
              onClick={() => setShowInviteModal(true)}
              disabled={!canInviteMore}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 10,
                background: canInviteMore ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#cbd5e1',
                color: '#fff', fontSize: 13, fontWeight: 700, border: 'none',
                cursor: canInviteMore ? 'pointer' : 'not-allowed',
                boxShadow: canInviteMore ? '0 4px 14px rgba(42,125,156,0.3)' : 'none',
              }}
              title={canInviteMore ? 'Inviter un nouvel utilisateur' : 'Toutes vos places sont occupées'}
            >
              <UserPlus size={15} /> Inviter un utilisateur
            </button>
          )}
        </div>

        {!canInviteMore && isManager && (
          <div style={{ background: '#fef9c3', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={15} color="#92400e" />
            <p style={{ fontSize: 12.5, color: '#92400e', margin: 0, flex: 1 }}>
              Toutes vos places sont occupées. Pour en ajouter, contactez le support depuis l'onglet "Support".
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              isMe={member.user_id === userId}
              canManage={isManager && member.user_id !== userId}
              onClick={() => isManager && member.user_id !== userId ? setSelectedMember(member) : undefined}
            />
          ))}
        </div>
      </div>

      {/* ═══ Modale d'invitation ═══ */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            onClose={() => setShowInviteModal(false)}
            onInvite={async (email) => {
              const ok = await handleInvite(email);
              if (ok) setShowInviteModal(false);
            }}
            slotsAvailable={slotsAvailable - pendingCount}
          />
        )}
      </AnimatePresence>

      {/* ═══ Modale actions sur membre ═══ */}
      <AnimatePresence>
        {selectedMember && (
          <MemberActionModal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onRemove={() => handleRemoveMember(selectedMember)}
            onPromote={() => handlePromote(selectedMember)}
            onDemote={() => handleDemote(selectedMember)}
          />
        )}
      </AnimatePresence>

      {/* ═══ Toast ═══ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
              padding: '14px 20px', borderRadius: 12,
              background: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: '#fff', fontSize: 14, fontWeight: 600,
              boxShadow: '0 10px 32px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', gap: 10,
              maxWidth: 400,
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
   ════════════════════════════════════════════════════════════════════════ */

function MemberCard({ member, isMe, canManage, onClick }: {
  member: AgenceMember; isMe: boolean; canManage: boolean; onClick?: () => void;
}) {
  const roleLabel = member.role === 'responsable' ? '👑 Responsable'
    : member.role === 'co_responsable' ? '🤝 Co-responsable'
    : '👤 Agent';
  const roleBg = member.role === 'responsable' ? '#fef3c7'
    : member.role === 'co_responsable' ? '#dbeafe'
    : '#f1f5f9';
  const roleColor = member.role === 'responsable' ? '#a16207'
    : member.role === 'co_responsable' ? '#1e6783'
    : '#475569';

  const initials = member.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 12, padding: 16,
        border: isMe ? '2px solid #2a7d9c' : '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: canManage ? 'pointer' : 'default',
        transition: 'all 0.15s',
      }}
      onMouseOver={e => { if (canManage) e.currentTarget.style.borderColor = '#2a7d9c'; }}
      onMouseOut={e => { if (canManage) e.currentTarget.style.borderColor = isMe ? '#2a7d9c' : '#e2e8f0'; }}
    >
      {/* Avatar initiales */}
      <div style={{
        width: 44, height: 44, borderRadius: 11,
        background: member.color_hex,
        color: '#fff', fontSize: 15, fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {initials}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <p style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.full_name}
          </p>
          {isMe && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#2a7d9c', background: '#f0f7fb', padding: '2px 7px', borderRadius: 4 }}>
              VOUS
            </span>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {member.email}
        </p>
        <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '4px 0 0' }}>
          {member.analyses_count || 0} analyse{(member.analyses_count || 0) > 1 ? 's' : ''} créée{(member.analyses_count || 0) > 1 ? 's' : ''} · membre depuis {formatDate(member.joined_at)}
        </p>
      </div>

      {/* Badge rôle */}
      <div style={{
        padding: '6px 12px', borderRadius: 8,
        background: roleBg, color: roleColor,
        fontSize: 11.5, fontWeight: 700,
        flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        {roleLabel}
      </div>

      {/* Chevron si cliquable */}
      {canManage && (
        <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
      )}
    </div>
  );
}

function InvitationCard({ invitation, onResend, onCancel }: {
  invitation: AgenceInvitation; onResend: () => void; onCancel: () => void;
}) {
  const expiresAt = new Date(invitation.expires_at);
  const now = new Date();
  const isExpired = expiresAt < now || invitation.status === 'expired';
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{
      background: isExpired ? '#fef2f2' : '#fff',
      borderRadius: 12, padding: 14,
      border: `1px solid ${isExpired ? '#fecaca' : '#e2e8f0'}`,
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: isExpired ? '#fecaca' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isExpired ? <AlertTriangle size={16} color="#dc2626" /> : <Mail size={16} color="#0284c7" />}
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          {invitation.email}
        </p>
        <p style={{ fontSize: 11.5, color: isExpired ? '#dc2626' : '#64748b', margin: '3px 0 0' }}>
          {isExpired
            ? `⚠️ Invitation expirée`
            : `Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
          {invitation.resend_count > 0 && ` · renvoyée ${invitation.resend_count}x`}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onResend}
          style={{ padding: '7px 12px', borderRadius: 8, background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <RefreshCw size={12} /> Renvoyer
        </button>
        <button
          onClick={onCancel}
          style={{ padding: '7px 10px', borderRadius: 8, background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 600, border: '1px solid #fecaca', cursor: 'pointer' }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function InviteModal({ onClose, onInvite, slotsAvailable }: {
  onClose: () => void; onInvite: (email: string) => void; slotsAvailable: number;
}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }
    setSubmitting(true);
    await onInvite(email.trim());
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 460, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={20} color="#fff" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Inviter un utilisateur</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 18px', lineHeight: 1.6 }}>
          L'utilisateur recevra un email d'invitation. <strong>Le lien est valable 7 jours.</strong><br/>
          Vous pouvez encore inviter <strong>{slotsAvailable} utilisateur{slotsAvailable > 1 ? 's' : ''}</strong>.
        </p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email de la personne à inviter</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="prenom.nom@exemple.fr"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'inherit', marginBottom: error ? 8 : 18 }}
          onFocus={e => e.target.style.borderColor = '#2a7d9c'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />

        {error && (
          <div style={{ padding: '9px 13px', borderRadius: 9, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 16 }}>
            <p style={{ fontSize: 12.5, color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 11, background: '#f1f5f9', color: '#475569', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !email}
            style={{
              flex: 1.5, padding: 12, borderRadius: 11,
              background: !email ? '#cbd5e1' : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)',
              color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: submitting || !email ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <Send size={14} /> {submitting ? 'Envoi…' : 'Envoyer l\'invitation'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MemberActionModal({ member, onClose, onRemove, onPromote, onDemote }: {
  member: AgenceMember;
  onClose: () => void;
  onRemove: () => void;
  onPromote: () => void;
  onDemote: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 460, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: member.color_hex, color: '#fff', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {member.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{member.full_name}</h3>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '2px 0 0' }}>{member.email}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {member.role === 'agent' && (
            <button
              onClick={onPromote}
              style={{ padding: '13px 16px', borderRadius: 11, background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}
            >
              <Crown size={18} color="#a16207" />
              <div>
                <div>Promouvoir en co-responsable</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400, marginTop: 2 }}>Pourra inviter/retirer et gérer la facturation</div>
              </div>
            </button>
          )}

          {member.role === 'co_responsable' && (
            <button
              onClick={onDemote}
              style={{ padding: '13px 16px', borderRadius: 11, background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}
            >
              <User size={18} color="#64748b" />
              <div>
                <div>Rétrograder en agent</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400, marginTop: 2 }}>Perdra les droits de gestion</div>
              </div>
            </button>
          )}

          <button
            onClick={onRemove}
            style={{ padding: '13px 16px', borderRadius: 11, background: '#fff', border: '1.5px solid #fecaca', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: '#dc2626', textAlign: 'left' }}
          >
            <Trash2 size={18} />
            <div>
              <div>Retirer de l'agence</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400, marginTop: 2 }}>Ses dossiers restent dans l'agence avec "ancien membre"</div>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────── */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
