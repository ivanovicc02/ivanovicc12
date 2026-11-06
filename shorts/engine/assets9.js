// Kit "explicador": caras para cualquier objeto, cerebro personaje, monitor en vivo, reloj, batería,
// escoba, escudo, comida, fondos de foco de color. Estilo inspirado en vídeos de divulgación animados.
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp, lerp, ease } = window.SH;
  const W = 1080, H = 1920;

  // ---------- fondos de foco (radial + viñeta) ----------
  const SPOTS = { Teal: ['#2f8f8a', '#0e2f36'], Blue: ['#3f6fd6', '#0f1a44'], Red: ['#c2435a', '#3a0f1e'], Purple: ['#8a5ad6', '#25124a'], Warm: ['#f0a04a', '#5a2a14'], Night: ['#3a3f7a', '#0b0c22'], Sepia: ['#d9b98a', '#5a4026'] };
  Object.entries(SPOTS).forEach(([k, [c1, c2]]) => {
    B['spot' + k] = (t) => {
      const r = rng(k.length * 7);
      let s = `<defs><radialGradient id="sp${k}" cx="0.5" cy="0.42" r="0.75"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>`;
      s += `<rect x="-1200" y="-1200" width="3480" height="4320" fill="url(#sp${k})"/>`;
      for (let i = 0; i < 26; i++) { const x = r() * 1500 - 200, y = r() * 2200 - 150, rr = 3 + r() * 6; s += `<circle cx="${x.toFixed(0)}" cy="${(y - ((t || 0) * (10 + r() * 20)) % 2200).toFixed(0)}" r="${rr.toFixed(1)}" fill="#fff" opacity="${(0.05 + r() * 0.12).toFixed(2)}"/>`; }
      return s;
    };
  });

  // ---------- cara para cualquier objeto ----------
  // p: {mood: happy|tired|sleep|dizzy|scared|hungry|neutral|talk, look:[x,y], size, seed}
  A.faceOn = function (p, c) {
    const S = p.size || 1, mood = p.mood || 'happy', t = c.t + (p.seed || 0);
    const blink = ((t * 0.8) % 3.2) < 0.12 ? 0.12 : 1;
    const look = p.look || [Math.sin(t * 0.7) * 0.3, 0];
    let s = `<g transform="scale(${S})">`;
    const lid = mood === 'tired' ? 0.45 : mood === 'sleep' ? 1 : 0;
    [-1, 1].forEach((k) => {
      const ex = k * 48, ey = 0;
      if (mood === 'dizzy') {
        s += `<circle cx="${ex}" cy="${ey}" r="30" fill="#fff"/><path d="${[...Array(18)].map((_, i) => { const a = i * 0.7 + t * 6 * k, rr = 2 + i * 1.4; return `${i ? 'L' : 'M'}${(ex + Math.cos(a) * rr).toFixed(1)} ${(ey + Math.sin(a) * rr).toFixed(1)}`; }).join('')}" stroke="#1d1d24" stroke-width="5" fill="none"/>`;
      } else if (mood === 'sleep') {
        s += `<path d="M${ex - 26} ${ey} q26 22 52 0" stroke="#1d1d24" stroke-width="8" fill="none" stroke-linecap="round"/>`;
      } else {
        const big = mood === 'scared' ? 1.25 : 1;
        s += `<ellipse cx="${ex}" cy="${ey}" rx="${28 * big}" ry="${(34 * big * blink).toFixed(1)}" fill="#fff"/>`;
        if (blink > 0.5) s += `<circle cx="${(ex + look[0] * 10).toFixed(1)}" cy="${(ey + look[1] * 10 + 4).toFixed(1)}" r="${mood === 'scared' ? 11 : 16}" fill="#1d1d24"/><circle cx="${(ex + look[0] * 10 + 5).toFixed(1)}" cy="${(ey + look[1] * 10 - 2).toFixed(1)}" r="5" fill="#fff"/>`;
        if (lid > 0) s += `<path d="M${ex - 32} ${ey - 36} h64 v${(68 * lid).toFixed(0)} h-64Z" fill="${p.lidColor || '#e98aa0'}"/><path d="M${ex - 32} ${(ey - 36 + 68 * lid).toFixed(0)} h64" stroke="#1d1d24" stroke-width="6" stroke-linecap="round"/>`;
      }
      if (mood === 'tired' || mood === 'dizzy' || p.bags) s += `<path d="M${ex - 26} ${ey + 42} q26 14 52 0" stroke="#7a4a8a" stroke-width="7" fill="none" opacity="0.6" stroke-linecap="round"/>`;
    });
    const my = 74;
    if (mood === 'happy' || mood === 'talk') { const o = mood === 'talk' ? Math.abs(Math.sin(t * 11)) * 14 : 0; s += `<path d="M-34 ${my - 6} Q0 ${my + 22 + o} 34 ${my - 6} Q0 ${my + 4} -34 ${my - 6}Z" fill="#7a2a2a"/>`; }
    else if (mood === 'scared') s += `<ellipse cx="0" cy="${my + 4}" rx="20" ry="26" fill="#5a1f24"/>`;
    else if (mood === 'hungry') s += `<path d="M-34 ${my} Q0 ${my + 26} 34 ${my}" stroke="#5a1f24" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M20 ${my + 10} q6 30 0 ${36 + Math.sin(t * 3) * 6}" stroke="#7fd0ff" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    else if (mood === 'sleep') s += `<ellipse cx="0" cy="${my}" rx="12" ry="9" fill="#5a1f24"/>`;
    else if (mood === 'dizzy') s += `<path d="M-30 ${my} q10 -12 20 0 t20 0 t20 0" stroke="#5a1f24" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    else s += `<path d="M-26 ${my} q26 -8 52 0" stroke="#5a1f24" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    return s + `</g>`;
  };

  // ---------- cerebro personaje ----------
  // p: {mood, tired 0..1 (se apaga el color), dirt 0..1 (manchas), glow, seed}
  A.brain = function (p, c) {
    const tired = clamp(p.tired ?? 0, 0, 1);
    const base = A._shade('#ff8fb0', -0.35 * tired), dark = A._shade(base, -0.18);
    const br = 1 + Math.sin(c.t * 2.2) * 0.015;
    let s = `<g transform="scale(${br.toFixed(3)},${(2 - br).toFixed(3)})">`;
    s += `<ellipse cx="0" cy="40" rx="250" ry="40" fill="#000" opacity="0.18" transform="translate(0,190)"/>`;
    [[-130, -40, 130], [-40, -110, 140], [80, -100, 140], [150, 0, 120], [-150, 70, 110], [0, 40, 170], [110, 90, 120]].forEach(([x, y, r]) => (s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${base}"/>`));
    s += `<path d="M0 -230 Q-20 -60 0 160" stroke="${dark}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    [[-180, -60, -90, -120], [-200, 60, -110, 20], [60, -170, 150, -80], [100, 60, 210, 20], [-90, 140, -20, 100], [30, 150, 120, 150]].forEach(([a, b, c2, d]) => (s += `<path d="M${a} ${b} Q${(a + c2) / 2} ${(b + d) / 2 - 40} ${c2} ${d}" stroke="${dark}" stroke-width="10" fill="none" stroke-linecap="round"/>`));
    const dirt = clamp(p.dirt ?? 0, 0, 1);
    if (dirt > 0) { const r = rng(9); for (let i = 0; i < 14; i++) s += `<ellipse cx="${(r() * 420 - 210).toFixed(0)}" cy="${(r() * 330 - 200).toFixed(0)}" rx="${(14 + r() * 24).toFixed(0)}" ry="${(10 + r() * 16).toFixed(0)}" fill="#6a6a5a" opacity="${(dirt * 0.75).toFixed(2)}"/>`; }
    s += `<ellipse cx="-90" cy="-150" rx="60" ry="26" fill="#fff" opacity="0.25"/>`;
    s += `<g transform="translate(0,10)">${A.faceOn({ mood: p.mood || 'happy', look: p.look, size: 1.15, seed: p.seed, lidColor: base }, c)}</g>`;
    return s + `</g>`;
  };

  // partículas de "sueño" (adenosina) acumulándose
  A.particlesIn = function (p, c) {
    const n = Math.floor(p.n ?? 20), r = rng(p.seed || 3);
    let s = '';
    for (let i = 0; i < n; i++) { const x = r() * 420 - 210, y = r() * 300 - 180, k = clamp((c.lt - i * 0.08) / 0.3, 0, 1); s += `<circle cx="${(x + Math.sin(c.t * 2 + i) * 8).toFixed(0)}" cy="${(y + Math.cos(c.t * 1.7 + i) * 8).toFixed(0)}" r="${(14 * ease.back(k)).toFixed(1)}" fill="${p.color || '#b07cff'}" stroke="#fff" stroke-width="3"/>`; }
    return s;
  };

  // ---------- monitor con línea en vivo ----------
  // p: {title, color, level 0..1 (altura media), noise, spike: tiempo local del pico}
  A.monitor = function (p, c) {
    const w = 640, h = 360, col = p.color || '#5af0a0';
    let s = `<rect x="${-w / 2 - 22}" y="${-h / 2 - 22}" width="${w + 44}" height="${h + 44}" rx="26" fill="#d9dde3"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="12" fill="#0d1a1f"/>`;
    for (let i = 1; i < 6; i++) s += `<path d="M${-w / 2} ${-h / 2 + i * h / 6} h${w}" stroke="#1f3a40" stroke-width="2"/>`;
    s += `<text x="${-w / 2 + 20}" y="${-h / 2 + 40}" font-family="Inter" font-weight="800" font-size="28" fill="${col}">${p.title || ''}</text>`;
    let d = '';
    const lvl = clamp(p.level ?? 0.5, 0, 1);
    for (let i = 0; i <= 80; i++) {
      const x = -w / 2 + 10 + i * (w - 20) / 80, tt = c.t * 2 + i * 0.15;
      let y = h / 2 - 30 - lvl * (h - 90) + Math.sin(tt * 3) * 6 * (p.noise ?? 1) + Math.sin(tt * 7.3) * 4 * (p.noise ?? 1);
      if (p.spikeAt != null) { const dd = i / 80 - clamp((c.lt - p.spikeAt) * 0.6, 0, 1.4); if (Math.abs(dd) < 0.05) y -= 100 * (1 - Math.abs(dd) / 0.05); }
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    s += `<path d="${d}" stroke="${col}" stroke-width="7" fill="none" stroke-linejoin="round"/>`;
    s += `<circle cx="${w / 2 - 30}" cy="${-h / 2 + 30}" r="10" fill="#e5484d" opacity="${(0.5 + 0.5 * Math.sin(c.t * 6)).toFixed(2)}"/>`;
    return s;
  };

  // ---------- reloj analógico con horas que avanzan ----------
  A.clock = function (p, c) {
    const hrs = p.hours ?? 0;
    let s = `<circle r="200" fill="#fff" stroke="#2a2a32" stroke-width="22"/><rect x="-26" y="-250" width="52" height="40" rx="10" fill="#2a2a32"/>`;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<path d="M${(Math.sin(a) * 165).toFixed(1)} ${(-Math.cos(a) * 165).toFixed(1)} L${(Math.sin(a) * 185).toFixed(1)} ${(-Math.cos(a) * 185).toFixed(1)}" stroke="#2a2a32" stroke-width="${i % 3 ? 6 : 12}"/>`; }
    const ah = hrs / 12 * 360, am = (hrs % 1) * 360 + hrs * 360 * 0;
    s += `<path d="M0 0 L0 -100" stroke="#2a2a32" stroke-width="18" stroke-linecap="round" transform="rotate(${ah.toFixed(1)})"/>`;
    s += `<path d="M0 0 L0 -150" stroke="#e5484d" stroke-width="10" stroke-linecap="round" transform="rotate(${((hrs * 360) % 360).toFixed(1)})"/><circle r="16" fill="#2a2a32"/>`;
    return s;
  };

  A.battery = function (p) {
    const l = clamp(p.level ?? 1, 0, 1), col = l < 0.25 ? '#e5484d' : l < 0.5 ? '#ffb04a' : '#2bb673';
    return `<rect x="-90" y="-170" width="180" height="320" rx="30" fill="none" stroke="#fff" stroke-width="18"/><rect x="-40" y="-200" width="80" height="30" rx="8" fill="#fff"/><rect x="-66" y="${(126 - 272 * l).toFixed(0)}" width="132" height="${(272 * l).toFixed(0)}" rx="14" fill="${col}"/>`;
  };
  A.shield = function (p, c) {
    const cr = clamp(p.crack ?? 0, 0, 1);
    let s = `<path d="M0 -160 L130 -110 Q130 60 0 160 Q-130 60 -130 -110Z" fill="#5b9cff" stroke="#fff" stroke-width="12"/><path d="M0 -120 L90 -84 Q90 40 0 116Z" fill="#fff" opacity="0.2"/>`;
    if (cr > 0) s += `<path d="M-20 -150 L10 -80 L-30 -20 L20 40 L-10 100" stroke="#1d1d24" stroke-width="${(10 * cr).toFixed(1)}" fill="none" stroke-linejoin="round"/>`;
    return s;
  };
  A.broom = function (p, c) {
    return `<g transform="rotate(${(-30 + Math.sin(c.t * 9) * 22).toFixed(1)})"><rect x="-10" y="-320" width="20" height="300" rx="8" fill="#a8743f"/><path d="M-70 -30 L70 -30 L90 60 L-90 60Z" fill="#f2c230"/>${[...Array(8)].map((_, i) => `<path d="M${-80 + i * 22} 0 l-6 60" stroke="#c99a1a" stroke-width="5"/>`).join('')}</g>`;
  };
  A.sparkle = function (p, c) {
    let s = '';
    for (let i = 0; i < 6; i++) { const u = ((c.t * 1.2 + i / 6) % 1), a = i * 1.05; s += `<path d="M0 -26 L6 -6 L26 0 L6 6 L0 26 L-6 6 L-26 0 L-6 -6Z" fill="#fff" transform="translate(${(Math.cos(a) * (60 + u * 160)).toFixed(0)},${(Math.sin(a) * (60 + u * 160)).toFixed(0)}) scale(${(1 - u).toFixed(2)})"/>`; }
    return s;
  };
  A.junk = function (p) {
    if (p.kind === 'burger') return `<path d="M-130 -10 Q-130 -120 0 -120 Q130 -120 130 -10Z" fill="#e8a24a"/>${[...Array(6)].map((_, i) => `<ellipse cx="${-70 + i * 28}" cy="${-80 + (i % 2) * 14}" rx="6" ry="3" fill="#fff6d8"/>`).join('')}<rect x="-140" y="-14" width="280" height="22" rx="10" fill="#5fae4a"/><rect x="-135" y="8" width="270" height="40" rx="18" fill="#7a3a22"/><rect x="-140" y="48" width="280" height="16" fill="#ffd84a"/><path d="M-130 64 h260 q0 50 -130 50 q-130 0 -130 -50Z" fill="#e8a24a"/>`;
    if (p.kind === 'donut') return `<circle r="120" fill="#e0a868"/><circle r="110" fill="#ff7aa8"/><circle r="40" fill="#0000" stroke="#e0a868" stroke-width="16"/>${[...Array(12)].map((_, i) => `<rect x="${(Math.cos(i) * 75).toFixed(0)}" y="${(Math.sin(i * 1.7) * 70).toFixed(0)}" width="20" height="7" rx="3" fill="${['#ffd84a', '#5b9cff', '#fff'][i % 3]}" transform="rotate(${i * 40} ${(Math.cos(i) * 75).toFixed(0)} ${(Math.sin(i * 1.7) * 70).toFixed(0)})"/>`).join('')}<circle r="34" fill="#00000000"/>`;
    if (p.kind === 'salad') return `<path d="M-140 -10 Q-130 110 0 110 Q130 110 140 -10Z" fill="#fff"/>${[...Array(9)].map((_, i) => `<circle cx="${-100 + i * 25}" cy="${-20 - (i % 3) * 18}" r="34" fill="${['#5fae4a', '#7fc35a', '#e5484d'][i % 3]}"/>`).join('')}<path d="M-150 -10 h300" stroke="#e8e8e0" stroke-width="12"/>`;
    if (p.kind === 'bottle') return `<rect x="-55" y="-120" width="110" height="230" rx="30" fill="#7a5a2a" opacity="0.9"/><rect x="-22" y="-210" width="44" height="100" rx="10" fill="#7a5a2a"/><rect x="-24" y="-226" width="48" height="24" rx="6" fill="#e5484d"/><rect x="-55" y="-40" width="110" height="80" fill="#f6efe0"/><text y="12" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="#7a5a2a">ALC</text>`;
    if (p.kind === 'bed') return `<rect x="-220" y="-60" width="440" height="110" rx="20" fill="#5b7cff"/><rect x="-220" y="-170" width="60" height="230" rx="16" fill="#7a5032"/><rect x="160" y="-110" width="60" height="170" rx="16" fill="#7a5032"/><ellipse cx="-110" cy="-80" rx="60" ry="34" fill="#fff"/><rect x="-60" y="-80" width="250" height="40" rx="14" fill="#7fa0ff"/>`;
    return '';
  };
  // fantasmas / alucinaciones
  A.ghost = function (p, c) {
    const wob = Math.sin(c.t * 3 + (p.seed || 0)) * 12;
    return `<g transform="translate(0,${wob.toFixed(1)})" opacity="${(0.55 + 0.25 * Math.sin(c.t * 2 + (p.seed || 0))).toFixed(2)}"><path d="M-80 60 V-40 Q-80 -120 0 -120 Q80 -120 80 -40 V60 l-27 -20 l-27 20 l-26 -20 l-26 20 l-27 -20Z" fill="#e8f4ff"/><ellipse cx="-28" cy="-40" rx="14" ry="20" fill="#1d1d24"/><ellipse cx="28" cy="-40" rx="14" ry="20" fill="#1d1d24"/><ellipse cx="0" cy="10" rx="14" ry="18" fill="#1d1d24"/></g>`;
  };
})();
