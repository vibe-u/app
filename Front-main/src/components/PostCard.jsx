const PostCard = ({ post }) => {
  const usuario = post?.usuario || {};
  const nombre = usuario.nombre || "Usuario";
  const avatar = usuario.avatar || "https://via.placeholder.com/36";
  const comentarios = Array.isArray(post.comentarios) ? post.comentarios.length : 0;

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

      <div className="post_meta__dash">
        <span>{post.likes || 0} likes</span>
        <span>{comentarios} comentarios</span>
      </div>
    </article>
  );
};

export default PostCard;

