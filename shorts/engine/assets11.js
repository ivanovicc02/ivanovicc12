// Kit "cuerpo y comida": estómago, bacterias, corazón, papas, refresco, salero, gotas, báscula, bocadillo de texto, baño.
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp, ease } = window.SH;

  A.fries = () => `<path d="M-90 -60 L90 -60 L70 120 L-70 120Z" fill="#e5484d"/>${[...Array(9)].map((_, i) => `<rect x="${-80 + i * 19}" y="${-150 - (i % 3) * 22}" width="16" height="120" rx="5" fill="#ffd36e" transform="rotate(${-10 + i * 2.5} ${-72 + i * 19} -60)"/>`).join('')}<path d="M-90 -60 Q0 0 90 -60 L80 0 Q0 40 -80 0Z" fill="#c2353a"/><circle cy="40" r="30" fill="#ffd84a"/>`;
  A.soda = () => `<path d="M-70 -150 L70 -150 L55 140 L-55 140Z" fill="#e5484d"/><rect x="-80" y="-170" width="160" height="26" rx="10" fill="#fff"/><path d="M20 -170 L50 -260" stroke="#fff" stroke-width="14" stroke-linecap="round"/><path d="M-60 -40 Q0 -10 60 -40 V20 Q0 50 -60 20Z" fill="#fff"/><text y="10" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="#e5484d">COLA</text>`;
  A.salt = (p, c) => { let s = `<rect x="-70" y="-120" width="140" height="200" rx="40" fill="#f2f4f7"/><path d="M-70 -80 Q0 -170 70 -80Z" fill="#c9ccd1"/>${[-30, 0, 30].map((x) => `<circle cx="${x}" cy="-118" r="7" fill="#7a7f88"/>`).join('')}<text y="20" text-anchor="middle" font-family="Inter" font-weight="900" font-size="44" fill="#5b7cff">SAL</text>`; for (let i = 0; i < 12; i++) { const u = ((c.t * 1.2 + i / 12) % 1); s += `<rect x="${(-30 + (i % 5) * 15).toFixed(0)}" y="${(-150 - u * -420).toFixed(0)}" width="10" height="10" fill="#fff" opacity="${(1 - u).toFixed(2)}"/>`; } return s; };
  A.drop = (p, c) => `<path d="M0 -120 Q80 -10 70 40 Q60 110 0 110 Q-60 110 -70 40 Q-80 -10 0 -120Z" fill="#5bb8f0"/><ellipse cx="-26" cy="-10" rx="14" ry="26" fill="#fff" opacity=".4"/><g transform="translate(0,40) scale(0.55)">${A.faceOn({ mood: p.mood || 'happy', seed: p.seed }, c)}</g>`;

  A.stomach = function (p, c) {
    const wob = 1 + Math.sin(c.t * 3) * 0.02 * (p.full ? 2 : 1);
    const col = p.color || '#ff8fb0';
    let s = `<g transform="scale(${wob.toFixed(3)},${(2 - wob).toFixed(3)})"><path d="M-40 -260 Q-40 -200 -90 -170 Q-240 -80 -200 80 Q-160 230 20 220 Q200 210 220 40 Q230 -100 120 -120 Q40 -130 20 -200 L20 -260Z" fill="${col}"/>`;
    s += `<path d="M-160 90 Q-60 180 120 120" stroke="${A._shade(col, -0.2)}" stroke-width="10" fill="none" opacity=".6"/>`;
    if (p.fill) s += `<path d="M-200 ${(160 - 200 * p.fill).toFixed(0)} Q0 ${(130 - 200 * p.fill).toFixed(0)} 220 ${(150 - 200 * p.fill).toFixed(0)} L200 120 Q160 220 20 220 Q-160 230 -200 80Z" fill="#c98d4a" opacity=".55"/>`;
    s += `<g transform="translate(0,-10)">${A.faceOn({ mood: p.mood || 'happy', seed: p.seed, size: 0.95 }, c)}</g></g>`;
    return s;
  };
  A.bacteria = function (p, c) {
    const col = p.color || '#8bd16a', k = c.t * 2 + (p.seed || 0);
    let s = '';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += `<path d="M${(Math.cos(a) * 80).toFixed(0)} ${(Math.sin(a) * 70).toFixed(0)} q${(Math.cos(a + 0.6) * 20).toFixed(0)} ${(Math.sin(a + 0.6) * 20 + Math.sin(k + i) * 8).toFixed(0)} ${(Math.cos(a) * 30).toFixed(0)} ${(Math.sin(a) * 30).toFixed(0)}" stroke="${A._shade(col, -0.2)}" stroke-width="10" fill="none" stroke-linecap="round"/>`; }
    s += `<ellipse rx="${(90 + Math.sin(k) * 5).toFixed(1)}" ry="${(76 - Math.sin(k) * 5).toFixed(1)}" fill="${col}"/>`;
    s += `<g transform="scale(0.6)">${A.faceOn({ mood: p.mood || 'happy', seed: p.seed }, c)}</g>`;
    return s;
  };
  A.heartChar = function (p, c) {
    const beat = 1 + Math.max(0, Math.sin(c.t * (p.fast ? 9 : 5))) * 0.06;
    let s = `<g transform="scale(${beat.toFixed(3)})"><path d="M0 200 C-260 40 -230 -170 -110 -170 C-50 -170 -10 -130 0 -90 C10 -130 50 -170 110 -170 C230 -170 260 40 0 200Z" fill="#e5484d"/>`;
    if (p.fat) { const r = rng(4); for (let i = 0; i < 9; i++) s += `<circle cx="${(r() * 260 - 130).toFixed(0)}" cy="${(r() * 220 - 120).toFixed(0)}" r="${(16 + r() * 18).toFixed(0)}" fill="#ffd84a" opacity="${(0.85 * p.fat).toFixed(2)}"/>`; }
    s += `<g transform="translate(0,-10)">${A.faceOn({ mood: p.mood || 'happy', seed: p.seed }, c)}</g></g>`;
    return s;
  };
  A.scaleBath = function (p, c) {
    const n = Math.round(p.kg ?? 70);
    return `<rect x="-200" y="-70" width="400" height="80" rx="30" fill="#e8e8ee"/><rect x="-80" y="-55" width="160" height="50" rx="10" fill="#0d1a1f"/><text y="-17" text-anchor="middle" font-family="Inter" font-weight="900" font-size="38" fill="${p.alert ? '#ff6a6a' : '#5af0a0'}">${n} kg</text>`;
  };
  A.speech = function (p) {
    const t = p.text || '¡MÁS!', w = Math.max(220, t.length * 52 + 60);
    return `<rect x="${-w / 2}" y="-90" width="${w}" height="150" rx="50" fill="#fff"/><path d="M-40 55 L-90 120 L10 58Z" fill="#fff"/><text y="15" text-anchor="middle" font-family="Inter" font-weight="900" font-size="80" fill="${p.color || '#e5484d'}">${t}</text>`;
  };
  A.intestine = function (p, c) {
    let d = 'M-500 -300';
    for (let i = 0; i < 6; i++) d += ` q500 ${(i % 2 ? -1 : 1) * 0} 1000 0 m-1000 0`;
    let s = '';
    for (let i = 0; i < 6; i++) { const y = -500 + i * 220; s += `<path d="M-700 ${y} C-300 ${y - 90} 300 ${y + 90} 1700 ${y}" stroke="#ff9ab4" stroke-width="150" fill="none" opacity="0.35" stroke-linecap="round"/>`; }
    return s;
  };

  // baño (añadido a las casas con perspectiva)
  if (B.bedroomDay) {
    const base = B.bedroomDay;
    B.bathroomDay = () => {
      let s = base();
      s = s.replace(/#f2d6b0/g, '#d6ecf2').replace(/#d8b48a/g, '#a8cfd9').replace(/#e2c49c/g, '#bfe0e8').replace(/#b8946a/g, '#8ab8c4').replace(/#c98d5a/g, '#e8eef2').replace(/#8a5a36/g, '#b9c3cf');
      for (let y = 300; y < 1280; y += 70) s += `<path d="M70 ${y} H1010" stroke="#fff" stroke-width="3" opacity=".45"/>`;
      for (let x = 110; x < 1010; x += 70) s += `<path d="M${x} 230 V1290" stroke="#fff" stroke-width="3" opacity=".45"/>`;
      s += `<rect x="300" y="380" width="260" height="340" rx="20" fill="#cfe8f0" stroke="#e8eef2" stroke-width="16"/><ellipse cx="380" cy="470" rx="40" ry="80" fill="#fff" opacity=".35"/>`;
      return s;
    };
  }
})();
