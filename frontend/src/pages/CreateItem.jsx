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
    images: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);

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
    const files = Array.from(e.target.files);
    
    // Валидация: максимум 4 изображения
    if (files.length > 4) {
      setFieldErrors(prev => ({
        ...prev,
        images: 'Можно загрузить максимум 4 изображения'
      }));
      return;
    }
    
    // Валидация: минимум 1 изображение
    if (files.length === 0) {
      setFieldErrors(prev => ({
        ...prev,
        images: 'Необходимо загрузить хотя бы одно изображение'
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      images: files
    }));
    
    // Создаем превью для отображения
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    
    // Очистка ошибки для изображения
    if (fieldErrors.images) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Освобождаем память от старых превью
    URL.revokeObjectURL(imagePreviews[index]);
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    setImagePreviews(newPreviews);
    
    // Очистка ошибки если изображения есть
    if (newImages.length > 0 && fieldErrors.images) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
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
    if (formData.images.length === 0) {
      errors.images = 'Необходимо загрузить хотя бы одно изображение';
    }
    if (formData.images.length > 4) {
      errors.images = 'Можно загрузить максимум 4 изображения';
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
      
      // Добавляем все изображения
      formData.images.forEach((image) => {
        data.append('images', image);
      });

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
            <label htmlFor="images">Фото товара (от 1 до 4)</label>
            <input
              id="images"
              type="file"
              name="images"
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className={fieldErrors.images ? 'error' : ''}
              style={fieldErrors.images ? { borderColor: '#dc2626' } : {}}
            />
            {fieldErrors.images && <span className="field-error">{fieldErrors.images}</span>}
            {formData.images.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ fontSize: '14px', color: '#2563eb', marginBottom: '10px' }}>
                  ✓ Выбрано изображений: {formData.images.length} / 4
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} style={{ position: 'relative', border: '1px solid #bfdbfe', borderRadius: '4px', overflow: 'hidden' }}>
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: 'rgba(220, 38, 38, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Загрузка...' : 'Опубликовать'}
          </button>
        </form>
      </div>
    </div>
  );
}
