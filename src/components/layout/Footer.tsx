import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0f2d3d] text-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 px-6 pt-12 pb-8">

        {/* Col 1 — texte EN HAUT, logo EN BAS */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            Analymo analyse vos documents immobiliers pour vous aider à acheter en toute sérénité.
          </p>
          <div className="w-40">
            <img
              src="/logo.png"
              alt="Analymo"
              className="w-full h-auto object-contain object-left"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </div>

        {/* Col 2 — Produit */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Produit</h4>
          {[{ to: '/exemple', l: 'Voir un exemple' }, { to: '/tarifs', l: 'Tarifs' }, { to: '/contact', l: 'Contact' }].map(item => (
            <Link key={item.to} to={item.to} className="text-sm text-slate-400 hover:text-white transition-colors">
              {item.l}
            </Link>
          ))}
        </div>

        {/* Col 3 — Légal */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Légal</h4>
          {['Mentions légales', 'Confidentialité', 'CGV'].map(l => (
            <a key={l} href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{l}</a>
          ))}
        </div>

        {/* Col 4 — Contact */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Contact</h4>
          <a href="mailto:contact@analymo.fr" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <Mail size={13} className="shrink-0" /> contact@analymo.fr
          </a>
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <MapPin size={13} className="shrink-0" /> France
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-5xl mx-auto px-6 pb-5">
        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between gap-2">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Analymo. Tous droits réservés.</p>
          <p className="text-xs text-white/30">Outil d'aide à la décision, pas un cabinet de conseil.</p>
        </div>
      </div>
    </footer>
  );
}
