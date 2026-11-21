import { useEffect, useRef } from "react";
import "./ConfirmActionModal.css";

export default function ConfirmActionModal({
  title,
  description,
  icon = "⚠️",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  busy = false,
  onCancel,
  onConfirm,
  children,
}) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    cancelButtonRef.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <div className="confirm-action-overlay" onKeyDown={(event) => {
      if (event.key === "Escape" && !busy) onCancel();
    }}>
      <div
        className="confirm-action-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        aria-describedby="confirm-action-description"
      >
        <div className="confirm-action-icon" aria-hidden="true">{icon}</div>
        <h3 className="confirm-action-title" id="confirm-action-title">{title}</h3>
        <div className="confirm-action-description" id="confirm-action-description">{description}</div>
        {children}
        <div className="confirm-action-buttons">
          <button
            ref={cancelButtonRef}
            type="button"
            className="confirm-action-cancel"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-action-confirm ${destructive ? "is-destructive" : ""}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
