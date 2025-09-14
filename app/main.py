from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, animals, farms, milk_records, diseases, predictions, reports
from app.config import settings

app = FastAPI(
    title="Cattle Prediction API",
    description="AI/ML-based cattle milk-yield & health prediction platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(animals.router)
app.include_router(farms.router)
app.include_router(milk_records.router)
app.include_router(diseases.router)
app.include_router(predictions.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Cattle Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "mock_mode": settings.USE_MOCKS
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}
