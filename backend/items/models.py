from django.db import models
from django.utils.text import slugify
from django.conf import settings
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
    image = models.CharField(max_length=500, blank=True, null=True)  
    condition = models.CharField(max_length=10, choices=CONDITION_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title