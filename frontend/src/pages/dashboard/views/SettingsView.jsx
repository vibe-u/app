import { useNavigate } from "react-router-dom";
import { useState } from "react";
import storeAuth from "../../../context/storeAuth";
import { applyTheme, DARK_THEME, getCurrentTheme, LIGHT_THEME } from "../../../utils/theme";
import {
  playAlertSound,
  readAlertSettings,
  requestDesktopNotificationPermission,
  saveAlertSettings,
} from "../../../utils/desktopAlerts";

const SettingsView = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getCurrentTheme());
  const [alertSettings, setAlertSettings] = useState(() => readAlertSettings());

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

  const updateAlerts = (patch) => {
    const nextSettings = {
      ...alertSettings,
      consentAsked: true,
      ...patch,
    };
    setAlertSettings(nextSettings);
    saveAlertSettings(nextSettings);
  };

  const handleDesktopPermission = async () => {
    const permission = await requestDesktopNotificationPermission();
    updateAlerts({
      enabled: true,
      desktopEnabled: permission === "granted",
    });
    if (permission === "granted" && alertSettings.soundEnabled) {
      await playAlertSound();
    }
  };

  return (
    <section className="panel__dash">
      <h3>Ajustes</h3>
      <div className="settings_grid__dash">
        <button className="button__dash1" onClick={toggleTheme}>
          Modo {theme === DARK_THEME ? "claro" : "oscuro"}
        </button>
        <label className="settings_toggle__dash">
          <input
            type="checkbox"
            checked={Boolean(alertSettings.soundEnabled)}
            onChange={(event) => {
              const enabled = event.target.checked;
              updateAlerts({
                enabled: enabled || alertSettings.desktopEnabled,
                soundEnabled: enabled,
              });
              if (enabled) {
                playAlertSound();
              }
            }}
          />
          Sonido para mensajes y notificaciones
        </label>
        <label className="settings_toggle__dash">
          <input
            type="checkbox"
            checked={Boolean(alertSettings.desktopEnabled)}
            onChange={(event) => {
              const enabled = event.target.checked;
              if (enabled) {
                handleDesktopPermission();
              } else {
                updateAlerts({
                  enabled: alertSettings.soundEnabled,
                  desktopEnabled: false,
                });
              }
            }}
          />
          Notificaciones de escritorio
        </label>
        <button className="button__dash1" onClick={handleDesktopPermission}>
          Solicitar permiso de escritorio
        </button>
        <button className="button__dash1" onClick={() => navigate("/actualizar-info")}>Actualizar informacion</button>
        <button className="button__dash1" onClick={() => navigate("/actualizar-pass")}>Cambiar password</button>
        <button className="button__dash1" onClick={cerrarSesion}>Cerrar sesion</button>
      </div>
    </section>
  );
};

export default SettingsView;
