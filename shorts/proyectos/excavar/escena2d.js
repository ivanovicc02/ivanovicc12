// "¿Qué pasaría si nunca dejaras de excavar?" — patio, corte del suelo que baja, objetos, dinosaurio, mina, calor, récord, centro de la Tierra.
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const FLAT = new Set(['darkness', 'puff', 'sparkle', 'groundCut', 'dirtBurst']);
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op, kind === 'groundCut' ? 'bg' : FLAT.has(kind) ? false : 'vol');
  const ICON = (H, kind, x, y, s, lt, at, t) => (lt > at ? H.at(x, y, s, A.icon({ kind, seed: x }, { t, lt: lt - at }), 0, 1, 'vol') : '');
  const W = (H, s0, w, after) => H.wt(w, after ?? s0) - s0;
  const big = (H, n, label, lt, t0, d = 2.0) => H.bignum(n, label, 210, lt < t0 + d ? lt : -1, t0);
  const day = (H, s0) => { H.sfx('whoosh', s0, 0.9); H.sfx('tick', s0 + 0.2, 1); H.sfx('tick', s0 + 0.45, 1); };
  const ME = { shirt: '#f07f2a', pants: '#2f4f8a', hairStyle: 'short', hair: '#3a2418', seed: 5 };
  const me = (o) => Object.assign({}, ME, o);
  const SURF = 420;
  // excavador en el fondo del pozo, con pala, golpes y tierra volando
  function digger(H, depth, lt, t, s0, o = {}) {
    const by = SURF + depth, bob = Math.abs(Math.sin(t * 5.7)) * 16;
    let w = P(H, 'person', 540, by, 0.74, me(Object.assign({ mood: 'talk', pose: 'hold', holding: 'shovel', holdRot: -40 }, o)), lt, t, Math.sin(t * 5.7) * 7);
    w += P(H, 'dirtBurst', 600, by - 40 - bob, 0.9, { period: 0.55 }, lt, t);
    for (let k = 0; k < 20; k++) { const at = 0.2 + k * 0.55; H.sfx('dig', s0 + at, 0.55); }
    return w;
  }
  const cutCam = (depth) => [540, SURF + depth - 240, 1.0];
  const hud = (H, lt, txt) => H.ov(`<div class="tag" style="background:#1d1d24;color:#ffd84a">PROFUNDIDAD: ${txt}</div>`, 330, lt, 0.15);

  // [1] ¿Qué pasaría si un día agarras una pala... y NUNCA dejas de excavar?
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt, tn = W(H, s0, 'nunca');
    let w = P(H, 'person', H.lerp(250, 500, H.ease.out(H.clamp(lt / 1.5, 0, 1))), 1480, 1.1, me({ mood: 'happy', pose: 'hold', holding: 'shovel', holdRot: -20 }), lt, t);
    for (let i = 0; i < 3; i++) H.sfx('step', s0 + i * 0.4, 0.8);
    w += ICON(H, 'quest', 760, 900, 0.8, lt, tn, t);
    if (lt > tn) H.sfx('riser', s0 + tn - 0.5, 0.6);
    return { bg: 'backyard', world: w, cam: H.cam([540, 1300, 1.0], [520, 1260, 1.12], lt / dur), particles: 'none' };
  };

  // [2] Día 1. Empiezas en tu patio. Tierra, piedras, lombrices... nada interesante. Tus vecinos se ríen de ti.
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt, tv = W(H, s0, 'vecinos');
    day(H, s0);
    let w = `<ellipse cx="640" cy="1520" rx="${(80 + lt * 12).toFixed(0)}" ry="${(26 + lt * 4).toFixed(0)}" fill="#3a2418"/>` + `<path d="M760 1520 q60 -${(40 + lt * 8).toFixed(0)} 140 0Z" fill="#8a5a32"/>`;
    w += P(H, 'person', 430, 1500, 1.05, me({ mood: lt > tv ? 'worried' : 'talk', pose: 'hold', holding: 'shovel', holdRot: -60 }), lt, t, Math.sin(t * 5.7) * 8);
    w += P(H, 'dirtBurst', 640, 1490, 0.8, { period: 0.55 }, lt, t);
    for (let k = 0; k < 14; k++) H.sfx('dig', s0 + 0.3 + k * 0.55, 0.5);
    [['tierra', 'rock', 250, 1050], ['piedras', 'rock', 520, 1000], ['lombrices', 'worm', 790, 1040]].forEach(([wd, k, x, y], i) => { const at = W(H, s0, wd); if (lt > at) { w += P(H, k, x, y, 0.75 * H.pop(lt, at), {}, lt, t, i * 12); H.sfx('pop', s0 + at, 0.6); } });
    if (lt > tv) { [[930, 'happy'], [810, 'happy']].forEach(([x, m], i) => (w += P(H, 'person', x, 1330, 0.62, { shirt: ['#5b7cff', '#e8709a'][i], hairStyle: ['spiky', 'long'][i], mood: m, pose: 'cheer', seed: 30 + i }, lt, t))); w += P(H, 'speech', 860, 760, 0.65 * H.pop(lt, tv + 0.2), { text: 'JA JA', color: '#5b7cff' }, lt, t); H.sfx('pop', s0 + tv + 0.2, 0.8); }
    big(H, 'DÍA 1', '', lt, 0.05);
    return { bg: 'backyard', world: w, cam: [540, 1300, 1.0], particles: 'none' };
  };

  // [3] Día 3. 2 metros abajo encuentras monedas viejas, pedazos de cerámica... Las vendes... y te compras mejores herramientas.
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, depth = H.lerp(180, 300, H.clamp(lt / dur, 0, 1)), tm = W(H, s0, 'monedas'), tc = W(H, s0, 'ceramica'), tv = W(H, s0, 'vendes'), th = W(H, s0, 'herramientas');
    day(H, s0);
    let w = P(H, 'groundCut', 0, 0, 1, { depth }, lt, t);
    if (lt > tm) { [[300, 560], [790, 610], [260, 680]].forEach(([x, y], i) => (w += P(H, 'coin', x, y + Math.sin(t * 3 + i) * 6, 0.6 * H.pop(lt, tm + i * 0.15), {}, lt, t))); H.sfx('ching', s0 + tm, 0.8); }
    if (lt > tc) { w += P(H, 'vase', 820, 700, 0.6 * H.pop(lt, tc), {}, lt, t, 8); H.sfx('pop', s0 + tc, 0.7); }
    w += digger(H, depth, lt, t, s0, { shirt: '#f07f2a' });
    if (lt > tv) { w += P(H, 'item', 540, 520, 0.9 * H.pop(lt, tv), { kind: 'efectivo' }, lt, t); H.sfx('ching', s0 + tv + 0.1, 1); }
    if (lt > th) w += P(H, 'sparkle', 540, SURF + depth - 120, 1, {}, lt, t);
    big(H, 'DÍA 3', '', lt, 0.05);
    hud(H, lt, '2 METROS');
    return { bg: 'spotNight', world: w, cam: cutCam(depth), particles: 'none' };
  };

  // [4] Día 7. Aparece el AGUA. El hoyo se inunda. Pones bombas y paredes de concreto. Esto ya no es un juego.
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, ta = W(H, s0, 'agua'), tb = W(H, s0, 'bombas'), tp = W(H, s0, 'paredes'), tj = W(H, s0, 'juego');
    day(H, s0);
    const depth = 520;
    const water = lt < tb ? 260 * H.ease.out(H.clamp((lt - ta) / 1.5, 0, 1)) : 260 * (1 - H.ease.inOut(H.clamp((lt - tb) / 2, 0, 1)));
    let w = P(H, 'groundCut', 0, 0, 1, { depth, water, walls: lt > tp }, lt, t);
    w += lt < ta + 0.8 ? digger(H, depth, lt, t, s0) : P(H, 'person', 540, SURF + depth - water * 0.6, 0.62, me({ mood: 'scared', pose: 'cheer' }), lt, t, Math.sin(t * 3) * 6);
    if (lt > ta) { H.sfx('splash', s0 + ta, 0.8); H.sfx('bubbles', s0 + ta + 0.4, 0.8); }
    if (lt > tb) { w += P(H, 'pump', 830, SURF, 0.8 * H.pop(lt, tb), {}, lt, t); H.sfx('drill', s0 + tb, 0.6); }
    if (lt > tp) H.sfx('hit', s0 + tp, 0.6);
    big(H, 'DÍA 7', '', lt, 0.05);
    H.ov('<div class="tag" style="background:#e5484d;color:#fff">ESTO YA NO ES UN JUEGO</div>', 330, lt, tj);
    return { bg: 'spotNight', world: w, cam: [540, SURF + depth - 300, 1.0], particles: 'none' };
  };

  // [5] Día 15. Tu pala choca con algo enorme... un FÓSIL de dinosaurio completo. | El video se vuelve viral... millonario.
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt, te = W(H, s0, 'enorme'), tf = W(H, s0, 'fosil'), tv = W(H, s0, 'video'), tm = W(H, s0, 'museos'), tmi = W(H, s0, 'millonario');
    day(H, s0);
    if (lt < tv - 0.1) {
      const depth = 900;
      let w = P(H, 'groundCut', 0, 0, 1, { depth, lights: true, walls: true }, lt, t);
      if (lt > tf - 0.3) { w += P(H, 'dino', 540, SURF + depth + 80, 0.95 * H.pop(lt, tf - 0.3, 0.6), { glow: true }, lt, t); }
      w += lt < te ? digger(H, depth, lt, t, s0) : P(H, 'person', 430, SURF + depth, 0.62, me({ mood: 'scared', pose: 'scared' }), lt, t);
      if (lt > te) { H.sfx('hit', s0 + te, 1); }
      if (lt > tf) { H.sfx('boom', s0 + tf, 0.8); H.sfx('ding', s0 + tf + 0.3, 0.9); }
      big(H, 'DÍA 15', '', lt, 0.05);
      return { bg: 'spotNight', world: w, cam: [540, SURF + depth - 140, 1.0], shake: lt > te && lt < te + 0.3 ? 12 : 0, particles: 'none' };
    }
    let w = P(H, 'person', 420, 1480, 1.1, me({ mood: 'happy', pose: 'hold', holding: 'celular', holdRot: -10 }), lt, t);
    for (let i = 0; i < 6; i++) w += ICON(H, 'heart', 640 + (i % 3) * 120, 820 - Math.floor(i / 3) * 140 - ((t * 120) % 200), 0.45, lt, 0.2 + i * 0.2, t);
    if (lt > tm) for (let i = 0; i < 8; i++) { const y = ((t * 380 + i * 260) % 1400) + 200; w += P(H, 'item', 120 + i * 120, y, 0.45, { kind: 'efectivo' }, lt, t, (i * 37) % 60 - 30); }
    if (lt > tm) H.sfx('ching', s0 + tm, 1);
    H.ov('<div class="tag" style="background:#e5484d;color:#fff">¡VIRAL! 10M VISTAS</div>', 330, lt, 0.1);
    H.bignum('$$$', 'MILLONARIO', 210, lt, tmi);
    return { bg: 'backyard', world: w, cam: [540, 1300, 1.0], flash: 0.7 * Math.max(0, 1 - lt / 0.3), particles: 'none' };
  };

  // [6] Día 30. Encuentras minerales valiosos. | Empresas te llaman. Compras máquinas gigantes. Tu patio ya parece una mina.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, te = W(H, s0, 'empresas'), tma = W(H, s0, 'maquinas');
    day(H, s0);
    if (lt < te - 0.1) {
      const depth = 1250;
      let w = P(H, 'groundCut', 0, 0, 1, { depth, lights: true, walls: true }, lt, t);
      [[300, 1450, '#5bdcff'], [800, 1520, '#b07cff'], [250, 1640, '#2bf08a'], [830, 1660, '#ff5a7a']].forEach(([x, y, col], i) => { w += P(H, 'gem', x, y, 0.7 * H.pop(lt, 0.4 + i * 0.2), { color: col, seed: i }, lt, t); });
      for (let i = 0; i < 4; i++) H.sfx('ding', s0 + 0.4 + i * 0.2, 0.4);
      w += digger(H, depth, lt, t, s0);
      big(H, 'DÍA 30', '', lt, 0.05);
      return { bg: 'spotNight', world: w, cam: [540, SURF + depth - 240, 1.0], particles: 'none' };
    }
    let w = P(H, 'drillRig', 600, 1500, 1.0 * H.pop(lt, tma - 0.2, 0.5), { bit: 260 }, lt, t);
    w += P(H, 'person', 230, 1520, 0.9, me({ mood: 'happy', pose: 'point', look: [0.8, -0.3] }), lt, t);
    if (lt > tma) H.sfx('drill', s0 + tma, 0.9);
    H.ov('<div class="tag" style="background:#ffd84a">TU PATIO = UNA MINA</div>', 330, lt, W(H, s0, 'mina'));
    return { bg: 'backyard', world: w, cam: [540, 1250, 1.0], shake: lt > tma ? 3 : 0, flash: 0.7 * Math.max(0, 1 - (lt - te + 0.1) / 0.3), particles: 'none' };
  };

  // [7] Día 60. Cada kilómetro hacia abajo, la temperatura sube unos 25 grados. Las máquinas se derriten... y todo cuesta millones.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, tg = W(H, s0, '25'), td = W(H, s0, 'derriten'), tm = W(H, s0, 'millones');
    day(H, s0);
    const depth = 2500;
    let w = P(H, 'groundCut', 0, 0, 1, { depth, lights: true, walls: true }, lt, t);
    w += P(H, 'drillRig', 540, SURF + depth - 40, 0.7, { bit: 60, smoke: lt > td }, lt, t);
    w += P(H, 'thermo', 870, SURF + depth - 260, 0.9, { level: H.lerp(0.3, 1, H.clamp((lt - tg + 0.5) / 2.5, 0, 1)) }, lt, t);
    if (lt > td) { H.sfx('hiss', s0 + td, 0.8); H.sfx('buzz', s0 + td + 0.2, 0.5); }
    for (let k = 0; k * 2.5 < dur; k++) H.sfx('drill', s0 + k * 2.5, 0.6);
    big(H, 'DÍA 60', '', lt, 0.05);
    H.bignum('+25°C', 'POR CADA KILÓMETRO', 210, lt, tg);
    const screen = `<rect width="1080" height="1920" fill="#ff3a1a" opacity="${(0.18 * H.clamp((lt - tg) / 3, 0, 1)).toFixed(2)}"/>`;
    if (lt > tm) H.ov('<div class="badge" style="color:#9fe6a0">$$$$$</div>', 520, lt, tm);
    return { bg: 'spotRed', world: w, cam: [540, SURF + depth - 380, 1.0], screen, shake: 3, particles: 'none' };
  };

  // [8] Día 120. Llegas a 12 kilómetros. Rompiste el récord del hoyo más profundo del mundo... y los gobiernos empiezan a vigilarte.
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt, tr = W(H, s0, 'record'), tg = W(H, s0, 'gobiernos');
    day(H, s0);
    if (lt < tg - 0.1) {
      let w = P(H, 'trophy', 540, 900, 1.3 * H.pop(lt, tr, 0.5), {}, lt, t) + P(H, 'sparkle', 540, 780, 1.2, {}, lt, t);
      if (lt > tr) { H.sfx('ding', s0 + tr, 1); for (let i = 0; i < 5; i++) H.sfx('pop', s0 + tr + 0.2 + i * 0.12, 0.4); }
      big(H, 'DÍA 120', '', lt, 0.05);
      H.bignum('12 KM', 'NUEVO RÉCORD MUNDIAL', 210, lt, W(H, s0, '12'));
      return { bg: 'spotPurple', world: w, cam: [540, 960, 1.0], particles: 'none' };
    }
    let w = P(H, 'newsTV', 540, 900, 1.15, { headline: 'RÉCORD 12 KM' }, lt, t);
    const hx = H.lerp(1300, -300, H.clamp((lt - tg) / (dur - tg + 0.5), 0, 1));
    w += P(H, 'heli', hx, 420, 0.8, {}, lt, t, -6) + P(H, 'heli', hx + 420, 560, 0.6, {}, lt, t, -6);
    H.sfx('heli', s0 + tg, 1);
    return { bg: 'spotBlue', world: w, cam: [540, 960, 1.0], flash: 0.7 * Math.max(0, 1 - (lt - tg + 0.1) / 0.3), particles: 'none' };
  };

  // [9] Pero hay un problema. El centro de la Tierra está a más de 6.000 kilómetros... y allá abajo hace casi tanto calor como en la superficie del Sol.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt, t6 = W(H, s0, '6000'), ts = W(H, s0, 'sol');
    let w = P(H, 'earthCut', 540, 860, 1.0, {}, lt, t, 0);
    if (lt > ts) { w += P(H, 'sun', 880, 470, 0.4 * H.pop(lt, ts), { cover: 0, moonGone: 1 }, lt, t); H.sfx('boom', s0 + ts, 0.5); }
    H.bignum('6.371 KM', 'HASTA EL CENTRO', 210, lt < ts ? lt : -1, t6);
    H.bignum('5.200°C', 'EN EL NÚCLEO', 210, lt, ts);
    return { bg: 'space', world: w, cam: H.cam([540, 860, 0.85], [540, 860, 1.0], lt / dur), particles: 'none' };
  };

  // [10] Después de todo ese esfuerzo... solo excavaste el 0,2% del camino.
  S[10] = (H, lt, dur, t) => {
    const s0 = t - lt, tp = W(H, s0, '0,2%');
    const w = P(H, 'earthCut', 540, 860, 1.0, { marker: lt > 0.5 }, lt, t);
    if (lt > tp) H.sfx('buzz', s0 + tp, 0.5);
    H.bignum('0,2%', 'DEL CAMINO', 210, lt, tp);
    const z = H.lerp(1.0, 2.6, H.ease.inOut(H.clamp(lt / 2.5, 0, 1)));
    return { bg: 'space', world: w, cam: [H.lerp(540, 834, H.clamp(lt / 2.5, 0, 1)), H.lerp(860, 560, H.clamp(lt / 2.5, 0, 1)), z], particles: 'none', autoCut: false };
  };

  // [11] Ahora dime: ¿hasta qué día llegarías tú? Escríbelo... compártelo... y sígueme.
  S[11] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = `<ellipse cx="700" cy="1520" rx="200" ry="50" fill="#2a1a12"/>`;
    w += P(H, 'person', 420, 1480, 1.1, me({ mood: 'talk', pose: 'hold', holding: 'shovel', holdRot: -20 }), lt, t);
    w += ICON(H, 'quest', 760, 880, 0.9, lt, 0.3, t);
    H.ov('<div class="tag">¿HASTA QUÉ DÍA LLEGARÍAS?</div>', 330, lt, W(H, s0, 'hasta'));
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1420, lt, W(H, s0, 'comentarios'));
    return { bg: 'backyard', world: w, cam: [540, 1300, 1.0], particles: 'none' };
  };
})();
