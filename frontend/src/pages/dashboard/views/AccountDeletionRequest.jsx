import { useEffect, useState } from "react";
import {
  getAccountDeletionRequest,
  submitAccountDeletionRequest,
} from "../../../Services/users";
import "./AccountDeletionRequest.css";

const rejectionDismissalKey = (request) => {
  const requestId = request?._id || request?.id || request?.createdAt || "latest";
  return `vibeu.accountDeletion.rejectionDismissed.${requestId}`;
};

export default function AccountDeletionRequest() {
  const [request, setRequest] = useState(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rejectionDismissed, setRejectionDismissed] = useState(false);

  const loadRequest = async () => {
    try {
      setError("");
      const response = await getAccountDeletionRequest();
      const nextRequest = response.data || null;
      setRequest(nextRequest);
      if (nextRequest?.status === "rechazada") {
        try {
          setRejectionDismissed(
            window.localStorage.getItem(rejectionDismissalKey(nextRequest)) === "true",
          );
        } catch {
          setRejectionDismissed(false);
        }
      } else {
        setRejectionDismissed(false);
      }
    } catch (loadError) {
      setError(loadError?.response?.data?.msg || "No se pudo consultar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const dismissRejection = () => {
    try {
      if (request) {
        window.localStorage.setItem(rejectionDismissalKey(request), "true");
      }
    } catch {
      // Keep the notice dismissed for this session even when storage is unavailable.
    }
    setRejectionDismissed(true);
  };

  useEffect(() => {
    loadRequest();
  }, []);

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!confirmed || reason.trim().length < 10 || sending) return;
    try {
      setSending(true);
      setError("");
      const response = await submitAccountDeletionRequest(reason.trim());
      setNotice(response.data?.msg || "Solicitud enviada para revisión.");
      setReason("");
      setConfirmed(false);
      await loadRequest();
    } catch (submitError) {
      setError(submitError?.response?.data?.msg || "No se pudo enviar la solicitud.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="account-deletion-card">
      <h4>Solicitud de eliminación de cuenta</h4>
      <p>Un administrador revisará la solicitud y el motivo antes de eliminar la cuenta.</p>
      {loading ? <p>Consultando estado...</p> : null}
      {error ? <p className="account-deletion-error" role="alert">{error}</p> : null}
      {notice ? <p className="account-deletion-notice" role="status">{notice}</p> : null}
      {request?.status === "pendiente" ? (
        <div className="account-deletion-status">
          <strong>Solicitud pendiente de revisión</strong>
          <span>Enviada el {new Date(request.createdAt).toLocaleString()}</span>
          <p>Motivo: {request.reason}</p>
        </div>
      ) : null}
      {request?.status === "rechazada" && !rejectionDismissed ? (
        <div className="account-deletion-status account-deletion-rejected" role="status">
          <div className="account-deletion-rejected-heading">
            <strong>La solicitud anterior fue rechazada</strong>
            <button
              type="button"
              className="account-deletion-dismiss"
              aria-label="Cerrar aviso de solicitud rechazada"
              onClick={dismissRejection}
            >
              ×
            </button>
          </div>
          {request.reviewNote ? <p>Respuesta: {request.reviewNote}</p> : null}
          <p>Puedes enviar una nueva solicitud con más información.</p>
        </div>
      ) : null}
      {!loading && request?.status !== "pendiente" ? (
        <form onSubmit={submitRequest}>
          <label className="account-deletion-confirm" htmlFor="account-deletion-confirmed">
              <span>Confirmo que deseo solicitar la eliminación de mi cuenta.</span>
              <input
                id="account-deletion-confirmed"
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
          </label>
          <label htmlFor="account-deletion-reason">Motivo (obligatorio, mínimo 10 caracteres)</label>
          <textarea
            id="account-deletion-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={10}
            maxLength={1000}
            rows={4}
            required
            disabled={!confirmed}
            placeholder="Explica por qué solicitas eliminar tu cuenta."
          />
          <button type="submit" disabled={!confirmed || sending || reason.trim().length < 10}>
            {sending ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
