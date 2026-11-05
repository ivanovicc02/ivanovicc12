// Biblioteca 2D: tema ARENAS MOVEDIZAS (playa, poza, corte del suelo, película, densidad, coche, marea).
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp, lerp, ease } = window.SH;
  const W = 1080, H = 1920;

  B.beach = (t) => {
    let s = `<defs><linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2a63"/><stop offset="0.5" stop-color="#b9607a"/><stop offset="1" stop-color="#f6b36f"/></linearGradient>
      <linearGradient id="bsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f86b0"/><stop offset="1" stop-color="#2a6a94"/></linearGradient>
      <linearGradient id="bsand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d9a6"/><stop offset="1" stop-color="#d9b77a"/></linearGradient></defs>`;
    s += `<rect x="-800" y="-800" width="${W + 1600}" height="1850" fill="url(#bsky)"/>`;
    s += `<circle cx="260" cy="820" r="120" fill="#ffd9a0" opacity="0.9"/>`;
    s += `<rect x="-800" y="1000" width="${W + 1600}" height="180" fill="url(#bsea)"/>`;
    for (let i = 0; i < 6; i++) { const y = 1030 + i * 26, ph = (t || 0) * 1.5 + i; s += `<path d="M-800 ${y} ${[...Array(30)].map((_, k) => `q40 ${Math.sin(ph + k) * 6} 80 0`).join(' ')}" stroke="#bfe8ff" stroke-width="3" fill="none" opacity="0.35"/>`; }
    s += `<path d="M-800 1180 Q-300 1150 200 1185 T1200 1175 T2000 1180 V2800 H-800Z" fill="url(#bsand)"/>`;
    const r = rng(31);
    for (let i = 0; i < 160; i++) s += `<circle cx="${(r() * 2600 - 800).toFixed(0)}" cy="${(1200 + r() * 1300).toFixed(0)}" r="${(1.5 + r() * 3).toFixed(1)}" fill="#c9a466" opacity="0.6"/>`;
    s += `<g transform="translate(930,1260)"><path d="M0 0 V-230" stroke="#7a4a22" stroke-width="9"/><path d="M4 -230 L120 -195 L4 -160Z" fill="#e5484d"/></g>`;
    return s;
  };

  // poza de arena movediza: se dibuja DESPUÉS del personaje para tapar lo hundido
  A.pitTop = function (p, c) { // superficie (ondas), en (0,0) = centro de la poza
    const w = p.w || 520, wob = Math.sin(c.t * 2) * 4;
    let s = `<ellipse rx="${w}" ry="${w * 0.24}" fill="#8a6a3e"/><ellipse rx="${w * 0.92}" ry="${w * 0.2}" fill="#9c7a48"/>`;
    for (let i = 1; i <= 3; i++) { const u = ((c.t * 0.4 + i / 3) % 1); s += `<ellipse rx="${(w * 0.25 + u * w * 0.6).toFixed(0)}" ry="${(w * 0.06 + u * w * 0.14 + wob * 0.2).toFixed(1)}" fill="none" stroke="#c9a466" stroke-width="5" opacity="${(0.7 * (1 - u)).toFixed(2)}"/>`; }
    s += `<ellipse cx="${-w * 0.4}" cy="${-w * 0.08}" rx="${w * 0.18}" ry="${w * 0.03}" fill="#fff" opacity="0.25"/>`;
    return s;
  };
  // tapa frontal: cubre todo lo que está por debajo de la superficie (en la mitad delantera de la poza)
  A.pitFront = function (p) {
    const w = p.w || 520;
    return `<path d="M${-w} 0 A${w} ${w * 0.24} 0 0 0 ${w} 0 L${w + 600} 0 V1400 H${-w - 600} V0Z" fill="#e2c48a"/><path d="M${-w} 0 A${w} ${w * 0.24} 0 0 0 ${w} 0" fill="#8a6a3e"/><path d="M${-w * 0.92} 0 A${w * 0.92} ${w * 0.2} 0 0 0 ${w * 0.92} 0" fill="#9c7a48"/>`;
  };

  // corte del subsuelo con piernas moviéndose en círculo
  A.crossSection = function (p, c) {
    const wet = clamp(p.wet ?? 0, 0, 1);
    let s = `<rect x="-480" y="0" width="960" height="900" rx="40" fill="#b89058"/>`;
    const r = rng(8);
    for (let i = 0; i < 90; i++) s += `<circle cx="${(r() * 900 - 450).toFixed(0)}" cy="${(r() * 860 + 20).toFixed(0)}" r="${(4 + r() * 9).toFixed(0)}" fill="#9c7a48" opacity="0.7"/>`;
    // zona húmeda alrededor de las piernas
    s += `<ellipse cx="0" cy="380" rx="${(120 + wet * 230).toFixed(0)}" ry="${(200 + wet * 220).toFixed(0)}" fill="#6fa8c8" opacity="${(0.25 + wet * 0.35).toFixed(2)}"/>`;
    [-1, 1].forEach((k) => {
      const a = c.t * 2.4 + (k > 0 ? Math.PI : 0);
      const fx = k * 60 + Math.cos(a) * 45, fy = 640 + Math.sin(a) * 30;
      s += `<path d="M${k * 40} 0 Q${k * 50} 320 ${fx.toFixed(0)} ${fy.toFixed(0)}" stroke="#2f4f8a" stroke-width="70" fill="none" stroke-linecap="round"/>`;
      s += `<ellipse cx="${(fx + k * 18).toFixed(0)}" cy="${(fy + 30).toFixed(0)}" rx="52" ry="26" fill="#3b2a20"/>`;
      s += `<ellipse cx="${(k * 60).toFixed(0)}" cy="640" rx="80" ry="50" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 12" opacity="0.7"/>`;
    });
    // gotas de agua entrando
    for (let i = 0; i < 10; i++) { const u = ((c.t * 0.7 + i / 10) % 1); const x = -300 + (i % 5) * 150, y = 60 + u * 420; s += `<path d="M${x} ${y.toFixed(0)} q-12 22 0 30 q12 -8 0 -30" fill="#7fd0ff" opacity="${(wet * (1 - u)).toFixed(2)}"/>`; }
    s += `<rect x="-480" y="-40" width="960" height="60" fill="#d9b77a"/>`;
    return s;
  };

  // barras de densidad: tu cuerpo 1x vs arena 2x
  A.density = function (p, c) {
    const k1 = ease.out(clamp(c.lt / 0.6, 0, 1)), k2 = ease.out(clamp((c.lt - 0.4) / 0.8, 0, 1));
    let s = '';
    s += `<rect x="-330" y="${-260 * k1}" width="240" height="${260 * k1}" rx="20" fill="#5b7cff"/>`;
    s += `<rect x="90" y="${-520 * k2}" width="240" height="${520 * k2}" rx="20" fill="#b07a3e"/>`;
    s += `<text x="-210" y="${-260 * k1 - 30}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="72" fill="#fff">1×</text>`;
    s += `<text x="210" y="${-520 * k2 - 30}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="72" fill="#fff">2×</text>`;
    s += `<text x="-210" y="70" text-anchor="middle" font-family="Inter" font-weight="800" font-size="40" fill="#fff">TU CUERPO</text>`;
    s += `<text x="210" y="70" text-anchor="middle" font-family="Inter" font-weight="800" font-size="40" fill="#fff">ARENA</text>`;
    s += `<rect x="-420" y="0" width="840" height="8" rx="4" fill="#fff" opacity="0.6"/>`;
    return s;
  };

  A.carSide = function (p) {
    return `<ellipse cx="0" cy="6" rx="300" ry="22" fill="#000" opacity="0.2"/><path d="M-290 -60 Q-290 -120 -230 -130 L-140 -140 L-70 -230 L140 -230 L220 -140 L270 -130 Q300 -120 300 -70 L300 -40 L-290 -40Z" fill="#e5484d"/>
      <path d="M-50 -215 L130 -215 L195 -145 L-110 -145Z" fill="#bfe3ff"/><path d="M45 -215 V-145" stroke="#e5484d" stroke-width="12"/>
      ${[-170, 180].map((x) => `<circle cx="${x}" cy="-30" r="62" fill="#1b1b1f"/><circle cx="${x}" cy="-30" r="28" fill="#c9ccd1"/>`).join('')}
      <rect x="265" y="-110" width="30" height="22" rx="6" fill="#fff3c4"/>`;
  };

  // mar que avanza (marea): nivel de 0 a 1 tapa la playa desde arriba
  A.tide = function (p, c) {
    const lvl = clamp(p.level ?? 0, 0, 1);
    const y = 1180 + lvl * 520;
    let d = `M-800 1000 V${y}`;
    for (let x = -800; x <= 2000; x += 80) d += ` L${x} ${(y + Math.sin(c.t * 2.5 + x * 0.02) * 14).toFixed(1)}`;
    d += ' V1000Z';
    return `<path d="${d}" fill="#3f86b0" opacity="0.92"/><path d="${d.replace('V1000Z', '')}" stroke="#e8f8ff" stroke-width="10" fill="none" opacity="0.8"/>`;
  };

  // marco de película antigua (encima de todo, en coordenadas de pantalla)
  A.filmFrame = function (p, c) {
    let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#000" stroke-width="140"/>`;
    for (let y = -40 + ((c.t * 300) % 120); y < H; y += 120) s += `<rect x="18" y="${y.toFixed(0)}" width="34" height="56" rx="8" fill="#fff" opacity="0.85"/><rect x="${W - 52}" y="${y.toFixed(0)}" width="34" height="56" rx="8" fill="#fff" opacity="0.85"/>`;
    const r = rng(Math.floor(c.t * 12));
    for (let i = 0; i < 6; i++) s += `<rect x="${(100 + r() * 880).toFixed(0)}" y="0" width="2" height="${H}" fill="#fff" opacity="${(r() * 0.25).toFixed(2)}"/>`;
    return s;
  };

  A.arrowUp = function (p, c) {
    const b = Math.sin(c.t * 6) * 10;
    return `<g transform="translate(0,${b.toFixed(1)})"><path d="M0 -120 L70 -30 H28 V80 H-28 V-30 H-70Z" fill="${p.color || '#2bb673'}" stroke="#fff" stroke-width="8"/></g>`;
  };
})();
