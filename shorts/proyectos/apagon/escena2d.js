// "¿Qué harías si se va la luz 72 horas?" en 2D (SHOTS2D).
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op);
  const red = 'background:#e5484d;color:#fff';

  // [1] ¿Qué harías si se va la luz en todo el país... y no vuelve en 72 HORAS?
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt, tl = H.wt('luz', s0) - s0 + 0.2;
    const lit = 1 - H.clamp((lt - tl) / 0.9, 0, 1);
    if (lt > tl) H.sfx('boom', s0 + tl, 0.6);
    const w = P(H, 'city', 0, 0, 1, { lit }, lt, t);
    H.ov('<div class="badge">72 <small>HORAS</small></div>', 560, lt, H.wt('72', s0) - s0);
    return { bg: 'night', world: w, cam: H.cam([540, 1150, 1.0], [560, 1180, 1.12], lt / dur), particles: 'none', flash: lt > tl ? 0.15 * Math.max(0, 1 - (lt - tl) / 0.2) : 0 };
  };

  // [2] Escribe en los comentarios qué harías primero... abrir el refrigerador para ver qué hay.
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt, ta = H.wt('abrir', s0) - s0;
    const open = H.ease.out(H.clamp((lt - ta) / 0.6, 0, 1));
    let w = P(H, 'fridge', 770, 1740, 0.82, { open }, lt, t);
    w += P(H, 'person', 330, 1780, 1.0, { holding: 'linterna', holdRot: -5, pose: 'hold', mood: lt > ta ? 'surprised' : 'talk', hairStyle: 'short', seed: 3, look: [0.7, 0] }, lt, t);
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.55, beams: [[505, 1480, -4, 650]] }, lt, t);
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 560, lt, 0.1);
    return { bg: 'kitchen', world: w, cam: H.cam([540, 1300, 1.0], [600, 1340, 1.08], lt / dur), particles: 'none' };
  };

  // [3] ERROR. Cerrado, tu refrigerador aguanta el frío unas 4 horas. El congelador lleno, hasta 2 días. Cada vez que lo abres... pierdes horas.
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, tab = H.wt('abres', s0) - s0;
    const open = lt > tab ? Math.sin(H.clamp((lt - tab) / 1.4, 0, 1) * Math.PI) : 0;
    let w = P(H, 'fridge', 540, 1800, 1.0, { open }, lt, t);
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.35 }, lt, t);
    H.ov(H.MARK_NO, 560, lt, H.wt('error', s0) - s0);
    H.ov('<div class="tag">REFRIGERADOR · 4 HORAS</div>', 1430, lt, H.wt('4', s0) - s0);
    H.ov('<div class="tag" style="background:#7fc8ff">CONGELADOR · 2 DÍAS</div>', 980, lt, H.wt('2', s0) - s0);
    H.ov('<div class="badge" style="color:#ff8a80">−1 HORA</div>', 560, lt, H.wt('pierdes', s0) - s0);
    return { bg: 'kitchen', world: w, cam: H.cam([540, 1260, 1.0], [540, 1280, 1.06], lt / dur), particles: 'none' };
  };

  // [4] Lo primero de verdad es el AGUA. ... bombas eléctricas... se acaba. Llena botellas, ollas y hasta la tina...
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, tll = H.wt('llena', s0) - s0, tac = H.wt('acaba', s0) - s0;
    H.ov('<div class="tag" style="background:#3aa0e8;color:#fff">1 · AGUA</div>', 560, lt, 0.2);
    if (lt < tll) {
      const level = 1 - 0.95 * H.ease.inOut(H.clamp((lt - tac + 1.2) / 1.6, 0, 1));
      let w = P(H, 'waterBuilding', 540, 1880, 0.9, { level, dark: lt > H.wt('luz', s0) - s0 }, lt, t);
      return { bg: 'night', world: w, cam: H.cam([540, 1200, 1.0], [540, 1150, 1.08], lt / tll), particles: 'none' };
    }
    const lv = (word, d = 1.2) => H.ease.inOut(H.clamp((lt - (H.wt(word, s0) - s0)) / d, 0, 1));
    let w = P(H, 'item', 210, 1520, 1.0 * H.pop(lt, H.wt('botellas', s0) - s0), { kind: 'agua' }, lt, t);
    w += P(H, 'pot', 870, 1520, 0.9 * H.pop(lt, H.wt('ollas', s0) - s0), { level: lv('ollas') }, lt, t);
    w += P(H, 'bathtub', 540, 1820, 1.25 * H.pop(lt, H.wt('tina', s0) - s0), { level: lv('tina', 2) }, lt, t);
    return { bg: 'room', world: w, cam: H.cam([540, 1300, 1.0], [540, 1320, 1.05], (lt - tll) / (dur - tll)), particles: 'none' };
  };

  // [5] Segundo: tu celular. Pon el modo de ahorro, baja el brillo y no llames: manda MENSAJES...
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt, at = (w) => H.wt(w, s0) - s0;
    const bright = 1 - 0.7 * H.ease.inOut(H.clamp((lt - at('brillo')) / 0.6, 0, 1));
    let w = P(H, 'phone', 540, 1420, 1.1, { battery: 23, saver: lt > at('ahorro'), bright, callX: lt > at('llames') && lt < at('mensajes') + 0.1, msg: lt > at('mensajes'), dim: 1 - bright }, lt, t, Math.sin(t) * 1.5);
    w = P(H, 'darkness', 0, 0, 1, { amount: 0.5 }, lt, t) + w;
    H.ov('<div class="tag" style="background:#5b7cff;color:#fff">2 · CELULAR</div>', 560, lt, 0.2);
    return { bg: 'room', world: w, cam: H.cam([540, 1240, 1.0], [540, 1240, 1.06], lt / dur), particles: 'none' };
  };

  // [6] Tercero: el dinero. Sin luz no funcionan ni cajeros ni terminales. Si no tienes EFECTIVO... no compras nada.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, at = (w) => H.wt(w, s0) - s0;
    let w = P(H, 'atm', 360, 1820, 1.0, {}, lt, t);
    if (lt > at('terminales')) w += P(H, 'terminal', 820, 1760, 1.0 * H.pop(lt, at('terminales')), {}, lt, t, 6);
    if (lt > at('efectivo')) w += P(H, 'item', 760, 1220, 1.1 * H.pop(lt, at('efectivo')), { kind: 'efectivo' }, lt, t, -4);
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.3 }, lt, t);
    H.ov('<div class="tag" style="background:#2bb673;color:#fff">3 · EFECTIVO</div>', 560, lt, 0.2);
    if (lt > at('efectivo')) H.ov(H.MARK_OK, 700, lt, at('efectivo') + 0.2);
    return { bg: 'night', world: w, cam: H.cam([540, 1280, 1.0], [540, 1300, 1.06], lt / dur), particles: 'none' };
  };

  // [7] Y cuarto: desconecta tus aparatos. Cuando la luz vuelve, puede llegar con un pico que los QUEMA.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, at = (w) => H.wt(w, s0) - s0;
    const td = at('desconecta'), tv = at('vuelve'), tq = at('quema');
    const unplug = [H.ease.inOut(H.clamp((lt - td) / 0.5, 0, 1)), H.ease.inOut(H.clamp((lt - td - 0.35) / 0.5, 0, 1))];
    let w = P(H, 'outlet', 540, 1170, 0.9, { unplug }, lt, t);
    const burnt = lt > tq;
    w += P(H, 'tv', 540, 1820, 1.05, { on: lt > tv && !burnt, burnt }, lt, t);
    if (lt > tq) { w += P(H, 'outlet', 540, 1500, 0.001, { spark: H.clamp((lt - tq) / 0.4, 0, 1) }, lt, t); H.sfx('hit', s0 + tq, 0.8); H.sfx('buzz', s0 + tq + 0.05, 0.6); }
    H.ov('<div class="tag" style="background:#ffcf3d">4 · DESCONECTA</div>', 560, lt, 0.2);
    if (burnt) H.ov(H.MARK_NO, 680, lt, tq + 0.1);
    return { bg: 'room', world: w, cam: H.cam([540, 1300, 1.0], [540, 1340, 1.05], lt / dur), particles: 'none', shake: burnt ? 10 * Math.exp(-(lt - tq) * 5) : 0, flash: burnt ? 0.5 * Math.max(0, 1 - (lt - tq) / 0.2) : 0 };
  };

  // [8] Pero el error que más mata en un apagón no es el frío... ni el hambre...
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'candle', 820, 1700, 1.0, {}, lt, t);
    w += P(H, 'person', 470, 1820, 1.08, { pose: 'hug', mood: 'worried', hairStyle: 'long', hair: '#5a2a1a', shirt: '#7a8fb0', seed: 8, look: [0.4, 0.2] }, lt, t);
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.55 }, lt, t);
    w += `<defs><radialGradient id="cglow"><stop offset="0" stop-color="#ffb04a" stop-opacity="0.35"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient></defs><circle cx="820" cy="1560" r="420" fill="url(#cglow)"/>`;
    H.ov('<div class="tag">NO ES EL FRÍO</div>', 560, lt, H.wt('frio', s0) - s0);
    H.ov('<div class="tag">NI EL HAMBRE</div>', 680, lt, H.wt('hambre', s0) - s0);
    return { bg: 'room', world: w, cam: H.cam([540, 1400, 1.0], [540, 1450, 1.15], lt / dur), particles: 'none' };
  };

  // [9] Es usar un generador, un anafre o un brasero dentro de casa. El monóxido de carbono no huele, no se ve... y te duerme para siempre.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt, at = (w) => H.wt(w, s0) - s0;
    const tm = at('monoxido');
    let w = '';
    w += P(H, 'person', 400, 1640, 0.92, { mood: 'sleep', shirt: '#2fb3a3', hairStyle: 'short', seed: 11 }, lt, t, -6);
    w += P(H, 'person', 680, 1640, 0.88, { mood: 'sleep', shirt: '#e8709a', hairStyle: 'long', hair: '#5a2a1a', skin: '#c98d66', seed: 12 }, lt, t, 6);
    w += P(H, 'couch', 540, 1800, 1.1, {}, lt, t);
    if (lt > at('generador')) w += P(H, 'generator', 880, 1880, 0.62 * H.pop(lt, at('generador')), {}, lt, t);
    if (lt > at('anafre')) w += P(H, 'brazier', 170, 1880, 0.7 * H.pop(lt, at('anafre')), {}, lt, t);
    if (lt > tm - 0.6) w += P(H, 'coCloud', 540, 1700, 1.0, { amount: H.clamp((lt - tm + 0.6) / 2.5, 0, 1) }, lt, t);
    if (lt > at('duerme')) w += P(H, 'zzz', 560, 1150, 1.2, {}, lt, t);
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.4 }, lt, t);
    H.ov(H.MARK_NO, 560, lt, at('dentro'));
    H.ov('<div class="tag" style="' + red + '">MONÓXIDO DE CARBONO</div>', 800, lt, tm);
    const ts = at('siempre');
    return { bg: 'room', world: w, cam: H.cam([540, 1380, 1.0], [540, 1420, 1.1], lt / dur), particles: 'none', flash: lt > ts ? 0.25 * Math.max(0, 1 - (lt - ts) / 0.6) : 0, flashColor: '#e5484d' };
  };

  // [10] Ahora dime: ¿cuántas horas aguantarías tú sin luz? Te leo en los comentarios... y sígueme para más.
  S[10] = (H, lt, dur, t) => {
    const s0 = t - lt, tc = H.wt('cuantas', s0) - s0;
    let w = P(H, 'person', 230, 1920, 0.85, { holding: 'linterna', holdRot: -30, pose: 'hold', mood: 'talk', hairStyle: 'short', seed: 3, look: [0.6, -0.2] }, lt, t);
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.5, beams: [[375, 1665, -32, 900]] }, lt, t);
    H.ovRaw('<div class="card"><span class="n">1</span>Menos de 24 horas</div>', 680, lt, tc + 0.3);
    H.ovRaw('<div class="card"><span class="n">2</span>Unas 48 horas</div>', 830, lt, tc + 0.6);
    H.ovRaw('<div class="card"><span class="n">3</span>72 horas o más</div>', 980, lt, tc + 0.9);
    H.ov('<div class="bubble" style="margin-left:0"><i></i><i></i><i></i></div>', 1260, lt, H.wt('comentarios', s0) - s0, 'left:72%');
    return { bg: 'room', world: w, cam: H.cam([540, 1300, 1.0], [540, 1300, 1.05], lt / dur), particles: 'none' };
  };
})();
