// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import storeAuth from "../../context/storeAuth";
// import "./Dashboard.css";

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [perfil, setPerfil] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [view, setView] = useState("resumen");

//   useEffect(() => {
//     const cargarPerfil = async () => {
//       try {
//         const token = localStorage.getItem("token") || storeAuth.getState().token;
//         if (!token) return navigate("/login");

//         const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/perfil`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setPerfil(data);
//       } catch (error) {
//         console.error(error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     cargarPerfil();
//   }, [navigate]);

//   const isAdmin = perfil?.rol === "administrador";

//   const accesos = useMemo(() => {
//     if (isAdmin) {
//       return [
//         { title: "Gestion de usuarios", text: "Administra roles y cuentas", cta: "Ir a usuarios", to: "/gusuarios" },
//         { title: "Gestion de grupos", text: "Supervisa comunidades", cta: "Ir a grupos", to: "/grupos" },
//         { title: "Automatizacion", text: "Solicita reportes del sistema", cta: "Ver automatizacion", to: "/gautomatizacion" },
//       ];
//     }

//     return [
//       { title: "Feed social", text: "Mira publicaciones de la comunidad", cta: "Abrir feed", to: "/dashboard/feed" },
//       { title: "Eventos U", text: "Encuentra actividades en tu campus", cta: "Ver eventos", to: "/eventos" },
//       { title: "Grupos y match", text: "Conecta con estudiantes afines", cta: "Explorar", to: "/grupos" },
//     ];
//   }, [isAdmin]);

//   const cerrarSesion = () => {
//     localStorage.clear();
//     storeAuth.getState().clearToken();
//     navigate("/login");
//   };

//   return (
//     <div className="shell__dash">
//       <aside className="sidebar__dash">
//         <h1>Vibe-U</h1>
//         <p>Panel principal</p>

//         <nav className="menu__dash">
//           <button className={`menu_btn__dash ${view === "resumen" ? "menu_btn_active__dash" : ""}`} onClick={() => setView("resumen")}>
//             Resumen
//           </button>
//           <button className={`menu_btn__dash ${view === "accesos" ? "menu_btn_active__dash" : ""}`} onClick={() => setView("accesos")}>
//             Accesos
//           </button>
//           <button className={`menu_btn__dash ${view === "cuenta" ? "menu_btn_active__dash" : ""}`} onClick={() => setView("cuenta")}>
//             Cuenta
//           </button>
//         </nav>

//         <div className="quick_links__dash">
//           <button className="menu_btn__dash" onClick={() => navigate("/dashboard/feed")}>Ir al feed</button>
//           <button className="menu_btn__dash" onClick={() => navigate("/perfil")}>Mi perfil</button>
//         </div>
//       </aside>

//       <main className="content__dash">
//         <header className="topbar__dash">
//           <div>
//             <h2>{loading ? "Cargando..." : `Hola, ${perfil?.nombre || "usuario"}`}</h2>
//             <p>{isAdmin ? "Panel de administracion" : "Panel de estudiante"}</p>
//           </div>
//           <div className="actions__dash">
//             <button className="button__dash" onClick={cerrarSesion}>Cerrar sesion</button>
//           </div>
//         </header>

//         {view === "resumen" && (
//           <section className="panel__dash">
//             <h3>Resumen de cuenta</h3>
//             <div className="stats__dash">
//               <span>Rol: {perfil?.rol || "estudiante"}</span>
//               <span>Universidad: {perfil?.universidad || "No definida"}</span>
//               <span>Carrera: {perfil?.carrera || "No definida"}</span>
//             </div>
//             <p style={{ marginTop: "10px" }}>
//               {perfil?.descripcion || "Completa tu perfil para mejorar tus recomendaciones."}
//             </p>
//           </section>
//         )}

//         {view === "accesos" && (
//           <section className="hub_grid__dash">
//             {accesos.map((item) => (
//               <article className="hub_card__dash" key={item.title}>
//                 <h3>{item.title}</h3>
//                 <p>{item.text}</p>
//                 <button className="button__dash" onClick={() => navigate(item.to)}>{item.cta}</button>
//               </article>
//             ))}
//           </section>
//         )}

//         {view === "cuenta" && (
//           <section className="panel__dash">
//             <h3>Cuenta</h3>
//             <div className="settings_grid__dash">
//               <button className="button__dash1" onClick={() => navigate("/actualizar-info")}>Actualizar informacion</button>
//               <button className="button__dash1" onClick={() => navigate("/actualizar-pass")}>Cambiar password</button>
//               <button className="button__dash1" onClick={() => navigate("/ajustes")}>Abrir ajustes</button>
//               <button className="button__dash1" onClick={cerrarSesion}>Cerrar sesion</button>
//             </div>
//           </section>
//         )}
//       </main>
//     </div>
//   );
// };

// export default Dashboard;
