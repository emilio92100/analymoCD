import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Mail, Shield, Zap, FileText, ArrowRight, Star } from 'lucide-react';
import { PRICING_PLANS } from '../types';

export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f9]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 88 }}>

      {/* HERO */}
      <section className="px-4 md:px-6 pt-12 pb-10 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/20 bg-white text-[#1a5e78] text-sm font-semibold mb-5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
          Tarification transparente
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="text-[clamp(28px,5.5vw,64px)] font-black tracking-[-0.03em] text-[#0f172a] mb-4 leading-[1.08]">
          Des tarifs simples,<br />
          <span className="text-[#2a7d9c]">sans surprise.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="text-base md:text-xl text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
          Payez uniquement pour ce dont vous avez besoin. Sans abonnement, sans engagement.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex justify-center gap-5 flex-wrap">
          {[
            { I: Shield, l: 'Paiement sécurisé Stripe' },
            { I: Zap, l: 'Résultats en 30 secondes*' },
            { I: FileText, l: 'Rapport PDF inclus' },
          ].map(({ I, l }) => (
            <div key={l} className="flex items-center gap-2 text-sm text-slate-400 font-medium">
              <I size={14} className="text-[#2a7d9c] shrink-0" /> {l}
            </div>
          ))}
        </motion.div>
      </section>

      {/* CARDS */}
      <section className="px-4 md:px-6 pb-16">
        <div className="max-w-5xl mx-auto">

          {/* Mobile + desktop : cards empilées proprement */}
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-5 md:items-start mb-8">
            {PRICING_PLANS.map((plan, i) => {
              const isHighlighted = plan.highlighted;

              if (isHighlighted) {
                return (
                  <motion.div key={plan.id}
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                    className="relative md:col-span-1 mt-6 md:mt-5">
                    {/* Badge flottant */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #2a7d9c, #1a5e78)', color: 'white' }}>
                      <Star size={10} fill="white" /> Le plus populaire
                    </div>

                    {/* Carte verte/claire — recommandée */}
                    <div className="relative rounded-2xl md:rounded-3xl overflow-hidden ring-2 ring-[#2a7d9c]/30 shadow-xl"
                      style={{ background: 'linear-gradient(145deg, #f0fdf4 0%, #e8f8f5 60%, #f0f9ff 100%)' }}>
                      {/* Barre couleur en haut */}
                      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #22c55e, #2a7d9c)' }} />

                      <div className="p-6 md:p-7 pt-8">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#2a7d9c] mb-4">{plan.name}</p>
                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-[52px] md:text-[56px] font-black leading-none text-[#0f172a]">
                            {plan.price.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xl mb-2 text-slate-400 font-semibold">€</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-5">paiement unique · sans abonnement</p>

                        <div className="h-px bg-[#2a7d9c]/15 mb-5" />

                        <p className="text-xs font-bold uppercase tracking-wider text-[#2a7d9c] mb-1.5">Idéal pour</p>
                        <p className="text-sm text-slate-600 leading-relaxed mb-5">{plan.idealFor}</p>

                        <ul className="flex flex-col gap-2.5 mb-6">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-start gap-2.5">
                              <CheckCircle2 size={14} className="text-[#22c55e] shrink-0 mt-0.5" />
                              <span className="text-sm text-slate-600 leading-snug">{f}</span>
                            </li>
                          ))}
                        </ul>

                        <Link to={`/inscription?plan=${plan.id}`}
                          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white' }}>
                          {plan.cta} <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div key={plan.id}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                  className="relative">
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full bg-[#f59e0b] text-[#0f172a] text-xs font-bold whitespace-nowrap shadow-md">
                      {plan.badge}
                    </div>
                  )}
                  <motion.div
                    whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(15,45,61,0.1)" }}
                    className={`relative flex flex-col rounded-2xl md:rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden transition-shadow duration-200 ${plan.badge ? 'pt-2' : ''}`}>
                    <div className="p-6 md:p-7 flex flex-col flex-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{plan.name}</p>
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-[48px] md:text-[52px] font-black leading-none text-[#0f172a]">
                          {plan.price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-lg mb-2 text-slate-300 font-semibold">€</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-5">paiement unique · sans abonnement</p>

                      <div className="h-px bg-slate-100 mb-5" />

                      <p className="text-xs font-bold uppercase tracking-wider text-[#2a7d9c] mb-1.5">Idéal pour</p>
                      <p className="text-sm text-slate-500 leading-relaxed mb-5">{plan.idealFor}</p>

                      <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2.5">
                            <CheckCircle2 size={14} className="text-[#22c55e] shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-500 leading-snug">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <Link to={`/inscription?plan=${plan.id}`}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#0f2d3d] text-white text-sm font-bold hover:bg-[#0f2d3d]/90 transition-all duration-200">
                        {plan.cta} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Garanties */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            {[
              { I: Shield, t: 'Paiement sécurisé', s: 'Via Stripe' },
              { I: FileText, t: 'PDF inclus', s: 'Dans tous les plans' },
              { I: Zap, t: '30 secondes*', s: 'Résultats immédiats' },
              { I: Crown, t: 'Sans abonnement', s: 'Payez une fois' },
            ].map(({ I, t, s }, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-[#2a7d9c]/8 flex items-center justify-center shrink-0">
                  <I size={15} className="text-[#2a7d9c]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0f172a]">{t}</p>
                  <p className="text-[10px] text-slate-400">{s}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Offre Pro */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl md:rounded-3xl bg-white border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-14">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center shrink-0">
                <Crown size={22} className="text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-[#0f172a] mb-0.5">Offre Professionnelle</h3>
                <p className="text-sm text-slate-400 max-w-lg">Notaires, agents, syndics — volumes illimités, support prioritaire.</p>
              </div>
            </div>
            <Link to="/contact"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f2d3d] text-white text-sm font-bold whitespace-nowrap hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <Mail size={14} /> Nous contacter
            </Link>
          </motion.div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-[clamp(22px,3.5vw,36px)] font-black text-[#0f172a] text-center mb-8 tracking-tight">
              Questions fréquentes
            </motion.h2>
            <div className="flex flex-col gap-3">
              {[
                { q: 'Comment fonctionne le paiement ?', a: 'Paiement sécurisé via Stripe. Votre rapport est disponible immédiatement après confirmation.' },
                { q: 'Mes documents sont-ils sécurisés ?', a: "Vos fichiers sont chiffrés et supprimés automatiquement après traitement. Aucune donnée n'est conservée." },
                { q: 'Puis-je me faire rembourser ?', a: 'En cas de problème technique, contactez-nous sous 48h. Nous étudions chaque demande.' },
              ].map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-5 md:p-6 rounded-xl md:rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <h4 className="text-sm md:text-base font-bold text-[#0f172a] mb-1.5">{faq.q}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-6 italic">* Pour les documents PDF nativement numériques. Les documents scannés peuvent nécessiter un délai supplémentaire.</p>
          </div>

        </div>
      </section>

      <style>{`@keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </main>
  );
}
