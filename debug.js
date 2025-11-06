// Debug script to check React Native setup
console.log('Checking React Native setup...');

try {
  const { execSync } = require('child_process');
  
  console.log('1. Checking Node version:');
  console.log(execSync('node --version', { encoding: 'utf8' }));
  
  console.log('2. Checking npm version:');
  console.log(execSync('npm --version', { encoding: 'utf8' }));
  
  console.log('3. Checking React Native CLI:');
  try {
    console.log(execSync('npx react-native --version', { encoding: 'utf8' }));
  } catch (e) {
    console.log('React Native CLI not found');
  }
  
  console.log('4. Checking if Metro is available:');
  try {
    console.log(execSync('npx metro --version', { encoding: 'utf8' }));
  } catch (e) {
    console.log('Metro not found');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
