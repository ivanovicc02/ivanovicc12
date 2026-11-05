// "¿Qué harías si la Luna desapareciera esta noche?" en 2D (SHOTS2D).
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op);
  const HERO = { shirt: '#2fb3a3', hairStyle: 'short', hair: '#3a2418', seed: 5 };
  const hero = (o) => Object.assign({}, HERO, o);

  // [1] ¿Qué harías si esta noche miras al cielo... y la LUNA ya no está? Escríbelo...
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt, tl = H.wt('luna', s0) - s0 + 0.3;
    const k = 1 - H.ease.in(H.clamp((lt - tl) / 0.8, 0, 1));
    H.sfx('riser', s0 + tl - 1.4, 0.8);
    if (lt > tl) { H.sfx('whoosh', s0 + tl, 1); H.sfx('boom', s0 + tl + 0.5, 0.5); }
    let w = P(H, 'moon', 760, 860, 1.0, { k }, lt, t);
    w += P(H, 'person', 430, 1560, 0.9, hero({ mood: lt > tl ? 'surprised' : 'happy', look: [0.6, -1] }), lt, t);
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 330, lt, H.wt('escribelo', s0) - s0);
    return { bg: 'nightClear', world: w, cam: H.cam([540, 1440, 1.0], [560, 1420, 1.08], lt / dur), particles: 'none' };
  };

  // [2] Lo primero que notarías... es la OSCURIDAD... muchos animales... quedarían perdidos.
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt, to = H.wt('oscuridad', s0) - s0, ta = H.wt('animales', s0) - s0;
    const dark = 0.75 * H.ease.inOut(H.clamp((lt - to) / 1.2, 0, 1));
    if (lt > to) H.sfx('rumble', s0 + to, 0.5);
    let w = P(H, 'person', 540, 1560, 0.9, hero({ mood: 'worried', look: [Math.sin(t * 1.5), -0.2] }), lt, t);
    w += P(H, 'darkness', 0, 0, 1, { amount: dark }, lt, t);
    [[180, 1250, 0.9], [880, 1200, 0.8], [330, 980, 0.7], [760, 1000, 0.75], [120, 1420, 1]].forEach(([x, y, s], i) => {
      const at = ta + i * 0.35;
      if (lt > at) { w += P(H, 'eyes', x, y, 1.7 * s * H.pop(lt, at, 0.3), { q: lt > H.wt('perdidos', s0) - s0, seed: i }, lt, t); H.sfx('pop', s0 + at, 0.4); }
    });
    H.ov('<div class="tag">NOCHES NEGRAS</div>', 330, lt, H.wt('negras', s0) - s0);
    return { bg: 'nightClear', world: w, cam: [540, 1440, 1.0], particles: 'none' };
  };

  // [3] Las tortugas marinas... buscan el mar guiándose por el brillo del horizonte. Sin Luna, miles se irían en la dirección EQUIVOCADA.
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, ts = H.wt('sin', s0) - s0;
    let w = '';
    for (let i = 0; i < 9; i++) {
      const x0 = 260 + (i % 3) * 220 + (i > 5 ? 60 : 0), y0 = 1300 + Math.floor(i / 3) * 100;
      let x, y, ang;
      if (lt < ts) { x = x0 + Math.sin(i) * 10; y = y0 - lt * 22; ang = 0; }
      else { const d = lt - ts; x = x0 - d * 70; y = y0 - ts * 22 + d * 25; ang = -110; }
      w += P(H, 'turtle', x, y, 0.95, { seed: i }, lt, t, ang);
    }
    if (lt > ts) H.sfx('buzz', s0 + H.wt('equivocada', s0) - s0, 0.5);
    H.ov('<div class="tag" style="background:#e5484d;color:#fff">← DIRECCIÓN EQUIVOCADA</div>', 330, lt, H.wt('equivocada', s0) - s0);
    H.ov('<div class="tag">EL MAR ESTÁ ARRIBA ↑</div>', 330, lt < H.wt('equivocada', s0) - s0 ? lt : -1, H.wt('horizonte', s0) - s0);
    for (let k = 0; k * 5.5 < dur; k++) H.sfx('waves', s0 + k * 5.5, 0.35);
    return { bg: 'beachNight', world: w, cam: [540, 1440, 1.0], particles: 'none' };
  };

  // [4] Lo segundo: el MAR. La Luna... causa casi todas las mareas. Sin ella, las mareas serían mucho más pequeñas...
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, ts = H.wt('sin', s0) - s0, tp = H.wt('pequenas', s0) - s0;
    const k = 1 - H.ease.in(H.clamp((lt - ts) / 0.8, 0, 1));
    const level = lt < ts ? 0.45 + 0.08 * Math.sin(lt * 1.5) : H.lerp(0.45, 0.06, H.ease.inOut(H.clamp((lt - ts) / 2.5, 0, 1)));
    let w = P(H, 'moon', 540, 640, 0.8, { k }, lt, t);
    if (k > 0.05) for (let i = 0; i < 3; i++) { const u = ((t * 0.8 + i / 3) % 1); w += `<path d="M${380 + i * 160} ${1150 - u * 260} l0 -50 m-18 18 l18 -18 l18 18" stroke="#fffbe6" stroke-width="8" fill="none" stroke-linecap="round" opacity="${((1 - u) * k).toFixed(2)}"/>`; }
    w += P(H, 'tide', 0, 0, 1, { level }, lt, t);
    for (let kk = 0; kk * 5.5 < dur; kk++) H.sfx('waves', s0 + kk * 5.5, 0.5);
    H.ov('<div class="tag" style="background:#3aa0e8;color:#fff">LA LUNA MUEVE EL MAR</div>', 330, lt < ts ? lt : -1, H.wt('mareas', s0) - s0);
    H.ov('<div class="tag">MAREAS MÁS PEQUEÑAS</div>', 330, lt, tp);
    H.ov(H.MARK_NO, 470, lt, H.wt('sobrevivirian', s0) - s0);
    return { bg: 'beach', world: w, cam: [540, 1380, 1.0], particles: 'none' };
  };

  // [5] Pero lo más raro llegaría con el tiempo. La Luna funciona como un ancla que mantiene estable la inclinación de la Tierra.
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt, ta = H.wt('ancla', s0) - s0;
    let w = P(H, 'earthAxis', 540, 760, 0.85, { tilt: 23, moon: H.clamp(lt / 0.8, 0, 1), anchor: lt > ta }, lt, t);
    if (lt > ta) { w += P(H, 'anchor', 900, 1010, 0.5 * H.pop(lt, ta), {}, lt, t, Math.sin(t * 2) * 8); H.sfx('hit', s0 + ta, 0.6); }
    H.ov('<div class="tag" style="background:#ffd84a">LA LUNA = UN ANCLA</div>', 330, lt, ta);
    return { bg: 'space', world: w, cam: H.cam([540, 900, 0.95], [540, 880, 1.05], lt / dur), particles: 'none' };
  };

  // [6] Sin ella, a lo largo de millones de años, la Tierra empezaría a TAMBALEARSE... eras de hielo a calores extremos.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, tt = H.wt('tambalearse', s0) - s0, th = H.wt('hielo', s0) - s0, tc = H.wt('calores', s0) - s0;
    const amp = H.ease.out(H.clamp((lt - tt + 0.5) / 1.5, 0, 1)) * 32;
    const tilt = 23 + Math.sin(lt * 2.2) * amp;
    const w = P(H, 'earthAxis', 540, 780, 0.85, { tilt, moon: 0 }, lt, t);
    H.sfx('rumble', s0 + tt - 0.3, 0.8);
    let screen = '';
    if (lt > th && lt < tc) screen = `<rect width="1080" height="1920" fill="#7fd0ff" opacity="0.25"/>`;
    if (lt > tc) screen = `<rect width="1080" height="1920" fill="#ff6a2f" opacity="0.25"/>`;
    H.ov('<div class="badge">MILLONES <small>de años</small></div>', 330, lt, H.wt('millones', s0) - s0);
    H.ov('<div class="tag" style="background:#7fd0ff">ERA DE HIELO</div>', 470, lt < tc ? lt : -1, th);
    H.ov('<div class="tag" style="background:#ff6a2f;color:#fff">CALOR EXTREMO</div>', 470, lt, tc);
    return { bg: 'space', world: w, cam: [540, 900, 1.0], screen, particles: 'none' };
  };

  // [7] Y un detalle triste: nunca más veríamos un eclipse de Sol.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, tn = H.wt('nunca', s0) - s0;
    const cover = H.ease.inOut(H.clamp(lt / Math.max(0.5, tn), 0, 1));
    const gone = H.ease.in(H.clamp((lt - tn) / 0.9, 0, 1));
    const w = P(H, 'sun', 540, 780, 1.0, { cover, moonGone: gone }, lt, t);
    if (lt > tn) H.sfx('whoosh', s0 + tn, 0.8);
    H.ov('<div class="tag">ADIÓS ECLIPSES</div>', 330, lt, H.wt('eclipse', s0) - s0);
    return { bg: 'space', world: w, cam: [540, 860, 1.0], particles: 'none' };
  };

  // [8] Ahora dime: ¿crees que la humanidad sobreviviría sin la Luna? Pon sí o no... y sígueme.
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt;
    const w = P(H, 'person', 540, 1560, 0.9, hero({ mood: 'worried', pose: 'shrug', look: [0, -0.8] }), lt, t);
    H.ov('<div class="tag">¿SOBREVIVIRÍAMOS?</div>', 330, lt, H.wt('crees', s0) - s0);
    H.ov('<div class="pill si">SÍ</div>', 470, lt, H.wt('si', s0) - s0, 'left:20%');
    H.ov('<div class="pill no">NO</div>', 470, lt, H.wt('no', H.wt('si', s0)) - s0, 'left:80%');
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1480, lt, H.wt('comentarios', s0) - s0);
    return { bg: 'nightClear', world: w, cam: [540, 1440, 1.0], particles: 'none' };
  };
})();
