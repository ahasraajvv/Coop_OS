import os
import gzip
import json
import hashlib
import subprocess
from datetime import datetime
from django.conf import settings
from django.core import serializers
from django.contrib.auth.models import User
from django.db import transaction
from farm.models import (
    Batch,
    BatchExpense,
    MortalityRate,
    InfraExpense,
    CustomerDetail,
    BatchSale,
    VaccinationRecord,
)


def run_3level_sync(push_to_git=False):
    """
    Executes 3-level data replication and backup:
    1. Reads live data from Level 1 (Neon Cloud PostgreSQL default).
    2. Synchronizes data to Level 2 (Local Laptop SQLite replica).
    3. Exports compressed snapshot to Level 3 (data_vault/ latest archive).
    """
    results = {
        "success": False,
        "timestamp": datetime.now().isoformat(),
        "level1_cloud": {},
        "level2_local_replica": {},
        "level3_vault": {},
        "counts": {},
        "errors": []
    }

    try:
        # ==========================================
        # LEVEL 1: Read all records from Cloud
        # ==========================================
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

        results["counts"] = {
            "users": len(users),
            "batches": len(batches),
            "customers": len(customers),
            "batch_expenses": len(batch_expenses),
            "infra_expenses": len(infra_expenses),
            "mortalities": len(mortalities),
            "sales": len(sales),
            "vaccinations": len(vaccinations),
            "total_records": len(all_objects),
        }

        results["level1_cloud"] = {
            "status": "connected",
            "provider": "Neon PostgreSQL",
            "total_records": len(all_objects),
        }

        # Serialize to JSON format
        serialized_json = serializers.serialize("json", all_objects, indent=2)

        # ==========================================
        # LEVEL 2: Sync to Local Laptop SQLite
        # ==========================================
        try:
            if 'local_replica' in settings.DATABASES:
                with transaction.atomic(using='local_replica'):
                    # Wipe and reload replica models
                    VaccinationRecord.objects.using('local_replica').all().delete()
                    BatchSale.objects.using('local_replica').all().delete()
                    MortalityRate.objects.using('local_replica').all().delete()
                    BatchExpense.objects.using('local_replica').all().delete()
                    InfraExpense.objects.using('local_replica').all().delete()
                    CustomerDetail.objects.using('local_replica').all().delete()
                    Batch.objects.using('local_replica').all().delete()
                    User.objects.using('local_replica').all().delete()

                    for obj in serializers.deserialize('json', serialized_json, using='local_replica'):
                        obj.save(using='local_replica')

                results["level2_local_replica"] = {
                    "status": "synchronized",
                    "target": "db.sqlite3",
                    "records_synced": len(all_objects),
                }
            else:
                results["level2_local_replica"] = {
                    "status": "skipped",
                    "reason": "local_replica database not configured",
                }
        except Exception as e:
            results["level2_local_replica"] = {
                "status": "warning",
                "error": str(e),
            }

        # ==========================================
        # LEVEL 3: Export to data_vault/ snapshot
        # ==========================================
        vault_dir = os.path.join(settings.BASE_DIR, "data_vault")
        os.makedirs(vault_dir, exist_ok=True)

        latest_gz_path = os.path.join(vault_dir, "coopos_backup_latest.json.gz")
        manifest_path = os.path.join(vault_dir, "manifest.json")

        # Write compressed archive
        with gzip.open(latest_gz_path, "wt", encoding="utf-8") as f:
            f.write(serialized_json)

        file_size_kb = round(os.path.getsize(latest_gz_path) / 1024, 2)
        checksum = hashlib.sha256(serialized_json.encode('utf-8')).hexdigest()

        manifest_data = {
            "last_synced": results["timestamp"],
            "checksum_sha256": checksum,
            "archive_size_kb": file_size_kb,
            "counts": results["counts"],
        }

        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)

        results["level3_vault"] = {
            "status": "saved",
            "archive_path": latest_gz_path,
            "manifest_path": manifest_path,
            "size_kb": file_size_kb,
            "checksum": checksum,
        }

        # Optionally commit & push to GitHub
        if push_to_git:
            try:
                subprocess.run(["git", "add", "data_vault/"], cwd=settings.BASE_DIR, check=True, capture_output=True)
                commit_msg = f"chore(vault): auto-sync business data ({results['counts']['total_records']} records)"
                subprocess.run(["git", "commit", "-m", commit_msg], cwd=settings.BASE_DIR, check=False, capture_output=True)
                push_res = subprocess.run(["git", "push", "origin", "main"], cwd=settings.BASE_DIR, check=False, capture_output=True)
                results["level3_vault"]["git_pushed"] = (push_res.returncode == 0)
            except Exception as git_err:
                results["level3_vault"]["git_error"] = str(git_err)

        results["success"] = True

    except Exception as e:
        results["errors"].append(str(e))
        results["success"] = False

    return results
