// Test file to see how MiniKit exports work
const minikit = require('@worldcoin/minikit-js');

console.log('MiniKit exports:', Object.keys(minikit));
console.log('Type of export:', typeof minikit);

if (minikit.minikit) {
  console.log('Found minikit.minikit object');
  console.log('minikit.minikit keys:', Object.keys(minikit.minikit));
}

if (minikit.install) {
  console.log('Found install method directly');
}

if (minikit.default) {
  console.log('Found default export');
  console.log('default export keys:', Object.keys(minikit.default));
}
