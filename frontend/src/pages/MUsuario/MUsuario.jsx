import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MUsuario.css";
import { resolveAvatarUrl } from "../../utils/mediaUrl";

const MUsuario = () => {
  const fileInputRef = useRef(null);
  const [userName, setUserName] = useState("Usuario");
  const [userRole, setUserRole] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [userPhone, setUserPhone] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userCedula, setUserCedula] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [userUniversity, setUserUniversity] = useState("");
  const [userCareer, setUserCareer] = useState("");

  const getAvatarUrl = (url) => {
    const resolved = resolveAvatarUrl(url);
    return resolved ? `${resolved}${resolved.includes("?") ? "&" : "?"}t=${Date.now()}` : null;
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/perfil`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUserName(response.data?.nombre || "Usuario");
        setUserRole(response.data?.rol || "");
        setAvatar(response.data?.avatar || null);
        setUserPhone(response.data?.telefono || "");
        setUserAddress(response.data?.direccion || "");
        setUserCedula(response.data?.cedula || "");
        setUserDescription(response.data?.descripcion || "");
        setUserUniversity(response.data?.universidad || "");
        setUserCareer(response.data?.carrera || "");
      } catch (error) {
        console.error("Error al obtener el usuario:", error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Sesion expirada. Inicia sesion.");
      return;
    }

    try {
      const newAvatarDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setAvatar(newAvatarDataUrl);

      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/actualizar-perfil`,
        { avatar: newAvatarDataUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Avatar actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar el avatar:", err.response?.data || err);
      toast.error("Error al actualizar el avatar.");
    }
  };

  return (
    <section className="panel__dash">
      <ToastContainer />

      <div className="user-profile-section">
        <h3 style={{ textAlign: "center", marginBottom: "15px", color: "#000" }}>{userName}</h3>

        <div className="profile-header" style={{ justifyContent: "center" }}>
          <div className="avatar-circle-large" onClick={() => fileInputRef.current?.click()}>
            {avatar ? (
              <img src={getAvatarUrl(avatar)} alt="Avatar" className="avatar-img-large" />
            ) : (
              <span className="default-avatar-large">👤</span>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="input-file-hidden"
            accept="image/*"
          />
        </div>

        <div className="profile-info">
          <div className="info-row"><strong>Rol:</strong> <span>{userRole || "estudiante"}</span></div>
          <div className="info-row"><strong>Descripcion:</strong> <span>{userDescription || "No disponible"}</span></div>
          <div className="info-row"><strong>Telefono:</strong> <span>{userPhone || "No disponible"}</span></div>
          <div className="info-row"><strong>Direccion:</strong> <span>{userAddress || "No disponible"}</span></div>
          <div className="info-row"><strong>Cedula:</strong> <span>{userCedula || "No disponible"}</span></div>
          <div className="info-row"><strong>Universidad:</strong> <span>{userUniversity || "No disponible"}</span></div>
          <div className="info-row"><strong>Carrera:</strong> <span>{userCareer || "No disponible"}</span></div>
        </div>
      </div>
    </section>
  );
};

export default MUsuario;
