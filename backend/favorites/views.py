from rest_framework import viewsets, permissions
from .models import Favorite
from .serializers import FavoriteSerializer

class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Пользователь видит только свои избранные товары
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Привязываем избранное к текущему пользователю
        serializer.save(user=self.request.user)
