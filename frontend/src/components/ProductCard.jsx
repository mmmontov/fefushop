import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoritesAPI } from '../services/api';
import '../styles/ProductCard.css';

export default function ProductCard({ id, title, price, image, condition, seller, status }) {
  const [liked, setLiked] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkIfFavorited();
  }, [id]);

  const checkIfFavorited = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await favoritesAPI.getFavorites();
      const favorite = response.data.find(fav => fav.item.id === id);
      if (favorite) {
        setLiked(true);
        setFavoriteId(favorite.id);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);
    try {
      if (liked && favoriteId) {
        await favoritesAPI.removeFavorite(favoriteId);
        setLiked(false);
        setFavoriteId(null);
      } else {
        const response = await favoritesAPI.addFavorite(id);
        setLiked(true);
        setFavoriteId(response.data.id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Если image уже полный URL, используем его, иначе добавляем префикс
  const imageUrl = image 
    ? (image.startsWith('http://') || image.startsWith('https://') 
        ? image 
        : `http://localhost:8000${image}`)
    : 'https://via.placeholder.com/200x200?text=No+Image';

  const getStatusBadge = () => {
    if (status === 'sold') {
      return <span className="status-badge status-sold">Продан</span>;
    }
    if (status === 'archived') {
      return <span className="status-badge status-archived">Неактуален</span>;
    }
    return null;
  };

  return (
    <Link to={`/product/${id}`} className="product-card">
      <div className="img-wrap">
        <img src={imageUrl} alt={title} />
        {condition && <span className="condition-badge">{condition === 'new' ? 'Новый' : 'Б/У'}</span>}
        {getStatusBadge()}
      </div>

      <button
        className={`heart ${liked ? 'active' : ''}`}
        onClick={handleToggleFavorite}
        disabled={isLoading}
        title={liked ? 'Удалить из избранного' : 'Добавить в избранное'}
      >
        {liked ? '❤️' : '🤍'}
      </button>

      <h3 className="product-title">{title}</h3>
      <p className="price">{price} ₽</p>
      
      {seller && (
        <div className="seller-info">
          <span className="seller-name">{seller.username}</span>
        </div>
      )}
    </Link>
  );
}

