import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, TrendingUp, Scale, HelpCircle, Key,
  Send, CheckCircle, ArrowRight, ShieldCheck, Lock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';

/* ═══ TYPES DE PROFILS ═══════════════════════════════════════ */
const profileTypes = [
  { id: 'agent', label: 'Agent immobilier', emoji: '🏢', icon: Building2, color: '#2a7d9c', bg: '#f0f7fb' },
  { id: 'investisseur', label: 'Investisseur', emoji: '📈', icon: TrendingUp, color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'marchand', label: 'Marchand de bien', emoji: '🔑', icon: Key, color: '#d97706', bg: '#fffbeb' },
  { id: 'notaire', label: 'Notaire', emoji: '⚖️', icon: Scale, color: '#0f2d3d', bg: '#f4f7f9' },
  { id: 'autre', label: 'Autre professionnel', emoji: '💼', icon: HelpCircle, color: '#64748b', bg: '#f8fafc' },
];

const reseaux = ['Indépendant', 'Century 21', 'Orpi', 'IAD', 'Laforêt', 'Guy Hoquet', 'ERA', 'Keller Williams', 'RE/MAX', 'Autre'];
const taillesAgence = ['Seul(e)', '2-5 collaborateurs', '6-15 collaborateurs', '15+'];
const transactionsAgent = ['1-5 / mois', '5-15 / mois', '15-30 / mois', '30+ / mois'];

const statutsInvestisseur = ['Particulier investisseur', 'SCI', 'SAS / SARL', 'Marchand de biens', 'Autre'];
const acquisitionsAn = ['1-3 / an', '4-10 / an', '10-25 / an', '25+ / an'];
const typesBiens = ['Résidentiel', 'Commercial', 'Mixte', 'Immeuble de rapport'];
const strategies = ['Résidence locative', 'Achat-revente', 'Division', 'Colocation', 'Courte durée', 'Autre'];

const strategiesMarchand = ['Achat-revente', 'Division', 'Rénovation complète', 'Transformation d\'usage', 'Mixte'];
const operationsAn = ['1-3 / an', '4-10 / an', '10-20 / an', '20+ / an'];

const fonctionsNotaire = ['Notaire titulaire', 'Notaire associé', 'Notaire salarié', 'Clerc de notaire', 'Autre collaborateur'];
const taillesEtude = ['1 notaire', '2-3 notaires', '4-10 notaires', '10+'];
const transactionsNotaire = ['1-10 / mois', '10-30 / mois', '30-60 / mois', '60+ / mois'];

const volumes = ['1-5 analyses / mois', '5-15 analyses / mois', '15-50 analyses / mois', '50+ analyses / mois'];

