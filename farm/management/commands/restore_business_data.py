import gzip
import os
from django.core.management.base import BaseCommand, CommandError
from django.core import serializers
from django.db import transaction


class Command(BaseCommand):
    help = "Restores CoopOS business data from a compressed .json.gz or .json backup snapshot."

    def add_arguments(self, parser):
        parser.add_argument(
            'file_path',
            type=str,
            help='Path to the backup file (.json.gz or .json).'
        )

    def handle(self, *args, **options):
        file_path = options['file_path']

        if not os.path.exists(file_path):
            raise CommandError(f"Backup file does not exist: {file_path}")

        self.stdout.write(self.style.NOTICE("=" * 60))
        self.stdout.write(self.style.NOTICE("       COOP_OS BUSINESS DATA RESTORE ENGINE"))
        self.stdout.write(self.style.NOTICE("=" * 60))
        self.stdout.write(f"Reading backup from: {file_path}")

        try:
            if file_path.endswith('.gz'):
                with gzip.open(file_path, 'rt', encoding='utf-8') as f:
                    raw_data = f.read()
            else:
                with open(file_path, 'r', encoding='utf-8') as f:
                    raw_data = f.read()
        except Exception as e:
            raise CommandError(f"Failed to read backup file: {e}")

        restored_counts = {}
        total_restored = 0

        try:
            with transaction.atomic():
                for deserialized_object in serializers.deserialize('json', raw_data):
                    deserialized_object.save()
                    model_name = deserialized_object.object.__class__.__name__
                    restored_counts[model_name] = restored_counts.get(model_name, 0) + 1
                    total_restored += 1
        except Exception as e:
            raise CommandError(f"Transaction failed during restore. Database rolled back cleanly. Error: {e}")

        self.stdout.write("-" * 60)
        for model_name, count in restored_counts.items():
            self.stdout.write(f"  - {model_name}: {count} records")
        self.stdout.write("-" * 60)
        self.stdout.write(self.style.SUCCESS(f"\n[OK] Restored {total_restored} business records successfully!\n"))
