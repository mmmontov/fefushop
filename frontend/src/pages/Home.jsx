import { useState, useEffect, useMemo } from 'react';
import { itemsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import Hero from '../components/Hero';
import '../styles/Home.css';

export default function Home() {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [conditionFilter, setConditionFilter] = useState('');

  useEffect(() => {
    loadCategories();
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getItems({ 
        status: 'active'
      });
      
      setAllItems(response.data.results || response.data || []);
    } catch (err) {
      setError('Ошибка при загрузке товаров');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await itemsAPI.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // Фильтрация товаров на фронтенде
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Поиск по названию
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Фильтр по категории
      if (selectedCategory && item.category?.id !== parseInt(selectedCategory)) {
        return false;
      }

      // Фильтр по цене
      if (priceRange.min && item.price < parseFloat(priceRange.min)) {
        return false;
      }
      if (priceRange.max && item.price > parseFloat(priceRange.max)) {
        return false;
      }

      // Фильтр по состоянию
      if (conditionFilter && item.condition !== conditionFilter) {
        return false;
      }

      return true;
    });
  }, [allItems, searchQuery, selectedCategory, priceRange, conditionFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setConditionFilter('');
  };

  return (
    <>
      <Hero />
      <div className="container">
        <div className="home-header">
          <h2>Объявления</h2>
        </div>

        {/* Фильтры и поиск */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label>Категория</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">Все категории</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Состояние</label>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Все</option>
                <option value="new">Новый</option>
                <option value="used">Б/У</option>
              </select>
            </div>

            <div className="filter-group price-filter">
              <label>Цена от</label>
              <input
                type="number"
                placeholder="0"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="price-input"
                min="0"
              />
            </div>

            <div className="filter-group price-filter">
              <label>Цена до</label>
              <input
                type="number"
                placeholder="∞"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="price-input"
                min="0"
              />
            </div>

            <button 
              className="btn-reset-filters" 
              onClick={handleResetFilters}
              title="Сбросить фильтры"
            >
              Сбросить
            </button>
          </div>

          {filteredItems.length !== allItems.length && (
            <div className="filter-results-info">
              Найдено: {filteredItems.length} из {allItems.length}
            </div>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : (
          <>
            <div className="products-grid">
              {filteredItems.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              title={item.title}
              price={item.price}
              image={item.image}
              condition={item.condition}
              seller={item.seller}
              status={item.status}
            />
              ))}
            </div>

            {filteredItems.length === 0 && !loading && (
              <div className="no-items">
                <p>Товаров не найдено</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

