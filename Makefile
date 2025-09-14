.PHONY: help build dev migrate seed test clean lint format docker-build docker-dev

help:
	@echo "Available commands:"
	@echo "  build        - Build Docker containers"
	@echo "  dev          - Start development environment"
	@echo "  migrate      - Run database migrations"
	@echo "  seed         - Generate and seed sample data"
	@echo "  test         - Run tests"
	@echo "  lint         - Run linting"
	@echo "  format       - Format code"
	@echo "  clean        - Clean up containers and volumes"
	@echo "  docker-build - Build Docker images"
	@echo "  docker-dev   - Start Docker development environment"

build:
	docker-compose build

dev:
	docker-compose up -d postgres redis
	sleep 5
	alembic upgrade head
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

migrate:
	alembic upgrade head

seed:
	python scripts/generate_sample_data.py

test:
	pytest -v --cov=app

lint:
	flake8 app tests
	black --check app tests

format:
	black app tests
	isort app tests

clean:
	docker-compose down -v
	docker system prune -f

docker-build:
	docker-compose build

docker-dev:
	docker-compose up --build

docker-prod:
	docker-compose -f docker-compose.prod.yml up --build -d

train-models:
	python scripts/train_models.py

# Development shortcuts
install:
	pip install -r requirements.txt
	pip install pytest pytest-asyncio httpx pytest-cov black flake8 isort

setup-dev: install
	alembic upgrade head
	python scripts/generate_sample_data.py
	python scripts/train_models.py

run-tests: seed test

ci: lint test docker-build
