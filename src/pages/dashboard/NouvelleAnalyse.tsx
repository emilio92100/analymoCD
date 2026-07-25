import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ShieldCheck, Upload, CheckCircle, AlertTriangle, ChevronLeft, Sparkles, ArrowRight, Lock, Download, Home, Building2, HelpCircle, RefreshCw, Search } from 'lucide-react';
import { lancerAnalyseEdge, type AnalyseProgress } from '../../lib/analyse-client';
import DocumentRenderer from './DocumentRenderer';
import { createAnalyse, markAnalyseFailed, type TypeBien } from '../../lib/analyses';
import { supabase } from '../../lib/supabase';
import { useCredits, type Credits } from '../../hooks/useCredits';

// ─── Constantes ───────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPE = 'application/pdf';

type FileError = { name: string; reason: string };

type AnalyseResult = {
  titre: string;
  score?: number;
  recommandation?: string;
  resume: string;
  points_forts: string[];
  points_vigilance: string[];
  risques_financiers?: string;
  conclusion: string;
};

// ─── Validation fichier ───────────────────────────────────────
function validateFile(file: File): string | null {
  if (file.type !== ACCEPTED_TYPE) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'doc' || ext === 'docx') return 'Format Word non supporté. Convertissez votre document en PDF avant de l\'uploader.';
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return 'Les images ne sont pas supportées. Si votre document est une photo, convertissez-la en PDF.';
    return `Format "${ext?.toUpperCase() || 'inconnu'}" non supporté. Seuls les fichiers PDF sont acceptés.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). La limite est de ${MAX_FILE_SIZE_MB} Mo. Essayez de compresser votre PDF.`;
  }
  return null;
}

// ─── Détection PDF protégé (heuristique rapide) ───────────────
async function isPdfPasswordProtected(file: File): Promise<boolean> {
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf).slice(0, 2048);
    const str = new TextDecoder('latin1').decode(bytes);
    return str.includes('/Encrypt');
  } catch {
    return false;
  }
}

