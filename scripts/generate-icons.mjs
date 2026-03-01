import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '../public')

const BG = '#38bdf8'   // sky-400 — one shade lighter than the app bg (#0ea5e9)
const FG = '#ffffff'

function makeSvg(size) {
  const r = size * 0.22
  const fontSize = size * 0.62
  const y = size * 0.735
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${BG}"/>
  <text
    x="50%"
    y="${y}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${FG}"
    text-anchor="middle"
  >J</text>
</svg>`
}

for (const size of [192, 512]) {
  const svg = Buffer.from(makeSvg(size))
  const outPath = path.join(publicDir, `icon-${size}.png`)
  await sharp(svg).png().toFile(outPath)
  console.log(`✓ icon-${size}.png`)
}
