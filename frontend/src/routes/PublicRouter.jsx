import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import storeAuth from "../context/storeAuth";
import { getSessionToken, isTokenExpired } from "../utils/authToken";

const PublicRoute = () => {
  const tokenFromStore = storeAuth((state) => state.token);
  const setToken = storeAuth((state) => state.setToken);
  const clearToken = storeAuth((state) => state.clearToken);
  const location = useLocation();
  const tokenFromSession = getSessionToken();
  const token = tokenFromStore || tokenFromSession;
  const expired = isTokenExpired(token);

  useEffect(() => {
    if (!tokenFromStore && tokenFromSession) {
      setToken(tokenFromSession);
    }
  }, [tokenFromStore, tokenFromSession, setToken]);

  if (token && expired) {
    clearToken();
    localStorage.removeItem("token");
  }

  if (location.pathname === "/") {
    return <Outlet />;
  }

  return token && !expired ? <Navigate to="/dashboard/feed" replace /> : <Outlet />;
};

export default PublicRoute;
