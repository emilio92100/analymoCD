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

function recalculerCategories(rapport: RapportShape, profil: string): RapportShape {
  const diagnostics = rapport.diagnostics || [];
  const diagsPrivatifs = diagnostics.filter(d => d.perimetre === 'lot_privatif');
  const diagsCommuns = diagnostics.filter(d => d.perimetre === 'parties_communes');

  const anneeNum = rapport.annee_construction ? Number(String(rapport.annee_construction).replace(/[^0-9]/g, '')) : null;
  const typeBien = rapport.type_bien || 'appartement';
  const isCopro = typeBien === 'appartement' || typeBien === 'maison_copro';

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

async function deleteFromFilesAPI(fileId: string, apiKey: string): Promise<void> {
  try {
    await fetch(`${ANTHROPIC_FILES_URL}/${fileId}`, {
      method: 'DELETE',
      headers: { 'x-api-key': apiKey, 'anthropic-version': AI_VERSION, 'anthropic-beta': FILES_BETA },
    });
    console.log(`[analyser-run] Supprime: ${fileId}`);
  } catch { console.warn(`[analyser-run] Echec suppression ${fileId}`); }
}

async function callAI(params: {
  system: string; userContent: unknown[]; maxTokens: number; apiKey: string;
}): Promise<{ text: string; error?: string }> {
  const { system, userContent, maxTokens, apiKey } = params;
  for (let attempt = 1; attempt <= 3; attempt++) {
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
      });
      if (res.status === 429) { if (attempt < 3) { await sleep(Math.pow(2, attempt) * 5000); continue; } return { text: '', error: 'rate_limit' }; }
      if (res.status === 529 || res.status === 503) { if (attempt < 3) { await sleep(15000); continue; } return { text: '', error: 'overload' }; }
      if (!res.ok) { const e = await res.text(); console.error(`[analyser-run] Anthropic ${res.status}:`, e); return { text: '', error: `api_error_${res.status}` }; }
      const d = await res.json();
      const text = d.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
      if (!text) return { text: '', error: 'empty_response' };
      return { text };
    } catch (err) { if (attempt < 3) { await sleep(3000); continue; } return { text: '', error: 'network_error' }; }
  }
  return { text: '', error: 'max_retries' };
}

