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

// Message écrit dans progress_message quand un COMPLÉMENT échoue (le rapport d'origine est restauré).
// ⚠️ MIROIR EXACT : la même chaîne existe dans analyser/index.ts, watchdog-stuck-analyses/index.ts,
// et le préfixe est détecté côté front dans analyse-client.ts (pollAnalyseStatus) et RapportPage.tsx.
const COMPLEMENT_FAILED_MSG = 'La mise à jour du dossier n\'a pas abouti — votre rapport d\'origine est conservé. Vous pouvez réessayer via « Compléter mon dossier ».';

// ══════════════════════════════════════════════════════════════
// 🗺️ SEUIL MAP-REDUCE — analyses complètes uniquement
// ≤ SEUIL-1 docs → single-call v7 (inchangé)
// ≥ SEUIL docs   → MAP (extraction par doc en parallèle) + REDUCE (synthèse)
// INTERRUPTEUR D'URGENCE : mettre 9999 pour désactiver le MAP-REDUCE
// et faire repasser 100% des dossiers par le v7. Redéployer après modif.
// ══════════════════════════════════════════════════════════════
const SEUIL_MAP_REDUCE = 6;
const MAP_MAX_TOKENS = 32000;      // sortie max par extraction — large pour les gros PV d'AG (JSON tronqué sinon)
const MAP_TIMEOUT_MS = 350000;     // 350s par extraction — les gros docs (PV AG, RCP) ont besoin de 3-4 min pour écrire leur extraction complète. Tout est parallèle : l'invocation dure au pire 350s + sauvegarde, sous les 400s. NE PAS remonter au-dessus de 370000.
const MAP_RETRY_WINDOW_MS = 60000; // retry uniquement si le 1er essai a échoué en moins de 60s (échec rapide type JSON malformé) — un essai long ne laisse pas le budget pour un 2ème

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
  score_niveau?: string;
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
    dtg?: { present?: boolean; etat_general?: string; budget_urgent_3ans?: number | null; budget_total_10ans?: number | null };
    syndic?: { statut?: string };
    participation_ag?: Array<{ quitus?: { soumis?: boolean; approuve?: boolean } }>;
  };
  pre_etat_date?: { present?: boolean; impayes_vendeur?: number };
  categories?: Record<string, { note: number; note_max: number }>;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// Grille officielle des niveaux — MIROIR EXACT de getScoreLabel() dans
// RapportPage.tsx / RapportPrintPage.tsx. Toute modification doit être
// répercutée aux trois endroits.
function getScoreNiveau(score: number): string {
  if (score >= 17) return 'Bien irréprochable';
  if (score >= 14) return 'Bien sain';
  if (score >= 10) return 'Bien correct avec réserves';
  if (score >= 7) return 'Bien risqué';
  return 'Bien à éviter';
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
    // Annee inconnue = on ne reclame RIEN. Avant, `!anneeNum ||` rendait le
    // diagnostic electrique obligatoire des que l'annee n'avait pas ete extraite :
    // -0,75 point sur une hypothese. Et le seuil (2010) ne correspondait pas a
    // celui de la checklist (2011), donc le rapport pouvait signaler un document
    // manquant sans que la note ne bouge, ou l'inverse.
    if (anneeNum && anneeNum < REGLES.ANNEE_ELEC) requis.push('ELECTRICITE');
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
  return { ...rapport, score: scoreMaison, score_niveau: getScoreNiveau(scoreMaison), categories: categoriesRecalculees };
}

/* ══════════════════════════════════════════════════════════════
   🔢 COMPTAGE DETERMINISTE DES LOTS (code, pas IA)
   ──────────────────────────────────────────────────────────────
   Meme principe que le recalcul du score plus bas : le moteur
   TRANSCRIT la liste (il sait faire, c est de la recopie), le CODE
   COMPTE (il ne se trompe jamais). Un modele de langage n est pas
   fiable pour tenir un compteur exact sur 39 entrees reparties sur
   15 pages — c est structurel, aucune consigne ne le corrige.

   Deux filtres tuent les faux lots observes en production :
     • entree SANS numero  → artefact de saut de page (bloc orphelin
       type "Jouissance de la partie du jardin... 1.211/10.000emes"
       qui est la fin du lot precedent) → ignoree
     • numero deja vu      → doublon de report de page → ignore

   SECURITE : retourne null si la liste est absente ou vide. Les
   rapports sans lots_enumeres gardent exactement le comportement
   actuel — aucune regression possible.
══════════════════════════════════════════════════════════════ */
type LotEnumere = { numero?: string | number | null; designation?: string | null; categorie?: string | null; tantiemes?: string | null };

const CATEGORIES_LOTS = ['logements', 'maisons', 'chambres_service', 'parkings', 'caves', 'commerces', 'autres'];

// Classement de secours si "categorie" est absente ou hors liste.
function classerLotParDesignation(designation: string): string {
  const d = (designation || '').toLowerCase();
  if (/\bcave\b|\bcaves\b/.test(d)) return 'caves';
  if (/parking|emplacement de voiture|emplacement voiture|\bgarage|\bbox\b|stationnement/.test(d)) return 'parkings';
  if (/chambre de service|chambre de bonne|chambre avec salle d|chambre isolee/.test(d)) return 'chambres_service';
  if (/commerce|boutique|local commercial|local professionnel/.test(d)) return 'commerces';
  if (/\bmaison\b|pavillon/.test(d)) return 'maisons';
  if (/appartement|logement|studio/.test(d)) return 'logements';
  return 'autres';
}

/* ══════════════════════════════════════════════════════════════
   ♻️ LOTS REMPLACÉS PAR UN MODIFICATIF
   ──────────────────────────────────────────────────────────────
   Quand un modificatif divise un lot (un duplex devient deux
   appartements, une cave devient "7" et "7 bis"), les nouveaux lots
   sont numerotes A LA SUITE. L'etat descriptif d'origine et le
   modificatif coexistent dans le meme acte : le lot d'origine ET ses
   remplacants figurent tous les deux, et la liste compte double.

   Le document donne lui-meme la reponse : les tantiemes de TOUS les
   lots font toujours le denominateur (100000/100000). Si la somme
   depasse, l'excedent vaut EXACTEMENT les tantiemes des lots
   remplaces. On les identifie donc par le calcul, pas au jugement.

   Cas reel : 42 lots pour 120023/100000. Excedent 20023 = le duplex
   (19973) + une cave (50). Retires => 40 lots, 100000/100000, soit
   le chiffre annonce par le pre-etat date du syndic.
══════════════════════════════════════════════════════════════ */
function retirerLotsRemplaces(lots: LotEnumere[]): { gardes: LotEnumere[]; retires: LotEnumere[]; somme: number; denominateur: number | null } {
  const parse = (l: LotEnumere): { num: number; den: number } | null => {
    const t = typeof l?.tantiemes === 'string' ? l.tantiemes.replace(/\s/g, '') : '';
    const m = t.match(/^(\d+)\s*\/\s*(\d+)$/);
    return m ? { num: parseInt(m[1], 10), den: parseInt(m[2], 10) } : null;
  };

  const parsed = lots.map(l => ({ lot: l, t: parse(l) }));
  if (parsed.some(x => !x.t)) return { gardes: lots, retires: [], somme: 0, denominateur: null }; // tantiemes incomplets → on ne touche a rien

  const den = parsed[0].t!.den;
  if (!den || parsed.some(x => x.t!.den !== den)) return { gardes: lots, retires: [], somme: 0, denominateur: null };

  const somme = parsed.reduce((a, x) => a + x.t!.num, 0);
  const excedent = somme - den;
  if (excedent <= 0) return { gardes: lots, retires: [], somme, denominateur: den };

  // Les lots d'origine portent les numeros les plus bas : on les teste en premier.
  const tries = [...parsed].sort((a, b) => Number(a.lot.numero ?? 0) - Number(b.lot.numero ?? 0));
  const chercher = (taille: number): typeof tries | null => {
    const rec = (start: number, reste: number, acc: typeof tries): typeof tries | null => {
      if (reste === 0) return acc;
      if (acc.length === taille || start >= tries.length) return null;
      for (let i = start; i < tries.length; i++) {
        if (tries[i].t!.num > reste) continue;
        const r = rec(i + 1, reste - tries[i].t!.num, [...acc, tries[i]]);
        if (r) return r;
      }
      return null;
    };
    return rec(0, excedent, []);
  };

  for (let taille = 1; taille <= 3; taille++) {
    const trouve = chercher(taille);
    if (trouve) {
      const aRetirer = new Set(trouve.map(x => x.lot));
      const gardes = lots.filter(l => !aRetirer.has(l));
      console.log(`[analyser-run] ♻️ Modificatif détecté — ${somme}/${den}, excédent ${excedent} = lot(s) n°${trouve.map(x => x.lot.numero).join(', n°')} remplacé(s). ${lots.length} → ${gardes.length} lots.`);
      return { gardes, retires: trouve.map(x => x.lot), somme, denominateur: den };
    }
  }
  console.warn(`[analyser-run] ⚠️ Tantièmes ${somme}/${den} (excédent ${excedent}) — aucun lot ne l'explique, liste conservée telle quelle`);
  return { gardes: lots, retires: [], somme, denominateur: den };
}

function recompterLots(
  lots: unknown,
  totalAnnonce: number | null,
): { detail: Record<string, number>; total: number; nbTranscrits: number; tantiemesJustes: boolean; tantiemesVerifiables: boolean; sommeTantiemes: number; denominateur: number | null; horsPlage: number; nonClasses: number } | null {
  if (!Array.isArray(lots) || lots.length === 0) return null;

  // ♻️ Retirer d'abord les lots remplaces par un modificatif : sans ca, un lot
  // divise est compte deux fois (l'original + ses remplacants).
  const nettoyage = retirerLotsRemplaces(lots as LotEnumere[]);
  lots = nettoyage.gardes;

  const detail: Record<string, number> = {
    logements: 0, maisons: 0, chambres_service: 0,
    parkings: 0, caves: 0, commerces: 0, autres: 0,
  };
  const numerosVus = new Set<string>();
  const horsPlage: number[] = [];
  let nonClasses = 0;

  for (const brut of lots as LotEnumere[]) {
    if (!brut || typeof brut !== 'object') continue;

    const numero = brut.numero != null ? String(brut.numero).replace(/[^0-9]/g, '') : '';
    if (!numero) continue;                 // filtre 1 : pas de numero = pas un lot
    if (numerosVus.has(numero)) continue;  // filtre 2 : doublon de report de page
    // filtre 3 : hors de la plage annoncee par le document. Un etat descriptif
    // francais numerote ses lots de 1 a N sans trou. Si l acte ecrit "divise en
    // 38 lots numerotes de 1 a 38", un lot n°41 n existe pas — c est un doublon
    // de la description en prose (frequent : le RCP decrit les lots deux fois,
    // en prose puis en tableau, et les deux ne comptent pas la meme chose).
    const n = parseInt(numero, 10);
    if (totalAnnonce && (n < 1 || n > totalAnnonce)) { horsPlage.push(n); continue; }
    numerosVus.add(numero);

    const catFournie = brut.categorie && CATEGORIES_LOTS.includes(brut.categorie) ? brut.categorie : null;
    const catDeduite = catFournie ?? classerLotParDesignation(String(brut.designation || ''));
    // Un lot classe "autres" SANS categorie fournie et SANS designation exploitable
    // n'est pas classe : c'est un echec, pas un resultat. On le compte a part.
    if (!catFournie && catDeduite === 'autres' && !String(brut.designation || '').trim()) nonClasses++;
    detail[catDeduite]++;
  }

  const nbTranscrits = numerosVus.size;
  if (nbTranscrits === 0) return null;
  if (horsPlage.length) console.warn(`[analyser-run] 🚫 Lots hors plage 1-${totalAnnonce} ignorés : ${horsPlage.join(', ')}`);

  // ── 🔎 VERIFICATION PAR LES TANTIEMES ─────────────────────────────
  // La somme des quotes-parts de TOUS les lots vaut toujours le denominateur
  // (100000/100000, 10000/10000...). C'est le controle qu'un professionnel fait
  // a la main. Si la somme tombe juste, la liste est complete et exacte : aucun
  // lot invente, aucun oublie. Si elle ne tombe pas, on le signale.
  let sommeTantiemes = 0;
  let denominateur: number | null = null;
  let tantiemesLisibles = 0;
  for (const brut of lots as LotEnumere[]) {
    const t = typeof brut?.tantiemes === 'string' ? brut.tantiemes.replace(/\s/g, '') : '';
    const m = t.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!m) continue;
    sommeTantiemes += parseInt(m[1], 10);
    const den = parseInt(m[2], 10);
    if (denominateur === null) denominateur = den;
    else if (denominateur !== den) denominateur = -1; // denominateurs incoherents
    tantiemesLisibles++;
  }
  const tantiemesVerifiables = denominateur !== null && denominateur > 0 && tantiemesLisibles === nbTranscrits;
  const tantiemesJustes = tantiemesVerifiables && sommeTantiemes === denominateur;
  if (tantiemesVerifiables) {
    console.log(`[analyser-run] 🔎 Contrôle tantièmes : ${sommeTantiemes}/${denominateur} sur ${nbTranscrits} lots → ${tantiemesJustes ? 'EXACT ✅' : 'ÉCART ⚠️'}`);
  }

  // Filet : si le document annonce PLUS de lots que la liste transcrite,
  // l ecart part dans "autres" plutot que de disparaitre silencieusement.
  let total = nbTranscrits;
  if (totalAnnonce && totalAnnonce > nbTranscrits) {
    detail.autres += totalAnnonce - nbTranscrits;
    total = totalAnnonce;
  }

  return { detail, total, nbTranscrits, tantiemesJustes, tantiemesVerifiables, sommeTantiemes, denominateur, horsPlage: horsPlage.length, nonClasses };
}

/* Applique le recomptage sur un rapport COMPLET (vie_copropriete). */
function appliquerRecomptageComplet(rapport: Record<string, unknown>): void {
  const vie = rapport?.vie_copropriete as Record<string, unknown> | undefined;
  if (!vie) return;
  const totalAnnonce = typeof vie.nb_lots_total === 'number' ? vie.nb_lots_total : null;
  const res = recompterLots(vie.lots_enumeres, totalAnnonce);
  if (!res) return;

  // 🛡️ NE PAS ECRASER UNE BONNE REPARTITION PAR UNE MAUVAISE.
  // Si les lots transcrits n'ont ni "categorie" ni "designation" exploitable, mon
  // recomptage les met tous dans "autres" — c'est un echec de classement, pas un
  // resultat. Observe en production (mode complement) : le moteur proposait
  // 12 caves / 14 parkings / 12 logements, et on ecrasait par 38 "autres".
  const detailIA = vie.nb_lots_detail as Record<string, number> | null | undefined;
  const sommeIA = detailIA && typeof detailIA === 'object'
    ? Object.values(detailIA).reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0) : 0;
  const iaEstVentile = sommeIA > 0 && Object.entries(detailIA ?? {}).some(([k, v]) => k !== 'autres' && typeof v === 'number' && v > 0);
  const recomptageRate = res.nonClasses > res.nbTranscrits / 2;

  if (recomptageRate && iaEstVentile) {
    console.warn(`[analyser-run] 🛡️ Recomptage non concluant (${res.nonClasses}/${res.nbTranscrits} lots sans catégorie ni désignation) — répartition du moteur conservée :`, JSON.stringify(detailIA));
    if (totalAnnonce == null) vie.nb_lots_total = res.total;
  } else {
    console.log(`[analyser-run] 🔢 Lots recomptes (complet) — ${res.nbTranscrits} lots transcrits | total annonce: ${totalAnnonce ?? 'null'} | detail IA remplace:`, JSON.stringify(vie.nb_lots_detail), '=>', JSON.stringify(res.detail));
    vie.nb_lots_detail = res.detail;
  }
  // 🏷️ La repartition est VERIFIEE seulement si le nombre de lots transcrits
  // egale le total annonce par le document, et que les tantiemes tombent juste
  // quand ils sont lisibles. Sinon l'affichage doit le dire au lieu de presenter
  // des barres nettes comme un fait etabli.
  vie.nb_lots_detail_verifie = (totalAnnonce == null || res.nbTranscrits === totalAnnonce)
    && (!res.tantiemesVerifiables || res.tantiemesJustes);
  if (totalAnnonce == null) vie.nb_lots_total = res.total;

  // ⚠️ Desaccord entre le nombre de lots transcrits et le total annonce par le
  // document : l'un des deux est faux. On ne tranche pas a la place du lecteur,
  // on le DIT — un chiffre douteux signale vaut mieux qu'un chiffre faux tu.
  if (totalAnnonce != null && res.nbTranscrits !== totalAnnonce) {
    const msg = `Nombre de lots à vérifier — le règlement annonce ${totalAnnonce} lots mais ${res.nbTranscrits} lots ont été relevés dans l'état descriptif de division. La répartition par type affichée peut donc être imprécise : à recouper avec le tableau récapitulatif du règlement.`;
    const pv = Array.isArray(rapport.points_vigilance) ? rapport.points_vigilance as unknown[] : [];
    if (!pv.some(x => typeof x === 'string' && x.includes('Nombre de lots à vérifier'))) pv.push(msg);
    rapport.points_vigilance = pv;
    console.warn(`[analyser-run] ⚠️ Lots : ${res.nbTranscrits} transcrits vs ${totalAnnonce} annoncés — point de vigilance ajouté`);
  }
  if (res.tantiemesVerifiables && !res.tantiemesJustes) {
    console.warn(`[analyser-run] ⚠️ Tantièmes : somme ${res.sommeTantiemes} ≠ ${res.denominateur} — liste probablement incomplète ou surnuméraire`);
  }
}

/* Applique le recomptage sur une analyse de document seul (RCP). */
function appliquerRecomptageDocument(doc: Record<string, unknown>): void {
  if (!doc || doc.document_type !== 'RCP') return;
  const totalAnnonce = typeof doc.total_lots === 'number' ? doc.total_lots : null;
  const res = recompterLots(doc.lots_enumeres, totalAnnonce);
  if (!res) return;

  const detailDocIA = doc.lots_detail as Record<string, number> | null | undefined;
  const docVentile = detailDocIA && Object.entries(detailDocIA).some(([k, v]) => k !== 'autres' && typeof v === 'number' && v > 0);
  if (res.nonClasses > res.nbTranscrits / 2 && docVentile) {
    console.warn(`[analyser-run] 🛡️ Recomptage RCP non concluant (${res.nonClasses}/${res.nbTranscrits} lots non classables) — répartition du moteur conservée`);
    if (totalAnnonce == null) doc.total_lots = res.total;
    return;
  }
  console.log(`[analyser-run] 🔢 Lots recomptes (RCP document) — ${res.nbTranscrits} lots transcrits | total annonce: ${totalAnnonce ?? 'null'} | detail IA remplace:`, JSON.stringify(doc.lots_detail), '=>', JSON.stringify(res.detail));
  doc.lots_detail = res.detail;
  if (totalAnnonce == null) doc.total_lots = res.total;
}

// ══════════════════════════════════════════════════════════════════════
// 📚 CADRE REGLEMENTAIRE — etat du droit au 28 juillet 2026
// ──────────────────────────────────────────────────────────────────────
// Source unique des seuils utilises par le scoring ET par la checklist.
// Toute evolution legislative se corrige ICI, pas dans dix endroits.
//
// DPE — reforme du 1er janvier 2026 : le coefficient de conversion de
//   l'electricite en energie primaire passe de 2,3 a 1,9. Environ 850 000
//   logements sortent des classes F/G SANS TRAVAUX. Aucune classe ne se
//   degrade. Un DPE etabli avant 2026 sur un logement chauffe a l'electricite
//   est donc potentiellement pessimiste -> point de vigilance, jamais un malus.
// DPE — interdiction de location (loi Climat et Resilience, metropole) :
//   G depuis le 01/01/2025 · F au 01/01/2028 · E au 01/01/2034.
//   Outre-mer : G au 01/01/2028 · F au 01/01/2031.
// AUDIT ENERGETIQUE de vente : maisons individuelles et immeubles en
//   MONOPROPRIETE uniquement. F et G depuis le 01/04/2023, E depuis le
//   01/01/2025, D a partir de 2034. Un appartement en copropriete en est
//   dispense quelle que soit sa classe — c'est pour cela que la regle ne se
//   declenche que sur type_bien = 'maison'.
// PPT (plan pluriannuel de travaux) : obligatoire depuis le 01/01/2025 pour
//   TOUTES les coproprietes de plus de 15 ans, quelle que soit leur taille
//   (deploiement 2023 > 200 lots, 2024 51-200 lots, 2025 <= 50 lots).
// DPE COLLECTIF : depuis le 01/01/2026, obligatoire pour toutes les
//   coproprietes de plus de 15 ans, y compris celles de 50 lots ou moins.
// FONDS DE TRAVAUX (art. 14-2 loi du 10 juillet 1965) : obligatoire pour les
//   immeubles de plus de 10 ans. DOUBLE PLANCHER depuis 2025 —
//   sans PPT adopte : >= 5 % du budget previsionnel ;
//   avec PPT adopte : >= 5 % du budget previsionnel ET >= 2,5 % du montant
//   des travaux prevus au plan, le PLUS ELEVE des deux s'appliquant.
//   Consequence : une copropriete a 5 % pile mais dotee d'un PPT lourd est
//   EN DESSOUS du minimum legal. L'ancienne version la declarait « conforme ».
// AMIANTE : permis de construire anterieur au 01/07/1997 (privatif et communs).
// PLOMB (CREP) : construction anterieure a 1949.
// ELECTRICITE / GAZ : installations de plus de 15 ans.
// ══════════════════════════════════════════════════════════════════════
const REGLES = {
  ANNEE_AMIANTE: 1997,
  ANNEE_PLOMB: 1949,
  // Diagnostic electrique : installations de PLUS DE 15 ANS. Le seuil GLISSE avec
  // l'annee en cours — le figer a 2011 aurait ete juste en 2026 et faux en 2030.
  ANNEE_ELEC: new Date().getFullYear() - 15,
  AGE_COPRO_PPT: 15,          // PPT + DPE collectif : coproprietes de plus de 15 ans
  AGE_FONDS_TRAVAUX: 10,      // fonds de travaux obligatoire : immeubles de plus de 10 ans
  DUREE_DECENNALE: 10,        // garantie decennale des parties communes
  FONDS_PCT_BUDGET: 0.05,     // 5 % du budget previsionnel
  FONDS_PCT_PPT: 0.025,       // 2,5 % du montant des travaux du PPT adopte
  DPE_REFORME_ANNEE: 2026,    // reforme du coefficient electricite
} as const;

// ══════════════════════════════════════════════════════════════════════
// 🗓️ ANNEE DE CONSTRUCTION — bornes et franchissement de seuil
// ──────────────────────────────────────────────────────────────────────
// Le probleme : une FOURCHETTE ne peut pas trancher un seuil qu'elle chevauche.
// Un DPE qui annonce « 1989-2000 » ne dit PAS si le bati est anterieur a 1997 :
// decider a pile ou face reviendrait soit a reclamer un diagnostic amiante qui
// n'est pas du, soit — bien pire — a n'en reclamer aucun sur un immeuble qui y
// est soumis. Meme chose pour la date du reglement de copropriete, qui est une
// BORNE SUPERIEURE : un reglement de 1951 garantit que l'immeuble est anterieur
// a 1951, pas qu'il est posterieur a 1949.
//
// D'ou trois reponses possibles, jamais deux : 'avant', 'apres', 'indetermine'.
// Sur 'indetermine', on s'abstient et on le DIT au client.
// ══════════════════════════════════════════════════════════════════════
type PositionSeuil = 'avant' | 'apres' | 'indetermine';

function bornesConstruction(r: Record<string, unknown>): { annee: number | null; min: number | null; max: number | null; fourchette: boolean } {
  const brut = String(r.annee_construction ?? '').match(/\d{4}/);
  const annee = brut ? parseInt(brut[0]) : null;
  const f = r.annee_construction_fourchette as { min?: number | null; max?: number | null } | null | undefined;
  const precision = String(r.annee_construction_precision ?? '');

  if (f && (f.min != null || f.max != null)) {
    return { annee, min: f.min ?? null, max: f.max ?? null, fourchette: true };
  }
  // Date d'un acte (reglement de copropriete) : l'immeuble existait AU PLUS TARD
  // a cette date. Rien ne dit qu'il n'est pas bien plus ancien.
  if (precision === 'borne_superieure' && annee != null) {
    return { annee, min: null, max: annee, fourchette: true };
  }
  return { annee, min: annee, max: annee, fourchette: false };
}

function positionSeuil(b: { min: number | null; max: number | null }, seuil: number): PositionSeuil {
  if (b.min == null && b.max == null) return 'indetermine';
  const min = b.min ?? -Infinity;
  const max = b.max ?? Infinity;
  if (max < seuil) return 'avant';
  if (min >= seuil) return 'apres';
  return 'indetermine';
}

