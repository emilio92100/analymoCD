// ══════════════════════════════════════════════════════════════
// EDGE FUNCTION — analyser-run (déclenchée par webhook Supabase)
// Étape 2 : Appel Claude avec file_ids → rapport → suppression RGPD
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
  parts.push('Detecte le type de document parmi : DDT, PV_AG, APPEL_CHARGES, RCP, DTG_PPT, CARNET_ENTRETIEN, PRE_ETAT_DATE, ETAT_DATE, TAXE_FONCIERE, COMPROMIS, DIAGNOSTIC_PARTIES_COMMUNES, AUTRE.');
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
  parts.push('PV_AG : {"document_type":"PV_AG","titre":"...","resume":"...","date_ag":null,"syndic":null,"quorum":{"presents":null,"total":null,"tantiemes_pct":null},"budget_vote":{"annee":null,"montant":null,"fonds_travaux":null},"budget_precedent":{"annee":null,"montant":null},"travaux_votes":[{"label":"...","montant":null,"echeance":null}],"travaux_evoques":[{"label":"...","precision":null,"concerne_lot_prive":false}],"questions_diverses":[],"procedures":[],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES PV_AG :');
  parts.push('- travaux_evoques : N y mettre QUE des travaux collectifs non encore votés dont le coût potentiel serait significatif pour l acheteur (plusieurs centaines d euros minimum par lot si voté). Exemples valides : toiture, ravalement, ascenseur, canalisations communes, chauffage collectif, DTG, mise aux normes électriques parties communes. EXCLURE ABSOLUMENT : affaires courantes (ménage, contrats prestataires, entretien récurrent), points de suivi administratifs (compteurs, câbles internet, nuisibles), travaux déjà réalisés, et tout ce qui concerne exclusivement le logement privatif d un seul copropriétaire (VMC personnelle, travaux dans son appartement). Ces éléments vont dans questions_diverses ou sont ignorés.');
  parts.push('- La question clé pour décider : si ce point est voté en AG future, l acheteur recevra-t-il un appel de fonds significatif ? Si non -> ne pas mettre dans travaux_evoques.');
  parts.push('- Dans points_vigilance, si tu mentionnes quitus refusé, TOUJOURS expliquer en langage clair : "Quitus refusé au syndic (les copropriétaires ont voté contre la validation de la gestion financière du syndic) pour l exercice XXXX. Cela traduit un désaccord ou une méfiance vis-à-vis de la gestion."');
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
  parts.push('CARNET_ENTRETIEN : {"document_type":"CARNET_ENTRETIEN","titre":"...","resume":"...","date_maj":null,"annee_construction":null,"syndic":null,"syndic_adresse":null,"syndic_responsable":null,"syndic_gestionnaire":null,"syndic_comptable":null,"syndic_email":null,"syndic_date_designation":null,"syndic_garantie":null,"syndic_carte_pro":null,"nb_lots_principaux":null,"nb_lots_secondaires":null,"nb_lots_detail":{"logements":null,"caves":null,"parkings":null,"commerces":null,"autres":null},"immatriculation_registre":null,"fonds_travaux_alur_global":null,"avance_tresorerie":null,"avance_travaux":null,"fibre_optique":null,"chauffage_collectif":false,"type_chauffage":null,"eau_chaude_collective":false,"gardien":{"nom":null,"horaires":null,"telephone":null},"conseil_syndical":{"date_nomination":null,"echeance_mandat":null,"membres":[]},"rcp_info":{"date_origine":null,"modificatifs":[{"date":null,"objet":null,"notaire":null}]},"procedures":[{"label":"...","date_debut":null,"date_fin":null,"commentaire":null}],"diagnostics_parties_communes":[{"type":"amiante|plomb|termites|ascenseur|autre","label":"...","date":null,"entreprise":null,"resultat":"negatif|positif|non_effectue","commentaire":null}],"mesures_administratives":{"arrete_peril":false,"insalubrite":false,"injonction_travaux":false,"monument_historique":false,"administration_provisoire":false},"risques_sanitaires":{"legionella":false,"radon":false,"merule":false},"contrats":[{"equipement":"...","prestataire":null,"reference":null,"date_effet":null,"periodicite":null,"preavis":null}],"travaux_realises":[{"annee":null,"label":"...","entreprise":null,"montant":null,"assurance_do":null,"financement":null}],"infos_complementaires":[{"label":"...","valeur":"..."}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES CARNET_ENTRETIEN :');
  parts.push('- procedures : extraire TOUTES les procédures judiciaires mentionnées — c est critique pour l acheteur. Mettre dans points_vigilance si présentes.');
  parts.push('- diagnostics_parties_communes : extraire chaque diagnostic avec son entreprise, sa date et son résultat (negatif = aucune présence, positif = présence détectée, non_effectue = immeuble soumis mais pas de recherche). Ne pas confondre avec les diagnostics privatifs du lot.');
  parts.push('- mesures_administratives : toutes les réponses OUI/NON sur arrêté de péril, insalubrité, injonction de travaux, monument historique, administration provisoire.');
  parts.push('- contrats : ne pas mettre de date_effet si non mentionnée dans le document. Ne pas inventer de dates.');
  parts.push('- travaux_realises : extraire le statut de financement si mentionné (soldé / en cours). Mettre dans points_vigilance si financement en cours car appels de fonds potentiels.');
  parts.push('- infos_complementaires : tout ce qui ne rentre pas dans les champs prévus mais qui est utile pour un acheteur (ex: fibre optique, patrimoine syndicat, AFUL, syndicat secondaire...).');
  parts.push('- points_vigilance : inclure procédures en cours, financement travaux en cours, diagnostics positifs, recherches non effectuées sur immeuble soumis à réglementation.');
  parts.push('');
  parts.push('PRE_ETAT_DATE : {"document_type":"PRE_ETAT_DATE","titre":"...","resume":"...","date":null,"syndic":null,"syndic_adresse":null,"nb_lots_copro":null,"immatriculation_registre":null,"lots_vente":[{"type":"appartement|cave|parking|garage|grenier|combles|autre","numero":null,"batiment":null,"etage":null}],"impayes_vendeur":0,"fonds_travaux_alur":null,"fonds_roulement_acheteur":null,"fonds_roulement_modalite":"remboursement_vendeur|reconstitution_syndicat","honoraires_syndic":null,"charges_futures":{"montant_trimestriel":null,"fonds_travaux_trimestriel":null,"montant_annuel":null},"travaux_charge_vendeur":[{"label":"...","montant":null}],"procedures_contre_vendeur":[],"procedures_copro":"neant|en_cours","impayes_copro_global":null,"dette_fournisseurs":null,"fonds_travaux_copro_global":null,"historique_charges":[{"exercice":"N-1","annee":null,"budget_appele":null,"charges_reelles":null}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
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
  parts.push('- avis_verimo : ne pas alarmer sur les impayés globaux copro si le vendeur est à jour. Si fonds_travaux_alur ou fonds_roulement_acheteur sont présents, TOUJOURS rappeler dans l avis_verimo que l acheteur devra verser ces montants au vendeur à la signature et de les intégrer dans son budget d acquisition total.');
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
  parts.push('DIAGNOSTIC_PARTIES_COMMUNES : {"document_type":"DIAGNOSTIC_PARTIES_COMMUNES","titre":"...","resume":"...","type_diagnostic":"DTA|PLOMB|TERMITES|AUTRE","date":null,"cabinet":null,"certification":null,"resultat_global":"detecte|non_detecte|surveillance","action_requise":"retrait|surveillance|conservation|aucune","prochaine_visite":null,"zones_detectees":[{"localisation":"...","materiau":null,"liste":null,"etat":null,"action":null}],"zones_saines":[],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('AUTRE : {"document_type":"AUTRE","titre":"...","resume":"...","infos_cles":[{"label":"...","valeur":"..."}],"contenu":[{"section":"...","detail":"..."}],"points_forts":[],"points_vigilance":[],"avis_verimo":"..."}');
  parts.push('');
  parts.push('REGLES GENERALES : resume = 3-4 phrases. avis_verimo se termine par : Cette analyse porte sur un seul document. Pour une vision complete de votre futur bien, lancez une Analyse Complete. Ne jamais inventer des donnees absentes - mettre null si absent.');
  return parts.join('\n');
}

function buildSystemPrompt(mode: string, profil: string): string {
  const p = profil === 'invest' ? 'investissement locatif' : 'residence principale';
  if (mode === 'apercu_complete' || mode === 'apercu_document') {
    return `Tu es le moteur d analyse de documents immobiliers de Verimo. Profil : ${p}. Tu n utilises jamais les mots Claude, Anthropic ou IA.
Reponds UNIQUEMENT en JSON strict : {"titre": "adresse ou Votre bien", "recommandation_courte": "2-3 phrases", "points_vigilance": ["max 3"]}`;
  }
  if (mode === 'document') {
    return buildDocumentPrompt(p);
  }
  return `Tu es le moteur d analyse de documents immobiliers de Verimo. Profil acheteur : ${p}.
Tu informes, tu n orientes jamais la decision finale. Tu n utilises jamais les mots Claude, Anthropic ou IA.
Si une information est absente, tu le signales clairement.

REGLES DE NOTATION /20 (profil ${p}) :
- Base : 12/20. Travaux urgents non anticipes : -3 a -4. Gros travaux evoques non votes : -2 a -3.
- Fonds travaux nul : -2. DPE F (RP) : -2 / DPE G (RP) : -3. DPE F (invest) : -4 / DPE G (invest) : -6.
- Procedures judiciaires : -2 a -4. Fonds travaux conforme legal : +0.5. DPE A : +1 / DPE B ou C : +0.5.

REGLES IMPORTANTES :
- finances.budget_total_copro = budget annuel TOTAL copropriete, PAS la quote-part du lot
- finances.charges_annuelles_lot = charges annuelles du lot (quote-part acheteur). Extraire depuis TOUT document mentionnant les charges du lot : appels de charges, appels de fonds provisionnels. Un appel de fonds provisionnel est la MEME chose qu un appel de charges.
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
- negociation : applicable=true UNIQUEMENT si score < 14. INCLURE : travaux urgents chiffres / DPE F ou G uniquement (pas D ou E) / impayes vendeur / procedures judiciaires / gros travaux votes / travaux evoques sans vote depuis plusieurs AG. EXCLURE : DPE A/B/C/D / travaux charge vendeur / constats sans impact financier. Si aucun element ne justifie une negociation, applicable=false et elements=[].

Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres :
{"titre":"adresse complete","type_bien":"appartement|maison|maison_copro","annee_construction":null,"score":14.5,"score_niveau":"Bien sain","resume":"4-5 phrases","points_forts":[],"points_vigilance":[],"travaux":{"realises":[{"label":"desc","annee":"2021","montant_estime":35000,"justificatif":true}],"votes":[{"label":"desc","annee":"2027","montant_estime":4500,"charge_vendeur":false}],"evoques":[{"label":"desc","annee":null,"montant_estime":null,"precision":"contexte"}],"estimation_totale":null},"finances":{"budget_total_copro":null,"charges_annuelles_lot":null,"fonds_travaux":null,"fonds_travaux_statut":"non_mentionne|conforme|insuffisant|absent","impayes":null,"type_chauffage":null,"budgets_historique":null},"procedures":[{"label":"Type","type":"copro_vs_syndic|impayes|contentieux|autre","gravite":"faible|moderee|elevee","message":"Explication claire 2-3 phrases"}],"diagnostics_resume":"resume global","diagnostics":[{"type":"DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|CARREZ|AUTRE","label":"nom complet","perimetre":"lot_privatif|parties_communes","localisation":"localisation","resultat":"resultat avec GES si DPE","presence":"detectee|absence|non_realise","alerte":null,"pieces_detail":null}],"documents_analyses":[{"type":"PV_AG|REGLEMENT_COPRO|APPEL_CHARGES|DPE|DDT|DIAGNOSTIC|COMPROMIS|ETAT_DATE|TAXE_FONCIERE|CARNET_ENTRETIEN|AUTRE","annee":null,"nom":"nom fichier"}],"documents_manquants":[],"negociation":{"applicable":false,"elements":[]},"vie_copropriete":{"syndic":{"nom":null,"fin_mandat":null,"tensions_detectees":false,"tensions_detail":null},"participation_ag":[{"annee":"2024","copropietaires_presents_representes":"18/24","taux_tantiemes_pct":"72%","quorum_note":null}],"tendance_participation":"Non determinable","analyse_participation":"analyse","travaux_votes_non_realises":[],"appels_fonds_exceptionnels":[],"questions_diverses_notables":[]},"lot_achete":{"quote_part_tantiemes":null,"parties_privatives":[],"impayes_detectes":null,"fonds_travaux_alur":null,"travaux_votes_charge_vendeur":[],"restrictions_usage":[],"points_specifiques":[]},"categories":{"travaux":{"note":4,"note_max":5},"procedures":{"note":4,"note_max":4},"finances":{"note":3,"note_max":4},"diags_privatifs":{"note":2,"note_max":4},"diags_communs":{"note":1.5,"note_max":3}},"avis_verimo":"Avis structure en 2-3 paragraphes. Ce rapport est etabli uniquement a partir des documents analyses et ne remplace pas l avis d un professionnel de l immobilier."}`;
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
  apiKey: string
): Promise<void> {
  const fileIds = files.map(f => f.id);
  try {
    console.log(`[analyser-run] Analyse ${analyseId} — ${files.length} docs | mode:${mode}`);

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
      'Lecture des documents en cours...',
      'Analyse des diagnostics et travaux...',
      'Verification des procedures et finances...',
      'Synthese des informations...',
      'Redaction du rapport en cours...',
    ];
    const progressInterval = setInterval(async () => {
      const msg = progressMessages[msgCount % progressMessages.length];
      msgCount++;
      await supabaseAdmin.from('analyses').update({ progress_message: msg }).eq('id', analyseId);
    }, 60_000);

    let result = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
    clearInterval(progressInterval);
    let report = result.error ? null : parseJson<Record<string, unknown>>(result.text);

    if (!result.error && !report) {
      console.warn('[analyser-run] JSON invalide — retry 5s');
      await sleep(5000);
      result = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
      report = result.error ? null : parseJson<Record<string, unknown>>(result.text);
    }

    console.log(`[analyser-run] Suppression RGPD de ${fileIds.length} fichier(s)`);
    await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));

    if (result.error || !report) {
      const msg = result.error === 'rate_limit' ? 'Service surcharg\u00e9. R\u00e9essayez dans quelques minutes.'
        : result.error === 'overload' ? 'Service indisponible. R\u00e9essayez dans quelques minutes.'
        : !report ? 'Erreur de g\u00e9n\u00e9ration. R\u00e9essayez ou contactez le support.'
        : 'Erreur inattendue. Contactez le support.';
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: msg }).eq('id', analyseId);
      return;
    }

    const isApercu = mode.startsWith('apercu');
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

    const { error: updateError } = await supabaseAdmin.from('analyses').update(updateData).eq('id', analyseId);
    if (updateError) {
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur sauvegarde. Contactez le support.' }).eq('id', analyseId);
    } else {
      console.log(`[analyser-run] ${analyseId} termin\u00e9e avec succ\u00e8s.`);
    }
  } catch (err) {
    console.error('[analyser-run] Erreur:', err);
    await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));
    await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: 'Erreur inattendue. Contactez le support.' }).eq('id', analyseId);
  }
}

