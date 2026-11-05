// Biblioteca 2D: tema FUGA DE GAS (casa, puerta, interruptor, chispa, huevo, iconos, gas a ras de suelo,
// tanque con llave, explosión) + fondo de calle.
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp, lerp, ease } = window.SH;
  const W = 1080, H = 1920;
  const GAS = '#9bd36a';

  B.street = () => {
    let s = `<defs><linearGradient id="stsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f4a"/><stop offset="0.55" stop-color="#9c5878"/><stop offset="1" stop-color="#f6b36f"/></linearGradient></defs>`;
    s += `<rect x="-800" y="-800" width="${W + 1600}" height="2400" fill="url(#stsky)"/>`;
    s += `<rect x="-800" y="1560" width="${W + 1600}" height="80" fill="#9aa0aa"/><rect x="-800" y="1640" width="${W + 1600}" height="1200" fill="#3b3f4c"/>`;
    for (let x = -700; x < 1800; x += 220) s += `<rect x="${x}" y="1760" width="120" height="14" rx="7" fill="#e8e2c8"/>`;
    return s;
  };

  // casa vista desde fuera, con puerta que se abre (open 0..1) y gas saliendo
  A.house = function (p, c) {
    const open = clamp(p.open ?? 0, 0, 1);
    let s = `<rect x="-420" y="-760" width="840" height="760" fill="#e8b27a"/>`;
    s += `<path d="M-480 -740 L0 -1080 L480 -740Z" fill="#b8503e"/>`;
    s += `<rect x="-340" y="-600" width="200" height="180" rx="10" fill="#2a2f4a"/><rect x="140" y="-600" width="200" height="180" rx="10" fill="#2a2f4a"/>`;
    s += `<path d="M-240 -600 V-420 M-340 -510 H-140 M240 -600 V-420 M140 -510 H340" stroke="#e8b27a" stroke-width="10"/>`;
    // tanque de gas en la azotea
    s += `<g transform="translate(270,-1010)"><rect x="-90" y="-40" width="180" height="80" rx="40" fill="#f2f2ee"/><rect x="-70" y="40" width="20" height="40" fill="#8a8f99"/><rect x="50" y="40" width="20" height="40" fill="#8a8f99"/></g>`;
    // marco y puerta
    s += `<rect x="-120" y="-380" width="240" height="380" fill="#3a2a22"/>`;
    const dw = 240 * (1 - open * 0.8);
    s += `<rect x="-120" y="-380" width="${dw.toFixed(1)}" height="380" fill="#8a4f2e"/><circle cx="${(-120 + dw - 30).toFixed(1)}" cy="-190" r="12" fill="#f2c230"/>`;
    if (open > 0.1) {
      for (let i = 0; i < 6; i++) { const u = ((c.t * 0.5 + i / 6) % 1); s += `<path d="M${(-60 + i * 22).toFixed(0)} ${(-260 + u * -40).toFixed(0)} q30 -30 0 -60 q-30 -30 0 -60" stroke="${GAS}" stroke-width="12" fill="none" stroke-linecap="round" opacity="${(open * (1 - u) * 0.85).toFixed(2)}" transform="translate(${(u * 180).toFixed(0)},${(-u * 60).toFixed(0)})"/>`; }
    }
    s += `<rect x="-480" y="0" width="960" height="20" fill="#7d838c"/>`;
    return s;
  };

  // interruptor de pared; cut = vista "por dentro" con chispa (spark 0..1)
  A.lightSwitch = function (p, c) {
    let s = `<rect x="-120" y="-180" width="240" height="360" rx="26" fill="#f6f4ee" stroke="#c9c6bc" stroke-width="6"/>`;
    const on = p.on ? -1 : 1;
    s += `<rect x="-50" y="-90" width="100" height="180" rx="16" fill="#e8e5dc"/><rect x="-40" y="${on > 0 ? -10 : -80}" width="80" height="90" rx="14" fill="#fff" stroke="#c9c6bc" stroke-width="4"/>`;
    if (p.cut) {
      s += `<circle r="150" fill="#1a1a24" opacity="0.92"/><path d="M-100 40 H-20 M20 40 H100" stroke="#c9a050" stroke-width="18" stroke-linecap="round"/>`;
      const k = p.spark ?? 0;
      if (k > 0) for (let i = 0; i < 10; i++) { const a = i * 0.63 + c.t * 3; s += `<path d="M0 40 L${(Math.cos(a) * 90 * k).toFixed(0)} ${(40 + Math.sin(a) * 90 * k).toFixed(0)}" stroke="#ffe066" stroke-width="7" stroke-linecap="round" opacity="${(0.4 + 0.6 * Math.abs(Math.sin(c.t * 40 + i))).toFixed(2)}"/>`; }
      if (k > 0) s += `<circle cy="40" r="${(26 * k).toFixed(0)}" fill="#fff6c8"/>`;
    }
    return s;
  };

  // explosión (u = 0..1 tiempo desde el estallido)
  A.explosion = function (p, c) {
    const u = clamp(c.lt / 0.9, 0, 1);
    if (u >= 1) return '';
    const r = 200 + u * 900;
    return `<circle r="${r.toFixed(0)}" fill="#ffb04a" opacity="${(0.85 * (1 - u)).toFixed(2)}"/><circle r="${(r * 0.65).toFixed(0)}" fill="#ff6a2f" opacity="${(0.9 * (1 - u)).toFixed(2)}"/><circle r="${(r * 0.35).toFixed(0)}" fill="#fff3c4" opacity="${(1 - u).toFixed(2)}"/>`;
  };

  A.egg = function (p, c) {
    let s = `<path d="M-120 20 Q-130 -200 0 -230 Q130 -200 120 20 Q100 140 0 140 Q-100 140 -120 20Z" fill="#f6efe0"/>`;
    s += `<path d="M-120 -20 l40 30 l30 -40 l30 40 l30 -40 l30 40 l40 -30" stroke="#c9b48a" stroke-width="7" fill="none"/>`;
    for (let i = 0; i < 3; i++) { const u = ((c.t * 0.6 + i / 3) % 1); s += `<path d="M${-60 + i * 60} ${(-240 - u * 120).toFixed(0)} q-25 -30 0 -60 q25 -30 0 -60" stroke="${GAS}" stroke-width="12" fill="none" stroke-linecap="round" opacity="${(1 - u).toFixed(2)}"/>`; }
    return s;
  };
  A.flameIcon = function () {
    return `<circle r="140" fill="#2a3048"/><path d="M0 -100 C60 -40 90 0 70 50 C55 95 -55 95 -70 50 C-90 0 -40 -30 0 -100Z" fill="#5b9cff"/><path d="M0 -20 C30 10 40 30 30 55 C20 80 -20 80 -30 55 C-40 30 -20 10 0 -20Z" fill="#bfe0ff"/>`;
  };

  // iconos tachados
  A.noIcon = function (p, c) {
    const k = p.kind;
    let s = `<circle r="120" fill="#fff"/>`;
    if (k === 'luz') s += `<rect x="-40" y="-65" width="80" height="130" rx="14" fill="#e8e5dc" stroke="#9a978e" stroke-width="5"/><rect x="-25" y="-50" width="50" height="55" rx="8" fill="#fff" stroke="#9a978e" stroke-width="4"/>`;
    if (k === 'timbre') s += `<circle r="55" fill="#f2c230"/><circle r="28" fill="#c99a1a"/><path d="M60 -50 q20 20 0 40 M78 -66 q34 36 0 72" stroke="#5a5a5a" stroke-width="6" fill="none"/>`;
    if (k === 'enchufe') s += `<rect x="-55" y="-30" width="110" height="80" rx="16" fill="#2a2a30"/><rect x="-30" y="-75" width="14" height="50" rx="5" fill="#c9ccd1"/><rect x="16" y="-75" width="14" height="50" rx="5" fill="#c9ccd1"/><path d="M0 50 V90" stroke="#2a2a30" stroke-width="14"/>`;
    if (k === 'cerillo') s += `<path d="M-60 70 L50 -40" stroke="#e8c48a" stroke-width="16" stroke-linecap="round"/><circle cx="56" cy="-46" r="22" fill="#e5484d"/><path d="M60 -70 q-14 -24 6 -48 q18 24 -6 48" fill="#ffb04a"/>`;
    if (k === 'encendedor') s += `<rect x="-40" y="-30" width="80" height="110" rx="14" fill="#5b7cff"/><rect x="-34" y="-60" width="68" height="34" rx="6" fill="#c9ccd1"/><path d="M10 -64 q-16 -26 6 -54 q20 28 -6 54" fill="#ffb04a"/>`;
    s += `<circle r="120" fill="none" stroke="#e5484d" stroke-width="18"/><path d="M-84 -84 L84 84" stroke="#e5484d" stroke-width="18" stroke-linecap="round"/>`;
    return s;
  };

  // capa de gas a ras de suelo (height 0..1) que sale por la puerta (flow 0..1)
  A.gasLayer = function (p, c) {
    const h = 60 + clamp(p.height ?? 1, 0, 1) * 260, out = clamp(p.flow ?? 0, 0, 1);
    let d = `M-800 0 V${-h}`;
    for (let x = -800; x <= 1900; x += 60) d += ` L${x} ${(-h + Math.sin(c.t * 2 + x * 0.015) * 18 + (out > 0 ? -Math.max(0, x - 600) * 0.0 : 0)).toFixed(1)}`;
    d += ' V0Z';
    let s = `<path d="${d}" fill="${GAS}" opacity="${(0.35 * (1 - out * 0.7)).toFixed(2)}"/>`;
    if (out > 0) for (let i = 0; i < 8; i++) { const u = ((c.t * 0.5 + i / 8) % 1); s += `<ellipse cx="${(700 + u * 600).toFixed(0)}" cy="${(-80 - i % 3 * 50).toFixed(0)}" rx="${(60 + u * 40).toFixed(0)}" ry="30" fill="${GAS}" opacity="${((1 - u) * 0.5).toFixed(2)}"/>`; }
    return s;
  };
  A.windowOpen = function (p) {
    const o = clamp(p.open ?? 0, 0, 1);
    return `<rect x="-160" y="-200" width="320" height="320" fill="#f6b36f"/><rect x="-160" y="-200" width="${(160 * (1 - o * 0.8)).toFixed(0)}" height="320" fill="#bfe0f0" opacity="0.8"/><rect x="${(160 - 160 * (1 - o * 0.8)).toFixed(0)}" y="-200" width="${(160 * (1 - o * 0.8)).toFixed(0)}" height="320" fill="#bfe0f0" opacity="0.8"/><rect x="-160" y="-200" width="320" height="320" fill="none" stroke="#3a2e44" stroke-width="18"/>`;
  };
  A.doorOpen = function (p) {
    const o = clamp(p.open ?? 0, 0, 1);
    return `<rect x="-130" y="-420" width="260" height="420" fill="#f6b36f"/><rect x="-130" y="-420" width="${(260 * (1 - o * 0.82)).toFixed(0)}" height="420" fill="#8a4f2e"/><rect x="-130" y="-420" width="260" height="420" fill="none" stroke="#3a2e44" stroke-width="16"/>`;
  };

  // cilindro de gas con llave que gira (closed 0..1)
  A.gasTank = function (p, c) {
    const cl = clamp(p.closed ?? 0, 0, 1);
    let s = `<ellipse cx="0" cy="6" rx="170" ry="20" fill="#000" opacity="0.2"/>`;
    s += `<rect x="-150" y="-620" width="300" height="620" rx="120" fill="#e5e3dc"/><rect x="-150" y="-420" width="300" height="60" fill="#d93a3a"/>`;
    s += `<text y="-378" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#fff">GAS LP</text>`;
    s += `<rect x="-40" y="-700" width="80" height="90" rx="12" fill="#9aa0aa"/>`;
    s += `<g transform="translate(0,-720) rotate(${(cl * 90).toFixed(1)})"><rect x="-90" y="-16" width="180" height="32" rx="16" fill="${cl > 0.95 ? '#2bb673' : '#e5484d'}"/><circle r="22" fill="#5a5f6a"/></g>`;
    s += `<path d="M110 -560 q160 40 200 220" stroke="#2a2a30" stroke-width="16" fill="none" stroke-linecap="round"/>`;
    return s;
  };
  // celular pequeño para tenerlo en la mano
  const oldItem = A.item;
  A.item = function (p, c) {
    if (p.kind !== 'celular') return oldItem(p, c);
    return `<rect x="-70" y="-140" width="140" height="260" rx="22" fill="#16161c"/><rect x="-58" y="-122" width="116" height="220" rx="12" fill="#2bb673"/><text y="-10" text-anchor="middle" font-family="Inter" font-weight="900" font-size="46" fill="#fff">911</text><circle cy="60" r="22" fill="#fff"/>`;
  };
})();
