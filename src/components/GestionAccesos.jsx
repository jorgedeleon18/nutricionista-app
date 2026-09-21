import { useState } from 'react';
import { PATIENTS } from '../data/patients.js';

function emailDesdeNombre(nombre) {
  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, '.');
  return `${base}@gmail.com`;
}

const INITIAL_ACCESOS = Object.entries(PATIENTS).map(([key, p]) => ({
  key,
  nombre: p.name,
  email: emailDesdeNombre(p.name),
  estado: 'activo',
}));

const ESTADO_LABEL = { activo: 'Activo', invitado: 'Invitación enviada', inactivo: 'Inactivo' };

export default function GestionAccesos() {
  const [accesos, setAccesos] = useState(INITIAL_ACCESOS);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');

  function handleInvitar(e) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;
    setAccesos((list) => [
      { key: 'nuevo-' + Date.now(), nombre: nombre.trim(), email: email.trim(), estado: 'invitado' },
      ...list,
    ]);
    setNombre('');
    setEmail('');
  }

  function toggleEstado(key) {
    setAccesos((list) =>
      list.map((a) => (a.key === key ? { ...a, estado: a.estado === 'inactivo' ? 'activo' : 'inactivo' } : a))
    );
  }

  function reenviar(key) {
    setAccesos((list) => list.map((a) => ({ ...a })).filter((a) => a.key === key || true));
  }

  return (
    <div className="page">
      <div className="accesos-top">
        <div>
          <h1>Gestión de accesos</h1>
          <p className="sub">Altas, bajas y modificación de pacientes</p>
        </div>
      </div>

      <div className="accesos-note">
        Esto todavía es una demo (mock): cuando lo conectemos con la base de datos, "Invitar paciente" le va a
        mandar un mail real para que cree su propia contraseña y pueda entrar a la app.
      </div>

      <form className="invite-form" onSubmit={handleInvitar}>
        <div className="field">
          <label>Nombre del paciente</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="paciente@mail.com"
          />
        </div>
        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '13px 22px' }}>
          + Invitar paciente
        </button>
      </form>

      <div className="accesos-box">
        <table className="accesos-table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accesos.map((a) => (
              <tr key={a.key}>
                <td>{a.nombre}</td>
                <td>{a.email}</td>
                <td>
                  <span className={'estado-badge ' + a.estado}>{ESTADO_LABEL[a.estado]}</span>
                </td>
                <td>
                  <div className="row-actions">
                    {a.estado === 'invitado' && (
                      <button className="btn-sm" onClick={() => reenviar(a.key)}>
                        Reenviar invitación
                      </button>
                    )}
                    {a.estado !== 'invitado' && (
                      <button className="btn-sm danger" onClick={() => toggleEstado(a.key)}>
                        {a.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