function recalculerCategories(rapport: RapportShape, profil: string): RapportShape {
  // 🔢 Recomptage deterministe des lots — AVANT tout le reste et pour TOUS les
  // types de bien (une maison en copro a aussi une composition de copropriete).
  // Sans effet si lots_enumeres est absent ou vide.
  try {
    appliquerRecomptageComplet(rapport as unknown as Record<string, unknown>);
  } catch (e) {
    console.error('[analyser-run] Recomptage lots (non bloquant):', e);
  }

  const diagnostics = rapport.diagnostics || [];
  const diagsPrivatifs = diagnostics.filter(d => d.perimetre === 'lot_privatif');
  const diagsCommuns = diagnostics.filter(d => d.perimetre === 'parties_communes');

  const anneeNum = rapport.annee_construction ? Number(String(rapport.annee_construction).replace(/[^0-9]/g, '')) : null;
  const bornes = bornesConstruction(rapport as unknown as Record<string, unknown>);
  const anneeRefScore = new Date().getFullYear();
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

  // 🆕 STATUT FONDS TRAVAUX DÉTERMINISTE : calculé depuis le ratio
  // cotisation annuelle copro / budget du MEME exercice (minimum légal ALUR = 5%).
  // 🆕 MILLESIME-AWARE (fix cas réel PV Auteuil 06/2023) : la cotisation 2023 (4 500 €)
  // divisée par le budget 2024 (95 000 €) donnait 4,74 % => faux "insuffisant" + pénalité,
  // alors que la résolution adoptée fixe 5 % du budget 2023 (90 000 €) = conforme pile.
  // Priorités : 1) % voté en AG (la résolution adoptée fait foi) 2) ratio cotisation /
  // budget du MEME exercice (budgets_historique, ou budget_total_copro si années identiques
  // ou inconnues) 3) millésimes différents sans budget correspondant => on n'écrase PAS le
  // statut de l'IA (croiser deux exercices produit des faux négatifs).
  // Filet : montant manquant mais % voté + budget du même exercice connus => on reconstitue
  // finances.fonds_travaux = pct × budget (demande Alex : afficher le montant attendu).
  const finX = fin as unknown as Record<string, unknown>;
  const ftAnnee = finX.fonds_travaux_annee != null ? String(finX.fonds_travaux_annee) : null;
  const btcAnnee = finX.budget_total_copro_annee != null ? String(finX.budget_total_copro_annee) : null;
  const pctVote = typeof finX.fonds_travaux_pct_vote === 'number' ? finX.fonds_travaux_pct_vote as number : null;
  const histoFT = Array.isArray(finX.budgets_historique) ? finX.budgets_historique as Array<Record<string, unknown>> : [];
  const btcMontant = typeof fin.budget_total_copro === 'number' ? fin.budget_total_copro : null;
  const budgetMemeExercice = (() => {
    if (!ftAnnee) return btcMontant; // années inconnues : comportement historique
    if (btcAnnee && btcAnnee === ftAnnee && btcMontant) return btcMontant;
    const h = histoFT.find(b => String(b.annee ?? '') === ftAnnee);
    const bt = h && typeof h.budget_total === 'number' ? h.budget_total as number : null;
    return bt && bt > 0 ? bt : null; // null = millésimes différents sans correspondance => pas d'écrasement
  })();

  // 🛡️ GARDE-FOU CODE — le montant du fonds de travaux du VENDEUR (pre-etat date,
  // Partie III) ne doit jamais se retrouver au niveau COPRO. Si les deux champs
  // portent la meme valeur, c est une recopie : on efface la version copro.
  // Observe en production : 438,30 € (part du vendeur) affiche comme cotisation
  // annuelle de la copropriete, alors que 5% de 38 000 € font 1 900 €.
  const ped = (rapport as unknown as Record<string, unknown>).pre_etat_date as Record<string, unknown> | undefined;
  const ftVendeur = typeof ped?.fonds_travaux_alur === 'number' ? ped.fonds_travaux_alur as number : null;
  if (ftVendeur != null && ftVendeur > 0) {
    if (typeof fin.fonds_travaux === 'number' && Math.abs(fin.fonds_travaux - ftVendeur) < 1) {
      console.warn(`[analyser-run] 🛡️ fonds_travaux (${fin.fonds_travaux} €) = part du vendeur — champ copro vidé`);
      fin.fonds_travaux = null;
    }
    const totalC = (fin as unknown as Record<string, unknown>).fonds_travaux_total_constitue;
    if (typeof totalC === 'number' && Math.abs(totalC - ftVendeur) < 1) {
      console.warn(`[analyser-run] 🛡️ fonds_travaux_total_constitue (${totalC} €) = part du vendeur — champ copro vidé`);
      (fin as unknown as Record<string, unknown>).fonds_travaux_total_constitue = null;
    }
  }

  let ftMontant = typeof fin.fonds_travaux === 'number' ? fin.fonds_travaux : null;
  // 🏷️ Le montant peut etre RECONSTITUE (pct voté × budget) et non lu dans un document.
  // On marque alors le chiffre comme estimé : l'affichage ne doit pas le presenter
  // comme "voté", sinon on donne pour lu un chiffre qui a ete calcule.
  if (ftMontant == null && pctVote != null && budgetMemeExercice) {
    ftMontant = Math.round(budgetMemeExercice * pctVote / 100);
    fin.fonds_travaux = ftMontant;
    (fin as unknown as Record<string, unknown>).fonds_travaux_estime = true;
    console.log(`[analyser-run] Fonds travaux reconstitué: ${ftMontant} € (${pctVote}% du budget ${ftAnnee || '?'}) — marqué estimé`);
  } else if (ftMontant != null) {
    (fin as unknown as Record<string, unknown>).fonds_travaux_estime = false;
  }

  if (pctVote != null) {
    fin.fonds_travaux_statut =
      pctVote >= 10 ? 'excellent' :
      pctVote >= 7.5 ? 'bien' :
      pctVote >= 5 ? 'conforme' : 'insuffisant';
    console.log(`[analyser-run] Fonds travaux statut (pct voté ${pctVote}%): ${fin.fonds_travaux_statut}`);
  } else if (ftMontant != null && budgetMemeExercice && budgetMemeExercice > 0) {
    const ratio = ftMontant / budgetMemeExercice;
    fin.fonds_travaux_statut =
      ratio >= 0.10 ? 'excellent' :
      ratio >= 0.075 ? 'bien' :
      ratio >= 0.05 ? 'conforme' : 'insuffisant';
    console.log(`[analyser-run] Fonds travaux statut recalcule: ${fin.fonds_travaux_statut} (ratio ${(ratio * 100).toFixed(1)}% — exercice ${ftAnnee || btcAnnee || '?'})`);
  }

  // Le fonds de travaux n'est obligatoire que pour les immeubles de PLUS DE 10 ANS
  // (art. 14-2 de la loi de 1965). Une copropriete plus recente qui n'en a pas
  // n'est pas en faute : la penaliser revenait au meme faux positif que reclamer
  // un diagnostic amiante sur du bati de 2015. Les bonus, eux, restent acquis :
  // une jeune copropriete qui cotise deja merite d'etre creditee.
  // Exigible seulement si l'immeuble a CERTAINEMENT plus de 10 ans. Sur une
  // fourchette qui chevauche le seuil, on ne penalise pas.
  const posFonds = positionSeuil(bornes, anneeRefScore - REGLES.AGE_FONDS_TRAVAUX);
  const fondsExigible = posFonds !== 'apres';
  const ageImmeubleFin = bornes.annee ? anneeRefScore - bornes.annee : null;

  const fondsStatut = fin.fonds_travaux_statut;
  if (fondsStatut === 'excellent') noteFinances += 1.5;
  else if (fondsStatut === 'bien') noteFinances += 1;
  else if (fondsStatut === 'conforme') noteFinances += 0.5;
  else if (fondsStatut === 'insuffisant') noteFinances -= fondsExigible ? 0.5 : 0;
  else if (fondsStatut === 'absent') noteFinances -= fondsExigible ? 1 : 0;
  if (!fondsExigible && (fondsStatut === 'absent' || fondsStatut === 'insuffisant')) {
    (fin as unknown as Record<string, unknown>).fonds_travaux_non_exigible = true;
    console.log(`[analyser-run] Fonds travaux non exigible (immeuble de ${ageImmeubleFin} an(s)) — aucun malus applique`);
  }

  const budget = fin.budget_total_copro || 0;
  const impayes = fin.impayes || 0;
  if (budget > 0 && impayes > 0 && impayes / budget > 0.15) noteFinances -= 0.5;

  if (rapport.pre_etat_date?.present && rapport.pre_etat_date?.impayes_vendeur === 0) noteFinances += 0.5;

  // ── DOUBLE PLANCHER DU FONDS DE TRAVAUX (regime applicable depuis 2025) ──
  // Le seuil de 5 % du budget n'est que le premier plancher. Des qu'un plan
  // pluriannuel de travaux chiffre existe, la cotisation doit AUSSI atteindre
  // 2,5 % du montant des travaux planifies — et c'est le plus eleve des deux
  // qui s'impose. Une copropriete a 5 % pile avec un PPT de 600 000 € cotise
  // 4 000 €/an la ou la loi en exige 15 000 : l'ancienne version la classait
  // « conforme », ce qui rassurait a tort sur le poste le plus couteux.
  //
  // On applique un malus mesure (-0,5) plutot que de basculer le statut en
  // « insuffisant » : l'adoption formelle du PPT en AG n'est pas detectable de
  // facon certaine dans les documents, et le statut pilote l'affichage partout.
  // Le point de vigilance associe est pose par validateDiagsManquants.
  const dtgFin = rapport.vie_copropriete?.dtg;
  const travauxPPT = dtgFin?.present && typeof dtgFin.budget_total_10ans === 'number' && dtgFin.budget_total_10ans > 0
    ? dtgFin.budget_total_10ans : null;
  if (travauxPPT && ftMontant != null && ftMontant > 0) {
    const minPPT = travauxPPT * REGLES.FONDS_PCT_PPT;
    if (ftMontant < minPPT * 0.95) {
      noteFinances -= 0.5;
      (fin as unknown as Record<string, unknown>).fonds_travaux_plancher_ppt = {
        requis_annuel: Math.round(minPPT),
        constate_annuel: Math.round(ftMontant),
        travaux_plan: Math.round(travauxPPT),
      };
      console.log(`[analyser-run] Fonds travaux SOUS le plancher PPT : ${Math.round(ftMontant)} € constates vs ${Math.round(minPPT)} € requis (2,5 % de ${Math.round(travauxPPT)} €)`);
    }
  }

  const hasFinancesData = !!(fin.budget_total_copro || fin.charges_annuelles_lot || fin.fonds_travaux || rapport.pre_etat_date?.present);
  noteFinances = clamp(noteFinances, hasFinancesData ? 1 : 0, 4);

  // ═══ DIAGS PRIVATIFS (note_max = 4) — LE VRAI FIX ═══
  let noteDiagsPrivatifs: number;
  if (diagsPrivatifs.length === 0) {
    noteDiagsPrivatifs = 0;
  } else {
    const requis = ['DPE'];
    // Annee inconnue = on ne reclame RIEN. Avant, `!anneeNum ||` rendait le
    // diagnostic electrique obligatoire des que l'annee n'avait pas ete extraite :
    // -0,75 point sur une hypothese. Et le seuil (2010) ne correspondait pas a
    // celui de la checklist (2011), donc le rapport pouvait signaler un document
    // manquant sans que la note ne bouge, ou l'inverse.
    if (anneeNum && anneeNum < REGLES.ANNEE_ELEC) requis.push('ELECTRICITE');
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
  // ── APPLICABILITE (fix) ──────────────────────────────────────────────
  // Sur les parties communes, seul l'amiante est reglementairement attendu,
  // et uniquement pour un bati anterieur a juillet 1997. Sur un immeuble
  // recent il n'y a RIEN a fournir : l'absence de document n'est pas une
  // lacune, elle est normale. L'ancienne version partait de 2 dans tous les
  // cas -> un immeuble neuf et parfaitement en regle etait plafonne a 2/3
  // (barre orange a 67 %) et perdait 1 point sur 20 sans aucune raison,
  // pendant qu'un immeuble de 1948 SANS aucun diagnostic commun — un vrai
  // trou de dossier — obtenait exactement la meme note.
  //
  // Nouvelle grille de depart :
  //   rien d'exigible (bati >= 1997)          -> 3   « sans objet »
  //   exigible ET des documents fournis       -> 2   (comportement historique)
  //   exigible ET rien fourni                 -> 1.5 (la vraie lacune)
  // Les bonus/malus DTG et les anomalies s'appliquent ensuite dans tous les cas :
  // un immeuble recent dote d'un DTG degrade redescend normalement.
  // ⚠️ TROIS etats, pas deux. « Rien n'est exigible » et « on ne sait pas » ne
  // doivent PAS produire le meme resultat : sans cette distinction, un immeuble
  // de 1900 dont l'annee n'a pas ete extraite heritait d'un 3/3 « sans objet »,
  // soit un point offert sur une ignorance.
  const posAmiante = positionSeuil(bornes, REGLES.ANNEE_AMIANTE);
  const diagsCommunsAttendus = posAmiante === 'avant';
  const diagsCommunsSansObjet = posAmiante === 'apres';
  const anneeConnue = posAmiante !== 'indetermine';
  const dtg = rapport.vie_copropriete?.dtg;
  const hasCommunsData = diagsCommuns.length > 0 || Boolean(dtg?.present);

  let noteDiagsCommuns: number;
  if (diagsCommunsSansObjet) noteDiagsCommuns = 3;      // bati >= 1997 : rien a fournir
  else if (!anneeConnue) noteDiagsCommuns = 2;          // annee inconnue : socle neutre
  else if (hasCommunsData) noteDiagsCommuns = 2;        // bati ancien, documents fournis
  else noteDiagsCommuns = 1.5;                          // bati ancien, rien fourni

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

  noteDiagsCommuns = clamp(noteDiagsCommuns, 0, 3);

  const categoriesRecalculees = {
    travaux: { note: Math.round(noteTravaux * 2) / 2, note_max: 5 },
    procedures: { note: Math.round(noteProcedures * 2) / 2, note_max: 4 },
    finances: { note: Math.round(noteFinances * 2) / 2, note_max: 4 },
    diags_privatifs: { note: Math.round(noteDiagsPrivatifs * 2) / 2, note_max: 4 },
    diags_communs: { note: Math.round(noteDiagsCommuns * 2) / 2, note_max: 3, sans_objet: diagsCommunsSansObjet },
  };

  console.log('[analyser-run] Categories recalculees:', JSON.stringify(categoriesRecalculees));
  console.log('[analyser-run] Diags privatifs detectes:', diagsPrivatifs.length, '| types:', diagsPrivatifs.map(d => d.type).join(','));

  // 🆕 FIX SCORE COPRO : le score total = somme des 5 catégories recalculées.
  // Avant ce fix, le score affiché restait celui écrit par l'IA → incohérence
  // possible avec les barres de catégories (ex: 13,5 affiché vs 11,5 en somme).
  // Aligné sur le comportement du chemin maison (recalculerCategoriesMaison).
  const scoreCopro = Math.round((
    categoriesRecalculees.travaux.note +
    categoriesRecalculees.procedures.note +
    categoriesRecalculees.finances.note +
    categoriesRecalculees.diags_privatifs.note +
    categoriesRecalculees.diags_communs.note
  ) * 2) / 2;
  console.log('[analyser-run] Score copro recalcule (somme categories):', scoreCopro, '| score IA remplace:', rapport.score);

  return { ...rapport, score: scoreCopro, score_niveau: getScoreNiveau(scoreCopro), categories: categoriesRecalculees };
}

// ══════════════════════════════════════════════════════════════════════
// 🆕 VALIDATION DETERMINISTE — Diagnostics obligatoires manquants
// Ajoute dans documents_manquants et points_vigilance les diagnostics
// obligatoires absents du dossier selon le type de bien et l'année.
// Fonction pure : ne touche pas l'IA, juste de la logique métier.
// ══════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════
// 🔎 CROISEMENT TITRE DE PROPRIETE ↔ COMPROMIS
// ──────────────────────────────────────────────────────────────────────
// Le titre de propriete (attestation, acte de vente, succession, donation)
// n'a pas grand interet lu seul. Sa valeur est dans la CONFRONTATION avec le
// compromis : le vendeur qui signe est-il bien le proprietaire ? les lots cedes
// sont-ils tous ceux qu'il detient ? les tantiemes concordent-ils ?
//
// Ces controles sont faits par le CODE, pas par le moteur : une comparaison de
// chaines ne doit rien devoir au hasard.
//
// ⚠️ AUCUN IMPACT SUR LA NOTE — decision produit assumee. Un mandat, une
// succession ou une procuration expliquent parfaitement un ecart de nom : ce
// serait injuste de penaliser. On informe, on ne sanctionne pas.
// ══════════════════════════════════════════════════════════════════════
function normaliserNom(v: unknown): string {
  return String(v ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\b(M|MME|MLLE|MONSIEUR|MADAME|MADEMOISELLE|DR|ME|MAITRE)\b\.?/g, '')
    .replace(/[^A-Z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
// Deux ecritures d'un meme nom partagent au moins un mot long (le patronyme).
function memePersonne(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const motsA = new Set(a.split(' ').filter(m => m.length >= 4));
  return b.split(' ').filter(m => m.length >= 4).some(m => motsA.has(m));
}

function croiserTitrePropriete(rapport: Record<string, unknown>): void {
  const lot = (rapport.lot_achete || {}) as Record<string, unknown>;
  const tp = (lot.titre_propriete || {}) as Record<string, unknown>;
  if (tp.present !== true) return;

  const compromis = (lot.compromis || {}) as Record<string, unknown>;
  const ecarts: string[] = [];
  const coherence: Record<string, unknown> = {
    vendeur_conforme_compromis: null, lots_conformes_compromis: null, tantiemes_conformes: null, ecarts: [],
  };

  const proprios = Array.isArray(tp.proprietaires_actuels) ? tp.proprietaires_actuels as Array<Record<string, unknown>> : [];
  const lotsDetenus = Array.isArray(tp.lots_detenus) ? tp.lots_detenus as Array<Record<string, unknown>> : [];
  const vigilances: string[] = [];

  // ── 1. Vendeur du compromis vs proprietaire attesté ──
  if (compromis.present === true) {
    const vendeurs = Array.isArray(compromis.vendeurs) ? compromis.vendeurs as Array<Record<string, unknown>> : [];
    if (vendeurs.length > 0 && proprios.length > 0) {
      const nomsProprios = proprios.map(p => normaliserNom(p.nom_complet));
      const inconnus = vendeurs
        .map(v => ({ brut: String(v.nom_complet ?? ''), norm: normaliserNom(v.nom_complet) }))
        .filter(v => v.norm && !nomsProprios.some(np => memePersonne(np, v.norm)));

      coherence.vendeur_conforme_compromis = inconnus.length === 0;
      if (inconnus.length > 0) {
        const liste = inconnus.map(v => v.brut).join(', ');
        const attestes = proprios.map(p => String(p.nom_complet ?? '')).filter(Boolean).join(', ');
        ecarts.push(`Vendeur du compromis (${liste}) absent du titre de propriete (${attestes})`);
        vigilances.push(`Vendeur et titre de propriete differents — le compromis fait signer ${liste}, alors que le titre de propriete designe ${attestes}. Un mandat, une succession, une indivision ou une procuration peuvent l expliquer : demandez le justificatif au notaire avant la signature.`);
      }
    }

    // ── 2. Lots cedes vs lots detenus ──
    const cedes = Array.isArray((compromis.bien as Record<string, unknown> | undefined)?.lots_cedes)
      ? ((compromis.bien as Record<string, unknown>).lots_cedes as Array<Record<string, unknown>>) : [];
    if (cedes.length > 0 && lotsDetenus.length > 0) {
      const numCedes = new Set(cedes.map(l => String(l.numero_lot ?? l.numero ?? '').trim()).filter(Boolean));
      const oublies = lotsDetenus
        .map(l => ({ num: String(l.numero ?? '').trim(), des: String(l.designation ?? '') }))
        .filter(l => l.num && !numCedes.has(l.num));

      coherence.lots_conformes_compromis = oublies.length === 0;
      if (oublies.length > 0) {
        const liste = oublies.map(l => `n°${l.num}${l.des ? ` (${l.des})` : ''}`).join(', ');
        ecarts.push(`Lot(s) detenu(s) mais absent(s) du compromis : ${liste}`);
        vigilances.push(`Lot non repris au compromis — le titre de propriete mentionne ${liste}, qui n apparait pas parmi les lots cedes. Verifiez si ce bien est volontairement conserve par le vendeur ou s il s agit d un oubli de redaction.`);
      }
    }

    // ── 3. Tantiemes ──
    const tCompromis = String((compromis.bien as Record<string, unknown> | undefined)?.tantiemes ?? lot.quote_part_tantiemes ?? '').trim();
    const tTitre = lotsDetenus.map(l => String(l.tantiemes ?? '').trim()).filter(Boolean);
    if (tCompromis && tTitre.length > 0) {
      const chiffres = (v: string) => v.replace(/[^0-9]/g, '');
      const concorde = tTitre.some(t => chiffres(t) === chiffres(tCompromis));
      coherence.tantiemes_conformes = concorde;
      if (!concorde) {
        ecarts.push(`Tantiemes divergents : ${tCompromis} au compromis, ${tTitre.join(' / ')} au titre de propriete`);
        vigilances.push(`Tantiemes divergents — le compromis indique ${tCompromis} tandis que le titre de propriete porte ${tTitre.join(' / ')}. Un modificatif au reglement a pu redistribuer les tantiemes : faites confirmer la valeur a jour par le syndic.`);
      }
    }
  }

  // ── 4. Etat descriptif ancien ──
  const dateEDD = String(tp.date_etat_descriptif_origine ?? '');
  const anneeEDD = dateEDD.match(/(19|20)\d{2}/);
  if (anneeEDD && parseInt(anneeEDD[0]) < 1980) {
    vigilances.push(`Etat descriptif ancien — la division de l immeuble remonte a ${anneeEDD[0]}. Sur une periode aussi longue, des modificatifs ont tres probablement ete publies : demandez-les pour connaitre la composition exacte de la copropriete aujourd hui.`);
  }

  // ── 5. Indivision ou consentement d un conjoint ──
  const indivis = proprios.filter(p => p.part_indivision || p.peut_vendre_seul === false);
  if (indivis.length > 0) {
    vigilances.push(`Vente a plusieurs mains — le titre de propriete fait etat d une indivision ou d un conjoint dont l accord est requis. La signature de tous les titulaires est necessaire, sans quoi la vente serait fragilisee.`);
  }

  coherence.ecarts = ecarts;
  tp.coherence = coherence;
  lot.titre_propriete = tp;
  rapport.lot_achete = lot;

  if (vigilances.length > 0) {
    const existants = Array.isArray(rapport.points_vigilance) ? rapport.points_vigilance as string[] : [];
    const cles = new Set(existants.map(v => String(v).split('—')[0].trim().toLowerCase()));
    const nouveaux = vigilances.filter(v => !cles.has(v.split('—')[0].trim().toLowerCase()));
    rapport.points_vigilance = [...existants, ...nouveaux];
    console.log(`[analyser-run] 🔎 Titre de propriete : ${nouveaux.length} point(s) de vigilance ajoute(s), ${ecarts.length} ecart(s) detecte(s)`);
  }
}

function validateDiagsManquants(rapport: RapportShape): RapportShape {
  const r = rapport as Record<string, unknown>;
  // 🐛 FIX : `as string` est un CAST TypeScript, pas une conversion. Le schema
  // autorise annee_construction en nombre ("annee_construction": 1976) — dans ce
  // cas .match() n'existe pas et la fonction plantait. L'erreur etait rattrapee
  // (non bloquante) mais la validation des diagnostics obligatoires ne tournait
  // JAMAIS : le rapport ne signalait aucun diagnostic manquant.
  const typeBien = String(r.type_bien ?? '');
  const anneeStr = String(r.annee_construction ?? '');
  const anneeMatch = anneeStr.match(/\d{4}/);
  const annee = anneeMatch ? parseInt(anneeMatch[0]) : null;
  // Bornes reelles : une fourchette de DPE ou une date d'acte ne tranchent pas
  // les seuils de la meme facon qu'une annee exacte.
  const bornesV = bornesConstruction(r);
  const posElec = positionSeuil(bornesV, REGLES.ANNEE_ELEC);
  const posAmianteV = positionSeuil(bornesV, REGLES.ANNEE_AMIANTE);
  const posPlombV = positionSeuil(bornesV, REGLES.ANNEE_PLOMB);

  const diagnostics = Array.isArray(r.diagnostics) ? r.diagnostics as Array<Record<string, unknown>> : [];
  const docsAnalyses = Array.isArray(r.documents_analyses) ? r.documents_analyses as Array<Record<string, unknown>> : [];

  // Helper : un diag est présent s'il existe avec une présence "detectee" ou si un doc le mentionne
  const diagPresent = (type: string): boolean => {
    return diagnostics.some(d => {
      const t = String(d.type || '').toUpperCase();
      const presence = String(d.presence || '').toLowerCase();
      return t === type && presence !== 'non_realise';
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
  if (posElec === 'avant' && !diagPresent('ELECTRICITE')) {
    ajouter("Diagnostic électrique (obligatoire pour les installations de plus de 15 ans)");
    ajouterVigilance("Diagnostic électrique manquant — Non détecté. Obligatoire pour une installation de plus de 15 ans, à demander au vendeur.");
  }

  // ── AMIANTE privatif (construction avant 1997)
  if (posAmianteV === 'avant') {
    const amiantePrivatif = diagnostics.some(d => {
      const t = String(d.type || '').toUpperCase();
      const perimetre = String(d.perimetre || '').toLowerCase();
      const presence = String(d.presence || '').toLowerCase();
      return t === 'AMIANTE' && perimetre === 'lot_privatif' && presence !== 'non_realise';
    });
    if (!amiantePrivatif) {
      ajouter("Diagnostic amiante privatif (obligatoire pour les biens construits avant 1997)");
      ajouterVigilance("Diagnostic amiante manquant — Non détecté. Obligatoire pour un bien construit avant 1997, à demander au vendeur.");
    }
  }

  // ── PLOMB (construction avant 1949)
  if (posPlombV === 'avant' && !diagPresent('PLOMB')) {
    ajouter("Constat de risque d'exposition au plomb — CREP (obligatoire pour les biens construits avant 1949)");
    ajouterVigilance("Plomb (CREP) manquant — Le constat plomb (CREP) n'a pas été détecté. Obligatoire pour un bien construit avant 1949, à demander au vendeur.");
  }

  // ── AUDIT ENERGETIQUE (maison + DPE E/F/G)
  if (typeBien === 'maison' && dpeClasse && ['E', 'F', 'G'].includes(dpeClasse) && !docPresent('AUDIT_ENERGETIQUE')) {
    ajouter("Audit énergétique (obligatoire pour les maisons classées E, F ou G)");
    ajouterVigilance(`Audit énergétique manquant — Non détecté. Obligatoire pour la vente d'une maison classée ${dpeClasse}, à demander au vendeur.`);
  }

  // ── ASSAINISSEMENT (maison NON raccordée au tout-à-l'égout uniquement)
  // Le controle SPANC ne concerne que l'assainissement NON COLLECTIF. Une maison
  // raccordee au tout-a-l'egout n'a aucun document a fournir : le reclamer etait
  // le meme faux positif que l'amiante sur un immeuble recent.
  const assainR = (r as Record<string, unknown>).assainissement as { type_reseau?: string } | undefined;
  const reseauCollectif = String(assainR?.type_reseau || '').toLowerCase() === 'collectif';
  if (typeBien === 'maison' && !reseauCollectif && !docPresent('ASSAINISSEMENT')) {
    ajouter("Diagnostic assainissement (si non raccordé au tout-à-l'égout)");
    ajouterVigilance("Diagnostic assainissement manquant — Non détecté. Obligatoire si la maison n'est pas raccordée au tout-à-l'égout, à vérifier avec le vendeur.");
  }

  // ── TERMITES (zone arrêté préfectoral)
  // On NE met PAS dans documents_manquants (incertain), juste un point de vigilance neutre
  if (!diagPresent('TERMITES')) {
    ajouterVigilance("État termites à vérifier — Vérifiez auprès de la mairie ou du notaire si la commune est en zone termites (arrêté préfectoral). Si oui, l'état termites est obligatoire pour la vente.");
  }

  // ══════════════════════════════════════════════════════════════
  // 🆕 VIGILANCES REGLEMENTAIRES 2026
  // ══════════════════════════════════════════════════════════════

  // ── Reforme du DPE au 1er janvier 2026 ──
  // Le coefficient de conversion de l'electricite est passe de 2,3 a 1,9 :
  // environ 850 000 logements sortent des classes F/G sans le moindre travail.
  // Un DPE etabli AVANT 2026 sur un bien classe E, F ou G peut donc etre
  // pessimiste. On informe l'acheteur — sans malus, la classe lue reste la
  // seule opposable tant qu'un nouveau DPE n'a pas ete etabli.
  if (dpeClasse && ['E', 'F', 'G'].includes(dpeClasse)) {
    const anneeDpeDoc = docsAnalyses
      .filter(d => ['DPE', 'DDT'].includes(String(d.type || '').toUpperCase()))
      .map(d => Number(String(d.annee ?? '').replace(/[^0-9]/g, '')))
      .filter(n => Number.isFinite(n) && n > 1990);
    const dpeAvantReforme = anneeDpeDoc.length > 0 && Math.max(...anneeDpeDoc) < REGLES.DPE_REFORME_ANNEE;
    if (dpeAvantReforme) {
      ajouterVigilance(`DPE antérieur à la réforme de 2026 — le mode de calcul a changé le 1er janvier 2026 (coefficient de conversion de l'électricité ramené de 2,3 à 1,9). Ce logement est classé ${dpeClasse} sur un diagnostic établi avant cette date : s'il est chauffé à l'électricité, un DPE refait aujourd'hui peut aboutir à une meilleure classe sans aucun travaux. À vérifier avant de négocier sur la performance énergétique.`);
    }
  }

  // ── Fonds de travaux sous le plancher PPT (art. 14-2) ──
  // Le drapeau est pose par recalculerCategories, qui dispose des montants.
  const plancherPPT = ((r.finances || {}) as Record<string, unknown>).fonds_travaux_plancher_ppt as
    { requis_annuel?: number; constate_annuel?: number; travaux_plan?: number } | undefined;
  if (plancherPPT?.requis_annuel) {
    ajouterVigilance(`Fonds de travaux sous le minimum légal — un plan pluriannuel de travaux chiffre ${(plancherPPT.travaux_plan || 0).toLocaleString('fr-FR')} € de travaux. La cotisation annuelle doit alors atteindre au minimum 2,5 % de ce montant, soit ${(plancherPPT.requis_annuel || 0).toLocaleString('fr-FR')} €, alors que ${(plancherPPT.constate_annuel || 0).toLocaleString('fr-FR')} € sont constatés. Un rattrapage ou des appels de fonds exceptionnels sont probables. À confirmer avec le syndic : le plancher de 2,5 % ne s'applique qu'une fois le plan adopté en assemblée générale.`);
  }

  // ── ANNEE DE CONSTRUCTION INTROUVABLE ──
  // Plusieurs obligations en dependent (amiante, plomb, electricite, fonds de
  // travaux, plan pluriannuel). Sans elle, Verimo ne les reclame pas — mieux vaut
  // ne rien affirmer que d'accuser a tort. Mais le client doit savoir que cette
  // partie de l'analyse est en suspens, sinon il lit un silence comme un feu vert.
  const seuilsIndetermines: string[] = [];
  if (annee && posAmianteV === 'indetermine') seuilsIndetermines.push('amiante (seuil : juillet 1997)');
  if (annee && posPlombV === 'indetermine') seuilsIndetermines.push('plomb / CREP (seuil : 1949)');
  if (annee && posElec === 'indetermine') seuilsIndetermines.push('diagnostic électrique (installation de plus de 15 ans)');
  if (seuilsIndetermines.length > 0) {
    const bornesTxt = bornesV.fourchette
      ? (bornesV.min != null && bornesV.max != null
          ? `entre ${bornesV.min} et ${bornesV.max}`
          : bornesV.max != null ? `avant ${bornesV.max}` : `après ${bornesV.min}`)
      : String(annee);
    ajouterVigilance(`Période de construction imprécise (${bornesTxt}) — elle ne permet pas de trancher pour : ${seuilsIndetermines.join(', ')}. Verimo s'abstient plutôt que de conclure à tort dans un sens ou dans l'autre. Le règlement de copropriété d'origine, le carnet d'entretien ou la fiche synthétique donnent une date précise : ajoutez l'un d'eux pour lever le doute.`);
  }

  if (!annee) {
    ajouterVigilance("Année de construction non identifiée dans le dossier — plusieurs obligations en dépendent directement : diagnostic amiante (bâti antérieur à juillet 1997), constat plomb (antérieur à 1949), diagnostic électrique (installation de plus de 15 ans) et fonds de travaux (immeuble de plus de 10 ans). Faute de cette donnée, ces points n'ont pas pu être vérifiés. Le DPE, le carnet d'entretien ou la fiche synthétique de copropriété la mentionnent : ajoutez l'un de ces documents pour compléter l'analyse.");
  }

  // ── IMMEUBLE RECENT : décennale, réserves VEFA, litiges promoteur ──
  // Un bâti récent n'a ni amiante ni plomb, mais il a ses risques propres, que
  // le score seul ne dit pas : désordres de construction, réserves non levées,
  // contentieux contre le promoteur, et surtout une garantie décennale qui court
  // — ou vient de s'éteindre. C'est souvent l'information la plus utile à
  // l'acheteur d'un immeuble de moins de quinze ans.
  if ((typeBien === 'appartement' || typeBien === 'maison_copro') && annee && !bornesV.fourchette) {
    const ageBati = new Date().getFullYear() - annee;
    const finDecennale = annee + REGLES.DUREE_DECENNALE;
    if (ageBati < REGLES.DUREE_DECENNALE) {
      ajouterVigilance(`Immeuble récent — la garantie décennale des parties communes court jusqu'aux environs de ${finDecennale} (dix ans à compter de la réception des travaux). Vérifiez dans les PV d'assemblée générale si des réserves restent non levées, si des désordres ont été signalés et si une procédure est en cours contre le promoteur ou les constructeurs : un recours engagé avant l'échéance protège la copropriété, un désordre découvert après ne sera plus couvert.`);
    } else if (ageBati <= REGLES.DUREE_DECENNALE + 2) {
      ajouterVigilance(`Garantie décennale échue — la couverture des parties communes a pris fin vers ${finDecennale}. Tout désordre de construction découvert désormais reste à la charge de la copropriété. Vérifiez dans les PV d'assemblée générale qu'aucun désordre n'a été signalé sans suite avant l'échéance.`);
    }
    if (ageBati <= REGLES.AGE_COPRO_PPT) {
      ajouterVigilance("Copropriété jeune — les charges des premières années sont souvent calées sur un budget établi par le promoteur, plus optimiste que la réalité. Comparez les budgets votés d'un exercice à l'autre : une hausse marquée après deux ou trois ans est fréquente et doit être intégrée à votre calcul.");
    }
  }

  // ── PPT et DPE collectif pour les copropriétés de plus de 15 ans ──
  const posPpt = positionSeuil(bornesV, new Date().getFullYear() - REGLES.AGE_COPRO_PPT);
  if ((typeBien === 'appartement' || typeBien === 'maison_copro') && posPpt === 'avant') {
    const dtgVc = (r.vie_copropriete as Record<string, unknown> | undefined)?.dtg as Record<string, unknown> | undefined;
    if (!dtgVc?.present) {
      ajouterVigilance("Plan pluriannuel de travaux non identifié — depuis le 1er janvier 2025, toutes les copropriétés de plus de 15 ans doivent en être dotées. Son absence n'est pas sanctionnée pénalement, mais elle prive l'acheteur de toute visibilité sur les travaux des dix prochaines années. À demander au syndic.");
      ajouterVigilance("DPE collectif non identifié — depuis le 1er janvier 2026, il est obligatoire pour toutes les copropriétés de plus de 15 ans, y compris celles de 50 lots ou moins. Il sert de base au plan pluriannuel de travaux.");
    }
  }

  console.log(`[analyser-run] validateDiagsManquants: ${docsManquants.length} docs manquants, ${pointsVigilance.length} points vigilance`);

  return { ...rapport, documents_manquants: docsManquants, points_vigilance: pointsVigilance } as RapportShape;
}

// ══════════════════════════════════════════════════════════════════════
// 📋 CHECKLIST DETERMINISTE — source unique de « Completer mon dossier »
// ──────────────────────────────────────────────────────────────────────
// Le front ne recalcule plus rien : il affiche `rapport.checklist`.
// Trois etats, parce que « present » ne veut pas dire « suffisant » :
//   ok           -> l'obligation est couverte
//   insuffisant  -> un document a ete fourni mais il ne suffit pas
//                   (modificatif sans le reglement, PV perimes, appel de
//                    charges de 2022...) — c'est ce cas que l'ancienne
//                    logique ratait : elle testait la seule presence du type
//   manquant     -> rien du tout
// Recalculee a chaque analyse ET a chaque complement -> toujours a jour.
// ══════════════════════════════════════════════════════════════════════

type ChecklistStatut = 'ok' | 'insuffisant' | 'manquant';
type ChecklistItem = {
  id: string;
  label: string;
  statut: ChecklistStatut;
  niveau: 'essentiel' | 'secondaire';
  detail: string | null;
  tooltip: string | null;
};

function construireChecklist(rapport: RapportShape): RapportShape {
  const r = rapport as unknown as Record<string, unknown>;

  const docs = Array.isArray(r.documents_analyses)
    ? (r.documents_analyses as Array<Record<string, unknown>>) : [];
  const diags = Array.isArray(r.diagnostics)
    ? (r.diagnostics as Array<Record<string, unknown>>) : [];
  const manquantsMoteur = Array.isArray(r.documents_manquants)
    ? (r.documents_manquants as unknown[]).map(String) : [];

  const typeBien = String(r.type_bien || 'appartement');
  const isCopro = typeBien === 'appartement' || typeBien === 'maison_copro';
  const anneeBrute = r.annee_construction
    ? Number(String(r.annee_construction).replace(/[^0-9]/g, '')) : null;
  const annee = anneeBrute && anneeBrute > 1700 && anneeBrute < 2100 ? anneeBrute : null;
  const anneeRef = new Date().getFullYear();
  // Un seuil n'est reclame que s'il est CERTAINEMENT franchi ('avant').
  const bornesCk = bornesConstruction(r);
  const exige = (seuil: number) => positionSeuil(bornesCk, seuil) === 'avant';

  // ── helpers ──
  const ofType = (t: string) =>
    docs.filter(d => String(d.type || '').toUpperCase() === t);
  const has = (t: string) => ofType(t).length > 0;
  const anneeMax = (t: string): number | null => {
    const ys = ofType(t)
      .map(d => Number(String(d.annee ?? '').replace(/[^0-9]/g, '')))
      .filter(n => Number.isFinite(n) && n > 1900 && n <= anneeRef + 1);
    return ys.length ? Math.max(...ys) : null;
  };
  // Un diagnostic compte des qu'il a ete REALISE, quel que soit son resultat.
  // (presence='absence' = diag fait, substance non detectee = le meilleur cas)
  const diagFait = (t: string, exigePrivatif = false) => diags.some(d => {
    if (String(d.type || '').toUpperCase() !== t) return false;
    if (String(d.presence || '').toLowerCase() === 'non_realise') return false;
    if (exigePrivatif && String(d.perimetre || '').toLowerCase() !== 'lot_privatif') return false;
    return true;
  });
  // Le moteur ecrit souvent une phrase plus fine que la notre : on la reprend.
  const phraseMoteur = (re: RegExp): string | null =>
    manquantsMoteur.find(m => re.test(m)) || null;

  const items: ChecklistItem[] = [];
  const push = (
    id: string, label: string, statut: ChecklistStatut,
    niveau: 'essentiel' | 'secondaire',
    detail: string | null = null, tooltip: string | null = null,
  ) => { items.push({ id, label, statut, niveau, detail, tooltip }); };

  // ══════════════ ESSENTIELS — COPROPRIETE ══════════════
  if (isCopro) {

    // ── PV d'AG : 3 obligatoires ET recents ──
    const nbPv = ofType('PV_AG').length;
    const pvRecent = anneeMax('PV_AG');
    let sPv: ChecklistStatut = 'ok';
    let dPv: string | null = null;
    if (nbPv === 0) {
      sPv = 'manquant';
      dPv = 'Le vendeur doit fournir les procès-verbaux des 3 dernières assemblées générales.';
    } else if (nbPv < 3) {
      sPv = 'insuffisant';
      dPv = `${nbPv} PV fourni${nbPv > 1 ? 's' : ''} sur les 3 obligatoires.`;
    } else if (pvRecent !== null && anneeRef - pvRecent > 2) {
      sPv = 'insuffisant';
      dPv = `3 PV fournis, mais le plus récent date de ${pvRecent} — les décisions prises depuis ne figurent pas au dossier.`;
    }
    if (sPv !== 'ok') dPv = phraseMoteur(/proc[èe]s-verb|assembl[ée]es? g[ée]n[ée]rale|\bPV d/i) || dPv;
    push('pv_ag', '3 derniers PV d\'Assemblée Générale', sPv, 'essentiel', dPv,
      'Ils retracent les décisions, les travaux votés et les finances de la copropriété. La loi impose les 3 derniers.');

    // ── Reglement de copropriete : le modificatif ne le remplace pas ──
    const aRcp = has('REGLEMENT_COPRO');
    const aModif = has('MODIFICATIF_RCP');
    const anneeModif = anneeMax('MODIFICATIF_RCP');
    const sRcp: ChecklistStatut = aRcp ? 'ok' : (aModif ? 'insuffisant' : 'manquant');
    let dRcp: string | null = null;
    if (sRcp === 'insuffisant') {
      dRcp = `Seul un modificatif${anneeModif ? ` (${anneeModif})` : ''} a été transmis — il complète le règlement d'origine mais ne le remplace pas.`;
    }
    if (sRcp !== 'ok') dRcp = phraseMoteur(/r[èe]glement de copropri[ée]t[ée]/i) || dRcp;
    push('rcp', 'Règlement de copropriété', sRcp, 'essentiel', dRcp,
      'Document fondateur qui régit la copropriété : destination de l\'immeuble, tantièmes, clauses restrictives.');

    // ── Carnet d'entretien ──
    push('carnet', 'Carnet d\'entretien de l\'immeuble',
      has('CARNET_ENTRETIEN') ? 'ok' : 'manquant', 'essentiel', null,
      'Tenu par le syndic : historique des travaux, contrats d\'entretien en cours, diagnostics de l\'immeuble.');

    // ── Appel de charges : perime vite ──
    const anneeAppel = anneeMax('APPEL_CHARGES');
    let sAppel: ChecklistStatut = 'ok';
    let dAppel: string | null = null;
    if (!has('APPEL_CHARGES')) {
      sAppel = 'manquant';
    } else if (anneeAppel !== null && anneeRef - anneeAppel > 1) {
      sAppel = 'insuffisant';
      dAppel = `Le dernier appel fourni date de ${anneeAppel} — les charges actuelles ont pu évoluer.`;
    }
    if (sAppel !== 'ok') dAppel = phraseMoteur(/appel de (charges|fonds)/i) || dAppel;
    push('appel_charges', 'Appel de charges / appel de fonds', sAppel, 'essentiel', dAppel, null);

    // ── Pre-etat date : obligatoire a la vente ──
    // (pour le remettre en secondaire : remplacer 'essentiel' par 'secondaire' ci-dessous)
    push('pre_etat_date', 'Pré-état daté',
      (has('PRE_ETAT_DATE') || has('ETAT_DATE')) ? 'ok' : 'manquant', 'essentiel', null,
      'Émis par le syndic avant la vente : sommes dues par le vendeur, procédures en cours, charges à venir.');
  }

  // ══════════════ ESSENTIELS — DIAGNOSTICS OBLIGATOIRES ══════════════
  // Le perimetre d'obligation se deduit de l'annee de construction.
  const regles: Array<{ id: string; type: string; label: string; requis: boolean; privatif?: boolean; tooltip?: string }> = [
    { id: 'dpe', type: 'DPE', label: 'DPE — Diagnostic de performance énergétique', requis: true },
    { id: 'erp', type: 'ERP', label: 'ERP — État des risques et pollutions', requis: true },
    { id: 'carrez', type: 'CARREZ', label: 'Mesurage loi Carrez', requis: isCopro,
      tooltip: 'Obligatoire en copropriété. Un écart de plus de 5 % ouvre droit à une réduction du prix.' },
    { id: 'elec', type: 'ELECTRICITE', label: 'Diagnostic électrique', requis: exige(REGLES.ANNEE_ELEC),
      tooltip: 'Obligatoire pour une installation de plus de 15 ans.' },
    { id: 'amiante', type: 'AMIANTE', label: 'Diagnostic amiante privatif', requis: exige(REGLES.ANNEE_AMIANTE), privatif: true,
      tooltip: 'Obligatoire pour les biens dont le permis de construire est antérieur au 1er juillet 1997.' },
    { id: 'plomb', type: 'PLOMB', label: 'CREP — Constat de risque d\'exposition au plomb', requis: exige(REGLES.ANNEE_PLOMB),
      tooltip: 'Obligatoire pour les biens construits avant 1949.' },
  ];
  for (const g of regles) {
    if (!g.requis) continue;
    push(`diag_${g.id}`, g.label,
      diagFait(g.type, g.privatif) ? 'ok' : 'manquant', 'essentiel', null, g.tooltip || null);
  }

  // ══════════════ ESSENTIELS — MAISON HORS COPRO ══════════════
  if (!isCopro) {
    const diagDpe = diags.find(d => String(d.type || '').toUpperCase() === 'DPE');
    const classeDpe = (String(diagDpe?.resultat || '').match(/Classe\s*([A-G])/i)?.[1] || '').toUpperCase();
    if (['E', 'F', 'G'].includes(classeDpe)) {
      push('audit', 'Audit énergétique réglementaire',
        has('AUDIT_ENERGETIQUE') ? 'ok' : 'manquant', 'essentiel', null,
        `Obligatoire à la vente d'une maison individuelle ou d'un immeuble en monopropriété classé ${classeDpe} : classes F et G depuis le 1er avril 2023, classe E depuis le 1er janvier 2025. Un appartement en copropriété en est dispensé.`);
    }
    // Le controle SPANC ne vise que l'assainissement NON COLLECTIF : sur une
    // maison raccordee au tout-a-l'egout, il n'y a rien a fournir.
    const assainCk = r.assainissement as { type_reseau?: string } | undefined;
    const surTouteAlEgout = String(assainCk?.type_reseau || '').toLowerCase() === 'collectif';
    if (!surTouteAlEgout) {
      push('assainissement', 'Diagnostic assainissement',
        has('ASSAINISSEMENT') ? 'ok' : 'manquant', 'essentiel', null,
        'Obligatoire si le bien n\'est pas raccordé au tout-à-l\'égout (contrôle SPANC). Valable 3 ans.');
    }
    push('taxe_fonciere', 'Taxe foncière',
      has('TAXE_FONCIERE') ? 'ok' : 'manquant', 'essentiel', null, null);
  }

  // ══════════════ SECONDAIRES ══════════════
  if (isCopro) {
    push('modif_rcp', 'Modificatif(s) au règlement de copropriété',
      has('MODIFICATIF_RCP') ? 'ok' : 'manquant', 'secondaire', null,
      'Actes notariés modifiant le règlement d\'origine ou l\'état descriptif de division.');
    push('diag_communs', 'Diagnostics des parties communes',
      has('DIAGNOSTIC_PARTIES_COMMUNES') ? 'ok' : 'manquant', 'secondaire', null,
      'Amiante, plomb et risques sur les parties communes de l\'immeuble.');
    const dtgPresent = Boolean(((r.vie_copropriete as Record<string, unknown> | undefined)
      ?.dtg as Record<string, unknown> | undefined)?.present);
    push('dtg', 'DTG — Diagnostic Technique Global',
      dtgPresent ? 'ok' : 'manquant', 'secondaire', null,
      'Bilan complet de l\'état de l\'immeuble. Obligatoire à la mise en copropriété d\'un immeuble de plus de 10 ans, et sur injonction de l\'administration.');

    // PPT et DPE collectif : n'ont de sens que pour une copropriete de plus de
    // 15 ans. Sur un immeuble recent ils ne sont pas exigibles — on ne les
    // reclame donc pas, exactement comme pour les diagnostics de parties communes.
    if (exige(anneeRef - REGLES.AGE_COPRO_PPT)) {
      push('ppt', 'PPT — Plan pluriannuel de travaux',
        dtgPresent ? 'ok' : 'manquant', 'secondaire', null,
        'Obligatoire depuis le 1er janvier 2025 pour toutes les copropriétés de plus de 15 ans, quelle que soit leur taille. Il chiffre et planifie les travaux sur 10 ans — et conditionne le montant du fonds de travaux.');
      push('dpe_collectif', 'DPE collectif de l\'immeuble',
        has('DIAGNOSTIC_PARTIES_COMMUNES') ? 'ok' : 'manquant', 'secondaire', null,
        'Obligatoire depuis le 1er janvier 2026 pour toutes les copropriétés de plus de 15 ans, y compris celles de 50 lots ou moins. Il sert de socle au plan pluriannuel de travaux.');
    }
    push('taxe_fonciere_sec', 'Taxe foncière',
      has('TAXE_FONCIERE') ? 'ok' : 'manquant', 'secondaire', null, null);
  }
  push('titre', 'Titre de propriété',
    has('TITRE_PROPRIETE') ? 'ok' : 'manquant', 'secondaire', null,
    'Permet de vérifier que le vendeur est bien propriétaire et que les lots cédés correspondent.');
  push('autre', 'Tout autre document lié à votre futur logement',
    'manquant', 'secondaire', null, null);

  const ko = items.filter(i => i.niveau === 'essentiel' && i.statut !== 'ok').length;
  console.log(`[analyser-run] checklist: ${items.length} items, ${ko} essentiel(s) non couvert(s)`);

  return {
    ...rapport,
    checklist: { version: 1, calcule_le: new Date().toISOString(), items },
  } as RapportShape;
}

// ══════════════════════════════════════════════════════════════════════
// 🆕 RETRY CIBLE DPE/CARREZ — Si l'IA a oublié les détails critiques,
// on relance UN appel IA ciblé (1 seul, jamais en boucle) avec un mini-prompt.
// Coût additionnel : ~0,02-0,05€ par retry, déclenché uniquement si besoin.
// ══════════════════════════════════════════════════════════════════════
/* ══════════════════════════════════════════════════════════════
   📋 EXTRACTION DEDIEE DE L'ETAT DESCRIPTIF DE DIVISION
   ──────────────────────────────────────────────────────────────
   Meme motif que retryDpeCarrez : un appel court, UN seul sujet,
   qui retourne voir le PDF d'origine.

   POURQUOI. La liste des lots etait demandee a l'interieur du grand
   prompt (~16000 tokens en analyse simple, ~21700 en synthese), parmi
   ~200 autres champs. Observe en production : 41 lots au lieu de 39,
   42 au lieu de 38, categories a 14/14/14. Le total, lui, tombe juste :
   c'est UN nombre demande UNE fois. Le probleme n'est pas la lecture,
   c'est le volume de la tache.

   Ici : ~500 tokens de consigne, un seul travail, une seule sortie.
   Non bloquant : en cas d'echec on garde ce qu'on avait.
══════════════════════════════════════════════════════════════ */
async function extraireLotsRCP(
  fileIds: string[],
  apiKey: string,
  totalAnnonce: number | null,
): Promise<LotEnumere[] | null> {
  if (!fileIds.length) return null;

  const borne = totalAnnonce
    ? `Le document annonce ${totalAnnonce} lots : ta liste doit en contenir EXACTEMENT ${totalAnnonce}, numerotes de 1 a ${totalAnnonce}, sans trou ni doublon.`
    : `Lis d'abord le nombre total annonce ("divise en N lots numerotes de 1 a N", souvent ecrit en toutes lettres ET en chiffres), puis produis exactement autant d'entrees.`;

  const miniPrompt = `Tu as UNE seule tache : recopier l'etat descriptif de division de ce reglement de copropriete. Tu ne resumes pas, tu ne juges pas, tu RECOPIES.

${borne}

Une entree par lot NUMEROTE ("LOT NUMERO UN", "LOT 1", ou une ligne du tableau recapitulatif). Rien d'autre.

PIEGES A EVITER (observes sur des actes reels) :
1. Le reglement decrit souvent les lots DEUX FOIS : une description generale en prose ("au 1er sous-sol 8 caves et 10 emplacements de stationnement"), puis l'etat descriptif ou le tableau recapitulatif. Ce sont LES MEMES locaux. Ne compter QUE l'etat descriptif / le tableau. La prose peut compter des PLACES la ou le tableau compte des LOTS (un emplacement double = 1 lot, 2 places).
2. Un bloc de texte orphelin en haut de page, sans numero ("Jouissance de la partie du jardin... 1.211/10.000emes"), est la FIN du lot precedent, PAS un nouveau lot.
3. Un lot rappele en report de page = une seule entree.

Reponds UNIQUEMENT avec ce JSON, sans markdown ni commentaire :
{"total_annonce":<nombre ecrit dans le document ou null>,"lots":[{"numero":1,"designation":"texte recopie","categorie":"logements|maisons|chambres_service|parkings|caves|commerces|autres","tantiemes":"116/100000"}]}

CATEGORIES : logements = appartements/studios · maisons = maisons ou pavillons · chambres_service = chambre de service, chambre de bonne, chambre avec salle d'eau constituee en lot · parkings = emplacements de voiture, garages, boxes · caves = caves · commerces = locaux commerciaux ou professionnels · autres = local de reserve, debarras, grenier, cellier, local technique.`;

  const userContent: unknown[] = fileIds.map(id => ({ type: 'document', source: { type: 'file', file_id: id } }));
  userContent.push({ type: 'text', text: "Recopie l'etat descriptif de division, un lot par entree." });

  let res: { text: string; error?: string };
  try {
    res = await Promise.race([
      callAI({ system: miniPrompt, userContent, maxTokens: 16000, apiKey }),
      new Promise<{ text: string; error: string }>((_, reject) =>
        setTimeout(() => reject(new Error('timeout_90s')), 90000)
      ),
    ]) as { text: string; error?: string };
  } catch (e) {
    console.error('[analyser-run] extraireLotsRCP: appel echoue (non bloquant):', e);
    return null;
  }
  if (res.error || !res.text) return null;

  const parsed = parseJson<{ total_annonce?: number | null; lots?: LotEnumere[] }>(res.text);
  const lots = Array.isArray(parsed?.lots) ? parsed!.lots : null;
  if (!lots || lots.length === 0) return null;

  console.log(`[analyser-run] 📋 Extraction dédiée EDD : ${lots.length} lots | total annoncé lu : ${parsed?.total_annonce ?? 'null'}`);
  return lots;
}

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
    // 🔒 Remboursement IDEMPOTENT centralisé : la fonction SQL pose un verrou (analyses.credit_refunded)
    // pour qu'un crédit ne soit JAMAIS remboursé deux fois (client + analyser-run + watchdog).
    const { data, error } = await supabaseAdmin.rpc('refund_analyse_credit', { p_analyse_id: analyseId });
    if (error) {
      console.error('[analyser-run] Erreur refund_analyse_credit:', error.message);
      return false;
    }
    if (data === true) {
      console.log(`[analyser-run] ✅ Crédit remboursé (verrou) pour analyse ${analyseId}`);
      return true;
    }
    console.log(`[analyser-run] Remboursement déjà effectué ou non applicable pour analyse ${analyseId}`);
    return false;
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
  // 0. Récupérer le mode AVANT tout : un échec de COMPLÉMENT ne doit NI rembourser
  //    (le complément est gratuit — le crédit de l'analyse d'origine a été légitimement
  //    consommé lors du premier succès), NI passer en failed (ce qui masquerait le
  //    rapport d'origine pourtant intact en base).
  //    Garantie : mode='complement' implique qu'un result existait au lancement
  //    (vérifié par analyser/index.ts qui refuse le complément sans rapport existant).
  //    ⚠️ MIROIR : même logique dans analyser/index.ts et watchdog-stuck-analyses/index.ts.
  const { data: analyse } = await supabaseAdmin
    .from('analyses')
    .select('user_id, type, mode')
    .eq('id', analyseId)
    .single();

  if (analyse?.mode === 'complement') {
    // ── ÉCHEC DE COMPLÉMENT : restaurer le rapport d'origine, AUCUN remboursement ──
    await insertSystemAlert(supabaseAdmin, {
      type: errorType,
      severity: alertSeverity,
      title: `[Complément] ${alertTitle}`,
      message: `Échec d'un complément de dossier (${errorType}). Rapport d'origine restauré, aucun remboursement (le complément est gratuit).`,
      analyseId,
      userId: analyse?.user_id || undefined,
      metadata: { refunded: false, analyseType: analyse?.type || 'unknown', complement: true },
    });

    await supabaseAdmin.from('analyses').update({
      status: 'completed',
      file_ids: [],
      progress_message: COMPLEMENT_FAILED_MSG,
    }).eq('id', analyseId);

    // Notif cloche cliquable vers le rapport (pas de mail : le rapport d'origine reste accessible)
    if (analyse?.user_id) {
      await insertNotification(
        supabaseAdmin,
        analyse.user_id,
        'Mise à jour du dossier non aboutie',
        'L\'ajout de documents à votre dossier n\'a pas abouti suite à un incident technique. Votre rapport d\'origine est intact — vous pouvez réessayer via « Compléter mon dossier ».',
        analyseId,
      );
    }
    return;
  }

  // ── ÉCHEC D'ANALYSE CLASSIQUE (comportement inchangé) ──
  // 1. Rembourser le crédit
  const refunded = await refundCredit(analyseId, supabaseAdmin);

  // 2. Insérer l'alerte système
  await insertSystemAlert(supabaseAdmin, {
    type: errorType,
    severity: alertSeverity,
    title: alertTitle,
    message: userMessage,
    analyseId,
    userId: analyse?.user_id || undefined,
    metadata: { refunded, analyseType: analyse?.type || 'unknown' },
  });

  // 3. Mettre à jour le status de l'analyse
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
}): Promise<{ text: string; error?: string; stopReason?: string }> {
  const { system, userContent, maxTokens, apiKey, timeoutMs = 385000 } = params;

  for (let attempt = 1; attempt <= 3; attempt++) {
    // Timeout dur sur l'appel : sans ca, un appel lent attend jusqu'a la limite wall-clock (~400s)
    // de l'edge function -> le worker est tue EN PLEIN APPEL et l'analyse reste bloquee en "processing".
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
        // 🆕 stream:true — SANS streaming, un abort() ferme la socket mais la generation
        // continue cote serveur et reste FACTUREE integralement. En streaming, couper le
        // flux arrete les frais a l'endroit exact ou on coupe.
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: userContent }],
          stream: true,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) { clearTimeout(timer); if (attempt < 3) { await sleep(Math.pow(2, attempt) * 5000); continue; } return { text: '', error: 'rate_limit' }; }
      if (res.status === 529 || res.status === 503) { clearTimeout(timer); if (attempt < 3) { await sleep(15000); continue; } return { text: '', error: 'overload' }; }
      if (res.status === 401 || res.status === 403) { clearTimeout(timer); const e = await res.text(); console.error(`[analyser-run] ⚠️ CRITIQUE — Anthropic ${res.status} (billing/auth):`, e); return { text: '', error: 'api_billing' }; }
      if (!res.ok || !res.body) { clearTimeout(timer); const e = await res.text().catch(() => ''); console.error(`[analyser-run] Anthropic ${res.status}:`, e); return { text: '', error: `api_error_${res.status}` }; }

      // ── Lecture du flux SSE ──
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';
      let stopReason = '';
      let streamError = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          let evt: Record<string, unknown>;
          try { evt = JSON.parse(payload); } catch { continue; }
          const t = evt.type as string;
          if (t === 'content_block_delta') {
            const d = evt.delta as Record<string, unknown> | undefined;
            if (d?.type === 'text_delta' && typeof d.text === 'string') text += d.text;
          } else if (t === 'message_delta') {
            const d = evt.delta as Record<string, unknown> | undefined;
            if (typeof d?.stop_reason === 'string') stopReason = d.stop_reason;
          } else if (t === 'error') {
            const e = evt.error as Record<string, unknown> | undefined;
            streamError = String(e?.type || 'stream_error');
          }
        }
      }
      clearTimeout(timer);

      if (streamError) {
        if (streamError === 'overloaded_error') { if (attempt < 3) { await sleep(15000); continue; } return { text: '', error: 'overload' }; }
        if (streamError === 'rate_limit_error') { if (attempt < 3) { await sleep(Math.pow(2, attempt) * 5000); continue; } return { text: '', error: 'rate_limit' }; }
        console.error(`[analyser-run] Erreur dans le flux: ${streamError}`);
        return { text: '', error: 'api_error_stream' };
      }
      if (!text) return { text: '', error: 'empty_response' };

      // 🆕 Reponse coupee par max_tokens : le JSON est forcement invalide. On renvoie une
      // erreur DEDIEE pour que l'appelant ne relance JAMAIS le meme appel a l'identique
      // (il reproduirait la meme troncature et doublerait la facture pour rien).
      if (stopReason === 'max_tokens') {
        console.error(`[analyser-run] ⚠️ Reponse TRONQUEE (max_tokens=${maxTokens}) — pas de retry`);
        return { text, error: 'truncated', stopReason };
      }
      return { text, stopReason };

    } catch (err) {
      clearTimeout(timer);
      // Appel avorte car trop long : on echoue PROPREMENT et SANS reessayer.
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
  parts.push('Detecte le type de document parmi : DDT, PV_AG, APPEL_CHARGES, RCP, DTG_PPT, CARNET_ENTRETIEN, PRE_ETAT_DATE, ETAT_DATE, TAXE_FONCIERE, COMPROMIS, TITRE_PROPRIETE, DIAGNOSTIC_PARTIES_COMMUNES, MODIFICATIF_RCP, FICHE_SYNTHETIQUE, ASL_CHIFFRES, ASL_REGLES, HISTORIQUE_TRAVAUX, AUTRE.');
  parts.push('TITRE_PROPRIETE = document notarie etablissant QUI EST PROPRIETAIRE : attestation de propriete, acte de vente authentique, attestation de succession, acte de donation. A ne PAS confondre avec COMPROMIS, qui est un AVANT-contrat (conditions suspensives, delai de retractation, vente pas encore faite). Si le document constate une vente DEJA REALISEE ou atteste une propriete existante, c est TITRE_PROPRIETE.');
  parts.push('ASL_CHIFFRES : document FINANCIER d une structure de gestion d ensemble HORS copropriete — ASL (Association Syndicale Libre), AFUL ou Union. Indices : "association syndicale libre", "ASL", "AFUL", lotissement, ensemble immobilier, avec contenu financier (PV d assemblee, appel de cotisations, budget, etat des cotisations). NE PAS confondre avec une copropriete (loi 1965, syndic, tantiemes) : l ASL/AFUL releve de l ordonnance de 2004, a un president et un syndicat, repartit en quotes-parts.');
  parts.push('ASL_REGLES : document de REGLES d une ASL/AFUL/Union — statuts, cahier des charges du lotissement, ou reglement de lotissement. Indices : regles d urbanisme privees (hauteurs, clotures, extensions), servitudes, voirie, retrocession. Ce sont des REGLES, pas des chiffres.');
  parts.push('HISTORIQUE_TRAVAUX : devis, facture, ou attestation de travaux emis par une entreprise/un artisan pour le bien (souvent une MAISON). Indices : en-tete d une entreprise (nom, SIRET, assurance decennale), libelles de travaux (toiture, chauffage, isolation, electricite, fenetres, ravalement...), montants HT/TTC, date d intervention. Sert a documenter l entretien et la renovation deja realises sur le bien.');
  parts.push('FICHE_SYNTHETIQUE : fiche synthetique de copropriete (document standardise loi ALUR). Indices : titre contient "fiche synthetique" ou "synthese copropriete" ; sections standardisees "Identification", "Caracteristiques techniques", "Donnees financieres" ; tenue obligatoire par le syndic et remise a jour annuellement.');
  parts.push('MODIFICATIF_RCP : document notarié portant modification de l etat descriptif de division et/ou du règlement de copropriété. Indices : mots-clés "modificatif", "état descriptif de division", "règlement de copropriété" + notaire + création/suppression/modification de lot ou de tantièmes.');
  parts.push('');
  parts.push('Reponds UNIQUEMENT en JSON strict selon le type detecte.');
  parts.push('');
  parts.push('REGLE FORMAT points_forts / points_vigilance : formuler CHAQUE point ainsi -> un TITRE court (2 a 5 mots) puis " — " (tiret cadratin entoure d espaces) puis 1 a 2 phrases de detail. Le titre resume l essentiel ; le detail precise (montant, date, consequence pour l acheteur) SANS repeter le titre. Le titre doit tenir en moins de 60 caracteres. Exemples : "Syndic stable — Cabinet Lefevre reconduit depuis 1999, gestion continue sans conflit." / "Fonds travaux ALUR absent — refuse a chaque AG depuis 2020, tout gros travail sera finance par appel exceptionnel." JAMAIS d emoji ni de puce en tete du point. Cette regle s applique a TOUS les points_forts et points_vigilance, y compris ceux internes a chaque document.');
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
  parts.push('RCP : {"document_type":"RCP","titre":"...","resume":"2-3 phrases synthétiques utiles pour un acheteur","date_reglement":null,"modificatifs":[],"usage":"habitation|mixte|commercial","total_lots":null,"lots_enumeres":[{"numero":null,"designation":"...","categorie":"logements|maisons|chambres_service|parkings|caves|commerces|autres","tantiemes":null}],"lots_detail":{"logements":null,"maisons":null,"chambres_service":null,"parkings":null,"caves":null,"commerces":null,"autres":null},"lots_caves":null,"lots_parkings":null,"lots_commerces":null,"parties_communes_categories":[{"categorie":"Structure","icone":"🏗","elements":["..."]},{"categorie":"Accès et circulations","icone":"🚪","elements":["..."]},{"categorie":"Équipements","icone":"⚙️","elements":["..."]},{"categorie":"Espaces extérieurs","icone":"🌿","elements":["..."]}],"regles_usage":[{"label":"...","statut":"autorise|interdit|sous_conditions","impact_rp":false,"impact_invest":false}],"restrictions_importantes":[{"label":"...","detail":"1 phrase claire en langage simple","bloquant":false}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES RCP :');
  parts.push('- resume : 2-3 phrases max, ce qui est utile pour prendre une décision d achat. Pas de copie du contenu juridique.');
  parts.push('- parties_communes_categories : regrouper par catégorie logique. Ne lister que les éléments significatifs (pas les détails ultra-précis comme les paillassons). Maximum 6 éléments par catégorie. Omettre les catégories vides.');
  parts.push('- regles_usage : NE garder QUE les règles encore pertinentes en 2024 et utiles pour un acheteur. Reformuler en langage simple et direct. impact_rp=true si ça concerne la vie quotidienne (animaux, bruit, travaux). impact_invest=true si ça concerne la location (meublé, Airbnb, chambres séparées, commerce). Profil actuel : ' + p + '. Maximum 8 règles.');
  parts.push('- restrictions_importantes : uniquement les restrictions qui impactent vraiment l acheteur (pas les clauses administratives génériques). Maximum 4. bloquant=true si la restriction peut empêcher un projet (ex: interdiction location meublée pour un investisseur).');
  parts.push('- lots_detail (répartition des lots par type) : logements = appartements + studios (lots d habitation principaux) ; maisons = maisons/pavillons inclus dans la copropriété ; chambres_service = chambres de service / chambres de bonne (lots d une pièce avec ou sans salle d eau) ; parkings = emplacements, garages, boxes ; caves = caves ; commerces = locaux commerciaux ou professionnels ; autres = tout autre lot (local de réserve, grenier, cellier, pièce isolée, local technique, jardin constitué en lot...).');
  parts.push('- SOURCE EXCLUSIVE DU COMPTAGE : compter UNIQUEMENT l état descriptif de division (la liste lot par lot "LOT NUMERO UN...", "LOT NUMERO DEUX..." ou le tableau récapitulatif des lots). NE JAMAIS compter en plus la description générale de l immeuble en préambule ("l ensemble comprendra : ... un appartement et une chambre à chaque étage...") : elle décrit LES MEMES locaux que l état descriptif et les compter deux fois crée des lots fantômes. Chaque lot numéroté = 1 unité dans UNE seule catégorie.');
  parts.push('- AUTO-CONTROLE OBLIGATOIRE : la SOMME des catégories de lots_detail DOIT être EXACTEMENT égale à total_lots écrit dans le document (ex : "divisé en 39 lots numérotés de 1 à 39"). Si l addition ne tombe pas juste, relire l état descriptif lot par lot et ranger chaque lot dans sa catégorie (ou dans autres) — aucun lot ne doit disparaître ni être compté deux fois. Si le règlement ne détaille pas les lots, remplir uniquement total_lots et laisser lots_detail à null — ne jamais inventer une répartition.');
  parts.push('- lots_enumeres (PRIORITAIRE, RCP avec etat descriptif de division) : TRANSCRIRE la liste des lots, UNE ENTREE PAR LOT NUMEROTE, dans l ordre. Tu TRANSCRIS, tu ne comptes pas : le comptage est fait ensuite par le systeme. Pour chaque lot : "numero" = le numero seul en chiffres (LOT NUMERO VINGT SEPT => 27), "designation" = la designation recopiee du document, "categorie" = la case qui convient, "tantiemes" = la quote-part de CE lot au format "num/den" telle qu ecrite (ex "116/100000"), null si absente. REGLES ABSOLUES : (1) une entree = un "LOT NUMERO X" du document, jamais autre chose ; (2) NE JAMAIS creer d entree sans numero — un bloc de texte orphelin en haut de page (suite d une description coupee par un saut de page, type "Jouissance de la partie du jardin... 1.211/10.000emes") est la FIN du lot precedent, PAS un nouveau lot ; (3) ⚠️ MODIFICATIF INTEGRE A L ACTE : si un lot a ete DIVISE par un modificatif (un duplex devenu deux appartements, une cave devenue "7" et "7 bis"), les nouveaux lots sont numerotes A LA SUITE des anciens. Le lot d ORIGINE n existe plus : ne PAS le lister en plus de ses remplacants, sinon la copropriete compte deux fois les memes m². Indice : la somme des tantiemes depasse le denominateur. Dans le doute, transcrire quand meme les deux et laisser le systeme trancher par les tantiemes ; (4) ne jamais compter la description generale de l immeuble en preambule ("l ensemble comprendra un appartement et une chambre a chaque etage") : elle decrit les memes locaux ; (5) un lot cite deux fois (report de page) = une seule entree ; (6) le nombre d entrees doit correspondre au total annonce par le document lui-meme : si l acte ecrit "divise en N lots numerotes de 1 a N", la liste contient N entrees, numerotees de 1 a N, sans trou et sans doublon. Ce N est TOUJOURS lu dans le document en cours — ne jamais reprendre un nombre vu ailleurs ni un nombre donne en exemple. CATEGORIES : logements = appartements/studios · maisons = maisons ou pavillons · chambres_service = chambres de service, chambres de bonne, "chambre avec salle d eau" constituee en lot autonome · parkings = emplacements de voiture, garages, boxes · caves = caves · commerces = locaux commerciaux ou professionnels · autres = local de reserve, debarras, grenier, cellier, local technique, piece isolee. Si le document ne contient PAS de liste lot par lot : laisser lots_enumeres a []. GARDE-FOU TAILLE : si le document annonce plus de 150 lots, laisser lots_enumeres a [] et remplir lots_detail comme avant — transcrire des centaines de lignes ferait depasser le temps maximum de generation.');
  parts.push('- MODIFICATIFS et composition : le chiffre EXPLICITEMENT écrit le plus RECENT fait foi, sans jamais calculer soi-même. Si le règlement intègre déjà son modificatif dans le même acte (mention "et de son modificatif de ce jour"), ses chiffres sont à jour : les recopier. Si un modificatif mentionné change les lots SANS donner de nouveau total, ne PAS faire l arithmétique : garder les chiffres de l état descriptif et le signaler en points_vigilance.');
  parts.push('- lots_caves, lots_parkings, lots_commerces : recopier les valeurs correspondantes de lots_detail (compatibilité), sinon null.');
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
  parts.push('TITRE_PROPRIETE : {"document_type":"TITRE_PROPRIETE","titre":"...","resume":"3-4 phrases factuelles : qui possede quoi, depuis quand, dans quel immeuble","nature":"attestation_propriete|acte_de_vente|attestation_succession|donation|autre","date_acte":null,"date_entree_jouissance":null,"notaire":{"nom":null,"etude":null,"ville":null,"adresse":null},"proprietaires_actuels":[{"nom_complet":null,"profession":null,"date_naissance":null,"lieu_naissance":null,"nationalite":null,"adresse":null,"situation_matrimoniale_citation":"citation EXACTE du document","peut_vendre_seul":null,"part_indivision":null}],"vendeurs_precedents":[{"nom_complet":null,"qualite":null}],"bien":{"adresse_complete":null,"commune":null,"code_postal":null,"regime":"copropriete|monopropriete|non_precise","references_cadastrales":[{"section":null,"numero":null,"lieudit":null,"contenance":null}],"date_etat_descriptif_origine":null},"lots_detenus":[{"numero":null,"designation":"recopiee TELLE QUELLE","etage":null,"nb_pieces":null,"tantiemes":null,"base_tantiemes":null}],"prix_acquisition":null,"anciennete_detention_annees":null,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES TITRE_PROPRIETE : (1) recopier les identites et la situation matrimoniale MOT POUR MOT, ce sont des elements juridiques opposables ; (2) peut_vendre_seul = true uniquement si le document etablit que le proprietaire dispose seul du bien (celibataire, divorce, separation de biens, pleine propriete) ; false si un conjoint en communaute ou une indivision apparait ; null si le document ne permet pas de trancher ; (3) UN objet PAR LOT detenu, sans regroupement : un appartement et sa cave sont DEUX lots ; (4) tantiemes recopies au format ecrit (ex : 70/1021emes) ; (5) date_etat_descriptif_origine = date de l etat descriptif de division cite dans le document. Si elle est anterieure a 1980, l indiquer en point de vigilance : des modificatifs ont tres probablement suivi et meritent d etre demandes ; (6) anciennete_detention_annees = nombre d annees entre date_acte et aujourd hui, arrondi a l entier ; (7) ne JAMAIS remplir de champs d avant-contrat (conditions suspensives, retractation, depot de garantie) : ce document n en comporte pas ; (8) points_vigilance : signaler une indivision, un conjoint dont le consentement serait requis, une detention recente de moins de 2 ans, ou une designation de lots incomplete.');
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
  // 🐛 FIX MAJEUR — le prompt de complément faisait ~617 tokens contre ~22 000
  // pour l'analyse complète. Il disait "applique les mêmes règles que pour une
  // analyse complète" SANS JAMAIS LES FOURNIR. Le moteur devait donc remplir la
  // même structure sans connaître les catégories de lots, le carnet d'entretien,
  // les règles de comptage, la notation /20... D'où les lots qui tombaient tous
  // dans "autres" et les blocs à moitié vides après un complément.
  // On lui donne désormais le référentiel complet, puis les règles de fusion.
  // ⚠️ 27/07 — REGRESSION CORRIGEE : injecter buildSystemPrompt complet ici
  // (617 -> ~21900 tokens) a fait TIMEOUT en production sur un dossier reel.
  // Cause : le complement est SINGLE-CALL et recoit deja le rapport existant
  // (JSON tres gros pour un dossier MAP-REDUCE) + jusqu'a 5 PDFs. Ajouter 21000
  // tokens de consignes ET demander la structure complete a regenerer a fait
  // exploser le temps de generation, seul facteur qui compte face au mur des
  // ~400s. On revient a un prompt COURT, enrichi seulement des regles metier
  // indispensables (categories de lots), sans le referentiel entier.
  const reglesLots = `
REGLE CATEGORIES DE LOTS (vie_copropriete.nb_lots_detail) — 7 cles obligatoires :
logements (appartements + studios) · maisons · chambres_service (chambre de service,
chambre de bonne, chambre avec salle d eau constituee en lot) · parkings (emplacements
de voiture, garages, boxes) · caves · commerces · autres (local de reserve, debarras,
grenier, cellier, local technique). NE JAMAIS tout mettre dans "autres".
Si vie_copropriete.lots_enumeres existe deja dans le rapport, le CONSERVER tel quel
et remplir "categorie" et "designation" pour chaque lot qui en manque.`;

  return `Tu es le moteur d analyse de documents immobiliers de Verimo. Profil acheteur : ${p}.
Tu n utilises jamais les mots Claude, Anthropic ou IA.${typeBienHint}
${reglesLots}

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

--- annee_construction : OU LA TROUVER (champ critique) ---
Ce champ conditionne la plupart des obligations reglementaires. Le chercher activement, dans cet ORDRE DE FIABILITE, et s arreter au premier trouve :
1. DPE ou DDT — rubrique "annee de construction" ou "periode de construction". Source la plus fiable.
2. Carnet d entretien de l immeuble — champ annee_construction.
3. Fiche synthetique de copropriete — caracteristiques techniques.
4. DTG ou audit energetique — descriptif du bati.
5. Reglement de copropriete ou etat descriptif de division d origine : a defaut d annee explicite, la date de l acte donne une borne SUPERIEURE credible (l immeuble existait deja). Ne l utiliser que si aucune source ci-dessus n existe, et ne jamais inventer une precision qui n y figure pas.
Si le document indique une PERIODE ("avant 1948", "1949-1974", "entre 1975 et 1977"), retenir la borne la plus DEFAVORABLE a l acheteur, c est-a-dire la plus ancienne : "1949-1974" donne 1949.
Si AUCUN document ne permet de l etablir, laisser null. Ne JAMAIS deduire une annee du style architectural, du quartier ou d une impression : une valeur inventee ferait sauter ou declencher a tort des obligations (amiante, plomb, electricite).

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
- finances.charges_annuelles_lot = charges annuelles COURANTES du lot (quote-part acheteur). Extraire depuis TOUT document mentionnant les charges du lot : appels de charges, appels de fonds provisionnels. Un appel de fonds provisionnel est la MEME chose qu un appel de charges.
- RÈGLE CALCUL CHARGES COURANTES (methode unique) : charges_annuelles_lot = la SOMME de TOUTES les lignes RECURRENTES appelees au lot, quelle que soit la presentation du document : charges generales, charges speciales par equipement (ascenseur, chauffage collectif, eau, escalier...), provisions du budget previsionnel sous toute repartition par postes, ET cotisation fonds de travaux. Le critere d inclusion est unique : la ligne revient-elle a chaque appel ? Oui = comptee. Non (appel de fonds pour travaux votes, provision hors budget, regularisation d exercice, avance exceptionnelle) = exclue, a ranger dans son champ dedie (appels_fonds_exceptionnels, travaux) et JAMAIS dans les charges. x4 si l appel est trimestriel. Le total imprime en bas du document sert uniquement de CONTROLE : s il differe de la somme calculee, une ligne exceptionnelle existe — la signaler dans son champ dedie. Ne jamais partir du total imprime comme source.
- RÈGLE CASCADE SOURCES FINANCES DU LOT : pour remplir finances.charges_annuelles_lot et les informations financieres associees au lot vendu, appliquer la cascade suivante par ordre de priorite descendante :
  1. PRÉ-ÉTAT DATÉ ou ÉTAT DATÉ : si present, c est la source la plus fiable. ATTENTION ADDITION OBLIGATOIRE : le pre-etat date presente les charges futures en DEUX lignes distinctes (provisions du budget previsionnel + cotisation au fonds de travaux). finances.charges_annuelles_lot = (montant trimestriel budget + fonds_travaux_trimestriel) x 4 — la SOMME des deux lignes, JAMAIS la ligne budget seule. Et finances.cotisation_fonds_travaux_lot_annuelle = fonds_travaux_trimestriel x 4. Extraire aussi fonds_travaux_alur, impayes_vendeur, et surtout historique_charges N-1 et N-2 (budget_appele + charges_reelles) qui doivent apparaitre dans finances.budgets_historique. Source = "Pré-état daté (budget + cotisation fonds travaux)" ou "État daté (budget + cotisation fonds travaux)".
  2. APPEL DE CHARGES du lot : si present sans pre-etat date, utiliser le DERNIER appel (le plus recent si plusieurs au dossier) et appliquer la RÈGLE CALCUL CHARGES COURANTES ci-dessus (somme des lignes recurrentes uniquement). Source = "Appel de charges [periode]".
  3. PV D AG + TANTIEMES : si seulement un PV d AG fourni avec budget total ET tantiemes du lot connus (lot_achete.quote_part_tantiemes), calculer estimation = budget_total × tantiemes_lot / total_tantiemes. Source = "Estimation depuis PV d AG × tantiemes".
  4. PV D AG SEUL : si ni tantiemes ni appel de charges, laisser charges_annuelles_lot = null et signaler dans avis_verimo : "Charges du lot non determinables — uploader un appel de charges ou le pre-etat date pour obtention du montant precis."
- RÈGLE COTISATION FONDS TRAVAUX DU LOT (finances.cotisation_fonds_travaux_lot_annuelle) : si un appel de charges (ou un pre-etat date) distingue une ligne propre au lot "Fonds de travaux loi ALUR" / "cotisation fonds travaux", remplir finances.cotisation_fonds_travaux_lot_annuelle = montant trimestriel de cette ligne x 4 (ex : 26,27/trim => 105). IMPORTANT : ce montant doit deja etre INCLUS dans finances.charges_annuelles_lot (qui = total general appele du lot = charges courantes + cotisation fonds travaux). Sert a afficher "dont X euros/an de cotisation au fonds de travaux" sous les charges annuelles. Laisser null si la cotisation n est pas distinguable.
- RÈGLE FONDS DE TRAVAUX ALUR DE LA COPRO (finances.fonds_travaux / fonds_travaux_pct_vote / fonds_travaux_resolution_adoptee) — DISTINGUER UN VOTE D UN RAPPEL DE LA LOI :
  (RAPPEL nb_lots_total : ce nombre se LIT dans le document — formulation type "l immeuble sera divise en TRENTE HUIT (38) lots numerotes de 1 a 38", souvent ecrite en toutes lettres ET en chiffres. Il ne se DEDUIT JAMAIS en comptant les lignes transcrites : si ton comptage ne tombe pas sur le nombre ecrit, c est TON comptage qui est faux, pas le document. Recopier le nombre ecrit et transcrire exactement autant de lots.)
  * finances.fonds_travaux = le montant ANNUEL de la cotisation, en euros, UNIQUEMENT s il est ECRIT dans un document. Ne JAMAIS le calculer soi-meme a partir d un pourcentage.
  * finances.fonds_travaux_pct_vote = un pourcentage UNIQUEMENT si une resolution l a REELLEMENT VOTE (formulation type : "l assemblee decide de fixer la cotisation au fonds de travaux a X% du budget", "resolution adoptee"). 
  * ⚠️ PIEGE FREQUENT : la phrase "il est fait rappel de la cotisation au fonds travaux obligatoire a hauteur de minimum 5% du budget annuel" est un RAPPEL DE LA LOI ALUR, PAS UN VOTE. Elle figure dans presque tous les PV, sans qu aucune resolution ne porte sur le fonds de travaux. Dans ce cas : fonds_travaux = null, fonds_travaux_pct_vote = null, fonds_travaux_resolution_adoptee = false, fonds_travaux_statut = "non_mentionne". Idem pour toute formule generique citant le minimum legal ("minimum 5%", "au moins 5%", "conformement a la loi ALUR").
  * Un pourcentage n est PAS un montant : ne jamais transformer une regle en euros. Si seul le minimum legal est rappele, l information a retenir est "aucune cotisation votee identifiee dans les documents fournis" — c est une information utile pour l acheteur, pas un vide a combler.
- RÈGLE FONDS RATTACHES AU LOT (finances.fonds_rattaches_lot) : UNIQUEMENT si AUCUN pre-etat date / etat date n est fourni (si un pre-etat date est fourni, laisser null : il est prioritaire via pre_etat_date.fonds_travaux_alur / fonds_roulement_acheteur). Le montant du fonds de travaux rattache aux lots = la somme DEJA COTISEE par le coproprietaire vendeur (capital constitue), presentee dans le DERNIER appel de charges sous un rappel type "pour memoire", "situation de vos fonds", "fonds constitues", "participation aux fonds" (quelle que soit la denomination exacte du syndic). Ce n est JAMAIS la cotisation appelee pour le trimestre en cours. Si plusieurs lots ont chacun leur montant : ADDITIONNER pour afficher le total. Extraire de meme l avance de tresorerie si distinguee. fonds_rattaches_lot.source = "Appel de charges [periode]". Si aucun rappel de ce type n apparait clairement dans le document : null (le pre-etat date le confirmera). Ces montants sont du CAPITAL a rembourser au vendeur a la signature — PAS des charges recurrentes, ne JAMAIS les ajouter a charges_annuelles_lot.
- RÈGLE AFFICHAGE FINANCES LOT (UI) : NE JAMAIS mentionner "taxe fonciere" dans les labels ou textes concernant les finances copro du lot. La taxe fonciere est un impot, pas une charge copro. Si l onglet affiche un texte d aide, il doit etre : "Uploadez un appel de charges OU un pre-etat date pour obtenir ces informations." (Sans mention de taxe fonciere.)
- finances.budgets_historique = un objet PAR ANNEE reellement documentee : [{annee: "2023", budget_total: 184000, charges_reelles: 176420, fonds_travaux: 12500, charges_lot: 3200}]. Laisser null si aucun PV fourni.
  REGLE ABSOLUE — NE JAMAIS CONFONDRE CES DEUX CHIFFRES :
  * budget_total = le budget PREVISIONNEL **VOTE** pour cet exercice. Formulation type : "l assemblee generale fixe le budget de l exercice du 01/01/N au 31/12/N a X euros". C est une PREVISION.
  * charges_reelles = les comptes REELLEMENT depenses sur cet exercice, tels qu approuves. Formulation type : "approuve les comptes de charges dudit exercice [01/01/N au 31/12/N] pour un montant de X euros". C est une DEPENSE CONSTATEE.
  Les comptes d une annee N sont approuves dans le PV de l annee N+1 : un PV de 2024 qui approuve les comptes 2023 renseigne donc charges_reelles de l ANNEE 2023, jamais budget_total de 2024. Ranger chaque chiffre dans SA colonne et dans SON annee. Ne JAMAIS recopier un montant de comptes approuves dans budget_total.
  INTERDICTION D INVENTER UNE ANNEE : une annee n apparait dans budgets_historique que si au moins un des deux chiffres est ECRIT dans un document fourni. Deux PV d AG ne peuvent pas produire quatre annees de budgets votes. Si une annee n a qu un seul des deux chiffres, remplir ce champ et laisser l autre a null — ne jamais completer par deduction, ni recopier la valeur d une annee voisine.
  BUDGET VOTE DEUX FOIS POUR LE MEME EXERCICE (courant avec le vote "par exercice d avance") : garder le montant du PV le PLUS RECENT dans budget_total, et signaler la revision dans points_vigilance avec les deux montants et leurs dates d AG.
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
- lot_achete.parties_privatives : lister TOUS les lots privatifs vendus (appartement + cave + parking + grenier...). NOMS DE CHAMPS OBLIGATOIRES, aucun autre nom accepte : "numero_lot" (le numero seul, ex "30" — sans le mot "lot"), "designation" (la designation lue dans le document, ex "Appartement de 5 pieces au 2eme etage, aile A" / "Cave C1 au sous-sol" / "Emplacement de voiture P13"), "tantiemes" (son tantieme PROPRE au format "num/den", ex "235/10070"). Les trois champs sont a remplir pour chaque lot ; "designation" ne doit JAMAIS etre vide des lors que le document decrit le lot. Chaque lot = son tantieme general PROPRE, lu sur SA ligne du tableau des lots (en-tete de l appel de charges, RCP, etat descriptif de division ou pre-etat date). REGLE ANTI-DOUBLON CRITIQUE : NE JAMAIS prendre le tantieme de la ligne "Charges communes generales" (ou "charges communes", "base de repartition", "total tantiemes") d un appel de charges comme le tantieme d un lot — cette valeur est la SOMME des lots du vendeur (ex : 255 = appartement 235 + cave 20) et l attribuer a un seul lot fausse le total par double comptage. Toujours descendre au tantieme INDIVIDUEL de chaque lot.
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

- vie_copropriete.nb_lots_total / nb_lots_detail / nb_batiments : extraire depuis PV d'AG, carnet d'entretien, RCP ou pré-état daté. Ne jamais additionner nb_lots_total si non mentionné : si aucun document ne donne le total, laisser null.
- vie_copropriete.lots_enumeres (PRIORITAIRE des qu un etat descriptif de division est disponible) : TRANSCRIRE la liste des lots, UNE ENTREE PAR LOT NUMEROTE, dans l ordre. Tu TRANSCRIS, tu ne comptes pas : le comptage est fait ensuite par le systeme. Pour chaque lot : "numero" = le numero seul en chiffres (LOT NUMERO VINGT SEPT => 27), "designation" = la designation recopiee, "categorie" = la case qui convient (memes categories que nb_lots_detail), "tantiemes" = la quote-part de CE lot au format "num/den" telle qu ecrite (ex "116/100000"), null si absente. REGLES ABSOLUES : (1) une entree = un "LOT NUMERO X", jamais autre chose ; (2) NE JAMAIS creer d entree sans numero — un bloc orphelin en haut de page (suite d une description coupee, type "Jouissance de la partie du jardin... 1.211/10.000emes") est la FIN du lot precedent, PAS un nouveau lot ; (3) ⚠️ MODIFICATIF INTEGRE A L ACTE : si un lot a ete DIVISE par un modificatif (un duplex devenu deux appartements, une cave devenue "7" et "7 bis"), les nouveaux lots sont numerotes A LA SUITE des anciens. Le lot d ORIGINE n existe plus : ne PAS le lister en plus de ses remplacants, sinon la copropriete compte deux fois les memes m². Indice : la somme des tantiemes depasse le denominateur. Dans le doute, transcrire quand meme les deux et laisser le systeme trancher par les tantiemes ; (4) ne jamais compter la description generale de l immeuble en preambule ; (5) un lot cite deux fois (report de page) = une seule entree ; (6) le nombre d entrees doit correspondre au total annonce par le document lui-meme : si l acte ecrit "divise en N lots numerotes de 1 a N", la liste contient N entrees, numerotees de 1 a N, sans trou ni doublon. Ce N est TOUJOURS lu dans le document en cours — ne jamais reprendre un nombre vu ailleurs ni un nombre donne en exemple. En SYNTHESE SUR EXTRAITS, chaque fait "LOT <numero> | <designation> | <tantiemes>" donne exactement une entree, et tout fait "PREAMBULE NON COMPTABLE" est ignore. Si aucun etat descriptif n est disponible : laisser lots_enumeres a [] et remplir nb_lots_detail comme avant. GARDE-FOU TAILLE : si le document annonce plus de 150 lots, laisser lots_enumeres a [] et remplir nb_lots_detail comme avant — transcrire des centaines de lignes ferait depasser le temps maximum de generation.
- RÈGLE CATEGORIES nb_lots_detail (repartition des lots par type) :
  * logements = appartements + studios (lots d habitation principaux du batiment)
  * maisons = maisons individuelles ou pavillons inclus dans la copropriete (frequent : 2-3 maisons a l arriere d un immeuble)
  * chambres_service = chambres de service / chambres de bonne (lots d une piece, souvent designes "chambre de service N°X" au RDC ou en etage de service)
  * parkings = emplacements de parking, garages, boxes
  * caves = caves
  * commerces = locaux commerciaux ou professionnels
  * autres = tout lot ne rentrant dans aucune categorie ci-dessus : piece isolee rattachable a un appartement contigu, grenier, cellier, debarras, local technique, local velos, jardin constitue en lot, local de reserve...
  BLOCS A NE JAMAIS OUBLIER : si un COMPROMIS / promesse / acte de vente figure parmi les documents, les blocs "compromis" ET "bien" DOIVENT etre remplis a partir de ses extraits — ce sont les blocs les plus importants pour l acheteur. Ne jamais les laisser a null quand le document est present. Idem pour "pre_etat_date" si un pre-etat date est fourni.
  SYNTHESE SUR EXTRAITS (gros dossier) : si tu ne recois pas les documents mais des extraits de faits, les faits commencant par "LOT <numero> |" CONSTITUENT l etat descriptif de division — ils sont ta source de comptage. Les compter UN PAR UN (1 fait "LOT ..." = 1 lot = 1 unite dans UNE seule categorie), classer chacun d apres sa designation, et poser nb_lots_detail sur ce comptage. IGNORER TOTALEMENT tout fait prefixe "PREAMBULE NON COMPTABLE" : il redecrit les memes locaux et creerait des lots fantomes. Si le nombre de faits "LOT ..." est inferieur au total annonce, ne pas completer au jugement : ranger l ecart dans "autres".
  SOURCE EXCLUSIVE DU COMPTAGE : quand le detail vient d un RCP, compter UNIQUEMENT l etat descriptif de division (la liste lot par lot "LOT NUMERO UN...", "LOT NUMERO DEUX..." ou le tableau recapitulatif des lots). NE JAMAIS compter en plus la description generale de l immeuble en preambule ("l ensemble comprendra : ... un appartement et une chambre a chaque etage...") : elle decrit LES MEMES locaux que l etat descriptif et les compter deux fois cree des lots fantomes. Chaque lot numerote = 1 unite dans UNE seule categorie, rien d autre.
  AUTO-CONTROLE OBLIGATOIRE : quand un document liste TOUS les lots (RCP avec division par lots, etat descriptif de division, tableau recapitulatif), la SOMME des categories de nb_lots_detail DOIT etre EXACTEMENT egale a nb_lots_total. Si l addition ne tombe pas juste, relire le tableau des lots ligne par ligne et ranger chaque lot oublie dans sa categorie (ou dans autres) — aucun lot ne doit disparaitre de la repartition. Exemple : RCP de 49 lots = 13 caves + 13 garages + 7 chambres de service + 13 logements (12 appartements + 1 studio) + 3 pieces isolees => logements=13, chambres_service=7, parkings=13, caves=13, autres=3, somme=49. Si les documents ne detaillent PAS les lots (ex : PV d AG donnant seulement "88 lots"), remplir uniquement nb_lots_total et laisser les categories a null — ne jamais inventer une repartition.
- RÈGLE COMPOSITION vs MODIFICATIFS RCP : le chiffre EXPLICITEMENT ECRIT le plus RECENT fait foi, sans jamais calculer soi-meme :
  * Si le RCP integre deja son ou ses modificatifs dans le meme acte (mention type "et de son modificatif de ce jour") : ses chiffres sont a jour, les recopier tels quels.
  * Si un document MODIFICATIF_RCP separe et POSTERIEUR au RCP ecrit explicitement un nouveau total de lots ou une nouvelle composition (ex : "l immeuble est desormais divise en 40 lots") : recopier CES chiffres dans nb_lots_total / nb_lots_detail (source la plus recente fait foi) et mentionner la date du modificatif dans le resume de la copropriete.
  * Si un modificatif posterieur cree/supprime/fusionne des lots SANS donner de nouveau total : NE JAMAIS faire l arithmetique soi-meme (pas de +1/-1). Garder les chiffres du RCP d origine ET ajouter un point_vigilance : "Un modificatif de [annee] modifie le nombre de lots — la composition affichee provient du reglement d origine, verifier l etat descriptif a jour aupres du syndic ou du notaire."
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
  * ⛔ INTERDICTION ABSOLUE, SANS AUCUNE CONDITION : pre_etat_date.fonds_travaux_alur ne doit JAMAIS etre recopie dans finances.fonds_travaux NI dans finances.fonds_travaux_total_constitue. C est un montant qui concerne LE VENDEUR, pas la copropriete. Cette interdiction s applique QUEL QUE SOIT le reste du dossier (avec ou sans PV d AG, avec ou sans fiche synthetique). finances.fonds_travaux reste null si aucun document ne donne la cotisation ANNUELLE de la COPROPRIETE.
  * ⚠️ PIEGE DE LA PARTIE III DU PRE-ETAT DATE : cette partie enchaine des lignes de PORTEES DIFFERENTES sans le signaler. "Etat global des impayes de charges au sein de la copropriete" et "Etat global de la dette du Syndicat vis-a-vis des Fournisseurs" sont bien des montants COPRO. Mais la ligne suivante, "Fonds de travaux (Art 14-2...)", est la part rattachee AUX LOTS CEDES — c est ce que le decret impose d y faire figurer — et la ligne d apres, "Montant de la derniere cotisation appelee au cedant", concerne aussi le vendeur. Ne JAMAIS supposer que tout le bloc est au niveau copro : ces deux montants vont dans pre_etat_date.fonds_travaux_alur et pre_etat_date.fonds_travaux_trimestriel, jamais dans finances.
  * CONTROLE DE VRAISEMBLANCE : le fonds de travaux d une COPROPRIETE se compare a son budget annuel (minimum legal 5%). Un montant de quelques centaines d euros face a un budget de plusieurs dizaines de milliers est forcement une part de lot, jamais un total copro. En cas de doute sur la portee d un montant : le ranger dans pre_etat_date (vendeur), jamais dans finances (copro).
  * Consequence scoring : fonds_travaux_statut se juge TOUJOURS cotisation de l exercice X contre budget du MEME exercice X (voir RÈGLE RESOLUTION FONDS TRAVAUX ci-dessous), JAMAIS a partir de pre_etat_date.fonds_travaux_alur (capital lot), et JAMAIS en croisant deux exercices differents. Si finances.fonds_travaux est null et non reconstituable, mettre fonds_travaux_statut = "non_mentionne", PAS "insuffisant".

- RÈGLE RESOLUTION FONDS TRAVAUX (la resolution ADOPTEE fait foi) : quand un PV d AG contient une resolution ADOPTEE fixant la cotisation au fonds de travaux :
  * finances.fonds_travaux_resolution_adoptee = true
  * finances.fonds_travaux_pct_vote = le pourcentage vote si la resolution l exprime en % du budget (ex : "a 5 % du budget previsionnel de l exercice 2023" => 5). Laisser null si la resolution fixe un montant sans pourcentage.
  * finances.fonds_travaux_annee = l EXERCICE cite dans la resolution (ex : 2023), PAS l annee de tenue de l AG si differente.
  * Si la resolution donne le montant en euros : finances.fonds_travaux = ce montant. Si elle ne donne QUE le pourcentage : CALCULER finances.fonds_travaux = pourcentage x budget vote pour ce MEME exercice (adopte dans le meme PV ou present dans budgets_historique).
  * COHERENCE STATUT : une resolution adoptee fixant la cotisation a 5 % du budget de son exercice = "conforme" PAR DEFINITION (7,5-9,9 % = "bien", >= 10 % = "excellent"). Ne JAMAIS marquer "insuffisant" un fonds dont la resolution adoptee fixe >= 5 % — meme si la division par le budget d un AUTRE exercice (ex : budget N+1 vote dans le meme PV) donnerait moins de 5 %. Exemple reel : cotisation 2023 = 4 500 EUR = 5 % du budget 2023 (90 000 EUR) => "conforme", meme si 4 500 / 95 000 (budget 2024) = 4,7 %.
- RÈGLE FONDS TRAVAUX CONSTITUE (capital total copro — TROISIEME notion distincte) : si un document mentionne le montant TOTAL du fonds de travaux constitue au niveau de la COPROPRIETE ("le montant du fonds de travaux constitue a ce jour s eleve a...", "solde du fonds de travaux", "montant du fonds au 31/12/..."), remplir finances.fonds_travaux_total_constitue (euros) et finances.fonds_travaux_total_constitue_date (date ou annee de reference ; pour "a ce jour" dans un PV, prendre la date de l AG). Ne confondre NI avec la cotisation annuelle (finances.fonds_travaux), NI avec la part rattachee au lot du vendeur (pre_etat_date.fonds_travaux_alur / fonds_rattaches_lot). Si plusieurs mentions, prendre la plus recente.

- RÈGLE ERP (Etat des Risques et Pollutions) : le diagnostic ERP est TOUJOURS INFORMATIF, JAMAIS un point de vigilance. Ne JAMAIS mettre d elements issus de l ERP dans rapport.points_vigilance de la synthese finale. Cela inclut : zone inondable / PPRI (meme approuve), BASIAS, BASOL, CASIAS, ICPE, sismicite (toutes zones), potentiel radon (toutes categories), zonage bruit, arretes de catastrophe naturelle, sinistres indemnises, secteur d information sols (SIS). Tous ces elements restent affiches dans le diagnostic ERP du rapport (presence "informatif") ou l acheteur peut les consulter. Ton factuel, non alarmiste : l ERP fournit du contexte reglementaire local, pas une alerte sur le bien.

- RÈGLE DTG / PPPT (presence stricte) : vie_copropriete.dtg.present = true UNIQUEMENT si le CONTENU du DTG est reellement fourni dans le dossier (document DTG dedie, ou conclusions annexees in extenso dans un PV d AG avec leurs donnees chiffrees). Si le DTG ou le PPPT est seulement MENTIONNE dans un PV (remis, presente en AG, a voter, confie a un bureau d etudes) sans que son contenu figure au dossier : dtg.present = false, ne remplir NI etat_general NI budgets NI travaux_prioritaires, et ajouter dans avis_verimo.demarches une entree invitant a demander communication des conclusions. La mention d existence peut etre citee en points_vigilance si pertinente (ex: PPPT a voter prochainement), mais JAMAIS presentee comme un document analyse.

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


{"titre":"adresse complete","type_bien":"appartement|maison|maison_copro","annee_construction":null,"annee_construction_source":null,"annee_construction_precision":null,"annee_construction_fourchette":null,"score":14.5,"score_niveau":"Bien sain","resume":{"le_bien":null,"la_copropriete":null,"performance_energetique":null,"diagnostics_privatifs":null,"gouvernance_finances":null},"points_forts":[],"points_vigilance":[],"travaux":{"realises":[{"label":"desc","annee":"2021","montant_estime":35000,"justificatif":true}],"votes":[{"label":"desc","annee":"2027","montant_estime":4500,"charge_vendeur":false}],"evoques":[{"label":"desc","annee":null,"montant_estime":null,"precision":"contexte"}],"estimation_totale":null},"finances":{"budget_total_copro":null,"budget_total_copro_annee":null,"charges_annuelles_lot":null,"charges_annuelles_lot_source":null,"cotisation_fonds_travaux_lot_annuelle":null,"fonds_rattaches_lot":{"avance_tresorerie":null,"fonds_travaux_alur":null,"source":null},"fonds_travaux":null,"fonds_travaux_annee":null,"fonds_travaux_pct_vote":null,"fonds_travaux_resolution_adoptee":null,"fonds_travaux_total_constitue":null,"fonds_travaux_total_constitue_date":null,"fonds_travaux_statut":"non_mentionne|insuffisant|conforme|bien|excellent|absent","impayes":null,"type_chauffage":null,"chauffage_individuel":null,"eau_chaude_individuelle":null,"taxe_fonciere_annuelle":null,"taxe_fonciere_annee":null,"budgets_historique":null},"procedures":[{"label":"Type","type":"copro_vs_syndic|impayes|contentieux|autre","gravite":"faible|moderee|elevee","message":"Explication claire 2-3 phrases"}],"diagnostics_resume":"resume global","diagnostics":[{"type":"DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|CARREZ|AUTRE","label":"nom complet","perimetre":"lot_privatif|parties_communes","localisation":"localisation","resultat":"resultat avec GES si DPE","presence":"detectee|absence|non_realise","alerte":null,"pieces_detail":null}],"documents_analyses":[{"type":"PV_AG|REGLEMENT_COPRO|APPEL_CHARGES|DPE|DDT|DIAGNOSTIC|COMPROMIS|ETAT_DATE|TAXE_FONCIERE|CARNET_ENTRETIEN|MODIFICATIF_RCP|PRE_ETAT_DATE|DIAGNOSTIC_PARTIES_COMMUNES|FICHE_SYNTHETIQUE|AUDIT_ENERGETIQUE|ASSAINISSEMENT|ASL_CHIFFRES|ASL_REGLES|HISTORIQUE_TRAVAUX|AUTRE","annee":null,"nom":"nom fichier"}],"documents_manquants":[],"asl_mentionnee":{"detectee":false,"statut":null,"source":null},"vie_asl":{"present":false,"structures":[]},"negociation":{"applicable":false,"elements":[]},"vie_copropriete":{"syndic":{"nom":null,"type":"professionnel|benevole","gestionnaire":null,"fin_mandat":null,"tensions_detectees":false,"tensions_detail":null,"statut":null,"sortant":null,"entrant":null,"annee_changement":null,"nb_ags_analysees":null,"historique_changements":[]},"nb_lots_total":null,"nb_lots_detail":{"logements":null,"maisons":null,"chambres_service":null,"parkings":null,"caves":null,"commerces":null,"autres":null},"lots_enumeres":[{"numero":null,"designation":"...","categorie":"logements|maisons|chambres_service|parkings|caves|commerces|autres","tantiemes":null}],"nb_batiments":null,"participation_ag":[{"annee":"2024","copropietaires_presents_representes":"18/24","taux_tantiemes_pct":"72%","quorum_note":null,"quitus":{"soumis":true,"approuve":true,"detail":null}}],"tendance_participation":"Non determinable","analyse_participation":"analyse","travaux_votes_non_realises":[],"appels_fonds_exceptionnels":[],"questions_diverses_notables":[],"dtg":{"present":false,"etat_general":null,"budget_urgent_3ans":null,"budget_total_10ans":null,"travaux_prioritaires":[]},"regles_copro":[{"label":"...","statut":"autorise|interdit|sous_conditions","impact_rp":false,"impact_invest":false}],"carnet_entretien":{"present":false,"date_maj":null,"immatriculation_registre":null,"equipements_copro":{"chauffage_collectif":null,"type_chauffage":null,"eau_chaude_collective":null,"eau_froide_collective":null,"fibre_optique":null,"ascenseur":null},"contrats_entretien":[{"equipement":"...","prestataire":null,"periodicite":null,"date_reconduction":null}],"travaux_realises_carnet":[{"annee":null,"label":"...","entreprise":null,"montant":null}],"travaux_en_cours_votes_carnet":[{"label":"...","date_ag":null,"montant":null}],"diagnostics_parties_communes_carnet":[{"type":"amiante|plomb|termites|ascenseur|autre","date":null,"entreprise":null,"resultat":"negatif|positif|non_effectue","commentaire":null}],"conseil_syndical_carnet":{"date_nomination":null,"nb_membres":null}},"modificatifs_rcp":[{"date_acte":null,"notaire":null,"type_modification":"creation_lot|suppression_lot|changement_usage|mise_a_jour_tantiemes|servitude|fusion_lots|autre","sur_quoi_porte":[{"aspect":"...","detail":"..."}],"impact_acheteur":"...","points_attention":[]}],"fiche_synthetique":{"present":false,"date":null,"fiche_recente":null,"immatriculation_registre":null,"dtg_realise":null,"dtg_date":null,"equipements_collectifs_detail":[]}},"lot_achete":{"titre_propriete":{"present":false,"nature":"attestation_propriete|acte_de_vente|attestation_succession|donation|autre","date_acte":null,"date_entree_jouissance":null,"anciennete_detention_annees":null,"prix_acquisition":null,"notaire":{"nom":null,"etude":null,"ville":null},"proprietaires_actuels":[{"nom_complet":null,"profession":null,"nationalite":null,"adresse":null,"situation_matrimoniale_citation":null,"peut_vendre_seul":null,"part_indivision":null}],"vendeurs_precedents":[{"nom_complet":null,"qualite":null}],"references_cadastrales":[{"section":null,"numero":null,"lieudit":null,"contenance":null}],"date_etat_descriptif_origine":null,"lots_detenus":[{"numero":null,"designation":null,"etage":null,"nb_pieces":null,"tantiemes":null,"base_tantiemes":null}],"coherence":{"vendeur_conforme_compromis":null,"lots_conformes_compromis":null,"tantiemes_conformes":null,"ecarts":[]}},"quote_part_tantiemes":null,"parties_privatives":[{"numero_lot":null,"designation":"...","tantiemes":null}],"impayes_detectes":null,"fonds_travaux_alur":null,"travaux_votes_charge_vendeur":[],"restrictions_usage":[],"points_specifiques":[],"compromis":{"present":false,"type_avant_contrat":null,"date_signature":null,"date_acte_prevue":null,"delai_acte_mois":null,"vendeurs":[],"acheteurs":[],"notaires":[],"agence":null,"bien":{"adresse_complete":null,"reference_cadastrale_principale":null,"type_bien_global":null,"nb_pieces":null,"etage":null,"surface_carrez":null,"usage_declare":null,"lots_cedes":[],"rcp_date_acte":null,"rcp_nb_modificatifs":null,"origine_propriete":{"date_acquisition_vendeur":null,"mode_acquisition":null}},"finances":{"prix_net_vendeur":null,"prix_mobilier":null,"honoraires_agence":null,"honoraires_charge":null,"honoraires_pct":null,"prix_total_acte":null,"depot_garantie_montant":null,"depot_garantie_pct":null,"depot_garantie_detenteur":null,"prorata_taxe_fonciere":null,"clause_penale_pct":null,"frais_notaire_estimes_verimo":null,"frais_notaire_pct_verimo":null,"cout_total_estime_acheteur_verimo":null},"financement":{"modalite":null,"apport":null,"montant_pret_max":null,"duree_pret_max_mois":null,"taux_pret_max_pct":null,"etablissement_pressenti":null},"conditions_suspensives":[],"calendrier":[],"droits_preemption":[],"diagnostics_annexes":[],"annexes_copropriete_l721_2":null,"copropriete_finances_synthese":null,"situation_locative":null,"clauses_critiques":[],"servitudes":[]}},"pre_etat_date":{"present":false,"date":null,"syndic":null,"impayes_vendeur":0,"fonds_travaux_alur":null,"fonds_travaux_ancien":null,"fonds_roulement_acheteur":null,"fonds_roulement_modalite":"remboursement_vendeur|reconstitution_syndicat","honoraires_syndic":null,"charges_futures":{"montant_trimestriel":null,"fonds_travaux_trimestriel":null,"montant_annuel":null},"travaux_charge_vendeur":[],"procedures_contre_vendeur":[],"procedures_copro":"neant|en_cours","impayes_copro_global":null,"dette_fournisseurs":null,"fonds_travaux_copro_global":null,"historique_charges":[{"exercice":"N-1","annee":null,"budget_appele":null,"charges_reelles":null,"provisions_hors_budget":null},{"exercice":"N-2","annee":null,"budget_appele":null,"charges_reelles":null,"provisions_hors_budget":null}]},"dpe_recommandations":{"present":false,"format":"standard|ancien|aucune","version_methode":"3CL_2021|3CL_2012|factures|inconnue","evolution_etiquette":{"actuelle":{"classe":null,"kwh_m2":null,"ges_kg_m2":null},"apres_pack_1":{"classe":null,"kwh_m2":null,"ges_kg_m2":null},"apres_pack_1_et_2":{"classe":null,"kwh_m2":null,"ges_kg_m2":null}},"pack_1":{"cout_min":null,"cout_max":null,"travaux":[{"poste":"mur|toiture|plancher_bas|fenetres|porte|chauffage|eau_chaude|ventilation|autre","description":"...","performance_cible":null,"decision_copropriete":false,"autorisation_urbanisme":false}]},"pack_2":{"cout_min":null,"cout_max":null,"travaux":[{"poste":"mur|toiture|plancher_bas|fenetres|porte|chauffage|eau_chaude|ventilation|autre","description":"...","performance_cible":null,"decision_copropriete":false,"autorisation_urbanisme":false}]}},"historique_travaux":{"present":false,"entreprise":{"nom":null,"siret":null,"contact":null,"assurance_decennale":null},"travaux":[{"poste":null,"description":null,"montant":null,"date":null}],"montant_total":null,"date_plus_recente":null,"garantie_decennale_possible":null},"assainissement":{"present":false,"type_reseau":"collectif|non_collectif|null","conforme":null,"date_controle":null,"observations":null},"categories":{"travaux":{"note":4,"note_max":5},"procedures":{"note":4,"note_max":4},"finances":{"note":3,"note_max":4},"diags_privatifs":{"note":2,"note_max":4},"diags_communs":{"note":1.5,"note_max":3}},"avis_verimo":{"verdict":"phrase unique de lecture globale","verdict_highlight":"2-4 mots cles du verdict","contexte":"2-3 phrases de cadrage (quartier, type de copro, trajectoire reglementaire) — PAS de constat deja dans resume ou points_forts/vigilance","demarches":[{"titre":"point a approfondir ou question a poser","description":"1-2 phrases explicatives. Formulation neutre : jamais d imperatif, jamais de conseil direct."}]}}`;
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

    const tCallAI = Date.now();
    let result = await callAI({ system: buildSystemPrompt(mode, profil, typeBienDeclare), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
    clearInterval(progressInterval);
    let report = result.error ? null : parseJson<Record<string, unknown>>(result.text);

    // 🆕 Retry uniquement si le 1er essai a echoue RAPIDEMENT. Un essai qui a consomme
    // plusieurs minutes ne laisse aucun budget pour un second : on relancait quand meme,
    // on retimeoutait, et on payait deux fois.
    if (!result.error && !report && (Date.now() - tCallAI) < MAP_RETRY_WINDOW_MS) {
      console.warn('[analyser-run] JSON invalide (echec rapide) — retry 5s');
      await sleep(5000);
      result = await callAI({ system: buildSystemPrompt(mode, profil, typeBienDeclare), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
      report = result.error ? null : parseJson<Record<string, unknown>>(result.text);
    }

    // 🆕 RETRY CIBLE DPE/CARREZ — Avant suppression RGPD car on a encore besoin des fileIds.
    // Filet de sécurité si l'IA a oublié des détails critiques (1 seul appel max, non bloquant).
    if (mode !== 'document' && report && !result.error) {

    // 📋 ETAT DESCRIPTIF — appel dedie AVANT la suppression RGPD des fichiers.
    // On ne se fie pas a la liste produite par le grand prompt : elle est noyee
    // parmi ~200 champs. Un appel court et cible la remplace quand elle manque
    // ou qu'elle ne colle pas au total annonce par le document.
    try {
      const vieR = (report as Record<string, unknown>)?.vie_copropriete as Record<string, unknown> | undefined;
      const docR = report as Record<string, unknown>;
      const totalAnn = typeof vieR?.nb_lots_total === 'number' ? vieR.nb_lots_total as number
                     : typeof docR?.total_lots === 'number' ? docR.total_lots as number : null;
      const listeActuelle = Array.isArray(vieR?.lots_enumeres) ? vieR!.lots_enumeres as unknown[]
                          : Array.isArray(docR?.lots_enumeres) ? docR.lots_enumeres as unknown[] : [];
      const aUnRcp = JSON.stringify(docR?.documents_analyses ?? '').includes('REGLEMENT_COPRO')
                  || JSON.stringify(docR?.documents_analyses ?? '').includes('RCP')
                  || docR?.document_type === 'RCP' || docR?.document_type === 'MODIFICATIF_RCP';
      const listeDouteuse = listeActuelle.length === 0 || (totalAnn != null && listeActuelle.length !== totalAnn);
      if (aUnRcp && listeDouteuse && fileIds.length > 0) {
        console.log(`[analyser-run] 📋 Liste des lots douteuse (${listeActuelle.length} vs ${totalAnn ?? '?'} annoncés) — extraction dédiée lancée`);
        const lotsDedies = await extraireLotsRCP(fileIds, apiKey, totalAnn);
        if (lotsDedies && lotsDedies.length > 0) {
          if (vieR) vieR.lots_enumeres = lotsDedies; else docR.lots_enumeres = lotsDedies;
          console.log(`[analyser-run] 📋 Liste remplacée : ${listeActuelle.length} → ${lotsDedies.length} lots`);
        }
      }
    } catch (e) {
      console.error('[analyser-run] Extraction dédiée EDD (non bloquant):', e);
    }

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
      } else if (result.error === 'truncated') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'truncated', 'Le rapport genere etait trop volumineux pour etre finalise. Votre credit a ete rembourse automatiquement. Contactez le support.', 'Reponse tronquee (max_tokens atteint)', 'critical');
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
    // 🔢 MODE DOCUMENT — recomptage deterministe des lots d'un RCP analyse seul.
    // Le mode document ne passe pas par recalculerCategories : il a donc son
    // propre point d'entree, sinon l'analyse simple d'un RCP garderait le
    // comptage approximatif du moteur (bug 41 lots au lieu de 39).
    if (mode === 'document') {
      try {
        appliquerRecomptageDocument(report as Record<string, unknown>);
      } catch (e) {
        console.error('[analyser-run] Recomptage lots RCP (non bloquant):', e);
      }
    }

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
        try { croiserTitrePropriete(report); } catch (e) { console.error('[analyser-run] croiserTitrePropriete (non bloquant):', e); }
        report = construireChecklist(report as RapportShape) as Record<string, unknown>;
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

    const tCallAI = Date.now();
    let result = await callAI({ system: buildSystemPrompt(mode, profil, typeBienDeclare), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
    clearInterval(progressInterval);
    let report = result.error ? null : parseJson<Record<string, unknown>>(result.text);

    // 🆕 Retry uniquement si le 1er essai a echoue RAPIDEMENT. Un essai qui a consomme
    // plusieurs minutes ne laisse aucun budget pour un second : on relancait quand meme,
    // on retimeoutait, et on payait deux fois.
    if (!result.error && !report && (Date.now() - tCallAI) < MAP_RETRY_WINDOW_MS) {
      console.warn('[analyser-run] JSON invalide (echec rapide) — retry 5s');
      await sleep(5000);
      result = await callAI({ system: buildSystemPrompt(mode, profil, typeBienDeclare), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
      report = result.error ? null : parseJson<Record<string, unknown>>(result.text);
    }

    // 🆕 RETRY CIBLE DPE/CARREZ — Avant suppression RGPD (non bloquant).
    if (mode !== 'document' && report && !result.error) {

    // 📋 ETAT DESCRIPTIF — appel dedie AVANT la suppression RGPD des fichiers.
    // On ne se fie pas a la liste produite par le grand prompt : elle est noyee
    // parmi ~200 champs. Un appel court et cible la remplace quand elle manque
    // ou qu'elle ne colle pas au total annonce par le document.
    try {
      const vieR = (report as Record<string, unknown>)?.vie_copropriete as Record<string, unknown> | undefined;
      const docR = report as Record<string, unknown>;
      const totalAnn = typeof vieR?.nb_lots_total === 'number' ? vieR.nb_lots_total as number
                     : typeof docR?.total_lots === 'number' ? docR.total_lots as number : null;
      const listeActuelle = Array.isArray(vieR?.lots_enumeres) ? vieR!.lots_enumeres as unknown[]
                          : Array.isArray(docR?.lots_enumeres) ? docR.lots_enumeres as unknown[] : [];
      const aUnRcp = JSON.stringify(docR?.documents_analyses ?? '').includes('REGLEMENT_COPRO')
                  || JSON.stringify(docR?.documents_analyses ?? '').includes('RCP')
                  || docR?.document_type === 'RCP' || docR?.document_type === 'MODIFICATIF_RCP';
      const listeDouteuse = listeActuelle.length === 0 || (totalAnn != null && listeActuelle.length !== totalAnn);
      if (aUnRcp && listeDouteuse && fileIds.length > 0) {
        console.log(`[analyser-run] 📋 Liste des lots douteuse (${listeActuelle.length} vs ${totalAnn ?? '?'} annoncés) — extraction dédiée lancée`);
        const lotsDedies = await extraireLotsRCP(fileIds, apiKey, totalAnn);
        if (lotsDedies && lotsDedies.length > 0) {
          if (vieR) vieR.lots_enumeres = lotsDedies; else docR.lots_enumeres = lotsDedies;
          console.log(`[analyser-run] 📋 Liste remplacée : ${listeActuelle.length} → ${lotsDedies.length} lots`);
        }
      }
    } catch (e) {
      console.error('[analyser-run] Extraction dédiée EDD (non bloquant):', e);
    }

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
      } else if (result.error === 'truncated') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'truncated', 'Le rapport genere etait trop volumineux pour etre finalise. Votre credit a ete rembourse automatiquement. Contactez le support.', 'Reponse tronquee (max_tokens atteint)', 'critical');
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
    // 🔢 MODE DOCUMENT — recomptage deterministe des lots d'un RCP analyse seul.
    // Le mode document ne passe pas par recalculerCategories : il a donc son
    // propre point d'entree, sinon l'analyse simple d'un RCP garderait le
    // comptage approximatif du moteur (bug 41 lots au lieu de 39).
    if (mode === 'document') {
      try {
        appliquerRecomptageDocument(report as Record<string, unknown>);
      } catch (e) {
        console.error('[analyser-run] Recomptage lots RCP (non bloquant):', e);
      }
    }

    if (mode !== 'document') {
      try {
        report = recalculerCategories(report as RapportShape, profil) as Record<string, unknown>;
      } catch (e) {
        console.error('[analyser-run] Erreur recalcul categories (non bloquant):', e);
      }

      // 🆕 VALIDATION DETERMINISTE DES DIAGS OBLIGATOIRES MANQUANTS
      try {
        report = validateDiagsManquants(report as RapportShape) as Record<string, unknown>;
        try { croiserTitrePropriete(report); } catch (e) { console.error('[analyser-run] croiserTitrePropriete (non bloquant):', e); }
        report = construireChecklist(report as RapportShape) as Record<string, unknown>;
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

// ══════════════════════════════════════════════════════════════════════
// 🗺️ MAP-REDUCE (analyses complètes ≥ SEUIL_MAP_REDUCE docs)
// Invocation 1 (phase MAP)    : 1 appel IA par doc, tous EN PARALLÈLE.
//   Extraction exhaustive → map_resultats (jsonb) → suppression RGPD des
//   PDF au fil de l'eau → self-invoke {phase:'reduce'} (nouveau chrono 400s).
// Invocation 2 (phase REDUCE) : relit map_resultats, 1 appel IA avec le
//   prompt v7 complet (règles métier inchangées), post-traitement
//   déterministe identique au v7, rapport final + documents_non_analyses.
// Docs en échec : le rapport se génère quand même (bandeau frontend) —
// échec total + remboursement UNIQUEMENT si aucun doc n'est analysable.
// ══════════════════════════════════════════════════════════════════════

interface ExtraitDoc {
  file_name: string;
  statut: 'ok' | 'echec';
  raison?: string;
  extraction?: Record<string, unknown>;
}

/* ══════════════════════════════════════════════════════════════
   📋 LOTS RECONSTRUITS DEPUIS LES EXTRAITS (gros dossier)
   ──────────────────────────────────────────────────────────────
   L'etape de LECTURE ecrit un fait par lot, au format impose :
       "LOT 27 | Aile A, RDC, appartement... | 1115/10000"
   Elle lit UN document a la fois avec un prompt court (~1200 tokens) :
   c'est l'etape la plus fiable de la chaine.

   L'etape de SYNTHESE, elle, doit remplir ~200 champs avec un prompt
   de ~21700 tokens. Lui redemander de recopier 38 lignes au milieu de
   tout ca, c'est la ou la liste se deforme (observe : 42 lots au lieu
   de 38, categories a 14/14/14).

   Donc on ne lui redemande pas : le CODE relit les faits "LOT n | ..."
   et reconstruit la liste. Zero appel supplementaire, zero cout,
   deterministe. Le moteur n'intervient plus sur ce champ.
══════════════════════════════════════════════════════════════ */
function construireLotsDepuisExtraits(extraits: ExtraitDoc[]): LotEnumere[] {
  const lots: LotEnumere[] = [];
  const vus = new Set<string>();
  for (const ex of extraits) {
    if (ex?.statut !== 'ok' || !ex.extraction) continue;
    // 🎯 FILTRE SOURCE : seul un REGLEMENT DE COPROPRIETE (ou son modificatif)
    // porte l'etat descriptif de division. Un pre-etat date ou un compromis
    // listent les lots DU VENDEUR (2 ou 3) — les prendre pour la composition de
    // l'immeuble donnait "4 lots" sur une copro de 38. Observe en production.
    const typeDoc = String((ex.extraction as Record<string, unknown>).type_detecte ?? '').toUpperCase();
    if (typeDoc !== 'REGLEMENT_COPRO' && typeDoc !== 'MODIFICATIF_RCP') continue;
    const faits = Array.isArray((ex.extraction as Record<string, unknown>).faits)
      ? (ex.extraction as Record<string, unknown>).faits as Array<Record<string, unknown>>
      : [];
    for (const f of faits) {
      const d = typeof f?.description === 'string' ? f.description.trim() : '';
      if (!d || /^PREAMBULE NON COMPTABLE/i.test(d)) continue;
      // "LOT 27 | designation | tantiemes"  (le separateur | est impose par le prompt)
      const m = d.match(/^LOT\s+(\d+)\s*\|\s*([^|]*?)\s*(?:\|\s*(.*))?$/i);
      if (!m) continue;
      const numero = m[1];
      if (vus.has(numero)) continue;
      vus.add(numero);
      lots.push({ numero, designation: (m[2] || '').trim(), tantiemes: (m[3] || '').trim() || null });
    }
  }
  return lots;
}

function buildMapPrompt(): string {
  return `Tu es le moteur d'extraction documentaire de Verimo, service d'analyse de biens immobiliers.
On te donne UN SEUL document. Ta mission : retranscrire TOUS les faits qu'il contient, sans jugement d'importance. Tu n'écris pas de rapport, tu ne donnes pas d'avis — tu extrais.

RÈGLES ABSOLUES :
1. Ne RIEN inventer. Une information absente du document = absente de ta sortie. Jamais de valeur devinée, estimée ou "probable". En cas d'information illisible, la signaler dans elements_illisibles.
2. Chaque fait est accompagné de sa page d'origine (numéro de page du PDF).
3. Pour tout montant de travaux : préciser le statut EXACT tel qu'écrit — "vote" (avec le numéro de résolution si présent), "evoque" (à l'étude, envisagé, devis demandé), ou "realise". En cas d'ambiguïté sur le statut, recopier la phrase exacte du document dans le champ citation. Ne JAMAIS classer "vote" dans le doute.
4. Ignorer uniquement : formules de politesse, rappels de loi génériques recopiés, mentions administratives répétitives. En cas de doute sur l'utilité d'un fait → le noter quand même.
5. Extraction EXHAUSTIVE : chaque chiffre, chaque date, chaque décision, chaque clause, chaque anomalie. Un fait omis est perdu définitivement.
6. Style TÉLÉGRAPHIQUE : descriptions courtes et factuelles, 1 phrase maximum par fait. L'exhaustivité porte sur le NOMBRE de faits capturés, jamais sur la longueur des phrases. Pas de reformulation, pas de contexte superflu.

PRÉCISIONS PAR TYPE (si applicable) :
- PV d'AG : chaque résolution avec son résultat (adoptée/rejetée), quitus au syndic (soumis ? approuvé ?), participation (présents/représentés, tantièmes), changement de syndic, questions diverses notables, appels de fonds.
- DPE : classe énergie ET classe GES, kWh/m², date du diagnostic, surface, ET si présents les packs de travaux recommandés (pack 1, pack 2, coûts min/max, évolution d'étiquette après chaque pack, détail des postes).
- DDT / Carrez : surface Carrez totale ET le détail pièce par pièce si présent (nom de pièce + surface). Chaque diagnostic du dossier (électricité, gaz, amiante, plomb, termites, ERP) avec son résultat et ses anomalies.
- Pré-état daté / état daté : TOUTES les rubriques financières (impayés vendeur, fonds travaux ALUR du lot, avances, honoraires syndic, charges par exercice N-1/N-2, impayés globaux copro, dettes fournisseurs, procédures).
- Règlement de copro : destination de l'immeuble, clauses restrictives (location, activité, travaux), tantièmes du lot si identifiable, servitudes.
- TITRE DE PROPRIÉTÉ (attestation de propriété, acte de vente authentique, attestation de succession, acte de donation — À DISTINGUER du compromis, qui est un AVANT-contrat) — EXTRACTION OBLIGATOIRE : nature exacte du document ; date de l'acte ; notaire et son étude ; identité complète du ou des propriétaires actuels avec leur situation matrimoniale RECOPIÉE MOT POUR MOT (elle détermine s'ils peuvent vendre seuls) ; identité des vendeurs précédents ; adresse et références cadastrales (section, numéro, contenance) ; POUR CHAQUE LOT détenu son numéro, sa désignation recopiée telle quelle, son étage et ses tantièmes ; date de l'état descriptif de division cité ; date d'entrée en jouissance ; prix d'acquisition s'il figure.
- MODIFICATIF AU RÈGLEMENT DE COPROPRIÉTÉ (acte notarié modifiant l'état descriptif ou le règlement) — EXTRACTION OBLIGATOIRE, un fait par élément : date de signature de l'acte ; nom du notaire et de son étude ; nature de la modification (division de lot, fusion, suppression, création, changement d'usage, mise à jour de tantièmes, servitude) ; POUR CHAQUE LOT concerné son numéro, sa désignation et ce qu'il devient (supprimé, divisé en lots n°X et n°Y, créé) ; tantièmes avant et après quand ils sont écrits ; nouveau nombre total de lots s'il est indiqué ; service de publicité foncière et date de publication ; servitudes créées ou supprimées.
- ÉTAT DESCRIPTIF DE DIVISION (dans un RCP, un modificatif ou un acte) — EXTRACTION OBLIGATOIRE LOT PAR LOT : si le document contient la liste numérotée des lots ("LOT NUMERO UN...", "LOT NUMERO DEUX...", ou un tableau récapitulatif des lots), créer UN fait PAR LOT NUMÉROTÉ, sans exception et sans regroupement, au format exact : "LOT <numéro> | <désignation textuelle du document> | <tantièmes>". Exemple : "LOT 1 | Au sous-sol, une cave C1 | 5/10000", "LOT 27 | Aile A, rez-de-chaussée, appartement : entrée, cuisine, séjour, trois chambres | 1115/10000". Ne jamais s'arrêter en cours de liste, ne jamais écrire "et ainsi de suite" : un immeuble divisé en N lots donne N faits, quel que soit N. Le nombre de lots est celui écrit dans le document en cours — jamais un nombre vu ailleurs. Noter aussi le total annoncé s'il est écrit (formulation type "divisé en N lots numérotés de 1 à N") dans chiffres_cles.
  ⚠️ NE PAS extraire comme des lots la description générale de l'immeuble en préambule (type "l'ensemble comprendra un appartement et une chambre à chaque étage") : elle décrit LES MÊMES locaux que l'état descriptif. Si ce préambule existe, le noter en UN SEUL fait explicitement préfixé "PREAMBULE NON COMPTABLE : ..." pour qu'il ne soit jamais confondu avec la liste des lots.
- CARNET D ENTRETIEN : date de mise a jour, equipements de l immeuble (chauffage, ascenseur, VMC, toiture...) avec pour chacun son etat, son annee de pose et son contrat d entretien ; TRAVAUX REALISES un par un (nature, annee, montant, entreprise) ; contrats en cours (prestataire, objet, echeance) ; diagnostics techniques des parties communes ; references des assurances de l immeuble.
- DTG / PPT (diagnostic technique global, plan pluriannuel de travaux) : date et auteur du diagnostic, etat apparent de chaque poste du bati, liste des TRAVAUX PRECONISES avec pour chacun le montant estime, l echeance et le degre d urgence, montant TOTAL des travaux projetes, situation du fonds de travaux au regard de ce montant.
- FICHE SYNTHETIQUE DE COPROPRIETE : nombre total de lots et sa ventilation, numero d immatriculation au registre, identite du syndic, budget previsionnel, montant du fonds de travaux constitue, impayes de charges, nombre de coproprietaires debiteurs, presence de procedures en cours.
- TAXE FONCIERE : annee, montant total, part communale / departementale / TEOM, references cadastrales, identite du redevable.
- ASL / AFUL / UNION D ASL : denomination, objet, perimetre, cotisation annuelle appelee et sa base de repartition, organes de gestion, travaux ou charges votes, obligations imposees aux membres.
- ASSURANCE (immeuble ou dommages-ouvrage) : assureur, numero de police, garanties couvertes, montant de la prime, franchises, periode de validite, sinistres declares.
- TITRE DE PROPRIETE / ACTE DE VENTE ANTERIEUR : date de l acte et notaire, identite du precedent vendeur et de l acquereur, prix payé, designation des lots, servitudes et charges grevant le bien, origine de propriete anterieure.
- COMPROMIS / PROMESSE DE VENTE / ACTE DE VENTE — EXTRACTION OBLIGATOIRE, ce document est central pour l acheteur : identite du VENDEUR et de l ACHETEUR, notaire du vendeur, notaire de l acquereur, agence immobiliere et montant de ses honoraires (a la charge de qui), PRIX DE VENTE (net vendeur, frais d agence, prix total), montant du depot de garantie / sequestre, date de signature du compromis, date limite de reiteration chez le notaire, duree du delai de retractation, CONDITIONS SUSPENSIVES une par une (pret : montant, taux max, duree, date butoir de l offre ; urbanisme ; servitudes ; autres) avec pour chacune sa date butoir, designation du BIEN vendu (adresse complete, numeros de lots, surface, etage, annexes cedees), mobilier inclus et sa valeur, clauses particulieres et penalites. Reprendre les montants EXACTEMENT comme ecrits, sans arrondir.
- Appels de charges / budgets : montants par période, budget total copro, fonds travaux.

FORMAT DE SORTIE — JSON STRICT, rien d'autre (pas de markdown, pas de commentaire) :
{"type_detecte":"PV_AG|REGLEMENT_COPRO|APPEL_CHARGES|DPE|DDT|DIAGNOSTIC|COMPROMIS|TITRE_PROPRIETE|ETAT_DATE|TAXE_FONCIERE|CARNET_ENTRETIEN|MODIFICATIF_RCP|PRE_ETAT_DATE|DIAGNOSTIC_PARTIES_COMMUNES|FICHE_SYNTHETIQUE|AUDIT_ENERGETIQUE|ASSAINISSEMENT|ASL_CHIFFRES|ASL_REGLES|HISTORIQUE_TRAVAUX|AUTRE","titre_document":"...","date_document":"AAAA-MM-JJ ou AAAA ou null","chiffres_cles":[{"intitule":"...","valeur":"...","unite":"€|m²|classe|%|kWh/m²|tantiemes|null","statut":"vote|evoque|realise|constate|null","page":0,"citation":null}],"alertes":[{"description":"...","gravite":"info|attention|critique","page":0}],"faits":[{"description":"...","page":0}],"elements_illisibles":[]}`;
}

// Extraction d'UN document — appelée en parallèle pour tous les docs.
// Retourne toujours un ExtraitDoc (jamais de throw) : statut ok ou echec.
async function extractOneDoc(
  file: { id: string; name: string },
  apiKey: string,
  deleteAfter = true, // 🆕 le COMPLEMENT garde les PDF le temps des extractions ciblees
): Promise<ExtraitDoc> {
  const userContent: unknown[] = [
    { type: 'document', source: { type: 'file', file_id: file.id } },
    { type: 'text', text: `[Document : ${file.name}] Extrais TOUS les faits de ce document. JSON strict uniquement.` },
  ];

  try {
    const t0 = Date.now();
    let result = await callAI({ system: buildMapPrompt(), userContent, maxTokens: MAP_MAX_TOKENS, apiKey, timeoutMs: MAP_TIMEOUT_MS });
    let extraction = result.error ? null : parseJson<Record<string, unknown>>(result.text);

    // JSON invalide (mais appel réussi) → retry UNIQUEMENT si l'échec a été rapide
    // (un essai qui a consommé plusieurs minutes ne laisse pas le budget pour un 2ème)
    if (!result.error && !extraction && (Date.now() - t0) < MAP_RETRY_WINDOW_MS) {
      console.warn(`[analyser-run][MAP] JSON invalide pour "${file.name}" (échec rapide) — retry 5s`);
      await sleep(5000);
      result = await callAI({ system: buildMapPrompt(), userContent, maxTokens: MAP_MAX_TOKENS, apiKey, timeoutMs: MAP_TIMEOUT_MS });
      extraction = result.error ? null : parseJson<Record<string, unknown>>(result.text);
    }

    if (result.error || !extraction) {
      const raison = result.error || 'json_invalide';
      console.error(`[analyser-run][MAP] Échec extraction "${file.name}" : ${raison}`);
      return { file_name: file.name, statut: 'echec', raison };
    }

    console.log(`[analyser-run][MAP] OK "${file.name}" (type détecté: ${(extraction as Record<string, unknown>).type_detecte || '?'})`);
    return { file_name: file.name, statut: 'ok', extraction };
  } catch (err) {
    console.error(`[analyser-run][MAP] Erreur inattendue "${file.name}":`, err);
    return { file_name: file.name, statut: 'echec', raison: 'erreur_inattendue' };
  } finally {
    // RGPD : suppression du PDF dès que son extraction est terminée (succès OU échec).
    // En mode complement, la suppression est différée : les extractions ciblées
    // (DPE/Carrez, etat descriptif) ont encore besoin des fichiers.
    if (deleteAfter) {
      try { await deleteFromFilesAPI(file.id, apiKey); } catch (e) { console.error(`[analyser-run][MAP] Suppression RGPD "${file.name}" échouée:`, e); }
    }
  }
}

// ─── PHASE MAP — invocation 1 ───
async function runPhaseMap(
  analyseId: string,
  files: Array<{ id: string; name: string }>,
  profil: string,
  supabaseAdmin: SupabaseClient,
  apiKey: string,
  typeBienDeclare?: string | null,
): Promise<void> {
  try {
    console.log(`[analyser-run][MAP] Démarrage — ${files.length} docs en parallèle | analyse ${analyseId}`);
    await supabaseAdmin.from('analyses').update({
      progress_current: 0,
      progress_total: files.length, // total = nb RÉEL de documents (le +1 "étape de synthèse" créait le faux "Document 6 sur 10" pour 9 docs — la synthèse a désormais son propre libellé côté front)
      progress_message: `Lecture des ${files.length} documents en parallèle...`,
    }).eq('id', analyseId);

    // Compteur de progression partagé entre les extractions parallèles
    let done = 0;
    const withProgress = async (file: { id: string; name: string }): Promise<ExtraitDoc> => {
      const extrait = await extractOneDoc(file, apiKey);
      done++;
      await supabaseAdmin.from('analyses').update({
        progress_current: done,
        progress_message: `Lecture des documents (${done}/${files.length})...`,
      }).eq('id', analyseId);
      return extrait;
    };

    // TOUS les docs en parallèle — le temps total = le doc le plus lent
    const settled = await Promise.allSettled(files.map(f => withProgress(f)));
    const extraits: ExtraitDoc[] = settled.map((s, i) =>
      s.status === 'fulfilled' ? s.value : { file_name: files[i].name, statut: 'echec' as const, raison: 'erreur_interne' }
    );

    const oks = extraits.filter(e => e.statut === 'ok');
    const echecs = extraits.filter(e => e.statut === 'echec');
    console.log(`[analyser-run][MAP] Terminé — ${oks.length} OK, ${echecs.length} échec(s)`);
    await enregistrerDocsNonTraites(supabaseAdmin, analyseId, echecs.map(e => ({
      nom: e.file_name, raison: e.raison || 'inconnue', phase: 'lecture',
    })));

    // ÉCHEC TOTAL (seul cas bloquant) : aucun doc analysable → remboursement
    if (oks.length === 0) {
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'analysis_failed', 'Aucun de vos documents n\'a pu être analysé. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes ou contactez le support.', `MAP : échec total sur ${files.length} docs`);
      return;
    }

    // Sauvegarde des extraits en DB — AVANT le reduce (relançable si le reduce plante)
    const { error: saveError } = await supabaseAdmin.from('analyses').update({
      map_resultats: {
        version: 'map_v2',
        profil,
        type_bien_declare: typeBienDeclare || null,
        nb_docs: files.length,
        extraits,
      },
      progress_message: 'Documents lus — préparation de la synthèse...',
    }).eq('id', analyseId);

    if (saveError) {
      console.error('[analyser-run][MAP] ERREUR sauvegarde map_resultats:', saveError.message);
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'save_error', 'Erreur lors de la sauvegarde de l\'analyse. Votre crédit a été remboursé automatiquement. Contactez le support.', 'MAP : erreur sauvegarde extraits');
      return;
    }

    // Self-invoke → phase REDUCE dans une NOUVELLE invocation (chrono 400s remis à zéro)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    let invoked = false;
    for (let attempt = 1; attempt <= 3 && !invoked; attempt++) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/analyser-run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({ analyseId, phase: 'reduce' }),
        });
        if (res.ok) { invoked = true; console.log(`[analyser-run][MAP] Phase REDUCE déclenchée (tentative ${attempt})`); }
        else { console.error(`[analyser-run][MAP] Self-invoke HTTP ${res.status} (tentative ${attempt})`); await sleep(3000); }
      } catch (e) {
        console.error(`[analyser-run][MAP] Self-invoke erreur (tentative ${attempt}):`, e);
        await sleep(3000);
      }
    }
    if (!invoked) {
      // Les extraits sont en DB : le remboursement est déclenché mais un support/relance manuelle reste possible
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'unexpected_error', 'Une erreur est survenue lors de la génération. Votre crédit a été remboursé automatiquement. Réessayez ou contactez le support.', 'MAP : échec déclenchement phase REDUCE');
    }
  } catch (err) {
    console.error('[analyser-run][MAP] Erreur:', err);
    await handleAnalyseFailure(supabaseAdmin, analyseId, 'unexpected_error', 'Erreur inattendue. Votre crédit a été remboursé automatiquement. Contactez le support.', 'MAP : erreur inattendue');
  }
}

// ─── PHASE REDUCE — invocation 2 ───
async function runPhaseReduce(
  analyseId: string,
  supabaseAdmin: SupabaseClient,
  apiKey: string,
): Promise<void> {
  try {
    const { data: analyse, error } = await supabaseAdmin
      .from('analyses')
      .select('map_resultats, profil, type_bien_declare, status')
      .eq('id', analyseId)
      .single();

    if (error || !analyse) { console.error('[analyser-run][REDUCE] Analyse introuvable:', error); return; }
    if (analyse.status === 'completed') { console.log('[analyser-run][REDUCE] Déjà completed — abandon (idempotence)'); return; }

    const mapData = analyse.map_resultats as { profil?: string; type_bien_declare?: string | null; nb_docs?: number; extraits?: ExtraitDoc[] } | null;
    const extraits = mapData?.extraits || [];
    const oks = extraits.filter(e => e.statut === 'ok');
    const echecs = extraits.filter(e => e.statut === 'echec');

    if (oks.length === 0) {
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'analysis_failed', 'Aucun document analysable trouvé. Votre crédit a été remboursé automatiquement. Contactez le support.', 'REDUCE : map_resultats vide');
      return;
    }

    const profil = (analyse.profil as string) || mapData?.profil || 'rp';
    const typeBienDeclare = (analyse.type_bien_declare as string) || mapData?.type_bien_declare || null;
    const nbDocs = mapData?.nb_docs || extraits.length;

    console.log(`[analyser-run][REDUCE] Synthèse — ${oks.length} extraits OK, ${echecs.length} échec(s) | profil:${profil}`);

    // Construction du contenu : les extraits remplacent les PDF
    const userContent: unknown[] = [];
    userContent.push({
      type: 'text',
      text: `CONTEXTE D'ENTRÉE : tu ne reçois pas les documents PDF originaux mais des EXTRAITS STRUCTURÉS EXHAUSTIFS, produits par une lecture attentive document par document (chaque fait est accompagné de sa page d'origine). Traite ces extraits exactement comme s'il s'agissait des documents eux-mêmes : toutes les règles du prompt système s'appliquent. Ne mentionne JAMAIS les mots "extrait" ou "extraction" dans le rapport. Ne déduis RIEN qui ne figure pas dans les extraits.`,
    });
    oks.forEach((e, i) => {
      userContent.push({
        type: 'text',
        text: `--- DOCUMENT ${i + 1}/${oks.length} : ${e.file_name} ---\n${JSON.stringify(e.extraction)}`,
      });
    });
    if (echecs.length > 0) {
      userContent.push({
        type: 'text',
        text: `NOTE : ${echecs.length} document(s) du dossier n'ont pas pu être lus (${echecs.map(e => e.file_name).join(', ')}). Ne fais AUCUNE supposition sur leur contenu. Ne les compte pas dans documents_analyses.`,
      });
    }
    userContent.push({
      type: 'text',
      text: `Voici les ${oks.length} documents du dossier. Analyse-les ensemble de facon exhaustive. JSON COMPLET et valide, sans troncature.`,
    });

    await supabaseAdmin.from('analyses').update({
      progress_current: nbDocs, // tous les documents sont lus — le front bascule sur le libellé "Synthèse"
      progress_total: nbDocs,
      progress_message: 'Synthèse du rapport en cours...',
    }).eq('id', analyseId);

    let msgCount = 0;
    const progressMessages = [
      'Croisement des informations...',
      'Croisement des informations...',
      'Calcul du score...',
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

    // Le prompt v7 complet — mêmes règles métier que le single-call
    let result = await callAI({ system: buildSystemPrompt('complete', profil, typeBienDeclare), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
    clearInterval(progressInterval);
    let report = result.error ? null : parseJson<Record<string, unknown>>(result.text);

    if (!result.error && !report) {
      console.warn('[analyser-run][REDUCE] JSON invalide — retry 5s');
      await sleep(5000);
      result = await callAI({ system: buildSystemPrompt('complete', profil, typeBienDeclare), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
      report = result.error ? null : parseJson<Record<string, unknown>>(result.text);
    }

    if (result.error || !report) {
      if (result.error === 'api_billing') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'api_billing', 'Notre service rencontre un problème technique. Notre équipe est informée. Votre crédit a été remboursé automatiquement.', 'Solde API épuisé — analyses bloquées', 'critical');
      } else if (result.error === 'rate_limit') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'rate_limit', 'Notre outil est momentanément surchargé. Votre crédit a été remboursé automatiquement. Réessayez dans 2 à 3 minutes.', 'Rate limit atteint (REDUCE)');
      } else if (result.error === 'overload') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'overload', 'Notre outil est temporairement indisponible. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.', 'Serveur surchargé (REDUCE)');
      } else if (result.error && result.error.startsWith('api_error_5')) {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'api_error', 'Notre outil rencontre une perturbation temporaire. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.', 'Erreur serveur API (REDUCE)');
      } else if (result.error === 'truncated') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'truncated', 'Le rapport genere etait trop volumineux pour etre finalise. Votre credit a ete rembourse automatiquement. Contactez le support.', 'Reponse tronquee (max_tokens atteint)', 'critical');
      } else if (result.error === 'timeout') {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'timeout', 'La génération du rapport a pris trop de temps. Votre crédit a été remboursé automatiquement. Réessayez dans quelques minutes.', 'Timeout (REDUCE)');
      } else {
        await handleAnalyseFailure(supabaseAdmin, analyseId, 'analysis_failed', 'Une erreur est survenue lors de la génération. Votre crédit a été remboursé automatiquement. Réessayez ou contactez le support.', 'Échec génération rapport (REDUCE)');
      }
      return;
    }

    // 📋 LOTS — on ne fait PAS confiance a la synthese pour recopier la liste :
    // elle doit remplir ~200 champs et la deforme (42 lots au lieu de 38 observe
    // en production). L'etape de lecture, elle, a traite le RCP seul avec un
    // prompt court. On reconstruit donc la liste depuis SES faits, en code.
    try {
      const lotsLus = construireLotsDepuisExtraits(extraits);
      const vie = (report as Record<string, unknown>).vie_copropriete as Record<string, unknown> | undefined;
      if (vie && lotsLus.length > 0) {
        const listeSynthese = Array.isArray(vie.lots_enumeres) ? vie.lots_enumeres as LotEnumere[] : [];
        const totalAnn = typeof vie.nb_lots_total === 'number' ? vie.nb_lots_total as number : null;
        // 🧭 ARBITRAGE — on ne remplace pas aveuglement. Le total annonce par le
        // document tranche ; a defaut, la liste la plus fournie l'emporte. Une
        // liste courte ne doit JAMAIS ecraser une liste longue : c'est ce qui a
        // transforme 38 lots en 4.
        let choisie = listeSynthese;
        let motif = 'synthèse conservée';
        if (totalAnn != null && lotsLus.length === totalAnn && listeSynthese.length !== totalAnn) {
          choisie = lotsLus; motif = `lecture (colle au total annoncé ${totalAnn})`;
        } else if (totalAnn != null && listeSynthese.length === totalAnn) {
          motif = `synthèse (colle au total annoncé ${totalAnn})`;
        } else if (lotsLus.length > listeSynthese.length) {
          choisie = lotsLus; motif = 'lecture (liste plus complète)';
        }
        if (choisie.length > 0) vie.lots_enumeres = choisie;
        console.log(`[analyser-run][REDUCE] 📋 Lots — lecture: ${lotsLus.length} | synthèse: ${listeSynthese.length} | annoncé: ${totalAnn ?? '?'} → ${motif}`);
      }
    } catch (e) {
      console.error('[analyser-run][REDUCE] Reconstruction lots (non bloquant):', e);
    }

    // Post-traitement déterministe — STRICTEMENT identique au v7
    try {
      report = recalculerCategories(report as RapportShape, profil) as Record<string, unknown>;
    } catch (e) {
      console.error('[analyser-run][REDUCE] Erreur recalcul categories (non bloquant):', e);
    }
    try {
      report = validateDiagsManquants(report as RapportShape) as Record<string, unknown>;
        try { croiserTitrePropriete(report); } catch (e) { console.error('[analyser-run] croiserTitrePropriete (non bloquant):', e); }
        report = construireChecklist(report as RapportShape) as Record<string, unknown>;
    } catch (e) {
      console.error('[analyser-run][REDUCE] validateDiagsManquants erreur (non bloquant):', e);
    }

    // 🆕 documents_non_analyses — injecté DÉTERMINISTIQUEMENT (pas par l'IA)
    // Alimente le bandeau frontend + l'invitation "Compléter mon dossier"
    (report as Record<string, unknown>).documents_non_analyses = echecs.map(e => ({
      nom: e.file_name,
      raison: e.raison === 'timeout' ? 'lecture_trop_longue' : (e.raison === 'json_invalide' ? 'document_illisible' : 'erreur_technique'),
    }));

    // avis_verimo : string (ancien format) ou objet (nouveau) — même logique que v7
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
      progress_current: nbDocs,
      progress_total: nbDocs,
      progress_message: 'Rapport pr\u00eat !',
      file_ids: [],
      title: (report.titre as string) || 'Analyse immobili\u00e8re',
      score: (report.score as number) ?? null,
      avis_verimo: avisVerimoForDb,
      result: report,
      paid: true,
    };

    // Deadline 7 jours pour compléter le dossier (comme v7 mode complete)
    const dl = new Date(); dl.setDate(dl.getDate() + 7);
    updateData.regeneration_deadline = dl.toISOString();

    const { error: updateError } = await supabaseAdmin.from('analyses').update(updateData).eq('id', analyseId);
    if (updateError) {
      console.error('[analyser-run][REDUCE] ERREUR UPDATE:', updateError.message);
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'save_error', 'Erreur lors de la sauvegarde du rapport. Votre crédit a été remboursé automatiquement. Contactez le support.', 'Erreur sauvegarde rapport (REDUCE)');
    } else {
      console.log(`[analyser-run][REDUCE] ${analyseId} terminée avec succès (${oks.length}/${nbDocs} docs analysés).`);
      await notifyAnalysisReady(supabaseAdmin, analyseId);
    }
  } catch (err) {
    console.error('[analyser-run][REDUCE] Erreur:', err);
    await handleAnalyseFailure(supabaseAdmin, analyseId, 'unexpected_error', 'Erreur inattendue. Votre crédit a été remboursé automatiquement. Contactez le support.', 'REDUCE : erreur inattendue');
  }
}

