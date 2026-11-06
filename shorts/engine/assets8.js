// Iconos emergentes estilo "pegatina": corazón, exclamación, interrogación, nota musical, estrella, gota de sudor.
(function () {
  const A = window.ASSETS;
  const { clamp, ease } = window.SH;
  A.icon = function (p, c) {
    const k = ease.back(clamp(c.lt / 0.3, 0, 1));
    const fl = Math.sin(c.t * 3 + (p.seed || 0)) * 8;
    const life = p.life ?? 99, fade = c.lt > life ? Math.max(0, 1 - (c.lt - life) / 0.3) : 1;
    let s = '';
    switch (p.kind) {
      case 'heart': s = `<path d="M0 40 C-90 -20 -60 -90 0 -50 C60 -90 90 -20 0 40Z" fill="#ff4d6d"/><ellipse cx="-30" cy="-40" rx="12" ry="8" fill="#fff" opacity=".6"/>`; break;
      case 'excl': s = `<circle r="70" fill="#e5484d"/><rect x="-12" y="-46" width="24" height="60" rx="10" fill="#fff"/><circle cy="34" r="13" fill="#fff"/>`; break;
      case 'quest': s = `<circle r="70" fill="#5b7cff"/><text y="34" text-anchor="middle" font-family="Inter" font-weight="900" font-size="100" fill="#fff">?</text>`; break;
      case 'note': s = `<path d="M-20 40 V-60 L50 -80 V20" stroke="#ffd84a" stroke-width="14" fill="none" stroke-linejoin="round"/><ellipse cx="-36" cy="42" rx="24" ry="18" fill="#ffd84a"/><ellipse cx="34" cy="22" rx="24" ry="18" fill="#ffd84a"/>`; break;
      case 'star': s = `<path d="M0 -70 L20 -22 L70 -20 L30 12 L44 62 L0 34 L-44 62 L-30 12 L-70 -20 L-20 -22Z" fill="#ffd84a"/>`; break;
      case 'sweat': s = `<path d="M0 -60 Q40 0 30 30 Q15 60 -15 50 Q-40 30 -25 0Z" fill="#7fd0ff"/>`; break;
      case 'money': s = `<circle r="70" fill="#2bb673"/><text y="32" text-anchor="middle" font-family="Inter" font-weight="900" font-size="96" fill="#fff">$</text>`; break;
    }
    return `<g transform="translate(0,${fl.toFixed(1)}) scale(${(k * fade).toFixed(3)})">${s}</g>`;
  };
})();
