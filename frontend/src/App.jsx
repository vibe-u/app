import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

import Landing from "./pages/Landing";
const Register = lazy(() => import("./pages/register/Register"));
const Login = lazy(() => import("./pages/login/Login"));
const Contacto = lazy(() => import("./pages/contacto/Contacto"));
const Eventos = lazy(() => import("./pages/eventos/Eventos"));
const Beneficios = lazy(() => import("./pages/beneficios/Beneficios"));
const ForgotPassword = lazy(() => import("./pages/forgot-password/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Confirm = lazy(() => import("./pages/confirm").then((module) => ({ default: module.Confirm })));

const UserDashboard = lazy(() => import("./pages/dashboard/UserDashboard"));
const FeedView = lazy(() => import("./pages/dashboard/views/FeedView"));
const CreatePostView = lazy(() => import("./pages/dashboard/views/CreatePostView"));
const ChatView = lazy(() => import("./pages/dashboard/views/ChatView"));
const EventsView = lazy(() => import("./pages/dashboard/views/EventsView"));
const ProfileView = lazy(() => import("./pages/dashboard/views/ProfileView"));
const UserPublicProfileView = lazy(() => import("./pages/dashboard/views/UserPublicProfileView"));
const NotificationsView = lazy(() => import("./pages/dashboard/views/NotificationsView"));
const SettingsView = lazy(() => import("./pages/dashboard/views/SettingsView"));
const Perfil = lazy(() => import("./pages/perfil/Perfil"));
const Matches = lazy(() => import("./pages/Matches/Matches"));
const MUsuario = lazy(() => import("./pages/MUsuario/MUsuario"));
const ActualizarInfo = lazy(() => import("./Actualizacion/ActualizarInfo.jsx"));
const ChangePasswordForm = lazy(() => import("./pages/Password/ActualizarPass.jsx"));
const Grupos = lazy(() => import("./pages/Grupos/Grupos.jsx"));
const Gusuario = lazy(() => import("./pages/gusuarios/Gusuarios.jsx"));
const Gautomatizacion = lazy(() => import("./pages/Gautomatizacion/Gautomatizacion.jsx"));
const Gmoderacion = lazy(() => import("./pages/Gmoderacion/Gmoderacion.jsx"));
const Bitacora = lazy(() => import("./pages/Bitacora/Bitacora.jsx"));
const Gsolicitudes = lazy(() => import("./pages/Gsolicitudes/Gsolicitudes.jsx"));

import PublicRoute from "./routes/PublicRouter.jsx";
import PrivateRoute from "./routes/PrivateRouter.jsx";
import MobileOnlyRoute from "./routes/MobileOnlyRoute.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
import AdminLayout from "./routes/AdminLayout.jsx";

import storeProfile from "./context/storeProfile";
import storeAuth from "./context/storeAuth";
import { getSessionToken, isTokenExpired } from "./utils/authToken";
import { applyTheme, getInitialTheme } from "./utils/theme";

function App() {
  const profile = storeProfile((state) => state.profile);
  const tokenFromStore = storeAuth((state) => state.token);
  const setToken = storeAuth((state) => state.setToken);
  const clearToken = storeAuth((state) => state.clearToken);
  const token = tokenFromStore || getSessionToken();

  useEffect(() => {
    if (!token) return;
    if (!tokenFromStore && token) {
      setToken(token);
    }
    if (isTokenExpired(token)) {
      clearToken();
      localStorage.removeItem("token");
      return;
    }
    profile();
  }, [token, tokenFromStore, setToken, profile, clearToken]);

  useEffect(() => {
    let cancelled = false;
    let idleCallbackId;
    let timeoutId;

    const initializeAnimations = async () => {
      await import("aos/dist/aos.css");
      const { default: AOS } = await import("aos");
      if (!cancelled) AOS.init({ once: true, duration: 800 });
    };

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(initializeAnimations, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(initializeAnimations, 200);
    }

    return () => {
      cancelled = true;
      if (idleCallbackId !== undefined) window.cancelIdleCallback?.(idleCallbackId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={null}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="confirmar/:token" element={<Confirm />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="recuperarpassword/:token" element={<ResetPassword />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="dashboard" element={<UserDashboard />}>
            <Route index element={<Navigate to="feed" replace />} />
            <Route path="feed" element={<FeedView />} />
            <Route path="publicar" element={<CreatePostView />} />
            <Route path="chat" element={<ChatView />} />
            <Route path="eventos" element={<EventsView />} />
            <Route path="perfil" element={<ProfileView />} />
            <Route path="usuario/:id" element={<UserPublicProfileView />} />
            <Route path="micuenta" element={<MUsuario />} />
            <Route path="notificaciones" element={<NotificationsView />} />
            <Route path="ajustes" element={<SettingsView />} />
          </Route>
          <Route path="perfil" element={<Perfil />} />
          <Route path="musuario" element={<Navigate to="/dashboard/micuenta" replace />} />
          <Route path="actualizar-info" element={<ActualizarInfo />} />
          <Route path="actualizar-pass" element={<ChangePasswordForm />} />
          <Route path="grupos" element={<Grupos />} />
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="gusuarios" element={<Gusuario />} />
              <Route path="gautomatizacion" element={<Gautomatizacion />} />
              <Route path="gmoderacion" element={<Gmoderacion />} />
              <Route path="gbitacora" element={<Bitacora />} />
              <Route path="gsolicitudes" element={<Gsolicitudes />} />
            </Route>
          </Route>

          <Route element={<MobileOnlyRoute />}>
            <Route path="matches" element={<Matches />} />
          </Route>
        </Route>

        <Route path="contacto" element={<Contacto />} />
        <Route path="eventos" element={<Eventos />} />
        <Route path="beneficios" element={<Beneficios />} />
        <Route path="*" element={<div>Pagina no encontrada</div>} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
