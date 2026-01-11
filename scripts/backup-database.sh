#!/bin/bash

# Database Backup Script for HR Portal
# Creates timestamped backups of the PostgreSQL database

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/hr_portal_backup_${TIMESTAMP}.sql"

echo "🗄️  HR Portal Database Backup"
echo "=============================="
echo ""

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running!"
    exit 1
fi

# Check if database container is running
if ! docker compose ps postgres | grep -q "Up"; then
    echo "❌ Database container is not running!"
    echo "Start it with: docker compose up -d postgres"
    exit 1
fi

echo "📦 Creating database backup..."
docker compose exec -T postgres pg_dump -U hruser secure_renewals > "${BACKUP_FILE}"

if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup created successfully!"
    echo ""
    echo "📄 File: ${BACKUP_FILE}"
    echo "💾 Size: ${BACKUP_SIZE}"
    echo ""
    
    # Compress backup
    echo "🗜️  Compressing backup..."
    gzip "${BACKUP_FILE}"
    COMPRESSED_FILE="${BACKUP_FILE}.gz"
    COMPRESSED_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
    
    echo "✅ Backup compressed!"
    echo "📄 File: ${COMPRESSED_FILE}"
    echo "💾 Size: ${COMPRESSED_SIZE}"
    echo ""
    
    # Keep only last 7 backups
    echo "🧹 Cleaning old backups (keeping last 7)..."
    cd "${BACKUP_DIR}"
    ls -t hr_portal_backup_*.sql.gz | tail -n +8 | xargs -r rm
    
    BACKUP_COUNT=$(ls -1 hr_portal_backup_*.sql.gz 2>/dev/null | wc -l)
    echo "📊 Total backups: ${BACKUP_COUNT}"
    echo ""
    echo "✅ Backup complete!"
else
    echo "❌ Backup failed!"
    exit 1
fi
