import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/Auth.css';

export default function Register({ setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    faculty: '',
    building: '',
    telegram: '',
    phone: '+7',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Форматирование телефона: +7 (xxx) xxx-xx-xx
  const formatPhoneNumber = (value) => {
    // Удаляем все нецифровые символы
    const digits = value.replace(/\D/g, '');
    
    // Если начинается с 7 или 8, заменяем на +7
    let formatted = digits;
    if (formatted.startsWith('8')) {
      formatted = '7' + formatted.slice(1);
    } else if (formatted.startsWith('7')) {
      formatted = formatted;
    } else if (formatted.length > 0) {
      formatted = '7' + formatted;
    }
    
    // Ограничиваем до 11 цифр (7 + 10)
    if (formatted.length > 11) {
      formatted = formatted.slice(0, 11);
    }
    
    // Форматируем: +7 (xxx) xxx-xx-xx
    if (formatted.length === 0) {
      return '+7';
    } else if (formatted.length <= 1) {
      return `+${formatted}`;
    } else if (formatted.length <= 4) {
      return `+7 (${formatted.slice(1)}`;
    } else if (formatted.length <= 7) {
      return `+7 (${formatted.slice(1, 4)}) ${formatted.slice(4)}`;
    } else if (formatted.length <= 9) {
      return `+7 (${formatted.slice(1, 4)}) ${formatted.slice(4, 7)}-${formatted.slice(7)}`;
    } else {
      return `+7 (${formatted.slice(1, 4)}) ${formatted.slice(4, 7)}-${formatted.slice(7, 9)}-${formatted.slice(9, 11)}`;
    }
  };

  // Валидация email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Валидация телефона (должен быть полный номер: +7 (xxx) xxx-xx-xx)
  const validatePhone = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 11 && digits.startsWith('7');
  };

  // Валидация Telegram (должен начинаться с @)
  const validateTelegram = (telegram) => {
    return telegram === '' || telegram.startsWith('@');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Обработка телефона
    if (name === 'phone') {
      // Если пользователь пытается удалить +7, оставляем +7
      if (value === '' || value === '+') {
        processedValue = '+7';
      } else {
        processedValue = formatPhoneNumber(value);
        // Убеждаемся, что всегда начинается с +7
        if (!processedValue.startsWith('+7')) {
          processedValue = '+7';
        }
      }
    }
    
    // Обработка Telegram - автоматически добавляем @ если его нет
    if (name === 'telegram' && value && !value.startsWith('@') && value.length > 0) {
      processedValue = '@' + value.replace(/^@+/, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
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

  const validateForm = () => {
    const errors = {};
    
    // Проверка всех полей на заполненность
    if (!formData.username.trim()) {
      errors.username = 'Имя пользователя обязательно';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email обязателен';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Введите корректный email';
    }
    if (!formData.password.trim()) {
      errors.password = 'Пароль обязателен';
    }
    if (!formData.first_name.trim()) {
      errors.first_name = 'Имя обязательно';
    }
    if (!formData.faculty.trim()) {
      errors.faculty = 'Факультет обязателен';
    }
    if (!formData.building.trim()) {
      errors.building = 'Корпус обязателен';
    }
    if (!formData.telegram.trim()) {
      errors.telegram = 'Telegram обязателен';
    } else if (!validateTelegram(formData.telegram)) {
      errors.telegram = 'Telegram должен начинаться с @';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Телефон обязателен';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Введите корректный номер телефона в формате +7 (xxx) xxx-xx-xx';
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
      await authAPI.register(formData);
      
      // Автоматически входим после регистрации
      const loginResponse = await authAPI.login(formData.email, formData.password);
      localStorage.setItem('access_token', loginResponse.data.access);
      localStorage.setItem('refresh_token', loginResponse.data.refresh);
      
      const userResponse = await authAPI.getCurrentUser();
      setUser(userResponse.data);
      
      navigate('/');
    } catch (err) {
      const errData = err.response?.data;
      if (typeof errData === 'object') {
        const messages = Object.entries(errData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\n');
        setError(messages);
      } else {
        setError('Ошибка при регистрации');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box register-box">
        <h1>Регистрация</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={fieldErrors.username ? 'error' : ''}
                placeholder="username"
              />
              {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={fieldErrors.email ? 'error' : ''}
                placeholder="your@email.com"
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={fieldErrors.password ? 'error' : ''}
              placeholder="••••••••"
            />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">Имя</label>
              <input
                id="first_name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={fieldErrors.first_name ? 'error' : ''}
                placeholder="Иван"
              />
              {fieldErrors.first_name && <span className="field-error">{fieldErrors.first_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="faculty">Факультет</label>
              <input
                id="faculty"
                type="text"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className={fieldErrors.faculty ? 'error' : ''}
                placeholder="ИМКТ"
              />
              {fieldErrors.faculty && <span className="field-error">{fieldErrors.faculty}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="building">Корпус</label>
              <input
                id="building"
                type="text"
                name="building"
                value={formData.building}
                onChange={handleChange}
                className={fieldErrors.building ? 'error' : ''}
                placeholder="8.1"
              />
              {fieldErrors.building && <span className="field-error">{fieldErrors.building}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="telegram">Telegram</label>
              <input
                id="telegram"
                type="text"
                name="telegram"
                value={formData.telegram}
                onChange={handleChange}
                className={fieldErrors.telegram ? 'error' : ''}
                placeholder="@username"
              />
              {fieldErrors.telegram && <span className="field-error">{fieldErrors.telegram}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Телефон</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={fieldErrors.phone ? 'error' : ''}
              placeholder="+7 (900) 123-45-67"
            />
            {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Загрузка...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Уже есть аккаунт? <Link to="/login">Войдите</Link></p>
        </div>
      </div>
    </div>
  );
}
