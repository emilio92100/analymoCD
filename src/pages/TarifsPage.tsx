import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Mail, Shield, Zap, FileText, ArrowRight } from 'lucide-react';
import { PRICING_PLANS } from '../types';

export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f9]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 80 }}>

      {/* ── HERO ── */}
      <section className="px-6 pt-16 pb-14 text-center max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2a7d9c]/20 bg-white text-[#1a5e78] text-xs font-semibold mb-7 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
          Tarification transparente
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="text-[clamp(36px,5vw,64px)] font-black tracking-tight text-[#0f172a] mb-5 leading-[1.1]">
          Des tarifs simples,<br />
          <span className="text-[#2a7d9c]">sans surprise.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="text-lg text-slate-500 max-w-lg mx-auto mb-10 leading-relaxed">
          Payez uniquement pour ce dont vous avez besoin. Sans abonnement, sans engagement.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex justify-center gap-8 flex-wrap">
          {[{ I: Shield, l: 'Paiement sécurisé Stripe' }, { I: Zap, l: 'Résultats en 2 min' }, { I: FileText, l: 'Rapport PDF inclus' }].map(({ I, l }) => (
            <div key={l} className="flex items-center gap-2 text-sm text-slate-400 font-medium">
              <I size={15} className="text-[#2a7d9c] shrink-0" /> {l}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.09 }}
                whileHover={{ y: plan.highlighted ? -8 : -4 }}
                className={`relative flex flex-col rounded-3xl transition-all duration-200 ${
                  plan.highlighted
                    ? 'bg-[#0f2d3d] shadow-2xl shadow-[#0f2d3d]/25 ring-2 ring-[#2a7d9c]/60'
                    : 'bg-white shadow-sm hover:shadow-xl border border-slate-100'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-lg ${
                    plan.badgeColor === 'teal' ? 'bg-[#2a7d9c] text-white' : 'bg-[#f59e0b] text-[#0f172a]'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-8 flex flex-col flex-1">

                  {/* Nom du plan */}
                  <p className={`text-xs font-bold uppercase tracking-widest mb-5 ${plan.highlighted ? 'text-[#2a7d9c]' : 'text-slate-400'}`}>
                    {plan.name}
                  </p>

                  {/* Prix */}
                  <div className="mb-2">
                    <div className="flex items-end gap-1">
                      <span className={`text-[56px] font-black leading-none tracking-tight ${plan.highlighted ? 'text-white' : 'text-[#0f172a]'}`}>
                        {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className={`text-xl mb-2 font-semibold ${plan.highlighted ? 'text-white/40' : 'text-slate-300'}`}>€</span>
                    </div>
                    <p className={`text-xs mt-1 ${plan.highlighted ? 'text-white/30' : 'text-slate-400'}`}>
                      paiement unique · sans abonnement
                    </p>
                  </div>

                  {/* Séparateur */}
                  <div className={`my-5 h-px ${plan.highlighted ? 'bg-white/10' : 'bg-slate-100'}`} />

                  {/* Idéal pour */}
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${plan.highlighted ? 'text-[#2a7d9c]' : 'text-[#2a7d9c]'}`}>
                    Idéal pour
                  </p>
                  <p className={`text-sm leading-relaxed mb-6 ${plan.highlighted ? 'text-white/55' : 'text-slate-500'}`}>
                    {plan.idealFor}
                  </p>

                  {/* Features */}
                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle2 size={15} className="text-[#22c55e] shrink-0 mt-0.5" />
                        <span className={`text-sm leading-snug ${plan.highlighted ? 'text-white/65' : 'text-slate-500'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link to={`/inscription?plan=${plan.id}`}
                    className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                      plan.highlighted
                        ? 'bg-white text-[#0f2d3d] hover:bg-slate-50 shadow-lg'
                        : 'bg-[#0f2d3d] text-white hover:bg-[#0f2d3d]/85'
                    }`}>
                    {plan.cta} <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Offre Pro */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center shrink-0">
                <Crown size={24} className="text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-1">Offre Professionnelle</h3>
                <p className="text-sm text-slate-400 max-w-lg">Notaires, agents, syndics — volumes illimités, API dédiée, support prioritaire, rapports sur-mesure.</p>
              </div>
            </div>
            <Link to="/contact"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#0f2d3d] text-white text-sm font-bold whitespace-nowrap hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <Mail size={15} /> Nous contacter
            </Link>
          </motion.div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-[clamp(24px,3vw,36px)] font-black text-[#0f172a] text-center mb-10 tracking-tight">
              Questions fréquentes
            </motion.h2>
            <div className="flex flex-col gap-4">
              {[
                { q: 'Comment fonctionne le paiement ?', a: 'Paiement sécurisé via Stripe. Votre rapport est disponible immédiatement après confirmation.' },
                { q: 'Mes documents sont-ils sécurisés ?', a: "Vos fichiers sont chiffrés et supprimés automatiquement après analyse. Aucune donnée n'est conservée." },
                { q: 'Puis-je me faire rembourser ?', a: 'En cas de problème technique, contactez-nous sous 48h. Nous étudions chaque demande.' },
              ].map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <h4 className="text-base font-bold text-[#0f172a] mb-2">{faq.q}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <style>{`@keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </main>
  );
}