// ══════════════════════════════════════════════════════════════════════
// 🧩 COMPLEMENT V2 — FUSION PAR SECTIONS
// ──────────────────────────────────────────────────────────────────────
// Le complement v1 demandait au moteur de RE-EMETTRE le rapport entier
// (~12 000 tokens de sortie) en UN SEUL appel => >385s de generation => timeout,
// et la reponse etait facturee integralement pour zero resultat.
//
// v2 : on ne regenere QUE les sections concernees par les nouveaux documents.
//   Invocation 1 (complement-map)   : extraction parallele de chaque nouveau doc
//   Invocation 2 (complement-merge) : appels COURTS par section, en parallele,
//                                     puis fusion JS + recalcul deterministe
//
// Toute section non concernee est RECOPIEE A L'IDENTIQUE : aucune perte possible.
// ══════════════════════════════════════════════════════════════════════

const COMPLEMENT_SECTION_TIMEOUT_MS = 150000; // 150s par section (marge x3)

type SectionDef = { id: string; cles: string[]; regles: string; schema: string };

const SECTIONS: Record<string, SectionDef> = {
  diagnostics: {
    id: 'diagnostics',
    cles: ['diagnostics', 'diagnostics_resume'],
    regles: `diagnostics[] : un objet par diagnostic, champs type (DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|CARREZ|AUTRE), label, perimetre (lot_privatif|parties_communes), localisation, resultat, presence (detectee|absence|non_realise), alerte, pieces_detail. Pour un DPE : resultat doit contenir la classe energie ET la classe GES ET les kWh/m2. Pour un Carrez : conserver pieces_detail piece par piece.
ANTERIORITE : il n existe qu UNE SEULE entree par type de diagnostic. Un nouveau DPE REMPLACE integralement l ancien (classe energie, classe GES, kWh/m2, date, validite) au lieu de s y ajouter ; idem pour l electricite, le gaz, l amiante, le plomb, les termites, l ERP et le Carrez. Quand un diagnostic jusque-la absent arrive, sa "presence" passe de "non_realise" ou "absence" a "detectee" et son "alerte" est reevaluee. diagnostics_resume : 2-3 phrases de synthese.`,
    schema: `"diagnostics_resume":"resume global","diagnostics":[{"type":"DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|CARREZ|AUTRE","label":"nom complet","perimetre":"lot_privatif|parties_communes","localisation":"localisation","resultat":"resultat avec GES si DPE","presence":"detectee|absence|non_realise","alerte":null,"pieces_detail":[{"piece":"Sejour","surface":32.96}]}]`,
  },
  dpe_recommandations: {
    id: 'dpe_recommandations',
    cles: ['dpe_recommandations'],
    regles: `Packs de travaux recommandes par le DPE : evolution_etiquette (actuelle / apres_pack_1 / apres_pack_1_et_2 avec classe, kwh_m2, ges_kg_m2), pack_1 et pack_2 (cout_min, cout_max, travaux[] avec poste, description, performance_cible, decision_copropriete, autorisation_urbanisme). Si le DPE ne contient aucune recommandation : present=false, format="aucune".`,
    schema: `"dpe_recommandations":{"present":false,"format":"standard|ancien|aucune","version_methode":"3CL_2021|3CL_2012|factures|inconnue","evolution_etiquette":{"actuelle":{"classe":null,"kwh_m2":null,"ges_kg_m2":null},"apres_pack_1":{"classe":null,"kwh_m2":null,"ges_kg_m2":null},"apres_pack_1_et_2":{"classe":null,"kwh_m2":null,"ges_kg_m2":null}},"pack_1":{"cout_min":null,"cout_max":null,"travaux":[{"poste":"mur|toiture|plancher_bas|fenetres|porte|chauffage|eau_chaude|ventilation|autre","description":"...","performance_cible":null,"decision_copropriete":false,"autorisation_urbanisme":false}]},"pack_2":{"cout_min":null,"cout_max":null,"travaux":[{"poste":"mur|toiture|plancher_bas|fenetres|porte|chauffage|eau_chaude|ventilation|autre","description":"...","performance_cible":null,"decision_copropriete":false,"autorisation_urbanisme":false}]}}`,
  },
  travaux: {
    id: 'travaux',
    cles: ['travaux'],
    regles: `travaux.realises[] / .votes[] / .evoques[] + estimation_totale. CLASSEMENT STRICT selon le statut ECRIT dans le document : "vote" = resolution adoptee en AG ; "evoque" = a l etude, envisage, devis demande ; "realise" = travaux termines. NE JAMAIS classer en "vote" dans le doute.
RECLASSEMENT ENTRE ASSEMBLEES : un nouveau PV d AG fait souvent evoluer le statut d un chantier deja connu. Un ravalement "evoque" en 2022 puis ADOPTE en 2024 doit QUITTER "evoques" et apparaitre UNIQUEMENT dans "votes", avec l annee et le montant du vote. Il ne doit surtout pas rester dans les deux listes : chaque chantier ne figure qu UNE fois dans l ensemble realises/votes/evoques, sinon il est compte deux fois dans la notation.
Pour reconnaitre qu il s agit du meme chantier, se fier a la NATURE des travaux (ravalement, toiture, ascenseur, colonnes, chaufferie...) et non a la formulation exacte, qui varie d un PV a l autre. charge_vendeur=true uniquement si le document l indique explicitement.`,
    schema: `"travaux":{"realises":[{"label":"desc","annee":"2021","montant_estime":35000,"justificatif":true}],"votes":[{"label":"desc","annee":"2027","montant_estime":4500,"charge_vendeur":false}],"evoques":[{"label":"desc","annee":null,"montant_estime":null,"precision":"contexte"}],"estimation_totale":null}`,
  },
  procedures: {
    id: 'procedures',
    cles: ['procedures'],
    regles: `procedures[] : label, type (copro_vs_syndic|impayes|contentieux|autre), gravite (faible|moderee|elevee), message explicatif de 2-3 phrases. Si un nouveau document atteste explicitement l absence de procedure (mention "neant"), retirer les procedures qu il contredit.`,
    schema: `"procedures":[{"label":"Type","type":"copro_vs_syndic|impayes|contentieux|autre","gravite":"faible|moderee|elevee","message":"Explication claire 2-3 phrases"}]`,
  },
  finances: {
    id: 'finances',
    cles: ['finances'],
    regles: `Bloc financier de la copropriete. Ecart budget vote / charges reelles : INFORMATIF, ne jamais penaliser. Appels de fonds exceptionnels justifies par des travaux votes : INFORMATIF. fonds_travaux_statut parmi non_mentionne|insuffisant|conforme|bien|excellent|absent. Toujours renseigner l annee associee a un montant quand elle est connue.
ANTERIORITE : pour chaque montant, le chiffre EXPLICITEMENT ECRIT le plus RECENT fait foi et remplace le precedent, avec son annee mise a jour en meme temps. Les exercices anterieurs ne disparaissent pas pour autant : ils alimentent budgets_historique. Ne JAMAIS faire de moyenne entre un ancien et un nouveau montant, et ne jamais recalculer un total soi-meme.`,
    schema: `"finances":{"budget_total_copro":null,"budget_total_copro_annee":null,"charges_annuelles_lot":null,"charges_annuelles_lot_source":null,"cotisation_fonds_travaux_lot_annuelle":null,"fonds_rattaches_lot":{"avance_tresorerie":null,"fonds_travaux_alur":null,"source":null},"fonds_travaux":null,"fonds_travaux_annee":null,"fonds_travaux_pct_vote":null,"fonds_travaux_resolution_adoptee":null,"fonds_travaux_total_constitue":null,"fonds_travaux_total_constitue_date":null,"fonds_travaux_statut":"non_mentionne|insuffisant|conforme|bien|excellent|absent","impayes":null,"type_chauffage":null,"chauffage_individuel":null,"eau_chaude_individuelle":null,"taxe_fonciere_annuelle":null,"taxe_fonciere_annee":null,"budgets_historique":null}`,
  },
  pre_etat_date: {
    id: 'pre_etat_date',
    cles: ['pre_etat_date'],
    regles: `Pre-etat date / etat date : toutes les rubriques financieres (impayes_vendeur, fonds_travaux_alur, fonds_roulement_acheteur et sa modalite, honoraires_syndic, charges_futures, travaux_charge_vendeur[], procedures_copro, impayes_copro_global, dette_fournisseurs, historique_charges N-1/N-2). Reprendre les montants EXACTEMENT comme ecrits.
ANTERIORITE : un etat date ou un pre-etat date plus RECENT perime integralement le precedent. Toutes ses rubriques ECRASENT les anciennes, y compris quand elles passent a zero ou a "neant" — un impaye solde doit repasser a 0, pas rester a son ancien montant. La date du bloc est mise a jour en meme temps.`,
    schema: `"pre_etat_date":{"present":false,"date":null,"syndic":null,"impayes_vendeur":0,"fonds_travaux_alur":null,"fonds_travaux_ancien":null,"fonds_roulement_acheteur":null,"fonds_roulement_modalite":"remboursement_vendeur|reconstitution_syndicat","honoraires_syndic":null,"charges_futures":{"montant_trimestriel":null,"fonds_travaux_trimestriel":null,"montant_annuel":null},"travaux_charge_vendeur":[],"procedures_contre_vendeur":[],"procedures_copro":"neant|en_cours","impayes_copro_global":null,"dette_fournisseurs":null,"fonds_travaux_copro_global":null,"historique_charges":[{"exercice":"N-1","annee":null,"budget_appele":null,"charges_reelles":null,"provisions_hors_budget":null},{"exercice":"N-2","annee":null,"budget_appele":null,"charges_reelles":null,"provisions_hors_budget":null}]}`,
  },
  identite_bien: {
    id: 'identite_bien',
    cles: ['annee_construction', 'annee_construction_source', 'annee_construction_precision', 'annee_construction_fourchette'],
    regles: `ANNEE DE CONSTRUCTION. Ce champ conditionne les obligations reglementaires (amiante avant juillet 1997, plomb avant 1949, electricite installation de plus de 15 ans, fonds de travaux immeuble de plus de 10 ans). Le chercher dans cet ORDRE, s arreter a la premiere source exploitable :
1. REGLEMENT DE COPROPRIETE D ORIGINE — acte notarie, il fait foi. Prendre la date de l acte D ORIGINE, JAMAIS celle d un modificatif. C est une BORNE SUPERIEURE : l immeuble existait au plus tard a cette date, il peut etre plus ancien. precision = "borne_superieure".
2. CARNET D ENTRETIEN — annee de construction souvent indiquee en clair. precision = "exacte".
3. FICHE SYNTHETIQUE DE COPROPRIETE — caracteristiques techniques. precision = "exacte".
4. DPE, DDT, DTG ou AUDIT ENERGETIQUE — en DERNIER RECOURS : ces documents donnent en general une PERIODE. Renseigner alors annee_construction_fourchette {min,max}, precision = "fourchette", et annee_construction = la borne la plus ANCIENNE.
Si le document n apporte AUCUNE information sur l annee, renvoyer les quatre champs a null : le rapport conservera la valeur qu il possede deja. Ne JAMAIS deduire une annee du style architectural ou du quartier.`,
    schema: `"annee_construction":null,"annee_construction_source":"reglement_copro|carnet_entretien|fiche_synthetique|dpe_ddt|autre|null","annee_construction_precision":"exacte|fourchette|borne_superieure|null","annee_construction_fourchette":null`,
  },
  lot_achete: {
    id: 'lot_achete',
    cles: ['lot_achete'],
    regles: `Lot vendu et compromis. Pour un compromis : identites vendeur/acheteur/notaires/agence, PRIX (net vendeur, honoraires et a la charge de qui, prix total acte), depot de garantie, dates (signature, acte prevue, retractation), conditions_suspensives[] une par une avec leur date butoir, designation du bien et lots cedes, mobilier, clauses_critiques[], servitudes[]. Montants EXACTS, sans arrondi.
ANTERIORITE : un nouveau compromis, un avenant ou une promesse plus recente REMPLACE le precedent dans son integralite (prix, dates, conditions suspensives, parties). On ne fusionne pas deux avant-contrats et on ne conserve pas les conditions d une version perimee.

TITRE DE PROPRIETE (titre_propriete) — attestation de propriete, acte de vente authentique, attestation de succession ou donation. NE PAS confondre avec le compromis : le titre etablit une propriete DEJA acquise, le compromis est un avant-contrat.
- nature : le type exact du document.
- proprietaires_actuels : identite complete et situation_matrimoniale_citation RECOPIEE MOT POUR MOT. peut_vendre_seul = true si le document etablit que le proprietaire dispose seul du bien, false si un conjoint en communaute ou une indivision apparait, null si indeterminable.
- lots_detenus : UN objet par lot, sans regroupement — un appartement et sa cave sont DEUX lots. Designation recopiee telle quelle, tantiemes au format ecrit.
- date_etat_descriptif_origine : la date de l etat descriptif de division cite. Anterieure a 1980, elle merite un point de vigilance (des modificatifs ont probablement suivi).
- coherence : laisser les champs a null et ecarts a []. Ces controles sont faits par le code, pas par toi.`,
    schema: `"lot_achete":{"titre_propriete":{"present":false,"nature":"attestation_propriete|acte_de_vente|attestation_succession|donation|autre","date_acte":null,"date_entree_jouissance":null,"anciennete_detention_annees":null,"prix_acquisition":null,"notaire":{"nom":null,"etude":null,"ville":null},"proprietaires_actuels":[{"nom_complet":null,"profession":null,"nationalite":null,"adresse":null,"situation_matrimoniale_citation":null,"peut_vendre_seul":null,"part_indivision":null}],"vendeurs_precedents":[{"nom_complet":null,"qualite":null}],"references_cadastrales":[{"section":null,"numero":null,"lieudit":null,"contenance":null}],"date_etat_descriptif_origine":null,"lots_detenus":[{"numero":null,"designation":null,"etage":null,"nb_pieces":null,"tantiemes":null,"base_tantiemes":null}],"coherence":{"vendeur_conforme_compromis":null,"lots_conformes_compromis":null,"tantiemes_conformes":null,"ecarts":[]}},"quote_part_tantiemes":null,"parties_privatives":[{"numero_lot":null,"designation":"...","tantiemes":null}],"impayes_detectes":null,"fonds_travaux_alur":null,"travaux_votes_charge_vendeur":[],"restrictions_usage":[],"points_specifiques":[],"compromis":{"present":false,"type_avant_contrat":null,"date_signature":null,"date_acte_prevue":null,"delai_acte_mois":null,"vendeurs":[],"acheteurs":[],"notaires":[],"agence":null,"bien":{"adresse_complete":null,"reference_cadastrale_principale":null,"type_bien_global":null,"nb_pieces":null,"etage":null,"surface_carrez":null,"usage_declare":null,"lots_cedes":[],"rcp_date_acte":null,"rcp_nb_modificatifs":null,"origine_propriete":{"date_acquisition_vendeur":null,"mode_acquisition":null}},"finances":{"prix_net_vendeur":null,"prix_mobilier":null,"honoraires_agence":null,"honoraires_charge":null,"honoraires_pct":null,"prix_total_acte":null,"depot_garantie_montant":null,"depot_garantie_pct":null,"depot_garantie_detenteur":null,"prorata_taxe_fonciere":null,"clause_penale_pct":null,"frais_notaire_estimes_verimo":null,"frais_notaire_pct_verimo":null,"cout_total_estime_acheteur_verimo":null},"financement":{"modalite":null,"apport":null,"montant_pret_max":null,"duree_pret_max_mois":null,"taux_pret_max_pct":null,"etablissement_pressenti":null},"conditions_suspensives":[],"calendrier":[],"droits_preemption":[],"diagnostics_annexes":[],"annexes_copropriete_l721_2":null,"copropriete_finances_synthese":null,"situation_locative":null,"clauses_critiques":[],"servitudes":[]}}`,
  },
  'vie_copropriete.syndic_ag': {
    id: 'vie_copropriete.syndic_ag',
    cles: [
      'vie_copropriete.syndic', 'vie_copropriete.participation_ag',
      'vie_copropriete.tendance_participation', 'vie_copropriete.analyse_participation',
      'vie_copropriete.travaux_votes_non_realises', 'vie_copropriete.appels_fonds_exceptionnels',
      'vie_copropriete.questions_diverses_notables',
    ],
    regles: `Gouvernance et assemblees generales. participation_ag[] : une entree PAR ANNEE d AG, avec copropietaires_presents_representes, taux_tantiemes_pct, quitus {soumis, approuve, detail}. Ajouter la nouvelle AG a l historique SANS supprimer les annees deja presentes (une seule entree par annee : si l annee existe deja, on la complete au lieu d en creer une seconde).
CHANGEMENT DE SYNDIC : si le nouveau PV designe un autre syndic, syndic.nom, type, gestionnaire et fin_mandat sont REMPLACES par les nouvelles valeurs, et une entree est ajoutee dans historique_changements avec le sortant, l entrant et l annee. On ne laisse jamais l ancien syndic en place.
TRAVAUX VOTES NON REALISES : un chantier de cette liste dont le nouveau PV atteste l ACHEVEMENT en sort definitivement — il ne doit plus y figurer. syndic : nom, type, gestionnaire, fin_mandat, tensions_detectees, historique_changements.`,
    schema: `"vie_copropriete.syndic":{"nom":null,"type":"professionnel|benevole","gestionnaire":null,"fin_mandat":null,"tensions_detectees":false,"tensions_detail":null,"statut":null,"sortant":null,"entrant":null,"annee_changement":null,"nb_ags_analysees":null,"historique_changements":[]},"vie_copropriete.participation_ag":[{"annee":"2024","copropietaires_presents_representes":"18/24","taux_tantiemes_pct":"72%","quorum_note":null,"quitus":{"soumis":true,"approuve":true,"detail":null}}],"vie_copropriete.tendance_participation":"Non determinable","vie_copropriete.analyse_participation":"analyse","vie_copropriete.travaux_votes_non_realises":[],"vie_copropriete.appels_fonds_exceptionnels":[],"vie_copropriete.questions_diverses_notables":[]`,
  },
  'vie_copropriete.carnet_entretien': {
    id: 'vie_copropriete.carnet_entretien',
    cles: ['vie_copropriete.carnet_entretien'],
    regles: `Carnet d entretien : date_maj, immatriculation_registre, equipements_copro, contrats_entretien[], travaux_realises_carnet[] (annee, label, entreprise, montant) un par un, travaux_en_cours_votes_carnet[], diagnostics_parties_communes_carnet[], conseil_syndical_carnet.`,
    schema: `"vie_copropriete.carnet_entretien":{"present":false,"date_maj":null,"immatriculation_registre":null,"equipements_copro":{"chauffage_collectif":null,"type_chauffage":null,"eau_chaude_collective":null,"eau_froide_collective":null,"fibre_optique":null,"ascenseur":null},"contrats_entretien":[{"equipement":"...","prestataire":null,"periodicite":null,"date_reconduction":null}],"travaux_realises_carnet":[{"annee":null,"label":"...","entreprise":null,"montant":null}],"travaux_en_cours_votes_carnet":[{"label":"...","date_ag":null,"montant":null}],"diagnostics_parties_communes_carnet":[{"type":"amiante|plomb|termites|ascenseur|autre","date":null,"entreprise":null,"resultat":"negatif|positif|non_effectue","commentaire":null}],"conseil_syndical_carnet":{"date_nomination":null,"nb_membres":null}}`,
  },
  'vie_copropriete.dtg': {
    id: 'vie_copropriete.dtg',
    cles: ['vie_copropriete.dtg'],
    regles: `DTG / PPT : present, etat_general, budget_urgent_3ans, budget_total_10ans, travaux_prioritaires[] avec montant estime, echeance et degre d urgence. Le PPT est INFORMATIF : ne jamais penaliser ni bonifier.`,
    schema: `"vie_copropriete.dtg":{"present":false,"etat_general":null,"budget_urgent_3ans":null,"budget_total_10ans":null,"travaux_prioritaires":[]}`,
  },
  'vie_copropriete.fiche_synthetique': {
    id: 'vie_copropriete.fiche_synthetique',
    cles: ['vie_copropriete.fiche_synthetique'],
    regles: `Fiche synthetique (loi ALUR) : present, date, fiche_recente, immatriculation_registre, dtg_realise, dtg_date, equipements_collectifs_detail[].`,
    schema: `"vie_copropriete.fiche_synthetique":{"present":false,"date":null,"fiche_recente":null,"immatriculation_registre":null,"dtg_realise":null,"dtg_date":null,"equipements_collectifs_detail":[]}`,
  },
  'vie_copropriete.lots': {
    id: 'vie_copropriete.lots',
    cles: [
      'vie_copropriete.nb_lots_total', 'vie_copropriete.nb_lots_detail',
      'vie_copropriete.lots_enumeres', 'vie_copropriete.nb_batiments',
    ],
    regles: `Etat descriptif de division. lots_enumeres[] : UN objet PAR LOT NUMEROTE, sans regroupement et sans jamais s arreter en cours de liste (numero en chiffres, designation recopiee, categorie, tantiemes au format "num/den" tels qu ecrits).
CATEGORIES OBLIGATOIRES (nb_lots_detail, 7 cles) : logements (appartements + studios) - maisons - chambres_service (chambre de bonne, chambre avec salle d eau constituee en lot) - parkings (emplacements, garages, boxes) - caves - commerces - autres (reserve, debarras, grenier, cellier, local technique). NE JAMAIS tout mettre dans "autres".
REGLES ABSOLUES : (1) une entree = un "LOT NUMERO X", jamais autre chose ; (2) ne JAMAIS creer d entree sans numero — un bloc orphelin en haut de page est la FIN du lot precedent ; (3) MODIFICATIF INTEGRE : si un lot a ete DIVISE, FUSIONNE ou SUPPRIME par un acte modificatif, le lot d origine N EXISTE PLUS et doit DISPARAITRE de lots_enumeres ; ses remplacants sont numerotes a la suite. Ne jamais lister le lot d origine a cote de ses remplacants ; (4) ne jamais compter le preambule descriptif de l immeuble ; (5) un lot cite deux fois = une seule entree.
Si lots_enumeres existe deja, le CONSERVER integralement et se contenter de completer categorie/designation manquantes, sauf si le nouveau document cree ou supprime des lots.
COMPOSITION vs MODIFICATIFS : le chiffre EXPLICITEMENT ECRIT le plus RECENT fait foi, sans jamais calculer soi-meme. Si un modificatif change les lots SANS donner de nouveau total, ne PAS faire l arithmetique.
GARDE-FOU : au-dela de 150 lots annonces, laisser lots_enumeres a [] et ne remplir que nb_lots_detail.`,
    schema: `"vie_copropriete.nb_lots_total":null,"vie_copropriete.nb_lots_detail":{"logements":null,"maisons":null,"chambres_service":null,"parkings":null,"caves":null,"commerces":null,"autres":null},"vie_copropriete.lots_enumeres":[{"numero":null,"designation":"...","categorie":"logements|maisons|chambres_service|parkings|caves|commerces|autres","tantiemes":null}],"vie_copropriete.nb_batiments":null`,
  },
  'vie_copropriete.modificatifs': {
    id: 'vie_copropriete.modificatifs',
    cles: ['vie_copropriete.modificatifs_rcp', 'vie_copropriete.regles_copro'],
    regles: `MODIFICATIFS AU REGLEMENT DE COPROPRIETE — un objet par acte modificatif.
Objectif : faire comprendre a un ACHETEUR ce que change cet acte et ce que ca implique pour lui. Ignorer tout ce qui est purement procedural, fiscal ou administratif sans impact pratique.
- date_acte : date de signature de l acte modificatif (AAAA-MM-JJ).
- notaire : nom du notaire et de l etude, tels qu ecrits.
- type_modification : creation_lot | suppression_lot | changement_usage | mise_a_jour_tantiemes | servitude | fusion_lots | autre. Choisir celui qui correspond a l effet PRINCIPAL de l acte.
- sur_quoi_porte : 2 a 4 points decrivant CONCRETEMENT ce que modifie l acte, en langage simple et non juridique. Ecrire "Division du lot 38 (duplex du 5e etage) en deux appartements numerotes 39 et 40" plutot que "Modificatif a l etat descriptif de division portant division du lot 38". Mentionner les numeros de lots crees, supprimes ou modifies, et les tantiemes avant/apres quand ils sont ecrits.
- impact_acheteur : 1 a 2 phrases sur ce que ca change concretement pour un futur acquereur.
- points_attention : uniquement les points reellement utiles a un acheteur (ex : le total de lots de la copropriete a change, une servitude nouvelle greve le lot). Laisser [] s il n y en a pas.
Ne JAMAIS recopier le tableau recapitulatif des lots ici : il appartient a l etat descriptif.

REGLES DE COPROPRIETE (regles_copro) — clauses du reglement qui contraignent l usage du lot : location saisonniere, profession liberale, animaux, travaux, changement d usage, occupation. Pour chaque regle : statut (autorise | interdit | sous_conditions) et impact_rp / impact_invest selon qu elle gene une residence principale ou un investissement locatif.`,
    schema: `"vie_copropriete.modificatifs_rcp":[{"date_acte":null,"notaire":null,"type_modification":"creation_lot|suppression_lot|changement_usage|mise_a_jour_tantiemes|servitude|fusion_lots|autre","sur_quoi_porte":[{"aspect":"...","detail":"explication courte en langage simple sans jargon juridique"}],"impact_acheteur":"1-2 phrases sur ce que ca change concretement pour un futur acheteur","points_attention":[{"label":"...","detail":"explication claire en 1 phrase"}]}],"vie_copropriete.regles_copro":[{"label":"...","statut":"autorise|interdit|sous_conditions","impact_rp":false,"impact_invest":false}]`,
  },
  historique_travaux: {
    id: 'historique_travaux',
    cles: ['historique_travaux'],
    regles: `Devis / factures / attestations de travaux : entreprise (nom, siret, contact, assurance_decennale), travaux[] (poste, description, montant, date), montant_total, date_plus_recente, garantie_decennale_possible.`,
    schema: `"historique_travaux":{"present":false,"entreprise":{"nom":null,"siret":null,"contact":null,"assurance_decennale":null},"travaux":[{"poste":null,"description":null,"montant":null,"date":null}],"montant_total":null,"date_plus_recente":null,"garantie_decennale_possible":null}`,
  },
  assainissement: {
    id: 'assainissement',
    cles: ['assainissement'],
    regles: `Assainissement : type_reseau (collectif|non_collectif), conforme, date_controle, observations.`,
    schema: `"assainissement":{"present":false,"type_reseau":"collectif|non_collectif|null","conforme":null,"date_controle":null,"observations":null}`,
  },
  vie_asl: {
    id: 'vie_asl',
    cles: ['vie_asl', 'asl_mentionnee'],
    regles: `ASL / AFUL / Union : denomination, objet, perimetre, cotisation annuelle et sa base de repartition, organes de gestion, travaux ou charges votes, obligations imposees aux membres. NE PAS confondre avec une copropriete (loi 1965) : l ASL releve de l ordonnance de 2004.`,
    schema: `"vie_asl":{"present":false,"structures":[]},"asl_mentionnee":{"detectee":false,"statut":null,"source":null}`,
  },
};

