from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from django.db import models

from .models import Review
from .serializers import ReviewSerializer

class IsReviewerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.reviewer == request.user


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsReviewerOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        # Покупатель видит свои отзывы
        # Продавец видит отзывы о себе
        return Review.objects.filter(
            models.Q(reviewer=user) | models.Q(seller=user)
        ).select_related('seller', 'reviewer', 'item', 'contact')

    @action(detail=False, methods=["get"], url_path="seller/(?P<seller_id>[^/.]+)")
    def seller_reviews(self, request, seller_id=None):
        reviews = Review.objects.filter(seller_id=seller_id)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

# class SellerReviewsView(APIView):
#     permission_classes = [AllowAny]  # или IsAuthenticated, если надо

#     def get(self, request, seller_id):
#         reviews = Review.objects.filter(seller_id=seller_id).order_by("-created_at")
#         serializer = ReviewSerializer(reviews, many=True)
#         return Response(serializer.data)
