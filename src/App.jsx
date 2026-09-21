import { useState } from 'react';
import Login from './components/Login.jsx';
import Header from './components/Header.jsx';
import Mosaico from './components/Mosaico.jsx';
import PatientDetail from './components/PatientDetail.jsx';
import PatientDashboard from './components/PatientDashboard.jsx';
import GestionAccesos from './components/GestionAccesos.jsx';
import { PATIENTS as SEED_PATIENTS, emailFromName, blankPatient } from './data/patients.js';

function buildInitialPatients() {
  const withMeta = {};
  Object.entries(SEED_PATIENTS).forEach(([key, p]) => {
    withMeta[key] = { ...p, email: p.email || emailFromName(p.name), acceso: p.acceso || 'activo' };
  });
  return withMeta;
}

export default function App() {
  const [session, setSession] = useState(null); // null | 'nutri' | 'paciente'
  const [openPatient, setOpenPatient] = useState(null);
  const [patientView, setPatientView] = useState('hoy');
  const [showAccesos, setShowAccesos] = useState(false);
  const [patients, setPatients] = useState(buildInitialPatients);

  function handleLogin(role) {
    setSession(role);
    setOpenPatient(null);
    setPatientView('hoy');
    setShowAccesos(false);
  }

  function handleLogout() {
    setSession(null);
    setOpenPatient(null);
    setPatientView('hoy');
    setShowAccesos(false);
  }

  function updatePatient(key, updates) {
    setPatients((prev) => {
      const cur = prev[key];
      if (!cur) return prev;
      const partial = typeof updates === 'function' ? updates(cur) : updates;
      return { ...prev, [key]: { ...cur, ...partial } };
    });
  }

  function addPatient({ nombre, email, genero }) {
    const key = 'p' + Date.now();
    setPatients((prev) => ({ ...prev, [key]: blankPatient({ nombre, email, genero }) }));
  }

  function toggleEstado(key) {
    updatePatient(key, (prev) => ({ acceso: prev.acceso === 'inactivo' ? 'activo' : 'inactivo' }));
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  if (session === 'paciente') {
    return (
      <>
        <Header
          subtitle="Vista paciente"
          onLogout={handleLogout}
          onBack={patientView !== 'hoy' ? () => setPatientView('hoy') : undefined}
        />
        <PatientDashboard view={patientView} onChangeView={setPatientView} patient={patients.sofia} />
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
        <GestionAccesos patients={patients} onInvitar={addPatient} onToggleEstado={toggleEstado} />
      ) : openPatient ? (
        <PatientDetail patientKey={openPatient} patients={patients} onUpdatePatient={updatePatient} />
      ) : (
        <Mosaico patients={patients} onOpenPatient={setOpenPatient} onOpenAccesos={() => setShowAccesos(true)} />
      )}
    </>
  );
}
