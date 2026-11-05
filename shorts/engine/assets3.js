// Biblioteca 2D: tema APAGÓN (ciudad, cocina, refrigerador, agua, celular, cajero,
// enchufes, generador, anafre, monóxido) + utilidades de oscuridad y linterna.
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp, lerp, ease, esc } = window.SH;
  const shade = A._shade;
  const W = 1080, H = 1920;

  // ---------- fondos ----------
  B.night = () => {
    let s = `<defs><linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a1c"/><stop offset="0.6" stop-color="#15183a"/><stop offset="1" stop-color="#2a2550"/></linearGradient></defs>`;
    s += `<rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" fill="url(#nsky)"/>`;
    const r = rng(77);
    for (let i = 0; i < 160; i++) s += `<circle cx="${(r() * (W + 1000) - 500).toFixed(0)}" cy="${(r() * 1300 - 300).toFixed(0)}" r="${(0.8 + r() * 2.2).toFixed(1)}" fill="#fff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
    s += `<circle cx="820" cy="330" r="74" fill="#f4efd6"/><circle cx="790" cy="310" r="74" fill="#15183a" opacity="0.0"/><circle cx="800" cy="320" r="12" fill="#e2dcbf"/><circle cx="845" cy="355" r="9" fill="#e2dcbf"/>`;
    return s;
  };
  B.kitchen = () => {
    let s = `<rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" fill="#3d4a66"/>`;
    for (let y = 700; y < 1120; y += 70) for (let x = -800 + ((y / 70) % 2) * 35; x < W + 800; x += 70) s += `<rect x="${x + 3}" y="${y + 3}" width="64" height="64" rx="6" fill="#4a5878"/>`;
    s += `<rect x="-800" y="1120" width="${W + 1600}" height="90" fill="#7a5a3e"/><rect x="-800" y="1210" width="${W + 1600}" height="520" fill="#5e4430"/>`;
    for (let x = -760; x < W + 800; x += 260) s += `<rect x="${x}" y="1240" width="230" height="460" rx="12" fill="#6e5038"/><rect x="${x + 100}" y="1290" width="30" height="10" rx="5" fill="#c9b08a"/>`;
    s += `<rect x="-800" y="1730" width="${W + 1600}" height="1200" fill="#2e3448"/>`;
    s += `<g transform="translate(250,420)"><rect x="-170" y="-150" width="340" height="280" fill="#1a1f3d"/><circle cx="70" cy="-60" r="40" fill="#f4efd6"/><rect x="-170" y="-150" width="340" height="280" fill="none" stroke="#2a3048" stroke-width="20"/><path d="M0 -150 V130 M-170 -10 H170" stroke="#2a3048" stroke-width="12"/></g>`;
    return s;
  };
  B.room = () => {
    let s = `<rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" fill="#5a4a6a"/>`;
    for (let x = -800; x < W + 800; x += 90) s += `<rect x="${x}" y="-800" width="45" height="2280" fill="#55456a"/>`;
    s += `<rect x="-800" y="1480" width="${W + 1600}" height="1400" fill="#6b4f3a"/>`;
    for (let x = -800; x < W + 800; x += 140) s += `<rect x="${x}" y="1480" width="6" height="1400" fill="#5a412f"/>`;
    s += `<rect x="-800" y="1460" width="${W + 1600}" height="30" fill="#4a3a52"/>`;
    s += `<g transform="translate(800,520)"><rect x="-150" y="-180" width="300" height="320" fill="#1a1f3d"/><rect x="-150" y="-180" width="300" height="320" fill="none" stroke="#3a2e44" stroke-width="18"/><path d="M0 -180 V140 M-150 -20 H150" stroke="#3a2e44" stroke-width="10"/></g>`;
    s += `<g transform="translate(200,560)"><rect x="-110" y="-140" width="220" height="190" fill="#c9a86a"/><rect x="-96" y="-126" width="192" height="162" fill="#6b8fb0"/><path d="M-96 36 L-30 -40 L20 10 L50 -20 L96 36Z" fill="#4a7a4a"/></g>`;
    return s;
  };

  // ---------- oscuridad con luz de linterna ----------
  // p: {amount 0..1, beams: [[x, y, angleDeg, len]]} en coordenadas del mundo
  A.darkness = function (p) {
    const a = p.amount ?? 0.6;
    let s = `<rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" fill="#03050f" opacity="${a.toFixed(2)}"/>`;
    (p.beams || []).forEach(([x, y, ang, len], i) => {
      const L = len || 700;
      s += `<defs><radialGradient id="beam${i}" cx="0" cy="0.5" r="1" fx="0" fy="0.5"><stop offset="0" stop-color="#fff3b8" stop-opacity="0.55"/><stop offset="1" stop-color="#fff3b8" stop-opacity="0"/></radialGradient></defs>`;
      s += `<g transform="translate(${x},${y}) rotate(${ang})"><path d="M0 -10 L${L} ${-L * 0.32} L${L} ${L * 0.32} L0 10Z" fill="url(#beam${i})" style="mix-blend-mode:screen"/></g>`;
    });
    return s;
  };

  // ---------- ciudad que se apaga ----------
  A.city = function (p, c) {
    const r = rng(23);
    const lit = p.lit ?? 1; // 1 = todo encendido, 0 = apagado (se apaga de izquierda a derecha)
    let s = '';
    const blds = [];
    for (let x = -700; x < 1800; x += 130 + r() * 90) blds.push([x, 380 + r() * 760, 110 + r() * 80, r()]);
    blds.forEach(([x, h, w, k], bi) => {
      const col = ['#232a4a', '#2a3156', '#1e2442'][bi % 3];
      s += `<rect x="${x}" y="${1500 - h}" width="${w}" height="${h + 600}" fill="${col}"/>`;
      if (k > 0.6) s += `<rect x="${x + w / 2 - 3}" y="${1500 - h - 70}" width="6" height="70" fill="${col}"/><circle cx="${x + w / 2}" cy="${1500 - h - 74}" r="7" fill="${lit > 0.5 ? '#ff4d55' : '#3a2030'}"/>`;
      const on = clamp((lit * 2600 - (x + 700)) / 300, 0, 1);
      for (let wy = 1500 - h + 30; wy < 1480; wy += 56) for (let wx = x + 16; wx < x + w - 26; wx += 38) {
        const isOn = r() < 0.65 && on > r();
        s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="22" height="30" rx="3" fill="${isOn ? '#ffd76e' : '#151a33'}" opacity="${isOn ? 0.95 : 1}"/>`;
      }
    });
    // postes y cables
    for (let x = -300; x < 1600; x += 520) s += `<rect x="${x}" y="1180" width="18" height="520" fill="#141828"/><rect x="${x - 50}" y="1200" width="118" height="12" fill="#141828"/>`;
    s += `<path d="M-300 1206 Q-40 1300 220 1206 T740 1206 T1260 1206" stroke="#141828" stroke-width="5" fill="none"/>`;
    s += `<rect x="-800" y="1500" width="3000" height="1200" fill="#151a2c"/>`;
    for (let x = -700; x < 1800; x += 150) s += `<rect x="${x}" y="1640" width="80" height="12" fill="#2a3048"/>`;
    return s;
  };

  // ---------- refrigerador ----------
  A.fridge = function (p, c) {
    const open = clamp(p.open ?? 0, 0, 1);
    let s = `<ellipse cx="0" cy="8" rx="230" ry="22" fill="#000" opacity="0.25"/>`;
    s += `<rect x="-200" y="-900" width="400" height="900" rx="40" fill="#dfe6ee"/>`;
    // interior (visible al abrir)
    s += `<rect x="-180" y="-560" width="360" height="530" rx="20" fill="#2a3448"/>`;
    for (let i = 0; i < 3; i++) s += `<rect x="-170" y="${-450 + i * 150}" width="340" height="10" fill="#4a5672"/>`;
    s += `<rect x="-140" y="-520" width="70" height="66" rx="10" fill="#e5484d"/><rect x="-40" y="-540" width="50" height="86" rx="12" fill="#f6f6f6"/><circle cx="90" cy="-480" r="34" fill="#8bd16a"/>`;
    s += `<rect x="-120" y="-370" width="120" height="76" rx="14" fill="#f2c230"/><rect x="40" y="-380" width="80" height="86" rx="10" fill="#5b7cff"/>`;
    // puerta de abajo: se abre girando (encoge en X)
    const dw = 400 * (1 - open * 0.82);
    s += `<rect x="-200" y="-575" width="${dw.toFixed(1)}" height="575" rx="36" fill="#eef3f8" stroke="#c9d2dd" stroke-width="5"/>`;
    s += `<rect x="${(-200 + dw - 40).toFixed(1)}" y="-500" width="16" height="170" rx="8" fill="#b9c3cf"/>`;
    // congelador arriba
    s += `<rect x="-200" y="-900" width="400" height="315" rx="36" fill="#eef3f8" stroke="#c9d2dd" stroke-width="5"/><rect x="150" y="-820" width="16" height="130" rx="8" fill="#b9c3cf"/>`;
    s += `<path d="M-30 -770 l60 0 M0 -800 l0 60 M-22 -792 l44 44 M22 -792 l-44 44" stroke="#7fc8ff" stroke-width="9" stroke-linecap="round"/>`;
    // vaho frío que escapa
    if (open > 0.05) for (let i = 0; i < 7; i++) {
      const u = ((c.t * 0.6 + i / 7) % 1);
      s += `<ellipse cx="${(160 + u * 260).toFixed(0)}" cy="${(-300 - i * 40 + u * 60).toFixed(0)}" rx="${(40 + u * 70).toFixed(0)}" ry="${(24 + u * 30).toFixed(0)}" fill="#bfe8ff" opacity="${((1 - u) * 0.45 * open).toFixed(2)}"/>`;
    }
    return s;
  };

  // ---------- agua: edificio con bomba, grifo, tina, olla ----------
  A.waterBuilding = function (p, c) {
    const lvl = clamp(p.level ?? 1, 0, 1);
    let s = `<rect x="-220" y="-900" width="440" height="900" fill="#c97b5a"/>`;
    for (let y = -840; y < -60; y += 130) for (let x = -170; x < 180; x += 120) s += `<rect x="${x}" y="${y}" width="70" height="80" rx="6" fill="${p.dark ? '#1b2038' : '#ffe08a'}"/>`;
    s += `<rect x="-120" y="-1100" width="240" height="190" rx="20" fill="#9fb3c8"/><rect x="-120" y="${-910 - 190 * lvl}" width="240" height="${190 * lvl}" rx="18" fill="#3aa0e8" opacity="0.9"/>`;
    s += `<rect x="-120" y="-1100" width="240" height="190" rx="20" fill="none" stroke="#6e8299" stroke-width="10"/>`;
    s += `<path d="M150 0 V-1000 H120" stroke="#7d8a99" stroke-width="22" fill="none"/>`;
    s += `<g transform="translate(150,-60)"><rect x="-60" y="-50" width="120" height="100" rx="14" fill="#5b6575"/><circle r="30" fill="#3b4250"/><path d="M6 -22 L-12 4 H2 L-6 24 L14 -4 H0Z" fill="${p.dark ? '#555' : '#ffd76e'}"/></g>`;
    return s;
  };
  A.bathtub = function (p) {
    const l = clamp(p.level ?? 0, 0, 1);
    return `<rect x="-280" y="-200" width="560" height="200" rx="80" fill="#f2f4f7"/><rect x="-250" y="${-30 - 140 * l}" width="500" height="${140 * l + 10}" rx="40" fill="#5bb8f0" opacity="0.85"/>
      <rect x="-280" y="-200" width="560" height="40" rx="20" fill="#e2e6ec"/><rect x="-230" y="0" width="30" height="40" rx="10" fill="#c9ced6"/><rect x="200" y="0" width="30" height="40" rx="10" fill="#c9ced6"/>
      <path d="M220 -200 V-290 Q220 -330 180 -330 H140" stroke="#b9c3cf" stroke-width="20" fill="none" stroke-linecap="round"/>
      ${l < 0.99 ? `<rect x="130" y="-320" width="18" height="${(290 - 140 * l).toFixed(0)}" fill="#7fd0ff" opacity="0.8"/>` : ''}`;
  };
  A.pot = function (p) {
    const l = clamp(p.level ?? 0, 0, 1);
    return `<path d="M-130 -150 L130 -150 L110 0 L-110 0Z" fill="#9aa3ad"/><rect x="-118" y="${-140 + 120 * (1 - l)}" width="236" height="${120 * l}" fill="#5bb8f0" opacity="0.9"/><rect x="-150" y="-170" width="300" height="30" rx="10" fill="#b9c3cf"/><rect x="-200" y="-150" width="60" height="18" rx="9" fill="#7d8a99"/><rect x="140" y="-150" width="60" height="18" rx="9" fill="#7d8a99"/>`;
  };

  // ---------- celular grande con interfaz ----------
  // p: {battery 0..100, saver bool, bright 0..1, msg bool, callX bool}
  A.phone = function (p, c) {
    const b = Math.round(p.battery ?? 15);
    const bc = b < 20 ? '#e5484d' : '#2bb673';
    let s = `<rect x="-230" y="-460" width="460" height="920" rx="60" fill="#16161c"/><rect x="-205" y="-430" width="410" height="860" rx="40" fill="#1f2433"/>`;
    s += `<rect x="-60" y="-420" width="120" height="26" rx="13" fill="#000"/>`;
    s += `<g transform="translate(0,-320)"><rect x="-90" y="-40" width="160" height="80" rx="16" fill="none" stroke="#fff" stroke-width="8"/><rect x="74" y="-16" width="14" height="32" rx="4" fill="#fff"/><rect x="-80" y="-30" width="${(140 * b / 100).toFixed(0)}" height="60" rx="8" fill="${bc}"/><text x="0" y="100" text-anchor="middle" font-family="Inter" font-weight="900" font-size="64" fill="#fff">${b}%</text></g>`;
    // interruptor ahorro
    const on = p.saver ? 1 : 0;
    s += `<g transform="translate(0,-90)"><text x="-170" y="14" font-family="Inter" font-weight="700" font-size="36" fill="#cfd6e6">Ahorro</text><rect x="70" y="-30" width="120" height="60" rx="30" fill="${on ? '#2bb673' : '#4a5168'}"/><circle cx="${on ? 160 : 100}" cy="0" r="24" fill="#fff"/></g>`;
    // brillo
    const br = p.bright ?? 1;
    s += `<g transform="translate(0,20)"><text x="-170" y="14" font-family="Inter" font-weight="700" font-size="36" fill="#cfd6e6">Brillo</text><rect x="-30" y="-6" width="220" height="12" rx="6" fill="#4a5168"/><rect x="-30" y="-6" width="${(220 * br).toFixed(0)}" height="12" rx="6" fill="#ffd76e"/><circle cx="${(-30 + 220 * br).toFixed(0)}" cy="0" r="20" fill="#fff"/></g>`;
    if (p.msg) s += `<g transform="translate(20,190)"><rect x="-170" y="-50" width="330" height="100" rx="34" fill="#5b7cff"/><path d="M140 40 l30 20 l-10 -34z" fill="#5b7cff"/><text x="-5" y="12" text-anchor="middle" font-family="Inter" font-weight="800" font-size="36" fill="#fff">Estoy bien :)</text></g>`;
    if (p.callX) s += `<g transform="translate(0,340)"><circle r="56" fill="#e5484d"/><path d="M-26 8 q26 -26 52 0" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M-60 -60 L60 60" stroke="#fff" stroke-width="10" stroke-linecap="round"/></g>`;
    if ((p.dim ?? 0) > 0) s += `<rect x="-205" y="-430" width="410" height="860" rx="40" fill="#000" opacity="${(p.dim * 0.5).toFixed(2)}"/>`;
    return s;
  };

  // ---------- cajero y terminal ----------
  A.atm = function (p) {
    let s = `<rect x="-220" y="-720" width="440" height="720" rx="24" fill="#5e6b80"/><rect x="-190" y="-690" width="380" height="80" rx="12" fill="#2f6fb0"/><text y="-635" text-anchor="middle" font-family="Inter" font-weight="900" font-size="44" fill="#fff">CAJERO</text>`;
    s += `<rect x="-160" y="-570" width="320" height="230" rx="14" fill="#0d1020"/>`;
    s += `<text y="-470" text-anchor="middle" font-family="Inter" font-weight="900" font-size="38" fill="#e5484d">FUERA DE</text><text y="-420" text-anchor="middle" font-family="Inter" font-weight="900" font-size="38" fill="#e5484d">SERVICIO</text>`;
    s += `<rect x="-140" y="-300" width="280" height="22" rx="8" fill="#2a3044"/><rect x="-110" y="-240" width="220" height="150" rx="10" fill="#4a5568"/>`;
    for (let i = 0; i < 12; i++) s += `<rect x="${-95 + (i % 3) * 70}" y="${-228 + Math.floor(i / 3) * 34}" width="56" height="26" rx="6" fill="#8a94a6"/>`;
    return s;
  };
  A.terminal = function () {
    return `<rect x="-110" y="-300" width="220" height="300" rx="30" fill="#2a2f3e"/><rect x="-80" y="-270" width="160" height="90" rx="10" fill="#0d1020"/><text y="-212" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="#e5484d">ERROR</text>${[...Array(9)].map((_, i) => `<rect x="${-70 + (i % 3) * 50}" y="${-160 + Math.floor(i / 3) * 44}" width="40" height="34" rx="6" fill="#4a5168"/>`).join('')}`;
  };

  // ---------- enchufe, tele, chispa ----------
  A.outlet = function (p, c) {
    const u = p.unplug || [0, 0];
    let s = `<rect x="-160" y="-220" width="320" height="440" rx="34" fill="#f2f2ee" stroke="#c9c9c2" stroke-width="6"/>`;
    [-100, 100].forEach((y, i) => {
      s += `<g transform="translate(0,${y})"><rect x="-80" y="-70" width="160" height="140" rx="40" fill="#e3e3dc"/><rect x="-40" y="-30" width="16" height="44" rx="6" fill="#3a3a40"/><rect x="24" y="-30" width="16" height="44" rx="6" fill="#3a3a40"/></g>`;
      const off = (u[i] || 0) * 320;
      const col = ['#2a2a30', '#e5e5e0'][i];
      s += `<g transform="translate(${off.toFixed(0)},${y})"><rect x="-56" y="-60" width="112" height="120" rx="24" fill="${col}" stroke="#555" stroke-width="4"/><path d="M56 0 C200 0 220 ${i ? 160 : -160} 600 ${i ? 260 : -200}" stroke="${col}" stroke-width="22" fill="none"/></g>`;
    });
    if (p.spark) {
      const k = p.spark;
      for (let i = 0; i < 10; i++) { const a = i * 0.63; s += `<path d="M0 0 L${(Math.cos(a) * 200 * k).toFixed(0)} ${(Math.sin(a) * 200 * k).toFixed(0)}" stroke="#ffe066" stroke-width="10" stroke-linecap="round" opacity="${(1 - k).toFixed(2)}"/>`; }
      s += `<circle r="${(60 + 80 * k).toFixed(0)}" fill="#fff6c8" opacity="${(0.8 * (1 - k)).toFixed(2)}"/>`;
    }
    return s;
  };
  A.tv = function (p, c) {
    let s = `<rect x="-300" y="-380" width="600" height="360" rx="20" fill="#16161c"/><rect x="-280" y="-360" width="560" height="320" rx="10" fill="${p.on ? '#3a6fb0' : '#0b0d14'}"/>`;
    s += `<rect x="-20" y="-20" width="40" height="60" fill="#16161c"/><rect x="-140" y="36" width="280" height="20" rx="10" fill="#16161c"/>`;
    if (p.burnt) {
      s += `<path d="M-280 -360 L-120 -200 L-200 -120 L-40 -60" stroke="#e5e5e0" stroke-width="5" fill="none" opacity="0.6"/>`;
      for (let i = 0; i < 6; i++) { const u = ((c.t * 0.5 + i / 6) % 1); s += `<circle cx="${(-60 + Math.sin(i * 2 + c.t) * 40).toFixed(0)}" cy="${(-400 - u * 360).toFixed(0)}" r="${(40 + u * 60).toFixed(0)}" fill="#55555c" opacity="${((1 - u) * 0.6).toFixed(2)}"/>`; }
    }
    return s;
  };

  // ---------- generador, anafre, monóxido ----------
  A.generator = function (p, c) {
    const vib = Math.sin(c.t * 50) * 2;
    let s = `<g transform="translate(${vib.toFixed(1)},0)"><rect x="-200" y="-260" width="400" height="230" rx="24" fill="#f2c230"/><rect x="-170" y="-230" width="200" height="170" rx="14" fill="#2a2a30"/><rect x="60" y="-220" width="110" height="60" rx="10" fill="#e5484d"/><rect x="-200" y="-40" width="400" height="30" rx="10" fill="#3a3a40"/><circle cx="-150" cy="-10" r="34" fill="#16161c"/><circle cx="150" cy="-10" r="34" fill="#16161c"/>`;
    s += `<rect x="170" y="-300" width="40" height="70" rx="10" fill="#7d838c"/></g>`;
    for (let i = 0; i < 5; i++) { const u = ((c.t * 0.7 + i / 5) % 1); s += `<circle cx="${(200 + u * 120).toFixed(0)}" cy="${(-320 - u * 260).toFixed(0)}" r="${(26 + u * 50).toFixed(0)}" fill="#8a8a92" opacity="${((1 - u) * 0.5).toFixed(2)}"/>`; }
    return s;
  };
  A.brazier = function (p, c) {
    let s = `<path d="M-150 -170 L150 -170 L110 0 L-110 0Z" fill="#3a3a40"/><rect x="-170" y="-190" width="340" height="30" rx="10" fill="#55555c"/>`;
    for (let i = 0; i < 9; i++) s += `<circle cx="${-110 + i * 28}" cy="${-196 + (i % 2) * 8}" r="22" fill="${['#ff7a2f', '#e5484d', '#ffb04a'][i % 3]}"/>`;
    for (let i = 0; i < 4; i++) { const f = Math.sin(c.t * 9 + i) * 10; s += `<path d="M${-70 + i * 46} -200 q${-20 + f} -60 0 ${-100 - Math.abs(f) * 2} q${25 + f} 60 0 ${100 + Math.abs(f) * 2}" fill="#ffb04a" opacity="0.85"/>`; }
    s += `<rect x="-100" y="0" width="16" height="60" fill="#3a3a40"/><rect x="84" y="0" width="16" height="60" fill="#3a3a40"/>`;
    return s;
  };
  A.coCloud = function (p, c) {
    const k = clamp(p.amount ?? 1, 0, 1);
    let s = '';
    const r = rng(19);
    for (let i = 0; i < 18; i++) {
      const x = -500 + r() * 1000 + Math.sin(c.t * 0.6 + i) * 40, y = -200 - r() * 900;
      s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(120 + r() * 160) * k}" ry="${(70 + r() * 80) * k}" fill="#9aa0b4" opacity="${(0.22 * k).toFixed(2)}"/>`;
    }
    if (k > 0.5) for (let i = 0; i < 4; i++) s += `<text x="${-300 + i * 200}" y="${-500 - (i % 2) * 220 + Math.sin(c.t + i) * 20}" font-family="Inter" font-weight="900" font-size="64" fill="#c9cbd6" opacity="${((k - 0.5) * 1.2).toFixed(2)}">CO</text>`;
    return s;
  };
  A.couch = function () {
    return `<rect x="-330" y="-260" width="660" height="180" rx="50" fill="#7a5aa0"/><rect x="-360" y="-150" width="720" height="130" rx="40" fill="#8a6ab0"/><rect x="-380" y="-220" width="90" height="200" rx="40" fill="#6a4a90"/><rect x="290" y="-220" width="90" height="200" rx="40" fill="#6a4a90"/><rect x="-320" y="-20" width="30" height="30" fill="#3a2e44"/><rect x="290" y="-20" width="30" height="30" fill="#3a2e44"/>`;
  };
  A.candle = function (p, c) {
    const f = Math.sin(c.t * 12) * 3;
    return `<circle cy="-150" r="${90 + f * 3}" fill="#ffd76e" opacity="0.15"/><rect x="-22" y="-120" width="44" height="120" rx="8" fill="#f6efe0"/><path d="M0 -122 q-14 -24 0 ${-54 + f} q14 30 0 ${54 - f}" fill="#ffb04a"/><path d="M0 -122 q-6 -12 0 -26 q6 14 0 26" fill="#fff3b8"/>`;
  };
  A.zzz = function (p, c) {
    let s = '';
    for (let i = 0; i < 3; i++) { const u = ((c.t * 0.5 + i / 3) % 1); s += `<text x="${(u * 60).toFixed(0)}" y="${(-u * 160).toFixed(0)}" font-family="Inter" font-weight="900" font-size="${(36 + u * 30).toFixed(0)}" fill="#fff" opacity="${(1 - u).toFixed(2)}">z</text>`; }
    return s;
  };
})();
