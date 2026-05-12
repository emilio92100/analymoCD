import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, TrendingUp, Key, Scale, HelpCircle,
  User, Briefcase, Target, CheckCircle, ChevronLeft, ChevronRight,
  Mail, Phone, MapPin, Sparkles, Shield, Send,
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
  padding: '12px 15px',
  borderRadius: 11,
  border: '1.5px solid #edf2f7',
  background: '#fff',
  fontSize: 14,
  color: '#0f172a',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 7,
  letterSpacing: '0.01em',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, appearance: 'none' as const, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36, cursor: 'pointer' }}>
      <option value="">{placeholder || 'Sélectionner...'}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
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

  /* Forcer navbar blanche */
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
  const canContinue2 = !!(nom && prenom && email && telephone);
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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f5f9fb 0%, #fff 100%)', padding: '60px 20px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ background: '#fff', borderRadius: 24, border: '1px solid #edf2f7', padding: '50px 40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(15, 45, 61, 0.04)' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 18 }}
              style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.25)' }}
            >
              <CheckCircle size={44} style={{ color: '#fff' }} strokeWidth={2.5} />
            </motion.div>

            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
              Votre demande est bien arrivée
            </h1>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65, margin: '0 0 32px', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
              Notre équipe vous recontacte sous <strong style={{ color: '#0f172a' }}>24h ouvrées</strong> pour un échange personnalisé. Un email de confirmation vient d'être envoyé à <strong style={{ color: '#2a7d9c' }}>{email}</strong>.
            </p>

            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '20px 24px', textAlign: 'left', marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Les prochaines étapes</div>
              {[
                { step: '1', label: 'Vérification de votre dossier', sub: 'Sous 24h ouvrées', icon: '🔍' },
                { step: '2', label: 'Appel découverte (15 min)', sub: 'Pour comprendre vos besoins et vous présenter Verimo Pro', icon: '📞' },
                { step: '3', label: 'Accès à votre espace pro', sub: 'Avec 3 analyses offertes pour démarrer', icon: '🎁' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingTop: i > 0 ? 14 : 0, borderTop: i > 0 ? '0.5px solid #edf2f7' : 'none', marginTop: i > 0 ? 14 : 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: '#2a7d9c' }}>{s.step}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{s.icon} {s.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/')}
              style={{ padding: '13px 28px', borderRadius: 12, background: '#0f2d3d', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f5f9fb 0%, #fff 100%)', padding: '40px 20px 60px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 100, background: '#2a7d9c', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
            <Sparkles size={12} /> Verimo Pro
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Rejoindre Verimo Pro</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            Quelques étapes simples pour rejoindre la communauté des pros de l'immobilier qui font confiance à Verimo.
          </p>
        </div>

        {/* PROGRESS BAR */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '16px 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Étape {step} sur 4</span>
            <span style={{ fontSize: 11.5, color: '#2a7d9c', fontWeight: 700 }}>{Math.round((step / 4) * 100)}%</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 100, background: s <= step ? '#2a7d9c' : '#edf2f7', transition: 'background 0.3s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {stepLabels.map((label, i) => (
              <span key={i} style={{ fontSize: 10.5, fontWeight: 600, color: i + 1 < step ? '#2a7d9c' : i + 1 === step ? '#0f172a' : '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4 }}>
                {i + 1 < step && '✓'} {label}
              </span>
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
            style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '28px 30px', marginBottom: 14, boxShadow: '0 2px 8px rgba(15, 45, 61, 0.03)' }}
          >
            {/* ========== ETAPE 1 — PROFIL ========== */}
            {step === 1 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={18} style={{ color: '#2a7d9c' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Étape 1</div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Quel est votre profil ?</h2>
                  </div>
                </div>
                <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 22px', lineHeight: 1.55 }}>
                  Choisissez le profil qui correspond à votre activité. Nous adapterons notre accompagnement en conséquence.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                  {profileTypes.map(p => {
                    const Icon = p.icon;
                    const active = profileType === p.id;
                    return (
                      <button key={p.id} type="button" onClick={() => setProfileType(p.id)}
                        style={{
                          padding: '16px 18px',
                          borderRadius: 13,
                          border: active ? `2px solid ${p.color}` : '1.5px solid #edf2f7',
                          background: active ? p.bg : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 13,
                        }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: active ? p.color : p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                          <Icon size={18} style={{ color: active ? '#fff' : p.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: active ? p.color : '#0f172a', marginBottom: 2 }}>{p.label}</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>{p.desc}</div>
                        </div>
                        {active && <CheckCircle size={18} style={{ color: p.color, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========== ETAPE 2 — COORDONNEES ========== */}
            {step === 2 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} style={{ color: '#2a7d9c' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Étape 2</div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Vos coordonnées</h2>
                  </div>
                </div>
                <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 22px', lineHeight: 1.55 }}>
                  Quelques infos pour vous recontacter rapidement. Nous gardons vos données strictement confidentielles.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <Field label="Prénom" required>
                    <input style={inputStyle} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Alexandre" />
                  </Field>
                  <Field label="Nom" required>
                    <input style={inputStyle} value={nom} onChange={e => setNom(e.target.value)} placeholder="Dupont" />
                  </Field>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <Field label="Email professionnel" required>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                      <input style={{ ...inputStyle, paddingLeft: 38 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alexandre@agence.fr" />
                    </div>
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 14 }}>
                  <Field label="Téléphone" required>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                      <input style={{ ...inputStyle, paddingLeft: 38 }} type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 12 34 56 78" />
                    </div>
                  </Field>
                  <Field label="Ville / Région">
                    <div style={{ position: 'relative' }}>
                      <MapPin size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                      <input style={{ ...inputStyle, paddingLeft: 38 }} value={ville} onChange={e => setVille(e.target.value)} placeholder="Boulogne-Billancourt" />
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* ========== ETAPE 3 — ACTIVITE ========== */}
            {step === 3 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: activeProfile?.bg || '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activeProfile && <activeProfile.icon size={18} style={{ color: activeProfile.color }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Étape 3</div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Votre activité</h2>
                  </div>
                </div>
                <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 22px', lineHeight: 1.55 }}>
                  Ces informations nous permettent d'adapter notre offre à votre activité. Tous ces champs sont optionnels.
                </p>

                {profileType === 'agent' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Nom de votre agence ou activité">
                      <input style={inputStyle} value={nomAgence} onChange={e => setNomAgence(e.target.value)} placeholder="Emilio Immo" />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="Réseau d'appartenance">
                        <SelectField value={reseau} onChange={setReseau} options={reseaux} />
                      </Field>
                      <Field label="Taille de la structure">
                        <SelectField value={tailleAgence} onChange={setTailleAgence} options={taillesAgence} />
                      </Field>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                      <Field label="Volume de dossiers traités">
                        <SelectField value={volume} onChange={setVolume} options={volumes} />
                      </Field>
                      <Field label="N° RSAC (si applicable)">
                        <input style={inputStyle} value={rsac} onChange={e => setRsac(e.target.value)} placeholder="123 456 789" />
                      </Field>
                    </div>
                  </div>
                )}

                {profileType === 'investisseur' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Nom de votre société (si applicable)">
                      <input style={inputStyle} value={nomSociete} onChange={e => setNomSociete(e.target.value)} placeholder="SCI Patrimoine 75" />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="SIRET">
                        <input style={inputStyle} value={siret} onChange={e => setSiret(e.target.value)} placeholder="123 456 789 00012" />
                      </Field>
                      <Field label="Type de biens visés">
                        <input style={inputStyle} value={typeBien} onChange={e => setTypeBien(e.target.value)} placeholder="Appartement T2-T3 Paris" />
                      </Field>
                    </div>
                    <Field label="Volume d'acquisitions par an">
                      <SelectField value={volume} onChange={setVolume} options={volumes.map(v => v.replace('/ mois', '/ an'))} />
                    </Field>
                  </div>
                )}

                {profileType === 'marchand' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Nom de votre société">
                      <input style={inputStyle} value={nomSocieteMarchand} onChange={e => setNomSocieteMarchand(e.target.value)} placeholder="Marchand Immo Paris SAS" />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="SIRET">
                        <input style={inputStyle} value={siretMarchand} onChange={e => setSiretMarchand(e.target.value)} placeholder="123 456 789 00012" />
                      </Field>
                      <Field label="Zone géographique d'activité">
                        <input style={inputStyle} value={zoneMarchand} onChange={e => setZoneMarchand(e.target.value)} placeholder="Île-de-France" />
                      </Field>
                    </div>
                    <Field label="Volume d'opérations par an">
                      <SelectField value={volume} onChange={setVolume} options={volumes.map(v => v.replace('/ mois', '/ an'))} />
                    </Field>
                  </div>
                )}

                {profileType === 'notaire' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Nom de l'étude">
                      <input style={inputStyle} value={nomEtude} onChange={e => setNomEtude(e.target.value)} placeholder="Étude Notariale Dupont & Associés" />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="Votre fonction">
                        <SelectField value={fonction} onChange={setFonction} options={['Notaire', 'Notaire assistant', 'Clerc de notaire', 'Collaborateur', 'Autre']} />
                      </Field>
                      <Field label="Volume de transactions / mois">
                        <SelectField value={volume} onChange={setVolume} options={volumes} />
                      </Field>
                    </div>
                  </div>
                )}

                {profileType === 'autre' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Votre profession">
                      <input style={inputStyle} value={profession} onChange={e => setProfession(e.target.value)} placeholder="Courtier en immobilier, expert, chasseur immobilier..." />
                    </Field>
                    <Field label="Nom de votre structure">
                      <input style={inputStyle} value={nomStructure} onChange={e => setNomStructure(e.target.value)} placeholder="Nom de votre société ou activité" />
                    </Field>
                    <Field label="Volume estimé">
                      <SelectField value={volume} onChange={setVolume} options={volumes} />
                    </Field>
                  </div>
                )}
              </div>
            )}

            {/* ========== ETAPE 4 — BESOINS ========== */}
            {step === 4 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={18} style={{ color: '#2a7d9c' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Étape 4 — Dernière étape</div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Vos besoins</h2>
                  </div>
                </div>
                <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 18px', lineHeight: 1.55 }}>
                  Qu'est-ce qui vous intéresse le plus dans Verimo Pro ? Sélectionnez tout ce qui s'applique.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
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

        {/* NAVIGATION ETAPES */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)}
              style={{ padding: '12px 20px', borderRadius: 11, background: '#fff', color: '#64748b', fontSize: 13.5, fontWeight: 700, border: '1.5px solid #edf2f7', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ChevronLeft size={15} /> Retour
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={step === 1 ? !canContinue1 : step === 2 ? !canContinue2 : false}
              style={{
                padding: '12px 24px',
                borderRadius: 11,
                background: (step === 1 ? canContinue1 : step === 2 ? canContinue2 : true) ? '#2a7d9c' : '#cbd5e1',
                color: '#fff',
                fontSize: 13.5,
                fontWeight: 700,
                border: 'none',
                cursor: (step === 1 ? canContinue1 : step === 2 ? canContinue2 : true) ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.15s',
              }}>
              Continuer <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canSubmit || sending}
              style={{
                padding: '12px 24px',
                borderRadius: 11,
                background: canSubmit && !sending ? 'linear-gradient(135deg, #2a7d9c, #0c447c)' : '#cbd5e1',
                color: '#fff',
                fontSize: 13.5,
                fontWeight: 700,
                border: 'none',
                cursor: canSubmit && !sending ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                transition: 'all 0.15s',
              }}>
              {sending ? 'Envoi en cours...' : <>Envoyer ma demande <Send size={14} /></>}
            </button>
          )}
        </div>

        {/* BANDEAU RASSURANT */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edf2f7', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#64748b' }}>
          <Shield size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
          <span>Vos données sont protégées · <strong style={{ color: '#0f172a' }}>Aucun engagement</strong> à ce stade · Réponse sous 24h ouvrées</span>
        </div>

      </div>
    </div>
  );
}
