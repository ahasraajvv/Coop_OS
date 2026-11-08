import os
import shutil
from datetime import datetime
from django.apps import AppConfig

class FarmConfig(AppConfig):
    name = 'farm'

    def ready(self):
        # Automatic backup safety guard: backs up database on every server startup
        # Only runs in the main thread (not the auto-reloader sub-process)
        if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('RUN_MAIN'):
            try:
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                db_path = os.path.join(base_dir, 'db.sqlite3')
                backups_dir = os.path.join(base_dir, 'backups')
                if os.path.exists(db_path):
                    os.makedirs(backups_dir, exist_ok=True)
                    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
                    backup_file = os.path.join(backups_dir, f'db_backup_auto_{timestamp}.sqlite3')
                    shutil.copy2(db_path, backup_file)
                    print(f"[COOP_OS AUTO-BACKUP] Secured database snapshot to: {backup_file}")
            except Exception as e:
                print(f"[COOP_OS AUTO-BACKUP ERROR] {e}")
