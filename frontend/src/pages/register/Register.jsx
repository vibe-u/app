import { NavLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);

  const notifyFormErrors = (formErrors) => {
    if (formErrors.email) toast.error(formErrors.email.message);
    else if (formErrors.password) toast.error(formErrors.password.message);
    else if (formErrors.name) toast.error(formErrors.name.message);
  };

  // 🔹 Registro en backend
  const registerUser = async (dataForm) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/register`;

    const body = {
      nombre: dataForm.name,
      correoInstitucional: dataForm.email, // 🔥 CLAVE
      password: dataForm.password,
    };

    try {
      const response = await axios.post(url, body);

      // Mostrar toast de éxito
      toast.success(response.data.msg || "Registro exitoso 🎉", {
        position: "top-right",
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Redirigir al login después de 2 segundos
      setTimeout(() => navigate("/login"), 2000);

    } catch (error) {
      const msgError = error.response?.data?.msg || "Error en el registro";
      toast.error(msgError, {
        position: "top-right",
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error("Error en el registro:", error);
    }
  };

  return (
    <div className="register-page">
      <div className="register-left">
        <div className="register-overlay">
          <h1 className="vibe-logo">VIBE-<span>U</span></h1>
          <p className="register-text">
            Únete a la comunidad universitaria.<br />
            Conecta, comparte y vive nuevas experiencias 🎓
          </p>
        </div>
      </div>

      <div className="register-right">
        <div className="register-card">
          <h2 className="register-title">Crea tu cuenta</h2>
          <p className="register-subtitle">
            ¿Ya tienes una cuenta?{" "}
            <NavLink to="/login" className="login-link">Inicia sesión</NavLink>
          </p>

          <form className="register-form" onSubmit={handleSubmit(registerUser, notifyFormErrors)}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Nombre completo"
                {...register("name", { required: "El nombre es obligatorio" })}
              />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>

            <div className="input-group">
              <input
                type="email"
                placeholder="Correo institucional"
                {...register("email", {
                  required: "El correo es obligatorio",
                  pattern: {
                    value: /^[^\s@]+@epn\.edu\.ec$/i,
                    message: "Correo inválido, debes usar un correo institucional @epn.edu.ec.",
                  },
                })}
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div className="input-group register-password-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                {...register("password", { required: "La contraseña es obligatoria" })}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <button type="submit" className="register-btn">Registrarme</button>
          </form>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Register;
