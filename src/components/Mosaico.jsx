import { useMemo, useState } from 'react';
import { statusOf, avatarColor, ESTADO_LABEL } from '../data/patients.js';

export default function Mosaico({ patients, onOpenPatient, onOpenAccesos }) {
  const [query, setQuery] = useState('');
  const entries = useMemo(() => Object.entries(patients), [patients]);
  const filtered = entries.filter(([, p]) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="page">
      <div className="mosaico-head">
        <div>
          <h1>Hola, <span style={{ color: 'var(--pink)' }}>Florencia</span></h1>
          <p className="sub">{entries.length} pacientes activos hoy</p>
        </div>
        <button className="pill-btn" onClick={onOpenAccesos}>
          <span className="ic">👥</span> Gestionar accesos
        </button>
      </div>

      <div className="searchbar">
        <span>🔍</span>
        <input
          placeholder="Buscar paciente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="plist">
        {filtered.map(([key, p]) => {
          const st = statusOf(p);
          return (
            <button key={key} className="pcard" onClick={() => onOpenPatient(key)}>
              <div className="avatar" style={{ background: avatarColor(p.genero) }}>{p.initials}</div>
              <div>
                <div className="name">{p.name}</div>
                <div className="status">
                  {p.acceso === 'activo' ? (
                    <>
                      <span className={'dot ' + st.cls}></span>{st.label}
                    </>
                  ) : (
                    <span className={'estado-badge ' + p.acceso}>{ESTADO_LABEL[p.acceso]}</span>
                  )}
                </div>
              </div>
              <span className="chev">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
