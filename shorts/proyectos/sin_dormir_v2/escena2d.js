// v2 de "72 horas sin dormir": la persona reacciona en su casa (habitación, sala, cocina, calle)
// y el cerebro aparece en escenas separadas "dentro de tu cabeza". Todo con volumen 3D.
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const FLAT = new Set(['darkness', 'puff', 'stamp', 'particlesIn', 'sparkle', 'ghost']);
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op, FLAT.has(kind) ? false : 'vol');
  const ICON = (H, kind, x, y, s, lt, at, t) => (lt > at ? H.at(x, y, s, A.icon({ kind, seed: x }, { t, lt: lt - at }), 0, 1, 'vol') : '');
  const W = (H, s0, w, after) => H.wt(w, after ?? s0) - s0;
  const big = (H, n, label, lt, t0, d = 1.9) => H.bignum(n, label, 210, lt < t0 + d ? lt : -1, t0);
  const ME = { shirt: '#2fb3a3', pants: '#2f4f8a', hairStyle: 'short', hair: '#3a2418', seed: 5 };
  const me = (o) => Object.assign({}, ME, o);
  const ROOMCAM = [540, 1300, 1.0], BRAINCAM = [540, 930, 1.0];
  // destello + whoosh al cambiar de plano dentro de una escena
  const cut = (H, s0, lt, tc) => { if (lt > tc) H.sfx('whoosh', s0 + tc - 0.1, 0.8); return lt > tc ? 0.85 * Math.max(0, 1 - (lt - tc) / 0.3) : 0; };
  const ticks = (H, s0) => { for (let i = 0; i < 4; i++) H.sfx('tick', s0 + 0.15 + i * 0.25, 1); };

  // [1] En 1964, un estudiante de 17 años estuvo 11 DÍAS sin dormir...
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt, te = W(H, s0, 'estudiante'), t11 = W(H, s0, '11'), tn = W(H, s0, 'nadie');
    const day = Math.max(1, Math.min(11, Math.floor(1 + 10 * H.clamp((lt - te) / Math.max(0.5, t11 - te), 0, 1))));
    let w = P(H, 'poster', 260, 640, 0.7, { color: '#c2435a' }, lt, t);
    w += P(H, 'calendar', 800, 640, 0.55, { day: String(day), month: 'AÑO 1964', weekday: 'DÍA' }, lt + 1, t, 4);
    if (lt > te && day < 11) H.sfx('tick', s0 + te + day * 0.15, 0.6);
    w += P(H, 'nightstand', 130, 1420, 0.9, {}, lt, t) + P(H, 'bed3', 820, 1560, 0.95, { blanket: '#c2435a' }, lt, t);
    w += P(H, 'person', 440, 1520, 1.15, me({ shirt: '#5b7cff', hairStyle: 'spiky', hair: '#2a1a12', mood: lt > tn ? 'scared' : 'tired', pose: lt > tn ? 'scared' : 'idle', seed: 4 }), lt, t);
    w += ICON(H, 'excl', 600, 860, 0.7, lt, tn, t);
    big(H, '11', 'DÍAS SIN DORMIR', lt, t11);
    const k = H.clamp((lt - (dur - 0.55)) / 0.55, 0, 1);
    if (k > 0) H.sfx('whoosh', s0 + dur - 0.55, 1);
    const cam = [H.lerp(540, 440, k), H.lerp(1300, 980, k), 1 + H.ease.in(k) * 5];
    return { bg: 'bedroomDay', world: w, cam, filter: 'sepia(0.5)', flash: 0.9 * H.ease.in(k), particles: 'none', autoCut: k === 0 };
  };

  // [2] ¿Qué pasaría si TÚ no durmieras en 72 horas?  (dentro de tu cabeza)
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt;
    const w = P(H, 'brain', 540, 760, 1.05, { mood: 'happy', look: [0, 0.2], seed: 1 }, lt, t);
    big(H, '72', 'HORAS SIN DORMIR', lt, W(H, s0, '72'), 9);
    return { bg: 'spotNight', world: w, cam: BRAINCAM, flash: 0.9 * Math.max(0, 1 - lt / 0.35), particles: 'none' };
  };

  // [3] Hora 16. Tu cuerpo ya está pidiendo cama. | Tu cerebro empieza a acumular una sustancia...
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, tb = W(H, s0, 'cerebro'), ts = W(H, s0, 'sustancia');
    ticks(H, s0);
    if (lt < tb) {
      let w = P(H, 'wallClock', 300, 560, 0.4, { hours: H.lerp(14, 16, H.clamp(lt / 1.2, 0, 1)) }, lt, t);
      w += P(H, 'nightstand', 950, 1420, 0.9, {}, lt, t) + P(H, 'bed3', 300, 1580, 1.0, {}, lt, t);
      w += P(H, 'rug', 620, 1620, 0.9, { color: '#5b7cff' }, lt, t);
      w += P(H, 'person', 640, 1540, 1.15, me({ mood: lt > 1.0 ? 'yawn' : 'tired', pose: lt > 1.0 ? 'cheer' : 'idle' }), lt, t);
      w += ICON(H, 'sweat', 780, 890, 0.6, lt, 1.6, t);
      big(H, '16', 'HORAS DESPIERTO', lt, 0.05);
      return { bg: 'bedroomNight', world: w, cam: ROOMCAM, particles: 'none' };
    }
    let w = P(H, 'brain', 540, 780, 0.95, { mood: 'tired', tired: 0.15, seed: 1 }, lt, t);
    if (lt > ts) w += P(H, 'particlesIn', 540, 780, 0.95, { n: 4 + (lt - ts) * 5 }, lt - ts, t);
    H.ov('<div class="tag" style="background:#b07cff;color:#fff">ADENOSINA = SUEÑO</div>', 330, lt, ts);
    return { bg: 'spotTeal', world: w, cam: BRAINCAM, flash: cut(H, s0, lt, tb), particles: 'none' };
  };

  // [4] Hora 24. | Tus reflejos... como alguien que ha bebido ALCOHOL. | Manejar ahora sería peligroso.
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, tr = W(H, s0, 'reflejos'), ta = W(H, s0, 'alcohol'), tm = W(H, s0, 'manejar');
    ticks(H, s0);
    if (lt < tr - 0.2) {
      let w = P(H, 'plant', 140, 1420, 1.0, {}, lt, t) + P(H, 'tvSet', 880, 1300, 0.6, {}, lt, t);
      w += P(H, 'wallClock', 420, 560, 0.4, { hours: H.lerp(16, 24, H.clamp(lt / 1.0, 0, 1)) }, lt, t);
      w += P(H, 'person', 540, 1540, 1.15, me({ mood: 'tired', pose: 'idle' }), lt, t, Math.sin(t * 2.2) * 7);
      big(H, '24', 'HORAS DESPIERTO', lt, 0.05);
      return { bg: 'livingNight', world: w, cam: ROOMCAM, particles: 'none' };
    }
    if (lt < tm - 0.1) {
      let w = P(H, 'brain', lt > ta ? 330 : 540, 780, lt > ta ? 0.72 : 0.95, { mood: 'dizzy', tired: 0.3, seed: 1 }, lt, t, Math.sin(t * 2) * 6);
      if (lt > ta) { w += `<text x="560" y="810" text-anchor="middle" font-family="Inter" font-weight="900" font-size="120" fill="#fff" stroke="#15111f" stroke-width="16" paint-order="stroke">=</text>`; w += P(H, 'junk', 790, 820, 1.0 * H.pop(lt, ta), { kind: 'bottle' }, lt, t, Math.sin(t * 2) * 8); H.sfx('pop', s0 + ta, 0.8); }
      return { bg: 'spotBlue', world: w, cam: BRAINCAM, flash: cut(H, s0, lt, tr - 0.2), particles: 'none' };
    }
    let w = P(H, 'carSide', 640, 1560, 1.15, {}, lt, t);
    w += P(H, 'person', 300, 1600, 1.1, me({ mood: 'tired', pose: 'hold', holding: 'celular' }), lt, t, Math.sin(t * 2.2) * 6);
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.25 }, lt, t);
    H.ov(H.MARK_NO, 330, lt, tm + 0.3);
    return { bg: 'street', world: w, cam: [540, 1360, 1.0], flash: cut(H, s0, lt, tm - 0.1), particles: 'none' };
  };

  // [5] Hora 36. Te da hambre... pero no de ensalada. Te pide grasa y azúcar. | Y tus defensas empiezan a bajar.
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt, te = W(H, s0, 'ensalada'), tg = W(H, s0, 'grasa'), taz = W(H, s0, 'azucar'), td = W(H, s0, 'defensas');
    ticks(H, s0);
    if (lt < td - 0.15) {
      let w = P(H, 'counter', 420, 1330, 0.9, { clock: lt > 0.6 ? '3:00' : '2:59' }, lt, t);
      w += P(H, 'fridge', 900, 1560, 0.75, { open: H.clamp(lt / 0.8, 0, 1) }, lt, t);
      if (lt > te) { w += P(H, 'junk', 250, 1000, 0.5, { kind: 'salad' }, lt, t); w += `<path d="M180 950 L320 1060 M320 950 L180 1060" stroke="#e5484d" stroke-width="20" stroke-linecap="round"/>`; H.sfx('buzz', s0 + te + 0.1, 0.4); }
      const hold = lt > taz ? 'donut' : lt > tg ? 'burger' : null;
      w += P(H, 'person', 560, 1560, 1.15, me({ mood: hold ? 'happy' : 'talk', pose: hold ? 'hold' : 'idle', holding: hold, holdRot: 0 }), lt, t);
      if (hold) { w += ICON(H, 'heart', 760, 860, 0.55, lt, tg + 0.2, t); H.sfx('pop', s0 + tg, 0.7); if (lt > taz) H.sfx('pop', s0 + taz, 0.7); }
      big(H, '36', 'HORAS DESPIERTO', lt, 0.05);
      return { bg: 'kitchenNight', world: w, cam: ROOMCAM, particles: 'none' };
    }
    let w = P(H, 'brain', 400, 780, 0.8, { mood: 'tired', tired: 0.4, seed: 1 }, lt, t);
    w += P(H, 'shield', 830, 820, 0.8 * H.pop(lt, td), { crack: H.clamp((lt - td - 0.3) / 1.2, 0, 1) }, lt, t);
    H.sfx('hit', s0 + td + 0.6, 0.7);
    H.ov('<div class="tag" style="background:#5b9cff;color:#fff">DEFENSAS BAJANDO</div>', 330, lt, td + 0.2);
    return { bg: 'spotWarm', world: w, cam: BRAINCAM, flash: cut(H, s0, lt, td - 0.15), particles: 'none' };
  };

  // [6] Hora 48. Empiezan los MICROSUEÑOS... | Mientras dormimos, el cerebro se limpia por dentro. Y tú llevas dos días sin limpiarlo.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, tm = W(H, s0, 'microsuenos'), tw = W(H, s0, 'mientras'), td = W(H, s0, 'dias');
    ticks(H, s0);
    if (lt < tw - 0.15) {
      const offs = [tm + 0.1, tm + 1.0, tm + 1.9, tm + 3.0];
      let off = false; offs.forEach((o) => { if (lt > o && lt < o + 0.25) off = true; if (lt > o) H.sfx('hit', s0 + o, 0.35); });
      const nod = offs.some((o) => lt > o - 0.15 && lt < o + 0.4);
      let w = P(H, 'wallClock', 300, 560, 0.4, { hours: H.lerp(36, 48, H.clamp(lt / 1.0, 0, 1)) }, lt, t);
      w += P(H, 'plant', 980, 1360, 0.9, {}, lt, t);
      w += P(H, 'person', 540, 1430, 1.1, me({ mood: nod ? 'sleep' : 'tired' }), lt, t, nod ? 10 : 0);
      w += P(H, 'sofa', 540, 1600, 1.0, { color: '#c2435a' }, lt, t);
      big(H, '48', 'HORAS DESPIERTO', lt, 0.05);
      H.ov('<div class="tag" style="background:#1d1d24;color:#fff">MICROSUEÑOS</div>', 330, lt, Math.max(tm, 2.7));
      return { bg: 'livingNight', world: w, cam: ROOMCAM, screen: off ? `<rect width="1080" height="1920" fill="#000" opacity="0.93"/>` : '', particles: 'none' };
    }
    const tl = W(H, s0, 'limpia');
    let w = P(H, 'brain', 540, 780, 0.95, { mood: lt > td ? 'tired' : 'happy', tired: 0.5, dirt: lt > td ? H.clamp((lt - td) / 1.2, 0, 1) * 0.9 : 0, seed: 1 }, lt, t);
    if (lt > tl && lt < td) { w += P(H, 'broom', 820, 760, 0.8, {}, lt, t) + P(H, 'sparkle', 520, 760, 1, {}, lt, t); H.sfx('swoosh', s0 + tl + 0.2, 0.8); H.sfx('swoosh', s0 + tl + 0.8, 0.8); }
    if (lt > td) w += ICON(H, 'sweat', 760, 560, 0.7, lt, td + 0.3, t);
    return { bg: 'spotPurple', world: w, cam: BRAINCAM, flash: cut(H, s0, lt, tw - 0.15), particles: 'none' };
  };

  // [7] Hora 72. Te cuesta pensar, te confundes... | y puedes empezar a ver cosas que NO existen.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, tp = W(H, s0, 'puedes'), tc = W(H, s0, 'cosas');
    ticks(H, s0);
    H.sfx('heartbeat', s0 + 0.8, 0.9); H.sfx('heartbeat', s0 + 2.4, 1); H.sfx('heartbeat', s0 + 4.0, 1);
    if (lt < tp - 0.15) {
      const w = P(H, 'brain', 540, 780, 0.95, { mood: 'dizzy', tired: 0.75, dirt: 0.9, seed: 1 }, lt, t, Math.sin(t * 3) * 7);
      big(H, '72', 'HORAS DESPIERTO', lt, 0.05);
      return { bg: 'spotRed', world: w, cam: BRAINCAM, shake: 4, particles: 'none' };
    }
    let w = P(H, 'nightstand', 950, 1420, 0.9, {}, lt, t) + P(H, 'bed3', 300, 1580, 1.0, {}, lt, t);
    w += P(H, 'person', 620, 1540, 1.15, me({ mood: 'scared', pose: 'scared', look: [Math.sin(t * 3), -0.3] }), lt, t);
    if (lt > tc) [[180, 700], [880, 820], [260, 1100], [900, 1180]].forEach(([x, y], i) => { w += P(H, 'ghost', x, y, 0.85 * H.pop(lt, tc + i * 0.25), { seed: i }, lt, t); });
    if (lt > tc) H.sfx('riser', s0 + tc, 0.6);
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.3 }, lt, t);
    return { bg: 'bedroomNight', world: w, cam: ROOMCAM, filter: `hue-rotate(${(Math.sin(t * 2) * 40).toFixed(0)}deg) saturate(1.4)`, shake: 3, flash: cut(H, s0, lt, tp - 0.15), particles: 'none' };
  };

  // [8] Por eso el récord de los 11 días ya no se acepta: es demasiado peligroso intentarlo.
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt, tp = W(H, s0, 'peligroso');
    let w = P(H, 'calendar', 540, 760, 1.0, { day: '11', month: 'RÉCORD 1964', weekday: 'DÍAS' }, lt + 1, t, -4);
    if (lt > tp) { w += P(H, 'stamp', 540, 780, 1.0, { text: 'PELIGROSO' }, lt - tp, t); H.sfx('hit', s0 + tp + 0.15, 1); }
    return { bg: 'bedroomDay', world: w, cam: [540, 1100, 1.0], filter: 'sepia(0.4)', particles: 'none', shake: lt > tp && lt < tp + 0.25 ? 10 : 0 };
  };

  // [9] Ahora dime: ¿cuántas horas... has aguantado sin dormir? Escríbelo en los comentarios... y sígueme.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'wallClock', 300, 560, 0.4, { hours: 7 + t * 0.2 }, lt, t);
    w += P(H, 'bed3', 300, 1580, 1.0, {}, lt, t) + P(H, 'nightstand', 950, 1420, 0.9, {}, lt, t);
    w += P(H, 'person', 640, 1540, 1.15, me({ mood: 'talk', pose: 'shrug', look: [0, -0.2] }), lt, t);
    H.ov('<div class="tag">¿TU RÉCORD SIN DORMIR?</div>', 330, lt, W(H, s0, 'cuantas'));
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1420, lt, W(H, s0, 'comentarios'));
    return { bg: 'bedroomDay', world: w, cam: ROOMCAM, particles: 'none' };
  };
})();
