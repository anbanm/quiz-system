// Script to generate sample test images as base64 data URLs
// This creates various types of images for testing quiz functionality

const fs = require('fs');
const path = require('path');

// Generate a simple colored rectangle as PNG base64
function generateColoredRectangle(width, height, color) {
  // Create a minimal PNG header and data
  const canvas = require('canvas').createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Add some text to make it more interesting
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Test Image', width/2, height/2);
  
  return canvas.toDataURL('image/png');
}

// Alternative: Create simple base64 images without canvas dependency
function createSimpleTestImages() {
  return {
    // Red 100x100 square with white text "A"
    redSquare: 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="red"/>
        <text x="50" y="55" text-anchor="middle" fill="white" font-size="40" font-family="Arial">A</text>
      </svg>
    `).toString('base64'),
    
    // Blue 150x100 rectangle with white text "Geography"  
    blueRectangle: 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="150" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="100" fill="blue"/>
        <text x="75" y="35" text-anchor="middle" fill="white" font-size="14" font-family="Arial">Geography</text>
        <text x="75" y="55" text-anchor="middle" fill="white" font-size="14" font-family="Arial">Test</text>
        <text x="75" y="75" text-anchor="middle" fill="white" font-size="14" font-family="Arial">Question</text>
      </svg>
    `).toString('base64'),
    
    // Green 200x150 image with a simple diagram
    greenDiagram: 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="150" fill="lightgreen"/>
        <circle cx="100" cy="75" r="30" fill="darkgreen"/>
        <text x="100" y="80" text-anchor="middle" fill="white" font-size="12" font-family="Arial">Earth</text>
        <text x="100" y="130" text-anchor="middle" fill="black" font-size="10" font-family="Arial">Sample Diagram</text>
      </svg>
    `).toString('base64'),
    
    // Math formula image
    mathFormula: 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="180" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="80" fill="white" stroke="black"/>
        <text x="90" y="35" text-anchor="middle" fill="black" font-size="16" font-family="serif">E = mc²</text>
        <text x="90" y="60" text-anchor="middle" fill="gray" font-size="10" font-family="Arial">Einstein's Formula</text>
      </svg>
    `).toString('base64'),
    
    // Large mobile-friendly image (400x300)
    mobileLarge: 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#grad1)"/>
        <text x="200" y="120" text-anchor="middle" fill="black" font-size="24" font-family="Arial">Mobile Test</text>
        <text x="200" y="150" text-anchor="middle" fill="black" font-size="18" font-family="Arial">Large Image</text>
        <text x="200" y="180" text-anchor="middle" fill="black" font-size="14" font-family="Arial">400x300 pixels</text>
        <text x="200" y="210" text-anchor="middle" fill="black" font-size="12" font-family="Arial">Responsive test image</text>
      </svg>
    `).toString('base64')
  };
}

// Export the test images
const testImages = createSimpleTestImages();

// Save to a JSON file for easy import in tests
const output = {
  description: "Sample test images for Playwright quiz testing",
  images: testImages,
  metadata: {
    created: new Date().toISOString(),
    purpose: "Automated testing of image functionality in quiz system"
  }
};

fs.writeFileSync(
  path.join(__dirname, 'test-images.json'), 
  JSON.stringify(output, null, 2)
);

console.log('Generated test images:');
Object.keys(testImages).forEach(key => {
  console.log(`- ${key}: ${testImages[key].substring(0, 50)}...`);
});

module.exports = testImages;