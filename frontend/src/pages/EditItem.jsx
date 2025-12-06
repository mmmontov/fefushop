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
    images: [],
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    loadItem();
    loadCategories();
  }, [id]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getItemById(id);
      const item = response.data;
      
      setFormData({
        title: item.title,
        description: item.description,
        price: item.price,
        category_id: item.category?.id || '',
        condition: item.condition,
        images: [],
      });
      
      // Загружаем существующие изображения
      if (item.images && item.images.length > 0) {
        setExistingImages(item.images);
      } else if (item.image) {
        // Обратная совместимость: если есть старое поле image
        setExistingImages([{ image: item.image, id: 'old' }]);
      }
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
    const files = Array.from(e.target.files);
    
    // Валидация: максимум 4 изображения (существующие + новые)
    const totalImages = existingImages.length + files.length;
    if (totalImages > 4) {
      setError('Можно загрузить максимум 4 изображения');
      return;
    }
    
    setNewImages(files);
    
    // Создаем превью для новых изображений
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeExistingImage = (imageId) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const removeNewImage = (index) => {
    const newFiles = newImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Освобождаем память от старых превью
    URL.revokeObjectURL(imagePreviews[index]);
    
    setNewImages(newFiles);
    setImagePreviews(newPreviews);
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
      
      // Валидация: минимум 1 изображение должно остаться
      const totalImages = existingImages.length + newImages.length;
      if (totalImages === 0) {
        setError('Необходимо оставить хотя бы одно изображение');
        setSaving(false);
        return;
      }
      
      // Если есть новые изображения, заменяем все старые
      if (newImages.length > 0) {
        newImages.forEach((image) => {
          data.append('images', image);
        });
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
        <div className="page-header-with-back">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Назад
          </button>
          <h1>Редактировать объявление</h1>
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
            <label htmlFor="images">Фото товара (от 1 до 4)</label>
            <input
              id="images"
              type="file"
              name="images"
              onChange={handleImageChange}
              accept="image/*"
              multiple
            />
            
            {/* Существующие изображения */}
            {existingImages.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                  Текущие изображения ({existingImages.length}):
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  {existingImages.map((img) => {
                    const imageUrl = img.image && typeof img.image === 'string' && img.image.trim() !== ''
                      ? (img.image.startsWith('http://') || img.image.startsWith('https://')
                          ? img.image
                          : `http://localhost:8000${img.image}`)
                      : 'https://via.placeholder.com/100x100?text=No+Image';
                    
                    return (
                      <div key={img.id} style={{ position: 'relative', border: '1px solid #bfdbfe', borderRadius: '4px', overflow: 'hidden' }}>
                        <img 
                          src={imageUrl} 
                          alt="Existing" 
                          style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
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
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Новые изображения */}
            {newImages.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ fontSize: '14px', color: '#2563eb', marginBottom: '10px' }}>
                  Новые изображения ({newImages.length}):
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
                        onClick={() => removeNewImage(index)}
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
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  Всего изображений: {existingImages.length + newImages.length} / 4
                </p>
              </div>
            )}
            
            {existingImages.length === 0 && newImages.length === 0 && (
              <p style={{ fontSize: '14px', color: '#dc2626', marginTop: '8px' }}>
                ⚠️ Необходимо загрузить хотя бы одно изображение
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