function buildDocumentPrompt(p: string): string {
  const parts: string[] = [];
  parts.push('Tu es le moteur d analyse de documents immobiliers de Verimo. Profil : ' + p + '. Tu n utilises jamais les mots Claude, Anthropic ou IA.');
  parts.push('');
  parts.push('Detecte le type de document parmi : DDT, PV_AG, APPEL_CHARGES, RCP, DTG_PPT, CARNET_ENTRETIEN, PRE_ETAT_DATE, ETAT_DATE, TAXE_FONCIERE, COMPROMIS, DIAGNOSTIC_PARTIES_COMMUNES, MODIFICATIF_RCP, FICHE_SYNTHETIQUE, AUTRE.');
  parts.push('FICHE_SYNTHETIQUE : fiche synthetique de copropriete (document standardise loi ALUR). Indices : titre contient "fiche synthetique" ou "synthese copropriete" ; sections standardisees "Identification", "Caracteristiques techniques", "Donnees financieres" ; tenue obligatoire par le syndic et remise a jour annuellement.');
  parts.push('MODIFICATIF_RCP : document notarié portant modification de l etat descriptif de division et/ou du règlement de copropriété. Indices : mots-clés "modificatif", "état descriptif de division", "règlement de copropriété" + notaire + création/suppression/modification de lot ou de tantièmes.');
  parts.push('');
  parts.push('Reponds UNIQUEMENT en JSON strict selon le type detecte.');
  parts.push('');
  parts.push('DDT : {"document_type":"DDT","titre":"...","resume":"3-4 phrases","diagnostiqueur":{"nom":null,"certification":null,"date":null},"lots_identifies":[{"type":"principal|cave|parking|garage|grenier|autre","numero":null,"etage":null,"description":null}],"dpe":{"classe":null,"kwh_m2":null,"ges_classe":null,"ges_kg_m2":null,"cout_annuel_min":null,"cout_annuel_max":null,"points_forts_isolation":[],"points_faibles_isolation":[],"validite":null},"carrez":{"surface_totale":null,"surface_type":"carrez|boutin|autre","pieces":[{"piece":"...","surface":0,"hors_carrez":false}],"annexes":[{"type":"balcon|terrasse|jardin|cave|parking|autre","surface":null}]},"diagnostics":[{"type":"AMIANTE|ELECTRICITE|GAZ|PLOMB|TERMITES|ERP|CARREZ|DPE|AUTRE","label":"...","presence":"conforme|anomalie|non_detecte|non_applicable|informatif","detail":"texte complet du diagnostic pour accordeon","alerte":"1 phrase courte si point critique sinon null"}],"travaux_preconises":[{"label":"...","priorite":"prioritaire|recommande","cout_min":null,"cout_max":null}],"gain_energetique":null,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
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
  parts.push('APPEL_CHARGES : {"document_type":"APPEL_CHARGES","titre":"...","resume":"...","periode":null,"syndic":null,"syndic_adresse":null,"syndic_gestionnaire":null,"reference_dossier":null,"montant_trimestre":null,"montant_annuel":null,"montant_mensuel":null,"solde_debiteur":null,"echeance":null,"impayes":false,"alerte_impaye":null,"lots":[{"type":"appartement|cave|parking|garage|grenier|combles|autre","numero":null,"etage":null,"escalier":null,"total_trimestre":null,"postes":[{"label":"...","tantiemes":null,"base_tantiemes":null,"trimestre":null,"annuel":null}]}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES APPEL_CHARGES :');
  parts.push('- lots : regrouper les postes par lot. Chaque lot a son type (appartement/cave/parking/garage), son numéro, son étage, son escalier si mentionné, et son total trimestriel. Les postes de chaque lot contiennent le label, les tantièmes, la base de tantièmes, le montant trimestriel et annuel estimé (× 4).');
  parts.push('- solde_debiteur : extraire le solde débiteur si présent (montant positif = dette du copropriétaire). Différent du montant de l appel.');
  parts.push('- alerte_impaye : si solde_debiteur > 0, rédiger 1 phrase courte d alerte : "Solde débiteur de X € — ce montant doit être apuré par le vendeur avant la signature de l acte authentique."');
  parts.push('- montant_annuel : si non indiqué dans le document, calculer montant_trimestre × 4. montant_mensuel = montant_annuel / 12.');
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
  parts.push('COMPROMIS : {"document_type":"COMPROMIS","titre":"...","resume":"...","date_signature":null,"date_acte":null,"notaire_acheteur":null,"notaire_vendeur":null,"agence":null,"vendeur":null,"acheteur":null,"bien":{"adresse":null,"type":null,"surface_carrez":null,"lot_principal":null,"tantiemes":null,"annexes":[]},"prix_net_vendeur":null,"honoraires_agence":null,"honoraires_charge":"acheteur|vendeur","prix_total":null,"depot_garantie":null,"depot_sequestre":null,"financement":{"apport":null,"montant_pret":null,"etablissement":null},"conditions_suspensives":[{"label":"...","detail":null,"date_limite":null,"statut":"en_cours|purge|levee"}],"dates_cles":[{"label":"...","date":null,"important":true}],"clauses_particulieres":[],"servitudes":[],"situation_locative":null,"bien_libre_a":null,"mobilier_inclus":[],"taxe_fonciere_prorata":null,"clause_substitution":false,"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('DIAGNOSTIC_PARTIES_COMMUNES : {"document_type":"DIAGNOSTIC_PARTIES_COMMUNES","titre":"...","resume":"...","commanditaire":null,"syndic":null,"type_diagnostic":"DTA|PLOMB|TERMITES|AUTRE","resultat_global":"detecte|non_detecte|surveillance","rapports":[{"annee":null,"date":null,"cabinet":null,"operateur":null,"certification":null,"perimetre":null}],"zones_non_accessibles":[{"detail":"...","niveau":"reglementaire|informatif"}],"zones_par_localisation":[{"localisation":"...","emoji":"parcours","cabinet":null,"rapport_annee":null,"zones":[{"localisation_detail":"...","identifiant":null,"materiau":null,"action":"AC1|EP|surveillance|non_detecte"}],"plus":null}],"zones_saines":[],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
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

    parts.push('AUTRE : {"document_type":"AUTRE","titre":"...","resume":"...","infos_cles":[{"label":"...","valeur":"..."}],"contenu":[{"section":"...","detail":"..."}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES GENERALES : resume = 3-4 phrases. avis_verimo se termine par : Cette analyse porte sur un seul document. Pour une vision complete de votre futur bien, lancez une Analyse Complete. Ne jamais inventer des donnees absentes - mettre null si absent.');
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
  if (mode === 'apercu_complete' || mode === 'apercu_document') {
    return `Tu es le moteur d analyse de documents immobiliers de Verimo. Profil : ${p}. Tu n utilises jamais les mots Claude, Anthropic ou IA.
Reponds UNIQUEMENT en JSON strict : {"titre": "adresse ou Votre bien", "recommandation_courte": "2-3 phrases", "points_vigilance": ["max 3"]}`;
  }
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
  return `${typeBienBlock}Tu es le moteur d analyse de documents immobiliers de Verimo. Profil acheteur : ${p}.
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
- RÈGLE AFFICHAGE FINANCES LOT (UI) : NE JAMAIS mentionner "taxe fonciere" dans les labels ou textes concernant les finances copro du lot. La taxe fonciere est un impot, pas une charge copro. Si l onglet affiche un texte d aide, il doit etre : "Uploadez un appel de charges OU un pre-etat date pour obtenir ces informations." (Sans mention de taxe fonciere.)
- finances.budgets_historique = tableau des budgets annuels extraits de CHAQUE PV d'AG disponible : [{annee: "2023", budget_total: 180000, fonds_travaux: 9000, charges_lot: 3200}]. Laisser null si aucun PV fourni.
- diagnostics : perimetre OBLIGATOIRE = "lot_privatif" ou "parties_communes"
- diagnostics DPE : le champ "resultat" doit contenir la classe energetique ET la classe GES sous la forme "Classe E - 281 kWh/m2/an. GES: Classe D - 61 kg CO2/m2/an."
- diagnostics CARREZ/MESURAGE : si le document contient un detail des surfaces par piece, renseigner pieces_detail : [{"piece": "Sejour", "surface": 20.29}]. Sinon laisser null.
- diagnostics PLOMB parties communes : NE PAS inclure si annee_construction >= 1949.
- diagnostics AMIANTE parties communes : NE PAS inclure si annee_construction >= 1997.
- diagnostics TERMITES : mettre presence="absence" UNIQUEMENT si le document dit explicitement que l immeuble n est pas concerne.
- procedures : message doit expliquer clairement en langage simple l origine et les implications
- documents_analyses : lister TOUS les documents avec leur type detecte
- En cas de contexte tres long, priorise : PV AG > DDT > diagnostics > appels charges > RCP articles 1-30
- lot_achete.parties_privatives : lister TOUS les elements privatifs du lot avec leur numero et tantiemes si mentionnes.
- lot_achete.quote_part_tantiemes : tantiemes TOTAUX du lot. Ex : "171/9865emes".
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

- negociation : applicable=true UNIQUEMENT si score < 17. En dessous de ce seuil, il y a toujours au moins un levier de negociation possible. RÈGLE CRITIQUE : ne JAMAIS inclure dans negociation.elements des items deja a la charge du vendeur (travaux votes avant la vente, fonds ALUR a rembourser, honoraires syndic pre-etat date) — ces items ne sont PAS des leviers de negociation pour l acheteur. Les leviers valides sont : travaux evoques non votes avec risque acheteur, DPE defavorable (E/F/G seulement), equipements vetustes non remplaces (chaudiere > 20 ans par ex), anomalies techniques majeures detectees, procedures en cours, impayes copro eleves (>15% du budget), gouvernance defaillante (quitus refuse). Si un item mentionne "charge vendeur", "deja vote", "fonds ALUR" ou "honoraires pre-etat date" : NE PAS l inclure dans negociation.elements. Si aucun levier valide, mettre applicable=false et elements=[].

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
- compromis : si un compromis ou une promesse de vente est fourni, extraire dans lot_achete.compromis : { vendeur, acheteur, notaire_vendeur, notaire_acheteur, agence, prix_net_vendeur, honoraires_agence, honoraires_charge, prix_total, depot_garantie, date_signature, date_acte, bien_libre_a, conditions_suspensives: [{label, detail, date_limite, statut}], clauses_particulieres: [] } INCLURE : travaux urgents chiffres / DPE F ou G uniquement (pas D ou E) / impayes vendeur / procedures judiciaires / gros travaux votes / travaux evoques sans vote depuis plusieurs AG. EXCLURE : DPE A/B/C/D / travaux charge vendeur / constats sans impact financier. Si aucun element ne justifie une negociation, applicable=false et elements=[].

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

REGLES RESUME STRUCTURE (objet "resume" a 5 sections) :
- resume est un OBJET avec 5 cles : le_bien, la_copropriete, performance_energetique, diagnostics_privatifs, gouvernance_finances.
- Chaque cle contient soit un TEXTE (3-5 phrases factuelles, langage simple) soit null si aucune donnee dans les documents analyses ne permet de renseigner cette section.
- TON STRICTEMENT FACTUEL — zero evaluation. Le resume DECRIT ce que contiennent les documents, il n EVALUE jamais.
- INTERDIT dans resume : adjectifs evaluatifs ("correct", "preoccupant", "rassurant", "exigeant", "solide", "degrade", "defavorable", "inquietant", "tres bon", "problematique", "satisfaisant"...). Utiliser uniquement des faits mesurables.
- INTERDIT dans resume : mentionner "acheteur", "il faudra", "vous devrez", donner des pistes d action, faire des recommandations.
- INTERDIT dans resume : conclusions type "En conclusion...", "Ce qui constitue...", "Point negatif...", "Principal point...".
- Contenu suggere par section :
  * le_bien : type de bien, surface Carrez, composition du lot (appart + annexes), tantiemes generaux
  * la_copropriete : nombre de lots, annee construction, nb batiments, chauffage, equipements collectifs
  * performance_energetique : classe DPE avec kWh, GES, classe GES avec kg CO2, type de chauffage, menuiseries, consommation/cout annuel si documente
  * diagnostics_privatifs : liste factuelle des anomalies detectees (electricite, gaz, amiante, plomb, termites) avec leur nature. Ne pas qualifier leur gravite.
  * gouvernance_finances : syndic(s), changements, fonds ALUR, fonds travaux, impayes (montants bruts), procedures en cours (mention factuelle), DTG/PPT statut
- Si aucun document ne documente une section, mettre null. L UI masquera la section automatiquement.
- Une section peut etre null meme en analyse complete si l information n est pas disponible (ex: pas de DPE uploade -> performance_energetique = null).

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


{"titre":"adresse complete","type_bien":"appartement|maison|maison_copro","annee_construction":null,"score":14.5,"score_niveau":"Bien sain","resume":{"le_bien":null,"la_copropriete":null,"performance_energetique":null,"diagnostics_privatifs":null,"gouvernance_finances":null},"points_forts":[],"points_vigilance":[],"travaux":{"realises":[{"label":"desc","annee":"2021","montant_estime":35000,"justificatif":true}],"votes":[{"label":"desc","annee":"2027","montant_estime":4500,"charge_vendeur":false}],"evoques":[{"label":"desc","annee":null,"montant_estime":null,"precision":"contexte"}],"estimation_totale":null},"finances":{"budget_total_copro":null,"budget_total_copro_annee":null,"charges_annuelles_lot":null,"charges_annuelles_lot_source":null,"fonds_travaux":null,"fonds_travaux_annee":null,"fonds_travaux_statut":"non_mentionne|insuffisant|conforme|bien|excellent|absent","impayes":null,"type_chauffage":null,"budgets_historique":null},"procedures":[{"label":"Type","type":"copro_vs_syndic|impayes|contentieux|autre","gravite":"faible|moderee|elevee","message":"Explication claire 2-3 phrases"}],"diagnostics_resume":"resume global","diagnostics":[{"type":"DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|CARREZ|AUTRE","label":"nom complet","perimetre":"lot_privatif|parties_communes","localisation":"localisation","resultat":"resultat avec GES si DPE","presence":"detectee|absence|non_realise","alerte":null,"pieces_detail":null}],"documents_analyses":[{"type":"PV_AG|REGLEMENT_COPRO|APPEL_CHARGES|DPE|DDT|DIAGNOSTIC|COMPROMIS|ETAT_DATE|TAXE_FONCIERE|CARNET_ENTRETIEN|MODIFICATIF_RCP|PRE_ETAT_DATE|DIAGNOSTIC_PARTIES_COMMUNES|FICHE_SYNTHETIQUE|AUTRE","annee":null,"nom":"nom fichier"}],"documents_manquants":[],"negociation":{"applicable":false,"elements":[]},"vie_copropriete":{"syndic":{"nom":null,"type":"professionnel|benevole","gestionnaire":null,"fin_mandat":null,"tensions_detectees":false,"tensions_detail":null,"statut":null,"sortant":null,"entrant":null,"annee_changement":null,"nb_ags_analysees":null,"historique_changements":[]},"nb_lots_total":null,"nb_lots_detail":{"logements":null,"parkings":null,"caves":null,"commerces":null},"nb_batiments":null,"participation_ag":[{"annee":"2024","copropietaires_presents_representes":"18/24","taux_tantiemes_pct":"72%","quorum_note":null,"quitus":{"soumis":true,"approuve":true,"detail":null}}],"tendance_participation":"Non determinable","analyse_participation":"analyse","travaux_votes_non_realises":[],"appels_fonds_exceptionnels":[],"questions_diverses_notables":[],"dtg":{"present":false,"etat_general":null,"budget_urgent_3ans":null,"budget_total_10ans":null,"travaux_prioritaires":[]},"regles_copro":[{"label":"...","statut":"autorise|interdit|sous_conditions","impact_rp":false,"impact_invest":false}],"carnet_entretien":{"present":false,"date_maj":null,"immatriculation_registre":null,"equipements_copro":{"chauffage_collectif":null,"type_chauffage":null,"eau_chaude_collective":null,"eau_froide_collective":null,"fibre_optique":null,"ascenseur":null},"contrats_entretien":[{"equipement":"...","prestataire":null,"periodicite":null,"date_reconduction":null}],"travaux_realises_carnet":[{"annee":null,"label":"...","entreprise":null,"montant":null}],"travaux_en_cours_votes_carnet":[{"label":"...","date_ag":null,"montant":null}],"diagnostics_parties_communes_carnet":[{"type":"amiante|plomb|termites|ascenseur|autre","date":null,"entreprise":null,"resultat":"negatif|positif|non_effectue","commentaire":null}],"conseil_syndical_carnet":{"date_nomination":null,"nb_membres":null}},"modificatifs_rcp":[{"date_acte":null,"notaire":null,"type_modification":"creation_lot|suppression_lot|changement_usage|mise_a_jour_tantiemes|servitude|fusion_lots|autre","sur_quoi_porte":[{"aspect":"...","detail":"..."}],"impact_acheteur":"...","points_attention":[]}],"fiche_synthetique":{"present":false,"date":null,"fiche_recente":null,"immatriculation_registre":null,"dtg_realise":null,"dtg_date":null,"equipements_collectifs_detail":[]}},"lot_achete":{"quote_part_tantiemes":null,"parties_privatives":[],"impayes_detectes":null,"fonds_travaux_alur":null,"travaux_votes_charge_vendeur":[],"restrictions_usage":[],"points_specifiques":[]},"pre_etat_date":{"present":false,"date":null,"syndic":null,"impayes_vendeur":0,"fonds_travaux_alur":null,"fonds_travaux_ancien":null,"fonds_roulement_acheteur":null,"fonds_roulement_modalite":"remboursement_vendeur|reconstitution_syndicat","honoraires_syndic":null,"charges_futures":{"montant_trimestriel":null,"fonds_travaux_trimestriel":null,"montant_annuel":null},"travaux_charge_vendeur":[],"procedures_contre_vendeur":[],"procedures_copro":"neant|en_cours","impayes_copro_global":null,"dette_fournisseurs":null,"fonds_travaux_copro_global":null,"historique_charges":[{"exercice":"N-1","annee":null,"budget_appele":null,"charges_reelles":null,"provisions_hors_budget":null},{"exercice":"N-2","annee":null,"budget_appele":null,"charges_reelles":null,"provisions_hors_budget":null}]},"categories":{"travaux":{"note":4,"note_max":5},"procedures":{"note":4,"note_max":4},"finances":{"note":3,"note_max":4},"diags_privatifs":{"note":2,"note_max":4},"diags_communs":{"note":1.5,"note_max":3}},"avis_verimo":{"verdict":"phrase unique de lecture globale","verdict_highlight":"2-4 mots cles du verdict","contexte":"2-3 phrases de cadrage (quartier, type de copro, trajectoire reglementaire) — PAS de constat deja dans resume ou points_forts/vigilance","demarches":[{"titre":"point a approfondir ou question a poser","description":"1-2 phrases explicatives. Formulation neutre : jamais d imperatif, jamais de conseil direct."}]}}`;
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

    console.log(`[analyser-run] Suppression RGPD de ${fileIds.length} fichier(s)`);
    await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));

    if (result.error || !report) {
      const msg = result.error === 'rate_limit' ? 'Notre outil est momentanément surchargé. Votre crédit a été remboursé. Réessayez dans 2 à 3 minutes.'
        : result.error === 'overload' ? 'Notre outil est temporairement indisponible. Votre crédit a été remboursé. Réessayez dans quelques minutes.'
        : (result.error && result.error.startsWith('api_error_5')) ? 'Notre outil rencontre une perturbation temporaire. Votre crédit a été remboursé. Réessayez dans quelques minutes.'
        : !report ? 'Une erreur est survenue lors de la génération. Votre crédit a été remboursé. Réessayez ou contactez le support.'
        : 'Erreur inattendue. Votre crédit a été remboursé. Contactez le support.';
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: msg }).eq('id', analyseId);
      return;
    }

    const isApercu = mode.startsWith('apercu');

    // ══════════════════════════════════════════════════════════
    // RECALCUL DETERMINISTE DES NOTES DE CATEGORIES
    // (uniquement pour les modes complete et complement qui produisent
    //  la structure complete avec categories)
    // ══════════════════════════════════════════════════════════
    if (!isApercu && mode !== 'document') {
      try {
        report = recalculerCategories(report as RapportShape, profil) as Record<string, unknown>;
      } catch (e) {
        console.error('[analyser-run] Erreur recalcul categories (non bloquant):', e);
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
    };
    if (isApercu) { updateData.apercu = report; updateData.is_preview = true; }
    else { updateData.result = report; updateData.paid = true; }

    // Deadline 7 jours pour compléter le dossier (analyses complètes uniquement)
    if (!isApercu && mode !== 'complement' && mode !== 'document') {
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
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur sauvegarde. Contactez le support.' }).eq('id', analyseId);
    } else {
      console.log(`[analyser-run] ${analyseId} termin\u00e9e avec succ\u00e8s (mode: ${mode}).`);
    }
  } catch (err) {
    console.error('[analyser-run] Erreur:', err);
    if (fileIds.length > 0) await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));
    await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur inattendue. Contactez le support.' }).eq('id', analyseId);
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
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Aucun fichier trouv\u00e9.' }).eq('id', analyseId);
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

    console.log(`[analyser-run] Suppression RGPD de ${fileIds.length} fichier(s)`);
    await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));

    if (result.error || !report) {
      const msg = result.error === 'rate_limit' ? 'Notre outil est momentanément surchargé. Votre crédit a été remboursé. Réessayez dans 2 à 3 minutes.'
        : result.error === 'overload' ? 'Notre outil est temporairement indisponible. Votre crédit a été remboursé. Réessayez dans quelques minutes.'
        : (result.error && result.error.startsWith('api_error_5')) ? 'Notre outil rencontre une perturbation temporaire. Votre crédit a été remboursé. Réessayez dans quelques minutes.'
        : !report ? 'Une erreur est survenue lors de la génération. Votre crédit a été remboursé. Réessayez ou contactez le support.'
        : 'Erreur inattendue. Votre crédit a été remboursé. Contactez le support.';
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: msg }).eq('id', analyseId);
      return;
    }

    const isApercu = mode.startsWith('apercu');

    // ══════════════════════════════════════════════════════════
    // RECALCUL DETERMINISTE DES NOTES DE CATEGORIES
    // ══════════════════════════════════════════════════════════
    if (!isApercu && mode !== 'document') {
      try {
        report = recalculerCategories(report as RapportShape, profil) as Record<string, unknown>;
      } catch (e) {
        console.error('[analyser-run] Erreur recalcul categories (non bloquant):', e);
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
    };
    if (isApercu) { updateData.apercu = report; updateData.is_preview = true; }
    else { updateData.result = report; updateData.paid = true; }

    // Deadline 7 jours pour compléter le dossier
    if (!isApercu && mode !== 'document') {
      const dl = new Date(); dl.setDate(dl.getDate() + 7);
      updateData.regeneration_deadline = dl.toISOString();
    }

    const { error: updateError } = await supabaseAdmin.from('analyses').update(updateData).eq('id', analyseId);
    if (updateError) {
      console.error('[analyser-run] ERREUR UPDATE:', updateError.message);
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur sauvegarde. Contactez le support.' }).eq('id', analyseId);
    } else {
      console.log(`[analyser-run] ${analyseId} termin\u00e9e avec succ\u00e8s.`);
    }
  } catch (err) {
    console.error('[analyser-run] Erreur:', err);
    if (fileIds.length > 0) await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));
    await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur inattendue. Contactez le support.' }).eq('id', analyseId);
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

    if (!fileIds.length) {
      console.error(`[analyser-run] Pas de fileIds dans le payload`);
      return new Response(JSON.stringify({ error: 'no_file_ids' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    console.log(`[analyser-run] Lancement — ${fileIds.length} docs | mode:${mode} | typeDeclare:${typeBienDeclare || 'null'}`);
    EdgeRuntime.waitUntil(runAnalyseWithData(analyseId, fileIds, mode, profil, supabaseAdmin, apiKey, existingReport, complementDocNames, typeBienDeclare));

    return new Response(JSON.stringify({ success: true, analyseId }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[analyser-run] Erreur handler:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
