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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24, breakInside: 'avoid' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
      <span style={{ color: '#64748b', width: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 500, flex: 1 }}>{value}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRapportPrint(data: Record<string, unknown>, dbData: { id: string; type: string; profil: string | null; created_at: string; document_names: string[] | null }) {
  const r = data;
  const travauxObj = (r.travaux as Record<string, unknown>) || {};
  const financesObj = (r.finances as Record<string, unknown>) || {};
  const chargesAnnuelles = financesObj.charges_annuelles;
  const chargesMensuelles = typeof chargesAnnuelles === 'number' ? Math.round(chargesAnnuelles / 12)
    : typeof chargesAnnuelles === 'string' ? Math.round(parseFloat(chargesAnnuelles.replace(/[^0-9.]/g, '')) / 12) || 0 : 0;
  const fondsTravaux = financesObj.fonds_travaux;
  const fondsTrvauxNum = typeof fondsTravaux === 'number' ? fondsTravaux
    : typeof fondsTravaux === 'string' ? parseFloat(fondsTravaux.replace(/[^0-9.]/g, '')) || 0 : 0;

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
    return { label, annee: obj.annee || obj.annee_vote || '', montant_estime: typeof montant === 'number' ? montant : null, charge_vendeur: obj.charge_vendeur };
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
    type_bien: (r.type_bien as string) || 'appartement',
    profil: dbData.profil || 'rp',
    resume: (r.resume as string) || '',
    points_forts: (r.points_forts as string[]) || (r.synthese_points_positifs as string[]) || [],
    points_vigilance: (r.points_vigilance as string[]) || (r.synthese_points_vigilance as string[]) || [],
    avis_verimo: (r.avis_verimo as string) || '',
    categories: (r.categories as Record<string, { note: number; note_max: number }>) || {},
    charges_mensuelles: chargesMensuelles,
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
      setTimeout(() => window.print(), 500);
    }
  }, [loading, rapport]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans', system-ui" }}>
      <div>
        <div style={{ width: 40, height: 40, border: '3px solid #edf2f7', borderTopColor: '#2a7d9c', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Préparation du PDF…</p>
      </div>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  if (!rapport) return <div style={{ padding: 40, color: '#94a3b8' }}>Rapport introuvable.</div>;

  const scoreColor = getScoreColor(rapport.score);
  const isCopro = rapport.type_bien === 'appartement' || rapport.type_bien === 'maison_copro';
  const diagsPriv = rapport.diagnostics.filter(d => d.perimetre === 'lot_privatif') as Array<{ label?: string; type?: string; resultat?: string; localisation?: string; alerte?: string; perimetre?: string }>;
  const diagsComm = rapport.diagnostics.filter(d => d.perimetre === 'parties_communes' || d.perimetre === 'immeuble') as typeof diagsPriv;
  const vie = rapport.vie_copropriete;
  const lot = rapport.lot_achete as Record<string, string | string[]> | null;
  const syndicObj = vie?.syndic as Record<string, unknown> | undefined;
  const participation = (vie?.participation_ag as Array<Record<string, string>>) || [];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fff', maxWidth: 800, margin: '0 auto', padding: '32px 40px', fontSize: 12, color: '#0f172a', lineHeight: 1.6 }}>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; }
          @page { margin: 1.5cm; size: A4; }
        }
        body { background: #fff; }
      `}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottom: '2px solid #0f2d3d' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em', marginBottom: 6 }}>RAPPORT VERIMO — ANALYSE COMPLÈTE</div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{rapport.adresse}</h1>
          {rapport.adresseSub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{rapport.adresseSub}</div>}
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Analysé le {rapport.date} · {rapport.type_bien === 'maison' ? 'Maison individuelle' : 'Appartement en copropriété'} · {rapport.profil === 'invest' ? 'Investissement locatif' : 'Résidence principale'}</div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{rapport.score.toFixed(1)}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>/20</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor, marginTop: 4, padding: '3px 10px', borderRadius: 100, background: `${scoreColor}15`, border: `1px solid ${scoreColor}30` }}>{getScoreLabel(rapport.score)}</div>
        </div>
      </div>

      {/* Détail de la note */}
      {Object.keys(rapport.categories).length > 0 && (
        <Section title="Détail de la note /20">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(rapport.categories).map(([key, cat]) => {
              const pct = (cat.note / cat.note_max) * 100;
              const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
              const labels: Record<string, string> = { travaux: 'Travaux', procedures: 'Procédures', finances: 'Finances copro', diags_privatifs: 'Diag. privatifs', diags_communs: 'Diag. communs' };
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748b', width: 140, flexShrink: 0 }}>{labels[key] || key}</span>
                  <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, width: 36, textAlign: 'right' }}>{cat.note}/{cat.note_max}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Résumé */}
      <Section title="Résumé">
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>{rapport.resume}</p>
      </Section>

      {/* Points positifs & vigilance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>✓ POINTS POSITIFS</div>
          {rapport.points_forts.map((p, i) => <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid #bbf7d0' }}>{p}</div>)}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', marginBottom: 8 }}>⚠ POINTS DE VIGILANCE</div>
          {rapport.points_vigilance.map((p, i) => <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid #fde68a' }}>{p}</div>)}
        </div>
      </div>

      {/* Travaux */}
      {(rapport.travaux_realises.length > 0 || rapport.travaux_votes.length > 0 || rapport.travaux_evoques.length > 0) && (
        <Section title="Travaux">
          {rapport.travaux_votes.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 5 }}>Votés en AG</div>
              {rapport.travaux_votes.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>{t.label}{t.annee ? ` (${t.annee})` : ''}{t.charge_vendeur ? ' — charge vendeur' : ''}</span>
                  {t.montant_estime && <span style={{ fontWeight: 600 }}>~{(t.montant_estime as number).toLocaleString('fr-FR')}€</span>}
                </div>
              ))}
            </div>
          )}
          {rapport.travaux_evoques.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', marginBottom: 5 }}>Évoqués non votés</div>
              {rapport.travaux_evoques.map((t, i) => (
                <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f1f5f9', color: '#92400e' }}>
                  {t.label}{t.annee ? ` (horizon ${t.annee})` : ''}
                </div>
              ))}
            </div>
          )}
          {rapport.travaux_realises.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 5 }}>Réalisés</div>
              {rapport.travaux_realises.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>{t.label}{t.annee ? ` (${t.annee})` : ''}</span>
                  {t.montant_estime && <span style={{ fontWeight: 600 }}>{(t.montant_estime as number).toLocaleString('fr-FR')}€</span>}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Finances */}
      {isCopro && (rapport.charges_mensuelles > 0 || rapport.fonds_travaux > 0) && (
        <Section title="Finances copropriété">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
            {rapport.charges_mensuelles > 0 && (
              <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{(rapport.charges_mensuelles * 12).toLocaleString('fr-FR')}€/an</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Budget annuel copropriété</div>
              </div>
            )}
            {rapport.fonds_travaux > 0 && (
              <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#2a7d9c' }}>{rapport.fonds_travaux.toLocaleString('fr-FR')}€</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Fonds travaux</div>
              </div>
            )}
          </div>
          {rapport.fonds_travaux_statut && rapport.fonds_travaux_statut !== 'non_mentionne' && (
            <div style={{ fontSize: 12, color: rapport.fonds_travaux_statut === 'conforme' ? '#166534' : '#991b1b' }}>
              Fonds travaux : {rapport.fonds_travaux_statut === 'conforme' ? '✓ conforme au minimum légal (5%)' : '⚠️ insuffisant ou absent'}
            </div>
          )}
        </Section>
      )}

      {/* Diagnostics privatifs */}
      {diagsPriv.length > 0 && (
        <Section title="Diagnostics — Votre logement">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {diagsPriv.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 12, color: '#64748b', width: 120, flexShrink: 0 }}>{String(d.label || d.type)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: d.alerte ? '#dc2626' : '#0f172a' }}>{String(d.resultat || '')}</span>
                {d.localisation && <span style={{ fontSize: 11, color: '#94a3b8' }}>📍 {String(d.localisation)}</span>}
                {d.alerte && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠️ {String(d.alerte)}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Diagnostics parties communes */}
      {diagsComm.length > 0 && (
        <Section title="Diagnostics — Parties communes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {diagsComm.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 12, color: '#64748b', width: 120, flexShrink: 0 }}>{String(d.label || d.type)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: d.alerte ? '#dc2626' : '#0f172a' }}>{String(d.resultat || '')}</span>
                {d.localisation && <span style={{ fontSize: 11, color: '#94a3b8' }}>📍 {String(d.localisation)}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Vie copropriété */}
      {isCopro && (syndicObj || participation.length > 0) && (
        <Section title="Vie de la copropriété">
          {!!syndicObj?.nom && <Row label="Syndic" value={`${String(syndicObj.nom)}${syndicObj.fin_mandat ? ` — mandat ${String(syndicObj.fin_mandat)}` : ''}`} />}
          {participation.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Participation AG :</div>
              {participation.map((p, i) => (
                <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12 }}>
                  <span style={{ color: '#64748b', width: 60 }}>{p.annee}</span>
                  <span>{p.copropietaires_presents_representes || '—'}</span>
                  <span style={{ color: '#2a7d9c' }}>{p.taux_tantiemes_pct || ''}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Votre lot */}
      {lot && (lot.quote_part_tantiemes || lot.fonds_travaux_alur) && (
        <Section title="Votre lot">
          {lot.quote_part_tantiemes && <Row label="Quote-part tantièmes" value={String(lot.quote_part_tantiemes)} />}
          {lot.fonds_travaux_alur && <Row label="Fonds ALUR récupérable" value={`${String(lot.fonds_travaux_alur)} — à récupérer à la signature`} />}
        </Section>
      )}

      {/* Procédures */}
      {rapport.procedures_en_cours && rapport.procedures.length > 0 && (
        <Section title="Procédures détectées">
          {rapport.procedures.map((p, i) => (
            <div key={i} style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginBottom: 3 }}>{p.label || 'Procédure détectée'}</div>
              {p.message && <div style={{ fontSize: 12, color: '#991b1b' }}>{p.message}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* Négociation */}
      {rapport.negociation?.applicable && rapport.negociation.elements.length > 0 && (
        <Section title="Pistes de négociation">
          {// eslint-disable-next-line @typescript-eslint/no-explicit-any
          rapport.negociation.elements.map((el: any, i: number) => (
            <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
              💡 {typeof el === 'string' ? el : (el as Record<string, string>).motif || JSON.stringify(el)}
            </div>
          ))}
        </Section>
      )}

      {/* Avis Verimo */}
      {rapport.avis_verimo && (
        <Section title="Avis Verimo">
          <div style={{ background: '#0f2d3d', borderRadius: 10, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', lineHeight: 1.8, margin: 0 }}>{rapport.avis_verimo}</p>
          </div>
        </Section>
      )}

      {/* Documents analysés */}
      {rapport.document_names.length > 0 && (
        <Section title="Documents analysés">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {rapport.document_names.map((name, i) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 10px', borderRadius: 100, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b' }}>{name}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
        <span>Ce rapport est fourni à titre informatif par Verimo. Il ne constitue pas un conseil juridique ou financier.</span>
        <span>#{rapport.id.slice(0, 8)}</span>
      </div>
    </div>
  );
}
