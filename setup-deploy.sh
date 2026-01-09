#!/bin/bash

echo "Setting up AI VSL Creator for Railway deployment..."

# Navigate to server directory and generate package-lock.json
echo "Generating package-lock.json for server..."
cd ai/server
rm -f package-lock.json
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Commit the new package-lock.json file in ai/server/"
echo "2. Set these environment variables in Railway dashboard:"
echo "   - DATABASE_URL (your PostgreSQL connection string)"
echo "   - NODE_ENV=production"
echo "   - APP_URL (your Railway app URL)"
echo "3. Push to deploy!"