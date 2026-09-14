import { useState } from 'react';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('nutri');

  function submit(e) {
    e.preventDefault();
    onLogin(role);
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="logo-wrap">
          <img src="/florencia-logo.png" alt="Florencia Meccico" />
        </div>
        <h1>Florencia Meccico</h1>
        <p className="sub">Asistente en nutrición</p>

        <div className="role-segs">
          <button type="button" className={'role-seg' + (role === 'nutri' ? ' active' : '')} onClick={() => setRole('nutri')}>
            Nutricionista
          </button>
          <button type="button" className={'role-seg' + (role === 'paciente' ? ' active' : '')} onClick={() => setRole('paciente')}>
            Paciente
          </button>
        </div>

        <div className="field">
          <label>Email</label>
          <input type="text" defaultValue="florencia@nutricion.com" />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" defaultValue="12345678" />
        </div>

        <button type="submit" className="btn-primary">Ingresar</button>
        <p className="login-note">
          Esto es una demo: cualquier contraseña funciona.<br />
          Elegí arriba con qué usuario querés entrar.
        </p>
      </form>
    </div>
  );
}
