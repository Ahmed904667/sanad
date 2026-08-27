const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createCenteredComposition() {
  const dir = path.join(process.cwd(), 'public', 'images');
  
  // Dimensions
  const canvasWidth = 600;
  const canvasHeight = 650;
  
  const circleRadius = 225;
  const circleCenterX = 300;
  const circleCenterY = 320;
  
  // SVG background with subtle dashed/solid contour lines & emerald gradient circle
  const svgBackground = `
  <svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#059669" />
        <stop offset="50%" stop-color="#047857" />
        <stop offset="100%" stop-color="#0f766e" />
      </linearGradient>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#047857" flood-opacity="0.3" />
      </filter>
    </defs>
    
    <!-- Outer Contour Lines -->
    <ellipse cx="${circleCenterX}" cy="${circleCenterY}" rx="280" ry="290" fill="none" stroke="#a7f3d0" stroke-width="1.5" stroke-dasharray="5 8" opacity="0.75" />
    <ellipse cx="${circleCenterX}" cy="${circleCenterY}" rx="258" ry="265" fill="none" stroke="#6ee7b7" stroke-width="1.5" opacity="0.55" />
    <ellipse cx="${circleCenterX}" cy="${circleCenterY}" rx="238" ry="242" fill="none" stroke="#a7f3d0" stroke-width="1.2" stroke-dasharray="4 6" opacity="0.65" />
    
    <!-- Main Emerald Circle -->
    <circle cx="${circleCenterX}" cy="${circleCenterY}" r="${circleRadius}" fill="url(#emeraldGrad)" filter="url(#dropShadow)" />
  </svg>`;
  
  const bgBuffer = await sharp(Buffer.from(svgBackground)).png().toBuffer();
  
  // Load the man cutout image
  const manPath = path.join(dir, 'quran-reader-cutout.png');
  
  // Scale man so his torso and head nicely center within the circle (like style-sample.png)
  const resizedMan = await sharp(manPath)
    .resize({ width: 440 })
    .toBuffer();
    
  const manMeta = await sharp(resizedMan).metadata();
  console.log('Resized man meta:', manMeta.width, manMeta.height);
  
  // Center horizontally
  const left = Math.round((canvasWidth - manMeta.width) / 2);
  // Head at top of circle (circle top is 320 - 225 = 95), top at 65 makes head pop nicely over the circle
  const top = 65;
  
  // Composite man over background
  await sharp(bgBuffer)
    .composite([
      {
        input: resizedMan,
        left: left,
        top: top
      }
    ])
    .png()
    .toFile(path.join(dir, 'hero-quran-man-centered.png'));
    
  console.log('Successfully saved centered hero graphic to public/images/hero-quran-man-centered.png');
}

createCenteredComposition().catch(console.error);
