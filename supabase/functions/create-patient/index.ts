// Edge Function: create-patient
// Alternativa a invite-patient que NO manda ningún mail. Crea al paciente
// directo en Supabase Auth con una contraseña temporal generada acá mismo,
// y se la devuelve a Florencia para que se la pase al paciente por el medio
// que quiera (WhatsApp, en persona, etc). El paciente entra con su email y
// esa contraseña, y puede cambiarla después si quiere desde su cuenta.
//
// Se despliega con:
//   supabase functions deploy create-patient
//
// El frontend la llama así (ver src/lib/api.js):
//   supabase.functions.invoke('create-patient', { body: { nombre, email, genero } })

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

// Contraseña temporal fácil de dictar/escribir: "Nutri" + 4 dígitos.
function generarPassword() {
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `Nutri${numero}`;
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

    // Solo Florencia (staff) puede dar de alta pacientes.
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      console.error('[create-patient] getUser falló:', userErr);
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

    const password = generarPassword();

    // email_confirm: true = el usuario queda confirmado de entrada, sin
    // necesidad de que haga clic en ningún link de mail.
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'paciente',
        nombre,
        genero: genero || 'F',
        iniciales: iniciales(nombre),
      },
    });

    if (error) {
      console.error('[create-patient] createUser falló:', error.status, error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, user: data.user, password }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[create-patient] error inesperado:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
