import { useEffect, useState } from "react";
import { getPendingDeletionRequests, reviewDeletionRequest } from "../../Services/admin";

export default function DeletionRequestQueue() {
  const [requests, setRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    try {
      setError("");
      const { data } = await getPendingDeletionRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError?.response?.data?.msg || "No se pudieron cargar las solicitudes de eliminación.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (request, status) => {
    if (status === "aprobada" && !window.confirm(`¿Eliminar permanentemente la cuenta de ${request.userName}?`)) return;
    try {
      setBusyId(request._id);
      setError("");
      await reviewDeletionRequest(request._id, status, notes[request._id] || "");
      setRequests((current) => current.filter((item) => item._id !== request._id));
    } catch (reviewError) {
      setError(reviewError?.response?.data?.msg || "No se pudo revisar la solicitud.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="admin-request-section">
      <header>
        <div>
          <h3>Solicitudes de eliminación de cuenta</h3>
          <p>Revisa el motivo antes de aprobar la eliminación permanente.</p>
        </div>
        <button type="button" onClick={load}>Actualizar</button>
      </header>
      {error ? <p className="admin-request-error" role="alert">{error}</p> : null}
      {!requests.length ? <p>No hay solicitudes pendientes.</p> : null}
      <div className="admin-request-list">
        {requests.map((request) => (
          <article className="admin-request-card" key={request._id}>
            <div className="admin-request-meta">
              <strong>{request.userName}</strong>
              <span>{request.userEmail}</span>
              <span>{new Date(request.createdAt).toLocaleString()}</span>
            </div>
            <p><strong>Motivo:</strong> {request.reason}</p>
            <label className="admin-request-note">
              Nota de revisión (opcional)
              <textarea
                value={notes[request._id] || ""}
                onChange={(event) => setNotes((current) => ({ ...current, [request._id]: event.target.value }))}
                maxLength={1000}
                rows={2}
              />
            </label>
            <div className="admin-request-actions">
              <button type="button" className="admin-request-danger" disabled={busyId === request._id} onClick={() => review(request, "aprobada")}>
                Aprobar y eliminar cuenta
              </button>
              <button type="button" className="admin-request-secondary" disabled={busyId === request._id} onClick={() => review(request, "rechazada")}>
                Rechazar solicitud
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
