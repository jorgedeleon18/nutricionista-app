import { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(
        err?.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Probá de nuevo en un momento.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="logo-wrap">
          <img src="/florencia-logo.png" alt="Florencia Meccico" />
        </div>
        <h1>Florencia Meccico</h1>
        <p className="sub">Asistente en nutrición</p>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