// Routage deterministe : type de document detecte -> sections a regenerer
const ROUTAGE_SECTIONS: Record<string, string[]> = {
  DPE: ['diagnostics', 'dpe_recommandations', 'identite_bien'],
  AUDIT_ENERGETIQUE: ['diagnostics', 'dpe_recommandations'],
  DDT: ['diagnostics', 'identite_bien'],
  DIAGNOSTIC: ['diagnostics'],
  DIAGNOSTIC_PARTIES_COMMUNES: ['diagnostics'],
  PV_AG: ['vie_copropriete.syndic_ag', 'travaux', 'procedures', 'finances'],
  APPEL_CHARGES: ['finances'],
  TAXE_FONCIERE: ['finances'],
  PRE_ETAT_DATE: ['pre_etat_date', 'finances', 'procedures'],
  ETAT_DATE: ['pre_etat_date', 'finances', 'procedures'],
  FICHE_SYNTHETIQUE: ['vie_copropriete.fiche_synthetique', 'finances', 'identite_bien'],
  CARNET_ENTRETIEN: ['vie_copropriete.carnet_entretien', 'travaux', 'identite_bien'],
  DTG_PPT: ['vie_copropriete.dtg', 'travaux', 'identite_bien'],
  REGLEMENT_COPRO: ['vie_copropriete.lots', 'vie_copropriete.modificatifs', 'identite_bien'],
  RCP: ['vie_copropriete.lots', 'vie_copropriete.modificatifs', 'identite_bien'],
  MODIFICATIF_RCP: ['vie_copropriete.modificatifs', 'vie_copropriete.lots'],
  COMPROMIS: ['lot_achete'],
  TITRE_PROPRIETE: ['lot_achete', 'vie_copropriete.lots'],
  ATTESTATION_PROPRIETE: ['lot_achete', 'vie_copropriete.lots'],
  ACTE_VENTE: ['lot_achete', 'vie_copropriete.lots'],
  HISTORIQUE_TRAVAUX: ['historique_travaux', 'travaux'],
  ASSAINISSEMENT: ['assainissement'],
  ASL_CHIFFRES: ['vie_asl'],
  ASL_REGLES: ['vie_asl'],
  AUTRE: [],
};

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
    obj,
  );
}
function setPath(obj: Record<string, unknown>, path: string, val: unknown): void {
  const ks = path.split('.');
  let o = obj;
  for (let i = 0; i < ks.length - 1; i++) {
    if (o[ks[i]] === null || typeof o[ks[i]] !== 'object') o[ks[i]] = {};
    o = o[ks[i]] as Record<string, unknown>;
  }
  o[ks[ks.length - 1]] = val;
}
// Compte les feuilles NON nulles — sert au controle de non-regression.
function compterFeuilles(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  if (Array.isArray(v)) return v.reduce<number>((n, x) => n + compterFeuilles(x), 0);
  if (typeof v === 'object') return Object.values(v as Record<string, unknown>).reduce<number>((n, x) => n + compterFeuilles(x), 0);
  return 1;
}

