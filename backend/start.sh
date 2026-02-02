#!/bin/sh

echo "⏳ Waiting for database..."
sleep 5

echo "📦 Running migrations..."
npx knex migrate:latest

echo "🌱 Running seeds..."
npx knex seed:run

echo "🚀 Starting backend server..."
npm start
