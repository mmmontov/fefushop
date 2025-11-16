import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authAPI, reviewsAPI, contactsAPI, itemsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import '../styles/SellerProfile.css';

export default function SellerProfile() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [sellerStats, setSellerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactVisible, setContactVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [contact, setContact] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [hasReview, setHasReview] = useState(false);
  const [sellerItems, setSellerItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    loadSellerData();
    checkUser();
  }, [id]);

  const checkUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userResponse = await authAPI.getCurrentUser();
        setUser(userResponse.data);
        checkContactStatus(parseInt(id));
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
  };

  const checkContactStatus = async (sellerId) => {
    try {
      const contactsResponse = await contactsAPI.getContacts();
      console.log('Contacts response:', contactsResponse.data);
      console.log('Seller ID:', sellerId, 'Type:', typeof sellerId);
      // Проверяем контакты - сравниваем ID как числа
      const foundContact = contactsResponse.data.find(c => {
        const contactSellerId = typeof c.seller.id === 'string' ? parseInt(c.seller.id) : c.seller.id;
        const targetSellerId = typeof sellerId === 'string' ? parseInt(sellerId) : sellerId;
        return contactSellerId === targetSellerId;
      });
      
      if (foundContact) {
        setContact(foundContact);
        setContactVisible(true);
        
        // Проверяем, есть ли уже отзыв для этого контакта
        if (user) {
          try {
            const reviewsResponse = await reviewsAPI.getReviews({ contact: foundContact.id });
            const userReview = reviewsResponse.data.find(r => r.reviewer?.id === user.id);
            setHasReview(!!userReview);
          } catch (error) {
            console.error('Error checking review:', error);
          }
        }
      } else {
        setContactVisible(false);
        setContact(null);
      }
    } catch (error) {
      console.error('Error checking contact:', error);
    }
  };

  const loadSellerData = async () => {
    try {
      setLoading(true);
      const sellerResponse = await authAPI.getUserById(id);
      setSeller(sellerResponse.data);

      const reviewsResponse = await reviewsAPI.getSellerReviews(id);
      setSellerReviews(Array.isArray(reviewsResponse.data) ? reviewsResponse.data : []);

      const statsResponse = await reviewsAPI.getSellerStats(id);
      setSellerStats(statsResponse.data);

      // Загружаем товары продавца
      await loadSellerItems(id);
    } catch (err) {
      setError('Ошибка при загрузке профиля продавца');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSellerItems = async (sellerId) => {
    try {
      setItemsLoading(true);
      const response = await itemsAPI.getSellerItems(sellerId);
      setSellerItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error loading seller items:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!seller) return <div className="error-message">Продавец не найден</div>;

  // Если avatar уже полный URL, используем его, иначе добавляем префикс
  const avatarUrl = seller.avatar 
    ? (seller.avatar.startsWith('http://') || seller.avatar.startsWith('https://')
        ? seller.avatar
        : `http://localhost:8000${seller.avatar}`)
    : '👤';

  return (
    <div className="seller-profile-page">
      <div className="seller-header">
        <div className="seller-avatar-large">
          {typeof avatarUrl === 'string' && avatarUrl.startsWith('http') ? (
            <img src={avatarUrl} alt="Avatar" />
          ) : (
            <span>{avatarUrl}</span>
          )}
        </div>
        
        <div className="seller-info-box">
          <h1>{seller.username}</h1>
          
          <div className="seller-stats">
            <div className="stat">
              <span className="stat-value">⭐ {seller.rating.toFixed(1)}</span>
              <span className="stat-label">Рейтинг</span>
            </div>
            <div className="stat">
              <span className="stat-value">{sellerStats?.total_reviews || 0}</span>
              <span className="stat-label">Отзывов</span>
            </div>
          </div>

          {seller.faculty && (
            <div className="seller-details">
              <p><strong>Факультет:</strong> {seller.faculty}</p>
              {seller.building && <p><strong>Корпус:</strong> {seller.building}</p>}
            </div>
          )}

          {user && user.id !== seller.id && (seller.phone || seller.telegram) && (
            <div className="contact-visible" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '10px' }}>Контакты продавца</h3>
              {seller.phone && <p><strong>📱 Телефон:</strong> {seller.phone}</p>}
              {seller.telegram && <p><strong>💬 Telegram:</strong> {seller.telegram}</p>}
              {!hasReview && contact && (
                <button 
                  className="btn-primary" 
                  onClick={() => setShowReviewModal(true)}
                  style={{ marginTop: '10px' }}
                >
                  Оставить отзыв
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Seller Items Section */}
      <div className="seller-items-section">
        <h2>Товары продавца ({sellerItems.length})</h2>
        {itemsLoading ? (
          <div className="loading">Загрузка товаров...</div>
        ) : sellerItems.length > 0 ? (
          <div className="products-grid">
            {sellerItems.map(item => (
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
        ) : (
          <p className="no-items">У продавца пока нет товаров</p>
        )}
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h2>Отзывы ({sellerStats?.total_reviews || 0})</h2>
        
        {sellerReviews && sellerReviews.length > 0 ? (
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

      {/* Review Modal */}
      {showReviewModal && contact && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Оставить отзыв о продавце</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '16px' }}>
                Оценка: {reviewRating > 0 && <span style={{ color: '#ff6b35', marginLeft: '10px' }}>{reviewRating} из 5</span>}
              </label>
              <div className="rating-stars-container">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    className={`rating-star ${rating <= reviewRating ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setReviewRating(rating);
                    }}
                    title={`${rating} ${rating === 1 ? 'звезда' : rating < 5 ? 'звезды' : 'звезд'}`}
                  >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        fill={rating <= reviewRating ? '#ff6b35' : '#e0e0e0'}
                        stroke={rating <= reviewRating ? '#ff6b35' : '#bdbdbd'}
                        strokeWidth="1"
                      />
                    </svg>
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: '#fff3e0', 
                  borderRadius: '6px',
                  border: '1px solid #ff6b35'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#ff6b35', fontWeight: '600' }}>
                    {reviewRating === 1 && 'Очень плохо'}
                    {reviewRating === 2 && 'Плохо'}
                    {reviewRating === 3 && 'Удовлетворительно'}
                    {reviewRating === 4 && 'Хорошо'}
                    {reviewRating === 5 && 'Отлично'}
                  </p>
                </div>
              )}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Комментарий:</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Оставьте ваш отзыв о продавце..."
                rows={4}
                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn-cancel" 
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewComment('');
                  setReviewRating(0);
                }}
              >
                Отмена
              </button>
              <button 
                className="btn-primary" 
                onClick={async () => {
                  if (reviewRating === 0) {
                    alert('Пожалуйста, выберите оценку');
                    return;
                  }
                  try {
                    await reviewsAPI.createReview({
                      contact: contact.id,
                      rating: reviewRating,
                      comment: reviewComment
                    });
                    setShowReviewModal(false);
                    setReviewComment('');
                    setReviewRating(0);
                    setHasReview(true);
                    // Обновляем отзывы
                    const reviewsResponse = await reviewsAPI.getSellerReviews(id);
                    setSellerReviews(Array.isArray(reviewsResponse.data) ? reviewsResponse.data : []);
                    const statsResponse = await reviewsAPI.getSellerStats(id);
                    setSellerStats(statsResponse.data);
                    // Обновляем данные продавца
                    const sellerResponse = await authAPI.getUserById(id);
                    setSeller(sellerResponse.data);
                    alert('Отзыв успешно добавлен!');
                  } catch (err) {
                    console.error('Error creating review:', err);
                    alert(err.response?.data?.detail || 'Ошибка при создании отзыва');
                  }
                }}
              >
                Отправить отзыв
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