/* ═══ COMPOSANTS FORM ════════════════════════════════════════ */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0',
  fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif", color: '#0f172a',
  background: '#fff', outline: 'none', transition: 'border-color 0.2s',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, appearance: 'none' as const, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function RadioCards({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string; emoji?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
      {options.map(o => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)}
          style={{
            padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: 'left',
            border: value === o.id ? '2px solid #2a7d9c' : '1.5px solid #e2e8f0',
            background: value === o.id ? '#f0f7fb' : '#fff',
            color: value === o.id ? '#2a7d9c' : '#64748b',
            cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
          {o.emoji && <span style={{ marginRight: 6 }}>{o.emoji}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}


/* ═══ PAGE ═══════════════════════════════════════════════════ */
export default function ContactProPage() {
  useSEO({
    title: 'Contact Pro — Verimo pour les professionnels de l’immobilier',
    description: "Agents, investisseurs, marchands de biens, notaires : discutons de votre besoin d'analyse de documents immobiliers à grande échelle.",
    canonical: '/contact-pro',
  });

  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('type') || '';

  const [profileType, setProfileType] = useState(preselected || '');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  // Champs communs
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [ville, setVille] = useState('');
  const [volume, setVolume] = useState('');
  const [message, setMessage] = useState('');
  const [rgpd, setRgpd] = useState(false);

  // Agent
  const [nomAgence, setNomAgence] = useState('');
  const [adresseAgence, setAdresseAgence] = useState('');
  const [reseau, setReseau] = useState('');
  const [tailleAgence, setTailleAgence] = useState('');
  const [transAgent, setTransAgent] = useState('');
  const [rsac, setRsac] = useState('');
  const [dejaAnalyse, setDejaAnalyse] = useState('');
  const [interetsAgent, setInteretsAgent] = useState<string[]>([]);

  // Investisseur
  const [nomSociete, setNomSociete] = useState('');
  const [statut, setStatut] = useState('');
  const [siret, setSiret] = useState('');
  const [acquisitions, setAcquisitions] = useState('');
  const [typeBien, setTypeBien] = useState('');
  const [strategie, setStrategie] = useState('');
  const [avecCourtier, setAvecCourtier] = useState('');
  const [interetsInvest, setInteretsInvest] = useState<string[]>([]);

  // Marchand de bien
  const [nomSocieteMarchand, setNomSocieteMarchand] = useState('');
  const [siretMarchand, setSiretMarchand] = useState('');
  const [operationsMarchand, setOperationsMarchand] = useState('');
  const [typeBienMarchand, setTypeBienMarchand] = useState('');
  const [strategieMarchand, setStrategieMarchand] = useState('');
  const [zoneMarchand, setZoneMarchand] = useState('');
  const [interetsMarchand, setInteretsMarchand] = useState<string[]>([]);

  // Notaire
  const [nomEtude, setNomEtude] = useState('');
  const [adresseEtude, setAdresseEtude] = useState('');
  const [fonction, setFonction] = useState('');
  const [tailleEtude, setTailleEtude] = useState('');
  const [transNotaire, setTransNotaire] = useState('');
  const [dejaOutils, setDejaOutils] = useState('');
  const [interetsNotaire, setInteretsNotaire] = useState<string[]>([]);

  // Autre
  const [profession, setProfession] = useState('');
  const [nomStructure, setNomStructure] = useState('');

  const toggleInterest = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter(v => v !== val) : [...list, val]);
  };

  const activeProfile = profileTypes.find(p => p.id === profileType);

  const handleSubmit = async () => {
    if (!profileType || !nom || !prenom || !email || !rgpd) return;
    setSending(true);

    const profileData: Record<string, unknown> = {};

    if (profileType === 'agent') {
      Object.assign(profileData, { nomAgence, adresseAgence, reseau, tailleAgence, transactionsParMois: transAgent, rsac, dejaAnalyse, interets: interetsAgent });
    } else if (profileType === 'investisseur') {
      Object.assign(profileData, { nomSociete, statut, siret, acquisitionsParAn: acquisitions, typeBien, strategie, avecCourtier, interets: interetsInvest });
    } else if (profileType === 'marchand') {
      Object.assign(profileData, { nomSociete: nomSocieteMarchand, siret: siretMarchand, operationsParAn: operationsMarchand, typeBien: typeBienMarchand, strategie: strategieMarchand, zoneGeographique: zoneMarchand, interets: interetsMarchand });
    } else if (profileType === 'notaire') {
      Object.assign(profileData, { nomEtude, adresseEtude, fonction, tailleEtude, transactionsParMois: transNotaire, dejaOutils, interets: interetsNotaire });
    } else {
      Object.assign(profileData, { profession, nomStructure });
    }

    await supabase.from('contact_pro').insert({
      profile_type: profileType,
      nom, prenom, email, telephone: telephone || null, ville: ville || null,
      volume: volume || null, message: message || null,
      profile_data: profileData,
      rgpd_consent: rgpd,
    });

    setSending(false);
    setSent(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* Forcer navbar blanche */
  useEffect(() => {
    const nav = document.querySelector('header nav') as HTMLElement | null;
    if (nav) {
      nav.style.backgroundColor = 'rgba(255,255,255,0.97)';
      nav.style.backdropFilter = 'none';
      (nav.style as any).webkitBackdropFilter = 'none';
    }
    return () => { if (nav) { nav.style.backgroundColor = ''; nav.style.backdropFilter = ''; (nav.style as any).webkitBackdropFilter = ''; } };
  }, []);

  if (sent) {
    return (
      <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 70, minHeight: '100vh' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={36} color="#fff" />
            </div>
            <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>Demande envoyée !</h1>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 32 }}>
              Merci pour votre intérêt. Notre équipe vous recontactera sous 24h pour discuter de votre offre personnalisée.
            </p>
            <a href="/pro" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              Retour à l'offre pro <ArrowRight size={15} />
            </a>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 70, minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ padding: '56px 28px 40px', background: 'linear-gradient(150deg, #0f2d3d 0%, #1a4a5e 50%, #2a7d9c 100%)', textAlign: 'center' }}>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: '-0.025em' }}>
          Parlons de{' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ color: '#7dd3fc' }}>votre projet.</span>
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', bottom: -3, left: 0, right: 0, height: 4, background: 'rgba(125,211,252,0.3)', borderRadius: 4, transformOrigin: 'left', display: 'block' }} />
          </span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          Remplissez le formulaire ci-dessous. Notre équipe vous recontacte sous 24h avec une offre adaptée à votre activité.
        </motion.p>
      </section>

      {/* Formulaire */}
      <section style={{ padding: '48px 20px 80px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>

          {/* ── Étape 1 : Choix du profil ── */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#2a7d9c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 900 }}>1</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Vous êtes</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {profileTypes.map(p => (
                <button key={p.id} type="button" onClick={() => setProfileType(p.id)}
                  style={{
                    padding: '20px 16px', borderRadius: 16, textAlign: 'center', cursor: 'pointer',
                    border: profileType === p.id ? `2px solid ${p.color}` : '1.5px solid #e2e8f0',
                    background: profileType === p.id ? p.bg : '#fff',
                    transition: 'all 0.2s', fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}>
                  <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{p.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: profileType === p.id ? p.color : '#64748b' }}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {profileType && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

                {/* ── Étape 2 : Infos personnelles ── */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#2a7d9c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 900 }}>2</div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Vos coordonnées</h2>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '28px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }} className="form-grid-2">
                      <Field label="Nom" required><input style={inputStyle} value={nom} onChange={e => setNom(e.target.value)} placeholder="Dupont" /></Field>
                      <Field label="Prénom" required><input style={inputStyle} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Jean" /></Field>
                    </div>
                    <Field label="Email professionnel" required><input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean.dupont@agence.fr" /></Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }} className="form-grid-2">
                      <Field label="Téléphone"><input style={inputStyle} type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 12 34 56 78" /></Field>
                      <Field label="Ville / Région d'activité"><input style={inputStyle} value={ville} onChange={e => setVille(e.target.value)} placeholder="Lyon, Rhône-Alpes" /></Field>
                    </div>
                  </div>
                </div>

                {/* ── Étape 3 : Champs spécifiques au profil ── */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: activeProfile?.color || '#2a7d9c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 900 }}>3</div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Votre activité — {activeProfile?.label}</h2>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${activeProfile?.color}20`, padding: '28px 24px' }}>

                    {/* ── AGENT ── */}
                    {profileType === 'agent' && (<>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }} className="form-grid-2">
                        <Field label="Nom de l'agence"><input style={inputStyle} value={nomAgence} onChange={e => setNomAgence(e.target.value)} placeholder="Immobilier Lyon Centre" /></Field>
                        <Field label="Adresse de l'agence"><input style={inputStyle} value={adresseAgence} onChange={e => setAdresseAgence(e.target.value)} placeholder="12 rue de la République, Lyon" /></Field>
                      </div>
                      <Field label="Réseau d'appartenance"><SelectField value={reseau} onChange={setReseau} options={reseaux} placeholder="Sélectionner..." /></Field>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }} className="form-grid-2">
                        <Field label="Taille de l'agence"><SelectField value={tailleAgence} onChange={setTailleAgence} options={taillesAgence} placeholder="Sélectionner..." /></Field>
                        <Field label="Transactions par mois"><SelectField value={transAgent} onChange={setTransAgent} options={transactionsAgent} placeholder="Sélectionner..." /></Field>
                      </div>
                      <Field label="RSAC / Carte T (optionnel)"><input style={inputStyle} value={rsac} onChange={e => setRsac(e.target.value)} placeholder="Numéro RSAC ou Carte T" /></Field>
                      <Field label="Proposez-vous déjà un service d'analyse documentaire ?">
                        <RadioCards value={dejaAnalyse} onChange={setDejaAnalyse} options={[{ id: 'oui', label: 'Oui' }, { id: 'non', label: 'Non' }]} />
                      </Field>
                      <Field label="Ce qui vous intéresse le plus (plusieurs choix possibles)">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {['Rassurer mes acquéreurs', 'Me différencier', 'Gagner du temps', 'Fidéliser mes clients'].map(i => (
                            <button key={i} type="button" onClick={() => toggleInterest(interetsAgent, setInteretsAgent, i)}
                              style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: interetsAgent.includes(i) ? '2px solid #2a7d9c' : '1.5px solid #e2e8f0', background: interetsAgent.includes(i) ? '#f0f7fb' : '#fff', color: interetsAgent.includes(i) ? '#2a7d9c' : '#64748b', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                              {i}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </>)}

                    {/* ── INVESTISSEUR ── */}
                    {profileType === 'investisseur' && (<>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }} className="form-grid-2">
                        <Field label="Nom de la société (si applicable)"><input style={inputStyle} value={nomSociete} onChange={e => setNomSociete(e.target.value)} placeholder="SCI Dupont Invest" /></Field>
                        <Field label="SIRET (optionnel)"><input style={inputStyle} value={siret} onChange={e => setSiret(e.target.value)} placeholder="123 456 789 00012" /></Field>
                      </div>
                      <Field label="Statut"><SelectField value={statut} onChange={setStatut} options={statutsInvestisseur} placeholder="Sélectionner..." /></Field>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }} className="form-grid-2">
                        <Field label="Acquisitions par an"><SelectField value={acquisitions} onChange={setAcquisitions} options={acquisitionsAn} placeholder="Sélectionner..." /></Field>
                        <Field label="Type de biens ciblés"><SelectField value={typeBien} onChange={setTypeBien} options={typesBiens} placeholder="Sélectionner..." /></Field>
                      </div>
                      <Field label="Stratégie principale"><SelectField value={strategie} onChange={setStrategie} options={strategies} placeholder="Sélectionner..." /></Field>
                      <Field label="Travaillez-vous avec un courtier ou un agent ?">
                        <RadioCards value={avecCourtier} onChange={setAvecCourtier} options={[{ id: 'oui', label: 'Oui' }, { id: 'non', label: 'Non' }]} />
                      </Field>
                      <Field label="Ce qui vous intéresse le plus">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {['Comparer plusieurs biens', 'Détecter les risques', 'Gagner du temps', 'Score objectif'].map(i => (
                            <button key={i} type="button" onClick={() => toggleInterest(interetsInvest, setInteretsInvest, i)}
                              style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: interetsInvest.includes(i) ? '2px solid #7c3aed' : '1.5px solid #e2e8f0', background: interetsInvest.includes(i) ? '#f5f3ff' : '#fff', color: interetsInvest.includes(i) ? '#7c3aed' : '#64748b', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                              {i}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </>)}

                    {/* ── MARCHAND DE BIEN ── */}
                    {profileType === 'marchand' && (<>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }} className="form-grid-2">
                        <Field label="Nom de la société"><input style={inputStyle} value={nomSocieteMarchand} onChange={e => setNomSocieteMarchand(e.target.value)} placeholder="SAS Immo Revente" /></Field>
                        <Field label="SIRET (optionnel)"><input style={inputStyle} value={siretMarchand} onChange={e => setSiretMarchand(e.target.value)} placeholder="123 456 789 00012" /></Field>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }} className="form-grid-2">
                        <Field label="Opérations par an"><SelectField value={operationsMarchand} onChange={setOperationsMarchand} options={operationsAn} placeholder="Sélectionner..." /></Field>
                        <Field label="Type de biens ciblés"><SelectField value={typeBienMarchand} onChange={setTypeBienMarchand} options={typesBiens} placeholder="Sélectionner..." /></Field>
                      </div>
                      <Field label="Stratégie principale"><SelectField value={strategieMarchand} onChange={setStrategieMarchand} options={strategiesMarchand} placeholder="Sélectionner..." /></Field>
                      <Field label="Zone géographique principale"><input style={inputStyle} value={zoneMarchand} onChange={e => setZoneMarchand(e.target.value)} placeholder="Île-de-France, PACA, Rhône-Alpes..." /></Field>
                      <Field label="Ce qui vous intéresse le plus">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {['Détecter les restrictions RCP', 'Chiffrer les travaux à prévoir', 'Gagner du temps sur le sourcing', 'Sécuriser mes marges'].map(i => (
                            <button key={i} type="button" onClick={() => toggleInterest(interetsMarchand, setInteretsMarchand, i)}
                              style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: interetsMarchand.includes(i) ? '2px solid #d97706' : '1.5px solid #e2e8f0', background: interetsMarchand.includes(i) ? '#fffbeb' : '#fff', color: interetsMarchand.includes(i) ? '#d97706' : '#64748b', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                              {i}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </>)}

                    {/* ── NOTAIRE ── */}
                    {profileType === 'notaire' && (<>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }} className="form-grid-2">
                        <Field label="Nom de l'étude"><input style={inputStyle} value={nomEtude} onChange={e => setNomEtude(e.target.value)} placeholder="Office Notarial Martin" /></Field>
                        <Field label="Adresse de l'étude"><input style={inputStyle} value={adresseEtude} onChange={e => setAdresseEtude(e.target.value)} placeholder="5 place Bellecour, Lyon" /></Field>
                      </div>
                      <Field label="Fonction"><SelectField value={fonction} onChange={setFonction} options={fonctionsNotaire} placeholder="Sélectionner..." /></Field>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }} className="form-grid-2">
                        <Field label="Taille de l'étude"><SelectField value={tailleEtude} onChange={setTailleEtude} options={taillesEtude} placeholder="Sélectionner..." /></Field>
                        <Field label="Transactions immobilières / mois"><SelectField value={transNotaire} onChange={setTransNotaire} options={transactionsNotaire} placeholder="Sélectionner..." /></Field>
                      </div>
                      <Field label="Utilisez-vous déjà des outils d'analyse documentaire ?">
                        <RadioCards value={dejaOutils} onChange={setDejaOutils} options={[{ id: 'oui', label: 'Oui' }, { id: 'non', label: 'Non' }]} />
                      </Field>
                      <Field label="Ce qui vous intéresse le plus">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {['Pré-screening des dossiers', 'Gain de temps', 'Complément d\'analyse', 'Sécuriser les transactions'].map(i => (
                            <button key={i} type="button" onClick={() => toggleInterest(interetsNotaire, setInteretsNotaire, i)}
                              style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: interetsNotaire.includes(i) ? '2px solid #0f2d3d' : '1.5px solid #e2e8f0', background: interetsNotaire.includes(i) ? '#f4f7f9' : '#fff', color: interetsNotaire.includes(i) ? '#0f2d3d' : '#64748b', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                              {i}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </>)}

                    {/* ── AUTRE ── */}
                    {profileType === 'autre' && (<>
                      <Field label="Profession" required><input style={inputStyle} value={profession} onChange={e => setProfession(e.target.value)} placeholder="Courtier, syndic, architecte..." /></Field>
                      <Field label="Nom de la structure"><input style={inputStyle} value={nomStructure} onChange={e => setNomStructure(e.target.value)} placeholder="Nom de votre société ou cabinet" /></Field>
                    </>)}

                  </div>
                </div>

                {/* ── Étape 4 : Volume + message ── */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#0f2d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 900 }}>4</div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Votre besoin</h2>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '28px 24px' }}>
                    <Field label="Volume estimé d'analyses"><SelectField value={volume} onChange={setVolume} options={volumes} placeholder="Sélectionner..." /></Field>
                    <Field label="Votre besoin en quelques mots">
                      <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' as const }} value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Décrivez votre activité et ce que vous attendez de Verimo..." />
                    </Field>
                  </div>
                </div>

                {/* ── RGPD + Submit ── */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                    <input type="checkbox" checked={rgpd} onChange={e => setRgpd(e.target.checked)}
                      style={{ marginTop: 3, accentColor: '#2a7d9c', width: 16, height: 16 }} />
                    <span>J'accepte que mes données soient traitées par Verimo dans le cadre de cette demande de contact. Elles ne seront ni revendues ni utilisées à d'autres fins. <a href="/confidentialite" style={{ color: '#2a7d9c', textDecoration: 'underline' }}>Politique de confidentialité</a></span>
                  </label>
                </div>

                <button onClick={handleSubmit} disabled={!profileType || !nom || !prenom || !email || !rgpd || sending}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 16, border: 'none', cursor: 'pointer',
                    background: (!profileType || !nom || !prenom || !email || !rgpd) ? '#cbd5e1' : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)',
                    color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: (!profileType || !nom || !prenom || !email || !rgpd) ? 'none' : '0 4px 20px rgba(42,125,156,0.3)',
                    transition: 'all 0.2s', fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}>
                  {sending ? 'Envoi en cours...' : (<><Send size={18} /> Envoyer ma demande</>)}
                </button>

                {/* Réassurance */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginTop: 24 }}>
                  {[{ icon: ShieldCheck, label: 'Données sécurisées' }, { icon: Lock, label: 'Conforme RGPD' }, { icon: Send, label: 'Réponse sous 24h' }].map(({ icon: I, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                      <I size={13} /> {label}
                    </div>
                  ))}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          .form-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
