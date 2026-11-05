// "¿El fin del mundo el viernes 13?" en estilo 2D ilustrado (SHOTS2D).
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op);

  // [1] Unos científicos calcularon que el mundo se acaba el viernes 13...
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt, tc = H.wt('13', s0) - s0, tq = H.wt('casi', s0) - s0;
    let w = P(H, 'globe', 540, 880, 1.15, { rot: 0.3 }, lt, t);
    if (lt > tc) { w += P(H, 'calendar', 540, 1500, 0.95, {}, lt - tc, t, Math.sin(t * 1.4) * 3); H.sfx('whoosh', s0 + tc - 0.15, 0.8); }
    if (lt > tq) for (let i = 0; i < 6; i++) H.sfx('tick', s0 + tq + i * 0.5, 1);
    return { bg: 'space', world: w, cam: H.cam([540, 1000, 1.0], [540, 1050, 1.12], lt / dur), particles: 'none' };
  };

  // [2] No es una profecía. Es un estudio de 1960, publicado en la revista Science...
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt, tj = H.wt('science', s0) - s0;
    let w = P(H, 'chalkboard', 540, 660, 1.1, {}, lt, t);
    w += P(H, 'person', 220, 1720, 1.05, { coat: true, glasses: true, hairStyle: 'bald', hair: '#9a9a9a', shirt: '#7a8fb0', mood: 'talk', pose: 'point', seed: 1 }, lt, t);
    w += P(H, 'person', 870, 1720, 1.0, { coat: true, glasses: true, hairStyle: 'curly', hair: '#2a1a12', skin: '#c98d66', shirt: '#a35a5a', mood: lt > tj ? 'surprised' : 'happy', pose: 'hips', seed: 2, look: [-0.6, 0] }, lt, t);
    if (lt > tj) { w += P(H, 'journal', 540, 1180, 1.2, {}, lt - tj, t, Math.sin(t) * 1.5); H.sfx('whoosh', s0 + tj, 0.9); }
    const cam = lt < tj ? H.cam([540, 1000, 1.0], [540, 980, 1.05], lt / tj) : H.cam([540, 980, 1.05], [540, 1180, 1.3], (lt - tj) / (dur - tj));
    return { bg: 'lab', world: w, cam, filter: 'sepia(0.55) saturate(1.1)', particles: 'none' };
  };

  // [3] Los científicos juntaron 2.000 años de datos... cada vez MÁS rápido.
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt;
    const yr = 1960 * H.ease.inOut(H.clamp(lt / (dur - 0.5), 0, 1)) + 0.01;
    const w = P(H, 'popGraph', 0, 0, 1, { realTo: yr, dots: true, area: true }, lt, t);
    H.ov('<div class="badge">2.000 <small>años</small></div>', 560, lt, H.wt('2000', s0) - s0);
    const tr = H.wt('rapido', s0) - s0;
    return { bg: 'chart', world: w, cam: H.cam([560, 1170, 1.1], [580, 1170, lt > tr ? 1.18 : 1.12], lt / dur), particles: 'none' };
  };

  // [4] Su fórmula decía que, a ese ritmo, ... sería INFINITA.
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, ti = H.wt('infinita', s0) - s0, t26 = H.wt('2026', s0) - s0;
    const k = H.ease.in(H.clamp(lt / ti, 0, 1));
    const yr = 1960 + (2026.86 - 1960) * (1 - Math.pow(1 - k, 0.35));
    const w = P(H, 'popGraph', 0, 0, 1, { realTo: 1960, dots: true, area: true, modelFrom: 1960, modelTo: yr, asym: lt > t26, asymAt: t26, yMin: -2400 }, lt, t);
    const head = A.gy(A.modelN(yr));
    const cy = Math.min(1150, Math.max(-900, head + 450));
    H.sfx('riser', s0 + ti - 1.6, 1);
    let shake = 0, flash = 0;
    if (lt > ti) {
      H.sfx('boom', s0 + ti, 1);
      shake = 22 * Math.exp(-(lt - ti) * 3); flash = 0.45 * Math.max(0, 1 - (lt - ti) / 0.4);
      H.ov('<div class="badge" style="color:#ff8a80;font-size:170px;line-height:1">∞</div>', 520, lt, ti);
    }
    H.ov('<div class="tag warn">VIERNES 13 · NOV · 2026</div>', 1620, lt, t26);
    return { bg: 'chart', world: w, cam: [600, cy, 1.0], shake, flash, flashColor: '#e5484d', particles: 'none', punch: false };
  };

  // [5] Sin comida. Sin agua. Sin espacio.
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'crowd', 0, 0, 1, { count: H.lerp(250, 3000, H.ease.out(H.clamp(lt / dur, 0, 1))) }, lt, t);
    [[300, 0.95, '#f2c230', 'long', '#5a2a1a'], [540, 1.05, '#e8709a', 'short', '#3a2418'], [790, 0.95, '#5b7cff', 'spiky', '#1d1d24']].forEach(([x, s, sh, hs, hc], i) => {
      w += P(H, 'person', x, 2010, s, { shirt: sh, hairStyle: hs, hair: hc, mood: 'scared', pose: 'scared', seed: i + 4, look: [(i - 1) * -0.6, -0.4] }, lt, t);
    });
    const red = 'background:#e5484d;color:#fff';
    H.ov('<div class="tag">SIN COMIDA</div>', 560, lt, H.wt('comida', s0) - s0, red);
    H.ov('<div class="tag">SIN AGUA</div>', 680, lt, H.wt('agua', s0) - s0, red);
    H.ov('<div class="tag">SIN ESPACIO</div>', 800, lt, H.wt('espacio', s0) - s0, red);
    return { bg: 'forest', world: w, cam: H.cam([540, 1350, 1.12], [540, 1180, 1.0], lt / dur), particles: 'none' };
  };

  // [6] Y lo más raro es que los datos encajaban casi perfecto. Pero justo después... pasó algo que nadie esperaba.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, tp = H.wt('paso', s0) - s0;
    const realTo = 1960 + 66 * H.ease.inOut(H.clamp((lt - tp) / (dur - tp), 0, 1));
    const w = P(H, 'popGraph', 0, 0, 1, { realTo, dots: true, modelFrom: 0, modelTo: 2008, modelDash: '26 18', yMin: 300 }, lt, t);
    if (lt < tp) H.ov(H.MARK_OK, 560, lt, H.wt('encajaban', s0) - s0);
    else H.sfx('riser', s0 + tp - 0.3, 0.7);
    const cam = lt < tp ? H.cam([520, 1250, 1.25], [560, 1230, 1.32], lt / tp) : H.cam([560, 1230, 1.32], [600, 1050, 1.0], (lt - tp) / (dur - tp));
    return { bg: 'chart', world: w, cam, particles: 'none' };
  };

  // [7] Empezamos a tener MENOS hijos... Somos unos 8.000 millones... no infinitos.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, tm = H.wt('menos', s0) - s0;
    let w = '';
    const kids = [[120, '#f2c230', 'curly'], [250, '#5b7cff', 'short'], [830, '#f07f2a', 'bun'], [960, '#8bd16a', 'spiky'], [360, '#e5484d', 'long'], [720, '#b07cff', 'short']];
    // los 4 primeros desaparecen; los 2 últimos se acercan a los padres
    kids.forEach(([x, sh, hs], i) => {
      const at = tm + i * 0.2;
      if (i < 4) {
        if (lt < at) w += P(H, 'person', x, 1830, 0.62, { shirt: sh, hairStyle: hs, mood: 'happy', seed: 10 + i }, lt, t);
        else { w += P(H, 'puff', x, 1830, 0.7, {}, lt - at, t); H.sfx('pop', s0 + at, 0.8); }
      } else {
        const nx = H.lerp(x, i === 4 ? 230 : 850, H.ease.inOut(H.clamp((lt - tm - 1.2) / 0.8, 0, 1)));
        w += P(H, 'person', nx, 1830, 0.62, { shirt: sh, hairStyle: hs, mood: 'happy', seed: 10 + i, pose: lt > tm + 2 ? 'cheer' : 'idle' }, lt, t);
      }
    });
    w = P(H, 'person', 420, 1760, 1.0, { shirt: '#2fb3a3', hairStyle: 'short', mood: lt > tm ? 'surprised' : 'happy', seed: 20, look: [-0.5, 0] }, lt, t)
      + P(H, 'person', 660, 1760, 0.96, { shirt: '#e8709a', hairStyle: 'long', hair: '#5a2a1a', skin: '#c98d66', mood: lt > tm ? 'surprised' : 'happy', seed: 21, look: [0.5, 0] }, lt, t) + w;
    H.ov('<div class="badge">8.000 <small>millones</small></div>', 560, lt, H.wt('8000', s0) - s0);
    H.ov('<div class="tag">NO INFINITOS</div>', 700, lt, H.wt('infinitos', s0) - s0);
    return { bg: 'forest', world: w, cam: H.cam([540, 1300, 1.0], [540, 1360, 1.08], lt / dur) };
  };

  // [8] Entonces, ¿se acaba el mundo este viernes? No. Pero el estudio tenía razón en UNA cosa...
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt, ta = H.wt('aguantara', s0) - s0;
    let w = P(H, 'globe', 540, 980, 1.05, { rot: 2.0 }, lt, t);
    w += P(H, 'calendar', 820, 1500, 0.6, {}, lt + 1, t, 8);
    H.ov('<div class="pill si" style="font-size:110px">NO</div>', 560, lt, H.wt('no', s0) - s0);
    const flash = lt > ta ? 0.28 * Math.max(0, Math.sin((lt - ta) * 6)) * Math.exp(-(lt - ta)) : 0;
    return { bg: 'space', world: w, cam: H.cam([540, 1000, 1.12], [540, 1020, 0.98], lt / dur), flash, flashColor: '#e5484d', particles: 'none' };
  };

  // [9] Y mientras tanto, más de 30 gobiernos... una MOCHILA de emergencia... 72 horas... terremoto, apagón o inundación.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt, tg = H.wt('30', s0) - s0, tmo = H.wt('mochila', s0) - s0;
    if (lt < tmo) {
      const w = P(H, 'globe', 540, 1000, 1.1, { rot: 1.0, pins: { n: 36, at: tg, step: 0.05 } }, lt, t);
      H.ov('<div class="badge">+30 <small>países</small></div>', 560, lt, tg);
      if (lt > tg) for (let i = 0; i < 12; i++) H.sfx('pop', s0 + tg + i * 0.15, 0.35);
      return { bg: 'space', world: w, cam: H.cam([540, 1000, 1.0], [540, 1000, 1.1], lt / tmo), particles: 'none' };
    }
    const w = P(H, 'backpack', 540, 1720, 1.35 * H.pop(lt, tmo, 0.45), {}, lt, t, Math.sin(t * 1.5) * 2);
    H.ov('<div class="badge">72 <small>horas</small></div>', 560, lt, H.wt('horas', s0) - s0);
    const yel = 'background:#ffcf3d';
    H.ov('<div class="tag">TERREMOTO</div>', 690, lt, H.wt('terremoto', s0) - s0, yel);
    H.ov('<div class="tag">APAGÓN</div>', 800, lt, H.wt('apagon', s0) - s0, yel);
    H.ov('<div class="tag">INUNDACIÓN</div>', 910, lt, H.wt('inundacion', s0) - s0, yel);
    return { bg: 'forest', world: w, cam: H.cam([540, 1250, 1.0], [540, 1300, 1.08], (lt - tmo) / (dur - tmo)) };
  };

  // [10] Agua. Linterna. Radio. Botiquín. Documentos. Y algo de efectivo.
  const IW = ['agua', 'linterna', 'radio', 'botiquin', 'documentos', 'efectivo'];
  const IN = ['AGUA', 'LINTERNA', 'RADIO', 'BOTIQUÍN', 'DOCUMENTOS', 'EFECTIVO'];
  S[10] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let items = '', bump = 0;
    IW.forEach((k, i) => {
      const at = H.wt(k, s0) - s0, d = lt - at;
      if (d < 0) return;
      const hold = 0.45, fall = 0.38;
      if (d < hold + fall) {
        const q = H.ease.in(H.clamp((d - hold) / fall, 0, 1));
        items += P(H, 'item', 540, H.lerp(930, 1500, q), H.pop(lt, at, 0.25) * H.lerp(1.15, 0.7, q), { kind: k }, lt, t, Math.sin(t * 3 + i) * 6);
        H.ov(`<div class="tag">${IN[i]}</div>`, 560, lt, at);
      } else if (d < hold + fall + 0.3) bump = Math.max(bump, Math.sin(((d - hold - fall) / 0.3) * Math.PI));
      if (d > hold + fall) H.sfx('hit', s0 + at + hold + fall, 0.45);
    });
    const w = items + P(H, 'backpack', 540, 1780, 1.3, { open: true, bump }, lt, t);
    return { bg: 'forest', world: w, cam: [540, 1250, 1.0] };
  };

  // [11] Ahora dime la verdad: ¿tú tienes una? Pon sí o no... y guarda este video para el viernes 13.
  S[11] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'calendar', 180, 1080, 0.5, {}, lt + 1, t, -8);
    w += P(H, 'backpack', 470, 1760, 1.05, { bump: Math.max(0, Math.sin(t * 4)) * 0.4 }, lt, t);
    w += P(H, 'person', 850, 1800, 0.95, { shirt: '#2fb3a3', hairStyle: 'short', mood: 'talk', pose: lt > H.wt('guarda', s0) - s0 ? 'cheer' : 'wave', seed: 30, look: [-0.5, -0.2] }, lt, t);
    const tg = H.wt('guarda', s0) - s0;
    if (lt < tg) H.ov('<div class="tag">¿TÚ TIENES UNA?</div>', 560, lt, H.wt('tienes', s0) - s0);
    else H.ov('<div class="tag warn">GUÁRDALO PARA EL VIERNES 13</div>', 560, lt, tg);
    H.ov('<div class="pill si">SÍ</div>', 740, lt, H.wt('si', s0) - s0, 'left:30%');
    H.ov('<div class="pill no">NO</div>', 740, lt, H.wt('no', s0) - s0, 'left:70%');
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1560, lt, H.wt('comentarios', s0) - s0);
    return { bg: 'forest', world: w, cam: H.cam([540, 1300, 1.0], [540, 1320, 1.06], lt / dur) };
  };
})();
