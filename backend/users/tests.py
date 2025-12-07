from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from users.models import User


class UserModelTest(TestCase):
    """Тесты для модели User"""

    def setUp(self):
        """Настройка тестовых данных"""
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'testpass123'
        }

    def test_create_user(self):
        """Тест создания обычного пользователя"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.username, 'testuser')
        self.assertTrue(user.check_password('testpass123'))
        self.assertEqual(user.role, 'student')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertEqual(user.rating, 0)

    def test_create_user_without_email(self):
        """Тест создания пользователя без email должен вызвать ошибку"""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email='',
                username='testuser',
                password='testpass123'
            )

    def test_create_superuser(self):
        """Тест создания суперпользователя"""
        superuser = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123'
        )
        self.assertEqual(superuser.role, 'admin')
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)

    def test_user_email_unique(self):
        """Тест уникальности email"""
        User.objects.create_user(**self.user_data)
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email='test@example.com',
                username='anotheruser',
                password='testpass123'
            )

    def test_user_str_representation(self):
        """Тест строкового представления пользователя"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), 'test@example.com')

    def test_user_optional_fields(self):
        """Тест необязательных полей пользователя"""
        user = User.objects.create_user(**self.user_data)
        user.first_name = 'John'
        user.faculty = 'Computer Science'
        user.building = 'Building A'
        user.telegram = '@johndoe'
        user.phone = '+1234567890'
        user.save()
        
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.faculty, 'Computer Science')
        self.assertEqual(user.building, 'Building A')
        self.assertEqual(user.telegram, '@johndoe')
        self.assertEqual(user.phone, '+1234567890')

    def test_user_rating_default(self):
        """Тест значения по умолчанию для рейтинга"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.rating, 0)

    def test_user_role_choices(self):
        """Тест выбора роли пользователя"""
        user = User.objects.create_user(**self.user_data)
        user.role = 'admin'
        user.save()
        self.assertEqual(user.role, 'admin')
        
        # Проверка, что роль по умолчанию - student
        new_user = User.objects.create_user(
            email='new@example.com',
            username='newuser',
            password='testpass123'
        )
        self.assertEqual(new_user.role, 'student')

    def test_user_is_active_default(self):
        """Тест значения по умолчанию для is_active"""
        user = User.objects.create_user(**self.user_data)
        self.assertTrue(user.is_active)

    def test_user_password_setting(self):
        """Тест установки пароля"""
        user = User.objects.create_user(**self.user_data)
        self.assertTrue(user.has_usable_password())
        self.assertTrue(user.check_password('testpass123'))

    def test_user_without_password(self):
        """Тест создания пользователя без пароля"""
        user = User.objects.create_user(
            email='nopass@example.com',
            username='nopassuser',
            password=None
        )
        self.assertFalse(user.has_usable_password())
