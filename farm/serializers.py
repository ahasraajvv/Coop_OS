from rest_framework import serializers
from .models import Batch, BatchExpense, MortalityRate, CustomerDetail, BatchSale, InfraExpense, VaccinationRecord

class BatchSerializer(serializers.ModelSerializer):
    batch_no = serializers.IntegerField(required=False)

    class Meta:
        model = Batch
        fields = '__all__'  

    def validate_no_of_chicks(self, value):
        if value <= 0:
            raise serializers.ValidationError("Number of chicks must be greater than zero.")
        return value

    def create(self, validated_data):
        if 'batch_no' not in validated_data or not validated_data['batch_no']:
            from django.db.models import Max
            max_no = Batch.objects.aggregate(Max('batch_no'))['batch_no__max'] or 0
            validated_data['batch_no'] = max_no + 1
        return super().create(validated_data)


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
    customer_id = serializers.IntegerField(required=False)

    class Meta:
        model = CustomerDetail
        fields = '__all__'

    def create(self, validated_data):
        if 'customer_id' not in validated_data or not validated_data['customer_id']:
            from django.db.models import Max
            max_id = CustomerDetail.objects.aggregate(Max('customer_id'))['customer_id__max'] or 0
            validated_data['customer_id'] = max_id + 1
        return super().create(validated_data)

    
class BatchSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchSale
        fields = '__all__'

    def validate(self,data):
        no_of_hens = data.get('no_of_hens', 0)
        no_of_roosters = data.get('no_of_roosters', 0)
        if no_of_hens + no_of_roosters <= 0:
            raise serializers.ValidationError("Total number of hens and roosters must be greater than zero.")
        return data 

class BatchSaleDetailSerializer(serializers.ModelSerializer):
    batch = BatchSerializer(read_only=True)
    customer = CustomerDetailSerializer(allow_null=True, read_only=True)

    class Meta:
        model = BatchSale
        fields = '__all__'


class VaccinationRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccinationRecord
        fields = '__all__'