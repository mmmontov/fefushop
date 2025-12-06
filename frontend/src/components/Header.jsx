import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';

export default function Header({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  
  // Определяем, находимся ли мы на главной странице
  const isHomePage = location.pathname === '/';
  
  // Определяем, находимся ли мы на странице формы
  const isFormPage = ['/create-item', '/edit-item'].some(path => 
    location.pathname.startsWith(path)
  );
  
  useEffect(() => {
    // Добавляем класс на body для страниц форм
    if (isFormPage) {
      document.body.classList.add('form-page');
    } else {
      document.body.classList.remove('form-page');
    }
    
    return () => {
      document.body.classList.remove('form-page');
    };
  }, [isFormPage]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setShowMenu(false);
    navigate('/');
  };

  const handleSellClick = () => {
    if (user) {
      navigate('/create-item');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      <header className="header">
        <div className="container header-wrap">
          <Link to="/" className="logo-link">
            <h1 className="logo">FefuShop</h1>
          </Link>

          {isHomePage && (
            <button className="btn-primary sell-btn" onClick={handleSellClick}>
              + Продать
            </button>
          )}

          <div className="header-right">
            {user ? (
              <div className="user-menu">
                <button 
                  className="user-menu-btn"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <img 
                    src={user.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== ''
                      ? (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')
                          ? user.avatar
                          : `http://localhost:8000${user.avatar}`)
                      : '👤'} 
                    alt="Avatar"
                    className="avatar"
                  />
                  <span>{user.username}</span>
                </button>

                {showMenu && (
                  <div className="dropdown-menu">
                    <Link to="/profile" onClick={() => setShowMenu(false)}>
                      Мой профиль
                    </Link>
                    <Link to="/my-items" onClick={() => setShowMenu(false)}>
                      Мои товары
                    </Link>
                    <Link to="/favorites" onClick={() => setShowMenu(false)}>
                      Избранное
                    </Link>
                    <Link to="/contact-requests" onClick={() => setShowMenu(false)}>
                      Запросы контактов
                    </Link>
                    <button className="logout-btn" onClick={handleLogout}>
                      Выход
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="link-btn">
                  Вход
                </Link>
                <Link to="/register" className="btn-primary">
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {isHomePage && (
        <button className="btn-primary sell-mobile" onClick={handleSellClick}>
          + Продать
        </button>
      )}
    </>
  );
}
