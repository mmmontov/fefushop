from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.conf import settings
from datetime import timedelta
from users.models import User

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Item(models.Model):
    CONDITION_CHOICES = (
        ('new', 'Новый'),
        ('used', 'Б/У'),
    )

    STATUS_CHOICES = (
        ('active', 'Активен'),
        ('sold', 'Продан'),
        ('archived', 'Архивирован'),
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='items')
    condition = models.CharField(max_length=10, choices=CONDITION_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    @property
    def image(self):
        """Обратная совместимость: возвращаем первое изображение"""
        first_image = self.images.first()
        return first_image.image if first_image else None
    
    def check_and_archive_if_old(self):
        """Проверяет, прошло ли 30 дней с момента создания, и архивирует объявление если нужно"""
        if self.status == 'active':
            thirty_days_ago = timezone.now() - timedelta(days=30)
            if self.created_at < thirty_days_ago:
                self.status = 'archived'
                self.save(update_fields=['status'])
                return True
        return False
    
    @classmethod
    def archive_old_items(cls):
        """Архивирует все объявления старше 30 дней"""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        old_items = cls.objects.filter(
            status='active',
            created_at__lt=thirty_days_ago
        )
        count = old_items.update(status='archived')
        return count


class ItemImage(models.Model):
    """Модель для хранения нескольких изображений товара"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='items/')
    order = models.PositiveIntegerField(default=0, help_text='Порядок отображения изображения')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = 'Изображение товара'
        verbose_name_plural = 'Изображения товаров'

    def __str__(self):
        return f'{self.item.title} - Image {self.order}'