// ══════════════════════════════════════════════════════════════════════
// 📚 LE REFERENTIEL METIER COMPLET, sans le schema de sortie global.
// ──────────────────────────────────────────────────────────────────────
// buildSystemPrompt('complete') = ~20 000 tokens de regles par type de
// document (PV d AG, RCP, modificatif, DPE, compromis, carnet, DTG, ASL...)
// suivis du schema JSON des ~200 champs.
//
// Reecrire ces regles a la main section par section garantissait des trous :
// chaque type de document a ses consignes propres et il est impossible de les
// resumer sans en perdre. On donne donc a chaque section LE VRAI referentiel,
// mot pour mot — la parite avec une analyse complete devient structurelle.
//
// On coupe juste avant le schema global (inutile ici : chaque section porte
// deja son propre fragment de schema, bien plus precis pour elle).
//
// ⚠️ Le cout est en ENTREE, pas en sortie : ~20 000 tokens se chargent en
// quelques secondes (prefill), alors que le mur des 400s vient de l ECRITURE.
// Chaque section continue de n ecrire que ses quelques centaines de tokens.
// ══════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// 🔌 INTERRUPTEUR D'URGENCE
// true  = chaque section recoit le referentiel metier complet (~20 000 tokens
//         en ENTREE) -> parite totale avec une analyse complete.
// false = repli sur les regles resumees section par section (~300 tokens).
//         Moins riche, mais entree divisee par 60.
// A basculer UNIQUEMENT si les logs montrent des durees de section anormales
// (> 100s). Redeployer apres modification.
// ══════════════════════════════════════════════════════════════
const COMPLEMENT_REFERENTIEL_COMPLET = true;

