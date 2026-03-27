import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Mail, Shield, Zap, FileText, ArrowRight } from 'lucide-react';
import { PRICING_PLANS } from '../types';
 
export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f9]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 80 }}>
 
      {/* ── HERO ── */}
      <section className="px-6 pt-14 pb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2a7d9c]/20 bg-white text-[#1a5e78] text-xs font-semibold mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
          Tarification transparente
        </motion.div>
 
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="text-[clamp(28px,5vw,52px)] font-black tracking-tight text-[#0f172a] mb-4 leading-tight">
          Des tarifs simples,<br className="hidden sm:block" />
          <span className="text-[#2a7d9c]"> sans surprise.</span>
        </motion.h1>
 
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="text-base text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          Payez uniquement pour ce dont vous avez besoin. Sans abonnement, sans engagement.
        </motion.p>
 
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex justify-center gap-6 flex-wrap">
          {[{ I: Shield, l: 'Paiement sécurisé' }, { I: Zap, l: 'Résultats en 2 min' }, { I: FileText, l: 'Rapport PDF inclus' }].map(({ I, l }) => (
            <div key={l} className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <I size={13} className="text-[#2a7d9c] shrink-0" /> {l}
            </div>
          ))}
        </motion.div>
      </section>
 
      {/* ── PRICING CARDS ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
 
          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: plan.highlighted ? -6 : -4 }}
                className={`relative flex flex-col rounded-3xl overflow-visible transition-shadow duration-200 ${
                  plan.highlighted
                    ? 'bg-[#0f2d3d] shadow-2xl shadow-[#0f2d3d]/30 ring-2 ring-[#2a7d9c]'
                    : 'bg-white shadow-sm hover:shadow-lg border border-slate-100'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shadow-md ${
                    plan.badgeColor === 'teal'
                      ? 'bg-[#2a7d9c] text-white'
                      : 'bg-[#f59e0b] text-[#0f172a]'
                  }`}>
                    {plan.badge}
                  </div>
                )}
 
                <div className="p-7 flex flex-col flex-1">
                  {/* Plan name */}
                  <div className="mb-6">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${plan.highlighted ? 'text-[#2a7d9c]' : 'text-slate-400'}`}>
                      {plan.name}
                    </p>
 
                    {/* Price */}
                    <div className="flex items-end gap-1 mb-1">
                      <span className={`text-[48px] font-black leading-none tracking-tight ${plan.highlighted ? 'text-white' : 'text-[#0f172a]'}`}>
                        {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className={`text-lg mb-1.5 font-semibold ${plan.highlighted ? 'text-white/50' : 'text-slate-400'}`}>€</span>
                    </div>
                    <p className={`text-xs ${plan.highlighted ? 'text-white/35' : 'text-slate-400'}`}>
                      paiement unique · sans abonnement
                    </p>
                  </div>
 
                  {/* Ideal for */}
                  <div className={`px-3.5 py-3 rounded-xl mb-5 ${plan.highlighted ? 'bg-white/8' : 'bg-slate-50 border border-slate-100'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${plan.highlighted ? 'text-[#2a7d9c]' : 'text-[#2a7d9c]'}`}>
                      Idéal pour
                    </p>
                    <p className={`text-xs leading-relaxed ${plan.highlighted ? 'text-white/60' : 'text-slate-500'}`}>
                      {plan.idealFor}
                    </p>
                  </div>
 
                  {/* Features */}
                  <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${plan.highlighted ? 'text-[#22c55e]' : 'text-[#22c55e]'}`} />
                        <span className={`text-xs leading-relaxed ${plan.highlighted ? 'text-white/70' : 'text-slate-500'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
 
                  {/* CTA */}
                  <Link to={`/inscription?plan=${plan.id}`}
                    className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
                      plan.highlighted
                        ? 'bg-white text-[#0f2d3d] hover:bg-slate-100'
                        : 'bg-[#0f2d3d] text-white hover:bg-[#0f2d3d]/90'
                    }`}>
                    {plan.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
 
          {/* Offre Pro */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl bg-white border border-slate-100 shadow-sm p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center shrink-0">
                <Crown size={20} className="text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f172a] mb-1">Offre Professionnelle</h3>
                <p className="text-sm text-slate-400 max-w-md">Notaires, agents, syndics — volumes illimités, API dédiée, support prioritaire, rapports sur-mesure.</p>
              </div>
            </div>
            <Link to="/contact"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0f2d3d] text-white text-sm font-bold whitespace-nowrap hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <Mail size={14} /> Nous contacter
            </Link>
          </motion.div>
 
          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-2xl font-black text-[#0f172a] text-center mb-8 tracking-tight">
              Questions fréquentes
            </motion.h2>
            <div className="flex flex-col gap-3">
              {[
                { q: 'Comment fonctionne le paiement ?', a: 'Paiement sécurisé via Stripe. Votre rapport est disponible immédiatement après confirmation.' },
                { q: 'Mes documents sont-ils sécurisés ?', a: 'Vos fichiers sont chiffrés et supprimés automatiquement après analyse. Aucune donnée n\'est conservée.' },
                { q: 'Puis-je me faire rembourser ?', a: 'En cas de problème technique, contactez-nous sous 48h. Nous étudions chaque demande.' },
              ].map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <h4 className="text-sm font-bold text-[#0f172a] mb-2">{faq.q}</h4>
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
