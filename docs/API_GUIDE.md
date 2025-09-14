# API Usage Guide

This guide provides detailed examples of how to use the Cattle Prediction API.

## Authentication

### Register a New User

\`\`\`bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "farmer1",
    "email": "farmer1@example.com",
    "password": "securepassword",
    "role": "farmer"
  }'
\`\`\`

### Login

\`\`\`bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "farmer1",
    "password": "securepassword"
  }'
\`\`\`

Response:
\`\`\`json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
\`\`\`

## Farm Management

### Create a Farm

\`\`\`bash
curl -X POST "http://localhost:8000/api/farms/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Green Valley Farm",
    "location": "Wisconsin, USA",
    "timezone": "America/Chicago"
  }'
\`\`\`

### List Farms

\`\`\`bash
curl -X GET "http://localhost:8000/api/farms/" \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

## Animal Management

### Add an Animal

\`\`\`bash
curl -X POST "http://localhost:8000/api/animals/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "farm_id": 1,
    "tag_number": "GV001",
    "breed": "Holstein",
    "dob": "2020-03-15",
    "sex": "F",
    "parity": 2,
    "current_weight": 650.0,
    "lactation_start_date": "2023-01-10"
  }'
\`\`\`

### List Animals with Filters

\`\`\`bash
# Get all animals
curl -X GET "http://localhost:8000/api/animals/" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by breed
curl -X GET "http://localhost:8000/api/animals/?breed=Holstein" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by farm
curl -X GET "http://localhost:8000/api/animals/?farm_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Pagination
curl -X GET "http://localhost:8000/api/animals/?skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

### Get Animal Details

\`\`\`bash
curl -X GET "http://localhost:8000/api/animals/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

## Milk Records

### Add Milk Record

\`\`\`bash
curl -X POST "http://localhost:8000/api/milk-records/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "animal_id": 1,
    "date": "2024-01-15",
    "morning_l": 12.5,
    "evening_l": 11.8,
    "fat_percentage": 3.8,
    "protein_percentage": 3.2,
    "somatic_cell_count": 150000
  }'
\`\`\`

### Get Milk Production Summary

\`\`\`bash
curl -X GET "http://localhost:8000/api/milk-records/summary?farm_id=1&date_from=2024-01-01&date_to=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

## Predictions

### Milk Yield Prediction

\`\`\`bash
curl -X POST "http://localhost:8000/api/predict/milk" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "animal_id": 1,
    "breed": "Holstein",
    "age_months": 48,
    "parity": 2,
    "weight_kg": 650.0,
    "feed_quantity_kg": 25.0,
    "protein_content_percent": 16.5,
    "temperature_c": 18.0,
    "humidity_percent": 68.0,
    "activity_hours": 8.5,
    "rumination_hours": 7.8,
    "health_score": 8.2
  }'
\`\`\`

Response:
\`\`\`json
{
  "animal_id": 1,
  "predicted_milk_yield": 24.3,
  "confidence_score": 0.87,
  "factors": {
    "health": "Excellent health supporting high yield",
    "nutrition": "High protein feed boosting production",
    "maturity": "Optimal age and parity for peak production"
  }
}
\`\`\`

### Disease Risk Prediction

\`\`\`bash
curl -X POST "http://localhost:8000/api/predict/disease" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "animal_id": 1,
    "age_months": 48,
    "parity": 2,
    "health_score": 8.2,
    "activity_hours": 8.5,
    "rumination_hours": 7.8,
    "milk_yield_trend": 0.02,
    "temperature_c": 18.0,
    "humidity_percent": 68.0
  }'
\`\`\`

Response:
\`\`\`json
{
  "animal_id": 1,
  "disease_risk": 0.12,
  "risk_level": "low",
  "recommended_actions": [
    "Continue current management practices",
    "Regular health checks sufficient"
  ],
  "confidence_score": 0.84
}
\`\`\`

## Reports

### Generate Summary Report

\`\`\`bash
curl -X GET "http://localhost:8000/api/reports/?report_type=summary&date_from=2024-01-01&date_to=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

### Export to CSV

\`\`\`bash
curl -X GET "http://localhost:8000/api/reports/?format=csv&report_type=milk&date_from=2024-01-01&date_to=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o milk_report.csv
\`\`\`

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

Example error response:
\`\`\`json
{
  "detail": "Animal not found"
}
\`\`\`

## Rate Limiting

Currently, there are no rate limits implemented, but in production, consider implementing rate limiting based on your requirements.

## Pagination

Most list endpoints support pagination:

\`\`\`bash
curl -X GET "http://localhost:8000/api/animals/?skip=20&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

Parameters:
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records to return (default: 100, max: 1000)
