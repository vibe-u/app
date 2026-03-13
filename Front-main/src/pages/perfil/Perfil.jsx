import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "./Perfil.css";

const Perfil = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPerfil = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/perfil`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        reset({
          nombre: res.data?.nombre || "",
          telefono: res.data?.telefono || "",
          direccion: res.data?.direccion || "",
          cedula: res.data?.cedula || "",
          descripcion: res.data?.descripcion || "",
          universidad: res.data?.universidad || "",
          carrera: res.data?.carrera || "",
        });
      } catch (error) {
        toast.error(error.response?.data?.msg || "No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, [reset]);

  const onSubmit = async (dataForm) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Sesion no valida");
      return;
    }

    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/actualizar-perfil`,
        dataForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo actualizar el perfil");
    }
  };

  if (loading) {
    return (
      <main className="perfil-main">
        <h1 className="main-title">Cargando perfil...</h1>
      </main>
    );
  }

  return (
    <main className="perfil-main">
      <h1 className="main-title">Mi Perfil</h1>

      <div className="perfil-content">
        <section className="perfil-form-section">
          <form className="perfil-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="input-group">
              <label>Nombre:</label>
              <input
                type="text"
                placeholder="Tu nombre"
                {...register("nombre", { required: true })}
              />
              {errors.nombre && <span className="error-text">El nombre es requerido</span>}
            </div>

            <div className="input-group">
              <label>Telefono:</label>
              <input
                type="text"
                placeholder="Ej: +593..."
                {...register("telefono")}
              />
            </div>

            <div className="input-group">
              <label>Direccion:</label>
              <input
                type="text"
                placeholder="Tu direccion"
                {...register("direccion")}
              />
            </div>

            <div className="input-group">
              <label>Cedula:</label>
              <input
                type="text"
                placeholder="Numero de cedula"
                {...register("cedula")}
              />
            </div>

            <div className="input-group">
              <label>Descripcion:</label>
              <textarea
                placeholder="Breve descripcion"
                {...register("descripcion")}
              />
            </div>

            <div className="input-group">
              <label>Universidad:</label>
              <input
                type="text"
                placeholder="Nombre de universidad"
                {...register("universidad")}
              />
            </div>

            <div className="input-group">
              <label>Carrera:</label>
              <input
                type="text"
                placeholder="Tu carrera"
                {...register("carrera")}
              />
            </div>

            <button type="submit" className="submit-btn">Guardar cambios</button>
          </form>
        </section>
      </div>
      <ToastContainer />
    </main>
  );
};

export default Perfil;
