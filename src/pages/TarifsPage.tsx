import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Mail, Shield, Zap, FileText, ArrowRight, Star, Check } from 'lucide-react';

const plans = [
  {
    id: 'document',
    name: 'Document',
    price: '4,90',
    sub: '1 document',
    idealFor: 'Lever un doute sur un document précis avant de décider.',
    features: [
      "Analyse d'un seul document",
      "PV d'AG, règlement, diagnostic ou appel de charges",
      'Résumé clair des points clés',
      'Rapport PDF téléchargeable',
    ],
    cta: 'Analyser un document',
    highlighted: false,
    badge: null,
    accent: '#2a7d9c',
    accentLight: 'rgba(42,125,156,0.07)',
  },
  {
    id: 'complete',
    name: 'Analyse complète',
    price: '19,90',
    sub: 'Documents illimités',
    idealFor: 'Comprendre un bien en profondeur avant de faire une offre.',
    features: [
      'Analyse multi-documents illimitée',
      'Score global /10 du bien',
      'Travaux, charges, risques, procédures',
      'Recommandation personnalisée',
      'Rapport PDF complet',
    ],
    cta: 'Analyser un bien',
    highlighted: true,
    badge: 'Le plus populaire',
    accent: '#16a34a',
    accentLight: 'rgba(22,163,74,0.07)',
  },
  {
    id: 'pack2',
    name: 'Pack 2 biens',
    price: '29,90',
    sub: '2 crédits complets',
    idealFor: 'Comparer deux biens pour choisir le meilleur.',
    features: [
      '2 analyses complètes',
      'Comparaison côte à côte',
      'Économisez 10€ vs 2 analyses',
      'Rapport de comparaison',
    ],
    cta: 'Comparer 2 biens',
    highlighted: false,
    badge: 'Économique',
    accent: '#f59e0b',
    accentLight: 'rgba(245,158,11,0.07)',
  },
  {
    id: 'pack3',
    name: 'Pack 3 biens',
    price: '39,90',
    sub: '3 crédits complets',
    idealFor: 'Analyser plusieurs biens et trouver le meilleur.',
    features: [
      '3 analyses complètes',
      'Comparaison avancée',
      'Économisez 20€ vs 3 analyses',
      'Classement et recommandation finale',
    ],
    cta: 'Comparer 3 biens',
    highlighted: false,
    badge: null,
    accent: '#7c3aed',
    accentLight: 'rgba(124,58,237,0.07)',
  },
];

