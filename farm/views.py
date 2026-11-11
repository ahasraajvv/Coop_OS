from django.db.models.aggregates import Sum, Count
from django.db.models.functions import TruncWeek
from rest_framework import viewsets
from .models import Batch, BatchExpense, MortalityRate, CustomerDetail, BatchSale, InfraExpense, VaccinationRecord
from .serializers import (
    BatchSerializer, BatchExpenseSerializer, CustomerDetailSerializer,
    MortalityRateSerializer, BatchSaleSerializer, InfraExpenseSerializer,
    BatchSaleDetailSerializer, VaccinationRecordSerializer
)
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import render, redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

class BatchViewSet(viewsets.ModelViewSet): # CRUD operations for Batch model
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

    @action (detail = True, methods =["get"])
    def BatchRevenue(self,request,pk=None):
        batch = self.get_object()
        total_sales_of_a_batch = batch.batchsale_set.aggregate(total = Sum('amount'))['total'] or 0 
        meat_revenue = batch.batchsale_set.filter(sale_type='meat').aggregate(total=Sum('amount'))['total'] or 0
        breeding_revenue = batch.batchsale_set.filter(sale_type='breeding').aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            "batch_no" : batch.batch_no,
            "total_revenue" : total_sales_of_a_batch,
            "meat_revenue": meat_revenue,
            "breeding_revenue": breeding_revenue,
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
        
        # 2. Total sold (Hens + Roosters) and Total Kg
        sales = batch.batchsale_set.aggregate(
            total_hens=Sum('no_of_hens'),
            total_roosters=Sum('no_of_roosters'),
            total_kg=Sum('kg')
        )
        total_sold = (sales['total_hens'] or 0) + (sales['total_roosters'] or 0)
        total_kg = sales['total_kg'] or 0
        
        # 3. Calculate remaining inventory
        no_of_chicks = batch.no_of_chicks
        percentage = (total_deaths / no_of_chicks * 100) if no_of_chicks > 0 else 0
        remaining_chicks = no_of_chicks - total_deaths - total_sold

        return Response({
            'batch_no': batch.batch_no,
            'mortality_rate': percentage,
            'no_of_deaths': total_deaths,
            'total_sold': total_sold,
            'total_kg': total_kg,
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
            'buying_price': batch.buying_price,
            'feed_expense': expense,
            'total_expenses': total_expenses,
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

    @action(detail=True, methods=['get'])
    def vaccinations(self, request, pk=None):
        batch = self.get_object()
        from datetime import timedelta
        # Auto-provision standard 90-day protocol if not yet created
        if not batch.vaccinationrecord_set.exists():
            default_schedule = [
                {
                    'day': 1,
                    'vaccine_name': "Marex Vaccine (HVT Strain)",
                    'disease': "Marek's Disease / Paralysis (மாரெக்ஸ் பக்கவாத நோய்)",
                    'dosage': "0.2 ml / chick",
                    'route': "Subcutaneous Injection (தோல் வழி ஊசி)"
                },
                {
                    'day': 7,
                    'vaccine_name': "Ranikhet F1 (RD-F1 Strain)",
                    'disease': "Newcastle / Ranikhet Disease (வெள்ளைக் கழிச்சல் நோய்)",
                    'dosage': "1 Drop / chick (1 கண் சொட்டு)",
                    'route': "Eye Drop / Nasal Drop (கண் அல்லது மூக்கு சொட்டு வழி)"
                },
                {
                    'day': 10,
                    'vaccine_name': "Nose Chipping (மூக்கு நுனி வெட்டுதல்)",
                    'disease': "Cannibalism & Feed Wastage Prevention (கொத்துதல் & தீவன விரயம் தடுப்பு)",
                    'dosage': "Upper 1/3 Beak Trim & Cauterize (மேல் அலகு 1/3 நுனி வெட்டுதல்)",
                    'route': "Debeaking Machine (மின்சார மூக்கு வெட்டும் கருவி)"
                },
                {
                    'day': 14,
                    'vaccine_name': "IBD Vaccine (Gumboro Intermediate)",
                    'disease': "Infectious Bursal Disease (கம்போரோ ரத்தக் கழிச்சல் நோய்)",
                    'dosage': "1 Drop or Drinking Water (1 சொட்டு / குடிநீர்)",
                    'route': "Eye Drop / Drinking Water (கண் சொட்டு அல்லது குடிநீர் வழி)"
                },
                {
                    'day': 21,
                    'vaccine_name': "Ranikhet Lasota (RD Lasota)",
                    'disease': "Newcastle Disease (வெள்ளைக் கழிச்சல் நோய்)",
                    'dosage': "Flock Drinking Water Mix (குடிநீர் கலவை)",
                    'route': "Drinking Water (காலை குளிர்ந்த குடிநீர் வழி)"
                },
                {
                    'day': 28,
                    'vaccine_name': "IBD Booster (Gumboro Booster)",
                    'disease': "IBD Secondary Immunity (கம்போரோ மறு எதிர்ப்பு சக்தி)",
                    'dosage': "Flock Drinking Water Mix (குடிநீர் கலவை)",
                    'route': "Drinking Water (குடிநீர் வழி)"
                },
                {
                    'day': 35,
                    'vaccine_name': "Fowl Pox Vaccine (அம்மை நோய் தடுப்பூசி)",
                    'disease': "Fowl Pox Virus (கோழி அம்மை நோய்)",
                    'dosage': "0.02 ml / per chick (0.02 மிலி / கோழி)",
                    'route': "Wing Web Puncture (இறக்கைத் தோல் குத்துதல்)"
                },
                {
                    'day': 45,
                    'vaccine_name': "Ranikhet Lasota Booster (லசோட்டா மறு தடுப்பூசி)",
                    'disease': "Newcastle Booster Reinforcement (வெள்ளைக் கழிச்சல் மறு தடுப்பூசி)",
                    'dosage': "Flock Drinking Water Mix (குடிநீர் கலவை)",
                    'route': "Drinking Water (குடிநீர் வழி)"
                },
                {
                    'day': 55,
                    'vaccine_name': "Albomar Deworming (அல்போமார் குடற்புழு நீக்கம்)",
                    'disease': "Internal Parasites & Roundworms (குடற்புழுக்கள் & ஒட்டுண்ணி நீக்கம்)",
                    'dosage': "45 ml / 100 chicks (45 மிலி / 100 கோழிகளுக்கு)",
                    'route': "Drinking Water (காலை குடிநீர் வழி)"
                },
                {
                    'day': 57,
                    'vaccine_name': "RDVK Vaccine (Ranikhet Disease Vaccine K Strain)",
                    'disease': "Severe Newcastle Lifetime Immunity (வெள்ளைக் கழிச்சல் தீவிர தடுப்பு)",
                    'dosage': "0.05 ml / per chick (0.05 மிலி / கோழி)",
                    'route': "Intramuscular Injection (தசை வழி ஊசி - மார்பு / தொடை)"
                }
            ]
            records = []
            for item in default_schedule:
                target_date = batch.date + timedelta(days=item['day'])
                records.append(VaccinationRecord(
                    batch=batch,
                    day=item['day'],
                    vaccine_name=item['vaccine_name'],
                    disease=item['disease'],
                    dosage=item.get('dosage', ''),
                    route=item['route'],
                    scheduled_date=target_date,
                    is_completed=False
                ))
            VaccinationRecord.objects.bulk_create(records)

        records = batch.vaccinationrecord_set.all().order_by('day')
        serializer = VaccinationRecordSerializer(records, many=True)
        return Response(serializer.data)


class VaccinationRecordViewSet(viewsets.ModelViewSet):
    queryset = VaccinationRecord.objects.all()
    serializer_class = VaccinationRecordSerializer

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        record = self.get_object()
        record.is_completed = not record.is_completed
        if record.is_completed:
            from datetime import date
            admin_date = request.data.get('administered_date')
            record.administered_date = admin_date if admin_date else date.today()
        else:
            record.administered_date = None
        record.save()
        return Response(VaccinationRecordSerializer(record).data)


class BatchExpenseViewSet(viewsets.ModelViewSet):  # CRUD operations for BatchExpense model 
    queryset =  BatchExpense.objects.all()
    serializer_class = BatchExpenseSerializer


class BatchSaleViewSet(viewsets.ModelViewSet):
    queryset = BatchSale.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        sale_type = self.request.query_params.get('sale_type')
        if sale_type:
            qs = qs.filter(sale_type=sale_type)
        return qs

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

    def get_queryset(self):
        qs = CustomerDetail.objects.all().order_by('-customer_id')
        category = self.request.query_params.get('category')
        if category and category != 'ALL':
            qs = qs.filter(category=category)
        sub_category = self.request.query_params.get('sub_category')
        if sub_category and sub_category != 'ALL':
            qs = qs.filter(sub_category=sub_category)
        return qs


def index (request):
    return render (request, 'farm/index.html')


def login_page(request):
    return redirect('/')



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    # Deletes the token from the DB → instantly revoked
    request.user.auth_token.delete()
    return Response({"message": "Logged out successfully."})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sync_status_view(request):
    """
    GET: Returns current sync status and manifest.
    POST: Triggers 3-level data replication across Cloud, Local SQLite, and GitHub Vault.
    """
    import os
    import json
    from django.conf import settings
    from farm.sync_service import run_3level_sync

    if request.method == 'POST':
        push_git = request.data.get('push_to_git', False) if isinstance(request.data, dict) else False
        res = run_3level_sync(push_to_git=push_git)
        return Response(res)

    manifest_path = os.path.join(settings.BASE_DIR, 'data_vault', 'manifest.json')
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest_data = json.load(f)
            return Response({'status': 'synced', 'manifest': manifest_data})
        except Exception:
            pass
    return Response({'status': 'ready', 'manifest': None})
