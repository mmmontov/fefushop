from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from users.models import User
from items.models import Category, Item
from contacts.models import ContactRequest, Contact


class ContactRequestModelTest(TestCase):
    """Тесты для модели ContactRequest"""

    def setUp(self):
        """Настройка тестовых данных"""
        self.buyer = User.objects.create_user(
            email='buyer@example.com',
            username='buyer',
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
        self.request_data = {
            'buyer': self.buyer,
            'seller': self.seller,
            'item': self.item,
            'message': 'Хочу купить этот товар'
        }

    def test_create_contact_request(self):
        """Тест создания запроса на контакт"""
        request = ContactRequest.objects.create(**self.request_data)
        self.assertEqual(request.buyer, self.buyer)
        self.assertEqual(request.seller, self.seller)
        self.assertEqual(request.item, self.item)
        self.assertEqual(request.message, 'Хочу купить этот товар')
        self.assertEqual(request.status, 'pending')
        self.assertIsNotNone(request.created_at)

    def test_contact_request_status_default(self):
        """Тест значения по умолчанию для статуса"""
        request = ContactRequest.objects.create(**self.request_data)
        self.assertEqual(request.status, 'pending')

    def test_contact_request_status_choices(self):
        """Тест выбора статуса запроса"""
        request = ContactRequest.objects.create(**self.request_data)
        request.status = 'approved'
        request.save()
        self.assertEqual(request.status, 'approved')
        
        request.status = 'declined'
        request.save()
        self.assertEqual(request.status, 'declined')

    def test_contact_request_unique_together(self):
        """Тест уникальности комбинации buyer, seller, item"""
        ContactRequest.objects.create(**self.request_data)
        with self.assertRaises(IntegrityError):
            ContactRequest.objects.create(**self.request_data)

    def test_contact_request_str_representation(self):
        """Тест строкового представления запроса"""
        request = ContactRequest.objects.create(**self.request_data)
        self.assertIn('buyer', str(request).lower())
        self.assertIn('seller', str(request).lower())
        self.assertIn('pending', str(request).lower())

    def test_contact_request_responded_at(self):
        """Тест поля responded_at"""
        request = ContactRequest.objects.create(**self.request_data)
        self.assertIsNone(request.responded_at)
        
        request.responded_at = timezone.now()
        request.save()
        self.assertIsNotNone(request.responded_at)

    def test_contact_request_empty_message(self):
        """Тест создания запроса с пустым сообщением"""
        request = ContactRequest.objects.create(
            buyer=self.buyer,
            seller=self.seller,
            item=self.item,
            message=''
        )
        self.assertEqual(request.message, '')

    def test_contact_request_cascade_delete_buyer(self):
        """Тест каскадного удаления при удалении покупателя"""
        request = ContactRequest.objects.create(**self.request_data)
        self.buyer.delete()
        self.assertFalse(ContactRequest.objects.filter(id=request.id).exists())

    def test_contact_request_cascade_delete_seller(self):
        """Тест каскадного удаления при удалении продавца"""
        request = ContactRequest.objects.create(**self.request_data)
        self.seller.delete()
        self.assertFalse(ContactRequest.objects.filter(id=request.id).exists())

    def test_contact_request_cascade_delete_item(self):
        """Тест каскадного удаления при удалении товара"""
        request = ContactRequest.objects.create(**self.request_data)
        self.item.delete()
        self.assertFalse(ContactRequest.objects.filter(id=request.id).exists())

    def test_contact_request_created_at_auto_set(self):
        """Тест автоматической установки created_at"""
        before = timezone.now()
        request = ContactRequest.objects.create(**self.request_data)
        after = timezone.now()
        
        self.assertIsNotNone(request.created_at)
        self.assertGreaterEqual(request.created_at, before)
        self.assertLessEqual(request.created_at, after)


class ContactModelTest(TestCase):
    """Тесты для модели Contact"""

    def setUp(self):
        """Настройка тестовых данных"""
        self.buyer = User.objects.create_user(
            email='buyer@example.com',
            username='buyer',
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
            buyer=self.buyer,
            seller=self.seller,
            item=self.item,
            message='Хочу купить'
        )

    def test_create_contact(self):
        """Тест создания контакта"""
        contact = Contact.objects.create(
            request=self.contact_request,
            buyer=self.buyer,
            seller=self.seller,
            item=self.item
        )
        self.assertEqual(contact.request, self.contact_request)
        self.assertEqual(contact.buyer, self.buyer)
        self.assertEqual(contact.seller, self.seller)
        self.assertEqual(contact.item, self.item)
        self.assertIsNotNone(contact.created_at)

    def test_contact_one_to_one_with_request(self):
        """Тест связи один-к-одному с ContactRequest"""
        contact = Contact.objects.create(
            request=self.contact_request,
            buyer=self.buyer,
            seller=self.seller,
            item=self.item
        )
        # Проверяем обратную связь
        self.assertEqual(self.contact_request.contact, contact)

    def test_contact_str_representation(self):
        """Тест строкового представления контакта"""
        contact = Contact.objects.create(
            request=self.contact_request,
            buyer=self.buyer,
            seller=self.seller,
            item=self.item
        )
        self.assertIn('buyer', str(contact).lower())
        self.assertIn('seller', str(contact).lower())

    def test_contact_cascade_delete_request(self):
        """Тест каскадного удаления при удалении запроса"""
        contact = Contact.objects.create(
            request=self.contact_request,
            buyer=self.buyer,
            seller=self.seller,
            item=self.item
        )
        self.contact_request.delete()
        self.assertFalse(Contact.objects.filter(id=contact.id).exists())

    def test_contact_cascade_delete_buyer(self):
        """Тест каскадного удаления при удалении покупателя"""
        contact = Contact.objects.create(
            request=self.contact_request,
            buyer=self.buyer,
            seller=self.seller,
            item=self.item
        )
        self.buyer.delete()
        self.assertFalse(Contact.objects.filter(id=contact.id).exists())

    def test_contact_cascade_delete_seller(self):
        """Тест каскадного удаления при удалении продавца"""
        contact = Contact.objects.create(
            request=self.contact_request,
            buyer=self.buyer,
            seller=self.seller,
            item=self.item
        )
        self.seller.delete()
        self.assertFalse(Contact.objects.filter(id=contact.id).exists())

    def test_contact_cascade_delete_item(self):
        """Тест каскадного удаления при удалении товара"""
        contact = Contact.objects.create(
            request=self.contact_request,
            buyer=self.buyer,
            seller=self.seller,
            item=self.item
        )
        self.item.delete()
        self.assertFalse(Contact.objects.filter(id=contact.id).exists())

    def test_contact_created_at_auto_set(self):
        """Тест автоматической установки created_at"""
        before = timezone.now()
        contact = Contact.objects.create(
            request=self.contact_request,
            buyer=self.buyer,
            seller=self.seller,
            item=self.item
        )
        after = timezone.now()
        
        self.assertIsNotNone(contact.created_at)
        self.assertGreaterEqual(contact.created_at, before)
        self.assertLessEqual(contact.created_at, after)
