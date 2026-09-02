from django.urls import path, include
from .views import BatchViewSet, BatchExpenseViewSet, MortalityRateViewSet, CustomerDetailViewSet, BatchSaleViewSet, InfraExpenseViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'batch-expenses', BatchExpenseViewSet, basename='batch-expense')
router.register(r'mortality-rates', MortalityRateViewSet, basename='mortality-rate')
router.register(r'customer-details', CustomerDetailViewSet, basename='customer-detail')
router.register(r'batch-sales', BatchSaleViewSet, basename='batch-sale')
router.register(r'infra-expenses', InfraExpenseViewSet, basename='infra-expense')

urlpatterns = [
    path('api/', include(router.urls)),
]