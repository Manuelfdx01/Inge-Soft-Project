#!/bin/sh
# Entrypoint: migrate, seed data, then start the server
set -e

echo "⏳ Applying database migrations..."
python manage.py migrate --noinput

echo "🌱 Seeding recycling guides (if empty)..."
python manage.py seed_guides

echo "🌱 Seeding collection points (if empty)..."
python manage.py seed_collection_points

echo "🌱 Seeding gamification achievements & rewards (if empty)..."
python manage.py seed_gamification

echo "🚀 Starting Django development server..."
exec python manage.py runserver 0.0.0.0:8000
