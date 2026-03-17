import { Navigate, Outlet, useLocation } from "react-router-dom";
import storeAuth from "../context/storeAuth";
import { isTokenExpired } from "../utils/authToken";

const PublicRoute = () => {
  const token = storeAuth((state) => state.token);
  const clearToken = storeAuth((state) => state.clearToken);
  const location = useLocation();
  const expired = isTokenExpired(token);

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
