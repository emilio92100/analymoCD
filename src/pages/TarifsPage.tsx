import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Mail, Shield, Zap, FileText, ArrowRight, Star, Check } from 'lucide-react';

const plans = [
  {
    id: 'document', name: 'Analyse Document', price: '4,90', sub: '1 document',
    idealFor: 'Lever un doute sur un document précis avant de se décider.',
    features: ["Analyse d'un seul document", "PV d'AG, règlement, diagnostic ou appel de charges", 'Résumé clair des points clés', 'Rapport PDF téléchargeable'],
    cta: 'Analyser un document', highlighted: false, badge: null,
  },
  {
    id: 'complete', name: 'Analyse Complète', price: '19,90', sub: 'Documents illimités',
    idealFor: 'Comprendre un bien en profondeur avant de faire une offre.',
    features: ['Analyse multi-documents illimitée', 'Score global /10 du bien', 'Travaux, charges, risques, procédures', 'Recommandation personnalisée', 'Rapport PDF complet'],
    cta: 'Analyser un bien', highlighted: true, badge: 'Le plus populaire',
  },
  {
    id: 'pack2', name: 'Pack 2 Biens', price: '29,90', sub: '2 crédits complets',
    idealFor: 'Vous hésitez entre deux biens ? Uploadez les documents des deux et laissez Verimo les comparer côte à côte pour vous aider à décider.',
    features: ['2 analyses complètes indépendantes', 'Rapport de comparaison côte à côte', 'Score /10 pour chaque bien', 'Recommandation Verimo : quel bien choisir ?', 'Économisez 10€ vs 2 analyses séparées'],
    cta: 'Comparer 2 biens', highlighted: false, badge: 'Économique',
  },
  {
    id: 'pack3', name: 'Pack 3 Biens', price: '39,90', sub: '3 crédits complets',
    idealFor: 'Vous avez 3 biens en tête ? Comparez-les tous en un seul achat. Verimo génère 3 rapports indépendants et un classement final pour vous aider à faire le meilleur choix.',
    features: ['3 analyses complètes indépendantes', 'Comparaison des 3 biens côte à côte', 'Score /10 pour chaque bien', 'Classement final + recommandation Verimo', 'Économisez 20€ vs 3 analyses séparées'],
    cta: 'Comparer 3 biens', highlighted: false, badge: 'Meilleure valeur',
  },
];

