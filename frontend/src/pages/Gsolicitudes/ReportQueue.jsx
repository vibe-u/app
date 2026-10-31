import { useEffect, useState } from "react";
import { getPendingContentReports, reviewContentReport } from "../../Services/admin";

export default function ReportQueue() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    try {
      setError("");
      const { data } = await getPendingContentReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError?.response?.data?.msg || "No se pudieron cargar los reportes.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (report, status) => {
    try {
      setBusyId(report._id);
      setError("");
      await reviewContentReport(report._id, status);
      setReports((current) => current.filter((item) => item._id !== report._id));
    } catch (reviewError) {
      setError(reviewError?.response?.data?.msg || "No se pudo actualizar el reporte.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="admin-request-section">
      <header>
        <div>
          <h3>Reportes de publicaciones</h3>
          <p>Notificaciones de contenido que los usuarios han solicitado revisar.</p>
        </div>
        <button type="button" onClick={load}>Actualizar</button>
      </header>
      {error ? <p className="admin-request-error" role="alert">{error}</p> : null}
      {!reports.length ? <p>No hay reportes pendientes.</p> : null}
      <div className="admin-request-list">
        {reports.map((report) => (
          <article className="admin-request-card" key={report._id}>
            <div className="admin-request-meta">
              <strong>{report.targetName || "Publicación"}</strong>
              <span>Reportado por {report.reporter?.nombre || report.reporterName || "Usuario"}</span>
              <span>{new Date(report.createdAt).toLocaleString()}</span>
            </div>
            {report.targetContent ? <blockquote className="admin-reported-content">{report.targetContent}</blockquote> : null}
            <p><strong>Motivo:</strong> {report.reason}</p>
            <p><strong>Tipo:</strong> {report.targetType === "publicacion_grupo" ? "Publicación de comunidad" : "Publicación del feed"}</p>
            <div className="admin-request-actions">
              <button type="button" disabled={busyId === report._id} onClick={() => review(report, "revisado")}>
                Marcar como revisado
              </button>
              <button type="button" className="admin-request-secondary" disabled={busyId === report._id} onClick={() => review(report, "descartado")}>
                Descartar reporte
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
