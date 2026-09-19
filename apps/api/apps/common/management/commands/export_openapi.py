from __future__ import annotations

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from config.api import api


class Command(BaseCommand):
    help = "Export OpenAPI schema to packages/contracts/openapi/orfwear-v1.json"

    def handle(self, *args, **options):
        schema = api.get_openapi_schema()
        # apps/api -> repo root
        repo_root = Path(settings.BASE_DIR).resolve().parents[1]
        out_dir = repo_root / "packages" / "contracts" / "openapi"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / "orfwear-v1.json"
        out_file.write_text(
            json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        self.stdout.write(self.style.SUCCESS(f"Wrote {out_file}"))
