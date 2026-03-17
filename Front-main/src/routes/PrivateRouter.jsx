import { Navigate, Outlet } from "react-router-dom";
import storeAuth from "../context/storeAuth";
import { isTokenExpired } from "../utils/authToken";

const PrivateRoute = () => {
  const token = storeAuth((state) => state.token);
  const clearToken = storeAuth((state) => state.clearToken);
  const expired = isTokenExpired(token);

  if (token && expired) {
    clearToken();
    localStorage.removeItem("token");
  }

  if (!token || expired) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
