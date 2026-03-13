import { useEffect, useState } from "react";
import { obtenerPosts } from "../Services/posts";
import PostCard from "./PostCard";

const Feed = ({ refreshKey = 0 }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    cargarPosts();
  }, [refreshKey]);

  const cargarPosts = async () => {
    try {
      const res = await obtenerPosts();
      setPosts(Array.isArray(res.data) ? res.data : []);
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
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default Feed;

