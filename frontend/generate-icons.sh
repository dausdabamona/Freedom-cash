#!/bin/bash

# Icon Generator Script for Freedom Navigator PWA
# This script generates placeholder icons using ImageMagick

set -e

echo "🎨 Freedom Navigator - Icon Generator"
echo "===================================="

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Installing..."

    # Detect OS and install
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y imagemagick
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install imagemagick
    else
        echo "Please install ImageMagick manually: https://imagemagick.org/script/download.php"
        exit 1
    fi
fi

# Create icons directory
mkdir -p public/icons

echo "📦 Generating icons..."

# Icon sizes
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
    echo "  ➜ Generating ${size}x${size}..."

    # Create icon with gradient background and target symbol
    convert -size ${size}x${size} \
        gradient:'#0f172a-#7c3aed' \
        -gravity center \
        \( -size $((size*70/100))x$((size*70/100)) \
           xc:transparent \
           -fill white \
           -draw "circle $((size*35/100)),$((size*35/100)) $((size*35/100)),$((size*15/100))" \
           -fill none \
           -stroke white \
           -strokewidth $((size/12)) \
           -draw "circle $((size*35/100)),$((size*35/100)) $((size*35/100)),$((size*25/100))" \
           -draw "circle $((size*35/100)),$((size*35/100)) $((size*35/100)),$((size*5/100))" \
        \) \
        -composite \
        public/icons/icon-${size}x${size}.png
done

echo "✅ All icons generated successfully!"
echo ""
echo "📁 Icons saved to: public/icons/"
echo "📝 Files created:"
ls -lh public/icons/

echo ""
echo "🎯 Next steps:"
echo "  1. Review the generated icons"
echo "  2. Replace with custom designs if needed"
echo "  3. Run: npm run dev"
echo "  4. Open: http://localhost:5173"
echo "  5. Check DevTools → Application → Manifest"
echo ""
echo "✅ Done!"
