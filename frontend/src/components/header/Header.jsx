import "./Header.css";
import { Link, useNavigate } from "react-router";
import logo from "../../assets/logo-vibe-u.webp";
import storeAuth from "../../context/storeAuth";

const Header = () => {
    const navigate = useNavigate();
    const token = storeAuth((state) => state.token);

    const handleLoginClick = () => {
        if (token) {
        navigate("/dashboard/micuenta");
        return;
        }
        navigate("/login");
    };

    const handleJoinNowClick = () => {
        navigate("/register");
    };

    return (
        <header className="header">
        <div className="logo-container">
            <Link to="/">
            <img src={logo} alt="Vibe-U Logo" className="logo" loading="lazy" />hola
            </Link>
            <div className="boton-descarga1">
            <a href="https://play.google.com/store/games?hl=es_EC" className="btn btn-primary descarga-chica" target="_blank" rel="noopener noreferrer">
                Descarga la App
            </a>
            </div>
        </div>

        <nav className="nav-links">
            <a href="#que-es-vibe-u">¿Qué es Vibe-U?</a>
            <a href="#como-funciona">¿Cómo Funciona?</a>
            <a href="#explora-conecta">Explora y Conecta</a>
            <Link to="/contacto">Contacto</Link>
            <Link to="/beneficios">Beneficios</Link>
            <Link to="/eventos">Eventos</Link>
        </nav>

        <div className="hero-text hero-text-login" data-aos="fade-down" data-aos-duration="1500">
            <div className="boton-descarga">
            <button type="button" className="button__auth-button" onClick={handleLoginClick}>
                {token ? "Entrar a mi cuenta" : "Iniciar sesión"}
            </button>
            </div>
        </div>

        <div className="hero-text" data-aos="fade-down" data-aos-duration="1500">
            <p>La app que pone a la U en modo social</p>
            <div className="boton-descarga">
            <button type="button" className="btn" onClick={handleJoinNowClick}>
                Únete ahora
            </button>
            <a href="#como-funciona" className="btn-secondary">
                ¿Cómo funciona?
            </a>
            </div>
        </div>
        </header>
    );
};

export default Header;
