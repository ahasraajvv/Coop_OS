from rest_framework import serializers
from .models import Batch, BatchExpense, MortalityRate, CustomerDetail, BatchSale, InfraExpense

class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'  


class BatchExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchExpense
        fields = '__all__'

class MortalityRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MortalityRate
        fields = '__all__'

class InfraExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfraExpense
        fields = '__all__'

class CustomerDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerDetail
        fields = '__all__'

    
class BatchSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchSale
        fields = '__all__'


class BatchSaleDetailSerializer(serializers.ModelSerializer):
    batch = BatchSerializer()
    customer = CustomerDetailSerializer()

    class Meta:
        model = BatchSale
        fields = '__all__'