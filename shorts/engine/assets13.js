// Kit EXCAVAR: patio, corte del suelo con pozo, objetos enterrados, dinosaurio, gemas, bombas, perforadora,
// termómetro, noticiero, helicóptero, corte de la Tierra, pala y tierra volando.
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp, lerp, ease } = window.SH;

  B.backyard = (t) => {
    let s = `<defs><linearGradient id="bysky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8fd6"/><stop offset="1" stop-color="#cfe8f6"/></linearGradient></defs>`;
    s += `<rect x="-900" y="-900" width="2880" height="2300" fill="url(#bysky)"/><circle cx="880" cy="380" r="80" fill="#fff3b0"/>`;
    for (let i = 0; i < 3; i++) { const x = ((i * 520 + (t || 0) * 14) % 2000) - 400; s += `<g transform="translate(${x.toFixed(0)},${300 + i * 90})"><ellipse rx="120" ry="40" fill="#fff"/><ellipse cx="-60" cy="-26" rx="70" ry="40" fill="#fff"/><ellipse cx="50" cy="-30" rx="80" ry="45" fill="#fff"/></g>`; }
    s += `<rect x="-900" y="700" width="760" height="620" fill="#e8b27a"/><path d="M-950 720 L-520 460 L-90 720Z" fill="#b8503e"/><rect x="-420" y="880" width="160" height="150" fill="#2a2f4a"/><path d="M-340 880 V1030 M-420 955 H-260" stroke="#e8b27a" stroke-width="10"/>`;
    s += `<rect x="-900" y="1060" width="2880" height="20" fill="#a8743f"/>`;
    for (let x = -900; x < 2000; x += 60) s += `<path d="M${x} 1310 V1030 l25 -30 l25 30 V1310Z" fill="#c98d4a" stroke="#8a5a2e" stroke-width="4"/>`;
    s += `<rect x="-900" y="1300" width="2880" height="1600" fill="#6fae4a"/>`;
    const r = rng(5); for (let i = 0; i < 160; i++) { const x = r() * 2700 - 850, y = 1320 + r() * 1300; s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-6 -16 m6 16 l6 -18" stroke="#4f8a3a" stroke-width="4" opacity=".7"/>`; }
    return s;
  };

  // capas del subsuelo (corte) + pozo; depth en px desde la superficie (y=420)
  const SURF = 420;
  let layersCache = null;
  function layers() {
    if (layersCache) return layersCache;
    let s = `<defs><linearGradient id="gcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8fd6"/><stop offset="1" stop-color="#cfe8f6"/></linearGradient></defs>`;
    s += `<rect x="-900" y="-900" width="2880" height="${SURF + 900}" fill="url(#gcSky)"/>`;
    const L = [[SURF, 160, '#6fae4a', '#4f8a3a'], [SURF + 30, 400, '#8a5a32', '#6e4426'], [SURF + 430, 500, '#a0704a', '#80563a'], [SURF + 930, 600, '#7d838c', '#626872'], [SURF + 1530, 800, '#6a4a5a', '#523848'], [SURF + 2330, 1200, '#8a3a2a', '#6a2a1e']];
    L.forEach(([y, h, c1, c2], i) => {
      s += `<rect x="-900" y="${y}" width="2880" height="${h + 10}" fill="${c1}"/>`;
      const r = rng(i + 3); for (let k = 0; k < 40; k++) s += `<ellipse cx="${(r() * 2700 - 850).toFixed(0)}" cy="${(y + 20 + r() * (h - 30)).toFixed(0)}" rx="${(10 + r() * 30).toFixed(0)}" ry="${(6 + r() * 14).toFixed(0)}" fill="${c2}" opacity=".7"/>`;
      s += `<path d="M-900 ${y} ${[...Array(30)].map((_, k) => `q50 ${(k % 2 ? 1 : -1) * 10} 100 0`).join(' ')}" stroke="#000" stroke-width="5" fill="none" opacity=".15"/>`;
    });
    return (layersCache = s);
  }
  A.groundCut = function (p, c) {
    const d = p.depth ?? 200, w = 230, x0 = 540 - w / 2;
    let s = layers();
    s += `<rect x="${x0}" y="${SURF}" width="${w}" height="${d}" fill="#2a1a12"/>`;
    s += `<rect x="${x0}" y="${SURF}" width="18" height="${d}" fill="#000" opacity=".35"/><rect x="${x0 + w - 18}" y="${SURF}" width="18" height="${d}" fill="#000" opacity=".25"/>`;
    if (p.walls) for (let y = SURF; y < SURF + d; y += 60) s += `<rect x="${x0 - 14}" y="${y}" width="${w + 28}" height="10" fill="#9aa3ad"/>`;
    if (p.water) { const wl = SURF + d - p.water; s += `<rect x="${x0}" y="${wl.toFixed(0)}" width="${w}" height="${p.water.toFixed(0)}" fill="#3aa0e8" opacity=".85"/><path d="M${x0} ${wl.toFixed(0)} ${[...Array(5)].map((_, k) => `q23 ${Math.sin(c.t * 4 + k) * 8} 46 0`).join(' ')}" stroke="#bfe8ff" stroke-width="6" fill="none"/>`; }
    if (p.lights) for (let y = SURF + 120; y < SURF + d; y += 220) s += `<circle cx="${x0 + 30}" cy="${y}" r="10" fill="#ffd84a"/><circle cx="${x0 + 30}" cy="${y}" r="40" fill="#ffd84a" opacity=".2"/>`;
    s += `<path d="M${x0 - 60} ${SURF} q60 -60 120 -10 M${x0 + w - 60} ${SURF - 10} q60 -50 120 10" stroke="#8a5a32" stroke-width="40" fill="none" stroke-linecap="round"/>`;
    return s;
  };
  A.SURF = SURF;

  A.shovel = (p, c) => `<g transform="rotate(${(p.rot ?? 0)})"><rect x="-8" y="-260" width="16" height="230" rx="6" fill="#a8743f"/><rect x="-34" y="-280" width="68" height="24" rx="10" fill="#2a2a32"/><path d="M-50 -40 L50 -40 L40 50 Q0 90 -40 50Z" fill="#9aa3ad" stroke="#5a5f6a" stroke-width="5"/></g>`;
  const _item = A.item;
  A.item = function (p, c) { if (p.kind === 'shovel') return A.shovel({ rot: 180 }, c); return _item(p, c); };
  A.dirtBurst = function (p, c) {
    const per = p.period || 0.55, u = (c.t % per) / per, r = rng(Math.floor(c.t / per) + 3);
    let s = '';
    for (let i = 0; i < 9; i++) { const vx = (r() - 0.5) * 340, vy = -280 - r() * 260; const x = vx * u, y = vy * u + 620 * u * u; s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(10 + r() * 14).toFixed(0)}" fill="${['#8a5a32', '#6e4426', '#a0704a'][i % 3]}" opacity="${(1 - u).toFixed(2)}"/>`; }
    return s;
  };
  A.coin = () => `<circle r="60" fill="#e8b828"/><circle r="46" fill="none" stroke="#c99a1a" stroke-width="8"/><text y="20" text-anchor="middle" font-family="DejaVu Serif" font-weight="700" font-size="54" fill="#c99a1a">$</text>`;
  A.vase = () => `<path d="M-40 -150 h80 v30 q70 30 70 110 q0 90 -70 100 h-80 q-70 -10 -70 -100 q0 -80 70 -110Z" fill="#c2643a"/><path d="M-100 -20 h200 M-90 30 h180" stroke="#7a3a1e" stroke-width="10"/><path d="M-60 -100 l30 40 l-20 30" stroke="#5a2a14" stroke-width="5" fill="none"/>`;
  A.worm = (p, c) => `<path d="M-80 0 ${[...Array(4)].map((_, i) => `q20 ${Math.sin(c.t * 6 + i) * 20} 40 0`).join(' ')}" stroke="#e98aa0" stroke-width="26" fill="none" stroke-linecap="round"/><circle cx="82" cy="0" r="5" fill="#2a2a32"/>`;
  A.rock = () => `<path d="M-70 30 L-50 -40 L10 -60 L70 -20 L60 40Z" fill="#8a9099" stroke="#626872" stroke-width="6"/>`;
  A.gem = (p, c) => { const col = p.color || '#5bdcff', g = 0.5 + 0.5 * Math.sin(c.t * 4 + (p.seed || 0)); return `<circle r="90" fill="${col}" opacity="${(0.25 * g).toFixed(2)}"/><path d="M-50 -20 L-25 -60 L25 -60 L50 -20 L0 60Z" fill="${col}"/><path d="M-50 -20 H50 M-25 -60 L-10 -20 L0 60 M25 -60 L10 -20" stroke="#fff" stroke-width="4" opacity=".6"/>`; };
  A.dino = (p, c) => {
    const glow = p.glow ? 0.5 + 0.5 * Math.sin(c.t * 3) : 0, bone = '#f2ead6', st = `stroke="${bone}" stroke-linecap="round" fill="none"`;
    let s = glow ? `<ellipse rx="520" ry="220" fill="#fff3b0" opacity="${(0.3 * glow).toFixed(2)}"/>` : '';
    s += `<path d="M-460 40 Q-300 -120 -60 -60 Q120 -30 260 -100" stroke-width="22" ${st}/>`;
    for (let i = 0; i < 12; i++) { const x = -360 + i * 50; s += `<path d="M${x} ${-60 - Math.sin(i / 3) * 30} q10 60 -10 110" stroke-width="12" ${st}/>`; }
    s += `<path d="M260 -100 l90 -40 q80 -10 100 40 l-40 30 l-80 0 l-60 -10Z" fill="${bone}"/><circle cx="380" cy="-110" r="12" fill="#2a2a32"/>`;
    [[-120, -40], [80, -40]].forEach(([x, y]) => (s += `<path d="M${x} ${y} l-20 120 l30 60" stroke-width="18" ${st}/>`));
    return s;
  };
  A.pump = (p, c) => `<rect x="-90" y="-120" width="180" height="120" rx="20" fill="#e5484d"/><circle cx="-30" cy="-60" r="34" fill="#2a2a32"/><circle cx="-30" cy="-60" r="34" fill="none" stroke="#9aa3ad" stroke-width="8" stroke-dasharray="20 14" transform="rotate(${(c.t * 400) % 360} -30 -60)"/><path d="M90 -60 h80 q30 0 30 30 v260" stroke="#2a2a32" stroke-width="22" fill="none"/>`;
  A.drillRig = (p, c) => {
    const vib = Math.sin(c.t * 40) * 2;
    let s = `<g transform="translate(${vib.toFixed(1)},0)"><path d="M-200 0 L-60 -900 L60 -900 L200 0" stroke="#f2c230" stroke-width="26" fill="none"/>`;
    for (let i = 1; i < 8; i++) { const y = -i * 110, w = 200 - i * 17; s += `<path d="M${-w} ${y} L${w} ${y - 110} M${w} ${y} L${-w} ${y - 110}" stroke="#d9a520" stroke-width="10"/>`; }
    s += `<rect x="-130" y="-160" width="260" height="140" rx="16" fill="#e5484d"/><rect x="-100" y="-140" width="90" height="70" rx="8" fill="#bfe0f0"/>`;
    s += `<rect x="-20" y="-20" width="40" height="${(p.bit ?? 200)}" fill="#7d838c"/></g>`;
    if (p.smoke) for (let i = 0; i < 5; i++) { const u = ((c.t * 0.6 + i / 5) % 1); s += `<circle cx="${(60 + Math.sin(i + c.t) * 30).toFixed(0)}" cy="${(-200 - u * 400).toFixed(0)}" r="${(40 + u * 70).toFixed(0)}" fill="#55555c" opacity="${((1 - u) * 0.55).toFixed(2)}"/>`; }
    return s;
  };
  A.thermo = (p) => { const l = clamp(p.level ?? 0.5, 0, 1), col = l > 0.7 ? '#e5484d' : l > 0.4 ? '#ffb04a' : '#5bb8f0'; return `<rect x="-40" y="-380" width="80" height="380" rx="40" fill="#fff" stroke="#2a2a32" stroke-width="10"/><circle cy="20" r="70" fill="${col}" stroke="#2a2a32" stroke-width="10"/><rect x="-20" y="${(-360 + 340 * (1 - l)).toFixed(0)}" width="40" height="${(340 * l + 20).toFixed(0)}" fill="${col}"/>`; };
  A.newsTV = (p, c) => `<rect x="-360" y="-240" width="720" height="440" rx="20" fill="#16161c"/><rect x="-340" y="-220" width="680" height="400" fill="#2a4a8a"/><rect x="-340" y="100" width="680" height="80" fill="#e5484d"/><text x="-320" y="155" font-family="Inter" font-weight="900" font-size="44" fill="#fff">ÚLTIMA HORA: ${p.headline || ''}</text><rect x="-340" y="-220" width="200" height="60" fill="#e5484d"/><text x="-240" y="-178" text-anchor="middle" font-family="Inter" font-weight="900" font-size="36" fill="#fff" opacity="${(0.5 + 0.5 * Math.sin(c.t * 6)).toFixed(2)}">EN VIVO</text>`;
  A.heli = (p, c) => { const r = Math.sin(c.t * 60) * 160; return `<rect x="-140" y="-50" width="240" height="110" rx="55" fill="#3a3f4a"/><rect x="-60" y="-40" width="110" height="60" rx="20" fill="#bfe0f0"/><rect x="90" y="-10" width="220" height="24" rx="10" fill="#3a3f4a"/><path d="M${-r} -80 L${r} -80" stroke="#1d1d24" stroke-width="12"/><rect x="-6" y="-80" width="12" height="30" fill="#1d1d24"/><path d="M-100 60 v30 h180 v-30" stroke="#1d1d24" stroke-width="10" fill="none"/>`; };
  A.earthCut = (p, c) => {
    const R = 420, g = 0.6 + 0.4 * Math.sin(c.t * 2);
    let s = `<defs><radialGradient id="coreG"><stop offset="0" stop-color="#fff6c8"/><stop offset="0.5" stop-color="#ffb04a"/><stop offset="1" stop-color="#ff6a2f"/></radialGradient></defs>`;
    s += `<circle r="${R}" fill="#3f86b0"/><path d="M0 0 L0 ${-R} A${R} ${R} 0 0 1 ${R} 0Z" fill="#000" opacity="0"/>`;
    s += `<path d="M0 0 L${R} 0 A${R} ${R} 0 0 0 0 ${-R}Z" fill="#7a5a3a"/><path d="M0 0 L${R * 0.97} 0 A${R * 0.97} ${R * 0.97} 0 0 0 0 ${-R * 0.97}Z" fill="#e5643a"/><path d="M0 0 L${R * 0.55} 0 A${R * 0.55} ${R * 0.55} 0 0 0 0 ${-R * 0.55}Z" fill="#ffb04a"/>`;
    s += `<circle r="${R * 0.2}" fill="url(#coreG)"/><circle r="${R * 0.32}" fill="#fff3b0" opacity="${(0.25 * g).toFixed(2)}"/>`;
    s += `<path d="M-300 -180 q60 -40 120 -10 M-200 120 q80 -30 140 20 M100 220 q60 -30 120 10" stroke="#5fa84a" stroke-width="40" fill="none" stroke-linecap="round"/>`;
    if (p.marker) s += `<g transform="translate(${(R * 0.7).toFixed(0)},${(-R * 0.712).toFixed(0)})"><circle r="9" fill="#e5484d"/><path d="M0 -12 V-90" stroke="#e5484d" stroke-width="6"/><rect x="-60" y="-150" width="120" height="60" rx="14" fill="#e5484d"/><text y="-108" text-anchor="middle" font-family="Inter" font-weight="900" font-size="36" fill="#fff">TÚ</text></g>`;
    return s;
  };
  A.trophy = () => `<path d="M-90 -200 h180 v60 q0 110 -90 130 q-90 -20 -90 -130Z" fill="#ffd84a"/><path d="M-90 -170 q-70 0 -60 60 q10 40 60 40 M90 -170 q70 0 60 60 q-10 40 -60 40" stroke="#ffd84a" stroke-width="18" fill="none"/><rect x="-20" y="-10" width="40" height="60" fill="#e8b828"/><rect x="-80" y="50" width="160" height="40" rx="10" fill="#c99a1a"/>`;
})();
