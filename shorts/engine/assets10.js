// Casas "realistas" con perspectiva: habitación, cocina, sala y calle de noche.
// Paredes con degradado, suelo de madera con fuga, techo, ventana, luz de lámpara y sombras en esquinas.
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp } = window.SH;
  const VP = [540, 640];                 // punto de fuga
  const BW = [70, 1010], BY = [230, 1290]; // pared del fondo (x, y)

  function room(o) {
    const id = o.id;
    let s = `<defs>
      <radialGradient id="${id}w" cx="0.5" cy="0.4" r="0.8"><stop offset="0" stop-color="${o.wall[0]}"/><stop offset="1" stop-color="${o.wall[1]}"/></radialGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${o.side[1]}"/><stop offset="1" stop-color="${o.side[0]}"/></linearGradient>
      <linearGradient id="${id}s2" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="${o.side[1]}"/><stop offset="1" stop-color="${o.side[0]}"/></linearGradient>
      <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.floor[0]}"/><stop offset="1" stop-color="${o.floor[1]}"/></linearGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.ceil[1]}"/><stop offset="1" stop-color="${o.ceil[0]}"/></linearGradient>
      <radialGradient id="${id}l" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${o.light || '#ffe2a8'}" stop-opacity="0.55"/><stop offset="1" stop-color="${o.light || '#ffe2a8'}" stop-opacity="0"/></radialGradient>
    </defs>`;
    // techo, paredes laterales, fondo, suelo
    s += `<polygon points="-900,-900 1980,-900 ${BW[1]},${BY[0]} ${BW[0]},${BY[0]}" fill="url(#${id}c)"/>`;
    s += `<polygon points="-900,-900 ${BW[0]},${BY[0]} ${BW[0]},${BY[1]} -900,2900" fill="url(#${id}s)"/>`;
    s += `<polygon points="1980,-900 ${BW[1]},${BY[0]} ${BW[1]},${BY[1]} 1980,2900" fill="url(#${id}s2)"/>`;
    s += `<rect x="${BW[0]}" y="${BY[0]}" width="${BW[1] - BW[0]}" height="${BY[1] - BY[0]}" fill="url(#${id}w)"/>`;
    if (o.pattern) for (let x = BW[0] + 40; x < BW[1]; x += 80) s += `<rect x="${x}" y="${BY[0]}" width="26" height="${BY[1] - BY[0]}" fill="#fff" opacity="0.05"/>`;
    s += `<polygon points="${BW[0]},${BY[1]} ${BW[1]},${BY[1]} 1980,2900 -900,2900" fill="url(#${id}f)"/>`;
    // tablas del suelo con fuga
    for (let i = -10; i <= 10; i++) { const x0 = 540 + i * 50; const k = (2900 - VP[1]) / (BY[1] - VP[1]); const x1 = VP[0] + (x0 - VP[0]) * k; s += `<path d="M${x0} ${BY[1]} L${x1.toFixed(0)} 2900" stroke="#000" stroke-width="3" opacity="0.12"/>`; }
    [1330, 1400, 1500, 1640, 1840, 2120].forEach((y) => (s += `<path d="M-900 ${y} H1980" stroke="#000" stroke-width="2" opacity="0.07"/>`));
    // zócalo y sombras de esquina (oclusión)
    s += `<rect x="${BW[0]}" y="${BY[1] - 24}" width="${BW[1] - BW[0]}" height="24" fill="${o.trim || '#e8e2d6'}"/>`;
    s += `<path d="M${BW[0]} ${BY[0]} V${BY[1]} M${BW[1]} ${BY[0]} V${BY[1]}" stroke="#000" stroke-width="16" opacity="0.12"/>`;
    s += `<path d="M${BW[0]} ${BY[1]} H${BW[1]}" stroke="#000" stroke-width="12" opacity="0.15"/>`;
    // ventana
    if (o.window) {
      const [wx, wy, ww, wh] = o.window;
      const sky = o.sky || 'night';
      s += `<rect x="${wx - 14}" y="${wy - 14}" width="${ww + 28}" height="${wh + 28}" rx="8" fill="#f2efe8"/>`;
      if (sky === 'night') { s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="#141a3a"/><circle cx="${wx + ww * 0.7}" cy="${wy + wh * 0.3}" r="34" fill="#f4efd6"/>`; const r = rng(3); for (let i = 0; i < 14; i++) s += `<circle cx="${(wx + r() * ww).toFixed(0)}" cy="${(wy + r() * wh * 0.8).toFixed(0)}" r="2.5" fill="#fff" opacity=".8"/>`; s += `<path d="M${wx} ${wy + wh} l40 -60 l40 30 l50 -80 l60 60 l50 -30 l${ww - 240} 80Z" fill="#0b0f22"/>`; }
      else { s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="#9fd4f5"/><circle cx="${wx + ww * 0.3}" cy="${wy + wh * 0.35}" r="46" fill="#fff3b0"/><path d="M${wx} ${wy + wh} q${ww * 0.3} -70 ${ww * 0.6} -20 t${ww * 0.4} -10 v30Z" fill="#7cc35a"/>`; }
      s += `<path d="M${wx + ww / 2} ${wy} V${wy + wh} M${wx} ${wy + wh / 2} H${wx + ww}" stroke="#f2efe8" stroke-width="12"/>`;
      s += `<path d="M${wx - 40} ${wy - 40} q20 ${wh / 2} 0 ${wh + 80} h60 q-30 ${-wh / 2} 0 ${-wh - 80}Z" fill="${o.curtain || '#c2435a'}"/><path d="M${wx + ww + 40} ${wy - 40} q-20 ${wh / 2} 0 ${wh + 80} h-60 q30 ${-wh / 2} 0 ${-wh - 80}Z" fill="${o.curtain || '#c2435a'}"/>`;
      s += `<rect x="${wx - 70}" y="${wy - 56}" width="${ww + 140}" height="16" rx="8" fill="#7a5032"/>`;
    }
    if (o.lamp) s += `<circle cx="${o.lamp[0]}" cy="${o.lamp[1]}" r="${o.lamp[2]}" fill="url(#${id}l)"/>`;
    return s;
  }
  const ROOMS = {
    bedroomNight: { id: 'bdn', wall: ['#4a5a8a', '#2a3358'], side: ['#3a4876', '#1c2342'], floor: ['#7a5a42', '#3e2c20'], ceil: ['#2a3150', '#1a1f38'], window: [620, 380, 300, 340], sky: 'night', lamp: [200, 900, 420], pattern: true, curtain: '#5b7cff' },
    bedroomDay: { id: 'bdd', wall: ['#f2d6b0', '#d8b48a'], side: ['#e2c49c', '#b8946a'], floor: ['#c98d5a', '#8a5a36'], ceil: ['#f6e6cc', '#e2ccaa'], window: [620, 380, 300, 340], sky: 'day', lamp: [770, 560, 520], light: '#fff6d0', pattern: true, curtain: '#5b7cff' },
    kitchenNight: { id: 'ktn', wall: ['#5a8a8a', '#2e4a50'], side: ['#4a7272', '#22363c'], floor: ['#8a8f99', '#4a4f5a'], ceil: ['#2e4448', '#1c2a2e'], window: [140, 360, 260, 260], sky: 'night', lamp: [540, 300, 520], light: '#fff3c4', trim: '#c9d2dd' },
    livingNight: { id: 'lvn', wall: ['#7a5a8a', '#3e2c4e'], side: ['#664a76', '#2c1f3a'], floor: ['#8a6a4a', '#46301e'], ceil: ['#3a2a48', '#22182e'], window: [700, 380, 260, 300], sky: 'night', lamp: [190, 760, 400], curtain: '#e8a24a' },
  };
  Object.entries(ROOMS).forEach(([k, o]) => { let cache = null; B[k] = () => (cache = cache || room(o)); });

  // ---------- muebles (con volumen al usar el filtro 'vol') ----------
  A.bed3 = function (p) {
    return `<rect x="-300" y="-330" width="70" height="330" rx="18" fill="#7a5032"/><rect x="-300" y="-180" width="600" height="150" rx="30" fill="#e8e8f0"/><rect x="-230" y="-200" width="200" height="70" rx="30" fill="#fff"/>
      <path d="M-120 -175 h400 q30 0 30 30 v100 h-430Z" fill="${p.blanket || '#5b7cff'}"/><path d="M-120 -120 h430" stroke="#fff" stroke-width="8" opacity=".35"/><rect x="-300" y="-40" width="620" height="40" rx="12" fill="#5a3a22"/>`;
  };
  A.nightstand = function (p, c) {
    let s = `<rect x="-90" y="-180" width="180" height="180" rx="14" fill="#8a5a36"/><rect x="-74" y="-150" width="148" height="56" rx="8" fill="#a8743f"/><circle cy="-122" r="8" fill="#f2c230"/>`;
    s += `<rect x="-14" y="-300" width="28" height="120" fill="#c9ccd1"/><path d="M-80 -300 L80 -300 L50 -400 L-50 -400Z" fill="#ffe2a8"/>`;
    return s;
  };
  A.wallClock = function (p, c) { return A.clock({ hours: p.hours ?? 0 }, c); };
  A.poster = function (p) { return `<rect x="-120" y="-160" width="240" height="320" rx="8" fill="#fff"/><rect x="-104" y="-144" width="208" height="288" fill="${p.color || '#e5484d'}"/><circle cy="-30" r="60" fill="#ffd84a"/><path d="M-104 144 L-20 30 L40 90 L104 20 V144Z" fill="#2a2a32"/>`; };
  A.rug = function (p) { return `<ellipse rx="380" ry="90" fill="${p.color || '#c2435a'}"/><ellipse rx="320" ry="68" fill="none" stroke="#fff" stroke-width="8" opacity=".4"/>`; };
  A.sofa = function (p) { return `<rect x="-360" y="-280" width="720" height="200" rx="60" fill="${p.color || '#5a7a9a'}"/><rect x="-390" y="-150" width="780" height="130" rx="44" fill="${A._shade(p.color || '#5a7a9a', 0.1)}"/><rect x="-410" y="-230" width="100" height="220" rx="44" fill="${A._shade(p.color || '#5a7a9a', -0.15)}"/><rect x="310" y="-230" width="100" height="220" rx="44" fill="${A._shade(p.color || '#5a7a9a', -0.15)}"/><rect x="-330" y="-20" width="30" height="30" fill="#2a1f18"/><rect x="300" y="-20" width="30" height="30" fill="#2a1f18"/>`; };
  A.tvSet = function (p, c) {
    const fl = 0.6 + 0.4 * Math.abs(Math.sin(c.t * 7));
    return `<rect x="-200" y="-40" width="400" height="40" rx="10" fill="#5a3a22"/><rect x="-260" y="-360" width="520" height="300" rx="16" fill="#16161c"/><rect x="-240" y="-340" width="480" height="260" rx="8" fill="#5b8ad6" opacity="${fl.toFixed(2)}"/><rect x="-20" y="-60" width="40" height="24" fill="#16161c"/>`;
  };
  A.plant = function () { return `<path d="M-60 0 L-46 -120 H46 L60 0Z" fill="#c2643a"/>${[...Array(7)].map((_, i) => `<ellipse cx="${-60 + i * 20}" cy="${-170 - (i % 3) * 30}" rx="26" ry="70" fill="${i % 2 ? '#3f8a3a' : '#5fae4a'}" transform="rotate(${-40 + i * 13} ${-60 + i * 20} ${-170 - (i % 3) * 30})"/>`).join('')}`; };
  A.counter = function (p) {
    let s = `<rect x="-500" y="-330" width="1000" height="330" fill="#d9d2c2"/><rect x="-520" y="-350" width="1040" height="34" rx="8" fill="#f2efe6"/>`;
    for (let i = 0; i < 4; i++) s += `<rect x="${-480 + i * 245}" y="-300" width="220" height="280" rx="10" fill="#c9c0aa"/><rect x="${-390 + i * 245}" y="-180" width="40" height="10" rx="5" fill="#8a8f99"/>`;
    s += `<g transform="translate(240,-460)"><rect x="-130" y="-110" width="260" height="140" rx="14" fill="#2a2a32"/><rect x="-110" y="-90" width="150" height="100" rx="8" fill="#0d1a1f"/><text x="96" y="-30" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="#5af0a0">${p.clock || '3:00'}</text></g>`;
    return s;
  };
  A.thought = function (p, c) { // bocadillo de pensamiento vacío (para conectar con el cerebro)
    return `<circle cx="-120" cy="140" r="16" fill="#fff"/><circle cx="-80" cy="90" r="24" fill="#fff"/><ellipse rx="140" ry="110" fill="#fff"/>`;
  };
})();
