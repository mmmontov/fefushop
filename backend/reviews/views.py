from rest_framework.response import Response
from rest_framework.permissions import AllowAny  
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.db import models
from django.db.models import Avg

from .models import Review
from .serializers import ReviewSerializer
from notifications.models import Notification
from users.models import User


class IsReviewerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.reviewer == request.user


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsReviewerOrReadOnly]

    def get_queryset(self):
        return Review.objects.all().select_related('seller', 'reviewer', 'item', 'contact')

    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsReviewerOrReadOnly]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        review = serializer.save()
        
        # Обновляем рейтинг продавца
        avg_rating = Review.objects.filter(seller=review.seller).aggregate(Avg('rating'))['rating__avg']
        if avg_rating:
            review.seller.rating = round(avg_rating, 2)
            review.seller.save()
        
        # 🔔 Уведомление продавцу о новом отзыве
        Notification.objects.create(
            user=review.seller,
            type="new_review",
            title="Новый отзыв",
            message=f"Пользователь {review.reviewer.username} оставил отзыв о вас с рейтингом {review.rating}/5."
        )

    @action(detail=False, methods=["get"], url_path="seller/(?P<seller_id>[^/.]+)")
    def seller_reviews(self, request, seller_id=None):
        """Получить все отзывы о продавце"""
        reviews = Review.objects.filter(seller_id=seller_id).order_by('-created_at')
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def seller_stats(self, request):
        """Получить статистику рейтинга продавца"""
        seller_id = request.query_params.get('seller_id')
        if not seller_id:
            return Response({"error": "seller_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        reviews = Review.objects.filter(seller_id=seller_id)
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
        
        return Response({
            'seller_id': seller_id,
            'average_rating': avg_rating or 0,
            'total_reviews': reviews.count()
        })

