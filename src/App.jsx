import { useState } from 'react';
import Login from './components/Login.jsx';
import Header from './components/Header.jsx';
import Mosaico from './components/Mosaico.jsx';
import PatientDetail from './components/PatientDetail.jsx';
import PatientDashboard from './components/PatientDashboard.jsx';
import GestionAccesos from './components/GestionAccesos.jsx';

export default function App() {
  const [session, setSession] = useState(null); // null | 'nutri' | 'paciente'
  const [openPatient, setOpenPatient] = useState(null);
  const [patientView, setPatientView] = useState('hoy');
  const [showAccesos, setShowAccesos] = useState(false);

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
        <PatientDashboard view={patientView} onChangeView={setPatientView} />
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
        <GestionAccesos />
      ) : openPatient ? (
        <PatientDetail patientKey={openPatient} />
      ) : (
        <Mosaico onOpenPatient={setOpenPatient} onOpenAccesos={() => setShowAccesos(true)} />
      )}
    </>
  );
}
