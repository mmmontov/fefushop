import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import '../styles/CreateItem.css';

export default function EditItem() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    condition: 'new',
    image: null,
  });

  useEffect(() => {
    loadItem();
    loadCategories();
  }, [id]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getItemById(id);
      setFormData({
        title: response.data.title,
        description: response.data.description,
        price: response.data.price,
        category_id: response.data.category?.id || '',
        condition: response.data.condition,
        image: response.data.image,
      });
    } catch (err) {
      setError('Ошибка при загрузке товара');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await itemsAPI.getCategories();
      console.log('Categories loaded:', response.data);
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category_id', formData.category_id);
      data.append('condition', formData.condition);
      if (formData.image && typeof formData.image !== 'string') {
        data.append('image', formData.image);
      }

      await itemsAPI.updateItem(id, data);
      navigate(`/product/${id}`);
    } catch (err) {
      setError('Ошибка при обновлении товара');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="create-item-container">
      <div className="create-item-box">
        <h1>Редактировать объявление</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Название товара</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Напишите название товара"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Опишите товар подробнее"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Цена (₽)</label>
              <input
                id="price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category_id">Категория</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #bfdbfe', cursor: 'pointer' }}
              >
                <option value="">-- Выберите категорию --</option>
                {categories && categories.length > 0 ? (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Категории не найдены</option>
                )}
              </select>
              {categories.length === 0 && <small style={{ color: '#dc2626' }}>⚠️ Категории загружаются...</small>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="condition">Состояние</label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
            >
              <option value="new">Новый</option>
              <option value="used">Б/У</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="image">Фото товара</label>
            <input
              id="image"
              type="file"
              name="image"
              onChange={handleImageChange}
              accept="image/*"
            />
            {formData.image && (
              <p className="file-name">
                {typeof formData.image === 'string' 
                  ? `Текущее фото: ${formData.image}` 
                  : `Выбран файл: ${formData.image.name}`
                }
              </p>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  );
}
