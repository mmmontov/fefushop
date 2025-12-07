from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from users.models import User
from notifications.models import Notification


class NotificationModelTest(TestCase):
    """Тесты для модели Notification"""

    def setUp(self):
        """Настройка тестовых данных"""
        self.user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='testpass123'
        )
        self.notification_data = {
            'user': self.user,
            'type': 'contact_request',
            'title': 'Новый запрос на контакт',
            'message': 'У вас новый запрос на контакт'
        }

    def test_create_notification(self):
        """Тест создания уведомления"""
        notification = Notification.objects.create(**self.notification_data)
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.type, 'contact_request')
        self.assertEqual(notification.title, 'Новый запрос на контакт')
        self.assertEqual(notification.message, 'У вас новый запрос на контакт')
        self.assertFalse(notification.is_read)
        self.assertIsNotNone(notification.created_at)

    def test_notification_is_read_default(self):
        """Тест значения по умолчанию для is_read"""
        notification = Notification.objects.create(**self.notification_data)
        self.assertFalse(notification.is_read)

    def test_notification_type_choices(self):
        """Тест выбора типа уведомления"""
        types = [
            'contact_request',
            'request_approved',
            'request_declined',
            'new_review',
            'system'
        ]
        for notif_type in types:
            notification = Notification.objects.create(
                user=self.user,
                type=notif_type,
                title=f'Уведомление {notif_type}',
                message='Тестовое сообщение'
            )
            self.assertEqual(notification.type, notif_type)

    def test_notification_str_representation(self):
        """Тест строкового представления уведомления"""
        notification = Notification.objects.create(**self.notification_data)
        self.assertIn('user@example.com', str(notification))
        self.assertIn('Новый запрос на контакт', str(notification))

    def test_notification_mark_as_read(self):
        """Тест пометки уведомления как прочитанного"""
        notification = Notification.objects.create(**self.notification_data)
        self.assertFalse(notification.is_read)
        
        notification.is_read = True
        notification.save()
        self.assertTrue(notification.is_read)

    def test_notification_cascade_delete_user(self):
        """Тест каскадного удаления при удалении пользователя"""
        notification = Notification.objects.create(**self.notification_data)
        self.user.delete()
        self.assertFalse(Notification.objects.filter(id=notification.id).exists())

    def test_notification_created_at_auto_set(self):
        """Тест автоматической установки created_at"""
        before = timezone.now()
        notification = Notification.objects.create(**self.notification_data)
        after = timezone.now()
        
        self.assertIsNotNone(notification.created_at)
        self.assertGreaterEqual(notification.created_at, before)
        self.assertLessEqual(notification.created_at, after)

    def test_multiple_notifications_for_user(self):
        """Тест создания нескольких уведомлений для одного пользователя"""
        notification1 = Notification.objects.create(**self.notification_data)
        notification2 = Notification.objects.create(
            user=self.user,
            type='new_review',
            title='Новый отзыв',
            message='У вас новый отзыв'
        )
        
        self.assertNotEqual(notification1.id, notification2.id)
        self.assertEqual(notification1.user, notification2.user)
        self.assertEqual(self.user.notifications.count(), 2)

    def test_notification_message_can_be_long(self):
        """Тест что сообщение может быть длинным"""
        long_message = 'A' * 1000
        notification = Notification.objects.create(
            user=self.user,
            type='system',
            title='Системное уведомление',
            message=long_message
        )
        self.assertEqual(len(notification.message), 1000)
