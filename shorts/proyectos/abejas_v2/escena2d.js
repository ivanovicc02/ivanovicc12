// "¿Qué pasaría si desaparecieran todas las abejas?" en 2D (SHOTS2D).
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const NOSTK = new Set(['darkness', 'puff', 'stamp']);
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op, !NOSTK.has(kind));
  const ICON = (H, kind, x, y, s, lt, at, t, life) => (lt > at ? H.at(x, y, s, A.icon({ kind, life, seed: x }, { t, lt: lt - at }), 0, 1, true) : '');
  const EIN = { coat: true, hairStyle: 'wild', hair: '#f2f2f2', mustache: '#e8e8e8', skin: '#f0c8a0', shirt: '#8a8f99', pants: '#4a4f5a', seed: 2 };
  const HERO = { shirt: '#2fb3a3', hairStyle: 'short', hair: '#3a2418', seed: 5 };
  const hero = (o) => Object.assign({}, HERO, o);
  // abejas revoloteando alrededor de un punto
  function bees(H, n, cx, cy, rad, lt, t, vis = () => 1) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = t * (1.2 + i * 0.13) + i * 2.1;
      const x = cx + Math.cos(a) * rad * (0.6 + (i % 3) * 0.2), y = cy + Math.sin(a * 1.3) * rad * 0.45;
      const k = vis(i);
      if (k <= 0.01) continue;
      s += P(H, 'bee', x, y, 1.15 * k, { seed: i }, lt, t, Math.cos(a) > 0 ? 0 : 0);
    }
    return s;
  }
  const buzz = (H, s0, dur, v = 0.7) => { for (let k = 0; k * 1.5 < dur; k++) H.sfx('bee', s0 + k * 1.5, v); };

  // [1] Dicen que Einstein dijo que, si las abejas desaparecen, a la humanidad le quedarían solo 4 AÑOS de vida.
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt;
    buzz(H, s0, dur, 0.6);
    let w = P(H, 'person', 300, 1600, 1.15, Object.assign({}, EIN, { mood: 'talk', pose: 'point', look: [0.6, -0.2] }), lt, t);
    w += P(H, 'quote', 690, 900, 0.95 * H.pop(lt, 0.5), { lines: ['"Si las abejas', 'desaparecen…"'] }, lt, t);
    w += bees(H, 4, 640, 1000, 300, lt, t);
    H.bignum('4', 'AÑOS DE VIDA', 300, lt, H.wt('4', s0) - s0);
    w += ICON(H, 'heart', 830, 760, 0.7, lt, 1.0, t, 1.5) + ICON(H, 'note', 500, 700, 0.6, lt, 0.4, t, 2.5);
    H.ov('<div class="tag" style="background:#ffd84a">EINSTEIN</div>', 470, lt < H.wt('4', s0) - s0 ? lt : -1, H.wt('einstein', s0) - s0);
    return { bg: 'flowerField', world: w, cam: H.cam([540, 1440, 1.0], [560, 1430, 1.06], lt / dur), particles: 'none' };
  };

  // [2] Es mentira: Einstein nunca dijo eso. Pero lo que SÍ pasaría... es casi igual de aterrador.
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt, tm = H.wt('mentira', s0) - s0, tp = H.wt('pero', s0) - s0;
    let w = P(H, 'person', 300, 1600, 1.15, Object.assign({}, EIN, { mood: lt > tm ? 'surprised' : 'talk', pose: lt > tm ? 'shrug' : 'point' }), lt, t);
    w += ICON(H, 'excl', 300, 1000, 0.8, lt, tm + 0.1, t);
    w += P(H, 'quote', 690, 900, 0.95, { lines: ['"Si las abejas', 'desaparecen…"'] }, lt, t);
    if (lt > tm) { w += P(H, 'stamp', 690, 800, 1.0, { text: 'FALSO' }, lt - tm, t); H.sfx('hit', s0 + tm + 0.15, 1); }
    const dark = 0.6 * H.ease.inOut(H.clamp((lt - tp) / 1.5, 0, 1));
    w += P(H, 'darkness', 0, 0, 1, { amount: dark }, lt, t);
    if (lt > tp) H.sfx('rumble', s0 + tp, 0.6);
    return { bg: 'flowerField', world: w, cam: H.cam([560, 1430, 1.06], [600, 1300, 1.25], H.clamp((lt - tp) / (dur - tp), 0, 1)), particles: 'none', shake: lt > tm && lt < tm + 0.25 ? 10 : 0 };
  };

  // [3] ¿Qué pasaría si mañana desaparecieran todas las abejas?
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, td = H.wt('desaparecieran', s0) - s0;
    const vis = (i) => 1 - H.clamp((lt - td - i * 0.22) / 0.2, 0, 1);
    let w = bees(H, 7, 540, 820, 380, lt, t, vis);
    for (let i = 0; i < 7; i++) { const at = td + i * 0.22; if (lt > at && lt < at + 0.6) { const a = t * (1.2 + i * 0.13) + i * 2.1; w += P(H, 'puff', 540 + Math.cos(a) * 380 * (0.6 + (i % 3) * 0.2), 820 + Math.sin(a * 1.3) * 171 + 200, 0.5, {}, lt - at, t); H.sfx('pop', s0 + at, 0.5); } }
    if (lt < td + 1) buzz(H, s0, td + 1, 0.8);
    w += ICON(H, 'quest', 540, 560, 1.0, lt, td + 1.6, t);
    return { bg: 'flowerField', world: w, cam: [540, 1300, 1.0], particles: 'none' };
  };

  // [4] Lo primero: el supermercado. 3 de cada 4 tipos de cultivos... Y las abejas son las que más trabajan.
  const SHELF = ['manzana', 'fresa', 'melon', 'aguacate', 'almendra', 'maiz', 'trigo', 'manzana', 'fresa'];
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, t3 = H.wt('3', s0) - s0, ta = H.wt('abejas', s0) - s0;
    let w = '';
    [620, 980].forEach((y, row) => {
      w += `<rect x="40" y="${y + 70}" width="1000" height="26" rx="8" fill="#b9a88a"/>`;
      for (let i = 0; i < 4; i++) { const k = SHELF[row * 4 + i]; const dim = lt > t3 && (row * 4 + i) % 4 !== 3 ? 1 : 1; w += P(H, 'food', 170 + i * 250, y, 0.62, { kind: k }, lt, t, 0, dim); }
    });
    if (lt > t3) for (let i = 0; i < 8; i++) { if (i % 4 === 3) continue; const row = Math.floor(i / 4), x = 170 + (i % 4) * 250, y = row ? 980 : 620; w += P(H, 'bee', x + 60, y - 80, 0.45 * H.pop(lt, t3 + i * 0.1, 0.3), { seed: i }, lt, t); }
    if (lt > t3) H.sfx('bee', s0 + t3 + 0.3, 0.7);
    H.ov('<div class="tag">EL SUPERMERCADO</div>', 330, lt < t3 ? lt : -1, 0.2);
    H.bignum('3 DE 4', 'CULTIVOS', 230, lt, t3);
    H.ov('<div class="tag" style="background:#ffd84a">LAS QUE MÁS TRABAJAN</div>', 1400, lt, ta);
    return { bg: 'supermarket', world: w, cam: H.cam([540, 860, 1.0], [540, 860, 1.05], lt / dur), particles: 'none' };
  };

  // [5] Sin ellas, se vuelven escasas y carísimas las manzanas, las almendras, las fresas, el melón... y el AGUACATE. Adiós a tu guacamole.
  const F5 = [['manzanas', 'manzana', 300, 620], ['almendras', 'almendra', 780, 620], ['fresas', 'fresa', 300, 960], ['melon', 'melon', 780, 960]];
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt, tag = H.wt('aguacate', s0) - s0, tg = H.wt('guacamole', s0) - s0;
    let w = '';
    const fade = 1 - H.clamp((lt - tag) / 0.4, 0, 1);
    F5.forEach(([word, kind, x, y], i) => {
      const at = H.wt(word, s0) - s0;
      if (lt < at || fade <= 0.01) return;
      const price = H.lerp(20, 99, H.ease.out(H.clamp((lt - at) / 1.2, 0, 1)));
      w += P(H, 'food', x, y, 0.85 * H.pop(lt, at), { kind }, lt, t, 0, fade);
      w += P(H, 'priceTag', x + 110, y + 90, 0.75 * H.pop(lt, at + 0.2), { value: price }, lt, t, 0, fade);
      H.sfx('ching', s0 + at + 0.2, 0.8);
    });
    if (lt > tag) { w += P(H, 'food', 540, 720, 1.6 * H.pop(lt, tag, 0.45), { kind: 'aguacate', sad: true }, lt, t, Math.sin(t * 3) * 4); w += P(H, 'priceTag', 790, 880, 0.9 * H.pop(lt, tag + 0.3), { value: 199 }, lt, t); H.sfx('ching', s0 + tag + 0.3, 1); }
    if (lt > tg) { w += P(H, 'food', 540, 1000, 0.75 * H.pop(lt, tg), { kind: 'guacamole' }, lt, t); }
    H.ov('<div class="tag" style="background:#e5484d;color:#fff">ESCASAS Y CARÍSIMAS</div>', 330, lt, 0.4);
    if (lt > tag) w += ICON(H, 'sweat', 690, 560, 0.8, lt, tag + 0.4, t);
    H.ov(H.MARK_NO, 820, lt, tg + 0.2, 'left:82%');
    return { bg: 'supermarket', world: w, cam: [540, 860, 1.0], particles: 'none' };
  };

  // [6] Pero no moriríamos de hambre. El maíz, el trigo y el arroz se polinizan con el viento.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, tv = H.wt('viento', s0) - s0;
    H.sfx('wind', s0, 1); H.sfx('wind', s0 + 3.5, 0.8);
    let w = '';
    for (let row = 0; row < 3; row++) for (let i = 0; i < 8; i++) {
      const x = -60 + i * 160 + (row % 2) * 80, y = 1250 + row * 120, s = 0.6 + row * 0.2;
      w += P(H, 'food', x, y, s, { kind: (i + row) % 2 ? 'maiz' : 'trigo', seed: i + row * 3 }, lt, t);
    }
    for (let i = 0; i < 6; i++) { const u = ((t * 0.7 + i / 6) % 1); w += `<path d="M${(-200 + u * 1500).toFixed(0)} ${700 + i * 60} q60 -20 120 0 t120 0" stroke="#fff" stroke-width="6" fill="none" opacity="${(0.7 * Math.sin(u * Math.PI)).toFixed(2)}" stroke-linecap="round"/>`; }
    H.ov(H.MARK_OK, 330, lt, H.wt('hambre', s0) - s0);
    H.ov('<div class="tag" style="background:#ffd84a">SE POLINIZAN CON EL VIENTO</div>', 330, lt, tv);
    return { bg: 'meadow', world: w, cam: [540, 1300, 1.0], particles: 'none' };
  };

  // [7] El problema es que comeríamos peor: menos frutas, menos vitaminas... la leche y la carne subirían de precio, porque las vacas...
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, at = (w) => H.wt(w, s0) - s0;
    const tvac = at('vacas');
    let w = '';
    if (lt < tvac - 0.3) {
      if (lt > at('frutas')) w += P(H, 'food', 280, 700, 0.8 * H.pop(lt, at('frutas')), { kind: 'fresa' }, lt, t);
      if (lt > at('vitaminas')) { w += P(H, 'food', 800, 700, 0.8 * H.pop(lt, at('vitaminas')), { kind: 'vitaminas' }, lt, t); }
      if (lt > at('leche')) { w += P(H, 'food', 280, 1020, 0.8 * H.pop(lt, at('leche')), { kind: 'leche' }, lt, t); w += P(H, 'priceTag', 420, 1080, 0.7 * H.pop(lt, at('leche') + 0.2), { value: H.lerp(25, 60, H.clamp((lt - at('leche')) / 1, 0, 1)) }, lt, t); H.sfx('ching', s0 + at('leche') + 0.2, 0.8); }
      if (lt > at('carne')) { w += P(H, 'food', 800, 1020, 0.8 * H.pop(lt, at('carne')), { kind: 'carne' }, lt, t); w += P(H, 'priceTag', 930, 1090, 0.7 * H.pop(lt, at('carne') + 0.2), { value: H.lerp(120, 250, H.clamp((lt - at('carne')) / 1, 0, 1)) }, lt, t); H.sfx('ching', s0 + at('carne') + 0.2, 0.8); }
      [[280, 'frutas'], [800, 'vitaminas']].forEach(([x, wd]) => { if (lt > at(wd)) w += `<path d="M${x + 110} 600 v120 m-30 -30 l30 30 l30 -30" stroke="#e5484d" stroke-width="14" fill="none" stroke-linecap="round"/>`; });
      H.ov('<div class="tag" style="background:#e5484d;color:#fff">COMERÍAMOS PEOR</div>', 330, lt, 0.2);
      return { bg: 'supermarket', world: w, cam: [540, 860, 1.0], particles: 'none' };
    }
    w += P(H, 'cow', 470, 1520, 1.1, {}, lt, t);
    for (let i = 0; i < 6; i++) w += P(H, 'flower', 120 + i * 170, 1560 + (i % 2) * 40, 0.8, { color: i % 2 ? '#b07cff' : '#ffffff' }, lt, t);
    w += P(H, 'bee', 760, 1260, 0.7, { seed: 3 }, lt, t);
    H.sfx('moo', s0 + tvac, 1);
    w += ICON(H, 'note', 820, 1140, 0.7, lt, 0.3, t) + ICON(H, 'excl', 300, 1100, 0.7, lt, 1.2, t);
    H.ov('<div class="tag" style="background:#ffd84a">LAS VACAS COMEN ALFALFA</div>', 330, lt, tvac);
    return { bg: 'meadow', world: w, cam: [540, 1430, 1.0], particles: 'none' };
  };

  // [8] Y esto ya está pasando: en algunas zonas de China... gente que poliniza los árboles A MANO... flor por flor.
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt, tm = H.wt('mano', s0) - s0;
    let w = P(H, 'blossomTree', 700, 1560, 1.1, {}, lt, t);
    const s = 0.95, px = 360, py = 1560;
    w += P(H, 'person', px, py, s, hero({ mood: 'neutral', pose: 'point', shirt: '#e5484d', hairStyle: 'bun', hair: '#1d1d24', look: [0.6, -0.6] }), lt, t);
    w += P(H, 'brush', px + 235 * s + 20, py - 390 * s - 20, 0.8, { rot: -50 }, lt, t);
    if (lt > tm) for (let i = 0; i < 5; i++) { const u = ((t * 0.8 + i / 5) % 1); w += `<circle cx="${(px + 250 + u * 80).toFixed(0)}" cy="${(py - 420 - u * 40).toFixed(0)}" r="5" fill="#ffd84a" opacity="${(1 - u).toFixed(2)}"/>`; }
    H.ov('<div class="tag" style="background:#e5484d;color:#fff">CHINA</div>', 330, lt, H.wt('china', s0) - s0);
    H.ov('<div class="tag" style="background:#ffd84a">POLINIZAN A MANO</div>', 460, lt, tm);
    w += ICON(H, 'star', 860, 900, 0.6, lt, tm + 0.3, t) + ICON(H, 'heart', 560, 860, 0.5, lt, tm + 0.8, t);
    return { bg: 'flowerField', world: w, cam: H.cam([540, 1440, 1.0], [600, 1380, 1.12], lt / dur), particles: 'none' };
  };

  // [9] Ahora dime: ¿qué comida extrañarías más si desaparecieran las abejas? Escríbela en los comentarios... y sígueme.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'person', 540, 1560, 0.95, hero({ mood: 'talk', pose: 'shrug', look: [0, -0.5] }), lt, t);
    [['aguacate', 230, 700], ['fresa', 850, 680], ['manzana', 200, 1000], ['melon', 880, 1000]].forEach(([k, x, y], i) => {
      w += P(H, 'food', x, y + Math.sin(t * 2 + i) * 12, 0.6 * H.pop(lt, 0.3 + i * 0.25), { kind: k }, lt, t);
      if (lt > 0.3 + i * 0.25) H.sfx('pop', s0 + 0.3 + i * 0.25, 0.5);
    });
    H.ov('<div class="tag">¿QUÉ COMIDA EXTRAÑARÍAS?</div>', 330, lt, H.wt('comida', s0) - s0);
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1480, lt, H.wt('comentarios', s0) - s0);
    return { bg: 'flowerField', world: w, cam: [540, 1440, 1.0], particles: 'none' };
  };
})();
