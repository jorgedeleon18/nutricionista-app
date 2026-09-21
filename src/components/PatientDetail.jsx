import { useState } from 'react';
import {
  MEAL_ORDER, MEAL_LABELS, DET_DATES, DET_DAY_LABELS, DAY_LETTERS,
  registroDelDia, statusForDay, avatarColor,
} from '../data/patients.js';

const TABS = [
  { key: 'plan', label: 'Plan asignado' },
  { key: 'registro', label: 'Registro del día' },
  { key: 'calendario', label: 'Calendario' },
  { key: 'clinica', label: 'Historia clínica' },
  { key: 'medidas', label: 'Mediciones' },
];

const MONTH_DAYS = 31; // agosto 2026, para la maqueta
const FIRST_WEEKDAY = 5; // 1 de agosto 2026 cae sábado -> índice 5 (L=0..D=6)

function buildCalendarCells(patient, selectedDay, onSelect) {
  const cells = [];
  for (let i = 0; i < FIRST_WEEKDAY; i++) cells.push(<div key={'b' + i} className="cell blank" />);
  for (let d = 1; d <= MONTH_DAYS; d++) {
    const known = d >= 23 && d <= 27;
    const cls = known ? statusForDay(patient, d) : 'm';
    cells.push(
      <div
        key={d}
        className={'cell' + (d === 27 ? ' today' : '') + (d === selectedDay ? ' sel' : '')}
        onClick={() => onSelect(d)}
      >
        <span>{d}</span>
        <span className={'dot ' + cls}></span>
      </div>
    );
  }
  return cells;
}

const MEDIDA_VACIA = { fecha: '', peso: '', cintura: '', notas: '' };

