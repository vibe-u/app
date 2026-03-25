export const THEME_STORAGE_KEY = "app_theme";
export const LIGHT_THEME = "light";
export const DARK_THEME = "dark";

export const isThemeValue = (value) => value === LIGHT_THEME || value === DARK_THEME;

export const getStoredTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeValue(stored) ? stored : null;
};

export const getSystemTheme = () =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK_THEME
    : LIGHT_THEME;

export const getInitialTheme = () => getStoredTheme() || getSystemTheme();

export const applyTheme = (theme) => {
  const safeTheme = isThemeValue(theme) ? theme : LIGHT_THEME;
  document.documentElement.setAttribute("data-theme", safeTheme);
  document.documentElement.style.colorScheme = safeTheme;
  localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
  return safeTheme;
};

export const getCurrentTheme = () =>
  document.documentElement.getAttribute("data-theme") || getInitialTheme();
