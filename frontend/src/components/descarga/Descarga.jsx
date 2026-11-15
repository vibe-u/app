import { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";
import './Descarga.css';

const Descarga = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [installHelp, setInstallHelp] = useState("");

    useEffect(() => {
        const captureInstallPrompt = (event) => {
            event.preventDefault();
            setInstallPrompt(event);
        };
        const markInstalled = () => {
            setInstallPrompt(null);
            setInstallHelp("Vibe-U ya está instalada en este dispositivo.");
        };
        window.addEventListener("beforeinstallprompt", captureInstallPrompt);
        window.addEventListener("appinstalled", markInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
            window.removeEventListener("appinstalled", markInstalled);
        };
    }, []);

    const installApp = async () => {
        if (!installPrompt) {
            setInstallHelp(
                /iphone|ipad|ipod/i.test(navigator.userAgent)
                    ? "En Safari, usa Compartir y elige «Agregar a pantalla de inicio»."
                    : "Abre el menú de tu navegador y selecciona «Instalar Vibe-U» o «Agregar a pantalla de inicio»."
            );
            return;
        }
        await installPrompt.prompt();
        const result = await installPrompt.userChoice;
        setInstallHelp(result.outcome === "accepted" ? "Vibe-U se está instalando." : "");
        setInstallPrompt(null);
    };

    return (
        <section className="download-cta-section" id="descarga">
        <div className="container">
            <div className="download-cta-copy">
                <h2 className="section-title">¿Listo para vivir la mejor experiencia universitaria?</h2>
                <p className="download-cta-subtitle">Instala Vibe-U para acceder rápidamente desde tu dispositivo.</p>
            </div>
            <div className="app-buttons-cta">
                <button type="button" className="pwa-install-button" onClick={installApp}>
                    <FaDownload aria-hidden="true" /> Descargar la app
                </button>
            </div>
            {installHelp ? <p className="pwa-install-help" role="status">{installHelp}</p> : null}
        </div>
        </section>
    );
};

export default Descarga;
