import { useNavigate } from "react-router-dom";
import { useState } from "react";
import storeAuth from "../../../context/storeAuth";
import { applyTheme, DARK_THEME, getCurrentTheme, LIGHT_THEME } from "../../../utils/theme";

const SettingsView = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getCurrentTheme());

  const toggleTheme = () => {
    const nextTheme = theme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    const applied = applyTheme(nextTheme);
    setTheme(applied);
  };

  const cerrarSesion = () => {
    localStorage.clear();
    storeAuth.getState().clearToken();
    navigate("/login");
  };

  return (
    <section className="panel__dash">
      <h3>Ajustes</h3>
      <div className="settings_grid__dash">
        <button className="button__dash1" onClick={toggleTheme}>
          Modo {theme === DARK_THEME ? "claro" : "oscuro"}
        </button>
        <button className="button__dash1" onClick={() => navigate("/perfil")}>Perfil completo</button>
        <button className="button__dash1" onClick={() => navigate("/ajustes")}>Abrir ajustes completos</button>
        <button className="button__dash1" onClick={() => navigate("/actualizar-info")}>Actualizar informacion</button>
        <button className="button__dash1" onClick={() => navigate("/actualizar-pass")}>Cambiar password</button>
        <button className="button__dash1" onClick={cerrarSesion}>Cerrar sesion</button>
      </div>
    </section>
  );
};

export default SettingsView;
