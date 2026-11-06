// "¿Qué pasaría si solo comieras comida chatarra 30 días?" — persona en su casa + escenas "dentro del cuerpo".
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const FLAT = new Set(['darkness', 'puff', 'stamp', 'particlesIn', 'sparkle', 'ghost', 'intestine']);
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op, FLAT.has(kind) ? false : 'vol');
  const ICON = (H, kind, x, y, s, lt, at, t) => (lt > at ? H.at(x, y, s, A.icon({ kind, seed: x }, { t, lt: lt - at }), 0, 1, 'vol') : '');
  const W = (H, s0, w, after) => H.wt(w, after ?? s0) - s0;
  const big = (H, n, label, lt, t0, d = 1.9) => H.bignum(n, label, 210, lt < t0 + d ? lt : -1, t0);
  const ME = { shirt: '#2fb3a3', pants: '#2f4f8a', hairStyle: 'short', hair: '#3a2418', seed: 5 };
  const me = (o) => Object.assign({}, ME, o);
  const ROOMCAM = [540, 1300, 1.0], INCAM = [540, 930, 1.0];
  const cut = (H, s0, lt, tc) => { if (lt > tc) H.sfx('whoosh', s0 + tc - 0.1, 0.8); return lt > tc ? 0.85 * Math.max(0, 1 - (lt - tc) / 0.3) : 0; };
  const sofaEating = (H, lt, t, o = {}) => {
    let w = P(H, 'plant', 140, 1380, 0.9, {}, lt, t) + P(H, 'tvSet', 900, 1290, 0.55, {}, lt, t);
    w += P(H, 'person', 540, 1430, 1.1, me(o), lt, t, o.rot || 0);
    w += P(H, 'sofa', 540, 1600, 1.0, { color: '#c2435a' }, lt, t);
    return w;
  };

  // [1] Un hombre comió SOLO comida rápida durante 30 días... y sus propios médicos le pidieron que PARARA.
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt, t30 = W(H, s0, '30'), tm = W(H, s0, 'medicos'), tp = W(H, s0, 'parara');
    let w = P(H, 'counter', 420, 1330, 0.9, { clock: '12:00' }, lt, t);
    w += P(H, 'person', 360, 1560, 1.1, { shirt: '#f2c230', hairStyle: 'short', hair: '#5a3a22', mustache: '#5a3a22', mood: lt > tp ? 'scared' : 'happy', pose: 'hold', holding: 'burger', holdRot: 0, seed: 8 }, lt, t);
    [['fries', 120, 1120], ['soda', 240, 1110]].forEach(([k, x, y], i) => (w += P(H, k, x, y, 0.45 * H.pop(lt, 0.4 + i * 0.3), {}, lt, t)));
    if (lt > tm) { w += P(H, 'person', 820, 1560, 1.05, { coat: true, glasses: true, hairStyle: 'bald', hair: '#9a9a9a', shirt: '#7a8fb0', mood: 'worried', pose: 'point', seed: 2, look: [-0.7, 0] }, lt, t, 0, Math.min(1, (lt - tm) / 0.3)); H.sfx('step', s0 + tm, 0.8); }
    big(H, '30', 'DÍAS DE COMIDA RÁPIDA', lt, t30);
    H.ov('<div class="tag" style="background:#e5484d;color:#fff">¡PARA YA!</div>', 330, lt, tp);
    return { bg: 'kitchenNight', world: w, cam: ROOMCAM, particles: 'none' };
  };

  // [2] ¿Qué pasaría si TÚ solo comieras comida chatarra durante un mes?
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = sofaEating(H, lt, t, { mood: 'happy', pose: 'hold', holding: 'burger', holdRot: 0 });
    w += ICON(H, 'quest', 760, 880, 0.75, lt, 0.4, t);
    H.ov('<div class="tag">¿Y SI FUERAS TÚ?</div>', 330, lt, W(H, s0, 'tu'));
    return { bg: 'livingNight', world: w, cam: ROOMCAM, flash: 0, particles: 'none' };
  };

  // [3] Día 1. Hamburguesa, papas y refresco. | Tu azúcar... se dispara... se desploma. | Resultado: sueño... y más hambre.
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, ta = W(H, s0, 'azucar'), td = W(H, s0, 'desploma'), tr = W(H, s0, 'resultado');
    if (lt < ta - 0.1) {
      let w = sofaEating(H, lt, t, { mood: 'happy', pose: 'hold', holding: 'burger', holdRot: 0 });
      [['hamburguesa', 'burger', 280, 1050], ['papas', 'fries', 540, 1030], ['refresco', 'soda', 800, 1040]].forEach(([wd, k, x, y]) => { const at = W(H, s0, wd); if (lt > at) { w += P(H, k === 'burger' ? 'junk' : k, x, y, 0.55 * H.pop(lt, at), { kind: k }, lt, t); H.sfx('pop', s0 + at, 0.7); } });
      big(H, 'DÍA 1', '', lt, 0.05);
      return { bg: 'livingNight', world: w, cam: ROOMCAM, particles: 'none' };
    }
    if (lt < tr - 0.1) {
      // azúcar: sube rápido y luego se desploma
      const up = H.ease.out(H.clamp((lt - ta) / 1.2, 0, 1)), down = H.ease.in(H.clamp((lt - td) / 0.8, 0, 1));
      const level = 0.15 + 0.75 * up - 0.82 * down;
      let w = P(H, 'monitor', 540, 760, 1.25, { title: 'AZÚCAR EN SANGRE', color: down > 0.1 ? '#ff6a6a' : '#5af0a0', level: Math.max(0.05, level), noise: 0.6 }, lt, t);
      w += P(H, 'arrowUp', 880, 1120, 0.7, { color: down > 0.1 ? '#e5484d' : '#2bb673' }, lt, t, down > 0.1 ? 180 : 0);
      if (lt > td) H.sfx('buzz', s0 + td + 0.2, 0.5);
      return { bg: 'spotBlue', world: w, cam: INCAM, flash: cut(H, s0, lt, ta - 0.1), particles: 'none' };
    }
    const th = W(H, s0, 'hambre');
    const w = sofaEating(H, lt, t, { mood: lt > th ? 'talk' : 'yawn', pose: lt > th ? 'hold' : 'cheer', holding: lt > th ? 'fries' : null, holdRot: 0 }) + ICON(H, 'sweat', 720, 880, 0.6, lt, 0.3, t);
    return { bg: 'livingNight', world: w, cam: ROOMCAM, flash: cut(H, s0, lt, tr - 0.1), particles: 'none' };
  };

  // [4] Día 3. Tanta sal hace que tu cuerpo retenga AGUA. | Te sientes hinchado... y con sed todo el tiempo.
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, th = W(H, s0, 'sientes'), tw = W(H, s0, 'agua');
    if (lt < th - 0.1) {
      let w = P(H, 'salt', 300, 640, 1.1, {}, lt, t, -25);
      for (let i = 0; i < 6; i++) { const at = tw + i * 0.15; if (lt > at) w += P(H, 'drop', 560 + (i % 3) * 160, 900 + Math.floor(i / 3) * 220, 0.75 * H.pop(lt, at), { mood: 'happy', seed: i }, lt, t); }
      if (lt > tw) H.sfx('drip', s0 + tw, 0.8);
      big(H, 'DÍA 3', '', lt, 0.05);
      return { bg: 'spotTeal', world: w, cam: INCAM, particles: 'none' };
    }
    let w = `<g transform="translate(540,1560) scale(1.18,1) translate(-540,-1560)">` + P(H, 'person', 540, 1560, 1.1, me({ mood: 'tired', pose: lt > W(H, s0, 'sed') ? 'hold' : 'hips', holding: 'agua', holdRot: 0 }), lt, t) + `</g>`;
    w += ICON(H, 'sweat', 720, 880, 0.6, lt, 0.3, t);
    H.ov('<div class="tag" style="background:#5bb8f0;color:#fff">HINCHADO Y CON SED</div>', 330, lt, 0.2);
    return { bg: 'bathroomDay', world: w, cam: ROOMCAM, flash: cut(H, s0, lt, th - 0.1), particles: 'none' };
  };

  // [5] Día 10. Dentro de tu intestino viven billones de bacterias... | Un científico británico... | y perdió casi la mitad...
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt, tc = W(H, s0, 'cientifico'), tp = W(H, s0, 'perdio');
    const gut = (lose) => {
      let w = P(H, 'intestine', 540, 960, 1, {}, lt, t);
      const cols = ['#8bd16a', '#5bb8f0', '#ffd84a', '#b07cff', '#ff9a4a'];
      for (let i = 0; i < 12; i++) {
        const x = 170 + (i % 4) * 240 + (Math.floor(i / 4) % 2) * 60, y = 560 + Math.floor(i / 4) * 300;
        if (lose && i % 2 === 1) { const at = tp + 0.2 + i * 0.12; if (lt < at) w += P(H, 'bacteria', x, y + Math.sin(t * 2 + i) * 10, 0.75, { color: cols[i % 5], seed: i, mood: 'scared' }, lt, t); else if (lt < at + 0.6) { w += P(H, 'puff', x, y + 200, 0.6, {}, lt - at, t); H.sfx('pop', s0 + at, 0.5); } continue; }
        w += P(H, 'bacteria', x, y + Math.sin(t * 2 + i) * 10, 0.75, { color: cols[i % 5], seed: i, mood: lose ? 'scared' : 'happy' }, lt, t);
      }
      return w;
    };
    if (lt < tc - 0.1) {
      big(H, 'DÍA 10', '', lt, 0.05);
      H.ov('<div class="tag" style="background:#8bd16a">BACTERIAS BUENAS</div>', 330, lt, Math.max(2, W(H, s0, 'bacterias')));
      return { bg: 'spotRed', world: gut(false), cam: INCAM, particles: 'none' };
    }
    if (lt < tp - 0.1) {
      let w = P(H, 'counter', 420, 1330, 0.9, { clock: '9:00' }, lt, t);
      w += P(H, 'person', 330, 1560, 1.05, { coat: true, glasses: true, hairStyle: 'short', hair: '#9a9a9a', shirt: '#7a8fb0', mood: 'talk', pose: 'point', seed: 3, look: [0.7, 0] }, lt, t);
      w += P(H, 'person', 760, 1560, 0.7, me({ shirt: '#f2c230', hairStyle: 'curly', mood: 'happy', pose: 'hold', holding: 'burger', holdRot: 0, seed: 9 }), lt, t);
      H.ov('<div class="tag" style="background:#ffd84a">10 DÍAS DE COMIDA RÁPIDA</div>', 330, lt, 0.3);
      return { bg: 'kitchenNight', world: w, cam: ROOMCAM, flash: cut(H, s0, lt, tc - 0.1), particles: 'none' };
    }
    H.bignum('−40%', 'TIPOS DE BACTERIAS', 210, lt, tp + 0.8);
    return { bg: 'spotRed', world: gut(true), cam: INCAM, flash: cut(H, s0, lt, tp - 0.1), particles: 'none' };
  };

  // [6] Día 20. Tu cerebro ya se acostumbró: cada bocado le da un premio... y te pide MÁS. | Te cuesta parar.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, tpr = W(H, s0, 'premio'), tm = W(H, s0, 'mas'), tc = W(H, s0, 'cuesta');
    if (lt < tc - 0.1) {
      let w = P(H, 'brain', 540, 820, 0.95, { mood: lt > tm ? 'hungry' : 'happy', seed: 1 }, lt, t);
      if (lt > tpr) w += ICON(H, 'heart', 230, 620, 0.7, lt, tpr, t) + ICON(H, 'star', 860, 640, 0.7, lt, tpr + 0.2, t);
      if (lt > tm) { w += P(H, 'speech', 720, 480, 0.9 * H.pop(lt, tm), { text: '¡MÁS!' }, lt, t); H.sfx('pop', s0 + tm, 0.9); }
      big(H, 'DÍA 20', '', lt, 0.05);
      return { bg: 'spotPurple', world: w, cam: INCAM, particles: 'none' };
    }
    const w = sofaEating(H, lt, t, { mood: 'worried', pose: 'hold', holding: 'donut', holdRot: 0 }) + P(H, 'junk', 820, 1130, 0.45, { kind: 'burger' }, lt, t) + P(H, 'fries', 250, 1130, 0.4, {}, lt, t);
    return { bg: 'livingNight', world: w, cam: ROOMCAM, flash: cut(H, s0, lt, tc - 0.1), particles: 'none' };
  };

  // [7] Día 30. Subió 11 kilos en un mes, cansado, de mal humor... | y su colesterol se disparó.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, t11 = W(H, s0, '11'), tc = W(H, s0, 'colesterol'), tca = W(H, s0, 'cansado');
    if (lt < tc - 0.1) {
      const kg = H.lerp(70, 81, H.ease.out(H.clamp((lt - t11 + 0.6) / 1.4, 0, 1)));
      let w = P(H, 'scaleBath', 540, 1610, 1.3, { kg, alert: kg > 78 }, lt, t);
      w += `<g transform="translate(540,1560) scale(${(1 + 0.18 * H.clamp((lt - t11) / 1.2, 0, 1)).toFixed(3)},1) translate(-540,-1560)">` + P(H, 'person', 540, 1560, 1.1, me({ mood: lt > tca ? 'tired' : 'scared', pose: lt > tca ? 'idle' : 'scared', look: [0, 0.8] }), lt, t) + `</g>`;
      if (lt > t11 && lt < t11 + 1.6) for (let i = 0; i < 5; i++) H.sfx('tick', s0 + t11 + i * 0.25, 0.9);
      big(H, 'DÍA 30', '', lt, 0.05);
      H.bignum('+11 KG', '', 210, lt, t11 + 1.2);
      return { bg: 'bathroomDay', world: w, cam: ROOMCAM, particles: 'none' };
    }
    const w = P(H, 'heartChar', 540, 800, 1.1, { mood: 'scared', fat: H.clamp((lt - tc) / 1.2, 0, 1), fast: true }, lt, t);
    H.sfx('heartbeat', s0 + tc, 1);
    H.ov('<div class="tag" style="background:#ffd84a">COLESTEROL ALTO</div>', 330, lt, tc + 0.3);
    return { bg: 'spotRed', world: w, cam: INCAM, flash: cut(H, s0, lt, tc - 0.1), shake: 3, particles: 'none' };
  };

  // [8] La buena noticia: si vuelves a comer bien, tu cuerpo empieza a recuperarse en pocas semanas.
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'bed3', 300, 1580, 1.0, {}, lt, t) + P(H, 'nightstand', 950, 1420, 0.9, {}, lt, t);
    w += P(H, 'person', 620, 1540, 1.15, me({ mood: 'happy', pose: 'hold', holding: 'salad', holdRot: 0 }), lt, t);
    w += P(H, 'sparkle', 620, 980, 1, {}, lt, t);
    H.ov(H.MARK_OK, 330, lt, W(H, s0, 'bien'));
    H.ov('<div class="tag" style="background:#2bb673;color:#fff">TU CUERPO SE RECUPERA</div>', 470, lt, W(H, s0, 'recuperarse'));
    return { bg: 'bedroomDay', world: w, cam: ROOMCAM, particles: 'none' };
  };

  // [9] Ahora dime: ¿qué comida chatarra jamás podrías dejar? Escríbela en los comentarios... y sígueme.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'person', 540, 1560, 1.1, me({ mood: 'talk', pose: 'shrug', look: [0, -0.3] }), lt, t);
    [['junk', 'burger', 200, 700], ['fries', null, 880, 700], ['soda', null, 200, 1050], ['junk', 'donut', 880, 1050]].forEach(([k, kind, x, y], i) => { w += P(H, k, x, y + Math.sin(t * 2 + i) * 12, 0.45 * H.pop(lt, 0.3 + i * 0.25), { kind }, lt, t); if (lt > 0.3 + i * 0.25) H.sfx('pop', s0 + 0.3 + i * 0.25, 0.5); });
    H.ov('<div class="tag">¿CUÁL NO PODRÍAS DEJAR?</div>', 330, lt, W(H, s0, 'chatarra'));
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1420, lt, W(H, s0, 'comentarios'));
    return { bg: 'kitchenNight', world: w, cam: ROOMCAM, particles: 'none' };
  };
})();
