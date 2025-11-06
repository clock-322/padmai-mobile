#!/bin/bash

echo "🎨 Implementing Padmai app icons..."

# Check if we're in the right directory
if [ ! -d "android" ] || [ ! -d "ios" ]; then
    echo "❌ Please run this script from the app-icons directory"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "❌ ImageMagick not found. Please install it first:"
    echo "   brew install imagemagick"
    echo "   or visit: https://imagemagick.org/script/download.php"
    exit 1
fi

# Convert Android icons
echo "📱 Converting Android icons..."
cd android
for dir in mipmap-*; do
    if [ -d "$dir" ]; then
        echo "Converting $dir..."
        cd "$dir"
        if [ -f "ic_launcher.svg" ]; then
            magick ic_launcher.svg ic_launcher.png
            echo "  ✅ Created ic_launcher.png"
        fi
        if [ -f "ic_launcher_round.svg" ]; then
            magick ic_launcher_round.svg ic_launcher_round.png
            echo "  ✅ Created ic_launcher_round.png"
        fi
        cd ..
    fi
done

# Convert iOS icons
echo "🍎 Converting iOS icons..."
cd ../ios
for file in icon-*.svg; do
    if [ -f "$file" ]; then
        png_file="${file%.svg}.png"
        magick "$file" "$png_file"
        echo "  ✅ Created $png_file"
    fi
done

echo ""
echo "✅ All icons converted to PNG format!"
echo ""
echo "📱 Next steps for Android:"
echo "   1. Copy PNG files from android/mipmap-*/ to your Android project:"
echo "      android/app/src/main/res/mipmap-*/"
echo ""
echo "🍎 Next steps for iOS:"
echo "   1. Open your iOS project in Xcode"
echo "   2. Navigate to Images.xcassets"
echo "   3. Create new AppIcon image set"
echo "   4. Drag PNG files from ios/ to appropriate slots"
echo ""
echo "🎯 Icon files ready in:"
echo "   - Android: app-icons/android/"
echo "   - iOS: app-icons/ios/"
