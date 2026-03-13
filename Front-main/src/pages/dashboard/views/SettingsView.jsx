import { useNavigate } from "react-router-dom";
import storeAuth from "../../../context/storeAuth";

const SettingsView = () => {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.clear();
    storeAuth.getState().clearToken();
    navigate("/login");
  };

  return (
    <section className="panel__dash">
      <h3>Ajustes</h3>
      <div className="settings_grid__dash">
        <button onClick={() => navigate("/perfil")}>Perfil completo</button>
        <button onClick={() => navigate("/ajustes")}>Abrir ajustes completos</button>
        <button onClick={() => navigate("/actualizar-info")}>Actualizar informacion</button>
        <button onClick={() => navigate("/actualizar-pass")}>Cambiar password</button>
        <button onClick={cerrarSesion}>Cerrar sesion</button>
      </div>
    </section>
  );
};

export default SettingsView;

