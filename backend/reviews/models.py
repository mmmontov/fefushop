from django.db import models
from django.utils import timezone
from django.conf import settings

from users.models import User
from items.models import Item
from contacts.models import Contact

class Review(models.Model):
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='written_reviews'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_reviews'
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    contact = models.OneToOneField(
        Contact,
        on_delete=models.CASCADE,
        related_name='review'
    )

    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        # запрещаем повторные отзывы на один и тот же контакт
        constraints = [
            models.UniqueConstraint(
                fields=['reviewer', 'seller', 'item', 'contact'],
                name='unique_review_per_contact'
            )
        ]

    def __str__(self):
        return f"Review by {self.reviewer.email} → {self.seller.email}"
