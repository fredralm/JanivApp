// scripts/generate-icons.mjs
// Generates minimal valid PNG icons using raw PNG binary format (no external deps)
import { writeFileSync, mkdirSync } from 'fs'
import zlib from 'zlib'

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[i] = c
  }
  let crc = 0xFFFFFFFF
  for (const byte of buf) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcData = Buffer.concat([typeBytes, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(crcData))
  return Buffer.concat([len, typeBytes, data, crcBuf])
}

function makePNG(size, r, g, b) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type RGB

  // IDAT: raw pixel data with filter bytes
  const rowSize = 1 + size * 3
  const raw = Buffer.alloc(size * rowSize)
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0  // filter byte
    for (let x = 0; x < size; x++) {
      const off = y * rowSize + 1 + x * 3
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b
    }
  }
  const compressed = zlib.deflateSync(raw)

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

mkdirSync('public', { recursive: true })
// Dark background color #1a1a2e = rgb(26, 26, 46)
writeFileSync('public/icon-192.png', makePNG(192, 26, 26, 46))
writeFileSync('public/icon-512.png', makePNG(512, 26, 26, 46))
console.log('Icons generated: public/icon-192.png, public/icon-512.png')
