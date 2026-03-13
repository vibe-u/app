import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaHome,
  FaPlusCircle,
  FaComments,
  FaCalendarAlt,
  FaUsers,
  FaHeart,
  FaUser,
  FaCog,
  FaBell,
  FaIdBadge,
  FaUserShield,
  FaChartBar,
} from "react-icons/fa";
import { isMobileAccess } from "../utils/mobileAccess";

const Sidebar = () => {
  const navClass = ({ isActive }) => `menu_btn__dash ${isActive ? "menu_btn_active__dash" : ""}`;
  const rol = localStorage.getItem("rol");
  const isAdmin = rol === "administrador";
  const [isMobileUser, setIsMobileUser] = useState(isMobileAccess());

  useEffect(() => {
    const onResize = () => setIsMobileUser(isMobileAccess());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <aside className="sidebar__dash">
      <h1>Vibe-U</h1>
      <p>La app que pone a la U en modo social</p>

      <nav className="menu__dash">
        <span className="menu_label__dash">Dashboard</span>
        <NavLink className={navClass} to="/dashboard/feed"><FaHome /> Feed</NavLink>
        <NavLink className={navClass} to="/dashboard/publicar"><FaPlusCircle /> Publicar</NavLink>
        <NavLink className={navClass} to="/dashboard/chat"><FaComments /> Chat</NavLink>
        <NavLink className={navClass} to="/dashboard/eventos"><FaCalendarAlt /> Eventos U</NavLink>
        <NavLink className={navClass} to="/dashboard/perfil"><FaUser /> Perfil</NavLink>
        <NavLink className={navClass} to="/dashboard/micuenta"><FaIdBadge /> Mi cuenta</NavLink>
        <NavLink className={navClass} to="/dashboard/notificaciones"><FaBell /> Notificaciones</NavLink>
        <NavLink className={navClass} to="/dashboard/ajustes"><FaCog /> Ajustes</NavLink>

      </nav>

      <div className="quick_links__dash">
        {isMobileUser && (
          <>
            <span className="menu_label__dash">Comunidad</span>
            <NavLink className={navClass} to="/grupos"><FaUsers /> Grupos</NavLink>
            <NavLink className={navClass} to="/matches"><FaHeart /> Match</NavLink>
          </>
        )}

        {isAdmin && (
          <>
            <span className="menu_label__dash">Administracion</span>
            <NavLink className={navClass} to="/gusuarios"><FaUserShield /> Gestion usuarios</NavLink>
            <NavLink className={navClass} to="/gautomatizacion"><FaChartBar /> Automatizacion</NavLink>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
