import os
import django
from decimal import Decimal
from datetime import date, datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from farm.models import Batch, BatchExpense, MortalityRate, InfraExpense, CustomerDetail, BatchSale

def seed():
    print("[*] Seeding realistic test data for CoopOS...")

    # 1. Create Customers
    c1, _ = CustomerDetail.objects.get_or_create(
        customer_id=101,
        defaults={
            'customer_name': 'Kannan Hotel and Mess',
            'contact_number': '9876543210',
            'email': 'kannanmess@gmail.com',
            'address': 'Salem Main Road, Namakkal'
        }
    )
    c2, _ = CustomerDetail.objects.get_or_create(
        customer_id=102,
        defaults={
            'customer_name': 'Murugan Meat Traders (Wholesale)',
            'contact_number': '9842112233',
            'email': 'murugantraders@yahoo.com',
            'address': 'Market Yard, Erode'
        }
    )
    c3, _ = CustomerDetail.objects.get_or_create(
        customer_id=103,
        defaults={
            'customer_name': 'Raja (Retail Buyer)',
            'contact_number': '9443256789',
            'email': 'raja.village@gmail.com',
            'address': 'East Street, Farm Village'
        }
    )
    print("[+] Customers seeded.")

    # 2. Create Realistic Batches
    # Batch 10: Completed profitable batch
    b10, _ = Batch.objects.get_or_create(
        batch_no=10,
        defaults={
            'date': date(2026, 4, 1),
            'buying_price': Decimal('12500.00'),
            'no_of_chicks': 250
        }
    )

    # Batch 11: Active batch with partial sales and expenses
    b11, _ = Batch.objects.get_or_create(
        batch_no=11,
        defaults={
            'date': date(2026, 6, 15),
            'buying_price': Decimal('15000.00'),
            'no_of_chicks': 300
        }
    )

    # Batch 12: High-mortality test batch
    b12, _ = Batch.objects.get_or_create(
        batch_no=12,
        defaults={
            'date': date(2026, 8, 1),
            'buying_price': Decimal('10000.00'),
            'no_of_chicks': 200
        }
    )
    print("[+] Batches seeded.")

    # 3. Create Expenses for Batch 10
    BatchExpense.objects.get_or_create(
        batch=b10, date=date(2026, 4, 5), expense_type='Starter Feed (2 bags)',
        defaults={'amount': Decimal('3200.00')}
    )
    BatchExpense.objects.get_or_create(
        batch=b10, date=date(2026, 4, 12), expense_type='Vaccines (Ranikhet / Lasota)',
        defaults={'amount': Decimal('450.00')}
    )
    BatchExpense.objects.get_or_create(
        batch=b10, date=date(2026, 5, 2), expense_type='Grower Feed (4 bags)',
        defaults={'amount': Decimal('6800.00')}
    )
    BatchExpense.objects.get_or_create(
        batch=b10, date=date(2026, 5, 20), expense_type='Vitamins and Calcium Tonic',
        defaults={'amount': Decimal('600.00')}
    )

    # Expenses for Batch 11
    BatchExpense.objects.get_or_create(
        batch=b11, date=date(2026, 6, 20), expense_type='Starter Feed (3 bags)',
        defaults={'amount': Decimal('4800.00')}
    )
    BatchExpense.objects.get_or_create(
        batch=b11, date=date(2026, 7, 10), expense_type='Deworming Medicine',
        defaults={'amount': Decimal('350.00')}
    )
    print("[+] Batch expenses seeded.")

    # 4. Create Mortality Records
    # Batch 10: normal mortality (total 10 deaths out of 250 -> 4%)
    MortalityRate.objects.get_or_create(
        batch=b10, date=datetime(2026, 4, 3, 9, 30),
        defaults={'no_of_deaths': 4, 'reason_of_death': 'Initial transport stress'}
    )
    MortalityRate.objects.get_or_create(
        batch=b10, date=datetime(2026, 4, 18, 14, 0),
        defaults={'no_of_deaths': 3, 'reason_of_death': 'Indigestion / Weak chicks'}
    )
    MortalityRate.objects.get_or_create(
        batch=b10, date=datetime(2026, 5, 10, 11, 15),
        defaults={'no_of_deaths': 3, 'reason_of_death': 'Heat stress'}
    )

    # Batch 12: High mortality (28 deaths out of 200 -> 14%)
    MortalityRate.objects.get_or_create(
        batch=b12, date=datetime(2026, 8, 5, 10, 0),
        defaults={'no_of_deaths': 18, 'reason_of_death': 'Severe Heatwave / Dehydration'}
    )
    MortalityRate.objects.get_or_create(
        batch=b12, date=datetime(2026, 8, 12, 16, 0),
        defaults={'no_of_deaths': 10, 'reason_of_death': 'Bacterial infection'}
    )
    print("[+] Mortality records seeded.")

    # 5. Create Sales Records for Batch 10 (Sold out profitably)
    # 250 chicks - 10 deaths = 240 birds sold
    BatchSale.objects.get_or_create(
        batch=b10, customer=c1, date=date(2026, 6, 10),
        defaults={'no_of_hens': 60, 'no_of_roosters': 40, 'kg': Decimal('145.50'), 'amount': Decimal('36000.00')}
    )
    BatchSale.objects.get_or_create(
        batch=b10, customer=c2, date=date(2026, 6, 18),
        defaults={'no_of_hens': 70, 'no_of_roosters': 50, 'kg': Decimal('180.00'), 'amount': Decimal('45000.00')}
    )
    BatchSale.objects.get_or_create(
        batch=b10, customer=c3, date=date(2026, 6, 22),
        defaults={'no_of_hens': 10, 'no_of_roosters': 10, 'kg': Decimal('30.00'), 'amount': Decimal('7500.00')}
    )

    # Partial sale for Batch 11
    BatchSale.objects.get_or_create(
        batch=b11, customer=c1, date=date(2026, 8, 25),
        defaults={'no_of_hens': 30, 'no_of_roosters': 20, 'kg': Decimal('72.00'), 'amount': Decimal('18000.00')}
    )
    print("[+] Batch sales seeded.")

    # 6. Create Farm Infrastructure Expenses (Unlinked to single batches)
    InfraExpense.objects.get_or_create(
        date=date(2026, 3, 15), expense_type='Shed Netting and Fencing Wire',
        defaults={'amount': Decimal('4200.00')}
    )
    InfraExpense.objects.get_or_create(
        date=date(2026, 5, 1), expense_type='Water Pipe and Nipple Drinkers',
        defaults={'amount': Decimal('2800.00')}
    )
    InfraExpense.objects.get_or_create(
        date=date(2026, 7, 20), expense_type='Shed Roof Sheet Patching',
        defaults={'amount': Decimal('1500.00')}
    )
    print("[+] Infrastructure expenses seeded.")

    print("\nSUCCESS: Realistic test data has been seeded for Batches 10, 11, and 12!")

if __name__ == '__main__':
    seed()
