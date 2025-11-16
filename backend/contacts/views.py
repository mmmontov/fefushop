from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from django.db import models
from django.utils import timezone

from .models import ContactRequest, Contact
from .serializers import ContactRequestSerializer, ContactSerializer
from notifications.models import Notification


class ContactRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ContactRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ContactRequest.objects.filter(
            models.Q(buyer=user) | models.Q(seller=user)
        )

    def perform_create(self, serializer):
        item = serializer.validated_data['item']
        seller = item.seller

        if seller == self.request.user:
            raise serializers.ValidationError("Нельзя запрашивать контакты у самого себя.")

        instance = serializer.save(buyer=self.request.user, seller=seller)

        # 🔔 Уведомление продавцу о новом запросе
        Notification.objects.create(
            user=seller,
            type="contact_request",
            title="Новый запрос на контакт",
            message=f"Пользователь {instance.buyer.username} хочет связаться по товару '{instance.item.title}'."
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Только продавец может менять статус
        if request.user != instance.seller:
            return Response(
                {"detail": "Только продавец может одобрять или отклонять запрос."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Новый статус
        status_value = request.data.get("status")
        if status_value not in ["approved", "declined"]:
            return Response(
                {"detail": "Некорректный статус."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🚫 Запрещаем менять уже обработанные запросы
        if instance.status in ["approved", "declined"]:
            return Response(
                {"detail": f"Нельзя изменить запрос, который уже {instance.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Обновляем статус
        instance.status = status_value
        instance.responded_at = timezone.now()
        instance.save()

        # ---------- APPROVED ----------
        if status_value == "approved":
            # создаём контакт только один раз
            Contact.objects.get_or_create(
                request=instance,
                buyer=instance.buyer,
                seller=instance.seller,
                item=instance.item
            )

            # 🔔 уведомление покупателю
            Notification.objects.create(
                user=instance.buyer,
                type="request_approved",
                title="Ваш запрос одобрен",
                message=f"Продавец {instance.seller.username} одобрил ваш запрос по товару '{instance.item.title}'."
            )

        # ---------- DECLINED ----------
        if status_value == "declined":
            # 🔔 уведомление покупателю
            Notification.objects.create(
                user=instance.buyer,
                type="request_declined",
                title="Ваш запрос отклонён",
                message=f"Продавец {instance.seller.username} отклонил ваш запрос по товару '{instance.item.title}'."
            )

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ContactViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Contact.objects.filter(
            models.Q(buyer=user) | models.Q(seller=user)
        )
