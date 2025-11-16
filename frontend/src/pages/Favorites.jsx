import { useState, useEffect } from 'react';
import { favoritesAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import '../styles/Favorites.css';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoritesAPI.getFavorites();
      setFavorites(response.data);
    } catch (err) {
      setError('Ошибка при загрузке избранного');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favoriteId) => {
    try {
      await favoritesAPI.removeFavorite(favoriteId);
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  return (
    <div className="favorites-page">
      <h1>Избранное</h1>
      
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Загрузка...</div>}
      
      {!loading && favorites.length > 0 ? (
        <div className="products-grid">
          {favorites.map(favorite => (
            <div key={favorite.id} className="favorite-item">
              <ProductCard
                id={favorite.item.id}
                title={favorite.item.title}
                price={favorite.item.price}
                image={favorite.item.image}
                condition={favorite.item.condition}
                seller={favorite.item.seller}
              />

            </div>
          ))}
        </div>
      ) : (
        !loading && <div className="no-items"><p>Избранное пусто</p></div>
      )}
    </div>
  );
}
