import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  comentarPost,
  eliminarComentarioPost,
  eliminarPost,
  obtenerPosts,
  toggleLikePost,
} from "../../Services/posts";
import { searchRegisteredUsers } from "../../Services/users";
import { getTokenPayload } from "../../utils/authToken";
import "./Dashboard.css";

const titleMap = {
  "/dashboard/feed": "Feed",
  "/dashboard/publicar": "Publicar",
  "/dashboard/chat": "Chat",
  "/dashboard/eventos": "Eventos U",
  "/dashboard/perfil": "Perfil",
  "/dashboard/notificaciones": "Notificaciones",
  "/dashboard/ajustes": "Ajustes",
};

const subtitleMap = {
  "/dashboard/feed": "Publicaciones recientes de la comunidad",
  "/dashboard/publicar": "Comparte algo con tu universidad",
  "/dashboard/chat": "Tus conversaciones activas",
  "/dashboard/eventos": "Eventos y actividades del campus",
  "/dashboard/perfil": "Informacion visible de tu cuenta",
  "/dashboard/notificaciones": "Actividad y avisos",
  "/dashboard/ajustes": "Configuracion rapida",
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const title = currentPath.startsWith("/dashboard/usuario/")
    ? "Perfil publico"
    : (titleMap[currentPath] || "Dashboard");
  const subtitle = currentPath.startsWith("/dashboard/usuario/")
    ? "Revisa su perfil y gestiona amistad"
    : (subtitleMap[currentPath] || "Panel principal");
  const [search, setSearch] = useState("");
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchGroups, setSearchGroups] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const term = search.trim();
    if (!term) {
      setSearchUsers([]);
      setSearchGroups([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [usersRes, groupsRes] = await Promise.all([
          searchRegisteredUsers(term),
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/grupos/listar`),
        ]);

        const users = Array.isArray(usersRes?.data) ? usersRes.data : [];
        const groupsData = await groupsRes.json();
        const groups = Array.isArray(groupsData) ? groupsData : [];
        const startsWithTerm = (value = "") =>
          value.toLowerCase().startsWith(term.toLowerCase());

        setSearchUsers(users.filter((u) => startsWithTerm(u.nombre)).slice(0, 5));
        setSearchGroups(groups.filter((g) => startsWithTerm(g.nombre)).slice(0, 5));
        setShowSuggestions(true);
      } catch {
        setSearchUsers([]);
        setSearchGroups([]);
        setShowSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const hasSuggestions = useMemo(
    () => searchUsers.length > 0 || searchGroups.length > 0,
    [searchUsers, searchGroups]
  );

  return (
    <div className="shell__dash">
      <Sidebar />

      <main className="content__dash">
        <header className="topbar__dash">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div className="actions__dash">
            <div className="search_box__dash">
              <input
                className="input__dash"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {
                  if (search.trim()) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 120);
                }}
                placeholder="Buscar personas, grupos o eventos..."
              />
              {showSuggestions && hasSuggestions ? (
                <div className="search_suggestions__dash">
                  {searchUsers.map((user) => (
                    <button
                      type="button"
                      key={user._id}
                      className="suggestion_item__dash"
                      onClick={() => {
                        setSearch(user.nombre);
                        setShowSuggestions(false);
                        navigate(`/dashboard/usuario/${user._id}`);
                      }}
                    >
                      <strong>{user.nombre}</strong>
                      <span>Persona registrada</span>
                    </button>
                  ))}
                  {searchGroups.map((group) => (
                    <button
                      type="button"
                      key={group._id}
                      className="suggestion_item__dash"
                      onClick={() => {
                        setSearch(group.nombre);
                        setShowSuggestions(false);
                        navigate("/grupos");
                      }}
                    >
                      <strong>{group.nombre}</strong>
                      <span>Grupo</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button className="button__dash" onClick={() => navigate("/dashboard/publicar")}>Nueva publicacion</button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export const PostCard = ({ post, onLike, onComment, onDeletePost, onDeleteComment, currentUserId }) => {
  const usuario = post?.usuario || {};
  const postOwnerId = usuario?._id?.toString?.() || "";
  const nombre = usuario.nombre || "Usuario";
  const avatar = usuario.avatar || "https://via.placeholder.com/36";
  const comentarios = Array.isArray(post.comentarios) ? post.comentarios.length : 0;
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  return (
    <article className="post_card__dash">
      <div className="post_meta__dash">
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src={avatar} alt={nombre} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
          <strong>@{nombre}</strong>
        </span>
        <span>Publicacion</span>
      </div>

      {post.texto && <p>{post.texto}</p>}
      {post.imagen && <img src={post.imagen} alt="post" />}
      {post.video ? (
        <video controls className="post_video__dash">
          <source src={post.video} />
          Tu navegador no soporta video.
        </video>
      ) : null}

      <div className="post_meta__dash">
        <span>{post.likes || 0} likes</span>
        <span>{comentarios} comentarios</span>
      </div>

      <div className="post_actions__dash">
        <button type="button" className="post_like_btn__dash" onClick={() => onLike?.(post._id)}>
          Me gusta
        </button>
        {currentUserId && postOwnerId === currentUserId ? (
          <button type="button" className="post_delete_btn__dash" onClick={() => onDeletePost?.(post._id)}>
            Eliminar post
          </button>
        ) : null}
        <button
          type="button"
          className="post_comment_btn__dash"
          onClick={() => setShowComments((prev) => !prev)}
        >
          Comentarios ({comentarios})
        </button>
      </div>

      {showComments ? (
        <>
          <div className="post_comments__dash">
            {(post.comentarios || []).slice(-3).map((comment, index) => {
              const commentOwnerId = comment?.usuarioId?.toString?.() || "";
              const canDelete = Boolean(currentUserId && (commentOwnerId === currentUserId || postOwnerId === currentUserId));
              return (
                <div key={comment?._id || `${post._id}-c-${index}`} className="post_comment_item__dash">
                  <p>
                    <strong>{comment.usuario || "Usuario"}:</strong> {comment.texto}
                  </p>
                  {canDelete && comment?._id ? (
                    <button
                      type="button"
                      className="comment_delete_btn__dash"
                      onClick={() => onDeleteComment?.(post._id, comment._id)}
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="chat_input__dash">
            <input
              className="input__dash"
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
            />
            <button
              className="button__dash"
              type="button"
              onClick={() => {
                const value = commentText.trim();
                if (!value) return;
                onComment?.(post._id, value);
                setCommentText("");
              }}
            >
              Comentar
            </button>
          </div>
        </>
      ) : null}
    </article>
  );
};

export const Feed = ({ refreshKey = 0 }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const cargarPosts = async () => {
      try {
        const res = await obtenerPosts();
        setPosts(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error(error);
      }
    };

    cargarPosts();
  }, [refreshKey]);

  const token = localStorage.getItem("token");
  const currentUserId = getTokenPayload(token)?.id || "";

  const replacePostInState = (updatedPost) => {
    setPosts((prev) => prev.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  };

  const handleLike = async (postId) => {
    try {
      if (!token) return;
      const res = await toggleLikePost(postId, token);
      replacePostInState(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleComment = async (postId, texto) => {
    try {
      if (!token) return;
      const res = await comentarPost(postId, texto, token);
      replacePostInState(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      if (!token) return;
      const confirmed = window.confirm("Estas seguro de eliminar esta publicacion?");
      if (!confirmed) return;
      await eliminarPost(postId, token);
      setPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      if (!token) return;
      const confirmed = window.confirm("Estas seguro de eliminar este comentario?");
      if (!confirmed) return;
      const res = await eliminarComentarioPost(postId, commentId, token);
      replacePostInState(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="stories__dash">
        <div className="story__dash">Tu historia</div>
        <div className="story__dash">Ana</div>
        <div className="story__dash">Diego</div>
        <div className="story__dash">Vale</div>
        <div className="story__dash">CodeClub</div>
      </div>

      <div className="card_grid__dash">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;
