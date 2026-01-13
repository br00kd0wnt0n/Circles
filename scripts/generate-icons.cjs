#!/usr/bin/env node
/**
 * Generate PWA icons from source SVG
 *
 * Usage: node scripts/generate-icons.js
 *
 * Requires: npm install sharp
 *
 * This script generates all required PWA icon sizes from the source SVG.
 * For now, you can also use online tools like:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 *
 * Upload public/icons/icon.svg and download the generated icons.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, '../public/icons');
const sourceSvg = path.join(iconDir, 'icon.svg');

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Read the SVG file
  const svgBuffer = fs.readFileSync(sourceSvg);

  for (const size of sizes) {
    // Regular icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(iconDir, `icon-${size}.png`));
    console.log(`Created icon-${size}.png`);

    // Maskable icons (with padding for safe zone)
    if (size >= 192) {
      const padding = Math.floor(size * 0.1);
      const innerSize = size - (padding * 2);

      await sharp(svgBuffer)
        .resize(innerSize, innerSize)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 15, g: 23, b: 42, alpha: 1 }
        })
        .png()
        .toFile(path.join(iconDir, `icon-maskable-${size}.png`));
      console.log(`Created icon-maskable-${size}.png`);
    }
  }

  console.log('Done! Icons generated in public/icons/');
}

generateIcons().catch(console.error);
