from rest_framework import viewsets
from .models import Batch, BatchExpense, MortalityRate, CustomerDetail, BatchSale, InfraExpense
from .serializers import BatchSerializer, BatchExpenseSerializer, CustomerDetailSerializer, MortalityRateSerializer, BatchSaleSerializer, InfraExpenseSerializer, BatchSaleDetailSerializer

class BatchViewSet(viewsets.ModelViewSet): # CRUD operations for Batch model
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

class BatchExpenseViewSet(viewsets.ModelViewSet):  # CRUD operations for BatchExpense model 
    queryset =  BatchExpense.objects.all()
    serializer_class = BatchExpenseSerializer


class BatchSaleViewSet(viewsets.ModelViewSet):
    queryset = BatchSale.objects.all()

    def get_serializer_class(self):             # Use nested/detailed serializer for GET requests (list & retrieve)
        if self.action in ['list', 'retrieve']:
            return BatchSaleDetailSerializer     # Use simple serializer for POST/PUT/PATCH requests
        return BatchSaleSerializer 


class MortalityRateViewSet(viewsets.ModelViewSet):  # CRUD operations for MortalityRate model
    queryset = MortalityRate.objects.all()
    serializer_class = MortalityRateSerializer

class InfraExpenseViewSet(viewsets.ModelViewSet):  # CRUD operations for InfraExpense model
    queryset = InfraExpense.objects.all()
    serializer_class = InfraExpenseSerializer

class CustomerDetailViewSet(viewsets.ModelViewSet):  # CRUD operations for CustomerDetail model
    queryset = CustomerDetail.objects.all()
    serializer_class = CustomerDetailSerializer



