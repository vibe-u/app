import ReportQueue from "./ReportQueue";
import DeletionRequestQueue from "./DeletionRequestQueue";
import "./Gsolicitudes.css";

export default function Gsolicitudes() {
  return (
    <main className="admin-requests-page">
      <header className="admin-requests-page-header">
        <h2>Solicitudes y reportes</h2>
        <p>Revisa las alertas de la comunidad y las solicitudes de cuenta.</p>
      </header>
      <ReportQueue />
      <DeletionRequestQueue />
    </main>
  );
}
