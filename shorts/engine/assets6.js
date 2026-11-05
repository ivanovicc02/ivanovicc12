// Biblioteca 2D: tema LA LUNA DESAPARECE (cielo nocturno, luna, ojos en la oscuridad, tortugas,
// playa nocturna con ciudad, Tierra con eje, sol y eclipse).
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp, lerp, ease } = window.SH;
  const W = 1080, H = 1920;

  function stars(seed, n, t, yMax = 1500) {
    const r = rng(seed); let s = '';
    for (let i = 0; i < n; i++) { const tw = 0.4 + 0.6 * Math.abs(Math.sin((t || 0) * (0.4 + r() * 1.5) + i)); s += `<circle cx="${(r() * 2600 - 800).toFixed(0)}" cy="${(r() * (yMax + 800) - 800).toFixed(0)}" r="${(0.8 + r() * 2.4).toFixed(1)}" fill="#fff" opacity="${(tw * (0.4 + r() * 0.6)).toFixed(2)}"/>`; }
    return s;
  }
  B.nightClear = (t) => {
    let s = `<defs><linearGradient id="ncs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05071a"/><stop offset="0.7" stop-color="#18183c"/><stop offset="1" stop-color="#2e2654"/></linearGradient></defs>`;
    s += `<rect x="-800" y="-800" width="2680" height="3520" fill="url(#ncs)"/>` + stars(5, 240, t);
    s += `<path d="M-800 1420 Q-300 1300 200 1400 T1200 1380 T2000 1400 V2800 H-800Z" fill="#1a2a2a"/>`;
    s += `<path d="M-800 1520 Q-200 1470 400 1530 T1900 1510 V2800 H-800Z" fill="#132020"/>`;
    return s;
  };
  B.beachNight = (t) => {
    let s = `<rect x="-800" y="-800" width="2680" height="1850" fill="#0a0c22"/>` + stars(9, 160, t, 900);
    s += `<rect x="-800" y="1000" width="2680" height="190" fill="#14284a"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M-800 ${1030 + i * 30} ${[...Array(30)].map((_, k) => `q40 ${Math.sin((t || 0) * 1.4 + i + k) * 6} 80 0`).join(' ')}" stroke="#4a6a9a" stroke-width="3" fill="none" opacity="0.35"/>`;
    s += `<path d="M-800 1180 Q-300 1150 200 1185 T1200 1175 T2000 1180 V2800 H-800Z" fill="#6a5a44"/>`;
    // luces de ciudad a la izquierda
    s += `<defs><radialGradient id="cityg" cx="0" cy="0.5" r="0.9"><stop offset="0" stop-color="#ffcf6e" stop-opacity="0.65"/><stop offset="1" stop-color="#ffcf6e" stop-opacity="0"/></radialGradient></defs>`;
    s += `<rect x="-800" y="1100" width="1100" height="900" fill="url(#cityg)"/>`;
    const r = rng(4);
    for (let i = 0; i < 14; i++) { const x = -300 + i * 30, h = 60 + r() * 140; s += `<rect x="${x}" y="${1180 - h}" width="26" height="${h}" fill="#1a1a2a"/>${[...Array(4)].map((_, k) => `<rect x="${x + 8}" y="${1180 - h + 10 + k * 28}" width="10" height="12" fill="#ffd76e"/>`).join('')}`; }
    return s;
  };

  A.moon = function (p, c) {
    const k = clamp(p.k ?? 1, 0, 1);
    if (k <= 0.001) return '';
    const R = p.r || 150;
    let s = `<defs><radialGradient id="mglow"><stop offset="0.5" stop-color="#fffbe6" stop-opacity="0.45"/><stop offset="1" stop-color="#fffbe6" stop-opacity="0"/></radialGradient></defs>`;
    s += `<g opacity="${k.toFixed(2)}" transform="scale(${(0.6 + 0.4 * k).toFixed(3)})"><circle r="${R * 2.2}" fill="url(#mglow)"/><circle r="${R}" fill="#f4efd6"/>`;
    [[-40, -30, 32], [50, 20, 24], [-10, 60, 18], [30, -60, 14], [-70, 40, 12]].forEach(([x, y, r]) => (s += `<circle cx="${x * R / 150}" cy="${y * R / 150}" r="${r * R / 150}" fill="#ddd6b8"/>`));
    s += `<path d="M${-R} 0 A${R} ${R} 0 0 0 ${R} 0" fill="#000" opacity="0.06"/></g>`;
    if (k < 0.98) for (let i = 0; i < 10; i++) { const a = i * 0.63, rr = R * (1.1 + (1 - k) * 1.6); s += `<circle cx="${(Math.cos(a) * rr).toFixed(0)}" cy="${(Math.sin(a) * rr).toFixed(0)}" r="${(8 * k + 2).toFixed(1)}" fill="#fffbe6" opacity="${k.toFixed(2)}"/>`; }
    return s;
  };

  // ojos brillantes de animales perdidos con "?"
  A.eyes = function (p, c) {
    const blink = ((c.t + (p.seed || 0)) % 3.1) < 0.12 ? 0.1 : 1;
    let s = '';
    [-26, 26].forEach((x) => (s += `<ellipse cx="${x}" cy="0" rx="16" ry="${(20 * blink).toFixed(1)}" fill="#ffe36e"/><ellipse cx="${x}" cy="0" rx="5" ry="${(16 * blink).toFixed(1)}" fill="#1a1a1a"/>`));
    if (p.q) s += `<text x="0" y="-50" text-anchor="middle" font-family="Inter" font-weight="900" font-size="64" fill="#fff" opacity="${(0.6 + 0.4 * Math.sin(c.t * 4)).toFixed(2)}">?</text>`;
    return s;
  };

  // tortuguita vista desde arriba (mira hacia -y); patas animadas
  A.turtle = function (p, c) {
    const a = Math.sin(c.t * 10 + (p.seed || 0)) * 25;
    let s = '';
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([kx, ky]) => (s += `<ellipse cx="${kx * 34}" cy="${ky * 26}" rx="22" ry="10" fill="#4a7a4a" transform="rotate(${(kx * ky * a).toFixed(1)} ${kx * 34} ${ky * 26})"/>`));
    s += `<ellipse cx="0" cy="-52" rx="16" ry="18" fill="#5a8a5a"/><circle cx="-7" cy="-58" r="3" fill="#111"/><circle cx="7" cy="-58" r="3" fill="#111"/>`;
    s += `<ellipse cx="0" cy="0" rx="36" ry="44" fill="#3f6a3f"/><path d="M0 -30 L18 -12 L18 14 L0 30 L-18 14 L-18 -12Z" fill="#5f8f4f"/>`;
    return s;
  };

  // Tierra con eje inclinado (tilt en grados) y luna orbitando (moon 0..1)
  A.earthAxis = function (p, c) {
    const tilt = p.tilt ?? 23;
    let s = `<g transform="rotate(${tilt.toFixed(2)})"><path d="M0 -420 V420" stroke="#fff" stroke-width="8" stroke-dasharray="26 16" opacity="0.8"/></g>`;
    s += `<g transform="rotate(${(tilt * 0.6).toFixed(2)})">${A.globe({ r: 290, rot: 1.2 }, c)}</g>`;
    s += `<g transform="rotate(${tilt.toFixed(2)})"><path d="M0 -420 V-300 M0 300 V420" stroke="#fff" stroke-width="8"/><circle cy="-430" r="12" fill="#fff"/></g>`;
    const m = clamp(p.moon ?? 0, 0, 1);
    if (m > 0) {
      const a = c.t * 0.9;
      s += `<ellipse rx="470" ry="120" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 12" opacity="${(0.4 * m).toFixed(2)}"/>`;
      const mx = Math.cos(a) * 470, my = Math.sin(a) * 120;
      s += `<g transform="translate(${mx.toFixed(1)},${my.toFixed(1)})">${A.moon({ k: m, r: 55 }, c)}</g>`;
      if (p.anchor) s += `<path d="M${mx.toFixed(0)} ${my.toFixed(0)} L0 0" stroke="#ffd84a" stroke-width="6" stroke-dasharray="14 10" opacity="${m.toFixed(2)}"/>`;
    }
    return s;
  };
  A.anchor = function () {
    return `<circle cy="-150" r="34" fill="none" stroke="#ffd84a" stroke-width="16"/><path d="M0 -116 V120 M-60 -60 H60 M-130 30 Q-120 130 0 130 Q120 130 130 30" stroke="#ffd84a" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M-150 10 L-110 50 L-150 70Z M150 10 L110 50 L150 70Z" fill="#ffd84a"/>`;
  };

  // sol con corona; eclipse: cover 0..1 (luna delante), moonGone 0..1
  A.sun = function (p, c) {
    const cov = clamp(p.cover ?? 0, 0, 1), gone = clamp(p.moonGone ?? 0, 0, 1);
    let s = `<defs><radialGradient id="sunG"><stop offset="0.4" stop-color="#fff3c4"/><stop offset="0.7" stop-color="#ffb04a" stop-opacity="0.6"/><stop offset="1" stop-color="#ff7a2f" stop-opacity="0"/></radialGradient></defs>`;
    s += `<circle r="${(420 + Math.sin(c.t * 2) * 10).toFixed(0)}" fill="url(#sunG)" opacity="${(0.6 + 0.4 * cov * (1 - gone)).toFixed(2)}"/>`;
    s += `<circle r="200" fill="#ffd36e"/>`;
    if (gone < 1) s += `<circle cx="${((1 - cov) * 420 + gone * 0).toFixed(0)}" cy="0" r="204" fill="#0d0d1e" opacity="${(1 - gone).toFixed(2)}"/>`;
    return s;
  };
})();
