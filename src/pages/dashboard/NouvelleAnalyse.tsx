import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, ShieldCheck, Upload, CheckCircle, AlertTriangle, ChevronLeft, Sparkles, ArrowRight, Lock, Download } from 'lucide-react';
import { lancerAnalyseEdge, type AnalyseProgress } from '../../lib/analyse-client';
import { createAnalyse, createApercu, markAnalyseFailed, markFreePreviewUsed, unmarkFreePreviewUsed, checkFreePreviewUsedSync } from '../../lib/analyses';
import { supabase } from '../../lib/supabase';
import { useCredits, type Credits } from '../../hooks/useCredits';

// ─── Constantes ───────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPE = 'application/pdf';

type FileError = { name: string; reason: string };

type ApercuResult = {
  titre: string;
  recommandation_courte: string;
  points_vigilance: string[];
};

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

export default function NouvelleAnalyse() {
  const { credits, deductCredit } = useCredits();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'choice' | 'profil' | 'upload' | 'analyse' | 'apercu' | 'result'>('choice');
  const [type, setType] = useState<'document' | 'complete' | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const [progress, setProgress] = useState(0);

  const [fileWarnings, setFileWarnings] = useState<string[]>([]);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressDoc, setProgressDoc] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<AnalyseResult | null>(null);
  const [apercu, setApercu] = useState<ApercuResult | null>(null);
  const [apercuId, setApercuId] = useState<string | null>(null);
  const [freePreviewUsed, setFreePreviewUsed] = useState<boolean>(() => checkFreePreviewUsedSync());
  const [error, setError] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [profil, setProfil] = useState<'rp' | 'invest' | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const plans = {
    document: { label: "Analyse d'un document", price: '4,90€', max: 1, desc: "Un seul fichier PDF — PV d'AG, règlement, diagnostic, appel de charges.", creditsKey: 'document' as keyof Credits },
    complete: { label: "Analyse complète d'un logement", price: '19,90€', max: 20, desc: 'Tous les documents du bien — score /20, risques, recommandation Verimo.', creditsKey: 'complete' as keyof Credits },
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
      const allFiles = [...files, ...valid].slice(0, plan?.max || 1);
      setFiles(allFiles);
    }
  };

  // ─── Extraction texte avec warning si vide ────────────────
  // ─── Remboursement crédit ─────────────────────────────────
  const refundCredit = async (creditType: 'document' | 'complete') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const col = creditType === 'document' ? 'credits_document' : 'credits_complete';
      const { data } = await supabase.from('profiles').select(col).eq('id', user.id).single();
      if (data) {
        const current = (data as Record<string, number>)[col] || 0;
        await supabase.from('profiles').update({ [col]: current + 1 }).eq('id', user.id);
      }
    } catch { /* silencieux */ }
  };

  // ─── Animation barre de progression ─────────────────────
  // ─── Charger aperçu depuis URL (depuis Mes analyses) ──────
  useEffect(() => {
    const apercuIdParam = searchParams.get('apercu_id');
    if (!apercuIdParam) return;
    const chargerApercu = async () => {
      const { data } = await supabase.from('analyses').select('apercu, type, title').eq('id', apercuIdParam).single();
      if (data?.apercu) {
        setApercu(data.apercu as ApercuResult);
        setApercuId(apercuIdParam);
        setType(data.type as 'document' | 'complete');
        setStep('apercu');
      }
    };
    chargerApercu();
  }, []);

  useEffect(() => {
    if (step !== 'analyse') { setAnimatedProgress(0); return; }
    // La barre ne dépasse jamais le vrai progress mais avance toujours doucement
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      setAnimatedProgress(prev => {
        const target = progress;
        const maxFake = Math.min(target + 2, 98); // avance max 2% au-delà du réel
        if (prev >= maxFake) return prev;
        return prev + 0.3;
      });
    }, 120);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [step, progress]);

  // ─── Callback progression Edge Function ───────────────────
  const handleProgress = (p: AnalyseProgress) => {
    setProgress(p.percent);
    setProgressMsg(p.message);
    if (p.total > 1) setProgressDoc({ current: p.current, total: p.total });
  };

  // ─── Paiement depuis l'aperçu gratuit ─────────────────────
  const lancerPaiementApercu = async (isComplete: boolean, apercuId: string | null) => {
    const PRICE_IDS: Record<string, string> = {
      document: 'price_1TIb1LBO4ekMbwz0020eqcR0',
      complete: 'price_1TIb3XBO4ekMbwz0a7m7E7gD',
    };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/connexion'; return; }
      const priceId = isComplete ? PRICE_IDS.complete : PRICE_IDS.document;
      const successUrl = apercuId
        ? `https://verimo.fr/dashboard/rapport?id=${apercuId}&action=reupload`
        : `https://verimo.fr/dashboard/tarifs?success=true`;
      const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk' },
        body: JSON.stringify({ priceId, userId: session.user.id, successUrl }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) { console.error(e); }
  };

  // ─── Lancer aperçu gratuit ────────────────────────────────
  const lancerApercu = async () => {
    if (isAnalysing) return;
    setIsAnalysing(true);
    if (!files.length || !type) return;
    setStep('analyse'); setError(''); setFileWarnings([]); setProgress(5);
    setProgressMsg('Préparation des documents…'); setProgressDoc({ current: 0, total: files.length });
    const docNames = files.map(f => f.name);
    const analyseDB = await createApercu(type, files[0].name, profil || 'rp', docNames);
    const analyseId = analyseDB?.id || null;
    if (!analyseId) {
      setError("Impossible de créer l'analyse. Veuillez réessayer.");
      setStep('upload'); resetUpload(); setIsAnalysing(false); return;
    }
    // Marquer l'offre gratuite utilisée dès le lancement (pas après) pour que le badge disparaisse immédiatement
    await markFreePreviewUsed();
    setFreePreviewUsed(true);
    const mode = type === 'complete' ? 'apercu_complete' : 'apercu_document';
    const result = await lancerAnalyseEdge({ files, mode, analyseId, profil: profil || 'rp', onProgress: handleProgress });
    if (!result.success) {
      await markAnalyseFailed(analyseId);
      await unmarkFreePreviewUsed(); // Rendre l'offre gratuite si l'analyse échoue
      setFreePreviewUsed(false);
      setError(result.errorMessage || "Une erreur est survenue. Veuillez réessayer.");
      setStep('upload'); resetUpload(); setIsAnalysing(false); return;
    }
    // Lire le résultat depuis Supabase
    const { data: analyseData } = await supabase.from('analyses').select('apercu, title').eq('id', analyseId).single();
    if (analyseData?.apercu) {
      setApercu(analyseData.apercu as ApercuResult);
      setApercuId(analyseId);
      setStep('apercu');
    } else {
      setError("Rapport non disponible. Veuillez réessayer.");
      setStep('upload'); resetUpload();
    }
    setIsAnalysing(false);
  };

  // ─── Lancer analyse payante ───────────────────────────────
  const lancer = async () => {
    if (!files.length || !type) return;
    if (isAnalysing) return;
    setIsAnalysing(true);
    const creditType = type === 'document' ? 'document' : 'complete';
    const ok = await deductCredit(creditType);
    if (!ok) { setError("Vous n'avez plus de crédit disponible. Veuillez recharger votre compte."); setIsAnalysing(false); return; }
    setStep('analyse'); setError(''); setFileWarnings([]); setProgress(5);
    setProgressMsg('Préparation des documents…'); setProgressDoc({ current: 0, total: files.length });
    const docNames = files.map(f => f.name);
    const analyseDB = await createAnalyse(type, files[0].name, profil || 'rp', docNames);
    const analyseId = analyseDB?.id || null;
    if (!analyseId) {
      await refundCredit(creditType);
      setError("Impossible de créer l'analyse. Votre crédit a été remboursé. Veuillez réessayer.");
      setStep('upload'); resetUpload(); setIsAnalysing(false); return;
    }
    const result = await lancerAnalyseEdge({ files, mode: type, analyseId, profil: profil || 'rp', onProgress: handleProgress });
    if (!result.success) {
      await refundCredit(creditType);
      await markAnalyseFailed(analyseId);
      setError(result.errorMessage || "Une erreur est survenue. Votre crédit a été remboursé automatiquement.");
      setStep('upload'); resetUpload(); setIsAnalysing(false); return;
    }
    setProgress(100); setProgressMsg('Rapport prêt !');
    await new Promise(r => setTimeout(r, 500));
    window.location.href = `/dashboard/rapport?id=${analyseId}`;
  };

  /* ── CHOICE */
  if (step === 'choice') return (
    <div>
      <Link to="/dashboard" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24, fontWeight: 600 }}><ChevronLeft size={14} /> Retour</Link>
      <h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 6 }}>Que souhaitez-vous analyser ?</h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: !freePreviewUsed ? 16 : 32 }}>Choisissez le mode d'analyse adapté à votre besoin.</p>
      {!freePreviewUsed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 14, background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', marginBottom: 28, boxShadow: '0 4px 16px rgba(15,45,61,0.18)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={16} style={{ color: '#fff' }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 4 }}>1 analyse offerte 🎁</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>Profitez d'une analyse gratuite pour visualiser un aperçu du rapport et découvrir notre outil.</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#0f2d3d', background: '#fff', padding: '4px 12px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0 }}>OFFERT</span>
        </div>
      )}
      <div className="type-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <button onClick={() => { if (freePreviewUsed && credits.document === 0) { window.location.href = '/dashboard/tarifs'; return; } setType('document'); setStep('profil'); }}
          style={{ padding: '28px 24px', borderRadius: 20, border: '1.5px solid #edf2f7', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.boxShadow = '0 8px 28px rgba(42,125,156,0.1)'; el.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)'; }}>
          {freePreviewUsed && (
            <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: credits.document > 0 ? '#f0fdf4' : '#f8fafc', color: credits.document > 0 ? '#16a34a' : '#94a3b8', border: `1px solid ${credits.document > 0 ? '#bbf7d0' : '#e2e8f0'}` }}>
              {credits.document > 0 ? `${credits.document} crédit${credits.document > 1 ? 's' : ''} restant${credits.document > 1 ? 's' : ''}` : '0 crédit'}
            </div>
          )}
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: freePreviewUsed ? 8 : 0 }}><FileText size={24} style={{ color: '#2a7d9c' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Analyse d&apos;un seul document</div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>Retenez l&apos;essentiel d&apos;un document précis :<br /><span style={{ color: '#94a3b8' }}>Règlement de copro, PV d&apos;AG, diagnostic, DPE, appel de charges…</span><br /><span style={{ fontSize: 11, color: '#cbd5e1' }}>1 fichier PDF uniquement</span></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c', display: 'flex', alignItems: 'center', gap: 5 }}>
              {freePreviewUsed && credits.document === 0 ? <><Lock size={13} /> Acheter un crédit</> : <><ArrowRight size={14} /> Commencer</>}
            </span>
            {freePreviewUsed && <span style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>4,90€</span>}
          </div>
        </button>
        <button onClick={() => { if (freePreviewUsed && credits.complete === 0) { window.location.href = '/dashboard/tarifs'; return; } setType('complete'); setStep('profil'); }}
          style={{ padding: '28px 24px', borderRadius: 20, border: '1.5px solid transparent', background: 'linear-gradient(145deg, #0f2d3d, #1a5068)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15,45,61,0.15)' }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 12px 40px rgba(15,45,61,0.28)'; el.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 4px 20px rgba(15,45,61,0.15)'; el.style.transform = 'translateY(0)'; }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(42,125,156,0.2)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 14, left: 14, fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 100 }}>★ RECOMMANDÉ</div>
          {freePreviewUsed && (
            <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: credits.complete > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              {credits.complete > 0 ? `${credits.complete} crédit${credits.complete > 1 ? 's' : ''} restant${credits.complete > 1 ? 's' : ''}` : '0 crédit'}
            </div>
          )}
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: freePreviewUsed ? 18 : 10 }}><ShieldCheck size={24} style={{ color: '#fff' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Analyse complète d&apos;un logement</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 20 }}>Déposez tous vos documents d&apos;un seul coup :<br /><span style={{ color: 'rgba(255,255,255,0.45)' }}>PV AG 2022/2023/2024, règlement copro, DPE, diagnostic électricité, amiante…</span><br /><span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Rapport détaillé avec score /20 et recommandation.</span></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {freePreviewUsed && credits.complete === 0 ? <>Acheter un crédit <ArrowRight size={14} /></> : <>Commencer l&apos;audit <ArrowRight size={14} /></>}
            </span>
            {freePreviewUsed && <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>19,90€</span>}
          </div>
        </button>
      </div>
    </div>
  );


  /* ── PROFIL */
  if (step === 'profil' && type) return (
    <div style={{ maxWidth: 600 }}>
      <button onClick={() => { setStep('choice'); setProfil(null); }} style={{ fontSize: 13, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24, fontWeight: 600 }}><ChevronLeft size={14} /> Retour</button>
      <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 8 }}>Ce bien, c'est pour vous ?</h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>Votre profil d'achat influence la notation du bien — notamment sur le DPE et les charges.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button onClick={() => { setProfil('rp'); setStep('upload'); }}
          style={{ padding: '24px 28px', borderRadius: 18, border: '2px solid #edf2f7', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.boxShadow = '0 8px 28px rgba(42,125,156,0.1)'; el.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>🏠</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Résidence principale</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Vous allez y vivre — confort, charges et DPE comptent davantage.</div>
            </div>
            <ArrowRight size={18} style={{ color: '#2a7d9c', marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        </button>
        <button onClick={() => { setProfil('invest'); setStep('upload'); }}
          style={{ padding: '24px 28px', borderRadius: 18, border: '2px solid #edf2f7', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#f0a500'; el.style.boxShadow = '0 8px 28px rgba(240,165,0,0.12)'; el.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#edf2f7'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(240,165,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>📈</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Investissement locatif</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Vous cherchez un rendement — rentabilité et risques locatifs sont prioritaires.</div>
            </div>
            <ArrowRight size={18} style={{ color: '#f0a500', marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 20, textAlign: 'center' }}>Ce choix influence uniquement la notation — votre analyse reste complète dans tous les cas.</p>
    </div>
  );

  /* ── UPLOAD */
  if (step === 'upload' && plan) return (
    <div>
      <button onClick={() => { setStep('profil'); resetUpload(); }} style={{ fontSize: 13, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24, fontWeight: 600 }}><ChevronLeft size={14} /> Retour</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '16px 18px', background: '#fff', borderRadius: 14, border: '1px solid #edf2f7' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {type === 'complete' ? <ShieldCheck size={19} style={{ color: '#2a7d9c' }} /> : <FileText size={19} style={{ color: '#2a7d9c' }} />}
        </div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{plan.label}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{plan.desc}</div></div>

      </div>

      {/* Fichiers uploadés — en haut, bien visibles */}
      {files.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: '#f0f9ff', border: '2px solid #bae6fd', boxShadow: '0 2px 8px rgba(42,125,156,0.08)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} color="#2a7d9c" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{(f.size / 1024 / 1024).toFixed(2)} Mo · PDF</div>
                </div>
                <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ width: 28, height: 28, borderRadius: 8, background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0, fontSize: 16, fontWeight: 700 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Erreur bloquante */}
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

      {/* Zone de dépôt */}
      <div onClick={() => document.getElementById('file-input')?.click()}
        style={{ padding: '44px 32px', borderRadius: 18, border: '2px dashed #dde6ec', background: '#fafcfe', textAlign: 'center', cursor: 'pointer', marginBottom: 14, transition: 'all 0.18s' }}
        onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2a7d9c'; el.style.background = 'rgba(42,125,156,0.02)'; }}
        onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#dde6ec'; el.style.background = '#fafcfe'; }}
        onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; }}
        onDrop={e => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)); }}>
        <input id="file-input" type="file" multiple={plan.max > 1} accept=".pdf" style={{ display: 'none' }}
          onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)); }} />
        <div style={{ width: 54, height: 54, borderRadius: 15, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Upload size={24} style={{ color: '#2a7d9c' }} /></div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 5 }}>Déposez vos documents ici</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>ou <span style={{ color: '#2a7d9c', fontWeight: 700 }}>cliquez pour sélectionner</span></div>
        <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8 }}>
          PDF uniquement · Max {MAX_FILE_SIZE_MB} Mo par fichier{plan.max > 1 ? ` · ${plan.max} fichiers max` : ' · 1 fichier'}
        </div>
      </div>

      {/* Formats acceptés */}
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
        ✅ <strong>Formats acceptés :</strong> PDF natif ou scanné<br />
        ❌ <strong>Non supportés :</strong> Word (.doc/.docx) — convertissez-les en PDF d'abord<br />
        🔒 Les PDF protégés par mot de passe doivent être déverrouillés avant l'upload
      </div>



      {!freePreviewUsed && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Sparkles size={13} style={{ color: '#fff', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Votre analyse offerte — aperçu du rapport généré gratuitement.</span>
        </div>
      )}

      <button onClick={!freePreviewUsed ? lancerApercu : lancer} disabled={files.length === 0 || isAnalysing}
        style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: files.length > 0 ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#e2e8f0', color: files.length > 0 ? '#fff' : '#94a3b8', fontSize: 15, fontWeight: 800, cursor: files.length > 0 ? 'pointer' : 'default', boxShadow: files.length > 0 ? '0 4px 18px rgba(15,45,61,0.2)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
        <Sparkles size={16} /> {!freePreviewUsed ? 'Générer mon aperçu gratuit' : 'Analyser'} {files.length > 0 ? `(${files.length} fichier${files.length > 1 ? 's' : ''})` : ''}
      </button>
    </div>
  );

  /* ── LOADING PREMIUM */
  if (step === 'analyse') {
    const pct = Math.round(animatedProgress);
    const etapes = [
      { min: 0,  max: 15, label: 'Réception des documents', icon: '📥', detail: 'Vos fichiers sont en cours de transfert sécurisé…' },
      { min: 15, max: 35, label: 'Lecture des documents', icon: '📖', detail: progressMsg || (progressDoc.total > 1 ? `Document ${progressDoc.current + 1} sur ${progressDoc.total} en cours de lecture…` : 'Lecture et extraction du contenu…') },
      { min: 35, max: 60, label: 'Analyse du contenu', icon: '🔍', detail: 'Identification des informations clés, travaux, procédures…' },
      { min: 60, max: 80, label: 'Extraction des données', icon: '⚡', detail: 'Structuration des résultats et calcul des indicateurs…' },
      { min: 80, max: 95, label: 'Génération du rapport', icon: '📊', detail: 'Rédaction de votre rapport personnalisé Verimo…' },
      { min: 95, max: 100, label: 'Finalisation', icon: '✅', detail: 'Votre rapport est presque prêt…' },
    ];
    const etapeActive = etapes.find(e => pct >= e.min && pct < e.max) || etapes[etapes.length - 1];
    const etapeIndex = etapes.indexOf(etapeActive);

    return (
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 0' }}>
        {/* Message Ne quittez pas — en haut */}
        <div style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>⚠ Ne quittez pas cette page</p>
          <p style={{ fontSize: 12, color: '#b45309', lineHeight: 1.5, margin: 0 }}>
            Si vous quittez, retrouvez votre analyse dans <strong>Mes analyses</strong> — elle continuera en arrière-plan.
          </p>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32, boxShadow: '0 8px 32px rgba(42,125,156,0.15)', animation: 'float 3s ease-in-out infinite' }}>
            {etapeActive.icon}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.025em' }}>
            {etapeActive.label}…
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{etapeActive.detail}</p>
        </div>

        {/* Barre de progression principale */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c' }}>Progression</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>{pct}<span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>%</span></span>
          </div>
          <div style={{ height: 12, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 99,
              background: 'linear-gradient(90deg, #2a7d9c, #1a5068)',
              width: `${animatedProgress}%`,
              transition: 'width 0.15s linear',
            }} />
            {/* Effet shimmer */}
            <div style={{
              position: 'absolute', top: 0, left: `${animatedProgress - 8}%`, width: '8%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* Étapes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {etapes.map((e, i) => {
            const done = i < etapeIndex;
            const active = i === etapeIndex;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
                background: active ? '#f0f9ff' : done ? '#f0fdf4' : '#f8fafc',
                border: `1.5px solid ${active ? '#bae6fd' : done ? '#bbf7d0' : '#f1f5f9'}`,
                transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13,
                  background: active ? '#2a7d9c' : done ? '#16a34a' : '#e2e8f0',
                  color: active || done ? '#fff' : '#94a3b8',
                  fontWeight: 700,
                }}>
                  {done ? '✓' : active ? <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : done ? 600 : 400, color: active ? '#0f172a' : done ? '#16a34a' : '#94a3b8' }}>
                  {e.label}
                </span>
                {done && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#16a34a' }}>Terminé</span>}
                {active && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#2a7d9c' }}>En cours…</span>}
              </div>
            );
          })}
        </div>

        {/* Indicateur documents si multiple */}
        {progressDoc.total > 1 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Documents ({progressDoc.current}/{progressDoc.total})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Array.from({ length: progressDoc.total }).map((_, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: i < progressDoc.current ? '#f0fdf4' : i === progressDoc.current ? 'rgba(42,125,156,0.1)' : '#f8fafc',
                  border: `1.5px solid ${i < progressDoc.current ? '#86efac' : i === progressDoc.current ? '#2a7d9c' : '#e2e8f0'}`,
                  color: i < progressDoc.current ? '#16a34a' : i === progressDoc.current ? '#2a7d9c' : '#94a3b8',
                  transition: 'all 0.3s',
                  boxShadow: i === progressDoc.current ? '0 0 0 3px rgba(42,125,156,0.15)' : 'none',
                }}>
                  {i < progressDoc.current ? '✓' : i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings fichiers si présents */}
        {fileWarnings.length > 0 && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', marginTop: 16 }}>
            {fileWarnings.map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>⚠ {w}</div>
            ))}
          </div>
        )}
        {/* Message rassurant */}


        <style>{`
          @keyframes shimmer { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  /* ── RESULT */
  if (step === 'result' && result) {
    const isComplete = type === 'complete';
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
            <button onClick={() => { setStep('choice'); setType(null); setFiles([]); setResult(null); }} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#fff', fontSize: 13, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Nouvelle analyse</button>
            <button style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Download size={13} /> PDF</button>
          </div>
        </div>
        {isComplete && result.score != null && (
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
            {result.points_forts.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}><CheckCircle size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} /><span style={{ fontSize: 13, color: '#166534', lineHeight: 1.5 }}>{p}</span></div>
            ))}
          </div>
          <div style={{ background: '#fffbeb', borderRadius: 16, border: '1px solid #fde68a', padding: '18px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', letterSpacing: '0.1em', marginBottom: 12 }}>⚠ POINTS DE VIGILANCE</div>
            {result.points_vigilance.map((p, i) => (
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

  /* ── APERÇU GRATUIT */
  if (step === 'apercu' && apercu) {
    const isComplete = type === 'complete';
    return (
      <>
      <style>{`.apercu-grid { display: flex; flex-direction: column; gap: 20px; } @media (min-width: 900px) { .apercu-grid { display: grid; grid-template-columns: 1fr 340px; gap: 28px; align-items: start; } }`}</style>
      <div style={{ animation: 'fadeUp 0.35s ease both' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', letterSpacing: '0.14em', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: 100 }}>APERÇU GRATUIT</span>
          </div>
          <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 4 }}>{apercu.titre}</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Voici un aperçu de votre analyse. Débloquez le rapport complet pour accéder à tous les détails.</p>
        </div>
        <div className="apercu-grid">
        <div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 22px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 8 }}>RÉSUMÉ</div>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{apercu.recommandation_courte}</p>
        </div>
        <div style={{ background: '#fffbeb', borderRadius: 16, border: '1px solid #fde68a', padding: '20px 22px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', letterSpacing: '0.1em', marginBottom: 12 }}>⚠ POINTS DE VIGILANCE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {apercu.points_vigilance.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
        {isComplete && (
          <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 8 }}>SCORE GLOBAL</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: '#94a3b8' }}>?.?</div>
              <div style={{ fontSize: 14, color: '#94a3b8' }}>/20</div>
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              <Lock size={22} style={{ color: '#64748b' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Score disponible après paiement</span>
            </div>
          </div>
        )}
        <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 12 }}>ANALYSE COMPLÈTE</div>
            {['Rapport financier détaillé', 'Liste des travaux votés et à prévoir', 'Analyse des charges et fonds travaux', 'Procédures en cours', 'Avis Verimo personnalisé'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#cbd5e1' }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
            <Lock size={20} style={{ color: '#64748b' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Contenu réservé aux analyses payantes</span>
          </div>
        </div>
        </div>

          {/* Colonne droite — CTA sticky */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius: 18, padding: '24px 26px', overflow: 'hidden', position: 'sticky' as const, top: 80 }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(42,125,156,0.2)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', marginBottom: 8 }}>DÉBLOQUER LE RAPPORT COMPLET</div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{isComplete ? 'Accédez au rapport complet' : "Accédez à l'analyse complète du document"}</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 20 }}>Score {isComplete ? '/20, travaux, charges, procédures et avis Verimo' : 'et analyse approfondie'}. Rapport PDF téléchargeable inclus.</p>
                <button onClick={() => lancerPaiementApercu(isComplete, apercuId)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', width: '100%', marginBottom: 10 }}>
                  <Sparkles size={15} /> Débloquer — {isComplete ? '19,90€' : '4,90€'}
                </button>
                <button onClick={() => { setStep('choice'); setType(null); setFiles([]); setApercu(null); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                  Nouvelle analyse
                </button>
                {apercuId && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 12, textAlign: 'center' }}>Aperçu sauvegardé dans "Mes analyses"</p>}
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 10 }}>CE QUI VOUS ATTEND</div>
              {(isComplete ? ['Score global /20', 'Analyse travaux détaillée', 'Finances copropriété', 'Procédures juridiques', 'Onglet Copropriété complet', 'Avis Verimo personnalisé', 'Rapport PDF téléchargeable'] : ['Analyse approfondie du document', 'Points clés détaillés', 'Recommandations personnalisées', 'Rapport PDF téléchargeable']).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={10} color="#16a34a" />
                  </div>
                  <span style={{ fontSize: 12, color: '#374151' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  return null;
}
