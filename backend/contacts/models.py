from django.db import models
from django.conf import settings
from items.models import Item

class ContactRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Ожидание'),
        ('approved', 'Одобрено'),
        ('declined', 'Отклонено'),
    )

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_contact_requests'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_contact_requests'
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='contact_requests'
    )
    message = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('buyer', 'seller', 'item')  # Один запрос между той же парой по одному товару

    def __str__(self):
        return f"{self.buyer.username} → {self.seller.username} ({self.status})"


class Contact(models.Model):
    request = models.OneToOneField(
        ContactRequest,
        on_delete=models.CASCADE,
        related_name='contact'
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='contacts_as_buyer'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='contacts_as_seller'
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='contacts'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Контакт: {self.buyer.username} ↔ {self.seller.username}"
