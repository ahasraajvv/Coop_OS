from django.core.management.base import BaseCommand
from farm.sync_service import run_3level_sync


class Command(BaseCommand):
    help = "Runs complete 3-Level Data Sync: Neon Cloud -> Local Laptop SQLite -> GitHub Data Vault."

    def add_arguments(self, parser):
        parser.add_argument(
            '--push-git',
            action='store_true',
            help='Automatically commit and push data_vault/ to GitHub.'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("=" * 60))
        self.stdout.write(self.style.NOTICE("       COOP_OS 3-LEVEL DATA SYNCHRONIZATION ENGINE"))
        self.stdout.write(self.style.NOTICE("=" * 60))

        push_git = options.get('push_git', False)
        result = run_3level_sync(push_to_git=push_git)

        if result['success']:
            self.stdout.write(self.style.SUCCESS("\n[LEVEL 1: CLOUD POSTGRESQL]"))
            self.stdout.write(f"  - Provider:      {result['level1_cloud'].get('provider')}")
            self.stdout.write(f"  - Total Records: {result['level1_cloud'].get('total_records')}")

            self.stdout.write(self.style.SUCCESS("\n[LEVEL 2: LOCAL LAPTOP REPLICA]"))
            self.stdout.write(f"  - Target:        {result['level2_local_replica'].get('target')}")
            self.stdout.write(f"  - Status:        {result['level2_local_replica'].get('status')}")
            self.stdout.write(f"  - Records:       {result['level2_local_replica'].get('records_synced')}")

            self.stdout.write(self.style.SUCCESS("\n[LEVEL 3: GITHUB DATA VAULT]"))
            self.stdout.write(f"  - Archive:       {result['level3_vault'].get('archive_path')}")
            self.stdout.write(f"  - Size:          {result['level3_vault'].get('size_kb')} KB")
            self.stdout.write(f"  - Checksum:      {result['level3_vault'].get('checksum')[:16]}...")
            if push_git:
                self.stdout.write(f"  - Git Push:      {result['level3_vault'].get('git_pushed')}")

            self.stdout.write(self.style.SUCCESS("\n[OK] 3-Level Synchronization Complete!\n"))
        else:
            self.stdout.write(self.style.ERROR(f"\n[ERROR] Synchronization Failed: {result['errors']}\n"))