// ─── Bouton PDF avec popup "en cours de développement" ───────
function PdfButtonInline() {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button onClick={() => setShowModal(true)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Download size={13} /> PDF
      </button>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: '#fff', borderRadius: 22, padding: '36px 32px 28px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(15,45,61,0.25)', animation: 'fadeUp 0.25s ease both' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>×</button>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Download size={28} style={{ color: '#2a7d9c' }} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Export PDF bientôt disponible</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
              Nous travaillons activement sur cette fonctionnalité pour vous permettre de télécharger vos rapports au format PDF.
            </p>
            <div style={{ padding: '12px 16px', borderRadius: 12, background: '#f0f9ff', border: '1px solid #e0f2fe', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', animation: 'vr-pulse 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c' }}>En cours de développement</span>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,45,61,0.18)' }}>
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function NouvelleAnalyse() {
  const { credits, deductCredit } = useCredits();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'choice' | 'folder_select' | 'type_bien' | 'profil' | 'upload' | 'analyse' | 'result'>('choice');
  const [type, setType] = useState<'document' | 'complete' | null>(null);
  const [typeBienDeclare, setTypeBienDeclare] = useState<TypeBien | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const [progress, setProgress] = useState(0);

  const [_fileWarnings, setFileWarnings] = useState<string[]>([]);
  const [_progressMsg, setProgressMsg] = useState('');
  const [_progressDoc, setProgressDoc] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<AnalyseResult | null>(null);
  const [error, setError] = useState('');
  const [analyseError, setAnalyseError] = useState<{ message: string; creditType?: string } | null>(null);
  const [queuedDialog, setQueuedDialog] = useState<{ message: string } | null>(null); // 🆕 v9 — popup queue surcharge Anthropic
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [profil, setProfil] = useState<'rp' | 'invest' | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ─── Détection rôle utilisateur (pro / particulier) ────────
  const [userRole, setUserRole] = useState<'pro' | 'particulier' | null>(null);
  const [proCredits, setProCredits] = useState<{ complete: number; document: number } | null>(null);

  // ─── Dossier sélectionné (pros uniquement) ────────────────
  type FolderLite = { id: string; name: string; property_address?: string | null; property_city?: string | null };
  const [selectedFolder, setSelectedFolder] = useState<FolderLite | null>(null);
  const [proFolders, setProFolders] = useState<FolderLite[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [showCreateFolderInline, setShowCreateFolderInline] = useState(false);

  // ─── Animation d'entrée pour chaque étape (fondu + slide doux) ───
  // Utilisé pour fluidifier les transitions avant/retour entre les étapes du flow.
  const stepAnim = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setUserRole('particulier');
        }
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role === 'pro' ? 'pro' : 'particulier';
      if (cancelled) return;

      setUserRole(role);

      if (role === 'pro') {
        // Charger les crédits pro (abo + unitaires) via la fonction PG
        try {
          const { data: balance } = await supabase.rpc('get_pro_credits_balance', { p_user_id: user.id });
          if (cancelled) return;
          if (balance && Array.isArray(balance) && balance.length > 0) {
            const b = balance[0];
            setProCredits({
              complete: b.total_complete || 0,
              document: b.total_document || 0,
            });
          } else {
            setProCredits({ complete: 0, document: 0 });
          }
        } catch (e) {
          console.error('Erreur chargement crédits pro:', e);
          setProCredits({ complete: 0, document: 0 });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Chargement des dossiers du pro + lecture URL ?folder=… ───
  useEffect(() => {
    if (userRole !== 'pro') return;
    let cancelled = false;
    (async () => {
      setFoldersLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: folders } = await supabase
          .from('pro_folders')
          .select('id, name, property_address, property_city')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        if (cancelled) return;
        setProFolders(folders || []);

        // Si l'URL contient ?folder=ID, on pré-sélectionne ce dossier
        const folderIdFromUrl = searchParams.get('folder');
        if (folderIdFromUrl && folders) {
          const found = folders.find(f => f.id === folderIdFromUrl);
          if (found) setSelectedFolder(found);
        }
      } catch (e) {
        console.error('Erreur chargement dossiers:', e);
      }
      if (!cancelled) setFoldersLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userRole, searchParams]);

  // ─── UX messages rotatifs pendant l'analyse ────────────────
  const [rotatingMsgIdx, setRotatingMsgIdx] = useState(0);
  const [analyseStartTime, setAnalyseStartTime] = useState<number | null>(null);

  const plans = {
    document: { label: "Analyse d'un document", price: '4,90€', max: 1, desc: "Un seul fichier PDF — PV d'AG, règlement, diagnostic, appel de charges.", creditsKey: 'document' as keyof Credits },
    complete: { label: "Analyse complète d'un logement", price: '19,90€', max: 15, desc: 'Tous les documents du bien — score /20, risques, recommandation Verimo.', creditsKey: 'complete' as keyof Credits },
  };
  const plan = type ? plans[type] : null;

  const resetUpload = () => { setFiles([]); setError(''); setFileWarnings([]); };

  // ─── Ajout de fichiers avec validation ────────────────────
  const handleFiles = async (incoming: File[]) => {
    setError('');
    const isSimple = type === 'document';

    // Analyse simple : 1 seul fichier max
    if (isSimple && incoming.length > 1) {
      setError("L'analyse simple accepte un seul fichier PDF. Sélectionnez uniquement le document à analyser, ou passez à l'analyse complète pour plusieurs fichiers.");
      return;
    }
    if (isSimple && files.length >= 1) {
      setError("L'analyse simple n'accepte qu'un seul fichier. Supprimez le fichier actuel pour en ajouter un autre.");
      return;
    }

    const blocked: FileError[] = [];
    const valid: File[] = [];

    for (const file of incoming) {
      const err = validateFile(file);
      if (err) { blocked.push({ name: file.name, reason: err }); continue; }
      const protected_ = await isPdfPasswordProtected(file);
      if (protected_) { blocked.push({ name: file.name, reason: 'Ce PDF est protégé par un mot de passe. Retirez la protection depuis Adobe Reader ou votre logiciel PDF, puis réessayez.' }); continue; }
      valid.push(file);
    }

    if (blocked.length > 0) {
      setError(blocked.map(b => `"${b.name}" : ${b.reason}`).join('\n\n'));
    }
    if (valid.length > 0) {
      const limit = plan?.max || 1;
      const combined = [...files, ...valid];
      setFiles(combined.slice(0, limit));
      if (combined.length > limit) {
        const ignored = combined.length - limit;
        const msgLimite = `Limite de ${limit} documents atteinte pour cette analyse. ${ignored} fichier${ignored > 1 ? 's' : ''} en trop n'${ignored > 1 ? 'ont' : 'a'} pas été ajouté${ignored > 1 ? 's' : ''}.`;
        setError(prev => prev ? `${prev}\n\n${msgLimite}` : msgLimite);
      }
    }
  };

  // ─── Extraction texte avec warning si vide ────────────────
  // ─── Remboursement crédit ─────────────────────────────────
  const refundCredit = async (creditType: 'document' | 'complete') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (userRole === 'pro') {
        // Pro : on re-crédite via la fonction PG
        const { error: refundErr } = await supabase.rpc('refund_pro_credit', { p_user_id: user.id, p_credit_type: creditType });
        if (refundErr) console.warn('[Verimo] refund_pro_credit erreur:', refundErr.message);
      } else {
        const col = creditType === 'document' ? 'credits_document' : 'credits_complete';
        const { data } = await supabase.from('profiles').select(col).eq('id', user.id).single();
        if (data) {
          const current = (data as Record<string, number>)[col] || 0;
          await supabase.from('profiles').update({ [col]: current + 1 }).eq('id', user.id);
        }
      }
    } catch { /* silencieux */ }
  };


  // ─── Popup modal d'erreur analyse ──────────────────────────
  const AnalyseErrorPopup = () => {
    if (!analyseError) return null;
    const creditLabel = analyseError.creditType === 'document' ? 'simple' : analyseError.creditType === 'complete' ? 'complète' : '';
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 460, width: '100%', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          {/* Bouton fermer */}
          <button onClick={() => setAnalyseError(null)}
            style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 18, fontWeight: 700 }}>
            ×
          </button>
          
          {/* Icône warning */}
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fff7ed', border: '2px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <AlertTriangle size={28} color="#d97706" />
          </div>
          
          {/* Titre */}
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 12 }}>
            Analyse interrompue
          </h3>
          
          {/* Message d'erreur */}
          <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
            {analyseError.message}
          </p>
          
          {/* Badge remboursement */}
          {creditLabel && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 20 }}>
              <span style={{ fontSize: 16 }}>✓</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>
                Votre crédit analyse {creditLabel} a été remboursé automatiquement
              </span>
            </div>
          )}
          
          {/* Bouton */}
          <button onClick={() => setAnalyseError(null)}
            style={{ width: '100%', padding: '14px 24px', borderRadius: 12, background: '#0f2d3d', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Compris
          </button>
        </div>
      </div>
    );
  };

  // ─── 🆕 v9 — Popup file d'attente (surcharge Anthropic) ──────────
  const QueuedDialogPopup = () => {
    if (!queuedDialog) return null;
    return (
      <div
        onClick={() => setQueuedDialog(null)}
        style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,45,61,0.55)', padding: 20, backdropFilter: 'blur(4px)' }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 480, width: '100%', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
        >
          <button onClick={() => setQueuedDialog(null)}
            style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 18, fontWeight: 700 }}>
            ×
          </button>

          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '2px solid #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 18px', fontSize: 32 }}>⏳</div>

          <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f2d3d', textAlign: 'center', marginBottom: 12 }}>
            Analyse en cours de traitement
          </h3>

          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, textAlign: 'center', marginBottom: 22 }}>
            {queuedDialog.message}
          </p>

          <div style={{ background: '#f0f7fb', border: '1px solid #d0e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, color: '#0f2d3d', lineHeight: 1.6 }}>
              📌 Vous pouvez consulter l'avancée à tout moment depuis votre espace
              <strong> {userRole === 'pro' ? '"Mes dossiers"' : '"Mes analyses"'}</strong>. Une notification apparaîtra dans la cloche 🔔{userRole === 'pro' ? '' : ' et un email vous sera envoyé'}
              dès que votre rapport sera prêt.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { 
                setQueuedDialog(null); 
                window.location.href = userRole === 'pro' ? '/dashboard/dossiers' : '/dashboard/analyses'; 
              }}
              style={{ flex: 1, padding: '12px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >{userRole === 'pro' ? 'Voir mes dossiers' : 'Voir mes analyses'}</button>
            <button
              onClick={() => setQueuedDialog(null)}
              style={{ padding: '12px 18px', borderRadius: 12, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >Fermer</button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Animation barre de progression ─────────────────────
  // Courbe logarithmique basée sur le temps écoulé et le nombre de docs.
  // Monte lentement et régulièrement, plafonne à 88% tant que le serveur n'a pas répondu.

  useEffect(() => {
    if (step !== 'analyse') {
      setAnimatedProgress(0);
      setRotatingMsgIdx(0);
      setAnalyseStartTime(null);
      return;
    }
    // Démarrer le chrono au début de l'analyse
    if (!analyseStartTime) setAnalyseStartTime(Date.now());

    const docsTotal = files.length;
    // Durée estimée en secondes selon le nombre de docs
    // 1 doc = ~90s, 3 docs = ~150s, 8 docs = ~300s, 15 docs = ~600s
    const estimatedDuration = docsTotal <= 1 ? 90
      : docsTotal <= 3 ? 150
      : docsTotal <= 5 ? 210
      : docsTotal <= 8 ? 300
      : docsTotal <= 12 ? 450
      : 600;

    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      setAnimatedProgress(prev => {
        const target = progress;
        // Si le serveur envoie un vrai progress (ex: 100%), rattraper rapidement
        if (target >= 99) return Math.min(prev + 2, 100);
        if (prev < target - 1) return Math.min(prev + 0.5, target);

        // Progression simulée basée sur le temps écoulé
        const elapsed = analyseStartTime ? (Date.now() - analyseStartTime) / 1000 : 0;
        // Courbe logarithmique : monte vite au début puis ralentit naturellement
        // log(1 + elapsed/factor) normalisé pour atteindre ~88% à estimatedDuration
        const factor = estimatedDuration / 4;
        const logProgress = Math.log(1 + elapsed / factor) / Math.log(1 + estimatedDuration / factor) * 88;
        const targetSimulated = Math.min(logProgress, 88);

        // Ne jamais reculer, avancer doucement vers la cible simulée
        if (targetSimulated > prev) {
          return prev + Math.min(0.3, (targetSimulated - prev) * 0.05);
        }
        return prev;
      });
    }, 200);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [step, progress, files.length, analyseStartTime]);

  // ─── Rotation des messages rassurants pendant l'analyse ────
  useEffect(() => {
    if (step !== 'analyse') return;
    const rotateInterval = setInterval(() => {
      setRotatingMsgIdx(i => i + 1);
    }, 12000); // change de message toutes les 12 secondes
    return () => clearInterval(rotateInterval);
  }, [step]);

  // ─── Callback progression Edge Function ───────────────────
  const handleProgress = (p: AnalyseProgress) => {
    setProgress(p.percent);
    setProgressMsg(p.message);
    if (p.total > 1) setProgressDoc({ current: p.current, total: p.total });
  };

  // ─── Lancer analyse payante ───────────────────────────────
  const lancer = async () => {
    if (!files.length || !type) return;
    if (isAnalysing) return;
    setIsAnalysing(true);
    const creditType = type === 'document' ? 'document' : 'complete';

    // Déduction crédit selon le rôle
    let ok = false;
    if (userRole === 'pro') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc('consume_pro_credit', { p_user_id: user.id, p_credit_type: creditType });
        ok = data === true;
        if (ok) window.dispatchEvent(new Event('verimo:credits-changed'));
      }
    } else {
      ok = await deductCredit(creditType);
    }
    if (!ok) { setError("Vous n'avez plus de crédit disponible. Veuillez recharger votre compte."); setIsAnalysing(false); return; }
    setStep('analyse'); setError(''); setFileWarnings([]); setProgress(5);
    setProgressMsg('Préparation des documents…'); setProgressDoc({ current: 0, total: files.length });
    const docNames = files.map(f => f.name);
    const analyseDB = await createAnalyse(type, files[0].name, profil || 'rp', docNames, typeBienDeclare, selectedFolder?.id || null);
    const analyseId = analyseDB?.id || null;
    if (!analyseId) {
      await refundCredit(creditType);
      window.dispatchEvent(new Event('verimo:credits-changed'));
      setAnalyseError({ message: "Impossible de créer l'analyse. Votre crédit a été remboursé automatiquement.", creditType });
      setStep('upload'); resetUpload(); setIsAnalysing(false); return;
    }
    const result = await lancerAnalyseEdge({ files, mode: type, analyseId, profil: profil || 'rp', typeBienDeclare, onProgress: handleProgress, isPro: userRole === 'pro' });
    if (!isMountedRef.current) return; // User navigated away — don't redirect, the dashboard polling will pick it up

    // 🆕 v9 — Mise en queue suite à surcharge Anthropic.
    // PAS de remboursement, PAS de markFailed : l'analyse va être retentée
    // automatiquement par le cron analyser-retry toutes les 5 min pendant 1h.
    if (result.queued) {
      setQueuedDialog({ message: result.queuedMessage || '⏳ Votre analyse est en cours de traitement.' });
      setIsAnalysing(false);
      setStep('upload'); // 🔧 fix : sortir de la page de progression pour que le popup soit rendu
      resetUpload();
      return;
    }

    if (!result.success) {
      // 🔒 Remboursement IDEMPOTENT : analyser-run et le watchdog remboursent déjà via la même
      // fonction verrouillée. On l'appelle ici aussi → si c'est déjà fait, aucun effet (fini le double +1).
      await markAnalyseFailed(analyseId);
      await supabase.rpc('refund_analyse_credit', { p_analyse_id: analyseId });
      window.dispatchEvent(new Event('verimo:credits-changed'));
      if (!isMountedRef.current) return;
      setStep('upload'); resetUpload();
      setAnalyseError({ message: result.errorMessage || "Une erreur est survenue. Votre crédit a été remboursé automatiquement.", creditType });
      setIsAnalysing(false);
      console.error('[Verimo] Erreur analyse:', result.errorMessage);
      return;
    }
    if (!isMountedRef.current) return; // User navigated away
    setProgress(100); setProgressMsg('Rapport prêt !');
    await new Promise(r => setTimeout(r, 1500)); // laisser la barre atteindre 100%
    if (!isMountedRef.current) return; // User navigated away during the 1.5s wait
    window.location.href = `/rapport?id=${analyseId}`;
  };

  /* ── CHOICE */
  if (step === 'choice') {
    const isPro = userRole === 'pro';
    const isParticulier = userRole === 'particulier';
    const isLoadingRole = userRole === null; // tant qu'on ne sait pas, on affiche un état neutre
    const proHasCompleteCredits = isPro && (proCredits?.complete || 0) > 0;
    const proHasDocumentCredits = isPro && (proCredits?.document || 0) > 0;
    const showParticulierPrices = isParticulier;

    return (
    <motion.div key="step-choice" {...stepAnim} style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Link to="/dashboard" style={{ fontSize: 14, color: '#2a7d9c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, fontWeight: 700, padding: '8px 16px', borderRadius: 10, background: '#f0f7fb', border: '1px solid #d0e8f0', transition: 'all 0.15s' }}><ChevronLeft size={15} /> Retour</Link>
      <h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 6 }}>Que souhaitez-vous analyser ?</h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>Choisissez le mode d'analyse adapté à votre besoin.</p>
      {isPro && proCredits && (proCredits.complete === 0 && proCredits.document === 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 14, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', marginBottom: 28, border: '1px solid #fcd34d' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(146,64,14,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><AlertTriangle size={16} style={{ color: '#92400e' }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#92400e', marginBottom: 2 }}>Aucun crédit disponible</div>
            <div style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.5 }}>Souscrivez un abonnement ou achetez à l'unité pour démarrer une analyse.</div>
          </div>
          <Link to="/dashboard/abonnement" style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: '#92400e', padding: '8px 14px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>Voir les offres</Link>
        </div>
      )}
      <div className="type-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <button onClick={() => {
            if (isLoadingRole) return; // attendre que le rôle soit chargé
            if (isPro) {
              if (!proHasDocumentCredits) { window.location.href = '/dashboard/abonnement'; return; }
              setType('document');
              // Pro : on passe par l'étape choix dossier sauf si déjà pré-sélectionné via URL
              setStep(selectedFolder ? 'type_bien' : 'folder_select');
              return;
            }
            if (credits.document === 0) { window.location.href = '/dashboard/tarifs'; return; }
            setType('document'); setStep('type_bien');
          }}
          style={{ padding: '28px 24px', borderRadius: 20, border: '1.5px solid #edf2f7', background: '#fff', cursor: isLoadingRole ? 'wait' : 'pointer', textAlign: 'left', transition: 'all 0.18s', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: isLoadingRole ? 0.6 : 1 }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.boxShadow = '0 8px 28px rgba(42,125,156,0.1)'; el.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)'; }}>
          {isPro ? (
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 8, background: proHasDocumentCredits ? '#f0fdf4' : '#fef2f2', color: proHasDocumentCredits ? '#16a34a' : '#dc2626', border: `1.5px solid ${proHasDocumentCredits ? '#86efac' : '#fca5a5'}` }}>
                {(proCredits?.document || 0) > 0 ? `${proCredits?.document} crédit${(proCredits?.document || 0) > 1 ? 's' : ''} restant${(proCredits?.document || 0) > 1 ? 's' : ''}` : '0 crédit'}
              </div>
              {!proHasDocumentCredits && (
                <Link to="/dashboard/abonnement" onClick={e => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textDecoration: 'underline', padding: '2px 4px' }}>
                  Acheter des crédits →
                </Link>
              )}
            </div>
          ) : showParticulierPrices && (
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 8, background: credits.document > 0 ? '#f0fdf4' : '#fef2f2', color: credits.document > 0 ? '#16a34a' : '#dc2626', border: `1.5px solid ${credits.document > 0 ? '#86efac' : '#fca5a5'}` }}>
                {credits.document > 0 ? `${credits.document} crédit${credits.document > 1 ? 's' : ''} restant${credits.document > 1 ? 's' : ''}` : '0 crédit'}
              </div>
              {credits.document === 0 && (
                <Link to="/dashboard/tarifs" onClick={e => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textDecoration: 'underline', padding: '2px 4px' }}>
                  Acheter des crédits →
                </Link>
              )}
            </div>
          )}
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: (isPro || showParticulierPrices) ? 22 : 0 }}><FileText size={24} style={{ color: '#2a7d9c' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Analyse d&apos;un seul document</div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>Retenez l&apos;essentiel d&apos;un document précis :<br /><span style={{ color: '#94a3b8' }}>Règlement de copro, PV d&apos;AG, diagnostic, DPE, appel de charges…</span><br /><span style={{ fontSize: 11, color: '#cbd5e1' }}>1 fichier PDF uniquement</span></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c', display: 'flex', alignItems: 'center', gap: 5 }}>
              {isLoadingRole ? null
                : isPro
                ? (proHasDocumentCredits ? <><ArrowRight size={14} /> Lancer l&apos;analyse</> : <><Lock size={13} /> Souscrire un abonnement</>)
                : (credits.document === 0 ? <><Lock size={13} /> Acheter un crédit</> : <><ArrowRight size={14} /> Commencer</>)
              }
            </span>
            {showParticulierPrices && <span style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>4,90€</span>}
          </div>
        </button>
        <button onClick={() => {
            if (isLoadingRole) return;
            if (isPro) {
              if (!proHasCompleteCredits) { window.location.href = '/dashboard/abonnement'; return; }
              setType('complete');
              setStep(selectedFolder ? 'type_bien' : 'folder_select');
              return;
            }
            if (credits.complete === 0) { window.location.href = '/dashboard/tarifs'; return; }
            setType('complete'); setStep('type_bien');
          }}
          style={{ padding: '28px 24px', borderRadius: 20, border: '1.5px solid transparent', background: 'linear-gradient(145deg, #0f2d3d, #1a5068)', cursor: isLoadingRole ? 'wait' : 'pointer', textAlign: 'left', transition: 'all 0.18s', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15,45,61,0.15)', opacity: isLoadingRole ? 0.6 : 1 }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 12px 40px rgba(15,45,61,0.28)'; el.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 4px 20px rgba(15,45,61,0.15)'; el.style.transform = 'translateY(0)'; }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(42,125,156,0.2)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 14, left: 14, fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 100 }}>★ RECOMMANDÉ</div>
          {isPro ? (
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 8, background: proHasCompleteCredits ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.18)', color: proHasCompleteCredits ? '#86efac' : '#fca5a5', border: `1.5px solid ${proHasCompleteCredits ? 'rgba(134,239,172,0.4)' : 'rgba(252,165,165,0.4)'}` }}>
                {(proCredits?.complete || 0) > 0 ? `${proCredits?.complete} crédit${(proCredits?.complete || 0) > 1 ? 's' : ''} restant${(proCredits?.complete || 0) > 1 ? 's' : ''}` : '0 crédit'}
              </div>
              {!proHasCompleteCredits && (
                <Link to="/dashboard/abonnement" onClick={e => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', textDecoration: 'underline', padding: '2px 4px' }}>
                  Acheter des crédits →
                </Link>
              )}
            </div>
          ) : showParticulierPrices && (
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 8, background: credits.complete > 0 ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.18)', color: credits.complete > 0 ? '#86efac' : '#fca5a5', border: `1.5px solid ${credits.complete > 0 ? 'rgba(134,239,172,0.4)' : 'rgba(252,165,165,0.4)'}` }}>
                {credits.complete > 0 ? `${credits.complete} crédit${credits.complete > 1 ? 's' : ''} restant${credits.complete > 1 ? 's' : ''}` : '0 crédit'}
              </div>
              {credits.complete === 0 && (
                <Link to="/dashboard/tarifs" onClick={e => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', textDecoration: 'underline', padding: '2px 4px' }}>
                  Acheter des crédits →
                </Link>
              )}
            </div>
          )}
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: (isPro || showParticulierPrices) ? 32 : 10 }}><ShieldCheck size={24} style={{ color: '#fff' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Analyse complète d&apos;un logement</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 20 }}>Déposez tous vos documents d&apos;un seul coup :<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>PV AG 2022/2023/2024, règlement copro, DPE, diagnostic électricité, amiante…</span><br /><span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Rapport détaillé avec score /20 et recommandation.</span></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {isLoadingRole ? null
                : isPro
                ? (proHasCompleteCredits ? <>Lancer l&apos;analyse <ArrowRight size={14} /></> : <>Souscrire un abonnement <ArrowRight size={14} /></>)
                : (credits.complete === 0 ? <>Acheter un crédit <ArrowRight size={14} /></> : <>Commencer l&apos;audit <ArrowRight size={14} /></>)
              }
            </span>
            {showParticulierPrices && <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>19,90€</span>}
          </div>
        </button>
      </div>
    </motion.div>
    );
  }


  /* ── CHOIX DOSSIER (pros uniquement) */
  if (step === 'folder_select' && type) return (
    <motion.div key="step-folder-select" {...stepAnim}>
      <FolderSelectStep
        folders={proFolders}
        loading={foldersLoading}
        type={type}
        onBack={() => { setStep('choice'); setSelectedFolder(null); }}
        onSelect={(folder) => { setSelectedFolder(folder); setStep('type_bien'); }}
        onCreate={() => setShowCreateFolderInline(true)}
        showCreateModal={showCreateFolderInline}
        onCreateClose={() => setShowCreateFolderInline(false)}
        onCreated={(folder) => {
          // Le dossier vient d'être créé : on l'ajoute à la liste, on le sélectionne, on passe à l'étape suivante
          setProFolders(prev => [folder, ...prev]);
          setSelectedFolder(folder);
          setShowCreateFolderInline(false);
          setStep('type_bien');
        }}
      />
    </motion.div>
  );


  /* ── TYPE DE BIEN (nouvelle étape — session 4) */
  if (step === 'type_bien' && type) return (
    <motion.div key="step-type-bien" {...stepAnim} style={{ maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={() => {
          // Pro : retour vers folder_select. Particulier : retour vers choice.
          if (userRole === 'pro') { setStep('folder_select'); }
          else { setStep('choice'); }
          setTypeBienDeclare(null);
        }} style={{ fontSize: 13, color: '#2a7d9c', background: '#f0f7fb', border: '1px solid #d0e8f0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, fontWeight: 700, padding: '8px 14px', borderRadius: 10, transition: 'all 0.15s' }} onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#e0f0f7'; (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; }} onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#f0f7fb'; (e.currentTarget as HTMLElement).style.borderColor = '#d0e8f0'; }}><ChevronLeft size={14} /> Retour</button>

      {/* Bandeau dossier sélectionné (pros uniquement) */}
      {userRole === 'pro' && selectedFolder && <FolderBanner folder={selectedFolder} analysisType={type === 'complete' ? 'complete' : 'simple'} onChange={() => setStep('folder_select')} />}

      <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 8 }}>Quel type de bien analysez-vous ?</h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>Verimo adapte son analyse aux spécificités de votre bien — une copropriété et une maison n'ont pas les mêmes risques.</p>

      {/* 2 cartes principales côte à côte */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 14 }}>
        <button onClick={() => { setTypeBienDeclare('appartement'); setStep('profil'); }}
          style={{ padding: '28px 24px', borderRadius: 18, border: '2px solid #edf2f7', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.boxShadow = '0 8px 28px rgba(42,125,156,0.1)'; el.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)'; }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Building2 size={24} style={{ color: '#2a7d9c' }} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Appartement</div>
          <div style={{ fontSize: 12, color: '#2a7d9c', fontWeight: 600, marginBottom: 10 }}>en copropriété</div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>PV d'AG, syndic, charges, travaux votés, état daté, fonds travaux…</div>
          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: '#2a7d9c', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ArrowRight size={14} /> Choisir
          </div>
        </button>

        <button onClick={() => { setTypeBienDeclare('maison'); setStep('profil'); }}
          style={{ padding: '28px 24px', borderRadius: 18, border: '2px solid #edf2f7', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#16a34a'; el.style.boxShadow = '0 8px 28px rgba(22,163,74,0.1)'; el.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)'; }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Home size={24} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Maison individuelle</div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 10 }}>hors copropriété</div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>DDT, diagnostics, taxe foncière, audit énergétique, compromis…</div>
          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ArrowRight size={14} /> Choisir
          </div>
        </button>
      </div>

      {/* 2 options secondaires */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => { setTypeBienDeclare('maison_copro'); setStep('profil'); }}
          style={{ padding: '16px 20px', borderRadius: 14, border: '1.5px solid #edf2f7', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 14 }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#d97706'; el.style.background = '#fffbeb'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.background = '#fff'; }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(217,119,6,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>🏘️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Maison en copropriété</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>Lotissement, ASL, règlement de copropriété horizontale</div>
          </div>
          <ArrowRight size={16} style={{ color: '#d97706', flexShrink: 0 }} />
        </button>

        <button onClick={() => { setTypeBienDeclare('indetermine'); setStep('profil'); }}
          style={{ padding: '16px 20px', borderRadius: 14, border: '1.5px solid #edf2f7', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 14 }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#7c3aed'; el.style.background = '#faf5ff'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.background = '#fff'; }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HelpCircle size={18} style={{ color: '#7c3aed' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Je ne suis pas sûr</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>Verimo déterminera le type d'après vos documents</div>
          </div>
          <ArrowRight size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
        </button>
      </div>

      <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 20, textAlign: 'center', lineHeight: 1.5 }}>
        Ce choix adapte la présentation du rapport et les règles d'analyse appliquées à votre bien.
      </p>
    </motion.div>
  );


  /* ── PROFIL */
  if (step === 'profil' && type) return (
    <motion.div key="step-profil" {...stepAnim} style={{ maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={() => { setStep('type_bien'); setProfil(null); }} style={{ fontSize: 13, color: '#2a7d9c', background: '#f0f7fb', border: '1px solid #d0e8f0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, fontWeight: 700, padding: '8px 14px', borderRadius: 10, transition: 'all 0.15s' }} onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#e0f0f7'; (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; }} onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#f0f7fb'; (e.currentTarget as HTMLElement).style.borderColor = '#d0e8f0'; }}><ChevronLeft size={14} /> Retour</button>

      {/* Bandeau dossier sélectionné (pros uniquement) */}
      {userRole === 'pro' && selectedFolder && <FolderBanner folder={selectedFolder} analysisType={type === 'complete' ? 'complete' : 'simple'} onChange={() => setStep('folder_select')} />}

      <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 8 }}>{userRole === 'pro' ? 'Quel est l\'objectif de ce bien ?' : 'Ce bien, c\'est pour vous ?'}</h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>{userRole === 'pro' ? 'L\'usage prévu influence la notation — notamment sur le DPE et les charges.' : 'Votre profil d\'achat influence la notation du bien — notamment sur le DPE et les charges.'}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button onClick={() => { setProfil('rp'); setStep('upload'); }}
          style={{ padding: '24px 28px', borderRadius: 18, border: '2px solid #edf2f7', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.boxShadow = '0 8px 28px rgba(42,125,156,0.1)'; el.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>🏠</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Résidence principale</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{userRole === 'pro' ? 'Pour un client vendeur ou un acheteur qui souhaite y habiter — confort, charges et DPE sont prioritaires.' : 'Vous allez y vivre — confort, charges et DPE comptent davantage.'}</div>
            </div>
            <ArrowRight size={18} style={{ color: '#2a7d9c', marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        </button>
        <button onClick={() => {}} disabled
          title="Cette option sera disponible prochainement"
          style={{ padding: '24px 28px', borderRadius: 18, border: '2px dashed #e2e8f0', background: '#f8fafc', cursor: 'not-allowed', textAlign: 'left', transition: 'all 0.18s', position: 'relative', opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24, filter: 'grayscale(1)' }}>📈</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#64748b' }}>Investissement locatif</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 100, letterSpacing: '0.04em' }}>EN COURS DE DÉVELOPPEMENT</span>
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>Rentabilité, contraintes locatives, fiscalité — disponible prochainement.</div>
            </div>
          </div>
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#64748b', marginTop: 20, textAlign: 'center' }}>Ce choix influence uniquement la notation — votre analyse reste complète dans tous les cas.</p>
    </motion.div>
  );

  /* ── UPLOAD */
  /* ── UPLOAD */
  if (step === 'upload' && plan) return (
    <motion.div key="step-upload" {...stepAnim} style={{ maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={() => { setStep('profil'); resetUpload(); }} style={{ fontSize: 13, color: '#2a7d9c', background: '#f0f7fb', border: '1px solid #d0e8f0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, fontWeight: 700, padding: '8px 14px', borderRadius: 10, transition: 'all 0.15s' }} onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#e0f0f7'; (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; }} onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#f0f7fb'; (e.currentTarget as HTMLElement).style.borderColor = '#d0e8f0'; }}><ChevronLeft size={14} /> Retour</button>

      {/* Bandeau dossier sélectionné (pros uniquement) */}
      {userRole === 'pro' && selectedFolder && <FolderBanner folder={selectedFolder} analysisType={type === 'complete' ? 'complete' : 'simple'} onChange={() => setStep('folder_select')} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '16px 18px', background: '#fff', borderRadius: 14, border: '1px solid #edf2f7' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {type === 'complete' ? <ShieldCheck size={19} style={{ color: '#2a7d9c' }} /> : <FileText size={19} style={{ color: '#2a7d9c' }} />}
        </div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{plan.label}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{plan.desc}</div></div>

      </div>

      {/* Erreur bloquante */}
      <AnalyseErrorPopup />
      <QueuedDialogPopup />

      {error && (
        <div style={{ padding: '14px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: error.includes('\n') ? 8 : 0 }}>
            <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 700 }}>Fichier non accepté</span>
          </div>
          {error.split('\n\n').map((msg, i) => (
            <p key={i} style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.6, margin: '6px 0 0 25px' }}>{msg}</p>
          ))}
        </div>
      )}

      {/* Zone de dépôt — label natif pour compatibilité mobile Safari */}
      <label htmlFor="file-input-mobile"
        style={{ display: 'block', padding: '36px 24px', borderRadius: 18, border: '2px dashed #dde6ec', background: '#fafcfe', textAlign: 'center', cursor: 'pointer', marginBottom: 14, transition: 'all 0.18s' }}
        onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; }}
        onDrop={e => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)); }}>
        <input id="file-input-mobile" type="file" multiple={plan.max > 1} accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)); }} />
        <div style={{ width: 54, height: 54, borderRadius: 15, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Upload size={24} style={{ color: '#2a7d9c' }} /></div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 5 }}>
          <span className="upload-desktop-text">Déposez vos documents ici</span>
          <span className="upload-mobile-text" style={{ display: 'none' }}>Appuyez pour sélectionner</span>
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          <span className="upload-desktop-text">ou <span style={{ color: '#2a7d9c', fontWeight: 700 }}>cliquez pour sélectionner</span></span>
          <span className="upload-mobile-text" style={{ display: 'none' }}>vos fichiers PDF</span>
        </div>
        <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8 }}>
          PDF uniquement · Max {MAX_FILE_SIZE_MB} Mo par fichier{plan.max > 1 ? ` · ${plan.max} fichiers max` : ' · 1 fichier'}
        </div>
      </label>

      {/* ⭐ BOUTON PRINCIPAL — Lancer l'analyse */}
      <button onClick={() => { lancer(); }} disabled={files.length === 0 || isAnalysing}
        style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: files.length > 0 ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#e2e8f0', color: files.length > 0 ? '#fff' : '#94a3b8', fontSize: 15, fontWeight: 800, cursor: files.length > 0 ? 'pointer' : 'default', boxShadow: files.length > 0 ? '0 4px 18px rgba(15,45,61,0.2)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s', marginBottom: 20 }}>
        <Sparkles size={16} /> Lancer l&apos;analyse {files.length > 0 ? `(${files.length} fichier${files.length > 1 ? 's' : ''})` : ''}
      </button>

      {/* Formats acceptés — déplacé après le bouton pour ne pas encombrer */}
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
        ✅ <strong>Formats acceptés :</strong> PDF natif ou scanné<br />
        ❌ <strong>Non supportés :</strong> Word (.doc/.docx) — convertissez-les en PDF d'abord<br />
        🔒 Les PDF protégés par mot de passe doivent être déverrouillés avant l'upload
      </div>

      {/* Fichiers sélectionnés — blocs en bas */}
      {files.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: '#2a7d9c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>{files.length}</div>
              Document{files.length > 1 ? 's' : ''} prêt{files.length > 1 ? 's' : ''}
            </div>
            {files.length > 1 && (
              <button onClick={() => setFiles([])} style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Tout retirer</button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: files.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {files.map((f, i) => (
              <div key={i} style={{ position: 'relative', padding: '16px', borderRadius: 14, background: '#fff', border: '1.5px solid #e0f2fe', boxShadow: '0 2px 10px rgba(42,125,156,0.06)', transition: 'all 0.15s', overflow: 'hidden' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#7dd3fc'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(42,125,156,0.12)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e0f2fe'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(42,125,156,0.06)'; }}>
                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: 13, fontWeight: 700, lineHeight: 1, padding: 0 }}>×</button>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <FileText size={20} color="#2a7d9c" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4, paddingRight: 20 }}>{f.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{(f.size / 1024 / 1024).toFixed(1)} Mo</span>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d1d5db' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '1px 6px', borderRadius: 4, border: '1px solid #bbf7d0' }}>PDF ✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  /* ── LOADING ── */
  if (step === 'analyse') {
    const pct = Math.round(animatedProgress);
    const docsTotal = files.length;
    const elapsedSec = analyseStartTime ? Math.floor((Date.now() - analyseStartTime) / 1000) : 0;

    // Estimation figée au démarrage — calculée une seule fois sur le nombre de
    // documents, elle ne bouge plus pendant toute l'analyse.
    // Le temps réel est affiché plus bas ("Temps écoulé").
    const tempsRestant = docsTotal <= 3 ? '2 min'
      : docsTotal <= 8 ? '4 min'
      : docsTotal <= 12 ? '7 min'
      : '10 à 15 min';

    // Label du nombre de documents, adapté au volume
    const docsLabel = docsTotal <= 5
      ? `${docsTotal} document${docsTotal > 1 ? 's' : ''} · Analyse ${type === 'complete' ? 'complète' : 'document'}`
      : docsTotal <= 10
      ? `${docsTotal} documents · Analyse complète en profondeur`
      : `${docsTotal} documents · Analyse volumineuse — on prend le temps de bien faire`;

    // Messages rotatifs pendant l'analyse
    // On choisit des messages adaptés au volume pour que ça sonne juste
    const baseMessages = [
      "Votre analyse avance en arrière-plan.",
      "Chaque document est lu ligne par ligne.",
      "Verimo recoupe les informations entre vos documents.",
      "Les risques et bons points sont identifiés un par un.",
      "Plus c'est précis, plus ça prend du temps — on fait le max.",
      "Un rapport de qualité se construit avec soin.",
    ];
    const heavyMessages = [
      "Analyse volumineuse en cours — merci de patienter.",
      `On lit et recoupe ${docsTotal} documents — c'est normal que ce soit un peu long.`,
      "La qualité du rapport dépend de cette lecture approfondie.",
      "Plus il y a de documents, plus l'analyse est riche — on ne bâcle rien.",
      "Encore quelques minutes pour un rapport vraiment utile.",
      "Vous pouvez fermer cet onglet — l'analyse continue.",
    ];
    const finalMessages = [
      "Dernière étape : contrôle qualité avant livraison.",
      "Vérifications finales — encore un instant.",
      "Rapport en cours de finalisation, ça arrive.",
      "On vérifie que rien n'a été oublié.",
    ];

    // Sélection du pool en fonction de l'avancement
    const messagePool =
      pct >= 88 ? finalMessages :
      docsTotal >= 8 ? heavyMessages :
      baseMessages;
    const currentRotatingMsg = messagePool[rotatingMsgIdx % messagePool.length];

    // Info "Document X sur Y" — UNIQUEMENT pendant la lecture des documents.
    // Quand tous les docs sont lus (current >= total), on bascule sur un libellé de phase :
    // "Synthèse" en MAP-REDUCE (≥ 6 docs), "Analyse approfondie" en single-call.
    // (Fix du faux "Document 6 sur 10" pour 9 docs : l'ancien +1 serveur "étape de synthèse"
    // a été retiré d'analyser-run — les deux côtés parlent désormais du même total.)
    const lectureEnCours = _progressDoc.total > 1 && _progressDoc.current > 0 && _progressDoc.current < _progressDoc.total;
    const docInfo = lectureEnCours
      ? `Document ${Math.min(_progressDoc.current + 1, _progressDoc.total)} sur ${_progressDoc.total} en cours d'analyse…`
      : (_progressDoc.total > 1 && _progressDoc.current >= _progressDoc.total
        ? (docsTotal >= 6 ? 'Synthèse du rapport en cours…' : 'Analyse approfondie en cours…')
        : null);

    const etapes = [
      { id: 'upload',      label: 'Envoi des fichiers',         detail: 'Transfert sécurisé vers nos serveurs',           seuil: 0,  fin: 16,  couleur: '#2a7d9c', icon: '📤' },
      { id: 'securise',    label: 'Traitement sécurisé',        detail: 'Vérification et préparation de vos documents',   seuil: 16, fin: 30,  couleur: '#0891b2', icon: '🔐' },
      { id: 'lecture',     label: 'Lecture approfondie',        detail: 'Verimo lit et comprend vos documents',           seuil: 30, fin: 50,  couleur: '#7c3aed', icon: '📖' },
      { id: 'analyse',     label: 'Analyse des éléments clés',  detail: 'Détection des points importants pour vous',      seuil: 50, fin: 70,  couleur: '#d97706', icon: '🔍' },
      { id: 'redaction',   label: 'Rédaction du rapport',       detail: 'Mise en forme de vos conclusions',               seuil: 70, fin: 88,  couleur: '#db2777', icon: '✍️' },
      { id: 'verification',label: 'Dernières vérifications',    detail: 'Contrôle qualité avant livraison',               seuil: 88, fin: 100, couleur: '#16a34a', icon: '✅' },
    ];
    const etapeActive = etapes.findLast(e => pct >= e.seuil) || etapes[0];
    const couleurActive = etapeActive.couleur;

    return (
      <div style={{ width: '100%', padding: '24px 0' }}>
        <style>{`
          @keyframes vr-shimmer { from { transform:translateX(-100%); } to { transform:translateX(200%); } }
          @keyframes vr-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.9); } }
          @media (max-width: 640px) {
            .na-analyse-grid { grid-template-columns: 1fr !important; }
            .upload-mobile-text { display: inline !important; }
            .upload-desktop-text { display: none !important; }
            .na-progress-header { padding: 20px 18px !important; }
            .na-progress-title { font-size: 16px !important; }
            .na-progress-subtitle { font-size: 12px !important; }
            .na-progress-pct { font-size: 36px !important; }
            .na-progress-pct-symbol { font-size: 16px !important; }
            .na-progress-label { font-size: 11px !important; }
            .na-progress-row { gap: 10px !important; margin-bottom: 16px !important; }
            .na-progress-time { padding: 4px 9px !important; font-size: 11px !important; }
          }
        `}</style>
        <div className="na-analyse-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Header avec temps estimé */}
            <div className="na-progress-header" style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius: 20, padding: '28px 32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(42,125,156,0.15)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <div className="na-progress-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', marginBottom: 6 }}>ANALYSE EN COURS</div>
                    <div className="na-progress-title" style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{etapeActive.icon} {etapeActive.label}</div>
                    <div className="na-progress-subtitle" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{etapeActive.detail}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="na-progress-pct" style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {pct}<span className="na-progress-pct-symbol" style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>%</span>
                    </div>
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${couleurActive}cc, ${couleurActive})`, width: `${animatedProgress}%`, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '60%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)', animation: 'vr-shimmer 1.6s ease-in-out infinite' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div className="na-progress-label" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {docsLabel}
                  </div>
                  <div className="na-progress-time" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 12px', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>⏱</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Environ {tempsRestant}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 🆕 Bandeau rassurant — apparaît tout seul après 2 min d'analyse */}
            <AnimatePresence>
              {elapsedSec >= 120 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4 }}
                  style={{ background: 'linear-gradient(135deg, #ecfdf5, #f0fdfa)', borderRadius: 16, border: '1px solid #a7f3d0', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>🔔</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#065f46', marginBottom: 4 }}>
                      Pas besoin de rester sur cette page
                    </div>
                    <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.55 }}>
                      Votre analyse continue toute seule en arrière-plan. Vous pouvez fermer cette page en toute tranquillité — nous vous prévenons dans votre cloche 🔔{userRole === 'pro' ? '' : ' et par e-mail'} dès que votre rapport est prêt.
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bandeau message rotatif + compteur de documents */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {docInfo && (
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2d3d', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', animation: 'vr-pulse 1.5s ease-in-out infinite' }} />
                  {docInfo}
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRotatingMsg}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35 }}
                  style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>💬</span>
                  <span>{currentRotatingMsg}</span>
                </motion.div>
              </AnimatePresence>
              {elapsedSec >= 30 && (
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  Temps écoulé : {Math.floor(elapsedSec / 60)} min {elapsedSec % 60}s
                </div>
              )}
            </div>

            {/* Étapes */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 16 }}>ÉTAPES DU TRAITEMENT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {etapes.map((e, idx) => {
                  const done = pct >= e.fin;
                  const active = pct >= e.seuil && pct < e.fin;
                  return (
                    <div key={e.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#16a34a' : active ? couleurActive : '#f1f5f9', border: `2px solid ${done ? '#16a34a' : active ? couleurActive : '#e2e8f0'}`, animation: active ? 'vr-pulse 1.5s ease-in-out infinite' : 'none' }}>
                          {done ? <span style={{ color: '#fff', fontSize: 13 }}>✓</span> : active ? <span style={{ color: '#fff', fontSize: 10 }}>●</span> : <span style={{ color: '#cbd5e1', fontSize: 10 }}>○</span>}
                        </div>
                        {idx < etapes.length - 1 && <div style={{ width: 2, height: 28, marginTop: 2, background: done ? '#16a34a' : '#e2e8f0' }} />}
                      </div>
                      <div style={{ paddingBottom: idx < etapes.length - 1 ? 16 : 0, paddingTop: 4, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: done || active ? 700 : 500, color: done ? '#16a34a' : active ? '#0f172a' : '#94a3b8' }}>
                          {e.icon} {e.label}
                          {active && <span style={{ fontSize: 11, color: couleurActive, marginLeft: 8, fontWeight: 600 }}>en cours…</span>}
                          {done && <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 8 }}>✓ terminé</span>}
                        </div>
                        {(active || done) && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{e.detail}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #edf2f7', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
              💡 L'analyse continue même si vous fermez cet onglet —{' '}
              <span style={{ color: '#2a7d9c', fontWeight: 600 }}>retrouvez-la dans Mes analyses</span>
            </div>
          </div>

          {/* Colonne droite : documents */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 14 }}>DOCUMENTS ANALYSÉS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.map((file, i) => {
                const isUploaded = pct >= 30;
                const isReading = pct >= 30 && pct < 80;
                const isDone = pct >= 80;
                const docPct = Math.max(0, Math.min(100, (pct - 30 - i * 8) * (100 / Math.max(1, 50 - docsTotal * 4))));
                const docDone = isDone || docPct >= 100;
                const docActive = isReading && !docDone;
                return (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: docDone ? '#f0fdf4' : docActive ? '#f0f9ff' : '#f8fafc', border: `1px solid ${docDone ? '#bbf7d0' : docActive ? '#bae6fd' : '#edf2f7'}`, transition: 'all 0.4s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{docDone ? '✅' : docActive ? '📖' : isUploaded ? '📤' : '⏳'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{docDone ? 'Analysé' : docActive ? 'Lecture en cours…' : isUploaded ? 'Envoyé' : 'En attente'}</div>
                      </div>
                      {docActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2a7d9c', animation: 'vr-pulse 1.2s ease-in-out infinite', flexShrink: 0 }} />}
                    </div>
                    {docActive && docPct > 0 && docPct < 100 && (
                      <div style={{ marginTop: 8, height: 3, borderRadius: 99, background: '#e0f2fe', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: '#2a7d9c', width: `${Math.min(docPct, 99)}%`, transition: 'width 0.4s ease' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  }

  /* ── RESULT ANALYSE SIMPLE (DOCUMENT) */
  if (step === 'result' && result && type === 'document') {
    return (
      <div className="dr-result-wrapper" style={{ maxWidth: 760, margin: '0 auto' }}>
        <style>{`
          @media (max-width: 640px) {
            .dr-result-wrapper { margin: 0 !important; padding: 0 !important; }
            .dr-result-topbar { padding: 10px 12px !important; margin-bottom: 12px !important; }
            .dr-result-topbar > div:first-child { font-size: 9px !important; }
          }
        `}</style>
        <div className="dr-result-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' as const, gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.14em' }}>ANALYSE DOCUMENT — VERIMO</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setStep('choice'); setType(null); setTypeBienDeclare(null); setFiles([]); setResult(null); }} style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid #edf2f7', background: '#fff', fontSize: 12, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Nouvelle analyse</button>
          </div>
        </div>
        <DocumentRenderer result={{ ...result, _profil: profil || 'rp' }} />
      </div>
    );
  }

  /* ── RESULT ANALYSE COMPLÈTE */
  if (step === 'result' && result) {
    const sc = result.score ?? 0;
    const scoreColor = sc >= 7.5 ? '#16a34a' : sc >= 5 ? '#d97706' : '#dc2626';
    const recColor = result.recommandation === 'Acheter' ? '#16a34a' : result.recommandation === 'Négocier' ? '#d97706' : '#dc2626';
    return (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.14em', marginBottom: 6 }}>RAPPORT VERIMO</div>
            <h1 style={{ fontSize: 'clamp(16px,2.5vw,22px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>{result.titre}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setStep('choice'); setType(null); setTypeBienDeclare(null); setFiles([]); setResult(null); }} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#fff', fontSize: 13, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Nouvelle analyse</button>
            <PdfButtonInline />
          </div>
        </div>
        {result.score != null && (
          <div className="result-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 12 }}>SCORE GLOBAL</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: scoreColor, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>{result.score.toFixed(1)}</div>
              <div style={{ fontSize: 14, color: '#94a3b8' }}>/ 20</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 12 }}>RECOMMANDATION</div>
              <div style={{ display: 'inline-block', padding: '8px 24px', borderRadius: 12, background: `${recColor}10`, border: `2px solid ${recColor}25`, fontSize: 22, fontWeight: 900, color: recColor, marginBottom: 8 }}>{result.recommandation}</div>
              {result.risques_financiers && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>{result.risques_financiers}</div>}
            </div>
          </div>
        )}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 22px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 10 }}>RÉSUMÉ</div>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{result.resume}</p>
        </div>
        <div className="result-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ background: '#f0fdf4', borderRadius: 16, border: '1px solid #d1fae5', padding: '18px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', letterSpacing: '0.1em', marginBottom: 12 }}>✓ POINTS FORTS</div>
            {result.points_forts.map((p: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}><CheckCircle size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} /><span style={{ fontSize: 13, color: '#166534', lineHeight: 1.5 }}>{p}</span></div>
            ))}
          </div>
          <div style={{ background: '#fffbeb', borderRadius: 16, border: '1px solid #fde68a', padding: '18px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', letterSpacing: '0.1em', marginBottom: 12 }}>⚠ POINTS DE VIGILANCE</div>
            {result.points_vigilance.map((p: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}><AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} /><span style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>{p}</span></div>
            ))}
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', marginBottom: 10 }}>AVIS VERIMO</div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.75, fontWeight: 500 }}>{result.conclusion}</p>
        </div>
      </div>
    );
  }

  return null;
}

/* ══════════════════════════════════════════
   COMPOSANT : Bandeau "Pour le dossier ..."
   (affiché à toutes les étapes après sélection)
══════════════════════════════════════════ */
function FolderBanner({ folder, analysisType, onChange }: { folder: { id: string; name: string; property_address?: string | null; property_city?: string | null }; analysisType?: 'simple' | 'complete'; onChange?: () => void }) {
  const subtitle = [folder.property_address, folder.property_city].filter(Boolean).join(', ');
  const typeLabel = analysisType === 'complete' ? 'complète' : 'simple';
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        position: 'relative',
        padding: '18px 20px',
        marginBottom: 20,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f7fb 100%)',
        border: '1.5px solid #c7dde8',
        boxShadow: '0 2px 12px rgba(42,125,156,0.06)',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Icône */}
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(42,125,156,0.25)',
        }}>
          <Building2 size={20} style={{ color: '#fff' }} />
        </div>

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.08em', textTransform: 'uppercase' as const, background: '#fff', padding: '3px 8px', borderRadius: 6, border: '1px solid #d0e8f0' }}>
              Analyse {typeLabel}
            </span>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>
              sera ajoutée au dossier
            </span>
          </div>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0f2d3d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: subtitle ? 2 : 0 }}>
            {folder.name}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, display: 'flex', alignItems: 'center', gap: 5 }}>
              📍 {subtitle}
            </div>
          )}
        </div>

        {/* Bouton Changer */}
        {onChange && (
          <button onClick={onChange}
            style={{
              padding: '7px 12px', borderRadius: 9,
              background: '#fff', border: '1.5px solid #d0e8f0',
              color: '#2a7d9c', fontSize: 11.5, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'inherit', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0f7fb'; el.style.borderColor = '#2a7d9c'; }}
            onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#d0e8f0'; }}>
            <RefreshCw size={11} /> Changer
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   ÉTAPE : Choix du dossier (pros uniquement)
══════════════════════════════════════════ */
type FolderLite = { id: string; name: string; property_address?: string | null; property_city?: string | null };

function FolderSelectStep({ folders, loading, type, onBack, onSelect, onCreate, showCreateModal, onCreateClose, onCreated }: {
  folders: FolderLite[];
  loading: boolean;
  type: 'document' | 'complete';
  onBack: () => void;
  onSelect: (folder: FolderLite) => void;
  onCreate: () => void;
  showCreateModal: boolean;
  onCreateClose: () => void;
  onCreated: (folder: FolderLite) => void;
}) {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'alpha'>('recent');
  const filtered = folders
    .filter(f => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        (f.property_address || '').toLowerCase().includes(q) ||
        (f.property_city || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortMode === 'alpha') {
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      }
      // 'recent' : on garde l'ordre serveur (déjà trié par updated_at desc)
      return 0;
    });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={onBack} style={{ fontSize: 13, color: '#2a7d9c', background: '#f0f7fb', border: '1px solid #d0e8f0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, fontWeight: 700, padding: '8px 14px', borderRadius: 10, transition: 'all 0.15s' }} onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#e0f0f7'; (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; }} onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#f0f7fb'; (e.currentTarget as HTMLElement).style.borderColor = '#d0e8f0'; }}><ChevronLeft size={14} /> Retour</button>

      {/* Badge contextuel */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 11px', borderRadius: 100, background: '#f0f7fb', border: '1px solid #d0e8f0', marginBottom: 14 }}>
        <Building2 size={11} style={{ color: '#2a7d9c' }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          Analyse {type === 'complete' ? 'complète' : 'simple'} · Étape 1
        </span>
      </div>

      {/* Bandeau dégradé bleu pro — titre et description */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2d3d 0%, #2a7d9c 100%)',
        borderRadius: 16,
        padding: '24px 26px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(15, 45, 61, 0.15)',
      }}>
        {/* Cercles décoratifs subtils */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(125, 211, 252, 0.10)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -50, width: 120, height: 120, borderRadius: '50%', background: 'rgba(125, 211, 252, 0.06)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: '#7dd3fc', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>
            Nouvelle analyse
          </div>
          <h1 style={{ fontSize: 'clamp(20px,2.5vw,24px)', fontWeight: 800, color: '#fff', margin: 0, marginBottom: 8, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            Pour quel bien lancez-vous cette analyse ?
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.55, maxWidth: 720 }}>
            Sélectionnez un dossier existant pour y ajouter cette analyse, ou créez-en un nouveau pour un bien que vous n'avez pas encore enregistré.
          </p>
        </div>
      </div>

      {/* État vide : aucun dossier */}
      {!loading && folders.length === 0 && (
        <>
          <button onClick={onCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%',
              padding: '20px 22px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)',
              border: '2px dashed #2a7d9c',
              cursor: 'pointer', textAlign: 'left' as const,
              transition: 'all 0.18s',
            }}
            onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 24px rgba(42,125,156,0.12)'; }}
            onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(42,125,156,0.15)' }}>
              <Sparkles size={20} style={{ color: '#2a7d9c' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f2d3d', marginBottom: 3 }}>Créer votre premier dossier</div>
              <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>Renseignez quelques infos sur le bien — vous reprendrez cette analyse juste après.</div>
            </div>
            <ArrowRight size={18} style={{ color: '#2a7d9c', flexShrink: 0 }} />
          </button>
          <div style={{ padding: '14px 18px', marginTop: 14, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 12.5, color: '#92400e', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={15} style={{ color: '#d97706', flexShrink: 0 }} />
            Les dossiers vous permettent de regrouper toutes les analyses d'un même bien au même endroit.
          </div>
        </>
      )}

      {/* Cas normal : il existe des dossiers */}
      {folders.length > 0 && (
        <>
          {/* Header section : titre + tri (si applicable) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' as const }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
              Vos dossiers existants ({folders.length})
            </div>
            {folders.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', borderRadius: 100, padding: 3, border: '1px solid #e2e8f0' }}>
                <button onClick={() => setSortMode('recent')}
                  style={{
                    padding: '5px 12px', borderRadius: 100, border: 'none', cursor: 'pointer',
                    background: sortMode === 'recent' ? '#0f2d3d' : 'transparent',
                    color: sortMode === 'recent' ? '#fff' : '#64748b',
                    fontSize: 11.5, fontWeight: 700, transition: 'all 0.15s', fontFamily: 'inherit',
                  }}>
                  Récents
                </button>
                <button onClick={() => setSortMode('alpha')}
                  style={{
                    padding: '5px 12px', borderRadius: 100, border: 'none', cursor: 'pointer',
                    background: sortMode === 'alpha' ? '#0f2d3d' : 'transparent',
                    color: sortMode === 'alpha' ? '#fff' : '#64748b',
                    fontSize: 11.5, fontWeight: 700, transition: 'all 0.15s', fontFamily: 'inherit',
                  }}>
                  A → Z
                </button>
              </div>
            )}
          </div>

          {/* Barre de recherche : seuil abaissé à 3 dossiers */}
          {folders.length > 3 && (
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un dossier par nom, adresse ou ville…"
                style={{ width: '100%', padding: '11px 16px 11px 38px', borderRadius: 11, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = '#2a7d9c'}
                onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = '#e2e8f0'} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {filtered.map(f => (
              <button key={f.id} onClick={() => onSelect(f)}
                style={{
                  padding: '16px 18px', borderRadius: 14,
                  background: '#fff', border: '1.5px solid #edf2f7',
                  cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'all 0.18s',
                  display: 'flex', alignItems: 'center', gap: 13,
                  fontFamily: 'inherit',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
                onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.boxShadow = '0 6px 18px rgba(42,125,156,0.12)'; el.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; el.style.transform = 'translateY(0)'; }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={17} style={{ color: '#2a7d9c' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: 2 }}>{f.name}</div>
                  {(f.property_address || f.property_city) && (
                    <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, display: 'flex', alignItems: 'center', gap: 4 }}>
                      📍 {[f.property_address, f.property_city].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
                <ArrowRight size={15} style={{ color: '#cbd5e1', flexShrink: 0 }} />
              </button>
            ))}
          </div>
          {filtered.length === 0 && search && (
            <div style={{ padding: 28, textAlign: 'center' as const, fontSize: 13, color: '#94a3b8', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
              Aucun dossier ne correspond à « {search} ».
            </div>
          )}

          {/* Séparateur "OU" en pilule centrée — bien visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ background: '#fff', color: '#94a3b8', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', padding: '5px 16px', borderRadius: 100, border: '1px solid #e2e8f0' }}>OU</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Bouton créer — mis en valeur avec fond bleu doux */}
          <button onClick={onCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%',
              padding: '16px 18px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(125,211,252,0.08), rgba(42,125,156,0.04))',
              border: '1.5px dashed #7dd3fc',
              cursor: 'pointer', textAlign: 'left' as const,
              transition: 'all 0.18s',
              fontFamily: 'inherit',
            }}
            onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.background = 'linear-gradient(135deg, rgba(125,211,252,0.15), rgba(42,125,156,0.08))'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 6px 18px rgba(42,125,156,0.10)'; }}
            onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#7dd3fc'; el.style.background = 'linear-gradient(135deg, rgba(125,211,252,0.08), rgba(42,125,156,0.04))'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(42,125,156,0.12)' }}>
              <Sparkles size={20} style={{ color: '#2a7d9c' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f2d3d', marginBottom: 3 }}>Nouveau bien à analyser ?</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Créez un dossier — l'analyse reprendra automatiquement</div>
            </div>
            <ArrowRight size={18} style={{ color: '#2a7d9c', flexShrink: 0 }} />
          </button>
        </>
      )}

      {loading && (
        <div style={{ padding: 32, textAlign: 'center' as const, fontSize: 13, color: '#94a3b8' }}>Chargement de vos dossiers…</div>
      )}

      {/* Modale de création de dossier inline */}
      <AnimatePresence>
        {showCreateModal && (
          <InlineModalCreateFolder onClose={onCreateClose} onCreated={onCreated} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   MODAL : Création de dossier (version inline pour NouvelleAnalyse)
   Réutilisable depuis le flow d'analyse, retourne directement le folder créé
══════════════════════════════════════════ */
function InlineModalCreateFolder({ onClose, onCreated }: { onClose: () => void; onCreated: (folder: FolderLite) => void }) {
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [name, setName] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ label: string; postcode: string; city: string }>>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const lastPostalCodeQueriedRef = useRef<string>('');
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAddressAutoRef = useRef(false);
  const skipPostalAutoRef = useRef(false);

  // Auto-génération nom dossier
  useEffect(() => {
    if (nameTouched) return;
    const parts = [];
    if (address.trim()) parts.push(address.trim());
    if (city.trim()) parts.push(city.trim());
    setName(parts.join(', '));
  }, [address, city, nameTouched]);

  // Auto-complétion code postal -> ville
  useEffect(() => {
    if (skipPostalAutoRef.current) { skipPostalAutoRef.current = false; return; }
    const cp = postalCode.trim();
    if (cp.length !== 5) {
      setCityOptions([]);
      if (cp.length === 0 && lastPostalCodeQueriedRef.current) {
        setCity('');
        lastPostalCodeQueriedRef.current = '';
      }
      return;
    }
    if (lastPostalCodeQueriedRef.current && lastPostalCodeQueriedRef.current !== cp) {
      setCity('');
    }
    lastPostalCodeQueriedRef.current = cp;
    setCityLoading(true);
    fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom&format=json&limit=10`)
      .then(r => r.json())
      .then((data: { nom: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const cities = data.map(c => c.nom);
          setCityOptions(cities);
          if (cities.length === 1) setCity(cities[0]);
        } else {
          setCityOptions([]);
        }
      })
      .catch(() => setCityOptions([]))
      .finally(() => setCityLoading(false));
  }, [postalCode]);

  // Auto-complétion adresse via Etalab
  useEffect(() => {
    if (skipAddressAutoRef.current) { skipAddressAutoRef.current = false; return; }
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    const q = address.trim();
    if (q.length < 4) { setAddressSuggestions([]); return; }
    addressDebounceRef.current = setTimeout(() => {
      setAddressLoading(true);
      fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&autocomplete=1`)
        .then(r => r.json())
        .then((data: any) => {
          if (data?.features && Array.isArray(data.features)) {
            const suggestions = data.features
              .map((f: any) => ({ label: f.properties?.label || '', postcode: f.properties?.postcode || '', city: f.properties?.city || '' }))
              .filter((s: any) => s.label);
            setAddressSuggestions(suggestions);
          } else {
            setAddressSuggestions([]);
          }
        })
        .catch(() => setAddressSuggestions([]))
        .finally(() => setAddressLoading(false));
    }, 300);
    return () => { if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current); };
  }, [address]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function selectAddressSuggestion(s: { label: string; postcode: string; city: string }) {
    // Nettoyer le label : retirer la ville et le code postal pour ne garder que la voie
    let streetOnly = s.label;
    if (s.city) streetOnly = streetOnly.replace(new RegExp(`\\s*,?\\s*${s.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '');
    if (s.postcode) streetOnly = streetOnly.replace(new RegExp(`\\s*,?\\s*${s.postcode}\\s*`, 'g'), ' ');
    streetOnly = streetOnly.replace(/,\s*$/, '').trim();
    skipAddressAutoRef.current = true;
    skipPostalAutoRef.current = true;
    setAddress(streetOnly);
    if (s.postcode) { lastPostalCodeQueriedRef.current = s.postcode; setPostalCode(s.postcode); }
    if (s.city) setCity(s.city);
    setAddressSuggestions([]);
    setShowAddressDropdown(false);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setErrorMsg('Le nom du dossier est obligatoire.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté');

      const { data, error } = await supabase
        .from('pro_folders')
        .insert({
          user_id: user.id,
          name: name.trim(),
          property_address: address.trim() || null,
          property_postal_code: postalCode.trim() || null,
          property_city: city.trim() || null,
          internal_note: internalNote.trim() || null,
        })
        .select('id, name, property_address, property_city')
        .single();

      if (error) throw error;
      onCreated(data as FolderLite);
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de la création du dossier.');
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 10, border: '1.5px solid #edf2f7',
    fontSize: 13.5, outline: 'none', boxSizing: 'border-box' as const, background: '#fff',
    fontFamily: 'inherit', color: '#0f172a',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(15,45,61,0.35)' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={18} style={{ color: '#2a7d9c' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Nouveau dossier</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>Vous reprendrez votre analyse juste après</p>
            </div>
          </div>
          <button onClick={onClose} title="Fermer"
            style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 16, color: '#64748b', lineHeight: 1 }}>×</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 8px' }}>
          {/* Adresse + autocomplétion */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
              Adresse du bien <span style={{ color: '#cbd5e1', fontWeight: 500, marginLeft: 6, textTransform: 'none' as const, fontSize: 10.5 }}>(optionnel)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input value={address}
                onChange={e => { setAddress(e.target.value); setShowAddressDropdown(true); }}
                onFocus={() => { setAddressFocused(true); setShowAddressDropdown(true); }}
                onBlur={() => { setAddressFocused(false); setTimeout(() => setShowAddressDropdown(false), 150); }}
                placeholder="Commencez à taper… (ex: 12 rue de Rivoli)"
                autoComplete="off"
                style={inputStyle} />

              {showAddressDropdown && addressFocused && (addressSuggestions.length > 0 || addressLoading) && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #edf2f7', borderRadius: 10, boxShadow: '0 12px 32px rgba(15,45,61,0.12)', zIndex: 10, maxHeight: 240, overflowY: 'auto' as const }}>
                  {addressLoading && addressSuggestions.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' as const }}>Recherche d'adresses…</div>
                  ) : (
                    addressSuggestions.map((s, i) => (
                      <button key={i}
                        onMouseDown={(e) => { e.preventDefault(); selectAddressSuggestion(s); }}
                        style={{ width: '100%', textAlign: 'left' as const, padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: i < addressSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
                        onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                        onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{s.label}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Code postal + Ville */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                Code postal <span style={{ color: '#cbd5e1', fontWeight: 500, marginLeft: 6, textTransform: 'none' as const, fontSize: 10.5 }}>(optionnel)</span>
              </label>
              <input value={postalCode} onChange={e => {
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                  setPostalCode(v);
                }}
                placeholder="75001"
                inputMode="numeric"
                style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                Ville <span style={{ color: '#cbd5e1', fontWeight: 500, marginLeft: 6, textTransform: 'none' as const, fontSize: 10.5 }}>(optionnel)</span>
              </label>
              {cityOptions.length > 1 ? (
                <select value={city} onChange={e => setCity(e.target.value)} style={{ ...inputStyle, paddingRight: 28, cursor: 'pointer' }}>
                  <option value="">Choisir…</option>
                  {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder={cityLoading ? 'Recherche…' : 'Paris 1er'}
                  style={inputStyle} />
              )}
            </div>
          </div>

          {/* Nom du dossier */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
              Nom du dossier <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>
            </label>
            <input value={name} onChange={e => { setName(e.target.value); setNameTouched(true); }}
              placeholder="Ex: 12 rue de Rivoli, Paris 1er"
              style={inputStyle} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' as const }}>Auto-rempli depuis l'adresse, modifiable</div>
          </div>

          {/* Note interne */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
              Note interne <span style={{ color: '#cbd5e1', fontWeight: 500, marginLeft: 6, textTransform: 'none' as const, fontSize: 10.5 }}>(optionnel)</span>
            </label>
            <textarea value={internalNote} onChange={e => setInternalNote(e.target.value)}
              placeholder="Ex: Mandat exclusif signé le 03/05, voisin bruyant"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 60, fontFamily: 'inherit' }} />
          </div>

          {errorMsg && (
            <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12.5, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px 22px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} disabled={submitting}
            style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', color: '#64748b', border: '1.5px solid #edf2f7', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting || !name.trim()}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: submitting || !name.trim() ? '#cbd5e1' : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)',
              color: '#fff', cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}>
            {submitting ? 'Création…' : 'Créer le dossier'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
