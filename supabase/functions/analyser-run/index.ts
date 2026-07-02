// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser-run (v7 — complement + typeBienDeclare)
// Étape 2 : Appel Claude avec file_ids → rapport → suppression RGPD
// Mode complement : fusionne rapport existant + nouveaux docs
// Session 4 : reçoit type_bien_declare (appart/maison/maison_copro/indetermine)
//             et l'injecte dans le prompt pour fiabiliser le rendu
// Pas de limite HTTP → peut durer 10+ minutes
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_FILES_URL = 'https://api.anthropic.com/v1/files';
const AI_MODEL = 'claude-sonnet-4-6';
const AI_VERSION = '2023-06-01';
const FILES_BETA = 'files-api-2025-04-14';
const MAX_TOKENS_OUTPUT = 64000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SupabaseClient = ReturnType<typeof createClient>;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function parseJson<T>(raw: string): T | null {
  try {
    let clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) clean = clean.slice(start, end + 1);
    return JSON.parse(clean) as T;
  } catch (e) {
    console.error('[analyser-run] parseJson error:', e, 'raw:', raw.slice(0, 100));
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════
// RECALCUL DETERMINISTE DES NOTES PAR CATEGORIE
// ══════════════════════════════════════════════════════════════════════
// Objectif : ne plus dependre du LLM pour les notes — les calculer a partir
// des donnees extraites. Garantit un scoring coherent et reproductible.
// ══════════════════════════════════════════════════════════════════════
interface DiagItem { type?: string; perimetre?: string; resultat?: string; presence?: string; alerte?: string | null; label?: string }
interface TravauxItem { label?: string; montant_estime?: number | null; charge_vendeur?: boolean }
interface ProcedureItem { label?: string; type?: string; gravite?: string; message?: string }
interface RapportShape {
  score?: number;
  annee_construction?: string | number | null;
  type_bien?: string;
  profil?: string;
  diagnostics?: DiagItem[];
  travaux?: { realises?: TravauxItem[]; votes?: TravauxItem[]; evoques?: TravauxItem[]; estimation_totale?: number | null };
  procedures?: ProcedureItem[];
  finances?: {
    budget_total_copro?: number | null;
    charges_annuelles_lot?: number | null;
    fonds_travaux?: number | null;
    fonds_travaux_statut?: string;
    impayes?: number | null;
  };
  vie_copropriete?: {
    dtg?: { present?: boolean; etat_general?: string; budget_urgent_3ans?: number | null };
    syndic?: { statut?: string };
    participation_ag?: Array<{ quitus?: { soumis?: boolean; approuve?: boolean } }>;
  };
  pre_etat_date?: { present?: boolean; impayes_vendeur?: number };
  categories?: Record<string, { note: number; note_max: number }>;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ══════════════════════════════════════════════════════════════════════
// 🏠 SCORING MAISON HORS COPRO (et maison en ASL)
// 5 categories /20 adaptees a une maison individuelle :
//   1. Performance energetique (5)  2. Diagnostics & securite (5)
//   3. Assainissement & risques (4) 4. Travaux & bati (3)  5. Juridique / ASL (3)
// Recalcule AUSSI le score global = somme des 5 categories (coherence).
// N'est appelee QUE pour un bien hors copropriete. Le scoring copro est intact.
// ══════════════════════════════════════════════════════════════════════
function recalculerCategoriesMaison(rapport: RapportShape, _profil: string, anneeNum: number | null): RapportShape {
  const r = rapport as Record<string, unknown>;
  const diags = (rapport.diagnostics || []) as DiagItem[];
  const lower = (s: unknown) => String(s ?? '').toLowerCase();
  const docsAnalyses = Array.isArray(r.documents_analyses) ? (r.documents_analyses as Array<Record<string, unknown>>) : [];
  const hasDocType = (t: string) => docsAnalyses.some(d => String(d.type || '').toUpperCase() === t);

  // ─── 1. PERFORMANCE ENERGETIQUE (/5) — classe DPE + audit obligatoire ───
  const dpe = diags.find(d => String(d.type || '').toUpperCase() === 'DPE');
  let notePerf: number;
  if (!dpe) {
    notePerf = 0;
  } else {
    const cl = (lower(dpe.resultat).match(/classe\s*([a-g])/) || [])[1] || '';
    const map: Record<string, number> = { a: 5, b: 5, c: 4.5, d: 4, e: 3, f: 2, g: 1 };
    notePerf = map[cl] ?? 3;
    if (['e', 'f', 'g'].includes(cl)) {
      const auditPresent = hasDocType('AUDIT_ENERGETIQUE') || diags.some(d => String(d.type || '').toUpperCase() === 'AUDIT_ENERGETIQUE');
      if (!auditPresent) notePerf -= 1; // audit obligatoire E/F/G manquant
    }
    notePerf = clamp(notePerf, 0, 5);
  }

  // ─── 2. DIAGNOSTICS & SECURITE (/5) — elec, gaz, amiante, plomb, termites ───
  const secTypes = ['ELECTRICITE', 'GAZ', 'AMIANTE', 'PLOMB', 'TERMITES'];
  const secDiags = diags.filter(d => secTypes.includes(String(d.type || '').toUpperCase()));
  let noteDiags: number;
  if (secDiags.length === 0 && !dpe) {
    noteDiags = 0; // aucun diagnostic du tout
  } else {
    noteDiags = 5;
    const requis: string[] = [];
    if (!anneeNum || anneeNum < 2010) requis.push('ELECTRICITE');
    if (anneeNum && anneeNum < 1997) requis.push('AMIANTE');
    if (anneeNum && anneeNum < 1949) requis.push('PLOMB');
    if (secDiags.some(d => String(d.type || '').toUpperCase() === 'GAZ')) requis.push('GAZ');
    if (secDiags.some(d => String(d.type || '').toUpperCase() === 'TERMITES')) requis.push('TERMITES');
    const presents = new Set(secDiags.map(d => String(d.type || '').toUpperCase()));
    const manquants = requis.filter(t => !presents.has(t));
    noteDiags -= manquants.length * 0.75;
    for (const d of secDiags) {
      const t = String(d.type || '').toUpperCase();
      const detail = `${lower(d.resultat)} ${lower(d.alerte)} ${lower(d.label)}`;
      if (t === 'ELECTRICITE') {
        const electroOk = /aucune anomali|sans anomali|pas d.anomali|aucun d[ée]faut|conforme|\bras\b/.test(detail);
        if (!electroOk) {
          if (/majeur|danger|risque/.test(detail) && /anomali/.test(detail)) noteDiags -= 2;
          else if (/anomali/.test(detail)) noteDiags -= 0.5;
        }
      } else if (t === 'GAZ') {
        if (/\ba2\b/.test(detail)) noteDiags -= 2;
        else if (/\ba1\b/.test(detail)) noteDiags -= 0.5;
      } else if (t === 'AMIANTE') {
        if (/d[ée]grad|positif|pr[ée]sent/.test(detail) && !/\bnon\b|absence/.test(detail)) noteDiags -= 2;
        else if (/suspect|[ée]valuation p[ée]riodique/.test(detail)) noteDiags -= 0.5;
      } else if (t === 'PLOMB') {
        if (/d[ée]grad|positif/.test(detail)) noteDiags -= 2;
      } else if (t === 'TERMITES') {
        if (/pr[ée]sence|d[ée]tect|positif/.test(detail) && !/absence|\bnon\b/.test(detail)) noteDiags -= 3;
      }
    }
    noteDiags = clamp(noteDiags, 1, 5);
  }

  // ─── 3. ASSAINISSEMENT & RISQUES (/4) — assainissement non collectif + ERP ───
  let noteAssain = 4;
  const assain = r.assainissement as { present?: boolean; type_reseau?: string; conforme?: boolean | null } | undefined;
  if (assain && assain.type_reseau === 'non_collectif') {
    if (assain.conforme === false) noteAssain -= 1.5;        // non conforme : mise aux normes obligatoire
    else if (assain.present === false) noteAssain -= 0.5;    // non raccorde mais controle absent
  }
  const erp = diags.find(d => String(d.type || '').toUpperCase() === 'ERP');
  if (erp) {
    const detail = `${lower(erp.resultat)} ${lower(erp.alerte)} ${lower(erp.label)}`;
    if (/prescription|travaux prescrits|obligation de travaux|prescrit/.test(detail)) noteAssain -= 0.5;
  }
  const hasAssainData = !!(assain && assain.present) || !!erp;
  noteAssain = hasAssainData ? clamp(noteAssain, 1, 4) : 2; // pas de donnee = neutre

  // ─── 4. TRAVAUX & BATI (/3) — recompense l entretien documente ───
  let noteTravaux = 2; // base neutre
  const hist = r.historique_travaux as { present?: boolean; travaux?: Array<{ poste?: string; description?: string }>; garantie_decennale_possible?: boolean } | undefined;
  const realises = (rapport.travaux?.realises || []) as TravauxItem[];
  const histTravaux = (hist?.travaux || []) as Array<{ poste?: string; description?: string }>;
  const hasHistory = !!hist?.present || realises.length > 0 || histTravaux.length > 0;
  if (hasHistory) {
    const labels = [
      ...realises.map(t => lower(t.label)),
      ...histTravaux.map(t => `${lower(t.poste)} ${lower(t.description)}`),
    ].join(' | ');
    const majeurs = /toiture|chauffage|chaudi|isolation|[ée]lectr|fen[êe]tre|ravalement|fa[çc]ade|menuiserie|charpente|[ée]tanch/.test(labels);
    noteTravaux += majeurs ? 1 : 0.5;
    if (hist?.garantie_decennale_possible) noteTravaux += 0.5;
  }
  const compromisObj = (r.lot_achete as Record<string, unknown> | undefined)?.compromis as Record<string, unknown> | undefined;
  const bienObj = compromisObj?.bien as Record<string, unknown> | undefined;
  const etatDeclare = `${lower(bienObj?.etat_general_declare)} ${lower(r.etat_general_declare)}`;
  if (/d[ée]grad|mauvais [ée]tat|v[ée]tuste|gros travaux|insalubre|ruine/.test(etatDeclare)) noteTravaux -= 1;
  noteTravaux = clamp(noteTravaux, 0, 3);

  // ─── 5. JURIDIQUE (/3) — ou ASL & LOTISSEMENT si le bien est en ASL ───
  let noteJur = 3;
  const vieAsl = r.vie_asl as { present?: boolean; structures?: Array<Record<string, unknown>> } | undefined;
  const hasAsl = !!vieAsl?.present && Array.isArray(vieAsl.structures) && vieAsl.structures.length > 0;
  if (hasAsl) {
    for (const s of vieAsl!.structures!) {
      const conf = s.conformite_2004 as { statuts_publies?: boolean | null } | undefined;
      if (conf && conf.statuts_publies === false) noteJur -= 1; // non conforme 2004
      const voirie = s.voirie_retrocession;
      if (voirie === false || /non r[ée]troc[ée]d/.test(lower(voirie))) noteJur -= 1; // voirie a charge
      const cahier = s.cahier_charges as { contraintes_urbanisme?: unknown[] } | undefined;
      if (cahier && Array.isArray(cahier.contraintes_urbanisme) && cahier.contraintes_urbanisme.length > 0) noteJur -= 0.5;
      // cotisation : affichee comme charge reelle, jamais penalisee par son montant
    }
  } else {
    const servitudes = ((compromisObj?.servitudes as unknown[]) || (r.servitudes as unknown[]) || []);
    const nbServ = Array.isArray(servitudes) ? servitudes.length : 0;
    noteJur -= Math.min(1.5, nbServ * 0.5);
    const urbaText = `${lower(JSON.stringify(servitudes))} ${lower(JSON.stringify(r.points_vigilance))}`;
    if (/abf|architecte des b[âa]timents|b[âa]timents de france|zone prot[ée]g[ée]e|monument historique|secteur sauvegard[ée]|site class[ée]/.test(urbaText)) noteJur -= 0.5;
    const procs = (rapport.procedures || []) as ProcedureItem[];
    for (const p of procs) {
      if (p.gravite === 'elevee') noteJur -= 2;
      else if (p.gravite === 'moderee') noteJur -= 1;
      else if (p.gravite === 'faible') noteJur -= 0.5;
    }
  }
  noteJur = clamp(noteJur, 0, 3);

  const round = (n: number) => Math.round(n * 2) / 2;
  const categoriesRecalculees = {
    perf_energetique: { note: round(notePerf), note_max: 5 },
    diags_securite: { note: round(noteDiags), note_max: 5 },
    assainissement_risques: { note: round(noteAssain), note_max: 4 },
    travaux_bati: { note: round(noteTravaux), note_max: 3 },
    juridique: { note: round(noteJur), note_max: 3 },
  };
  // Score global maison = somme des 5 categories (coherent avec l affichage)
  const scoreMaison = round(
    categoriesRecalculees.perf_energetique.note +
    categoriesRecalculees.diags_securite.note +
    categoriesRecalculees.assainissement_risques.note +
    categoriesRecalculees.travaux_bati.note +
    categoriesRecalculees.juridique.note
  );

  console.log('[analyser-run] Categories MAISON recalculees:', JSON.stringify(categoriesRecalculees), '| score:', scoreMaison, '| ASL:', hasAsl);
  return { ...rapport, score: scoreMaison, categories: categoriesRecalculees };
}

function recalculerCategories(rapport: RapportShape, profil: string): RapportShape {
  const diagnostics = rapport.diagnostics || [];
  const diagsPrivatifs = diagnostics.filter(d => d.perimetre === 'lot_privatif');
  const diagsCommuns = diagnostics.filter(d => d.perimetre === 'parties_communes');

  const anneeNum = rapport.annee_construction ? Number(String(rapport.annee_construction).replace(/[^0-9]/g, '')) : null;
  const typeBien = rapport.type_bien || 'appartement';
  const isCopro = typeBien === 'appartement' || typeBien === 'maison_copro';

  // 🏠 MAISON HORS COPRO : scoring dedie (5 categories specifiques + recalcul du score).
  // Le chemin COPRO ci-dessous reste strictement inchange.
  if (!isCopro) {
    return recalculerCategoriesMaison(rapport, profil, anneeNum);
  }

  // ═══ TRAVAUX (note_max = 5) ═══
  let noteTravaux = 5;
  const travaux = rapport.travaux || {};
  const evoques = travaux.evoques || [];
  const motsLourds = /toiture|ravalement|chaudi[èe]re|ascenseur|structure|fa[çc]ade|canalisation|[ée]tanch[ée]it[ée]/i;
  let lourdsCount = 0;
  let legersCount = 0;
  for (const t of evoques) {
    if (t.label && motsLourds.test(t.label)) lourdsCount++;
    else legersCount++;
  }
  noteTravaux -= Math.min(3, lourdsCount * 1.5);
  noteTravaux -= Math.min(1.5, legersCount * 0.5);

  const votesChargeVendeur = (travaux.votes || []).filter(t => t.charge_vendeur);
  if (votesChargeVendeur.length > 0) noteTravaux += Math.min(2, votesChargeVendeur.length * 0.5);

  const travauxAnalyses = (travaux.realises || []).length + (travaux.votes || []).length + evoques.length;
  noteTravaux = clamp(noteTravaux, travauxAnalyses > 0 ? 1 : 0, 5);

  // ═══ PROCEDURES (note_max = 4) ═══
  let noteProcedures = 4;
  const procedures = rapport.procedures || [];
  for (const p of procedures) {
    if (p.gravite === 'elevee') noteProcedures -= 2;
    else if (p.gravite === 'moderee') noteProcedures -= 1;
    else if (p.gravite === 'faible') noteProcedures -= 0.5;
  }
  const quitusRefuse = (rapport.vie_copropriete?.participation_ag || []).some(p => p.quitus?.soumis === true && p.quitus?.approuve === false);
  if (quitusRefuse) noteProcedures -= 0.5;
  noteProcedures = clamp(noteProcedures, 0, 4);

  // ═══ FINANCES (note_max = 4) ═══
  let noteFinances = 2;
  const fin = rapport.finances || {};
  const fondsStatut = fin.fonds_travaux_statut;
  if (fondsStatut === 'excellent') noteFinances += 1.5;
  else if (fondsStatut === 'bien') noteFinances += 1;
  else if (fondsStatut === 'conforme') noteFinances += 0.5;
  else if (fondsStatut === 'insuffisant') noteFinances -= 0.5;
  else if (fondsStatut === 'absent') noteFinances -= 1;

  const budget = fin.budget_total_copro || 0;
  const impayes = fin.impayes || 0;
  if (budget > 0 && impayes > 0 && impayes / budget > 0.15) noteFinances -= 0.5;

  if (rapport.pre_etat_date?.present && rapport.pre_etat_date?.impayes_vendeur === 0) noteFinances += 0.5;

  const hasFinancesData = !!(fin.budget_total_copro || fin.charges_annuelles_lot || fin.fonds_travaux || rapport.pre_etat_date?.present);
  noteFinances = clamp(noteFinances, hasFinancesData ? 1 : 0, 4);

  // ═══ DIAGS PRIVATIFS (note_max = 4) — LE VRAI FIX ═══
  let noteDiagsPrivatifs: number;
  if (diagsPrivatifs.length === 0) {
    noteDiagsPrivatifs = 0;
  } else {
    const requis = ['DPE'];
    if (!anneeNum || anneeNum < 2010) requis.push('ELECTRICITE');
    if (anneeNum && anneeNum < 1997) requis.push('AMIANTE');
    if (anneeNum && anneeNum < 1949) requis.push('PLOMB');
    const aGaz = diagsPrivatifs.some(d => d.type === 'GAZ');
    if (aGaz) requis.push('GAZ');
    const aTermites = diagsPrivatifs.some(d => d.type === 'TERMITES');
    if (aTermites) requis.push('TERMITES');
    if (isCopro) requis.push('CARREZ');

    noteDiagsPrivatifs = 4;

    const typesPresents = new Set(diagsPrivatifs.map(d => d.type));
    const manquants = requis.filter(t => !typesPresents.has(t));
    noteDiagsPrivatifs -= manquants.length * 0.75;

    for (const d of diagsPrivatifs) {
      const detail = (d.resultat || d.alerte || d.label || '').toLowerCase();
      if (d.type === 'DPE') {
        if (/classe\s*g/i.test(detail)) {
          noteDiagsPrivatifs -= profil === 'invest' ? 2 : 1.5;
        } else if (/classe\s*f/i.test(detail)) {
          noteDiagsPrivatifs -= profil === 'invest' ? 1.5 : 1;
        }
      }
      if (d.type === 'ELECTRICITE') {
        if (/majeur|danger|risque/i.test(detail) && /anomali/i.test(detail)) noteDiagsPrivatifs -= 1;
        else if (/anomali/i.test(detail)) noteDiagsPrivatifs -= 0.3;
      }
      if (d.type === 'GAZ') {
        if (/a1\b/i.test(detail)) noteDiagsPrivatifs -= 1;
        else if (/a2\b/i.test(detail)) noteDiagsPrivatifs -= 0.5;
      }
      if (d.type === 'AMIANTE') {
        if (/d[ée]grad|positif|pr[ée]sent/i.test(detail) && !/non/i.test(detail)) noteDiagsPrivatifs -= 1;
        else if (/suspect|[ée]valuation p[ée]riodique/i.test(detail)) noteDiagsPrivatifs -= 0.3;
      }
      if (d.type === 'PLOMB' && /d[ée]grad|positif/i.test(detail)) noteDiagsPrivatifs -= 1;
      if (d.type === 'TERMITES' && /pr[ée]sence|d[ée]tect[ée]|positif/i.test(detail) && !/absence|non/i.test(detail)) noteDiagsPrivatifs -= 2;
    }

    // PLANCHER : si au moins 1 diag extrait, la note ne peut pas descendre sous 1
    noteDiagsPrivatifs = clamp(noteDiagsPrivatifs, 1, 4);
  }

  // ═══ DIAGS COMMUNS (note_max = 3) ═══
  let noteDiagsCommuns = 2;
  const dtg = rapport.vie_copropriete?.dtg;
  if (dtg?.present) {
    if (dtg.etat_general === 'bon') noteDiagsCommuns += 1;
    else if (dtg.etat_general === 'moyen') noteDiagsCommuns += 0.5;
    else if (dtg.etat_general === 'degrade') noteDiagsCommuns -= 1;

    if (dtg.budget_urgent_3ans && dtg.budget_urgent_3ans > 50000) noteDiagsCommuns -= 0.5;
  }
  for (const d of diagsCommuns) {
    const detail = (d.resultat || d.alerte || d.label || '').toLowerCase();
    if (d.type === 'AMIANTE' && /ac1|action corrective/i.test(detail)) noteDiagsCommuns -= 1;
    if (d.type === 'TERMITES' && /pr[ée]sence|d[ée]tect[ée]/i.test(detail) && !/absence/i.test(detail)) noteDiagsCommuns -= 1;
  }

  const hasCommunsData = diagsCommuns.length > 0 || dtg?.present;
  noteDiagsCommuns = clamp(noteDiagsCommuns, hasCommunsData ? 1 : 0, 3);

  const categoriesRecalculees = {
    travaux: { note: Math.round(noteTravaux * 2) / 2, note_max: 5 },
    procedures: { note: Math.round(noteProcedures * 2) / 2, note_max: 4 },
    finances: { note: Math.round(noteFinances * 2) / 2, note_max: 4 },
    diags_privatifs: { note: Math.round(noteDiagsPrivatifs * 2) / 2, note_max: 4 },
    diags_communs: { note: Math.round(noteDiagsCommuns * 2) / 2, note_max: 3 },
  };

  console.log('[analyser-run] Categories recalculees:', JSON.stringify(categoriesRecalculees));
  console.log('[analyser-run] Diags privatifs detectes:', diagsPrivatifs.length, '| types:', diagsPrivatifs.map(d => d.type).join(','));

  return { ...rapport, categories: categoriesRecalculees };
}

// ══════════════════════════════════════════════════════════════════════
// 🆕 VALIDATION DETERMINISTE — Diagnostics obligatoires manquants
// Ajoute dans documents_manquants et points_vigilance les diagnostics
// obligatoires absents du dossier selon le type de bien et l'année.
// Fonction pure : ne touche pas l'IA, juste de la logique métier.
// ══════════════════════════════════════════════════════════════════════
function validateDiagsManquants(rapport: RapportShape): RapportShape {
  const r = rapport as Record<string, unknown>;
  const typeBien = (r.type_bien as string) || '';
  const anneeStr = (r.annee_construction as string) || '';
  const anneeMatch = anneeStr.match(/\d{4}/);
  const annee = anneeMatch ? parseInt(anneeMatch[0]) : null;

  const diagnostics = Array.isArray(r.diagnostics) ? r.diagnostics as Array<Record<string, unknown>> : [];
  const docsAnalyses = Array.isArray(r.documents_analyses) ? r.documents_analyses as Array<Record<string, unknown>> : [];

  // Helper : un diag est présent s'il existe avec une présence "detectee" ou si un doc le mentionne
  const diagPresent = (type: string): boolean => {
    return diagnostics.some(d => {
      const t = String(d.type || '').toUpperCase();
      const presence = String(d.presence || '').toLowerCase();
      return t === type && presence !== 'non_realise' && presence !== 'absence';
    });
  };

  // Helper : un audit énergétique est présent si un doc de type AUDIT_ENERGETIQUE existe
  const docPresent = (type: string): boolean => {
    return docsAnalyses.some(d => String(d.type || '').toUpperCase() === type);
  };

  // DPE classe pour règle audit énergétique
  const diagDpe = diagnostics.find(d => String(d.type || '').toUpperCase() === 'DPE');
  const dpeResultat = diagDpe ? String(diagDpe.resultat || '') : '';
  const dpeClasseMatch = dpeResultat.match(/Classe\s*([A-G])/i);
  const dpeClasse = dpeClasseMatch ? dpeClasseMatch[1].toUpperCase() : null;

  const docsManquants: string[] = Array.isArray(r.documents_manquants)
    ? [...(r.documents_manquants as string[])]
    : [];
  const pointsVigilance: unknown[] = Array.isArray(r.points_vigilance)
    ? [...(r.points_vigilance as unknown[])]
    : [];

  // Helper : ajouter à documents_manquants sans doublon
  const ajouter = (texte: string) => {
    const existe = docsManquants.some(d => d.toLowerCase().includes(texte.toLowerCase().slice(0, 30)));
    if (!existe) docsManquants.push(texte);
  };

  // Helper : ajouter à points_vigilance sans doublon (compare sur les 50 premiers caractères)
  const ajouterVigilance = (texte: string) => {
    const cle = texte.toLowerCase().slice(0, 50);
    const existe = pointsVigilance.some(p => {
      const s = typeof p === 'string' ? p : (p as Record<string, unknown>)?.message || (p as Record<string, unknown>)?.label || '';
      return String(s).toLowerCase().includes(cle);
    });
    if (!existe) pointsVigilance.push(texte);
  };

  // ── DPE
  if (!diagPresent('DPE')) {
    ajouter("DPE — Diagnostic de performance énergétique (obligatoire pour la vente)");
    ajouterVigilance("DPE manquant — Le DPE n'a pas été détecté dans le dossier. Obligatoire pour la vente, à demander au vendeur.");
  }

  // ── ERP
  if (!diagPresent('ERP')) {
    ajouter("État des Risques et Pollutions — ERP (obligatoire pour la vente)");
    ajouterVigilance("ERP manquant — L'État des Risques et Pollutions n'a pas été détecté. Obligatoire pour la vente, à demander au vendeur.");
  }

  // ── CARREZ (obligatoire en copropriété)
  if ((typeBien === 'appartement' || typeBien === 'maison_copro') && !diagPresent('CARREZ')) {
    ajouter("Mesurage loi Carrez (obligatoire en copropriété)");
    ajouterVigilance("Mesurage Carrez manquant — Le mesurage loi Carrez n'a pas été détecté. Obligatoire en copropriété, à demander au vendeur.");
  }

  // ── ELECTRICITE (installation > 15 ans, donc en pratique année < 2011)
  if (annee && annee < 2011 && !diagPresent('ELECTRICITE')) {
    ajouter("Diagnostic électrique (obligatoire pour les installations de plus de 15 ans)");
    ajouterVigilance("Diagnostic électrique manquant — Non détecté. Obligatoire pour une installation de plus de 15 ans, à demander au vendeur.");
  }

  // ── AMIANTE privatif (construction avant 1997)
  if (annee && annee < 1997) {
    const amiantePrivatif = diagnostics.some(d => {
      const t = String(d.type || '').toUpperCase();
      const perimetre = String(d.perimetre || '').toLowerCase();
      const presence = String(d.presence || '').toLowerCase();
      return t === 'AMIANTE' && perimetre === 'lot_privatif' && presence !== 'non_realise' && presence !== 'absence';
    });
    if (!amiantePrivatif) {
      ajouter("Diagnostic amiante privatif (obligatoire pour les biens construits avant 1997)");
      ajouterVigilance("Diagnostic amiante manquant — Non détecté. Obligatoire pour un bien construit avant 1997, à demander au vendeur.");
    }
  }

  // ── PLOMB (construction avant 1949)
  if (annee && annee < 1949 && !diagPresent('PLOMB')) {
    ajouter("Constat de risque d'exposition au plomb — CREP (obligatoire pour les biens construits avant 1949)");
    ajouterVigilance("Plomb (CREP) manquant — Le constat plomb (CREP) n'a pas été détecté. Obligatoire pour un bien construit avant 1949, à demander au vendeur.");
  }

  // ── AUDIT ENERGETIQUE (maison + DPE E/F/G)
  if (typeBien === 'maison' && dpeClasse && ['E', 'F', 'G'].includes(dpeClasse) && !docPresent('AUDIT_ENERGETIQUE')) {
    ajouter("Audit énergétique (obligatoire pour les maisons classées E, F ou G)");
    ajouterVigilance(`Audit énergétique manquant — Non détecté. Obligatoire pour la vente d'une maison classée ${dpeClasse}, à demander au vendeur.`);
  }

  // ── ASSAINISSEMENT (maison non raccordée au tout-à-l'égout)
  if (typeBien === 'maison' && !docPresent('ASSAINISSEMENT')) {
    ajouter("Diagnostic assainissement (si non raccordé au tout-à-l'égout)");
    ajouterVigilance("Diagnostic assainissement manquant — Non détecté. Obligatoire si la maison n'est pas raccordée au tout-à-l'égout, à vérifier avec le vendeur.");
  }

  // ── TERMITES (zone arrêté préfectoral)
  // On NE met PAS dans documents_manquants (incertain), juste un point de vigilance neutre
  if (!diagPresent('TERMITES')) {
    ajouterVigilance("État termites à vérifier — Vérifiez auprès de la mairie ou du notaire si la commune est en zone termites (arrêté préfectoral). Si oui, l'état termites est obligatoire pour la vente.");
  }

  console.log(`[analyser-run] validateDiagsManquants: ${docsManquants.length} docs manquants, ${pointsVigilance.length} points vigilance`);

  return { ...rapport, documents_manquants: docsManquants, points_vigilance: pointsVigilance } as RapportShape;
}

// ══════════════════════════════════════════════════════════════════════
// 🆕 RETRY CIBLE DPE/CARREZ — Si l'IA a oublié les détails critiques,
// on relance UN appel IA ciblé (1 seul, jamais en boucle) avec un mini-prompt.
// Coût additionnel : ~0,02-0,05€ par retry, déclenché uniquement si besoin.
// ══════════════════════════════════════════════════════════════════════
async function retryDpeCarrez(
  rapport: RapportShape,
  fileIds: string[],
  apiKey: string,
): Promise<RapportShape> {
  const r = rapport as Record<string, unknown>;
  const diagnostics = Array.isArray(r.diagnostics) ? r.diagnostics as Array<Record<string, unknown>> : [];

  // 1. Détecter si retry nécessaire
  const dpe = diagnostics.find(d => String(d.type || '').toUpperCase() === 'DPE');
  const dpeResultat = dpe ? String(dpe.resultat || '') : '';
  const dpeClasseMatch = dpeResultat.match(/Classe\s*([A-G])/i);
  const dpeClasse = dpeClasseMatch ? dpeClasseMatch[1].toUpperCase() : null;
  const dpeReco = r.dpe_recommandations as Record<string, unknown> | undefined;
  const hasDpeRecos = !!(dpeReco?.present && Array.isArray((dpeReco?.pack_1 as Record<string, unknown>)?.travaux) && ((dpeReco?.pack_1 as Record<string, unknown>)?.travaux as unknown[]).length > 0);

  const carrez = diagnostics.find(d => String(d.type || '').toUpperCase() === 'CARREZ');
  const hasCarrezPieces = !!(carrez && Array.isArray(carrez.pieces_detail) && (carrez.pieces_detail as unknown[]).length > 0);

  const needDpeRetry = dpeClasse && ['D', 'E', 'F', 'G'].includes(dpeClasse) && !hasDpeRecos;
  const needCarrezRetry = !!carrez && !hasCarrezPieces;

  if (!needDpeRetry && !needCarrezRetry) {
    console.log('[analyser-run] retryDpeCarrez: aucun retry nécessaire');
    return rapport;
  }

  console.log(`[analyser-run] retryDpeCarrez: needDpeRetry=${needDpeRetry} needCarrezRetry=${needCarrezRetry}`);

  // 2. Construire le mini-prompt ciblé
  const champs: string[] = [];
  if (needDpeRetry) {
    champs.push(`"dpe_recommandations": { "present": true|false, "pack_1": { "cout_min": number|null, "cout_max": number|null, "travaux": [{"poste": "mur|toiture|plancher_bas|fenetres|porte|chauffage|eau_chaude|ventilation|autre", "description": "...", "performance_cible": null, "decision_copropriete": false, "autorisation_urbanisme": false}] }, "pack_2": { ...idem }, "evolution_etiquette": { "actuelle": {"classe": "...", "kwh_m2": number|null, "ges_kg_m2": number|null}, "apres_pack_1": {...}, "apres_pack_1_et_2": {...} } }`);
  }
  if (needCarrezRetry) {
    champs.push(`"carrez_pieces": [{"piece": "Sejour", "surface": 32.96}, ...] (extraire CHAQUE pièce du tableau de mesurage Carrez avec sa surface en m²)`);
  }

  const miniPrompt = `Tu es un assistant d'extraction de données immobilières. Tu reçois un ou plusieurs documents PDF. Tu dois extraire UNIQUEMENT les champs demandés et répondre en JSON STRICT, sans aucun texte autour.

Champs à extraire :
${champs.join('\n')}

Si l'information n'est pas trouvable dans les documents, mets "present": false ou un tableau vide [].

Réponds UNIQUEMENT avec un objet JSON contenant les champs demandés. Pas de markdown, pas d'explication.`;

  // 3. Appel IA avec timeout 30s
  const userContent: unknown[] = fileIds.map(id => ({ type: 'document', source: { type: 'file', file_id: id } }));
  userContent.push({ type: 'text', text: 'Extrais les champs demandés.' });

  let retryResult: { text: string; error?: string };
  try {
    retryResult = await Promise.race([
      callAI({ system: miniPrompt, userContent, maxTokens: 4000, apiKey }),
      new Promise<{ text: string; error: string }>((_, reject) =>
        setTimeout(() => reject(new Error('timeout_30s')), 30000)
      ),
    ]) as { text: string; error?: string };
  } catch (e) {
    console.error('[analyser-run] retryDpeCarrez: échec appel IA (non bloquant):', e);
    return rapport;
  }

  if (retryResult.error || !retryResult.text) {
    console.error('[analyser-run] retryDpeCarrez: pas de réponse exploitable');
    return rapport;
  }

  // 4. Parser la réponse JSON
  let parsed: Record<string, unknown>;
  try {
    const cleaned = retryResult.text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('[analyser-run] retryDpeCarrez: erreur parsing JSON (non bloquant):', e);
    return rapport;
  }

  // 5. Merger dans le rapport
  const updated = { ...rapport } as Record<string, unknown>;

  if (needDpeRetry && parsed.dpe_recommandations) {
    updated.dpe_recommandations = parsed.dpe_recommandations;
    console.log('[analyser-run] retryDpeCarrez: dpe_recommandations mis à jour');
  }

  if (needCarrezRetry && Array.isArray(parsed.carrez_pieces) && parsed.carrez_pieces.length > 0) {
    const newDiagnostics = diagnostics.map(d => {
      if (String(d.type || '').toUpperCase() === 'CARREZ') {
        return { ...d, pieces_detail: parsed.carrez_pieces };
      }
      return d;
    });
    updated.diagnostics = newDiagnostics;
    console.log('[analyser-run] retryDpeCarrez: carrez.pieces_detail mis à jour');
  }

  return updated as RapportShape;
}

async function deleteFromFilesAPI(fileId: string, apiKey: string): Promise<void> {
  try {
    const res = await fetch(`${ANTHROPIC_FILES_URL}/${fileId}`, {
      method: 'DELETE',
      headers: { 'x-api-key': apiKey, 'anthropic-version': AI_VERSION, 'anthropic-beta': FILES_BETA },
    });
    if (res.ok) {
      console.log(`[analyser-run] Supprimé: ${fileId}`);
    } else {
      console.error(`[analyser-run] ⚠️ Echec suppression ${fileId} — HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[analyser-run] ⚠️ Erreur réseau suppression ${fileId}:`, err);
  }
}

// ══════════════════════════════════════════════════════════════════════
// REMBOURSEMENT AUTOMATIQUE DU CRÉDIT EN CAS D'ÉCHEC
// ══════════════════════════════════════════════════════════════════════
async function refundCredit(analyseId: string, supabaseAdmin: SupabaseClient): Promise<boolean> {
  try {
    // Récupérer l'analyse pour connaître le user_id et le type
    const { data: analyse } = await supabaseAdmin
      .from('analyses')
      .select('user_id, type')
      .eq('id', analyseId)
      .single();
    
    if (!analyse?.user_id || !analyse?.type) {
      console.warn('[analyser-run] Remboursement impossible — user_id ou type manquant');
      return false;
    }

    // Ne pas rembourser les types inconnus
    const creditType = analyse.type;
    if (creditType !== 'document' && creditType !== 'complete') {
      console.log(`[analyser-run] Pas de remboursement pour type=${creditType}`);
      return false;
    }

    // 🆕 Vérifier si le user est pro pour utiliser refund_pro_credit (identique à analyser/index.ts)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, credits_document, credits_complete')
      .eq('id', analyse.user_id)
      .single();

    if (!profile) {
      console.error('[analyser-run] Profil introuvable pour remboursement');
      return false;
    }

    // 🆕 Branche PRO : appel RPC refund_pro_credit (rembourse abo / unitaires / grants)
    if ((profile as Record<string, unknown>).role === 'pro') {
      const { error: rpcErr } = await supabaseAdmin.rpc('refund_pro_credit', {
        p_user_id: analyse.user_id,
        p_credit_type: creditType,
      });
      if (rpcErr) {
        console.error('[analyser-run] Erreur refund_pro_credit:', rpcErr.message);
        return false;
      }
      console.log(`[analyser-run] ✅ Crédit pro ${creditType} remboursé pour user ${analyse.user_id} (analyse ${analyseId})`);
      return true;
    }

    // Branche PARTICULIER : UPDATE classique sur profiles
    const col = creditType === 'document' ? 'credits_document' : 'credits_complete';
    const current = (profile as Record<string, number>)[col] || 0;
    
    // Recréditer
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ [col]: current + 1 })
      .eq('id', analyse.user_id);
    
    if (error) {
      console.error('[analyser-run] Erreur remboursement:', error.message);
      return false;
    }

    console.log(`[analyser-run] ✅ Crédit ${creditType} remboursé pour user ${analyse.user_id} (analyse ${analyseId})`);
    return true;
  } catch (err) {
    console.error('[analyser-run] Erreur remboursement:', err);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════
// INSERTION D'UNE ALERTE SYSTÈME POUR L'ADMIN
// ══════════════════════════════════════════════════════════════════════
async function insertSystemAlert(
  supabaseAdmin: SupabaseClient,
  params: {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    analyseId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await supabaseAdmin.from('system_alerts').insert({
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      analyse_id: params.analyseId || null,
      user_id: params.userId || null,
      metadata: params.metadata || {},
    });
    console.log(`[analyser-run] 🔔 Alerte système: ${params.type} — ${params.title}`);
  } catch (err) {
    console.error('[analyser-run] Erreur insertion alerte:', err);
  }
}

// Helper pour gérer un échec : remboursement + alerte + update status
async function handleAnalyseFailure(
  supabaseAdmin: SupabaseClient,
  analyseId: string,
  errorType: string,
  userMessage: string,
  alertTitle: string,
  alertSeverity: 'info' | 'warning' | 'critical' = 'warning',
): Promise<void> {
  // 1. Rembourser le crédit
  const refunded = await refundCredit(analyseId, supabaseAdmin);
  
  // 2. Récupérer le user_id pour l'alerte
  const { data: analyse } = await supabaseAdmin
    .from('analyses')
    .select('user_id, type')
    .eq('id', analyseId)
    .single();

  // 3. Insérer l'alerte système
  await insertSystemAlert(supabaseAdmin, {
    type: errorType,
    severity: alertSeverity,
    title: alertTitle,
    message: userMessage,
    analyseId,
    userId: analyse?.user_id || undefined,
    metadata: { refunded, analyseType: analyse?.type || 'unknown' },
  });

  // 4. Mettre à jour le status de l'analyse
  const finalMsg = refunded 
    ? userMessage 
    : userMessage.replace('Votre crédit a été remboursé automatiquement.', 'Contactez le support pour le remboursement de votre crédit.');
  
  await supabaseAdmin.from('analyses').update({ 
    status: 'failed', 
    progress_message: finalMsg 
  }).eq('id', analyseId);

  // 🆕 Notification cloche pour le user + mail particulier (cohérence avec succès)
  await notifyAnalysisFailure(supabaseAdmin, analyseId);
}

// ══════════════════════════════════════════════════════════════════════
// 🆕 v9 — NOTIF + EMAIL DE SUCCÈS (uniquement si fromRetry = true)
// Ces fonctions sont appelées quand une analyse passée par la queue
// se termine avec succès, pour prévenir le client par email + cloche.
// ══════════════════════════════════════════════════════════════════════

async function insertNotification(
  supabaseAdmin: SupabaseClient,
  userId: string,
  title: string,
  message: string,
  analysisId?: string, // 🆕 Livraison 1 : ID de l'analyse pour rendre la notif cliquable
): Promise<void> {
  try {
    const payload: Record<string, unknown> = {
      user_id: userId,
      title,
      message,
      read: false,
    };
    if (analysisId) payload.analysis_id = analysisId;

    await supabaseAdmin.from('user_notifications').insert(payload);
    console.log(`[analyser-run] 🔔 Notif: ${title}${analysisId ? ` (analysisId: ${analysisId})` : ''}`);
  } catch (err) {
    console.error('[analyser-run] Notif error:', err);
  }
}

async function sendMailjet(
  to: string,
  toName: string,
  subject: string,
  htmlBody: string,
  isPro: boolean,
): Promise<boolean> {
  const MJ_API_KEY = Deno.env.get('MJ_API_KEY') ?? '';
  const MJ_SECRET_KEY = Deno.env.get('MJ_SECRET_KEY') ?? '';
  if (!MJ_API_KEY || !MJ_SECRET_KEY) {
    console.error('[analyser-run] Mailjet non configuré');
    return false;
  }

  const fromEmail = isPro ? 'pro@verimo.fr' : 'notification@verimo.fr';
  const fromName = isPro ? 'Verimo Pro' : 'Verimo';

  try {
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${MJ_API_KEY}:${MJ_SECRET_KEY}`),
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: fromEmail, Name: fromName },
          To: [{ Email: to, Name: toName }],
          Subject: subject,
          HTMLPart: htmlBody,
        }],
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[analyser-run] Mailjet ${res.status}:`, errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[analyser-run] Mailjet exception:', err);
    return false;
  }
}

function buildSuccessEmail(opts: {
  prenom: string;
  isComplete: boolean;
  subject: string;
  reportUrl: string;
  isPro: boolean;
}): string {
  const intro = opts.isComplete
    ? `Votre analyse complète du bien situé <strong style="color:#0f2d3d;">${opts.subject}</strong> est terminée.`
    : `Votre analyse du document <strong style="color:#0f2d3d;">"${opts.subject}"</strong> est terminée.`;
  const summary = opts.isComplete
    ? `Notre rapport détaille le score global, les points forts et faibles, l'état des finances de la copropriété, les diagnostics, les éventuels risques et nos recommandations avant signature.`
    : `Notre rapport vous résume les points-clés du document, identifie les éléments importants à retenir et signale les points de vigilance éventuels.`;
  const proLabel = opts.isPro ? 'PRO · ANALYSE PRÊTE' : '✓ ANALYSE PRÊTE';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:20px 12px;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);width:100%;max-width:560px;">
<tr><td style="background:linear-gradient(135deg,#0a1f2d,#1a4a5e);padding:36px 24px 28px;text-align:center;">
<img src="https://www.verimo.fr/logo-blanc.png" alt="Verimo" width="180" style="display:block;margin:0 auto 14px;max-width:180px;height:auto;" />
<span style="display:inline-block;background:linear-gradient(135deg,#7dd3fc,#38bdf8);color:#0a1f2d;font-size:11px;font-weight:800;padding:5px 16px;border-radius:100px;letter-spacing:0.1em;">${proLabel}</span>
</td></tr>
<tr><td style="padding:32px 28px 8px;">
<h2 style="color:#0f2d3d;font-size:22px;font-weight:800;margin:0 0 20px;text-align:center;">Bonjour ${opts.prenom},</h2>
<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 12px;">${intro}</p>
<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">${summary}</p>
</td></tr>
<tr><td style="padding:0 28px 28px;text-align:center;">
<a href="${opts.reportUrl}" style="display:inline-block;background:linear-gradient(135deg,#2a7d9c,#0f2d3d);color:#fff;font-size:16px;font-weight:700;padding:15px 44px;border-radius:14px;text-decoration:none;">🔍 Consulter mon rapport</a>
</td></tr>
${opts.isPro ? '' : `<tr><td style="padding:0 28px 28px;">
<table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
<tr><td style="padding:22px 24px;text-align:center;">
<p style="color:#0f2d3d;font-size:14px;font-weight:700;margin:0 0 8px;">✨ Verimo vous a aidé ?</p>
<p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 16px;">Partagez Verimo à un proche qui s'apprête à acheter — il économisera des heures d'analyse et évitera peut-être un mauvais investissement.</p>
<a href="https://verimo.fr" style="display:inline-block;background:#fff;color:#2a7d9c;font-size:13px;font-weight:700;padding:10px 24px;border-radius:10px;text-decoration:none;border:1.5px solid #2a7d9c;">Partager Verimo</a>
</td></tr>
</table>
</td></tr>`}
<tr><td style="padding:0 28px 24px;">
<p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;text-align:center;">Une question ? Créez un ticket depuis votre espace via le bouton "Besoin d'aide".</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #f1f5f9;">
<p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;"><strong style="color:#64748b;">Verimo${opts.isPro ? ' Pro' : ''}</strong> — Vos documents décryptés, votre décision éclairée.<br><a href="https://verimo.fr" style="color:#2a7d9c;text-decoration:none;">verimo.fr</a></p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

// 🆕 Template email d'échec (particulier uniquement — orange clair, ton rassurant)
function buildFailureEmail(opts: {
  prenom: string;
  subject: string;
  dashboardUrl: string;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:20px 12px;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);width:100%;max-width:560px;">
<tr><td style="background:linear-gradient(135deg,#0a1f2d,#1a4a5e);padding:36px 24px 28px;text-align:center;">
<img src="https://www.verimo.fr/logo-blanc.png" alt="Verimo" width="180" style="display:block;margin:0 auto 14px;max-width:180px;height:auto;" />
<span style="display:inline-block;background:#fff7ed;color:#c2410c;font-size:11px;font-weight:800;padding:5px 16px;border-radius:100px;letter-spacing:0.1em;border:1px solid #fed7aa;">⚠ ANALYSE INTERROMPUE</span>
</td></tr>
<tr><td style="padding:32px 28px 8px;">
<h2 style="color:#0f2d3d;font-size:22px;font-weight:800;margin:0 0 20px;text-align:center;">Bonjour ${opts.prenom},</h2>
<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 12px;">Votre analyse <strong style="color:#0f2d3d;">${opts.subject}</strong> n'a pas pu être finalisée en raison d'un incident technique temporaire.</p>
<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 12px;">Pas d'inquiétude : <strong style="color:#15803d;">votre crédit a été remboursé automatiquement</strong>, votre solde est intact.</p>
<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">Vous pouvez relancer votre analyse dès maintenant — l'incident est en général ponctuel.</p>
</td></tr>
<tr><td style="padding:0 28px 28px;text-align:center;">
<a href="${opts.dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#2a7d9c,#0f2d3d);color:#fff;font-size:16px;font-weight:700;padding:15px 44px;border-radius:14px;text-decoration:none;">🔄 Relancer mon analyse</a>
</td></tr>
<tr><td style="padding:0 28px 24px;">
<p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;text-align:center;">Le problème persiste ? Créez un ticket depuis votre espace via le bouton "Besoin d'aide".</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #f1f5f9;">
<p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;"><strong style="color:#64748b;">Verimo</strong> — Vos documents décryptés, votre décision éclairée.<br><a href="https://verimo.fr" style="color:#2a7d9c;text-decoration:none;">verimo.fr</a></p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

// 🆕 Notif cloche (tout le monde) + mail (particulier seulement) en cas d'échec
async function notifyAnalysisFailure(
  supabaseAdmin: SupabaseClient,
  analyseId: string,
): Promise<void> {
  try {
    const { data: a } = await supabaseAdmin
      .from('analyses')
      .select('user_id, title, address, type')
      .eq('id', analyseId)
      .single();

    if (!a?.user_id) return;

    const isComplete = a.type !== 'document';
    // Sujet NON trompeur : si l'analyse a planté avant d'extraire l'adresse, on ne nomme PAS
    // un seul fichier pour une analyse complète (ce serait trompeur) → libellé neutre "complète".
    const subject = a.address
      ? `du bien « ${a.address} »`
      : (isComplete ? 'complète' : (a.title ? `du document « ${a.title} »` : ''));

    // 1. Notification cloche (pas d'analysisId → non cliquable, car le rapport n'existe pas)
    await insertNotification(
      supabaseAdmin,
      a.user_id,
      'Analyse non aboutie',
      `Votre analyse${subject ? ' ' + subject : ''} n'a pas pu être finalisée à cause d'un incident technique. Votre crédit a été remboursé automatiquement, vous pouvez relancer.`,
      // pas d'analysisId : pas de rapport à afficher
    );

    // 2. Email Mailjet (uniquement particulier — cohérent avec Livraison 2)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, role')
      .eq('id', a.user_id)
      .single();

    if (!profile?.email) {
      console.warn('[analyser-run] Email manquant — pas d\'envoi mail failure');
      return;
    }

    const isPro = profile.role === 'pro';
    if (isPro) {
      console.log(`[analyser-run] ⚠️ Notif cloche d'échec envoyée (pro, pas de mail) pour ${analyseId}`);
      return;
    }

    const prenom = profile.full_name?.split(' ')[0] || 'Bonjour';
    const dashboardUrl = 'https://verimo.fr/dashboard/nouvelle-analyse';

    const html = buildFailureEmail({
      prenom,
      subject,
      dashboardUrl,
    });

    await sendMailjet(
      profile.email,
      profile.full_name || '',
      '⚠️ Votre analyse Verimo n\'a pas pu être finalisée',
      html,
      isPro,
    );
    console.log(`[analyser-run] ⚠️ Email + notif d'échec envoyés pour ${analyseId}`);
  } catch (err) {
    console.error('[analyser-run] notifyAnalysisFailure error:', err);
  }
}

async function notifyAnalysisReady(
  supabaseAdmin: SupabaseClient,
  analyseId: string,
): Promise<void> {
  try {
    const { data: a } = await supabaseAdmin
      .from('analyses')
      .select('user_id, type, title, address')
      .eq('id', analyseId)
      .single();

    if (!a?.user_id) return;

    const subject = a.address || a.title || 'votre analyse';
    const isComplete = a.type !== 'document';

    // 1. Notification cloche
    await insertNotification(
      supabaseAdmin,
      a.user_id,
      'Votre analyse est prête',
      `${subject} — consulter le rapport`,
      analyseId, // 🆕 Livraison 1 : rend la notif cliquable vers /rapport?id=...
    );

    // 2. Email Mailjet
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, role')
      .eq('id', a.user_id)
      .single();

    if (!profile?.email) {
      console.warn('[analyser-run] Email manquant — pas d\'envoi mail');
      return;
    }

    const isPro = profile.role === 'pro';

    // 🆕 Livraison 2 : Pas de mail pour les pros (volume potentiellement élevé, cloche suffit).
    // Les pros sont notifiés uniquement via la cloche du dashboard.
    if (isPro) {
      console.log(`[analyser-run] ✅ Notif cloche envoyée (pro, pas de mail) pour ${analyseId}`);
      return;
    }

    const prenom = profile.full_name?.split(' ')[0] || 'Bonjour';
    const reportUrl = `https://verimo.fr/rapport?id=${analyseId}`;

    const html = buildSuccessEmail({
      prenom,
      isComplete,
      subject,
      reportUrl,
      isPro,
    });

    await sendMailjet(
      profile.email,
      profile.full_name || '',
      '✅ Votre analyse Verimo est prête',
      html,
      isPro,
    );
    console.log(`[analyser-run] ✅ Email + notif envoyés pour ${analyseId}`);
  } catch (err) {
    console.error('[analyser-run] notifyAnalysisReady error:', err);
  }
}


async function callAI(params: {
  system: string; userContent: unknown[]; maxTokens: number; apiKey: string; timeoutMs?: number;
}): Promise<{ text: string; error?: string }> {
  const { system, userContent, maxTokens, apiKey, timeoutMs = 385000 } = params;
  for (let attempt = 1; attempt <= 3; attempt++) {
    // Timeout dur sur l'appel : sans ça, un appel lent attend jusqu'à la limite wall-clock (~400s)
    // de l'edge function → le worker est tué EN PLEIN APPEL et l'analyse reste bloquée en "processing".
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': AI_VERSION,
          'anthropic-beta': FILES_BETA,
        },
        body: JSON.stringify({ model: AI_MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: userContent }] }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status === 429) { if (attempt < 3) { await sleep(Math.pow(2, attempt) * 5000); continue; } return { text: '', error: 'rate_limit' }; }
      if (res.status === 529 || res.status === 503) { if (attempt < 3) { await sleep(15000); continue; } return { text: '', error: 'overload' }; }
      if (res.status === 401 || res.status === 403) { const e = await res.text(); console.error(`[analyser-run] ⚠️ CRITIQUE — Anthropic ${res.status} (billing/auth):`, e); return { text: '', error: 'api_billing' }; }
      if (!res.ok) { const e = await res.text(); console.error(`[analyser-run] Anthropic ${res.status}:`, e); return { text: '', error: `api_error_${res.status}` }; }
      const d = await res.json();
      const text = d.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
      if (!text) return { text: '', error: 'empty_response' };
      return { text };
    } catch (err) {
      clearTimeout(timer);
      // Appel avorté car trop long : on échoue PROPREMENT et SANS réessayer (un retry referait
      // un appel tout aussi long et dépasserait le budget de durée). L'appelant rembourse + invite à réessayer.
      if (err instanceof Error && err.name === 'AbortError') return { text: '', error: 'timeout' };
      if (attempt < 3) { await sleep(3000); continue; }
      return { text: '', error: 'network_error' };
    }
  }
  return { text: '', error: 'max_retries' };
}

