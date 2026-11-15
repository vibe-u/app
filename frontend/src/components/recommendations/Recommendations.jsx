import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRecommendations } from "../../Services/recommendations";
import { isMobileAccess } from "../../utils/mobileAccess";
import "./Recommendations.css";

const formatDate = (value) => {
  if (!value) return "Fecha por confirmar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha por confirmar";
  return date.toLocaleString();
};

const Recommendations = ({
  variant = "hub",
  reloadToken = 0,
  onSelectGroup,
  onSelectEvent,
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await getRecommendations();
        if (!cancelled) setData(res?.data || null);
      } catch (error) {
        if (!cancelled) {
          setData(null);
          setLoadError(error?.response?.data?.msg || "No se pudieron cargar las recomendaciones.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const grupos = Array.isArray(data?.grupos) ? data.grupos : [];
  const eventos = Array.isArray(data?.eventos) ? data.eventos : [];
  const publicaciones = variant === "hub" && Array.isArray(data?.publicaciones)
    ? data.publicaciones.slice(0, 2)
    : [];
  const canOpenGrupos = variant === "grupos" || isMobileAccess();
  const showGrupos = (variant === "hub" && canOpenGrupos) || variant === "grupos";
  const showEventos = variant === "hub" || variant === "eventos";
  const visibleGrupos = showGrupos ? grupos.slice(0, variant === "hub" ? 2 : 6) : [];
  const visibleEventos = showEventos ? eventos.slice(0, variant === "hub" ? 2 : 6) : [];

  const openGroup = (grupo) => {
    if (onSelectGroup) {
      onSelectGroup(grupo);
      return;
    }
    try {
      localStorage.setItem("ultimoGrupoVisitado", JSON.stringify(grupo));
    } catch {
      /* ignore */
    }
    navigate("/grupos");
  };

  const openEvent = (evento) => {
    if (onSelectEvent) {
      onSelectEvent(evento);
      return;
    }
    try {
      sessionStorage.setItem("vibeSelectedEventId", evento._id);
    } catch {
      /* ignore */
    }
    navigate("/dashboard/eventos");
  };

  if (loading) {
    return (
      <section className={`recs-block recs-block--${variant}`}>
        <p className="recs-hint">Buscando recomendaciones para ti...</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className={`recs-block recs-block--${variant}`}>
        <p className="recs-hint" role="alert">{loadError}</p>
      </section>
    );
  }

  if (!visibleGrupos.length && !visibleEventos.length && !publicaciones.length) {
    return (
      <section className={`recs-block recs-block--${variant}`}>
        <div className="recs-head">
          <div>
            <p className="recs-kicker">Para ti</p>
            <h3>Sugerencias para ti</h3>
          </div>
        </div>
        <p className="recs-hint">
          {data?.needsUniversity && showEventos
            ? "Completa tu universidad para recibir eventos de tu campus."
            : "Aún no hay coincidencias claras. Elige intereses o participa en publicaciones para personalizar sugerencias."}
        </p>
        <Link className="recs-cta" to="/actualizar-info">
          Elegir intereses
        </Link>
      </section>
    );
  }

  return (
    <section className={`recs-block recs-block--${variant}`}>
      <div className="recs-head">
        <div>
          <p className="recs-kicker">Para ti</p>
          <h3>
            {variant === "grupos"
              ? "Comunidades recomendadas"
              : variant === "eventos"
                ? "Eventos recomendados"
                : "Sugerencias para ti"}
          </h3>
          <p className="recs-hint">
            Cada sugerencia indica si coincide con tus intereses, perfil o publicaciones y comentarios.
          </p>
        </div>
        {!data?.hasInterests ? (
          <Link className="recs-cta recs-cta--ghost" to="/actualizar-info">
            Elegir intereses
          </Link>
        ) : null}
      </div>

      {visibleGrupos.length ? (
        <div className="recs-section">
          {variant === "hub" ? <h4>Comunidades</h4> : null}
          <div className="recs-scroller">
            {visibleGrupos.map((grupo) => (
              <article key={grupo._id} className="recs-card">
                <button type="button" className="recs-card-main" onClick={() => openGroup(grupo)}>
                  {grupo.imagen ? (
                    <img src={grupo.imagen} alt="" className="recs-cover" />
                  ) : (
                    <div className="recs-cover recs-cover--empty">Comunidad</div>
                  )}
                  <div className="recs-card-body">
                    <strong>{grupo.nombre}</strong>
                    <span>{grupo.miembrosCount || 0} miembros</span>
                    <div className="recs-reasons">
                      {(grupo.reasons || []).slice(0, 1).map((reason) => (
                        <em key={reason}>{reason}</em>
                      ))}
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {publicaciones.length ? (
        <div className="recs-section recs-publications">
          <h4>Publicaciones que pueden interesarte</h4>
          <div className="recs-publication-list">
            {publicaciones.map((post) => (
              <article className="recs-publication-card" key={post._id}>
                <button
                  type="button"
                  className="recs-publication-main"
                  onClick={() => navigate("/dashboard/feed", {
                    state: { focusPostId: post._id, openPostComments: true },
                  })}
                  aria-label={`Abrir publicación de ${post.autor} y sus comentarios`}
                >
                  {post.imagen ? (
                    <img src={post.imagen} alt="" />
                  ) : (
                    <div className="recs-publication-cover" aria-hidden="true" />
                  )}
                  <div className="recs-publication-content">
                    <strong>{post.autor}</strong>
                    <p>{post.texto || "Publicación con conversación activa."}</p>
                    <span className="recs-publication-meta">{post.comentariosCount} comentarios</span>
                    <span className="recs-match-reason">
                      {(post.reasons || [])[0] || "Publicación reciente para descubrir"}
                    </span>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {visibleEventos.length ? (
        <div className="recs-section">
          {variant === "hub" ? <h4>Eventos</h4> : null}
          <div className="recs-scroller">
            {visibleEventos.map((evento) => (
              <article key={evento._id} className="recs-card">
                <button type="button" className="recs-card-main" onClick={() => openEvent(evento)}>
                  {evento.portada ? (
                    <img src={evento.portada} alt="" className="recs-cover" />
                  ) : (
                    <div className="recs-cover recs-cover--empty">Evento</div>
                  )}
                  <div className="recs-card-body">
                    <strong>{evento.nombreEvento}</strong>
                    <span>{formatDate(evento.fechaHora)}</span>
                    <span>{evento.lugar}</span>
                    <div className="recs-reasons">
                      {(evento.reasons || []).slice(0, 1).map((reason) => (
                        <em key={reason}>{reason}</em>
                      ))}
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Recommendations;
