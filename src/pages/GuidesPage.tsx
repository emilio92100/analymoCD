import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight, ShieldCheck, BookOpen } from "lucide-react";
import { useSEO } from "../hooks/useSEO";

/* ══════════════════════════════════════════
   PERF DETECTION
══════════════════════════════════════════ */
const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isLowPerf = () => isIOS() || (typeof window !== 'undefined' && window.innerWidth <= 768);
const _lowPerf = isLowPerf();

/* ══════════════════════════════════════════
   COLORS
══════════════════════════════════════════ */
const C = {
  dark: "#0f2d3d",
  teal: "#2a7d9c",
  tealLight: "#f0f8fc",
  slate: "#64748b",
  slateLight: "#f8fafc",
  border: "#e2e8f0",
  white: "#ffffff",
  amber: "#d97706",
  amberBg: "#fffbeb",
  green: "#059669",
  greenBg: "#ecfdf5",
  violet: "#7c3aed",
  violetBg: "#f5f3ff",
  rose: "#be123c",
  roseBg: "#fff1f2",
};

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
interface DocInfo { emoji: string; label: string; definition: string; }
interface Article { title: string; description: string; slug: string; docInfo?: DocInfo; tag?: string; }
interface Subcategory { title: string; articles: Article[]; }
interface Category { id: string; icon: string; label: string; color: string; bg: string; subcategories: Subcategory[]; }