const MARQUEUR_SCHEMA_GLOBAL = '{"titre":"adresse complete"';

function referentielMetier(profil: string, typeBienDeclare?: string | null): string {
  if (!COMPLEMENT_REFERENTIEL_COMPLET) {
    return `Tu es le moteur d analyse documentaire de Verimo. Profil acheteur : ${profil === 'invest' ? 'investissement locatif' : 'residence principale'}. Tu n utilises jamais les mots Claude, Anthropic ou IA.`;
  }
  const complet = buildSystemPrompt('complete', profil, typeBienDeclare);
  const i = complet.indexOf(MARQUEUR_SCHEMA_GLOBAL);
  return i > 0 ? complet.slice(0, i) : complet;
}

async function regenererSection(
  def: SectionDef,
  rapport: Record<string, unknown>,
  extraits: ExtraitDoc[],
  apiKey: string,
  referentiel: string,
): Promise<{ id: string; ok: boolean; valeurs?: Record<string, unknown>; raison?: string }> {
  const actuel: Record<string, unknown> = {};
  for (const cle of def.cles) actuel[cle] = getPath(rapport, cle) ?? null;

  const system = `${referentiel}

═══════════════════════════════════════════════════════════════
MODE MISE A JOUR PARTIELLE
═══════════════════════════════════════════════════════════════
Toutes les regles ci-dessus s appliquent A L IDENTIQUE. La seule difference
avec une analyse complete : tu ne produis QU UNE SECTION du rapport, pas le
rapport entier. Le niveau de detail attendu est EXACTEMENT le meme que si les
documents avaient ete deposes des le depart — aucune information ne doit
disparaitre au motif qu il s agit d une mise a jour.

SECTION A PRODUIRE : ${def.id}

Rappel des points cles pour cette section :
${def.regles}

REGLES DE FUSION — IMPERATIVES :
1. Tu recois la valeur ACTUELLE de la section et des EXTRAITS de nouveaux documents.
2. Tu CONSERVES toute donnee actuelle que les extraits ne contredisent pas. Ne jamais remplacer une valeur renseignee par null parce que le nouveau document n en parle pas.
3. Tu COMPLETES les champs vides quand les extraits apportent l information.
4. Tu CORRIGES une valeur uniquement si un extrait apporte une information plus PRECISE ou plus RECENTE. En cas de contradiction, le document le plus recent l emporte ; a date egale ou inconnue, le nouveau document l emporte.
5. Les listes historiques (assemblees generales, lots, modificatifs, travaux realises) s ENRICHISSENT : on ajoute les nouvelles entrees sans supprimer les anciennes.
5bis. RECLASSEMENT — regle PRIORITAIRE sur la 5. Quand un nouveau document fait CHANGER DE STATUT un element deja present, cet element est DEPLACE, jamais duplique. Il DISPARAIT de sa liste d origine et REAPPARAIT dans sa nouvelle liste, enrichi des informations du nouveau document (annee, montant, references).
   Exemples : un travail "evoque" dans un PV ancien puis ADOPTE dans un PV plus recent quitte "evoques" pour "votes" ; un travail "vote" puis constate TERMINE quitte "votes" pour "realises" ; une procedure declaree eteinte disparait de la liste.
   Avant de rendre ta reponse, VERIFIE qu aucun element ne figure dans deux listes a la fois : un meme travail ne compte qu une seule fois, sinon le score du rapport est fausse.
6. Ne RIEN inventer. Une information absente des extraits ET du rapport actuel reste null.

REGLE DE COHERENCE ET D ANTERIORITE — s applique a TOUS les champs de la section :
Un dossier immobilier est une succession de documents echelonnes dans le temps. Un
document recent ne s AJOUTE pas toujours a ce qui existe : tres souvent, il fait
EVOLUER ou il REMPLACE ce que disait un document plus ancien. Avant d ecrire chaque
champ, determine laquelle des trois situations s applique :
  (a) AJOUT — le nouveau document apporte une information que personne ne donnait.
      -> on ajoute, sans toucher au reste.
  (b) EVOLUTION — le nouveau document parle du MEME objet et en change l etat.
      -> l objet est mis a jour ou deplace. Il ne doit JAMAIS exister en double.
  (c) REMPLACEMENT — le nouveau document est une version plus recente du meme
      document (nouveau DPE, nouvel etat date, nouveau compromis, nouveau syndic).
      -> les valeurs recentes ECRASENT les anciennes, et la date ou l annee associee
         est mise a jour EN MEME TEMPS que le montant ou le resultat. Un chiffre
         recent accompagne d une annee ancienne est une incoherence.
INTERDITS ABSOLUS : laisser cohabiter deux versions contradictoires d une meme
information ; faire une moyenne ou un calcul entre un ancien et un nouveau chiffre ;
garder une valeur ancienne "au cas ou" a cote de la nouvelle.
7. Tu ne calcules AUCUNE note et AUCUN score : ce n est pas ton role.

FORMAT DE SORTIE — JSON STRICT, rien d autre, aucun markdown.
Tu renvoies un objet dont les cles sont EXACTEMENT : ${def.cles.map(c => `"${c}"`).join(', ')}.

SCHEMA EXACT ATTENDU (noms de champs et valeurs autorisees — a respecter a la lettre,
meme si la section actuelle est vide ou partielle : c est CE schema qui fait foi,
jamais la forme de la valeur actuelle) :
${def.schema}

Les valeurs d exemple du schema ne sont que des illustrations de FORME. Remplis chaque
champ avec les donnees reelles des extraits, ou null si l information est absente.
N invente aucun nom de champ et n en omets aucun.`;

  const faits = extraits
    .filter(e => e.statut === 'ok')
    .map(e => `[${e.file_name}]\n${JSON.stringify(e.extraction)}`)
    .join('\n\n');

  const userContent: unknown[] = [{
    type: 'text',
    text: `SECTION ACTUELLE :\n${JSON.stringify(actuel)}\n\n--- EXTRAITS DES NOUVEAUX DOCUMENTS ---\n${faits}\n\nRenvoie la section mise a jour. JSON strict uniquement.`,
  }];

  const t0 = Date.now();
  const result = await callAI({ system, userContent, maxTokens: 16000, apiKey, timeoutMs: COMPLEMENT_SECTION_TIMEOUT_MS });
  const dureeS = Math.round((Date.now() - t0) / 1000);

  if (result.error) {
    console.error(`[complement-merge] Section "${def.id}" — echec ${result.error} (${dureeS}s)`);
    return { id: def.id, ok: false, raison: result.error };
  }
  const parsed = parseJson<Record<string, unknown>>(result.text);
  if (!parsed) {
    console.error(`[complement-merge] Section "${def.id}" — JSON invalide (${dureeS}s)`);
    return { id: def.id, ok: false, raison: 'json_invalide' };
  }

  // ── Controle de NON-REGRESSION ──
  // Une section ne peut qu enrichir ou corriger. Si elle revient effondree
  // (moins de 60% des donnees actuelles), on la REJETTE et on garde l ancienne.
  const avant = compterFeuilles(actuel);
  const apres = compterFeuilles(parsed);
  if (avant > 0 && apres < avant * 0.6) {
    console.error(`[complement-merge] Section "${def.id}" REJETEE — appauvrissement ${avant} -> ${apres} feuilles`);
    return { id: def.id, ok: false, raison: 'appauvrissement' };
  }

  // Une section ciblee par un nouveau document est censee s'ENRICHIR. Si elle
  // revient sans le moindre gain, ce n'est pas bloquant mais c'est anormal :
  // on le trace pour pouvoir resserrer le prompt de cette section.
  if (apres <= avant) {
    console.warn(`[complement-merge] ⚠️ Section "${def.id}" sans gain (${avant} -> ${apres} feuilles) — verifier le prompt/schema`);
  }
  console.log(`[complement-merge] Section "${def.id}" OK (${dureeS}s, ${avant} -> ${apres} feuilles)`);
  return { id: def.id, ok: true, valeurs: parsed };
}

