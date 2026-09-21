// Edge Function: delete-patient
// Borrar un paciente por completo (usuario de auth + su ficha) necesita la
// service_role key, igual que invite-patient — por eso corre server-side.
//
// Se despliega con:
//   supabase functions deploy delete-patient
//
// El frontend la llama así (ver src/lib/api.js):
//   supabase.functions.invoke('delete-patient', { body: { pacienteId } })
//
// Al borrar el usuario de auth.users, la fila de public.pacientes se borra
// sola por el "on delete cascade" del foreign key (ver schema.sql). Sus
// turnos también se borran en cascada.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Solo Florencia (staff) puede eliminar pacientes.
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

    const { pacienteId } = await req.json();
    if (!pacienteId) {
      return new Response(JSON.stringify({ error: 'Falta pacienteId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error } = await admin.auth.admin.deleteUser(pacienteId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
