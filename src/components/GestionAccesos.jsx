import { useState } from 'react';
import { avatarColor, ESTADO_LABEL } from '../data/patients.js';

export default function GestionAccesos({ patients, onInvitar, onToggleEstado }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [genero, setGenero] = useState('F');
  const [reenviado, setReenviado] = useState(null);

  function handleInvitar(e) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;
    onInvitar({ nombre: nombre.trim(), email: email.trim(), genero });
    setNombre('');
    setEmail('');
    setGenero('F');
  }

  function reenviar(key) {
    setReenviado(key);
    setTimeout(() => setReenviado(null), 2000);
  }

  const filas = Object.entries(patients).sort(([, a], [, b]) => {
    // invitados primero, después activos, después inactivos
    const orden = { invitado: 0, activo: 1, inactivo: 2 };
    return orden[a.acceso] - orden[b.acceso];
  });

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
        mandar un mail real para que cree su propia contraseña y pueda entrar a la app. Un paciente nuevo arranca
        con el plan y las mediciones vacías, listos para que los cargues desde su ficha.
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
        <div className="field" style={{ flex: '0 0 auto', minWidth: 180 }}>
          <label>Género</label>
          <div className="role-segs" style={{ marginBottom: 0 }}>
            <button type="button" className={'role-seg' + (genero === 'F' ? ' active' : '')} onClick={() => setGenero('F')}>
              Femenino
            </button>
            <button type="button" className={'role-seg' + (genero === 'M' ? ' active' : '')} onClick={() => setGenero('M')}>
              Masculino
            </button>
          </div>
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
            {filas.map(([key, a]) => (
              <tr key={key}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      className="avatar"
                      style={{ background: avatarColor(a.genero), width: 30, height: 30, fontSize: 11 }}
                    >
                      {a.initials}
                    </span>
                    {a.name}
                  </div>
                </td>
                <td>{a.email}</td>
                <td>
                  <span className={'estado-badge ' + a.acceso}>{ESTADO_LABEL[a.acceso]}</span>
                </td>
                <td>
                  <div className="row-actions">
                    {a.acceso === 'invitado' && (
                      <button className="btn-sm" onClick={() => reenviar(key)}>
                        {reenviado === key ? '✓ Mail reenviado' : 'Reenviar invitación'}
                      </button>
                    )}
                    {a.acceso !== 'invitado' && (
                      <button className="btn-sm danger" onClick={() => onToggleEstado(key)}>
                        {a.acceso === 'activo' ? 'Dar de baja' : 'Reactivar'}
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
