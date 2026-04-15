#!/bin/sh

set -e

echo "Waiting for DB..."
sleep 5

echo "Running migrations..."
python -m alembic upgrade head

echo "Starting app..."
uvicorn app.main:app --host 0.0.0.0 --port 8000
