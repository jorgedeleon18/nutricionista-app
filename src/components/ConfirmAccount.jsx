import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// Se muestra cuando alguien entra desde el link del mail de invitación.
// Acá el paciente elige SU PROPIA contraseña (no un link mágico) — así quedó
// definido desde el arranque del proyecto.
export default function ConfirmAccount({ onConfirmed }) {
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError('La contraseña tiene que tener al menos 6 caracteres.');
      return;
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updErr) {
      setError('No se pudo guardar la contraseña. Probá de nuevo.');
      return;
    }
    onConfirmed();
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="logo-wrap">
          <img src="/florencia-logo.png" alt="Florencia Meccico" />
        </div>
        <h1>¡Bienvenido/a!</h1>
        <p className="sub">Elegí tu contraseña para terminar de crear tu cuenta</p>

        <div className="field">
          <label>Nueva contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="field">
          <label>Repetir contraseña</label>
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando…' : 'Confirmar cuenta'}
        </button>
      </form>
    </div>
  );
}
