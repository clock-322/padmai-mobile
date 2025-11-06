# Troubleshooting Guide

## Common React Native Issues and Solutions

### 1. Shell Environment Issues
If you're getting `spawn /bin/zsh ENOENT` errors:

**Solution:**
```bash
# Try using bash instead
export SHELL=/bin/bash

# Or try running commands directly
node_modules/.bin/react-native start
```

### 2. Metro Bundler Issues
If Metro won't start:

**Solution:**
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Or clear all caches
npx react-native start --reset-cache --verbose
```

### 3. Native Dependencies Issues
If you get linking errors:

**For iOS:**
```bash
cd ios
pod install
cd ..
```

**For Android:**
```bash
cd android
./gradlew clean
cd ..
```

### 4. Missing Dependencies
If you get module not found errors:

**Solution:**
```bash
# Install all dependencies
yarn install

# For iOS, also install pods
cd ios && pod install && cd ..
```

### 5. TypeScript Issues
If you get TypeScript compilation errors:

**Solution:**
```bash
# Check TypeScript config
npx tsc --noEmit

# Or try building without type checking
npx react-native start --no-verify
```

### 6. Step-by-Step Debugging

1. **Test with simple app first:**
   - Rename `App.tsx` to `App.complex.tsx`
   - Rename `App.simple.tsx` to `App.tsx`
   - Try running the app

2. **Check Metro bundler:**
   ```bash
   npx react-native start
   ```
   Should show Metro running on port 8081

3. **Check Android setup:**
   ```bash
   npx react-native run-android
   ```

4. **Check iOS setup:**
   ```bash
   npx react-native run-ios
   ```

### 7. Environment Issues

**Check your environment:**
```bash
# Check Node version (should be >= 20)
node --version

# Check if React Native CLI is installed
npx react-native --version

# Check if Android SDK is set up
echo $ANDROID_HOME

# Check if Xcode is installed (for iOS)
xcode-select --print-path
```

### 8. Alternative Commands

If standard commands don't work, try:

```bash
# Use yarn instead of npm
yarn start
yarn android
yarn ios

# Use npx directly
npx @react-native-community/cli start
npx @react-native-community/cli run-android
npx @react-native-community/cli run-ios
```

### 9. Clean Everything and Start Fresh

```bash
# Clean everything
rm -rf node_modules
rm -rf ios/build
rm -rf android/build
rm -rf android/app/build

# Reinstall
yarn install
cd ios && pod install && cd ..

# Start fresh
yarn start
```

### 10. Check Specific Error Messages

Look for these common error patterns:

- **"Module not found"** → Missing dependency
- **"Cannot resolve module"** → Import path issue
- **"Metro bundler not running"** → Start Metro first
- **"Android SDK not found"** → Set up Android development environment
- **"Xcode not found"** → Install Xcode for iOS development
