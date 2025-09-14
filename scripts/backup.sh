#!/bin/bash

# Backup script for cattle prediction system
# Usage: ./scripts/backup.sh [backup_name]

set -e

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME=${1:-"backup_$TIMESTAMP"}

# Create backup directory
mkdir -p $BACKUP_DIR

echo "=== Cattle Prediction System Backup ==="
echo "Backup name: $BACKUP_NAME"
echo "Timestamp: $TIMESTAMP"

# Database backup
echo "Backing up database..."
if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL not set, using default"
    DATABASE_URL="postgresql://cattle_user:cattle_password@localhost:5432/cattle_db"
fi

pg_dump $DATABASE_URL > "$BACKUP_DIR/${BACKUP_NAME}_database.sql"
echo "Database backup completed: ${BACKUP_NAME}_database.sql"

# ML Models backup
echo "Backing up ML models..."
if [ -d "ml/models" ]; then
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_models.tar.gz" ml/models/
    echo "ML models backup completed: ${BACKUP_NAME}_models.tar.gz"
else
    echo "Warning: ml/models directory not found"
fi

# Data files backup
echo "Backing up data files..."
if [ -d "data" ]; then
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_data.tar.gz" data/
    echo "Data files backup completed: ${BACKUP_NAME}_data.tar.gz"
else
    echo "Warning: data directory not found"
fi

# Configuration backup
echo "Backing up configuration..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" \
    --exclude='.env' \
    --exclude='*.pyc' \
    --exclude='__pycache__' \
    alembic/ app/ scripts/ requirements.txt Dockerfile docker-compose*.yml Makefile

echo "Configuration backup completed: ${BACKUP_NAME}_config.tar.gz"

# Create backup manifest
cat > "$BACKUP_DIR/${BACKUP_NAME}_manifest.txt" << EOF
Cattle Prediction System Backup
Created: $TIMESTAMP
Backup Name: $BACKUP_NAME

Files:
- ${BACKUP_NAME}_database.sql (Database dump)
- ${BACKUP_NAME}_models.tar.gz (ML models)
- ${BACKUP_NAME}_data.tar.gz (Data files)
- ${BACKUP_NAME}_config.tar.gz (Application configuration)

Restore Instructions:
1. Restore database: psql \$DATABASE_URL < ${BACKUP_NAME}_database.sql
2. Extract models: tar -xzf ${BACKUP_NAME}_models.tar.gz
3. Extract data: tar -xzf ${BACKUP_NAME}_data.tar.gz
4. Extract config: tar -xzf ${BACKUP_NAME}_config.tar.gz
EOF

echo "Backup manifest created: ${BACKUP_NAME}_manifest.txt"

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "Total backup size: $BACKUP_SIZE"

echo "=== Backup completed successfully ==="
echo "Backup location: $BACKUP_DIR"
echo "Files created:"
ls -la "$BACKUP_DIR"/${BACKUP_NAME}*
