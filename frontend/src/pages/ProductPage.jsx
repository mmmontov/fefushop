import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { itemsAPI, contactsAPI, reviewsAPI } from '../services/api';
import '../styles/ProductPage.css';

export default function ProductPage({ user }) {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [seller, setSeller] = useState(null);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [sellerStats, setSellerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactRequested, setContactRequested] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contact, setContact] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [hasReview, setHasReview] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getItemById(id);
      setItem(response.data);
      setSeller(response.data.seller);

      // Fetch seller reviews
      const reviewsResponse = await reviewsAPI.getSellerReviews(response.data.seller.id);
      setSellerReviews(Array.isArray(reviewsResponse.data) ? reviewsResponse.data : []);

      // Fetch seller stats
      const statsResponse = await reviewsAPI.getSellerStats(response.data.seller.id);
      setSellerStats(statsResponse.data);

      // Check if contact is already requested or approved
      if (user) {
        await checkContactStatus(response.data.seller.id);
      }
    } catch (err) {
      setError('Ошибка при загрузке товара');
      console.error(err);
    } finally {
      setLoading(false);
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
        try {
          const reviewsResponse = await reviewsAPI.getReviews({ contact: foundContact.id });
          const userReview = reviewsResponse.data.find(r => r.reviewer?.id === user?.id);
          setHasReview(!!userReview);
        } catch (error) {
          console.error('Error checking review:', error);
        }
      } else {
        setContactVisible(false);
        setContact(null);
      }
    } catch (error) {
      console.error('Error checking contact:', error);
    }
  };

  const handleRequestContact = () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setShowContactModal(true);
  };

  const handleSubmitContactRequest = async () => {
    try {
      await contactsAPI.createContactRequest({
        item_id: id,
        message: contactMessage || `Хотел бы узнать контакты по товару "${item.title}"`
      });
      setContactRequested(true);
      setShowContactModal(false);
      setContactMessage('');
    } catch (err) {
      console.error('Error requesting contact:', err);
      alert('Ошибка при отправке запроса');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!item) return <div className="error-message">Товар не найден</div>;

  // Если image уже полный URL, используем его, иначе добавляем префикс
  const imageUrl = item.image 
    ? (item.image.startsWith('http://') || item.image.startsWith('https://') 
        ? item.image 
        : `http://localhost:8000${item.image}`)
    : 'https://via.placeholder.com/400x400?text=No+Image';

  return (
    <div className="product-page">
      <div className="product-container">
        <div className="product-image">
          <img src={imageUrl} alt={item.title} />
          {item.status !== 'active' && (
            <div className={`status-overlay ${item.status === 'sold' ? 'status-overlay-sold' : 'status-overlay-archived'}`}>
              {item.status === 'sold' ? 'Продан' : 'Неактуален'}
            </div>
          )}
        </div>

        <div className="product-info">
          <h1>{item.title}</h1>
          
          <div className="price-section">
            <p className="price">{item.price} ₽</p>
            <span className="condition">{item.condition === 'new' ? 'Новый' : 'Б/У'}</span>
            {item.status === 'sold' && (
              <span className="status-badge-page status-sold-page">Продан</span>
            )}
            {item.status === 'archived' && (
              <span className="status-badge-page status-archived-page">Неактуален</span>
            )}
          </div>

          <div className="product-details">
            <p><strong>Категория:</strong> {item.category?.name}</p>
            <p><strong>Описание:</strong> {item.description}</p>
            <p><strong>Опубликовано:</strong> {new Date(item.created_at).toLocaleDateString('ru-RU')}</p>
          </div>

          {/* Seller Card */}
          <div className="seller-card">
            <Link to={`/profile/${seller.id}`} className="seller-header">
              {seller.avatar && (
                <img 
                  src={seller.avatar.startsWith('http://') || seller.avatar.startsWith('https://') 
                    ? seller.avatar 
                    : `http://localhost:8000${seller.avatar}`} 
                  alt={seller.username}
                  className="seller-avatar"
                />
              )}
              <div className="seller-info">
                <h3>{seller.username}</h3>
                <p className="seller-rating">⭐ {seller.rating.toFixed(1)} ({sellerStats?.total_reviews || 0} отзывов)</p>
              </div>
            </Link>

            {item.seller.id === user?.id && (
              <div className="seller-status-control">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Статус товара:
                </label>
                <select
                  value={item.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    if (changingStatus) return;
                    setChangingStatus(true);
                    try {
                      const response = await itemsAPI.updateItem(id, { status: newStatus });
                      setItem(response.data);
                      
                    } catch (err) {
                      console.error('Error updating status:', err);
                      
                    } finally {
                      setChangingStatus(false);
                    }
                  }}
                  disabled={changingStatus}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: '2px solid #e0e0e0',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: changingStatus ? 'not-allowed' : 'pointer',
                    backgroundColor: changingStatus ? '#f5f5f5' : 'white',
                    width: '100%',
                    maxWidth: '300px'
                  }}
                >
                  <option value="active">Активен</option>
                  <option value="sold">Продан</option>
                  <option value="archived">Архивирован</option>
                </select>
                {changingStatus && <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Обновление...</p>}
              </div>
            )}

            {item.seller.id !== user?.id && (
              <div className="seller-actions">
                {item.status === 'active' ? (
                  seller.phone || seller.telegram ? (
                    <div className="contact-visible">
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
                  ) : contactRequested ? (
                    <button className="btn-disabled" disabled>Запрос отправлен</button>
                  ) : (
                    <button className="btn-primary" onClick={handleRequestContact}>
                      Запросить контакты
                    </button>
                  )
                ) : (
                  <div className="contact-visible">
                    <p style={{ color: '#dc2626', fontWeight: '600' }}>
                      {item.status === 'sold' ? '⚠️ Этот товар уже продан' : '⚠️ Этот товар неактуален'}
                    </p>
                    <p style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                      Контакты недоступны
                    </p>
                  </div>
                )}
                {showContactModal && (
                  <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <h3>Запрос контактов</h3>
                      <p>Отправьте сообщение продавцу:</p>
                      <textarea
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder={`Хотел бы узнать контакты по товару "${item.title}"`}
                        rows={4}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn-cancel" 
                          onClick={() => {
                            setShowContactModal(false);
                            setContactMessage('');
                          }}
                        >
                          Отмена
                        </button>
                        <button 
                          className="btn-primary" 
                          onClick={handleSubmitContactRequest}
                        >
                          Отправить
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                              const reviewsResponse = await reviewsAPI.getSellerReviews(seller.id);
                              setSellerReviews(Array.isArray(reviewsResponse.data) ? reviewsResponse.data : []);
                              const statsResponse = await reviewsAPI.getSellerStats(seller.id);
                              setSellerStats(statsResponse.data);
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
            )}
          </div>
        </div>
      </div>

      {/* Seller Reviews Section */}
      <div className="reviews-section">
        <h2>Отзывы о продавце</h2>
        {sellerReviews && sellerReviews.length > 0 ? (
          <div className="reviews-list">
            {sellerReviews.slice(0, 5).map(review => (
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

      <div className="back-button">
        <Link to="/">← Вернуться на главную</Link>
      </div>
    </div>
  );
}
