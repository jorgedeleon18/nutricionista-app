import { supabase } from './supabaseClient.js';

// Convierte una fila de la tabla "pacientes" + sus turnos al mismo formato
// que ya usaban todos los componentes en la versión mock, para no tener que
// reescribir Mosaico/PatientDetail/PatientDashboard/GestionAccesos.
function mapPacienteRow(row, turnosDeEstePaciente) {
  return {
    name: row.nombre,
    initials: row.iniciales,
    genero: row.genero,
    email: row.email,
    acceso: row.acceso,
    plan: row.plan || {},
    log: row.log || {},
    history: row.history || {},
    medidas: row.medidas || [],
    historiaClinica: row.historia_clinica || '',
    turnos: (turnosDeEstePaciente || []).map((t) => ({
      id: t.id,
      fecha: t.fecha,
      hora: (t.hora || '').slice(0, 5),
      motivo: t.motivo || '',
      avisar: t.avisar,
    })),
  };
}

function buildPatientsDict(pacientes, turnos) {
  const dict = {};
  (pacientes || []).forEach((p) => {
    dict[p.id] = mapPacienteRow(p, (turnos || []).filter((t) => t.paciente_id === p.id));
  });
  return dict;
}

export async function checkIsStaff(userId) {
  const { data, error } = await supabase.from('staff').select('id').eq('id', userId).maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function fetchAllPacientes() {
  const [{ data: pacientes, error: e1 }, { data: turnos, error: e2 }] = await Promise.all([
    supabase.from('pacientes').select('*').order('created_at', { ascending: true }),
    supabase.from('turnos').select('*').order('fecha', { ascending: true }).order('hora', { ascending: true }),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return buildPatientsDict(pacientes, turnos);
}

export async function fetchOwnPaciente(userId) {
  const [{ data: paciente, error: e1 }, { data: turnos, error: e2 }] = await Promise.all([
    supabase.from('pacientes').select('*').eq('id', userId).single(),
    supabase.from('turnos').select('*').eq('paciente_id', userId).order('fecha', { ascending: true }),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return buildPatientsDict([paciente], turnos);
}

// Traduce el "partial" con forma mock (plan, log, history, medidas,
// historiaClinica, acceso) a las columnas reales de la tabla pacientes.
export async function persistPaciente(id, partial) {
  const dbPatch = {};
  if ('acceso' in partial) dbPatch.acceso = partial.acceso;
  if ('plan' in partial) dbPatch.plan = partial.plan;
  if ('log' in partial) dbPatch.log = partial.log;
  if ('history' in partial) dbPatch.history = partial.history;
  if ('medidas' in partial) dbPatch.medidas = partial.medidas;
  if ('historiaClinica' in partial) dbPatch.historia_clinica = partial.historiaClinica;
  if (Object.keys(dbPatch).length === 0) return;
  const { error } = await supabase.from('pacientes').update(dbPatch).eq('id', id);
  if (error) throw error;
}

export async function addTurno(pacienteId, turno) {
  const { error } = await supabase.from('turnos').insert({
    paciente_id: pacienteId,
    fecha: turno.fecha,
    hora: turno.hora,
    motivo: turno.motivo || '',
    avisar: turno.avisar ?? true,
  });
  if (error) throw error;
}

export async function deleteTurno(pacienteId, fecha, hora) {
  const { error } = await supabase
    .from('turnos')
    .delete()
    .eq('paciente_id', pacienteId)
    .eq('fecha', fecha)
    .eq('hora', hora);
  if (error) throw error;
}

export async function invitarPaciente({ nombre, email, genero }) {
  const { data, error } = await supabase.functions.invoke('invite-patient', {
    body: { nombre, email, genero },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// Borra al paciente por completo: su usuario de Supabase Auth y, en cascada,
// su ficha y sus turnos. Pensado para que Florencia (que no tiene acceso al
// panel de Supabase) pueda deshacer una invitación o un alta mal hecha desde
// la propia app.
export async function eliminarPaciente(pacienteId) {
  const { data, error } = await supabase.functions.invoke('delete-patient', {
    body: { pacienteId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
