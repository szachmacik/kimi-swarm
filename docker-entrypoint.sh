#!/bin/sh
set -e

echo "🚀 KIMI SWARM — Starting..."
echo "NODE_ENV: $NODE_ENV"

# Run database migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Running database migrations..."
  node -e "
const { execSync } = require('child_process');
try {
  execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
  console.log('✅ Migrations complete');
} catch (e) {
  console.warn('⚠️ Migration warning:', e.message);
}
" 2>/dev/null || echo "⚠️ Migration skipped (drizzle-kit not available in prod)"
fi

echo "✅ Starting server on port ${PORT:-3000}..."
exec node dist/index.js
