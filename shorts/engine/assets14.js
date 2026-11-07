// Kit "sin agua": mar que se vacía, barco, peces, ballena, llave seca, planta marchita, desierto agrietado,
// comparación Fosa de las Marianas vs Everest, persona convirtiéndose en polvo.
(function () {
  const A = window.ASSETS, B = window.BACKGROUNDS;
  const { rng, clamp } = window.SH;

  // mar visto de lado: cuenca de arena; el agua baja con level (1 lleno .. 0 vacío)
  A.seaBasin = function (p, c) {
    const lv = clamp(p.level ?? 1, 0, 1), top = 900, bottom = 1750, wy = bottom - (bottom - top) * lv;
    const basin = `M-900 ${top} L-200 ${top} Q100 ${top + 120} 200 ${bottom - 200} Q540 ${bottom + 40} 880 ${bottom - 200} Q980 ${top + 120} 1280 ${top} L1980 ${top} V2900 H-900Z`;
    let s = `<defs><clipPath id="basinC"><path d="${basin}"/></clipPath><linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f9ad0"/><stop offset="1" stop-color="#1a4f8a"/></linearGradient></defs>`;
    s += `<path d="${basin}" fill="#d9b77a"/><path d="M-200 ${top} Q100 ${top + 120} 200 ${bottom - 200} Q540 ${bottom + 40} 880 ${bottom - 200} Q980 ${top + 120} 1280 ${top}" stroke="#b8935a" stroke-width="14" fill="none"/>`;
    const r = rng(3); for (let i = 0; i < 30; i++) s += `<circle cx="${(100 + r() * 880).toFixed(0)}" cy="${(top + 200 + r() * 600).toFixed(0)}" r="${(4 + r() * 8).toFixed(0)}" fill="#b8935a" opacity=".7"/>`;
    if (lv > 0.005) s += `<g clip-path="url(#basinC)"><rect x="-900" y="${wy.toFixed(0)}" width="2880" height="${(bottom - wy + 400).toFixed(0)}" fill="url(#seaG)" opacity=".92"/><path d="M-900 ${wy.toFixed(0)} ${[...Array(30)].map((_, k) => `q50 ${Math.sin(c.t * 3 + k) * 10} 100 0`).join(' ')}" stroke="#d6f2ff" stroke-width="8" fill="none"/></g>`;
    return s;
  };
  A.boat = (p, c) => `<path d="M-200 -60 L200 -60 L150 40 L-150 40Z" fill="#e5484d"/><rect x="-90" y="-150" width="180" height="90" rx="10" fill="#f2f2ee"/><rect x="-60" y="-130" width="40" height="30" fill="#5bb8f0"/><rect x="10" y="-130" width="40" height="30" fill="#5bb8f0"/><rect x="40" y="-220" width="30" height="70" fill="#2a2a32"/><path d="M-200 -20 H200" stroke="#fff" stroke-width="10"/>`;
  A.fish = (p, c) => { const col = p.color || '#ff9a4a', fl = Math.sin(c.t * (p.flop ? 14 : 4) + (p.seed || 0)) * (p.flop ? 18 : 6); return `<g transform="rotate(${fl.toFixed(1)})"><ellipse rx="80" ry="44" fill="${col}"/><path d="M70 0 l60 -40 v80Z" fill="${col}"/><circle cx="-44" cy="-10" r="12" fill="#fff"/><circle cx="-46" cy="-10" r="6" fill="#1d1d24"/><path d="M-70 18 q10 6 20 0" stroke="#7a3a1e" stroke-width="4" fill="none"/></g>`; };
  A.whale = (p, c) => `<path d="M-300 20 Q-300 -120 -60 -130 Q200 -130 260 -20 L380 -110 L360 20 L380 140 L260 60 Q160 120 -120 110 Q-300 100 -300 20Z" fill="#4a6a9a"/><path d="M-280 40 Q-60 110 200 60" stroke="#c9d6e8" stroke-width="40" fill="none" opacity=".6"/><circle cx="-210" cy="-20" r="14" fill="#1d1d24"/><path d="M-250 30 q30 14 60 0" stroke="#1d1d24" stroke-width="6" fill="none"/>`;
  A.faucet = (p, c) => { const drop = p.dry ? '' : `<path d="M60 ${(70 + (c.t * 300) % 300).toFixed(0)} q-14 26 0 34 q14 -8 0 -34" fill="#5bb8f0"/>`; return `<rect x="-120" y="-60" width="80" height="80" rx="16" fill="#c9ccd1"/><path d="M-40 -30 H40 Q70 -30 70 0 V40" stroke="#c9ccd1" stroke-width="40" fill="none" stroke-linecap="round"/><rect x="-100" y="-110" width="40" height="60" rx="10" fill="#9aa3ad"/><rect x="-140" y="-120" width="120" height="20" rx="10" fill="#e5484d"/>${drop}`; };
  A.plantW = (p, c) => { const w = clamp(p.wilt ?? 0, 0, 1), col = w > 0.6 ? '#a8843a' : w > 0.3 ? '#8aa83a' : '#4f9a3a'; let s = `<path d="M-70 0 L-54 -130 H54 L70 0Z" fill="#c2643a"/><path d="M0 -130 Q${(20 * w).toFixed(0)} -260 ${(140 * w).toFixed(0)} ${(-360 + 200 * w).toFixed(0)}" stroke="${col}" stroke-width="16" fill="none" stroke-linecap="round"/>`; for (let i = 0; i < 4; i++) { const y = -190 - i * 50 + w * i * 30, x = w * i * 25; s += `<ellipse cx="${(x - 50).toFixed(0)}" cy="${y.toFixed(0)}" rx="50" ry="20" fill="${col}" transform="rotate(${(-20 + w * 70).toFixed(0)} ${(x - 50).toFixed(0)} ${y.toFixed(0)})"/><ellipse cx="${(x + 50).toFixed(0)}" cy="${(y - 20).toFixed(0)}" rx="50" ry="20" fill="${col}" transform="rotate(${(20 + w * 60).toFixed(0)} ${(x + 50).toFixed(0)} ${(y - 20).toFixed(0)})"/>`; } return s; };
  B.desert = (t) => {
    let s = `<defs><linearGradient id="dsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2a04a"/><stop offset="1" stop-color="#fbe2a8"/></linearGradient></defs><rect x="-900" y="-900" width="2880" height="2200" fill="url(#dsk)"/><circle cx="800" cy="420" r="120" fill="#fff6c8"/><circle cx="800" cy="420" r="200" fill="#fff6c8" opacity=".3"/>`;
    s += `<rect x="-900" y="1250" width="2880" height="1700" fill="#d9a868"/>`;
    const r = rng(8); for (let i = 0; i < 70; i++) { const x = r() * 2600 - 800, y = 1280 + r() * 1300; let d = `M${x.toFixed(0)} ${y.toFixed(0)}`; for (let k = 0; k < 4; k++) d += ` l${(r() * 80 - 40).toFixed(0)} ${(r() * 50 + 10).toFixed(0)}`; s += `<path d="${d}" stroke="#a87a40" stroke-width="5" fill="none"/>`; }
    return s;
  };
  // comparación: Everest (8,8 km) vs Fosa de las Marianas (11 km)
  A.trench = (p, c) => {
    const k = clamp(p.k ?? 1, 0, 1), sc = 60; // px por km
    let s = `<rect x="-480" y="0" width="960" height="8" fill="#fff"/>`;
    s += `<path d="M-400 0 L-260 ${(-8.8 * sc * k).toFixed(0)} L-120 0Z" fill="#9aa3ad"/><path d="M-290 ${(-7.6 * sc * k).toFixed(0)} L-260 ${(-8.8 * sc * k).toFixed(0)} L-230 ${(-7.6 * sc * k).toFixed(0)}Z" fill="#fff"/>`;
    s += `<path d="M80 0 L200 ${(11 * sc * k).toFixed(0)} L320 0Z" fill="#14284a"/><path d="M80 0 L200 ${(11 * sc * k).toFixed(0)} L320 0" stroke="#5bb8f0" stroke-width="6" fill="none"/>`;
    s += `<text x="-260" y="${(-8.8 * sc * k - 30).toFixed(0)}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="46" fill="#fff">EVEREST 8,8 km</text>`;
    s += `<text x="200" y="${(11 * sc * k + 70).toFixed(0)}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="46" fill="#ffd84a">FOSA 11 km</text>`;
    return s;
  };
  // montoncito de polvo que crece y partículas que se elevan
  A.dust = (p, c) => { const k = clamp(p.k ?? 0, 0, 1); let s = `<ellipse cx="0" cy="0" rx="${(30 + 150 * k).toFixed(0)}" ry="${(10 + 45 * k).toFixed(0)}" fill="#b89a7a"/><ellipse cx="0" cy="-${(10 * k).toFixed(0)}" rx="${(20 + 110 * k).toFixed(0)}" ry="${(8 + 30 * k).toFixed(0)}" fill="#c9ab8a"/>`; const r = rng(4); for (let i = 0; i < 26 * k; i++) { const u = ((c.t * 0.5 + r()) % 1); s += `<circle cx="${(r() * 300 - 150 + Math.sin(c.t + i) * 20).toFixed(0)}" cy="${(-50 - u * 500).toFixed(0)}" r="${(4 + r() * 6).toFixed(0)}" fill="#c9ab8a" opacity="${(1 - u).toFixed(2)}"/>`; } return s; };
})();