function buildDocumentPrompt(p: string): string {
  const parts: string[] = [];
  parts.push('Tu es le moteur d analyse de documents immobiliers de Verimo. Profil : ' + p + '. Tu n utilises jamais les mots Claude, Anthropic ou IA.');
  parts.push('');
  parts.push('Detecte le type de document parmi : DDT, PV_AG, APPEL_CHARGES, RCP, DTG_PPT, CARNET_ENTRETIEN, PRE_ETAT_DATE, ETAT_DATE, TAXE_FONCIERE, COMPROMIS, DIAGNOSTIC_PARTIES_COMMUNES, MODIFICATIF_RCP, FICHE_SYNTHETIQUE, ASL_CHIFFRES, ASL_REGLES, HISTORIQUE_TRAVAUX, AUTRE.');
  parts.push('ASL_CHIFFRES : document FINANCIER d une structure de gestion d ensemble HORS copropriete — ASL (Association Syndicale Libre), AFUL ou Union. Indices : "association syndicale libre", "ASL", "AFUL", lotissement, ensemble immobilier, avec contenu financier (PV d assemblee, appel de cotisations, budget, etat des cotisations). NE PAS confondre avec une copropriete (loi 1965, syndic, tantiemes) : l ASL/AFUL releve de l ordonnance de 2004, a un president et un syndicat, repartit en quotes-parts.');
  parts.push('ASL_REGLES : document de REGLES d une ASL/AFUL/Union — statuts, cahier des charges du lotissement, ou reglement de lotissement. Indices : regles d urbanisme privees (hauteurs, clotures, extensions), servitudes, voirie, retrocession. Ce sont des REGLES, pas des chiffres.');
  parts.push('HISTORIQUE_TRAVAUX : devis, facture, ou attestation de travaux emis par une entreprise/un artisan pour le bien (souvent une MAISON). Indices : en-tete d une entreprise (nom, SIRET, assurance decennale), libelles de travaux (toiture, chauffage, isolation, electricite, fenetres, ravalement...), montants HT/TTC, date d intervention. Sert a documenter l entretien et la renovation deja realises sur le bien.');
  parts.push('FICHE_SYNTHETIQUE : fiche synthetique de copropriete (document standardise loi ALUR). Indices : titre contient "fiche synthetique" ou "synthese copropriete" ; sections standardisees "Identification", "Caracteristiques techniques", "Donnees financieres" ; tenue obligatoire par le syndic et remise a jour annuellement.');
  parts.push('MODIFICATIF_RCP : document notarié portant modification de l etat descriptif de division et/ou du règlement de copropriété. Indices : mots-clés "modificatif", "état descriptif de division", "règlement de copropriété" + notaire + création/suppression/modification de lot ou de tantièmes.');
  parts.push('');
  parts.push('Reponds UNIQUEMENT en JSON strict selon le type detecte.');
  parts.push('');
  parts.push('DDT : {"document_type":"DDT","titre":"...","resume":"3-4 phrases","diagnostiqueur":{"nom":null,"certification":null,"date":null},"lots_identifies":[{"type":"principal|cave|parking|garage|grenier|autre","numero":null,"etage":null,"description":null}],"dpe":{"classe":null,"kwh_m2":null,"ges_classe":null,"ges_kg_m2":null,"cout_annuel_min":null,"cout_annuel_max":null,"points_forts_isolation":[],"points_faibles_isolation":[],"validite":null,"version_methode":"3CL_2021|3CL_2012|factures|inconnue","recommandations":{"format":"standard|ancien|aucune","evolution_etiquette":{"actuelle":{"classe":null,"kwh_m2":null,"ges_kg_m2":null},"apres_pack_1":{"classe":null,"kwh_m2":null,"ges_kg_m2":null},"apres_pack_1_et_2":{"classe":null,"kwh_m2":null,"ges_kg_m2":null}},"pack_1":{"label":"essentiels","cout_min":null,"cout_max":null,"travaux":[{"poste":"mur|toiture|plancher_bas|fenetres|porte|chauffage|eau_chaude|ventilation|autre","description":"...","performance_cible":null,"decision_copropriete":false,"autorisation_urbanisme":false}]},"pack_2":{"label":"a_envisager","cout_min":null,"cout_max":null,"travaux":[{"poste":"mur|toiture|plancher_bas|fenetres|porte|chauffage|eau_chaude|ventilation|autre","description":"...","performance_cible":null,"decision_copropriete":false,"autorisation_urbanisme":false}]}}},"carrez":{"surface_totale":null,"surface_type":"carrez|boutin|autre","pieces":[{"piece":"...","surface":0,"hors_carrez":false}],"annexes":[{"type":"balcon|terrasse|jardin|cave|parking|autre","surface":null}]},"diagnostics":[{"type":"AMIANTE|ELECTRICITE|GAZ|PLOMB|TERMITES|ERP|CARREZ|DPE|AUTRE","label":"...","presence":"conforme|anomalie|non_detecte|non_applicable|informatif","detail":"texte complet du diagnostic pour accordeon","alerte":"1 phrase courte si point critique sinon null"}],"travaux_preconises":[{"label":"...","priorite":"prioritaire|recommande","cout_min":null,"cout_max":null}],"gain_energetique":null,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES DDT :');
  parts.push('- lots_identifies : extraire TOUS les lots mentionnés dans le DDT (principal, cave, parking, grenier...) avec leur numéro de lot si disponible. Pour le champ etage, toujours écrire en texte lisible : "Rez-de-chaussée", "1er étage", "2ème étage", "1er sous-sol", "2ème sous-sol" etc. Ne jamais mettre juste un chiffre.');
  parts.push('- lots_vente (PRE_ETAT_DATE/ETAT_DATE) : même règle pour etage — toujours en texte lisible complet.');
  parts.push('- carrez.pieces : hors_carrez=true pour les pièces non comptabilisées dans la surface Carrez (balcon, terrasse, loggia, sous 1m80). Ces surfaces ne s ajoutent pas à la surface totale.');
  parts.push('- carrez.annexes : lister séparément les surfaces annexes (balcon, terrasse, jardin, cave, parking) avec leur surface si mentionnée.');
  parts.push('- dpe.points_forts_isolation et points_faibles_isolation : extraire depuis le DDT les éléments d isolation évalués (ex: "Fenêtres double vitrage" en fort, "Murs non isolés" en faible). Maximum 4 par liste.');
  parts.push('- dpe.cout_annuel_min et cout_annuel_max : extraire la fourchette de coût annuel estimé si mentionnée dans le DPE.');
  parts.push('- dpe.validite : date limite de validité du DPE si mentionnée.');
  parts.push('');
  parts.push('REGLES DPE RECOMMANDATIONS DE TRAVAUX (section "Recommandations d amelioration de la performance") :');
  parts.push('- Cas DPE SEUL (un seul fichier upload, qui est un DPE) : le classer comme DDT (document_type="DDT"). Remplir uniquement la section dpe + recommandations. Laisser carrez, diagnostics et autres sections vides. Cela permet de toujours extraire les recommandations meme si le document n est pas un DDT complet.');
  parts.push('- Cas DDT COMPLET contenant un DPE : extraire normalement, dpe.recommandations est rempli depuis la section "Recommandations" du DPE inclus.');
  parts.push('- dpe.version_methode : detecter la methode utilisee. Si mention "3CL-DPE 2021" ou "arrete du 31 mars 2021" => "3CL_2021" (DPE recent, structure standard pack 1 + pack 2). Si mention "3CL 2012" ou date du DPE entre 2013 et juin 2021 => "3CL_2012" (DPE ancien format, recommandations en texte libre). Si DPE base sur consommation reelle/factures (avant 2013) => "factures". Sinon "inconnue".');
  parts.push('- dpe.recommandations.format : "standard" si DPE 3CL_2021 avec deux packs identifiables (Pack 1 essentiels + Pack 2 a envisager). "ancien" si DPE 3CL_2012 avec recommandations non structurees. "aucune" si aucune recommandation de travaux n est presente dans le DPE OU si le logement est deja en classe A ou B sans recommandations chiffrees.');
  parts.push('- dpe.recommandations.pack_1 : remplir UNIQUEMENT si format="standard". Extraire le bloc "Pack 1 — Les travaux essentiels" avec son montant estime (cout_min, cout_max en euros) et la liste des travaux. Pour chaque travail : poste = lot concerne, description = texte exact de la recommandation, performance_cible = la valeur de "Performance recommandee" (ex: "R > 4,5 m².K/W", "SCOP = 4", "Uw = 1,3 W/m².K"). decision_copropriete=true si mention "Travaux a realiser par la copropriete" ou "Travaux a realiser en lien avec la copropriete". autorisation_urbanisme=true si mention "Travaux pouvant necessiter une autorisation d urbanisme".');
  parts.push('- dpe.recommandations.pack_2 : meme structure, pour "Pack 2 — Les travaux a envisager".');
  parts.push('- dpe.recommandations.evolution_etiquette : extraire les 3 etiquettes projetees depuis la section "Evolution de la performance apres travaux" (souvent en page 6 du DPE). actuelle = etat actuel du logement, apres_pack_1 = projection apres pack 1 uniquement, apres_pack_1_et_2 = projection apres pack 1 + pack 2. Pour chaque : extraire la classe (A-G), kwh_m2 et ges_kg_m2 si lisibles. Si une seule projection est presente, remplir uniquement apres_pack_1_et_2.');
  parts.push('- Si format="ancien" : ne pas remplir pack_1/pack_2/evolution_etiquette. Les recommandations en texte libre vont dans travaux_preconises (champ existant).');
  parts.push('- Si format="aucune" (logement deja performant en A ou B sans recommandations) : pack_1, pack_2 et evolution_etiquette restent vides/null.');
  parts.push('- IMPORTANT : ne JAMAIS inventer un montant ou une etiquette projetee. Si non extractible avec certitude, laisser null.');
  parts.push('');
  parts.push('REGLE DPE vigilances DDT : NE JAMAIS inclure DPE classe A B C D E dans points_vigilance. Seuls F et G sont des points de vigilance. DPE D = bonne performance energetique, ne pas le signaler negativement.');
  parts.push('REGLE travaux_preconises DDT : Ne remplir travaux_preconises QUE si un DPE est présent dans le document et que dpe.classe est non null. Si le document est uniquement un CREP plomb, amiante, termites, carrez, ERP ou tout autre diagnostic sans DPE, laisser travaux_preconises = [] vide. Les recommandations spécifiques à ces diagnostics vont dans le champ alerte du diagnostic concerné, pas dans travaux_preconises.');
  parts.push('');
  parts.push('REGLES LOI CLIMAT ET RESILIENCE — DDT (profil ' + p + ') :');
  parts.push('- DPE G : logement INTERDIT A LA LOCATION depuis le 1er janvier 2025 (loi Climat et Resilience du 22 aout 2021).');
  parts.push('- DPE F : logement INTERDIT A LA LOCATION a compter du 1er janvier 2028.');
  parts.push('- DPE E : logement INTERDIT A LA LOCATION a compter du 1er janvier 2034.');
  parts.push('- DPE F et G : GEL DES LOYERS depuis le 24 aout 2022 — il est interdit d augmenter le loyer lors du renouvellement du bail ou de la remise en location.');
  if (p === 'investissement locatif') {
    parts.push('- PROFIL INVESTISSEUR : si DPE E, F ou G, TOUJOURS mentionner dans points_vigilance l interdiction de location applicable (actuelle ou a venir) avec la date precise et l impact sur la rentabilite locative. Mentionner aussi le gel des loyers pour F et G dans avis_verimo.');
  } else {
    parts.push('- PROFIL RESIDENCE PRINCIPALE : les interdictions de location ne concernent pas directement l acheteur. Ne PAS les mentionner dans points_vigilance. Mentionner uniquement dans avis_verimo si DPE F ou G : "En cas de revente ou de mise en location future, des travaux de renovation energetique seraient necessaires."');
  }
  parts.push('');
  parts.push('REGLE DPE PETITES SURFACES (arrete du 25 mars 2024) :');
  parts.push('- Depuis le 1er juillet 2024, les seuils DPE sont ajustes pour les logements de moins de 40 m2.');
  parts.push('- Si surface Carrez < 40 m2 ET DPE classe F ou G ET date du DPE anterieure au 1er juillet 2024 : ajouter dans points_forts "Le DPE de ce logement a ete realise avant la reforme des petites surfaces (juillet 2024). Les nouveaux seuils pourraient ameliorer la classe energetique — un nouveau DPE est recommande."');
  parts.push('- Ne PAS modifier le diagnostic pour autant — analyser sur la base du DPE tel que fourni.');
  parts.push('');
  parts.push('REGLE SURFACE BOUTIN vs CARREZ :');
  parts.push('- Si carrez.surface_type = "boutin", cela signifie que le document contient une surface habitable (loi Boutin, utilisee pour la location) et NON une surface Carrez (utilisee pour la vente). C est une distinction CRITIQUE pour un acheteur.');
  parts.push('- Si surface_type = "boutin" : TOUJOURS ajouter dans points_vigilance du DDT ET dans rapport.points_vigilance de la synthese finale : "Le diagnostic mentionne une surface loi Boutin (surface habitable pour la location) et non une surface Carrez. En tant qu acheteur, exigez un mesurage Carrez aupres du vendeur — la surface Carrez est obligatoire pour toute vente en copropriete et peut differer de la surface Boutin."');
  parts.push('- La surface Boutin exclut les murs, cloisons, marches, cages d escalier, gaines — elle est souvent inferieure a la surface Carrez. Sans mesurage Carrez, l acheteur ne peut pas verifier le prix au m2 reel.');
  parts.push('');
  parts.push('PV_AG : {"document_type":"PV_AG","titre":"...","resume":"...","date_ag":null,"lieu_ag":null,"type_ag":"ordinaire|extraordinaire|mixte","syndic":null,"president_seance":null,"nb_resolutions":null,"syndic_reconduit":null,"syndic_statut":null,"syndic_sortant":null,"syndic_entrant":null,"syndic_fin_mandat":null,"quorum":{"presents":null,"total":null,"tantiemes_pct":null},"budget_vote":{"annee":null,"montant":null,"fonds_travaux":null},"budget_precedent":{"annee":null,"montant":null},"travaux_votes":[{"label":"...","montant":null,"echeance":null}],"travaux_evoques":[{"label":"...","precision":null,"concerne_lot_prive":false}],"questions_diverses":[],"procedures":[],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('REGLES PV_AG nouveaux champs :');
  parts.push('- lieu_ag : ville ou adresse où se tient l\'AG si mentionnée.');
  parts.push('- type_ag : ordinaire si AGO, extraordinaire si AGE, mixte si les deux.');
  parts.push('- president_seance : nom du copropriétaire élu pour présider la séance (résolution 1 en général). Différent du président du conseil syndical.');
  parts.push('- nb_resolutions : nombre total de résolutions à l\'ordre du jour (compter les points numérotés).');
  parts.push('- syndic_reconduit : true si le syndic existant est renouvelé lors de cette AG, false si un autre cabinet est élu OU si le syndic en place n est pas reconduit, null si non abordé. CONSERVER ce champ pour rétrocompatibilité.');
  parts.push('');
  parts.push('REGLES DETECTION STATUT SYNDIC (nouveaux champs syndic_statut/sortant/entrant) :');
  parts.push('- syndic_statut : "reconduit" si le syndic en place est renouvelé à cette AG ; "nouveau_elu" si un NOUVEAU cabinet est élu pour remplacer le précédent (cas : résolution DESIGNATION DU SYNDIC avec un cabinet différent adoptée à la majorité) ; "recherche" si le mandat actuel touche à sa fin ET aucune désignation n a été adoptée à cette AG (carence future à anticiper) ; "carence" UNIQUEMENT si le PV mentionne explicitement une absence de syndic, une carence, ou une administration provisoire ; null si le sujet n est pas abordé.');
  parts.push('- syndic_sortant : nom du syndic qui quitte ses fonctions si un changement est voté. Ex: "LACOUR IMMOBILIER".');
  parts.push('- syndic_entrant : nom du nouveau syndic élu si désignation adoptée. Ex: "Cabinet A2BCD".');
  parts.push('- syndic_fin_mandat : date de fin de mandat du nouveau syndic si mentionnée (format "JJ/MM/AAAA" ou "AAAA").');
  parts.push('- IMPORTANT — Interprétation factuelle non alarmiste : un changement de syndic (nouveau_elu) est une situation NORMALE et COURANTE, pas un signal négatif. Ne JAMAIS mentionner ce changement dans points_vigilance sauf si : quitus refusé ET changement de syndic dans la même AG (tension avérée), OU procédure en cours entre la copropriété et le syndic sortant. Un simple changement de cabinet sans conflit documenté va dans points_forts ou reste neutre.');
  parts.push('- Si syndic_statut = "nouveau_elu" sans conflit documenté, mentionner dans points_forts (ou à défaut dans resume) : "Nouvelle gouvernance : le Cabinet [entrant] a été désigné comme syndic à cette AG" — ton factuel.');
  parts.push('');
  parts.push('REGLES PV_AG :');
  parts.push('- travaux_evoques : N y mettre QUE des travaux collectifs non encore votés dont le coût potentiel serait significatif pour l acheteur (plusieurs centaines d euros minimum par lot si voté). Exemples valides : toiture, ravalement, ascenseur, canalisations communes, chauffage collectif, DTG, mise aux normes électriques parties communes. EXCLURE ABSOLUMENT : affaires courantes (ménage, contrats prestataires, entretien récurrent), points de suivi administratifs (compteurs, câbles internet, nuisibles), travaux déjà réalisés, et tout ce qui concerne exclusivement le logement privatif d un seul copropriétaire (VMC personnelle, travaux dans son appartement). Ces éléments vont dans questions_diverses ou sont ignorés.');
  parts.push('- La question clé pour décider : si ce point est voté en AG future, l acheteur recevra-t-il un appel de fonds significatif ? Si non -> ne pas mettre dans travaux_evoques.');
  parts.push('- Dans points_vigilance, si tu mentionnes quitus refuse, TOUJOURS expliquer en langage clair : Quitus refuse au syndic - les copropriétaires ont vote contre la validation de la gestion financière du syndic - pour l exercice XXXX. Cela traduit un desaccord ou une mefiance vis-a-vis de la gestion.');
  parts.push('- REGLE VOTES EN DEUX TOURS : En copropriete francaise, si une resolution ne recueille pas la majorite art. 25 au 1er tour mais obtient au moins 1/3 des voix, un 2eme tour a la majorite art. 24 est organise immediatement. Si adopte au 2eme tour, la resolution EST ADOPTEE a part entiere - ne jamais la marquer comme refusee ou rejetee. Vrai refus = resolution rejetee sans 2eme tour ou 2eme tour egalement rejete. Indices dans le PV : second tour, art. 24, adoptee a la majorite art. 24. Appliquer a toutes resolutions : fonds travaux, travaux, contrat syndic, etc.');
  parts.push('- budget_precedent : si le PV mentionne le budget de l année en cours (celle où se tient l AG), extraire annee et montant pour permettre une comparaison avec le budget voté.');
  parts.push('- budget_vote.annee = l année POUR LAQUELLE le budget est voté (en général N+1 par rapport à l année de l AG).');
  parts.push('- travaux_votes : N y mettre QUE des travaux physiques réels votés en AG (ravalement, toiture, ascenseur, plomberie, électricité parties communes, etc.). EXCLURE ABSOLUMENT : cotisation annuelle fonds de travaux ALUR (obligation légale, pas un travail), modifications de règlement de copropriété, créations ou divisions de lots (administratif), votes de budget prévisionnel, honoraires syndic, contrats assurance. Ces éléments sont des décisions administratives ou financières, pas des travaux physiques à réaliser.');
  parts.push('');
  parts.push('APPEL_CHARGES : {"document_type":"APPEL_CHARGES","titre":"...","resume":"...","periode":null,"syndic":null,"syndic_adresse":null,"syndic_gestionnaire":null,"reference_dossier":null,"montant_trimestre":null,"montant_annuel":null,"montant_mensuel":null,"cotisation_fonds_travaux_annuelle":null,"avance_tresorerie":null,"fonds_travaux_alur":null,"solde_debiteur":null,"echeance":null,"impayes":false,"alerte_impaye":null,"lots":[{"type":"appartement|cave|parking|garage|grenier|combles|autre","numero":null,"etage":null,"escalier":null,"total_trimestre":null,"postes":[{"label":"...","tantiemes":null,"base_tantiemes":null,"trimestre":null,"annuel":null}]}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES APPEL_CHARGES :');
  parts.push('- lots : regrouper les postes par lot. Chaque lot a son type (appartement/cave/parking/garage), son numéro, son étage, son escalier si mentionné, et son total trimestriel. Les postes de chaque lot contiennent le label, les tantièmes, la base de tantièmes, le montant trimestriel et annuel estimé (× 4).');
  parts.push('- solde_debiteur : extraire le solde débiteur si présent (montant positif = dette du copropriétaire). Différent du montant de l appel.');
  parts.push('- alerte_impaye : si solde_debiteur > 0, rédiger 1 phrase courte d alerte : "Solde débiteur de X € — ce montant doit être apuré par le vendeur avant la signature de l acte authentique."');
  parts.push('- montant_annuel : si non indiqué dans le document, calculer montant_trimestre × 4. montant_mensuel = montant_annuel / 12.');
  parts.push('- cotisation_fonds_travaux_annuelle : si l appel distingue une ligne "Fonds de travaux loi ALUR" / "cotisation fonds travaux" propre au lot, remplir = montant trimestriel de cette ligne × 4 (ex 26,27/trim => 105). Cette part est deja INCLUSE dans montant_annuel. Laisser null si non distinguable.');
  parts.push('- avance_tresorerie et fonds_travaux_alur : si l appel contient un cadre "Rappel pour memoire de votre participation aux fonds" (colonnes Avances / Fonds ALUR / Prov. travaux / Provisions), remplir avance_tresorerie = colonne Avances et fonds_travaux_alur = colonne Fonds ALUR. Ce sont des montants de CAPITAL deja verses, rattaches au lot, a REMBOURSER AU VENDEUR a la signature (en sus du prix) — PAS des charges recurrentes, ne PAS les ajouter aux totaux. Laisser null si le cadre est absent.');
  parts.push('- points_vigilance : mentionner le solde débiteur si présent. Si un poste représente plus de 40% du total de l appel, le signaler comme poste à surveiller.');
  parts.push('');
  parts.push('RCP : {"document_type":"RCP","titre":"...","resume":"2-3 phrases synthétiques utiles pour un acheteur","date_reglement":null,"modificatifs":[],"usage":"habitation|mixte|commercial","total_lots":null,"lots_caves":null,"lots_parkings":null,"lots_commerces":null,"parties_communes_categories":[{"categorie":"Structure","icone":"🏗","elements":["..."]},{"categorie":"Accès et circulations","icone":"🚪","elements":["..."]},{"categorie":"Équipements","icone":"⚙️","elements":["..."]},{"categorie":"Espaces extérieurs","icone":"🌿","elements":["..."]}],"regles_usage":[{"label":"...","statut":"autorise|interdit|sous_conditions","impact_rp":false,"impact_invest":false}],"restrictions_importantes":[{"label":"...","detail":"1 phrase claire en langage simple","bloquant":false}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES RCP :');
  parts.push('- resume : 2-3 phrases max, ce qui est utile pour prendre une décision d achat. Pas de copie du contenu juridique.');
  parts.push('- parties_communes_categories : regrouper par catégorie logique. Ne lister que les éléments significatifs (pas les détails ultra-précis comme les paillassons). Maximum 6 éléments par catégorie. Omettre les catégories vides.');
  parts.push('- regles_usage : NE garder QUE les règles encore pertinentes en 2024 et utiles pour un acheteur. Reformuler en langage simple et direct. impact_rp=true si ça concerne la vie quotidienne (animaux, bruit, travaux). impact_invest=true si ça concerne la location (meublé, Airbnb, chambres séparées, commerce). Profil actuel : ' + p + '. Maximum 8 règles.');
  parts.push('- restrictions_importantes : uniquement les restrictions qui impactent vraiment l acheteur (pas les clauses administratives génériques). Maximum 4. bloquant=true si la restriction peut empêcher un projet (ex: interdiction location meublée pour un investisseur).');
  parts.push('- lots_caves, lots_parkings, lots_commerces : extraire si mentionnés dans le règlement, sinon null.');
  parts.push('');
  parts.push('DTG_PPT : {"document_type":"DTG_PPT","titre":"...","resume":"...","date":null,"cabinet":null,"etat_general":"bon|moyen|degrade","budget_total_10ans":null,"budget_urgent_3ans":null,"planning":[{"label":"...","horizon":"...","montant":null,"priorite":"urgent|prioritaire|planifie"}],"etat_elements":[{"element":"...","etat":"bon|a_surveiller|vieillissant|degrade"}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('CARNET_ENTRETIEN : {"document_type":"CARNET_ENTRETIEN","titre":"...","resume":"...","date_maj":null,"annee_construction":null,"syndic":null,"syndic_adresse":null,"syndic_responsable":null,"syndic_gestionnaire":null,"syndic_comptable":null,"syndic_email":null,"syndic_date_designation":null,"syndic_garantie":null,"syndic_carte_pro":null,"nb_lots_principaux":null,"nb_lots_secondaires":null,"nb_lots_total":null,"nb_lots_detail":{"logements":null,"caves":null,"parkings":null,"commerces":null,"autres":null},"immatriculation_registre":null,"fonds_travaux_alur_global":null,"avance_tresorerie":null,"avance_travaux":null,"nb_batiments":null,"fibre_optique":null,"chauffage_collectif":null,"type_chauffage":null,"eau_chaude_collective":null,"eau_froide_collective":null,"assurance":{"compagnie":null,"police":null,"courtier":null,"echeance":null},"gardien":{"nom":null,"horaires":null,"telephone":null},"conseil_syndical":{"date_nomination":null,"echeance_mandat":null,"membres":[]},"rcp_info":{"date_origine":null,"modificatifs":[{"date":null,"objet":null,"notaire":null}]},"procedures":[{"label":"...","date_debut":null,"date_fin":null,"commentaire":null}],"diagnostics_parties_communes":[{"type":"amiante|plomb|termites|ascenseur|autre","label":"...","date":null,"entreprise":null,"resultat":"negatif|positif|non_effectue","commentaire":null}],"mesures_administratives":{"arrete_peril":false,"insalubrite":false,"injonction_travaux":false,"monument_historique":false,"administration_provisoire":false},"risques_sanitaires":{"legionella":false,"radon":false,"merule":false},"contrats":[{"equipement":"...","prestataire":null,"reference":null,"date_effet":null,"periodicite":null,"preavis":null}],"travaux_en_cours":[{"label":"...","date_ag":null,"montant":null,"entreprise":null}],"travaux_realises":[{"annee":null,"label":"...","entreprise":null,"montant":null,"assurance_do":null,"financement":null}],"infos_complementaires":[{"label":"...","valeur":"..."}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES CARNET_ENTRETIEN :');
  parts.push('- procedures : extraire TOUTES les procédures judiciaires mentionnées — c est critique pour l acheteur. Mettre dans points_vigilance si présentes.');
  parts.push('- diagnostics_parties_communes : extraire chaque diagnostic avec son entreprise, sa date et son résultat (negatif = aucune présence, positif = présence détectée, non_effectue = immeuble soumis mais pas de recherche). Ne pas confondre avec les diagnostics privatifs du lot.');
  parts.push('- mesures_administratives : toutes les réponses OUI/NON sur arrêté de péril, insalubrité, injonction de travaux, monument historique, administration provisoire.');
  parts.push('- contrats : ne pas mettre de date_effet si non mentionnée dans le document. Ne pas inventer de dates.');
  parts.push('- chauffage_collectif : true si "Collectif" mentionné ou coché, false si "Individuel" mentionné ou coché, null si absent. Même logique pour eau_chaude_collective.');
  parts.push('- eau_froide_collective : false si tu vois "Compteurs eau froide", "Eau froide individuelle" ou "Individuel" coché pour l eau froide — même si "Eau froide collective" est aussi mentionné ailleurs dans le document. true uniquement si "Eau froide collective" est mentionné SANS aucune mention de compteurs individuels ni d individuel.');
  parts.push('- type_chauffage : mettre UNIQUEMENT l energie utilisee : "gaz", "fioul", "electricite", "bois". Ne JAMAIS mettre "collectif" ou "individuel" dans ce champ — c est le role du booleen chauffage_collectif.');
  parts.push('- nb_batiments : extraire le nombre de bâtiments de la copropriété si mentionné.');
  parts.push('- assurance : extraire compagnie, numéro de police, courtier et date d\'échéance de l\'assurance multirisques immeuble si présente.');
  parts.push('- nb_lots_principaux / nb_lots_total / nb_lots_detail : recopier EXACTEMENT les chiffres ecrits dans le document. Ne pas additionner ni deduire. Si le document indique "NB lots principaux : 26" et "NB de lots total : 88", mettre nb_lots_principaux=26 et nb_lots_total=88. nb_lots_total = le nombre total de lots tous types confondus.');
  parts.push('- travaux_en_cours : extraire uniquement les vrais travaux physiques votés en AG mais pas encore réalisés (ravalement, toiture, ascenseur, plomberie...). EXCLURE ABSOLUMENT : provisions fonds de travaux ALUR, cotisations légales, fonds de roulement, et tout ce qui n est pas un travail physique réel. Ces éléments vont dans infos_complementaires. Mettre dans points_vigilance si montant significatif (>5000€).');
  parts.push('- travaux_realises : travaux déjà réceptionnés et soldés uniquement. Ne jamais remplir le champ financement. Le laisser toujours à null.');
  parts.push('- infos_complementaires : uniquement ce qui ne rentre pas dans les champs déjà prévus. EXCLURE ABSOLUMENT : nb_batiments (champ dédié), assurance (champ dédié), nb_lots et répartition des lots (déjà dans nb_lots_detail), fibre_optique (champ dédié), fonds travaux (champ dédié), syndic (champ dédié). Y mettre uniquement : appels de provisions annuels, patrimoine syndicat, AFUL, syndicat secondaire, dommages ouvrage, contentieux en cours (nombre), ou toute info utile sans champ dédié. Labels COURTS : 3-4 mots maximum. Commencer par un émoji adapté : 📅 périodicité, 🏛 statut juridique, 📋 administratif, 💼 patrimonial.');
  parts.push('- travaux_realises.label : mettre UNIQUEMENT la description du travail, sans le montant. Le montant va dans le champ montant. Ne jamais inclure de chiffres ou de € dans le label.');
  parts.push('- points_vigilance : inclure procédures en cours, diagnostics positifs, recherches non effectuées sur immeuble soumis à réglementation.');
  parts.push('');
  parts.push('PRE_ETAT_DATE : {"document_type":"PRE_ETAT_DATE","titre":"...","resume":"...","date":null,"syndic":null,"syndic_adresse":null,"nb_lots_copro":null,"immatriculation_registre":null,"lots_vente":[{"type":"appartement|cave|parking|garage|grenier|combles|autre","numero":null,"batiment":null,"etage":null}],"impayes_vendeur":0,"fonds_travaux_alur":null,"fonds_travaux_ancien":null,"fonds_roulement_acheteur":null,"fonds_roulement_modalite":"remboursement_vendeur|reconstitution_syndicat","honoraires_syndic":null,"charges_futures":{"montant_trimestriel":null,"fonds_travaux_trimestriel":null,"montant_annuel":null},"travaux_charge_vendeur":[{"label":"...","montant":null}],"procedures_contre_vendeur":[],"procedures_copro":"neant|en_cours","impayes_copro_global":null,"dette_fournisseurs":null,"fonds_travaux_copro_global":null,"historique_charges":[{"exercice":"N-1","annee":null,"budget_appele":null,"charges_reelles":null,"provisions_hors_budget":null}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES PRE_ETAT_DATE :');
  parts.push('- lots_vente : extraire TOUS les lots concernés par la mutation (appartement, cave, parking...) avec numéro, bâtiment et étage si mentionnés.');
  parts.push('- honoraires_syndic : extraire le montant des honoraires du syndic pour l établissement du document (souvent mentionné dans les sommes dues par le vendeur). NE PAS mettre dans travaux_charge_vendeur — c est un frais administratif, pas un travail.');
  parts.push('- travaux_charge_vendeur : uniquement les vrais travaux votés en AG à la charge du vendeur. Exclure les honoraires syndic et frais administratifs.');
  parts.push('- fonds_roulement_acheteur : montant que l acheteur devra reconstituer ou rembourser au vendeur à la signature (avance constituant la réserve).');
  parts.push('- charges_futures : extraire les montants trimestriels du budget prévisionnel et du fonds de travaux. Calculer montant_annuel = (montant_trimestriel + fonds_travaux_trimestriel) * 4.');
  parts.push('- impayes_copro_global : montant total des impayés de charges dans la copropriété (section informations diverses). Différent de impayes_vendeur.');
  parts.push('- historique_charges : extraire depuis l annexe les charges appelées et réelles pour N-1 et N-2 si disponibles.');
  parts.push('- procedures_copro : "neant" si aucune procédure mentionnée dans le document, "en_cours" si des procédures sont listées.');
  parts.push('- points_vigilance : NE PAS inclure les impayés globaux de la copropriété si le vendeur lui-même est à jour (impayes_vendeur=0). Les impayés globaux copro sont normaux et sont déjà expliqués dans un bloc dédié. Mettre dans points_vigilance uniquement : travaux votés importants, fonds de travaux très insuffisant, procédures en cours, dette fournisseurs anormalement élevée, charges en forte hausse.');
  parts.push('- avis_verimo : ne pas alarmer sur les impayés globaux copro si le vendeur est à jour. Si fonds_travaux_alur ou fonds_roulement_acheteur sont présents, TOUJOURS rappeler dans l avis_verimo que ces montants sont attachés au lot et SERONT REMBOURSÉS AU VENDEUR par l acheteur à la signature de l acte authentique, en sus du prix de vente. Ne jamais dire que ce montant est "récupérable" ou "restitué à l acheteur" — c est l inverse : l acheteur le verse au vendeur.');
  parts.push('- points_vigilance fonds travaux : NE PAS mettre le fonds de travaux dans points_vigilance s il existe, même s il est faible — il est déjà affiché avec son montant. Mettre dans points_vigilance UNIQUEMENT si fonds_travaux_copro_global est null ou égal à 0 : "Aucun fonds de travaux détecté dans la copropriété — en cas de travaux importants, des appels de fonds exceptionnels seront à prévoir."');
  parts.push('');
  parts.push('ETAT_DATE : {"document_type":"ETAT_DATE","titre":"...","resume":"...","date":null,"syndic":null,"syndic_adresse":null,"nb_lots_copro":null,"immatriculation_registre":null,"lots_vente":[{"type":"appartement|cave|parking|garage|grenier|combles|autre","numero":null,"batiment":null,"etage":null}],"solde_net":null,"solde_sens":"acheteur|vendeur","fonds_travaux_alur":null,"fonds_roulement":null,"honoraires_syndic":null,"impayes_vendeur":0,"impayes_copro_global":null,"dette_fournisseurs":null,"charges_futures":{"montant_trimestriel":null,"fonds_travaux_trimestriel":null,"montant_annuel":null},"decomposition":[{"poste":"...","montant":null,"sens":"acheteur_recoit|vendeur_doit"}],"travaux_consignes":[{"label":"...","montant":null}],"procedures_copro":"neant|en_cours","historique_charges":[{"exercice":"N-1","annee":null,"budget_appele":null,"charges_reelles":null}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES ETAT_DATE : mêmes règles que PRE_ETAT_DATE pour lots_vente, honoraires_syndic, impayes_copro_global, historique_charges. L état daté est établi après compromis avec des chiffres définitifs — le décompte est exact et opposable.');
  parts.push('');
  parts.push('TAXE_FONCIERE : {"document_type":"TAXE_FONCIERE","titre":"...","resume":"...","annee":null,"montant_total":null,"montant_mensuel":null,"evolution_pct":null,"montant_precedent":null,"valeur_locative":null,"decomposition":[{"collectivite":"...","taux":null,"montant":null}],"reference_cadastrale":null,"surface_cadastrale":null,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('COMPROMIS : {"document_type":"COMPROMIS","titre":"...","resume":"3-4 phrases factuelles sur la transaction","type_avant_contrat":"compromis|promesse_unilaterale","date_signature":null,"date_acte_prevue":null,"delai_acte_mois":null,"vendeurs":[{"nom_complet":null,"situation_matrimoniale_citation":null,"regime_matrimonial":null,"nationalite":null,"part_indivision":null,"qualite":null}],"acheteurs":[{"nom_complet":null,"situation_matrimoniale_citation":null,"mode_acquisition":null,"nationalite":null,"qualite":null}],"notaires":[{"nom":null,"etude":null,"ville":null,"role":"vendeur|acheteur|redacteur|participant|non_precise"}],"agence":null,"bien":{"adresse_complete":null,"reference_cadastrale_principale":null,"type_bien_global":null,"nb_pieces":null,"etage":null,"surface_carrez":null,"usage_declare":"residence_principale_exclusive|mixte|locatif|autre|non_precise","lots_cedes":[{"ordre":1,"type":"principal|cave|parking|garage|grenier|cellier|combles|loge|autre","numero":null,"etage":null,"tantiemes":null,"surface":null,"reference_cadastrale":null,"description":null}],"rcp_date_acte":null,"rcp_notaire":null,"rcp_nb_modificatifs":null,"rcp_dernier_modificatif_date":null,"origine_propriete":{"date_acquisition_vendeur":null,"mode_acquisition":"achat|donation|succession|partage|autre|non_precise","acte_precedent_notaire":null},"etat_general_declare":null,"equipements_inclus":[]},"finances":{"prix_net_vendeur":null,"prix_mobilier":null,"mobilier_detail":[],"honoraires_agence":null,"honoraires_charge":"acheteur|vendeur|non_precise","honoraires_pct":null,"prix_total_acte":null,"depot_garantie_montant":null,"depot_garantie_pct":null,"depot_garantie_detenteur":"notaire_acheteur|notaire_vendeur|notaire_redacteur|agence|sequestre|non_precise","prorata_taxe_fonciere":{"mode":"prorata_temporis|montant_fixe|non_precise","montant":null},"clause_penale_pct":null,"frais_notaire_estimes_verimo":null,"frais_notaire_pct_verimo":null,"cout_total_estime_acheteur_verimo":null},"financement":{"modalite":"comptant|pret|mixte|non_precise","apport":null,"montant_pret_max":null,"duree_pret_max_mois":null,"taux_pret_max_pct":null,"etablissement_pressenti":null,"delai_obtention_offre":null},"conditions_suspensives":[{"type":"obtention_pret|droit_preemption|urbanisme|servitude|etat_risques|vente_bien_existant|autre","label":"...","detail":null,"date_limite":null,"statut":"en_cours|levee|purge|caduque"}],"calendrier":[{"label":"...","date":null,"type":"signature|retractation|suspensive|acte|autre","critique":false}],"droits_preemption":[{"type":"dpu|safer|locataire|copropriete","statut":"purge|en_cours|non_applicable","date_purge":null}],"diagnostics_annexes":[{"type":"DPE|ERP|AMIANTE|PLOMB|TERMITES|ELECTRICITE|GAZ|CARREZ|BOUTIN|AUDIT_ENERGETIQUE|ASSAINISSEMENT|AUTRE","label":"...","resultat_synthese":null,"validite_date":null,"annexe":true}],"annexes_copropriete_l721_2":{"rcp_annexe":false,"pv_ag_3_dernieres_annees":false,"fiche_synthetique":false,"carnet_entretien":false,"notice_information":false,"dtg_conclusions":false,"ppt":false,"pre_etat_date":false},"copropriete_finances_synthese":{"budget_previsionnel_annuel":null,"annee_budget":null,"quote_part_charges_lot_annuelle":null,"fonds_travaux_alur_global":null,"fonds_travaux_alur_part_lot":null,"procedures_en_cours":false,"procedures_detail":null},"situation_locative":{"occupe":"libre|loue|occupation_titre_gratuit|non_precise","bail":{"type":null,"date_debut":null,"duree":null,"loyer_mensuel":null,"depot_garantie":null,"dpe_bail":null,"locataire_droit_preemption":null},"bien_libre_a":null},"clauses_critiques":[{"type":"substitution|vente_en_etat|dispense_etat_lieux|clause_resolutoire|autre","label":"...","detail":null,"actif_dans_compromis":true}],"servitudes":[{"type":"passage|vue|cour_commune|reseau|urbanisme|autre","beneficiaire":null,"description":null,"impact_acheteur":null}],"clauses_particulieres_autres":[],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES COMPROMIS (extraction stricte sans hallucination) :');
  parts.push('- POINT DE VUE ACHETEUR (regle generale prioritaire) : tout le rapport est redige du point de vue de l ACHETEUR. (a) NE JAMAIS mentionner la fiscalite ou la situation personnelle du VENDEUR (plus-value, moins-value, exoneration ou absence d impot sur la plus-value du vendeur, son regime fiscal) — cela ne concerne en rien l acheteur. (b) NE JAMAIS presenter comme un point d attention / une alerte ce qui est en realite FAVORABLE a l acheteur ou un droit acquis (ex : exoneration de la hausse des droits d enregistrement, statut primo-accedant) ; au mieux une mention neutre dans avis_verimo, jamais en clauses_critiques ni en points_vigilance. (c) EXCLURE les informations purement neutres, administratives ou de pure forme. Cette regle s applique a points_forts, points_vigilance ET clauses_critiques.');
  parts.push('- type_avant_contrat : "compromis" si engagement bilateral (compromis = promesse synallagmatique), "promesse_unilaterale" si seul le vendeur s engage. Lire l intitule du document.');
  parts.push('- vendeurs et acheteurs : tableaux. Chaque personne listee separement sous la section "VENDEUR/PROMETTANT" ou "ACHETEUR/BENEFICIAIRE/ACQUEREUR". Si plusieurs vendeurs (couple, indivision) ou plusieurs acheteurs, lister tous.');
  parts.push('- situation_matrimoniale_citation : CITER TEXTUELLEMENT la mention du compromis (ex: "marie sous le regime de la communaute legale a defaut de contrat de mariage prealable"). NE PAS paraphraser.');
  parts.push('- regime_matrimonial : extraire UNIQUEMENT si explicite (ex: "communaute legale", "separation de biens", "communaute universelle", "participation aux acquets"). Si absent, mettre null.');
  parts.push('- nationalite : extraire UNIQUEMENT si mentionnee explicitement. Ne JAMAIS supposer "francaise" par defaut. Si absent, mettre null.');
  parts.push('- mode_acquisition (acheteur) : "propre" si acheteur seul ou en separation de biens, "commun" si acquisition en communaute, "indivision" si plusieurs acheteurs en indivision, "sci" si achat via SCI. Extraire UNIQUEMENT si explicite, sinon null.');
  parts.push('- notaires : RÈGLE CRITIQUE — il est tres souvent ambigu de savoir quel notaire represente qui. Lister TOUS les notaires mentionnes. Pour le champ "role" : extraire UNIQUEMENT si explicite dans le compromis ("represente le vendeur", "pour le compte de l acquereur", "redacteur", "avec la participation de"). Sinon, mettre "non_precise". NE JAMAIS DEVINER qui est le notaire de qui en se basant sur l ordre d apparition ou sur des conventions regionales.');
  parts.push('- bien.lots_cedes : tableau de TOUS les lots vendus (lot principal + caves + parkings + greniers + autres). Pour chaque lot : type (principal/cave/parking/garage/grenier/cellier/combles/loge/autre), numero du lot, etage si mentionne, tantiemes propres au lot (format "171/9865"), surface si mentionnee, reference cadastrale si mentionnee. Le champ "ordre" sert a preserver l ordre des lots dans le compromis.');
  parts.push('- bien.reference_cadastrale_principale : reference cadastrale globale de la parcelle (format type "AB 142" ou "section AB n° 142").');
  parts.push('- bien.usage_declare : depuis la loi 2025-541 du 16 juin 2025, le compromis doit indiquer si le bien est a usage exclusif de residence principale. Extraire cette mention. Si "residence principale exclusive" -> "residence_principale_exclusive". Si absent (compromis anterieur a juin 2025), mettre "non_precise".');
  parts.push('- bien.origine_propriete : date d acquisition du vendeur, mode (achat/donation/succession/partage), notaire de l acte precedent. Section standard du compromis.');
  parts.push('- finances.frais_notaire_estimes_verimo : CALCUL automatique avec règle fiscale FR. DÉFAUT = 7,5% (bien ancien fiscalement). Appliquer 3% (neuf fiscalement) UNIQUEMENT si TOUTES les conditions sont réunies : (a) compromis VEFA explicite (mention "vente en l état futur d achèvement", "VEFA", "GFA", "garantie financière d achèvement", OU vendeur clairement promoteur immobilier — société commerciale type SCI/SNC/SAS de promotion, pas une personne physique), ET (b) origine_propriete.mode_acquisition est null OU "non_precise" OU absent (= première mutation), ET (c) annee_construction si présente est < 5 ans. CAS PIÈGES à 7,5% (ne PAS prendre pour du neuf) : bien construit récemment mais revendu par un particulier (origine_propriete.mode_acquisition = "achat") → ANCIEN ; bien neuf déjà habité une fois → ANCIEN ; donation/succession/partage récente → ANCIEN. Le 3% est l EXCEPTION rare, le 7,5% est la RÈGLE par défaut. Calcul : frais = prix_total_acte × ratio. Arrondir a la centaine. Mettre frais_notaire_pct_verimo = 7.5 ou 3.0. C est une ESTIMATION INDICATIVE Verimo, pas une donnee du document — les frais réels sont calculés par le notaire le jour de l acte (droits d enregistrement variables selon département 5,09%-5,80% + émoluments dégressifs + débours).');
  parts.push('- finances.cout_total_estime_acheteur_verimo : prix_total_acte + frais_notaire_estimes_verimo. Si honoraires_charge = "acheteur" et que prix_total_acte inclut deja les honoraires, ne pas re-additionner. Verifier la coherence.');
  parts.push('- finances.honoraires_pct : si honoraires_agence et prix_net_vendeur connus, calculer honoraires_pct = honoraires_agence / prix_net_vendeur × 100. Arrondir a 1 decimale.');
  parts.push('- finances.depot_garantie_pct : si depot_garantie_montant et prix_total_acte connus, calculer le %. Norme : 5-10% du prix. ALERTER en points_vigilance si > 10%.');
  parts.push('- finances.clause_penale_pct : pourcentage de la clause penale en cas de desistement injustifie. Standard : 10% du prix. Extraire UNIQUEMENT si explicite.');
  parts.push('- finances.prorata_taxe_fonciere : mode "prorata_temporis" si calcul au prorata, "montant_fixe" si montant explicite, "non_precise" sinon.');
  parts.push('- financement : si modalite = "pret", la duree_pret_max_mois et taux_pret_max_pct sont des plafonds qui figurent dans la CLAUSE SUSPENSIVE D OBTENTION DE PRET. Aller les chercher dans cette clause specifique, pas seulement dans le recap financement.');
  parts.push('- conditions_suspensives : extraire TOUTES les conditions avec leur type. Date_limite obligatoire si mentionnee. Statut : "en_cours" par defaut, "levee" si compromis indique que la condition est realisee, "purge" si delai expire favorablement (ex: droit de preemption non exerce), "caduque" si delai expire defavorablement.');
  parts.push('- droits_preemption : extraire TOUS les droits de preemption applicables (DPU commune, SAFER pour rural, locataire si bien loue, copropriete tres rare). Statut "purge" si renonciation obtenue, "en_cours" si attente reponse, "non_applicable" si pas concerne.');
  parts.push('- diagnostics_annexes : lister TOUS les diagnostics annexes au compromis (article L.271-4 CCH). Pour DPE : indiquer la classe (A a G) dans resultat_synthese. Pour Carrez : indiquer la surface mesuree. Pour ERP : indiquer si "informatif" ou "favorable/defavorable". Pour les autres (amiante/plomb/termites/electricite/gaz) : "conforme" / "anomalies detectees" / "absence" / "non_realise".');
  parts.push('- annexes_copropriete_l721_2 : checklist des 7 documents obligatoires en copropriete (article L.721-2 CCH). Marquer true UNIQUEMENT si le compromis confirme explicitement l annexion de chaque document. La fiche synthetique, le carnet d entretien, les PV des 3 dernieres AG, le RCP, la notice d information, les conclusions DTG, le PPT.');
  parts.push('- copropriete_finances_synthese : extraire le budget previsionnel annuel et la quote-part charges du lot vendu mentionnes dans le compromis (souvent repris du pre-etat date). Aussi le fonds travaux ALUR global et la part attachee au lot.');
  parts.push('- situation_locative : occupe = "libre" si le compromis indique vente libre ou "le bien sera libre a la signature". "loue" si bail en cours mentionne. Si loue, extraire le detail du bail (type bail, date debut, duree, loyer, depot garantie). bien_libre_a = date a laquelle le bien sera libere si applicable.');
  parts.push('- clauses_critiques : detecter activement les clauses suivantes UNIQUEMENT si elles sont ACTIVEES dans le compromis (pas du boilerplate type) :');
  parts.push('  * "substitution" : si le compromis prevoit explicitement que l acquereur peut etre substitue par un tiers (SCI, conjoint, parent) — c est une vraie clause active, pas une simple mention.');
  parts.push('  * "vente_en_etat" : si l acquereur renonce a tout recours pour vices apparents ou pour difference entre annonce et realite. Souvent en clause-type, ne flagger que si formulation restrictive.');
  parts.push('  * "dispense_etat_lieux" : si le vendeur est dispense de remise des cles avec etat des lieux.');
  parts.push('  * "clause_resolutoire" : si conditions automatiques de resolution de la vente (impayes acompte, etc.).');
  parts.push('  * "autre" : a n utiliser QUE pour une clause qui cree un VRAI RISQUE ou une VRAIE OBLIGATION pour l ACHETEUR (ex : l acheteur reprend a son compte des procedures judiciaires en cours, l acheteur s engage a reverser une somme au vendeur, prise en charge de travaux). NE JAMAIS y mettre : une info neutre/administrative, un element favorable a l acheteur, ou la fiscalite/situation du vendeur. En cas de doute, ne pas creer de clause.');
  parts.push('- servitudes : structurer (passage / vue / cour commune / reseau / urbanisme). Beneficiaire = qui beneficie de la servitude (n° de lot voisin, commune, etc.). Impact_acheteur = phrase courte expliquant ce que ca change pour l acheteur.');
  parts.push('- points_vigilance ALERTES SPECIFIQUES COMPROMIS :');
  parts.push('  * Si DPE F : "Logement classe F au DPE — interdiction de location prevue au 1er janvier 2028 (loi Climat). Gel des loyers depuis 2022 si projet locatif."');
  parts.push('  * Si DPE G : "Logement classe G au DPE — interdiction de location depuis le 1er janvier 2025 (loi Climat). Travaux de renovation energetique necessaires avant remise en location."');
  parts.push('  * Si DPE E ET profil locatif : "Logement classe E — interdiction de location au 1er janvier 2034. A anticiper si conservation longue."');
  parts.push('  * Si clause de substitution active : "Clause de substitution detectee — clarifier les conditions avec le notaire avant signature (qui peut etre substitue ? Sous quel delai ?)."');
  parts.push('  * Si depot de garantie > 10% : "Depot de garantie de X% — superieur a la norme (5-10%). Verifier si cohereent avec la nature de la transaction."');
  parts.push('  * Si delai_acte_mois > 4 : "Delai entre compromis et acte authentique de X mois — superieur a la norme (3 mois). Verifier les motifs."');
  parts.push('  * Si situation_locative.occupe = "loue" : "Le bien est vendu loue — conditions de reprise a verifier (preavis legal, droit de preemption locataire en zone tendue, decence du logement)."');
  parts.push('  * Si annexes_copropriete_l721_2 incomplet : "Documents copropriete manquants — le delai de retractation de 10 jours ne court qu a compter de la communication complete (article L.721-3 CCH)."');
  parts.push('- points_forts : mentionner si applicable : "Honoraires agence dans la fourchette legale", "Plusieurs notaires impliques pour securiser la transaction", "Diagnostics complets annexes", "Conditions suspensives standards et proteges".');
  parts.push('- avis_verimo : 2-4 paragraphes courts separes par double saut de ligne. Premier paragraphe = synthese factuelle (type de bien, prix, profil acquereur). Deuxieme paragraphe = points de vigilance principaux. Troisieme paragraphe optionnel = recommandations a clarifier avec le notaire. Ton neutre, factuel, sans imperatif. NE PAS terminer par une mention commerciale.');
  parts.push('REGLES DIAGNOSTIC_PARTIES_COMMUNES :');
  parts.push('- rapports : si le document contient plusieurs rapports distincts, les lister tous. Si un seul rapport, mettre un seul element dans le tableau avec date, cabinet, operateur, certification, perimetre.');
  parts.push('- zones_par_localisation : regrouper les zones par grande localisation (Toiture, Chaufferie, Parkings, Placards techniques, Exterieur/Cour...). Mettre un emoji adapte. Pour chaque groupe indiquer le cabinet et annee du rapport source. Si plus de 3 zones similaires dans un groupe, resumer les suivantes dans le champ plus ex: + 22 autres materiaux en evaluation periodique (M004 a M025).');
  parts.push('- zones_non_accessibles : lister TOUTES les zones non visitees ou inaccessibles. niveau=reglementaire si zone qui aurait du etre inspectee (obligation non remplie). niveau=informatif si zone hors perimetre ou privative.');
  parts.push('- zones_saines : zones ou materiaux confirmes sans amiante apres analyse ou par nature.');
  parts.push('- action : AC1=action corrective premier niveau, EP=evaluation periodique, surveillance=surveillance reguliere, non_detecte=absence confirmee.');
  parts.push('');
  parts.push('MODIFICATIF_RCP : {"document_type":"MODIFICATIF_RCP","titre":"...","resume":"3-4 phrases en langage simple — ce qui change et pourquoi, utile pour un acheteur","type_modification":"creation_lot|suppression_lot|changement_usage|mise_a_jour_tantiemes|servitude|fusion_lots|autre","copropriete":null,"notaire":{"nom":null,"etude":null,"ville":null},"date_acte":null,"date_acte_rectificatif":null,"publication_fonciere":{"service":null,"date":null},"sur_quoi_porte":[{"aspect":"...","detail":"explication courte en langage simple sans jargon juridique"}],"parties_impliquees":[{"role":"beneficiaire|vendeur|syndicat|autre","nom":null,"precision":null}],"impact_copropriete":{"lots_concernes":[{"numero":null,"type":null,"description":null}],"tantiemes_avant":null,"tantiemes_apres":null,"impact_acheteur":"1-2 phrases max sur ce que ça change concrètement pour un futur acheteur"},"points_attention":[{"label":"...","detail":"explication claire en 1 phrase"}],"infos_complementaires":[{"label":"...","valeur":"..."}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('REGLES MODIFICATIF_RCP :');
  parts.push('- Objectif : aider un acheteur à comprendre ce que change ce modificatif et ce que ça implique pour lui. Ignorer tout ce qui est purement procédural, fiscal ou sans impact pratique pour un acheteur.');
  parts.push('- sur_quoi_porte : décrire en 2-4 points ce que modifie concrètement cet acte. Langage simple, pas juridique. Ex: "Création d\'un nouveau lot cave n°99 au sous-sol" plutôt que "Modificatif à l\'état descriptif de division portant création du lot n°99".');
  parts.push('- parties_impliquees : uniquement les parties utiles à connaître pour l\'acheteur (bénéficiaires du lot créé, syndicat). Pas les clercs, témoins ou formalités administratives.');
  parts.push('- impact_copropriete.impact_acheteur : ce que ça change concrètement. Ex: "Le lot 99 est enclavé et accessible uniquement via le lot 74 — un acheteur qui voudrait les séparer ne pourrait pas accéder au lot 99."');
  parts.push('- points_attention : uniquement ce qui peut impacter un acheteur (lot enclavé, servitude, accès conditionné, publication à vérifier, acte rectificatif). Maximum 4.');
  parts.push('- infos_complementaires : uniquement les infos utiles non couvertes ailleurs (nombre total de lots après modificatif, référence cadastrale, droits d\'enregistrement si significatifs). Labels courts 3-4 mots. EXCLURE : détails juridiques, formalités administratives, mentions légales.');
  parts.push('- Ne jamais recopier le tableau récapitulatif des lots — juste mentionner le nombre total de lots après modificatif dans infos_complementaires si pertinent.');

  parts.push('');
  parts.push('FICHE_SYNTHETIQUE : {"document_type":"FICHE_SYNTHETIQUE","titre":"...","resume":"2-3 phrases","date":null,"immatriculation_registre":null,"identification":{"nom_copro":null,"adresse":null,"date_reglement_copropriete":null},"caracteristiques_techniques":{"annee_construction":null,"nb_batiments":null,"nb_lots_principaux":null,"nb_lots_total":null,"chauffage_collectif":null,"type_chauffage":null,"eau_chaude_collective":null,"ascenseur":null,"equipements_collectifs_detail":[]},"donnees_financieres":{"budget_previsionnel_n":null,"budget_previsionnel_n_1":null,"annee_n":null,"charges_impayees_total":null,"dettes_fournisseurs":null,"fonds_travaux_alur_global":null},"syndic":{"nom":null,"prise_mandat":null,"fin_mandat":null,"carte_pro":null},"dtg_realise":null,"dtg_date":null,"fiche_recente":null,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('REGLES FICHE_SYNTHETIQUE :');
  parts.push('- date : date de la fiche, obligatoire — c est la cle pour juger de la fiabilite.');
  parts.push('- fiche_recente : true si date < 12 mois par rapport a la date actuelle, false sinon.');
  parts.push('- Si la fiche a plus de 2 ans, AJOUTER dans points_vigilance : "Cette fiche synthetique date de X. Certaines informations peuvent etre obsoletes — privilegier les documents plus recents (PV d AG, pre-etat date) pour les donnees financieres et la gouvernance."');
  parts.push('- La fiche synthetique est utile principalement pour : immatriculation registre, equipements techniques de l immeuble, presence ou non d un DTG. Pour les donnees financieres et syndic, privilegier un document plus recent.');
  parts.push('- Ne JAMAIS mettre cette fiche en source principale si un PV d AG plus recent est disponible.');
  parts.push('');

  parts.push('ASL_CHIFFRES : {"document_type":"ASL_CHIFFRES","sous_type":"pv_ag|cotisations|budget|etat_cotisations","titre":"...","resume":"...","nature_structure":"asl|aful|union","nom_structure":null,"date_assemblee":null,"gouvernance":{"president":null,"gestion":"benevole|professionnel|null","gestionnaire":null},"cle_repartition":null,"cotisation_annuelle":null,"periodicite":"annuelle|trimestrielle|mensuelle|null","budget_global":null,"fonds_reserve":null,"travaux":[{"label":"...","montant":null,"echeance":null,"charge":"vendeur|acquereur|null"}],"solde_vendeur":null,"alerte_impaye":null,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('REGLES ASL_CHIFFRES : nature_structure = asl/aful/union (type EXACT, nom complet dans nom_structure, ne jamais appeler une AFUL une ASL). VOCABULAIRE : jamais syndic/tantiemes/fonds ALUR — utiliser president/gestionnaire, quotes-parts, cotisations. gestion = benevole (vigilance : gestion moins rigoureuse) ou professionnel (cabinet mandate). cotisation_annuelle = charge REELLE en plus des charges copro. solde_vendeur > 0 = dette a apurer avant signature (remplir alerte_impaye).');
  parts.push('ASL_REGLES : {"document_type":"ASL_REGLES","sous_type":"statuts|cahier_charges|reglement_lotissement","titre":"...","resume":"...","nature_structure":"asl|aful|union","nom_structure":null,"objet":null,"perimetre_gere":[],"cle_repartition":null,"nb_membres":null,"conformite_2004":{"date_creation":null,"statuts_publies":null,"conforme":null},"contraintes_urbanisme":[{"label":"...","detail":"..."}],"voirie_retrocession":null,"servitudes":[{"type":"...","description":"..."}],"equipements_lourds":[],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('REGLES ASL_REGLES : conformite_2004 = une ASL/AFUL d avant 2004 devait mettre ses statuts en conformite ET les publier ; si non publies/non conformes, le recouvrement des cotisations et l action en justice sont fragilises (vigilance majeure). contraintes_urbanisme = regles privees du cahier des charges qui s imposent a l acheteur MEME au-dela du PLU (hauteurs, clotures, extensions). voirie_retrocession = voirie a charge des colotis a perpetuite si non retrocedee a la commune (gros poste cache). equipements_lourds = assainissement collectif, bassin... (mises aux normes couteuses).');
  parts.push('HISTORIQUE_TRAVAUX : {"document_type":"HISTORIQUE_TRAVAUX","nature_document":"devis|facture|attestation|autre","titre":"...","resume":"...","entreprise":{"nom":null,"siret":null,"adresse":null,"contact":null,"assurance_decennale":null,"numero_police":null},"travaux":[{"poste":"...","description":"...","montant":null,"date":null}],"montant_total":null,"date_plus_recente":null,"garantie_decennale_possible":null,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('REGLES HISTORIQUE_TRAVAUX : poste = categorie courte du travail (toiture, chauffage, isolation, electricite, fenetres, ravalement, plomberie...). entreprise.assurance_decennale = nom de l assureur si une attestation decennale figure sur le document. garantie_decennale_possible = true UNIQUEMENT si la date_plus_recente des travaux est a moins de 10 ans de l annee courante ET qu il s agit de gros oeuvre ou d elements d equipement indissociables (toiture, charpente, gros oeuvre, etancheite, chauffage central) — sinon null. Ne JAMAIS affirmer que la garantie est active : c est une possibilite a confirmer aupres de l entreprise. avis_verimo : rappeler que des travaux recents documentes rassurent sur l entretien et que la garantie decennale eventuelle se transmet a l acheteur (a confirmer).');
    parts.push('AUTRE : {"document_type":"AUTRE","titre":"...","resume":"...","infos_cles":[{"label":"...","valeur":"..."}],"contenu":[{"section":"...","detail":"..."}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES GENERALES : resume = 3-4 phrases factuelles. avis_verimo = 2-4 paragraphes courts en langage naturel, séparés par double saut de ligne. NE PAS terminer par une mention promotionnelle ou commerciale. NE PAS suggérer de service ou produit. NE PAS inventer des donnees absentes - mettre null si absent.');
  return parts.join('\n');
}

function buildComplementPrompt(profil: string, typeBienDeclare?: string | null): string {
  const p = profil === 'invest' ? 'investissement locatif' : 'residence principale';
  let typeBienHint = '';
  if (typeBienDeclare && typeBienDeclare !== 'indetermine') {
    const labelBien =
      typeBienDeclare === 'appartement' ? 'un appartement en copropriété' :
      typeBienDeclare === 'maison' ? 'une maison individuelle' :
      typeBienDeclare === 'maison_copro' ? 'une maison en copropriété (lotissement, ASL)' :
      'un bien immobilier';
    typeBienHint = `\n\nTYPE DE BIEN : ${labelBien}. Conserve type_bien = "${typeBienDeclare}" dans le JSON.`;
  }
  return `Tu es le moteur d analyse de documents immobiliers de Verimo. Profil acheteur : ${p}.
Tu n utilises jamais les mots Claude, Anthropic ou IA.${typeBienHint}

MODE COMPLEMENT : Tu recois un rapport d analyse existant (JSON) et de NOUVEAUX documents PDF.
Ta mission : produire un NOUVEAU rapport complet qui FUSIONNE les donnees existantes avec les nouvelles informations.

REGLES DE FUSION :
1. CONSERVER toutes les donnees du rapport existant qui ne sont pas contredites par les nouveaux documents.
2. COMPLETER les champs qui etaient null ou vides si les nouveaux documents apportent l information.
3. CORRIGER les donnees si un nouveau document apporte une information plus precise ou plus recente.
4. CROISER les informations : si le rapport existant mentionnait un ravalement evoque et qu un nouvel appel de charges confirme un poste ravalement provisionne, le noter.
5. RECALCULER le score /20 en tenant compte de TOUTES les donnees (anciennes + nouvelles).
6. METTRE A JOUR documents_analyses pour inclure les anciens ET les nouveaux documents.
7. METTRE A JOUR documents_manquants en retirant ceux qui viennent d etre fournis.
8. Le format JSON de sortie est STRICTEMENT IDENTIQUE au format du rapport existant — meme structure, memes champs.

IMPORTANT :
- Ne JAMAIS perdre de donnees du rapport existant. Si un champ avait une valeur et que le nouveau document ne le mentionne pas, GARDER la valeur existante.
- Les documents originaux de l analyse initiale n existent plus. Tu ne peux pas les relire. Tu te bases sur le JSON existant pour les donnees anterieures.
- Applique les memes regles de notation /20 que pour une analyse complete standard.

Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres. Le JSON doit avoir EXACTEMENT la meme structure que le rapport existant.`;
}

function buildSystemPrompt(mode: string, profil: string, typeBienDeclare?: string | null): string {
  const p = profil === 'invest' ? 'investissement locatif' : 'residence principale';
  if (mode === 'document') {
    return buildDocumentPrompt(p);
  }
  if (mode === 'complement') {
    return buildComplementPrompt(profil, typeBienDeclare);
  }

  // ══════════════════════════════════════════════════════════
  // BLOC TYPE DE BIEN DÉCLARÉ — Inséré en tête du prompt complet
  // ══════════════════════════════════════════════════════════
  let typeBienBlock = '';
  if (typeBienDeclare && typeBienDeclare !== 'indetermine') {
    const labelBien =
      typeBienDeclare === 'appartement' ? 'un appartement en copropriété' :
      typeBienDeclare === 'maison' ? 'une maison individuelle' :
      typeBienDeclare === 'maison_copro' ? 'une maison en copropriété (lotissement, ASL)' :
      'un bien immobilier';

    typeBienBlock = `
TYPE DE BIEN DECLARE PAR L UTILISATEUR : ${labelBien}
REGLE IMPORTANTE : l utilisateur a indique que le bien analyse est ${labelBien}. Tu dois utiliser cette information comme reference principale pour le champ type_bien dans le JSON de sortie (valeur attendue : "${typeBienDeclare}").
Exception : si les documents fournis contredisent fermement cette declaration (ex : l utilisateur a dit "maison" mais tu vois clairement un PV d AG + reglement de copropriete mentionnant un immeuble collectif, ou inversement), alors utilise le type_bien correct selon les documents ET mentionne dans points_vigilance : "Attention : le type de bien declare initialement (${labelBien}) semble different de ce qui apparait dans les documents. Verifiez avec votre notaire."
Si les documents ne permettent PAS de conclure, fais confiance a la declaration de l utilisateur.

`;
  } else if (typeBienDeclare === 'indetermine' || !typeBienDeclare) {
    typeBienBlock = `
TYPE DE BIEN NON DECLARE : Determine toi-meme le type_bien a partir des documents fournis.
Indices pour appartement : PV d AG, reglement de copropriete, syndic, tantiemes, appel de charges copro, pre-etat date, surface Carrez, mention d immeuble ou d etage.
Indices pour maison : DDT maison individuelle sans document copro, taxe fonciere habitation individuelle, parcelle cadastrale dediee, absence totale de syndic ou tantiemes.
Indices pour maison_copro : maison dans un lotissement avec ASL, reglement de lotissement, charges collectives sans syndic professionnel.
Si les documents ne permettent pas de trancher avec certitude, prends "appartement" par defaut (cas le plus courant) et mentionne dans points_vigilance que le type exact doit etre verifie aupres du notaire.

`;
  }
  // Date du jour pour règle "documents anciens"
  const today = new Date();
  const todayStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const currentYear = today.getFullYear();
  const dateBlock = `
DATE DU JOUR : ${todayStr}
ANNEE COURANTE : ${currentYear}
Utilise ces references pour evaluer si les documents fournis sont a jour (voir REGLE DOCUMENTS ANCIENS).

`;
  return `${typeBienBlock}${dateBlock}Tu es le moteur d analyse de documents immobiliers de Verimo. Profil acheteur : ${p}.
Tu informes, tu n orientes jamais la decision finale. Tu n utilises jamais les mots Claude, Anthropic ou IA.
Si une information est absente, tu le signales clairement.

REGLES DE NOTATION /20 (profil ${p}) :
- Base : 20/20. On déduit pour chaque risque détecté, on ajoute pour chaque élément positif. Note plafonnée à 20.

TRAVAUX :
- Travaux lourds évoqués non votés (toiture, ravalement, chaudière, ascenseur, structure) : -3
- Travaux légers évoqués non votés (peinture PC, interphones, petit entretien) : -1
- Travaux votés a charge du vendeur (petits/moyens) : +2
- Gros travaux votes a charge du vendeur (chaudiere, ravalement, toiture) : +3
- Garantie decennale recente sur travaux realises : +2

PROCEDURES :
- Procedure significative (litige bloquant, administration provisoire, detournement syndic, impayes massifs) : -3
- Procedure mineure (petit litige isole, mise en demeure sans suite, un seul coproprietaire en impaye) : -1.5
- Aucune procedure detectee : +1

FINANCES :
- Fonds travaux nul ou absent : -1
- Impayes anormaux dans la copropriete (> 15% du budget annuel) : -1
- Fonds travaux conforme legal (= 5% budget) : +0.5
- Fonds travaux bien provisionne (6-9% budget) : +1
- Fonds travaux excellent (>= 10% budget) : +1.5
- Ecart budget vote / charges reelles : INFORMATIF UNIQUEMENT, afficher les deux montants si disponibles, ne jamais penaliser
- Appels de fonds exceptionnels : INFORMATIF UNIQUEMENT si justifies par travaux votes

DIAGNOSTICS PRIVATIFS :
- DPE F (residence principale) : -2
- DPE G (residence principale) : -3
- DPE F (investissement locatif) : -4
- DPE G (investissement locatif) : -6
- Electricite : anomalies majeures : -2
- DPE A, B ou C : +1.5
- DPE D : +1
- Diagnostics complets sans anomalie (hors ERP) avec DPE <= D : +2 (l ERP est toujours informatif, ne compte pas dans ce calcul. Amiante obligatoire si avant 1997, plomb obligatoire si avant 1949, termites selon zone prefectorale independamment de l annee)

DIAGNOSTICS COMMUNS :
- Amiante parties communes degrade : -2
- Termites parties communes : -2
- DTG etat general degrade : -2
- DTG budget travaux urgents < 50 000 euros : -1
- DTG budget travaux urgents > 50 000 euros : -2
- Immeuble bien entretenu : +0.5
- Entretien chaudiere collective certifie : +0.5
- DTG etat general bon : +1
- PPT (Plan Pluriannuel de Travaux) : INFORMATIF UNIQUEMENT, ne pas penaliser ni bonifier

════════════════════════════════════════════════════════════════════
REGLES DE CALCUL DES NOTES PAR CATEGORIE (categories.{cle}.note)
════════════════════════════════════════════════════════════════════
Ces notes alimentent le camembert/barres de l onglet Synthese.
Elles doivent etre COHERENTES avec le score global mais sont CALCULEES
INDEPENDAMMENT a partir de criteres specifiques a chaque categorie.

REGLE CRITIQUE — JAMAIS DE 0 ARBITRAIRE :
Une note de 0 doit UNIQUEMENT etre utilisee si AUCUN document pertinent n est disponible pour la categorie.
SI au moins un element a ete extrait pour la categorie (diagnostic, travaux, procedure, donnee financiere) alors la note doit refleter l etat reel — JAMAIS 0.
En cas de doute, utiliser la moitie de la note_max (ex : 2 sur 4) et expliquer dans avis_verimo.

--- categories.travaux (note_max = 5) ---
- Depart : 5/5
- Travaux lourds evoques non votes (toiture, ravalement, chaudiere, ascenseur, structure) : -1.5 par sujet lourd identifie, plafonne a -3
- Travaux legers evoques non votes : -0.5 par sujet
- Gros travaux a charge du vendeur (chaudiere, ravalement, toiture) : +1 bonus (max +2)
- Travaux realises avec garantie decennale recente : +0.5 bonus (max +1)
- Plancher : 1 si au moins un document travaux a ete analyse, 0 uniquement si aucun PV/carnet/DTG fourni

--- categories.procedures (note_max = 4) ---
- Depart : 4/4
- Procedure significative (litige bloquant, administration provisoire, detournement syndic, impayes massifs) : -2
- Procedure mineure (petit litige isole, mise en demeure sans suite, un seul coproprietaire en impaye) : -1
- Tensions avec syndic documentees (quitus refuse, changement+conflit) : -0.5
- Aucune procedure detectee ET documents pertinents presents : 4/4

--- categories.finances (note_max = 4) ---
- Depart : 2/4 (neutre par defaut)
- Fonds travaux >= 10 % budget (excellent) : +1.5
- Fonds travaux 6-9 % budget (bien) : +1
- Fonds travaux = 5 % budget (conforme legal) : +0.5
- Fonds travaux < 5 % budget (insuffisant) : -0.5
- Fonds travaux absent ou nul : -1
- Impayes anormaux dans la copropriete (> 15 % du budget annuel) : -0.5
- Vendeur a jour de ses charges (pre-etat date ou etat date avec impayes_vendeur = 0) : +0.5
- Budget stable ou en legere hausse sur plusieurs exercices : +0.5
- Plancher : 1 si au moins un document financier a ete analyse

--- categories.diags_privatifs (note_max = 4) ---
INTELLIGENCE REGLEMENTAIRE : avant de noter, determine d abord quels diagnostics sont REGLEMENTAIREMENT REQUIS pour ce bien selon ces criteres :

* DPE : requis TOUJOURS pour toute vente de logement (appartement, maison, maison en copro). Aucune exception en pratique pour les biens analyses ici.
* Electricite : requis si installation > 15 ans. Si annee_construction > (annee actuelle - 15) OU si attestation Consuel recente documentee : non requis.
* Gaz : requis si installation > 15 ans ET presence de gaz dans le logement. Si pas de gaz (chauffage elec ou fioul collectif sans gaz individuel), non requis.
* Amiante privatif : requis si permis de construire avant 01/07/1997 (en pratique : annee_construction < 1997). Si annee_construction >= 1997 : non requis.
* Plomb (CREP) : requis si construction avant 01/01/1949 (annee_construction < 1949). Si annee_construction >= 1949 : non requis.
* Termites : requis uniquement si la commune est couverte par un arrete prefectoral. Si l ERP ou le carnet d entretien confirme que la commune est en zone termites : requis. Sinon : informatif uniquement.
* ERP : requis si la commune est couverte par un PPR (naturel, minier, technologique) ou une zone de sismicite. A verifier via ERP lui-meme ou le carnet. En pratique souvent requis en zone urbaine.
* Carrez : requis UNIQUEMENT pour les lots en copropriete (appartement, maison_copro) >= 8 m2 et bati clos. Pas de Carrez pour une maison individuelle.

REGLE DDT + ACTUALISATION : un DDT et son actualisation (generalement ERP + termites car valides 6 mois) forment ENSEMBLE le dossier de diagnostics privatifs. Les traiter comme un seul dossier unifie. Priorite a la date la plus recente en cas de doublon. Ne JAMAIS noter 0 parce que deux fichiers se complementent — c est normal.

REGLE DDT UNIQUE : un DDT (Dossier de Diagnostic Technique) contient TOUS les diagnostics privatifs reglementaires en un seul document. Quand un DDT est detecte, considerer chacun de ses diagnostics (DPE, electricite, gaz, amiante, plomb, termites, Carrez, ERP) comme s il s agissait de documents separes, et les noter individuellement.

CALCUL DE LA NOTE (une fois la liste des diagnostics requis etablie) :
- Depart : 4/4 (si tous les diagnostics requis sont presents et sans anomalie majeure)
- Pour chaque diagnostic requis MANQUANT : -0.75
- DPE F (residence principale) : -1
- DPE G (residence principale) : -1.5
- DPE F (investissement locatif) : -1.5
- DPE G (investissement locatif) : -2
- Electricite avec anomalies majeures (parties actives nues, risque electrocution) : -1
- Electricite avec anomalies mineures : -0.3
- Gaz avec anomalies A2 (reparation urgente) : -0.5
- Gaz avec anomalies A1 (risque immediat) : -1
- Amiante privatif avec materiaux degrades : -1
- Amiante privatif avec materiaux suspects non preleves (evaluation periodique) : -0.3
- Plomb (CREP) avec revetements degrades : -1
- Termites : presence detectee : -2
- Plancher : 1 si au moins un diagnostic privatif a ete extrait (diagnostics[].filter(d => d.perimetre === "lot_privatif").length > 0). 0 UNIQUEMENT si aucun diagnostic privatif n a ete extrait de tous les documents fournis.
- Plafond : la note ne peut pas descendre sous le plancher si des diagnostics sont presents.

JUSTIFICATION OBLIGATOIRE : dans avis_verimo ou en note interne, indiquer brievement quels diagnostics sont requis vs non requis pour ce bien, notamment quand certains sont legitimement absents (ex : "CREP non applicable, construction 1967 — non note negativement").

--- categories.diags_communs (note_max = 3) ---
- Depart : 2/3 (neutre par defaut)
- DTG etat general bon : +1
- DTG etat general moyen : +0.5
- Amiante parties communes AC1 (action corrective) : -1
- Termites parties communes : -1
- DTG etat general degrade ou budget urgent > 50 000 € : -1
- Diagnostics parties communes complets sans alerte : +0.5
- Plancher : 1 si au moins un element (carnet ou DTG ou diag parties communes) a ete analyse. 0 si aucun document concernant l immeuble.

════════════════════════════════════════════════════════════════════

REGLES FONDS TRAVAUX STATUT :
- "absent" : aucun fonds de travaux mentionné ou = 0€
- "insuffisant" : fonds travaux < 5% du budget annuel (non conforme loi ALUR)
- "conforme" : fonds travaux = exactement 5% du budget annuel (minimum légal respecté)
- "bien" : fonds travaux entre 6% et 9% du budget annuel (au-dessus du minimum)
- "excellent" : fonds travaux >= 10% du budget annuel (très bien provisionné)
- "non_mentionne" : aucune information disponible dans les documents

REGLES IMPORTANTES :
- finances.budget_total_copro = budget annuel TOTAL copropriete, PAS la quote-part du lot
- finances.charges_annuelles_lot = charges annuelles du lot (quote-part acheteur). Extraire depuis TOUT document mentionnant les charges du lot : appels de charges, appels de fonds provisionnels. Un appel de fonds provisionnel est la MEME chose qu un appel de charges.
- RÈGLE CASCADE SOURCES FINANCES DU LOT : pour remplir finances.charges_annuelles_lot et les informations financieres associees au lot vendu, appliquer la cascade suivante par ordre de priorite descendante :
  1. PRÉ-ÉTAT DATÉ ou ÉTAT DATÉ : si present, c est la source la plus fiable. Extraire charges_futures.montant_annuel (x4 si trimestriel), fonds_travaux_alur, impayes_vendeur, et surtout historique_charges N-1 et N-2 (budget_appele + charges_reelles) qui doivent apparaitre dans finances.budgets_historique. Source = "Pré-état daté" ou "État daté".
  2. APPEL DE CHARGES du lot : si present sans pre-etat date, extraire montant_annuel du lot. Source = "Appel de charges".
  3. PV D AG + TANTIEMES : si seulement un PV d AG fourni avec budget total ET tantiemes du lot connus (lot_achete.quote_part_tantiemes), calculer estimation = budget_total × tantiemes_lot / total_tantiemes. Source = "Estimation depuis PV d AG × tantiemes".
  4. PV D AG SEUL : si ni tantiemes ni appel de charges, laisser charges_annuelles_lot = null et signaler dans avis_verimo : "Charges du lot non determinables — uploader un appel de charges ou le pre-etat date pour obtention du montant precis."
- RÈGLE COTISATION FONDS TRAVAUX DU LOT (finances.cotisation_fonds_travaux_lot_annuelle) : si un appel de charges (ou un pre-etat date) distingue une ligne propre au lot "Fonds de travaux loi ALUR" / "cotisation fonds travaux", remplir finances.cotisation_fonds_travaux_lot_annuelle = montant trimestriel de cette ligne x 4 (ex : 26,27/trim => 105). IMPORTANT : ce montant doit deja etre INCLUS dans finances.charges_annuelles_lot (qui = total general appele du lot = charges courantes + cotisation fonds travaux). Sert a afficher "dont X euros/an de cotisation au fonds de travaux" sous les charges annuelles. Laisser null si la cotisation n est pas distinguable.
- RÈGLE FONDS RATTACHES AU LOT (finances.fonds_rattaches_lot) : UNIQUEMENT si AUCUN pre-etat date / etat date n est fourni. Si un appel de charges contient un cadre "Rappel pour memoire de votre participation aux fonds" (colonnes Avances / Fonds ALUR / Prov. travaux / Provisions), extraire fonds_rattaches_lot.avance_tresorerie (colonne Avances) et fonds_rattaches_lot.fonds_travaux_alur (colonne Fonds ALUR), et fonds_rattaches_lot.source = "Appel de charges du [periode]". Ce sont des montants de CAPITAL deja verses, rattaches au lot, a REMBOURSER AU VENDEUR a la signature (en sus du prix) — PAS des charges recurrentes, donc ne PAS les ajouter a charges_annuelles_lot. Si un pre-etat date est fourni, laisser fonds_rattaches_lot a null (le pre-etat date est prioritaire et a ses propres champs pre_etat_date.fonds_travaux_alur / fonds_roulement_acheteur).
- RÈGLE AFFICHAGE FINANCES LOT (UI) : NE JAMAIS mentionner "taxe fonciere" dans les labels ou textes concernant les finances copro du lot. La taxe fonciere est un impot, pas une charge copro. Si l onglet affiche un texte d aide, il doit etre : "Uploadez un appel de charges OU un pre-etat date pour obtenir ces informations." (Sans mention de taxe fonciere.)
- finances.budgets_historique = tableau des budgets annuels extraits de CHAQUE PV d'AG disponible : [{annee: "2023", budget_total: 180000, fonds_travaux: 9000, charges_lot: 3200}]. Laisser null si aucun PV fourni.
- diagnostics : perimetre OBLIGATOIRE = "lot_privatif" ou "parties_communes"
- diagnostics DPE : le champ "resultat" doit contenir la classe energetique ET la classe GES sous la forme "Classe E - 281 kWh/m2/an. GES: Classe D - 61 kg CO2/m2/an."
- dpe_recommandations : si un DDT contient un DPE avec sa section "Recommandations d amelioration de la performance", recopier ICI les donnees extraites dans le DDT (dpe.recommandations + dpe.version_methode). Mettre present=true. Si aucun DPE n est fourni dans le dossier OU si le DPE n a pas de section recommandations exploitable, mettre present=false et laisser pack_1/pack_2/evolution_etiquette vides. Cette section est destinee a l onglet logement du rapport.
- diagnostics CARREZ/MESURAGE : si le document contient un detail des surfaces par piece, renseigner pieces_detail : [{"piece": "Sejour", "surface": 20.29}]. Sinon laisser null. IMPORTANT : extraire systematiquement chaque piece listee dans le mesurage (sejour, chambre, cuisine, salle de bains, wc, entree, etc.) avec sa surface en m2. Ne pas se contenter de la surface totale. Si une piece a une surface < 1.80m de hauteur sous plafond et n est pas comptee Carrez, l ignorer.
- diagnostics PLOMB parties communes : NE PAS inclure si annee_construction >= 1949.
- diagnostics AMIANTE parties communes : NE PAS inclure si annee_construction >= 1997.
- diagnostics TERMITES : mettre presence="absence" UNIQUEMENT si le document dit explicitement que l immeuble n est pas concerne.
- procedures : message doit expliquer clairement en langage simple l origine et les implications
- RÈGLE PROCÉDURES — cadrage strict de procedures[] : ce tableau ne contient QUE des procédures réelles et formalisées ayant un impact concret pour l acheteur. SONT des procédures, et il faut les inclure TOUTES sans jamais en omettre une : contentieux judiciaire en cours ou non clos, procédure de recouvrement d impayés ENGAGÉE (mise en demeure formelle, injonction de payer, commandement de payer, saisie), litige copropriété contre syndic ou copropriété contre tiers porté devant une juridiction, expertise judiciaire, arrêté de péril ou d insalubrité, injonction administrative de travaux, administration provisoire, action en garantie décennale judiciarisée. NE SONT PAS des procédures et ne doivent JAMAIS figurer dans procedures[] : un refus de quitus, un désaccord ou une tension non judiciarisée, un simple changement de syndic, une réserve ou une erreur comptable, un vote contre une résolution, des impayés de charges non encore en recouvrement judiciaire. Précisions sur le champ type : "contentieux" = action en justice ; "copro_vs_syndic" = litige FORMALISÉ porté devant une instance, PAS un simple vote de défiance ; "impayes" = recouvrement judiciairement engagé. Le refus de quitus est DÉJÀ traité dans vie_copropriete.participation_ag[].quitus et impacte déjà le score : s il est significatif, le signaler dans points_vigilance, jamais dans procedures[]. EN CAS DE DOUTE : si l élément est une VRAIE procédure mais de gravité incertaine, le CONSERVER (gravité au niveau le plus prudent) ; si l élément est un signal de gouvernance, un désaccord ou une tension non judiciarisée, NE PAS le créer comme procédure.
- documents_analyses : lister TOUS les documents avec leur type detecte
- En cas de contexte tres long, priorise : PV AG > DDT > diagnostics > appels charges > RCP articles 1-30
- lot_achete.parties_privatives : lister TOUS les lots privatifs vendus (appartement + cave + parking + grenier...) avec leur numero et leur tantieme PROPRE si mentionne (format "num/den", ex "235/10070"). Chaque lot = son tantieme general PROPRE, lu sur SA ligne du tableau des lots (en-tete de l appel de charges, RCP, etat descriptif de division ou pre-etat date). REGLE ANTI-DOUBLON CRITIQUE : NE JAMAIS prendre le tantieme de la ligne "Charges communes generales" (ou "charges communes", "base de repartition", "total tantiemes") d un appel de charges comme le tantieme d un lot — cette valeur est la SOMME des lots du vendeur (ex : 255 = appartement 235 + cave 20) et l attribuer a un seul lot fausse le total par double comptage. Toujours descendre au tantieme INDIVIDUEL de chaque lot.
- lot_achete.quote_part_tantiemes : tantiemes TOTAUX du lot = SOMME des tantiemes propres de tous les lots vendus (meme denominateur). Ex : appartement 235/10070 + cave 20/10070 => "255/10070emes". AUTO-CONTROLE : ce total doit etre EGAL a la base "charges communes generales" quand elle figure dans un appel de charges. S ils different, c est qu un tantieme a ete mal lu — recommencer la lecture lot par lot.
- vie_copropriete.syndic.type : "professionnel" si cabinet syndic, "benevole" si copropriétaire gérant lui-même.
- vie_copropriete.syndic.gestionnaire : nom de la personne qui gere le dossier au sein du cabinet syndic, si mentionne. REGLES DE PRIORITE STRICTE (choisir le PREMIER trouve dans cet ordre) : 1) gestionnaire principal de copropriete (personne designee comme "gestionnaire de copropriete", "gestionnaire principal", "chargee de copropriete", signataire regulier des convocations et PV) ; 2) gestionnaire associe ou adjoint si aucun principal clair ; 3) laisser null sinon. INTERDICTIONS : NE JAMAIS mettre le president du conseil syndical (c est un coproprietaire, pas un employe du syndic) ; NE JAMAIS mettre le secretaire de seance (role ponctuel) ; NE JAMAIS mettre uniquement le gerant ou PDG du cabinet sauf s il est aussi explicitement designe comme gestionnaire du dossier ; NE JAMAIS inventer un nom.
- vie_copropriete.syndic.gestionnaire_fonction : fonction exacte de la personne identifiee comme gestionnaire, UNIQUEMENT si elle est explicitement ecrite dans le document. Valeurs types : "Gestionnaire de copropriete", "Gestionnaire principal", "Gestionnaire associe", "Chargee de clientele", "Chargee de copropriete". Laisser null si la fonction n est pas explicitement ecrite dans les documents — ne JAMAIS inventer une fonction par defaut.

REGLES STATUT SYNDIC (multi-PV) — IMPORTANT : etudier TOUS les PV d AG fournis pour reconstituer l historique :
- vie_copropriete.syndic.statut : analyser l evolution du syndic sur l ensemble des PV d AG analyses. Valeurs possibles :
  * "stable" : meme syndic identifie sur TOUTES les AGs analysees (au moins 2 AGs) sans changement.
  * "reconduit" : un seul PV d AG analyse, avec reconduction explicite du syndic en place.
  * "nouveau_elu" : un changement unique detecte (ex : LACOUR sortant, A2BCD entrant vote a cette AG) — situation NORMALE, pas un signal negatif.
  * "rotation_frequente" : 2 changements ou plus detectes sur 3 AGs ou moins — SEUL cas alarmant, indique une instabilite reelle de la gouvernance.
  * "recherche" : mandat actuel arrive a terme SANS designation adoptee a cette AG (carence future a anticiper).
  * "carence" : UNIQUEMENT si le PV mentionne explicitement une absence de syndic, une carence, ou une administration provisoire.
  * null : sujet non aborde dans les documents fournis.
- vie_copropriete.syndic.sortant : nom du syndic remplace si un changement est detecte. Si rotation_frequente, indiquer le plus ancien syndic identifie.
- vie_copropriete.syndic.entrant : nom du syndic actuel/nouveau. En general egal a vie_copropriete.syndic.nom.
- vie_copropriete.syndic.annee_changement : annee de l AG ou le changement a ete vote (format "AAAA" ou "JJ/MM/AAAA"). Exemple : "2023" si le changement est vote a l AG 2023.
- vie_copropriete.syndic.nb_ags_analysees : nombre de PV d AG distincts presents dans les documents fournis (pour contexte).
- RÈGLE PV AG MANQUANTS : la loi oblige le vendeur a fournir les PV des 3 dernieres AG. Compter le nombre de PV d AG distincts dans documents_analyses (type=PV_AG). Si moins de 3 PV fournis, ajouter dans documents_manquants un element precisant combien manquent. Exemples :
  * 0 PV fourni : ajouter "PV des 3 dernières assemblées générales (obligatoires pour la vente)"
  * 1 PV fourni : ajouter "Il manque 2 PV d'assemblée générale sur les 3 obligatoires"
  * 2 PV fournis : ajouter "Il manque 1 PV d'assemblée générale sur les 3 obligatoires"
  * 3 PV fournis : ne rien ajouter (complet)
- RÈGLE DOCUMENTS ANCIENS : utilise l ANNEE COURANTE fournie en debut de prompt. Pour chaque document analyse, comparer son annee a l annee courante. Si un document considere comme devant etre tenu a jour a plus de 2 ans d ecart avec l annee courante, AJOUTER une entree dans points_vigilance. Documents concernes par cette regle : PV d AG, appels de charges, pre-etat date, etat date, taxe fonciere, fiche synthetique. Exemple si annee courante = 2026 et derniers PV d AG fournis = 2021, 2022, 2023 : ajouter dans points_vigilance "Les PV d assemblee generale fournis sont anciens (2021, 2022, 2023). Demander les PV des 3 dernieres AGs (2023, 2024, 2025) pour disposer d une vision actuelle de la copropriete." NE PAS appliquer cette regle aux documents par nature statiques : RCP, modificatifs RCP, diagnostics amiante/plomb parties communes, carnet d entretien (peut etre ancien si copropriete sans evenements recents).
- vie_copropriete.syndic.historique_changements : uniquement si statut = "rotation_frequente", lister les syndics successifs avec leur annee, format : [{ "annee": "2022", "syndic": "LACOUR" }, { "annee": "2023", "syndic": "A2BCD" }, { "annee": "2024", "syndic": "MARTIN" }]. Pour tous les autres statuts, laisser ce champ vide [].
- IMPORTANT — Non alarmisme : un changement de syndic unique (statut "nouveau_elu") est NORMAL et COURANT, pas un signal negatif. NE JAMAIS mentionner ce changement dans points_vigilance sauf si combine avec : quitus refuse ET changement dans la meme AG, OU procedure en cours contre le syndic sortant. Un simple changement de cabinet sans conflit documente reste neutre ou va dans points_forts.
- Si statut = "rotation_frequente" (2+ changements sur peu d AGs), mentionner dans points_vigilance : "Instabilite dans la gouvernance : 3 syndics differents identifies sur les 3 dernieres AGs. Cette rotation frequente peut traduire des tensions internes — a approfondir."
- Si statut = "stable" sur 2+ AGs, mentionner dans points_forts : "Gouvernance stable : meme syndic en place sur les X dernieres AGs analysees."

- vie_copropriete.nb_lots_total / nb_lots_detail / nb_batiments : extraire depuis PV d'AG, carnet d'entretien, RCP ou pré-état daté. nb_lots_detail.logements = appartements + maisons uniquement. Ne jamais additionner si non mentionné.
- vie_copropriete.participation_ag[].quitus : pour chaque AG, indiquer si le quitus (approbation de la gestion du syndic) a été soumis au vote. approuve=true si voté favorablement, approuve=false si refusé ou rejeté, soumis=false si non abordé. detail = 1 phrase d'explication si refusé.
- vie_copropriete.dtg : remplir si un DTG (Diagnostic Technique Global) ou PPT (Plan Pluriannuel de Travaux) est fourni ou mentionné. etat_general = "bon", "moyen" ou "degrade". budget_urgent_3ans et budget_total_10ans en euros. travaux_prioritaires = liste des travaux urgents identifiés.
- vie_copropriete.regles_copro : extraire depuis le RCP les règles d'usage importantes pour un acheteur. Maximum 8. Reformuler en langage simple. impact_rp=true si ça concerne la vie quotidienne. impact_invest=true si ça concerne la location.

- RÈGLE CARNET D ENTRETIEN : si un document de type CARNET_ENTRETIEN a ete detecte dans les documents analyses, remplir vie_copropriete.carnet_entretien.present=true et extraire :
  * date_maj : date de derniere mise a jour du carnet si mentionnee
  * immatriculation_registre : numero d immatriculation au registre national des coproprietes (format AE1234567)
  * equipements_copro : chauffage_collectif (true/false), type_chauffage (fioul/gaz/elec/urbain/autre), eau_chaude_collective (true/false), eau_froide_collective (true/false), fibre_optique (true/false/null), ascenseur (true/false/null)
  * contrats_entretien : lister jusqu a 10 contrats d entretien (chaudiere, ascenseur, portes garage, extincteurs, BAES, deratisation, toiture, menage parties communes, etc.) avec prestataire, date_reconduction (au format JJ/MM/AAAA si disponible), periodicite
  * travaux_realises_carnet : travaux deja faits listes dans le carnet (differents des travaux du PV d AG). Limiter a 10 entrees.
  * travaux_en_cours_votes_carnet : travaux votes en AG mentionnes dans le carnet mais pas encore realises (ex: "Mise en peinture grilles votee 13/05/2019, budget 13000 €")
  * diagnostics_parties_communes_carnet : amiante, plomb, termites, ascenseur mentionnes dans le carnet. Pour chacun : type, date du rapport, entreprise, resultat
  * conseil_syndical_carnet : date_nomination du CS et nombre de membres
  Si aucun CARNET_ENTRETIEN detecte : present=false et laisser les autres champs null ou vides.

- RÈGLE MODIFICATIFS RCP : si un ou plusieurs documents de type MODIFICATIF_RCP ont ete detectes, remplir vie_copropriete.modificatifs_rcp[] (un objet par modificatif). Pour chacun :
  * date_acte : date de l acte notarial (JJ/MM/AAAA)
  * notaire : nom + etude
  * type_modification : un des codes (creation_lot, suppression_lot, changement_usage, mise_a_jour_tantiemes, servitude, fusion_lots, autre)
  * sur_quoi_porte : liste [{aspect, detail}] - expliquer en langage SIMPLE ce que le modificatif change (ex : "Fusion des lots 32 et 33 : les deux appartements deviennent un seul lot plus grand")
  * impact_acheteur : 1-2 phrases max sur ce que ca change concretement pour l acheteur (ex : "Ce modificatif concerne d autres lots que le votre, aucun impact direct." OU "Le lot que vous achetez a ete modifie dans sa configuration - verifier correspondance avec la description actuelle.")
  * points_attention : uniquement si impact reel sur l acheteur (lot enclave, servitude, publication fonciere a verifier, acte rectificatif attache, erreur de tantiemes corrigee)
  Si aucun modificatif detecte : laisser modificatifs_rcp = [] vide.

- RÈGLE FICHE SYNTHETIQUE : si un document de type FICHE_SYNTHETIQUE a ete detecte, remplir vie_copropriete.fiche_synthetique :
  * present : true
  * date : date de la fiche
  * fiche_recente : true si date < 12 mois
  * immatriculation_registre, dtg_realise (bool), dtg_date, equipements_collectifs_detail (liste de strings)
  PRIORITE DES DONNEES : si PV d AG plus recent disponible, les donnees financieres et syndic de la fiche synthetique sont IGNOREES au profit du PV. Ne JAMAIS utiliser la fiche synthetique comme source principale pour le budget ou les charges si un PV recent existe. La fiche est utile principalement pour : immatriculation_registre (donnee stable), presence d un DTG, equipements techniques.

- RÈGLE ANNEES SUR DONNEES FINANCIERES : toujours remplir finances.budget_total_copro_annee et finances.fonds_travaux_annee avec l annee de reference de la donnee (celle du dernier PV d AG connu ou du dernier arrete comptable). finances.charges_annuelles_lot_source indique la source exacte ("Pre-etat date du 15/01/2024", "Appel de charges T1 2024", "Estimation PV AG 2023 x tantiemes", etc.). Si la donnee vient d une fiche synthetique de plus de 2 ans, le mentionner explicitement dans avis_verimo.

- RÈGLE HISTORIQUE CHARGES N-1 / N-2 : si un pre-etat date ou etat date est fourni, TOUJOURS extraire pre_etat_date.historique_charges avec deux entrees (N-1 et N-2) — chaque entree avec exercice, annee, budget_appele, charges_reelles, provisions_hors_budget. Ces donnees figurent systematiquement dans les pre-etats dates, section "Annexe 3eme partie - Information de l acquereur" :
  * budget_appele = "A.1 Depenses reelles OU provisions dans le budget previsionnel" (charges courantes)
  * charges_reelles = si le document distingue budget vote VS dépenses reelles apres cloture, extraire les dépenses reelles. Sinon laisser null.
  * provisions_hors_budget = "A.2 Provisions appelees HORS budget previsionnel (Art.44)" — ce sont les appels exceptionnels pour financer des travaux votes. À extraire UNIQUEMENT depuis la section A.2, NE PAS confondre avec le budget courant.
  Si seulement N-1 disponible, remplir la premiere entree et laisser la seconde avec annee=null. Ne JAMAIS omettre ce tableau — il est critique pour l acheteur pour comparer ecart budget vote / charges reelles et identifier les appels de travaux.

- RÈGLE FONDS DE TRAVAUX (DEUX FONDS DISTINCTS) : les pre-etats dates modernes mentionnent DEUX fonds de travaux distincts, tous les deux rattaches au lot et a rembourser au vendeur a la signature :
  * fonds_travaux_ancien = section "-III- EXISTENCE D UN FONDS DE TRAVAUX" (art. 18 loi 1965) — ancien systeme de reserve de tresorerie, anterieur a la loi ALUR. Extraire "Montant de la part dudit fonds rattachée au lot principal cédé".
  * fonds_travaux_alur = section "-III bis- EXISTENCE D UN FONDS DE TRAVAUX PREVOYANCE" (art. 14-2 loi ALUR 2014) — fonds obligatoire depuis ALUR. Extraire "Montant de la part dudit fonds rattachée au lot principal cédé".
  Ces deux montants sont INDEPENDANTS et peuvent coexister. L acheteur DEVRA REMBOURSER LES DEUX au vendeur a la signature. Ne jamais additionner par erreur en un seul champ — extraire chacun dans son champ dedie. Si le document ne mentionne qu un seul fonds, ne remplir que le champ correspondant et laisser l autre à null.

- RÈGLE TAXE FONCIÈRE : si un document de type TAXE_FONCIERE est fourni, TOUJOURS remonter le montant total au niveau finances.taxe_fonciere_annuelle (nombre en euros, du dernier avis) et finances.taxe_fonciere_annee (annee de l avis). Cette donnee est critique pour le calcul du cout annuel total. Si aucun avis n est fourni mais qu un compromis mentionne un montant approximatif, utiliser cette valeur et preciser la source dans points_vigilance.

- RÈGLE CHAUFFAGE / EAU CHAUDE INDIVIDUEL : dans finances, remplir chauffage_individuel (true/false/null) et eau_chaude_individuelle (true/false/null) selon les documents. Un chauffage individuel signifie que l acheteur paiera en plus de ses charges de copropriete — c est une donnee importante a signaler. Sources : carnet d entretien, fiche synthetique, DPE, pre-etat date (section equipements), ou par deduction si les charges de chauffage n apparaissent pas dans le budget copro. Si non determinable : null.

- negociation : applicable=true UNIQUEMENT si score < 17. En dessous de ce seuil, il y a toujours au moins un levier de negociation possible. RÈGLE CRITIQUE : ne JAMAIS inclure dans negociation.elements des items deja a la charge du vendeur (travaux votes avant la vente, fonds ALUR a rembourser, honoraires syndic pre-etat date) — ces items ne sont PAS des leviers de negociation pour l acheteur. Les leviers valides sont : travaux evoques non votes avec risque acheteur, DPE defavorable (E/F/G seulement), equipements vetustes non remplaces (chaudiere > 20 ans par ex), anomalies techniques majeures detectees, procedures en cours, impayes copro eleves (>15% du budget), gouvernance defaillante (quitus refuse). Si un item mentionne "charge vendeur", "deja vote", "fonds ALUR" ou "honoraires pre-etat date" : NE PAS l inclure dans negociation.elements. Si aucun levier valide, mettre applicable=false et elements=[].

- RÈGLE CRITIQUE — QUI PAIE LES TRAVAUX VOTES : NE JAMAIS ecrire qu un travaux vote est "legalement a la charge du vendeur" (c est FAUX). Par defaut (article 6-2 du decret de 1967), les appels de fonds exigibles APRES la vente sont a la charge de l ACHETEUR, meme pour des travaux votes avant et meme si l acheteur n a pas vote. Quand tu mentionnes dans points_vigilance (ou ailleurs) des travaux votes dont des appels de fonds tombent apres la vente, formule de facon RASSURANTE et EXACTE : en principe ces appels seraient a la charge de l acheteur, MAIS en pratique l usage notarial veut que le vendeur les reprenne via une clause du compromis — inviter a verifier que cette clause figure bien au compromis (c est ce qui protege l acheteur). NE JAMAIS affirmer une charge vendeur automatique, ni laisser une charge acheteur sans la nuance de la clause. Distinguer : travaux REALISES et payes = aucun cout acheteur ; travaux EVOQUES non votes = risque futur acheteur.

- RÈGLE FORMAT points_forts / points_vigilance (SYNTHESE FINALE uniquement) : formuler CHAQUE point ainsi -> un TITRE court (2 a 5 mots) puis " — " (tiret cadratin entoure d espaces) puis 1 a 2 phrases de detail. Le titre resume l essentiel ; le detail precise (montant, date, consequence pour l acheteur) SANS repeter le titre. Exemples : "Syndic stable — TiffenCoge reconduit jusqu au 30/09/2027, gestion continue." / "Travaux votes a financer — environ 6 611 EUR appeles entre juin et octobre 2026, a votre charge sauf clause du compromis." / "Diagnostics manquants — DPE, electricite, plomb et Carrez ne sont pas au dossier." JAMAIS d emoji ni de puce en tete. Max 8 points par liste. Cette regle ne concerne QUE les points_forts et points_vigilance au niveau RACINE du JSON de synthese (pas ceux internes aux documents).

- RÈGLE APPELS DE FONDS EXCEPTIONNELS : chaque entree de vie_copropriete.appels_fonds_exceptionnels[] DOIT avoir la structure suivante : { motif: "sujet precis de l appel (ex: 'Ravalement facade', 'Reparation ascenseur', 'Travaux toiture')", detail: "1 phrase courte expliquant pourquoi cet appel (contexte des travaux ou de la situation)", montant_total: nombre ou null, date_ag: "date du vote en AG (si connue)", echeance: "date de paiement attendue (si connue)" }. NE JAMAIS mettre "Appel de fonds exceptionnel" comme motif generique — toujours preciser l objet reel de l appel. Si l objet n est pas identifiable dans les PV, ne PAS creer l entree plutot que de mettre un motif vague.
- RÈGLE CRITIQUE — VOTES EN DEUX TOURS : En copropriété française, si une résolution ne recueille pas la majorité art. 25 au 1er tour mais obtient au moins 1/3 des voix, un 2ème tour à la majorité art. 24 est organisé immédiatement. Si le 2ème tour adopte la résolution, elle EST ADOPTÉE. Ne jamais la marquer comme refusée. Indices : "second tour", "art. 24", "adoptée à la majorité art. 24". Un vrai refus = résolution rejetée sans 2ème tour ou 2ème tour également rejeté. S applique à toutes les résolutions : fonds travaux, travaux, contrat syndic, etc.
- RÈGLE FONDS ALUR / FONDS DE ROULEMENT : Ces montants sont attachés au lot. L acheteur les hérite MAIS DOIT LES REMBOURSER AU VENDEUR à la signature de l acte authentique, en sus du prix de vente. NE JAMAIS dire qu ils sont "récupérables par l acheteur" ou "restitués à l acheteur". Formuler toujours ainsi : "X € de fonds travaux ALUR à rembourser au vendeur à la signature."
- RÈGLE EXCLUSION points_vigilance (frais de signature normaux) : les elements ci-dessous sont des FRAIS NORMAUX lies a toute transaction immobiliere en copropriete. Ils ne sont PAS des risques et ne doivent JAMAIS apparaitre dans points_vigilance de la synthese finale (rapport.points_vigilance), meme avec un emoji warning. Ils restent affiches dans leurs blocs dedies (onglet Logement, bloc pre-etat date, etc.) ou l acheteur peut les consulter.
  * Fonds de travaux ALUR a rembourser au vendeur (quel que soit le montant)
  * Honoraires de syndic pour l etablissement du pre-etat date ou de l etat date (generalement 150-300 €)
  * Fonds de roulement a reconstituer par l acheteur
  * Frais de mutation standards
  EXCEPTION : si l un de ces montants est ANORMALEMENT ELEVE (ex : honoraires syndic > 500 €, fonds roulement > 3 mois de charges), alors mentionner dans points_vigilance avec le motif precis de l anomalie. Sinon, rester silencieux dans la synthese.
- pre_etat_date : si un pré-état daté ou état daté est fourni, remplir pre_etat_date.present=true et extraire TOUS les champs : impayes_vendeur (0 si vendeur à jour), fonds_travaux_alur (montant fonds travaux à verser AU vendeur), fonds_roulement_acheteur (montant fonds de roulement à verser AU vendeur), honoraires_syndic (frais d établissement du document, TOUJOURS à la charge du vendeur), charges_futures (montants trimestriels), historique_charges N-1 et N-2, travaux_charge_vendeur, procedures_contre_vendeur, impayes_copro_global, dette_fournisseurs. RAPPEL FONDS : fonds_travaux_alur et fonds_roulement_acheteur sont à VERSER AU VENDEUR par l acheteur à la signature, en sus du prix.
- RÈGLE CRITIQUE pre_etat_date.present : si un document est identifie comme PRE_ETAT_DATE ou ETAT_DATE dans documents_analyses, alors pre_etat_date.present DOIT etre true. Sans ce flag, toute la section pré-état daté (fonds travaux lot, historique N-1/N-2, charges futures, impayés) est INVISIBLE dans le rapport. C est la donnée la plus critique a ne JAMAIS oublier.
- RÈGLE HISTORIQUE N-1/N-2 OBLIGATOIRE : si pre_etat_date.present=true, TOUJOURS remplir historique_charges avec au minimum une entrée N-1. Les données se trouvent dans l annexe du pré-état daté, section "Quote-part pour les lots objets de la future mutation" — tableau avec budget prévisionnel (appelé/réel) et dépenses hors budget (appelé/réel). budget_appele = quote-part appelée du budget prévisionnel. charges_reelles = quote-part réelle (après clôture). provisions_hors_budget = quote-part appelée hors budget prévisionnel. NE JAMAIS laisser historique_charges vide si ces données figurent dans le document.

- RÈGLE CRITIQUE — FONDS TRAVAUX : NE PAS CONFONDRE LOT ET COPRO :
  * finances.fonds_travaux = montant ANNUEL de la cotisation fonds travaux ALUR au niveau COPRO (extrait du PV d AG ou de la fiche synthetique : budget_vote.fonds_travaux). C est le budget global voté en AG pour alimenter le fonds.
  * pre_etat_date.fonds_travaux_alur = montant ACQUIS rattache au LOT du vendeur, a rembourser par l acheteur a la signature. C est la part capitalisee dans le fonds, PAS une cotisation annuelle.
  * Si SEUL un pre-etat date est fourni (pas de PV d AG ni fiche synthetique), NE PAS recopier pre_etat_date.fonds_travaux_alur dans finances.fonds_travaux — ce sont deux donnees DIFFERENTES. finances.fonds_travaux doit rester null si aucun PV d AG ou fiche synthetique ne fournit le budget annuel copro du fonds.
  * Consequence scoring : fonds_travaux_statut doit etre calcule a partir de finances.fonds_travaux (cotisation annuelle copro) et finances.budget_total_copro, JAMAIS a partir de pre_etat_date.fonds_travaux_alur (capital lot). Si finances.fonds_travaux est null, mettre fonds_travaux_statut = "non_mentionne", PAS "insuffisant".

- RÈGLE FILTRAGE POINTS DE VIGILANCE SYNTHESE (rapport.points_vigilance) : cette liste est le resume des vrais risques pour l acheteur. Le seuil financier depend de la taille de la copropriete :
  * Si finances.budget_total_copro > 80 000 euros : ne remonter dans rapport.points_vigilance QUE les elements avec un impact financier > 5 000 euros OU un risque structurel, juridique, sanitaire, ou reglementaire.
  * Si finances.budget_total_copro <= 80 000 euros (ou inconnu) : seuil a 3 000 euros.
  Les elements en dessous du seuil restent dans les sections detaillees (onglet copro, travaux evoques, PV d AG) — ils ne sont juste PAS remontes dans la synthese rapport.points_vigilance.
  EXCLURE ABSOLUMENT de rapport.points_vigilance :
  * Travaux mineurs ou d entretien courant : boites aux lettres, peinture cage d escalier, interphones, digicodes, nettoyage, VMC individuelle, serrurerie, moquette parties communes, eclairage couloirs, etc.
  * Travaux deja realises (sauf si appel de fonds encore en cours)
  * Constats neutres sans impact financier (ex: "le syndic a change" sans tension avérée)
  * Frais normaux de transaction (fonds ALUR, honoraires syndic, fonds de roulement)
  Avant d inclure un element dans rapport.points_vigilance, se poser la question : "Est-ce que cet element depasse le seuil financier OU represente un risque structurel/juridique/sanitaire serieux ?" Si non, ne pas l inclure — cela ne signifie pas qu on n en parle pas, juste qu on ne le remonte pas en synthese.
- compromis : si un compromis ou une promesse de vente est fourni, extraire dans lot_achete.compromis l ENSEMBLE des champs structures du document (cf schema COMPROMIS detaille plus haut). Inclure : type_avant_contrat, date_signature, date_acte_prevue, vendeurs[], acheteurs[], notaires[], agence, bien (avec lots_cedes[], rcp_date_acte, origine_propriete, usage_declare), finances (avec frais_notaire_estimes_verimo et cout_total_estime_acheteur_verimo CALCULES), financement, conditions_suspensives[], calendrier[], droits_preemption[], diagnostics_annexes[], annexes_copropriete_l721_2, copropriete_finances_synthese, situation_locative, clauses_critiques[], servitudes[].
- compromis -> negociation : INCLURE en negociation.elements : travaux urgents chiffres / DPE F ou G uniquement (pas D ou E) / impayes vendeur / procedures judiciaires / gros travaux votes / travaux evoques sans vote depuis plusieurs AG. EXCLURE : DPE A/B/C/D / travaux charge vendeur / constats sans impact financier. Si aucun element ne justifie une negociation, applicable=false et elements=[].
- PRIORITE COMPROMIS dans la synthese globale (rapport.*) : le compromis est le DOCUMENT LE PLUS RECENT et JURIDIQUEMENT OPPOSABLE quand il est fourni. Regles de priorite :
  * rapport.titre : adresse extraite du compromis si present (prime sur DDT, PV_AG, RCP).
  * rapport.type_bien : type extrait du compromis si present (appartement, maison, maison_copro).
  * finances.taxe_fonciere_annuelle : si mentionnee dans le compromis et plus recente que la taxe_fonciere fournie separement, le compromis prime.
  * En cas de CONTRADICTION entre compromis et autre document (PV_AG, RCP, DDT) : le compromis prime PAR DEFAUT car plus recent. MAIS ajouter dans points_vigilance : "Le [document anterieur] mentionne [X], le compromis indique [Y] — verifier avec le vendeur ou notaire."
  * EXCEPTION : pour les chiffres financiers definitifs (charges courantes, fonds travaux, procedures copro), le pre-etat date / etat date prime sur le compromis (chiffres a date plus precise et opposables au syndic).
  * EXCEPTION : pour les diagnostics privatifs (DPE, Carrez, etc.), le DDT prime sur le compromis (le compromis ne fait que reprendre le DDT — donnees techniques expertisees).

REGLES LOI CLIMAT ET RESILIENCE (profil ${p}) :
- DPE G : logement INTERDIT A LA LOCATION depuis le 1er janvier 2025 (loi Climat et Resilience du 22 aout 2021). Baux en cours : interdiction au renouvellement ou reconduction tacite.
- DPE F : logement INTERDIT A LA LOCATION a compter du 1er janvier 2028.
- DPE E : logement INTERDIT A LA LOCATION a compter du 1er janvier 2034.
- DPE F et G : GEL DES LOYERS depuis le 24 aout 2022 — il est interdit d augmenter le loyer lors du renouvellement du bail ou de la remise en location.
- Si profil = investissement locatif ET DPE E, F ou G : TOUJOURS mentionner dans points_vigilance l interdiction de location applicable (actuelle ou a venir) avec la date precise. TOUJOURS mentionner dans avis_verimo l impact concret sur la rentabilite locative (interdiction, gel des loyers, obligation de travaux avant mise en location). Ne pas juste penaliser le score — expliquer pourquoi.
- Si profil = residence principale : ces interdictions de location ne concernent pas l acheteur directement. Ne PAS les mentionner dans points_vigilance. Mentionner uniquement dans avis_verimo si le DPE est F ou G : "En cas de revente ou de mise en location future, des travaux de renovation energetique seraient necessaires."

REGLE DPE PETITES SURFACES (arrete du 25 mars 2024) :
- Depuis le 1er juillet 2024, les seuils DPE sont ajustes pour les logements de moins de 40 m2 (coefficient de ponderation sur eau chaude sanitaire et chauffage).
- Si surface du lot < 40 m2 ET DPE classe F ou G ET date du DPE anterieure au 1er juillet 2024 : ajouter dans points_forts "Le DPE de ce logement a ete realise avant la reforme des petites surfaces (juillet 2024). Les nouveaux seuils pourraient ameliorer la classe energetique — un nouveau DPE est recommande."
- Ne PAS modifier le score pour autant — le score est base sur le DPE tel que fourni.

REGLE AUDIT ENERGETIQUE OBLIGATOIRE A LA VENTE :
- Depuis le 1er avril 2023 : audit energetique obligatoire pour la vente de maisons individuelles et immeubles en monopropriete classes F ou G.
- Depuis le 1er janvier 2025 : etendu aux classes E.
- A partir du 1er janvier 2034 : etendu aux classes D.
- NE CONCERNE PAS les appartements en copropriete (lots isoles).
- Si type_bien = "maison" ET DPE E, F ou G : verifier si un audit energetique est present dans les documents fournis. Si absent, ajouter "Audit energetique reglementaire (obligatoire pour la vente d une maison classee E/F/G)" dans documents_manquants.
- Si type_bien = "appartement" : ne PAS demander d audit energetique — les coproprietes ne sont pas concernees.

REGLES DOCUMENTS SPECIFIQUES MAISON (type_bien = "maison" uniquement) :
- AUDIT_ENERGETIQUE = document distinct du DPE. Indices : titre "Audit energetique reglementaire" ou "Audit energetique", presence de scenarios de travaux (Pack 1 / Pack 2), estimations chiffrees de gain energetique, methodologie reglementaire (loi Climat & Resilience), mention MaPrimeRenov. PEUT etre annexe dans le DDT ou fourni separement. Si fourni separement, classer comme AUDIT_ENERGETIQUE dans documents_analyses (PAS dans DDT ni DIAGNOSTIC).
- ASSAINISSEMENT = rapport de controle SPANC (Service Public d Assainissement Non Collectif). Indices : titre "Rapport de visite SPANC" ou "Diagnostic assainissement non collectif" ou "Controle d installation d assainissement", mention fosse toutes eaux, fosse septique, micro-station, filtre compact, bac a graisses, lit d epandage. Edite par le service public communal (PAS par un diagnostiqueur certifie). Validite 3 ans. Classer comme ASSAINISSEMENT dans documents_analyses.
- Si type_bien = "maison" ET aucun ASSAINISSEMENT detecte ET aucune mention d assainissement collectif (tout-a-l-egout) dans les documents : ajouter "Diagnostic assainissement (SPANC si fosse septique, ou controle communal selon arrete municipal)" dans documents_manquants.
- Si type_bien = "maison" ET aucun TAXE_FONCIERE detecte : ajouter "Taxe fonciere (avis d imposition)" dans documents_manquants.
- Si type_bien = "maison" ET aucun DDT, DPE ou DIAGNOSTIC detecte : ajouter "DDT — Dossier de Diagnostic Technique (DPE, ERP, amiante, plomb, electricite, gaz, termites)" dans documents_manquants.
- historique_travaux : si un document HISTORIQUE_TRAVAUX (devis, facture, attestation d entreprise) est detecte, remplir present=true et extraire entreprise (nom, siret, contact, assurance_decennale), travaux[] (poste, description, montant, date), montant_total, date_plus_recente (la plus recente). garantie_decennale_possible = true UNIQUEMENT si date_plus_recente a moins de 10 ans ET gros oeuvre/equipement indissociable (toiture, charpente, etancheite, chauffage central) — sinon null ; ne JAMAIS affirmer qu elle est active. Reporter AUSSI ces travaux dans travaux.realises[] (label, annee, montant_estime, justificatif=true) pour qu ils soient pris en compte. Si aucun document de travaux : present=false.
- assainissement : remplir present=true si un document ASSAINISSEMENT (SPANC) est fourni. type_reseau = "non_collectif" si fosse/micro-station/SPANC, "collectif" si raccordement au tout-a-l-egout mentionne, null si inconnu. conforme = true/false selon les conclusions du controle (false si non-conformite ou travaux de mise aux normes prescrits). observations = phrase courte. Si raccorde au tout-a-l-egout (collectif), conforme reste null (non applicable).
- servitudes (maison) : extraire les servitudes mentionnees dans le COMPROMIS ou l acte (passage, vue, reseau, urbanisme...) dans lot_achete.compromis.servitudes[]. Une servitude contraignante (droit de passage sur le terrain, ligne electrique, canalisation) est un point a signaler a l acheteur. Mentionner toute contrainte d urbanisme forte (zone protegee, ABF/Architecte des Batiments de France, monument historique, secteur sauvegarde) dans points_vigilance.

RÈGLE ASL / AFUL (structures HORS copropriete) :
- Si un document ASL_CHIFFRES ou ASL_REGLES est detecte, remplir vie_asl.present=true et vie_asl.structures[] (un objet par association). Chaque structure : {"nature_structure":"asl|aful|union","nom_affiche":"nom exact","objet":"ce qu elle gere","gouvernance":{"president":null,"gestion":"benevole|professionnel|null","gestionnaire":null},"cle_repartition":null,"nb_membres":null,"conformite_2004":{"date_creation":null,"statuts_publies":null,"conforme":null},"finances":{"cotisation_annuelle_lot":null,"periodicite":null,"budget_global":null,"fonds_reserve":null,"solde_vendeur":null},"travaux":[{"label":null,"montant":null,"echeance":null,"charge":null}],"voirie_retrocession":null,"cahier_charges":{"present":false,"contraintes_urbanisme":[],"servitudes":[]},"equipements_lourds":[],"points_vigilance":[],"autres_notables":[]}.
- VOCABULAIRE : jamais syndic/tantiemes/fonds ALUR pour l ASL — president/quotes-parts/cotisations. Capter le type EXACT (asl/aful/union) et le vrai nom. Les cotisations ASL sont des charges REELLES en plus de la copro : les integrer au cout annuel en avis_verimo, et en points_vigilance si elevees ou gros travaux a venir. Le score copro (categories) reste calcule comme avant.
- asl_mentionnee : si un document de COPROPRIETE mentionne une ASL/AFUL SANS qu aucun document ASL ne soit fourni, remplir detectee=true, statut="en_place" (existe deja) ou "en_creation" (resolution votant sa creation), source=document. Si "en_place" sans docs : ajouter dans documents_manquants "Documents de l ASL/AFUL (statuts, cahier des charges, PV, cotisations) — a reclamer au vendeur" + un point de vigilance. Si "en_creation" : point de vigilance "Creation d une ASL votee — anticiper cotisations et regles futures". vie_asl.present reste false tant qu aucun doc ASL n est fourni.

REGLES RESUME STRUCTURE (objet "resume" a 5 sections) :
- resume est un OBJET avec 5 cles : le_bien, la_copropriete, performance_energetique, diagnostics_privatifs, gouvernance_finances.
- Chaque cle contient soit un TEXTE TRES COURT (1 a 3 phrases, 50 MOTS MAX) soit null si aucune donnee dans les documents analyses ne permet de renseigner cette section.
- CONCISION STRICTE : chaque section doit tenir en 1-3 phrases MAX, jamais plus. Si tu as beaucoup d information a partager, SELECTIONNE l essentiel et ignore le reste — le detail existe dans les autres onglets du rapport.
- TON STRICTEMENT FACTUEL — zero evaluation. Le resume DECRIT ce que contiennent les documents, il n EVALUE jamais.
- REGLE ANTI-REDONDANCE KPI : les donnees suivantes sont DEJA affichees en gros dans les KPIs de la page synthese — NE PAS les mettre dans le resume en prose (ce serait redondant et alourdit la lecture) :
  * Surface Carrez (deja en KPI)
  * Classe DPE (deja en KPI avec la lettre A-G)
  * Annee de construction (deja en KPI)
  * Charges annuelles lot (deja en KPI)
  * Nombre de lots (deja en KPI)
  * Nombre de travaux votes (deja en KPI)
  EXCEPTION : tu peux mentionner ces donnees en prose UNIQUEMENT si tu y ajoutes un contexte qui apporte du sens (ex: "DPE E lie a la chaudiere collective ancienne" — le "lie a..." justifie la mention). Sinon, ne les redonne pas.
- INTERDIT dans resume : adjectifs evaluatifs ("correct", "preoccupant", "rassurant", "exigeant", "solide", "degrade", "defavorable", "inquietant", "tres bon", "problematique", "satisfaisant"...). Utiliser uniquement des faits mesurables.
- INTERDIT dans resume : mentionner "acheteur", "il faudra", "vous devrez", donner des pistes d action, faire des recommandations.
- INTERDIT dans resume : conclusions type "En conclusion...", "Ce qui constitue...", "Point negatif...", "Principal point...".
- INTERDIT dans resume : enumerations longues de details techniques (numeros ADEME, references documentaires, sous-sections type "liste A et B", detail piece par piece...). Si le detail existe, il est dans les onglets.
- Contenu suggere par section (en restant BREF) :
  * le_bien : composition du lot (appart T2/T3... + annexes cave/parking). Si deja evident par les KPIs, peux mettre null.
  * la_copropriete : nb batiments, type de chauffage, equipements collectifs marquants (ascenseur, gardien). Ne pas redonner nombre de lots et annee (deja en KPI).
  * performance_energetique : type de chauffage (gaz/fioul/electrique), specificites menuiseries SI anomalies. Ne pas redonner la classe DPE seule (deja en KPI).
  * diagnostics_privatifs : synthese ultra-courte type "Amiante, electricite, gaz, termites : aucune anomalie" ou "Anomalie detectee sur l installation electrique". Pas de detail piece par piece.
  * gouvernance_finances : syndic (nom + stabilite), fonds ALUR en euros si notable, impayes copro si notable. Pas de details procedures ou citations longues.
- Si aucun document ne documente une section, mettre null. L UI masquera la section automatiquement.
- Une section peut etre null meme en analyse complete si l information n est pas disponible (ex: pas de DPE uploade -> performance_energetique = null). Une section peut aussi etre null si toute l info utile est deja dans les KPIs et qu il n y a rien a ajouter en contexte.
- EXEMPLES DE BONNE LONGUEUR :
  * le_bien : "Appartement T2 au 3eme etage avec cave en annexe." (13 mots - parfait)
  * la_copropriete : "Immeuble de 110 lots avec 4 ascenseurs et chauffage collectif gaz depuis 2016 (conversion votee apres remplacement fioul). Gardien present en semaine." (24 mots - parfait)
  * performance_energetique : "Chauffage collectif gaz a condensation, fenetres bois double vitrage." (10 mots - parfait)
  * diagnostics_privatifs : "Aucune anomalie detectee sur amiante, electricite, gaz et termites." (10 mots - parfait)
  * gouvernance_finances : "Syndic professionnel stable depuis 2017. Fonds ALUR 17 225 EUR (11,3 % du budget). Impayes copro 16 721 EUR." (19 mots - parfait)
- SI TU DEPASSES 50 MOTS SUR UNE SECTION : coupe. Le detail est dans les onglets.

REGLES AVIS VERIMO STRUCTURE (objet "avis_verimo" a 4 cles) :
- avis_verimo est un OBJET avec 4 cles : verdict, verdict_highlight, contexte, demarches.
- POSITIONNEMENT VERIMO : aide a la decision et a la comprehension des documents, PAS conseiller. Jamais d imperatif, jamais de recommandation directe.

verdict (string, une phrase unique) :
- Lecture globale du dossier. Ton adapte au score :
  * Score <= 6 : formulation tranchee autorisee (ex : "Dossier presentant des risques majeurs, a aborder avec prudence.", "Dossier a eviter en l etat.")
  * Score 7 a 13 : ton neutre factuel (ex : "Dossier comportant plusieurs points d attention significatifs.")
  * Score 14 a 16 : ton neutre positif (ex : "Dossier globalement sain avec quelques points a clarifier.")
  * Score >= 17 : ton positif (ex : "Dossier particulierement solide, peu de points d attention.")
- INTERDIT : "Nous recommandons", "Il faut", "Vous devez", "Je conseille", "Prevoir X euros".
- AUTORISE : "Dossier qui...", "Bien dont...", "Situation ou...", "Profil de copro..."

verdict_highlight (string, 2-4 mots) :
- Le bout de phrase le plus significatif du verdict, que l UI surlignera en couleur.
- Doit etre un sous-ensemble EXACT du verdict (pour permettre le surlignage cote UI).
- Exemple verdict : "Un bien globalement sain mais qui demande de la lucidite sur la trajectoire energetique."
- Exemple verdict_highlight : "globalement sain mais qui demande de la lucidite"

contexte (string, 2-3 phrases) :
- APPORTE UN CADRAGE QUE LE RESUME N APPORTE PAS : quartier, type de copropriete dans son contexte (ancienne francilienne, residence moderne...), trajectoire reglementaire (loi Climat pour DPE faibles, audit energetique pour maisons E/F/G...), marche local si pertinent.
- INTERDIT : reproduire des faits deja dans le resume. Le contexte INTERPRETE, il ne re-constate pas.
- INTERDIT : lister les forts/faibles (deja dans points_forts et points_vigilance).

demarches (array de 2 a 4 elements) :
- Formulation neutre, factuelle. Ce sont des "points a approfondir avant de signer" — pas des recommandations.
- Chaque demarche a deux champs : titre (court, action decrite a l infinitif ou en nom) et description (1-2 phrases explicatives).
- EXEMPLES BONS :
  * titre : "Faire chiffrer la remise aux normes electrique par un professionnel certifie"
    description : "Les anomalies relevees dans le diagnostic electricite necessitent un devis precis. Une remise aux normes d un appartement de cette taille represente generalement 3 000 a 8 000 euros selon l ampleur."
  * titre : "Interroger le syndic sur le calendrier du DTG et du PPT"
    description : "Le DTG est obligatoire pour cette coproprite et a ete reporte en AG 2019. Son contenu conditionne la charge de travaux collectifs des 5 prochaines annees."
- EXEMPLES MAUVAIS (a ne PAS produire) :
  * "Nous recommandons de prevoir 15 000 euros de travaux" (imperatif/conseil direct)
  * "Il faut absolument faire une visite technique" (impératif)
  * "Budgetez la renovation energetique des l achat" (impératif)
- Les ordres de grandeur chiffres sont AUTORISES mais formules comme donnees de marche neutres : "represente generalement X euros", "se situe entre X et Y", jamais "prevoir X euros".
- Adapter le nombre au dossier : dossier simple -> 2 demarches. Dossier complexe -> 4 demarches max.

REGLE ANTI-DOUBLON CRITIQUE entre resume et avis_verimo :
- Le resume DECRIT les faits (ce que contiennent les documents).
- L avis_verimo INTERPRETE (donne une grille de lecture + points a approfondir).
- NE JAMAIS reproduire dans avis_verimo les memes phrases ou les memes enumerations que dans resume.
- Si le resume dit "DPE classe E (302 kWh/m2/an), chauffage collectif fioul", l avis_verimo ne redira PAS cela. Il dira plutot : "Ce profil energetique est typique des coproprietes francilliennes 1960-75, rattrape par la loi Climat."

REGLE ANTI-DOUBLON avec points_forts et points_vigilance :
- Les enumerations "ce qui va / ce qui cloche" sont deja dans points_forts et points_vigilance.
- L avis_verimo ne refait PAS ces listes. Il synthetise en une lecture globale (verdict) + cadrage (contexte) + pistes pour approfondir (demarches).


{"titre":"adresse complete","type_bien":"appartement|maison|maison_copro","annee_construction":null,"score":14.5,"score_niveau":"Bien sain","resume":{"le_bien":null,"la_copropriete":null,"performance_energetique":null,"diagnostics_privatifs":null,"gouvernance_finances":null},"points_forts":[],"points_vigilance":[],"travaux":{"realises":[{"label":"desc","annee":"2021","montant_estime":35000,"justificatif":true}],"votes":[{"label":"desc","annee":"2027","montant_estime":4500,"charge_vendeur":false}],"evoques":[{"label":"desc","annee":null,"montant_estime":null,"precision":"contexte"}],"estimation_totale":null},"finances":{"budget_total_copro":null,"budget_total_copro_annee":null,"charges_annuelles_lot":null,"charges_annuelles_lot_source":null,"cotisation_fonds_travaux_lot_annuelle":null,"fonds_rattaches_lot":{"avance_tresorerie":null,"fonds_travaux_alur":null,"source":null},"fonds_travaux":null,"fonds_travaux_annee":null,"fonds_travaux_statut":"non_mentionne|insuffisant|conforme|bien|excellent|absent","impayes":null,"type_chauffage":null,"chauffage_individuel":null,"eau_chaude_individuelle":null,"taxe_fonciere_annuelle":null,"taxe_fonciere_annee":null,"budgets_historique":null},"procedures":[{"label":"Type","type":"copro_vs_syndic|impayes|contentieux|autre","gravite":"faible|moderee|elevee","message":"Explication claire 2-3 phrases"}],"diagnostics_resume":"resume global","diagnostics":[{"type":"DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|CARREZ|AUTRE","label":"nom complet","perimetre":"lot_privatif|parties_communes","localisation":"localisation","resultat":"resultat avec GES si DPE","presence":"detectee|absence|non_realise","alerte":null,"pieces_detail":null}],"documents_analyses":[{"type":"PV_AG|REGLEMENT_COPRO|APPEL_CHARGES|DPE|DDT|DIAGNOSTIC|COMPROMIS|ETAT_DATE|TAXE_FONCIERE|CARNET_ENTRETIEN|MODIFICATIF_RCP|PRE_ETAT_DATE|DIAGNOSTIC_PARTIES_COMMUNES|FICHE_SYNTHETIQUE|AUDIT_ENERGETIQUE|ASSAINISSEMENT|ASL_CHIFFRES|ASL_REGLES|HISTORIQUE_TRAVAUX|AUTRE","annee":null,"nom":"nom fichier"}],"documents_manquants":[],"asl_mentionnee":{"detectee":false,"statut":null,"source":null},"vie_asl":{"present":false,"structures":[]},"negociation":{"applicable":false,"elements":[]},"vie_copropriete":{"syndic":{"nom":null,"type":"professionnel|benevole","gestionnaire":null,"fin_mandat":null,"tensions_detectees":false,"tensions_detail":null,"statut":null,"sortant":null,"entrant":null,"annee_changement":null,"nb_ags_analysees":null,"historique_changements":[]},"nb_lots_total":null,"nb_lots_detail":{"logements":null,"parkings":null,"caves":null,"commerces":null},"nb_batiments":null,"participation_ag":[{"annee":"2024","copropietaires_presents_representes":"18/24","taux_tantiemes_pct":"72%","quorum_note":null,"quitus":{"soumis":true,"approuve":true,"detail":null}}],"tendance_participation":"Non determinable","analyse_participation":"analyse","travaux_votes_non_realises":[],"appels_fonds_exceptionnels":[],"questions_diverses_notables":[],"dtg":{"present":false,"etat_general":null,"budget_urgent_3ans":null,"budget_total_10ans":null,"travaux_prioritaires":[]},"regles_copro":[{"label":"...","statut":"autorise|interdit|sous_conditions","impact_rp":false,"impact_invest":false}],"carnet_entretien":{"present":false,"date_maj":null,"immatriculation_registre":null,"equipements_copro":{"chauffage_collectif":null,"type_chauffage":null,"eau_chaude_collective":null,"eau_froide_collective":null,"fibre_optique":null,"ascenseur":null},"contrats_entretien":[{"equipement":"...","prestataire":null,"periodicite":null,"date_reconduction":null}],"travaux_realises_carnet":[{"annee":null,"label":"...","entreprise":null,"montant":null}],"travaux_en_cours_votes_carnet":[{"label":"...","date_ag":null,"montant":null}],"diagnostics_parties_communes_carnet":[{"type":"amiante|plomb|termites|ascenseur|autre","date":null,"entreprise":null,"resultat":"negatif|positif|non_effectue","commentaire":null}],"conseil_syndical_carnet":{"date_nomination":null,"nb_membres":null}},"modificatifs_rcp":[{"date_acte":null,"notaire":null,"type_modification":"creation_lot|suppression_lot|changement_usage|mise_a_jour_tantiemes|servitude|fusion_lots|autre","sur_quoi_porte":[{"aspect":"...","detail":"..."}],"impact_acheteur":"...","points_attention":[]}],"fiche_synthetique":{"present":false,"date":null,"fiche_recente":null,"immatriculation_registre":null,"dtg_realise":null,"dtg_date":null,"equipements_collectifs_detail":[]}},"lot_achete":{"quote_part_tantiemes":null,"parties_privatives":[],"impayes_detectes":null,"fonds_travaux_alur":null,"travaux_votes_charge_vendeur":[],"restrictions_usage":[],"points_specifiques":[],"compromis":{"present":false,"type_avant_contrat":null,"date_signature":null,"date_acte_prevue":null,"delai_acte_mois":null,"vendeurs":[],"acheteurs":[],"notaires":[],"agence":null,"bien":{"adresse_complete":null,"reference_cadastrale_principale":null,"type_bien_global":null,"nb_pieces":null,"etage":null,"surface_carrez":null,"usage_declare":null,"lots_cedes":[],"rcp_date_acte":null,"rcp_nb_modificatifs":null,"origine_propriete":{"date_acquisition_vendeur":null,"mode_acquisition":null}},"finances":{"prix_net_vendeur":null,"prix_mobilier":null,"honoraires_agence":null,"honoraires_charge":null,"honoraires_pct":null,"prix_total_acte":null,"depot_garantie_montant":null,"depot_garantie_pct":null,"depot_garantie_detenteur":null,"prorata_taxe_fonciere":null,"clause_penale_pct":null,"frais_notaire_estimes_verimo":null,"frais_notaire_pct_verimo":null,"cout_total_estime_acheteur_verimo":null},"financement":{"modalite":null,"apport":null,"montant_pret_max":null,"duree_pret_max_mois":null,"taux_pret_max_pct":null,"etablissement_pressenti":null},"conditions_suspensives":[],"calendrier":[],"droits_preemption":[],"diagnostics_annexes":[],"annexes_copropriete_l721_2":null,"copropriete_finances_synthese":null,"situation_locative":null,"clauses_critiques":[],"servitudes":[]}},"pre_etat_date":{"present":false,"date":null,"syndic":null,"impayes_vendeur":0,"fonds_travaux_alur":null,"fonds_travaux_ancien":null,"fonds_roulement_acheteur":null,"fonds_roulement_modalite":"remboursement_vendeur|reconstitution_syndicat","honoraires_syndic":null,"charges_futures":{"montant_trimestriel":null,"fonds_travaux_trimestriel":null,"montant_annuel":null},"travaux_charge_vendeur":[],"procedures_contre_vendeur":[],"procedures_copro":"neant|en_cours","impayes_copro_global":null,"dette_fournisseurs":null,"fonds_travaux_copro_global":null,"historique_charges":[{"exercice":"N-1","annee":null,"budget_appele":null,"charges_reelles":null,"provisions_hors_budget":null},{"exercice":"N-2","annee":null,"budget_appele":null,"charges_reelles":null,"provisions_hors_budget":null}]},"dpe_recommandations":{"present":false,"format":"standard|ancien|aucune","version_methode":"3CL_2021|3CL_2012|factures|inconnue","evolution_etiquette":{"actuelle":{"classe":null,"kwh_m2":null,"ges_kg_m2":null},"apres_pack_1":{"classe":null,"kwh_m2":null,"ges_kg_m2":null},"apres_pack_1_et_2":{"classe":null,"kwh_m2":null,"ges_kg_m2":null}},"pack_1":{"cout_min":null,"cout_max":null,"travaux":[{"poste":"mur|toiture|plancher_bas|fenetres|porte|chauffage|eau_chaude|ventilation|autre","description":"...","performance_cible":null,"decision_copropriete":false,"autorisation_urbanisme":false}]},"pack_2":{"cout_min":null,"cout_max":null,"travaux":[{"poste":"mur|toiture|plancher_bas|fenetres|porte|chauffage|eau_chaude|ventilation|autre","description":"...","performance_cible":null,"decision_copropriete":false,"autorisation_urbanisme":false}]}},"historique_travaux":{"present":false,"entreprise":{"nom":null,"siret":null,"contact":null,"assurance_decennale":null},"travaux":[{"poste":null,"description":null,"montant":null,"date":null}],"montant_total":null,"date_plus_recente":null,"garantie_decennale_possible":null},"assainissement":{"present":false,"type_reseau":"collectif|non_collectif|null","conforme":null,"date_controle":null,"observations":null},"categories":{"travaux":{"note":4,"note_max":5},"procedures":{"note":4,"note_max":4},"finances":{"note":3,"note_max":4},"diags_privatifs":{"note":2,"note_max":4},"diags_communs":{"note":1.5,"note_max":3}},"avis_verimo":{"verdict":"phrase unique de lecture globale","verdict_highlight":"2-4 mots cles du verdict","contexte":"2-3 phrases de cadrage (quartier, type de copro, trajectoire reglementaire) — PAS de constat deja dans resume ou points_forts/vigilance","demarches":[{"titre":"point a approfondir ou question a poser","description":"1-2 phrases explicatives. Formulation neutre : jamais d imperatif, jamais de conseil direct."}]}}`;
}

// Attend que le status soit files_ready puis lance l'analyse
async function waitAndRun(analyseId: string, supabaseAdmin: SupabaseClient, apiKey: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const { data } = await supabaseAdmin.from('analyses').select('status').eq('id', analyseId).single();
    const status = data?.status || '';
    console.log(`[analyser-run] Check ${i+1}/30 — status:${status}`);
    if (status === 'files_ready') {
      console.log(`[analyser-run] files_ready confirme — lancement analyse`);
      await runAnalyse(analyseId, supabaseAdmin, apiKey);
      return;
    }
    if (status === 'completed' || status === 'failed') {
      console.log(`[analyser-run] Status final ${status} — abandon`);
      return;
    }
  }
  console.warn(`[analyser-run] Timeout 120s sans files_ready — abandon`);
}

// Version directe avec fileIds passés en paramètre (pas de lecture Supabase)
async function runAnalyseWithData(
  analyseId: string,
  files: Array<{ id: string; name: string }>,
  mode: string,
  profil: string,
  supabaseAdmin: SupabaseClient,
  apiKey: string,
  existingReport?: Record<string, unknown>,
  complementDocNames?: string[],
  typeBienDeclare?: string | null,
  fromRetry?: boolean, // 🆕 v9 — true si analyse vient de la queue
): Promise<void> {
  const fileIds = files.map(f => f.id);
  try {
    console.log(`[analyser-run] Analyse ${analyseId} — ${files.length} docs | mode:${mode} | typeDeclare:${typeBienDeclare || 'null'}`);

    const userContent: unknown[] = [];

    // ══════════════════════════════════════════════════════════
    // MODE COMPLEMENT : injecter le rapport existant en premier
    // ══════════════════════════════════════════════════════════
    if (mode === 'complement' && existingReport) {
      userContent.push({
        type: 'text',
        text: `RAPPORT EXISTANT (JSON) — Ce rapport a été généré à partir de documents que tu ne peux plus lire. Utilise ces données comme base et fusionne-les avec les nouveaux documents ci-dessous.\n\n${JSON.stringify(existingReport)}`,
      });
      userContent.push({
        type: 'text',
        text: `\n--- NOUVEAUX DOCUMENTS À INTÉGRER (${files.length}) ---\n`,
      });
    }

    for (let i = 0; i < files.length; i++) {
      userContent.push({ type: 'document', source: { type: 'file', file_id: files[i].id } });
      userContent.push({ type: 'text', text: `[Document ${i + 1}/${files.length} : ${files[i].name}]` });
    }

    if (mode === 'complement') {
      userContent.push({
        type: 'text',
        text: `Fusionne le rapport existant avec ces ${files.length} nouveau(x) document(s). Produis un rapport complet mis à jour au même format JSON. CONSERVE toutes les données existantes et ENRICHIS-les avec les nouvelles informations. Recalcule le score /20. JSON COMPLET et valide, sans troncature.`,
      });
    } else {
      userContent.push({
        type: 'text',
        text: files.length === 1
          ? 'Analyse ce document en profondeur. JSON COMPLET et valide, sans troncature.'
          : `Voici les ${files.length} documents du dossier. Analyse-les ensemble de facon exhaustive. JSON COMPLET et valide, sans troncature.`,
      });
    }

    const progressMsg = mode === 'complement'
      ? 'Mise à jour du rapport en cours...'
      : 'Analyse approfondie en cours...';
    await supabaseAdmin.from('analyses').update({ progress_message: progressMsg }).eq('id', analyseId);
    console.log(`[analyser-run] Appel Claude — ${files.length} doc(s) | mode:${mode}`);

    let msgCount = 0;
    const progressMessages = mode === 'complement'
      ? [
          'Lecture des nouveaux documents...',
          'Croisement avec le rapport existant...',
          'Croisement avec le rapport existant...',
          'Mise à jour des données...',
          'Mise à jour des données...',
          'Recalcul du score...',
          'Rédaction du rapport mis à jour...',
          'Rédaction du rapport mis à jour...',
          'Dernières vérifications...',
          'Finalisation...',
        ]
      : [
          'Traitement sécurisé de vos documents...',
          'Lecture approfondie en cours...',
          'Lecture approfondie en cours...',
          'Analyse des éléments clés...',
          'Analyse des éléments clés...',
          'Analyse des éléments clés...',
          'Rédaction du rapport en cours...',
          'Rédaction du rapport en cours...',
          'Dernières vérifications...',
          'Finalisation en cours...',
        ];
    const progressInterval = setInterval(async () => {
      const msg = progressMessages[Math.min(msgCount, progressMessages.length - 1)];
      msgCount++;
      await supabaseAdmin.from('analyses').update({ progress_message: msg }).eq('id', analyseId);
    }, 40_000);

    let result = await callAI({ system: buildSystemPrompt(mode, profil, typeBienDeclare), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
    clearInterval(progressInterval);
    let report = result.error ? null : parseJson<Record<string, unknown>>(result.text);

    if (!result.error && !report) {
      console.warn('[analyser-run] JSON invalide — retry 5s');
      await sleep(5000);
      result = await callAI({ system: buildSystemPrompt(mode, profil, typeBienDeclare), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
      report = result.error ? null : parseJson<Record<string, unknown>>(result.text);
    }

    // 🆕 RETRY CIBLE DPE/CARREZ — Avant suppression RGPD car on a encore besoin des fileIds.
    // Filet de sécurité si l'IA a oublié des détails critiques (1 seul appel max, non bloquant).
    if (mode !== 'document' && report && !result.error) {
      try {
        report = await retryDpeCarrez(report as RapportShape, fileIds, apiKey) as Record<string, unknown>;
      } catch (e) {
        console.error('[analyser-run] retryDpeCarrez erreur (non bloquant):', e);
      }
    }

    console.log(`[analyser-run] Suppression RGPD de ${fileIds.length} fichier(s)`);
    await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));

    if (result.error || !report) {
      if (result.error === 'api_billing') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'api_billing', 'Notre service rencontre un problème technique. Notre équipe est informée. Votre crédit a été remboursé automatiquement.', 'Solde API épuisé — analyses bloquées', 'critical');
      } else if (result.error === 'rate_limit') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'rate_limit', 'Notre outil est momentanément surchargé. Votre crédit a été remboursé automatiquement. Réessayez dans 2 à 3 minutes.', 'Rate limit atteint');
      } else if (result.error === 'overload') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'overload', 'Notre outil est temporairement indisponible. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.', 'Serveur surchargé');
      } else if (result.error && result.error.startsWith('api_error_5')) {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'api_error', 'Notre outil rencontre une perturbation temporaire. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.', 'Erreur serveur API');
      } else if (result.error === 'timeout') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'timeout', 'La génération du rapport a pris trop de temps. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.', 'Timeout (appel moteur trop long)');
      } else {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'analysis_failed', 'Une erreur est survenue lors de la génération. Votre crédit a été remboursé automatiquement. Réessayez ou contactez le support.', 'Échec génération rapport');
      }
      return;
    }

    // ══════════════════════════════════════════════════════════
    // RECALCUL DETERMINISTE DES NOTES DE CATEGORIES
    // (uniquement pour les modes complete et complement qui produisent
    //  la structure complete avec categories)
    // ══════════════════════════════════════════════════════════
    if (mode !== 'document') {
      try {
        report = recalculerCategories(report as RapportShape, profil) as Record<string, unknown>;
      } catch (e) {
        console.error('[analyser-run] Erreur recalcul categories (non bloquant):', e);
      }

      // 🆕 VALIDATION DETERMINISTE DES DIAGS OBLIGATOIRES MANQUANTS
      // Ajoute dans documents_manquants + points_vigilance les diagnostics absents
      // selon le type de bien et l'année. Non bloquant.
      try {
        report = validateDiagsManquants(report as RapportShape) as Record<string, unknown>;
      } catch (e) {
        console.error('[analyser-run] validateDiagsManquants erreur (non bloquant):', e);
      }
    }

    // avis_verimo peut etre string (ancien format, simple) ou objet (nouveau format, complete)
    // En DB on stocke une version string pour retrocompat des ecrans listing/admin
    let avisVerimoForDb: string | null = null;
    const av = report.avis_verimo;
    if (typeof av === 'string') {
      avisVerimoForDb = av || null;
    } else if (av && typeof av === 'object') {
      const verdict = (av as Record<string, unknown>).verdict;
      avisVerimoForDb = typeof verdict === 'string' ? verdict : null;
    }

    const updateData: Record<string, unknown> = {
      status: 'completed',
      progress_current: files.length,
      progress_total: files.length,
      progress_message: mode === 'complement' ? 'Rapport mis \u00e0 jour !' : 'Rapport pr\u00eat !',
      file_ids: [],
      title: (report.titre as string) || 'Analyse immobili\u00e8re',
      score: (report.score as number) ?? null,
      avis_verimo: avisVerimoForDb,
      result: report,
      paid: true,
    };

    // Deadline 7 jours pour compléter le dossier (analyses complètes uniquement)
    if (mode !== 'complement' && mode !== 'document') {
      const dl = new Date(); dl.setDate(dl.getDate() + 7);
      updateData.regeneration_deadline = dl.toISOString();
    }

    // ══════════════════════════════════════════════════════════
    // MODE COMPLEMENT : stocker la date et les noms des docs ajoutés
    // ══════════════════════════════════════════════════════════
    if (mode === 'complement') {
      updateData.complement_date = new Date().toISOString();
      updateData.complement_doc_names = complementDocNames || files.map(f => f.name);
    }

    const { error: updateError } = await supabaseAdmin.from('analyses').update(updateData).eq('id', analyseId);
    if (updateError) {
      console.error('[analyser-run] ERREUR UPDATE:', updateError.message);
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'save_error', 'Erreur lors de la sauvegarde du rapport. Votre crédit a été remboursé automatiquement. Contactez le support.', 'Erreur sauvegarde rapport');
    } else {
      console.log(`[analyser-run] ${analyseId} termin\u00e9e avec succ\u00e8s (mode: ${mode}).`);
      // 🆕 Livraison 2 : Notification cloche systématique en fin d'analyse réussie
      // (Le mail est envoyé uniquement aux particuliers — voir notifyAnalysisReady)
      await notifyAnalysisReady(supabaseAdmin, analyseId);
    }
  } catch (err) {
    console.error('[analyser-run] Erreur:', err);
    if (fileIds.length > 0) await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));
    await handleAnalyseFailure(supabaseAdmin, analyseId, 'unexpected_error', 'Erreur inattendue. Votre crédit a été remboursé automatiquement. Contactez le support.', 'Erreur inattendue analyse');
  }
}

