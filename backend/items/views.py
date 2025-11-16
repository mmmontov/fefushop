from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Item
from .serializers import CategorySerializer, ItemSerializer, ItemDetailSerializer
from .permissions import IsOwnerOrReadOnly


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        """Разрешить всем смотреть категории, только админ может создавать/менять"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().filter(status='active').order_by('-created_at')
    serializer_class = ItemSerializer
    permission_classes = [IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'category__name']
    ordering_fields = ['price', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ItemDetailSerializer
        return ItemSerializer

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsOwnerOrReadOnly]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_items(self, request):
        """Получить товары текущего пользователя"""
        status = request.query_params.get('status', 'active')
        items = Item.objects.filter(seller=request.user, status=status).order_by('-created_at')
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def seller_items(self, request):
        """Получить товары продавца по его ID"""
        seller_id = request.query_params.get('seller_id')
        if not seller_id:
            return Response({'detail': 'seller_id parameter is required'}, status=400)
        
        # Получаем только активные товары
        items = Item.objects.filter(seller_id=seller_id, status='active').order_by('-created_at')
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)