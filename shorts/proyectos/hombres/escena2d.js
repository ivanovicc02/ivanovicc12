// "¿Qué pasaría si mañana el mundo fuera solo de hombres?" — línea de tiempo de segundo 1 a 100 años.
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const FLAT = new Set(['darkness', 'puff', 'stamp', 'sparkle', 'crowdV', 'ruins', 'crowd']);
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op, FLAT.has(kind) ? false : 'vol');
  const ICON = (H, kind, x, y, s, lt, at, t) => (lt > at ? H.at(x, y, s, A.icon({ kind, seed: x }, { t, lt: lt - at }), 0, 1, 'vol') : '');
  const W = (H, s0, w, after) => H.wt(w, after ?? s0) - s0;
  const big = (H, n, label, lt, t0, d = 2.0) => H.bignum(n, label, 210, lt < t0 + d ? lt : -1, t0);
  const stage = (H, s0) => { H.sfx('whoosh', s0, 0.9); H.sfx('tick', s0 + 0.2, 1); H.sfx('tick', s0 + 0.45, 1); };
  const DAD = { shirt: '#5b7cff', pants: '#2f4f8a', hairStyle: 'short', hair: '#3a2418', mustache: '#3a2418', seed: 6 };
  const dad = (o) => Object.assign({}, DAD, o);
  const kid = (o) => Object.assign({ shirt: '#f2c230', hairStyle: 'spiky', hair: '#2a1a12', seed: 9 }, o);
  const ROOMCAM = [540, 1300, 1.0];

  // [1] ¿Qué pasaría si mañana el mundo fuera solo de HOMBRES?
  S[1] = (H, lt, dur, t) => {
    const w = P(H, 'crowdV', 0, 0, 1, { vanish: null }, lt, t);
    return { bg: 'spotNight', world: w, cam: H.cam([540, 960, 1.15], [540, 960, 1.0], lt / dur), particles: 'none' };
  };
  // [2] Segundo uno. La mitad del planeta desaparece. Todas las mujeres. Las niñas. Las abuelas. Todas.
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt, tv = W(H, s0, 'desaparece');
    stage(H, s0);
    if (lt > tv) { H.sfx('riser', s0 + tv - 0.6, 0.6); for (let i = 0; i < 6; i++) H.sfx('pop', s0 + tv + i * 0.14, 0.5); }
    const w = P(H, 'crowdV', 0, 0, 1, { vanish: tv }, lt, t);
    big(H, 'SEGUNDO 1', '', lt, 0.05);
    H.bignum('50%', 'DEL PLANETA', 210, lt, tv + 0.6);
    return { bg: 'spotNight', world: w, cam: [540, 960, 1.0], flash: lt > tv ? 0.35 * Math.max(0, 1 - (lt - tv) / 0.5) : 0, flashColor: '#7dffb0', particles: 'none' };
  };
  // [3] Hora uno. En los hospitales, 9 de cada 10 enfermeras ya no están. Las salas de urgencias se llenan...
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, tu = W(H, s0, 'urgencias'), tm = W(H, s0, 'medicos');
    stage(H, s0);
    let w = P(H, 'hospBed', 270, 1420, 0.85, {}, lt, t) + P(H, 'hospBed', 820, 1420, 0.85, {}, lt, t);
    if (lt > tu) [[180, 1330], [700, 1330], [430, 1600], [930, 1600]].forEach(([x, y], i) => { w += P(H, 'person', x, y, 0.7 * H.pop(lt, tu + i * 0.2), dad({ shirt: ['#e5484d', '#8bd16a', '#f07f2a', '#b07cff'][i], mustache: null, mood: 'worried', pose: i % 2 ? 'scared' : 'hug', seed: 20 + i }), lt, t); });
    w += P(H, 'person', 540, 1560, 1.05, { coat: true, glasses: true, hairStyle: 'short', hair: '#5a3a22', shirt: '#2fb3a3', mood: lt > tm ? 'scared' : 'worried', pose: lt > tm ? 'scared' : 'idle', seed: 2 }, lt, t, Math.sin(t * 9) * (lt > tm ? 3 : 0));
    w += ICON(H, 'sweat', 680, 900, 0.6, lt, tm, t) + ICON(H, 'excl', 380, 880, 0.6, lt, tu + 0.6, t);
    big(H, 'HORA 1', '', lt, 0.05);
    H.bignum('9 DE 10', 'ENFERMERAS', 210, lt < tu ? lt : -1, W(H, s0, '9'));
    return { bg: 'hospital', world: w, cam: ROOMCAM, particles: 'none' };
  };
  // [4] Día uno. Las escuelas abren... pero la mayoría de las maestras ya no están. Millones de niños se quedan en casa con sus papás.
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, tc = W(H, s0, 'casa');
    stage(H, s0);
    if (lt < tc - 0.3) {
      let w = '';
      [[250, 1450], [540, 1450], [830, 1450], [250, 1700], [540, 1700], [830, 1700]].forEach(([x, y]) => (w += P(H, 'desk', x, y, 0.95, {}, lt, t)));
      w += P(H, 'person', 920, 1420, 0.65, kid({ mood: 'worried', look: [-0.6, 0] }), lt, t);
      big(H, 'DÍA 1', '', lt, 0.05);
      H.ov('<div class="tag" style="background:#e5484d;color:#fff">SIN MAESTRAS</div>', 330, lt, W(H, s0, 'maestras'));
      return { bg: 'classroom', world: w, cam: ROOMCAM, particles: 'none' };
    }
    let w = P(H, 'tvSet', 900, 1290, 0.55, {}, lt, t);
    w += P(H, 'person', 360, 1540, 1.1, dad({ mood: 'worried', pose: 'shrug' }), lt, t);
    w += P(H, 'person', 680, 1560, 0.68, kid({ mood: 'happy', pose: 'cheer' }), lt, t) + P(H, 'person', 820, 1560, 0.6, kid({ shirt: '#8bd16a', hairStyle: 'curly', mood: 'happy', pose: 'wave', seed: 11 }), lt, t);
    H.sfx('whoosh', s0 + tc - 0.4, 0.7);
    return { bg: 'livingNight', world: w, cam: ROOMCAM, flash: 0.8 * Math.max(0, 1 - (lt - tc + 0.3) / 0.3), particles: 'none' };
  };
  // [5] Día siete. Los papás aprenden a cocinar, a lavar la ropa, a hacer el súper... y a dormir muy poco.
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt, tco = W(H, s0, 'cocinar'), tl = W(H, s0, 'lavar'), ts = W(H, s0, 'super'), td = W(H, s0, 'dormir');
    stage(H, s0);
    let w = P(H, 'counter', 420, 1330, 0.9, { clock: lt > td ? '3:40' : '7:15' }, lt, t);
    if (lt > tco) { w += P(H, 'pan', 300, 1000, 0.7, { burnt: lt > tco + 0.8 }, lt, t); H.sfx('hiss', s0 + tco + 0.8, 0.6); }
    if (lt > tl) w += P(H, 'laundry', 860, 1560, 0.75 * H.pop(lt, tl), {}, lt, t);
    if (lt > ts) w += P(H, 'item', 150, 1520, 0.9 * H.pop(lt, ts), { kind: 'efectivo' }, lt, t);
    w += P(H, 'person', 560, 1560, 1.1, dad({ mood: lt > td ? 'tired' : lt > tco + 0.8 ? 'scared' : 'talk', pose: lt > td ? 'idle' : 'scared' }), lt, t);
    w += ICON(H, 'sweat', 700, 900, 0.6, lt, tco + 0.9, t);
    big(H, 'DÍA 7', '', lt, 0.05);
    return { bg: 'kitchenNight', world: w, cam: ROOMCAM, particles: 'none' };
  };
  // [6] Primer mes. Millones de trabajos se quedan vacíos. Tiendas, oficinas y fábricas cierran o funcionan a medias.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, tc = W(H, s0, 'cierran');
    stage(H, s0);
    let w = '';
    [[220, '#5b7cff', 'tiendas'], [540, '#e5484d', 'oficinas'], [860, '#2bb673', 'fabricas']].forEach(([x, col, wd], i) => { const at = W(H, s0, wd); w += P(H, 'shop', x, 1560, 0.72, { color: col, closed: lt > Math.max(at, tc - 0.2 + i * 0.25) }, lt, t); if (lt > Math.max(at, tc - 0.2 + i * 0.25)) H.sfx('hit', s0 + Math.max(at, tc - 0.2 + i * 0.25), 0.5); });
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.15 }, lt, t);
    big(H, 'MES 1', '', lt, 0.05);
    return { bg: 'street', world: w, cam: [540, 1450, 1.0], particles: 'none' };
  };
  // [7] Mes nueve. En todos los hospitales del mundo... silencio. No nace ni un solo bebé.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, tsi = W(H, s0, 'silencio');
    stage(H, s0);
    let w = '';
    [[270, 1420], [810, 1420], [540, 1660]].forEach(([x, y]) => (w += P(H, 'crib', x, y, 0.8, {}, lt, t)));
    w += ICON(H, 'quest', 540, 1200, 0.8, lt, W(H, s0, 'bebe'), t);
    w += P(H, 'darkness', 0, 0, 1, { amount: H.lerp(0, 0.35, H.clamp((lt - tsi) / 1, 0, 1)) }, lt, t);
    big(H, 'MES 9', '', lt, 0.05);
    H.bignum('0', 'BEBÉS', 210, lt, W(H, s0, 'nace'));
    return { bg: 'hospital', world: w, cam: ROOMCAM, particles: 'none' };
  };
  // [8] Primer año. Los científicos corren contra el tiempo... un corderito... útero artificial... pero con humanos, todavía no.
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt, tc = W(H, s0, 'corderito'), tn = W(H, s0, 'todavia');
    stage(H, s0);
    let w = P(H, 'person', 230, 1560, 1.0, { coat: true, glasses: true, hairStyle: 'bald', hair: '#9a9a9a', shirt: '#7a8fb0', mood: lt > tn ? 'worried' : 'talk', pose: 'point', seed: 2 }, lt, t);
    if (lt > tc) { w += P(H, 'bubbleLab', 700, 900, 0.95 * H.pop(lt, tc, 0.45), {}, lt, t); H.sfx('bubbles', s0 + tc, 0.6); }
    w += P(H, 'clock', 880, 470, 0.3, { hours: t * 3 }, lt, t);
    big(H, 'AÑO 1', '', lt, 0.05);
    if (lt > tn) H.ov(H.MARK_NO, 330, lt, tn + 0.1);
    return { bg: 'spotTeal', world: w, cam: [540, 1100, 1.0], particles: 'none' };
  };
  // [9] Diez años. Ya no hay niños pequeños. Los parques, las jugueterías y las guarderías cierran para siempre.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt;
    stage(H, s0);
    let w = P(H, 'swing', 360, 1560, 1.0, {}, lt, t) + P(H, 'slide', 820, 1560, 0.9, {}, lt, t);
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.2 }, lt, t);
    big(H, '10 AÑOS', '', lt, 0.05);
    H.ov('<div class="tag">SIN NIÑOS</div>', 330, lt, W(H, s0, 'ninos'));
    for (let k = 0; k * 4 < dur; k++) H.sfx('wind', s0 + k * 4, 0.6);
    return { bg: 'meadow', world: w, cam: [540, 1300, 1.0], filter: 'saturate(0.6)', particles: 'none' };
  };
  // [10] Cincuenta años. La persona más joven del planeta tiene 50 años. Las ciudades se quedan medio vacías.
  S[10] = (H, lt, dur, t) => {
    const s0 = t - lt;
    stage(H, s0);
    const x = H.lerp(250, 760, lt / dur);
    let w = P(H, 'shop', 220, 1560, 0.6, { color: '#7d838c', closed: true }, lt, t) + P(H, 'shop', 860, 1560, 0.6, { color: '#7d838c', closed: true }, lt, t);
    w += P(H, 'person', x, 1620, 1.0, dad({ hair: '#d9d9d9', mustache: '#d9d9d9', hairStyle: 'bald', shirt: '#8a7a6a', mood: 'tired', pose: 'hold' }), lt, t);
    w += P(H, 'cane', x + 170, 1620, 1.0, {}, lt, t);
    for (let i = 0; i < 5; i++) H.sfx('step', s0 + 0.8 + i * 0.9, 0.6);
    big(H, '50 AÑOS', '', lt, 0.05);
    H.bignum('50', 'EL MÁS JOVEN', 210, lt, W(H, s0, '50', s0 + 2.2));
    return { bg: 'street', world: w, cam: [540, 1480, 1.0], filter: 'saturate(0.5) sepia(0.2)', particles: 'none' };
  };
  // [11] Cien años. El último ser humano se apaga... y la naturaleza empieza a tragarse las ciudades.
  S[11] = (H, lt, dur, t) => {
    const s0 = t - lt, tn = W(H, s0, 'naturaleza');
    stage(H, s0);
    const w = P(H, 'ruins', 0, 0, 1, { growth: H.ease.inOut(H.clamp((lt - tn + 0.5) / 3, 0, 1)) }, lt, t);
    for (let k = 0; k * 4 < dur; k++) H.sfx('wind', s0 + k * 4, 0.7);
    big(H, '100 AÑOS', '', lt, 0.05);
    return { bg: 'meadow', world: w, cam: H.cam([540, 1100, 1.15], [540, 1100, 1.0], lt / dur), particles: 'none' };
  };
  // [12] Así que no sería un mundo de hombres... sería el final del mundo.
  S[12] = (H, lt, dur, t) => {
    const s0 = t - lt, tf = W(H, s0, 'final');
    const w = P(H, 'globe', 540, 800, 1.1, { rot: 1.4 }, lt, t);
    if (lt > tf) H.sfx('boom', s0 + tf, 0.7);
    return { bg: 'space', world: w, cam: H.cam([540, 860, 0.9], [540, 860, 1.1], lt / dur), filter: lt > tf ? `grayscale(${H.clamp((lt - tf) / 1.2, 0, 1).toFixed(2)})` : '', particles: 'none' };
  };
  // [13] ¿Qué sería lo primero que cambiaría? Dímelo en comentarios... compártelo... y sígueme.
  S[13] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'crowdV', 0, 0, 1, { vanish: -10 }, lt, t);
    w += ICON(H, 'quest', 540, 760, 1.4, lt, 0.3, t);
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1420, lt, W(H, s0, 'comentarios'));
    return { bg: 'spotNight', world: w, cam: [540, 960, 1.0], particles: 'none' };
  };
})();