export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f9]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 88 }}>

      {/* ── HERO ── */}
      <section className="px-4 md:px-10 lg:px-20 pt-12 pb-10 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/20 bg-white text-[#1a5e78] text-sm font-semibold mb-5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
          Tarification transparente
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className="text-[clamp(28px,5vw,60px)] font-black tracking-[-0.03em] text-[#0f172a] mb-4 leading-[1.08]">
          Des tarifs simples,<br />
          <span className="text-[#2a7d9c]">sans surprise.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.13 }}
          className="text-base md:text-lg text-slate-500 max-w-lg mx-auto mb-7 leading-relaxed">
          Payez uniquement pour ce dont vous avez besoin. Sans abonnement, sans engagement.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          className="flex justify-center gap-5 flex-wrap">
          {[
            { I: Shield, l: 'Paiement sécurisé Stripe' },
            { I: Zap, l: 'Résultats en 30 secondes*' },
            { I: FileText, l: 'Rapport PDF inclus' },
          ].map(({ I, l }) => (
            <div key={l} className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
              <I size={13} className="text-[#2a7d9c] shrink-0" /> {l}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── CARDS ── */}
      <section className="px-4 md:px-10 lg:px-20 pb-16">
        <div className="max-w-[1400px] mx-auto">

          {/* Mobile : liste verticale compacte */}
          <div className="flex flex-col gap-3 md:hidden mb-10">
            {plans.map((plan, i) => (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`relative rounded-2xl overflow-hidden ${plan.highlighted ? 'ring-2 ring-[#16a34a]/40 shadow-lg' : 'bg-white border border-slate-100 shadow-sm'}`}
                style={plan.highlighted ? { background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' } : {}}>

                {plan.badge && (
                  <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{
                      background: plan.highlighted ? '#16a34a' : plan.badge === 'Économique' ? '#f59e0b' : '#e2e8f0',
                      color: plan.highlighted || plan.badge === 'Économique' ? 'white' : '#64748b',
                    }}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-5 flex items-center gap-5">
                  {/* Prix à gauche */}
                  <div className="shrink-0 text-center w-20">
                    <div className="text-[36px] font-black leading-none text-[#0f172a]">{plan.price}</div>
                    <div className="text-lg font-black leading-none text-[#0f172a]">€</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">{plan.sub}</div>
                  </div>

                  {/* Séparateur */}
                  <div className="w-px h-16 bg-slate-100 shrink-0" />

                  {/* Contenu à droite */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: plan.accent }}>{plan.name}</p>
                    <p className="text-sm text-slate-600 leading-snug mb-3">{plan.idealFor}</p>
                    <Link to={`/inscription?plan=${plan.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200"
                      style={{ background: plan.highlighted ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#0f2d3d' }}>
                      {plan.cta} <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* Features dépliées */}
                <div className="px-5 pb-4 flex flex-wrap gap-x-4 gap-y-1">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="shrink-0" style={{ color: plan.accent }} />
                      <span className="text-[11px] text-slate-500">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop : grille pleine largeur */}
          <div className="hidden md:grid grid-cols-4 gap-5 mb-10 items-start">
            {plans.map((plan, i) => (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                className={`relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300 ${
                  plan.highlighted
                    ? 'ring-2 ring-[#16a34a]/40 shadow-2xl mt-0'
                    : 'bg-white border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-xl'
                }`}
                style={plan.highlighted ? { background: 'linear-gradient(145deg, #f0fdf4 0%, #ecfdf5 60%, #f0fffe 100%)' } : {}}>

                {/* Barre accent en haut */}
                <div className="h-1 w-full shrink-0" style={{ background: plan.highlighted
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : `linear-gradient(90deg, ${plan.accent}60, ${plan.accent}30)` }} />

                {plan.badge && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold z-10"
                    style={{
                      background: plan.highlighted ? '#16a34a' : plan.badge === 'Économique' ? '#f59e0b' : '#f1f5f9',
                      color: plan.highlighted || plan.badge === 'Économique' ? 'white' : '#64748b',
                    }}>
                    {plan.highlighted && <Star size={9} className="inline mr-1" fill="white" />}
                    {plan.badge}
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  {/* Nom + prix */}
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: plan.accent }}>{plan.name}</p>

                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-[52px] font-black leading-none text-[#0f172a]">{plan.price}</span>
                    <span className="text-xl mb-2 font-bold text-slate-300">€</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-1">{plan.sub}</p>
                  <p className="text-xs text-slate-400 mb-5">paiement unique · sans abonnement</p>

                  <div className="h-px mb-5" style={{ background: plan.highlighted ? 'rgba(22,163,74,0.15)' : '#f1f5f9' }} />

                  {/* Idéal pour */}
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: plan.accent }}>Idéal pour</p>
                  <p className="text-sm text-slate-500 leading-relaxed mb-5">{plan.idealFor}</p>

                  {/* Features */}
                  <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: plan.highlighted ? '#16a34a' : plan.accent }} />
                        <span className="text-sm text-slate-500 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link to={`/inscription?plan=${plan.id}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                    style={plan.highlighted
                      ? { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', boxShadow: '0 4px 20px rgba(22,163,74,0.3)' }
                      : { background: '#0f2d3d', color: 'white' }}>
                    {plan.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── BANDEAU GARANTIES ── */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 md:p-6 mb-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { I: Shield, t: 'Paiement sécurisé', s: 'Via Stripe, chiffré' },
                { I: FileText, t: 'PDF inclus', s: 'Dans tous les plans' },
                { I: Zap, t: '30 secondes*', s: 'Résultats immédiats' },
                { I: Crown, t: 'Sans abonnement', s: 'Payez une seule fois' },
              ].map(({ I, t, s }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#2a7d9c]/8 flex items-center justify-center shrink-0">
                    <I size={15} className="text-[#2a7d9c]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0f172a]">{t}</p>
                    <p className="text-[10px] text-slate-400">{s}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── OFFRE PRO + FAQ côte à côte sur desktop ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

            {/* Offre Pro */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col justify-between">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center shrink-0">
                  <Crown size={22} className="text-[#f59e0b]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a] mb-1">Offre Professionnelle</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Notaires, agents immobiliers, syndics, marchands de biens — volumes illimités, support prioritaire et tarification dédiée.</p>
                </div>
              </div>
              <Link to="/contact"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#0f2d3d] text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <Mail size={14} /> Nous contacter
              </Link>
            </motion.div>

            {/* FAQ */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
              className="flex flex-col gap-3">
              {[
                { q: 'Comment fonctionne le paiement ?', a: 'Paiement sécurisé via Stripe. Votre rapport est disponible immédiatement après confirmation.' },
                { q: 'Mes documents sont-ils sécurisés ?', a: "Vos fichiers sont chiffrés et supprimés automatiquement après traitement. Aucune donnée n'est conservée." },
                { q: 'Puis-je me faire rembourser ?', a: 'En cas de problème technique, contactez-nous sous 48h. Nous étudions chaque demande au cas par cas.' },
              ].map((faq, i) => (
                <div key={i} className="p-5 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex items-start gap-2.5 mb-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#2a7d9c]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={9} className="text-[#2a7d9c]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#0f172a]">{faq.q}</h4>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-xs text-slate-400 text-center italic">
            * Pour les documents PDF nativement numériques. Les documents scannés peuvent nécessiter un délai supplémentaire.
          </p>

        </div>
      </section>

      <style>{`@keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </main>
  );
}
