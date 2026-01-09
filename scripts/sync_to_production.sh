#!/bin/bash

PROD_URL="https://hr.baynunah.ae"
TOKEN="$MAINTENANCE_SECRET"

if [ -z "$TOKEN" ]; then
    echo "Error: MAINTENANCE_SECRET not set"
    echo "Usage: MAINTENANCE_SECRET=your_token ./scripts/sync_to_production.sh"
    exit 1
fi

echo "Step 1: Exporting data from development..."
curl -s "http://localhost:5001/api/health/export-data?token=$TOKEN" > /tmp/sync_data.json

if [ ! -s /tmp/sync_data.json ]; then
    echo "Error: Failed to export data from development"
    exit 1
fi

echo "Export complete. Data counts:"
cat /tmp/sync_data.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('counts'))"

echo ""
echo "Step 2: Extracting data payload..."
cat /tmp/sync_data.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('data')))" > /tmp/sync_payload.json

echo "Step 3: Importing data to production..."
curl -s -X POST "$PROD_URL/api/health/import-data?token=$TOKEN" \
    -H "Content-Type: application/json" \
    -d @/tmp/sync_payload.json

echo ""
echo "Step 4: Running fix-production to set up admin..."
curl -s -X POST "$PROD_URL/api/health/fix-production?token=$TOKEN"

echo ""
echo "Sync complete!"
