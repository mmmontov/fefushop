import { useState, useEffect } from 'react';
import { itemsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import Hero from '../components/Hero';
import '../styles/Home.css';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [page]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getItems({ 
        status: 'active',
        page: page,
        limit: 12
      });
      
      if (page === 1) {
        setItems(response.data.results || response.data);
      } else {
        setItems(prev => [...prev, ...response.data.results || response.data]);
      }
      
      setHasMore(!!response.data.next);
    } catch (err) {
      setError('Ошибка при загрузке товаров');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <>
      <Hero />
      <div className="container">
        <div className="home-header">
          <h2>Объявления</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="products-grid">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              title={item.title}
              price={item.price}
              image={item.image}
              condition={item.condition}
              seller={item.seller}
            />
          ))}
        </div>

        {loading && <div className="loading">Загрузка...</div>}
        
        {hasMore && !loading && (
          <div className="load-more-container">
            <button className="btn-primary load-btn" onClick={handleLoadMore}>
              Загрузить ещё
            </button>
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="no-items">
            <p>Товаров не найдено</p>
          </div>
        )}
      </div>
    </>
  );
}

