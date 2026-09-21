import { useState } from 'react';
import {
  MEAL_ORDER, MEAL_LABELS, DET_DATES, DET_DAY_LABELS, DAY_LETTERS,
  registroDelDia, statusForDay, avatarColor,
  TODAY, MONTH_NAMES, fechaKey, daysInMonth, firstWeekdayMonday,
} from '../data/patients.js';

const TABS = [
  { key: 'plan', label: 'Plan asignado' },
  { key: 'registro', label: 'Registro del día' },
  { key: 'calendario', label: 'Calendario' },
  { key: 'clinica', label: 'Historia clínica' },
  { key: 'medidas', label: 'Mediciones' },
];

// Igual que registroDelDia, pero indexado por número de día en vez de por índice
// de semana — lo usamos en el calendario, donde se puede clickear cualquier día.
function registroPorDia(p, day) {
  if (day === TODAY.day) {
    const reg = {};
    MEAL_ORDER.forEach((k) => { reg[k] = p.log[k]; });
    return reg;
  }
  const h = p.history[day] || {};
  const reg = {};
  MEAL_ORDER.forEach((k) => { reg[k] = h[k] ? { txt: h[k], time: null } : null; });
  return reg;
}

function buildCalendarCells({ year, month, patient, selectedFecha, onSelect }) {
  const isCurrentMonth = year === TODAY.year && month === TODAY.month;
  const total = daysInMonth(year, month);
  const firstDay = firstWeekdayMonday(year, month);
  const turnos = patient.turnos || [];
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={'b' + i} className="cell blank" />);
  for (let d = 1; d <= total; d++) {
    const fecha = fechaKey(year, month, d);
    const isToday = isCurrentMonth && d === TODAY.day;
    const known = isCurrentMonth && d >= 23 && d <= 27;
    const cls = known ? statusForDay(patient, d) : 'm';
    const hasTurno = turnos.some((t) => t.fecha === fecha);
    cells.push(
      <div
        key={fecha}
        className={'cell' + (isToday ? ' today' : '') + (fecha === selectedFecha ? ' sel' : '') + (hasTurno ? ' turno' : '')}
        onClick={() => onSelect(fecha)}
      >
        <span>{d}</span>
        <span className={'dot ' + cls}></span>
      </div>
    );
  }
  return cells;
}

const MEDIDA_VACIA = { fecha: '', peso: '', cintura: '', notas: '' };
const TURNO_VACIO = { fecha: '', hora: '', motivo: '', avisar: true };
const HOY_KEY = fechaKey(TODAY.year, TODAY.month, TODAY.day);

