import "./Eventos.css";
import grupos from "../../assets/grupo-eventos.webp";
import compartir from "../../assets/comparte-ideas.webp";
import ThemeToggle from "../../components/theme/ThemeToggle";
import BackHomeButton from "../../components/BackHomeButton";

const eventosData = [
    {
        title: "Eventos en tu U 🎉",
        description: "Descubre fiestas, charlas y actividades sociales en tu campus.",
        image: "https://tn.com.ar/resizer/v2/campus-party-arranco-el-festival-de-tecnologia-e-innovacion-XV7EPQJ66BMSEUULHQXOJV3D5Q.jpg?auth=d2e8bfc753a4e7b100bb79a5830a4d703294febde9fdd8e25ea7ed569258d001&width=767",
    },
    {
        title: "Conecta con otros 📱",
        description: "Encuentra personas con tus mismos intereses y haz match académico o social.",
        image: "https://rinconpsicologia.com/wp-content/uploads/2023/11/Amigas-conversando.webp",
    },
    {
        title: "Únete a grupos 🔗",
        description: "Explora clubes estudiantiles y comunidades dentro de tu universidad.",
        image: grupos,
    },
    {
        title: "Comparte tu vibe 🔊",
        description: "Publica tus ideas, memes, consejos o experiencias universitarias.",
        image: compartir,
    },
];

const Eventos = () => (
    <main className="eventos-section">
        <BackHomeButton />
        <ThemeToggle />
        <header className="eventos-heading">
            <h1 className="slider-title">Descubre lo mejor de tu vida universitaria</h1>
            <p className="slider-subtitle">
                Vibe-U te mantiene al tanto de todo lo que sucede en tu campus. ¡Desplázate para ver!
            </p>
        </header>
        <div className="eventos-grid">
            {eventosData.map((item, index) => (
                <article className="slide-card" key={item.title}>
                    <img
                        src={item.image}
                        alt={item.title}
                        className="slide-image"
                        width="640"
                        height="480"
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                    />
                    <div className="slide-card-copy">
                        <h2 className="slide-card-title">{item.title}</h2>
                        <p className="slide-description">{item.description}</p>
                    </div>
                </article>
            ))}
        </div>
    </main>
);

export default Eventos;
