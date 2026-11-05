// Planos 3D de "¿El fin del mundo el viernes 13 de noviembre de 2026?"
(function () {
  let O = {};
  const pos = (o, x, y, z) => o.position.set(x, y, z);

  window.BUILD3D = function (K) {
    const T = K.T;
    K.scene.add(K.camera);
    O.globe = K.makeGlobe(); K.scene.add(O.globe);
    O.cal = K.makeCalendar('13', 'NOVIEMBRE 2026', 'VIERNES'); K.scene.add(O.cal);
    O.board = K.makeChalkboard(); K.worlds.studio.add(O.board);
    O.journal = K.makeJournal(); K.scene.add(O.journal);
    O.sci1 = K.makePerson({ shirt: '#f4f4f4', pants: '#4a4f5a', hair: '#8a8a8a', scale: 1.6 }); K.addGlasses(O.sci1); K.worlds.studio.add(O.sci1);
    O.sci2 = K.makePerson({ shirt: '#f4f4f4', pants: '#3b3f48', hair: '#2a1a12', skin: '#e0b08a', scale: 1.5 }); K.addGlasses(O.sci2); K.worlds.studio.add(O.sci2);
    O.graph = K.makePopGraph(); K.worlds.studio.add(O.graph);
    O.crowd = K.makeCrowd(2600, 13); K.worlds.studio.add(O.crowd);
    O.scared = [0, 1, 2].map((i) => { const p = K.makePerson({ shirt: ['#f2c230', '#e8709a', '#5b7cff'][i], mood: 'scared', scale: 1.4 }); K.worlds.studio.add(p); return p; });
    O.family = [];
    const fam = [['#2fb3a3', 1.5, '#3a2418'], ['#e8709a', 1.42, '#5a2a1a']];
    for (let i = 0; i < 6; i++) fam.push([['#f2c230', '#5b7cff', '#f07f2a', '#8bd16a', '#e5484d', '#b07cff'][i], 0.85 + (i % 3) * 0.08, '#3a2418']);
    fam.forEach(([shirt, sc, hair]) => { const p = K.makePerson({ shirt, scale: sc, hair }); K.worlds.studio.add(p); O.family.push(p); });
    O.pack = K.makeBackpack(); K.worlds.studio.add(O.pack);
    O.items = ['agua', 'linterna', 'radio', 'botiquin', 'documentos', 'efectivo'].map((k) => { const it = K.makeItem(k); K.worlds.studio.add(it); return it; });
    O.pins = [];
    const r = window.SH.rng(12);
    for (let i = 0; i < 30; i++) {
      const g = new T.Group();
      const st = K.mesh(new T.CylinderGeometry(0.008, 0.008, 0.16, 6), K.mat('#ffffff'), false, false); st.position.y = 0.08; g.add(st);
      const hd = K.mesh(new T.SphereGeometry(0.035, 10, 8), new T.MeshStandardMaterial({ color: 0xe5484d, emissive: 0xe5484d, emissiveIntensity: 0.5 }), false, false); hd.position.y = 0.17; g.add(hd);
      const u = r() * 1.6 - 0.8, a = r() * Math.PI * 2;
      const n = new T.Vector3(Math.sqrt(1 - u * u) * Math.cos(a), u, Math.sqrt(1 - u * u) * Math.sin(a));
      g.position.copy(n); g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n); g.userData.i = i;
      O.globe.userData.earth.add(g); O.pins.push(g);
    }
  };

  // personaje de pie mirando a cámara (+z)
  function stand(K, p, x, z, rotY = 0) {
    const s = p.scale.x;
    K.pose(p, 'stand'); p.visible = true;
    p.position.set(x, 0.63 * s, z); p.rotation.set(0, -Math.PI / 2 + rotY, 0);
  }

  window.RESET3D = function (K, t) {
    K.setWorld('studio');
    [O.globe, O.cal, O.journal, O.board, O.sci1, O.sci2, O.graph, O.crowd, O.pack].forEach((o) => (o.visible = false));
    O.scared.concat(O.family, O.items).forEach((o) => (o.visible = false));
    O.pins.forEach((p) => (p.visible = false));
    O.globe.scale.setScalar(1); O.globe.position.set(0, 0, 0);
    O.globe.userData.earth.rotation.y = t * 0.12;
    O.cal.scale.setScalar(1); O.cal.rotation.set(0, 0, 0);
    O.pack.rotation.set(0, 0, 0); O.pack.scale.setScalar(1); O.pack.position.set(0, 0, 0);
    O.graph.userData.asym.visible = false; O.graph.userData.dots.visible = false;
    K.focus = new K.T.Vector3(0, 0, 0);
    K.flash = 0;
  };

  const S = (window.SHOTS = {});
  const pop = (K, lt, at, d = 0.35) => K.ease.back(K.clamp((lt - at) / d, 0, 1));

  // [1] Unos científicos calcularon que el mundo se acaba el viernes 13 de noviembre de 2026. Y ese día... ya casi está aquí.
  S[1] = (K, lt, dur, t) => {
    const s0 = t - lt;
    K.setWorld('space');
    O.globe.visible = true;
    K.cam([0, 0.5, 6.2], [0, 0.2, 4.9], [0, -0.4, 0], [0, -0.5, 0], lt / dur);
    const tc = K.wt('13', s0) - s0;
    if (lt > tc) {
      O.cal.visible = true;
      O.cal.scale.setScalar(0.62 * pop(K, lt, tc));
      O.cal.position.set(0, -1.55, 1.2); O.cal.rotation.set(-0.15, Math.sin(t * 1.2) * 0.12, 0.04);
      K.sfx('whoosh', s0 + tc - 0.2, 0.8);
    }
    const tq = K.wt('casi', s0) - s0;
    if (lt > tq) for (let i = 0; i < 6; i++) K.sfx('tick', s0 + tq + i * 0.5, 1);
  };

  // [2] No es una profecía. Es un estudio de 1960, publicado en la revista Science...
  S[2] = (K, lt, dur, t) => {
    const s0 = t - lt;
    K.filter = 'sepia(0.75) contrast(1.05) brightness(0.98)';
    O.board.visible = true; pos(O.board, 0, 2.2, -2.2);
    stand(K, O.sci1, -1.3, -0.9, 0.35); stand(K, O.sci2, 1.4, -0.6, -0.3);
    // el científico 1 señala la pizarra
    O.sci1.userData.armR.rotation.set(-0.9, 0, 2.4 + Math.sin(t * 2) * 0.05);
    const tj = K.wt('science', s0) - s0;
    if (lt < tj + 0.4) {
      K.cam([0.3, 2.6, 7.5], [0, 2.3, 6.2], [0, 1.8, -1.5], [0, 1.9, -1.5], lt / (tj + 0.4));
    } else {
      const u = (lt - tj - 0.4) / (dur - tj - 0.4);
      K.cam([0, 2.3, 6.2], [0, 2.4, 4.4], [0, 1.9, -1.5], [0, 2.3, 1.5], u);
    }
    if (lt > tj) {
      O.journal.visible = true;
      const k = pop(K, lt, tj, 0.5);
      O.journal.position.set(0, 2.35, 1.6); O.journal.scale.setScalar(0.85 * k);
      O.journal.rotation.set(0, (1 - k) * 2.5 + Math.sin(t * 0.8) * 0.06, 0);
      K.sfx('whoosh', s0 + tj, 0.9);
    }
  };

  // [3] Los científicos juntaron 2.000 años de datos de población... cada vez MÁS rápido.
  S[3] = (K, lt, dur, t) => {
    const s0 = t - lt, G = O.graph, ud = G.userData;
    O.graph.visible = true; pos(G, 2.5, 0.05, -1);
    ud.dots.visible = true;
    const u1960 = ud.uForX(ud.realLine, K.yearX(1960));
    const pr = u1960 * K.ease.inOut(K.clamp(lt / (dur - 0.4), 0, 1));
    ud.setProgress(0, pr);
    ud.dots.children.forEach((d) => (d.visible = d.position.x <= ud.pointAt(ud.realLine, pr).x + 0.01));
    const h = ud.pointAt(ud.realLine, pr);
    const hx = h.x + 2.5, hy = h.y;
    K.cam([hx - 1.2, hy + 0.6, 7.5], [hx - 0.6, hy + 0.7, 6.6], [hx - 0.5, hy + 0.1, -1], [hx - 0.3, hy + 0.2, -1], lt / dur);
    K.ov('<div class="badge">2.000 <small>años</small></div>', 560, lt, K.wt('2000', s0) - s0);
  };

  // [4] Su fórmula decía que, a ese ritmo, el viernes 13 de noviembre de 2026, la población humana sería... INFINITA.
  S[4] = (K, lt, dur, t) => {
    const s0 = t - lt, G = O.graph, ud = G.userData;
    O.graph.visible = true; pos(G, 2.5, 0.05, -1);
    ud.dots.visible = true; ud.dots.children.forEach((d) => (d.visible = true));
    const ti = K.wt('infinita', s0) - s0;
    const u1960 = ud.uForX(ud.realLine, K.yearX(1960));
    const pm = K.lerp(ud.uForX(ud.modelLine, K.yearX(1960)), 1, K.ease.in(K.clamp(lt / ti, 0, 1)));
    ud.setProgress(pm, u1960);
    ud.asym.visible = lt > K.wt('2026', s0) - s0;
    const h = ud.pointAt(ud.modelLine, pm);
    const hx = h.x + 2.5, hy = Math.min(h.y, 7.5);
    K.cam([hx - 1.4, hy + 0.4, 9], [hx - 1.4, hy + 0.4, 9], [hx - 0.8, hy - 0.4, -1], [hx - 0.8, hy - 0.4, -1], 0.5);
    K.sfx('riser', s0 + ti - 1.6, 1);
    if (lt > ti) {
      K.sfx('boom', s0 + ti, 1);
      K.shake(0.25 * Math.exp(-(lt - ti) * 3), t);
      K.flash = 0.45 * Math.max(0, 1 - (lt - ti) / 0.4); K.flashColor = '#e5484d';
      K.ov('<div class="badge" style="color:#ff8a80;font-size:150px;line-height:1">∞</div>', 520, lt, ti);
    }
    K.ov('<div class="tag warn">VIERNES 13 · NOV · 2026</div>', 1560, lt, K.wt('13', s0) - s0);
  };

  // [5] Sin comida. Sin agua. Sin espacio.
  S[5] = (K, lt, dur, t) => {
    const s0 = t - lt;
    O.crowd.visible = true; O.crowd.position.set(0, 0, 0);
    O.crowd.userData.setCount(K.lerp(300, 2600, K.ease.out(K.clamp(lt / dur, 0, 1))));
    O.scared.forEach((p, i) => { stand(K, p, -1.1 + i * 1.1, 6.5 + (i % 2) * 0.4, (i - 1) * 0.25); });
    K.cam([0, 2.3, 10.5], [0, 9, 14], [0, 1.6, 5], [0, 0, -2], lt / dur);
    const red = 'background:#e5484d;color:#fff';
    K.ov('<div class="tag">SIN COMIDA</div>', 560, lt, K.wt('comida', s0) - s0, red);
    K.ov('<div class="tag">SIN AGUA</div>', 680, lt, K.wt('agua', s0) - s0, red);
    K.ov('<div class="tag">SIN ESPACIO</div>', 800, lt, K.wt('espacio', s0) - s0, red);
  };

  // [6] Y lo más raro es que los datos encajaban casi perfecto. Pero justo después de publicarlo, pasó algo que nadie esperaba.
  S[6] = (K, lt, dur, t) => {
    const s0 = t - lt, G = O.graph, ud = G.userData;
    O.graph.visible = true; pos(G, 2.5, 0.05, -1);
    ud.dots.visible = true; ud.dots.children.forEach((d) => (d.visible = true));
    const tp = K.wt('paso', s0) - s0;
    const u1960 = ud.uForX(ud.realLine, K.yearX(1960));
    const pr = K.lerp(u1960, 1, K.ease.inOut(K.clamp((lt - tp) / (dur - tp), 0, 1)));
    ud.setProgress(ud.uForX(ud.modelLine, K.yearX(1985)), pr);
    if (lt < tp) {
      K.cam([-1.2, 2.8, 7], [-0.6, 2.6, 6.2], [-0.6, 1.4, -1], [-0.3, 1.5, -1], lt / tp);
      K.ov(K.MARK_OK, 560, lt, K.wt('encajaban', s0) - s0);
    } else {
      K.cam([-0.6, 2.6, 6.2], [1.2, 4.2, 8.5], [-0.3, 1.5, -1], [1.5, 3.2, -1], (lt - tp) / (dur - tp));
      K.sfx('riser', s0 + tp - 0.3, 0.7);
    }
  };

  // [7] Empezamos a tener MENOS hijos... Somos unos 8.000 millones... no infinitos.
  S[7] = (K, lt, dur, t) => {
    const s0 = t - lt, tm = K.wt('menos', s0) - s0;
    const xs = [-0.7, 0.7, -2.6, -1.9, -3.3, 1.9, 2.6, 3.3];
    O.family.forEach((p, i) => {
      stand(K, p, xs[i], i < 2 ? -0.4 : 0.6, (i % 2 ? -1 : 1) * 0.15);
      if (i >= 2 && i < 6) { // 4 hijos desaparecen
        const k = 1 - K.ease.in(K.clamp((lt - tm - (i - 2) * 0.18) / 0.3, 0, 1));
        p.scale.setScalar(p.userData.base = p.userData.base || p.scale.x);
        p.scale.setScalar(p.userData.base * Math.max(0.001, k)); p.visible = k > 0.01;
        if (lt > tm) K.sfx('pop', s0 + tm + (i - 2) * 0.18, 0.8);
      }
      if (i >= 6) p.position.x = K.lerp(xs[i], i === 6 ? -1.9 : 1.9, K.ease.inOut(K.clamp((lt - tm - 1) / 0.8, 0, 1)));
    });
    K.cam([0, 2.1, 8.8], [0, 1.9, 6.9], [0, 1.7, 0], [0, 1.6, 0], lt / dur);
    K.ov('<div class="badge">8.000 <small>millones</small></div>', 560, lt, K.wt('8000', s0) - s0);
    K.ov('<div class="tag">NO INFINITOS</div>', 700, lt, K.wt('infinitos', s0) - s0);
  };

  // [8] Entonces, ¿se acaba el mundo este viernes? No. Pero el estudio tenía razón en UNA cosa...
  S[8] = (K, lt, dur, t) => {
    const s0 = t - lt;
    K.setWorld('space');
    O.globe.visible = true;
    O.cal.visible = true; O.cal.scale.setScalar(0.42); O.cal.position.set(0.55, -1.3, 1.4); O.cal.rotation.set(0, -0.3, 0.1);
    K.cam([0, 0.2, 5.0], [0, 0.4, 5.8], [0, -0.1, 0], [0, 0.1, 0], lt / dur);
    K.ov('<div class="pill si" style="font-size:96px">NO</div>', 560, lt, K.wt('no', s0) - s0);
    const ta = K.wt('aguantara', s0) - s0;
    if (lt > ta) { K.flash = 0.25 * Math.max(0, Math.sin((lt - ta) * 6)) * Math.exp(-(lt - ta)); K.flashColor = '#e5484d'; }
  };

  // [9] Y mientras tanto, más de 30 gobiernos, incluido México, están pidiendo lo mismo: una MOCHILA de emergencia...
  S[9] = (K, lt, dur, t) => {
    const s0 = t - lt, tg = K.wt('30', s0) - s0, tmo = K.wt('mochila', s0) - s0;
    if (lt < tmo) {
      K.setWorld('space');
      O.globe.visible = true;
      O.pins.forEach((p) => { const at = tg + p.userData.i * 0.07; p.visible = lt > at; p.scale.setScalar(pop(K, lt, at, 0.25)); });
      K.cam([0, 0.3, 5.4], [0, 0.2, 4.7], [0, -0.3, 0], [0, -0.3, 0], lt / tmo);
      K.ov('<div class="badge">+30 <small>países</small></div>', 560, lt, tg);
      if (lt > tg) for (let i = 0; i < 30; i += 3) K.sfx('pop', s0 + tg + i * 0.07, 0.4);
    } else {
      O.pack.visible = true;
      const k = pop(K, lt, tmo, 0.45);
      O.pack.scale.setScalar(Math.max(0.001, k)); O.pack.rotation.y = Math.sin(t * 0.9) * 0.35;
      K.cam([0, 1.8, 5.6], [0.4, 1.6, 4.6], [0, 1.1, 0], [0, 1.1, 0], (lt - tmo) / (dur - tmo));
      K.ov('<div class="badge">72 <small>horas</small></div>', 560, lt, K.wt('horas', s0) - s0);
      const yel = 'background:#ffcf3d';
      K.ov('<div class="tag">TERREMOTO</div>', 1480, lt, K.wt('terremoto', s0) - s0, yel);
      K.ov('<div class="tag">APAGÓN</div>', 1590, lt, K.wt('apagon', s0) - s0, yel);
      K.ov('<div class="tag">INUNDACIÓN</div>', 1700, lt, K.wt('inundacion', s0) - s0, yel);
    }
  };

  // [10] Agua. Linterna. Radio. Botiquín. Documentos. Y algo de efectivo.
  const ITEM_WORDS = ['agua', 'linterna', 'radio', 'botiquin', 'documentos', 'efectivo'];
  const ITEM_NAMES = ['AGUA', 'LINTERNA', 'RADIO', 'BOTIQUÍN', 'DOCUMENTOS', 'EFECTIVO'];
  S[10] = (K, lt, dur, t) => {
    const s0 = t - lt;
    O.pack.visible = true; O.pack.rotation.y = 0.25;
    K.cam([0, 2.6, 6.2], [0, 2.4, 5.6], [0, 1.9, 0], [0, 1.9, 0], lt / dur);
    O.items.forEach((it, i) => {
      const at = K.wt(ITEM_WORDS[i], s0) - s0;
      if (lt < at) return;
      const hold = 0.45, fall = 0.4, d = lt - at;
      if (d > hold + fall) return; // ya está dentro de la mochila
      it.visible = true;
      const k = pop(K, lt, at, 0.25);
      const q = K.ease.in(K.clamp((d - hold) / fall, 0, 1));
      it.position.set(0, K.lerp(3.4, 1.7, q), K.lerp(0.4, 0, q));
      it.scale.setScalar(Math.max(0.001, k * (1.6 - q)));
      it.rotation.set(0.2, t * 2 + i, 0.15);
      K.ov(`<div class="tag">${ITEM_NAMES[i]}</div>`, 1520, lt, at);
      if (d > hold + fall - 0.05) K.sfx('hit', s0 + at + hold + fall - 0.05, 0.4);
    });
    // la mochila "se traga" cada objeto con un pequeño salto
    let bump = 0;
    ITEM_WORDS.forEach((w) => { const d = lt - (K.wt(w, s0) - s0) - 0.85; if (d > 0 && d < 0.3) bump = Math.max(bump, Math.sin((d / 0.3) * Math.PI)); });
    O.pack.scale.set(1 + bump * 0.08, 1 - bump * 0.06, 1 + bump * 0.08);
  };

  // [11] Ahora dime la verdad: ¿tú tienes una? Pon sí o no en los comentarios... y guarda este video para el viernes 13.
  S[11] = (K, lt, dur, t) => {
    const s0 = t - lt;
    O.pack.visible = true; O.pack.rotation.y = t * 0.8;
    O.cal.visible = true; O.cal.position.set(-1.25, 2.2, -1.2); O.cal.scale.setScalar(0.7); O.cal.rotation.set(0, 0.35, -0.08);
    K.cam([0.5, 2.0, 6.4], [0.2, 1.8, 5.2], [0, 1.4, 0], [0, 1.3, 0], lt / dur);
    K.ov('<div class="tag">¿TÚ TIENES UNA?</div>', 560, lt, K.wt('tienes', s0) - s0);
    K.ov('<div class="pill si">SÍ</div>', 1380, lt, K.wt('si', s0) - s0, 'left:30%');
    K.ov('<div class="pill no">NO</div>', 1380, lt, K.wt('no', s0) - s0, 'left:70%');
    K.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1640, lt, K.wt('comentarios', s0) - s0);
    K.ov('<div class="tag warn">GUÁRDALO PARA EL VIERNES 13</div>', 700, lt, K.wt('guarda', s0) - s0);
  };
})();
