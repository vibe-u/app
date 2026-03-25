import { useEffect, useState } from "react";
import {
  applyTheme,
  DARK_THEME,
  getCurrentTheme,
  LIGHT_THEME,
} from "../../utils/theme";
import "./ThemeToggle.css";

const ThemeToggle = () => {
  const [theme, setTheme] = useState(getCurrentTheme());

  useEffect(() => {
    const syncTheme = () => setTheme(getCurrentTheme());
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    setTheme(applyTheme(nextTheme));
  };

  return (
    <button
      type="button"
      className="theme_toggle_global"
      onClick={toggleTheme}
      aria-label={theme === DARK_THEME ? "Activar modo claro" : "Activar modo oscuro"}
      title={theme === DARK_THEME ? "Modo claro" : "Modo oscuro"}
    >
      {theme === DARK_THEME ? "Claro" : "Oscuro"}
    </button>
  );
};

export default ThemeToggle;
