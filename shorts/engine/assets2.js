// Biblioteca 2D ampliada: personajes expresivos, planeta, calendario, pizarra,
// revista, gráfica animada, multitud, mochila y objetos de emergencia, fondos nuevos.
// Todo en ilustración plana con degradados suaves (mismo estilo que assets.js).
(function () {
  const A = window.ASSETS;
  const B = window.BACKGROUNDS;
  const { rng, clamp, lerp, ease, esc } = window.SH;
  const shade = A._shade;
  const W = 1080, H = 1920;
  let uid = 0;
  const id = (p) => `${p}${++uid}`;

  // ================= PERSONAJE =================
  // p: {skin, hair, hairStyle: short|long|bun|curly|bald|spiky, shirt, pants, shoes,
  //     mood: happy|scared|surprised|worried|neutral|talk, pose: idle|point|scared|wave|cheer|shrug|hips,
  //     coat (bata), glasses, look:[x,y], kid, seed}
  const POSES = {
    hug: (k, s, t) => [[k * 60, -250 + Math.sin(t * 25) * 2], [-k * 40, -260 + Math.sin(t * 25) * 2]],
    hold: (k, s) => (k > 0 ? [[120, -260], [170, -300]] : [[-92, -238 + s], [-96, -168 + s]]),
    idle: (k, s) => [[k * 92, -238 + s], [k * 96, -168 + s]],
    point: (k, s, t) => (k > 0 ? [[150, -330], [235, -390 + Math.sin(t * 3) * 6]] : [[-92, -238 + s], [-96, -168 + s]]),
    scared: (k, s, t) => [[k * 108, -300], [k * 52, -395 + Math.sin(t * 20) * 3]],
    wave: (k, s, t) => (k > 0 ? [[140, -330], [150 + Math.sin(t * 9) * 35, -450]] : [[-92, -238 + s], [-96, -168 + s]]),
    cheer: (k, s, t) => [[k * 130, -350], [k * 150, -470 + Math.sin(t * 8 + k) * 12]],
    shrug: (k) => [[k * 125, -250], [k * 160, -300]],
    hips: (k) => [[k * 130, -250], [k * 75, -200]],
  };
  A.person = function (p, c) {
    const t = c.t + (p.seed || 0) * 1.37;
    const skin = p.skin || '#e0a57e', hairC = p.hair || '#3a2418', shirt = p.shirt || '#2fb3a3';
    const pants = p.pants || '#2f4f8a', shoes = p.shoes || '#3b2a20';
    const mood = p.mood || 'happy';
    const breath = Math.sin(t * 2.2) * 4;
    const sway = Math.sin(t * 1.3) * 1.6;
    const headTilt = Math.sin(t * 1.1) * 3 + (mood === 'scared' ? Math.sin(t * 18) * 1.5 : 0);
    const pose = POSES[p.pose || 'idle'] || POSES.idle;
    const outline = shade(shirt, -0.35);
    let s = `<ellipse cx="0" cy="4" rx="105" ry="18" fill="#000" opacity="0.2"/>`;
    s += `<g transform="rotate(${sway.toFixed(2)})">`;
    // piernas
    [-1, 1].forEach((k) => {
      s += `<path d="M${k * 32} -175 L${k * 36} -24" stroke="${pants}" stroke-width="46" stroke-linecap="round"/>`;
      s += `<path d="M${k * 22} -20 h${k * 38} a18 18 0 0 1 0 22 h${-k * 52} z" fill="${shoes}"/>`;
    });
    // torso (respira)
    const bodyCol = p.coat ? '#f6f6f2' : shirt;
    s += `<g transform="translate(0,-170) scale(1,${(1 + breath / 300).toFixed(4)}) translate(0,170)">`;
    if (p.coat) s += `<path d="M-88 -330 Q-100 -200 -96 -120 L96 -120 Q100 -200 88 -330 Z" fill="#f6f6f2"/><path d="M-30 -332 L0 -250 L30 -332 Z" fill="${shirt}"/><path d="M0 -250 L0 -125" stroke="#d6d6cf" stroke-width="4"/>`;
    else s += `<path d="M-82 -335 Q-96 -250 -84 -165 Q0 -150 84 -165 Q96 -250 82 -335 Q0 -352 -82 -335 Z" fill="${shirt}"/><path d="M-84 -190 Q0 -178 84 -190" stroke="${outline}" stroke-width="5" fill="none" opacity="0.35"/>`;
    s += `<path d="M-26 -342 Q0 -318 26 -342" fill="${shade(skin, -0.08)}"/>`;
    // brazos
    [-1, 1].forEach((k) => {
      const [e, h] = pose(k, breath, t);
      const sh = [k * 74, -318];
      s += `<path d="M${sh[0]} ${sh[1]} Q${e[0]} ${e[1]} ${h[0]} ${h[1]}" stroke="${bodyCol}" stroke-width="36" stroke-linecap="round" fill="none"/>`;
      s += `<circle cx="${h[0]}" cy="${h[1]}" r="22" fill="${skin}"/>`;
      if (p.holding && k > 0) s += `<g transform="translate(${h[0]},${h[1]}) rotate(${p.holdRot ?? -20}) scale(0.32)">${A.item({ kind: p.holding }, {})}</g>`;
      if (p.pose === 'point' && k > 0) s += `<path d="M${h[0] + 12} ${h[1] - 8} l34 -18" stroke="${skin}" stroke-width="13" stroke-linecap="round"/>`;
    });
    s += `</g>`;
    // cabeza
    s += `<g transform="translate(0,${(-372 + breath * 0.5).toFixed(1)}) rotate(${headTilt.toFixed(2)})">`;
    s += head(p, t, skin, hairC, mood);
    s += `</g></g>`;
    return s;
  };

  function head(p, t, skin, hairC, mood) {
    const R = 82, cy = -40;
    const style = p.hairStyle || 'short';
    const darkHair = shade(hairC, -0.25);
    let s = '';
    // pelo de detrás
    if (style === 'long') s += `<path d="M${-R - 10} ${cy - 10} Q${-R - 20} ${cy + 110} ${-R + 10} ${cy + 130} L${R - 10} ${cy + 130} Q${R + 20} ${cy + 110} ${R + 10} ${cy - 10} Z" fill="${darkHair}"/>`;
    if (style === 'bun') s += `<circle cx="0" cy="${cy - R - 18}" r="34" fill="${hairC}"/>`;
    s += `<rect x="-18" y="${cy + R - 30}" width="36" height="40" fill="${shade(skin, -0.1)}"/>`;
    // orejas y cara
    [-1, 1].forEach((k) => (s += `<circle cx="${k * (R - 4)}" cy="${cy + 6}" r="17" fill="${shade(skin, -0.05)}"/>`));
    s += `<circle cx="0" cy="${cy}" r="${R}" fill="${skin}"/>`;
    s += `<ellipse cx="${-R * 0.35}" cy="${cy - R * 0.45}" rx="${R * 0.35}" ry="${R * 0.22}" fill="#fff" opacity="0.12"/>`;
    // pelo de delante
    if (style === 'short' || style === 'long' || style === 'bun') s += `<path d="M${-R - 4} ${cy + 4} Q${-R} ${cy - R - 14} 0 ${cy - R - 10} Q${R} ${cy - R - 14} ${R + 4} ${cy + 4} Q${R * 0.7} ${cy - R * 0.55} ${R * 0.1} ${cy - R * 0.6} Q${-R * 0.3} ${cy - R * 0.3} ${-R - 4} ${cy + 4} Z" fill="${hairC}"/>`;
    if (style === 'spiky') { let d = `M${-R} ${cy - 10}`; for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; d += ` L${(Math.cos(a) * (R + (i % 2 ? 30 : 4))).toFixed(0)} ${(cy + Math.sin(a) * (R + (i % 2 ? 30 : 4))).toFixed(0)}`; } s += `<path d="${d} L${R} ${cy - 10} Q0 ${cy - R * 0.5} ${-R} ${cy - 10}Z" fill="${hairC}"/>`; }
    if (style === 'curly') for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i * 0.112); s += `<circle cx="${(Math.cos(a) * R * 0.92).toFixed(0)}" cy="${(cy + Math.sin(a) * R * 0.92).toFixed(0)}" r="30" fill="${hairC}"/>`; }
    if (style === 'wild') { for (let i = 0; i < 14; i++) { const ang = Math.PI * (0.85 + i * 0.1); const rr = R * (1.02 + (i % 3) * 0.1); s += `<circle cx="${(Math.cos(ang) * rr).toFixed(0)}" cy="${(cy + Math.sin(ang) * rr * 0.95).toFixed(0)}" r="${26 + (i % 4) * 6}" fill="${hairC}"/>`; } [-1, 1].forEach((k) => (s += `<circle cx="${k * (R + 8)}" cy="${cy + 6}" r="34" fill="${hairC}"/><circle cx="${k * (R + 22)}" cy="${cy - 30}" r="28" fill="${hairC}"/>`)); }
    if (style === 'bald') [-1, 1].forEach((k) => (s += `<path d="M${k * (R - 2)} ${cy + 10} Q${k * (R + 6)} ${cy - 30} ${k * (R - 22)} ${cy - 46}" stroke="${hairC}" stroke-width="16" fill="none" stroke-linecap="round"/>`));
    if (mood === 'yawn') {
      [-1, 1].forEach((k) => (s += `<path d="M${k * 30 - 15} ${cy - 2} q15 -12 30 0" stroke="#3a2418" stroke-width="6" fill="none" stroke-linecap="round"/>`));
      const o = 0.7 + 0.3 * Math.abs(Math.sin(t * 1.4));
      s += `<ellipse cx="0" cy="${cy + 48}" rx="26" ry="${(34 * o).toFixed(1)}" fill="#5a1f24"/><ellipse cx="0" cy="${cy + 60}" rx="14" ry="${(10 * o).toFixed(1)}" fill="#e57a7a"/>`;
      [-1, 1].forEach((k) => (s += `<ellipse cx="${k * 52}" cy="${cy + 26}" rx="14" ry="9" fill="#f08080" opacity="0.35"/>`));
      return s;
    }
    if (mood === 'sleep') {
      [-1, 1].forEach((k) => (s += `<path d="M${k * 30 - 14} ${cy - 2} q14 12 28 0" stroke="#3a2418" stroke-width="6" fill="none" stroke-linecap="round"/>`));
      s += `<ellipse cx="0" cy="${cy + 44}" rx="9" ry="7" fill="#7a2a2a"/>`;
      [-1, 1].forEach((k) => (s += `<ellipse cx="${k * 52}" cy="${cy + 26}" rx="14" ry="9" fill="#f08080" opacity="0.35"/>`));
      return s;
    }
    // ojos
    const ph = (t * 0.83) % 3.6;
    const blink = ph < 0.12 ? 0.12 : 1;
    const look = p.look || [Math.sin(t * 0.7) * 0.3, 0];
    const eyeR = mood === 'scared' || mood === 'surprised' ? 1.25 : 1;
    [-1, 1].forEach((k) => {
      const ex = k * 30, ey = cy - 2;
      s += `<ellipse cx="${ex}" cy="${ey}" rx="${15 * eyeR}" ry="${(19 * eyeR * blink).toFixed(1)}" fill="#fff"/>`;
      if (mood === 'tired') s += `<path d="M${ex - 17} ${ey - 20} h34 v18 h-34Z" fill="${skin}"/><path d="M${ex - 17} ${ey - 2} h34" stroke="#3a2418" stroke-width="5" stroke-linecap="round"/><path d="M${ex - 13} ${ey + 22} q13 8 26 0" stroke="#8a5a7a" stroke-width="5" fill="none" opacity="0.6"/>`;
      if (blink > 0.5) {
        s += `<circle cx="${(ex + look[0] * 6).toFixed(1)}" cy="${(ey + look[1] * 6 + 1).toFixed(1)}" r="${mood === 'scared' ? 7 : 10}" fill="#1d1d24"/>`;
        s += `<circle cx="${(ex + look[0] * 6 + 3).toFixed(1)}" cy="${(ey + look[1] * 6 - 3).toFixed(1)}" r="3.2" fill="#fff"/>`;
      }
      // cejas según emoción
      const by = ey - 30 * eyeR;
      const inner = { happy: -2, neutral: 0, talk: -2, scared: -12, worried: -10, surprised: -8 }[mood] ?? 0;
      const outer = { happy: 4, neutral: 0, talk: 3, scared: 6, worried: 6, surprised: -8 }[mood] ?? 0;
      s += `<path d="M${ex - k * 12} ${by + inner} Q${ex} ${by - 6 + Math.min(inner, outer)} ${ex + k * 14} ${by + outer}" stroke="${shade(hairC, -0.1)}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    });
    if (p.glasses) s += `<g stroke="#2a2a30" stroke-width="5" fill="#fff" fill-opacity="0.12"><circle cx="-30" cy="${cy - 2}" r="25"/><circle cx="30" cy="${cy - 2}" r="25"/><path d="M-5 ${cy - 4} h10" /></g>`;
    // nariz, mejillas, boca
    if (p.mustache) s += `<path d="M-38 ${cy + 36} Q-20 ${cy + 18} 0 ${cy + 30} Q20 ${cy + 18} 38 ${cy + 36} Q20 ${cy + 46} 0 ${cy + 38} Q-20 ${cy + 46} -38 ${cy + 36}Z" fill="${p.mustache}"/>`;
    s += `<path d="M-4 ${cy + 14} Q4 ${cy + 24} -2 ${cy + 28}" stroke="${shade(skin, -0.22)}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    [-1, 1].forEach((k) => (s += `<ellipse cx="${k * 52}" cy="${cy + 26}" rx="14" ry="9" fill="#f08080" opacity="0.35"/>`));
    const my = cy + 44;
    if (mood === 'happy') s += `<path d="M-24 ${my - 4} Q0 ${my + 20} 24 ${my - 4} Q0 ${my + 4} -24 ${my - 4}Z" fill="#7a2a2a"/><path d="M-12 ${my + 6} Q0 ${my + 12} 12 ${my + 6}" stroke="#e57a7a" stroke-width="5" fill="none"/>`;
    else if (mood === 'scared') s += `<ellipse cx="0" cy="${my + 4}" rx="${13 + Math.sin(t * 14) * 2}" ry="18" fill="#5a1f24"/><rect x="-9" y="${my - 12}" width="18" height="6" rx="2" fill="#fff"/>`;
    else if (mood === 'surprised') s += `<ellipse cx="0" cy="${my + 2}" rx="11" ry="14" fill="#5a1f24"/>`;
    else if (mood === 'worried') s += `<path d="M-20 ${my + 4} q10 -10 20 0 t20 0" stroke="#5a1f24" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    else if (mood === 'talk') { const o = Math.abs(Math.sin(t * 11)) * 12; s += `<ellipse cx="0" cy="${my}" rx="18" ry="${(4 + o).toFixed(1)}" fill="#6b2328"/>`; }
    else s += `<path d="M-16 ${my} h32" stroke="#5a1f24" stroke-width="6" stroke-linecap="round"/>`;
    return s;
  }

  // nube de "puf" (desaparición)
  A.puff = function (p, c) {
    const u = clamp(c.lt / 0.5, 0, 1);
    if (u >= 1) return '';
    let s = '';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, r = 40 + u * 110;
      s += `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(-200 + Math.sin(a) * r * 0.8).toFixed(1)}" r="${(46 * (1 - u) + 10).toFixed(1)}" fill="#fff" opacity="${(0.9 * (1 - u)).toFixed(2)}"/>`;
    }
    return s;
  };

  // ================= PLANETA =================
  const CONT = (() => { // continentes: polígonos en (lon, lat) radianes
    const r = rng(17), out = [];
    const centers = [[-1.7, 0.75, 0.55], [-1.5, 0.3, 0.42], [-1.05, -0.35, 0.45], [0.2, 0.75, 0.5], [0.35, 0.1, 0.55], [0.4, -0.45, 0.3], [1.6, 0.65, 0.65], [1.75, 0.2, 0.35], [2.4, -0.45, 0.33], [-2.6, 0.95, 0.3]];
    centers.forEach(([lo, la, rad]) => {
      const pts = [];
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = rad * (0.65 + r() * 0.45); pts.push([lo + Math.cos(a) * rr, la + Math.sin(a) * rr * 0.7]); }
      out.push(pts);
    });
    return out;
  })();
  function proj(lon, lat, rot, R) {
    const l = lon - rot, x = R * Math.cos(lat) * Math.sin(l), y = -R * Math.sin(lat), z = Math.cos(lat) * Math.cos(l);
    return [x, y, z];
  }
  A.globe = function (p, c) {
    const R = p.r || 300, rot = (p.rot ?? 0) + c.t * (p.spin ?? 0.18);
    const gid = id('gl');
    let s = `<defs>
      <radialGradient id="${gid}o" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#5cc0f2"/><stop offset="0.6" stop-color="#2c7fc4"/><stop offset="1" stop-color="#173f78"/></radialGradient>
      <radialGradient id="${gid}s" cx="0.35" cy="0.3" r="0.8"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0a30" stop-opacity="0.55"/></radialGradient>
      <radialGradient id="${gid}a" cx="0.5" cy="0.5" r="0.5"><stop offset="0.86" stop-color="#7fd0ff" stop-opacity="0.55"/><stop offset="1" stop-color="#7fd0ff" stop-opacity="0"/></radialGradient>
      <clipPath id="${gid}c"><circle r="${R}"/></clipPath></defs>`;
    s += `<circle r="${R * 1.16}" fill="url(#${gid}a)"/>`;
    s += `<circle r="${R}" fill="url(#${gid}o)"/>`;
    s += `<g clip-path="url(#${gid}c)">`;
    CONT.forEach((poly, i) => {
      const pr = poly.map(([lo, la]) => proj(lo, la, rot, R));
      const zc = pr.reduce((a, q) => a + q[2], 0) / pr.length;
      if (zc < -0.15) return;
      const d = pr.map((q, k) => { let [x, y, z] = q; if (z < 0) { const m = Math.hypot(x, y) || 1; x = x / m * R; y = y / m * R; } return `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('') + 'Z';
      s += `<path d="${d}" fill="${i % 3 === 2 ? '#7fb24e' : '#5fa84a'}" stroke="#4a8d3c" stroke-width="6" stroke-linejoin="round"/>`;
      const cen = proj(poly[0][0] * 0.5 + poly[8][0] * 0.5, poly[0][1] * 0.5 + poly[8][1] * 0.5, rot, R);
      if (cen[2] > 0.2) s += `<ellipse cx="${cen[0].toFixed(1)}" cy="${cen[1].toFixed(1)}" rx="${(30 * cen[2]).toFixed(1)}" ry="18" fill="#c9b46a" opacity="0.55"/>`;
    });
    s += `<ellipse cx="0" cy="${-R * 0.97}" rx="${R * 0.55}" ry="${R * 0.16}" fill="#f4f8fb"/><ellipse cx="0" cy="${R * 0.98}" rx="${R * 0.5}" ry="${R * 0.14}" fill="#f4f8fb"/>`;
    // nubes
    for (let i = 0; i < 9; i++) {
      const q = proj(i * 0.7 + c.t * 0.08, Math.sin(i * 1.9) * 0.9, rot, R * 1.0);
      if (q[2] < 0.05) continue;
      const w = 70 * q[2] + 20;
      s += `<g transform="translate(${q[0].toFixed(1)},${q[1].toFixed(1)})" opacity="0.85"><ellipse rx="${w.toFixed(1)}" ry="18" fill="#fff"/><ellipse cx="${(-w * 0.3).toFixed(1)}" cy="-12" rx="${(w * 0.45).toFixed(1)}" ry="16" fill="#fff"/></g>`;
    }
    s += `</g><circle r="${R}" fill="url(#${gid}s)"/>`;
    // chinchetas
    if (p.pins) {
      const r = rng(5);
      for (let i = 0; i < p.pins.n; i++) {
        const lo = r() * Math.PI * 2, la = (r() - 0.5) * 1.8;
        const at = p.pins.at + i * (p.pins.step ?? 0.06);
        if (c.lt < at) continue;
        const q = proj(lo, la, rot, R);
        if (q[2] < 0.1) continue;
        const k = ease.back(clamp((c.lt - at) / 0.3, 0, 1)) * (0.6 + 0.4 * q[2]);
        s += `<g transform="translate(${q[0].toFixed(1)},${q[1].toFixed(1)}) scale(${k.toFixed(3)})"><path d="M0 0 C-14 -22 -22 -32 -22 -44 A22 22 0 1 1 22 -44 C22 -32 14 -22 0 0Z" fill="#e5484d" stroke="#fff" stroke-width="4"/><circle cy="-44" r="8" fill="#fff"/></g>`;
      }
    }
    return s;
  };

  // ================= CALENDARIO =================
  A.calendar = function (p, c) {
    const flip = ease.back(clamp(c.lt / 0.45, 0, 1));
    let s = `<g transform="scale(1,${flip.toFixed(3)})">`;
    s += `<rect x="-160" y="-190" width="320" height="380" rx="26" fill="#000" opacity="0.25" transform="translate(10,14)"/>`;
    s += `<rect x="-160" y="-190" width="320" height="380" rx="26" fill="#fbf8f1"/>`;
    s += `<path d="M-160 -164 a26 26 0 0 1 26 -26 h268 a26 26 0 0 1 26 26 v64 h-320Z" fill="#e0453f"/>`;
    s += `<text y="-128" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="34" fill="#fff" letter-spacing="1">${esc(p.month || 'NOVIEMBRE 2026')}</text>`;
    s += `<text y="90" text-anchor="middle" font-family="Inter, sans-serif" font-weight="900" font-size="190" fill="#1d1d26">${esc(p.day || '13')}</text>`;
    s += `<text y="160" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="36" fill="#e0453f" letter-spacing="3">${esc(p.weekday || 'VIERNES')}</text>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${-118 + i * 47}" y="-212" width="12" height="44" rx="6" fill="#7d838c"/>`;
    return s + `</g>`;
  };

  // ================= REVISTA SCIENCE 1960 =================
  A.journal = function (p, c) {
    const k = ease.back(clamp(c.lt / 0.5, 0, 1));
    const ang = (1 - k) * 25;
    let s = `<g transform="rotate(${ang.toFixed(2)}) scale(${k.toFixed(3)})">`;
    s += `<rect x="-215" y="-290" width="430" height="580" fill="#000" opacity="0.3" transform="translate(14,18)"/>`;
    s += `<rect x="-215" y="-290" width="430" height="580" fill="#efe3c4"/>`;
    s += `<rect x="-215" y="-290" width="430" height="110" fill="#7a1f1f"/>`;
    s += `<text y="-208" text-anchor="middle" font-family="DejaVu Serif, serif" font-weight="700" font-size="72" fill="#f6eedb" letter-spacing="4">SCIENCE</text>`;
    s += `<text y="-140" text-anchor="middle" font-family="DejaVu Serif, serif" font-size="26" fill="#4a3a28">1960</text>`;
    s += `<rect x="-170" y="-122" width="340" height="3" fill="#4a3a28"/>`;
    ['Doomsday:', 'Friday,', '13 November,', 'A.D. 2026'].forEach((l, i) => (s += `<text y="${-55 + i * 62}" text-anchor="middle" font-family="DejaVu Serif, serif" font-weight="700" font-size="50" fill="#2e2418">${l}</text>`));
    s += `<text y="215" text-anchor="middle" font-family="DejaVu Serif, serif" font-style="italic" font-size="21" fill="#4a3a28">H. von Foerster · P. M. Mora · L. W. Amiot</text>`;
    for (let i = 0; i < 3; i++) s += `<rect x="-160" y="${240 + i * 14}" width="${320 - i * 50}" height="5" fill="#8a7a5a" opacity="0.4"/>`;
    return s + `</g>`;
  };

  // ================= PIZARRA =================
  A.chalkboard = function (p, c) {
    const u = clamp(c.lt / 2.5, 0, 1); // la fórmula se "escribe"
    let s = `<rect x="-400" y="-250" width="800" height="500" rx="14" fill="#7a4e2c"/><rect x="-375" y="-226" width="750" height="452" fill="#2f4b3b"/>`;
    s += `<g font-family="DejaVu Serif, serif" fill="#f1f4ec" opacity="0.92">`;
    s += `<text x="-320" y="-110" font-size="64">N(t) =</text>`;
    s += `<text x="40" y="-140" font-size="58" text-anchor="middle">C</text>`;
    s += `<rect x="-110" y="-120" width="300" height="5" fill="#f1f4ec"/>`;
    s += `<text x="40" y="-55" font-size="52" text-anchor="middle">(2026,9 − t)</text></g>`;
    // mini gráfica de tiza
    let d = '';
    for (let i = 0; i <= 50; i++) { const x = i / 50; const X = -300 + x * 470, Y = 190 - Math.min(170, 6 / (1.04 - x)); d += `${i ? 'L' : 'M'}${X.toFixed(1)} ${Y.toFixed(1)}`; }
    s += `<path d="M-300 20 V190 H260" stroke="#f1f4ec" stroke-width="5" fill="none" opacity="0.8"/>`;
    s += `<path d="${d}" stroke="#ffd36e" stroke-width="7" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${(1 - u).toFixed(3)}" stroke-linecap="round"/>`;
    s += `<path d="M190 20 V190" stroke="#ff8a7a" stroke-width="5" stroke-dasharray="14 12"/>`;
    s += `<text x="190" y="225" text-anchor="middle" font-family="DejaVu Serif, serif" font-size="30" fill="#ff8a7a">2026</text>`;
    s += `<rect x="-120" y="226" width="90" height="16" rx="4" fill="#efefe6"/>`;
    return s;
  };

  // ================= GRÁFICA DE POBLACIÓN =================
  const X0 = 110, X1 = 1000, BASE = 1500;
  const fx = (yr) => (Math.log10(2030) - Math.log10(2030 - yr)) / (Math.log10(2030) - Math.log10(2.5));
  A.gx = (yr) => X0 + (X1 - X0) * fx(yr);
  A.gy = (n) => BASE - n * 72;
  const DATA = [[0, 0.2], [1000, 0.3], [1500, 0.45], [1700, 0.6], [1800, 1.0], [1850, 1.2], [1900, 1.6], [1930, 2.0], [1950, 2.5], [1960, 3.0], [1970, 3.7], [1980, 4.4], [1990, 5.3], [2000, 6.1], [2010, 6.9], [2020, 7.8], [2026, 8.2]];
  A.realN = (yr) => { for (let i = 1; i < DATA.length; i++) if (yr <= DATA[i][0]) { const [a, na] = DATA[i - 1], [b, nb] = DATA[i]; return lerp(na, nb, (yr - a) / (b - a)); } return 8.2; };
  A.modelN = (yr) => 200.6 / (2026.87 - yr);
  function seriesPath(fn, y0, y1, yMin = -2000) {
    let d = '', last = null;
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      // muestreo más denso cerca del final
      const yr = y1 - (y1 - y0) * Math.pow(1 - u, 2.2);
      const X = A.gx(yr), Y = Math.max(yMin, A.gy(fn(yr)));
      d += `${i ? 'L' : 'M'}${X.toFixed(1)} ${Y.toFixed(1)}`;
      last = [X, Y];
      if (Y <= yMin) break;
    }
    return { d, last };
  }
  // p: {realTo (año), modelTo (año), dots, asym, area}
  A.popGraph = function (p, c) {
    let s = `<defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fd1ff" stop-opacity="0.35"/><stop offset="1" stop-color="#4fd1ff" stop-opacity="0"/></linearGradient>
      <filter id="glowG" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter></defs>`;
    // rejilla
    for (let n = 1; n <= 10; n++) s += `<path d="M${X0} ${A.gy(n)} H${X1}" stroke="#ffffff" stroke-opacity="${n % 2 ? 0.05 : 0.1}" stroke-width="2"/>`;
    s += `<path d="M${X0} ${BASE - 760} V${BASE} H${X1 + 20}" stroke="#f3ead8" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    [[0, 'Año 0'], [1500, '1500'], [1960, '1960'], [2026, '2026']].forEach(([yr, l]) => {
      s += `<path d="M${A.gx(yr)} ${BASE} v14" stroke="#f3ead8" stroke-width="4"/>`;
      s += `<text x="${A.gx(yr)}" y="${BASE + 58}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="${yr === 2026 ? 38 : 32}" fill="${yr === 2026 ? '#ff8a7a' : '#f3ead8'}" opacity="0.9">${l}</text>`;
    });
    s += `<text x="${X0 + 16}" y="${BASE - 780}" font-family="Inter, sans-serif" font-weight="800" font-size="34" fill="#f3ead8" opacity="0.8">Población mundial</text>`;
    if (p.asym) {
      const ax = A.gx(2026.87), u = clamp((c.lt - (p.asymAt || 0)) / 0.5, 0, 1);
      s += `<path d="M${ax} ${BASE} V${BASE - 2600 * u}" stroke="#ff5a4f" stroke-width="6" stroke-dasharray="22 16"/>`;
    }
    if (p.realTo != null && p.realTo > 0) {
      const { d, last } = seriesPath(A.realN, 0, p.realTo);
      if (p.area) s += `<path d="${d} L${last[0]} ${BASE} L${X0} ${BASE}Z" fill="url(#areaG)"/>`;
      s += `<path d="${d}" stroke="#4fd1ff" stroke-width="22" fill="none" opacity="0.35" filter="url(#glowG)"/>`;
      s += `<path d="${d}" stroke="#4fd1ff" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += `<circle cx="${last[0]}" cy="${last[1]}" r="16" fill="#fff"/><circle cx="${last[0]}" cy="${last[1]}" r="30" fill="#4fd1ff" opacity="0.3"/>`;
    }
    if (p.modelTo != null && p.modelTo > 0) {
      const { d, last } = seriesPath(A.modelN, p.modelFrom || 0, p.modelTo, p.yMin ?? -1800);
      s += `<path d="${d}" stroke="#ff5a4f" stroke-width="24" fill="none" opacity="0.35" filter="url(#glowG)"/>`;
      s += `<path d="${d}" stroke="#ff5a4f" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${p.modelDash || 'none'}"/>`;
      s += `<circle cx="${last[0]}" cy="${last[1]}" r="16" fill="#fff"/>`;
    }
    if (p.dots) DATA.filter((q) => q[0] <= Math.min(1960, p.realTo ?? 1960)).forEach(([yr, n], i) => {
      const k = ease.back(clamp((c.lt - (p.dotsAt || 0) - i * 0.06) / 0.3, 0, 1));
      s += `<circle cx="${A.gx(yr)}" cy="${A.gy(n)}" r="${(13 * k).toFixed(1)}" fill="#fff" stroke="#1d1636" stroke-width="4"/>`;
    });
    return s;
  };
  A.graphHead = (fn, yr) => [A.gx(yr), A.gy(fn(yr))];

  // ================= MULTITUD =================
  // vista frontal en perspectiva: filas desde el horizonte (y0) hasta abajo
  A.crowd = function (p, c) {
    const r = rng(p.seed || 9);
    const y0 = p.horizon ?? 1080, y1 = p.bottom ?? 2050, rows = p.rows || 26;
    const shirts = ['#2fb3a3', '#f2c230', '#e8709a', '#5b7cff', '#f07f2a', '#e5484d', '#8bd16a', '#b07cff', '#f6f6f2'];
    const skins = ['#e0a57e', '#c98d66', '#a5694a', '#7a4a32', '#f0c8a0'];
    const hairs = ['#3a2418', '#1d1d24', '#7a4a22', '#c9a050', '#5a2a1a'];
    let s = '', idx = 0;
    const count = p.count ?? 9999;
    for (let row = 0; row < rows; row++) {
      const v = row / (rows - 1);
      const y = lerp(y0, y1, Math.pow(v, 1.6));
      const sc = 0.12 + Math.pow(v, 1.6) * 0.9;
      const gap = 150 * sc;
      const off = (row % 2) * gap / 2;
      for (let x = -900 + off; x < 1980; x += gap) {
        idx++;
        if (idx > count && row < rows - 3) continue;
        const jx = (r() - 0.5) * gap * 0.4, bob = Math.sin(c.t * (4 + r() * 3) + idx) * 4 * sc;
        const sh = shirts[(idx * 7) % shirts.length], sk = skins[(idx * 3) % skins.length], hc = hairs[(idx * 5) % hairs.length];
        if (idx > count) continue;
        s += `<g transform="translate(${(x + jx).toFixed(0)},${(y + bob).toFixed(1)}) scale(${sc.toFixed(3)})"><path d="M-62 0 Q-64 -95 0 -100 Q64 -95 62 0Z" fill="${sh}"/><circle cy="-150" r="52" fill="${sk}"/><path d="M-54 -150 Q-52 -212 0 -208 Q52 -212 54 -150 Q30 -182 -54 -150Z" fill="${hc}"/></g>`;
      }
    }
    return s;
  };

  // ================= MOCHILA Y OBJETOS =================
  A.backpack = function (p, c) {
    const open = p.open ? 1 : 0;
    const bump = p.bump || 0;
    let s = `<ellipse cx="0" cy="6" rx="190" ry="26" fill="#000" opacity="0.22"/>`;
    s += `<g transform="scale(${(1 + bump * 0.06).toFixed(3)},${(1 - bump * 0.05).toFixed(3)})">`;
    s += `<rect x="-200" y="-330" width="44" height="260" rx="20" fill="#2c47a6"/><rect x="156" y="-330" width="44" height="260" rx="20" fill="#2c47a6"/>`;
    if (open) s += `<ellipse cx="0" cy="-440" rx="150" ry="40" fill="#5a2a0c"/>`;
    s += `<path d="M-170 -420 Q-175 -470 -120 -478 L120 -478 Q175 -470 170 -420 L178 -40 Q178 0 138 0 L-138 0 Q-178 0 -178 -40 Z" fill="#f07f2a"/>`;
    s += `<path d="M-170 -420 Q-175 -470 -120 -478 L-60 -478 L-90 0 L-138 0 Q-178 0 -178 -40 Z" fill="#fff" opacity="0.08"/>`;
    s += `<rect x="-120" y="-200" width="240" height="160" rx="40" fill="#d0661c"/><path d="M-90 -170 H90" stroke="#5a2c0c" stroke-width="7" stroke-linecap="round"/>`;
    s += `<g transform="translate(0,-310)"><circle r="46" fill="#fff"/><rect x="-28" y="-9" width="56" height="18" rx="4" fill="#e5484d"/><rect x="-9" y="-28" width="18" height="56" rx="4" fill="#e5484d"/></g>`;
    if (open) s += `<path d="M-150 -470 Q0 -560 150 -470 L150 -500 Q0 -600 -150 -500Z" fill="#2c47a6"/>`;
    else s += `<path d="M-168 -420 Q-172 -480 -110 -488 L110 -488 Q172 -480 168 -420 L168 -380 Q0 -360 -168 -380 Z" fill="#2c47a6"/><rect x="-24" y="-392" width="48" height="40" rx="8" fill="#f2c230"/>`;
    s += `<path d="M-50 -488 Q0 -560 50 -488" stroke="#2c47a6" stroke-width="16" fill="none" stroke-linecap="round"/>`;
    return s + `</g>`;
  };
  A.item = function (p, c) {
    const k = p.kind;
    if (k === 'agua') return `<rect x="-48" y="-150" width="96" height="190" rx="30" fill="#bfe8ff" opacity="0.9"/><rect x="-44" y="-90" width="88" height="126" rx="24" fill="#3aa0e8"/><rect x="-48" y="-80" width="96" height="50" fill="#fff"/><text y="-46" text-anchor="middle" font-family="Inter" font-weight="900" font-size="26" fill="#3aa0e8">AGUA</text><rect x="-24" y="-182" width="48" height="36" rx="8" fill="#2a5cc4"/><rect x="-30" y="-140" width="16" height="150" rx="8" fill="#fff" opacity="0.5"/>`;
    if (k === 'linterna') return `<g transform="rotate(-25)"><path d="M40 -40 L300 -150 L300 70 Z" fill="#fff4b8" opacity="0.25"/><rect x="-160" y="-30" width="160" height="60" rx="16" fill="#2a2a32"/><rect x="-140" y="-30" width="20" height="60" fill="#3d3d47"/><path d="M0 -36 L60 -56 L60 56 L0 36Z" fill="#f2c230"/><ellipse cx="60" cy="0" rx="12" ry="56" fill="#fff8d6"/><circle cx="-60" cy="-30" r="10" fill="#e5484d"/></g>`;
    if (k === 'radio') return `<rect x="-130" y="-160" width="260" height="170" rx="28" fill="#3b3f48"/><circle cx="-50" cy="-75" r="56" fill="#25272d"/>${[...Array(5)].map((_, i) => `<circle cx="-50" cy="-75" r="${10 + i * 10}" fill="none" stroke="#4a4f5a" stroke-width="3"/>`).join('')}<rect x="30" y="-130" width="80" height="34" rx="6" fill="#9fe0a0"/><circle cx="70" cy="-50" r="22" fill="#e5484d"/><path d="M100 -160 L170 -300" stroke="#c9ccd1" stroke-width="8" stroke-linecap="round"/><circle cx="170" cy="-300" r="9" fill="#c9ccd1"/>`;
    if (k === 'botiquin') return `<rect x="-140" y="-170" width="280" height="190" rx="28" fill="#f6f6f4"/><rect x="-140" y="-170" width="280" height="40" rx="20" fill="#e3e3df"/><path d="M-40 -170 Q0 -230 40 -170" stroke="#e5484d" stroke-width="16" fill="none"/><rect x="-60" y="-95" width="120" height="36" rx="8" fill="#e5484d"/><rect x="-18" y="-137" width="36" height="120" rx="8" fill="#e5484d"/>`;
    if (k === 'documentos') return `<g transform="rotate(-6)"><rect x="-150" y="-170" width="300" height="200" rx="16" fill="#f2c230"/><rect x="-130" y="-200" width="260" height="190" rx="10" fill="#fbf7ee"/><rect x="-110" y="-180" width="80" height="100" rx="8" fill="#5b7cff"/><circle cx="-70" cy="-148" r="20" fill="#f0c8a0"/>${[0, 1, 2, 3].map((i) => `<rect x="-10" y="${-176 + i * 26}" width="${110 - i * 14}" height="10" rx="5" fill="#9aa0aa"/>`).join('')}<rect x="-150" y="-110" width="300" height="140" rx="16" fill="#e8b828"/></g>`;
    if (k === 'efectivo') return [0, 1, 2, 3, 4].map((i) => `<g transform="translate(${(i % 2) * 8},${-i * 16}) rotate(${(i % 3) - 1})"><rect x="-150" y="-60" width="300" height="80" rx="10" fill="${i % 2 ? '#6fbf6a' : '#5aa85a'}" stroke="#3f8a40" stroke-width="4"/><circle cx="0" cy="-20" r="24" fill="none" stroke="#3f8a40" stroke-width="5"/><text y="-10" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="#3f8a40">$</text></g>`).join('') + `<rect x="-26" y="-140" width="52" height="96" fill="#f2e6c8"/>`;
    return '';
  };

  // ================= FONDOS =================
  B.space = (t) => {
    let s = `<defs><radialGradient id="neb1" cx="0.3" cy="0.3" r="0.6"><stop offset="0" stop-color="#5b3f9a" stop-opacity="0.55"/><stop offset="1" stop-color="#0a0a1e" stop-opacity="0"/></radialGradient>
      <radialGradient id="neb2" cx="0.75" cy="0.75" r="0.55"><stop offset="0" stop-color="#1f7a8a" stop-opacity="0.45"/><stop offset="1" stop-color="#0a0a1e" stop-opacity="0"/></radialGradient></defs>`;
    s += `<rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" fill="#0a0a1e"/><rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" fill="url(#neb1)"/><rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" fill="url(#neb2)"/>`;
    const r = rng(42);
    for (let i = 0; i < 220; i++) {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin((t || 0) * (0.5 + r() * 2) + i));
      s += `<circle cx="${(r() * (W + 1200) - 600).toFixed(0)}" cy="${(r() * (H + 1200) - 600).toFixed(0)}" r="${(0.8 + r() * 2.6).toFixed(1)}" fill="#fff" opacity="${(tw * (0.4 + r() * 0.6)).toFixed(2)}"/>`;
    }
    return s;
  };
  B.chart = () => `<defs><linearGradient id="chartBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d4a"/><stop offset="0.6" stop-color="#1a1636"/><stop offset="1" stop-color="#121029"/></linearGradient></defs><rect x="-800" y="-3000" width="${W + 1600}" height="${H + 4000}" fill="url(#chartBg)"/>`;
  B.lab = () => {
    let s = `<rect x="-600" y="-600" width="${W + 1200}" height="${H + 1200}" fill="#d9c5a0"/>`;
    s += `<rect x="-600" y="1150" width="${W + 1200}" height="1400" fill="#8a6440"/>`;
    for (let x = -600; x < W + 600; x += 110) s += `<rect x="${x}" y="1150" width="6" height="1400" fill="#6e4f32"/>`;
    s += `<rect x="-600" y="1080" width="${W + 1200}" height="70" fill="#a98a62"/>`;
    s += `<g transform="translate(870,560)"><rect x="-130" y="-170" width="260" height="300" fill="#bfe0f0"/><rect x="-130" y="-170" width="260" height="300" fill="none" stroke="#6e4f32" stroke-width="18"/><path d="M0 -170 V130 M-130 -20 H130" stroke="#6e4f32" stroke-width="10"/></g>`;
    s += `<g transform="translate(140,520)"><circle r="70" fill="#f6efe0" stroke="#6e4f32" stroke-width="10"/><path d="M0 0 V-46 M0 0 L32 14" stroke="#2a2a2a" stroke-width="7" stroke-linecap="round"/></g>`;
    s += `<rect x="-40" y="840" width="300" height="16" fill="#6e4f32"/>${[0, 1, 2].map((i) => `<path d="M${10 + i * 90} 840 l-20 -70 h50 l-20 70z" fill="${['#8bd16a', '#e8709a', '#5b7cff'][i]}" opacity="0.8"/>`).join('')}`;
    return s;
  };
  B.studio = (t) => B.forest(t);
})();
