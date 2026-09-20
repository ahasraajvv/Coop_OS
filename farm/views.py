from django.db.models.aggregates import Sum, Count
from django.db.models.functions import TruncWeek
from rest_framework import viewsets
from .models import Batch, BatchExpense, MortalityRate, CustomerDetail, BatchSale, InfraExpense
from .serializers import BatchSerializer, BatchExpenseSerializer, CustomerDetailSerializer, MortalityRateSerializer, BatchSaleSerializer, InfraExpenseSerializer, BatchSaleDetailSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

class BatchViewSet(viewsets.ModelViewSet): # CRUD operations for Batch model
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

    @action (detail = True, methods =["get"])
    def BatchRevenue(self,request,pk=None):
        batch = self.get_object()
        total_sales_of_a_batch  = batch.batchsale_set.aggregate(total = Sum('amount'))['total'] or 0 

        return Response({
            "batch_no" :  batch.batch_no,
            "total_revenue" : total_sales_of_a_batch

        })

    @action (detail=True,methods =['get'])
    def BatchExpense(self,request,pk=None):
        batch = self.get_object()
        total_expense_of_a_batch = batch.batchexpense_set.aggregate(total=Sum('amount'))['total'] or 0
        return Response({
            'batch_no':batch.batch_no,
            'total_expenses': total_expense_of_a_batch 

        })

    @action (detail = True, methods =['get'])
    def Mortality_Rate (self,request,pk=None):
        batch = self.get_object()
        
        # 1. Total deaths
        total_deaths = batch.mortalityrate_set.aggregate(total=Sum('no_of_deaths'))['total'] or 0
        
        # 2. Total sold (Hens + Roosters)
        sales = batch.batchsale_set.aggregate(
            total_hens=Sum('no_of_hens'),
            total_roosters=Sum('no_of_roosters')
        )
        total_sold = (sales['total_hens'] or 0) + (sales['total_roosters'] or 0)
        
        # 3. Calculate remaining inventory
        no_of_chicks = batch.no_of_chicks
        percentage = (total_deaths / no_of_chicks * 100) if no_of_chicks > 0 else 0
        remaining_chicks = no_of_chicks - total_deaths - total_sold

        return Response({
            'batch_no': batch.batch_no,
            'mortality_rate': percentage,
            'no_of_deaths': total_deaths,
            'total_sold': total_sold,
            'Remaining_chicks': remaining_chicks
        })

    @action (detail =True,methods =['get'])
    def ProfitORLose (self,request,pk=None):
        batch = self.get_object()
        revenue = batch.batchsale_set.aggregate(total=Sum('amount'))['total'] or 0
        expense = batch.batchexpense_set.aggregate(total=Sum('amount')) ['total'] or 0
        total_expenses = expense + batch.buying_price 

        profit_or_loss = revenue - total_expenses
        status = "Profit" if profit_or_loss > 0 else "Loss" if profit_or_loss < 0 else "Break-even"

        return Response({
            'batch_no': batch.batch_no,
            'revenue': revenue,
            'expense': expense,
            'profit_or_loss': profit_or_loss,
            'status': status
        })

    @action (detail=True, methods=['get'])
    def WeeklySales(self, request, pk=None):
        batch = self.get_object()
        weekly = batch.batchsale_set.annotate(
            week=TruncWeek('date')
        ).values('week').annotate(
            sales_count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('week')

        return Response({
            'batch_no': batch.batch_no,
            'weekly_sales': list(weekly)
        })

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


def index (request):
    return render (request, 'farm/index.html')


def login_page(request):
    return render(request, 'farm/login.html')



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    # Deletes the token from the DB → instantly revoked
    request.user.auth_token.delete()
    return Response({"message": "Logged out successfully."})

