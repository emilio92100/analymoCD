import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useSEO } from "../hooks/useSEO";

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isLowPerf = () => isIOS() || (typeof window !== 'undefined' && window.innerWidth <= 768);
const _lp = isLowPerf();

interface DocInfo { emoji: string; label: string; definition: string }
interface Article { title: string; description: string; slug: string; docInfo?: DocInfo; tag?: string }
interface Sub { title: string; articles: Article[] }
interface Cat { id: string; icon: string; label: string; color: string; subs: Sub[] }

const cats: Cat[] = [
  { id: "copropriete", icon: "🏢", label: "Copropriété", color: "#2a7d9c", subs: [
    { title: "Documents de copropriété", articles: [
      { title: "Comment analyser un PV d'AG avant d'acheter un appartement", slug: "analyser-pv-ag-avant-achat", description: "Les 5 points clés à vérifier dans un procès-verbal d'assemblée générale pour éviter les mauvaises surprises.", docInfo: { emoji: "💡", label: "PV d'AG", definition: "Le procès-verbal d'assemblée générale est le compte-rendu officiel des décisions votées par les copropriétaires. Il est rédigé par le syndic après chaque réunion annuelle." }, tag: "Essentiel" },
      { title: "Règlement de copropriété : les 7 clauses à vérifier absolument", slug: "reglement-copropriete-clauses-verifier", description: "Usage du lot, répartition des charges, parties privatives et communes — ce que cache ce document fondateur.", docInfo: { emoji: "💡", label: "Règlement de copropriété", definition: "Document juridique qui définit les règles de vie de l'immeuble, la destination des lots et la répartition des charges entre copropriétaires." }, tag: "Essentiel" },
      { title: "Pourquoi lire les 3 derniers PV d'AG avant d'acheter en copropriété", slug: "lire-3-derniers-pv-ag-copropriete", description: "Un seul PV ne suffit pas. Comparer trois années révèle les tendances, les travaux reportés et les tensions récurrentes." },
      { title: "Carnet d'entretien de l'immeuble : ce qu'il faut y chercher", slug: "carnet-entretien-immeuble", description: "Historique des travaux, maintenance des équipements, conformité réglementaire — un document souvent négligé.", docInfo: { emoji: "💡", label: "Carnet d'entretien", definition: "Document tenu par le syndic qui liste l'historique des travaux réalisés, les contrats d'entretien en cours et les équipements communs de l'immeuble." } },
      { title: "Fiche synthétique de copropriété : à quoi ça sert", slug: "fiche-synthetique-copropriete", description: "Ce résumé annuel obligatoire donne un aperçu rapide de la santé de votre future copropriété.", docInfo: { emoji: "💡", label: "Fiche synthétique", definition: "Document obligatoire établi chaque année par le syndic, regroupant les données financières et techniques essentielles de la copropriété." } },
    ]},
    { title: "Finances & Charges", articles: [
      { title: "Charges de copropriété : comment savoir si elles sont trop élevées", slug: "charges-copropriete-trop-elevees", description: "Comparer les charges au m², analyser le budget prévisionnel et repérer les postes anormaux." },
      { title: "Appels de fonds exceptionnels : comment les repérer dans les documents", slug: "appels-fonds-exceptionnels-documents", description: "Travaux votés, ravalement, toiture — comment anticiper les dépenses qui viendront après votre achat." },
      { title: "État daté : ce que ce document révèle sur le vendeur", slug: "etat-date-document-vendeur", description: "Dettes du vendeur, provisions versées, situation financière du lot — tout ce que l'état daté contient.", docInfo: { emoji: "💡", label: "État daté", definition: "Document comptable fourni par le syndic qui détaille la situation financière du lot vendu : charges dues, provisions versées et dettes éventuelles du vendeur." } },
      { title: "Fonds de travaux obligatoire : ce que ça change pour l'acheteur en 2026", slug: "fonds-travaux-obligatoire-2026", description: "Depuis la loi ALUR, chaque copropriété doit constituer un fonds de travaux. Impact concret sur votre achat." },
      { title: "Impayés en copropriété : comment détecter le risque avant d'acheter", slug: "impayes-copropriete-detecter-risque", description: "Des copropriétaires qui ne paient pas leurs charges fragilisent tout l'immeuble. Comment repérer les signaux." },
    ]},
  ]},
  { id: "diagnostics", icon: "🔍", label: "Diagnostics", color: "#d97706", subs: [
    { title: "Performance énergétique", articles: [
      { title: "DPE : comment le lire et quoi en tirer avant d'acheter", slug: "dpe-comment-lire-avant-achat", description: "Classes énergétiques, consommation estimée, recommandations de travaux — tout comprendre du DPE.", docInfo: { emoji: "💡", label: "DPE", definition: "Le Diagnostic de Performance Énergétique évalue la consommation d'énergie et les émissions de gaz à effet de serre d'un logement. Obligatoire pour toute vente." }, tag: "Essentiel" },
      { title: "Passoire thermique (DPE F ou G) : faut-il fuir ou négocier ?", slug: "passoire-thermique-fuir-negocier", description: "Un mauvais DPE n'est pas toujours rédhibitoire. Comment estimer le coût réel et en faire un levier." },
      { title: "DPE collectif 2026 : nouvelles obligations et impact sur votre achat", slug: "dpe-collectif-2026-obligations", description: "Les nouvelles règles du DPE collectif et ce qu'elles changent pour les acheteurs en copropriété." },
      { title: "Audit énergétique : différence avec le DPE et quand il est obligatoire", slug: "audit-energetique-difference-dpe", description: "Depuis 2023, l'audit est requis pour les passoires thermiques. Ce qu'il contient de plus que le DPE.", docInfo: { emoji: "💡", label: "Audit énergétique", definition: "Étude approfondie obligatoire pour la vente de logements classés F ou G. Il propose des scénarios de travaux chiffrés pour améliorer la performance." } },
    ]},
    { title: "Sécurité & Conformité", articles: [
      { title: "Diagnostic amiante : que faire si le résultat est positif", slug: "diagnostic-amiante-resultat-positif", description: "Obligations du vendeur, risques pour l'acheteur, coût du désamiantage — tout savoir avant de signer.", docInfo: { emoji: "💡", label: "Diagnostic amiante", definition: "Obligatoire pour les immeubles construits avant 1997. Il détecte la présence d'amiante dans les matériaux de construction." } },
      { title: "Loi Carrez : que faire si la surface ne correspond pas", slug: "loi-carrez-surface-ne-correspond-pas", description: "Tolérance de 5%, recours possibles, impact sur le prix — vos droits en cas d'écart de surface.", docInfo: { emoji: "💡", label: "Mesurage loi Carrez", definition: "Attestation obligatoire en copropriété qui certifie la superficie privative exacte du lot. Une erreur de plus de 5% ouvre droit à une réduction de prix." } },
      { title: "ERP : comment décrypter l'État des Risques et Pollutions", slug: "erp-etat-risques-pollutions", description: "Zones inondables, risques industriels, pollution des sols — ce que ce document vous apprend.", docInfo: { emoji: "💡", label: "ERP", definition: "Document obligatoire qui informe l'acheteur sur les risques naturels, miniers, technologiques, sismiques et de pollution auxquels le bien est exposé." } },
      { title: "Diagnostic électricité et gaz : quels risques pour l'acheteur", slug: "diagnostic-electricite-gaz-risques", description: "Installations de plus de 15 ans, anomalies détectées, travaux à prévoir — comment interpréter ces diagnostics." },
    ]},
  ]},
  { id: "acheteurs", icon: "🧑‍💼", label: "Acheteurs", color: "#059669", subs: [
    { title: "Avant de signer", articles: [
      { title: "Les 10 documents à exiger avant de faire une offre d'achat", slug: "10-documents-avant-offre-achat", description: "La checklist complète des pièces à demander au vendeur ou à l'agent avant de vous engager.", tag: "Essentiel" },
      { title: "Compromis de vente : les clauses à lire avant de signer", slug: "compromis-vente-clauses-lire", description: "Conditions suspensives, délai de rétractation, clauses pénales — ce que vous devez comprendre.", docInfo: { emoji: "💡", label: "Compromis de vente", definition: "Avant-contrat qui engage vendeur et acheteur. Il fixe le prix, les conditions et ouvre un délai de rétractation de 10 jours pour l'acheteur." } },
      { title: "Premier achat immobilier : les pièges documentaires à éviter", slug: "premier-achat-pieges-documentaires", description: "Guide spécial primo-accédants. Les erreurs les plus fréquentes et comment les éviter.", tag: "Primo-accédant" },
      { title: "Que vérifier dans les 10 jours de rétractation", slug: "verifier-10-jours-retractation", description: "Vous avez signé le compromis. Voici exactement quoi vérifier pendant le délai légal." },
    ]},
    { title: "Négociation", articles: [
      { title: "5 arguments de négociation cachés dans les documents de copropriété", slug: "arguments-negociation-documents-copropriete", description: "Travaux votés, charges en hausse, impayés, DPE dégradé — des leviers que la plupart des acheteurs ignorent." },
      { title: "Comment utiliser le DPE pour négocier le prix d'achat", slug: "utiliser-dpe-negocier-prix", description: "Un DPE F ou G peut justifier une décote de 5 à 15%. Comment argumenter face au vendeur." },
      { title: "Travaux votés en AG : un levier de négociation souvent ignoré", slug: "travaux-votes-ag-levier-negociation", description: "Si des travaux ont été votés avant la vente, l'acheteur paie les appels de fonds. Comment en tenir compte." },
    ]},
  ]},
  { id: "vendeurs", icon: "🤝", label: "Vendeurs", color: "#7c3aed", subs: [
    { title: "Préparer sa vente", articles: [
      { title: "Liste complète des documents obligatoires pour vendre en 2026", slug: "documents-obligatoires-vendre-2026", description: "DDT, état daté, fiche synthétique, DPE — tout ce que le vendeur doit fournir et à quel moment.", tag: "Essentiel" },
      { title: "DDT : tout ce que le Dossier de Diagnostics Techniques doit contenir", slug: "ddt-dossier-diagnostics-techniques", description: "Les diagnostics obligatoires selon le type de bien, leur durée de validité et les sanctions en cas d'absence.", docInfo: { emoji: "💡", label: "DDT", definition: "Le Dossier de Diagnostics Techniques regroupe l'ensemble des diagnostics obligatoires à fournir à l'acheteur." } },
      { title: "Vendre en copropriété : les documents spécifiques à fournir", slug: "vendre-copropriete-documents-specifiques", description: "Au-delà du DDT, la vente en copropriété impose des documents supplémentaires. Liste complète." },
    ]},
    { title: "Valoriser son bien", articles: [
      { title: "Comment présenter ses documents pour rassurer l'acheteur", slug: "presenter-documents-rassurer-acheteur", description: "Un dossier complet et bien organisé accélère la vente et justifie votre prix." },
      { title: "Vendre une passoire thermique : stratégies pour ne pas brader", slug: "vendre-passoire-thermique-strategies", description: "DPE F ou G ne signifie pas vendre à perte. Comment valoriser malgré un mauvais diagnostic." },
    ]},
  ]},
  { id: "professionnels", icon: "💼", label: "Professionnels", color: "#be123c", subs: [
    { title: "Agents & Mandataires", articles: [
      { title: "Mandataire immobilier : comment analyser un dossier en 10 minutes", slug: "mandataire-analyser-dossier-10-minutes", description: "Méthode rapide pour pré-analyser les documents d'un bien et identifier les points bloquants." },
      { title: "Comment se différencier en tant qu'agent grâce à l'analyse documentaire", slug: "agent-differencier-analyse-documentaire", description: "Proposer un rapport d'analyse à vos clients acquéreurs : un service qui fidélise et vous démarque." },
      { title: "Mandataires IAD, SAFTI, Capifrance : optimiser son temps sur les dossiers", slug: "mandataires-iad-safti-capifrance-optimiser", description: "En tant qu'indépendant, chaque minute compte. Comment automatiser la pré-analyse." },
      { title: "Sécuriser ses transactions : la checklist documentaire de l'agent", slug: "securiser-transactions-checklist-agent", description: "Les documents à vérifier systématiquement pour éviter les litiges post-vente.", tag: "Essentiel" },
      { title: "Fidéliser ses clients acquéreurs avec un rapport d'analyse clair", slug: "fideliser-clients-rapport-analyse", description: "Offrir de la transparence documentaire pour bâtir la confiance et générer des recommandations." },
    ]},
    { title: "Investisseurs & Marchands de biens", articles: [
      { title: "Due diligence documentaire : la checklist de l'investisseur immobilier", slug: "due-diligence-checklist-investisseur", description: "Les documents à analyser méthodiquement avant tout investissement. Risques, rentabilité, conformité.", tag: "Essentiel" },
      { title: "Analyser un immeuble de rapport : les documents clés", slug: "analyser-immeuble-rapport-documents", description: "PV d'AG, état daté, DPE collectif, baux en cours — la méthode pour évaluer un immeuble entier." },
      { title: "Marchand de biens : détecter les bonnes affaires dans les PV d'AG", slug: "marchand-biens-bonnes-affaires-pv-ag", description: "Travaux refusés, copropriété en difficulté — transformer les problèmes en opportunités." },
      { title: "Investissement locatif : ce que les documents révèlent sur la rentabilité réelle", slug: "investissement-locatif-documents-rentabilite", description: "Charges réelles, travaux à venir, DPE contraignant — calculer le vrai rendement." },
      { title: "Copropriétés en difficulté : repérer les signaux dans les documents", slug: "coproprietes-difficulte-signaux-documents", description: "Impayés chroniques, procédures judiciaires, syndic provisoire — les red flags à identifier." },
      { title: "Acheter en lot : comment analyser plusieurs biens rapidement", slug: "acheter-lot-analyser-plusieurs-biens", description: "Méthode pour évaluer un portefeuille de biens sans passer des semaines sur chaque dossier." },
    ]},
  ]},
];

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function GuidesPage() {
  const [activeCat, setActiveCat] = useState("copropriete");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const cat = cats.find((c) => c.id === activeCat)!;

  useSEO({
    title: "Guides immobiliers — Comprendre vos documents avant d'acheter | Verimo",
    description: "PV d'AG, DPE, diagnostics, règlement de copropriété, compromis de vente… Nos guides pratiques vous aident à analyser chaque document immobilier avant de signer.",
    canonical: '/guides',
  });

  const filtered = useMemo(() => {
    let subs = cat.subs;
    if (activeSub) subs = subs.filter((s) => s.title === activeSub);
    if (!search) return subs;
    const q = search.toLowerCase();
    return subs.map((s) => ({
      ...s,
      articles: s.articles.filter((a) =>
        a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || (a.docInfo && a.docInfo.label.toLowerCase().includes(q))
      ),
    })).filter((s) => s.articles.length > 0);
  }, [cat, activeSub, search]);

  const quickFilters = ["PV d'AG", "DPE", "Charges", "Compromis"];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f7f8fa', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <section style={{
        background: 'linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)',
        paddingTop: 72,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Cercles décoratifs subtils */}
        <div style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(44px,7vw,80px) clamp(20px,4vw,48px) 42px', position: 'relative', zIndex: 1 }}>

          {/* GUIDES VERIMO - bloc visible */}
          <motion.div
            initial={{ opacity: 0, y: _lp ? 4 : 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: _lp ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 22, background: 'rgba(42,125,156,0.07)', padding: '8px 20px', borderRadius: 10, border: '1px solid rgba(42,125,156,0.12)' }}
          >
            <span style={{ width: 24, height: 2, background: '#2a7d9c', borderRadius: 1, display: 'inline-block' }} />
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase' as const, color: '#2a7d9c' }}>Guides Verimo</span>
            <span style={{ width: 24, height: 2, background: '#2a7d9c', borderRadius: 1, display: 'inline-block' }} />
          </motion.div>

          {/* 4/ H1 SEO optimisé */}
          <motion.h1
            initial={{ opacity: 0, y: _lp ? 4 : 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: _lp ? 0.15 : 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(26px, 4.5vw, 36px)', fontWeight: 800, color: '#0f2d3d', lineHeight: 1.18, marginBottom: 12 }}
          >
            Analysez vos documents immobiliers{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ color: '#2a7d9c' }}>avant de signer</span>
              {/* 2/ Animation plus lente (3s au lieu de 1.2s) */}
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ duration: 3, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: 'absolute', bottom: -3, left: 0, right: 0, height: 4, background: 'rgba(42,125,156,0.25)', borderRadius: 99, transformOrigin: 'left', display: 'block' }}
              />
            </span>
          </motion.h1>

          {/* 3/ Sous-titre plus visible, une seule ligne, couleur plus foncée */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            style={{ fontSize: 15, color: '#4a5568', lineHeight: 1.65, maxWidth: 900, marginBottom: 24 }}
          >
            PV d'AG, DPE, diagnostics, règlement de copro, compromis, état daté… Des guides concrets pour comprendre et acheter en confiance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff', border: '1.5px solid #d8e4ea', borderRadius: 10,
              padding: '11px 16px', width: 380, maxWidth: '100%',
              boxShadow: '0 2px 8px rgba(42,125,156,0.04)',
              transition: 'border-color 0.15s',
            }}
              onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(42,125,156,0.08)'; }}
              onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#d8e4ea'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(42,125,156,0.04)'; }}
            >
              <Search size={14} color="#a8b4be" />
              <input
                type="text" placeholder="Rechercher un guide…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'none', fontSize: 13, color: '#0f2d3d', outline: 'none', flex: 1, fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {quickFilters.map((f) => (
                <button key={f} onClick={() => setSearch(f)}
                  style={{
                    fontSize: 11, color: '#4a7d8f', background: 'rgba(42,125,156,0.06)',
                    border: '1px solid rgba(42,125,156,0.12)', padding: '6px 13px', borderRadius: 8,
                    cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(42,125,156,0.1)'; e.currentTarget.style.borderColor = 'rgba(42,125,156,0.25)'; e.currentTarget.style.color = '#2a7d9c'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(42,125,156,0.06)'; e.currentTarget.style.borderColor = 'rgba(42,125,156,0.12)'; e.currentTarget.style.color = '#4a7d8f'; }}
                >{f}</button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CATÉGORIES ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px,4vw,48px)' }}>
        <div className="guides-cats" style={{ display: 'flex', gap: 8, marginTop: -16, position: 'relative', zIndex: 2 }}>
          {cats.map((c) => {
            const isActive = c.id === activeCat;
            return (
              <div key={c.id} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
                <button onClick={() => { setActiveCat(c.id); setActiveSub(null); setSearch(""); }}
                  style={{
                    width: '100%', background: isActive ? '#f6fbfd' : '#fff',
                    borderRadius: 12, padding: '16px 10px', textAlign: 'center' as const,
                    cursor: 'pointer', border: `1.5px solid ${isActive ? '#2a7d9c' : '#e4eaee'}`,
                    transition: 'all 0.18s', fontFamily: 'inherit',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    position: 'relative' as const,
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.borderColor = '#a8cdd8'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = '#e4eaee'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                >
                  <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }}>{c.icon}</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2d3d' }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: isActive ? '#2a7d9c' : '#64748b', marginTop: 2, fontWeight: 500 }}>{c.subs.reduce((a, s) => a + s.articles.length, 0)} guides</div>
                  {isActive && (
                    <div style={{
                      position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                      width: 0, height: 0,
                      borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid #2a7d9c',
                    }} />
                  )}
                </button>
                {/* Sous-catégories sous la card active */}
                {isActive && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
                    {c.subs.map((s) => {
                      const subActive = activeSub === s.title;
                      return (
                        <button key={s.title} onClick={() => setActiveSub(subActive ? null : s.title)}
                          style={{
                            fontSize: 12, fontWeight: 600,
                            color: subActive ? '#fff' : '#5a6670',
                            background: subActive ? c.color : '#fff',
                            border: `1.5px solid ${subActive ? c.color : '#dce2e6'}`,
                            padding: '8px 16px', borderRadius: 8,
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { if (!subActive) { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.color = c.color; e.currentTarget.style.background = c.color + '08'; } }}
                          onMouseLeave={(e) => { if (!subActive) { e.currentTarget.style.borderColor = '#dce2e6'; e.currentTarget.style.color = '#5a6670'; e.currentTarget.style.background = '#fff'; } }}
                        >
                          {s.title} <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>{s.articles.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ARTICLES ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px clamp(20px,4vw,48px) 40px' }}>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
              Aucun guide trouvé{search ? ` pour « ${search} »` : ''}.
            </p>
            <button onClick={() => { setSearch(""); setActiveSub(null); }}
              style={{
                padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#fff', fontSize: 13, fontWeight: 600, color: '#2a7d9c',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              Réinitialiser
            </button>
          </div>
        )}

        {filtered.map((sub, si) => (
          <div key={si} style={{ marginBottom: 28 }}>
            {!activeSub && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '22px 0 14px' }}>
                <span style={{ width: 4, height: 18, borderRadius: 2, background: cat.color, display: 'inline-block' }} />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d', margin: 0 }}>{sub.title}</h2>
                <span style={{ fontSize: 10, color: '#a8b4be', fontWeight: 600 }}>· {sub.articles.length} guides</span>
              </div>
            )}

            <div className="guides-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
              {sub.articles.map((a, ai) => (
                <Link to={`/guides/${a.slug}`} key={ai} className="guide-article-card" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff', borderRadius: 12, padding: 20,
                    border: '1px solid #e8ecf0', cursor: 'pointer',
                    transition: 'all 0.18s', display: 'flex', flexDirection: 'column' as const,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.02)', height: '100%',
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2a7d9c';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(42,125,156,0.07)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e8ecf0';
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.02)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* 7/ Badge document OU badge catégorie si pas de docInfo */}
                    {a.docInfo ? (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#2a7d9c', background: '#edf7fb', padding: '4px 10px', borderRadius: 5 }}>
                          {a.docInfo.emoji} {a.docInfo.label}
                        </span>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: cat.color, background: cat.color + '0a', padding: '4px 10px', borderRadius: 5, border: `1px solid ${cat.color}15` }}>
                          {cat.icon} {cat.label}
                        </span>
                      </div>
                    )}

                    <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#0f2d3d', lineHeight: 1.4, marginBottom: 6, margin: 0 }}>{a.title}</h3>
                    <p style={{ fontSize: 11.5, color: '#7d8694', lineHeight: 1.55, flex: 1, margin: 0 }}>{a.description}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid #f2f4f6' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#2a7d9c' }}>Lire le guide →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        {filtered.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #0e2a38 0%, #1a4a5e 100%)',
            borderRadius: 16, padding: 'clamp(28px,5vw,40px)',
            marginTop: 28, position: 'relative' as const, overflow: 'hidden',
          }}>
            {/* Cercle décoratif */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', border: '30px solid rgba(93,191,224,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' as const }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: '#5dbfe0', marginBottom: 8, margin: '0 0 8px' }}>Prêt à passer à l'action ?</p>
                <h2 style={{ fontSize: 'clamp(18px,2.8vw,22px)', fontWeight: 800, color: '#fff', margin: '0 0 6px', lineHeight: 1.3 }}>Votre futur achat mérite mieux qu'une lecture en diagonale.</h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>Score /20, risques détectés et pistes de négociation en quelques minutes.</p>
              </div>
              <Link to="/start" style={{
                background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 700,
                padding: '14px 32px', borderRadius: 12, textDecoration: 'none',
                whiteSpace: 'nowrap' as const, transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
              >
                Analyser mon bien →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── STYLES RESPONSIVE ── */}
      <style>{`
        @media (max-width: 768px) {
          .guides-cats {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
          }
          .guides-cats > button:nth-child(4),
          .guides-cats > button:nth-child(5) {
            grid-column: span 1;
          }
          .guides-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .guides-cats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .guides-cats > button:last-child {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </div>
  );
}
