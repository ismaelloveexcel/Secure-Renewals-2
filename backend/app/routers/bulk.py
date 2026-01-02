from fastapi import APIRouter, HTTPException, UploadFile, File
from app.core.config import is_feature_enabled
import csv
from io import StringIO

router = APIRouter(prefix="/bulk", tags=["bulk"])

@router.post("/import", summary="Bulk import from CSV")
def bulk_import(file: UploadFile = File(...)):
    if not is_feature_enabled("bulk_import_export"):
        raise HTTPException(status_code=403, detail="Bulk import/export feature disabled")
    content = file.file.read().decode('utf-8')
    reader = csv.DictReader(StringIO(content))
    rows = list(reader)
    # Validate and process rows as needed
    return {"imported": len(rows), "rows": rows[:5]}  # Demo: return first 5 rows

@router.get("/export", summary="Bulk export to CSV")
def bulk_export():
    if not is_feature_enabled("bulk_import_export"):
        raise HTTPException(status_code=403, detail="Bulk import/export feature disabled")
    # Demo: return static CSV
    csv_content = "id,name\n1,Alice\n2,Bob"
    return csv_content