const categories: Category[] = [
  {
    id: "copropriete", icon: "🏢", label: "Copropriété", color: C.teal, bg: C.tealLight,
    subcategories: [
      { title: "Documents de copropriété", articles: [
        { title: "Comment analyser un PV d'AG avant d'acheter un appartement", slug: "analyser-pv-ag-avant-achat", description: "Les 5 points clés à vérifier dans un procès-verbal d'assemblée générale pour éviter les mauvaises surprises.", docInfo: { emoji: "💡", label: "PV d'AG", definition: "Le procès-verbal d'assemblée générale est le compte-rendu officiel des décisions votées par les copropriétaires. Il est rédigé par le syndic après chaque réunion annuelle." }, tag: "Essentiel" },
        { title: "Règlement de copropriété : les 7 clauses à vérifier absolument", slug: "reglement-copropriete-clauses-verifier", description: "Usage du lot, répartition des charges, parties privatives et communes — ce que cache ce document fondateur.", docInfo: { emoji: "💡", label: "Règlement de copropriété", definition: "Document juridique qui définit les règles de vie de l'immeuble, la destination des lots et la répartition des charges entre copropriétaires." }, tag: "Essentiel" },
        { title: "Pourquoi lire les 3 derniers PV d'AG avant d'acheter en copropriété", slug: "lire-3-derniers-pv-ag-copropriete", description: "Un seul PV ne suffit pas. Comparer trois années révèle les tendances, les travaux reportés et les tensions récurrentes." },
        { title: "Carnet d'entretien de l'immeuble : ce qu'il faut y chercher", slug: "carnet-entretien-immeuble", description: "Historique des travaux, maintenance des équipements, conformité réglementaire — un document souvent négligé.", docInfo: { emoji: "💡", label: "Carnet d'entretien", definition: "Document tenu par le syndic qui liste l'historique des travaux réalisés, les contrats d'entretien en cours et les équipements communs de l'immeuble." } },
        { title: "Fiche synthétique de copropriété : à quoi ça sert et comment la lire", slug: "fiche-synthetique-copropriete", description: "Ce résumé annuel obligatoire donne un aperçu rapide de la santé de votre future copropriété.", docInfo: { emoji: "💡", label: "Fiche synthétique", definition: "Document obligatoire établi chaque année par le syndic, regroupant les données financières et techniques essentielles de la copropriété." } },
      ]},
      { title: "Finances & Charges", articles: [
        { title: "Charges de copropriété : comment savoir si elles sont trop élevées", slug: "charges-copropriete-trop-elevees", description: "Comparer les charges au m², analyser le budget prévisionnel et repérer les postes anormaux." },
        { title: "Appels de fonds exceptionnels : comment les repérer dans les documents", slug: "appels-fonds-exceptionnels-documents", description: "Travaux votés, ravalement, toiture — comment anticiper les dépenses qui viendront après votre achat." },
        { title: "État daté : ce que ce document révèle sur le vendeur et la copropriété", slug: "etat-date-document-vendeur", description: "Dettes du vendeur, provisions versées, situation financière du lot — tout ce que l'état daté contient.", docInfo: { emoji: "💡", label: "État daté", definition: "Document comptable fourni par le syndic qui détaille la situation financière du lot vendu : charges dues, provisions versées et dettes éventuelles du vendeur." } },
        { title: "Fonds de travaux obligatoire : ce que ça change pour l'acheteur en 2026", slug: "fonds-travaux-obligatoire-2026", description: "Depuis la loi ALUR, chaque copropriété doit constituer un fonds de travaux. Impact concret sur votre achat." },
        { title: "Impayés en copropriété : comment détecter le risque avant d'acheter", slug: "impayes-copropriete-detecter-risque", description: "Des copropriétaires qui ne paient pas leurs charges fragilisent tout l'immeuble. Comment repérer les signaux." },
      ]},
    ],
  },
  {
    id: "diagnostics", icon: "🔍", label: "Diagnostics", color: C.amber, bg: C.amberBg,
    subcategories: [
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
    ],
  },
  {
    id: "acheteurs", icon: "🏠", label: "Acheteurs", color: C.green, bg: C.greenBg,
    subcategories: [
      { title: "Avant de signer", articles: [
        { title: "Les 10 documents à exiger avant de faire une offre d'achat", slug: "10-documents-avant-offre-achat", description: "La checklist complète des pièces à demander au vendeur ou à l'agent avant de vous engager.", tag: "Essentiel" },
        { title: "Compromis de vente : les clauses à lire avant de signer", slug: "compromis-vente-clauses-lire", description: "Conditions suspensives, délai de rétractation, clauses pénales — ce que vous devez comprendre.", docInfo: { emoji: "💡", label: "Compromis de vente", definition: "Avant-contrat qui engage vendeur et acheteur. Il fixe le prix, les conditions et ouvre un délai de rétractation de 10 jours pour l'acheteur." } },
        { title: "Premier achat immobilier : les pièges documentaires à éviter", slug: "premier-achat-pieges-documentaires", description: "Guide spécial primo-accédants. Les erreurs les plus fréquentes et comment les éviter facilement.", tag: "Primo-accédant" },
        { title: "Que vérifier dans les 10 jours de rétractation", slug: "verifier-10-jours-retractation", description: "Vous avez signé le compromis. Voici exactement quoi vérifier pendant le délai légal de réflexion." },
      ]},
      { title: "Négociation", articles: [
        { title: "5 arguments de négociation cachés dans les documents de copropriété", slug: "arguments-negociation-documents-copropriete", description: "Travaux votés, charges en hausse, impayés, DPE dégradé — des leviers que la plupart des acheteurs ignorent." },
        { title: "Comment utiliser le DPE pour négocier le prix d'achat", slug: "utiliser-dpe-negocier-prix", description: "Un DPE F ou G peut justifier une décote de 5 à 15%. Comment argumenter face au vendeur." },
        { title: "Travaux votés en AG : un levier de négociation souvent ignoré", slug: "travaux-votes-ag-levier-negociation", description: "Si des travaux ont été votés avant la vente, l'acheteur paie les appels de fonds. Comment en tenir compte." },
      ]},
    ],
  },
  {
    id: "vendeurs", icon: "📋", label: "Vendeurs", color: C.violet, bg: C.violetBg,
    subcategories: [
      { title: "Préparer sa vente", articles: [
        { title: "Liste complète des documents obligatoires pour vendre en 2026", slug: "documents-obligatoires-vendre-2026", description: "DDT, état daté, fiche synthétique, DPE — tout ce que le vendeur doit fournir et à quel moment.", tag: "Essentiel" },
        { title: "DDT : tout ce que le Dossier de Diagnostics Techniques doit contenir", slug: "ddt-dossier-diagnostics-techniques", description: "Les diagnostics obligatoires selon le type de bien, leur durée de validité et les sanctions en cas d'absence.", docInfo: { emoji: "💡", label: "DDT", definition: "Le Dossier de Diagnostics Techniques regroupe l'ensemble des diagnostics obligatoires (DPE, amiante, plomb, électricité, gaz, ERP, etc.) à fournir à l'acheteur." } },
        { title: "Vendre en copropriété : les documents spécifiques à fournir", slug: "vendre-copropriete-documents-specifiques", description: "Au-delà du DDT, la vente en copropriété impose des documents supplémentaires. Liste complète." },
      ]},
      { title: "Valoriser son bien", articles: [
        { title: "Comment présenter ses documents pour rassurer l'acheteur", slug: "presenter-documents-rassurer-acheteur", description: "Un dossier complet et bien organisé accélère la vente et justifie votre prix." },
        { title: "Vendre une passoire thermique : stratégies pour ne pas brader", slug: "vendre-passoire-thermique-strategies", description: "DPE F ou G ne signifie pas vendre à perte. Comment valoriser malgré un mauvais diagnostic." },
      ]},
    ],
  },
  {
    id: "professionnels", icon: "💼", label: "Professionnels", color: C.rose, bg: C.roseBg,
    subcategories: [
      { title: "Agents & Mandataires", articles: [
        { title: "Mandataire immobilier : comment analyser un dossier en 10 minutes", slug: "mandataire-analyser-dossier-10-minutes", description: "Méthode rapide pour pré-analyser les documents d'un bien et identifier les points bloquants." },
        { title: "Comment se différencier en tant qu'agent grâce à l'analyse documentaire", slug: "agent-differencier-analyse-documentaire", description: "Proposer un rapport d'analyse à vos clients acquéreurs : un service qui fidélise et vous démarque." },
        { title: "Mandataires IAD, SAFTI, Capifrance : optimiser son temps sur les dossiers", slug: "mandataires-iad-safti-capifrance-optimiser", description: "En tant qu'indépendant, chaque minute compte. Comment automatiser la pré-analyse sans sacrifier la qualité." },
        { title: "Sécuriser ses transactions : la checklist documentaire de l'agent", slug: "securiser-transactions-checklist-agent", description: "Les documents à vérifier systématiquement pour éviter les litiges post-vente et protéger votre responsabilité.", tag: "Essentiel" },
        { title: "Fidéliser ses clients acquéreurs avec un rapport d'analyse clair", slug: "fideliser-clients-rapport-analyse", description: "Offrir de la transparence documentaire à vos clients pour bâtir la confiance et générer des recommandations." },
      ]},
      { title: "Investisseurs & Marchands de biens", articles: [
        { title: "Due diligence documentaire : la checklist de l'investisseur immobilier", slug: "due-diligence-checklist-investisseur", description: "Les documents à analyser méthodiquement avant tout investissement. Risques, rentabilité, conformité.", tag: "Essentiel" },
        { title: "Analyser un immeuble de rapport : les documents clés", slug: "analyser-immeuble-rapport-documents", description: "PV d'AG, état daté, DPE collectif, baux en cours — la méthode pour évaluer un immeuble entier." },
        { title: "Marchand de biens : détecter les bonnes affaires dans les PV d'AG", slug: "marchand-biens-bonnes-affaires-pv-ag", description: "Travaux refusés, copropriété en difficulté, lots sous-évalués — transformer les problèmes en opportunités." },
        { title: "Investissement locatif : ce que les documents révèlent sur la rentabilité réelle", slug: "investissement-locatif-documents-rentabilite", description: "Charges réelles, travaux à venir, DPE contraignant — calculer le vrai rendement au-delà du prix affiché." },
        { title: "Copropriétés en difficulté : repérer les signaux dans les documents", slug: "coproprietes-difficulte-signaux-documents", description: "Impayés chroniques, procédures judiciaires, syndic provisoire — les red flags à identifier avant d'investir." },
        { title: "Acheter en lot : comment analyser plusieurs biens rapidement", slug: "acheter-lot-analyser-plusieurs-biens", description: "Méthode pour évaluer un portefeuille de biens sans passer des semaines sur chaque dossier." },
      ]},
    ],
  },
];

