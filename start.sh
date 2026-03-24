#!/bin/bash
set -e

echo "🕊️  Holy Face Church - Faith Formation Platform"
echo "================================================"

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Check if DB needs seeding
if [ ! -f "prisma/seeded.lock" ]; then
  echo "🌱 Seeding database..."
  npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts && touch prisma/seeded.lock
fi

# Build
echo "🏗️  Building application..."
npm run build

echo ""
echo "✅ Ready! Starting on port 3100..."
echo "🌐 Access at: http://localhost:3100"
echo ""

npm start -- -p 3100
