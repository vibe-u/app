import { useState } from "react";

export default function ReportContentButton({ onReport, className = "", label = "Reportar" }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (reason.trim().length < 10 || busy) return;
    try {
      setBusy(true);
      setError("");
      await onReport(reason.trim());
      setSuccess("Reporte enviado para revisión.");
      setReason("");
      setOpen(false);
    } catch (requestError) {
      setError(requestError?.response?.data?.msg || requestError?.response?.data?.message || "No se pudo enviar el reporte.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`report-control ${className}`}>
      <button type="button" className="report-trigger" onClick={() => { setOpen((value) => !value); setError(""); }}>
        {label}
      </button>
      {success ? <p className="report-success" role="status">{success}</p> : null}
      {error ? <p className="report-error" role="alert">{error}</p> : null}
      {open ? (
        <form className="report-form" onSubmit={submit}>
          <label>
            Motivo del reporte
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={10}
              maxLength={1000}
              rows={3}
              required
              placeholder="Describe qué debería revisar el equipo (mínimo 10 caracteres)."
            />
          </label>
          <div className="report-form-actions">
            <button type="button" onClick={() => setOpen(false)} disabled={busy}>Cancelar</button>
            <button type="submit" disabled={busy || reason.trim().length < 10}>
              {busy ? "Enviando..." : "Enviar reporte"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
