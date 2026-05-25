// supabase/functions/notify-callback/index.ts
// ═══════════════════════════════════════════════════════════════════
// Notification d'une demande de rappel pro
// - Crée une alerte dans system_alerts (cloche admin)
// - Envoie un email à pro@verimo.fr
// ═══════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SLOT_LABELS: Record<string, string> = {
  matinee: 'Matinée (9h-12h)',
  dejeuner: 'Heure du déjeuner (12h-14h)',
  apres_midi: 'Après-midi (14h-18h)',
  soiree: 'Soirée (18h-20h)',
};

const CONTEXT_LABELS: Record<string, string> = {
  demo_expired: 'Crédits démo épuisés',
  abonnement_agence: 'Demande forfait agence',
  other: 'Autre',
};

async function sendMailjet(subject: string, htmlBody: string): Promise<boolean> {
  const MJ_API_KEY = Deno.env.get('MJ_API_KEY') ?? '';
  const MJ_SECRET_KEY = Deno.env.get('MJ_SECRET_KEY') ?? '';
  if (!MJ_API_KEY || !MJ_SECRET_KEY) {
    console.error('[notify-callback] Mailjet non configuré');
    return false;
  }

  try {
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${MJ_API_KEY}:${MJ_SECRET_KEY}`),
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: 'pro@verimo.fr', Name: 'Verimo Pro' },
          To: [{ Email: 'pro@verimo.fr', Name: 'Verimo Pro' }],
          Subject: subject,
          HTMLPart: htmlBody,
        }],
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[notify-callback] Mailjet ${res.status}:`, errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notify-callback] Mailjet exception:', err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, context, phone, preferred_slots, message } = await req.json();

    if (!user_id || !phone) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Récupérer infos du profil pro pour l'email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, prenom, nom, agency_name, profile_type, pro_status, role')
      .eq('id', user_id)
      .single();

    const userLabel = profile?.agency_name
      ? `${profile.agency_name} (${profile.prenom || ''} ${profile.nom || ''})`.trim()
      : `${profile?.prenom || ''} ${profile?.nom || ''}`.trim() || 'Utilisateur';

    const slotsLabels = (preferred_slots || []).map((s: string) => SLOT_LABELS[s] || s);
    const slotsText = slotsLabels.length > 0 ? slotsLabels.join(', ') : 'Non précisé';
    const contextLabel = CONTEXT_LABELS[context] || context;

    // 2. Insérer alerte cloche admin
    const { error: alertError } = await supabaseAdmin
      .from('system_alerts')
      .insert({
        type: 'callback_request',
        severity: 'info',
        title: `📞 Nouvelle demande de rappel — ${userLabel}`,
        message: `Téléphone : ${phone} | Créneau : ${slotsText} | Contexte : ${contextLabel}`,
        user_id,
        metadata: { phone, preferred_slots, message, context },
      });

    if (alertError) {
      console.error('[notify-callback] alert insert error:', alertError);
    }

    // 3. Envoyer email à pro@verimo.fr
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #f8fafc;">
        <div style="background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #2a7d9c, #4a9fc1); display: flex; align-items: center; justify-content: center; font-size: 20px;">📞</div>
            <h2 style="margin: 0; font-size: 18px; color: #0f172a;">Nouvelle demande de rappel</h2>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
            <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b; width: 140px;">Pro</td><td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 600;">${userLabel}</td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Email</td><td style="padding: 8px 0; font-size: 14px; color: #0f172a;">${profile?.email || '—'}</td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Type</td><td style="padding: 8px 0; font-size: 14px; color: #0f172a;">${profile?.profile_type || '—'}</td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Statut</td><td style="padding: 8px 0; font-size: 14px; color: #0f172a;">${profile?.pro_status || '—'}</td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Téléphone</td><td style="padding: 8px 0; font-size: 16px; color: #2a7d9c; font-weight: 700;"><a href="tel:${phone}" style="color: #2a7d9c; text-decoration: none;">${phone}</a></td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Créneau</td><td style="padding: 8px 0; font-size: 14px; color: #0f172a;">${slotsText}</td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Contexte</td><td style="padding: 8px 0; font-size: 14px; color: #0f172a;">${contextLabel}</td></tr>
          </table>

          ${message ? `
            <div style="padding: 14px 16px; background: #f0f7fb; border-radius: 10px; border-left: 3px solid #2a7d9c; margin-bottom: 18px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Message</div>
              <div style="font-size: 14px; color: #0f172a; line-height: 1.55;">${message.replace(/\n/g, '<br>')}</div>
            </div>
          ` : ''}

          <a href="https://verimo.fr/admin?tab=callbacks" style="display: inline-block; padding: 12px 22px; background: #0f2d3d; color: #fff; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700;">Voir dans l'admin →</a>
        </div>

        <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px;">Verimo · Demande à traiter sous 24h ouvrées</p>
      </div>
    `;

    await sendMailjet(`📞 Demande de rappel pro — ${userLabel}`, htmlBody);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[notify-callback] error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
