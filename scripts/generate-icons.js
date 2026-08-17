import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const publicDir = path.join(rootDir, 'public');
const iconsDir = path.join(publicDir, 'icons');
const screenshotsDir = path.join(publicDir, 'screenshots');

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

const svgBuffer = fs.readFileSync(path.join(publicDir, 'favicon.svg'));

async function generate() {
  console.log('Generating PNG icons for PWA & APK...');

  // 192x192 Standard
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));

  // 512x512 Standard
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));

  // Maskable 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-192x192.png'));

  // Maskable 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512x512.png'));

  // Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Desktop Showcase Screenshot (1280x720)
  const desktopSvg = `
  <svg width="1280" height="720" viewBox="0 0 1280 720" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#090D16"/>
    <circle cx="640" cy="360" r="300" fill="#10B981" fill-opacity="0.08" filter="blur(60px)"/>
    <circle cx="900" cy="200" r="250" fill="#06B6D4" fill-opacity="0.08" filter="blur(60px)"/>
    <text x="640" y="320" font-family="sans-serif" font-weight="900" font-size="48" fill="#ffffff" text-anchor="middle">Aurix Pro</text>
    <text x="640" y="370" font-family="sans-serif" font-weight="600" font-size="24" fill="#34D399" text-anchor="middle">Next-Gen Personal Wealth Intelligence</text>
    <text x="640" y="420" font-family="sans-serif" font-weight="400" font-size="18" fill="#94A3B8" text-anchor="middle">Receipt Scanner • Savings Goals • Split-the-Bill • Live FX</text>
  </svg>`;
  await sharp(Buffer.from(desktopSvg))
    .png()
    .toFile(path.join(screenshotsDir, 'screenshot-desktop.png'));

  // Mobile Showcase Screenshot (720x1280)
  const mobileSvg = `
  <svg width="720" height="1280" viewBox="0 0 720 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="720" height="1280" fill="#090D16"/>
    <circle cx="360" cy="640" r="280" fill="#10B981" fill-opacity="0.1" filter="blur(60px)"/>
    <text x="360" y="580" font-family="sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle">Aurix Pro</text>
    <text x="360" y="630" font-family="sans-serif" font-weight="600" font-size="22" fill="#34D399" text-anchor="middle">Wealth Intelligence Suite</text>
    <text x="360" y="680" font-family="sans-serif" font-weight="400" font-size="16" fill="#94A3B8" text-anchor="middle">100% Private Offline Vault</text>
  </svg>`;
  await sharp(Buffer.from(mobileSvg))
    .png()
    .toFile(path.join(screenshotsDir, 'screenshot-mobile.png'));

  console.log('✅ All icons & screenshots generated successfully!');
}

generate().catch(console.error);
