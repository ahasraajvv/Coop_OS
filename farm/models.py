from django.db import models

class Batch(models.Model):

    batch_no =  models.PositiveIntegerField(primary_key=True)
    date     = models.DateField()
    buying_price = models.DecimalField(max_digits=10, decimal_places=2) # give it in decimal so rounding errors wont happen 
    no_of_chicks = models.IntegerField()


class BatchExpense(models.Model):

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    date = models.DateField()
    expense_type = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)


class MortalityRate(models.Model):

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    date = models.DateTimeField()
    no_of_deaths = models.IntegerField()
    reason_of_death = models.CharField(max_length=255)


class InfraExpense(models.Model):

    date = models.DateField()
    expense_type = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

class CustomerDetail(models.Model):

    customer_id = models.IntegerField(primary_key=True)
    customer_name = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=15)
    email = models.EmailField()
    address = models.TextField()


class BatchSale(models.Model):

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    date     = models.DateField()
    no_of_hens = models.IntegerField()
    no_of_roosters = models.IntegerField()
    kg  = models.DecimalField(max_digits=10, decimal_places=3,null=True, blank=True)
    amount =  models.DecimalField(max_digits=10, decimal_places=2  )
    customer = models.ForeignKey(CustomerDetail, on_delete=models.CASCADE, null=True, blank=True)


class VaccinationRecord(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    day = models.IntegerField()
    vaccine_name = models.CharField(max_length=150)
    disease = models.CharField(max_length=150)
    dosage = models.CharField(max_length=150, default='', blank=True)
    route = models.CharField(max_length=100, default='Drinking Water')
    scheduled_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    administered_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['day', 'scheduled_date']

    def __str__(self):
        return f"Batch {self.batch_id} - Day {self.day} {self.vaccine_name}"
