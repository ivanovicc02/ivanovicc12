// Kit "mundo sin…": multitud que desaparece, hospital, aula, cocina con sartén, tiendas cerradas, cunas,
// laboratorio con corderito, parque con columpio, ciudad invadida por plantas.
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp, lerp, ease } = window.SH;

  // ---------- multitud frontal; los marcados como "w" desaparecen con brillo ----------
  // p: {vanish: tiempo local del inicio de la desaparición (o null), rows}
  A.crowdV = function (p, c) {
    const r = rng(p.seed || 21), rows = p.rows || 9;
    const shirts = ['#2fb3a3', '#5b7cff', '#f07f2a', '#8bd16a', '#b07cff', '#e5484d', '#f2c230', '#7a8fb0'];
    const skins = ['#e0a57e', '#c98d66', '#a5694a', '#f0c8a0', '#7a4a32'];
    const hairs = ['#3a2418', '#1d1d24', '#7a4a22', '#c9a050', '#9a9a9a'];
    let s = '';
    for (let row = 0; row < rows; row++) {
      const v = row / (rows - 1), sc = 0.3 + v * 0.75, y = 200 + Math.pow(v, 1.3) * 1150, gap = 190 * sc;
      for (let x = -200 + (row % 2) * gap / 2; x < 1280; x += gap) {
        const isW = r() < 0.5, jx = (r() - 0.5) * gap * 0.3, sh = shirts[Math.floor(r() * 8)], sk = skins[Math.floor(r() * 5)], hc = hairs[Math.floor(r() * 5)];
        let k = 1, glow = 0;
        if (isW && p.vanish != null) { const d = c.lt - p.vanish - r() * 0.8; glow = clamp(1 - Math.abs(d - 0.2) / 0.35, 0, 1); k = 1 - clamp(d / 0.45, 0, 1); }
        if (k <= 0.01 && glow <= 0.01) continue;
        let g = '';
        if (isW) g += `<path d="M-58 -150 Q-64 -60 -40 -70 L40 -70 Q64 -60 58 -150Z" fill="${hc}"/>`;
        g += `<path d="M-60 0 Q-64 -96 0 -100 Q64 -96 60 0Z" fill="${sh}"/><circle cy="-150" r="50" fill="${sk}"/>`;
        g += isW ? `<path d="M-54 -150 Q-52 -214 0 -210 Q52 -214 54 -150 Q30 -185 -54 -150Z" fill="${hc}"/>` : `<path d="M-50 -160 Q-46 -210 0 -206 Q46 -210 50 -160 Q20 -180 -50 -170Z" fill="${hc}"/>`;
        g += `<circle cx="-17" cy="-152" r="6" fill="#1d1d24"/><circle cx="17" cy="-152" r="6" fill="#1d1d24"/>`;
        if (glow > 0) g += `<ellipse cy="-90" rx="80" ry="150" fill="#7dffb0" opacity="${(0.55 * glow).toFixed(2)}"/>`;
        s += `<g transform="translate(${(x + jx).toFixed(0)},${(y + Math.sin(c.t * 3 + x) * 3 * sc).toFixed(1)}) scale(${sc.toFixed(3)})" opacity="${Math.max(k, glow * 0.8).toFixed(2)}">${g}</g>`;
      }
    }
    return s;
  };

  // ---------- fondos derivados (habitaciones recoloreadas) ----------
  const recolor = (base, pairs, extra) => () => { let s = base(); pairs.forEach(([a, b]) => (s = s.split(a).join(b))); return s + (extra ? extra() : ''); };
  if (B.bedroomDay) {
    const hosp = [['#f2d6b0', '#e8f2f6'], ['#d8b48a', '#bcd6e0'], ['#e2c49c', '#d6e8ee'], ['#b8946a', '#9fbfcc'], ['#c98d5a', '#dfe6ea'], ['#8a5a36', '#aab6bf']];
    B.hospital = recolor(B.bedroomDay, hosp, () => `<rect x="70" y="900" width="940" height="60" fill="#5bb8f0" opacity=".35"/><g transform="translate(860,420)"><rect x="-70" y="-70" width="140" height="140" rx="20" fill="#fff"/><rect x="-16" y="-50" width="32" height="100" fill="#e5484d"/><rect x="-50" y="-16" width="100" height="32" fill="#e5484d"/></g>`);
    B.classroom = recolor(B.bedroomDay, [['#f2d6b0', '#f2e6c0'], ['#d8b48a', '#d9c690']], () => `<g transform="translate(540,620)"><rect x="-380" y="-200" width="760" height="380" rx="12" fill="#6b4528"/><rect x="-360" y="-180" width="720" height="340" fill="#2f4b3b"/><text x="-300" y="-80" font-family="DejaVu Serif, serif" font-size="70" fill="#f1f4ec" opacity=".9">2 + 2 =</text><path d="M-300 40 q60 -40 120 0 t120 0" stroke="#f1f4ec" stroke-width="6" fill="none" opacity=".7"/></g>`);
  }

  // ---------- muebles y objetos ----------
  A.hospBed = (p, c) => `<rect x="-260" y="-150" width="520" height="110" rx="24" fill="#f2f4f7"/><rect x="-260" y="-260" width="40" height="220" rx="12" fill="#9aa3ad"/><rect x="220" y="-200" width="40" height="160" rx="12" fill="#9aa3ad"/><path d="M-120 -150 h360 q20 0 20 20 v40 h-380Z" fill="#7fc8e8"/><rect x="-240" y="-40" width="20" height="40" fill="#5a5f6a"/><rect x="220" y="-40" width="20" height="40" fill="#5a5f6a"/><circle cx="-235" cy="6" r="14" fill="#2a2a32"/><circle cx="235" cy="6" r="14" fill="#2a2a32"/>`;
  A.desk = () => `<rect x="-120" y="-150" width="240" height="30" rx="8" fill="#c98d4a"/><rect x="-110" y="-120" width="18" height="120" fill="#7d838c"/><rect x="92" y="-120" width="18" height="120" fill="#7d838c"/><rect x="-60" y="-100" width="120" height="16" rx="6" fill="#5b7cff"/><rect x="-50" y="-84" width="12" height="84" fill="#7d838c"/><rect x="38" y="-84" width="12" height="84" fill="#7d838c"/>`;
  A.pan = (p, c) => { let s = `<ellipse cx="0" cy="0" rx="130" ry="40" fill="#2a2a30"/><ellipse cx="0" cy="-6" rx="110" ry="30" fill="#3a2a22"/><rect x="120" y="-14" width="160" height="26" rx="12" fill="#2a2a30"/>`; if (p.burnt) for (let i = 0; i < 6; i++) { const u = ((c.t * 0.6 + i / 6) % 1); s += `<circle cx="${(-50 + i * 20 + Math.sin(c.t * 2 + i) * 20).toFixed(0)}" cy="${(-40 - u * 320).toFixed(0)}" r="${(30 + u * 50).toFixed(0)}" fill="#55555c" opacity="${((1 - u) * 0.6).toFixed(2)}"/>`; } return s; };
  A.laundry = () => [['#5b7cff', -80, 0], ['#e5484d', 40, -10], ['#f2c230', -20, -60], ['#8bd16a', 70, -70], ['#b07cff', -60, -110], ['#fff', 20, -130]].map(([c, x, y]) => `<ellipse cx="${x}" cy="${y}" rx="110" ry="50" fill="${c}"/>`).join('') + `<rect x="-170" y="-10" width="340" height="40" rx="12" fill="#c9a050"/>`;
  A.shop = (p, c) => {
    const col = p.color || '#5b7cff';
    let s = `<rect x="-200" y="-520" width="400" height="520" fill="#e8e2d6"/><path d="M-220 -540 h440 v70 q-55 40 -110 0 q-55 40 -110 0 q-55 40 -110 0 q-55 40 -110 0Z" fill="${col}"/>`;
    s += `<rect x="-160" y="-420" width="320" height="300" fill="#1d2440"/><path d="M-160 -420 V-120 M-60 -420 V-120 M40 -420 V-120 M140 -420 V-120" stroke="#9aa3ad" stroke-width="10" opacity=".6"/>`;
    s += `<rect x="-60" y="-110" width="120" height="110" fill="#5a3a22"/>`;
    if (p.closed) s += `<g transform="translate(0,-260) rotate(-6)"><rect x="-130" y="-46" width="260" height="92" rx="12" fill="#e5484d"/><text y="18" text-anchor="middle" font-family="Inter" font-weight="900" font-size="54" fill="#fff">CERRADO</text></g>`;
    return s;
  };
  A.crib = (p, c) => { let s = `<rect x="-200" y="-260" width="400" height="20" rx="8" fill="#f6f4ee"/><rect x="-200" y="-40" width="400" height="24" rx="8" fill="#f6f4ee"/>`; for (let i = 0; i <= 10; i++) s += `<rect x="${-196 + i * 39}" y="-260" width="12" height="240" rx="6" fill="#f6f4ee"/>`; s += `<rect x="-200" y="-20" width="16" height="60" fill="#e8e2d6"/><rect x="184" y="-20" width="16" height="60" fill="#e8e2d6"/><rect x="-180" y="-80" width="360" height="40" rx="14" fill="#bfe0f0"/>`; return s; };
  A.lamb = (p, c) => { let s = ''; [[-40, -20], [0, -40], [40, -20], [-20, 10], [30, 10], [0, -5]].forEach(([x, y]) => (s += `<circle cx="${x}" cy="${y}" r="44" fill="#f6f4ee"/>`)); s += `<ellipse cx="60" cy="-40" rx="34" ry="28" fill="#2a2a32"/><circle cx="68" cy="-46" r="6" fill="#fff"/><ellipse cx="40" cy="-60" rx="18" ry="9" fill="#2a2a32" transform="rotate(-30 40 -60)"/>`; [-40, -10, 20, 50].forEach((x) => (s += `<rect x="${x}" y="30" width="12" height="40" rx="5" fill="#2a2a32"/>`)); return s; };
  A.bubbleLab = (p, c) => { const pul = 1 + Math.sin(c.t * 2) * 0.02; return `<g transform="scale(${pul.toFixed(3)})"><circle r="220" fill="#7dffb0" opacity=".18"/><circle r="200" fill="none" stroke="#c9ffe0" stroke-width="10" opacity=".8"/><ellipse cx="-80" cy="-110" rx="50" ry="24" fill="#fff" opacity=".35"/>${A.lamb({}, c)}<path d="M0 200 V320" stroke="#9aa3ad" stroke-width="22"/><rect x="-120" y="320" width="240" height="40" rx="12" fill="#5a5f6a"/></g>`; };
  A.swing = (p, c) => { const a = Math.sin(c.t * 1.8) * 22; return `<path d="M-260 0 L-200 -520 L200 -520 L260 0" stroke="#e5484d" stroke-width="22" fill="none" stroke-linejoin="round"/><g transform="translate(0,-510) rotate(${a.toFixed(1)})"><path d="M-70 0 V380 M70 0 V380" stroke="#5a5f6a" stroke-width="7"/><rect x="-90" y="370" width="180" height="26" rx="8" fill="#f2c230"/></g>`; };
  A.slide = () => `<path d="M-120 0 V-360 H-60 V0" fill="none" stroke="#5b7cff" stroke-width="16"/><path d="M-60 -360 L200 -30 L240 0" stroke="#f07f2a" stroke-width="40" fill="none" stroke-linecap="round"/>${[...Array(6)].map((_, i) => `<path d="M-120 ${-60 * i - 40} H-60" stroke="#5b7cff" stroke-width="10"/>`).join('')}`;
  A.cane = () => `<path d="M0 0 V-260 Q0 -300 40 -300" stroke="#7a4a22" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  // ciudad abandonada con plantas (growth 0..1)
  A.ruins = (p, c) => {
    const g = clamp(p.growth ?? 0, 0, 1), r = rng(17);
    let s = '';
    const blds = [[-80, 760, 220], [170, 980, 200], [400, 640, 230], [650, 1050, 210], [880, 820, 240], [1100, 700, 200]];
    blds.forEach(([x, h, w], i) => {
      s += `<rect x="${x}" y="${1500 - h}" width="${w}" height="${h}" fill="${['#7d838c', '#6b717a', '#8a9099'][i % 3]}"/>`;
      for (let wy = 1500 - h + 40; wy < 1460; wy += 80) for (let wx = x + 24; wx < x + w - 40; wx += 60) s += `<rect x="${wx}" y="${wy}" width="34" height="44" fill="#3a3f4a"/>`;
      for (let k = 0; k < 10 * g; k++) s += `<circle cx="${(x + r() * w).toFixed(0)}" cy="${(1500 - r() * h * g).toFixed(0)}" r="${(20 + r() * 40).toFixed(0)}" fill="${['#3f8a3a', '#5fae4a', '#2f6a2a'][k % 3]}" opacity=".95"/>`;
    });
    for (let k = 0; k < 14; k++) { const x = -100 + k * 95, h = 120 + r() * 260 * g; s += `<path d="M${x} 1500 V${(1500 - h).toFixed(0)}" stroke="#5a3a22" stroke-width="18"/><circle cx="${x}" cy="${(1500 - h).toFixed(0)}" r="${(60 + 60 * g).toFixed(0)}" fill="#4f9a3a"/>`; }
    return s;
  };
})();
