export default function Header({ subtitle, onLogout, onBack }) {
  return (
    <header className="app-header">
      <div className="brand">
        <img src="/florencia-logo.png" alt="" />
        <div>
          <b>Florencia Meccico</b>
          <span>{subtitle}</span>
        </div>
      </div>
      <div className="header-actions">
        {onBack && (
          <button className="pill-btn" onClick={onBack}>
            <span className="ic">🏠</span> Inicio
          </button>
        )}
        {onLogout && (
          <button className="btn-ghost" onClick={onLogout}>Cerrar sesión</button>
        )}
      </div>
    </header>
  );
}
