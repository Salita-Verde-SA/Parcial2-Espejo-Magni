#!/bin/sh
echo "Running database seed..."
python -m app.db.seed
echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
