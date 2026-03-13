import { useEffect, useState } from "react";

const ProfileView = () => {
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPerfil(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPerfil();
  }, []);

  return (
    <section className="panel__dash profile__dash">
      <img
        src={perfil?.avatar || "https://plus.unsplash.com/premium_photo-1677252438425-e4125f74fbbe?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
        alt="avatar"
      />
      <div>
        <h3>{perfil?.nombre || "Usuario"}</h3>
        <p>{perfil?.descripcion || "Sin descripcion por ahora."}</p>
        <div className="stats__dash">
          <span>{perfil?.universidad || "Universidad"}</span>
          <span>{perfil?.carrera || "Carrera"}</span>
          <span>{perfil?.rol || "estudiante"}</span>
        </div>
      </div>
    </section>
  );
};

export default ProfileView;

