import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Mail, Shield, Zap, FileText, ArrowRight, Star } from 'lucide-react';
import { PRICING_PLANS } from '../types';

export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f9]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 88 }}>

      {/* HERO */}
      <section className="px-6 pt-16 pb-14 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/20 bg-white text-[#1a5e78] text-sm font-semibold mb-7 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
          Tarification transparente
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="text-[clamp(40px,5.5vw,72px)] font-black tracking-[-0.04em] text-[#0f172a] mb-5 leading-[1.08]">
          Des tarifs simples,<br />
          <span className="text-[#2a7d9c]">sans surprise.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="text-xl text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Payez uniquement pour ce dont vous avez besoin. Sans abonnement, sans engagement.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex justify-center gap-8 flex-wrap">
          {[{ I: Shield, l: 'Paiement sécurisé Stripe' }, { I: Zap, l: 'Résultats en 2 min' }, { I: FileText, l: 'Rapport PDF inclus' }].map(({ I, l }) => (
            <div key={l} className="flex items-center gap-2 text-base text-slate-400 font-medium">
              <I size={16} className="text-[#2a7d9c] shrink-0" /> {l}
            </div>
          ))}
        </motion.div>
      </section>

      {/* CARDS */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 items-start">
            {PRICING_PLANS.map((plan, i) => {
              const isHighlighted = plan.highlighted;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                  style={{ zIndex: isHighlighted ? 10 : 1 }}
                >
                  {isHighlighted ? (
                    /* ── CARTE MISE EN AVANT — animée ── */
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        boxShadow: [
                          "0 20px 60px rgba(42,125,156,0.25)",
                          "0 32px 80px rgba(42,125,156,0.4)",
                          "0 20px 60px rgba(42,125,156,0.25)",
                        ]
                      }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      className="relative flex flex-col rounded-3xl bg-[#0f2d3d] ring-2 ring-[#2a7d9c]/60 overflow-hidden"
                    >
                      {/* Glow top */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2a7d9c] via-[#3a9cbf] to-[#2a7d9c]" />
                      {/* Badge */}
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-[#2a7d9c] text-white text-xs font-bold whitespace-nowrap shadow-xl shadow-[#2a7d9c]/40 flex items-center gap-1.5">
                        <Star size={10} fill="white" /> Le plus populaire
                      </div>
                      <div className="p-8 pt-10 flex flex-col flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#2a7d9c] mb-5">{plan.name}</p>
                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-[60px] font-black leading-none text-white">{plan.price.toFixed(2).replace('.', ',')}</span>
                          <span className="text-2xl mb-2 text-white/35 font-semibold">€</span>
                        </div>
                        <p className="text-xs text-white/30 mb-6">paiement unique · sans abonnement</p>
                        <div className="h-px bg-white/10 mb-6" />
                        <p className="text-xs font-bold uppercase tracking-wider text-[#2a7d9c] mb-2">Idéal pour</p>
                        <p className="text-sm text-white/55 leading-relaxed mb-7">{plan.idealFor}</p>
                        <ul className="flex flex-col gap-3 mb-9 flex-1">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-start gap-3">
                              <CheckCircle2 size={15} className="text-[#22c55e] shrink-0 mt-0.5" />
                              <span className="text-sm text-white/65 leading-snug">{f}</span>
                            </li>
                          ))}
                        </ul>
                        <Link to={`/inscription?plan=${plan.id}`}
                          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white text-[#0f2d3d] text-sm font-bold hover:bg-slate-50 shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                          {plan.cta} <ArrowRight size={15} />
                        </Link>
                      </div>
                    </motion.div>
                  ) : (
                    /* ── CARTES NORMALES ── */
                    <motion.div
                      whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(15,45,61,0.1)" }}
                      className="relative flex flex-col rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden transition-shadow duration-200"
                    >
                      {plan.badge && plan.badgeColor !== 'teal' && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#f59e0b] text-[#0f172a] text-xs font-bold whitespace-nowrap shadow-md">
                          {plan.badge}
                        </div>
                      )}
                      <div className="p-8 pt-9 flex flex-col flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">{plan.name}</p>
                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-[56px] font-black leading-none text-[#0f172a]">{plan.price.toFixed(2).replace('.', ',')}</span>
                          <span className="text-xl mb-2 text-slate-300 font-semibold">€</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-6">paiement unique · sans abonnement</p>
                        <div className="h-px bg-slate-100 mb-6" />
                        <p className="text-xs font-bold uppercase tracking-wider text-[#2a7d9c] mb-2">Idéal pour</p>
                        <p className="text-sm text-slate-500 leading-relaxed mb-7">{plan.idealFor}</p>
                        <ul className="flex flex-col gap-3 mb-9 flex-1">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-start gap-3">
                              <CheckCircle2 size={15} className="text-[#22c55e] shrink-0 mt-0.5" />
                              <span className="text-sm text-slate-500 leading-snug">{f}</span>
                            </li>
                          ))}
                        </ul>
                        <Link to={`/inscription?plan=${plan.id}`}
                          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#0f2d3d] text-white text-sm font-bold hover:bg-[#0f2d3d]/85 transition-all duration-200">
                          {plan.cta} <ArrowRight size={15} />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Offre Pro */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-20">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center shrink-0">
                <Crown size={24} className="text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-1">Offre Professionnelle</h3>
                <p className="text-base text-slate-400 max-w-lg">Notaires, agents, syndics — volumes illimités, API dédiée, support prioritaire.</p>
              </div>
            </div>
            <Link to="/contact"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#0f2d3d] text-white text-sm font-bold whitespace-nowrap hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <Mail size={15} /> Nous contacter
            </Link>
          </motion.div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-[clamp(28px,3.5vw,44px)] font-black text-[#0f172a] text-center mb-10 tracking-tight">
              Questions fréquentes
            </motion.h2>
            <div className="flex flex-col gap-4">
              {[
                { q: 'Comment fonctionne le paiement ?', a: 'Paiement sécurisé via Stripe. Votre rapport est disponible immédiatement après confirmation.' },
                { q: 'Mes documents sont-ils sécurisés ?', a: "Vos fichiers sont chiffrés et supprimés automatiquement après analyse. Aucune donnée n'est conservée." },
                { q: 'Puis-je me faire rembourser ?', a: 'En cas de problème technique, contactez-nous sous 48h. Nous étudions chaque demande.' },
              ].map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-7 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <h4 className="text-lg font-bold text-[#0f172a] mb-2">{faq.q}</h4>
                  <p className="text-base text-slate-400 leading-relaxed">{faq.a}</p>
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
