import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
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

const quickTags = ["PV d'AG", "DPE", "Charges", "Compromis"];

/* ── MobileNav ── */
function MobileNav({ active, onCat }: { active: string; onCat: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = cats.find((x) => x.id === active)!;
  return (
    <div className="px-1 mb-2">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
        style={{ color: cur.color, fontFamily: "inherit", cursor: "pointer" }}>
        <span className="flex items-center gap-2"><span className="text-lg">{cur.icon}</span>{cur.label}</span>
        <ChevronDown size={18} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: "#94a3b8" }} />
      </button>
      {open && (
        <div className="mt-1.5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
          {cats.map((cat) => (
            <button key={cat.id} onClick={() => { onCat(cat.id); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm"
              style={{ background: cat.id === active ? cat.color + '06' : 'transparent', color: cat.id === active ? cat.color : '#64748b', fontWeight: cat.id === active ? 700 : 500, fontFamily: "inherit", cursor: "pointer", border: "none", borderBottom: "1px solid #f1f5f9" }}>
              <span className="text-lg">{cat.icon}</span>
              <span className="flex-1">{cat.label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-[#94a3b8]">
                {cat.subs.reduce((a, s) => a + s.articles.length, 0)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function GuidesPage() {
  const [activeCat, setActiveCat] = useState("copropriete");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const cat = cats.find((c) => c.id === activeCat)!;
  const total = cats.reduce((a, c) => a + c.subs.reduce((b, s) => b + s.articles.length, 0), 0);

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
    return subs.map((s) => ({ ...s, articles: s.articles.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || (a.docInfo && a.docInfo.label.toLowerCase().includes(q))) })).filter((s) => s.articles.length > 0);
  }, [cat, activeSub, search]);

  return (
    <div className="text-[#0f172a] antialiased overflow-x-hidden min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f5f6f8' }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(165deg, #0b2230 0%, #143a4d 50%, #1a5060 100%)', paddingTop: 'clamp(88px, 10vw, 110px)', paddingBottom: 56 }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 bottom-0" style={{ width: '45%', opacity: 0.03, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute -top-16 -right-20 w-80 h-80 rounded-full" style={{ border: '45px solid rgba(93,191,224,0.05)' }} />
          <div className="absolute -bottom-24 -left-12 w-56 h-56 rounded-full" style={{ border: '35px solid rgba(93,191,224,0.03)' }} />
        </div>
        <div className="relative z-10 max-w-[860px] mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: _lp ? 4 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: _lp ? 0.15 : 0.4 }} className="flex items-center gap-3 mb-5">
            <div style={{ width: 28, height: 1.5, background: '#5dbfe0', borderRadius: 1 }} />
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#5dbfe0' }}>Guides Verimo</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: _lp ? 6 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: _lp ? 0.18 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: 14 }}>
            Analysez vos documents immobiliers{' '}
            <span className="relative inline-block">
              <span style={{ color: '#5dbfe0' }}>avant de signer</span>
              <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-1 left-0 right-0 rounded-full block" style={{ height: 4, background: 'rgba(93,191,224,0.3)', transformOrigin: 'left' }} />
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12, duration: 0.35 }}
            style={{ fontSize: 'clamp(14px, 1.6vw, 16px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 28 }}>
            PV d'AG, DPE, diagnostics, règlement de copro, compromis, état daté… Des guides concrets pour comprendre et acheter en confiance.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.3 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 flex-1 w-full sm:w-auto max-w-[400px] rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <Search size={16} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
              <input type="text" placeholder="Rechercher un guide…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full outline-none" style={{ border: 'none', background: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {quickTags.map((t) => (
                <button key={t} onClick={() => setSearch(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CATEGORY CARDS ── */}
      <div className="max-w-[860px] mx-auto px-5 sm:px-8 -mt-7 relative z-20">
        <div className="hidden lg:grid grid-cols-5 gap-2.5">
          {cats.map((c) => {
            const on = c.id === activeCat;
            const count = c.subs.reduce((a, s) => a + s.articles.length, 0);
            return (
              <button key={c.id} onClick={() => { setActiveCat(c.id); setActiveSub(null); setSearch(""); }}
                className="flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl transition-all duration-200"
                style={{ background: on ? '#fff' : 'rgba(255,255,255,0.85)', border: on ? '1.5px solid #2a7d9c' : '1px solid #ebeef2', cursor: 'pointer', fontFamily: 'inherit',
                  transform: on ? 'translateY(-2px)' : 'none', boxShadow: on ? '0 6px 20px rgba(42,125,156,0.1)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: 26 }}>{c.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2d3d' }}>{c.label}</span>
                <span style={{ fontSize: 10, color: on ? '#2a7d9c' : '#94a3b8' }}>{count} guides</span>
                {on && <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #2a7d9c', marginTop: 2 }} />}
              </button>
            );
          })}
        </div>
        <div className="lg:hidden">
          <MobileNav active={activeCat} onCat={(id) => { setActiveCat(id); setActiveSub(null); setSearch(""); }} />
        </div>
      </div>

      {/* ── SUB-CATEGORY PILLS ── */}
      <div className="max-w-[860px] mx-auto px-5 sm:px-8 mt-4 mb-2">
        <div className="flex gap-2 flex-wrap">
          {cat.subs.map((s) => {
            const on = activeSub === s.title;
            return (
              <button key={s.title} onClick={() => setActiveSub(on ? null : s.title)}
                className="px-4 py-2 rounded-lg text-sm transition-all"
                style={{ background: on ? cat.color + '0a' : '#fff', border: on ? `1.5px solid ${cat.color}30` : '1px solid #e8ecf0',
                  color: on ? cat.color : '#64748b', fontWeight: on ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                {s.title} <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 4 }}>{s.articles.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ARTICLES ── */}
      <div className="max-w-[860px] mx-auto px-5 sm:px-8 pb-16">
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm mb-3 text-[#64748b]">Aucun guide trouvé{search ? ` pour « ${search} »` : ''}.</p>
            <button onClick={() => { setSearch(""); setActiveSub(null); }}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-[13px] font-semibold text-[#2a7d9c] cursor-pointer" style={{ fontFamily: "inherit" }}>
              Réinitialiser
            </button>
          </div>
        )}

        {filtered.map((sub, si) => (
          <div key={si}>
            <div className="flex items-center gap-2.5 mt-8 mb-4 pb-2" style={{ borderBottom: `2px solid ${cat.color}12` }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: cat.color }} />
              <h2 className="text-base font-extrabold text-[#0f2d3d] flex-1">{sub.title}</h2>
              <span className="text-[11px] font-semibold text-[#94a3b8]">{sub.articles.length} {sub.articles.length > 1 ? 'guides' : 'guide'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sub.articles.map((a, ai) => (
                <Link key={ai} to={`/guides/${a.slug}`} className="block no-underline group">
                  <div className="bg-white rounded-xl p-5 h-full flex flex-col transition-all duration-200 group-hover:shadow-md group-hover:border-[#2a7d9c]"
                    style={{ border: '1px solid #ebeef2', borderTop: a.tag === 'Essentiel' ? `3px solid ${cat.color}` : '1px solid #ebeef2' }}>
                    {a.docInfo ? (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold"
                          style={{ background: '#f0f8fc', color: '#2a7d9c', border: '1px solid #e0eff5' }}>
                          {a.docInfo.emoji} {a.docInfo.label}
                        </span>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold"
                          style={{ background: cat.color + '08', color: cat.color, border: `1px solid ${cat.color}15` }}>
                          {cat.icon} {cat.label}
                        </span>
                      </div>
                    )}
                    {a.tag && (
                      <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 self-start"
                        style={{ color: '#fff', background: cat.color }}>{a.tag}</span>
                    )}
                    <h3 className="text-[13.5px] font-bold leading-snug text-[#0f2d3d] group-hover:text-[#2a7d9c] transition-colors mb-2 flex-1">{a.title}</h3>
                    <p className="text-[12px] leading-relaxed text-[#8892a0] mb-4">{a.description}</p>
                    <span className="text-[12px] font-semibold mt-auto" style={{ color: cat.color }}>Lire le guide →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filtered.length > 0 && (
          <div className="rounded-2xl mt-10 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0e2a38 0%, #1a4a5e 100%)' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 sm:p-10">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white mb-2">Votre futur achat mérite mieux qu'une lecture en diagonale.</h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Score /20, risques et pistes de négociation en quelques minutes.</p>
              </div>
              <Link to="/start"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#0f2d3d] text-sm font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 no-underline whitespace-nowrap">
                Analyser mon bien →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
