import { Link } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import './BackHomeButton.css';

export default function BackHomeButton() {
    return (
        <Link to="/" className="public-back-btn" aria-label="Volver a la página principal">
            <IoArrowBack size={22} aria-hidden="true" />
        </Link>
    );
}
