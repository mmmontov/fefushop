from rest_framework.routers import DefaultRouter
from django.contrib import admin
from django.urls import path, include

from .views import ReviewViewSet

router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = router.urls

# urlpatterns = [
#     path('reviews/seller/<int:seller_id>/', SellerReviewsView.as_view(), name='seller-reviews'),
# ]

# urlpatterns += router.urls