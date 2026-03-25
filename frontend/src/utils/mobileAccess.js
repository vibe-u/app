export const isMobileAccess = () => {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent || "";
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua);
  const isSmallViewport = window.innerWidth <= 900;

  // Para pruebas locales, aceptamos también viewport pequeño.
  return isMobileUA || isSmallViewport;
};

