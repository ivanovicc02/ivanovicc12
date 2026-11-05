// Biblioteca de personajes y objetos (SVG plano estilo ilustración).
// Cada asset es ASSETS[tipo] = (params, {t, lt, dur, u}) => string SVG,
// dibujado con el origen en los PIES del personaje (y = 0 es el suelo).
// Para un tema nuevo se añaden aquí (o en assets_extra.js del proyecto).

(function () {
  const A = (window.ASSETS = window.ASSETS || {});
  const { rng, clamp, ease, esc } = window.SH;

  function shade(hex, k) {
    // k < 0 oscurece, k > 0 aclara
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
    return '#' + [f(r), f(g), f(b)].map((c) => clamp(c, 0, 255).toString(16).padStart(2, '0')).join('');
  }
  A._shade = shade;

  function fur(seed, cx, cy, rx, ry, color, n) {
    const r = rng(seed);
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, rr = Math.sqrt(r());
      const x = cx + Math.cos(a) * rx * rr * 0.92, y = cy + Math.sin(a) * ry * rr * 0.92;
      d += `M${x.toFixed(0)} ${y.toFixed(0)}l${(-4 + r() * 8).toFixed(1)} ${(6 + r() * 8).toFixed(1)}`;
    }
    return `<path d="${d}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`;
  }

  const BEAR_COLORS = { grizzly: '#8a5a33', black: '#24211f', brown: '#6b4428', polar: '#efe9dc', panda: '#f2f2f2' };

  // ---- Oso de perfil (mira a la derecha) ----
  // p: {color|variant, hump, anim: idle|walk|charge|roar, speed}
  A.bear = function (p, c) {
    const variant = p.variant || 'grizzly';
    const col = p.color || BEAR_COLORS[variant] || BEAR_COLORS.grizzly;
    const dark = shade(col, -0.35), light = shade(col, variant === 'black' ? 0.45 : 0.3);
    const muzzle = p.muzzle || (variant === 'black' ? '#b08a62' : light);
    const hump = p.hump ?? variant === 'grizzly';
    const anim = p.anim || 'idle';
    const sp = p.speed ?? (anim === 'charge' ? 9 : 5);
    const moving = anim === 'walk' || anim === 'charge';
    const ph = c.lt * sp;
    const bob = moving ? Math.sin(ph * 2) * 6 : Math.sin(c.lt * 2) * 3;
    const roar = anim === 'roar' || (p.roarAt != null && c.lt >= p.roarAt);
    const legs = [[-200, 0], [-130, Math.PI], [130, Math.PI * 0.5], [195, Math.PI * 1.5]];
    let s = `<ellipse cx="0" cy="6" rx="300" ry="26" fill="#000" opacity="0.18"/>`;
    legs.forEach(([lx, o], i) => {
      const a = moving ? Math.sin(ph + o) * (anim === 'charge' ? 26 : 16) : 0;
      const col2 = i % 2 ? dark : shade(col, -0.18);
      s += `<g transform="translate(${lx},${-170 + bob}) rotate(${a.toFixed(1)})"><rect x="-38" y="0" width="76" height="${172 - bob}" rx="30" fill="${col2}"/><ellipse cx="6" cy="${166 - bob}" rx="44" ry="16" fill="${shade(col2, -0.25)}"/></g>`;
    });
    s += `<g transform="translate(0,${bob.toFixed(1)})">`;
    s += `<ellipse cx="0" cy="-250" rx="275" ry="135" fill="${col}"/>`;
    if (hump) s += `<ellipse cx="95" cy="-320" rx="120" ry="78" fill="${col}"/>`;
    s += `<ellipse cx="-20" cy="-210" rx="230" ry="70" fill="${dark}" opacity="0.25"/>`;
    s += fur(p.seed || 5, 0, -260, 260, 120, dark, 70);
    // cabeza
    const hy = roar ? -270 : -260, tilt = roar ? -14 : 0;
    s += `<g transform="translate(275,${hy}) rotate(${tilt})">`;
    s += `<circle cx="-40" cy="-78" r="32" fill="${col}"/><circle cx="-40" cy="-78" r="16" fill="${dark}"/>`;
    s += `<circle cx="0" cy="0" r="92" fill="${col}"/>`;
    s += `<ellipse cx="80" cy="18" rx="${variant === 'grizzly' ? 70 : 66}" ry="44" fill="${muzzle}"/>`;
    s += `<ellipse cx="138" cy="6" rx="20" ry="15" fill="#151010"/>`;
    s += `<circle cx="30" cy="-28" r="10" fill="#111"/><circle cx="33" cy="-31" r="3" fill="#fff"/>`;
    if (roar) {
      s += `<path d="M30 40 Q95 120 150 40 Z" fill="#7a1622"/><path d="M60 70 Q95 105 130 70 Q95 85 60 70Z" fill="#e8758a"/>`;
      for (let i = 0; i < 4; i++) s += `<polygon points="${48 + i * 26},40 ${60 + i * 26},40 ${54 + i * 26},62" fill="#fff"/>`;
      s += `<polygon points="70,92 82,92 76,74" fill="#fff"/><polygon points="112,88 124,86 116,70" fill="#fff"/>`;
    }
    s += `</g></g>`;
    return s;
  };

  // ---- Oso de frente (para sustos / primeros planos) ----
  A.bearFront = function (p, c) {
    const variant = p.variant || 'black';
    const col = p.color || BEAR_COLORS[variant] || BEAR_COLORS.black;
    const dark = shade(col, -0.35);
    const muzzle = p.muzzle || (variant === 'black' ? '#b89068' : shade(col, 0.3));
    const roar = p.anim === 'roar' || (p.roarAt != null && c.lt >= p.roarAt);
    const open = roar ? ease.out(clamp((c.lt - (p.roarAt || 0)) / 0.25, 0, 1)) : 0;
    const br = 1 + Math.sin(c.lt * 2.2) * 0.012;
    let s = `<ellipse cx="0" cy="8" rx="360" ry="34" fill="#000" opacity="0.2"/>`;
    s += `<g transform="scale(${br.toFixed(3)})">`;
    s += `<ellipse cx="0" cy="-330" rx="320" ry="270" fill="${col}"/>`;
    s += fur(p.seed || 9, 0, -330, 300, 250, dark, 110);
    [-170, 170].forEach((x) => (s += `<rect x="${x - 70}" y="-280" width="140" height="285" rx="55" fill="${shade(col, -0.15)}"/><ellipse cx="${x}" cy="0" rx="80" ry="22" fill="${dark}"/>`));
    s += `<g transform="translate(0,-590)">`;
    [-140, 140].forEach((x) => (s += `<circle cx="${x}" cy="-125" r="62" fill="${col}"/><circle cx="${x}" cy="-125" r="32" fill="${dark}"/>`));
    s += `<circle cx="0" cy="0" r="190" fill="${col}"/>`;
    s += fur((p.seed || 9) + 1, 0, 0, 180, 180, dark, 60);
    s += `<ellipse cx="0" cy="${70 + open * 20}" rx="105" ry="${80 + open * 35}" fill="${muzzle}"/>`;
    s += `<ellipse cx="0" cy="25" rx="40" ry="27" fill="#141010"/><ellipse cx="-10" cy="17" rx="11" ry="6" fill="#fff" opacity=".35"/>`;
    [-75, 75].forEach((x) => (s += `<circle cx="${x}" cy="-50" r="17" fill="#0c0c0c"/><circle cx="${x + 5}" cy="-55" r="6" fill="#fff"/>`));
    if (roar) {
      s += `<g transform="translate(0,${95 + open * 25}) scale(1,${(0.2 + 0.8 * open).toFixed(2)})"><ellipse rx="85" ry="70" fill="#6e1220"/><ellipse cy="30" rx="55" ry="30" fill="#e5768c"/>`;
      for (let i = -3; i <= 3; i++) s += `<polygon points="${i * 22 - 10},-62 ${i * 22 + 10},-62 ${i * 22},-28" fill="#fff"/>`;
      for (let i = -2; i <= 2; i++) s += `<polygon points="${i * 26 - 10},66 ${i * 26 + 10},66 ${i * 26},36" fill="#fff"/>`;
      s += `</g>`;
    } else {
      s += `<path d="M-30 80 Q0 98 30 80" stroke="#141010" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    }
    s += `</g></g>`;
    return s;
  };

  // ---- Excursionista visto desde arriba, tumbado boca abajo ----
  A.hikerLying = function (p, c) {
    const spread = p.spread ?? 1;
    const shirt = p.shirt || '#2fb3a3', pants = p.pants || '#2f5fb8', pack = p.pack || '#f07f2a';
    const br = Math.sin(c.lt * 3) * 3;
    let s = `<g transform="translate(0,-300)">`;
    // piernas
    [-1, 1].forEach((k) => {
      const fx = k * (60 + 70 * spread), fy = 420;
      s += `<path d="M${k * 45} 120 L${fx} ${fy}" stroke="${pants}" stroke-width="64" stroke-linecap="round"/>`;
      s += `<ellipse cx="${fx + k * 4}" cy="${fy + 30}" rx="30" ry="22" fill="#7a4a2a"/>`;
    });
    // torso y brazos a la nuca
    s += `<rect x="-110" y="-150" width="220" height="290" rx="60" fill="${shirt}"/>`;
    [-1, 1].forEach((k) => {
      s += `<path d="M${k * 95} -120 L${k * 175} -230 L${k * 55} -265" stroke="${shirt}" stroke-width="58" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
      s += `<circle cx="${k * 52}" cy="-262" r="27" fill="#a5694a"/>`;
    });
    s += `<circle cx="0" cy="-215" r="62" fill="#3a2418"/>`;
    s += `<path d="M-60 -230 A60 60 0 0 1 60 -230 Z" fill="#f2c230"/>`;
    // mochila
    s += `<g transform="translate(0,${br})"><rect x="-82" y="-130" width="164" height="210" rx="34" fill="${pack}"/>`;
    s += `<rect x="-95" y="-150" width="190" height="34" rx="16" fill="#3456c4"/>`;
    s += `<rect x="-58" y="-10" width="116" height="66" rx="16" fill="${shade(pack, -0.15)}"/><rect x="-36" y="18" width="72" height="8" rx="4" fill="#5a2c0c"/></g>`;
    s += `</g>`;
    return s;
  };

  // ---- Excursionista de espaldas, de pie ----
  A.hikerBack = function (p, c) {
    const shirt = p.shirt || '#2fb3a3', pants = p.pants || '#2f5fb8', pack = p.pack || '#f07f2a';
    const sway = Math.sin(c.lt * 2) * 2;
    const run = p.anim === 'run';
    const ph = c.lt * 12;
    let s = `<ellipse cx="0" cy="6" rx="120" ry="18" fill="#000" opacity=".18"/>`;
    [-1, 1].forEach((k) => {
      const lift = run ? Math.max(0, Math.sin(ph + (k > 0 ? Math.PI : 0))) * 60 : 0;
      s += `<path d="M${k * 38} -330 L${k * 48} ${-30 - lift}" stroke="${pants}" stroke-width="58" stroke-linecap="round"/>`;
      s += `<ellipse cx="${k * 50}" cy="${-8 - lift}" rx="32" ry="20" fill="#6b3f22"/>`;
    });
    s += `<g transform="rotate(${sway})">`;
    [-1, 1].forEach((k) => {
      const up = p.arms === 'up';
      s += up ? `<path d="M${k * 95} -560 L${k * 170} -700 L${k * 150} -820" stroke="${shirt}" stroke-width="50" stroke-linecap="round" fill="none"/><circle cx="${k * 150}" cy="-835" r="26" fill="#a5694a"/>`
        : `<path d="M${k * 100} -560 L${k * 120} -360" stroke="${shirt}" stroke-width="50" stroke-linecap="round"/><circle cx="${k * 122}" cy="-345" r="25" fill="#a5694a"/>`;
    });
    s += `<rect x="-110" y="-620" width="220" height="320" rx="60" fill="${shirt}"/>`;
    s += `<circle cx="0" cy="-680" r="68" fill="#3a2418"/><path d="M-66 -690 A66 66 0 0 1 66 -690 Z" fill="#f2c230"/>`;
    s += `<rect x="-90" y="-600" width="180" height="230" rx="36" fill="${pack}"/><rect x="-100" y="-620" width="200" height="34" rx="16" fill="#3456c4"/>`;
    s += `<rect x="-60" y="-470" width="120" height="70" rx="16" fill="${shade(pack, -0.15)}"/><rect x="-38" y="-440" width="76" height="8" rx="4" fill="#5a2c0c"/>`;
    s += `</g>`;
    return s;
  };

  // ---- Tronco en primer plano ----
  A.trunk = function (p) {
    const r = rng(p.seed || 4);
    const w = p.w || 120, h = p.h || 2600;
    let s = `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h + 40}" fill="${p.color || '#5a3a22'}"/>`;
    s += `<rect x="${-w / 2}" y="${-h}" width="${w * 0.3}" height="${h + 40}" fill="#000" opacity=".2"/>`;
    for (let i = 0; i < 26; i++) s += `<ellipse cx="${(-w / 2 + r() * w).toFixed(0)}" cy="${(-r() * h).toFixed(0)}" rx="${8 + r() * 14}" ry="${20 + r() * 40}" fill="#4f7a2e" opacity=".55"/>`;
    for (let i = 0; i < 40; i++) s += `<path d="M${(-w / 2 + r() * w).toFixed(0)} ${(-r() * h).toFixed(0)} l0 ${30 + r() * 60}" stroke="#2a1a0e" stroke-width="4" opacity=".4"/>`;
    return s;
  };

  // ---- Puño (golpe a cámara) ----
  A.fist = function (p, c) {
    const u = ease.out(clamp(c.lt / (p.speed || 0.35), 0, 1));
    const skin = p.skin || '#d9a679', sleeve = p.sleeve || '#2fb3a3';
    const reach = (p.reach ?? 260) * u;
    return `<g transform="translate(0,${-reach})"><path d="M0 0 L0 700" stroke="${sleeve}" stroke-width="150" stroke-linecap="round"/>
      <rect x="-95" y="-110" width="190" height="170" rx="60" fill="${skin}"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="${-88 + i * 45}" y="-125" width="44" height="70" rx="20" fill="${shade(skin, -0.06)}" stroke="${shade(skin, -0.25)}" stroke-width="3"/>`).join('')}
      <path d="M-95 0 Q-130 -40 -80 -70" stroke="${shade(skin, -0.25)}" stroke-width="4" fill="none"/></g>`;
  };

  // ---- Arco luminoso para señalar algo (p.d = path relativo) ----
  A.glow = function (p, c) {
    const u = ease.out(clamp(c.lt / 0.5, 0, 1));
    const pulse = 0.7 + 0.3 * Math.sin(c.lt * 6);
    const d = p.d || 'M-120 0 Q0 -80 120 0';
    return `<path d="${d}" stroke="${p.color || '#ffe9a6'}" stroke-width="34" fill="none" stroke-linecap="round" opacity="${(0.35 * pulse * u).toFixed(2)}"/>
      <path d="${d}" stroke="#fffbe6" stroke-width="12" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${(1 - u).toFixed(3)}"/>`;
  };

  // ---- Marcas: correcto / incorrecto ----
  A.check = function (p, c) {
    const u = ease.back(clamp(c.lt / 0.35, 0, 1));
    return `<g transform="scale(${u.toFixed(3)})"><circle r="110" fill="#2bb673"/><path d="M-50 0 L-12 40 L55 -40" stroke="#fff" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  };
  A.cross = function (p, c) {
    const u = ease.back(clamp(c.lt / 0.35, 0, 1));
    return `<g transform="scale(${u.toFixed(3)})"><circle r="110" fill="#e5484d"/><path d="M-45 -45 L45 45 M45 -45 L-45 45" stroke="#fff" stroke-width="26" stroke-linecap="round"/></g>`;
  };

  // ---- Texto grande dentro de la escena ----
  A.label = function (p, c) {
    const u = ease.back(clamp(c.lt / 0.3, 0, 1));
    return `<g transform="scale(${u.toFixed(3)})"><text text-anchor="middle" font-family="Inter, sans-serif" font-weight="900" font-size="${p.size || 120}" fill="${p.color || '#fff'}" stroke="#000" stroke-opacity=".35" stroke-width="10" paint-order="stroke">${esc(p.text || '')}</text></g>`;
  };

  // ---- Imagen externa (PNG/SVG con fondo transparente) ----
  A.image = function (p) {
    const w = p.w || 600, h = p.h || 600;
    return `<image href="${esc(p.src)}" x="${-w / 2}" y="${-h}" width="${w}" height="${h}"/>`;
  };

  // ---- Arbusto ----
  A.bush = function (p) {
    const col = p.color || '#3f7a2c';
    return [[-90, -60, 90], [0, -100, 110], [95, -55, 85]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`).join('') +
      `<circle cx="-20" cy="-130" r="40" fill="${shade(col, 0.15)}" opacity=".6"/>`;
  };
})();
