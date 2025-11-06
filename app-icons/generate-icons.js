const fs = require('fs');
const path = require('path');

// Create the Padmai icon as SVG
function createPadmaiIcon(size) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .lotus { fill: #D4AF37; }
      .cap { fill: #1E3A8A; }
      .text { fill: #1E3A8A; font-family: Arial, sans-serif; font-weight: bold; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="white" rx="${size * 0.2}"/>
  
  <!-- Lotus Flower -->
  <g class="lotus" transform="translate(${size * 0.2}, ${size * 0.15})">
    <!-- Center -->
    <circle cx="${size * 0.3}" cy="${size * 0.3}" r="${size * 0.12}" fill="#D4AF37"/>
    
    <!-- Petals -->
    <ellipse cx="${size * 0.3}" cy="${size * 0.2}" rx="${size * 0.08}" ry="${size * 0.12}" transform="rotate(0 ${size * 0.3} ${size * 0.3})"/>
    <ellipse cx="${size * 0.3}" cy="${size * 0.2}" rx="${size * 0.08}" ry="${size * 0.12}" transform="rotate(45 ${size * 0.3} ${size * 0.3})"/>
    <ellipse cx="${size * 0.3}" cy="${size * 0.2}" rx="${size * 0.08}" ry="${size * 0.12}" transform="rotate(-45 ${size * 0.3} ${size * 0.3})"/>
    <ellipse cx="${size * 0.3}" cy="${size * 0.2}" rx="${size * 0.08}" ry="${size * 0.12}" transform="rotate(90 ${size * 0.3} ${size * 0.3})"/>
    <ellipse cx="${size * 0.3}" cy="${size * 0.2}" rx="${size * 0.08}" ry="${size * 0.12}" transform="rotate(-90 ${size * 0.3} ${size * 0.3})"/>
  </g>
  
  <!-- Graduation Cap -->
  <g class="cap" transform="translate(${size * 0.25}, ${size * 0.1})">
    <rect x="${size * 0.1}" y="${size * 0.05}" width="${size * 0.3}" height="${size * 0.08}" rx="2"/>
    <rect x="${size * 0.35}" y="${size * 0.05}" width="${size * 0.02}" height="${size * 0.1}" rx="1"/>
  </g>
  
  <!-- Text -->
  <text x="${size * 0.5}" y="${size * 0.85}" text-anchor="middle" class="text" font-size="${size * 0.12}">Padmai</text>
</svg>`;
}

// Android icon sizes
const androidSizes = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 }
];

// iOS icon sizes
const iosSizes = [
    { name: '20pt', size: 40 },
    { name: '29pt', size: 58 },
    { name: '40pt', size: 80 },
    { name: '60pt', size: 120 },
    { name: '76pt', size: 152 },
    { name: '83.5pt', size: 167 },
    { name: '1024pt', size: 2048 }
];

// Create Android icons
androidSizes.forEach(icon => {
    const dir = path.join(__dirname, 'android', icon.name);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const svg = createPadmaiIcon(icon.size);
    fs.writeFileSync(path.join(dir, 'ic_launcher.svg'), svg);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.svg'), svg);
    
    console.log(`Created Android ${icon.name} icon (${icon.size}x${icon.size})`);
});

// Create iOS icons
iosSizes.forEach(icon => {
    const dir = path.join(__dirname, 'ios');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const svg = createPadmaiIcon(icon.size);
    fs.writeFileSync(path.join(dir, `icon-${icon.name}.svg`), svg);
    
    console.log(`Created iOS ${icon.name} icon (${icon.size}x${icon.size})`);
});

console.log('\n✅ All Padmai app icons generated successfully!');
console.log('\n📱 Android icons created in: app-icons/android/');
console.log('🍎 iOS icons created in: app-icons/ios/');
console.log('\n💡 To use these icons:');
console.log('1. Convert SVG to PNG using online tools or ImageMagick');
console.log('2. Copy to your Android res/ folders');
console.log('3. Add to your iOS Images.xcassets');
