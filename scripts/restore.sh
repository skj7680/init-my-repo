#!/bin/bash

# Restore script for cattle prediction system
# Usage: ./scripts/restore.sh <backup_name>

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_name>"
    echo "Available backups:"
    ls -1 backups/ | grep "_manifest.txt" | sed 's/_manifest.txt//'
    exit 1
fi

BACKUP_NAME=$1
BACKUP_DIR="backups"

echo "=== Cattle Prediction System Restore ==="
echo "Restoring from backup: $BACKUP_NAME"

# Check if backup exists
if [ ! -f "$BACKUP_DIR/${BACKUP_NAME}_manifest.txt" ]; then
    echo "Error: Backup $BACKUP_NAME not found"
    exit 1
fi

# Show backup info
echo "Backup information:"
cat "$BACKUP_DIR/${BACKUP_NAME}_manifest.txt"
echo ""

read -p "Continue with restore? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 1
fi

# Database restore
if [ -f "$BACKUP_DIR/${BACKUP_NAME}_database.sql" ]; then
    echo "Restoring database..."
    if [ -z "$DATABASE_URL" ]; then
        echo "Warning: DATABASE_URL not set, using default"
        DATABASE_URL="postgresql://cattle_user:cattle_password@localhost:5432/cattle_db"
    fi
    
    # Drop and recreate database (be careful!)
    read -p "This will DROP the existing database. Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        psql $DATABASE_URL < "$BACKUP_DIR/${BACKUP_NAME}_database.sql"
        echo "Database restored successfully"
    else
        echo "Database restore skipped"
    fi
else
    echo "Warning: Database backup file not found"
fi

# ML Models restore
if [ -f "$BACKUP_DIR/${BACKUP_NAME}_models.tar.gz" ]; then
    echo "Restoring ML models..."
    rm -rf ml/models/
    tar -xzf "$BACKUP_DIR/${BACKUP_NAME}_models.tar.gz"
    echo "ML models restored successfully"
else
    echo "Warning: ML models backup file not found"
fi

# Data files restore
if [ -f "$BACKUP_DIR/${BACKUP_NAME}_data.tar.gz" ]; then
    echo "Restoring data files..."
    rm -rf data/
    tar -xzf "$BACKUP_DIR/${BACKUP_NAME}_data.tar.gz"
    echo "Data files restored successfully"
else
    echo "Warning: Data files backup not found"
fi

# Configuration restore
if [ -f "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" ]; then
    echo "Restoring configuration..."
    tar -xzf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz"
    echo "Configuration restored successfully"
else
    echo "Warning: Configuration backup not found"
fi

echo "=== Restore completed ==="
echo "Please verify the system is working correctly"
echo "You may need to:"
echo "1. Update environment variables"
echo "2. Restart services"
echo "3. Run database migrations if needed"