async function runAnalyse(analyseId: string, supabaseAdmin: SupabaseClient, apiKey: string): Promise<void> {
  const fileIds: string[] = [];
  try {
    const { data: analyse, error } = await supabaseAdmin
      .from('analyses')
      .select('file_ids, mode, profil')
      .eq('id', analyseId)
      .single();

    if (error || !analyse) { console.error('[analyser-run] Analyse introuvable:', error); return; }

    const files = (analyse.file_ids as Array<{ id: string; name: string }>) || [];
    const mode = (analyse.mode as string) || 'complete';
    const profil = (analyse.profil as string) || 'rp';

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
      'Lecture des documents en cours...',
      'Analyse des diagnostics et travaux...',
      'Verification des procedures et finances...',
      'Synthese des informations...',
      'Redaction du rapport en cours...',
    ];
    const progressInterval = setInterval(async () => {
      const msg = progressMessages[msgCount % progressMessages.length];
      msgCount++;
      await supabaseAdmin.from('analyses').update({ progress_message: msg }).eq('id', analyseId);
    }, 60_000);

    let result = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
    clearInterval(progressInterval);
    let report = result.error ? null : parseJson<Record<string, unknown>>(result.text);

    if (!result.error && !report) {
      console.warn('[analyser-run] JSON invalide — retry 5s');
      await sleep(5000);
      result = await callAI({ system: buildSystemPrompt(mode, profil), userContent, maxTokens: MAX_TOKENS_OUTPUT, apiKey });
      report = result.error ? null : parseJson<Record<string, unknown>>(result.text);
    }

    console.log(`[analyser-run] Suppression RGPD de ${fileIds.length} fichier(s)`);
    await Promise.all(fileIds.map(id => deleteFromFilesAPI(id, apiKey)));

    if (result.error || !report) {
      const msg = result.error === 'rate_limit' ? 'Service surcharg\u00e9. R\u00e9essayez dans quelques minutes.'
        : result.error === 'overload' ? 'Service indisponible. R\u00e9essayez dans quelques minutes.'
        : !report ? 'Erreur de g\u00e9n\u00e9ration. R\u00e9essayez ou contactez le support.'
        : 'Erreur inattendue. Contactez le support.';
      await supabaseAdmin.from('analyses').update({ status: 'failed', progress_message: msg }).eq('id', analyseId);
      return;
    }

    const isApercu = mode.startsWith('apercu');
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

    if (!fileIds.length) {
      console.error(`[analyser-run] Pas de fileIds dans le payload`);
      return new Response(JSON.stringify({ error: 'no_file_ids' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    console.log(`[analyser-run] Lancement — ${fileIds.length} docs | mode:${mode}`);
    EdgeRuntime.waitUntil(runAnalyseWithData(analyseId, fileIds, mode, profil, supabaseAdmin, apiKey));

    return new Response(JSON.stringify({ success: true, analyseId }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[analyser-run] Erreur handler:', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
