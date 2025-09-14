from typing import Optional
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
import pandas as pd
import io
from app.database import get_db
from app.models import Animal, Farm, MilkRecord, DiseaseRecord, Alert, User
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/")
async def generate_report(
    format: str = Query("json", regex="^(json|csv|pdf)$"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    farm_id: Optional[int] = Query(None),
    report_type: str = Query("summary", regex="^(summary|milk|health|alerts)$"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate various reports in different formats"""
    
    # Set default date range if not provided
    if not date_to:
        date_to = datetime.now().date()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    # Role-based filtering
    farm_filter = None
    if current_user.role == "farmer":
        user_farms = db.query(Farm.id).filter(Farm.owner_id == current_user.id).all()
        user_farm_ids = [f.id for f in user_farms]
        if farm_id and farm_id not in user_farm_ids:
            raise HTTPException(status_code=403, detail="Not authorized to view this farm's data")
        farm_filter = user_farm_ids
    elif farm_id:
        farm_filter = [farm_id]
    
    # Generate report based on type
    if report_type == "summary":
        data = await _generate_summary_report(db, date_from, date_to, farm_filter)
    elif report_type == "milk":
        data = await _generate_milk_report(db, date_from, date_to, farm_filter)
    elif report_type == "health":
        data = await _generate_health_report(db, date_from, date_to, farm_filter)
    elif report_type == "alerts":
        data = await _generate_alerts_report(db, date_from, date_to, farm_filter)
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    # Return data in requested format
    if format == "json":
        return data
    elif format == "csv":
        return _generate_csv_response(data, f"{report_type}_report_{date_from}_{date_to}.csv")
    elif format == "pdf":
        # For now, return JSON with a note about PDF generation
        return {
            "message": "PDF generation not implemented yet",
            "data": data,
            "note": "Use CSV format for now"
        }

async def _generate_summary_report(
    db: Session, 
    date_from: date, 
    date_to: date, 
    farm_filter: Optional[list]
) -> dict:
    """Generate summary report"""
    
    # Base queries
    animals_query = db.query(Animal)
    milk_query = db.query(MilkRecord).join(Animal)
    disease_query = db.query(DiseaseRecord).join(Animal)
    alerts_query = db.query(Alert)
    
    # Apply farm filtering
    if farm_filter:
        animals_query = animals_query.filter(Animal.farm_id.in_(farm_filter))
        milk_query = milk_query.filter(Animal.farm_id.in_(farm_filter))
        disease_query = disease_query.filter(Animal.farm_id.in_(farm_filter))
        alerts_query = alerts_query.filter(Alert.farm_id.in_(farm_filter))
    
    # Apply date filtering
    milk_query = milk_query.filter(and_(
        MilkRecord.date >= date_from,
        MilkRecord.date <= date_to
    ))
    disease_query = disease_query.filter(and_(
        DiseaseRecord.diagnosis_date >= date_from,
        DiseaseRecord.diagnosis_date <= date_to
    ))
    alerts_query = alerts_query.filter(and_(
        Alert.created_at >= datetime.combine(date_from, datetime.min.time()),
        Alert.created_at <= datetime.combine(date_to, datetime.max.time())
    ))
    
    # Calculate metrics
    total_animals = animals_query.filter(Animal.is_active == True).count()
    
    milk_stats = milk_query.with_entities(
        func.sum(MilkRecord.total_l).label('total_production'),
        func.avg(MilkRecord.total_l).label('avg_daily'),
        func.count(MilkRecord.id).label('record_count')
    ).first()
    
    disease_count = disease_query.count()
    active_diseases = disease_query.filter(DiseaseRecord.is_resolved == False).count()
    
    alert_stats = alerts_query.with_entities(
        func.count(Alert.id).label('total_alerts'),
        func.sum(func.case([(Alert.is_resolved == False, 1)], else_=0)).label('active_alerts')
    ).first()
    
    return {
        "report_type": "summary",
        "date_range": {"from": str(date_from), "to": str(date_to)},
        "farm_summary": {
            "total_active_animals": total_animals,
            "farms_included": len(farm_filter) if farm_filter else "all"
        },
        "milk_production": {
            "total_liters": float(milk_stats.total_production or 0),
            "average_daily_per_cow": float(milk_stats.avg_daily or 0),
            "total_records": milk_stats.record_count
        },
        "health_summary": {
            "total_disease_cases": disease_count,
            "active_disease_cases": active_diseases,
            "disease_rate": round(disease_count / max(total_animals, 1) * 100, 2)
        },
        "alerts_summary": {
            "total_alerts": alert_stats.total_alerts or 0,
            "active_alerts": alert_stats.active_alerts or 0
        }
    }

async def _generate_milk_report(
    db: Session, 
    date_from: date, 
    date_to: date, 
    farm_filter: Optional[list]
) -> dict:
    """Generate detailed milk production report"""
    
    query = db.query(
        MilkRecord.date,
        Animal.tag_number,
        Animal.breed,
        Farm.name.label('farm_name'),
        MilkRecord.morning_l,
        MilkRecord.evening_l,
        MilkRecord.total_l,
        MilkRecord.fat_percentage,
        MilkRecord.protein_percentage
    ).join(Animal).join(Farm)
    
    # Apply filters
    if farm_filter:
        query = query.filter(Animal.farm_id.in_(farm_filter))
    
    query = query.filter(and_(
        MilkRecord.date >= date_from,
        MilkRecord.date <= date_to
    )).order_by(desc(MilkRecord.date), Animal.tag_number)
    
    records = query.all()
    
    # Convert to list of dictionaries
    milk_data = []
    for record in records:
        milk_data.append({
            "date": str(record.date),
            "animal_tag": record.tag_number,
            "breed": record.breed,
            "farm_name": record.farm_name,
            "morning_liters": record.morning_l,
            "evening_liters": record.evening_l,
            "total_liters": record.total_l,
            "fat_percentage": record.fat_percentage,
            "protein_percentage": record.protein_percentage
        })
    
    return {
        "report_type": "milk_production",
        "date_range": {"from": str(date_from), "to": str(date_to)},
        "total_records": len(milk_data),
        "data": milk_data
    }

async def _generate_health_report(
    db: Session, 
    date_from: date, 
    date_to: date, 
    farm_filter: Optional[list]
) -> dict:
    """Generate health report"""
    
    query = db.query(
        DiseaseRecord.diagnosis_date,
        Animal.tag_number,
        Animal.breed,
        Farm.name.label('farm_name'),
        DiseaseRecord.disease_name,
        DiseaseRecord.severity,
        DiseaseRecord.treatment,
        DiseaseRecord.is_resolved,
        DiseaseRecord.recovery_date
    ).join(Animal).join(Farm)
    
    # Apply filters
    if farm_filter:
        query = query.filter(Animal.farm_id.in_(farm_filter))
    
    query = query.filter(and_(
        DiseaseRecord.diagnosis_date >= date_from,
        DiseaseRecord.diagnosis_date <= date_to
    )).order_by(desc(DiseaseRecord.diagnosis_date))
    
    records = query.all()
    
    # Convert to list of dictionaries
    health_data = []
    for record in records:
        health_data.append({
            "diagnosis_date": str(record.diagnosis_date),
            "animal_tag": record.tag_number,
            "breed": record.breed,
            "farm_name": record.farm_name,
            "disease": record.disease_name,
            "severity": record.severity,
            "treatment": record.treatment,
            "resolved": record.is_resolved,
            "recovery_date": str(record.recovery_date) if record.recovery_date else None
        })
    
    return {
        "report_type": "health",
        "date_range": {"from": str(date_from), "to": str(date_to)},
        "total_cases": len(health_data),
        "data": health_data
    }

async def _generate_alerts_report(
    db: Session, 
    date_from: date, 
    date_to: date, 
    farm_filter: Optional[list]
) -> dict:
    """Generate alerts report"""
    
    query = db.query(
        Alert.created_at,
        Alert.alert_type,
        Alert.severity,
        Alert.message,
        Alert.is_resolved,
        Alert.resolved_at,
        Animal.tag_number,
        Farm.name.label('farm_name')
    ).outerjoin(Animal).outerjoin(Farm)
    
    # Apply filters
    if farm_filter:
        query = query.filter(Alert.farm_id.in_(farm_filter))
    
    query = query.filter(and_(
        Alert.created_at >= datetime.combine(date_from, datetime.min.time()),
        Alert.created_at <= datetime.combine(date_to, datetime.max.time())
    )).order_by(desc(Alert.created_at))
    
    records = query.all()
    
    # Convert to list of dictionaries
    alerts_data = []
    for record in records:
        alerts_data.append({
            "created_at": record.created_at.isoformat(),
            "alert_type": record.alert_type,
            "severity": record.severity,
            "message": record.message,
            "resolved": record.is_resolved,
            "resolved_at": record.resolved_at.isoformat() if record.resolved_at else None,
            "animal_tag": record.tag_number,
            "farm_name": record.farm_name
        })
    
    return {
        "report_type": "alerts",
        "date_range": {"from": str(date_from), "to": str(date_to)},
        "total_alerts": len(alerts_data),
        "data": alerts_data
    }

def _generate_csv_response(data: dict, filename: str) -> StreamingResponse:
    """Generate CSV response from report data"""
    
    # Extract the data array from the report
    if "data" in data and isinstance(data["data"], list):
        df = pd.DataFrame(data["data"])
    else:
        # For summary reports, create a simple CSV
        df = pd.DataFrame([data])
    
    # Create CSV string
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()
    
    # Create streaming response
    response = StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
    
    return response
