/**
 * Generate PWA icons from icon.svg
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install --save-dev sharp
 */

import { createRequire } from 'module'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const svgPath = resolve(__dirname, '../public/icons/icon.svg')
const outDir = resolve(__dirname, '../public/icons')

if (!existsSync(svgPath)) {
  console.error('❌ icon.svg not found at', svgPath)
  process.exit(1)
}

let sharp
try {
  sharp = require('sharp')
} catch {
  console.error('❌ sharp not installed. Run: npm install --save-dev sharp')
  process.exit(1)
}

const svgBuffer = readFileSync(svgPath)
const sizes = [192, 512]

for (const size of sizes) {
  const outPath = resolve(outDir, `icon-${size}.png`)
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath)
  console.log(`✅ Generated ${outPath}`)
}

console.log('\n🎉 Icons generated! PWA install will now show proper icon on iOS.')
