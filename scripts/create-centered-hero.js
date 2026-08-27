const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createPopoutClippedComposition() {
  const dir = path.join(process.cwd(), 'public', 'images');
  
  // Canvas Dimensions
  const canvasWidth = 600;
  const canvasHeight = 650;
  
  const circleRadius = 225;
  const circleCenterX = 300;
  const circleCenterY = 330;
  
  // 1. Background SVG with Contour lines + Emerald Gradient Circle + Drop shadow
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
  
  // 2. Load the man cutout image and make him BIGGER
  const manPath = path.join(dir, 'quran-reader-cutout.png');
  
  // Resize the man to be larger (e.g. width: 490px)
  const resizedManBuffer = await sharp(manPath)
    .resize({ width: 490 })
    .toBuffer();
    
  const manMeta = await sharp(resizedManBuffer).metadata();
  console.log('Resized man dimensions:', manMeta.width, manMeta.height);
  
  // Position man on a 600x650 transparent canvas
  const left = Math.round((canvasWidth - manMeta.width) / 2);
  // Head pops out nicely above the circle top (circle top is 330 - 225 = 105)
  // Let top = 50 so head extends proudly above the circle
  const top = 50;
  
  // Place man on full transparent 600x650 canvas
  const manOnCanvas = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    {
      input: resizedManBuffer,
      left: left,
      top: top
    }
  ])
  .png()
  .toBuffer();
  
  // 3. Create Pop-out mask:
  // - Top rectangle allows head/shoulders to pop out above the circle
  // - Bottom half is masked strictly by the circle border (so the bottom is cut in the exact circle curve)
  const svgMask = `
  <svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
    <!-- Top area open for head popout -->
    <rect x="0" y="0" width="${canvasWidth}" height="${circleCenterY}" fill="white" />
    <!-- Bottom area strictly constrained to the circle radius -->
    <circle cx="${circleCenterX}" cy="${circleCenterY}" r="${circleRadius}" fill="white" />
  </svg>`;
  
  const maskBuffer = await sharp(Buffer.from(svgMask))
    .toColourspace('b-w')
    .toBuffer();
    
  // Apply mask to the man using dest-in blend mode
  const maskedMan = await sharp(manOnCanvas)
    .composite([
      {
        input: maskBuffer,
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer();
    
  // 4. Composite the masked man onto the emerald background
  await sharp(bgBuffer)
    .composite([
      {
        input: maskedMan,
        left: 0,
        top: 0
      }
    ])
    .png()
    .toFile(path.join(dir, 'hero-quran-man-centered.png'));
    
  console.log('Successfully generated bigger man with curved bottom cut along circle border!');
}

createPopoutClippedComposition().catch(console.error);