export default function PatientDetail({ patientKey, patients, onUpdatePatient }) {
  const patient = patients[patientKey];
  const [tab, setTab] = useState('registro');
  const [dayIndex, setDayIndex] = useState(2); // miércoles 27
  const [calYear, setCalYear] = useState(TODAY.year);
  const [calMonth, setCalMonth] = useState(TODAY.month);
  const [calFecha, setCalFecha] = useState(HOY_KEY);
  const [clinica, setClinica] = useState(patient.historiaClinica);
  const [clinicaSaved, setClinicaSaved] = useState(false);
  const [plan, setPlan] = useState(patient.plan);
  const [planSaved, setPlanSaved] = useState(false);
  const [addingMedida, setAddingMedida] = useState(false);
  const [nuevaMedida, setNuevaMedida] = useState(MEDIDA_VACIA);
  const [addingTurno, setAddingTurno] = useState(false);
  const [nuevoTurno, setNuevoTurno] = useState(TURNO_VACIO);

  const reg = registroDelDia(patient, dayIndex);

  const calIsCurrentMonth = calYear === TODAY.year && calMonth === TODAY.month;
  const calSelectedDay = Number(calFecha.split('-')[2]);
  const calReg = calIsCurrentMonth ? registroPorDia(patient, calSelectedDay) : {};
  const calHasData = MEAL_ORDER.some((k) => calReg[k]);
  const turnoDelDia = (patient.turnos || []).find((t) => t.fecha === calFecha);
  const proximosTurnos = (patient.turnos || [])
    .filter((t) => t.fecha >= HOY_KEY)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

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

  function handleAgregarTurno(e) {
    e.preventDefault();
    if (!nuevoTurno.fecha || !nuevoTurno.hora) return;
    const nuevo = { fecha: nuevoTurno.fecha, hora: nuevoTurno.hora, motivo: nuevoTurno.motivo };
    onUpdatePatient(patientKey, (prev) => ({ turnos: [...(prev.turnos || []), nuevo] }));
    const [y, m] = nuevoTurno.fecha.split('-').map(Number);
    setCalYear(y);
    setCalMonth(m - 1);
    setCalFecha(nuevoTurno.fecha);
    setNuevoTurno(TURNO_VACIO);
    setAddingTurno(false);
  }

  function cancelarTurno(fecha, hora) {
    onUpdatePatient(patientKey, (prev) => ({
      turnos: (prev.turnos || []).filter((t) => !(t.fecha === fecha && t.hora === hora)),
    }));
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
        <>
          <div className="cal-layout">
            <div className="cal-left">
              <div className="monthbar">
                <span className="navbtn" onClick={prevMonth}>‹</span>
                <b>{MONTH_NAMES[calMonth]} {calYear}</b>
                <span className="navbtn" onClick={nextMonth}>›</span>
              </div>
              <div className="dow">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}
              </div>
              <div className="calgrid">
                {buildCalendarCells({ year: calYear, month: calMonth, patient, selectedFecha: calFecha, onSelect: setCalFecha })}
              </div>
              <div className="legend">
                <span><span className="dot g"></span>Completo</span>
                <span><span className="dot a"></span>Parcial</span>
                <span><span className="dot m"></span>Sin registrar</span>
                <span><span className="dot-ring"></span>Turno</span>
              </div>
              {addingTurno ? (
                <form className="turno-form" onSubmit={handleAgregarTurno}>
                  <div className="field">
                    <label>Fecha</label>
                    <input
                      type="date"
                      value={nuevoTurno.fecha}
                      onChange={(e) => setNuevoTurno((t) => ({ ...t, fecha: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Hora</label>
                    <input
                      type="time"
                      value={nuevoTurno.hora}
                      onChange={(e) => setNuevoTurno((t) => ({ ...t, hora: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Motivo</label>
                    <input
                      value={nuevoTurno.motivo}
                      onChange={(e) => setNuevoTurno((t) => ({ ...t, motivo: e.target.value }))}
                      placeholder="Control mensual, primera consulta..."
                    />
                  </div>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={nuevoTurno.avisar}
                      onChange={(e) => setNuevoTurno((t) => ({ ...t, avisar: e.target.checked }))}
                    />
                    Avisar al paciente por mail (demo)
                  </label>
                  <div className="row-actions">
                    <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '11px 18px' }}>
                      Guardar turno
                    </button>
                    <button type="button" className="btn-sm" onClick={() => { setAddingTurno(false); setNuevoTurno(TURNO_VACIO); }}>
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button className="pill-btn turno-btn" onClick={() => setAddingTurno(true)}>
                  <span className="ic">📅</span> Nuevo turno
                </button>
              )}
            </div>
            <div className="cal-right">
              <h4>
                {new Date(calFecha + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                {calFecha === HOY_KEY ? ' (hoy)' : ''}
              </h4>
              {turnoDelDia && (
                <div className="turno-chip">
                  <span className="ic">📅</span>
                  <div>
                    <b>Turno {turnoDelDia.hora}</b>
                    <span>{turnoDelDia.motivo || 'Sin motivo especificado'}</span>
                  </div>
                </div>
              )}
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

          <div className="turnos-section">
            <h4>Próximos turnos</h4>
            {proximosTurnos.length > 0 ? (
              <div className="turnos-row">
                {proximosTurnos.map((t) => {
                  const d = new Date(t.fecha + 'T00:00:00');
                  return (
                    <div key={t.fecha + t.hora} className="turno-card">
                      <div className="turno-date">
                        <b>{d.getDate()}</b>
                        <span>{MONTH_NAMES[d.getMonth()].slice(0, 3)}</span>
                      </div>
                      <div className="turno-info">
                        <b>{t.hora} — {t.motivo || 'Turno'}</b>
                        <span>
                          {t.fecha === HOY_KEY ? 'Hoy' : d.toLocaleDateString('es-AR', { weekday: 'long' })}
                        </span>
                      </div>
                      <button className="turno-cancel" title="Cancelar turno" onClick={() => cancelarTurno(t.fecha, t.hora)}>×</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="turno-empty">No hay turnos agendados todavía.</p>
            )}
          </div>
        </>
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
