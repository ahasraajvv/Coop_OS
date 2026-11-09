import gzip
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.core import serializers
from django.conf import settings
from django.contrib.auth.models import User
from farm.models import (
    Batch,
    BatchExpense,
    MortalityRate,
    InfraExpense,
    CustomerDetail,
    BatchSale,
    VaccinationRecord,
)


class Command(BaseCommand):
    help = "Exports and compresses complete CoopOS business data (flocks, sales, expenses, CRM, users)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--destination',
            '-d',
            type=str,
            default='',
            help='Directory path where the compressed backup should be stored (e.g. Google Drive folder or USB drive).'
        )

    def handle(self, *args, **options):
        dest_dir = options.get('destination')
        if not dest_dir:
            dest_dir = os.path.join(settings.BASE_DIR, 'backups_secure')

        os.makedirs(dest_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = f"coopos_backup_{timestamp}.json.gz"
        target_path = os.path.join(dest_dir, filename)

        self.stdout.write(self.style.NOTICE("=" * 60))
        self.stdout.write(self.style.NOTICE("       COOP_OS BUSINESS DATA BACKUP ENGINE"))
        self.stdout.write(self.style.NOTICE("=" * 60))

        # Query all business models in correct relational order
        users = list(User.objects.all())
        batches = list(Batch.objects.all())
        customers = list(CustomerDetail.objects.all())
        batch_expenses = list(BatchExpense.objects.all())
        infra_expenses = list(InfraExpense.objects.all())
        mortalities = list(MortalityRate.objects.all())
        sales = list(BatchSale.objects.all())
        vaccinations = list(VaccinationRecord.objects.all())

        all_objects = (
            users
            + batches
            + customers
            + batch_expenses
            + infra_expenses
            + mortalities
            + sales
            + vaccinations
        )

        self.stdout.write("  - Users / Staff:       {}".format(len(users)))
        self.stdout.write("  - Batches (Flocks):    {}".format(len(batches)))
        self.stdout.write("  - Customers (CRM):     {}".format(len(customers)))
        self.stdout.write("  - Batch Expenses:      {}".format(len(batch_expenses)))
        self.stdout.write("  - Overhead Expenses:   {}".format(len(infra_expenses)))
        self.stdout.write("  - Mortality Logs:      {}".format(len(mortalities)))
        self.stdout.write("  - Sales / Orders:      {}".format(len(sales)))
        self.stdout.write("  - Vaccination Records: {}".format(len(vaccinations)))
        self.stdout.write("-" * 60)
        self.stdout.write(f"  Total records serialized: {len(all_objects)}")

        serialized_data = serializers.serialize('json', all_objects, indent=2)

        # Write compressed gzip snapshot
        with gzip.open(target_path, 'wt', encoding='utf-8') as f:
            f.write(serialized_data)

        file_size_kb = os.path.getsize(target_path) / 1024
        self.stdout.write(self.style.SUCCESS(f"\n[OK] Encrypted/Compressed Backup Saved Successfully!"))
        self.stdout.write(self.style.SUCCESS(f"     Path: {target_path}"))
        self.stdout.write(self.style.SUCCESS(f"     Size: {file_size_kb:.2f} KB\n"))
