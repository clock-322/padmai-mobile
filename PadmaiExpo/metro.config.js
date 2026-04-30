const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const parentRoot = path.resolve(projectRoot, '..');
const expoModules = path.resolve(projectRoot, 'node_modules');
const parentModules = path.resolve(parentRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// Watch the parent directory for source files
config.watchFolders = [parentRoot];

// Only use Expo's node_modules for resolution
config.resolver.nodeModulesPaths = [
  expoModules,
  parentModules,
];

// Shim for image picker
config.resolver.extraNodeModules = {
  'react-native-image-picker': path.resolve(projectRoot, 'shims/react-native-image-picker.js'),
};

// Block ALL npm packages from parent's node_modules that also exist in Expo's.
// This prevents version mismatches (e.g. bottom-tabs 7.8.1 vs 7.15.10)
// that cause "expected dynamic type 'boolean', but had type 'string'" errors.
const blockedParentPackages = [
  'react',
  'react-native',
  'react-redux',
  '@reduxjs',
  '@react-navigation',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-gesture-handler',
  '@react-native-async-storage',
];

config.resolver.blockList = blockedParentPackages.map((pkg) => {
  const pkgPath = path.resolve(parentModules, pkg).replace(/[/\\]/g, '[/\\\\]');
  return new RegExp(pkgPath + '[/\\\\].*');
});

module.exports = config;
