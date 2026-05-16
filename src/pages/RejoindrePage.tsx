import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, TrendingUp, Key, Scale, HelpCircle,
  User, Briefcase, Target, CheckCircle, ChevronLeft, ChevronRight,
  Mail, Phone, MapPin, Sparkles, Send,
  Hash, Users, BarChart3, Loader2, AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const profileTypes = [
  { id: 'agent', label: 'Agent immobilier', desc: 'Indépendant, en agence ou en réseau', icon: Building2, color: '#2a7d9c', bg: '#f0f7fb' },
  { id: 'investisseur', label: 'Investisseur', desc: 'Locatif, défiscalisation, patrimoine', icon: TrendingUp, color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'marchand', label: 'Marchand de bien', desc: 'Achat-revente, rénovation, division', icon: Key, color: '#d97706', bg: '#fffbeb' },
  { id: 'notaire', label: 'Notaire', desc: 'Étude, clerc, collaborateur', icon: Scale, color: '#0f2d3d', bg: '#f4f7f9' },
  { id: 'autre', label: 'Autre professionnel', desc: 'Courtier, chasseur, expert...', icon: HelpCircle, color: '#64748b', bg: '#f8fafc' },
];

const reseaux = ['Indépendant', 'IAD', 'Capifrance', 'SAFTI', 'Optimhome', 'Mégagence', 'Effective', 'Proprietes-Privees', 'Laforêt', 'Century 21', 'Orpi', 'Stéphane Plaza', 'Guy Hoquet', 'Foncia', 'L\'Adresse', 'Autre réseau'];
const taillesAgence = ['Solo (1 personne)', '2-5 collaborateurs', '6-15 collaborateurs', '16-50 collaborateurs', 'Plus de 50'];
const volumes = ['1-3 dossiers / mois', '4-10 dossiers / mois', '11-25 dossiers / mois', '26-50 dossiers / mois', 'Plus de 50 / mois'];
const interetsList = [
  { id: 'gain_temps', label: 'Gagner du temps sur l\'analyse de documents', icon: '⚡' },
  { id: 'image_pro', label: 'Renforcer mon image professionnelle auprès des clients', icon: '🎯' },
  { id: 'detection_risques', label: 'Mieux détecter les risques juridiques d\'un dossier', icon: '🛡️' },
  { id: 'prepa_visite', label: 'Préparer mes visites avec un dossier complet', icon: '📋' },
  { id: 'argumentaire', label: 'Solidifier mon argumentaire de vente', icon: '💪' },
  { id: 'cobranding', label: 'Personnaliser les rapports envoyés aux clients', icon: '✨' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 11,
  border: '1.5px solid #edf2f7',
  background: '#fff',
  fontSize: 15,
  color: '#0f172a',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13.5,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 8,
  letterSpacing: '0.01em',
};

function Field({ label, required, children, helper }: { label: string; required?: boolean; children: React.ReactNode; helper?: string }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {helper && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5, fontStyle: 'italic' }}>{helper}</div>}
    </div>
  );
}

