// "¿Qué pasaría si desapareciera toda el agua del mundo?" — estilo una palabra, volumen, números gigantes.
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const FLAT = new Set(['darkness', 'puff', 'sparkle', 'seaBasin', 'dust', 'trench']);
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op, FLAT.has(kind) ? false : 'vol');
  const ICON = (H, kind, x, y, s, lt, at, t) => (lt > at ? H.at(x, y, s, A.icon({ kind, seed: x }, { t, lt: lt - at }), 0, 1, 'vol') : '');
  const W = (H, s0, w, after) => H.wt(w, after ?? s0) - s0;
  const big = (H, n, label, lt, t0, d = 2.0) => H.bignum(n, label, 210, lt < t0 + d ? lt : -1, t0);
  const stage = (H, s0) => { H.sfx('whoosh', s0, 0.9); H.sfx('tick', s0 + 0.2, 1); H.sfx('tick', s0 + 0.45, 1); };
  const ME = { shirt: '#2fb3a3', pants: '#2f4f8a', hairStyle: 'short', hair: '#3a2418', seed: 5 };
  const me = (o) => Object.assign({}, ME, o);
  const ROOMCAM = [540, 1300, 1.0];
  const cut = (H, s0, lt, tc) => { if (lt > tc) H.sfx('whoosh', s0 + tc - 0.1, 0.8); return lt > tc ? 0.85 * Math.max(0, 1 - (lt - tc) / 0.3) : 0; };

  // [1] ¿Qué pasaría si mañana despiertas... y no queda ni una sola gota de AGUA?
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt, tg = W(H, s0, 'gota');
    let w = P(H, 'bed3', 300, 1580, 1.0, {}, lt, t) + P(H, 'nightstand', 950, 1420, 0.9, {}, lt, t);
    w += P(H, 'person', 640, 1540, 1.15, me({ mood: lt > tg ? 'scared' : 'yawn', pose: lt > tg ? 'scared' : 'cheer' }), lt, t);
    w += P(H, 'drop', 640, 760, 0.9 * H.pop(lt, tg), { mood: 'scared' }, lt, t);
    if (lt > tg + 0.6) { w += `<path d="M560 680 L720 840 M720 680 L560 840" stroke="#e5484d" stroke-width="26" stroke-linecap="round"/>`; H.sfx('buzz', s0 + tg + 0.6, 0.5); }
    return { bg: 'bedroomDay', world: w, cam: ROOMCAM, particles: 'none' };
  };

  // [2] Segundo uno. Los océanos desaparecen... agujeros gigantes. Los barcos caen... peces, ballenas y tiburones... sobre la arena.
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt, td = W(H, s0, 'desaparecen'), tb = W(H, s0, 'barcos'), tp = W(H, s0, 'peces');
    stage(H, s0);
    const level = 1 - H.ease.inOut(H.clamp((lt - td) / 2.2, 0, 1));
    if (lt > td) { H.sfx('rumble', s0 + td, 1); H.sfx('splash', s0 + td + 0.3, 0.6); }
    let w = P(H, 'seaBasin', 0, 0, 1, { level }, lt, t);
    const bfall = H.ease.in(H.clamp((lt - tb) / 1.0, 0, 1));
    w += P(H, 'boat', 380, lt < tb ? 900 - 20 + Math.sin(t * 2) * 8 : H.lerp(880, 1500, bfall), 0.7, {}, lt, t, lt < tb ? Math.sin(t * 2) * 3 : bfall * 25);
    if (lt > tb + 1.0) H.sfx('hit', s0 + tb + 1.0, 0.8);
    if (lt > tp) { [[620, 1560, '#ff9a4a'], [780, 1500, '#5bb8f0'], [500, 1610, '#ffd84a']].forEach(([x, y, col], i) => (w += P(H, 'fish', x, y, 0.6 * H.pop(lt, tp + i * 0.2), { color: col, flop: true, seed: i }, lt, t))); w += P(H, 'whale', 300, 1650, 0.5 * H.pop(lt, tp + 0.5), {}, lt, t); }
    big(H, 'SEGUNDO 1', '', lt, 0.05);
    return { bg: 'meadow', world: w, cam: [540, 1200, 1.0], shake: lt > td && lt < td + 1.5 ? 6 : 0, particles: 'none' };
  };

  // [3] Hora uno. Ríos, lagos y presas vacíos. Las llaves... secas. | Y el cielo cambia: ya no hay nubes. Nunca más va a llover.
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, tl = W(H, s0, 'llaves'), tc = W(H, s0, 'cielo');
    stage(H, s0);
    if (lt < tc - 0.1) {
      let w = P(H, 'counter', 420, 1330, 0.9, { clock: '7:00' }, lt, t);
      w += P(H, 'faucet', 360, 900, 1.2, { dry: lt > tl }, lt, t);
      w += P(H, 'person', 700, 1560, 1.1, me({ mood: lt > tl ? 'scared' : 'talk', pose: lt > tl ? 'shrug' : 'idle' }), lt, t);
      if (lt > tl) w += ICON(H, 'quest', 480, 760, 0.7, lt, tl + 0.3, t);
      big(H, 'HORA 1', '', lt, 0.05);
      return { bg: 'kitchenNight', world: w, cam: ROOMCAM, particles: 'none' };
    }
    const w = P(H, 'person', 540, 1560, 1.1, me({ mood: 'worried', pose: 'idle', look: [0, -1] }), lt, t);
    H.ov('<div class="tag">YA NO HAY NUBES</div>', 330, lt, W(H, s0, 'nubes'));
    return { bg: 'desert', world: w, cam: [540, 1300, 1.0], flash: cut(H, s0, lt, tc - 0.1), particles: 'none' };
  };

  // [4] Día 1. Las plantas empiezan a marchitarse. El aire está tan seco que te arden los ojos y se te parten los labios.
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, tp = W(H, s0, 'plantas'), ta = W(H, s0, 'aire');
    stage(H, s0);
    let w = P(H, 'plantW', 260, 1500, 1.1, { wilt: H.clamp((lt - tp) / 2.5, 0, 1) }, lt, t);
    w += P(H, 'person', 680, 1560, 1.1, me({ mood: lt > ta ? 'tired' : 'worried', pose: lt > ta ? 'scared' : 'idle' }), lt, t);
    w += ICON(H, 'sweat', 820, 880, 0.6, lt, ta, t);
    big(H, 'DÍA 1', '', lt, 0.05);
    return { bg: 'desert', world: w, cam: [540, 1300, 1.0], particles: 'none' };
  };

  // [5] Día 3. Este es el límite: un ser humano aguanta unos 3 días sin beber agua. Miles de millones... empiezan a apagarse.
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt, tm = W(H, s0, 'miles');
    stage(H, s0);
    H.sfx('heartbeat', s0 + 0.6, 0.9); H.sfx('heartbeat', s0 + 2.2, 1); H.sfx('heartbeat', s0 + 3.8, 0.8);
    let w = P(H, 'person', 540, 1560, 1.15, me({ mood: lt > tm ? 'sleep' : 'tired', pose: 'idle' }), lt, t, lt > tm ? H.clamp((lt - tm) / 1.5, 0, 1) * 12 : 0);
    w += P(H, 'battery', 860, 900, 0.7, { level: H.lerp(0.35, 0.05, H.clamp(lt / dur, 0, 1)) }, lt, t);
    w += P(H, 'darkness', 0, 0, 1, { amount: H.lerp(0, 0.45, H.clamp((lt - tm) / 2, 0, 1)) }, lt, t);
    big(H, 'DÍA 3', '', lt, 0.05);
    H.bignum('3 DÍAS', 'SIN BEBER AGUA', 210, lt, W(H, s0, '3', s0 + 2.1));
    return { bg: 'desert', world: w, cam: [540, 1300, 1.0], particles: 'none' };
  };

  // [6] Semana 1. ... desierto gigante: de día un calor insoportable... de noche un frío que congela. | El océano... la mitad del oxígeno... cementerio de sal.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, tn = W(H, s0, 'noche'), to = W(H, s0, 'oceano');
    stage(H, s0);
    if (lt < to - 0.1) {
      const night = lt > tn;
      let w = P(H, 'thermo', 830, 1200, 1.0, { level: night ? H.lerp(0.95, 0.08, H.clamp((lt - tn) / 0.8, 0, 1)) : H.clamp(0.3 + lt / 2, 0, 0.95) }, lt, t);
      w += P(H, 'person', 400, 1560, 1.1, me({ mood: night ? 'scared' : 'tired', pose: night ? 'hug' : 'idle' }), lt, t, night ? Math.sin(t * 25) * 2 : 0);
      if (night) w += P(H, 'darkness', 0, 0, 1, { amount: 0.55 }, lt, t);
      big(H, 'SEMANA 1', '', lt, 0.05);
      H.ov(`<div class="badge" style="color:${night ? '#9fdcff' : '#ff8a80'}">${night ? '−20°C' : '+55°C'}</div>`, 470, lt, night ? tn : W(H, s0, 'calor'));
      return { bg: 'desert', world: w, cam: [540, 1300, 1.0], filter: night ? 'hue-rotate(190deg) brightness(0.7)' : '', particles: 'none' };
    }
    let w = P(H, 'seaBasin', 0, 0, 1, { level: 0 }, lt, t);
    [[420, 1600, '#9aa3ad'], [660, 1560, '#9aa3ad']].forEach(([x, y, col], i) => (w += P(H, 'fish', x, y, 0.6, { color: col, seed: i }, lt, t, 180)));
    H.bignum('50%', 'DEL OXÍGENO', 210, lt, W(H, s0, 'mitad'));
    return { bg: 'desert', world: w, cam: [540, 1200, 1.0], flash: cut(H, s0, lt, to - 0.1), filter: 'saturate(0.6)', particles: 'none' };
  };

  // [7] Y desde el fondo seco del mar... la Fosa de las Marianas, un hoyo de 11 kilómetros... más profundo de lo alto que es el Everest.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, tf = W(H, s0, 'fosa'), te = W(H, s0, 'everest');
    const w = P(H, 'trench', 540, 1120, 1.0, { k: H.ease.out(H.clamp((lt - tf + 0.3) / 1.5, 0, 1)) }, lt, t);
    if (lt > te) H.sfx('ding', s0 + te, 0.9);
    H.bignum('11 KM', 'DE PROFUNDIDAD', 210, lt < W(H, s0, '11') + 2.2 ? lt : -1, W(H, s0, '11'));
    return { bg: 'spotBlue', world: w, cam: [540, 1020, 1.0], particles: 'none' };
  };

  // [8] Pero espera... el 60% de tu cuerpo también es agua. Si desapareciera TODA el agua... polvo de unos 25 kilos.
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt, tp = W(H, s0, 'polvo') - 1.2;
    const k = H.clamp((lt - tp) / 1.6, 0, 1);
    let w = P(H, 'dust', 540, 1560, 1.0, { k }, lt, t);
    if (k < 1) w += P(H, 'person', 540, 1560, 1.15, me({ mood: 'scared', pose: 'scared' }), lt, t, 0, 1 - k);
    if (lt > tp) H.sfx('riser', s0 + tp - 0.3, 0.8);
    H.bignum('60%', 'DE TU CUERPO ES AGUA', 210, lt < tp ? lt : -1, W(H, s0, '60%'));
    H.bignum('25 KG', 'DE POLVO', 210, lt, W(H, s0, '25'));
    return { bg: 'spotNight', world: w, cam: [540, 1300, 1.0], particles: 'none' };
  };

  // [9] Ahora dime: ¿qué sería lo primero que extrañarías del agua? ... y sígueme.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'person', 540, 1560, 1.1, me({ mood: 'talk', pose: 'shrug' }), lt, t);
    w += P(H, 'drop', 230, 760, 0.8, { mood: 'happy' }, lt, t) + ICON(H, 'quest', 860, 760, 0.9, lt, 0.3, t);
    H.ov('<div class="tag">¿QUÉ EXTRAÑARÍAS?</div>', 330, lt, W(H, s0, 'extranarias'));
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1420, lt, W(H, s0, 'comentarios'));
    return { bg: 'beach', world: w, cam: [540, 1300, 1.0], particles: 'none' };
  };
})();
