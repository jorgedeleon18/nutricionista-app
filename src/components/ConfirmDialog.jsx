// Modal de confirmación genérico — se usa antes de acciones importantes
// (dar de baja/reactivar, invitar paciente, agendar o cancelar un turno)
// para evitar que se disparen por error.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="modal-actions">
          <button className="btn-sm" onClick={onCancel}>{cancelLabel}</button>
          <button className={'btn-primary' + (danger ? ' danger' : '')} onClick={onConfirm} style={{ width: 'auto', padding: '11px 20px' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
