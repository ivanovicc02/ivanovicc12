// "¿Qué harías si llegas a casa y huele a gas?" en 2D (SHOTS2D).
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, { t, lt, dur: 1, u: 0 }), rot, op);
  const HERO = { shirt: '#2fb3a3', hairStyle: 'short', hair: '#3a2418', seed: 5 };
  const hero = (o) => Object.assign({}, HERO, o);
  const hissAll = (H, s0, dur, v = 0.7) => { for (let k = 0; k * 2.8 < dur; k++) H.sfx('hiss', s0 + k * 2.8, v); };

  // [1] ¿Qué harías si llegas a casa... y huele a GAS? Escríbelo en los comentarios...
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt, tg = H.wt('gas', s0) - s0;
    const open = H.ease.out(H.clamp((lt - 0.9) / 0.8, 0, 1));
    for (let i = 0; i < 3; i++) H.sfx('step', s0 + i * 0.35, 0.8);
    H.sfx('creak', s0 + 0.9, 1);
    if (lt > tg) hissAll(H, s0 + tg, dur - tg, 0.8);
    let w = P(H, 'house', 500, 1560, 0.8, { open }, lt, t);
    w += P(H, 'person', 760, 1620, 0.8, hero({ mood: lt > tg ? 'scared' : 'happy', pose: lt > tg ? 'scared' : 'idle', look: [-0.7, 0] }), lt, t);
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 330, lt, H.wt('escribelo', s0) - s0);
    return { bg: 'street', world: w, cam: H.cam([560, 1480, 1.0], [600, 1460, 1.08], lt / dur), particles: 'none' };
  };

  // [2] Porque casi todo el mundo hace lo mismo: prender la luz para ver de dónde viene.
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt, tp = H.wt('prender', s0) - s0;
    hissAll(H, s0, dur, 0.6);
    let w = P(H, 'lightSwitch', 720, 1080, 0.8, { on: false }, lt, t);
    w += P(H, 'gasLayer', 0, 1480, 1, { height: 0.6 }, lt, t);
    w += P(H, 'person', 430, 1560, 1.0, hero({ mood: 'worried', pose: lt > tp ? 'point' : 'idle', look: [0.8, -0.3] }), lt, t);
    w += P(H, 'darkness', 0, 0, 1, { amount: 0.45 }, lt, t);
    return { bg: 'room', world: w, cam: H.cam([540, 1440, 1.0], [620, 1400, 1.15], lt / dur), particles: 'none' };
  };

  // [3] Y ese es el ERROR más peligroso. Un interruptor hace una chispa... todo EXPLOTE.
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, te = H.wt('explote', s0) - s0, tc = H.wt('chispa', s0) - s0;
    H.ov(H.MARK_NO, 300, lt, H.wt('error', s0) - s0);
    const spark = lt > tc ? 0.6 + 0.4 * Math.abs(Math.sin(lt * 30)) : 0;
    if (lt > tc) H.sfx('buzz', s0 + tc, 0.5);
    let w = P(H, 'lightSwitch', 540, 830, 1.5, { cut: lt > tc - 0.8, spark, on: lt > tc }, lt, t);
    let shake = 0, flash = 0;
    if (lt > te) {
      w += P(H, 'explosion', 540, 830, 1, {}, lt - te, t);
      H.sfx('boom', s0 + te, 1); H.sfx('rumble', s0 + te + 0.2, 0.8);
      shake = 26 * Math.exp(-(lt - te) * 4); flash = 0.6 * Math.max(0, 1 - (lt - te) / 0.3);
    }
    return { bg: 'room', world: `<rect x="-800" y="-800" width="2680" height="3520" fill="#1a1636" opacity="0.6"/>` + w, cam: [540, 960, 1.0], shake, flash, flashColor: '#ffb04a', particles: 'none' };
  };

  // [4] Y un dato que casi nadie sabe: el gas no huele a nada. Le agregan un olor a huevo podrido a propósito...
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, tn = H.wt('nada', s0) - s0, th = H.wt('huevo', s0) - s0;
    let w = P(H, 'flameIcon', 300, 800, 1.1 * H.pop(lt, 0.2), {}, lt, t);
    if (lt > th) w += P(H, 'egg', 790, 900, 1.0 * H.pop(lt, th), {}, lt, t, Math.sin(t * 3) * 4);
    H.ov('<div class="tag">EL GAS NO HUELE</div>', 330, lt, tn);
    H.ov('<div class="tag" style="background:#9bd36a">OLOR A HUEVO PODRIDO</div>', 460, lt, th + 0.2);
    return { bg: 'room', world: `<rect x="-800" y="-800" width="2680" height="3520" fill="#1a1636" opacity="0.55"/>` + w, cam: [540, 960, 1.0], particles: 'none' };
  };

  // [5] Así que, primero: no toques NADA eléctrico. Ni la luz, ni el timbre, ni desconectes aparatos. Y no prendas cerillos ni encendedores.
  const ICONS = [['luz', 220, 640], ['timbre', 540, 640], ['desconectes', 860, 640, 'enchufe'], ['cerillos', 380, 940, 'cerillo'], ['encendedores', 700, 940, 'encendedor']];
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = '';
    ICONS.forEach(([word, x, y, kind]) => {
      const at = H.wt(word, s0) - s0;
      if (lt < at) return;
      w += P(H, 'noIcon', x, y, 1.05 * H.pop(lt, at, 0.3), { kind: kind || word }, lt, t);
      H.sfx('buzz', s0 + at + 0.05, 0.35); H.sfx('pop', s0 + at, 0.7);
    });
    H.ov('<div class="tag" style="background:#ffcf3d">1 · NADA ELÉCTRICO</div>', 330, lt, 0.2);
    return { bg: 'room', world: `<rect x="-800" y="-800" width="2680" height="3520" fill="#1a1636" opacity="0.6"/>` + w, cam: [540, 960, 1.0], particles: 'none' };
  };

  // [6] Segundo: abre puertas y ventanas. El gas LP de los tanques pesa más que el aire... y se acumula ABAJO.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, ta = H.wt('abre', s0) - s0, tv = H.wt('ventanas', s0) - s0;
    hissAll(H, s0, dur, 0.5);
    const ow = H.ease.out(H.clamp((lt - tv) / 0.7, 0, 1)), od = H.ease.out(H.clamp((lt - ta) / 0.7, 0, 1));
    if (lt > ta) H.sfx('creak', s0 + ta, 0.9);
    let w = P(H, 'windowOpen', 330, 900, 1.0, { open: ow }, lt, t);
    w += P(H, 'doorOpen', 820, 1480, 1.0, { open: od }, lt, t);
    w += P(H, 'gasLayer', 0, 1480, 1, { height: 1 - 0.5 * H.clamp((lt - tv) / 4, 0, 1), flow: od }, lt, t);
    H.ov('<div class="tag" style="background:#ffcf3d">2 · VENTILA</div>', 330, lt, 0.2);
    H.ov('<div class="tag" style="background:#9bd36a">EL GAS LP SE QUEDA ABAJO</div>', 460, lt, H.wt('abajo', s0) - s0);
    return { bg: 'room', world: w, cam: [540, 1340, 1.0], particles: 'none' };
  };

  // [7] Tercero: si puedes hacerlo sin riesgo, cierra la llave del tanque o del medidor.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, tc = H.wt('cierra', s0) - s0;
    const closed = H.ease.inOut(H.clamp((lt - tc) / 0.8, 0, 1));
    if (lt > tc) H.sfx('creak', s0 + tc, 0.7);
    if (lt < tc + 0.8) hissAll(H, s0, tc + 0.8, 0.6);
    const w = P(H, 'gasTank', 540, 1560, 0.8, { closed }, lt, t);
    H.ov('<div class="tag" style="background:#ffcf3d">3 · CIERRA LA LLAVE</div>', 330, lt, 0.2);
    H.ov(H.MARK_OK, 470, lt, tc + 0.85);
    return { bg: 'street', world: w, cam: H.cam([540, 1400, 1.0], [540, 1380, 1.08], lt / dur), particles: 'none' };
  };

  // [8] Y cuarto: sal de la casa y llama al 911... desde AFUERA. Incluso el celular puede hacer chispa.
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt, tl = H.wt('llama', s0) - s0;
    let w = P(H, 'house', 330, 1560, 0.6, { open: 1 }, lt, t);
    const x = H.lerp(420, 800, H.ease.out(H.clamp(lt / 1.2, 0, 1)));
    for (let i = 0; i < 3; i++) H.sfx('step', s0 + i * 0.35, 0.8);
    w += P(H, 'person', x, 1640, 0.95, hero({ mood: 'talk', pose: lt > tl ? 'hold' : 'idle', holding: lt > tl ? 'celular' : null, holdRot: -10, look: [-0.5, 0] }), lt, t);
    H.ov('<div class="tag" style="background:#ffcf3d">4 · LLAMA DESDE AFUERA</div>', 330, lt, 0.2);
    H.ov('<div class="badge" style="color:#9fe6a0">911</div>', 460, lt, H.wt('911', s0) - s0);
    return { bg: 'street', world: w, cam: [560, 1480, 1.0], particles: 'none' };
  };

  // [9] Ahora dime la verdad: ¿tú sabías lo del interruptor? Pon sí o no en los comentarios... y sígueme.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt;
    let w = P(H, 'house', 850, 1560, 0.5, { open: 0 }, lt, t);
    w += P(H, 'person', 470, 1640, 1.0, hero({ mood: 'happy', pose: 'cheer' }), lt, t);
    H.ov('<div class="tag">¿LO SABÍAS?</div>', 330, lt, H.wt('sabias', s0) - s0);
    H.ov('<div class="pill si">SÍ</div>', 470, lt, H.wt('si', s0) - s0, 'left:20%');
    H.ov('<div class="pill no">NO</div>', 470, lt, H.wt('no', H.wt('si', s0)) - s0, 'left:80%');
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1480, lt, H.wt('comentarios', s0) - s0);
    return { bg: 'street', world: w, cam: [540, 1480, 1.0], particles: 'none' };
  };
})();
