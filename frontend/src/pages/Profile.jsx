import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, reviewsAPI } from '../services/api';
import '../styles/Profile.css';

export default function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sellerReviews, setSellerReviews] = useState([]);
  const [sellerStats, setSellerStats] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    email: '',
    faculty: '',
    building: '',
    telegram: '',
    phone: '',
    avatar: null,
  });

  useEffect(() => {
    if (user && user.id) {
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        email: user.email || '',
        faculty: user.faculty || '',
        building: user.building || '',
        telegram: user.telegram || '',
        phone: user.phone || '',
        avatar: user.avatar || null,
      });
      loadSellerData();
    }
  }, [user]);

  const loadSellerData = async () => {
    try {
      const reviewsResponse = await reviewsAPI.getSellerReviews(user.id);
      setSellerReviews(Array.isArray(reviewsResponse.data) ? reviewsResponse.data : []);

      const statsResponse = await reviewsAPI.getSellerStats(user.id);
      setSellerStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading seller data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewAvatar(URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
    }
  };

  const handleNameClick = () => {
    if (!isEditing) {
      setIsEditingName(true);
      setEditingName(user.username);
    }
  };

  const handleNameSave = async () => {
    if (!editingName.trim() || editingName === user.username) {
      setIsEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      const data = new FormData();
      data.append('username', editingName.trim());
      
      const response = await authAPI.updateProfile(data);
      setUser(response.data);
      setIsEditingName(false);
    } catch (err) {
      console.error('Error saving name:', err);
      alert('Ошибка при сохранении имени');
    } finally {
      setSavingName(false);
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const data = new FormData();
      data.append('username', formData.username);
      data.append('first_name', formData.first_name);
      data.append('email', formData.email);
      data.append('faculty', formData.faculty);
      data.append('building', formData.building);
      data.append('telegram', formData.telegram);
      data.append('phone', formData.phone);
      
      // Только добавляем аватар если это новый файл
      if (formData.avatar && typeof formData.avatar !== 'string') {
        data.append('avatar', formData.avatar);
      }

      const response = await authAPI.updateProfile(data);
      setUser(response.data);
      setIsEditing(false);
      setPreviewAvatar(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при сохранении профиля');
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Если avatar уже полный URL, используем его, иначе добавляем префикс
  const avatarUrl = formData.avatar && typeof formData.avatar === 'string' 
    ? (formData.avatar.startsWith('http://') || formData.avatar.startsWith('https://')
        ? formData.avatar
        : `http://localhost:8000${formData.avatar}`)
    : formData.avatar 
    ? URL.createObjectURL(formData.avatar)
    : '👤';

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {typeof avatarUrl === 'string' && avatarUrl.startsWith('http') ? (
              <img src={avatarUrl} alt="Avatar" />
            ) : (
              <span>{avatarUrl}</span>
            )}
          </div>
          
          <div className="profile-header-info">
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="edit-input-large"
              />
            ) : isEditingName ? (
              <div className="inline-edit-name">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleNameKeyDown}
                  className="inline-name-input"
                  autoFocus
                  disabled={savingName}
                />
                {savingName && <span className="saving-indicator">Сохранение...</span>}
              </div>
            ) : (
              <h1 
                className="editable-name"
                onClick={handleNameClick}
                title="Нажмите, чтобы изменить имя"
              >
                {user.username}
              </h1>
            )}
            
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">⭐ {user.rating.toFixed(1)}</span>
                <span className="stat-label">Рейтинг</span>
              </div>
              <div className="stat">
                <span className="stat-value">{sellerStats?.total_reviews || 0}</span>
                <span className="stat-label">Отзывов</span>
              </div>
            </div>

            {!isEditing && (
              <button className="btn-edit-profile" onClick={() => setIsEditing(true)}>
                Редактировать профиль
              </button>
            )}
          </div>
        </div>

        <div className="profile-content">
          {isEditing ? (
            <div className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Имя</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Факультет</label>
                  <input
                    type="text"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Корпус</label>
                  <input
                    type="text"
                    name="building"
                    value={formData.building}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Telegram</label>
                  <input
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Аватар</label>
                <input
                  type="file"
                  name="avatar"
                  onChange={handleAvatarChange}
                  accept="image/*"
                />
                {previewAvatar && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={previewAvatar} alt="Preview" style={{ maxWidth: '100px', borderRadius: '8px' }} />
                  </div>
                )}
              </div>

              <div className="edit-actions">
                <button className="btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                  Отменить
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="info-group">
                <label>Email</label>
                <p>{user.email}</p>
              </div>

              <div className="info-group">
                <label>Факультет</label>
                <p>{user.faculty || '-'}</p>
              </div>

              <div className="info-group">
                <label>Корпус</label>
                <p>{user.building || '-'}</p>
              </div>

              <div className="info-group">
                <label>Telegram</label>
                <p>{user.telegram || '-'}</p>
              </div>

              <div className="info-group">
                <label>Телефон</label>
                <p>{user.phone || '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h2>Отзывы покупателей</h2>
        {sellerReviews.length > 0 ? (
          <div className="reviews-list">
            {sellerReviews.map(review => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <Link to={`/profile/${review.reviewer?.id}`} className="reviewer-name">
                    {review.reviewer?.username}
                  </Link>
                  <span className="review-rating">⭐ {review.rating}/5</span>
                </div>
                <p className="review-comment">{review.comment}</p>
                <small className="review-date">
                  {new Date(review.created_at).toLocaleDateString('ru-RU')}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reviews">Отзывов пока нет</p>
        )}
      </div>
    </div>
  );
}
