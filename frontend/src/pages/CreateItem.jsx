import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import '../styles/CreateItem.css';

export default function CreateItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
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
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await itemsAPI.getCategories();
      console.log('Categories loaded:', response.data);
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Ошибка при загрузке категорий');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очистка ошибки для этого поля
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      image: file
    }));
    
    // Очистка ошибки для изображения
    if (fieldErrors.image) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Проверка всех полей на заполненность
    if (!formData.title.trim()) {
      errors.title = 'Название товара обязательно';
    }
    if (!formData.description.trim()) {
      errors.description = 'Описание обязательно';
    }
    if (!formData.price || formData.price <= 0) {
      errors.price = 'Цена обязательна и должна быть больше 0';
    }
    if (!formData.category_id) {
      errors.category_id = 'Категория обязательна';
    }
    if (!formData.image) {
      errors.image = 'Фотография товара обязательна';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    // Валидация формы
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category_id', formData.category_id);
      data.append('condition', formData.condition);
      if (formData.image) {
        data.append('image', formData.image);
      }

      const response = await itemsAPI.createItem(data);
      navigate(`/product/${response.data.id}`);
    } catch (err) {
      setError('Ошибка при создании товара');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-item-container">
      <div className="create-item-box">
        <div className="page-header-with-back">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Назад
          </button>
          <h1>Создать объявление</h1>
        </div>
        
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
              className={fieldErrors.title ? 'error' : ''}
              placeholder="Напишите название товара"
            />
            {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={fieldErrors.description ? 'error' : ''}
              rows="4"
              placeholder="Опишите товар подробнее"
            />
            {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
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
                className={fieldErrors.price ? 'error' : ''}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              {fieldErrors.price && <span className="field-error">{fieldErrors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category_id">Категория</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={fieldErrors.category_id ? 'error' : ''}
                style={{ padding: '10px', borderRadius: '4px', border: fieldErrors.category_id ? '1px solid #dc2626' : '1px solid #bfdbfe', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
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
              {fieldErrors.category_id && <span className="field-error">{fieldErrors.category_id}</span>}
              {categories.length === 0 && !fieldErrors.category_id && <small style={{ color: '#dc2626' }}>⚠️ Категории загружаются...</small>}
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
              className={fieldErrors.image ? 'error' : ''}
              style={fieldErrors.image ? { borderColor: '#dc2626' } : {}}
            />
            {fieldErrors.image && <span className="field-error">{fieldErrors.image}</span>}
            {formData.image && !fieldErrors.image && <p style={{ fontSize: '14px', color: '#2563eb', marginTop: '8px' }}>✓ Выбран файл: {formData.image.name}</p>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Загрузка...' : 'Опубликовать'}
          </button>
        </form>
      </div>
    </div>
  );
}
