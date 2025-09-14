# Cattle Prediction API

A production-ready FastAPI backend for AI/ML-based cattle milk-yield & health prediction platform.

## 🚀 Features

- **FastAPI** with automatic OpenAPI/Swagger documentation
- **PostgreSQL** database with SQLAlchemy ORM and Alembic migrations
- **JWT Authentication** with role-based access control (Farmer, Vet, Admin)
- **ML Predictions** for milk yield and disease risk using scikit-learn, XGBoost, and LightGBM
- **Comprehensive API** for managing farms, animals, milk records, and health data
- **Docker** containerization with multi-stage builds
- **Automated Testing** with pytest and CI/CD pipeline
- **Reporting System** with CSV/JSON export capabilities

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [ML Model Training](#ml-model-training)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Development](#development)

## 🚀 Quick Start

### Using Docker (Recommended)

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd cattle-prediction-backend

# Start the development environment
make docker-dev

# The API will be available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
# PgAdmin at http://localhost:5050 (admin@cattle.com / admin)
\`\`\`

### Local Development

\`\`\`bash
# Install dependencies
make install

# Set up development environment
make setup-dev

# Start the development server
make dev
\`\`\`

## 📦 Installation

### Prerequisites

- Python 3.11+
- PostgreSQL 13+
- Docker & Docker Compose (optional but recommended)

### Environment Setup

1. **Clone the repository:**
   \`\`\`bash
   git clone <repository-url>
   cd cattle-prediction-backend
   \`\`\`

2. **Create virtual environment:**
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

3. **Install dependencies:**
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

4. **Set up environment variables:**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

\`\`\`env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cattle_db

# JWT Authentication
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
USE_MOCKS=false
DEBUG=true
\`\`\`

### Database Configuration

The application uses PostgreSQL with SQLAlchemy ORM. Connection details are configured via the `DATABASE_URL` environment variable.

## 🗄️ Database Setup

### Using Alembic Migrations

\`\`\`bash
# Initialize database (first time only)
alembic upgrade head

# Create new migration after model changes
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
\`\`\`

### Generate Sample Data

\`\`\`bash
# Generate 1000 sample records
python scripts/generate_sample_data.py

# This creates data/cattle_dataset_1000.csv
\`\`\`

## 🤖 ML Model Training

### Training Models

\`\`\`bash
# Train all models (milk yield + disease prediction)
python scripts/train_models.py

# Or use make command
make train-models
\`\`\`

### Model Information

The system trains multiple algorithms and automatically selects the best performing model:

- **Milk Yield Prediction (Regression):**
  - Linear Regression
  - Random Forest
  - Gradient Boosting
  - XGBoost
  - LightGBM

- **Disease Prediction (Classification):**
  - Logistic Regression
  - Random Forest
  - Gradient Boosting
  - XGBoost
  - LightGBM

Models are saved to `ml/models/` directory with metadata and preprocessing objects.

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Authentication

All API endpoints (except registration and login) require JWT authentication:

\`\`\`bash
# Login to get token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# Use token in subsequent requests
curl -X GET "http://localhost:8000/api/animals/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

#### Animals Management
- `GET /api/animals/` - List animals (with filtering)
- `GET /api/animals/{id}` - Get specific animal
- `POST /api/animals/` - Create new animal
- `PUT /api/animals/{id}` - Update animal
- `DELETE /api/animals/{id}` - Deactivate animal

#### Predictions
- `POST /api/predict/milk` - Predict milk yield
- `POST /api/predict/disease` - Predict disease risk
- `GET /api/predict/models/status` - Get model status

#### Reports
- `GET /api/reports/?format=csv&report_type=summary` - Generate reports

### Example API Calls

#### Milk Yield Prediction

\`\`\`bash
curl -X POST "http://localhost:8000/api/predict/milk" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "animal_id": 1,
    "breed": "Holstein",
    "age_months": 48,
    "parity": 2,
    "weight_kg": 600.0,
    "feed_quantity_kg": 25.0,
    "protein_content_percent": 16.0,
    "temperature_c": 20.0,
    "humidity_percent": 65.0,
    "activity_hours": 8.0,
    "rumination_hours": 7.5,
    "health_score": 8.0
  }'
\`\`\`

#### Disease Risk Prediction

\`\`\`bash
curl -X POST "http://localhost:8000/api/predict/disease" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "animal_id": 1,
    "age_months": 48,
    "parity": 2,
    "health_score": 8.0,
    "activity_hours": 8.0,
    "rumination_hours": 7.5,
    "milk_yield_trend": 0.05,
    "temperature_c": 20.0,
    "humidity_percent": 65.0
  }'
\`\`\`

## 🧪 Testing

### Running Tests

\`\`\`bash
# Run all tests
make test

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run tests in Docker
docker-compose run api pytest
\`\`\`

### Test Structure

- `tests/conftest.py` - Test fixtures and configuration
- `tests/test_auth.py` - Authentication tests
- `tests/test_animals.py` - Animal management tests
- `tests/test_predictions.py` - ML prediction tests
- `tests/test_ml_pipeline.py` - ML pipeline tests

## 🚀 Deployment

### Production Deployment

\`\`\`bash
# Build production image
docker build --target production -t cattle-api:latest .

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d

# Or use make command
make docker-prod
\`\`\`

### Environment Variables for Production

\`\`\`env
DATABASE_URL=postgresql://user:password@db-host:5432/cattle_db
SECRET_KEY=your-super-secure-production-key
USE_MOCKS=false
POSTGRES_PASSWORD=secure-db-password
\`\`\`

### Health Checks

The application includes health check endpoints:

- `GET /health` - Basic health check
- `GET /api/predict/models/status` - ML models status

## 👩‍💻 Development

### Project Structure

\`\`\`
cattle-prediction-backend/
├── app/                    # FastAPI application
│   ├── routers/           # API route handlers
│   ├── models.py          # SQLAlchemy models
│   ├── schemas.py         # Pydantic schemas
│   ├── auth.py            # Authentication logic
│   ├── database.py        # Database configuration
│   └── main.py            # FastAPI app instance
├── ml/                    # Machine learning components
│   ├── data_preprocessing.py
│   ├── train_milk_model.py
│   ├── train_disease_model.py
│   └── predict_service.py
├── alembic/               # Database migrations
├── tests/                 # Test suite
├── scripts/               # Utility scripts
├── data/                  # Generated datasets
└── ml/models/             # Trained ML models
\`\`\`

### Code Style

The project uses:
- **Black** for code formatting
- **Flake8** for linting
- **isort** for import sorting

\`\`\`bash
# Format code
make format

# Check linting
make lint
\`\`\`

### Adding New Features

1. **Database Changes:**
   \`\`\`bash
   # Modify models in app/models.py
   # Generate migration
   alembic revision --autogenerate -m "Add new feature"
   # Apply migration
   alembic upgrade head
   \`\`\`

2. **API Endpoints:**
   - Add routes in `app/routers/`
   - Add schemas in `app/schemas.py`
   - Add tests in `tests/`

3. **ML Models:**
   - Add training logic in `ml/`
   - Update prediction service
   - Add model tests

### Makefile Commands

\`\`\`bash
make help          # Show all available commands
make dev           # Start development server
make test          # Run tests
make lint          # Run linting
make format        # Format code
make docker-dev    # Start Docker development
make train-models  # Train ML models
make seed          # Generate sample data
make migrate       # Run database migrations
make clean         # Clean up Docker resources
\`\`\`

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues:**
   \`\`\`bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check database logs
   docker-compose logs postgres
   \`\`\`

2. **Migration Issues:**
   \`\`\`bash
   # Reset migrations (development only)
   alembic downgrade base
   alembic upgrade head
   \`\`\`

3. **ML Model Issues:**
   \`\`\`bash
   # Check if models are trained
   ls -la ml/models/
   
   # Retrain models
   python scripts/train_models.py
   \`\`\`

4. **Permission Issues:**
   \`\`\`bash
   # Check user roles in database
   # Admin users can access all data
   # Farmers can only access their own farms
   # Vets can access all animals but limited admin functions
   \`\`\`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the test cases for usage examples
