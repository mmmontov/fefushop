from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from users.models import User
from items.models import Category, Item
from favorites.models import Favorite


class FavoriteModelTest(TestCase):
    """Тесты для модели Favorite"""

    def setUp(self):
        """Настройка тестовых данных"""
        self.user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='testpass123'
        )
        self.seller = User.objects.create_user(
            email='seller@example.com',
            username='seller',
            password='testpass123'
        )
        self.category = Category.objects.create(name='Электроника')
        self.item = Item.objects.create(
            title='Телефон',
            description='Описание',
            price=10000.00,
            category=self.category,
            seller=self.seller,
            condition='new'
        )

    def test_create_favorite(self):
        """Тест создания избранного"""
        favorite = Favorite.objects.create(
            user=self.user,
            item=self.item
        )
        self.assertEqual(favorite.user, self.user)
        self.assertEqual(favorite.item, self.item)
        self.assertIsNotNone(favorite.created_at)

    def test_favorite_unique_together(self):
        """Тест уникальности комбинации user и item"""
        Favorite.objects.create(user=self.user, item=self.item)
        with self.assertRaises(IntegrityError):
            Favorite.objects.create(user=self.user, item=self.item)

    def test_favorite_str_representation(self):
        """Тест строкового представления избранного"""
        favorite = Favorite.objects.create(user=self.user, item=self.item)
        self.assertIn('user', str(favorite).lower())
        self.assertIn('Телефон', str(favorite))

    def test_favorite_cascade_delete_user(self):
        """Тест каскадного удаления при удалении пользователя"""
        favorite = Favorite.objects.create(user=self.user, item=self.item)
        self.user.delete()
        self.assertFalse(Favorite.objects.filter(id=favorite.id).exists())

    def test_favorite_cascade_delete_item(self):
        """Тест каскадного удаления при удалении товара"""
        favorite = Favorite.objects.create(user=self.user, item=self.item)
        self.item.delete()
        self.assertFalse(Favorite.objects.filter(id=favorite.id).exists())

    def test_favorite_created_at_auto_set(self):
        """Тест автоматической установки created_at"""
        before = timezone.now()
        favorite = Favorite.objects.create(user=self.user, item=self.item)
        after = timezone.now()
        
        self.assertIsNotNone(favorite.created_at)
        self.assertGreaterEqual(favorite.created_at, before)
        self.assertLessEqual(favorite.created_at, after)

    def test_multiple_users_can_favorite_same_item(self):
        """Тест что несколько пользователей могут добавить один товар в избранное"""
        user2 = User.objects.create_user(
            email='user2@example.com',
            username='user2',
            password='testpass123'
        )
        
        favorite1 = Favorite.objects.create(user=self.user, item=self.item)
        favorite2 = Favorite.objects.create(user=user2, item=self.item)
        
        self.assertNotEqual(favorite1.id, favorite2.id)
        self.assertEqual(favorite1.item, favorite2.item)

    def test_user_can_favorite_multiple_items(self):
        """Тест что пользователь может добавить несколько товаров в избранное"""
        item2 = Item.objects.create(
            title='Ноутбук',
            description='Описание',
            price=50000.00,
            category=self.category,
            seller=self.seller,
            condition='new'
        )
        
        favorite1 = Favorite.objects.create(user=self.user, item=self.item)
        favorite2 = Favorite.objects.create(user=self.user, item=item2)
        
        self.assertNotEqual(favorite1.id, favorite2.id)
        self.assertEqual(favorite1.user, favorite2.user)
        self.assertEqual(self.user.favorites.count(), 2)
