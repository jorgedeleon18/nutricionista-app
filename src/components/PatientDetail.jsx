import { useState } from 'react';
import {
  PATIENTS, MEAL_ORDER, MEAL_LABELS, DET_DATES, DET_DAY_LABELS, DAY_LETTERS,
  registroDelDia, statusForDay,
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

export default function PatientDetail({ patientKey }) {
  const patient = PATIENTS[patientKey];
  const [tab, setTab] = useState('registro');
  const [dayIndex, setDayIndex] = useState(2); // miércoles 27
  const [calDay, setCalDay] = useState(27);
  const [clinica, setClinica] = useState(patient.historiaClinica);

  const reg = registroDelDia(patient, dayIndex);
  const calReg = registroDelDia(patient, DET_DATES.indexOf(calDay) >= 0 ? DET_DATES.indexOf(calDay) : 2);
  const calHasData = MEAL_ORDER.some((k) => calReg[k]);

  return (
    <div className="page">
      <div className="detalle-head">
        <div className="avatar" style={{ background: patient.color, width: 44, height: 44 }}>{patient.initials}</div>
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
        <div className="meal-grid">
          {MEAL_ORDER.map((k) => (
            <div key={k} className="meal">
              <div className="meal-top"><span className="meal-name">{MEAL_LABELS[k]}</span></div>
              <div className="meal-txt">{patient.plan[k]}</div>
            </div>
          ))}
        </div>
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
          <textarea value={clinica} onChange={(e) => setClinica(e.target.value)} />
        </div>
      )}

      {tab === 'medidas' && (
        <div className="medidas-box">
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
          <div className="medidas-foot">
            <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>+ Cargar medición de hoy</button>
          </div>
        </div>
      )}
    </div>
  );
}
