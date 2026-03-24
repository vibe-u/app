import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMatchCandidates,
  rejectMatchCandidate,
  sendMatchLike,
} from "../../Services/users";
import { resolveAvatarUrl } from "../../utils/mediaUrl";
import "./Matches.css";

const DEFAULT_AVATAR = "/default-avatar.svg";

const Matches = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [swipeHint, setSwipeHint] = useState("");
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getMatchCandidates();
      setSuggestedUsers(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error("Error al cargar matches:", requestError);
      setError("No se pudieron cargar los usuarios registrados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  useEffect(() => {
    if (currentIndex > suggestedUsers.length - 1) {
      setCurrentIndex(Math.max(0, suggestedUsers.length - 1));
    }
  }, [suggestedUsers, currentIndex]);

  const handleReject = async (userId) => {
    if (processing || !userId) return;
    try {
      setProcessing(true);
      await rejectMatchCandidate(userId);
      setSwipeHint("Descartado");
      setTimeout(() => {
        setSwipeHint("");
      }, 120);
      setSuggestedUsers((prev) => prev.filter((item) => item._id !== userId));
    } catch (requestError) {
      setError(requestError?.response?.data?.msg || "No se pudo rechazar el perfil.");
    } finally {
      setProcessing(false);
    }
  };

  const handleLike = async (userId) => {
    if (processing || !userId) return;
    try {
      setProcessing(true);
      const { data } = await sendMatchLike(userId);
      if (data?.matched) {
        setSwipeHint("Match! 💘");
        setTimeout(() => {
          navigate("/dashboard/chat", {
            state: {
              openUserId: userId,
              fromMatch: true,
            },
          });
        }, 200);
      } else {
        setSwipeHint("Like enviado 💜");
        setTimeout(() => {
          setSwipeHint("");
        }, 120);
        setSuggestedUsers((prev) => prev.filter((item) => item._id !== userId));
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.msg || "No se pudo enviar like.");
    } finally {
      setProcessing(false);
    }
  };

  const handleTouchStart = (event) => {
    if (!isMobile) return;
    setTouchStartX(event.touches[0].clientX);
    setSwipeHint("");
  };

  const handleTouchMove = (event) => {
    if (!isMobile || touchStartX === null || processing) return;
    const currentX = event.touches[0].clientX;
    const delta = currentX - touchStartX;
    setDragX(delta);
    if (delta > 35) setSwipeHint("👉 Like");
    else if (delta < -35) setSwipeHint("👈 Rechazar");
    else setSwipeHint("");
  };

  const handleTouchEnd = (userId) => {
    if (!isMobile || processing) return;
    const threshold = 90;
    if (dragX >= threshold) {
      handleLike(userId);
    } else if (dragX <= -threshold) {
      handleReject(userId);
    }
    setDragX(0);
    setTouchStartX(null);
    setTimeout(() => setSwipeHint(""), 200);
  };

  const currentUser = suggestedUsers[currentIndex];

  return (
    <section className="matches-section">
      <button className="back-btn" onClick={() => navigate(-1)}>
        Volver
      </button>
      <h2 className="matches-title">Tus posibles matches</h2>
      <p className="matches-subtitle">
        Desliza a la derecha para dar like. Si es mutuo, se abre el chat.
      </p>

      {loading ? <p className="matches-state">Cargando usuarios...</p> : null}
      {error ? <p className="matches-state matches-error">{error}</p> : null}
      {!loading && !error && suggestedUsers.length === 0 ? (
        <p className="matches-state">No hay usuarios disponibles por ahora.</p>
      ) : null}

      {isMobile ? (
        <div className="matches-swipe-wrapper">
          {!loading && !error && !currentUser ? (
            <p className="matches-state">Ya no hay mas perfiles por hoy.</p>
          ) : null}

          {currentUser ? (
            <div
              key={currentUser._id}
              className="match-card match-card-swipe"
              style={{
                transform: `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`,
                transition: touchStartX === null ? "transform 0.2s ease" : "none",
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(currentUser._id)}
            >
              {swipeHint ? <div className="swipe-hint">{swipeHint}</div> : null}
              <img
                src={resolveAvatarUrl(currentUser.avatar) || DEFAULT_AVATAR}
                alt={currentUser.nombre || "Usuario"}
                className="match-avatar"
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              <h4>{currentUser.nombre || "Usuario"}</h4>
              {currentUser.incomingLike ? <span className="match-pill-like">Le interesas</span> : null}
              <p>{currentUser.universidad || currentUser.carrera || "Estudiante registrado"}</p>
            </div>
          ) : null}

          {currentUser ? (
            <div className="swipe-mobile-actions">
              <button
                className="swipe-reject-btn"
                type="button"
                onClick={() => handleReject(currentUser._id)}
                disabled={processing}
              >
                👈 No
              </button>
              <button
                className="swipe-like-btn"
                type="button"
                onClick={() => handleLike(currentUser._id)}
                disabled={processing}
              >
                👉 Like
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="matches-grid">
          {suggestedUsers.map((user) => (
            <div key={user._id} className="match-card">
              <img
                src={resolveAvatarUrl(user.avatar) || DEFAULT_AVATAR}
                alt={user.nombre || "Usuario"}
                className="match-avatar"
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              <h4>{user.nombre || "Usuario"}</h4>
              {user.incomingLike ? <span className="match-pill-like">Le interesas</span> : null}
              <p>{user.universidad || user.carrera || "Estudiante registrado"}</p>
              <div className="match-card-actions">
                <button className="connect-btn reject" type="button" onClick={() => handleReject(user._id)}>
                  Rechazar
                </button>
                <button className="connect-btn" type="button" onClick={() => handleLike(user._id)}>
                  Like
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Matches;