async function regenererConclusion(
  rapport: Record<string, unknown>,
  profil: string,
  apiKey: string,
  referentiel: string,
): Promise<Record<string, unknown> | null> {
  const CLES = ['resume', 'points_forts', 'points_vigilance', 'negociation', 'avis_verimo'];
  const actuel: Record<string, unknown> = {};
  for (const c of CLES) actuel[c] = rapport[c] ?? null;

  // On transmet le rapport FUSIONNE prive de la conclusion : la synthese est ainsi
  // ecrite en connaissant le score final et toutes les donnees a jour.
  const base: Record<string, unknown> = { ...rapport };
  for (const c of CLES) delete base[c];

  const p = profil === 'invest' ? 'investissement locatif' : 'residence principale';
  const system = `${referentiel}

═══════════════════════════════════════════════════════════════
MODE SYNTHESE SEULE — profil acheteur : ${p}
═══════════════════════════════════════════════════════════════
On te donne un rapport immobilier COMPLET et A JOUR (score et notes deja calcules, ne les recalcule pas). Tu rediges uniquement sa synthese.

- resume : objet a 5 cles (le_bien, la_copropriete, performance_energetique, diagnostics_privatifs, gouvernance_finances), 2-3 phrases factuelles chacune.
- points_forts / points_vigilance : listes courtes, chaque entree adossee a une donnee reelle du rapport. Jamais de generalite.
- negociation : applicable + elements[] chiffres quand le rapport fournit des montants.
- avis_verimo : verdict (une phrase), verdict_highlight (2-4 mots cles), contexte (2-3 phrases de cadrage, PAS de constat deja present dans resume ou points_*), demarches[] (titre + description de 1-2 phrases, formulation neutre, jamais d imperatif ni de conseil direct).

La synthese doit refleter le score ${JSON.stringify(rapport.score ?? null)} / 20 et les donnees ci-dessous, y compris les elements qui viennent d etre ajoutes au dossier.

FORMAT — JSON STRICT, rien d autre : un objet aux cles ${CLES.map(c => `"${c}"`).join(', ')}.`;

  const userContent: unknown[] = [{
    type: 'text',
    text: `RAPPORT A JOUR :\n${JSON.stringify(base)}\n\nSYNTHESE ACTUELLE (a reecrire) :\n${JSON.stringify(actuel)}\n\nJSON strict uniquement.`,
  }];

  const result = await callAI({ system, userContent, maxTokens: 8000, apiKey, timeoutMs: COMPLEMENT_SECTION_TIMEOUT_MS });
  if (result.error) { console.error(`[complement-merge] Conclusion — echec ${result.error}`); return null; }
  const parsed = parseJson<Record<string, unknown>>(result.text);
  if (!parsed) { console.error('[complement-merge] Conclusion — JSON invalide'); return null; }
  return parsed;
}

