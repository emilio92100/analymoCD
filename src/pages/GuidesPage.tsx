import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight, ChevronDown, ShieldCheck, BookOpen } from "lucide-react";
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
  { id: "acheteurs", icon: "🏠", label: "Acheteurs", color: "#059669", subs: [
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
  { id: "vendeurs", icon: "📋", label: "Vendeurs", color: "#7c3aed", subs: [
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

/* ── DocBadge ── */
function DocBadge({ info }: { info: DocInfo }) {
  return (
    <div className="mt-2 rounded-lg text-center" style={{ background: "linear-gradient(135deg, #f0f8fc 0%, #f8fafc 100%)", border: "1px solid #e0eff5", padding: "10px 12px" }}>
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <span className="text-sm">{info.emoji}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#2a7d9c" }}>{info.label}</span>
      </div>
      <p className="text-[11px] leading-relaxed m-0" style={{ color: "#64748b" }}>{info.definition}</p>
    </div>
  );
}

/* ── Card ── */
function Card({ a, color }: { a: Article; color: string }) {
  return (
    <Link to={`/guides/${a.slug}`} className="block no-underline group">
      <div className="bg-white rounded-xl p-3.5 flex flex-col gap-1 h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md border border-slate-200/80 group-hover:border-[#2a7d9c]/30">
        {a.tag && (
          <span className="self-start text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-0.5"
            style={{ color, background: color + '10' }}>{a.tag}</span>
        )}
        <h3 className="text-[13px] font-bold leading-snug m-0 text-[#0f2d3d]">{a.title}</h3>
        <p className="text-[11px] leading-relaxed m-0 text-[#64748b] flex-1">{a.description}</p>
        {a.docInfo && <DocBadge info={a.docInfo} />}
        <div className="flex items-center gap-0.5 mt-1.5 text-[11px] font-semibold" style={{ color }}>
          Lire le guide <ChevronRight size={12} />
        </div>
      </div>
    </Link>
  );
}

/* ── Sidebar (desktop) ── */
function Sidebar({ active, activeSub, onCat, onSub }: { active: string; activeSub: string | null; onCat: (id: string) => void; onSub: (t: string | null) => void }) {
  return (
    <aside className="hidden lg:flex flex-col w-[210px] xl:w-[230px] shrink-0 bg-white border-r border-slate-200/80 py-5 px-3 gap-0.5 sticky top-0 self-start overflow-y-auto" style={{ maxHeight: "calc(100vh - 60px)" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] px-3 mb-2">Catégories</p>
      {cats.map((cat) => {
        const on = cat.id === active;
        return (
          <div key={cat.id}>
            <button onClick={() => { onCat(cat.id); onSub(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[13px] transition-all duration-150"
              style={{ background: on ? cat.color + '0c' : 'transparent', color: on ? cat.color : '#64748b', fontWeight: on ? 700 : 500, fontFamily: "inherit", cursor: "pointer", border: "none" }}>
              <span className="text-base">{cat.icon}</span>
              <span className="flex-1">{cat.label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: on ? cat.color + '14' : '#f1f5f9', color: on ? cat.color : '#b0b8c4' }}>
                {cat.subs.reduce((a, s) => a + s.articles.length, 0)}
              </span>
            </button>
            {on && (
              <div className="ml-7 flex flex-col gap-px mt-0.5 mb-1.5">
                {cat.subs.map((s) => {
                  const subOn = activeSub === s.title;
                  return (
                    <button key={s.title} onClick={() => onSub(subOn ? null : s.title)}
                      className="text-left text-[11px] px-2.5 py-1.5 rounded-md transition-colors"
                      style={{ color: subOn ? cat.color : '#94a3b8', fontWeight: subOn ? 600 : 400, background: subOn ? cat.color + '08' : 'transparent', border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      {s.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

/* ── MobileNav ── */
function MobileNav({ active, onCat }: { active: string; onCat: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = cats.find((x) => x.id === active)!;
  return (
    <div className="lg:hidden px-4 mb-4">
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

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
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
    return subs.map((s) => ({
      ...s,
      articles: s.articles.filter((a) =>
        a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || (a.docInfo && a.docInfo.label.toLowerCase().includes(q))
      ),
    })).filter((s) => s.articles.length > 0);
  }, [cat, activeSub, search]);

  return (
    <div className="bg-[#f8fafc] text-[#0f172a] antialiased overflow-x-hidden min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f2d3d 0%, #1a5a6e 60%, #2a7d9c 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full" style={{ background: "rgba(42,125,156,0.12)" }} />
          <div className="absolute -bottom-36 -left-20 w-72 h-72 rounded-full" style={{ background: "rgba(42,125,156,0.06)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-5 pt-12 sm:pt-14 pb-9 sm:pb-11 text-center">
          <motion.h1
            initial={{ opacity: 0, y: _lp ? 4 : 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: _lp ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-black tracking-tight leading-[1.1] mb-2.5 text-white"
            style={{ fontSize: "clamp(24px, 4vw, 38px)" }}>
            Guides pratiques pour votre{' '}
            <span className="relative inline-block">
              <span style={{ color: "#5cb8d4" }}>achat immobilier</span>
              <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full origin-left block"
                style={{ background: "rgba(92,184,212,0.35)" }} />
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.35 }}
            className="text-sm max-w-lg mx-auto mb-5 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            {total} guides pour comprendre chaque document, détecter les risques et négocier — avant de signer.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}
            className="max-w-md mx-auto relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.35)" }} />
            <input type="text" placeholder="Rechercher un guide (DPE, charges, PV d'AG…)"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontFamily: "inherit" }} />
          </motion.div>
        </div>
      </section>

      {/* ── MOBILE NAV ── */}
      <div className="pt-4">
        <MobileNav active={activeCat} onCat={(id) => { setActiveCat(id); setActiveSub(null); setSearch(""); }} />
      </div>

      {/* ── BODY ── */}
      <div className="max-w-[1440px] mx-auto flex min-h-[60vh]">
        <Sidebar active={activeCat} activeSub={activeSub} onCat={(id) => { setActiveCat(id); setActiveSub(null); setSearch(""); }} onSub={setActiveSub} />

        <main className="flex-1 px-4 lg:px-6 xl:px-8 pb-14 pt-2 lg:pt-6 min-w-0">
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
            <div key={si} className="mb-10">
              <div className="flex items-center gap-2.5 mb-4 pb-2.5" style={{ borderBottom: `2px solid ${cat.color}15` }}>
                <div className="w-1 h-5 rounded-sm" style={{ background: cat.color }} />
                <h2 className="text-sm sm:text-base font-extrabold m-0 text-[#0f2d3d]">{sub.title}</h2>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-[#94a3b8]">
                  {sub.articles.length} {sub.articles.length > 1 ? 'guides' : 'guide'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sub.articles.map((a, ai) => <Card key={ai} a={a} color={cat.color} />)}
              </div>
            </div>
          ))}

          {filtered.length > 0 && (
            <div className="rounded-2xl text-center p-7 sm:p-10 mt-4"
              style={{ background: "linear-gradient(135deg, #0f2d3d 0%, #1a4a5e 100%)", color: "#fff" }}>
              <h2 className="text-lg sm:text-xl font-extrabold mb-2 tracking-tight">Vous avez vos documents ?</h2>
              <p className="text-sm mb-5 max-w-md mx-auto" style={{ opacity: 0.7 }}>
                Verimo analyse vos PV d'AG, diagnostics, DPE, règlement de copropriété et plus encore en quelques secondes.
              </p>
              <Link to="/start"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-sm font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 no-underline text-[#0f2d3d]">
                <ShieldCheck size={16} /> Lancer mon analyse
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
