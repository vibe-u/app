import './ExploraConecta.css';
import evento1 from '../../assets/evento1.webp';
import paso2 from '../../assets/paso2.jpg';
import paso3 from '../../assets/paso3.jpg';
import paso4 from '../../assets/paso4.jpg';

const ExploraConecta = () => {
    return (
        <section className="explora-conecta" id="explora-conecta">
        <h2>Explora y Conecta</h2>
        <p className="explora-conecta__intro">La vida universitaria se disfruta más cuando sabes qué está pasando y encuentras con quién vivirlo.</p>
        <div className="explora-conecta__container">
            <div className="paso">
            <img src={evento1} alt="Estudiantes descubriendo un evento" loading="lazy" />
            <h3>Explora eventos en todos los campus</h3>
            <p>Encuentra actividades sociales, culturales y académicas de tu universidad y de otros campus asociados. Guarda las que te interesan y organiza tus próximos planes.</p>
            </div>
            <div className="paso">
            <img src={paso2} alt="Estudiante explorando opciones" loading="lazy" />
            <h3>Desliza para guardar o ignorar</h3>
            <p>Revisa cada evento a tu ritmo. Guarda tus favoritos para volver a ellos y descarta los que no encajan con tus intereses.</p>
            </div>
            <div className="paso">
            <img src={paso3} alt="Estudiantes conectando por un evento" loading="lazy" />
            <h3>Haz match con quien vaya</h3>
            <p>Conoce a estudiantes que también quieren asistir. Comparte intereses y encuentra compañía antes de llegar al evento.</p>
            </div>
            <div className="paso">
            <img src={paso4} alt="Estudiantes coordinando un plan" loading="lazy" />
            <h3>Chatea y coordina</h3>
            <p>Habla con tus nuevos contactos, acuerden dónde encontrarse y conviertan una actividad del campus en una experiencia compartida.</p>
            </div>
        </div>
        </section>
    )
};

export default ExploraConecta;