/* Pilules horizontales — pour listes courtes (3-6 options) */
function PillSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const active = value === o;
        return (
          <button key={o} type="button" onClick={() => onChange(active ? '' : o)}
            style={{
              padding: '8px 14px',
              borderRadius: 100,
              border: active ? '1.5px solid #2a7d9c' : '1.5px solid #edf2f7',
              background: active ? '#f0f7fb' : '#fff',
              color: active ? '#0c447c' : '#475569',
              fontSize: 12.5,
              fontWeight: active ? 700 : 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* Variante responsive de GridSelect — desktop 4 cols, mobile 2 cols (via classe reseaux-grid) */
function GridSelectResponsive({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="reseaux-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      {options.map(o => {
        const active = value === o;
        return (
          <button key={o} type="button" onClick={() => onChange(active ? '' : o)}
            style={{
              padding: '10px 8px',
              borderRadius: 9,
              border: active ? '1.5px solid #2a7d9c' : '1.5px solid #edf2f7',
              background: active ? '#f0f7fb' : '#fff',
              color: active ? '#0c447c' : '#475569',
              fontSize: 11.5,
              fontWeight: active ? 700 : 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: 36,
            }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* Validation helpers */
function isValidEmail(v: string): boolean {
  // Email basique : doit contenir @ et au moins un . après @
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhone(v: string): boolean {
  // Exactement 10 chiffres (espaces et tirets autorisés mais ignorés)
  const digits = v.replace(/\D/g, '');
  return digits.length === 10;
}

/* Bloc de section pour structurer visuellement l'étape 3 (Activité) */
function SectionBlock({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="section-block" style={{
      padding: '18px 20px',
      borderRadius: 14,
      background: '#fafbfc',
      border: '1px solid #edf2f7',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: '#fff', border: '1px solid #e0eaf0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="section-block-title" style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   SiretLookup — Champ SIRET avec auto-vérif via API gouv
   ─────────────────────────────────────────
   Dès que 14 chiffres sont saisis → appel à recherche-entreprises.api.gouv.fr
   Affiche une carte verte avec les infos officielles (nom, adresse, activité).
   Si pas trouvé → message neutre, l'utilisateur peut continuer quand même.
   API gratuite, sans clé, publique. */
type SiretInfo = {
  nom: string;
  adresse: string;
  activite: string;
  active: boolean;
};

function SiretLookup({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [info, setInfo] = useState<SiretInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Format affiché : "123 456 789 00012"
  const formatSiret = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{3})/, '$1 ')
      .replace(/^(\d{3}) (\d{3})/, '$1 $2 ')
      .replace(/^(\d{3}) (\d{3}) (\d{3})/, '$1 $2 $3 ')
      .trim();
  };

  const handleChange = (raw: string) => {
    const formatted = formatSiret(raw);
    onChange(formatted);

    const digits = formatted.replace(/\D/g, '');

    // Annule l'appel précédent si l'utilisateur retape
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // Reset l'état si on n'a pas encore les 14 chiffres
    if (digits.length < 14) {
      setInfo(null);
      setNotFound(false);
      setLoading(false);
      return;
    }

    // 14 chiffres → on lance la recherche
    setLoading(true);
    setNotFound(false);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${digits}&page=1&per_page=1`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const result = data?.results?.[0];
        if (!result) {
          setInfo(null);
          setNotFound(true);
          setLoading(false);
          return;
        }
        // Trouver l'établissement qui matche le SIRET (siège ou matching)
        const matching = result.matching_etablissements?.find((e: any) => e.siret === digits) || result.siege;
        setInfo({
          nom: result.nom_complet || result.nom_raison_sociale || '',
          adresse: matching?.adresse || result.siege?.adresse || '',
          activite: result.activite_principale || matching?.activite_principale || '',
          active: matching?.etat_administratif === 'A' || result.siege?.etat_administratif === 'A',
        });
        setNotFound(false);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setInfo(null);
        setNotFound(true);
        setLoading(false);
      });
  };

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <Hash size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
        <input
          style={{ ...inputStyle, paddingLeft: 38, paddingRight: loading ? 42 : 16 }}
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder || '123 456 789 00012'}
          inputMode="numeric"
          maxLength={17}
        />
        {loading && (
          <Loader2 size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#2a7d9c', animation: 'spin 1s linear infinite' }} />
        )}
      </div>
      <style>{`@keyframes spin { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }`}</style>

      {/* Carte résultat — entreprise trouvée */}
      {info && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            marginTop: 8,
            padding: '12px 14px',
            borderRadius: 10,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <CheckCircle size={18} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
              {info.nom}
            </div>
            {info.adresse && (
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                {info.adresse}
              </div>
            )}
            {info.activite && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                {info.activite}
                {!info.active && <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: 6 }}>· Fermée</span>}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Pas trouvé */}
      {notFound && !loading && (
        <div style={{
          marginTop: 8,
          padding: '10px 12px',
          borderRadius: 10,
          background: '#fffbeb',
          border: '1px solid #fde68a',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <AlertCircle size={15} style={{ color: '#d97706', flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: '#92400e' }}>
            SIRET non trouvé dans l'annuaire officiel. Vous pouvez quand même envoyer votre demande.
          </div>
        </div>
      )}
    </div>
  );
}

export default function RejoindrePage() {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('type') || '';
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState(preselected || '');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  // Etape 2 — Coordonnees
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [ville, setVille] = useState('');

  // Etape 3 — Activite (commun + specifique)
  const [volume, setVolume] = useState('');
  // Agent
  const [nomAgence, setNomAgence] = useState('');
  const [reseau, setReseau] = useState('');
  const [tailleAgence, setTailleAgence] = useState('');
  const [rsac, setRsac] = useState('');
  // Investisseur
  const [nomSociete, setNomSociete] = useState('');
  const [siret, setSiret] = useState('');
  const [typeBien, setTypeBien] = useState('');
  // Marchand
  const [nomSocieteMarchand, setNomSocieteMarchand] = useState('');
  const [siretMarchand, setSiretMarchand] = useState('');
  const [zoneMarchand, setZoneMarchand] = useState('');
  // Notaire
  const [nomEtude, setNomEtude] = useState('');
  const [fonction, setFonction] = useState('');
  // Autre
  const [profession, setProfession] = useState('');
  const [nomStructure, setNomStructure] = useState('');

  // Etape 4 — Besoins
  const [interets, setInterets] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [rgpd, setRgpd] = useState(false);

  const activeProfile = profileTypes.find(p => p.id === profileType);

  /* Forcer navbar blanche au-dessus du hero sombre pour lisibilite */
  useEffect(() => {
    const nav = document.querySelector('header nav') as HTMLElement | null;
    if (nav) {
      nav.style.backgroundColor = 'rgba(255,255,255,0.97)';
      nav.style.backdropFilter = 'none';
      (nav.style as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter = 'none';
    }
    return () => {
      if (nav) {
        nav.style.backgroundColor = '';
        nav.style.backdropFilter = '';
        (nav.style as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter = '';
      }
    };
  }, []);

  /* Scroll top a chaque changement d'etape */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, sent]);

  const toggleInteret = (id: string) => {
    setInterets(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const canContinue1 = !!profileType;
  const canContinue2 = !!(nom && prenom && isValidEmail(email) && isValidPhone(telephone));
  const canSubmit = canContinue1 && canContinue2 && rgpd;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);

    const profileData: Record<string, unknown> = { volume: volume || null };
    if (profileType === 'agent') {
      Object.assign(profileData, { nomAgence, reseau, tailleAgence, rsac });
    } else if (profileType === 'investisseur') {
      Object.assign(profileData, { nomSociete, siret, typeBien });
    } else if (profileType === 'marchand') {
      Object.assign(profileData, { nomSociete: nomSocieteMarchand, siret: siretMarchand, zoneGeographique: zoneMarchand });
    } else if (profileType === 'notaire') {
      Object.assign(profileData, { nomEtude, fonction });
    } else {
      Object.assign(profileData, { profession, nomStructure });
    }
    profileData.interets = interets;

    try {
      await supabase.from('contact_pro').insert({
        profile_type: profileType,
        nom, prenom, email, telephone, ville: ville || null,
        volume: volume || null, message: message || null,
        profile_data: profileData,
        rgpd_consent: rgpd,
      });

      // Envoi des emails de confirmation (prospect + notification interne)
      // Non bloquant : si l'envoi mail échoue, on affiche quand même la confirmation
      // car la demande est bien enregistrée dans contact_pro
      try {
        await supabase.functions.invoke('send-pro-request-confirmation', {
          body: {
            prenom, nom, email, telephone,
            ville: ville || null,
            profile_type: profileType,
            profile_data: profileData,
            message: message || null,
          },
        });
      } catch (mailErr) {
        console.error('Envoi email échoué (demande enregistrée quand même):', mailErr);
      }

      setSent(true);
    } catch (err) {
      console.error('Erreur envoi', err);
    } finally {
      setSending(false);
    }
  };

  // ========================================
  // ECRAN DE CONFIRMATION
  // ========================================
  if (sent) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* FOND UNIQUE — gradient continu sans coupure */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #061826 0%, #0a2336 10%, #0f2d3d 20%, #15405a 30%, #1f5878 42%, #3a7d9a 55%, #7eafc4 68%, #c5dce5 78%, #f5f9fb 88%, #f5f9fb 100%)',
          zIndex: 0,
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500, opacity: 0.3, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)', backgroundSize: '32px 32px', maskImage: 'linear-gradient(180deg, #000 0%, #000 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 60%, transparent 100%)' }} />
          <div style={{ position: 'absolute', top: -100, left: '50%', width: 700, height: 600, borderRadius: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(125,211,252,0.2) 0%, transparent 65%)', pointerEvents: 'none' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 10, padding: '120px 24px 60px', maxWidth: 680, margin: '0 auto' }}>
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ background: '#fff', borderRadius: 22, border: '1px solid rgba(15, 45, 61, 0.06)', padding: '52px 44px', textAlign: 'center', boxShadow: '0 24px 64px rgba(15, 45, 61, 0.15), 0 4px 16px rgba(15, 45, 61, 0.06)' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 18 }}
              style={{ width: 92, height: 92, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 32px rgba(22, 163, 74, 0.3)' }}
            >
              <CheckCircle size={46} style={{ color: '#fff' }} strokeWidth={2.5} />
            </motion.div>

            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', margin: '0 0 14px', letterSpacing: '-0.025em' }}>
              Votre demande est bien arrivée
            </h1>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65, margin: '0 0 36px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
              Notre équipe vous recontacte <strong style={{ color: '#0f172a' }}>rapidement</strong> pour un échange personnalisé. Un email de confirmation vient d'être envoyé à <strong style={{ color: '#2a7d9c' }}>{email}</strong>.
            </p>

            <div style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f0f7fb 100%)', borderRadius: 16, padding: '24px 28px', textAlign: 'left', marginBottom: 32, border: '1px solid rgba(42, 125, 156, 0.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Les prochaines étapes</div>
              {[
                { step: '1', label: 'Vérification de votre dossier', sub: 'Étape rapide', icon: '🔍' },
                { step: '2', label: 'Appel découverte (15 min)', sub: 'Pour comprendre vos besoins et vous présenter Verimo Pro', icon: '📞' },
                { step: '3', label: 'Accès à votre espace pro', sub: 'Votre compte est créé après notre échange', icon: '🎁' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingTop: i > 0 ? 16 : 0, borderTop: i > 0 ? '0.5px solid rgba(42, 125, 156, 0.15)' : 'none', marginTop: i > 0 ? 16 : 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', border: '1.5px solid #c7dde8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: '#2a7d9c' }}>{s.step}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{s.icon} {s.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/')}
              style={{ padding: '14px 30px', borderRadius: 12, background: 'linear-gradient(135deg, #0f2d3d, #1a4a5e)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(15, 45, 61, 0.2)' }}>
              Retour à l'accueil <ChevronRight size={16} />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ========================================
  // FORMULAIRE MULTI-STEP
  // ========================================
  const stepLabels = ['Profil', 'Coordonnées', 'Activité', 'Besoins'];

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* FOND UNIQUE — un seul gradient continu du sombre au clair sur toute la page, sans coupure */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #061826 0%, #0a2336 10%, #0f2d3d 20%, #15405a 30%, #1f5878 42%, #3a7d9a 55%, #7eafc4 68%, #c5dce5 78%, #f5f9fb 88%, #f5f9fb 100%)',
        zIndex: 0,
      }}>
        {/* Pattern de points — limité au haut, fondu progressif */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500, opacity: 0.3, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)', backgroundSize: '32px 32px', maskImage: 'linear-gradient(180deg, #000 0%, #000 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 60%, transparent 100%)' }} />
        {/* Halo central */}
        <div style={{ position: 'absolute', top: -100, left: '50%', width: 700, height: 600, borderRadius: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(125,211,252,0.2) 0%, transparent 65%)', pointerEvents: 'none' }} />
        {/* Halo droite */}
        <div style={{ position: 'absolute', top: 120, right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
      </div>

      {/* CONTENU — padding top suffisant pour ne pas être masqué par navbar */}
      <div style={{ position: 'relative', zIndex: 10, padding: '120px 24px 50px', maxWidth: 880, margin: '0 auto' }}>
        <style>{`
          @media (max-width: 700px) {
            .profil-grid { grid-template-columns: 1fr !important; }
            .form-content { padding: 22px 18px !important; }
            .form-header { padding: 14px 18px 12px !important; }
            .step2-row { grid-template-columns: 1fr !important; }
            .step3-row { grid-template-columns: 1fr !important; }
            .reseaux-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .step-h2 { font-size: 19px !important; }
            .step-subtitle { font-size: 13px !important; }
            .step-icon-wrap { width: 38px !important; height: 38px !important; }
            .interets-grid { grid-template-columns: 1fr !important; }
            .nav-row { padding: 0 !important; }
            .nav-btn-back { padding: 12px 18px !important; font-size: 14px !important; }
            .nav-btn-next { padding: 12px 22px !important; font-size: 14px !important; }
            .section-block { padding: 14px !important; }
            .section-block-title { font-size: 14px !important; }
          }
        `}</style>

        {/* HEADER — compacte */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.95)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, backdropFilter: 'blur(8px)' }}
          >
            <Sparkles size={12} style={{ color: '#7dd3fc' }} /> Offre Professionnelle
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ fontSize: 'clamp(26px, 3.8vw, 38px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.025em', lineHeight: 1.1 }}
          >
            Rejoindre{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ color: '#7dd3fc', position: 'relative', zIndex: 1 }}>Verimo Pro</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 4, borderRadius: 100, background: 'rgba(125,211,252,0.4)', transformOrigin: 'left' }}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}
          >
            Quelques étapes simples pour rejoindre les pros qui font confiance à Verimo au quotidien.
          </motion.p>
        </div>

        {/* CARTE FORMULAIRE UNIFIÉE — progress + contenu étape */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(15, 45, 61, 0.06)', overflow: 'hidden', marginBottom: 14, boxShadow: '0 24px 64px rgba(15, 45, 61, 0.12), 0 4px 16px rgba(15, 45, 61, 0.04)' }}
        >
          {/* Header de la carte avec progress bar intégrée */}
          <div className="form-header" style={{ padding: '18px 32px 16px', borderBottom: '0.5px solid #edf2f7', background: 'linear-gradient(180deg, #fafbfc 0%, #fff 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#2a7d9c', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Étape {step} sur 4</span>
                <span style={{ color: '#cbd5e1' }}>·</span>
                <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>{stepLabels[step - 1]}</span>
              </div>
              <span style={{ fontSize: 14, color: '#2a7d9c', fontWeight: 800 }}>{Math.round((step / 4) * 100)}%</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{ flex: 1, height: 6, borderRadius: 100, background: s <= step ? 'linear-gradient(90deg, #2a7d9c, #7dd3fc)' : '#edf2f7', transition: 'background 0.3s' }} />
              ))}
            </div>
          </div>

          {/* CONTENU ETAPE — slide animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="form-content"
              style={{ padding: '28px 32px' }}
            >
            {/* ========== ETAPE 1 — PROFIL ========== */}
            {step === 1 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                  <div className="step-icon-wrap" style={{ width: 44, height: 44, borderRadius: 11, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Briefcase size={20} style={{ color: '#2a7d9c' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="step-h2" style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Quel est votre profil ?</h2>
                    <p className="step-subtitle" style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Choisissez votre activité pour adapter l'accompagnement</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="profil-grid">
                  {profileTypes.map(p => {
                    const Icon = p.icon;
                    const active = profileType === p.id;
                    return (
                      <button key={p.id} type="button" onClick={() => setProfileType(p.id)}
                        style={{
                          padding: '18px 20px',
                          borderRadius: 13,
                          border: active ? `2px solid ${p.color}` : '1.5px solid #edf2f7',
                          background: active ? p.bg : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                        }}>
                        <div style={{ width: 46, height: 46, borderRadius: 11, background: active ? p.color : p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                          <Icon size={20} style={{ color: active ? '#fff' : p.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: active ? p.color : '#0f172a', marginBottom: 3 }}>{p.label}</div>
                          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.45 }}>{p.desc}</div>
                        </div>
                        {active && <CheckCircle size={20} style={{ color: p.color, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                  {/* 6e case : bouton Continuer intégré dans la grille */}
                  <button type="button" onClick={() => setStep(2)} disabled={!canContinue1}
                    style={{
                      padding: '18px 20px',
                      borderRadius: 13,
                      border: 'none',
                      background: canContinue1 ? 'linear-gradient(135deg, #2a7d9c, #0c447c)' : '#e2e8f0',
                      cursor: canContinue1 ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      color: canContinue1 ? '#fff' : '#94a3b8',
                      fontSize: 16,
                      fontWeight: 700,
                      boxShadow: canContinue1 ? '0 6px 20px rgba(42, 125, 156, 0.3)' : 'none',
                      minHeight: 82,
                    }}>
                    {canContinue1 ? <>Continuer <ChevronRight size={20} /></> : <>Choisissez un profil</>}
                  </button>
                </div>
              </div>
            )}

            {/* ========== ETAPE 2 — COORDONNEES ========== */}
            {step === 2 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                  <div className="step-icon-wrap" style={{ width: 44, height: 44, borderRadius: 11, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={20} style={{ color: '#2a7d9c' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="step-h2" style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Vos coordonnées</h2>
                    <p className="step-subtitle" style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Pour vous recontacter rapidement</p>
                  </div>
                </div>
                <div className="step2-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <Field label="Prénom" required>
                    <input style={inputStyle} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Votre prénom" />
                  </Field>
                  <Field label="Nom" required>
                    <input style={inputStyle} value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom" />
                  </Field>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <Field label="Email professionnel" required helper={email && !isValidEmail(email) ? "Format d'email invalide" : undefined}>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: email && !isValidEmail(email) ? '#ef4444' : '#94a3b8', pointerEvents: 'none' }} />
                      <input style={{ ...inputStyle, paddingLeft: 38, borderColor: email && !isValidEmail(email) ? '#fecaca' : '#edf2f7' }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.fr" />
                    </div>
                  </Field>
                </div>
                <div className="step2-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 14 }}>
                  <Field label="Téléphone" required helper={telephone && !isValidPhone(telephone) ? `${telephone.replace(/\D/g, '').length}/10 chiffres` : undefined}>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: telephone && !isValidPhone(telephone) ? '#ef4444' : '#94a3b8', pointerEvents: 'none' }} />
                      <input style={{ ...inputStyle, paddingLeft: 38, borderColor: telephone && !isValidPhone(telephone) ? '#fecaca' : '#edf2f7' }} type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 12 34 56 78" maxLength={14} />
                    </div>
                  </Field>
                  <Field label="Ville / Région">
                    <div style={{ position: 'relative' }}>
                      <MapPin size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                      <input style={{ ...inputStyle, paddingLeft: 38 }} value={ville} onChange={e => setVille(e.target.value)} placeholder="Votre ville" />
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* ========== ETAPE 3 — ACTIVITE ========== */}
            {step === 3 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                  <div className="step-icon-wrap" style={{ width: 44, height: 44, borderRadius: 11, background: activeProfile?.bg || '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {activeProfile && <activeProfile.icon size={20} style={{ color: activeProfile.color }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="step-h2" style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Votre activité</h2>
                    <p className="step-subtitle" style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Tous ces champs sont optionnels</p>
                  </div>
                </div>

                {profileType === 'agent' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Bloc 1 — Identité professionnelle */}
                    <SectionBlock
                      icon={<Building2 size={15} style={{ color: '#2a7d9c' }} />}
                      title="Identité professionnelle"
                      subtitle="Votre agence et vos identifiants"
                    >
                      <div className="step3-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label="Nom de votre agence" helper="Laissez vide si vous êtes indépendant">
                          <input style={inputStyle} value={nomAgence} onChange={e => setNomAgence(e.target.value)} placeholder="Nom de votre agence" />
                        </Field>
                        <Field label="N° RSAC" helper="Si vous en avez un">
                          <input style={inputStyle} value={rsac} onChange={e => setRsac(e.target.value)} placeholder="123 456 789" />
                        </Field>
                      </div>
                      <Field label="SIRET" helper="Optionnel — accélère la validation de votre compte">
                        <SiretLookup value={siret} onChange={setSiret} />
                      </Field>
                    </SectionBlock>

                    {/* Bloc 2 — Réseau et structure */}
                    <SectionBlock
                      icon={<Users size={15} style={{ color: '#2a7d9c' }} />}
                      title="Réseau et structure"
                      subtitle="Votre rattachement et la taille de votre équipe"
                    >
                      <Field label="Réseau d'appartenance">
                        <GridSelectResponsive value={reseau} onChange={setReseau} options={reseaux} />
                      </Field>
                      <Field label="Taille de la structure">
                        <PillSelect value={tailleAgence} onChange={setTailleAgence} options={taillesAgence} />
                      </Field>
                    </SectionBlock>

                    {/* Bloc 3 — Activité */}
                    <SectionBlock
                      icon={<BarChart3 size={15} style={{ color: '#2a7d9c' }} />}
                      title="Volume d'activité"
                      subtitle="Combien de dossiers traitez-vous en moyenne"
                    >
                      <Field label="Volume de dossiers traités par mois">
                        <PillSelect value={volume} onChange={setVolume} options={volumes} />
                      </Field>
                    </SectionBlock>
                  </div>
                )}

                {profileType === 'investisseur' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <SectionBlock
                      icon={<Building2 size={15} style={{ color: '#7c3aed' }} />}
                      title="Identité de votre société"
                      subtitle="Si vous investissez en SCI ou en société"
                    >
                      <Field label="Nom de votre société" helper="Si vous investissez en SCI ou en société">
                        <input style={inputStyle} value={nomSociete} onChange={e => setNomSociete(e.target.value)} placeholder="Nom de votre société" />
                      </Field>
                      <Field label="SIRET" helper="Optionnel — accélère la validation de votre compte">
                        <SiretLookup value={siret} onChange={setSiret} />
                      </Field>
                    </SectionBlock>

                    <SectionBlock
                      icon={<Target size={15} style={{ color: '#7c3aed' }} />}
                      title="Stratégie d'investissement"
                      subtitle="Vos cibles et votre rythme"
                    >
                      <Field label="Type de biens visés">
                        <input style={inputStyle} value={typeBien} onChange={e => setTypeBien(e.target.value)} placeholder="Ex : appartement T2-T3 en région parisienne" />
                      </Field>
                      <Field label="Volume d'acquisitions par an">
                        <PillSelect value={volume} onChange={setVolume} options={volumes.map(v => v.replace('/ mois', '/ an'))} />
                      </Field>
                    </SectionBlock>
                  </div>
                )}

                {profileType === 'marchand' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <SectionBlock
                      icon={<Building2 size={15} style={{ color: '#d97706' }} />}
                      title="Identité de votre société"
                      subtitle="Vos coordonnées professionnelles"
                    >
                      <Field label="Nom de votre société">
                        <input style={inputStyle} value={nomSocieteMarchand} onChange={e => setNomSocieteMarchand(e.target.value)} placeholder="Nom de votre société" />
                      </Field>
                      <Field label="SIRET" helper="Optionnel — accélère la validation de votre compte">
                        <SiretLookup value={siretMarchand} onChange={setSiretMarchand} />
                      </Field>
                    </SectionBlock>

                    <SectionBlock
                      icon={<MapPin size={15} style={{ color: '#d97706' }} />}
                      title="Zone et volume"
                      subtitle="Où et combien d'opérations menez-vous"
                    >
                      <Field label="Zone géographique d'activité">
                        <input style={inputStyle} value={zoneMarchand} onChange={e => setZoneMarchand(e.target.value)} placeholder="Ex : Île-de-France" />
                      </Field>
                      <Field label="Volume d'opérations par an">
                        <PillSelect value={volume} onChange={setVolume} options={volumes.map(v => v.replace('/ mois', '/ an'))} />
                      </Field>
                    </SectionBlock>
                  </div>
                )}

                {profileType === 'notaire' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <SectionBlock
                      icon={<Scale size={15} style={{ color: '#0f2d3d' }} />}
                      title="Votre étude"
                      subtitle="Identité et rattachement"
                    >
                      <Field label="Nom de l'étude">
                        <input style={inputStyle} value={nomEtude} onChange={e => setNomEtude(e.target.value)} placeholder="Nom de votre étude" />
                      </Field>
                      <Field label="Votre fonction">
                        <PillSelect value={fonction} onChange={setFonction} options={['Notaire', 'Notaire assistant', 'Clerc de notaire', 'Collaborateur', 'Autre']} />
                      </Field>
                    </SectionBlock>

                    <SectionBlock
                      icon={<BarChart3 size={15} style={{ color: '#0f2d3d' }} />}
                      title="Volume d'activité"
                      subtitle="Combien de transactions traitez-vous"
                    >
                      <Field label="Volume de transactions par mois">
                        <PillSelect value={volume} onChange={setVolume} options={volumes} />
                      </Field>
                    </SectionBlock>
                  </div>
                )}

                {profileType === 'autre' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <SectionBlock
                      icon={<Briefcase size={15} style={{ color: '#64748b' }} />}
                      title="Votre activité"
                      subtitle="Décrivez votre profession et votre structure"
                    >
                      <div className="step3-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label="Votre profession">
                          <input style={inputStyle} value={profession} onChange={e => setProfession(e.target.value)} placeholder="Courtier, chasseur, expert..." />
                        </Field>
                        <Field label="Nom de votre structure">
                          <input style={inputStyle} value={nomStructure} onChange={e => setNomStructure(e.target.value)} placeholder="Votre société ou activité" />
                        </Field>
                      </div>
                    </SectionBlock>

                    <SectionBlock
                      icon={<BarChart3 size={15} style={{ color: '#64748b' }} />}
                      title="Volume d'activité"
                      subtitle="Combien de dossiers traitez-vous"
                    >
                      <Field label="Volume estimé par mois">
                        <PillSelect value={volume} onChange={setVolume} options={volumes} />
                      </Field>
                    </SectionBlock>
                  </div>
                )}
              </div>
            )}

            {/* ========== ETAPE 4 — BESOINS ========== */}
            {step === 4 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                  <div className="step-icon-wrap" style={{ width: 44, height: 44, borderRadius: 11, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Target size={20} style={{ color: '#2a7d9c' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="step-h2" style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Vos besoins <span style={{ fontSize: 13, color: '#2a7d9c', fontWeight: 600, marginLeft: 6 }}>· Dernière étape</span></h2>
                    <p className="step-subtitle" style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Sélectionnez tout ce qui vous intéresse</p>
                  </div>
                </div>

                <div className="interets-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {interetsList.map(item => {
                    const checked = interets.includes(item.id);
                    return (
                      <button key={item.id} type="button" onClick={() => toggleInteret(item.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 11,
                          border: checked ? '2px solid #2a7d9c' : '1.5px solid #edf2f7',
                          background: checked ? '#f0f7fb' : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          fontSize: 12.5,
                          color: checked ? '#0c447c' : '#334155',
                          fontWeight: checked ? 600 : 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'all 0.15s',
                        }}>
                        <span style={{ fontSize: 16 }}>{item.icon}</span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {checked && <CheckCircle size={15} style={{ color: '#2a7d9c', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginBottom: 18 }}>
                  <Field label="Un message ou une question ? (optionnel)">
                    <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Précisez vos besoins, vos contraintes, ou toute question que vous souhaitez aborder lors de l'appel..."
                      style={{ ...inputStyle, minHeight: 90, resize: 'vertical', padding: '12px 15px', lineHeight: 1.5 }} />
                  </Field>
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: rgpd ? '#f0f7fb' : '#fafbfc', border: `1.5px solid ${rgpd ? '#c7dde8' : '#edf2f7'}`, borderRadius: 11, cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={rgpd} onChange={e => setRgpd(e.target.checked)} style={{ marginTop: 2, accentColor: '#2a7d9c', cursor: 'pointer', width: 16, height: 16, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.55 }}>
                    J'accepte que mes données soient traitées par Verimo dans le cadre de cette demande. Elles ne seront ni revendues ni utilisées à d'autres fins. <Link to="/confidentialite" style={{ color: '#2a7d9c', textDecoration: 'underline' }}>Politique de confidentialité</Link>
                  </span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </motion.div>

        {/* NAVIGATION ETAPES — uniquement à partir de l'étape 2 (étape 1 a son bouton intégré dans la grille) */}
        {step > 1 && (
        <div className="nav-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button onClick={() => setStep(step - 1)}
            className="nav-btn-back"
            style={{ padding: '14px 24px', borderRadius: 12, background: '#fff', color: '#64748b', fontSize: 15, fontWeight: 700, border: '1.5px solid #edf2f7', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <ChevronLeft size={17} /> Retour
          </button>

          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={step === 2 ? !canContinue2 : false}
              className="nav-btn-next"
              style={{
                padding: '14px 30px',
                borderRadius: 12,
                background: (step === 2 ? canContinue2 : true) ? 'linear-gradient(135deg, #2a7d9c, #0c447c)' : '#cbd5e1',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                cursor: (step === 2 ? canContinue2 : true) ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                transition: 'background 0.15s',
                boxShadow: (step === 2 ? canContinue2 : true) ? '0 6px 20px rgba(42, 125, 156, 0.3)' : 'none',
              }}>
              Continuer <ChevronRight size={17} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canSubmit || sending}
              className="nav-btn-next"
              style={{
                padding: '14px 30px',
                borderRadius: 12,
                background: canSubmit && !sending ? 'linear-gradient(135deg, #2a7d9c, #0c447c)' : '#cbd5e1',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                cursor: canSubmit && !sending ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s',
                boxShadow: canSubmit && !sending ? '0 6px 20px rgba(42, 125, 156, 0.3)' : 'none',
              }}>
              {sending ? 'Envoi en cours...' : <>Envoyer ma demande <Send size={16} /></>}
            </button>
          )}
        </div>
        )}

      </div>
    </div>
  );
}
