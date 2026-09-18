from rest_framework import serializers
from .models import Batch, BatchExpense, MortalityRate, CustomerDetail, BatchSale, InfraExpense

class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'  

    def validate_no_of_chicks(self, value):
        if value <= 0:
            raise serializers.ValidationError("Number of chicks must be greater than zero.")
        return value


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

    def validate(self,data):
        no_of_hens = data.get('no_of_hens', 0)
        no_of_roosters = data.get('no_of_roosters', 0)
        if no_of_hens + no_of_roosters <= 0:
            raise serializers.ValidationError("Total number of hens and roosters must be greater than zero.")
        return data 

class BatchSaleDetailSerializer(serializers.ModelSerializer):
    batch = BatchSerializer()
    customer = CustomerDetailSerializer()

    class Meta:
        model = BatchSale
        fields = '__all__'