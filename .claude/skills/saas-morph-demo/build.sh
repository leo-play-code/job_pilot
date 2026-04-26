#!/usr/bin/env bash
# Repackage this skill folder into a .skill file (which is just a zip).
#
# Usage:
#   ./build.sh                  # outputs ../saas-morph-demo.skill
#   ./build.sh /path/to/output  # outputs to specified path
#
# After packaging, upload the .skill file in claude.ai → Settings → Capabilities → Skills.

set -e

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_NAME="$(basename "$SKILL_DIR")"
OUTPUT_DIR="${1:-$(dirname "$SKILL_DIR")}"
OUTPUT_FILE="$OUTPUT_DIR/$SKILL_NAME.skill"

# Validate required files exist
if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
  echo "❌ SKILL.md not found in $SKILL_DIR"
  exit 1
fi

# Remove old .skill if present
[ -f "$OUTPUT_FILE" ] && rm "$OUTPUT_FILE"

# Build .skill (zip) — exclude common junk and the build script itself
cd "$(dirname "$SKILL_DIR")"
zip -r "$OUTPUT_FILE" "$SKILL_NAME" \
  -x "*/node_modules/*" \
     "*/__pycache__/*" \
     "*/.DS_Store" \
     "*/build.sh" \
     "*/.git/*"

echo ""
echo "✅ Built: $OUTPUT_FILE"
echo "   Upload at claude.ai → Settings → Capabilities → Skills"
