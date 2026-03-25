import { Navigate, Outlet } from "react-router-dom";
import { isMobileAccess } from "../utils/mobileAccess";

const MobileOnlyRoute = () => {
  return isMobileAccess() ? <Outlet /> : <Navigate to="/dashboard/feed" replace />;
};

export default MobileOnlyRoute;

