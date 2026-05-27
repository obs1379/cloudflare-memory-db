#!/bin/sh
set -eu

PROJECT_NAME="${PAGES_PROJECT_NAME:-cloudflare-memory-db}"

if [ -z "${APP_API_BASE:-}" ]; then
  echo "Error: APP_API_BASE is required. Example:" >&2
  echo "  APP_API_BASE=https://your-worker.workers.dev scripts/deploy-pages.sh" >&2
  exit 1
fi

API_BASE=$(printf '%s' "$APP_API_BASE" | sed 's:/*$::')
case "$API_BASE" in
  */api) ;;
  *) API_BASE="$API_BASE/api" ;;
esac

if git ls-files --error-unmatch app/config.js >/dev/null 2>&1; then
  echo "Error: app/config.js is tracked by git. It must stay local-only." >&2
  exit 1
fi

if grep -q '1379top-8bd\.workers\.dev' app/index.html 2>/dev/null; then
  echo "Error: app/index.html contains a hardcoded private Worker URL." >&2
  exit 1
fi

cat > app/config.js <<EOF
window.APP_CONFIG = {
  API_BASE: '$API_BASE'
};
EOF

npx wrangler pages deploy app/ --project-name "$PROJECT_NAME"