/* ══════════════════════════════════════════
   COMPONENTS
══════════════════════════════════════════ */
function DocInfoBadge({ info }: { info: DocInfo }) {
  return (
    <div className="mt-3 rounded-xl border border-[#e0eff5] text-center"
      style={{ background: "linear-gradient(135deg, #f0f8fc 0%, #f8fafc 100%)", padding: "14px 16px" }}>
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <span className="text-lg">{info.emoji}</span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.teal }}>{info.label}</span>
      </div>
      <p className="text-[13px] leading-relaxed m-0" style={{ color: C.slate }}>{info.definition}</p>
    </div>
  );
}

function ArticleCard({ article, catColor }: { article: Article; catColor: string }) {
  return (
    <Link to={`/guides/${article.slug}`} className="block no-underline group">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col gap-1.5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg"
        style={{ borderColor: undefined }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = catColor + '50'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; }}
      >
        {article.tag && (
          <div className="mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ color: catColor, background: catColor + '12' }}>
              {article.tag}
            </span>
          </div>
        )}
        <h3 className="text-[15px] sm:text-base font-bold leading-snug m-0" style={{ color: C.dark }}>{article.title}</h3>
        <p className="text-sm leading-relaxed m-0" style={{ color: C.slate }}>{article.description}</p>
        {article.docInfo && <DocInfoBadge info={article.docInfo} />}
        <div className="flex items-center gap-1 mt-2 text-[13px] font-semibold" style={{ color: catColor }}>
          Lire le guide <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function GuidesPage() {
  const [activeCat, setActiveCat] = useState("copropriete");
  const [search, setSearch] = useState("");
  const cat = categories.find((c) => c.id === activeCat)!;

  useSEO({
    title: "Guides immobiliers — Comprendre vos documents avant d'acheter | Verimo",
    description: "PV d'AG, DPE, diagnostics, règlement de copropriété, compromis de vente… Nos guides pratiques vous aident à analyser chaque document immobilier avant de signer.",
    canonical: '/guides',
  });

  // scroll to top on category change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  const filtered = useMemo(() => {
    if (!cat) return [];
    if (!search) return cat.subcategories;
    return cat.subcategories.map((sub) => ({
      ...sub,
      articles: sub.articles.filter((a) => {
        const q = search.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || (a.docInfo && a.docInfo.label.toLowerCase().includes(q));
      }),
    })).filter((s) => s.articles.length > 0);
  }, [cat, search]);

  const totalArticles = categories.reduce((a, c) => a + c.subcategories.reduce((b, s) => b + s.articles.length, 0), 0);

  return (
    <div className="bg-white text-[#0f172a] antialiased overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)" }}>
        <div className="max-w-4xl mx-auto px-5 pt-16 sm:pt-20 pb-10 sm:pb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: _lowPerf ? 4 : 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: _lowPerf ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-[13px] font-semibold border"
            style={{ color: C.teal, background: C.tealLight, borderColor: C.teal + '25' }}>
            <BookOpen size={14} /> {totalArticles} guides pratiques
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: _lowPerf ? 6 : 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: _lowPerf ? 0.18 : 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="font-black tracking-tight leading-[1.1] mb-4"
            style={{ fontSize: "clamp(28px, 5vw, 44px)", color: C.dark }}>
            Guides pratiques pour votre{' '}
            <span className="relative inline-block">
              <span style={{ color: C.teal }}>achat immobilier</span>
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] sm:h-[4px] rounded-full origin-left block"
                style={{ background: C.teal + '30' }} />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: _lowPerf ? 4 : 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: _lowPerf ? 0.15 : 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="text-base sm:text-lg max-w-lg mx-auto mb-8 leading-relaxed" style={{ color: C.slate }}>
            Comprenez chaque document, détectez les risques et négociez en connaissance de cause — avant de signer.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: _lowPerf ? 4 : 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: _lowPerf ? 0.15 : 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
            <input
              type="text"
              placeholder="Rechercher un guide (DPE, charges, PV d'AG…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-[15px] outline-none transition-all duration-200 focus:ring-2"
              style={{
                borderColor: C.border, color: C.dark, background: C.white,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
            />
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED ARTICLE ── */}
      {!search && (
        <section className="px-5">
          <Link to="/guides/10-documents-avant-offre-achat" className="block no-underline">
            <div className="max-w-4xl mx-auto rounded-2xl p-6 sm:p-8 relative overflow-hidden mb-8 group cursor-pointer transition-all duration-200 hover:shadow-xl"
              style={{ background: "linear-gradient(135deg, #0f2d3d 0%, #1a4a5e 100%)", color: C.white }}>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: "rgba(42,125,156,0.15)" }} />
              <div className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ opacity: 0.65 }}>
                🧭 Par où commencer
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold leading-snug mb-2 relative">Les 10 documents à exiger avant de faire une offre d'achat</h2>
              <p className="text-sm sm:text-[15px] leading-relaxed mb-4 max-w-xl relative" style={{ opacity: 0.8 }}>
                La checklist complète pour ne rien oublier : diagnostics, PV d'AG, règlement de copropriété, état daté, compromis… Tout ce qu'un acheteur doit demander avant de s'engager.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "#5cb8d4" }}>
                Lire ce guide <ChevronRight size={15} />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* ── CATEGORY NAVIGATION ── */}
      <section className="px-5 mb-8">
        <div className="max-w-4xl mx-auto flex gap-2 flex-wrap justify-center">
          {categories.map((c) => {
            const active = c.id === activeCat;
            const cnt = c.subcategories.reduce((a, s) => a + s.articles.length, 0);
            return (
              <button key={c.id}
                onClick={() => { setActiveCat(c.id); setSearch(""); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2"
                style={{
                  borderColor: active ? c.color : 'transparent',
                  background: active ? c.bg : C.slateLight,
                  color: active ? c.color : C.slate,
                  fontWeight: active ? 700 : 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}>
                <span className="text-lg">{c.icon}</span>
                <span className="hidden sm:inline">{c.label}</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: active ? c.color + '20' : '#e2e8f0', color: active ? c.color : C.slate }}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── ARTICLES ── */}
      <section className="px-5 pb-16">
        <div className="max-w-4xl mx-auto">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-base mb-4" style={{ color: C.slate }}>Aucun guide trouvé pour « {search} »</p>
              <button onClick={() => setSearch("")}
                className="px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
                style={{ borderColor: C.border, color: C.teal, background: C.white, cursor: "pointer", fontFamily: "inherit" }}>
                Réinitialiser la recherche
              </button>
            </div>
          )}

          {filtered.map((sub, si) => (
            <div key={si} className="mb-12">
              <div className="flex items-center gap-3 mb-5 pb-3" style={{ borderBottom: `2px solid ${cat.color}20` }}>
                <div className="w-1 h-6 rounded-sm" style={{ background: cat.color }} />
                <h2 className="text-lg sm:text-xl font-extrabold m-0" style={{ color: C.dark }}>{sub.title}</h2>
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: C.slateLight, color: C.slate }}>
                  {sub.articles.length} {sub.articles.length > 1 ? 'guides' : 'guide'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sub.articles.map((a, ai) => (
                  <ArticleCard key={ai} article={a} catColor={cat.color} />
                ))}
              </div>
            </div>
          ))}

          {/* CTA */}
          <div className="rounded-2xl text-center p-8 sm:p-12 mt-8"
            style={{ background: "linear-gradient(135deg, #0f2d3d 0%, #1a4a5e 100%)", color: C.white }}>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-3 tracking-tight">Vous avez vos documents ?</h2>
            <p className="text-sm sm:text-base mb-6 max-w-md mx-auto" style={{ opacity: 0.8 }}>
              Verimo analyse vos PV d'AG, diagnostics, DPE, règlement de copropriété et plus encore en quelques secondes.
            </p>
            <Link to="/start"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-sm sm:text-base font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 no-underline"
              style={{ color: C.dark }}>
              <ShieldCheck size={18} /> Lancer mon analyse
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
