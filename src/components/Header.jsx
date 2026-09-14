export default function Header({ subtitle, onLogout }) {
  return (
    <header className="app-header">
      <div className="brand">
        <img src="/florencia-logo.png" alt="" />
        <div>
          <b>Florencia Meccico</b>
          <span>{subtitle}</span>
        </div>
      </div>
      {onLogout && (
        <button className="btn-ghost" onClick={onLogout}>Cerrar sesión</button>
      )}
    </header>
  );
}
