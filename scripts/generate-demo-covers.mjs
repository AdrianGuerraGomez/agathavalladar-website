// Genera las portadas abstractas de demostración (public/demo/cover-N.svg).
// Uso: node scripts/generate-demo-covers.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const W = 1600, H = 1000;
const C = { paper: '#E9E5DC', paper2: '#DCD6CA', ink: '#1A1B1E', accent: '#1D4B5A', accent2: '#3E6F7D', sand: '#C9BFAE' };
mkdirSync('public/demo', { recursive: true });

function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
const line = (x1, y1, x2, y2, stroke, w = 1.5, o = 1) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" opacity="${o}"/>`;

const designs = [
  // 1 meridianos
  () => { let s = ''; for (let i = 0; i < 15; i++) { const rx = 40 + i * 48; s += `<ellipse cx="1050" cy="500" rx="${rx}" ry="420" fill="none" stroke="${C.accent}" stroke-width="1.5" opacity="${0.25 + i * 0.04}"/>`; } for (let y = 120; y <= 880; y += 76) s += line(560, y, 1540, y, C.ink, 1, 0.18); return s + `<rect x="120" y="120" width="300" height="12" fill="${C.ink}"/>`; },
  // 2 retícula + círculo
  () => { let s = ''; for (let x = 0; x <= W; x += 80) s += line(x, 0, x, H, C.ink, 1, 0.12); for (let y = 0; y <= H; y += 80) s += line(0, y, W, y, C.ink, 1, 0.12); return s + `<circle cx="1040" cy="460" r="300" fill="${C.accent}"/><circle cx="1040" cy="460" r="300" fill="none" stroke="${C.ink}" stroke-width="2" transform="translate(-60 40)"/>`; },
  // 3 bandas + diagonal
  () => { let s = ''; const r = rng(7); for (let i = 0; i < 9; i++) s += `<rect x="0" y="${120 + i * 86}" width="${600 + r() * 900}" height="30" fill="${i % 3 === 0 ? C.accent : C.sand}" opacity="${i % 3 === 0 ? 1 : 0.7}"/>`; return s + line(200, 940, 1500, 60, C.ink, 3); },
  // 4 verticales + arco
  () => { let s = ''; for (let x = 160; x < 1500; x += 44) s += line(x, 260, x, 900, C.ink, 1.5, 0.35); return s + `<path d="M 220 900 A 580 580 0 0 1 1380 900" fill="none" stroke="${C.accent}" stroke-width="28"/>`; },
  // 5 arcos concéntricos
  () => { let s = ''; for (let i = 1; i < 14; i++) s += `<circle cx="0" cy="1000" r="${i * 95}" fill="none" stroke="${i % 4 === 0 ? C.accent : C.ink}" stroke-width="${i % 4 === 0 ? 10 : 1.5}" opacity="${i % 4 === 0 ? 1 : 0.3}"/>`; return s; },
  // 6 puntos
  () => { let s = ''; const r = rng(11); for (let x = 120; x < 1500; x += 60) for (let y = 120; y < 900; y += 60) { const big = r() > 0.92; s += `<circle cx="${x}" cy="${y}" r="${big ? 12 : 3}" fill="${big ? C.accent : C.ink}" opacity="${big ? 1 : 0.35}"/>`; } return s; },
  // 7 ondas
  () => { let s = ''; for (let i = 0; i < 16; i++) { const y = 180 + i * 44; s += `<path d="M 0 ${y} C 400 ${y - 80}, 800 ${y + 80}, 1600 ${y - 20}" fill="none" stroke="${i === 9 ? C.accent : C.ink}" stroke-width="${i === 9 ? 8 : 1.5}" opacity="${i === 9 ? 1 : 0.3}"/>`; } return s; },
  // 8 columnas
  () => { let s = `<polygon points="400,330 800,130 1200,330" fill="none" stroke="${C.ink}" stroke-width="3"/>`; for (let i = 0; i < 6; i++) s += `<rect x="${440 + i * 140}" y="380" width="44" height="440" fill="${i === 2 ? C.accent : C.ink}" opacity="${i === 2 ? 1 : 0.8}"/>`; return s + `<rect x="380" y="840" width="840" height="14" fill="${C.ink}"/>`; },
  // 9 círculo dividido
  () => { let s = `<circle cx="800" cy="500" r="360" fill="${C.accent}"/>`; for (let i = -6; i <= 6; i++) s += line(380, 500 + i * 56, 1220, 500 + i * 56, C.paper, 6); return s + `<circle cx="800" cy="500" r="420" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`; },
];

designs.forEach((d, i) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${i % 2 ? C.paper : C.paper2}"/>${d()}</svg>\n`;
  writeFileSync(`public/demo/cover-${i + 1}.svg`, svg);
});
console.log(`Generadas ${designs.length} portadas en public/demo/`);
