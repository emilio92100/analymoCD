// ════════════════════════════════════════════════════════════════════════
// VERIMO — Mon équipe (multi-utilisateurs agence)
// Liste des membres + invitations + bouton inviter + fiche détail membre
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Mail, Crown, User, Trash2, RefreshCw,
  AlertTriangle, CheckCircle, X, Send, ChevronRight, ArrowLeft,
  Shield, FileText, TrendingUp, Folder, Award,
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

interface MemberDetailStats {
  analyses_count: number;
  analyses_completes: number;
  analyses_simples: number;
  folders_count: number;
  reports_sent: number;
  recent_analyses: Array<{ id: string; title: string; type: string; created_at: string; status: string; score?: number }>;
  activity_by_week: Array<{ week: string; count: number }>;
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
  // 🆕 Fiche détail au lieu de simple popup actions
  const [detailMember, setDetailMember] = useState<AgenceMember | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const isManager = userRole === 'responsable' || userRole === 'co_responsable';

  // ────────────────────────────────────────────────────────────
  // Chargement
  // ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: agenceData } = await supabase
        .from('agences')
        .select('id, raison_sociale, nb_users_max, status, credits_complete, credits_document')
        .eq('id', agenceId)
        .single();
      if (agenceData) setAgence(agenceData as AgenceInfo);

      const { data: membersData } = await supabase
        .from('agence_members')
        .select('id, user_id, role, joined_at, removed_at, last_active_at, color_hex')
        .eq('agence_id', agenceId)
        .is('removed_at', null)
        .order('joined_at', { ascending: true });

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        const profilesMap = new Map<string, { email: string; full_name: string }>(
          (profilesData || []).map(p => [p.id, { email: p.email || '', full_name: p.full_name || 'Sans nom' }])
        );

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
      setDetailMember(null);
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
      setDetailMember(prev => prev ? { ...prev, role: 'co_responsable' } : null);
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
      setDetailMember(prev => prev ? { ...prev, role: 'agent' } : null);
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

  // ─── Si un membre est sélectionné : vue détail ───
  if (detailMember) {
    return (
      <MemberDetailView
        member={detailMember}
        agenceId={agenceId}
        agence={agence}
        currentUserId={userId}
        isManager={isManager}
        onBack={() => setDetailMember(null)}
        onPromote={() => handlePromote(detailMember)}
        onDemote={() => handleDemote(detailMember)}
        onRemove={() => handleRemoveMember(detailMember)}
      />
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

      {/* ═══ Bandeau infos agence (responsable) ═══ */}
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

      {/* ═══ Invitations en cours ═══ */}
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
              onClick={() => setDetailMember(member)}
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
   FICHE DÉTAIL MEMBRE — affichée quand on clique sur un membre
   ════════════════════════════════════════════════════════════════════════ */

function MemberDetailView({ member, agenceId, agence, currentUserId, isManager, onBack, onPromote, onDemote, onRemove }: {
  member: AgenceMember;
  agenceId: string;
  agence: AgenceInfo;
  currentUserId: string;
  isManager: boolean;
  onBack: () => void;
  onPromote: () => void;
  onDemote: () => void;
  onRemove: () => void;
}) {
  const [stats, setStats] = useState<MemberDetailStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const isMe = member.user_id === currentUserId;
  const canManage = isManager && !isMe;
  // 👑 Le responsable principal ne peut PAS se faire rétrograder par lui-même
  const isLastResponsable = member.role === 'responsable' && currentUserId === member.user_id;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingStats(true);
      try {
        // Analyses du membre
        const { data: analyses } = await supabase
          .from('analyses')
          .select('id, title, type, created_at, status, result')
          .eq('agence_id', agenceId)
          .eq('created_by_user_id', member.user_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(50);

        // Dossiers du membre
        const { count: foldersCount } = await supabase
          .from('pro_folders')
          .select('id', { count: 'exact', head: true })
          .eq('agence_id', agenceId)
          .eq('user_id', member.user_id);

        // Rapports envoyés
        const { count: reportsSent } = await supabase
          .from('envois_rapports')
          .select('id', { count: 'exact', head: true })
          .eq('agence_id', agenceId)
          .eq('sent_by', member.user_id);

        const list = analyses || [];
        const completes = list.filter(a => a.type === 'complete').length;
        const simples = list.filter(a => a.type === 'simple' || a.type === 'document').length;

        // Activité par semaine (8 dernières)
        const now = new Date();
        const weeks: Array<{ week: string; start: Date; end: Date }> = [];
        for (let i = 7; i >= 0; i--) {
          const end = new Date(now);
          end.setDate(end.getDate() - i * 7);
          const start = new Date(end);
          start.setDate(start.getDate() - 6);
          weeks.push({
            week: `S${52 - i}`,
            start,
            end,
          });
        }
        const activity = weeks.map(w => {
          const count = list.filter(a => {
            const d = new Date(a.created_at);
            return d >= w.start && d <= w.end;
          }).length;
          return { week: w.week, count };
        });

        const recent = list.slice(0, 10).map(a => {
          let score: number | undefined = undefined;
          try {
            if (a.result) {
              const r = typeof a.result === 'string' ? JSON.parse(a.result) : a.result;
              score = typeof r?.score === 'number' ? r.score : undefined;
            }
          } catch { /* ignore */ }
          return {
            id: a.id,
            title: a.title || 'Analyse sans titre',
            type: a.type,
            created_at: a.created_at,
            status: a.status,
            score,
          };
        });

        if (mounted) {
          setStats({
            analyses_count: list.length,
            analyses_completes: completes,
            analyses_simples: simples,
            folders_count: foldersCount || 0,
            reports_sent: reportsSent || 0,
            recent_analyses: recent,
            activity_by_week: activity,
          });
        }
      } catch (e) {
        console.error('Erreur loadStats:', e);
      }
      if (mounted) setLoadingStats(false);
    })();
    return () => { mounted = false; };
  }, [member.user_id, agenceId]);

