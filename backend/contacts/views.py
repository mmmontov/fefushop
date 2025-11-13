from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from django.db import models
from django.utils import timezone
from .models import ContactRequest, Contact
from .serializers import ContactRequestSerializer, ContactSerializer

class ContactRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ContactRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Показываем все запросы, где пользователь — покупатель или продавец
        return ContactRequest.objects.filter(models.Q(buyer=user) | models.Q(seller=user))

    def perform_create(self, serializer):
        item = serializer.validated_data['item']
        seller = item.seller

        if seller == self.request.user:
            raise serializers.ValidationError("Нельзя запрашивать контакты у самого себя.")

        serializer.save(buyer=self.request.user, seller=seller)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Только продавец может менять статус
        if request.user != instance.seller:
            return Response(
                {"detail": "Только продавец может одобрять или отклонять запрос."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Получаем новый статус
        status_value = request.data.get("status")
        if status_value not in ["approved", "declined"]:
            return Response(
                {"detail": "Некорректный статус."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🚫 Если запрос уже обработан — блокируем изменения
        if instance.status in ["approved", "declined"]:
            return Response(
                {"detail": f"Нельзя изменить запрос, который уже {instance.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Обновляем статус и дату ответа
        instance.status = status_value
        instance.responded_at = timezone.now()
        instance.save()

        # ✅ Создаём контакт при первом approved
        if status_value == "approved":
            Contact.objects.get_or_create(
                request=instance,
                buyer=instance.buyer,
                seller=instance.seller,
                item=instance.item
            )

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ContactViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Contact.objects.filter(models.Q(buyer=user) | models.Q(seller=user))
