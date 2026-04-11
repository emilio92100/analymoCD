import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAnalyseById } from '../lib/analyses';

/* ══════════ Utilitaires ══════════ */
function getScoreColor(score: number) {
  if (score >= 17) return '#15803d';
  if (score >= 14) return '#16a34a';
  if (score >= 10) return '#d97706';
  if (score >= 7) return '#ea580c';
  return '#dc2626';
}
function getScoreLabel(score: number) {
  if (score >= 17) return 'Bien irréprochable';
  if (score >= 14) return 'Bien sain';
  if (score >= 10) return 'Bien correct avec réserves';
  if (score >= 7) return 'Bien risqué';
  return 'Bien à éviter';
}

function SectionTitle({ children, color = '#0f2d3d' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 7, borderBottom: `2px solid ${color}` }}>
      <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{children}</span>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22, breakInside: 'avoid' as const }}>
      <SectionTitle color={color}>{title}</SectionTitle>
      {children}
    </div>
  );
}

function Pill({ children, bg, color, border }: { children: React.ReactNode; bg: string; color: string; border?: string }) {
  return (
    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: bg, color, border: border ? `1px solid ${border}` : 'none' }}>
      {children}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRapportPrint(data: Record<string, unknown>, dbData: { id: string; type: string; profil: string | null; created_at: string; document_names: string[] | null }) {
  const r = data;
  const travauxObj = (r.travaux as Record<string, unknown>) || {};
  const financesObj = (r.finances as Record<string, unknown>) || {};
  const budgetTotal = financesObj.budget_total_copro;
  const budgetTotalNum = typeof budgetTotal === 'number' ? budgetTotal : typeof budgetTotal === 'string' ? parseFloat(String(budgetTotal).replace(/[^0-9.]/g, '')) || 0 : 0;
  const chargesLot = financesObj.charges_annuelles_lot;
  const chargesLotNum = typeof chargesLot === 'number' ? chargesLot : typeof chargesLot === 'string' ? parseFloat(String(chargesLot).replace(/[^0-9.]/g, '')) || 0 : 0;
  const fondsTravaux = financesObj.fonds_travaux;
  const fondsTrvauxNum = typeof fondsTravaux === 'number' ? fondsTravaux : typeof fondsTravaux === 'string' ? parseFloat(String(fondsTravaux).replace(/[^0-9.]/g, '')) || 0 : 0;

  const titreComplet = (r.titre as string) || '';
  const adresseMatch = titreComplet.match(/^([^–\-]+(?:[-–][^(]+)?)\s*[-–]?\s*(Lot.*|lot.*)?$/);
  const adresse = adresseMatch?.[1]?.trim() || titreComplet;
  const adresseSub = adresseMatch?.[2]?.trim() || '';
  const mappedType = (dbData.type === 'pack2' || dbData.type === 'pack3' ? 'complete' : dbData.type) as 'document' | 'complete';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toTravaux = (arr: unknown[]): any[] => (arr || []).map(t => {
    if (typeof t === 'string') return { label: t };
    if (typeof t !== 'object' || t === null) return null;
    const obj = t as Record<string, unknown>;
    const label = (obj.label as string) || (obj.description as string) || '';
    if (!label) return null;
    const montant = obj.montant ?? obj.montant_estime ?? obj.montant_total;
    return { label, annee: obj.annee || obj.annee_vote || '', montant_estime: typeof montant === 'number' ? montant : null, charge_vendeur: obj.charge_vendeur, precision: obj.precision };
  }).filter(Boolean);

  const rawProcedures = (r.procedures as unknown[]) || [];
  const procedures = rawProcedures.map(p =>
    typeof p === 'string' ? { label: p, gravite: 'moderee', message: p }
      : p as { label: string; gravite: string; message?: string }
  );

  return {
    id: dbData.id, type: mappedType,
    adresse, adresseSub,
    date: new Date(dbData.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    score: typeof r.score === 'number' ? r.score : 0,
    score_niveau: (r.score_niveau as string) || '',
    type_bien: (r.type_bien as string) || 'appartement',
    annee_construction: (r.annee_construction as string) || null,
    profil: dbData.profil || 'rp',
    resume: (r.resume as string) || '',
    points_forts: (r.points_forts as string[]) || [],
    points_vigilance: (r.points_vigilance as string[]) || [],
    avis_verimo: (r.avis_verimo as string) || '',
    categories: (r.categories as Record<string, { note: number; note_max: number }>) || {},
    budget_total_copro: budgetTotalNum,
    charges_annuelles_lot: chargesLotNum,
    fonds_travaux: fondsTrvauxNum,
    fonds_travaux_statut: (financesObj.fonds_travaux_statut as string) || 'non_mentionne',
    travaux_realises: toTravaux((travauxObj.realises as unknown[]) || []),
    travaux_votes: toTravaux((travauxObj.votes as unknown[]) || []),
    travaux_evoques: toTravaux((travauxObj.evoques as unknown[]) || []),
    procedures_en_cours: procedures.length > 0,
    procedures,
    diagnostics: (r.diagnostics as Array<Record<string, unknown>>) || [],
    documents_analyses: (r.documents_analyses as Array<Record<string, unknown>>) || [],
    document_names: dbData.document_names || [],
    negociation: (r.negociation as { applicable: boolean; elements: unknown[] }) || { applicable: false, elements: [] },
    vie_copropriete: r.vie_copropriete as Record<string, unknown> | null,
    lot_achete: r.lot_achete as Record<string, unknown> | null,
    finances: financesObj,
  };
}

type PrintData = ReturnType<typeof buildRapportPrint>;

export default function RapportPrintPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const [rapport, setRapport] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    const data = await fetchAnalyseById(id);
    if (data?.result) {
      setRapport(buildRapportPrint(data.result as Record<string, unknown>, {
        id: data.id, type: data.type, profil: data.profil,
        created_at: data.created_at, document_names: data.document_names,
      }));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!loading && rapport) {
      setTimeout(() => window.print(), 600);
    }
  }, [loading, rapport]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', system-ui" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #edf2f7', borderTopColor: '#2a7d9c', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Préparation du PDF…</p>
      </div>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  if (!rapport) return <div style={{ padding: 40, color: '#94a3b8' }}>Rapport introuvable.</div>;

  const scoreColor = getScoreColor(rapport.score);
  const isCopro = rapport.type_bien === 'appartement' || rapport.type_bien === 'maison_copro';
  const diagsPriv = rapport.diagnostics.filter(d => d.perimetre === 'lot_privatif') as Array<Record<string, string>>;
  const diagsComm = rapport.diagnostics.filter(d => d.perimetre === 'parties_communes' || d.perimetre === 'immeuble') as Array<Record<string, string>>;
  const vie = rapport.vie_copropriete;
  const lot = rapport.lot_achete as Record<string, unknown> | null;
  const syndicObj = vie?.syndic as Record<string, unknown> | undefined;
  const participation = (vie?.participation_ag as Array<Record<string, string>>) || [];
  const appelsExceptionnels = (vie?.appels_fonds_exceptionnels as Array<Record<string, unknown>>) || [];
  const circ = 2 * Math.PI * 28;
  const dash = (rapport.score / 20) * circ;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fff', maxWidth: 780, margin: '0 auto', padding: '0', fontSize: 11.5, color: '#0f172a', lineHeight: 1.6 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; background: white; }
          @page { margin: 1.2cm 1.4cm; size: A4; }
          .page-break { break-before: page; }
          .no-break { break-inside: avoid; }
        }
        body { background: #f5f9fb; }
      `}</style>

      {/* ══════════ PAGE 1 ══════════ */}
      <div style={{ padding: '0 0 32px 0' }}>

        {/* Header avec logo */}
        <div style={{ background: '#0f2d3d', padding: '20px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>Verimo</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.12em', marginTop: 2 }}>ANALYSE IMMOBILIÈRE</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Rapport généré le {rapport.date}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Réf. #{rapport.id.slice(0, 8)}</div>
          </div>
        </div>

        <div style={{ padding: '0 36px' }}>

          {/* Hero — adresse + score */}
          <div className="no-break" style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 28, padding: '20px 24px', background: '#f8fafc', borderRadius: 14, border: '1px solid #edf2f7' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 6 }}>
                {rapport.type_bien === 'maison' ? 'MAISON INDIVIDUELLE' : 'APPARTEMENT EN COPROPRIÉTÉ'} · {rapport.profil === 'invest' ? 'INVESTISSEMENT LOCATIF' : 'RÉSIDENCE PRINCIPALE'}
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.3 }}>{rapport.adresse}</h1>
              {rapport.adresseSub && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{rapport.adresseSub}</div>}
              {rapport.annee_construction && <div style={{ fontSize: 11, color: '#94a3b8' }}>Construction : {rapport.annee_construction}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 72, height: 72 }}>
                <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="36" cy="36" r="28" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle cx="36" cy="36" r="28" fill="none" stroke={scoreColor} strokeWidth="6"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{rapport.score.toFixed(1)}</span>
                  <span style={{ fontSize: 9, color: '#94a3b8' }}>/20</span>
                </div>
              </div>
              <Pill bg={`${scoreColor}15`} color={scoreColor} border={`${scoreColor}30`}>{getScoreLabel(rapport.score)}</Pill>
            </div>
          </div>

          {/* Détail de la note */}
          {Object.keys(rapport.categories).length > 0 && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Détail de la note">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(rapport.categories).map(([key, cat]) => {
                    const pct = (cat.note / cat.note_max) * 100;
                    const c = pct >= 80 ? '#16a34a' : pct >= 55 ? '#d97706' : '#dc2626';
                    const labels: Record<string, string> = { travaux: 'Travaux', procedures: 'Procédures', finances: 'Finances copro', diags_privatifs: 'Diag. privatifs', diags_communs: 'Diag. communs' };
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, color: '#64748b', width: 150, flexShrink: 0 }}>{labels[key] || key}</span>
                        <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: c, width: 40, textAlign: 'right' as const }}>{cat.note}/{cat.note_max}</span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </div>
          )}

          {/* Résumé */}
          <div className="no-break" style={{ marginBottom: 22 }}>
            <Section title="Résumé de l'analyse">
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7' }}>{rapport.resume}</p>
            </Section>
          </div>

          {/* Points positifs & vigilance */}
          <div className="no-break" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
            <div style={{ padding: '14px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', letterSpacing: '0.08em', marginBottom: 8 }}>✓ POINTS POSITIFS</div>
              {rapport.points_forts.length > 0
                ? rapport.points_forts.map((p, i) => <div key={i} style={{ fontSize: 11.5, color: '#166534', marginBottom: 5, paddingLeft: 10, borderLeft: '2px solid #22c55e', lineHeight: 1.5 }}>{p}</div>)
                : <div style={{ fontSize: 11, color: '#94a3b8' }}>Aucun point identifié</div>}
            </div>
            <div style={{ padding: '14px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#d97706', letterSpacing: '0.08em', marginBottom: 8 }}>⚠ POINTS DE VIGILANCE</div>
              {rapport.points_vigilance.length > 0
                ? rapport.points_vigilance.map((p, i) => <div key={i} style={{ fontSize: 11.5, color: '#92400e', marginBottom: 5, paddingLeft: 10, borderLeft: '2px solid #f97316', lineHeight: 1.5 }}>{p}</div>)
                : <div style={{ fontSize: 11, color: '#94a3b8' }}>Aucun point identifié</div>}
            </div>
          </div>

          {/* ══════════ TRAVAUX ══════════ */}
          {(rapport.travaux_realises.length > 0 || rapport.travaux_votes.length > 0 || rapport.travaux_evoques.length > 0) && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Travaux">
                {rapport.travaux_votes.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', letterSpacing: '0.06em', marginBottom: 6 }}>VOTÉS EN AG</div>
                    <div style={{ fontSize: 11, color: '#1e40af', background: '#eff6ff', borderRadius: 7, padding: '6px 10px', marginBottom: 6 }}>ℹ️ Travaux votés avant compromis = à la charge du vendeur. Vérifiez avec votre notaire.</div>
                    {rapport.travaux_votes.map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '5px 10px', borderBottom: '1px solid #eff6ff', background: i % 2 === 0 ? '#f8fbff' : '#fff' }}>
                        <span style={{ color: '#1e40af', fontWeight: 500 }}>• {String(t.label)}{t.annee ? ` (${String(t.annee)})` : ''}{t.charge_vendeur ? ' — charge vendeur' : ''}</span>
                        {t.montant_estime && <span style={{ fontWeight: 700, color: '#1d4ed8' }}>~{(t.montant_estime as number).toLocaleString('fr-FR')}€</span>}
                      </div>
                    ))}
                  </div>
                )}
                {rapport.travaux_evoques.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#f97316', letterSpacing: '0.06em', marginBottom: 6 }}>ÉVOQUÉS — NON ENCORE VOTÉS</div>
                    <div style={{ fontSize: 11, color: '#92400e', background: '#fff7ed', borderRadius: 7, padding: '6px 10px', marginBottom: 6 }}>⚠️ Mentionnés en réunion sans vote — si votés après votre achat, vous en supporterez une part.</div>
                    {rapport.travaux_evoques.map((t, i) => (
                      <div key={i} style={{ fontSize: 11.5, padding: '5px 10px', borderBottom: '1px solid #fff7ed', background: i % 2 === 0 ? '#fffbf5' : '#fff', color: '#92400e' }}>
                        • {String(t.label)}{t.annee ? ` (horizon ${String(t.annee)})` : ''}{t.precision ? ` — ${String(t.precision)}` : ''}
                      </div>
                    ))}
                  </div>
                )}
                {rapport.travaux_realises.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', letterSpacing: '0.06em', marginBottom: 6 }}>RÉALISÉS</div>
                    {rapport.travaux_realises.map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '5px 10px', borderBottom: '1px solid #f0fdf4', background: i % 2 === 0 ? '#f8fffe' : '#fff' }}>
                        <span style={{ color: '#166534' }}>✓ {String(t.label)}{t.annee ? ` (${String(t.annee)})` : ''}</span>
                        {t.montant_estime && <span style={{ fontWeight: 700, color: '#16a34a' }}>{(t.montant_estime as number).toLocaleString('fr-FR')}€</span>}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* ══════════ FINANCES ══════════ */}
          {isCopro && (rapport.budget_total_copro > 0 || rapport.fonds_travaux > 0 || rapport.charges_annuelles_lot > 0) && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Finances de la copropriété">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                  {rapport.budget_total_copro > 0 && (
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7', textAlign: 'center' as const }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{rapport.budget_total_copro.toLocaleString('fr-FR')}€</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Budget annuel copropriété</div>
                    </div>
                  )}
                  {rapport.charges_annuelles_lot > 0 && (
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7', textAlign: 'center' as const }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#2a7d9c' }}>{rapport.charges_annuelles_lot.toLocaleString('fr-FR')}€</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Charges annuelles votre lot</div>
                    </div>
                  )}
                  {rapport.fonds_travaux > 0 && (
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7', textAlign: 'center' as const }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>{rapport.fonds_travaux.toLocaleString('fr-FR')}€</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Fonds travaux copro</div>
                    </div>
                  )}
                </div>
                {rapport.fonds_travaux_statut && rapport.fonds_travaux_statut !== 'non_mentionne' && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: rapport.fonds_travaux_statut === 'conforme' ? '#166534' : '#991b1b', padding: '6px 12px', background: rapport.fonds_travaux_statut === 'conforme' ? '#f0fdf4' : '#fef2f2', borderRadius: 7, border: `1px solid ${rapport.fonds_travaux_statut === 'conforme' ? '#bbf7d0' : '#fecaca'}` }}>
                    Fonds travaux : {rapport.fonds_travaux_statut === 'conforme' ? '✓ conforme au minimum légal (5%)' : rapport.fonds_travaux_statut === 'insuffisant' ? '⚠️ insuffisant (< 5% du budget)' : '⚠️ absent ou non mentionné'}
                  </div>
                )}
                {appelsExceptionnels.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', marginBottom: 5 }}>APPELS DE FONDS EXCEPTIONNELS (votés en AG)</div>
                    {appelsExceptionnels.map((a, i) => {
                      const motif = String(a.motif ?? a.description ?? a.libelle ?? 'Appel de fonds exceptionnel');
                      const montant = typeof a.montant_total === 'number' ? a.montant_total : typeof a.montant === 'number' ? a.montant : null;
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '5px 10px', background: '#fffbeb', borderBottom: '1px solid #fde68a', color: '#92400e' }}>
                          <span>• {motif}</span>
                          {montant !== null && <span style={{ fontWeight: 700 }}>{(montant as number).toLocaleString('fr-FR')}€</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* ══════════ DIAGNOSTICS PRIVATIFS ══════════ */}
          {diagsPriv.length > 0 && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Diagnostics — Votre logement">
                {diagsPriv.map((d, i) => {
                  const hasAlert = !!d.alerte;
                  const isAbsence = d.presence === 'absence';
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 10px', borderBottom: '1px solid #f1f5f9', background: hasAlert ? '#fef9f9' : isAbsence ? '#f0fdf4' : '#fff', borderRadius: i === 0 ? '8px 8px 0 0' : i === diagsPriv.length - 1 ? '0 0 8px 8px' : 0, borderLeft: `3px solid ${hasAlert ? '#fecaca' : isAbsence ? '#bbf7d0' : '#e2e8f0'}` }}>
                      <span style={{ fontSize: 11, color: '#64748b', width: 130, flexShrink: 0, fontWeight: 600 }}>{d.label || d.type}</span>
                      <div style={{ flex: 1 }}>
                        {isAbsence
                          ? <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Non détecté</span>
                          : <span style={{ fontSize: 11, color: hasAlert ? '#dc2626' : '#374151', fontWeight: hasAlert ? 600 : 400 }}>{d.resultat || ''}</span>
                        }
                        {d.alerte && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 3, fontWeight: 600 }}>⚠️ {d.alerte}</div>}
                      </div>
                      {d.localisation && <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>📍 {d.localisation}</span>}
                    </div>
                  );
                })}
              </Section>
            </div>
          )}

          {/* ══════════ DIAGNOSTICS PARTIES COMMUNES ══════════ */}
          {diagsComm.length > 0 && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Diagnostics — Parties communes">
                {diagsComm.map((d, i) => {
                  const hasAlert = !!d.alerte;
                  const isAbsence = d.presence === 'absence';
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '7px 10px', borderBottom: '1px solid #f1f5f9', background: hasAlert ? '#fef9f9' : '#fff', borderLeft: `3px solid ${hasAlert ? '#fecaca' : '#e2e8f0'}` }}>
                      <span style={{ fontSize: 11, color: '#64748b', width: 130, flexShrink: 0, fontWeight: 600 }}>{d.label || d.type}</span>
                      <span style={{ fontSize: 11, color: hasAlert ? '#dc2626' : isAbsence ? '#16a34a' : '#374151' }}>{isAbsence ? '✓ Non détecté' : (d.resultat || '—')}</span>
                      {d.alerte && <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>⚠️ {d.alerte}</span>}
                    </div>
                  );
                })}
              </Section>
            </div>
          )}

          {/* ══════════ VIE COPROPRIÉTÉ ══════════ */}
          {isCopro && (syndicObj || participation.length > 0) && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Vie de la copropriété">
                {syndicObj?.nom && (
                  <div style={{ display: 'flex', gap: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #edf2f7', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: '#64748b', width: 60, flexShrink: 0 }}>Syndic</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{String(syndicObj.nom)}{syndicObj.fin_mandat ? ` — mandat jusqu'en ${String(syndicObj.fin_mandat)}` : ''}</span>
                  </div>
                )}
                {syndicObj?.tensions_detectees && syndicObj.tensions_detail && (
                  <div style={{ padding: '8px 12px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 10, fontSize: 11, color: '#92400e' }}>
                    ⚠ Tensions détectées : {String(syndicObj.tensions_detail)}
                  </div>
                )}
                {participation.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: '0.06em' }}>PARTICIPATION AUX AG</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Année', 'Participation', 'Taux tantièmes', 'Note'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7', fontSize: 10 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {participation.map((p, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 700 }}>{p.annee}</td>
                            <td style={{ padding: '6px 10px', color: '#374151' }}>{p.copropietaires_presents_representes || '—'}</td>
                            <td style={{ padding: '6px 10px', color: '#374151' }}>{p.taux_tantiemes_pct || '—'}</td>
                            <td style={{ padding: '6px 10px', color: '#d97706', fontSize: 10, fontWeight: 600 }}>{p.quorum_note || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* ══════════ VOTRE LOT ══════════ */}
          {lot && (lot.quote_part_tantiemes || lot.fonds_travaux_alur) && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Votre lot">
                <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', overflow: 'hidden' }}>
                  {lot.quote_part_tantiemes && (
                    <div style={{ display: 'flex', padding: '8px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 11, color: '#64748b', width: 160, flexShrink: 0 }}>Quote-part tantièmes</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{String(lot.quote_part_tantiemes)}</span>
                        {(lot.parties_privatives as string[])?.length > 0 && (
                          <div style={{ marginTop: 3 }}>
                            {(lot.parties_privatives as string[]).map((p, i) => (
                              <div key={i} style={{ fontSize: 10, color: '#64748b' }}>• {p}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {lot.fonds_travaux_alur && (
                    <div style={{ display: 'flex', padding: '8px 14px', borderBottom: lot.travaux_votes_charge_vendeur ? '1px solid #f1f5f9' : 'none' }}>
                      <span style={{ fontSize: 11, color: '#64748b', width: 160, flexShrink: 0 }}>Fonds travaux ALUR</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>
                        {isNaN(Number(String(lot.fonds_travaux_alur).replace(/[^0-9.]/g, ''))) ? String(lot.fonds_travaux_alur) : `${Number(String(lot.fonds_travaux_alur).replace(/[^0-9.]/g, '')).toLocaleString('fr-FR')}€`} — récupérable à la signature
                      </span>
                    </div>
                  )}
                  {(lot.travaux_votes_charge_vendeur as string[])?.length > 0 && (
                    <div style={{ display: 'flex', padding: '8px 14px' }}>
                      <span style={{ fontSize: 11, color: '#64748b', width: 160, flexShrink: 0 }}>Charge vendeur</span>
                      <div style={{ flex: 1 }}>
                        {(lot.travaux_votes_charge_vendeur as string[]).map((t, i) => (
                          <div key={i} style={{ fontSize: 11, color: '#1d4ed8' }}>• {t}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* ══════════ PROCÉDURES ══════════ */}
          {rapport.procedures_en_cours && rapport.procedures.length > 0 && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Procédures détectées" color="#dc2626">
                <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', marginBottom: 10, fontSize: 11, color: '#991b1b', fontWeight: 600 }}>
                  {rapport.procedures.length} procédure{rapport.procedures.length > 1 ? 's' : ''} détectée{rapport.procedures.length > 1 ? 's' : ''} dans les documents.
                </div>
                {rapport.procedures.map((p, i) => {
                  const g = p.gravite === 'elevee' ? { color: '#991b1b', label: 'Élevée' } : p.gravite === 'moderee' ? { color: '#d97706', label: 'Modérée' } : { color: '#16a34a', label: 'Faible' };
                  return (
                    <div key={i} style={{ padding: '10px 14px', background: '#fff', borderRadius: 9, border: '1px solid #fecaca', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>{p.label || 'Procédure détectée'}</span>
                        <Pill bg={`${g.color}15`} color={g.color}>{g.label}</Pill>
                      </div>
                      {p.message && <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>{p.message}</div>}
                    </div>
                  );
                })}
              </Section>
            </div>
          )}

          {/* ══════════ NÉGOCIATION ══════════ */}
          {rapport.negociation?.applicable && rapport.negociation.elements.length > 0 && rapport.score < 14 && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Pistes de négociation" color="#d97706">
                <div style={{ fontSize: 11, color: '#92400e', marginBottom: 8, fontStyle: 'italic' }}>Arguments concrets pour défendre votre négociation auprès du vendeur.</div>
                {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                rapport.negociation.elements.map((el: any, i: number) => (
                  <div key={i} style={{ padding: '8px 12px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 6, fontSize: 11, color: '#92400e', lineHeight: 1.6 }}>
                    💡 {typeof el === 'string' ? el : (el as Record<string, string>).motif || JSON.stringify(el)}
                  </div>
                ))}
              </Section>
            </div>
          )}

          {/* ══════════ AVIS VERIMO ══════════ */}
          {rapport.avis_verimo && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Avis Verimo">
                <div style={{ background: '#0f2d3d', borderRadius: 12, padding: '18px 22px' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.90)', lineHeight: 1.85, margin: 0 }}>{rapport.avis_verimo}</p>
                </div>
              </Section>
            </div>
          )}

          {/* ══════════ DOCUMENTS ANALYSÉS ══════════ */}
          {rapport.documents_analyses.length > 0 && (
            <div className="no-break" style={{ marginBottom: 22 }}>
              <Section title="Documents analysés">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {rapport.documents_analyses.map((doc, i) => {
                    const nom = (doc.nom as string) || (doc.type as string) || 'Document';
                    const annee = doc.annee as string;
                    return (
                      <span key={i} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 100, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b' }}>
                        📄 {nom}{annee ? ` (${annee})` : ''}
                      </span>
                    );
                  })}
                </div>
              </Section>
            </div>
          )}

          {/* ══════════ FOOTER ══════════ */}
          <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5 }}>
                Ce rapport est fourni à titre informatif par Verimo. Il ne constitue pas un conseil juridique ou financier<br />et ne remplace pas l'avis d'un notaire ou d'un expert immobilier.
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f2d3d' }}>Verimo</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>verimo.fr · #{rapport.id.slice(0, 8)}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
