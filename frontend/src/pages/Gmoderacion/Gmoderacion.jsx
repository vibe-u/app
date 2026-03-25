import { useEffect, useMemo, useState } from "react";
import {
  disableModeratedPost,
  enableModeratedPost,
  getModerationPosts,
  runModerationAiBatch,
  runModerationAiSingle,
} from "../../Services/admin";
import { resolveUploadUrl } from "../../utils/mediaUrl";
import "./Gmoderacion.css";

const statusMap = {
  active: "Activa",
  flagged: "Observada",
  disabled: "Desactivada",
};

const verdictMap = {
  apto: "Apto",
  no_apto: "No apto",
};

const Gmoderacion = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [reasonModal, setReasonModal] = useState({
    open: false,
    postId: null,
    reason: "Contenido no adecuado segun politicas.",
  });

  const loadPosts = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await getModerationPosts();
      setPosts(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudieron cargar publicaciones para moderacion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((post) => post?.moderation?.status === filter);
  }, [posts, filter]);

  const handleAnalyzeAll = async () => {
    try {
      setProcessing(true);
      await runModerationAiBatch();
      await loadPosts();
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo ejecutar analisis IA.");
    } finally {
      setProcessing(false);
    }
  };

  const handleAnalyzeSingle = async (postId) => {
    try {
      setProcessing(true);
      await runModerationAiSingle(postId);
      await loadPosts();
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo analizar la publicacion.");
    } finally {
      setProcessing(false);
    }
  };

  const openDisableModal = (postId) => {
    setReasonModal({
      open: true,
      postId,
      reason: "Contenido no adecuado segun politicas.",
    });
  };

  const closeDisableModal = () => {
    setReasonModal({
      open: false,
      postId: null,
      reason: "Contenido no adecuado segun politicas.",
    });
  };

  const confirmDisable = async () => {
    if (!reasonModal.postId) return;
    try {
      setProcessing(true);
      await disableModeratedPost(reasonModal.postId, reasonModal.reason);
      await loadPosts();
      closeDisableModal();
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo desactivar la publicacion.");
    } finally {
      setProcessing(false);
    }
  };

  const handleEnable = async (postId) => {
    try {
      setProcessing(true);
      await enableModeratedPost(postId);
      await loadPosts();
    } catch (e) {
      setError(e?.response?.data?.msg || "No se pudo reactivar la publicacion.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="gmod-section">
      <header className="gmod-head">
        <div>
          <h2>Moderacion IA de Publicaciones</h2>
          <p>Analiza contenido, detecta riesgo y desactiva publicaciones con aviso automatico al autor.</p>
        </div>
        <button type="button" className="gmod-btn-primary" onClick={handleAnalyzeAll} disabled={processing}>
          {processing ? "Procesando..." : "Analizar todo con IA"}
        </button>
      </header>

      <div className="gmod-toolbar">
        <label htmlFor="gmod-filter">Filtrar:</label>
        <select
          id="gmod-filter"
          className="gmod-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="flagged">Observadas</option>
          <option value="disabled">Desactivadas</option>
        </select>
      </div>

      {error ? <p className="gmod-error">{error}</p> : null}
      {loading ? <p className="gmod-loading">Cargando publicaciones...</p> : null}

      <div className="gmod-list">
        {!loading && !filtered.length ? <p className="gmod-empty">No hay publicaciones para este filtro.</p> : null}
        {filtered.map((post) => {
          const media = post?.imagen
            ? resolveUploadUrl(post.imagen, "posts")
            : post?.video
              ? resolveUploadUrl(post.video, "posts")
              : "";
          const status = post?.moderation?.status || "active";
          const verdict = post?.moderation?.aiVerdict || "apto";
          const reasons = Array.isArray(post?.moderation?.aiReasons) ? post.moderation.aiReasons : [];
          const score = Number(post?.moderation?.aiScore || 0);

          return (
            <article key={post._id} className="gmod-card">
              <div className="gmod-card-meta">
                <strong>{post?.usuario?.nombre || "Usuario"}</strong>
                <span>{post?.usuario?.correoInstitucional || ""}</span>
              </div>

              <p className="gmod-text">{post?.texto || "(Sin texto)"}</p>

              {media ? (
                <a className="gmod-media-link" href={media} target="_blank" rel="noreferrer">
                  Ver archivo adjunto
                </a>
              ) : null}

              <div className="gmod-tags">
                <span className={`gmod-tag gmod-status-${status}`}>Estado: {statusMap[status] || status}</span>
                <span className={`gmod-tag gmod-verdict-${verdict}`}>IA: {verdictMap[verdict] || verdict}</span>
                <span className="gmod-tag">Score: {score}</span>
              </div>

              {reasons.length ? (
                <ul className="gmod-reasons">
                  {reasons.slice(0, 3).map((reason, idx) => (
                    <li key={`${post._id}-reason-${idx}`}>{reason}</li>
                  ))}
                </ul>
              ) : null}

              <div className="gmod-actions">
                <button type="button" onClick={() => handleAnalyzeSingle(post._id)} disabled={processing}>
                  Reanalizar IA
                </button>
                {status !== "disabled" ? (
                  <button type="button" className="gmod-btn-danger" onClick={() => openDisableModal(post._id)} disabled={processing}>
                    Desactivar
                  </button>
                ) : (
                  <button type="button" className="gmod-btn-ok" onClick={() => handleEnable(post._id)} disabled={processing}>
                    Reactivar
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {reasonModal.open ? (
        <div className="gmod-modal-overlay" role="dialog" aria-modal="true">
          <div className="gmod-modal-card">
            <h3>Motivo de desactivacion (se enviara al autor):</h3>
            <textarea
              className="gmod-modal-textarea"
              value={reasonModal.reason}
              onChange={(e) =>
                setReasonModal((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              rows={4}
              placeholder="Escribe el motivo"
            />
            <div className="gmod-modal-actions">
              <button type="button" onClick={closeDisableModal} disabled={processing}>
                Cancelar
              </button>
              <button
                type="button"
                className="gmod-btn-danger"
                onClick={confirmDisable}
                disabled={processing || !reasonModal.reason.trim()}
              >
                {processing ? "Desactivando..." : "Desactivar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Gmoderacion;
