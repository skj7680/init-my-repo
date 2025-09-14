# Complete Cattle Prediction Platform Setup Guide

This guide provides comprehensive instructions for setting up both the backend and frontend of the Cattle Prediction Platform.

## 🏗️ Architecture Overview

The Cattle Prediction Platform consists of:

- **Backend**: FastAPI with PostgreSQL, ML models, and comprehensive APIs
- **Frontend**: React TypeScript with Redux, Ant Design, and data visualization
- **Database**: PostgreSQL with Alembic migrations
- **ML Pipeline**: Scikit-learn models for milk yield and disease prediction
- **Authentication**: JWT-based with role-based access control

## 📋 Prerequisites

### System Requirements

- **Python 3.9+** with pip
- **Node.js 18+** with npm/yarn
- **PostgreSQL 13+**
- **Docker & Docker Compose** (optional but recommended)
- **Git** for version control

### Development Tools (Recommended)

- **VS Code** with Python and TypeScript extensions
- **Postman** or similar for API testing
- **pgAdmin** or similar for database management

## 🚀 Quick Start (Docker)

The fastest way to get started is using Docker Compose:

1. **Clone the repository**:
   \`\`\`bash
   git clone <repository-url>
   cd cattle-prediction-platform
   \`\`\`

2. **Start all services**:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

3. **Access the applications**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

4. **Create initial data**:
   \`\`\`bash
   docker-compose exec backend python scripts/generate_sample_data.py
   docker-compose exec backend python scripts/create_admin_user.py
   \`\`\`

## 🔧 Manual Setup

### 1. Backend Setup

#### Database Setup

1. **Install PostgreSQL**:
   \`\`\`bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS
   brew install postgresql
   brew services start postgresql

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   \`\`\`

2. **Create database and user**:
   \`\`\`sql
   sudo -u postgres psql
   CREATE DATABASE cattle_prediction;
   CREATE USER cattle_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE cattle_prediction TO cattle_user;
   \q
   \`\`\`

#### Python Environment

1. **Create virtual environment**:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. **Environment configuration**:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your database credentials
   \`\`\`

4. **Run database migrations**:
   \`\`\`bash
   alembic upgrade head
   \`\`\`

5. **Generate sample data**:
   \`\`\`bash
   python scripts/generate_sample_data.py
   python scripts/create_admin_user.py
   \`\`\`

6. **Train ML models**:
   \`\`\`bash
   python scripts/train_models.py
   \`\`\`

7. **Start the backend server**:
   \`\`\`bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   \`\`\`

### 2. Frontend Setup

1. **Navigate to frontend directory**:
   \`\`\`bash
   cd frontend
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment configuration**:
   \`\`\`bash
   # Create .env file
   echo "VITE_API_BASE_URL=http://localhost:8000" > .env
   \`\`\`

4. **Start development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Access the application**:
   Open http://localhost:3000 in your browser

## 🔐 Initial Setup & Configuration

### 1. Create Admin User

\`\`\`bash
# Using the script
python scripts/create_admin_user.py

# Or manually via API
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "full_name": "System Administrator",
    "role": "admin"
  }'
\`\`\`

### 2. Login and Test

1. **Access frontend**: http://localhost:3000
2. **Login with admin credentials**
3. **Verify all features work**:
   - Dashboard loads with statistics
   - Animal management CRUD operations
   - Milk records tracking
   - AI predictions generate results
   - Reports display data

### 3. Create Test Data

The sample data generator creates:
- 5 farms with realistic details
- 50 animals with various breeds
- 500+ milk production records
- Health records and disease data
- Sensor readings and alerts

## 📊 Feature Verification

### Backend API Testing

Test key endpoints using curl or Postman:

\`\`\`bash
# Health check
curl http://localhost:8000/health

# Get animals (requires auth)
curl -H "Authorization: Bearer <token>" http://localhost:8000/animals

# Generate prediction
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:8000/predictions/milk-yield/1
\`\`\`

### Frontend Feature Testing

1. **Authentication Flow**:
   - Register new user
   - Login/logout functionality
   - Role-based navigation

2. **Data Management**:
   - Create, read, update, delete animals
   - Record milk production data
   - Track health records

3. **AI Features**:
   - Generate milk yield predictions
   - Assess disease risk
   - View prediction history

4. **Analytics**:
   - Dashboard statistics
   - Production reports
   - Health analytics
   - Data export functionality

## 🐳 Docker Deployment

### Development Environment

\`\`\`yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: cattle_prediction
      POSTGRES_USER: cattle_user
      POSTGRES_PASSWORD: cattle_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://cattle_user:cattle_password@db:5432/cattle_prediction
    depends_on:
      - db
    volumes:
      - ./app:/app/app
      - ./ml:/app/ml

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE_URL: http://localhost:8000
    volumes:
      - ./frontend/src:/app/src

volumes:
  postgres_data:
\`\`\`

### Production Deployment

\`\`\`yaml
# docker-compose.prod.yml
version: '3.8'
services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: cattle_prediction
      POSTGRES_USER: cattle_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: postgresql://cattle_user:${DB_PASSWORD}@db:5432/cattle_prediction
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
\`\`\`

## 🔧 Configuration Options

### Backend Configuration

Key environment variables in `.env`:

\`\`\`env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cattle_prediction

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ML Models
ML_MODEL_PATH=./models
ENABLE_MOCK_PREDICTIONS=false

# API Settings
API_V1_STR=/api/v1
PROJECT_NAME="Cattle Prediction Platform"
\`\`\`

### Frontend Configuration

Environment variables in `frontend/.env`:

\`\`\`env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_EXPORT=true

# Development
VITE_DEV_MODE=true
\`\`\`

## 🚀 Production Deployment

### 1. Server Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ or similar

### 2. Security Setup

\`\`\`bash
# SSL Certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# Firewall configuration
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
\`\`\`

### 3. Database Backup

\`\`\`bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump cattle_prediction > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
\`\`\`

### 4. Monitoring Setup

\`\`\`bash
# Install monitoring tools
docker run -d --name prometheus prom/prometheus
docker run -d --name grafana grafana/grafana
\`\`\`

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   \`\`\`bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U cattle_user -d cattle_prediction
   \`\`\`

2. **Port Already in Use**:
   \`\`\`bash
   # Find and kill process
   lsof -ti:8000 | xargs kill -9
   lsof -ti:3000 | xargs kill -9
   \`\`\`

3. **ML Model Training Fails**:
   \`\`\`bash
   # Check data availability
   python -c "from app.database import get_db; print('DB connection OK')"
   
   # Regenerate sample data
   python scripts/generate_sample_data.py
   \`\`\`

4. **Frontend Build Errors**:
   \`\`\`bash
   # Clear cache and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   \`\`\`

### Performance Issues

1. **Slow API Responses**:
   - Check database indexes
   - Monitor query performance
   - Enable API caching

2. **High Memory Usage**:
   - Optimize ML model loading
   - Implement pagination
   - Use database connection pooling

3. **Frontend Loading Issues**:
   - Enable code splitting
   - Optimize bundle size
   - Implement lazy loading

## 📚 Additional Resources

### Documentation

- [Backend API Documentation](http://localhost:8000/docs)
- [Frontend Component Library](./frontend/docs/components.md)
- [Database Schema](./docs/database-schema.md)
- [ML Model Documentation](./docs/ml-models.md)

### Development Tools

- **API Testing**: Use Postman collection in `./docs/postman/`
- **Database Management**: pgAdmin or DBeaver
- **Code Quality**: Pre-commit hooks configured
- **Testing**: Pytest for backend, Jest for frontend

### Support

For issues and questions:

1. Check this documentation
2. Review error logs in `./logs/`
3. Test API endpoints individually
4. Verify database connectivity
5. Check browser console for frontend issues

## 🎯 Next Steps

After successful setup:

1. **Customize Configuration**: Adjust settings for your environment
2. **Add Real Data**: Import your actual cattle data
3. **Train Custom Models**: Use your data to improve predictions
4. **Set Up Monitoring**: Implement logging and alerting
5. **Scale Infrastructure**: Add load balancing and redundancy
6. **Backup Strategy**: Implement automated backups
7. **Security Hardening**: Review and enhance security measures

The platform is now ready for production use with comprehensive cattle management and AI-powered predictions!
