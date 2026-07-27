import { supabase } from './supabase';

/**
 * Crée un ticket support quand un client est bloqué après 3 tentatives de
 * complément de dossier.
 *
 * Le ticket atterrit dans le canal support habituel : le client le retrouve
 * dans son espace et peut y répondre, l'admin le reçoit avec le badge non-lu,
 * et le fil de discussion fonctionne normalement dans les deux sens.
 *
 * Le premier message contient le rapport technique pré-rempli — l'admin n'a
 * rien à demander au client pour diagnostiquer.
 */
export async function creerSignalementComplement(params: {
  analyseId: string;
  adresse: string;
  messageClient?: string;
  nomsFichiers?: string[];
}): Promise<{ ok: boolean; ticketId?: string; error?: string }> {
  const { analyseId, adresse, messageClient, nomsFichiers } = params;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Session expirée. Reconnectez-vous et réessayez.' };

    // Un seul ticket ouvert par dossier : si le client reclique, on ajoute un
    // message au fil existant plutôt que de créer des doublons côté admin.
    const { data: existant } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('analyse_id', analyseId)
      .eq('status', 'open')
      .limit(1)
      .maybeSingle();

    let ticketId = existant?.id as string | undefined;

    if (!ticketId) {
      const sujet = `Mise à jour du dossier bloquée — ${adresse || 'dossier sans adresse'}`;
      const { data: ticket, error: errTicket } = await supabase
        .from('support_tickets')
        .insert({ user_id: user.id, subject: sujet, analyse_id: analyseId })
        .select()
        .single();

      if (errTicket || !ticket) {
        console.error('[Verimo] Création ticket échouée:', errTicket);
        return { ok: false, error: "Impossible d'envoyer le signalement. Réessayez dans un instant." };
      }
      ticketId = ticket.id as string;
    }

    // Rapport technique — volontairement visible par le client aussi (transparence).
    const lignes: string[] = [];
    lignes.push('🔧 Signalement automatique — mise à jour du dossier');
    lignes.push('');
    lignes.push(`Dossier : ${adresse || '(adresse non renseignée)'}`);
    lignes.push(`Référence : ${analyseId}`);
    lignes.push('La mise à jour a échoué à 3 reprises.');
    if (nomsFichiers?.length) {
      lignes.push(`Documents concernés : ${nomsFichiers.join(', ')}`);
    }
    lignes.push(`Date du signalement : ${new Date().toLocaleString('fr-FR')}`);
    if (messageClient?.trim()) {
      lignes.push('');
      lignes.push('Message du client :');
      lignes.push(messageClient.trim());
    }

    const { error: errMsg } = await supabase
      .from('support_messages')
      .insert({ ticket_id: ticketId, sender_type: 'user', message: lignes.join('\n') });

    if (errMsg) {
      console.error('[Verimo] Insertion message échouée:', errMsg);
      return { ok: false, error: "Impossible d'envoyer le signalement. Réessayez dans un instant." };
    }

    await supabase
      .from('support_tickets')
      .update({ unread_by_admin: true, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return { ok: true, ticketId };
  } catch (err) {
    console.error('[Verimo] creerSignalementComplement:', err);
    return { ok: false, error: 'Une erreur est survenue. Réessayez dans un instant.' };
  }
}
