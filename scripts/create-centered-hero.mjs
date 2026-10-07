import sharp from 'sharp';
import path from 'node:path';

async function createPerfectLargePopoutMan() {
  const dir = path.join(process.cwd(), 'public', 'images');
  const originalPath = path.join(dir, 'quran-reader.jpg');
  
  // 1. Process original FULL-BODY image to make full transparent cutout of the man
  console.log('1. Processing original image with full thobe length...');
  const image = sharp(originalPath);
  const metadata = await image.metadata();
  console.log('Original dimensions:', metadata.width, metadata.height);
  
  // Extract from top down to ~85% (covering full torso, knees/thobe)
  const extractHeight = Math.round(metadata.height * 0.88);
  const extracted = await sharp(originalPath)
    .extract({ left: 0, top: 0, width: metadata.width, height: extractHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  const { data, info } = extracted;
  const { width, height, channels } = info;
  
  // Clean background removal
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    
    // Background is clean white/studio light (brightness > 240, low saturation)
    if (brightness > 240 && maxDiff < 12) {
      const alpha = Math.max(0, Math.min(255, (255 - brightness) * 16));
      data[i + 3] = alpha;
    }
  }
  
  const fullManCutout = await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();
    
  console.log('Full man cutout created successfully.');
  
  // 2. Canvas & Circle Geometry
  const canvasWidth = 600;
  const canvasHeight = 650;
  const circleCenterX = 300;
  const circleCenterY = 330;
  const circleRadius = 225; // Circle spans from y = 105 to y = 555
  
  // 3. Background SVG with Contour lines & Emerald Gradient Circle
  const svgBackground = `
  <svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00a86b" />
        <stop offset="50%" stop-color="#059669" />
        <stop offset="100%" stop-color="#047857" />
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
  
  // 4. Resize man to be MUCH BIGGER (width: 530px) and long enough to extend past the bottom of the circle (y > 555)
  const resizedManBuffer = await sharp(fullManCutout)
    .resize({ width: 530 })
    .toBuffer();
    
  const manMeta = await sharp(resizedManBuffer).metadata();
  console.log('Scaled Man Dimensions:', manMeta.width, 'x', manMeta.height);
  
  // Position man on canvas:
  // Horizontally centered: left = (600 - 530) / 2 = 35
  const left = Math.round((canvasWidth - manMeta.width) / 2);
  // Vertically: head at top y = 45 (extends 60px above circle top at y=105)
  // Man height is ~ 700px, so bottom extends to y = 45 + ~700 = 745px, WELL BEYOND the circle bottom (y=555)!
  const top = 45;
  
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
  
  // 5. MASK: Top is open (allows head to pop out), bottom is strictly clipped to circle radius 225 at center (300, 330)
  const svgMask = `
  <svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
    <!-- Top is fully open for head/shoulders popout -->
    <rect x="0" y="0" width="${canvasWidth}" height="${circleCenterY}" fill="white" />
    <!-- Bottom is strictly the circle curve -->
    <circle cx="${circleCenterX}" cy="${circleCenterY}" r="${circleRadius}" fill="white" />
  </svg>`;
  
  const maskBuffer = await sharp(Buffer.from(svgMask))
    .toColourspace('b-w')
    .toBuffer();
    
  // Mask the man
  const maskedMan = await sharp(manOnCanvas)
    .composite([
      {
        input: maskBuffer,
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer();
    
  // 6. Composite masked man onto emerald background
  const outputPath = path.join(dir, 'hero-quran-man-centered.png');
  await sharp(bgBuffer)
    .composite([
      {
        input: maskedMan,
        left: 0,
        top: 0
      }
    ])
    .png()
    .toFile(outputPath);
    
  console.log('SUCCESS! Generated big man filling circle with bottom perfectly curved along circle border at:', outputPath);
}

createPerfectLargePopoutMan().catch(console.error);
