import './Beneficios.css';

const Beneficios = () => {
    return (
        <section id="funcionalidad" className="funcionalidades">
            <div className="container">
                <h2 className="section-title">Beneficios clave de Vibe-U</h2>
                <div className="funcionalidades__grid">
                    <div className="funcionalidad__item">
                        <img src="https://cdn-icons-png.flaticon.com/128/1946/1946429.png" alt="Haz nuevos amigos" width="105" height="105" loading="lazy" />
                        <p>Haz nuevos amigos</p>
                    </div>
                    <div className="funcionalidad__item">
                        <img src="https://cdn-icons-png.flaticon.com/128/684/684908.png" alt="Únete a comunidades" width="105" height="105" loading="lazy" />
                        <p>Únete a comunidades</p>
                    </div>
                    <div className="funcionalidad__item">
                        <img src="https://cdn-icons-png.flaticon.com/128/4221/4221927.png" alt="Asiste a eventos" width="105" height="105" loading="lazy" />
                        <p>Asiste a eventos</p>
                    </div>
                    <div className="funcionalidad__item">
                        <img src="https://cdn-icons-png.flaticon.com/128/992/992700.png" alt="Conecta por afinidad" width="105" height="105" loading="lazy" />
                        <p>Conecta por afinidad</p>
                    </div>
                </div>
            </div>
        </section>
    )
};

export default Beneficios;
