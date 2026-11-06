// Biblioteca 2D: tema ABEJAS (abeja, flores, campo, sello FALSO, súper, frutas con precio,
// aguacate triste, guacamole, maíz/trigo al viento, vaca, leche, carne, plato, pincel, árbol en flor).
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp, lerp, ease } = window.SH;
  const W = 1080, H = 1920;

  B.flowerField = (t) => {
    let s = `<defs><linearGradient id="ffsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8fd6"/><stop offset="0.7" stop-color="#a9d4f2"/><stop offset="1" stop-color="#e8f4f8"/></linearGradient></defs>`;
    s += `<rect x="-800" y="-800" width="2680" height="2100" fill="url(#ffsky)"/>`;
    s += `<circle cx="860" cy="420" r="90" fill="#fff3b0"/>`;
    for (let i = 0; i < 4; i++) { const x = (-300 + i * 520 + (t || 0) * 12) % 2400 - 400; s += `<g transform="translate(${x.toFixed(0)},${300 + i * 70})" opacity="0.9"><ellipse rx="120" ry="40" fill="#fff"/><ellipse cx="-60" cy="-25" rx="70" ry="40" fill="#fff"/><ellipse cx="50" cy="-30" rx="80" ry="45" fill="#fff"/></g>`; }
    s += `<path d="M-800 1250 Q-200 1150 400 1240 T1900 1230 V2800 H-800Z" fill="#7cc35a"/>`;
    s += `<path d="M-800 1380 Q-100 1320 600 1390 T1900 1380 V2800 H-800Z" fill="#5fae4a"/>`;
    const r = rng(12);
    for (let i = 0; i < 120; i++) { const x = r() * 2600 - 800, y = 1260 + Math.pow(r(), 0.7) * 1100, sc = 0.25 + (y - 1260) / 1100 * 0.6; s += `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${sc.toFixed(2)})">${flower(['#ff7aa8', '#ffd84a', '#ffffff', '#b07cff', '#ff9a4a'][i % 5])}</g>`; }
    return s;
  };
  function flower(col) {
    let s = `<path d="M0 0 V70" stroke="#3f8a3a" stroke-width="8"/>`;
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; s += `<ellipse cx="${(Math.cos(a) * 26).toFixed(1)}" cy="${(Math.sin(a) * 26).toFixed(1)}" rx="22" ry="14" fill="${col}" transform="rotate(${k * 60} ${(Math.cos(a) * 26).toFixed(1)} ${(Math.sin(a) * 26).toFixed(1)})"/>`; }
    return s + `<circle r="16" fill="#f2a52a"/>`;
  }
  A.flower = (p) => flower(p.color || '#ff7aa8');

  B.supermarket = () => {
    let s = `<rect x="-800" y="-800" width="2680" height="3520" fill="#f2efe6"/>`;
    s += `<rect x="-800" y="-800" width="2680" height="300" fill="#e5484d"/>`;
    for (let x = -800; x < 1900; x += 180) s += `<rect x="${x}" y="-500" width="90" height="40" fill="#fff" opacity="0.4"/>`;
    s += `<rect x="-800" y="1560" width="2680" height="1200" fill="#d9d2c2"/>`;
    for (let x = -800; x < 1900; x += 160) s += `<rect x="${x}" y="1560" width="80" height="1200" fill="#cfc8b6"/>`;
    return s;
  };

  // abeja simpática; vuela con alas que aletean
  A.bee = function (p, c) {
    const f = Math.sin(c.t * 60 + (p.seed || 0)) * 0.5 + 0.5;
    let s = `<ellipse cx="-14" cy="-38" rx="26" ry="${(30 * (0.5 + f * 0.5)).toFixed(1)}" fill="#e6f6ff" opacity="0.85" transform="rotate(-25 -14 -38)"/><ellipse cx="16" cy="-38" rx="24" ry="${(28 * (0.5 + f * 0.5)).toFixed(1)}" fill="#e6f6ff" opacity="0.85" transform="rotate(20 16 -38)"/>`;
    s += `<ellipse cx="0" cy="0" rx="52" ry="38" fill="#ffcf2e"/>`;
    [-14, 10].forEach((x) => (s += `<path d="M${x} -36 Q${x + 8} 0 ${x} 36" stroke="#2a2018" stroke-width="13" fill="none"/>`));
    s += `<path d="M-52 0 l-18 0" stroke="#2a2018" stroke-width="8" stroke-linecap="round"/>`;
    s += `<circle cx="44" cy="-6" r="24" fill="#2a2018"/><circle cx="50" cy="-12" r="7" fill="#fff"/><circle cx="52" cy="-13" r="3.5" fill="#000"/>`;
    s += `<path d="M48 -28 q6 -24 18 -30 M38 -28 q-2 -26 6 -34" stroke="#2a2018" stroke-width="4" fill="none"/>`;
    return s;
  };

  A.stamp = function (p, c) {
    const k = ease.back(clamp(c.lt / 0.25, 0, 1));
    return `<g transform="rotate(-14) scale(${(2.2 - 1.2 * k).toFixed(3)})" opacity="${k.toFixed(2)}"><rect x="-230" y="-80" width="460" height="160" rx="20" fill="none" stroke="#e5484d" stroke-width="16"/><text y="40" text-anchor="middle" font-family="Inter" font-weight="900" font-size="120" fill="#e5484d" letter-spacing="6">${p.text || 'FALSO'}</text></g>`;
  };

  // cita en bocadillo
  A.quote = function (p) {
    const lines = p.lines || [];
    const h = 60 + lines.length * 58;
    return `<rect x="-330" y="${-h}" width="660" height="${h}" rx="40" fill="#fff"/><path d="M-120 0 l-40 70 l100 -70Z" fill="#fff"/>${lines.map((l, i) => `<text y="${-h + 70 + i * 58}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="44" fill="#1d1d26">${l}</text>`).join('')}`;
  };

  // frutas e iconos (≈ 200 px)
  const FRUIT = {
    manzana: () => `<path d="M0 -60 C60 -110 130 -40 100 40 C80 100 30 110 0 90 C-30 110 -80 100 -100 40 C-130 -40 -60 -110 0 -60Z" fill="#e5484d"/><path d="M0 -60 Q-6 -100 10 -120" stroke="#6b4428" stroke-width="10" fill="none"/><path d="M10 -100 Q50 -130 70 -95 Q40 -80 10 -100Z" fill="#5fae4a"/><ellipse cx="-50" cy="-20" rx="16" ry="28" fill="#fff" opacity="0.35"/>`,
    almendra: () => [0, 1, 2].map((i) => `<g transform="translate(${-60 + i * 60},${(i % 2) * 20}) rotate(${-20 + i * 20})"><path d="M0 -70 C40 -40 40 40 0 70 C-40 40 -40 -40 0 -70Z" fill="#c98d4a"/><path d="M0 -50 V50" stroke="#a46a30" stroke-width="5"/></g>`).join(''),
    fresa: () => `<path d="M-90 -40 Q0 -70 90 -40 Q80 60 0 110 Q-80 60 -90 -40Z" fill="#e5484d"/>${[...Array(12)].map((_, i) => `<ellipse cx="${-50 + (i % 4) * 34}" cy="${-10 + Math.floor(i / 4) * 34}" rx="4" ry="7" fill="#ffe08a"/>`).join('')}<path d="M-60 -50 L-20 -80 L0 -55 L20 -80 L60 -50 L0 -40Z" fill="#5fae4a"/>`,
    melon: () => `<path d="M-110 0 A110 110 0 0 0 110 0Z" fill="#7fbf4a"/><path d="M-96 0 A96 96 0 0 0 96 0Z" fill="#ffb07a"/>${[...Array(7)].map((_, i) => `<ellipse cx="${-60 + i * 20}" cy="${30 + Math.abs(3 - i) * 4}" rx="5" ry="9" fill="#f6efe0"/>`).join('')}`,
    aguacate: (p) => `<path d="M0 -120 C70 -120 100 20 90 60 C80 120 -80 120 -90 60 C-100 20 -70 -120 0 -120Z" fill="#3f6a2a"/><path d="M0 -100 C55 -100 80 20 72 55 C64 100 -64 100 -72 55 C-80 20 -55 -100 0 -100Z" fill="#c8e27a"/><circle cx="0" cy="40" r="42" fill="#8a5a2e"/>${p.sad ? `<circle cx="-30" cy="-30" r="9" fill="#2a2a2a"/><circle cx="30" cy="-30" r="9" fill="#2a2a2a"/><path d="M-22 0 Q0 -16 22 0" stroke="#2a2a2a" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-30 -14 q-4 14 0 22" stroke="#5bb8f0" stroke-width="6" fill="none"/>` : ''}`,
    guacamole: () => `<ellipse cx="0" cy="0" rx="150" ry="40" fill="#8a9f3a"/><ellipse cx="0" cy="-6" rx="130" ry="30" fill="#a8c64a"/>${[...Array(8)].map((_, i) => `<circle cx="${-90 + i * 26}" cy="${-8 + (i % 2) * 8}" r="9" fill="${i % 3 ? '#e5484d' : '#f6efe0'}"/>`).join('')}<path d="M-150 0 Q-140 90 0 95 Q140 90 150 0Z" fill="#c98d4a"/><path d="M-140 30 h280" stroke="#a46a30" stroke-width="6"/>`,
    maiz: (p, c) => { const sw = Math.sin(c.t * 2.5 + (p.seed || 0)) * 8; return `<g transform="rotate(${sw.toFixed(1)})"><path d="M0 0 V-300" stroke="#6aa84a" stroke-width="14"/><path d="M0 -120 Q-80 -160 -110 -240 M0 -180 Q80 -220 110 -300" stroke="#6aa84a" stroke-width="14" fill="none" stroke-linecap="round"/><ellipse cx="22" cy="-200" rx="22" ry="60" fill="#ffd84a"/><path d="M0 -300 l-14 -50 M0 -300 l14 -50 M0 -300 l0 -60" stroke="#c9a050" stroke-width="5"/></g>`; },
    trigo: (p, c) => { const sw = Math.sin(c.t * 2.5 + (p.seed || 0)) * 10; return `<g transform="rotate(${sw.toFixed(1)})"><path d="M0 0 V-260" stroke="#c9a050" stroke-width="7"/>${[...Array(6)].map((_, i) => `<ellipse cx="-12" cy="${-200 - i * 14}" rx="9" ry="15" fill="#e8c46a" transform="rotate(-30 -12 ${-200 - i * 14})"/><ellipse cx="12" cy="${-200 - i * 14}" rx="9" ry="15" fill="#e8c46a" transform="rotate(30 12 ${-200 - i * 14})"/>`).join('')}</g>`; },
    leche: () => `<path d="M-60 -160 L60 -160 L60 -120 L80 -90 V110 H-80 V-90 L-60 -120Z" fill="#fff" stroke="#c9d2dd" stroke-width="6"/><rect x="-80" y="-30" width="160" height="80" fill="#5b9cff"/><text y="25" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#fff">LECHE</text>`,
    carne: () => `<path d="M-120 -40 Q-130 -100 -40 -100 Q80 -110 120 -30 Q140 60 40 80 Q-110 100 -120 -40Z" fill="#d9534f"/><path d="M-80 -40 Q0 -70 80 -20" stroke="#f6dcd0" stroke-width="12" fill="none"/><circle cx="60" cy="10" r="22" fill="#f6efe0"/>`,
    vitaminas: () => `<rect x="-80" y="-120" width="160" height="220" rx="20" fill="#ff9a4a"/><rect x="-90" y="-150" width="180" height="50" rx="14" fill="#fff"/><text y="20" text-anchor="middle" font-family="Inter" font-weight="900" font-size="60" fill="#fff">C</text>`,
  };
  const _item = A.item;
  A.item = function (p, c) { const r = _item(p, c); if (r) return r; if (A.junk) return A.junk(p, c); return ''; };
  A.food = function (p, c) { return (FRUIT[p.kind] || (() => ''))(p, c); };

  // etiqueta de precio que sube
  A.priceTag = function (p, c) {
    const n = Math.round(p.value ?? 10);
    return `<g transform="rotate(-8)"><path d="M-110 -50 H80 L120 0 L80 50 H-110Z" fill="#ffd84a" stroke="#c99a1a" stroke-width="5"/><circle cx="85" cy="0" r="10" fill="#fff"/><text x="-15" y="18" text-anchor="middle" font-family="Inter" font-weight="900" font-size="50" fill="#e5484d">$${n}</text></g>`;
  };

  // vaca comiendo
  A.cow = function (p, c) {
    const chew = Math.sin(c.t * 6) * 4;
    let s = `<ellipse cx="0" cy="6" rx="230" ry="22" fill="#000" opacity="0.18"/>`;
    [-140, -80, 90, 150].forEach((x) => (s += `<rect x="${x - 18}" y="-130" width="36" height="130" rx="14" fill="#f4f4f0"/><rect x="${x - 18}" y="-20" width="36" height="20" rx="6" fill="#3a2a22"/>`));
    s += `<ellipse cx="0" cy="-190" rx="210" ry="110" fill="#f4f4f0"/>`;
    s += `<ellipse cx="-60" cy="-220" rx="60" ry="40" fill="#2a2a2a"/><ellipse cx="80" cy="-170" rx="50" ry="36" fill="#2a2a2a"/>`;
    s += `<g transform="translate(220,${-120 + chew})"><ellipse rx="80" ry="64" fill="#f4f4f0"/><ellipse cx="34" cy="24" rx="50" ry="38" fill="#f2b8b0"/><circle cx="20" cy="22" r="6" fill="#7a4a42"/><circle cx="48" cy="22" r="6" fill="#7a4a42"/><circle cx="-14" cy="-20" r="10" fill="#1d1d24"/><path d="M-40 -60 l-20 -30 M10 -62 l12 -32" stroke="#c9b48a" stroke-width="12" stroke-linecap="round"/><path d="M60 50 q20 10 30 0" stroke="#5fae4a" stroke-width="10" fill="none"/></g>`;
    s += `<path d="M-210 -200 q-40 20 -30 80" stroke="#f4f4f0" stroke-width="12" fill="none"/>`;
    return s;
  };

  // árbol en flor y pincel
  A.blossomTree = function (p, c) {
    let s = `<path d="M-30 0 Q-20 -200 -10 -320 L10 -320 Q20 -200 30 0Z" fill="#7a5032"/><path d="M0 -260 Q-120 -330 -200 -300 M0 -280 Q120 -360 200 -330" stroke="#7a5032" stroke-width="22" fill="none" stroke-linecap="round"/>`;
    const r = rng(6);
    for (let i = 0; i < 26; i++) { const x = -260 + r() * 520, y = -520 + r() * 260; s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(60 + r() * 50).toFixed(0)}" fill="${['#ffd1e0', '#ffc0d6', '#ffe4ee'][i % 3]}"/>`; }
    for (let i = 0; i < 14; i++) { const x = -220 + r() * 440, y = -480 + r() * 220; s += `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)}) scale(0.35)">${flower('#ff8ab0')}</g>`; }
    return s;
  };
  A.brush = function (p, c) {
    return `<g transform="rotate(${(p.rot ?? -40) + Math.sin(c.t * 8) * 8})"><rect x="-10" y="-20" width="20" height="200" rx="8" fill="#c98d4a"/><rect x="-14" y="-50" width="28" height="36" rx="4" fill="#c9ccd1"/><path d="M-14 -50 Q0 -110 14 -50Z" fill="#ffd84a"/></g>`;
  };
})();
