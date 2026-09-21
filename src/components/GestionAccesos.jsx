import { useState } from 'react';
import { avatarColor, ESTADO_LABEL } from '../data/patients.js';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function GestionAccesos({ patients, onInvitar, onToggleEstado, onEliminar }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [genero, setGenero] = useState('F');
  const [reenviado, setReenviado] = useState(null);
  const [confirmInvitar, setConfirmInvitar] = useState(false);
  const [confirmEstado, setConfirmEstado] = useState(null); // { key, name, next }
  const [confirmEliminar, setConfirmEliminar] = useState(null); // { key, name }
  const [invitando, setInvitando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  function handleInvitar(e) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;
    setConfirmInvitar(true);
  }

  async function confirmarInvitacion() {
    setInvitando(true);
    try {
      await onInvitar({ nombre: nombre.trim(), email: email.trim(), genero });
      setNombre('');
      setEmail('');
      setGenero('F');
      setConfirmInvitar(false);
    } catch (err) {
      console.error(err);
      const detalle = err?.message ? `\n\nDetalle: ${err.message}` : '';
      window.alert('No se pudo invitar al paciente. Revisá que el email no esté ya usado y probá de nuevo.' + detalle);
    } finally {
      setInvitando(false);
    }
  }

  function pedirConfirmacionEstado(key, a) {
    setConfirmEstado({ key, name: a.name, next: a.acceso === 'activo' ? 'inactivo' : 'activo' });
  }

  function confirmarEstado() {
    if (confirmEstado) onToggleEstado(confirmEstado.key);
    setConfirmEstado(null);
  }

  function pedirEliminar(key, a) {
    setConfirmEliminar({ key, name: a.name });
  }

  async function confirmarEliminar() {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      await onEliminar(confirmEliminar.key);
      setConfirmEliminar(null);
    } catch (err) {
      console.error(err);
      window.alert('No se pudo eliminar al paciente. Probá de nuevo.');
    } finally {
      setEliminando(false);
    }
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
        "Invitar paciente" le manda un mail real para que cree su propia contraseña y pueda entrar a la app.
        Un paciente nuevo arranca con el plan y las mediciones vacías, listos para que los cargues desde su ficha.
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
            <button type="button" className={'role-seg' + (genero === 'F' ? ' active f' : '')} onClick={() => setGenero('F')}>
              Femenino
            </button>
            <button type="button" className={'role-seg' + (genero === 'M' ? ' active m' : '')} onClick={() => setGenero('M')}>
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
                      <button className="btn-sm danger" onClick={() => pedirConfirmacionEstado(key, a)}>
                        {a.acceso === 'activo' ? 'Dar de baja' : 'Reactivar'}
                      </button>
                    )}
                    <button className="btn-sm danger" onClick={() => pedirEliminar(key, a)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmInvitar}
        title="¿Invitar a este paciente?"
        message={`Le vamos a dar acceso a ${nombre.trim() || 'este paciente'} con el email ${email.trim()}. Va a arrancar con el plan y las mediciones vacías.`}
        confirmLabel={invitando ? 'Invitando…' : 'Sí, invitar'}
        onConfirm={confirmarInvitacion}
        onCancel={() => setConfirmInvitar(false)}
      />

      <ConfirmDialog
        open={!!confirmEstado}
        title={confirmEstado?.next === 'inactivo' ? '¿Dar de baja a este paciente?' : '¿Reactivar a este paciente?'}
        message={
          confirmEstado?.next === 'inactivo'
            ? `${confirmEstado?.name} va a dejar de tener acceso a la app hasta que lo reactivés.`
            : `${confirmEstado?.name} va a volver a tener acceso a la app.`
        }
        confirmLabel={confirmEstado?.next === 'inactivo' ? 'Sí, dar de baja' : 'Sí, reactivar'}
        danger={confirmEstado?.next === 'inactivo'}
        onConfirm={confirmarEstado}
        onCancel={() => setConfirmEstado(null)}
      />

      <ConfirmDialog
        open={!!confirmEliminar}
        title="¿Eliminar a este paciente?"
        message={`Esto borra a ${confirmEliminar?.name} por completo: su acceso, su ficha, su plan, sus mediciones y sus turnos. No se puede deshacer.`}
        confirmLabel={eliminando ? 'Eliminando…' : 'Sí, eliminar'}
        danger
        onConfirm={confirmarEliminar}
        onCancel={() => setConfirmEliminar(null)}
      />
    </div>
  );
}