// ══════════════════════════════════════════════════════════════════════
// 🔧 NORMALISATION DES ALIAS DE CHAMPS
// ──────────────────────────────────────────────────────────────────────
// Constate en production : le moteur produisait les BONNES donnees sous de
// MAUVAIS noms de champs — pieces_detail avec "surface_carrez" au lieu de
// "surface", modificatifs_rcp avec "date"/"objet" au lieu de "date_acte"/
// "impact_acheteur". Le renderer ne trouvait rien et affichait des lignes vides.
//
// Le schema explicite injecte dans chaque prompt de section corrige la cause.
// Cette fonction est le FILET : elle remappe les alias connus.
// Elle sert aussi de SIGNAL — si elle se declenche encore dans les logs, c'est
// que le schema n'est pas respecte et qu'il faut resserrer le prompt concerne.
// ══════════════════════════════════════════════════════════════════════
function normaliserAliasComplement(rapport: Record<string, unknown>): void {
  let corrections = 0;

  // ── diagnostics[].pieces_detail[].surface ──
  const diags = Array.isArray(rapport.diagnostics) ? rapport.diagnostics as Array<Record<string, unknown>> : [];
  for (const d of diags) {
    const pieces = Array.isArray(d.pieces_detail) ? d.pieces_detail as Array<Record<string, unknown>> : [];
    for (const p of pieces) {
      if (p.surface === undefined || p.surface === null) {
        const alias = p.surface_carrez ?? p.surface_m2 ?? p.m2 ?? p.superficie ?? p.surface_habitable;
        if (typeof alias === 'number') { p.surface = alias; corrections++; }
      }
      if (p.piece === undefined || p.piece === null) {
        const aliasNom = p.nom ?? p.libelle ?? p.designation;
        if (typeof aliasNom === 'string') { p.piece = aliasNom; corrections++; }
      }
    }
  }

  // ── vie_copropriete.modificatifs_rcp[] ──
  const vie = (rapport.vie_copropriete || {}) as Record<string, unknown>;
  const modifs = Array.isArray(vie.modificatifs_rcp) ? vie.modificatifs_rcp as Array<Record<string, unknown>> : [];
  for (const m of modifs) {
    if (!m.date_acte && typeof m.date === 'string') { m.date_acte = m.date; corrections++; }
    if (!m.impact_acheteur && typeof m.objet === 'string') { m.impact_acheteur = m.objet; corrections++; }
    if (!Array.isArray(m.sur_quoi_porte) && typeof m.objet === 'string') {
      m.sur_quoi_porte = [{ aspect: 'Modification', detail: m.objet }];
      corrections++;
    }
    if (!m.type_modification) { m.type_modification = 'autre'; corrections++; }
    if (!Array.isArray(m.points_attention)) m.points_attention = [];
  }

  if (corrections > 0) {
    console.warn(`[complement-merge] 🔧 ${corrections} champ(s) remappe(s) depuis un alias — le schema n'a pas ete respecte a la lettre`);
  }
}

// Borne dure : retryDpeCarrez et extraireLotsRCP n imposent aucun timeoutMs et
// heritent donc du defaut de 385s. Additionne a une lecture deja longue, ca
// depassait le budget de l invocation. On ne les attend jamais au-dela du temps
// reellement disponible ; au-dela on abandonne et on poursuit sans elles.
function avecDelai<T>(p: Promise<T>, ms: number, label: string): Promise<T | null> {
  return Promise.race([
    p.catch(e => { console.error(`[complement-map] ${label}:`, e); return null; }),
    new Promise<null>(r => setTimeout(() => { console.warn(`[complement-map] ⏱️ ${label} abandonnee apres ${Math.round(ms / 1000)}s`); r(null); }, ms)),
  ]);
}

// ══════════════════════════════════════════════════════════════════════
// 📋 DOCUMENTS NON TRAITES — visibilite cote CLIENT
// ──────────────────────────────────────────────────────────────────────
// Un document peut disparaitre silencieusement a trois endroits : a l upload
// (PDF protege/corrompu), a la lecture en MAP-REDUCE, a la lecture en
// complement. Jusqu'ici le rapport se generait et personne ne prevenait
// l acheteur — il croyait son dossier complet.
// On consigne ici, le front affiche.
// ══════════════════════════════════════════════════════════════════════
async function enregistrerDocsNonTraites(
  supabaseAdmin: SupabaseClient,
  analyseId: string,
  items: Array<{ nom: string; raison: string; phase: string }>,
): Promise<void> {
  if (!items.length) return;
  try {
    const { data } = await supabaseAdmin
      .from('analyses').select('documents_non_traites').eq('id', analyseId).single();
    const existant = (data?.documents_non_traites || {}) as { vu?: boolean; items?: Array<{ nom: string }> };
    const deja = Array.isArray(existant.items) ? existant.items : [];
    const noms = new Set(deja.map(d => d.nom));
    const fusion = [...deja, ...items.filter(i => !noms.has(i.nom))];

    await supabaseAdmin.from('analyses').update({
      // vu remis a false : un nouvel echec doit etre signale meme si le client
      // avait deja acquitte un signalement precedent.
      documents_non_traites: { vu: false, items: fusion },
    }).eq('id', analyseId);
    console.log(`[analyser-run] 📋 ${items.length} document(s) non traite(s) consigne(s) pour le client`);
  } catch (e) {
    console.error('[analyser-run] enregistrerDocsNonTraites (non bloquant):', e);
  }
}

// ══════════════════════════════════════════════════════════════════════
// 🧹 PURGE DE documents_manquants
// ──────────────────────────────────────────────────────────────────────
// validateDiagsManquants() ne fait qu'AJOUTER (helper `ajouter`), jamais
// retirer. En analyse complete ce n'est pas un probleme : le moteur reconstruit
// la liste a partir de zero. En complement, PERSONNE ne la reconstruit — elle
// est recopiee telle quelle du rapport d'origine. Resultat constate en
// production : un client depose son DDT et son pre-etat date, ils sont bien
// analyses, et l'onglet Documents continue de les reclamer.
//
// On retire donc ici, DE FACON DETERMINISTE, tout ce qui est desormais satisfait.
// validateDiagsManquants tourne ensuite et re-ajoute ce qui manque vraiment.
// ══════════════════════════════════════════════════════════════════════
function purgerDocsManquants(rapport: Record<string, unknown>): void {
  const manquants = Array.isArray(rapport.documents_manquants)
    ? rapport.documents_manquants as string[] : [];
  if (manquants.length === 0) return;

  const diags = Array.isArray(rapport.diagnostics) ? rapport.diagnostics as Array<Record<string, unknown>> : [];
  const docs = Array.isArray(rapport.documents_analyses) ? rapport.documents_analyses as Array<Record<string, unknown>> : [];
  const vie = (rapport.vie_copropriete || {}) as Record<string, unknown>;
  const lot = (rapport.lot_achete || {}) as Record<string, unknown>;

  const diagPresent = (type: string): boolean => diags.some(d => {
    const t = String(d.type || '').toUpperCase();
    const pres = String(d.presence || '').toLowerCase();
    return t === type && pres !== 'non_realise' && pres !== 'absence';
  });
  const docPresent = (...types: string[]): boolean =>
    docs.some(d => types.includes(String(d.type || '').toUpperCase()));
  const blocPresent = (o: unknown): boolean =>
    !!o && typeof o === 'object' && (o as Record<string, unknown>).present === true;
  const listeRemplie = (o: unknown): boolean => Array.isArray(o) && o.length > 0;

  // Sans accents ni casse : les libelles varient d'un rapport a l'autre.
  const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const satisfait = (libelle: string): boolean => {
    const l = norm(libelle);
    // ⚠️ "modificatif" AVANT "reglement de copropriete" : le libelle du
    // modificatif contient les deux, l'ordre des tests decide du resultat.
    if (l.includes('modificatif')) return docPresent('MODIFICATIF_RCP') || listeRemplie(vie.modificatifs_rcp);
    if (l.includes('dtg') || l.includes('pluriannuel') || l.includes('ppt')) return docPresent('DTG_PPT') || blocPresent(vie.dtg);
    if (l.includes('reglement de copropriete')) return docPresent('RCP', 'REGLEMENT_COPRO');
    if (l.includes('carnet d')) return docPresent('CARNET_ENTRETIEN') || blocPresent(vie.carnet_entretien);
    if (l.includes('fiche synthetique')) return docPresent('FICHE_SYNTHETIQUE') || blocPresent(vie.fiche_synthetique);
    if (l.includes('etat date')) return blocPresent(rapport.pre_etat_date) || docPresent('PRE_ETAT_DATE', 'ETAT_DATE');
    if (l.includes('appel de charges') || l.includes('appel de fonds')) return docPresent('APPEL_CHARGES');
    if (l.includes('taxe fonciere')) return docPresent('TAXE_FONCIERE');
    if (l.includes('assemblee') || l.includes('pv ag') || l.includes('proces-verbal')) return docPresent('PV_AG');
    if (l.includes('compromis') || l.includes('promesse')) return blocPresent(lot.compromis);
    if (l.includes('assainissement')) return blocPresent(rapport.assainissement) || docPresent('ASSAINISSEMENT');
    if (l.includes('audit energetique')) return docPresent('AUDIT_ENERGETIQUE');
    // Le DDT est un ENSEMBLE : satisfait si le document est la, ou si ses
    // composants principaux sont detectes.
    if (l.includes('ddt') || l.includes('dossier de diagnostic technique')) {
      return docPresent('DDT', 'DIAGNOSTIC') ||
        (diagPresent('DPE') && (diagPresent('ELECTRICITE') || diagPresent('GAZ') || diagPresent('ERP')));
    }
    if (l.includes('dpe') || l.includes('performance energetique')) return diagPresent('DPE');
    if (l.includes('erp') || l.includes('risques et pollutions')) return diagPresent('ERP');
    if (l.includes('carrez')) return diagPresent('CARREZ');
    if (l.includes('termites')) return diagPresent('TERMITES');
    if (l.includes('amiante')) return diagPresent('AMIANTE');
    if (l.includes('plomb')) return diagPresent('PLOMB');
    if (l.includes('electricite')) return diagPresent('ELECTRICITE');
    if (l.includes('gaz')) return diagPresent('GAZ');
    return false; // libelle generique ("tout autre document...") : jamais retire
  };

  const restants = manquants.filter(m => !satisfait(String(m)));
  const retires = manquants.length - restants.length;
  if (retires > 0) {
    rapport.documents_manquants = restants;
    console.log(`[complement-merge] 🧹 ${retires} document(s) retire(s) de la liste des manquants (desormais fournis)`);
  }
}

// ══ PHASE 1 — extraction des nouveaux documents ══
async function runComplementMap(
  analyseId: string,
  files: Array<{ id: string; name: string }>,
  supabaseAdmin: SupabaseClient,
  apiKey: string,
): Promise<void> {
  try {
    const tDebutMap = Date.now();
    console.log(`[complement-map] Demarrage — ${files.length} nouveau(x) doc(s) | analyse ${analyseId}`);
    await supabaseAdmin.from('analyses').update({
      progress_current: 0,
      progress_total: files.length,
      progress_message: `Lecture des ${files.length} nouveau(x) document(s)...`,
      last_retry_at: new Date().toISOString(),
    }).eq('id', analyseId);

    let done = 0;
    const withProgress = async (f: { id: string; name: string }): Promise<ExtraitDoc> => {
      const e = await extractOneDoc(f, apiKey, false); // suppression differee (extractions ciblees)
      done++;
      await supabaseAdmin.from('analyses').update({
        progress_current: done,
        progress_message: `Lecture des nouveaux documents (${done}/${files.length})...`,
      }).eq('id', analyseId);
      return e;
    };

    const settled = await Promise.allSettled(files.map(withProgress));
    const extraits: ExtraitDoc[] = settled.map((s, i) =>
      s.status === 'fulfilled' ? s.value : { file_name: files[i].name, statut: 'echec' as const, raison: 'erreur_interne' }
    );

    const oks = extraits.filter(e => e.statut === 'ok');
    console.log(`[complement-map] Termine — ${oks.length}/${files.length} doc(s) lus`);
    await enregistrerDocsNonTraites(supabaseAdmin, analyseId, extraits
      .filter(e => e.statut === 'echec')
      .map(e => ({ nom: e.file_name, raison: e.raison || 'inconnue', phase: 'complement' })));

    if (oks.length === 0) {
      // RGPD : la suppression etant differee, elle doit avoir lieu ici aussi
      await Promise.all(files.map(f => deleteFromFilesAPI(f.id, apiKey).catch(() => {})));
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'analysis_failed', COMPLEMENT_FAILED_MSG, 'Complement : aucun document lisible');
      return;
    }

    // ══════════════════════════════════════════════════════════════
    // 🎯 EXTRACTIONS CIBLEES — les memes filets que l'analyse complete.
    // Le grand prompt (et a fortiori un prompt de section) rate regulierement
    // deux champs noyes parmi 200 : les packs de travaux du DPE et le detail
    // Carrez piece par piece. L'analyse complete les rattrape via retryDpeCarrez ;
    // idem pour l'etat descriptif via extraireLotsRCP. Sans ces appels, le
    // complement rendait un rapport structurellement plus pauvre.
    // ⚠️ DOIT tourner ICI : en phase MERGE les PDF n'existent plus.
    // ══════════════════════════════════════════════════════════════
    const extras: Record<string, unknown> = {};
    try {
      const { data: courant } = await supabaseAdmin
        .from('analyses').select('result').eq('id', analyseId).single();
      const rapportCourant = courant?.result
        ? JSON.parse(JSON.stringify(courant.result)) as Record<string, unknown>
        : null;

      const idsOk = extraits.filter(e => e.statut === 'ok').map((_, i) => files[i]?.id).filter(Boolean) as string[];
      const tousIds = files.map(f => f.id);
      const typesDetectes = extraits
        .filter(e => e.statut === 'ok')
        .map(e => String((e.extraction?.type_detecte as string) || '').toUpperCase());

      // ⏱️ Budget de temps : la lecture des documents a deja consomme une partie
      // des ~400s de l'invocation. Si elle a ete longue, on saute les extractions
      // ciblees plutot que de risquer un timeout — les sections resteront servies
      // par les extraits, et le schema explicite fait deja l'essentiel du travail.
      // Budget = ce qu'il reste avant 340s, marge gardee pour la suppression RGPD,
      // la sauvegarde et le declenchement de la phase 2.
      const ecoule = Date.now() - tDebutMap;
      const budgetCible = 340000 - ecoule;
      if (budgetCible < 45000) {
        console.warn(`[complement-map] ⏱️ Lecture longue (${Math.round(ecoule / 1000)}s) — extractions ciblees sautees`);
      } else {
        console.log(`[complement-map] Budget extractions ciblees : ${Math.round(budgetCible / 1000)}s`);
        const aDpeOuDiag = typesDetectes.some(t => ['DPE', 'DDT', 'DIAGNOSTIC', 'AUDIT_ENERGETIQUE'].includes(t));
        const aRcp = typesDetectes.some(t => ['RCP', 'REGLEMENT_COPRO', 'MODIFICATIF_RCP'].includes(t));

        // Les deux extractions sont INDEPENDANTES : on les lance en parallele.
        // En sequentiel, le pire cas (30s + 90s) s'ajoutait a une lecture deja longue.
        const [resDpe, resLots] = await Promise.all([
          (rapportCourant && aDpeOuDiag && tousIds.length > 0)
            ? avecDelai(
                (async () => {
                  console.log('[complement-map] 🎯 Extraction ciblee DPE/Carrez lancee');
                  return await retryDpeCarrez(rapportCourant as RapportShape, tousIds, apiKey) as Record<string, unknown>;
                })(), budgetCible, 'retryDpeCarrez')
            : Promise.resolve(null),
          (aRcp && tousIds.length > 0)
            ? avecDelai(
                (async () => {
                  const vie = (rapportCourant?.vie_copropriete || {}) as Record<string, unknown>;
                  const totalAnn = typeof vie.nb_lots_total === 'number' ? vie.nb_lots_total as number : null;
                  console.log('[complement-map] 🎯 Extraction ciblee etat descriptif lancee');
                  return await extraireLotsRCP(tousIds, apiKey, totalAnn);
                })(), budgetCible, 'extraireLotsRCP')
            : Promise.resolve(null),
        ]);

        if (resDpe) {
          const reco = resDpe.dpe_recommandations as Record<string, unknown> | undefined;
          if (reco?.present === true) extras.dpe_recommandations = reco;
          const diags = Array.isArray(resDpe.diagnostics) ? resDpe.diagnostics as Array<Record<string, unknown>> : [];
          const carrez = diags.find(d => String(d.type || '').toUpperCase() === 'CARREZ');
          if (carrez && Array.isArray(carrez.pieces_detail) && (carrez.pieces_detail as unknown[]).length > 0) {
            extras.carrez_pieces_detail = carrez.pieces_detail;
          }
        }
        if (resLots && resLots.length > 0) extras.lots_enumeres = resLots;
      }

      void idsOk;
    } catch (e) {
      console.error('[complement-map] Extractions ciblees (non bloquant):', e);
    }

    // RGPD : suppression differee, une fois toutes les extractions terminees
    await Promise.all(files.map(f => deleteFromFilesAPI(f.id, apiKey).catch(() => {})));
    console.log(`[complement-map] Suppression RGPD de ${files.length} fichier(s)`);

    const { error: saveErr } = await supabaseAdmin.from('analyses').update({
      complement_extraits: { version: 'complement_v2', nb_docs: files.length, extraits, extras },
      progress_message: 'Documents lus — mise a jour du rapport...',
      last_retry_at: new Date().toISOString(),
    }).eq('id', analyseId);

    if (saveErr) {
      console.error('[complement-map] ERREUR sauvegarde extraits:', saveErr.message);
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'save_error', COMPLEMENT_FAILED_MSG, 'Complement : erreur sauvegarde extraits');
      return;
    }

    // Self-invoke -> phase merge, chrono 400s remis a zero
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    let invoked = false;
    for (let attempt = 1; attempt <= 3 && !invoked; attempt++) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/analyser-run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({ analyseId, phase: 'complement-merge' }),
        });
        if (res.ok) { invoked = true; console.log(`[complement-map] Phase MERGE declenchee (tentative ${attempt})`); }
        else { console.error(`[complement-map] Self-invoke HTTP ${res.status}`); await sleep(3000); }
      } catch (e) {
        console.error(`[complement-map] Self-invoke erreur (tentative ${attempt}):`, e);
        await sleep(3000);
      }
    }
    if (!invoked) {
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'unexpected_error', COMPLEMENT_FAILED_MSG, 'Complement : echec declenchement phase MERGE');
    }
  } catch (err) {
    console.error('[complement-map] Erreur:', err);
    await handleAnalyseFailure(supabaseAdmin, analyseId, 'unexpected_error', COMPLEMENT_FAILED_MSG, 'Complement : erreur inattendue (MAP)');
  }
}

// ══ PHASE 2 — fusion par sections + recalcul deterministe ══
async function runComplementMerge(
  analyseId: string,
  supabaseAdmin: SupabaseClient,
  apiKey: string,
): Promise<void> {
  try {
    const { data: a, error } = await supabaseAdmin
      .from('analyses')
      .select('result, complement_extraits, profil, type_bien_declare')
      .eq('id', analyseId)
      .single();

    if (error || !a?.result || !a?.complement_extraits) {
      console.error('[complement-merge] Donnees introuvables:', error);
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'unexpected_error', COMPLEMENT_FAILED_MSG, 'Complement : rapport ou extraits introuvables');
      return;
    }

    await supabaseAdmin.from('analyses').update({
      progress_message: 'Croisement avec le rapport existant...',
      last_retry_at: new Date().toISOString(),
    }).eq('id', analyseId);

    const rapport = JSON.parse(JSON.stringify(a.result)) as Record<string, unknown>;
    const profil = (a.profil as string) || 'rp';
    const bloc = a.complement_extraits as { extraits: ExtraitDoc[]; extras?: Record<string, unknown> };
    const extraits = (bloc.extraits || []).filter(e => e.statut === 'ok');
    const extras = bloc.extras || {};

    // ── Routage : quelles sections sont concernees, et par quels extraits ──
    const parSection = new Map<string, ExtraitDoc[]>();
    for (const e of extraits) {
      const type = String((e.extraction?.type_detecte as string) || 'AUTRE').toUpperCase();
      const ids = ROUTAGE_SECTIONS[type] ?? [];
      if (ids.length === 0) console.warn(`[complement-merge] "${e.file_name}" type "${type}" — aucune section ciblee`);
      for (const id of ids) {
        if (!SECTIONS[id]) continue;
        const liste = parSection.get(id) ?? [];
        liste.push(e);
        parSection.set(id, liste);
      }
    }
    console.log(`[complement-merge] ${parSection.size} section(s) a regenerer : ${[...parSection.keys()].join(', ')}`);

    // ── Regeneration EN PARALLELE (chaque appel est court) ──
    // Construit UNE fois, partage par tous les appels de section.
    const referentiel = referentielMetier(profil, (a.type_bien_declare as string) || null);
    console.log(`[complement-merge] Referentiel metier chargé (~${Math.round(referentiel.length / 4)} tokens)`);

    const resultats = await Promise.all(
      [...parSection.entries()].map(([id, exs]) => regenererSection(SECTIONS[id], rapport, exs, apiKey, referentiel))
    );

    // ── Fusion JS : seules les sections VALIDEES sont ecrites ──
    let sectionsFusionnees = 0;
    const sectionsRejetees: string[] = [];
    for (const r of resultats) {
      if (!r.ok || !r.valeurs) { sectionsRejetees.push(`${r.id} (${r.raison})`); continue; }
      // ⚠️ L'annee de construction ne se fusionne PAS a l'aveugle. Un DPE ajoute
      // apres coup donne une fourchette : il ne doit pas ecraser une annee exacte
      // deja lue dans le carnet d'entretien. Hierarchie : exacte > borne
      // superieure > fourchette. A fiabilite egale, la nouvelle valeur passe.
      if (r.id === 'identite_bien') {
        const RANG: Record<string, number> = { exacte: 3, borne_superieure: 2, fourchette: 1 };
        const rapportRec = rapport as Record<string, unknown>;
        const nouvelle = r.valeurs['annee_construction'];
        const rangActuel = RANG[String(rapportRec.annee_construction_precision ?? '')] ?? 0;
        const rangNouveau = RANG[String(r.valeurs['annee_construction_precision'] ?? '')] ?? 0;
        const aDejaUneAnnee = rapportRec.annee_construction != null && String(rapportRec.annee_construction).trim() !== '';
        if (nouvelle == null || String(nouvelle).trim() === '') {
          console.log('[complement-merge] identite_bien : aucune annee dans les nouveaux documents — valeur conservee');
        } else if (aDejaUneAnnee && rangNouveau < rangActuel) {
          console.log(`[complement-merge] identite_bien : source moins fiable (${rangNouveau} < ${rangActuel}) — valeur conservee`);
        } else {
          for (const cle of SECTIONS[r.id].cles) {
            if (!(cle in r.valeurs)) continue;
            setPath(rapport, cle, r.valeurs[cle]);
          }
          console.log(`[complement-merge] identite_bien : annee mise a jour -> ${String(nouvelle)} (${String(r.valeurs['annee_construction_precision'] ?? '?')})`);
        }
        sectionsFusionnees++;
        continue;
      }

      for (const cle of SECTIONS[r.id].cles) {
        if (!(cle in r.valeurs)) continue;
        const v = r.valeurs[cle];
        if (v === undefined) continue;
        setPath(rapport, cle, v);
      }
      sectionsFusionnees++;
    }
    if (sectionsRejetees.length > 0) {
      console.warn(`[complement-merge] Sections non appliquees : ${sectionsRejetees.join(', ')}`);
    }

    // ══════════════════════════════════════════════════════════════
    // 🎯 APPLICATION DES EXTRACTIONS CIBLEES — priorite absolue.
    // Ces valeurs viennent d'appels dedies sur les PDF eux-memes : elles sont
    // plus fiables que ce qu'une section a pu produire a partir des extraits.
    // On les ecrit APRES la fusion pour qu'aucune section ne puisse les ecraser.
    // ══════════════════════════════════════════════════════════════
    if (extras.dpe_recommandations) {
      rapport.dpe_recommandations = extras.dpe_recommandations;
      console.log('[complement-merge] 🎯 dpe_recommandations applique (extraction ciblee)');
    }
    if (Array.isArray(extras.carrez_pieces_detail)) {
      const diags = Array.isArray(rapport.diagnostics) ? rapport.diagnostics as Array<Record<string, unknown>> : [];
      const carrez = diags.find(d => String(d.type || '').toUpperCase() === 'CARREZ');
      if (carrez) {
        carrez.pieces_detail = extras.carrez_pieces_detail;
        console.log(`[complement-merge] 🎯 carrez.pieces_detail applique (${(extras.carrez_pieces_detail as unknown[]).length} pieces)`);
      }
    }
    if (Array.isArray(extras.lots_enumeres) && (extras.lots_enumeres as unknown[]).length > 0) {
      const vie = (rapport.vie_copropriete || {}) as Record<string, unknown>;
      vie.lots_enumeres = extras.lots_enumeres;
      rapport.vie_copropriete = vie;
      console.log(`[complement-merge] 🎯 lots_enumeres applique (${(extras.lots_enumeres as unknown[]).length} lots)`);
    }

    // ── documents_analyses : append DETERMINISTE (jamais le moteur) ──
    const docsExistants = Array.isArray(rapport.documents_analyses)
      ? rapport.documents_analyses as Array<Record<string, unknown>> : [];
    const nomsExistants = new Set(docsExistants.map(d => String(d.nom || '')));
    for (const e of extraits) {
      if (nomsExistants.has(e.file_name)) continue;
      const dateDoc = e.extraction?.date_document as string | null | undefined;
      docsExistants.push({
        type: String((e.extraction?.type_detecte as string) || 'AUTRE').toUpperCase(),
        annee: dateDoc ? String(dateDoc).slice(0, 4) : null,
        nom: e.file_name,
      });
    }
    rapport.documents_analyses = docsExistants;

    // ── Nettoyage de la liste des documents manquants ──
    try { purgerDocsManquants(rapport); } catch (e) {
      console.error('[complement-merge] purgerDocsManquants (non bloquant):', e);
    }

    // ── Filet : remappage des alias de champs avant tout recalcul ──
    try { normaliserAliasComplement(rapport); } catch (e) {
      console.error('[complement-merge] normaliserAlias (non bloquant):', e);
    }

    // ── Recalculs DETERMINISTES : score, niveau, categories, docs manquants ──
    let final = rapport;
    try {
      final = recalculerCategories(final as RapportShape, profil) as Record<string, unknown>;
    } catch (e) {
      console.error('[complement-merge] recalculerCategories (non bloquant):', e);
    }
    try {
      final = validateDiagsManquants(final as RapportShape) as Record<string, unknown>;
      croiserTitrePropriete(final);
      final = construireChecklist(final as RapportShape) as Record<string, unknown>;
    } catch (e) {
      console.error('[complement-merge] validateDiagsManquants (non bloquant):', e);
    }
    console.log(`[complement-merge] Score recalcule : ${final.score} (${final.score_niveau})`);

    // ── Conclusion EN DERNIER : elle voit le score final et les donnees fusionnees ──
    await supabaseAdmin.from('analyses').update({
      progress_message: 'Redaction du rapport mis a jour...',
      last_retry_at: new Date().toISOString(),
    }).eq('id', analyseId);

    const conclusion = await regenererConclusion(final, profil, apiKey, referentiel);
    if (conclusion) {
      for (const [k, v] of Object.entries(conclusion)) {
        if (v === undefined || v === null) continue;
        final[k] = v;
      }
    } else {
      console.warn('[complement-merge] Conclusion non regeneree — ancienne synthese conservee');
    }

    // ── Sauvegarde ──
    const { error: updErr } = await supabaseAdmin.from('analyses').update({
      status: 'completed',
      result: final,
      complement_date: new Date().toISOString(),
      complement_doc_names: extraits.map(e => e.file_name),
      complement_extraits: null, // purge : les extraits ont rempli leur role
      file_ids: [],
      progress_message: 'Rapport mis a jour',
    }).eq('id', analyseId);

    if (updErr) {
      console.error('[complement-merge] ERREUR UPDATE:', updErr.message);
      await handleAnalyseFailure(supabaseAdmin, analyseId, 'save_error', COMPLEMENT_FAILED_MSG, 'Complement : erreur sauvegarde rapport');
      return;
    }

    console.log(`[complement-merge] ${analyseId} OK — ${sectionsFusionnees} section(s) fusionnee(s), ${extraits.length} doc(s) integre(s)`);

    if (sectionsRejetees.length > 0) {
      await insertSystemAlert(supabaseAdmin, {
        type: 'complement_partiel',
        severity: 'warning',
        title: `Complement partiel — ${sectionsRejetees.length} section(s) non appliquee(s)`,
        message: `Le complement a abouti mais certaines sections n ont pas ete mises a jour : ${sectionsRejetees.join(', ')}. Le rapport reste coherent (anciennes valeurs conservees).`,
        analyseId,
        metadata: { sectionsRejetees, sectionsFusionnees },
      });
    }

    await notifyAnalysisReady(supabaseAdmin, analyseId);

  } catch (err) {
    console.error('[complement-merge] Erreur:', err);
    await handleAnalyseFailure(supabaseAdmin, analyseId, 'unexpected_error', COMPLEMENT_FAILED_MSG, 'Complement : erreur inattendue (MERGE)');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  // ══════════════════════════════════════════════════════════
  // 🔒 FONCTION INTERNE — appelable uniquement par :
  //    • analyser        (l.~662)
  //    • analyser-retry  (l.~487)
  //    • elle-même       (self-invoke phase REDUCE, l.~2498)
  // Ces trois appelants envoient DÉJÀ la clé service_role :
  // aucun autre fichier n'est à modifier.
  // Sans ce contrôle, l'URL est ouverte à tout Internet → analyses
  // gratuites illimitées sur la facture Anthropic + écrasement du
  // rapport de n'importe quel client.
  // ══════════════════════════════════════════════════════════
  const bearer = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
  if (!supabaseServiceKey || bearer !== supabaseServiceKey) {
    console.warn('[analyser-run] 🚫 Appel externe refusé');
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

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

    // ══ MAP-REDUCE : phase REDUCE (déclenchée par self-invoke — nouveau chrono 400s) ══
    if (body?.phase === 'reduce') {
      console.log(`[analyser-run] Phase REDUCE — ${analyseId}`);
      EdgeRuntime.waitUntil(runPhaseReduce(analyseId, supabaseAdmin, apiKey));
      return new Response(JSON.stringify({ success: true, analyseId, phase: 'reduce' }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // ══ COMPLEMENT V2 : phase MERGE (self-invoke — nouveau chrono 400s) ══
    if (body?.phase === 'complement-merge') {
      console.log(`[analyser-run] Phase COMPLEMENT-MERGE — ${analyseId}`);
      EdgeRuntime.waitUntil(runComplementMerge(analyseId, supabaseAdmin, apiKey));
      return new Response(JSON.stringify({ success: true, analyseId, phase: 'complement-merge' }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
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

    // ══ AIGUILLAGE — analyses complètes uniquement ══
    // ≥ SEUIL_MAP_REDUCE docs → MAP-REDUCE | sinon → single-call v7 (inchangé)
    // Les modes 'document' et 'complement' restent TOUJOURS en single-call.
    if (mode === 'complement') {
      // 🆕 COMPLEMENT V2 — plus jamais de regeneration du rapport entier en un appel
      console.log(`[analyser-run] → COMPLEMENT V2 (${fileIds.length} nouveau(x) doc(s))`);
      EdgeRuntime.waitUntil(runComplementMap(analyseId, fileIds, supabaseAdmin, apiKey));
    } else if (mode === 'complete' && fileIds.length >= SEUIL_MAP_REDUCE) {
      console.log(`[analyser-run] → MAP-REDUCE (${fileIds.length} docs ≥ seuil ${SEUIL_MAP_REDUCE})`);
      EdgeRuntime.waitUntil(runPhaseMap(analyseId, fileIds, profil, supabaseAdmin, apiKey, typeBienDeclare));
    } else {
      EdgeRuntime.waitUntil(runAnalyseWithData(analyseId, fileIds, mode, profil, supabaseAdmin, apiKey, existingReport, complementDocNames, typeBienDeclare, fromRetry));
    }

    return new Response(JSON.stringify({ success: true, analyseId }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[analyser-run] Erreur handler:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
