from rest_framework.routers import DefaultRouter
from .views import ContactRequestViewSet, ContactViewSet

router = DefaultRouter()
router.register(r'contact-requests', ContactRequestViewSet, basename='contactrequest')
router.register(r'contacts', ContactViewSet, basename='contact')

urlpatterns = router.urls
