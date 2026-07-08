#!/usr/bin/env bash
# Package the Nexus Arena frontend (Next.js project) into a zip for download.
# Excludes node_modules, .next, dev logs, and other non-source artifacts.
set -euo pipefail

PROJECT_DIR="/home/z/my-project"
OUTPUT_ZIP="/home/z/my-project/download/nexus-arena-frontend.zip"
STAGING_DIR="/tmp/nexus-arena-staging"

echo "[1/4] Cleaning previous artifacts..."
rm -rf "$STAGING_DIR" "$OUTPUT_ZIP"
mkdir -p "$STAGING_DIR" "$(dirname "$OUTPUT_ZIP")"

echo "[2/4] Copying source files to staging..."
rsync -a \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='dev.log' \
  --exclude='server.log' \
  --exclude='_references' \
  --exclude='download' \
  --exclude='tool-results' \
  --exclude='.zscripts' \
  --exclude='.z-ai-config' \
  --exclude='db/*.db' \
  --exclude='db/*.db-journal' \
  --exclude='upload' \
  --exclude='skills' \
  --exclude='mini-services' \
  --exclude='examples' \
  --exclude='repos' \
  --exclude='.env' \
  --exclude='next-env.d.ts' \
  --exclude='*.tsbuildinfo' \
  --exclude='.bun' \
  "$PROJECT_DIR/" "$STAGING_DIR/"

# Re-create the .env file with the correct NEXT_PUBLIC_API_URL so the
# downstream user gets a working configuration out of the box.
cat > "$STAGING_DIR/.env" << 'EOF'
DATABASE_URL=file:./db/custom.db
NEXT_PUBLIC_API_URL=https://raspy-disk-bc7e.workers.dev
EOF

echo "[3/4] Zipping..."
cd "$STAGING_DIR"
zip -rq "$OUTPUT_ZIP" .

echo "[4/4] Done."
SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)
FILES=$(find "$STAGING_DIR" -type f | wc -l)
echo "  Output: $OUTPUT_ZIP"
echo "  Size:   $SIZE"
echo "  Files:  $FILES"
