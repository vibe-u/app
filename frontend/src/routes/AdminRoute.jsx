import { Navigate, Outlet } from "react-router-dom";
import storeAuth from "../context/storeAuth";

const AdminRoute = () => {
  const roleFromStore = storeAuth((state) => state.rol);
  const roleFromLocalStorage = localStorage.getItem("rol");
  const role = roleFromStore || roleFromLocalStorage;

  if (role !== "administrador") {
    return <Navigate to="/dashboard/feed" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
