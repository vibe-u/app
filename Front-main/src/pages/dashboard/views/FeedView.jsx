import { Feed } from "../UserDashboard";

const FeedView = () => {
  return (
    <section className="view__dash feed_view__dash">
      <section className="panel__dash">
        <h3>Bienvenidos</h3>
      </section>
      <Feed />
    </section>
  );
};

export default FeedView;
