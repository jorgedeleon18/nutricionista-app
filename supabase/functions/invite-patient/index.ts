// Edge Function: invite-patient
// La invitación de un paciente nuevo necesita la service_role key de Supabase
// (para poder mandar el mail de invitación en nombre de Florencia), y esa key
// NUNCA debe viajar al navegador. Por eso esto corre server-side, en Supabase.
//
// Se despliega una sola vez con:
//   supabase functions deploy invite-patient
//
// El frontend la llama así (ver src/lib/supabaseClient.js):
//   supabase.functions.invoke('invite-patient', { body: { nombre, email, genero } })
//
// Supabase inyecta automáticamente las variables de entorno SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY en toda Edge Function — no hay que configurar nada.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function iniciales(nombre) {
  const partes = nombre.trim().split(/\s+/);
  const first = partes[0]?.[0] || '';
  const last = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (first + last).toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Solo Florencia (staff) puede invitar pacientes: verificamos el token
    // que mandó el frontend antes de hacer nada.
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: staffRow } = await admin.from('staff').select('id').eq('id', userData.user.id).maybeSingle();
    if (!staffRow) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { nombre, email, genero } = await req.json();
    if (!nombre || !email) {
      return new Response(JSON.stringify({ error: 'Falta nombre o email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // inviteUserByEmail manda el mail de invitación; el paciente entra desde ese
    // link y ahí mismo elige su propia contraseña (ver /src/components/ y el
    // flujo de "recovery" en supabaseClient.js).
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        role: 'paciente',
        nombre,
        genero: genero || 'F',
        iniciales: iniciales(nombre),
      },
      redirectTo: Deno.env.get('SITE_URL') ? `${Deno.env.get('SITE_URL')}/confirmar` : undefined,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, user: data.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
