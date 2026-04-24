#!/usr/bin/env bash
# Downloads the MediaPipe Hands assets that the extension ships locally.
# These files are not committed to the repo because they are large binaries
# licensed separately. Run this script once after cloning the repo.

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$DIR/lib/mediapipe"
VERSION="0.4.1675469240"
BASE="https://cdn.jsdelivr.net/npm/@mediapipe/hands@${VERSION}"

FILES=(
  "hands.js"
  "hands_solution_packed_assets_loader.js"
  "hands_solution_packed_assets.data"
  "hands_solution_simd_wasm_bin.js"
  "hands_solution_simd_wasm_bin.wasm"
  "hands.binarypb"
)

mkdir -p "$DEST"

for f in "${FILES[@]}"; do
  echo "→ $f"
  curl -fL --retry 3 -o "$DEST/$f" "$BASE/$f"
done

echo
echo "Done. Files written to $DEST"
echo "Load the extension from chrome://extensions (Developer mode → Load unpacked)."
