import { Link } from 'react-router-dom';

// ═══════════════════════════════════════
// COMPOSANTS COMMUNS
// ═══════════════════════════════════════

const S = {
  card: { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' as const, marginBottom: 12 },
  cardHeader: (color: string) => ({ padding: '12px 18px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }),
  dot: (color: string) => ({ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }),
  label: { fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' },
  row: (alt: boolean) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: alt ? 'var(--color-background-secondary)' : 'var(--color-background-primary)' }),
  th: { padding: '9px 18px', textAlign: 'left' as const, fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' },
  td: (alt: boolean) => ({ padding: '9px 18px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: alt ? 'var(--color-background-secondary)' : 'transparent' }),
};

function Header({ type, titre, sub }: { type: string; titre: string; sub: string }) {
  return (
    <div style={{ background: '#0f2d3d', borderRadius: 14, padding: '22px 26px', marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 6 }}>{type}</div>
      <div style={{ fontSize: 17, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{titre}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{sub}</div>}
    </div>
  );
}

function Resume({ text }: { text: string }) {
  return (
    <div style={{ ...S.card, overflow: 'visible' }}>
      <div style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', letterSpacing: '0.08em', marginBottom: 10 }}>RÉSUMÉ</div>
        <div style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.75 }}>{text}</div>
      </div>
    </div>
  );
}

function PointsForts({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '12px 18px', borderBottom: '0.5px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>POINTS POSITIFS</div>
      </div>
      {items.map((p, i) => (
        <div key={i} style={{ padding: '11px 18px', borderBottom: i < items.length - 1 ? '0.5px solid #bbf7d0' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(240,253,244,0.5)' }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{p}</div>
        </div>
      ))}
    </div>
  );
}

function PointsVigilance({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '12px 18px', borderBottom: '0.5px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>POINTS DE VIGILANCE</div>
      </div>
      {items.map((p, i) => (
        <div key={i} style={{ padding: '11px 18px', borderBottom: i < items.length - 1 ? '0.5px solid #fecaca' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(254,242,242,0.5)' }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{p}</div>
        </div>
      ))}
    </div>
  );
}

function AvisVerimo({ text }: { text: string }) {
  return (
    <div style={{ background: '#0f2d3d', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 10 }}>AVIS VERIMO</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>{text}</div>
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
        Cette analyse porte sur un seul document. Pour une vision complète de votre futur bien, lancez une{' '}
        <Link to="/dashboard/nouvelle-analyse" style={{ color: '#7dd3fc', textDecoration: 'none', fontWeight: 500 }}>Analyse Complète</Link>.
      </div>
    </div>
  );
}

function DpeGauge({ classe, label }: { classe: string; label: string }) {
  const classes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const colors: Record<string, string> = { A: '#16a34a', B: '#22c55e', C: '#84cc16', D: '#eab308', E: '#f97316', F: '#ef4444', G: '#991b1b' };
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 52, marginBottom: 10 }}>
        {classes.map((c, i) => {
          const active = c === classe;
          const h = 26 + i * 4;
          return (
            <div key={c} style={{ flex: 1, height: active ? 52 : h, borderRadius: 4, background: active ? colors[c] : `${colors[c]}25`, border: active ? `2px solid ${colors[c]}` : `1px solid ${colors[c]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: active ? 13 : 11, fontWeight: 500, color: active ? '#fff' : colors[c] }}>{c}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label.includes('GES') ? 'kg CO₂/m²/an' : 'kWh/m²/an'}</div>
        {classe && <div style={{ fontSize: 12, fontWeight: 500, color: colors[classe], background: `${colors[classe]}15`, padding: '2px 10px', borderRadius: 100, border: `0.5px solid ${colors[classe]}40` }}>Classe {classe}</div>}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: color || 'var(--color-text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ padding: '12px 18px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value, alt, valueColor }: { label: string; value: string; alt?: boolean; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: alt ? 'var(--color-background-secondary)' : 'transparent' }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: valueColor || 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER DDT
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererDDT({ r }: { r: any }) {
  const diags = r.diagnostics || [];
  const alertes = diags.filter((d: any) => d.presence === 'anomalie');
  const conformes = diags.filter((d: any) => d.presence === 'conforme' || d.presence === 'non_detecte' || d.presence === 'non_applicable');
  const infos = diags.filter((d: any) => d.presence === 'informatif');

  const diagColor = (p: string) => p === 'anomalie' ? { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', badge: 'Anomalies' }
    : p === 'non_detecte' ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', badge: '✓ Non détecté' }
    : p === 'conforme' ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', badge: '✓ Conforme' }
    : p === 'non_applicable' ? { bg: 'var(--color-background-secondary)', border: 'var(--color-border-tertiary)', text: 'var(--color-text-secondary)', badge: 'Non applicable' }
    : { bg: 'var(--color-background-secondary)', border: 'var(--color-border-tertiary)', text: 'var(--color-text-secondary)', badge: 'Informatif' };

  const sub = [
    r.diagnostiqueur?.nom,
    r.diagnostiqueur?.date ? `le ${r.diagnostiqueur.date}` : null,
    r.diagnostiqueur?.certification,
  ].filter(Boolean).join(' · ');

  return (
    <div>
      <Header type="DOSSIER DE DIAGNOSTIC TECHNIQUE" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      {/* DPE + GES */}
      {r.dpe?.classe && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div style={{ ...S.card, overflow: 'visible', marginBottom: 0, padding: 18 }}>
            <DpeGauge classe={r.dpe.classe} label={`Énergie primaire (DPE)${r.dpe.kwh_m2 ? ` — ${r.dpe.kwh_m2} kWh/m²/an` : ''}`} />
          </div>
          {r.dpe.ges_classe && (
            <div style={{ ...S.card, overflow: 'visible', marginBottom: 0, padding: 18 }}>
              <DpeGauge classe={r.dpe.ges_classe} label={`Émissions GES${r.dpe.ges_kg_m2 ? ` — ${r.dpe.ges_kg_m2} kg CO₂/m²/an` : ''}`} />
            </div>
          )}
        </div>
      )}

      {/* Carrez */}
      {r.carrez?.surface_totale && (
        <div style={{ ...S.card }}>
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Surface loi Carrez</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)' }}>{r.carrez.surface_totale} m²</div>
          </div>
          {r.carrez.pieces?.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {r.carrez.pieces.map((p: any, i: number) => (
                  <tr key={i} style={{ borderBottom: i < r.carrez.pieces.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                    <td style={{ padding: '9px 18px', color: 'var(--color-text-primary)' }}>{p.piece}</td>
                    <td style={{ padding: '9px 18px', textAlign: 'right', fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.surface} m²</td>
                  </tr>
                ))}
                {r.carrez.surface_sol && (
                  <tr style={{ background: 'var(--color-background-secondary)', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '9px 18px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Surface au sol (hors Carrez)</td>
                    <td style={{ padding: '9px 18px', textAlign: 'right', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{r.carrez.surface_sol} m²</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Diagnostics */}
      {diags.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {[...alertes, ...conformes, ...infos].map((d: any, i: number) => {
            const c = diagColor(d.presence);
            return (
              <div key={i} style={{ background: c.bg, border: `0.5px solid ${c.border}`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: c.text, background: 'white', border: `0.5px solid ${c.border}`, padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap', marginLeft: 8 }}>{c.badge}</span>
                </div>
                {d.detail && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{d.detail}</div>}
                {d.alerte && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6, fontWeight: 500 }}>⚠ {d.alerte}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Travaux préconisés */}
      {r.travaux_preconises?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="TRAVAUX RECOMMANDÉS PAR LE DPE" color="#d97706" />
          {r.travaux_preconises.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < r.travaux_preconises.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: t.priorite === 'prioritaire' ? '#dc2626' : '#d97706', marginTop: 3 }}>{t.priorite === 'prioritaire' ? 'Prioritaire' : 'Recommandé'}</div>
              </div>
              {(t.cout_min || t.cout_max) && (
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', marginLeft: 16 }}>
                  {t.cout_min && t.cout_max ? `${t.cout_min.toLocaleString('fr-FR')} – ${t.cout_max.toLocaleString('fr-FR')} €` : `${(t.cout_min || t.cout_max)?.toLocaleString('fr-FR')} €`}
                </div>
              )}
            </div>
          ))}
          {r.gain_energetique && (
            <div style={{ padding: '12px 18px', background: '#f0f9ff', borderTop: '0.5px solid #bae6fd', fontSize: 12, color: '#0369a1' }}>
              {r.gain_energetique}
            </div>
          )}
        </div>
      )}

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER PV AG
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererPVAG({ r }: { r: any }) {
  const sub = [r.date_ag, r.syndic ? `Syndic : ${r.syndic}` : null, r.quorum?.presents && r.quorum?.total ? `${r.quorum.presents}/${r.quorum.total} copropriétaires · ${r.quorum.tantiemes_pct}` : null].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="PROCÈS-VERBAL D'ASSEMBLÉE GÉNÉRALE" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {r.budget_vote?.montant && <Kpi label={`Budget voté ${r.budget_vote.annee || ''}`} value={`${Number(r.budget_vote.montant).toLocaleString('fr-FR')} €`} />}
        {r.budget_vote?.fonds_travaux && <Kpi label="Fonds travaux" value={`${Number(r.budget_vote.fonds_travaux).toLocaleString('fr-FR')} €`} color="#7c3aed" sub="Loi ALUR" />}
        {r.quorum?.tantiemes_pct && <Kpi label="Quorum" value={r.quorum.tantiemes_pct} color="#16a34a" sub={r.quorum.presents && r.quorum.total ? `${r.quorum.presents}/${r.quorum.total} copropriétaires` : undefined} />}
      </div>

      {/* Travaux votés */}
      {r.travaux_votes?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="TRAVAUX VOTÉS" color="#3b82f6" />
          <div style={{ padding: '10px 18px', background: '#eff6ff', borderBottom: '0.5px solid #bfdbfe', fontSize: 12, color: '#1d4ed8' }}>
            ℹ Votés avant compromis = à la charge du vendeur. À vérifier avec votre notaire.
          </div>
          {r.travaux_votes.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < r.travaux_votes.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{t.label}</div>
                {t.echeance && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>{t.echeance}</div>}
              </div>
              {t.montant && <div style={{ fontSize: 14, fontWeight: 500, color: '#1d4ed8', whiteSpace: 'nowrap', marginLeft: 16 }}>{Number(t.montant).toLocaleString('fr-FR')} €</div>}
            </div>
          ))}
        </div>
      )}

      {/* Travaux évoqués */}
      {r.travaux_evoques?.length > 0 && (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid #fed7aa', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <SectionHeader label="TRAVAUX ÉVOQUÉS — NON ENCORE VOTÉS" color="#f97316" />
          <div style={{ padding: '10px 18px', background: '#fff7ed', borderBottom: '0.5px solid #fed7aa', fontSize: 12, color: '#92400e' }}>
            ⚠ Mentionnés sans vote. Si votés après votre achat, vous en supporterez la charge.
          </div>
          {r.travaux_evoques.map((t: any, i: number) => (
            <div key={i} style={{ padding: '12px 18px', borderBottom: i < r.travaux_evoques.length - 1 ? '0.5px solid #fed7aa' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{t.label}</div>
              {t.precision && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>{t.precision}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Questions diverses */}
      {r.questions_diverses?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="QUESTIONS DIVERSES NOTABLES" color="#64748b" />
          {r.questions_diverses.map((q: string, i: number) => (
            <div key={i} style={{ padding: '12px 18px', borderBottom: i < r.questions_diverses.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', fontSize: 13, color: 'var(--color-text-primary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>{q}</div>
          ))}
        </div>
      )}

      {/* Procédures */}
      {r.procedures?.length > 0 && (
        <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <SectionHeader label="PROCÉDURES / LITIGES MENTIONNÉS" color="#dc2626" />
          {r.procedures.map((p: string, i: number) => (
            <div key={i} style={{ padding: '12px 18px', borderBottom: i < r.procedures.length - 1 ? '0.5px solid #fecaca' : 'none', fontSize: 13, color: 'var(--color-text-primary)' }}>{p}</div>
          ))}
        </div>
      )}

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER APPEL DE CHARGES
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererAppelCharges({ r }: { r: any }) {
  const sub = [r.periode, r.lot ? `Lot ${r.lot}` : null, r.syndic ? `Syndic : ${r.syndic}` : null].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="APPEL DE CHARGES / APPEL DE FONDS" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {r.montant_trimestre && <Kpi label="Appel ce trimestre" value={`${Number(r.montant_trimestre).toLocaleString('fr-FR')} €`} sub={r.lot || undefined} />}
        {r.montant_annuel && <Kpi label="Charges annuelles estimées" value={`${Number(r.montant_annuel).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="× 4 trimestres" />}
        {r.montant_mensuel && <Kpi label="Charges mensuelles" value={`${Number(r.montant_mensuel).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="/ mois" />}
      </div>

      {r.decomposition?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="DÉCOMPOSITION DE L'APPEL" color="#2a7d9c" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)' }}>
                {['Poste', 'Trimestre', 'Annuel estimé'].map(h => <th key={h} style={{ ...S.th, textAlign: h === 'Poste' ? 'left' : 'right' as const }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {r.decomposition.map((d: any, i: number) => (
                <tr key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                  <td style={{ padding: '9px 18px', color: 'var(--color-text-primary)' }}>{d.poste}</td>
                  <td style={{ padding: '9px 18px', textAlign: 'right', fontWeight: 500, color: 'var(--color-text-primary)' }}>{d.trimestre ? `${Number(d.trimestre).toLocaleString('fr-FR')} €` : '—'}</td>
                  <td style={{ padding: '9px 18px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{d.annuel ? `${Number(d.annuel).toLocaleString('fr-FR')} €` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ ...S.card }}>
        <SectionHeader label="INFORMATIONS LOT" color="#64748b" />
        {r.lot && <InfoRow label="Lot concerné" value={r.lot} />}
        {r.echeance && <InfoRow label="Date d'échéance" value={r.echeance} alt />}
        {r.solde_precedent !== null && r.solde_precedent !== undefined && <InfoRow label="Solde précédent" value={`${Number(r.solde_precedent).toLocaleString('fr-FR')} €`} valueColor={Number(r.solde_precedent) === 0 ? '#16a34a' : '#dc2626'} />}
        <InfoRow label="Impayés détectés" value={r.impayes ? 'Oui' : 'Aucun'} alt valueColor={r.impayes ? '#dc2626' : '#16a34a'} />
      </div>

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER RCP
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererRCP({ r }: { r: any }) {
  const sub = [r.date_reglement ? `Établi en ${r.date_reglement}` : null, r.modificatifs?.length ? `Modificatifs : ${r.modificatifs.join(', ')}` : null].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="RÈGLEMENT DE COPROPRIÉTÉ" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {r.date_reglement && <Kpi label="Date du règlement" value={String(r.date_reglement)} />}
        {r.total_lots && <Kpi label="Total lots" value={`${r.total_lots} lots`} />}
        {r.usage && <Kpi label="Usage" value={r.usage === 'habitation' ? 'Habitation exclusive' : r.usage === 'mixte' ? 'Mixte' : 'Commercial'} />}
      </div>

      {r.parties_communes?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="PARTIES COMMUNES IDENTIFIÉES" color="#64748b" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 18px' }}>
            {r.parties_communes.map((p: string, i: number) => (
              <span key={i} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 100, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>{p}</span>
            ))}
          </div>
        </div>
      )}

      {r.regles_usage?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="RÈGLES D'USAGE" color="#64748b" />
          {r.regles_usage.map((rule: string, i: number) => (
            <div key={i} style={{ padding: '12px 18px', borderBottom: i < r.regles_usage.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', fontSize: 13, color: 'var(--color-text-primary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>{rule}</div>
          ))}
        </div>
      )}

      {r.restrictions?.length > 0 && (
        <div style={{ background: '#fff7ed', border: '0.5px solid #fed7aa', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <SectionHeader label="RESTRICTIONS DÉTECTÉES" color="#f97316" />
          {r.restrictions.map((rest: string, i: number) => (
            <div key={i} style={{ padding: '12px 18px', borderBottom: i < r.restrictions.length - 1 ? '0.5px solid #fed7aa' : 'none', fontSize: 13, color: 'var(--color-text-primary)' }}>{rest}</div>
          ))}
        </div>
      )}

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER DTG/PPT
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererDTGPPT({ r }: { r: any }) {
  const etatColor = r.etat_general === 'bon' ? '#16a34a' : r.etat_general === 'moyen' ? '#d97706' : '#dc2626';
  const sub = [r.date ? `Réalisé en ${r.date}` : null, r.cabinet].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="DIAGNOSTIC TECHNIQUE GLOBAL · PLAN PLURIANNUEL DE TRAVAUX" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {r.budget_total_10ans && <Kpi label="Budget travaux 10 ans" value={`${Number(r.budget_total_10ans).toLocaleString('fr-FR')} €`} color="#dc2626" />}
        {r.budget_urgent_3ans && <Kpi label="Travaux urgents 0-3 ans" value={`${Number(r.budget_urgent_3ans).toLocaleString('fr-FR')} €`} color="#f97316" />}
        {r.etat_general && <Kpi label="État général" value={r.etat_general === 'bon' ? 'Bon' : r.etat_general === 'moyen' ? 'Moyen' : 'Dégradé'} color={etatColor} />}
      </div>

      {r.planning?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="PLANNING DES TRAVAUX PRÉCONISÉS" color="#dc2626" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)' }}>
                {['Travaux', 'Horizon', 'Budget', 'Priorité'].map((h, i) => <th key={h} style={{ ...S.th, textAlign: i > 0 ? 'center' : 'left' as const }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {r.planning.map((t: any, i: number) => {
                const pColor = t.priorite === 'urgent' ? { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' } : t.priorite === 'prioritaire' ? { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' } : { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
                return (
                  <tr key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                    <td style={{ padding: '9px 18px', color: 'var(--color-text-primary)' }}>{t.label}</td>
                    <td style={{ padding: '9px 18px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{t.horizon || '—'}</td>
                    <td style={{ padding: '9px 18px', textAlign: 'center', fontWeight: 500, color: 'var(--color-text-primary)' }}>{t.montant ? `${Number(t.montant).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '9px 18px', textAlign: 'center' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: pColor.bg, color: pColor.text, border: `0.5px solid ${pColor.border}` }}>{t.priorite === 'urgent' ? 'Urgent' : t.priorite === 'prioritaire' ? 'Prioritaire' : 'Planifié'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {r.etat_elements?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="ÉTAT PAR ÉLÉMENT" color="#64748b" />
          {r.etat_elements.map((e: any, i: number) => {
            const ec = e.etat === 'bon' ? { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Bon état' } : e.etat === 'a_surveiller' ? { color: '#d97706', bg: '#fff7ed', border: '#fed7aa', label: 'À surveiller' } : e.etat === 'vieillissant' ? { color: '#d97706', bg: '#fff7ed', border: '#fed7aa', label: 'Vieillissant' } : { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Dégradé' };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: i < r.etat_elements.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{e.element}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: ec.color, background: ec.bg, padding: '2px 10px', borderRadius: 100, border: `0.5px solid ${ec.border}` }}>{ec.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER CARNET D'ENTRETIEN
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererCarnetEntretien({ r }: { r: any }) {
  const sub = [r.syndic, r.date_maj ? `Mis à jour le ${r.date_maj}` : null].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="CARNET D'ENTRETIEN DE L'IMMEUBLE" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      {r.contrats?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="CONTRATS DE MAINTENANCE EN COURS" color="#16a34a" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)' }}>
                {['Équipement', 'Prestataire', 'Échéance'].map((h, i) => <th key={h} style={{ ...S.th, textAlign: i === 2 ? 'right' as const : 'left' as const }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {r.contrats.map((c: any, i: number) => (
                <tr key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                  <td style={{ padding: '9px 18px', color: 'var(--color-text-primary)' }}>{c.equipement}</td>
                  <td style={{ padding: '9px 18px', color: 'var(--color-text-secondary)' }}>{c.prestataire || '—'}</td>
                  <td style={{ padding: '9px 18px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{c.echeance || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {r.travaux_realises?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="HISTORIQUE DES TRAVAUX RÉALISÉS" color="#2a7d9c" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)' }}>
                {['Année', 'Travaux', 'Montant'].map((h, i) => <th key={h} style={{ ...S.th, textAlign: i === 2 ? 'right' as const : 'left' as const }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {r.travaux_realises.map((t: any, i: number) => (
                <tr key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                  <td style={{ padding: '9px 18px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{t.annee}</td>
                  <td style={{ padding: '9px 18px', color: 'var(--color-text-primary)' }}>{t.label}</td>
                  <td style={{ padding: '9px 18px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{t.montant ? `${Number(t.montant).toLocaleString('fr-FR')} €` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {r.diagnostics_mentionnes?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="DIAGNOSTICS MENTIONNÉS" color="#64748b" />
          {r.diagnostics_mentionnes.map((d: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: i < r.diagnostics_mentionnes.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{d.type}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{[d.date, d.statut].filter(Boolean).join(' · ')}</span>
            </div>
          ))}
        </div>
      )}

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER PRÉ-ÉTAT DATÉ
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererPreEtatDate({ r }: { r: any }) {
  const sub = [r.date ? `Établi le ${r.date}` : null, r.lot ? `Lot ${r.lot}` : null, r.syndic ? `Syndic : ${r.syndic}` : null].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="PRÉ-ÉTAT DATÉ" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        <Kpi label="Impayés vendeur" value={r.impayes_vendeur !== undefined ? `${Number(r.impayes_vendeur).toLocaleString('fr-FR')} €` : '—'} color={Number(r.impayes_vendeur) === 0 ? '#16a34a' : '#dc2626'} sub={Number(r.impayes_vendeur) === 0 ? 'Vendeur à jour' : 'Attention'} />
        {r.fonds_travaux_alur && <Kpi label="Fonds travaux ALUR récupérable" value={`${Number(r.fonds_travaux_alur).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="Versé à l'acheteur à la signature" />}
        {r.travaux_charge_vendeur?.length > 0 && <Kpi label="Travaux charge vendeur" value={`${r.travaux_charge_vendeur.reduce((s: number, t: any) => s + (Number(t.montant) || 0), 0).toLocaleString('fr-FR')} €`} color="#f97316" sub="Votés avant compromis" />}
      </div>

      {r.situation_copro?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="SITUATION COMPTABLE DU VENDEUR" color="#2a7d9c" />
          {r.situation_copro.map((s: any, i: number) => (
            <InfoRow key={i} label={s.label} value={s.valeur} alt={i % 2 !== 0} valueColor={s.couleur} />
          ))}
        </div>
      )}

      {r.travaux_charge_vendeur?.length > 0 && (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid #fed7aa', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <SectionHeader label="TRAVAUX VOTÉS À LA CHARGE DU VENDEUR" color="#f97316" />
          <div style={{ padding: '10px 18px', background: '#eff6ff', borderBottom: '0.5px solid #bfdbfe', fontSize: 12, color: '#1d4ed8' }}>
            ℹ Ces travaux ont été votés avant le compromis — ils restent à la charge du vendeur.
          </div>
          {r.travaux_charge_vendeur.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < r.travaux_charge_vendeur.length - 1 ? '0.5px solid #fed7aa' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{t.label}</div>
              {t.montant && <div style={{ fontSize: 14, fontWeight: 500, color: '#f97316', whiteSpace: 'nowrap', marginLeft: 16 }}>{Number(t.montant).toLocaleString('fr-FR')} €</div>}
            </div>
          ))}
        </div>
      )}

      {r.procedures_contre_vendeur?.length > 0 && (
        <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <SectionHeader label="PROCÉDURES CONTRE LE VENDEUR" color="#dc2626" />
          {r.procedures_contre_vendeur.map((p: string, i: number) => (
            <div key={i} style={{ padding: '12px 18px', fontSize: 13, color: 'var(--color-text-primary)' }}>{p}</div>
          ))}
        </div>
      )}

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER ÉTAT DATÉ
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererEtatDate({ r }: { r: any }) {
  const sub = [r.date ? `Établi le ${r.date}` : null, r.lot ? `Lot ${r.lot}` : null, r.syndic ? `Syndic : ${r.syndic}` : null].filter(Boolean).join(' · ');
  const soldeColor = r.solde_sens === 'acheteur' ? '#16a34a' : '#dc2626';
  return (
    <div>
      <Header type="ÉTAT DATÉ" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {r.solde_net !== undefined && <Kpi label="Solde net" value={`${r.solde_sens === 'acheteur' ? '+' : '-'} ${Number(Math.abs(r.solde_net)).toLocaleString('fr-FR')} €`} color={soldeColor} sub={r.solde_sens === 'acheteur' ? 'En faveur de l\'acheteur' : 'En faveur du vendeur'} />}
        {r.fonds_travaux_alur && <Kpi label="Fonds travaux ALUR transféré" value={`${Number(r.fonds_travaux_alur).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="Versé à l'acheteur" />}
        {r.travaux_consignes?.length > 0 && <Kpi label="Travaux consignés charge vendeur" value={`${r.travaux_consignes.reduce((s: number, t: any) => s + (Number(t.montant) || 0), 0).toLocaleString('fr-FR')} €`} color="#f97316" />}
      </div>

      {r.decomposition?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="DÉCOMPTE DÉFINITIF" color="#2a7d9c" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)' }}>
                {['Poste', 'Montant', 'Sens'].map((h, i) => <th key={h} style={{ ...S.th, textAlign: i > 0 ? 'center' as const : 'left' as const }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {r.decomposition.map((d: any, i: number) => {
                const dc = d.sens === 'acheteur_recoit' ? { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Acheteur reçoit' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Vendeur doit' };
                return (
                  <tr key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                    <td style={{ padding: '9px 18px', color: 'var(--color-text-primary)' }}>{d.poste}</td>
                    <td style={{ padding: '9px 18px', textAlign: 'center', fontWeight: 500, color: 'var(--color-text-primary)' }}>{d.montant ? `${Number(d.montant).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '9px 18px', textAlign: 'center' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: dc.bg, color: dc.text, border: `0.5px solid ${dc.border}` }}>{dc.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {r.travaux_consignes?.length > 0 && (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid #fed7aa', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <SectionHeader label="TRAVAUX CONSIGNÉS À LA CHARGE DU VENDEUR" color="#f97316" />
          {r.travaux_consignes.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < r.travaux_consignes.length - 1 ? '0.5px solid #fed7aa' : 'none' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{t.label}</div>
              {t.montant && <div style={{ fontSize: 14, fontWeight: 500, color: '#f97316', whiteSpace: 'nowrap', marginLeft: 16 }}>{Number(t.montant).toLocaleString('fr-FR')} €</div>}
            </div>
          ))}
        </div>
      )}

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER TAXE FONCIÈRE
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererTaxeFonciere({ r }: { r: any }) {
  const sub = [r.annee ? `Année ${r.annee}` : null, r.reference_cadastrale].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="AVIS DE TAXE FONCIÈRE" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        {r.montant_total && <Kpi label={`Taxe foncière ${r.annee || ''}`} value={`${Number(r.montant_total).toLocaleString('fr-FR')} €`} sub={r.montant_mensuel ? `${Number(r.montant_mensuel).toLocaleString('fr-FR')} €/mois` : undefined} />}
        {r.evolution_pct !== null && r.evolution_pct !== undefined && <Kpi label="Évolution" value={`${r.evolution_pct > 0 ? '+' : ''}${r.evolution_pct}%`} color={r.evolution_pct > 5 ? '#dc2626' : '#d97706'} sub={r.montant_precedent ? `vs ${Number(r.montant_precedent).toLocaleString('fr-FR')} €` : undefined} />}
        {r.valeur_locative && <Kpi label="Valeur locative cadastrale" value={`${Number(r.valeur_locative).toLocaleString('fr-FR')} €`} sub="Base de calcul" />}
      </div>

      {r.decomposition?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="DÉCOMPOSITION PAR COLLECTIVITÉ" color="#2a7d9c" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)' }}>
                {['Collectivité', 'Taux', 'Montant'].map((h, i) => <th key={h} style={{ ...S.th, textAlign: i === 0 ? 'left' as const : 'center' as const }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {r.decomposition.map((d: any, i: number) => (
                <tr key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                  <td style={{ padding: '9px 18px', color: 'var(--color-text-primary)' }}>{d.collectivite}</td>
                  <td style={{ padding: '9px 18px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{d.taux ? `${d.taux}%` : '—'}</td>
                  <td style={{ padding: '9px 18px', textAlign: 'center', fontWeight: 500, color: 'var(--color-text-primary)' }}>{d.montant ? `${Number(d.montant).toLocaleString('fr-FR')} €` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ ...S.card }}>
        <SectionHeader label="INFORMATIONS DU BIEN" color="#64748b" />
        {r.reference_cadastrale && <InfoRow label="Référence cadastrale" value={r.reference_cadastrale} />}
        {r.surface_cadastrale && <InfoRow label="Surface pondérée" value={`${r.surface_cadastrale} m² (base cadastrale)`} alt />}
      </div>

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER COMPROMIS
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererCompromis({ r }: { r: any }) {
  const sub = [r.date_signature ? `Signé le ${r.date_signature}` : null, r.agence, r.notaire_acheteur ? `Notaire acheteur : ${r.notaire_acheteur}` : null].filter(Boolean).join(' · ');
  const statutColor = (s: string) => s === 'levee' ? { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Levée' } : s === 'purge' ? { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Purgée' } : { bg: '#fff7ed', text: '#d97706', border: '#fed7aa', label: 'En cours' };
  return (
    <div>
      <Header type="COMPROMIS DE VENTE" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {r.prix_net_vendeur && <Kpi label="Prix net vendeur" value={`${Number(r.prix_net_vendeur).toLocaleString('fr-FR')} €`} />}
        {r.honoraires_agence && <Kpi label="Honoraires agence" value={`${Number(r.honoraires_agence).toLocaleString('fr-FR')} €`} sub={`Charge ${r.honoraires_charge === 'acheteur' ? 'acheteur' : 'vendeur'}`} />}
        {r.depot_garantie && <Kpi label="Dépôt de garantie" value={`${Number(r.depot_garantie).toLocaleString('fr-FR')} €`} sub={r.depot_sequestre ? `Séquestré : ${r.depot_sequestre}` : undefined} />}
        {r.prix_total && <Kpi label="Prix total acheteur" value={`${Number(r.prix_total).toLocaleString('fr-FR')} €`} sub="Hors frais notaire" />}
      </div>

      {r.bien && (
        <div style={{ ...S.card }}>
          <SectionHeader label="DÉSIGNATION DU BIEN" color="#2a7d9c" />
          {r.bien.type && <InfoRow label="Nature" value={r.bien.type} />}
          {r.bien.lot_principal && <InfoRow label="Lot principal" value={r.bien.lot_principal} alt />}
          {r.bien.annexes?.map((a: string, i: number) => <InfoRow key={i} label="Annexe" value={a} />)}
          {r.bien.surface_carrez && <InfoRow label="Surface Carrez" value={`${r.bien.surface_carrez} m²`} alt />}
          {r.bien.tantiemes && <InfoRow label="Tantièmes" value={r.bien.tantiemes} />}
        </div>
      )}

      {r.conditions_suspensives?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="CONDITIONS SUSPENSIVES" color="#d97706" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)' }}>
                {['Condition', 'Détail', 'Date limite', 'Statut'].map((h, i) => <th key={h} style={{ ...S.th, textAlign: i > 1 ? 'center' as const : 'left' as const }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {r.conditions_suspensives.map((c: any, i: number) => {
                const sc = statutColor(c.statut);
                return (
                  <tr key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                    <td style={{ padding: '9px 18px', color: 'var(--color-text-primary)' }}>{c.label}</td>
                    <td style={{ padding: '9px 18px', color: 'var(--color-text-secondary)' }}>{c.detail || '—'}</td>
                    <td style={{ padding: '9px 18px', textAlign: 'center', fontWeight: 500, color: '#dc2626' }}>{c.date_limite || '—'}</td>
                    <td style={{ padding: '9px 18px', textAlign: 'center' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: sc.bg, color: sc.text, border: `0.5px solid ${sc.border}` }}>{sc.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {r.financement && (r.financement.apport || r.financement.montant_pret) && (
        <div style={{ ...S.card }}>
          <SectionHeader label="PLAN DE FINANCEMENT DÉCLARÉ" color="#64748b" />
          {r.financement.apport && <InfoRow label="Apport personnel" value={`${Number(r.financement.apport).toLocaleString('fr-FR')} €`} />}
          {r.financement.montant_pret && <InfoRow label="Montant emprunté" value={`${Number(r.financement.montant_pret).toLocaleString('fr-FR')} €`} alt />}
          {r.financement.etablissement && <InfoRow label="Établissement pressenti" value={r.financement.etablissement} />}
        </div>
      )}

      {r.dates_cles?.length > 0 && (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid #fed7aa', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <SectionHeader label="DATES CLÉS À RETENIR" color="#f97316" />
          {r.dates_cles.map((d: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: i < r.dates_cles.length - 1 ? '0.5px solid #fed7aa' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{d.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: d.important ? '#dc2626' : '#d97706' }}>{d.date}</span>
            </div>
          ))}
        </div>
      )}

      {r.clauses_particulieres?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="CLAUSES PARTICULIÈRES" color="#64748b" />
          {r.clauses_particulieres.map((c: string, i: number) => (
            <div key={i} style={{ padding: '12px 18px', borderBottom: i < r.clauses_particulieres.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', fontSize: 13, color: 'var(--color-text-primary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>{c}</div>
          ))}
        </div>
      )}

      {r.servitudes?.length > 0 && (
        <div style={{ background: '#fff7ed', border: '0.5px solid #fed7aa', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <SectionHeader label="SERVITUDES DÉTECTÉES" color="#f97316" />
          {r.servitudes.map((s: string, i: number) => (
            <div key={i} style={{ padding: '12px 18px', fontSize: 13, color: 'var(--color-text-primary)' }}>{s}</div>
          ))}
        </div>
      )}

      {(r.situation_locative || r.bien_libre_a || r.mobilier_inclus?.length > 0) && (
        <div style={{ ...S.card }}>
          <SectionHeader label="CONDITIONS D'OCCUPATION" color="#64748b" />
          {r.situation_locative && <InfoRow label="Situation locative" value={r.situation_locative} />}
          {r.bien_libre_a && <InfoRow label="Bien libre à" value={r.bien_libre_a} alt />}
          {r.mobilier_inclus?.length > 0 && <InfoRow label="Mobilier inclus" value={r.mobilier_inclus.join(', ')} />}
        </div>
      )}

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER DIAGNOSTIC PARTIES COMMUNES
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererDiagCommunes({ r }: { r: any }) {
  const typeLabel = r.type_diagnostic === 'DTA' ? 'DOSSIER TECHNIQUE AMIANTE' : r.type_diagnostic === 'PLOMB' ? 'CONSTAT DE RISQUE D\'EXPOSITION AU PLOMB' : r.type_diagnostic === 'TERMITES' ? 'ÉTAT PARASITAIRE — TERMITES' : 'DIAGNOSTIC PARTIES COMMUNES';
  const sub = [r.date ? `Réalisé le ${r.date}` : null, r.cabinet, r.certification].filter(Boolean).join(' · ');
  const resultatColor = r.resultat_global === 'non_detecte' ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', label: 'Non détecté' } : r.resultat_global === 'surveillance' ? { bg: '#fff7ed', border: '#fed7aa', text: '#f97316', label: 'Surveillance requise' } : { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: 'Détecté' };
  return (
    <div>
      <Header type={typeLabel} titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        <div style={{ background: resultatColor.bg, border: `0.5px solid ${resultatColor.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, color: resultatColor.text, marginBottom: 6 }}>Résultat global</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: resultatColor.text }}>{resultatColor.label}</div>
        </div>
        {r.action_requise && <Kpi label="Action requise" value={r.action_requise === 'retrait' ? 'Retrait obligatoire' : r.action_requise === 'surveillance' ? 'Surveillance périodique' : r.action_requise === 'conservation' ? 'Conservation en état' : 'Aucune'} color={r.action_requise === 'retrait' ? '#dc2626' : r.action_requise === 'surveillance' ? '#d97706' : '#16a34a'} />}
        {r.prochaine_visite && <Kpi label="Prochaine visite" value={r.prochaine_visite} />}
      </div>

      {r.zones_detectees?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="ZONES / MATÉRIAUX CONCERNÉS" color="#f97316" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)' }}>
                {['Localisation', 'Matériau', 'Liste', 'Action'].map(h => <th key={h} style={{ ...S.th }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {r.zones_detectees.map((z: any, i: number) => (
                <tr key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                  <td style={{ padding: '9px 18px', color: 'var(--color-text-primary)' }}>{z.localisation}</td>
                  <td style={{ padding: '9px 18px', color: 'var(--color-text-secondary)' }}>{z.materiau || '—'}</td>
                  <td style={{ padding: '9px 18px', color: 'var(--color-text-secondary)' }}>{z.liste || '—'}</td>
                  <td style={{ padding: '9px 18px', color: z.action === 'retrait' ? '#dc2626' : z.action === 'surveillance' ? '#d97706' : 'var(--color-text-secondary)' }}>{z.action || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {r.zones_saines?.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <SectionHeader label="ZONES NON CONCERNÉES" color="#16a34a" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 18px' }}>
            {r.zones_saines.map((z: string, i: number) => (
              <span key={i} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 100, background: 'white', border: '0.5px solid #bbf7d0', color: '#166534' }}>{z}</span>
            ))}
          </div>
        </div>
      )}

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// RENDERER GÉNÉRIQUE
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererAutre({ r }: { r: any }) {
  return (
    <div>
      <Header type="ANALYSE DE DOCUMENT" titre={r.titre} sub="" />
      <Resume text={r.resume} />

      {r.infos_cles?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="INFORMATIONS CLÉS" color="#2a7d9c" />
          {r.infos_cles.map((info: any, i: number) => (
            <InfoRow key={i} label={info.label} value={info.valeur} alt={i % 2 !== 0} />
          ))}
        </div>
      )}

      {r.contenu?.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionHeader label="ÉLÉMENTS EXTRAITS DU DOCUMENT" color="#64748b" />
          {r.contenu.map((c: any, i: number) => (
            <div key={i} style={{ padding: '12px 18px', borderBottom: i < r.contenu.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
              {c.section && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{c.section}</div>}
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{c.detail}</div>
            </div>
          ))}
        </div>
      )}

      <PointsForts items={r.points_forts} />
      <PointsVigilance items={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ═══════════════════════════════════════
// EXPORT PRINCIPAL
// ═══════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DocumentRenderer({ result }: { result: any }) {
  const type = result?.document_type || 'AUTRE';
  switch (type) {
    case 'DDT': return <RendererDDT r={result} />;
    case 'PV_AG': return <RendererPVAG r={result} />;
    case 'APPEL_CHARGES': return <RendererAppelCharges r={result} />;
    case 'RCP': return <RendererRCP r={result} />;
    case 'DTG_PPT': return <RendererDTGPPT r={result} />;
    case 'CARNET_ENTRETIEN': return <RendererCarnetEntretien r={result} />;
    case 'PRE_ETAT_DATE': return <RendererPreEtatDate r={result} />;
    case 'ETAT_DATE': return <RendererEtatDate r={result} />;
    case 'TAXE_FONCIERE': return <RendererTaxeFonciere r={result} />;
    case 'COMPROMIS': return <RendererCompromis r={result} />;
    case 'DIAGNOSTIC_PARTIES_COMMUNES': return <RendererDiagCommunes r={result} />;
    default: return <RendererAutre r={result} />;
  }
}
