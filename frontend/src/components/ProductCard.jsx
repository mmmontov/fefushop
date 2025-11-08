import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ProductCard.css";

export default function ProductCard({ id, title, price, image }) {
  const [liked, setLiked] = useState(false);

  return (
    <Link to={`/product/${id}`} className="product-card">
      <div className="img-wrap">
        <img src={image} alt={title} />
      </div>

      {/* Heart Like Button */}
      <div
        className={`heart ${liked ? "active" : ""}`}
        onClick={(e) => {
          e.preventDefault(); // чтобы не переходило по ссылке
          setLiked(!liked);
        }}
      >
        ❤
      </div> 

      <h3 className="product-title">{title}</h3>
      <p className="price">{price} ₽</p>
    </Link>
  );
}
