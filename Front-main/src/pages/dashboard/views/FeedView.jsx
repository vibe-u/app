import { useEffect, useState } from "react";
import { Feed } from "../UserDashboard";

const FeedView = () => {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/frase`);
        const data = await res.json();
        if (data?.q) setQuote(data);
      } catch {
        setQuote(null);
      }
    };

    loadQuote();
  }, []);

  return (
    <section className="view__dash feed_view__dash">
      <section className="panel__dash">
        <h3>Bienvenidos</h3>
        {quote ? (
          <p className="feed_quote__dash">
            "{quote.q}" {quote.a ? `- ${quote.a}` : ""}
          </p>
        ) : null}
      </section>
      <Feed />
    </section>
  );
};

export default FeedView;