async function runAnalyse(analyseId: string, supabaseAdmin: SupabaseClient, apiKey: string): Promise<void> {
  const fileIds: string[] = [];
  try {
    const { data: analyse, error } = await supabaseAdmin
      .from('analyses')
      .select('file_ids, mode, profil, type_bien_declare')
      .eq('id', analyseId)
      .single();

    if (error || !analyse) { console.error('[analyser-run] Analyse introuvable:', error); return; }

    const files = (analyse.file_ids as Array<{ id: string; name: string }>) || [];
    const mode = (analyse.mode as string) || 'complete';
    const profil = (analyse.profil as string) || 'rp';
    const typeBienDeclare = (analyse.type_bien_declare as string) || null;

    if (files.length === 0) {
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'no_files', 'Aucun fichier trouvé. Votre crédit a été remboursé automatiquement. Réessayez.', 'Aucun fichier trouvé');
      return;
    }

    console.log(`[analyser-run] Analyse ${analyseId} — ${files.length} docs | mode:${mode}`);
    files.forEach(f => fileIds.push(f.id));

    const userContent: unknown[] = [];
    for (let i = 0; i < files.length; i++) {
      userContent.push({ type: 'document', source: { type: 'file', file_id: files[i].id } });
      userContent.push({ type: 'text', text: `[Document ${i + 1}/${files.length} : ${files[i].name}]` });
    }
    userContent.push({
      type: 'text',
      text: files.length === 1
        ? 'Analyse ce document en profondeur. JSON COMPLET et valide, sans troncature.'
        : `Voici les ${files.length} documents du dossier. Analyse-les ensemble de facon exhaustive. JSON COMPLET et valide, sans troncature.`,
    });

    await supabaseAdmin.from('analyses').update({ progress_message: 'Analyse approfondie en cours...' }).eq('id', analyseId);
    console.log(`[analyser-run] Appel Claude — ${files.length} doc(s)`);

    let msgCount = 0;
    const progressMessages = [
      'Traitement sécurisé de vos documents...',
      'Lecture approfondie en cours...',
      'Lecture approfondie en cours...',
      'Analyse des éléments clés...',
      'Analyse des éléments clés...',
      'Analyse des éléments clés...',
      'Rédaction du rapport en cours...',
      'Rédaction du rapport en cours...',
      'Dernières vérifications...',
      'Finalisation en cours...',
    ];
    const progressInterval = setInterval(async () => {
      const msg = progressMessages[Math.min(msgCount, progressMessages.length - 1)];
      msgCount++;
      await supabaseAdmin.from('analyses').update({ progress_message: msg }).eq('id', analyseId);
    }, 40_000);

    let result = await callAI({ system: buildSystemPrompt(mode, profil, typeBienDeclare), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
    clearInterval(progressInterval);
    let report = result.error ? null : parseJson<Record<string, unknown>>(result.text);

    if (!result.error && !report) {
      console.warn('[analyser-run] JSON invalide — retry 5s');
      await sleep(5000);
      result = await callAI({ system: buildSystemPrompt(mode, profil, typeBienDeclare), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
      report = result.error ? null : parseJson<Record<string, unknown>>(result.text);
    }

    // 🆕 RETRY CIBLE DPE/CARREZ — Avant suppression RGPD (non bloquant).
    if (mode !== 'document' && report && !result.error) {
      try {
        report = await retryDpeCarrez(report as RapportShape, fileIds, apiKey) as Record<string, unknown>;
      } catch (e) {
        console.error('[analyser-run] retryDpeCarrez erreur (non bloquant):', e);
      }
    }

    console.log(`[analyser-run] Suppression RGPD de ${fileIds.length} fichier(s)`);
    await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));

    if (result.error || !report) {
      if (result.error === 'api_billing') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'api_billing', 'Notre service rencontre un problème technique. Notre équipe est informée. Votre crédit a été remboursé automatiquement.', 'Solde API épuisé — analyses bloquées', 'critical');
      } else if (result.error === 'rate_limit') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'rate_limit', 'Notre outil est momentanément surchargé. Votre crédit a été remboursé automatiquement. Réessayez dans 2 à 3 minutes.', 'Rate limit atteint');
      } else if (result.error === 'overload') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'overload', 'Notre outil est temporairement indisponible. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.', 'Serveur surchargé');
      } else if (result.error && result.error.startsWith('api_error_5')) {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'api_error', 'Notre outil rencontre une perturbation temporaire. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.', 'Erreur serveur API');
      } else if (result.error === 'timeout') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'timeout', 'La génération du rapport a pris trop de temps. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.', 'Timeout (appel moteur trop long)');
      } else {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'analysis_failed', 'Une erreur est survenue lors de la génération. Votre crédit a été remboursé automatiquement. Réessayez ou contactez le support.', 'Échec génération rapport');
      }
      return;
    }

    // ══════════════════════════════════════════════════════════
    // RECALCUL DETERMINISTE DES NOTES DE CATEGORIES
    // ══════════════════════════════════════════════════════════
    if (mode !== 'document') {
      try {
        report = recalculerCategories(report as RapportShape, profil) as Record<string, unknown>;
      } catch (e) {
        console.error('[analyser-run] Erreur recalcul categories (non bloquant):', e);
      }

      // 🆕 VALIDATION DETERMINISTE DES DIAGS OBLIGATOIRES MANQUANTS
      try {
        report = validateDiagsManquants(report as RapportShape) as Record<string, unknown>;
      } catch (e) {
        console.error('[analyser-run] validateDiagsManquants erreur (non bloquant):', e);
      }
    }

    const updateData: Record<string, unknown> = {
      status: 'completed',
      progress_current: files.length,
      progress_total: files.length,
      progress_message: 'Rapport pr\u00eat !',
      file_ids: [],
      title: (report.titre as string) || 'Analyse immobili\u00e8re',
      score: (report.score as number) ?? null,
      avis_verimo: (report.avis_verimo as string) || null,
      result: report,
      paid: true,
    };

    // Deadline 7 jours pour compléter le dossier
    if (mode !== 'document') {
      const dl = new Date(); dl.setDate(dl.getDate() + 7);
      updateData.regeneration_deadline = dl.toISOString();
    }

    const { error: updateError } = await supabaseAdmin.from('analyses').update(updateData).eq('id', analyseId);
    if (updateError) {
      console.error('[analyser-run] ERREUR UPDATE:', updateError.message);
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'save_error', 'Erreur lors de la sauvegarde du rapport. Votre crédit a été remboursé automatiquement. Contactez le support.', 'Erreur sauvegarde rapport');
    } else {
      console.log(`[analyser-run] ${analyseId} termin\u00e9e avec succ\u00e8s.`);
      // 🆕 Livraison 2 : Notification cloche systématique en fin d'analyse réussie
      await notifyAnalysisReady(supabaseAdmin, analyseId);
    }
  } catch (err) {
    console.error('[analyser-run] Erreur:', err);
    if (fileIds.length > 0) await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));
    await handleAnalyseFailure(supabaseAdmin, analyseId, 'unexpected_error', 'Erreur inattendue. Votre crédit a été remboursé automatiquement. Contactez le support.', 'Erreur inattendue analyse');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) return new Response(JSON.stringify({ error: 'config_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    console.log('[analyser-run] Payload:', JSON.stringify(body).slice(0, 300));

    const analyseId = body?.record?.id || body?.analyseId;
    if (!analyseId) return new Response(JSON.stringify({ error: 'missing_id' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const isDirectCall = !body?.record;
    const isWebhook = !!body?.record;

    if (isWebhook) {
      console.log(`[analyser-run] Webhook ignore`);
      return new Response(JSON.stringify({ skipped: 'webhook' }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const fileIds = body?.fileIds as Array<{ id: string; name: string }> || [];
    const mode = body?.mode as string || 'complete';
    const profil = body?.profil as string || 'rp';
    const typeBienDeclare = (body?.typeBienDeclare as string) || null;
    const existingReport = body?.existingReport as Record<string, unknown> | undefined;
    const complementDocNames = body?.complementDocNames as string[] | undefined;
    const fromRetry = body?.fromRetry === true; // 🆕 v9 — flag retry depuis la queue

    if (!fileIds.length) {
      console.error(`[analyser-run] Pas de fileIds dans le payload`);
      return new Response(JSON.stringify({ error: 'no_file_ids' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    console.log(`[analyser-run] Lancement — ${fileIds.length} docs | mode:${mode} | typeDeclare:${typeBienDeclare || 'null'} | fromRetry:${fromRetry}`);
    EdgeRuntime.waitUntil(runAnalyseWithData(analyseId, fileIds, mode, profil, supabaseAdmin, apiKey, existingReport, complementDocNames, typeBienDeclare, fromRetry));

    return new Response(JSON.stringify({ success: true, analyseId }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[analyser-run] Erreur handler:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
