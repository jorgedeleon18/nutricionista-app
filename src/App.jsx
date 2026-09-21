import { useEffect, useRef, useState } from 'react';
import Login from './components/Login.jsx';
import ConfirmAccount from './components/ConfirmAccount.jsx';
import Header from './components/Header.jsx';
import Mosaico from './components/Mosaico.jsx';
import PatientDetail from './components/PatientDetail.jsx';
import PatientDashboard from './components/PatientDashboard.jsx';
import GestionAccesos from './components/GestionAccesos.jsx';
import { supabase } from './lib/supabaseClient.js';
import {
  checkIsStaff, fetchAllPacientes, fetchOwnPaciente,
  persistPaciente, addTurno, deleteTurno, updateTurno, crearPacienteConClave, eliminarPaciente,
} from './lib/api.js';

// Si venimos del link del mail (invitación o recuperación de contraseña),
// Supabase mete "type=invite" o "type=recovery" en el hash de la URL. Lo
// leemos acá, apenas carga el módulo, antes de que se pierda.
const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
const AUTH_LINK_TYPE = hashParams.get('type');

export default function App() {
  const [status, setStatus] = useState(
    AUTH_LINK_TYPE === 'invite' || AUTH_LINK_TYPE === 'recovery' ? 'confirmar' : 'cargando'
  );
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null); // 'staff' | 'paciente'
  const [patients, setPatients] = useState({});
  const [loadError, setLoadError] = useState('');

  const [openPatient, setOpenPatient] = useState(null);
  const [patientView, setPatientView] = useState('hoy');
  const [showAccesos, setShowAccesos] = useState(false);

  // Mientras estamos en la pantalla de "elegir tu contraseña" no queremos que
  // el listener de auth nos empuje adentro de la app todavía. Usamos un ref
  // (no un estado) para que el valor esté siempre al día dentro del listener.
  const enConfirmacion = useRef(AUTH_LINK_TYPE === 'invite' || AUTH_LINK_TYPE === 'recovery');

  async function loadDataFor(sess) {
    try {
      setLoadError('');
      const isStaff = await checkIsStaff(sess.user.id);
      setRole(isStaff ? 'staff' : 'paciente');
      const dict = isStaff ? await fetchAllPacientes() : await fetchOwnPaciente(sess.user.id);
      setPatients(dict);
    } catch (err) {
      console.error(err);
      setLoadError('No se pudieron cargar los datos. Revisá tu conexión y volvé a intentar.');
    }
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (enConfirmacion.current && event !== 'SIGNED_OUT') return; // no pisar la pantalla de confirmar cuenta
      setSession(sess);
      if (sess) {
        loadDataFor(sess).then(() => setStatus('adentro'));
      } else {
        setRole(null);
        setPatients({});
        setStatus('afuera');
      }
    });

    if (AUTH_LINK_TYPE !== 'invite' && AUTH_LINK_TYPE !== 'recovery') {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setSession(data.session);
          loadDataFor(data.session).then(() => setStatus('adentro'));
        } else {
          setStatus('afuera');
        }
      });
    }

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setOpenPatient(null);
    setPatientView('hoy');
    setShowAccesos(false);
  }

  async function handleConfirmed() {
    // Ya eligió su contraseña — refrescamos el hash y cargamos como paciente.
    enConfirmacion.current = false;
    window.history.replaceState(null, '', window.location.pathname);
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setSession(data.session);
      await loadDataFor(data.session);
    }
    setStatus('adentro');
  }

  function updatePatient(key, updates) {
    setPatients((prev) => {
      const cur = prev[key];
      if (!cur) return prev;
      const partial = typeof updates === 'function' ? updates(cur) : updates;
      persistPaciente(key, partial).catch((err) => {
        console.error(err);
        window.alert('No se pudo guardar el cambio. Revisá tu conexión e intentá de nuevo.');
      });
      return { ...prev, [key]: { ...cur, ...partial } };
    });
  }

  async function addPatient({ nombre, email, genero }) {
    const { password } = await crearPacienteConClave({ nombre, email, genero });
    const dict = await fetchAllPacientes();
    setPatients(dict);
    return password;
  }

  function toggleEstado(key) {
    updatePatient(key, (prev) => ({ acceso: prev.acceso === 'inactivo' ? 'activo' : 'inactivo' }));
  }

  async function handleEliminarPaciente(key) {
    await eliminarPaciente(key);
    setPatients((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleAddTurno(key, turno) {
    try {
      const fila = await addTurno(key, turno);
      const nuevo = { id: fila.id, fecha: fila.fecha, hora: (fila.hora || '').slice(0, 5), motivo: fila.motivo || '', avisar: fila.avisar };
      setPatients((prev) => {
        const cur = prev[key];
        if (!cur) return prev;
        const turnos = [...(cur.turnos || []), nuevo].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
        return { ...prev, [key]: { ...cur, turnos } };
      });
    } catch (err) {
      console.error(err);
      window.alert('No se pudo guardar el turno. Probá de nuevo.');
    }
  }

  async function handleUpdateTurno(key, turnoId, cambios) {
    try {
      await updateTurno(turnoId, cambios);
      setPatients((prev) => {
        const cur = prev[key];
        if (!cur) return prev;
        const turnos = (cur.turnos || [])
          .map((t) => (t.id === turnoId ? { ...t, ...cambios } : t))
          .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
        return { ...prev, [key]: { ...cur, turnos } };
      });
    } catch (err) {
      console.error(err);
      window.alert('No se pudo modificar el turno. Probá de nuevo.');
    }
  }

  async function handleCancelTurno(key, fecha, hora) {
    try {
      await deleteTurno(key, fecha, hora);
      setPatients((prev) => {
        const cur = prev[key];
        if (!cur) return prev;
        return { ...prev, [key]: { ...cur, turnos: (cur.turnos || []).filter((t) => !(t.fecha === fecha && t.hora === hora)) } };
      });
    } catch (err) {
      console.error(err);
      window.alert('No se pudo cancelar el turno. Probá de nuevo.');
    }
  }

  if (status === 'cargando') {
    return <div className="page"><p className="empty-day">Cargando…</p></div>;
  }

  if (status === 'confirmar') {
    return <ConfirmAccount onConfirmed={handleConfirmed} />;
  }

  if (status === 'afuera' || !session) {
    return <Login onLogin={handleLogin} />;
  }

  if (loadError) {
    return (
      <div className="page">
        <p className="empty-day">{loadError}</p>
        <button className="btn-sm" onClick={() => loadDataFor(session)}>Reintentar</button>
      </div>
    );
  }

  if (role === 'paciente') {
    const own = patients[session.user.id];
    if (!own) {
      return <div className="page"><p className="empty-day">Cargando tu ficha…</p></div>;
    }
    return (
      <>
        <Header
          subtitle="Vista paciente"
          onLogout={handleLogout}
          onBack={patientView !== 'hoy' ? () => setPatientView('hoy') : undefined}
        />
        <PatientDashboard
          view={patientView}
          onChangeView={setPatientView}
          patient={own}
          onUpdatePatient={(updates) => updatePatient(session.user.id, updates)}
        />
      </>
    );
  }

  return (
    <>
      <Header
        subtitle="Vista nutricionista"
        onLogout={handleLogout}
        onBack={
          openPatient || showAccesos
            ? () => {
                setOpenPatient(null);
                setShowAccesos(false);
              }
            : undefined
        }
      />
      {showAccesos ? (
        <GestionAccesos
          patients={patients}
          onInvitar={addPatient}
          onToggleEstado={toggleEstado}
          onEliminar={handleEliminarPaciente}
        />
      ) : openPatient ? (
        <PatientDetail
          patientKey={openPatient}
          patients={patients}
          onUpdatePatient={updatePatient}
          onAddTurno={handleAddTurno}
          onUpdateTurno={handleUpdateTurno}
          onCancelTurno={handleCancelTurno}
        />
      ) : (
        <Mosaico patients={patients} onOpenPatient={setOpenPatient} onOpenAccesos={() => setShowAccesos(true)} />
      )}
    </>
  );
}
