from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from users.models import User
from items.models import Category, Item
from contacts.models import ContactRequest, Contact
from reviews.models import Review


class ReviewModelTest(TestCase):
    """Тесты для модели Review"""

    def setUp(self):
        """Настройка тестовых данных"""
        self.reviewer = User.objects.create_user(
            email='reviewer@example.com',
            username='reviewer',
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
        self.contact_request = ContactRequest.objects.create(
            buyer=self.reviewer,
            seller=self.seller,
            item=self.item,
            message='Хочу купить'
        )
        self.contact = Contact.objects.create(
            request=self.contact_request,
            buyer=self.reviewer,
            seller=self.seller,
            item=self.item
        )

    def test_create_review(self):
        """Тест создания отзыва"""
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=5,
            comment='Отличный продавец!'
        )
        self.assertEqual(review.reviewer, self.reviewer)
        self.assertEqual(review.seller, self.seller)
        self.assertEqual(review.item, self.item)
        self.assertEqual(review.contact, self.contact)
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.comment, 'Отличный продавец!')
        self.assertIsNotNone(review.created_at)

    def test_review_rating_positive_small_integer(self):
        """Тест что рейтинг - положительное маленькое целое"""
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=5
        )
        self.assertIsInstance(review.rating, int)
        self.assertGreater(review.rating, 0)

    def test_review_empty_comment(self):
        """Тест создания отзыва с пустым комментарием"""
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=4,
            comment=''
        )
        self.assertEqual(review.comment, '')

    def test_review_str_representation(self):
        """Тест строкового представления отзыва"""
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=5
        )
        self.assertIn('reviewer@example.com', str(review))
        self.assertIn('seller@example.com', str(review))

    def test_review_one_to_one_with_contact(self):
        """Тест связи один-к-одному с Contact"""
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=5
        )
        # Проверяем обратную связь
        self.assertEqual(self.contact.review, review)

    def test_review_unique_constraint(self):
        """Тест уникальности комбинации reviewer, seller, item, contact"""
        Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=5
        )
        with self.assertRaises(IntegrityError):
            Review.objects.create(
                reviewer=self.reviewer,
                seller=self.seller,
                item=self.item,
                contact=self.contact,
                rating=4
            )

    def test_review_cascade_delete_reviewer(self):
        """Тест каскадного удаления при удалении рецензента"""
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=5
        )
        self.reviewer.delete()
        self.assertFalse(Review.objects.filter(id=review.id).exists())

    def test_review_cascade_delete_seller(self):
        """Тест каскадного удаления при удалении продавца"""
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=5
        )
        self.seller.delete()
        self.assertFalse(Review.objects.filter(id=review.id).exists())

    def test_review_cascade_delete_item(self):
        """Тест каскадного удаления при удалении товара"""
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=5
        )
        self.item.delete()
        self.assertFalse(Review.objects.filter(id=review.id).exists())

    def test_review_cascade_delete_contact(self):
        """Тест каскадного удаления при удалении контакта"""
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=5
        )
        self.contact.delete()
        self.assertFalse(Review.objects.filter(id=review.id).exists())

    def test_review_created_at_default(self):
        """Тест значения по умолчанию для created_at"""
        before = timezone.now()
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=5
        )
        after = timezone.now()
        
        self.assertIsNotNone(review.created_at)
        self.assertGreaterEqual(review.created_at, before)
        self.assertLessEqual(review.created_at, after)

    def test_review_rating_range(self):
        """Тест диапазона рейтинга"""
        # PositiveSmallIntegerField обычно от 0 до 32767
        # Но для рейтинга обычно используется 1-5
        review = Review.objects.create(
            reviewer=self.reviewer,
            seller=self.seller,
            item=self.item,
            contact=self.contact,
            rating=1
        )
        self.assertEqual(review.rating, 1)
        
        review.rating = 5
        review.save()
        self.assertEqual(review.rating, 5)
