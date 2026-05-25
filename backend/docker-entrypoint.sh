#!/bin/sh
echo "Ejecutando seed de la base de datos..."
python -m app.db.seed
echo "Iniciando la aplicación..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000