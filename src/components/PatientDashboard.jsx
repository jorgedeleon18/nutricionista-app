import { useState } from 'react';
import {
  MEAL_ORDER, MEAL_LABELS, registroDelDia, statusForDay,
} from '../data/patients.js';

const ICONS = { desayuno: '☀️', colacion: '🍎', almuerzo: '🍽️', merienda: '🍪', cena: '🌙' };

export default function PatientDashboard({ view, onChangeView, patient }) {
  const primerNombre = patient.name.split(' ')[0];
  const [calDay, setCalDay] = useState(27);
  const [drafts, setDrafts] = useState({});
  const [saved, setSaved] = useState({ ...patient.log });

  const filledCount = MEAL_ORDER.filter((k) => saved[k]).length;

  function saveMeal(k) {
    const txt = drafts[k];
    if (!txt) return;
    setSaved((s) => ({ ...s, [k]: { txt, time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) } }));
  }

  const calReg = registroDelDia(patient, 2);

  return (
    <div className="page">
      <div className="detalle-head" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Hola, <span style={{ color: 'var(--pink)' }}>{primerNombre}</span></h1>
          <p className="sub" style={{ margin: '4px 0 0' }}>Miércoles 27 de agosto</p>
        </div>
      </div>

      <div className="patient-nav">
        <button className={view === 'hoy' ? 'active' : ''} onClick={() => onChangeView('hoy')}>Hoy</button>
        <button className={view === 'calendario' ? 'active' : ''} onClick={() => onChangeView('calendario')}>Calendario</button>
        <button className={view === 'medidas' ? 'active' : ''} onClick={() => onChangeView('medidas')}>Mediciones</button>
      </div>

      {view === 'hoy' && (
        <>
          <div className="progress">
            {MEAL_ORDER.map((k) => <div key={k} className={'bar' + (saved[k] ? ' on' : '')} />)}
          </div>
          <p className="progress-label">{filledCount} de {MEAL_ORDER.length} comidas registradas hoy</p>

          <div className="hoy-grid">
            {MEAL_ORDER.map((k) => {
              const entry = saved[k];
              return (
                <div key={k} className="mealp">
                  <div className="mealp-top">
                    <div className="meal-name2"><span className="ic">{ICONS[k]}</span>{MEAL_LABELS[k]}</div>
                  </div>
                  <textarea
                    className="box"
                    rows={2}
                    placeholder="¿Qué comiste?"
                    defaultValue={entry ? entry.txt : ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [k]: e.target.value }))}
                  />
                  {entry ? (
                    <div className="saved">✓ Guardado {entry.time ? 'a las ' + entry.time : ''}</div>
                  ) : (
                    <button className="btn-save" onClick={() => saveMeal(k)}>Guardar</button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === 'calendario' && (
        <div className="cal-layout">
          <div className="cal-left">
            <div className="monthbar"><span className="navbtn">‹</span><b>Agosto 2026</b><span className="navbtn">›</span></div>
            <div className="dow">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}</div>
            <div className="calgrid">
              {[23, 24, 25, 26, 27].map((d) => (
                <div key={d} className={'cell' + (d === 27 ? ' today' : '') + (d === calDay ? ' sel' : '')} onClick={() => setCalDay(d)}>
                  <span>{d}</span><span className={'dot ' + statusForDay(patient, d)}></span>
                </div>
              ))}
            </div>
            <div className="legend">
              <span><span className="dot g"></span>Completo</span>
              <span><span className="dot a"></span>Parcial</span>
              <span><span className="dot m"></span>Sin registrar</span>
            </div>
          </div>
          <div className="cal-right">
            <h4>{calDay} de agosto{calDay === 27 ? ' (hoy)' : ''}</h4>
            {MEAL_ORDER.filter((k) => calReg[k]).map((k) => (
              <div key={k} className="row2"><span className="tag">{MEAL_LABELS[k]}</span><span className="txt">{calReg[k].txt}</span></div>
            ))}
          </div>
        </div>
      )}

      {view === 'medidas' && (
        <div className="medidas-box">
          {patient.medidas.length > 0 ? (
            <table className="medidas-table">
              <thead><tr><th>Fecha</th><th>Peso (kg)</th><th>Cintura (cm)</th><th>Notas</th></tr></thead>
              <tbody>
                {patient.medidas.map((m) => (
                  <tr key={m.fecha}>
                    <td>{new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                    <td>{m.peso.toFixed(1)}</td>
                    <td>{m.cintura}</td>
                    <td>{m.notas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-day">Todavía no tenés mediciones cargadas.</p>
          )}
        </div>
      )}
    </div>
  );
}
