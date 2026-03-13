import { Navigate, Outlet, useLocation } from "react-router-dom";
import storeAuth from "../context/storeAuth";

const PublicRoute = () => {
  const token = storeAuth((state) => state.token);
  const location = useLocation();

  // Permitir landing "/" aunque haya sesión activa                                                                                                                 
    if (location.pathname === "/") {                                                                                                                                  
      return <Outlet />;                                                                                                                                              
    }
                                                                                                                                                                      
    // Bloquear solo login/register/etc cuando ya hay sesión                                                                                                          
    return token ? <Navigate to="/dashboard/feed" replace /> : <Outlet />;                                                                                            
  };

export default PublicRoute;
