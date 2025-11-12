from django.db import models
from django.conf import settings

from items.models import Item


class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    item = models.ForeignKey(
        Item, 
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta: 
        unique_together = ('user', 'item')
    
    def __str__(self):
        return f'{self.user.username} -> {self.item.title}'