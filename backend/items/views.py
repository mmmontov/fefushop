from rest_framework import viewsets, permissions
from .models import Category, Item
from .serializers import CategorySerializer, ItemSerializer
from .permissions import IsOwnerOrReadOnly

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by('-created_at')
    serializer_class = ItemSerializer
    permission_classes = [IsOwnerOrReadOnly]


    def perform_create(self, serializer):
        # При создании автоматически привязываем текущего пользователя как seller
        serializer.save(seller=self.request.user)