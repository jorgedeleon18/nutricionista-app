import { useState } from 'react';
import Login from './components/Login.jsx';
import Header from './components/Header.jsx';
import Mosaico from './components/Mosaico.jsx';
import PatientDetail from './components/PatientDetail.jsx';
import PatientDashboard from './components/PatientDashboard.jsx';

export default function App() {
  const [session, setSession] = useState(null); // null | 'nutri' | 'paciente'
  const [openPatient, setOpenPatient] = useState(null);

  function handleLogin(role) {
    setSession(role);
    setOpenPatient(null);
  }

  function handleLogout() {
    setSession(null);
    setOpenPatient(null);
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  if (session === 'paciente') {
    return (
      <>
        <Header subtitle="Vista paciente" onLogout={handleLogout} />
        <PatientDashboard />
      </>
    );
  }

  return (
    <>
      <Header subtitle="Vista nutricionista" onLogout={handleLogout} />
      {openPatient ? (
        <PatientDetail patientKey={openPatient} onBack={() => setOpenPatient(null)} />
      ) : (
        <Mosaico onOpenPatient={setOpenPatient} />
      )}
    </>
  );
}
