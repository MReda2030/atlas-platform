#!/bin/sh
set -e

echo "🚀 Atlas Travel Platform - Starting Docker Container"
echo "====================================================="

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until pg_isready -h "${DATABASE_HOST:-localhost}" -p "${DATABASE_PORT:-5432}" -U "${DATABASE_USER:-atlas_prod}"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "🌟 Starting Atlas Travel Platform..."
exec node server.js