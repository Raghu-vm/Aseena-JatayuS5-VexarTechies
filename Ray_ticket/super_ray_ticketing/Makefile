.PHONY: install dev migrate revision worker beat seed test lint clean

install:
	pip install -r requirements-dev.txt

dev:
	uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload

migrate:
	alembic upgrade head

revision:
	@read -p "Migration message: " msg; alembic revision --autogenerate -m "$$msg"

worker:
	celery -A app.workers.celery_app.celery_app worker --loglevel=info --concurrency=4

beat:
	celery -A app.workers.celery_app.celery_app beat --loglevel=info

seed:
	python -m scripts.seed_users

test:
	pytest -v

lint:
	ruff check app/ tests/ scripts/

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .ruff_cache .mypy_cache