export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f9]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 88 }}>

      {/* HERO */}
      <section className="px-4 md:px-10 lg:px-20 pt-12 pb-10 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/20 bg-white text-[#1a5e78] text-sm font-semibold mb-5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
          Tarification transparente
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className="text-[clamp(28px,5vw,64px)] font-black tracking-[-0.03em] text-[#0f172a] mb-4 leading-[1.08]">
          Des tarifs simples,<br />
          <span className="text-[#2a7d9c]">sans surprise.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.13 }}
          className="text-base md:text-xl text-slate-500 max-w-lg mx-auto mb-7 leading-relaxed">
          Payez uniquement pour ce dont vous avez besoin. Sans abonnement, sans engagement.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          className="flex justify-center gap-6 flex-wrap">
          {[{ I: Shield, l: 'Paiement sécurisé Stripe' }, { I: Zap, l: 'Résultats en 30 secondes*' }, { I: FileText, l: 'Rapport PDF inclus' }].map(({ I, l }) => (
            <div key={l} className="flex items-center gap-2 text-sm md:text-base text-slate-400 font-medium">
              <I size={15} className="text-[#2a7d9c] shrink-0" /> {l}
            </div>
          ))}
        </motion.div>
      </section>

      <section className="px-4 md:px-10 lg:px-20 pb-16">
        <div className="max-w-[1400px] mx-auto">

          {/* ── MOBILE : cartes empilées ── */}
          <div className="flex flex-col gap-4 md:hidden mb-8">
            {plans.map((plan, i) => (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`rounded-2xl overflow-hidden bg-white border shadow-sm ${plan.highlighted ? 'border-[#2a7d9c]/30 ring-1 ring-[#2a7d9c]/20' : 'border-slate-100'}`}>
                {/* Barre top */}
                <div className="h-1 w-full" style={{ background: plan.highlighted ? '#2a7d9c' : '#e2e8f0' }} />
                <div className="p-5">
                  {/* En-tête */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{plan.name}</p>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black leading-none text-[#0f172a]">{plan.price}</span>
                        <span className="text-xl font-bold text-slate-300 mb-0.5">€</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{plan.sub} · paiement unique</p>
                    </div>
                    {plan.badge && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-2 whitespace-nowrap ${plan.highlighted ? 'bg-[#2a7d9c] text-white' : 'bg-[#f59e0b] text-white'}`}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  {/* Idéal pour */}
                  <div className="bg-[#f4f7f9] rounded-xl p-3 mb-4">
                    <p className="text-xs font-bold text-[#2a7d9c] uppercase tracking-wider mb-1">Idéal pour</p>
                    <p className="text-sm text-slate-600 leading-snug">{plan.idealFor}</p>
                  </div>
                  {/* Features */}
                  <ul className="flex flex-col gap-2 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className="text-[#22c55e] shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {/* CTA */}
                  <Link to={`/inscription?plan=${plan.id}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
                    style={{ background: plan.highlighted ? '#2a7d9c' : '#0f2d3d', color: 'white' }}>
                    {plan.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── DESKTOP : grille 4 colonnes ── */}
          <div className="hidden md:grid grid-cols-4 gap-5 mb-8 items-stretch">
            {plans.map((plan, i) => (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                className={`relative flex flex-col rounded-3xl overflow-hidden bg-white border shadow-sm transition-all duration-300 ${
                  plan.highlighted
                    ? 'border-[#2a7d9c]/30 ring-2 ring-[#2a7d9c]/15 shadow-xl hover:-translate-y-1'
                    : 'border-slate-100 hover:-translate-y-1 hover:shadow-lg'
                }`}>
                {/* Barre top */}
                <div className="h-1 w-full shrink-0" style={{ background: plan.highlighted ? '#2a7d9c' : '#e2e8f0' }} />

                {plan.badge && (
                  <div className={`absolute top-5 right-4 px-2.5 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1 whitespace-nowrap ${
                    plan.highlighted ? 'bg-[#2a7d9c] text-white' : 'bg-[#f59e0b] text-white'
                  }`}>
                    {plan.highlighted && <Star size={9} fill="white" />}
                    {plan.badge}
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 pr-24">{plan.name}</p>

                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-[52px] font-black leading-none text-[#0f172a]">{plan.price}</span>
                    <span className="text-2xl mb-2 font-bold text-slate-300">€</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-6">{plan.sub} · paiement unique</p>

                  {/* Idéal pour — mis en avant */}
                  <div className="rounded-xl p-4 mb-6" style={{ background: plan.highlighted ? 'rgba(42,125,156,0.07)' : '#f4f7f9' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#2a7d9c] mb-1.5">Idéal pour</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{plan.idealFor}</p>
                  </div>

                  <ul className="flex flex-col gap-3 mb-7 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2 size={15} className="text-[#22c55e] shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-500 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={`/inscription?plan=${plan.id}`}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-base font-bold transition-all duration-200 hover:-translate-y-0.5 mt-auto"
                    style={{ background: plan.highlighted ? '#2a7d9c' : '#0f2d3d', color: 'white' }}>
                    {plan.cta} <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── OFFRE PRO — pleine largeur juste sous les cartes ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center shrink-0">
                <Crown size={20} className="text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-[#0f172a] mb-0.5">Offre Professionnelle</h3>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed">Notaires, agents immobiliers, syndics — volumes illimités, support prioritaire et tarification dédiée.</p>
              </div>
            </div>
            <Link to="/contact"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f2d3d] text-white text-sm font-bold whitespace-nowrap hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 shrink-0">
              <Mail size={14} /> Nous contacter
            </Link>
          </motion.div>

          {/* ── GARANTIES ── */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 md:p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { I: Shield, t: 'Paiement sécurisé', s: 'Via Stripe, chiffré' },
                { I: FileText, t: 'PDF inclus', s: 'Dans tous les plans' },
                { I: Zap, t: '30 secondes*', s: 'Résultats immédiats' },
                { I: Crown, t: 'Sans abonnement', s: 'Payez une seule fois' },
              ].map(({ I, t, s }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2a7d9c]/8 flex items-center justify-center shrink-0">
                    <I size={17} className="text-[#2a7d9c]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{t}</p>
                    <p className="text-xs text-slate-400">{s}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── FAQ ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { q: 'Comment fonctionne le paiement ?', a: 'Paiement sécurisé via Stripe. Votre rapport est disponible immédiatement après confirmation.' },
              { q: 'Mes documents sont-ils sécurisés ?', a: "Vos fichiers sont chiffrés et supprimés automatiquement après traitement. Aucune donnée n'est conservée." },
              { q: 'Puis-je me faire rembourser ?', a: 'En cas de problème technique, contactez-nous sous 48h. Nous étudions chaque demande.' },
            ].map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="p-5 md:p-6 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#2a7d9c]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} className="text-[#2a7d9c]" />
                  </div>
                  <h4 className="text-sm md:text-base font-bold text-[#0f172a]">{faq.q}</h4>
                </div>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed pl-7">{faq.a}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-xs md:text-sm text-slate-400 text-center italic">
            * Pour les documents PDF nativement numériques. Les documents scannés peuvent nécessiter un délai supplémentaire.
          </p>
        </div>
      </section>

      <style>{`@keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </main>
  );
}
