import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contactsAPI } from '../services/api';
import '../styles/ContactRequests.css';

export default function ContactRequests({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await contactsAPI.getContactRequests();
      setRequests(response.data);
    } catch (err) {
      setError('Ошибка при загрузке запросов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await contactsAPI.approveContactRequest(requestId);
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      ));
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Ошибка при одобрении');
    }
  };

  const handleDecline = async (requestId) => {
    try {
      await contactsAPI.declineContactRequest(requestId);
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'declined' } : req
      ));
    } catch (err) {
      console.error('Error declining request:', err);
      alert('Ошибка при отклонении');
    }
  };

  const filteredRequests = requests.filter(req => req.status === filter);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'В ожидании', color: '#ff9800' },
      approved: { text: 'Одобрено', color: '#4caf50' },
      declined: { text: 'Отклонено', color: '#f44336' }
    };
    return badges[status];
  };

  return (
    <div className="contact-requests-page">
      <h1>Запросы контактов</h1>
      
      <div className="filter-tabs">
        {['pending', 'approved', 'declined'].map(status => (
          <button
            key={status}
            className={`tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {getStatusBadge(status).text}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Загрузка...</div>}

      {!loading && filteredRequests.length > 0 ? (
        <div className="requests-list">
          {filteredRequests.map(req => {
            // Если image уже полный URL, используем его, иначе добавляем префикс
            const imageUrl = req.item.image 
              ? (req.item.image.startsWith('http://') || req.item.image.startsWith('https://') 
                  ? req.item.image 
                  : `http://localhost:8000${req.item.image}`)
              : 'https://via.placeholder.com/80x80?text=No+Image';
            
            return (
              <div key={req.id} className="request-card">
                <div className="request-card-top">
                  <div className="request-item-info">
                    <Link to={`/product/${req.item.id}`}>
                      <img src={imageUrl} alt={req.item.title} className="item-image" />
                    </Link>
                    <div className="item-details">
                      <Link to={`/product/${req.item.id}`}>
                        <h3>{req.item.title}</h3>
                      </Link>
                      <p className="item-price">{req.item.price} ₽</p>
                      <p className="user-name">
                        {req.buyer 
                          ? (
                            <>
                              От: <Link to={`/profile/${req.buyer.id}`}>{req.buyer.username}</Link>
                            </>
                          )
                          : (
                            <>
                              Кому: <Link to={`/profile/${req.seller.id}`}>{req.seller.username}</Link>
                            </>
                          )
                        }
                      </p>
                    </div>
                  </div>

                  <div className="request-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusBadge(req.status).color }}
                    >
                      {getStatusBadge(req.status).text}
                    </span>
                  </div>

                  {req.status === 'pending' && user && req.seller && req.seller.id === user.id && (
                    <div className="request-actions">
                      <button 
                        className="btn-approve"
                        onClick={() => handleApprove(req.id)}
                      >
                        ✓ Одобрить
                      </button>
                      <button 
                        className="btn-decline"
                        onClick={() => handleDecline(req.id)}
                      >
                        ✕ Отклонить
                      </button>
                    </div>
                  )}
                </div>
                {req.message && (
                  <div className="request-message">
                    <p><strong>Сообщение:</strong> {req.message}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !loading && <div className="no-items"><p>Запросов не найдено</p></div>
      )}
    </div>
  );
}
