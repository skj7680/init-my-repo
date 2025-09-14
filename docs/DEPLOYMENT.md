# Deployment Guide

This guide covers deploying the Cattle Prediction API to various environments.

## Production Deployment

### Docker Deployment (Recommended)

1. **Prepare Environment Variables**

Create a `.env.prod` file:
\`\`\`env
DATABASE_URL=postgresql://cattle_user:SECURE_PASSWORD@postgres:5432/cattle_db
SECRET_KEY=your-super-secure-production-key-min-32-chars
POSTGRES_DB=cattle_db
POSTGRES_USER=cattle_user
POSTGRES_PASSWORD=SECURE_PASSWORD
USE_MOCKS=false
\`\`\`

2. **Deploy with Docker Compose**

\`\`\`bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api
\`\`\`

3. **Initialize Database**

\`\`\`bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec api alembic upgrade head

# Generate sample data (optional)
docker-compose -f docker-compose.prod.yml exec api python scripts/generate_sample_data.py

# Train ML models
docker-compose -f docker-compose.prod.yml exec api python scripts/train_models.py
\`\`\`

### Cloud Deployment

#### AWS ECS with RDS

1. **Set up RDS PostgreSQL instance**
2. **Create ECS cluster and task definition**
3. **Configure environment variables in ECS**
4. **Set up Application Load Balancer**
5. **Configure auto-scaling**

#### Google Cloud Run

\`\`\`bash
# Build and push to Google Container Registry
docker build --target production -t gcr.io/PROJECT_ID/cattle-api .
docker push gcr.io/PROJECT_ID/cattle-api

# Deploy to Cloud Run
gcloud run deploy cattle-api \
  --image gcr.io/PROJECT_ID/cattle-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=postgresql://...,SECRET_KEY=...
\`\`\`

#### Heroku

\`\`\`bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create cattle-prediction-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set USE_MOCKS=false

# Deploy
git push heroku main

# Run migrations
heroku run alembic upgrade head

# Generate sample data
heroku run python scripts/generate_sample_data.py
\`\`\`

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | JWT signing key (32+ chars) | `your-super-secret-key-here` |
| `USE_MOCKS` | Enable mock predictions | `false` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiry | `30` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `false` |
| `ALGORITHM` | JWT algorithm | `HS256` |

## Database Setup

### PostgreSQL Configuration

Recommended PostgreSQL settings for production:

\`\`\`sql
-- postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
\`\`\`

### Database Migrations

\`\`\`bash
# Check current migration status
alembic current

# Upgrade to latest
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show migration history
alembic history
\`\`\`

## Security Considerations

### JWT Security

- Use a strong, random SECRET_KEY (32+ characters)
- Set appropriate token expiry times
- Consider implementing token refresh rotation
- Use HTTPS in production

### Database Security

- Use strong database passwords
- Restrict database access to application servers only
- Enable SSL connections
- Regular security updates

### API Security

- Enable CORS appropriately for your frontend
- Implement rate limiting
- Use HTTPS only
- Validate all input data
- Log security events

## Monitoring and Logging

### Health Checks

The application provides health check endpoints:

\`\`\`bash
# Basic health check
curl http://your-domain/health

# Detailed model status
curl -H "Authorization: Bearer TOKEN" http://your-domain/api/predict/models/status
\`\`\`

### Logging Configuration

Add structured logging in production:

\`\`\`python
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
\`\`\`

### Metrics Collection

Consider implementing:
- Request/response metrics
- Database query performance
- ML model prediction latency
- Error rates and types

## Backup and Recovery

### Database Backups

\`\`\`bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_file.sql
\`\`\`

### ML Model Backups

\`\`\`bash
# Backup trained models
tar -czf models_backup_$(date +%Y%m%d).tar.gz ml/models/

# Restore models
tar -xzf models_backup_YYYYMMDD.tar.gz
\`\`\`

## Performance Optimization

### Database Optimization

1. **Indexes**: Ensure proper indexes on frequently queried columns
2. **Connection Pooling**: Use connection pooling for better performance
3. **Query Optimization**: Monitor and optimize slow queries

### API Optimization

1. **Caching**: Implement Redis caching for frequently accessed data
2. **Pagination**: Use proper pagination for large datasets
3. **Async Operations**: Use async/await for I/O operations

### ML Model Optimization

1. **Model Caching**: Keep models loaded in memory
2. **Batch Predictions**: Process multiple predictions together
3. **Model Versioning**: Implement A/B testing for model updates

## Scaling

### Horizontal Scaling

- Use load balancers to distribute traffic
- Scale API containers based on CPU/memory usage
- Implement database read replicas for read-heavy workloads

### Vertical Scaling

- Monitor resource usage and scale up as needed
- Optimize memory usage for ML models
- Use appropriate instance sizes for your workload

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   \`\`\`bash
   # Check database connectivity
   docker-compose exec api python -c "from app.database import engine; print(engine.execute('SELECT 1').scalar())"
   \`\`\`

2. **Migration Issues**
   \`\`\`bash
   # Check migration status
   docker-compose exec api alembic current
   
   # Force migration
   docker-compose exec api alembic stamp head
   \`\`\`

3. **ML Model Issues**
   \`\`\`bash
   # Check if models exist
   docker-compose exec api ls -la ml/models/
   
   # Retrain models
   docker-compose exec api python scripts/train_models.py
   \`\`\`

### Log Analysis

\`\`\`bash
# View application logs
docker-compose logs -f api

# View database logs
docker-compose logs -f postgres

# Filter logs by level
docker-compose logs api | grep ERROR
