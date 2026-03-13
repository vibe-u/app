import Feed from "../../../components/Feed";

const FeedView = () => {
  return (
    <section className="view__dash">
      <section className="panel__dash">
        <h3>Bienvenida</h3>
        <p>Aqui ves publicaciones de tu comunidad universitaria.</p>
      </section>
      <Feed />
    </section>
  );
};

export default FeedView;