  const initials = member.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = member.role === 'responsable' ? 'Responsable'
    : member.role === 'co_responsable' ? 'Co-responsable'
    : 'Agent';
  const roleIcon = member.role === 'responsable' ? '👑'
    : member.role === 'co_responsable' ? '🤝'
    : '👤';

  const maxCount = stats ? Math.max(1, ...stats.activity_by_week.map(w => w.count)) : 1;

  return (
    <div style={{ padding: '24px 28px 60px', maxWidth: 1080, margin: '0 auto' }}>
      {/* ═══ Bouton retour ═══ */}
      <button onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 13.5, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Retour à mon équipe
      </button>

      {/* ═══ Header membre ═══ */}
      <div style={{ background: 'linear-gradient(135deg, #0e3a4a 0%, #134454 50%, #1a526a 100%)', borderRadius: 18, padding: '24px 26px', marginBottom: 22, color: '#fff', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' as const }}>
        <div style={{ width: 64, height: 64, borderRadius: 14, background: member.color_hex, color: '#fff', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)' }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>{member.full_name}</h1>
            {isMe && (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7dd3fc', background: 'rgba(125,211,252,0.15)', border: '1px solid rgba(125,211,252,0.3)', padding: '3px 8px', borderRadius: 5 }}>
                VOUS
              </span>
            )}
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 6 }}>
              {roleIcon} {roleLabel}
            </span>
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', margin: 0 }}>{member.email}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '4px 0 0' }}>
            Membre de l'agence {agence.raison_sociale} depuis {fmtDate(member.joined_at)}
            {member.last_active_at && ` · Dernière activité ${fmtDate(member.last_active_at)}`}
          </p>
        </div>
      </div>

      {/* ═══ KPIs ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 22 }}>
        <KpiCard
          icon={<FileText size={18} />}
          label="Analyses créées"
          value={loadingStats ? '...' : (stats?.analyses_count || 0).toString()}
          color="#2a7d9c"
          bg="#f0f7fb"
        />
        <KpiCard
          icon={<Award size={18} />}
          label="dont complètes"
          value={loadingStats ? '...' : (stats?.analyses_completes || 0).toString()}
          color="#7c3aed"
          bg="#f5f3ff"
        />
        <KpiCard
          icon={<Folder size={18} />}
          label="Dossiers créés"
          value={loadingStats ? '...' : (stats?.folders_count || 0).toString()}
          color="#a16207"
          bg="#fef3c7"
        />
        <KpiCard
          icon={<Send size={18} />}
          label="Rapports envoyés"
          value={loadingStats ? '...' : (stats?.reports_sent || 0).toString()}
          color="#16a34a"
          bg="#f0fdf4"
        />
      </div>

      {/* ═══ Graphique activité ═══ */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={16} color="#475569" />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: 0 }}>
            Activité des 8 dernières semaines
          </h3>
        </div>
        {loadingStats ? (
          <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
            Chargement…
          </div>
        ) : stats && stats.analyses_count === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>
            Aucune analyse créée pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
            {stats?.activity_by_week.map((w, i) => {
              const heightPct = (w.count / maxCount) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 5 }}>
                  <div style={{ position: 'relative' as const, width: '100%', height: 80, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      minHeight: w.count > 0 ? 4 : 0,
                      background: w.count > 0 ? 'linear-gradient(180deg, #2a7d9c, #0e3a4a)' : '#f1f5f9',
                      borderRadius: '6px 6px 0 0',
                      transition: 'all 0.3s',
                    }} title={`${w.count} analyse${w.count > 1 ? 's' : ''}`} />
                    {w.count > 0 && (
                      <div style={{ position: 'absolute' as const, top: -16, left: 0, right: 0, textAlign: 'center' as const, fontSize: 10.5, fontWeight: 700, color: '#2a7d9c' }}>
                        {w.count}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{w.week}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Liste des analyses récentes ═══ */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' as const, marginBottom: 22 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: 0 }}>
            📋 Analyses récentes {stats && stats.recent_analyses.length > 0 ? `(${stats.recent_analyses.length})` : ''}
          </h3>
        </div>
        {loadingStats ? (
          <div style={{ padding: '24px 20px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>
            Chargement…
          </div>
        ) : !stats || stats.recent_analyses.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>
            Aucune analyse pour le moment.
          </div>
        ) : (
          <div>
            {stats.recent_analyses.map((a, i) => (
              <a key={a.id} href={`/rapport?id=${a.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < stats.recent_analyses.length - 1 ? '1px solid #f1f5f9' : 'none', textDecoration: 'none' as const, color: 'inherit', transition: 'background 0.12s' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#fafbfc'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: a.type === 'complete' ? '#f5f3ff' : '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={14} color={a.type === 'complete' ? '#7c3aed' : '#2a7d9c'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                    {a.type === 'complete' ? 'Analyse complète' : 'Analyse simple'} · {fmtDate(a.created_at)}
                  </div>
                </div>
                {typeof a.score === 'number' && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: a.score >= 14 ? '#16a34a' : a.score >= 10 ? '#ca8a04' : '#dc2626', flexShrink: 0 }}>
                    {a.score}/20
                  </div>
                )}
                <ChevronRight size={14} color="#cbd5e1" style={{ flexShrink: 0 }} />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Actions admin (responsable uniquement, pas sur soi-même) ═══ */}
      {canManage && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 12px' }}>
            Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {member.role === 'agent' && (
              <button onClick={onPromote}
                style={{ padding: '13px 16px', borderRadius: 11, background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: '#0f172a', textAlign: 'left' as const }}>
                <Crown size={18} color="#a16207" />
                <div>
                  <div>Promouvoir en co-responsable</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400, marginTop: 2 }}>Pourra inviter/retirer et gérer la facturation</div>
                </div>
              </button>
            )}
            {member.role === 'co_responsable' && !isLastResponsable && (
              <button onClick={onDemote}
                style={{ padding: '13px 16px', borderRadius: 11, background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: '#0f172a', textAlign: 'left' as const }}>
                <User size={18} color="#64748b" />
                <div>
                  <div>Rétrograder en agent</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400, marginTop: 2 }}>Perdra les droits de gestion</div>
                </div>
              </button>
            )}
            <button onClick={onRemove}
              style={{ padding: '13px 16px', borderRadius: 11, background: '#fff', border: '1.5px solid #fecaca', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: '#dc2626', textAlign: 'left' as const }}>
              <Trash2 size={18} />
              <div>
                <div>Retirer de l'agence</div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400, marginTop: 2 }}>Ses dossiers restent dans l'agence avec "ancien membre"</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
   ════════════════════════════════════════════════════════════════════════ */

function KpiCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        {icon}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 5, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function MemberCard({ member, isMe, onClick }: {
  member: AgenceMember; isMe: boolean; onClick: () => void;
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
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = '#2a7d9c'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(42,125,156,0.08)'; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = isMe ? '#2a7d9c' : '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 11,
        background: member.color_hex,
        color: '#fff', fontSize: 15, fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {initials}
      </div>

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
          {member.analyses_count || 0} analyse{(member.analyses_count || 0) > 1 ? 's' : ''} · depuis {fmtDate(member.joined_at)}
        </p>
      </div>

      <div style={{
        padding: '6px 12px', borderRadius: 8,
        background: roleBg, color: roleColor,
        fontSize: 11.5, fontWeight: 700,
        flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        {roleLabel}
      </div>

      <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
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

/* ──────────────────────────────────────────────────────────── */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
