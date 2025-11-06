# Splash Screen Setup Instructions

The splash screen infrastructure has been set up for both iOS and Android. You need to add your splash image files to complete the implementation.

## Image Requirements

- Format: PNG (recommended) or JPG
- Orientation: Portrait (based on the Kilbil High Schools splash screen description)
- Background: White (to match the image background)

## iOS Setup

### Location
Add your splash image files to:
```
ios/Padmai/Images.xcassets/SplashImage.imageset/
```

### Required Files
You need to add the following image files:
1. `splash.png` - 1x resolution (standard resolution)
2. `splash@2x.png` - 2x resolution (Retina displays)
3. `splash@3x.png` - 3x resolution (Plus and Pro Max devices)

### Image Sizes
- `splash.png`: ~375x667 points (or your original image dimensions)
- `splash@2x.png`: ~750x1334 pixels (2x the base size)
- `splash@3x.png`: ~1125x2001 pixels (3x the base size)

### Notes
- If you only have one high-resolution image, you can use it for all three scales, or let Xcode generate the sizes automatically.
- The image will be displayed with `scaleAspectFill` mode to fill the entire screen.

## Android Setup

### Location
Add your splash image files to:
```
android/app/src/main/res/drawable-*/splash.png
```

### Required Files
Add `splash.png` to each of these directories for different screen densities:
- `drawable-mdpi/splash.png` - 1x (mdpi)
- `drawable-hdpi/splash.png` - 1.5x (hdpi)
- `drawable-xhdpi/splash.png` - 2x (xhdpi)
- `drawable-xxhdpi/splash.png` - 3x (xxhdpi)
- `drawable-xxxhdpi/splash.png` - 4x (xxxhdpi)

### Alternative (Simpler) Option
If you only have one high-resolution image, you can:
1. Place a single `splash.png` file in `android/app/src/main/res/drawable/splash.png`
2. Android will scale it automatically for different screen densities (may reduce quality on some devices)

### Recommended Image Sizes
- `drawable-mdpi`: ~320x480 pixels
- `drawable-hdpi`: ~480x720 pixels
- `drawable-xhdpi`: ~720x1280 pixels
- `drawable-xxhdpi`: ~1080x1920 pixels
- `drawable-xxxhdpi`: ~1440x2560 pixels

## Quick Setup (Using Single Image)

If you have a single high-resolution image (e.g., 1440x2560 pixels):

### iOS
1. Copy your image to `ios/Padmai/Images.xcassets/SplashImage.imageset/splash.png`
2. Copy the same image to `splash@2x.png` and `splash@3x.png` (Xcode will handle scaling)

### Android
1. Copy your image to `android/app/src/main/res/drawable/splash.png`

This simpler approach works but may not be optimal for all devices. For best results, create properly sized versions for each density.

## Testing

After adding the images:
1. **iOS**: Build and run the app - the splash screen should appear on app launch
2. **Android**: Build and run the app - the splash screen should appear on app launch

## Current Configuration

- **iOS**: `LaunchScreen.storyboard` has been updated to display the SplashImage asset
- **Android**: `styles.xml` has been configured to use the splash_screen drawable as the window background





