import { useEffect, useState } from "react";
import { downloadAdminAuditLog, getAdminAuditLog } from "../../Services/admin";
import "./Bitacora.css";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : date.toLocaleString();
};

export default function Bitacora() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const cargarBitacora = async () => {
    try {
      setError("");
      setLoading(true);
      const response = await getAdminAuditLog();
      setRegistros(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err?.response?.data?.msg || "No se pudo cargar la bitácora.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBitacora();
  }, []);

  const descargarBitacora = async () => {
    try {
      setError("");
      setDownloading(true);
      const response = await downloadAdminAuditLog();
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bitacora-administrativa.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.msg || "No se pudo descargar la bitácora.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="audit-section">
      <header className="audit-header">
        <div>
          <h2>Bitácora administrativa</h2>
          <p>Registro de las acciones realizadas por los administradores.</p>
        </div>
        <button type="button" onClick={descargarBitacora} disabled={downloading}>
          {downloading ? "Preparando descarga..." : "Descargar bitácora"}
        </button>
      </header>

      {error ? <p className="audit-error" role="alert">{error}</p> : null}
      {loading ? <p className="audit-message">Cargando registros...</p> : null}
      {!loading && !registros.length ? <p className="audit-message">Todavía no hay acciones registradas.</p> : null}
      {!loading && registros.length ? (
        <>
          <p className="audit-count">
            Se muestran hasta los 500 registros más recientes; la descarga incluye todos.
          </p>
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Administrador</th>
                  <th>Rol</th>
                  <th>Acción</th>
                  <th>Usuario o publicación</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr key={registro._id}>
                    <td data-label="Fecha">{formatDate(registro.createdAt)}</td>
                    <td data-label="Administrador">
                      {registro.actorName}
                      <small>{registro.actorEmail}</small>
                    </td>
                    <td data-label="Rol">{registro.actorRole}</td>
                    <td data-label="Acción">{registro.action}</td>
                    <td data-label="Usuario o publicación">
                      {registro.targetName || registro.targetType}
                      {registro.targetId ? <small>ID: {registro.targetId}</small> : null}
                    </td>
                    <td data-label="Detalles">{registro.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
