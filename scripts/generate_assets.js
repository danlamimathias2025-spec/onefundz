import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const svgPath = path.resolve('public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating ONEFUNDZ PNG & JPEG branding assets...');

  // 1. icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png');
  console.log('Created public/icon-192.png');

  // 2. icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png');
  console.log('Created public/icon-512.png');

  // 3. logo.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/logo.png');
  console.log('Created public/logo.png');

  // 4. download.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/download.png');
  console.log('Created public/download.png');

  // 5. download (1).jpeg
  await sharp(svgBuffer)
    .resize(512, 512)
    .jpeg({ quality: 95 })
    .toFile('public/download (1).jpeg');
  console.log('Created public/download (1).jpeg');

  // 6. splash.jpeg
  // Create a 1080x1920 splash image with dark gradient and icon centered
  const splashSvg = `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#022c22"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#splashBg)"/>
  </svg>`;
  
  const iconOnSplash = await sharp(svgBuffer).resize(480, 480).toBuffer();
  
  await sharp(Buffer.from(splashSvg))
    .composite([{ input: iconOnSplash, top: 720, left: 300 }])
    .jpeg({ quality: 90 })
    .toFile('public/splash.jpeg');
  console.log('Created public/splash.jpeg');

  // 7. Overwrite aistudio assets if present
  const aiStudioDir = 'public/assets/aistudio';
  if (fs.existsSync(aiStudioDir)) {
    const files = fs.readdirSync(aiStudioDir);
    for (const file of files) {
      const filePath = path.join(aiStudioDir, file);
      if (file.endsWith('.jpeg') || file.endsWith('.jpg')) {
        await sharp(svgBuffer).resize(512, 512).jpeg({ quality: 90 }).toFile(filePath);
        console.log(`Overwrote ${filePath}`);
      } else if (file.endsWith('.png')) {
        await sharp(svgBuffer).resize(512, 512).png().toFile(filePath);
        console.log(`Overwrote ${filePath}`);
      }
    }
  }

  console.log('All branding image assets successfully regenerated for ONEFUNDZ!');
}

generate().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
