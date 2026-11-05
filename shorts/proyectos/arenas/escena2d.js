// "¿Qué harías si caes en arenas movedizas?" en 2D (SHOTS2D), con muchos efectos de sonido.
(function () {
  const A = window.ASSETS;
  const S = (window.SHOTS2D = {});
  const C = (p, lt, t) => ({ t, lt, dur: 1, u: 0 });
  const P = (H, kind, x, y, s, p, lt, t, rot = 0, op = 1) => H.at(x, y, s, A[kind](p, C(p, lt, t)), rot, op);
  const PIT = [540, 1450];
  const CAM = [540, 1420, 1.3];
  const HERO = { shirt: '#2fb3a3', hairStyle: 'short', hair: '#3a2418', seed: 5 };

  // personaje hundido: depth = cuánto están los pies por debajo de la superficie; rot = inclinación
  function sunk(H, x, depth, s, rot, p, lt, t) {
    const body = A.person(Object.assign({}, HERO, p), C(p, lt, t));
    return `<g transform="translate(${x.toFixed(1)},${PIT[1]}) rotate(${rot.toFixed(2)}) translate(0,${depth.toFixed(1)}) scale(${s})">${body}</g>`;
  }
  const pit = (H, lt, t, inner) => P(H, 'pitTop', PIT[0], PIT[1], 1, {}, lt, t) + inner + P(H, 'pitFront', PIT[0], PIT[1], 1, {}, lt, t);
  function ambience(H, s0, dur, vol = 0.5) { for (let k = 0; k * 5.5 < dur; k++) H.sfx('waves', s0 + k * 5.5, vol); }

  // [1] ¿Qué harías si caes en arenas MOVEDIZAS? Escríbelo en los comentarios...
  S[1] = (H, lt, dur, t) => {
    const s0 = t - lt, tf = 1.5;
    ambience(H, s0, dur);
    const walk = H.clamp(lt / tf, 0, 1);
    const x = H.lerp(-120, PIT[0], walk);
    for (let i = 0; i < 4; i++) H.sfx('step', s0 + i * 0.38, 0.8);
    const depth = lt < tf ? -Math.abs(Math.sin(lt * 8)) * 12 : 110 * H.ease.out(H.clamp((lt - tf) / 0.5, 0, 1));
    if (lt > tf) H.sfx('squelch', s0 + tf, 1);
    const w = pit(H, lt, t, sunk(H, x, depth, 1.0, 0, { mood: lt > tf ? 'surprised' : 'happy', pose: lt > tf ? 'scared' : 'idle', look: [0, 0.5] }, lt, t));
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 330, lt, H.wt('escribelo', s0) - s0);
    return { bg: 'beach', world: w, cam: H.cam([540, 1400, 1.1], CAM, lt / dur), particles: 'none', shake: lt > tf && lt < tf + 0.3 ? 8 : 0 };
  };

  // [2] Porque casi todo el mundo cree lo mismo que vio en las películas: que te traga entero... y desapareces.
  S[2] = (H, lt, dur, t) => {
    const s0 = t - lt, tt = H.wt('traga', s0) - s0, td = H.wt('desapareces', s0) - s0;
    H.sfx('projector', s0, 0.9); H.sfx('projector', s0 + 2.4, 0.9);
    const depth = 170 + 420 * H.ease.in(H.clamp((lt - tt) / (td - tt + 0.6), 0, 1));
    let w = pit(H, lt, t, sunk(H, PIT[0], depth, 1.0, Math.sin(t * 9) * 3, { mood: 'scared', pose: 'cheer' }, lt, t));
    if (lt > td) { H.sfx('bubbles', s0 + td + 0.3, 0.8); }
    H.ov('<div class="tag warn">EN LAS PELÍCULAS…</div>', 330, lt, 0.3);
    const screen = A.filmFrame({}, C({}, lt, t));
    return { bg: 'beach', world: w, cam: CAM, screen, filter: 'sepia(0.85) contrast(1.15) brightness(0.9)', particles: 'none' };
  };

  // [3] MENTIRA. La arena movediza es casi el doble de densa que tu cuerpo. Es imposible que te hundas... hasta la cintura.
  S[3] = (H, lt, dur, t) => {
    const s0 = t - lt, tm = H.wt('mentira', s0) - s0, td = H.wt('densa', s0) - s0 - 0.6, ti = H.wt('imposible', s0) - s0;
    ambience(H, s0, dur, 0.35);
    H.ov(H.MARK_NO, 330, lt, tm);
    if (lt > td && lt < ti) {
      const w = `<rect x="-800" y="-800" width="2680" height="3520" fill="#1a1636" opacity="0.75"/>` + P(H, 'density', 540, 1330, 1.0, {}, lt - td, t);
      H.sfx('rumble', s0 + td + 0.4, 0.5);
      return { bg: 'beach', world: w, cam: CAM, particles: 'none' };
    }
    const w = pit(H, lt, t, sunk(H, PIT[0], 170, 1.0, 0, { mood: lt > ti ? 'neutral' : 'surprised', pose: lt > ti ? 'shrug' : 'scared' }, lt, t));
    H.ov('<div class="tag" style="background:#2bb673;color:#fff">HASTA LA CINTURA</div>', 700, lt, H.wt('cintura', s0) - s0);
    if (lt > ti) H.sfx('squelch', s0 + ti, 0.7);
    return { bg: 'beach', world: w, cam: H.cam(CAM, [540, 1400, 1.42], lt / dur), particles: 'none', flash: lt > tm ? 0.3 * Math.max(0, 1 - (lt - tm) / 0.2) : 0 };
  };

  // [4] Entonces... ¿por qué es tan peligrosa? ... cemento. ... levantar un COCHE.
  S[4] = (H, lt, dur, t) => {
    const s0 = t - lt, tc = H.wt('cemento', s0) - s0, tco = H.wt('coche', s0) - s0;
    ambience(H, s0, dur, 0.35);
    H.sfx('heartbeat', s0 + 0.2, 0.8); H.sfx('heartbeat', s0 + 1.8, 0.7);
    // intenta tirar de la pierna: pequeños saltos que no sirven
    const pull = lt > tc ? Math.max(0, Math.sin((lt - tc) * 7)) * 18 : 0;
    if (lt > tc) for (let i = 0; i < 6; i++) H.sfx('squelch', s0 + tc + 0.22 + i * 0.9, 0.6);
    let w = pit(H, lt, t, sunk(H, PIT[0], 170 - pull, 1.0, Math.sin(t * 7) * 2, { mood: 'worried', pose: 'hips', look: [0, 0.6] }, lt, t));
    if (lt > tco) { w += P(H, 'carSide', 800, 1230, 0.62 * H.pop(lt, tco, 0.4), {}, lt, t); H.sfx('hit', s0 + tco, 0.8); H.sfx('rumble', s0 + tco, 0.6); }
    H.ov('<div class="tag">¡COMO CEMENTO!</div>', 330, lt, tc);
    H.ov('<div class="badge">= <small>levantar un</small> COCHE</div>', 460, lt, tco + 0.1);
    return { bg: 'beach', world: w, cam: H.cam([540, 1400, 1.42], CAM, lt / dur), particles: 'none' };
  };

  // [5] Y si estás en una playa... el verdadero peligro no es la arena. Es la marea que sube.
  S[5] = (H, lt, dur, t) => {
    const s0 = t - lt, tm = H.wt('marea', s0) - s0;
    ambience(H, s0, dur, 0.9);
    H.sfx('heartbeat', s0 + 0.4, 0.9); H.sfx('heartbeat', s0 + 2.0, 1); H.sfx('heartbeat', s0 + 3.6, 1);
    const level = 0.58 * H.ease.inOut(H.clamp((lt - 0.5) / (dur - 0.5), 0, 1));
    let w = P(H, 'tide', 0, 0, 1, { level }, lt, t);
    w += pit(H, lt, t, sunk(H, PIT[0], 170, 1.0, 0, { mood: 'scared', pose: 'scared', look: [0, -0.8] }, lt, t));
    if (lt > tm) H.sfx('splash', s0 + tm + 0.1, 0.5);
    H.ov('<div class="tag" style="background:#e5484d;color:#fff">¡LA MAREA!</div>', 560, lt, tm);
    return { bg: 'beach', world: w, cam: H.cam(CAM, [540, 1350, 1.05], lt / dur), particles: 'none', flash: lt > tm ? 0.3 * Math.max(0, 1 - (lt - tm) / 0.4) : 0, flashColor: '#e5484d' };
  };

  // [6] Así que, si caes, primero: NO forcejees. Cada tirón te deja más atrapado.
  S[6] = (H, lt, dur, t) => {
    const s0 = t - lt, tn = H.wt('forcejees', s0) - s0;
    ambience(H, s0, dur, 0.35);
    const jerk = Math.sin(lt * 14) * 10;
    const depth = 170 + 70 * H.clamp(lt / dur, 0, 1);
    for (let i = 0; i < 8; i++) H.sfx('squelch', s0 + 0.3 + i * 0.65, 0.55);
    const w = pit(H, lt, t, sunk(H, PIT[0] + jerk, depth, 1.0, jerk * 0.6, { mood: 'scared', pose: 'cheer' }, lt, t));
    H.ov('<div class="tag" style="background:#ffcf3d">1 · NO FORCEJEES</div>', 330, lt, 0.2);
    H.ov(H.MARK_NO, 460, lt, tn);
    return { bg: 'beach', world: w, cam: [540, 1420, 1.35], particles: 'none', shake: 4 };
  };

  // [7] Segundo: suelta la mochila y échate hacia atrás, como si flotaras. Así repartes tu peso.
  S[7] = (H, lt, dur, t) => {
    const s0 = t - lt, tmo = H.wt('mochila', s0) - s0, ta = H.wt('atras', s0) - s0;
    ambience(H, s0, dur, 0.35);
    const lean = H.ease.inOut(H.clamp((lt - ta) / 1.2, 0, 1));
    let w = '';
    // la mochila sale volando
    if (lt > tmo) {
      const u = H.clamp((lt - tmo) / 0.7, 0, 1);
      w += P(H, 'backpack', H.lerp(620, 900, u), H.lerp(1250, 1500, u) - Math.sin(u * Math.PI) * 220, 0.32, {}, lt, t, u * 140);
      H.sfx('swoosh', s0 + tmo, 1); H.sfx('step', s0 + tmo + 0.7, 1);
    } else w += P(H, 'backpack', 620, 1250, 0.32, {}, lt, t, 10);
    w = pit(H, lt, t, sunk(H, PIT[0], H.lerp(170, 110, lean), 1.0, -58 * lean, { mood: lt > ta ? 'neutral' : 'worried', pose: lt > ta ? 'shrug' : 'idle' }, lt, t)) + w;
    if (lt > ta) H.sfx('squelch', s0 + ta + 0.3, 0.5);
    H.ov('<div class="tag" style="background:#ffcf3d">2 · ÉCHATE HACIA ATRÁS</div>', 330, lt, 0.2);
    H.ov(H.MARK_OK, 460, lt, H.wt('repartes', s0) - s0);
    return { bg: 'beach', world: w, cam: H.cam(CAM, [520, 1420, 1.38], lt / dur), particles: 'none' };
  };

  // [8] Tercero: mueve las piernas despacito, en círculos. El agua se va metiendo y la arena te suelta poco a poco.
  S[8] = (H, lt, dur, t) => {
    const s0 = t - lt, tw = H.wt('agua', s0) - s0;
    const wet = H.clamp((lt - tw) / 2.5, 0, 1);
    for (let i = 0; i < 8; i++) if (lt > tw) H.sfx('drip', s0 + tw + i * 0.35, 0.7);
    for (let i = 0; i < 3; i++) H.sfx('squelch', s0 + 0.6 + i * 1.6, 0.35);
    const w = `<rect x="-800" y="-800" width="2680" height="3520" fill="#1a1636" opacity="0.55"/>` + P(H, 'crossSection', 540, 1180, 1.0, { wet }, lt, t);
    H.ov('<div class="tag" style="background:#ffcf3d">3 · PIERNAS EN CÍRCULOS</div>', 330, lt, 0.2);
    return { bg: 'beach', world: w, cam: [540, 1500, 1.0], particles: 'none' };
  };

  // [9] Y cuarto: avanza lento, de espaldas, hacia el suelo firme. Sin prisa... pero sin parar.
  S[9] = (H, lt, dur, t) => {
    const s0 = t - lt;
    ambience(H, s0, dur, 0.35);
    const u = H.ease.inOut(H.clamp((lt - 0.6) / (dur - 0.8), 0, 1));
    for (let i = 0; i < 5; i++) H.sfx('squelch', s0 + 0.8 + i * 0.9, 0.45);
    let w = pit(H, lt, t, sunk(H, H.lerp(PIT[0], 290, u), H.lerp(110, 30, u), 1.0, -70, { mood: 'neutral', pose: 'shrug', look: [-0.6, 0] }, lt, t));
    w += P(H, 'arrowUp', 330, 1250, 0.7, { color: '#2bb673' }, lt, t, -90);
    H.ov('<div class="tag" style="background:#ffcf3d">4 · DE ESPALDAS</div>', 330, lt, 0.2);
    H.ov(H.MARK_OK, 460, lt, H.wt('parar', s0) - s0);
    return { bg: 'beach', world: w, cam: H.cam(CAM, [470, 1420, 1.3], lt / dur), particles: 'none' };
  };

  // [10] Ahora dime: ¿tú sabías que no te puede tragar? Pon sí o no en los comentarios... y sígueme.
  S[10] = (H, lt, dur, t) => {
    const s0 = t - lt;
    ambience(H, s0, dur, 0.4);
    let w = P(H, 'pitTop', 880, 1500, 0.6, {}, lt, t);
    w += P(H, 'person', 430, 1560, 1.0, Object.assign({}, HERO, { pants: '#8a6a3e', mood: 'happy', pose: 'cheer' }), lt, t);
    H.ov('<div class="tag">¿LO SABÍAS?</div>', 330, lt, H.wt('sabias', s0) - s0);
    H.ov('<div class="pill si">SÍ</div>', 470, lt, H.wt('si', s0) - s0, 'left:22%');
    H.ov('<div class="pill no">NO</div>', 470, lt, H.wt('no', H.wt('si', s0)) - s0, 'left:78%');
    H.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1500, lt, H.wt('comentarios', s0) - s0);
    return { bg: 'beach', world: w, cam: [560, 1420, 1.25], particles: 'none' };
  };
})();
