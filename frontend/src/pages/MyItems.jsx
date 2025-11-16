import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import '../styles/MyItems.css';

export default function MyItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    loadUserItems();
  }, [filter]);

  const loadUserItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getMyItems(filter);
      const userItems = response.data.results ? response.data.results : Array.isArray(response.data) ? response.data : [];
      setItems(userItems);
    } catch (err) {
      setError('Ошибка при загрузке товаров');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Вы уверены?')) return;
    
    try {
      await itemsAPI.deleteItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Ошибка при удалении');
    }
  };

  const handleEdit = (itemId) => {
    navigate(`/edit-item/${itemId}`);
  };

  return (
    <div className="my-items-page">
      <h1>Мои товары</h1>
      
      <div className="filter-tabs">
        {['active', 'sold', 'archived'].map(status => (
          <button
            key={status}
            className={`tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'active' ? 'Активные' : status === 'sold' ? 'Проданные' : 'Архивированные'}
          </button>
        ))}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Загрузка...</div>}
      
      {!loading && items.length > 0 ? (
        <div className="items-table">
          {items.map(item => {
            // Если image уже полный URL, используем его, иначе добавляем префикс
            const imageUrl = item.image 
              ? (item.image.startsWith('http://') || item.image.startsWith('https://') 
                  ? item.image 
                  : `http://localhost:8000${item.image}`)
              : 'https://via.placeholder.com/80x80?text=No+Image';
            return (
              <div key={item.id} className="item-row">
                <Link to={`/product/${item.id}`} className="item-image">
                  <img src={imageUrl} alt={item.title} />
                </Link>
                <div className="item-info">
                  <Link to={`/product/${item.id}`}>
                    <h3>{item.title}</h3>
                  </Link>
                  <p className="item-meta">
                    <span>{item.price} ₽</span>
                    <span>{item.condition === 'new' ? 'Новый' : 'Б/У'}</span>
                  </p>
                </div>
                <div className="item-actions">
                  <button className="btn-edit" onClick={() => handleEdit(item.id)}>
                    Редактировать
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(item.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && <div className="no-items"><p>Товары не найдены</p></div>
      )}
    </div>
  );
}
