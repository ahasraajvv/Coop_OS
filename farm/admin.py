from django.contrib import admin
from .models import Batch, BatchExpense, MortalityRate, InfraExpense, CustomerDetail, BatchSale

admin.site.register(Batch)
admin.site.register(BatchExpense)
admin.site.register(MortalityRate)
admin.site.register(InfraExpense)
admin.site.register(CustomerDetail)
admin.site.register(BatchSale)