export default function PatientDetail({ patientKey, patients, onUpdatePatient }) {
  const patient = patients[patientKey];
  const [tab, setTab] = useState('registro');
  const [dayIndex, setDayIndex] = useState(2); // miércoles 27
  const [calDay, setCalDay] = useState(27);
  const [clinica, setClinica] = useState(patient.historiaClinica);
  const [clinicaSaved, setClinicaSaved] = useState(false);
  const [plan, setPlan] = useState(patient.plan);
  const [planSaved, setPlanSaved] = useState(false);
  const [addingMedida, setAddingMedida] = useState(false);
  const [nuevaMedida, setNuevaMedida] = useState(MEDIDA_VACIA);

  const reg = registroDelDia(patient, dayIndex);
  const calReg = registroDelDia(patient, DET_DATES.indexOf(calDay) >= 0 ? DET_DATES.indexOf(calDay) : 2);
  const calHasData = MEAL_ORDER.some((k) => calReg[k]);

  function handleGuardarPlan() {
    onUpdatePatient(patientKey, { plan });
    setPlanSaved(true);
  }

  function handleGuardarClinica() {
    onUpdatePatient(patientKey, { historiaClinica: clinica });
    setClinicaSaved(true);
  }

  function handleAgregarMedida(e) {
    e.preventDefault();
    if (!nuevaMedida.fecha || !nuevaMedida.peso || !nuevaMedida.cintura) return;
    const nueva = {
      fecha: nuevaMedida.fecha,
      peso: parseFloat(nuevaMedida.peso),
      cintura: parseFloat(nuevaMedida.cintura),
      notas: nuevaMedida.notas,
    };
    onUpdatePatient(patientKey, (prev) => ({ medidas: [...prev.medidas, nueva] }));
    setNuevaMedida(MEDIDA_VACIA);
    setAddingMedida(false);
  }

  return (
    <div className="page">
      <div className="detalle-head">
        <div className="avatar" style={{ background: avatarColor(patient.genero), width: 44, height: 44 }}>{patient.initials}</div>
        <div className="who">
          <b>{patient.name}</b>
          <span>Plan nutricional activo</span>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={'tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <>
          <p className="edit-hint">Podés editar el plan de cada comida — el paciente ve estos cambios en su vista.</p>
          <div className="meal-grid">
            {MEAL_ORDER.map((k) => (
              <div key={k} className="meal">
                <div className="meal-top"><span className="meal-name">{MEAL_LABELS[k]}</span></div>
                <textarea
                  className="meal-edit"
                  rows={3}
                  placeholder="Todavía no cargaste esta comida"
                  value={plan[k]}
                  onChange={(e) => {
                    setPlan((p) => ({ ...p, [k]: e.target.value }));
                    setPlanSaved(false);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="save-row">
            <button className="btn-primary" style={{ width: 'auto', padding: '12px 22px' }} onClick={handleGuardarPlan}>
              Guardar cambios
            </button>
            {planSaved && <span className="saved-msg">✓ Cambios guardados</span>}
          </div>
        </>
      )}

      {tab === 'registro' && (
        <>
          <div className="days">
            {DAY_LETTERS.map((letter, i) => (
              <button key={i} className={'day' + (i === dayIndex ? ' active' : '')} onClick={() => setDayIndex(i)}>
                {letter}
              </button>
            ))}
          </div>
          <div className="meal-grid">
            <p className="day-label">{DET_DAY_LABELS[DET_DATES[dayIndex]]}</p>
            {MEAL_ORDER.map((k) => {
              const entry = reg[k];
              return (
                <div key={k} className={'meal' + (entry ? '' : ' empty')}>
                  <div className="meal-top">
                    <span className="meal-name">{MEAL_LABELS[k]}</span>
                    <span className="meal-time">{entry && entry.time ? entry.time : '—'}</span>
                  </div>
                  <div className="meal-txt">{entry ? entry.txt : 'Sin registro este día'}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'calendario' && (
        <div className="cal-layout">
          <div className="cal-left">
            <div className="monthbar">
              <span className="navbtn">‹</span>
              <b>Agosto 2026</b>
              <span className="navbtn">›</span>
            </div>
            <div className="dow">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="calgrid">{buildCalendarCells(patient, calDay, setCalDay)}</div>
            <div className="legend">
              <span><span className="dot g"></span>Completo</span>
              <span><span className="dot a"></span>Parcial</span>
              <span><span className="dot m"></span>Sin registrar</span>
            </div>
          </div>
          <div className="cal-right">
            <h4>{calDay} de agosto{calDay === 27 ? ' (hoy)' : ''}</h4>
            {calHasData ? (
              MEAL_ORDER.filter((k) => calReg[k]).map((k) => (
                <div key={k} className="row2">
                  <span className="tag">{MEAL_LABELS[k]}</span>
                  <span className="txt">{calReg[k].txt}</span>
                </div>
              ))
            ) : (
              <p className="empty-day">Sin registros este día.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'clinica' && (
        <div className="clinica-box">
          <span className="badge">Solo vos la ves — el paciente no accede a esta solapa</span>
          <textarea
            value={clinica}
            onChange={(e) => {
              setClinica(e.target.value);
              setClinicaSaved(false);
            }}
          />
          <div className="save-row">
            <button className="btn-primary" style={{ width: 'auto', padding: '12px 22px' }} onClick={handleGuardarClinica}>
              Guardar cambios
            </button>
            {clinicaSaved && <span className="saved-msg">✓ Cambios guardados</span>}
          </div>
        </div>
      )}

      {tab === 'medidas' && (
        <div className="medidas-box">
          {patient.medidas.length > 0 ? (
            <table className="medidas-table">
              <thead>
                <tr><th>Fecha</th><th>Peso (kg)</th><th>Cintura (cm)</th><th>Notas de la consulta</th></tr>
              </thead>
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
            <p className="empty-day">Todavía no hay mediciones cargadas.</p>
          )}

          <div className="medidas-foot">
            {addingMedida ? (
              <form className="medida-form" onSubmit={handleAgregarMedida}>
                <div className="field">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={nuevaMedida.fecha}
                    onChange={(e) => setNuevaMedida((m) => ({ ...m, fecha: e.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label>Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nuevaMedida.peso}
                    onChange={(e) => setNuevaMedida((m) => ({ ...m, peso: e.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label>Cintura (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={nuevaMedida.cintura}
                    onChange={(e) => setNuevaMedida((m) => ({ ...m, cintura: e.target.value }))}
                    required
                  />
                </div>
                <div className="field" style={{ flex: '2 1 220px' }}>
                  <label>Notas</label>
                  <input
                    value={nuevaMedida.notas}
                    onChange={(e) => setNuevaMedida((m) => ({ ...m, notas: e.target.value }))}
                    placeholder="Notas de la consulta"
                  />
                </div>
                <div className="row-actions">
                  <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '13px 18px' }}>
                    Guardar
                  </button>
                  <button type="button" className="btn-sm" onClick={() => { setAddingMedida(false); setNuevaMedida(MEDIDA_VACIA); }}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setAddingMedida(true)}>
                + Cargar medición
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
