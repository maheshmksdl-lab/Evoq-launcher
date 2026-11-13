// Generates the solid-colour EVOQ app logos in public/logos/.
// Colours are sampled from the original menu icons used on evoq.one
// (copies kept in public/logos/original/). No gradients anywhere.
// Run: node scripts/build-app-logos.mjs

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "logos")
mkdirSync(out, { recursive: true })

const tile = (fill, stroke) =>
  `<rect width="60" height="60" rx="14" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="1"` : ""}/>`

/** 24-unit glyph centred in the 60-unit tile (same framing as evoq.one's ServiceOps icon). */
const glyph = (body, scale = 1.65) => {
  const offset = (60 - 24 * scale) / 2
  return `<g transform="translate(${offset} ${offset}) scale(${scale})">${body}</g>`
}
const line = (color, w = 2) =>
  `fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`

const W = "#FFFFFF"

const logos = {
  // Blue tile, filled group of three people.
  crm: tile("#1D4ED8") + glyph(`<g fill="${W}">
    <circle cx="12" cy="7.6" r="3.4"/>
    <path d="M5.6 19.6c0-3.6 2.9-6.2 6.4-6.2s6.4 2.6 6.4 6.2v.4H5.6z"/>
    <circle cx="4.9" cy="9.4" r="2.5"/>
    <circle cx="19.1" cy="9.4" r="2.5"/>
    <path d="M.6 18.8c0-2.7 2-4.6 4.5-4.6 1 0 1.9.3 2.6.8a7.4 7.4 0 0 0-2.4 4.7v.3H.6z"/>
    <path d="M23.4 18.8c0-2.7-2-4.6-4.5-4.6-1 0-1.9.3-2.6.8a7.4 7.4 0 0 1 2.4 4.7v.3h4.7z"/>
  </g>`),

  // Violet tile, rising trend arrow.
  campaigns: tile("#6B32F1") + glyph(`<g ${line(W, 2.2)}>
    <polyline points="2.5 17 8.5 11 13 15.5 21 7.5"/><polyline points="15 7.5 21 7.5 21 13.5"/>
  </g>`),

  // Yellow tile, black cube inside scan brackets.
  configx: tile("#FDD11F") + glyph(`
    <g ${line("#141414", 2)}><path d="M2.5 7V5a2.5 2.5 0 0 1 2.5-2.5h2M17 2.5h2A2.5 2.5 0 0 1 21.5 5v2M21.5 17v2a2.5 2.5 0 0 1-2.5 2.5h-2M7 21.5H5A2.5 2.5 0 0 1 2.5 19v-2"/></g>
    <path d="M12 5.8l5.9 3.3v6.8L12 19.2l-5.9-3.3V9.1z" fill="#141414"/>
    <path d="M6.6 9.4L12 12.4l5.4-3M12 12.4v6.2" ${line("#FDD11F", 1.2)}/>`),

  // Amber tile, wrench. Path taken verbatim from evoq.one's serviceops-icon.svg.
  serviceops: tile("#F59E0B") + glyph(`<path fill="${W}" d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>`),

  // Violet tile, outlined rocket.
  projects: tile("#7C3AED") + glyph(`<g ${line(W, 1.8)}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    <circle cx="16" cy="8" r="1.4"/>
  </g>`),

  // Teal tile, headset with typing dots.
  desk: tile("#0C9488") + glyph(`
    <g ${line(W, 2)}>
      <path d="M3.5 13.5V12a8.5 8.5 0 0 1 17 0v1.5"/>
      <rect x="2.5" y="12" width="4" height="6" rx="2"/><rect x="17.5" y="12" width="4" height="6" rx="2"/>
      <path d="M19.5 18v.5a3 3 0 0 1-3 3H13"/>
    </g>
    <g fill="${W}"><circle cx="9" cy="13.2" r="1.15"/><circle cx="12" cy="13.2" r="1.15"/><circle cx="15" cy="13.2" r="1.15"/></g>`),

  // Magenta tile, box with a checklist.
  inventory: tile("#C91F6D") + glyph(`
    <g ${line(W, 1.8)}>
      <path d="M11 2.6l7 3.8v4.2M4 6.4v8.4l7 3.8 2-1.1M4 6.4l7 3.8 7-3.8M11 10.2v8.4M4 6.4l7-3.8"/>
      <path d="M17.5 14.8h4.5M17.5 18h4.5M17.5 21.2h4.5"/>
    </g>
    <g fill="${W}"><rect x="14.2" y="14" width="1.7" height="1.7" rx=".4"/><rect x="14.2" y="17.2" width="1.7" height="1.7" rx=".4"/><rect x="14.2" y="20.4" width="1.7" height="1.7" rx=".4"/></g>`),

  // Green tile, two connected nodes.
  sync: tile("#049669") + glyph(`<g ${line(W, 2)}>
    <path d="M6.5 2.5v10.8"/><circle cx="6.5" cy="17" r="3.7"/><circle cx="17.5" cy="7.5" r="3.7"/><path d="M9.3 14.6l5.4-4.7"/>
  </g>`),

  // White tile, berry cluster: solid colour per row (pink, coral, purple, blue) and green leaves.
  skillberry: tile("#FFFFFF", "#E3E3E3") + glyph(`
    <g fill="#088F5E">
      <path d="M11.4 4.6C10.9 2.6 9 1.5 7 1.8c.4 2 2.3 3.3 4.4 2.8z"/>
      <path d="M12.6 4.6c.5-2 2.4-3.1 4.4-2.8-.4 2-2.3 3.3-4.4 2.8z"/>
      <path d="M11.4 4.6h1.2v1.6h-1.2z"/>
    </g>
    <g fill="#EE6A8E"><circle cx="9.9" cy="8" r="2.1"/><circle cx="14.1" cy="8" r="2.1"/></g>
    <g fill="#FF5971"><circle cx="7.8" cy="11.9" r="2.1"/><circle cx="12" cy="11.9" r="2.1"/><circle cx="16.2" cy="11.9" r="2.1"/></g>
    <g fill="#B285F8"><circle cx="9.9" cy="15.8" r="2.1"/><circle cx="14.1" cy="15.8" r="2.1"/></g>
    <circle cx="12" cy="19.7" r="2.1" fill="#2958DB"/>`, 1.95),

  // Pale tile, two-part "B" in teal and mint with a yellow accent.
  billing: tile("#E5EEEB") + `<g transform="translate(30 30) scale(1.18) translate(-31 -30)">
    <path d="M20 12.5h9.5c5 0 8.8 3.8 8.8 8.6s-3.8 8.6-8.8 8.6H20z" fill="#34C3AD"/>
    <path d="M20 12.5h5.6v17.2H20z" fill="#14A08D"/>
    <path d="M20 29.7h12.8c5.4 0 9.2 4 9.2 8.9s-3.8 8.9-9.2 8.9H20z" fill="#AEE5D4"/>
    <path d="M32.8 29.7c5.4 0 9.2 4 9.2 8.9h-9.2z" fill="#FFCB48"/></g>`,

  // Blue tile, open ring with a sparkle (solid colours instead of the original gradient).
  ai: tile("#0062FA") + glyph(`
    <path d="M20.4 14.2A8.8 8.8 0 1 1 13.6 3.6" ${line("#34E7FD", 3.4)}/>
    <path d="M18.4 1.2l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" fill="#C487FC"/>`),

  // Sage tile (--bookings-primary #64856D) with the calendar glyph, both taken
  // verbatim from the logo on evoq.one/products/bookings.
  bookings: tile("#64856D") + glyph(`<g ${line(W, 1.8)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3M8 17h6"/>
  </g>`, 1.55),

  // Cyan tile, medical cross (Solutions / Healthcare).
  healthcare: tile("#0E7490") + glyph(`<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="${W}"/>`),

  // Same teal as Healthcare, clipboard with a medical cross (Solutions / Healthcare PMS).
  "healthcare-pms": tile("#0E7490") + glyph(`
    <g ${line(W, 1.8)}><rect x="5" y="4.5" width="14" height="17" rx="2"/><path d="M9 4.5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/></g>
    <path d="M11 9.5h2v2.5h2.5v2H13v2.5h-2V14H8.5v-2H11z" fill="${W}"/>`),

  // Burnt-orange tile, outlined factory roofline with a chimney and door (Solutions / Manufacturing).
  manufacturing: tile("#C2410C") + glyph(`
    <g ${line(W, 1.8)}>
      <path d="M2.5 20.5h19M4 20.5V9l4.5 3V9l4.5 3V9l4.5 3v8.5"/>
      <path d="M8.5 20.5v-4h3v4"/>
    </g>
    <g fill="${W}"><rect x="4" y="4.5" width="1.8" height="2.2" rx=".3"/></g>`),

  // Industry solutions. Tile colours are each industry's brand colour from the
  // Solutions menu on evoq.one (Topbar SOLUTION_BRAND); glyphs are its SOLUTION_ICONS.
  construction: tile("#B5532F") + glyph(`<g ${line(W, 1.8)}>
    <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 10h5a1 1 0 0 1 1 1v10M2 21h20"/><path d="M8 8h2M8 12h2M8 16h2"/>
  </g>`),
  "field-service": tile("#1F5FE0") + glyph(`<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-2.6-.6-.6-2.6z" ${line(W, 1.8)}/>`),
  hospitality: tile("#1F4D3A") + glyph(`<g ${line(W, 1.8)}>
    <path d="M3 20V8M3 14h18v6M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>
  </g>`),
  "financial-services": tile("#0B2D4F") + glyph(`<path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" ${line(W, 1.8)}/>`),
  "all-industries": tile("#1E40AF") + glyph(`<g ${line(W, 1.8)}>
    <rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/>
    <rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>
  </g>`),
}

for (const [id, body] of Object.entries(logos)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" role="img" aria-label="EVOQ ${id}">${body.replace(/\s*\n\s*/g, "")}</svg>\n`
  writeFileSync(join(out, `${id}.svg`), svg)
}
console.log(`Wrote ${Object.keys(logos).length} logos to ${out}`)
