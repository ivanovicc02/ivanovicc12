// "¿Qué pasaría si no durmieras en 72 horas?" — estilo nuevo: cerebro personaje, reloj, monitor,
// números gigantes, contorno pegatina, reacciones y transición zambulléndose.
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const NOSTK = new Set(['darkness', 'puff', 'stamp', 'particlesIn', 'sparkle', 'ghost']);
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op, !NOSTK.has(kind));
  const ICON = (H, kind, x, y, s, lt, at, t, life) => (lt > at ? H.at(x, y, s, A.icon({ kind, life, seed: x }, { t, lt: lt - at }), 0, 1, true) : '');
  const at = (H, s0, w, after) => H.wt(w, after ?? s0) - s0;
  // número gigante visible solo unos segundos
  const big = (H, n, label, lt, t0, d = 2.6) => H.bignum(n, label, 250, lt < t0 + d ? lt : -1, t0);
  const hourIntro = (H, s0, n) => { H.sfx('whoosh', s0, 0.8); for (let i = 0; i < 4; i++) H.sfx('tick', s0 + 0.15 + i * 0.25, 1); };

  // [1] En 1964, un estudiante de 17 años estuvo 11 DÍAS sin dormir. Y lo que le pasó a su cerebro... nadie lo esperaba.
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt, te = at(H, s0, 'estudiante'), t11 = at(H, s0, '11'), tc = at(H, s0, 'cerebro'), tn = at(H, s0, 'nadie');
    const day = Math.max(1, Math.min(11, Math.floor(1 + 10 * H.clamp((lt - te) / Math.max(0.5, t11 - te), 0, 1))));
    let w = P(H, 'person', 430, 1150, 1.0, { shirt: '#5b7cff', hairStyle: 'spiky', hair: '#2a1a12', mood: lt > tn ? 'scared' : 'worried', pose: lt > tc ? 'scared' : 'idle', seed: 4, look: [0.5, -0.2] }, lt, t);
    if (lt > te) { w += P(H, 'calendar', 830, 650, 0.62, { day: String(day), month: 'AÑO 1964', weekday: 'DÍA' }, lt - te, t, 6); if (day < 11) H.sfx('tick', s0 + te + day * 0.15, 0.6); }
    w += ICON(H, 'quest', 430, 560, 0.8, lt, tc, t) + ICON(H, 'excl', 600, 520, 0.8, lt, tn, t);
    big(H, '11', 'DÍAS SIN DORMIR', lt, t11);
    // transición: zambullirse en la cabeza
    const k = H.clamp((lt - (dur - 0.55)) / 0.55, 0, 1);
    const cam = [H.lerp(540, 430, k), H.lerp(960, 730, k), 1 + H.ease.in(k) * 5];
    if (k > 0) H.sfx('whoosh', s0 + dur - 0.55, 1);
    return { bg: 'spotSepia', world: w, cam, filter: 'sepia(0.45)', flash: 0.9 * H.ease.in(k), particles: 'none', autoCut: k === 0 };
  };

  // [2] ¿Qué pasaría si TÚ no durmieras en 72 horas?
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt;
    const w = P(H, 'brain', 540, 760, 1.05, { mood: 'happy', look: [0, 0.2], seed: 1 }, lt, t);
    big(H, '72', 'HORAS SIN DORMIR', lt, at(H, s0, '72'), 9);
    return { bg: 'spotNight', world: w, cam: [540, 900, 1.0], flash: 0.9 * Math.max(0, 1 - lt / 0.35), particles: 'none' };
  };

  // [3] Hora 16. Tu cuerpo ya está pidiendo cama. Tu cerebro empieza a acumular una sustancia que te da sueño... y cada hora hay más.
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, tcama = at(H, s0, 'cama'), ts = at(H, s0, 'sustancia');
    hourIntro(H, s0);
    let w = P(H, 'brain', 540, 780, 0.9, { mood: 'tired', tired: 0.15, seed: 1 }, lt, t, Math.sin(t * 1.2) * 2);
    if (lt > ts) w += P(H, 'particlesIn', 540, 780, 0.9, { n: 4 + (lt - ts) * 5, color: '#b07cff' }, lt - ts, t);
    w += P(H, 'clock', 900, 470, 0.32, { hours: H.lerp(14, 16, H.clamp(lt / 1.2, 0, 1)) }, lt, t);
    if (lt > tcama) { w += P(H, 'junk', 540, 1480, 0.75 * H.pop(lt, tcama), { kind: 'bed' }, lt, t); H.sfx('pop', s0 + tcama, 0.6); }
    big(H, '16', 'HORAS DESPIERTO', lt, 0.05);
    H.ov('<div class="tag" style="background:#b07cff;color:#fff">ADENOSINA = SUEÑO</div>', 330, lt, Math.max(ts, 2.7));
    return { bg: 'spotTeal', world: w, cam: [540, 930, 1.0], particles: 'none' };
  };

  // [4] Hora 24. Tus reflejos están tan lentos como los de alguien que ha bebido ALCOHOL. Manejar ahora sería peligroso.
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, ta = at(H, s0, 'alcohol'), tm = at(H, s0, 'manejar'), tr = at(H, s0, 'reflejos');
    hourIntro(H, s0);
    let w = P(H, 'brain', lt > ta ? 330 : 540, 780, lt > ta ? 0.72 : 0.9, { mood: lt > tr ? 'dizzy' : 'tired', tired: 0.3, seed: 1 }, lt, t, Math.sin(t * 2) * 6);
    w += P(H, 'clock', 900, 470, 0.32, { hours: H.lerp(16, 24, H.clamp(lt / 1.2, 0, 1)) }, lt, t);
    if (lt > ta) { w += `<text x="560" y="810" text-anchor="middle" font-family="Inter" font-weight="900" font-size="120" fill="#fff" stroke="#15111f" stroke-width="16" paint-order="stroke">=</text>`; w += P(H, 'junk', 790, 820, 1.0 * H.pop(lt, ta), { kind: 'bottle' }, lt, t, Math.sin(t * 2) * 8); H.sfx('pop', s0 + ta, 0.8); }
    if (lt > tm) { w += P(H, 'carSide', 540, 1500, 0.7 * H.pop(lt, tm), {}, lt, t, Math.sin(t * 6) * 3); w += ICON(H, 'excl', 820, 1300, 0.7, lt, tm + 0.2, t); }
    big(H, '24', 'HORAS DESPIERTO', lt, 0.05);
    if (lt > tm) H.ov(H.MARK_NO, 330, lt, tm + 0.3);
    return { bg: 'spotBlue', world: w, cam: [540, 930, 1.0], particles: 'none' };
  };

  // [5] Hora 36. Te da hambre... pero no de ensalada. Tu cuerpo te pide grasa y azúcar. Y tus defensas empiezan a bajar.
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt, te = at(H, s0, 'ensalada'), tg = at(H, s0, 'grasa'), taz = at(H, s0, 'azucar'), td = at(H, s0, 'defensas');
    hourIntro(H, s0);
    let w = P(H, 'brain', 540, 720, 0.78, { mood: 'hungry', tired: 0.4, seed: 1 }, lt, t);
    w += P(H, 'clock', 900, 470, 0.32, { hours: H.lerp(24, 36, H.clamp(lt / 1.2, 0, 1)) }, lt, t);
    if (lt > te) { w += P(H, 'junk', 200, 1000, 0.62 * H.pop(lt, te), { kind: 'salad' }, lt, t); w += ICON(H, 'excl', 200, 880, 0.0001, lt, te, t); w += `<path d="M120 940 L280 1080 M280 940 L120 1080" stroke="#e5484d" stroke-width="22" stroke-linecap="round" opacity="${H.clamp((lt - te - 0.2) / 0.2, 0, 1)}"/>`; }
    if (lt > tg) { w += P(H, 'junk', 260, 1470, 0.62 * H.pop(lt, tg), { kind: 'burger' }, lt, t, -6); w += ICON(H, 'heart', 380, 1340, 0.5, lt, tg + 0.2, t); }
    if (lt > taz) { w += P(H, 'junk', 820, 1470, 0.62 * H.pop(lt, taz), { kind: 'donut' }, lt, t, 8); w += ICON(H, 'heart', 920, 1340, 0.5, lt, taz + 0.2, t); }
    if (lt > td) w += P(H, 'shield', 880, 1000, 0.55 * H.pop(lt, td), { crack: H.clamp((lt - td - 0.3) / 1.2, 0, 1) }, lt, t);
    if (lt > td) H.sfx('hit', s0 + td + 0.5, 0.6);
    big(H, '36', 'HORAS DESPIERTO', lt, 0.05);
    return { bg: 'spotWarm', world: w, cam: [540, 930, 1.0], particles: 'none' };
  };

  // [6] Hora 48. Empiezan los MICROSUEÑOS: tu cerebro se apaga unos segundos... Mientras dormimos, el cerebro se limpia por dentro. Y tú llevas dos días sin limpiarlo.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, tm = at(H, s0, 'microsuenos'), tl = at(H, s0, 'limpia'), td = at(H, s0, 'dias');
    hourIntro(H, s0);
    // apagones de 0,2 s
    const offs = [tm + 0.1, tm + 1.0, tm + 1.9, tm + 3.0];
    let off = false; offs.forEach((o) => { if (lt > o && lt < o + 0.22) off = true; if (lt > o) H.sfx('hit', s0 + o, 0.35); });
    const mood = off ? 'sleep' : lt > tl ? 'happy' : 'tired';
    let w = P(H, 'brain', 540, 780, 0.9, { mood, tired: 0.5, dirt: lt > td ? H.clamp((lt - td) / 1.2, 0, 1) * 0.9 : 0, seed: 1 }, lt, t);
    w += P(H, 'clock', 900, 470, 0.32, { hours: H.lerp(36, 48, H.clamp(lt / 1.2, 0, 1)) }, lt, t);
    if (lt > tl && lt < td) { w += P(H, 'broom', 800, 760, 0.75, {}, lt, t) + P(H, 'sparkle', 520, 760, 1, {}, lt, t); H.sfx('swoosh', s0 + tl + 0.2, 0.8); H.sfx('swoosh', s0 + tl + 0.8, 0.8); }
    if (lt > td) w += ICON(H, 'sweat', 760, 560, 0.7, lt, td + 0.3, t);
    big(H, '48', 'HORAS DESPIERTO', lt, 0.05);
    H.ov('<div class="tag" style="background:#1d1d24;color:#fff">MICROSUEÑOS</div>', 330, lt, Math.max(tm, 2.7));
    let screen = off ? `<rect width="1080" height="1920" fill="#000" opacity="0.92"/>` : '';
    return { bg: 'spotPurple', world: w, cam: [540, 930, 1.0], screen, particles: 'none' };
  };

  // [7] Hora 72. Te cuesta pensar, te confundes... y puedes empezar a ver cosas que NO existen.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, tc = at(H, s0, 'cosas');
    hourIntro(H, s0);
    H.sfx('heartbeat', s0 + 0.8, 0.9); H.sfx('heartbeat', s0 + 2.4, 1); H.sfx('heartbeat', s0 + 4.0, 1);
    let w = P(H, 'brain', 540, 780, 0.9, { mood: 'dizzy', tired: 0.75, dirt: 0.9, seed: 1 }, lt, t, Math.sin(t * 3) * 7);
    w += P(H, 'clock', 900, 470, 0.32, { hours: H.lerp(48, 72, H.clamp(lt / 1.4, 0, 1)) }, lt, t);
    if (lt > tc) [[180, 600], [880, 760], [230, 1080], [860, 1150], [540, 1450]].forEach(([x, y], i) => { w += P(H, 'ghost', x, y, 0.8 * H.pop(lt, tc + i * 0.25), { seed: i }, lt, t); });
    if (lt > tc) H.sfx('riser', s0 + tc, 0.6);
    big(H, '72', 'HORAS DESPIERTO', lt, 0.05);
    const filter = `hue-rotate(${(Math.sin(t * 2) * 40).toFixed(0)}deg) saturate(1.4)`;
    return { bg: 'spotRed', world: w, cam: [540, 930, 1.0], filter: lt > tc - 1 ? filter : '', shake: 4, particles: 'none' };
  };

  // [8] Por eso el récord de los 11 días ya no se acepta: es demasiado peligroso intentarlo.
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt, tp = at(H, s0, 'peligroso');
    let w = P(H, 'calendar', 540, 780, 1.0, { day: '11', month: 'RÉCORD 1964', weekday: 'DÍAS' }, lt + 1, t, -4);
    if (lt > tp) { w += P(H, 'stamp', 540, 800, 1.0, { text: 'PELIGROSO' }, lt - tp, t); H.sfx('hit', s0 + tp + 0.15, 1); }
    return { bg: 'spotSepia', world: w, cam: [540, 930, 1.0], filter: 'sepia(0.35)', particles: 'none', shake: lt > tp && lt < tp + 0.25 ? 10 : 0 };
  };

  // [9] Ahora dime: ¿cuántas horas es lo máximo que tú has aguantado sin dormir? Escríbelo en los comentarios... y sígueme.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'person', 540, 1150, 1.0, { shirt: '#2fb3a3', hairStyle: 'short', mood: 'talk', pose: 'shrug', seed: 7, look: [0, -0.3] }, lt, t);
    w += P(H, 'clock', 230, 560, 0.35, { hours: t * 2 }, lt, t) + ICON(H, 'quest', 850, 560, 0.8, lt, 0.4, t);
    H.ov('<div class="tag">¿TU RÉCORD SIN DORMIR?</div>', 330, lt, at(H, s0, 'cuantas'));
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1420, lt, at(H, s0, 'comentarios'));
    return { bg: 'spotNight', world: w, cam: [540, 930, 1.0], particles: 'none' };
  };
})();
