#!/usr/bin/env python3
"""
Database utility scripts for maintenance and management
"""

import sys
import os
from datetime import datetime, timedelta

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.database import SessionLocal
from app.models import User, Farm, Animal, MilkRecord, DiseaseRecord, Alert

def get_database_stats():
    """Get database statistics"""
    db = SessionLocal()
    
    try:
        print("=== Database Statistics ===")
        
        # Count records in each table
        stats = {
            'Users': db.query(User).count(),
            'Farms': db.query(Farm).count(),
            'Animals': db.query(Animal).count(),
            'Active Animals': db.query(Animal).filter(Animal.is_active == True).count(),
            'Milk Records': db.query(MilkRecord).count(),
            'Disease Records': db.query(DiseaseRecord).count(),
            'Active Disease Cases': db.query(DiseaseRecord).filter(DiseaseRecord.is_resolved == False).count(),
            'Alerts': db.query(Alert).count(),
            'Unresolved Alerts': db.query(Alert).filter(Alert.is_resolved == False).count(),
        }
        
        for table, count in stats.items():
            print(f"{table:20}: {count:,}")
        
        # Recent activity
        print("\n=== Recent Activity (Last 7 Days) ===")
        cutoff_date = datetime.now() - timedelta(days=7)
        
        recent_milk_records = db.query(MilkRecord).filter(
            MilkRecord.created_at >= cutoff_date
        ).count()
        
        recent_disease_records = db.query(DiseaseRecord).filter(
            DiseaseRecord.created_at >= cutoff_date
        ).count()
        
        recent_alerts = db.query(Alert).filter(
            Alert.created_at >= cutoff_date
        ).count()
        
        print(f"New Milk Records    : {recent_milk_records:,}")
        print(f"New Disease Records : {recent_disease_records:,}")
        print(f"New Alerts          : {recent_alerts:,}")
        
        # Top breeds
        print("\n=== Top Breeds ===")
        breed_stats = db.query(
            Animal.breed,
            func.count(Animal.id).label('count')
        ).filter(
            Animal.is_active == True,
            Animal.breed.isnot(None)
        ).group_by(Animal.breed).order_by(func.count(Animal.id).desc()).limit(5).all()
        
        for breed, count in breed_stats:
            print(f"{breed:15}: {count:,}")
        
    except Exception as e:
        print(f"Error getting database stats: {e}")
    finally:
        db.close()

def cleanup_old_data(days_old=365):
    """Clean up old data (older than specified days)"""
    db = SessionLocal()
    
    try:
        print(f"=== Cleaning up data older than {days_old} days ===")
        cutoff_date = datetime.now() - timedelta(days=days_old)
        
        # Clean up old resolved alerts
        old_alerts = db.query(Alert).filter(
            Alert.is_resolved == True,
            Alert.resolved_at < cutoff_date
        )
        alert_count = old_alerts.count()
        old_alerts.delete()
        
        print(f"Deleted {alert_count:,} old resolved alerts")
        
        # Clean up very old milk records (keep recent data for ML training)
        very_old_cutoff = datetime.now() - timedelta(days=days_old * 2)
        old_milk_records = db.query(MilkRecord).filter(
            MilkRecord.created_at < very_old_cutoff
        )
        milk_count = old_milk_records.count()
        
        if milk_count > 0:
            confirm = input(f"Delete {milk_count:,} very old milk records? (y/N): ")
            if confirm.lower() == 'y':
                old_milk_records.delete()
                print(f"Deleted {milk_count:,} old milk records")
            else:
                print("Skipped milk record cleanup")
        
        db.commit()
        print("Cleanup completed successfully")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

def vacuum_database():
    """Run database maintenance (PostgreSQL specific)"""
    db = SessionLocal()
    
    try:
        print("=== Running Database Maintenance ===")
        
        # Run VACUUM ANALYZE on all tables
        tables = ['users', 'farms', 'animals', 'milk_records', 'disease_records', 'alerts', 'sensor_readings', 'feed_profiles']
        
        for table in tables:
            print(f"Vacuuming {table}...")
            db.execute(text(f"VACUUM ANALYZE {table}"))
        
        db.commit()
        print("Database maintenance completed")
        
    except Exception as e:
        print(f"Error during database maintenance: {e}")
    finally:
        db.close()

def export_data_summary():
    """Export a summary of data for reporting"""
    db = SessionLocal()
    
    try:
        print("=== Exporting Data Summary ===")
        
        # Get summary data
        summary_query = """
        SELECT 
            f.name as farm_name,
            COUNT(DISTINCT a.id) as total_animals,
            COUNT(DISTINCT CASE WHEN a.is_active THEN a.id END) as active_animals,
            COUNT(mr.id) as milk_records,
            COALESCE(AVG(mr.total_l), 0) as avg_daily_milk,
            COUNT(dr.id) as disease_cases,
            COUNT(CASE WHEN NOT dr.is_resolved THEN dr.id END) as active_diseases
        FROM farms f
        LEFT JOIN animals a ON f.id = a.farm_id
        LEFT JOIN milk_records mr ON a.id = mr.animal_id
        LEFT JOIN disease_records dr ON a.id = dr.animal_id
        GROUP BY f.id, f.name
        ORDER BY f.name
        """
        
        result = db.execute(text(summary_query)).fetchall()
        
        # Write to CSV
        import csv
        filename = f"farm_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        with open(filename, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([
                'Farm Name', 'Total Animals', 'Active Animals', 
                'Milk Records', 'Avg Daily Milk (L)', 'Disease Cases', 'Active Diseases'
            ])
            
            for row in result:
                writer.writerow([
                    row.farm_name, row.total_animals, row.active_animals,
                    row.milk_records, round(float(row.avg_daily_milk), 2),
                    row.disease_cases, row.active_diseases
                ])
        
        print(f"Data summary exported to {filename}")
        
    except Exception as e:
        print(f"Error exporting data summary: {e}")
    finally:
        db.close()

def main():
    """Main function to run database utilities"""
    if len(sys.argv) < 2:
        print("Usage: python database_utils.py <command>")
        print("Commands:")
        print("  stats     - Show database statistics")
        print("  cleanup   - Clean up old data")
        print("  vacuum    - Run database maintenance")
        print("  export    - Export data summary")
        return
    
    command = sys.argv[1].lower()
    
    if command == 'stats':
        get_database_stats()
    elif command == 'cleanup':
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 365
        cleanup_old_data(days)
    elif command == 'vacuum':
        vacuum_database()
    elif command == 'export':
        export_data_summary()
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()
