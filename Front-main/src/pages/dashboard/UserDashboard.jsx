import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import "./Dashboard.css";

const titleMap = {
  "/dashboard/feed": "Feed",
  "/dashboard/publicar": "Publicar",
  "/dashboard/chat": "Chat",
  "/dashboard/eventos": "Eventos U",
  "/dashboard/perfil": "Perfil",
  "/dashboard/notificaciones": "Notificaciones",
  "/dashboard/ajustes": "Ajustes",
};

const subtitleMap = {
  "/dashboard/feed": "Publicaciones recientes de la comunidad",
  "/dashboard/publicar": "Comparte algo con tu universidad",
  "/dashboard/chat": "Tus conversaciones activas",
  "/dashboard/eventos": "Eventos y actividades del campus",
  "/dashboard/perfil": "Informacion visible de tu cuenta",
  "/dashboard/notificaciones": "Actividad y avisos",
  "/dashboard/ajustes": "Configuracion rapida",
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const title = titleMap[currentPath] || "Dashboard";
  const subtitle = subtitleMap[currentPath] || "Panel principal";

  return (
    <div className="shell__dash">
      <Sidebar />

      <main className="content__dash">
        <header className="topbar__dash">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div className="actions__dash">
            <input placeholder="Buscar personas, grupos o eventos..." />
            <button onClick={() => navigate("/dashboard/publicar")}>Nueva publicacion</button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default UserDashboard;
