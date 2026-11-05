// Planos 3D de "Tu coche cae a un río" (versión para comentarios).
// Cada plano [n] coincide con las marcas del guion; los tiempos internos se
// sacan de las palabras reales del audio con K.wt('palabra').
(function () {
  const Z0 = -4.5;           // donde flota el coche
  const YAW = -Math.PI / 2;  // morro hacia +z; el lado del conductor mira a -x
  let O = {};

  window.BUILD3D = function (K) {
    const T = K.T;
    O.car = K.makeCar('#d6453d');
    O.car.rotation.order = 'YZX';
    K.scene.add(O.car);
    K.scene.add(K.camera);
    O.phone = K.makePhone(); K.camera.add(O.phone);
    O.breaker = K.makeBreaker(); K.scene.add(O.breaker);
    O.hero = K.makeBreaker(); K.scene.add(O.hero);
    O.hammer = K.makeHammer(); K.scene.add(O.hammer);
    O.swimmer = K.makePerson({ shirt: '#2fb3a3' }); K.scene.add(O.swimmer);
    // flechas de presión (hijas del coche: siguen su posición)
    O.out = []; O.inn = [];
    for (let i = 0; i < 4; i++) {
      const a = K.makeArrow('#7fdcff'); a.rotation.x = -Math.PI / 2; a.scale.setScalar(0.55);
      a.position.set(-0.05 + (i % 2) * 0.75, 0.45 + Math.floor(i / 2) * 0.4, 2.0); O.car.add(a); O.out.push(a);
      const b = K.makeArrow('#ffe08a'); b.rotation.x = Math.PI / 2; b.scale.setScalar(0.55);
      b.position.set(-0.05 + (i % 2) * 0.75, 0.45 + Math.floor(i / 2) * 0.4, 0.0); O.car.add(b); O.inn.push(b);
    }
    O.ringOk = K.makeRing(0x2bf08a); O.ringOk.position.set(0.0, 1.22, 0.97); O.car.add(O.ringOk);
    O.ringNo = K.makeRing(0xff4d55); O.ringNo.position.set(0.45, 1.42, 0.97); O.car.add(O.ringNo);
    O.crack = K.makeCrackPane(1.2, 0.64); O.crack.position.set(-0.62, 1.42, 0.0); O.car.userData.winGroup.add(O.crack);
    O.v = new T.Vector3();
  };

  function L(K, x, y, z) { return O.car.localToWorld(new K.T.Vector3(x, y, z)); }
  function floatCar(K, t, o = {}) {
    const c = O.car;
    const z = o.z ?? Z0;
    c.position.set(o.x ?? 0, (o.y ?? (K.wave(0, z, t) * 0.7 - 0.85)) - (o.sink || 0), z);
    c.rotation.set(Math.sin(t * 1.1) * 0.035 + (o.roll || 0), YAW, (o.pitch ?? -0.09) + Math.sin(t * 0.9) * 0.025);
    c.updateMatrixWorld(true);
  }
  function setLevel(f) { // agua dentro del coche (0 = nada, 1 = lleno)
    const inn = O.car.userData.inner;
    inn.visible = f > 0.01;
    const h = 1.2 * f; inn.scale.y = Math.max(0.001, h); inn.position.y = 0.55 + h / 2;
  }
  function timer(K, lt, at, from) {
    if (lt < at) return;
    const s = Math.max(0, Math.ceil(from - (lt - at)));
    K.ov(`<div class="badge">${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</div>`, 560, lt, at);
  }

  window.RESET3D = function (K, t) {
    const u = O.car.userData;
    O.car.visible = true; u.sw.visible = true;
    u.doorPivot.rotation.set(0, 0, 0);
    u.winGroup.position.set(0, 0, 0); u.winGroup.visible = true;
    u.winMat.emissive && u.winMat.emissive.set(0x000000);
    u.belt.visible = true;
    setLevel(0);
    [u.driver, u.kid1, u.kid2].forEach((p) => { K.pose(p, 'sit'); p.visible = true; });
    u.driver.position.set(0.2, 0.62, 0.45); u.kid1.position.set(-0.9, 0.62, 0.42); u.kid2.position.set(-0.9, 0.62, -0.42);
    O.phone.visible = O.breaker.visible = O.hero.visible = O.hammer.visible = O.swimmer.visible = false;
    O.out.concat(O.inn).forEach((a) => (a.visible = false));
    O.ringOk.visible = O.ringNo.visible = false;
    O.crack.visible = false; K.setCracks(0);
    K.flash = 0; K.flashColor = '#fff';
    floatCar(K, t);
    K.focus = O.car.position;
  };

  const S = (window.SHOTS = {});

  // [1] Tu coche cae a un río. Tienes un minuto.
  S[1] = (K, lt, dur, t) => {
    const te = 0.58, ti = 1.37; // sale de la carretera / toca el agua
    const c = O.car;
    if (lt < te) {
      c.position.set(0, K.BANK, -22 + 12 * lt); c.rotation.set(0, YAW, 0);
    } else if (lt < ti) {
      const tau = lt - te;
      c.position.set(0, K.BANK - 4.9 * tau * tau * 4.4, -15 + 12 * tau);
      c.rotation.set(0, YAW, -0.55 * Math.min(1, tau / 0.7));
    } else {
      const tau = lt - ti;
      const z = -5.5 + 1.0 * (1 - Math.exp(-3 * tau));
      floatCar(K, t, { z, y: K.wave(0, z, t) * 0.7 - 0.85 - 1.1 * Math.exp(-2.2 * tau) * Math.cos(4 * tau) });
      c.rotation.z = -0.09 - 0.45 * Math.exp(-3 * tau);
      K.splashAt(new K.T.Vector3(0, 0, -5.5), tau);
      K.flash = 0.18 * Math.max(0, 1 - tau / 0.2);
    }
    c.updateMatrixWorld(true);
    K.cam([-9.5, 4.2, -9], [-8.5, 2.2, 1.5], [0, 2.2, -19], [0, 0.2, -5.2], K.clamp(lt / 1.8, 0, 1));
    if (lt > ti) K.shake(0.12 * Math.exp(-(lt - ti) * 4), t);
    timer(K, lt, K.wt('minuto') - 0.05 - (t - lt), 60);
  };

  // [2] ¿Qué haces primero? ¿Llamar al 112... abrir la puerta... o romper la ventana?
  S[2] = (K, lt, dur, t) => {
    const a = K.lerp(3.5, 4.3, lt / dur), r = 9;
    K.cam([Math.cos(a) * r, 2.2, Z0 + Math.sin(a) * r], [Math.cos(a + 0.4) * r * 0.85, 1.8, Z0 + Math.sin(a + 0.4) * r * 0.85], [0, 0.4, Z0], [0, 0.6, Z0], lt / dur);
    const s0 = t - lt;
    K.ovRaw('<div class="card"><span class="n">1</span>Llamar al 112</div>', 1260, lt, K.wt('llamar', s0) - s0);
    K.ovRaw('<div class="card"><span class="n">2</span>Abrir la puerta</div>', 1420, lt, K.wt('abrir', s0) - s0);
    K.ovRaw('<div class="card"><span class="n">3</span>Romper la ventana</div>', 1580, lt, K.wt('romper', s0) - s0);
  };

  // [3] Escríbelo en los comentarios... dos de esas tres pueden costarte la vida.
  S[3] = (K, lt, dur, t) => {
    const s0 = t - lt, tu = K.wt('porque', s0) - s0;
    floatCar(K, t, { sink: K.smooth(tu, dur, lt) * 1.2, pitch: -0.15 });
    if (lt < tu) {
      K.cam([-9, 1.2, Z0 + 3], [-8, 0.8, Z0 + 2], [0, 0.3, Z0], [0, 0.3, Z0], lt / tu);
      K.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 600, lt, 0.05);
    } else {
      const u = (lt - tu) / (dur - tu);
      K.cam([-7.5, -2.2, Z0 + 2.5], [-6, -3.2, Z0 + 1.2], [0, -0.6, Z0], [0, -0.8, Z0], u);
      K.bubblesFrom(L(K, 0, 0.6, 0), t, 1.8, 1, 0);
      K.ov('<div class="badge" style="color:#ff8a8f">2 de 3</div>', 560, lt, K.wt('dos', s0) - s0);
      const tv = K.wt('vida', s0) - s0;
      if (lt > tv) { K.flash = 0.35 * Math.max(0, 1 - (lt - tv) / 0.5); K.flashColor = '#e5484d'; }
    }
  };

  // [4] Si has dicho llamar: error. Mientras marcas, el coche se hunde. Primero sales... y luego llamas.
  S[4] = (K, lt, dur, t) => {
    const s0 = t - lt, tB = K.wt('mientras', s0) - s0;
    if (lt < tB) {
      floatCar(K, t, { sink: 0.3 });
      setLevel(0.15);
      const p = L(K, -0.05, 1.55, 0.45), l = L(K, 2.6, 1.2, 0.2);
      K.cam([p.x, p.y, p.z], [p.x, p.y, p.z], [l.x, l.y, l.z], [l.x, l.y + 0.1, l.z], lt / tB, 62);
      O.phone.visible = true;
      O.phone.position.set(0.12, -0.2 + Math.sin(t * 2) * 0.01, -1.35); O.phone.scale.setScalar(1.05); O.phone.rotation.set(-0.15, -0.12, 0.05);
      O.car.userData.driver.visible = false; O.car.userData.sw.visible = false;
      K.ov(K.MARK_NO, 600, lt, K.wt('error', s0) - s0);
    } else {
      const u = (lt - tB) / (dur - tB);
      floatCar(K, t, { sink: 0.6 + u * 4.5, pitch: -0.25 - u * 0.15 });
      setLevel(0.2 + u * 0.6);
      K.focus = O.car.position;
      K.cam([-8, -3, Z0 + 4], [-7, -5.2, Z0 + 3], [0, -1.5, Z0], [0, -3.8, Z0], u);
      K.bubblesFrom(L(K, 0, 1.2, 0), t, 1.6, 1.2, 0);
      K.ovRaw('<div class="card good"><span class="n">1</span>Salir</div>', 1300, lt, K.wt('primero', s0) - s0);
      K.ovRaw('<div class="card"><span class="n">2</span>Llamar</div>', 1460, lt, K.wt('luego', s0) - s0);
    }
  };

  // [5] Si has dicho la puerta: tampoco. El agua la empuja desde fuera con una fuerza que no vas a vencer.
  S[5] = (K, lt, dur, t) => {
    const s0 = t - lt;
    floatCar(K, t, { sink: 0.15 });
    const d = O.car.userData.doorPivot;
    const push = K.wt('empuja', s0) - s0;
    // intenta abrir y no puede
    d.rotation.y = lt > 0.3 ? Math.max(0, Math.sin((lt - 0.3) * 9)) * 0.035 : 0;
    const dc = L(K, 0.42, 0.7, 0.9);
    K.cam([dc.x - 5.5, 0.9, dc.z + 2.5], [dc.x - 3.6, 0.55, dc.z + 1.2], [dc.x, 0.5, dc.z], [dc.x, 0.55, dc.z], lt / dur);
    K.ov(K.MARK_NO, 600, lt, K.wt('tampoco', s0) - s0);
    if (lt > push) {
      O.out.forEach((a, i) => { a.visible = true; a.position.z = 2.0 - 0.25 * (0.5 + 0.5 * Math.sin((lt - push) * 6 + i)); });
      K.ov('<div class="tag">PRESIÓN DEL AGUA</div>', 1500, lt, push + 0.2);
    }
  };

  // [6] La respuesta es la ventana. Durante el primer minuto el coche flota...
  S[6] = (K, lt, dur, t) => {
    const s0 = t - lt;
    floatCar(K, t);
    const tv = K.wt('ventana', s0) - s0;
    if (lt > tv) O.car.userData.winMat.emissive.set(0x2bb673).multiplyScalar(0.5 + 0.4 * Math.sin(lt * 6));
    const a = K.lerp(3.0, 3.6, lt / dur), r = K.lerp(6, 10, K.ease.inOut(lt / dur));
    K.cam([Math.cos(a) * r, 1.2, Z0 + Math.sin(a) * r], [Math.cos(a + 0.3) * r, 2.6, Z0 + Math.sin(a + 0.3) * r], [0, 1.2, Z0], [0, 0.6, Z0], lt / dur);
    K.ov(K.MARK_OK, 600, lt, tv);
    timer(K, lt, K.wt('minuto', s0) - s0, 45);
  };

  // [7] Quítate el cinturón. Baja la ventana mientras la batería funciona.
  S[7] = (K, lt, dur, t) => {
    const s0 = t - lt, u = O.car.userData;
    floatCar(K, t);
    const tc = K.wt('cinturon', s0) - s0, tb = K.wt('baja', s0) - s0;
    u.belt.visible = lt < tc + 0.25;
    u.winGroup.position.y = -0.66 * K.smooth(tb, tb + 1.2, lt);
    const w = L(K, 0.4, 1.35, 0.9);
    K.cam([w.x - 3.2, w.y + 0.4, w.z + 1.4], [w.x - 2.4, w.y + 0.2, w.z + 0.6], [w.x, w.y - 0.1, w.z], [w.x, w.y, w.z], lt / dur);
    K.ov('<div class="tag">1 · CINTURÓN FUERA</div>', 1500, lt, tc);
    K.ov('<div class="tag">2 · BAJA LA VENTANA</div>', 1620, lt, tb);
  };

  // [8] Y si no baja... rómpela, golpeando en una esquina. Nunca en el centro.
  S[8] = (K, lt, dur, t) => {
    const s0 = t - lt, u = O.car.userData;
    floatCar(K, t);
    const tg = K.wt('golpeando', s0) - s0, te = K.wt('esquina', s0) - s0 + 0.15, tn = K.wt('nunca', s0) - s0;
    const corner = L(K, 0.0, 1.22, 0.92), center = L(K, 0.45, 1.42, 0.92);
    K.cam([corner.x - 3.0, corner.y + 0.5, corner.z + 1.2], [corner.x - 2.3, corner.y + 0.3, corner.z + 0.5], [center.x, center.y, center.z], [center.x, center.y - 0.05, center.z], lt / dur);
    // rompecristales: se acerca y golpea en la esquina
    O.breaker.visible = true;
    const back = 1 - K.smooth(te - 0.35, te, lt) + (lt > te ? K.smooth(te, te + 0.4, lt) * 0.6 : 0);
    O.breaker.position.set(corner.x - 0.25 - back * 0.9, corner.y + 0.1 + back * 0.25, corner.z + 0.15 + back * 0.3);
    O.breaker.rotation.set(0, 0, -0.25 + back * 0.6);
    O.ringOk.visible = lt > tg && lt < te; O.ringOk.scale.setScalar(1 + 0.15 * Math.sin(lt * 10));
    if (lt > te) {
      u.winGroup.visible = false;
      K.burstShards(L(K, 0.45, 1.4, 0.9), new K.T.Vector3(1, 0, 0), lt - te);
      K.flash = 0.22 * Math.max(0, 1 - (lt - te) / 0.12);
      K.shake(0.05 * Math.exp(-(lt - te) * 8), t);
    }
    if (lt > tn) { O.ringNo.visible = true; K.ov(K.MARK_NO, 600, lt, tn); }
    if (lt > tg && lt < te) K.ov(K.MARK_OK, 600, lt, tg);
  };

  // [9] Si vas con niños, sácalos primero por la ventana, empezando por el mayor. Y después sales tú, nadando hacia arriba.
  S[9] = (K, lt, dur, t) => {
    const s0 = t - lt, u = O.car.userData;
    const tb = K.wt('despues', s0) - s0 - 0.35;
    u.winGroup.visible = false;
    if (lt < tb) {
      floatCar(K, t);
      const path = (p, k0, d) => {
        const k = K.clamp((lt - k0) / d, 0, 1);
        const a = [p.position.x, 0.62, p.position.z];
        let pos;
        if (k < 0.5) { const q = K.ease.inOut(k * 2); pos = [K.lerp(a[0], 0.45, q), K.lerp(0.62, 1.15, q), K.lerp(a[2], 0.95, q)]; }
        else { const q = K.ease.inOut((k - 0.5) * 2); pos = [0.45 + q * (p === u.kid1 ? 0.6 : -0.3), K.lerp(1.15, 0.5, q), K.lerp(0.95, 2.3, q)]; }
        p.position.set(...pos);
        if (k >= 1) K.pose(p, 'tread', t); else if (k > 0) K.pose(p, 'reach');
      };
      path(u.kid1, K.wt('sacalos', s0) - s0, 1.6);
      path(u.kid2, K.wt('mayor', s0) - s0 - 0.2, 1.4);
      const w = L(K, 0.4, 1.0, 1.6);
      K.cam([w.x - 6, 1.8, w.z + 2.2], [w.x - 4.5, 1.4, w.z + 1.2], [w.x, 0.6, w.z], [w.x, 0.6, w.z], lt / tb);
      K.ov('<div class="tag">EL MAYOR PRIMERO</div>', 1500, lt, K.wt('mayor', s0) - s0);
    } else {
      const k = (lt - tb) / (dur - tb);
      floatCar(K, t);
      u.kid1.visible = u.kid2.visible = false; u.driver.visible = false;
      const s = O.swimmer; s.visible = true;
      K.pose(s, 'swim', t); s.rotation.set(0, Math.PI / 2, -0.25);
      s.position.set(-2.4, K.lerp(-4.2, -1.0, K.ease.out(k)), Z0 + 0.4);
      K.focus = s.position;
      K.cam([-6.5, -4.8, Z0 + 3.5], [-6, -4.2, Z0 + 3], [-2.4, -2.6, Z0], [-2.4, -0.8, Z0], k);
      K.bubblesFrom(new K.T.Vector3(-2.2, s.position.y + 0.6, Z0 + 0.9), t, 0.35, 0.5, 0);
      K.ov('<div class="tag">↑ NADA HACIA ARRIBA</div>', 1500, lt, tb + 0.6);
    }
  };

  // [10] ¿Y si el coche ya está bajo el agua? Espera a que se llene casi entero.
  S[10] = (K, lt, dur, t) => {
    const s0 = t - lt;
    const c = O.car;
    c.position.set(0, K.BED + 0.1, Z0); c.rotation.set(0.03, YAW + 0.15, -0.04); c.updateMatrixWorld(true);
    setLevel(K.lerp(0.25, 0.72, K.smooth(K.wt('espera', s0) - s0, dur, lt)));
    const a = K.lerp(2.6, 3.4, lt / dur), r = 7.5;
    K.cam([Math.cos(a) * r, K.BED + 2.8, Z0 + Math.sin(a) * r], [Math.cos(a + 0.2) * r * 0.8, K.BED + 2.0, Z0 + Math.sin(a + 0.2) * r * 0.8], [0, K.BED + 1.2, Z0], [0, K.BED + 1.0, Z0], lt / dur);
    K.bubblesFrom(L(K, 0, 1.6, 0), t, 1.2, 0.7, -0.2);
    K.ov('<div class="tag">ESPERA…</div>', 1500, lt, K.wt('espera', s0) - s0);
  };

  // [11] Cuando el agua te llega al cuello, la presión se iguala... y solo entonces, la puerta se abre.
  S[11] = (K, lt, dur, t) => {
    const s0 = t - lt, u = O.car.userData;
    const c = O.car;
    c.position.set(0, K.BED + 0.1, Z0); c.rotation.set(0.03, YAW + 0.15, -0.04); c.updateMatrixWorld(true);
    setLevel(0.72);
    const tp = K.wt('presion', s0) - s0, ta = K.wt('abre', s0) - s0;
    const d = L(K, 0.42, 1.0, 0.9);
    K.cam([d.x - 4.2, d.y + 0.9, d.z + 1.6], [d.x - 3.2, d.y + 0.5, d.z + 0.8], [d.x, d.y + 0.3, d.z], [d.x, d.y, d.z], lt / dur);
    if (lt > tp && lt < ta + 0.3) {
      O.out.concat(O.inn).forEach((a, i) => { a.visible = true; });
      K.ov('<div class="tag">DENTRO = FUERA</div>', 1500, lt, tp + 0.2);
    }
    if (lt > ta) {
      u.doorPivot.rotation.y = 1.15 * K.ease.out(K.clamp((lt - ta) / 0.6, 0, 1));
      K.bubblesFrom(L(K, 0.3, 1.2, 1.4), t, 0.8, 1.4, 0);
      K.ov(K.MARK_OK, 600, lt, ta);
    }
  };

  // [12] Pero hay un problema: cristales laminados... no se rompen ni a martillazos.
  S[12] = (K, lt, dur, t) => {
    const s0 = t - lt;
    floatCar(K, t);
    const w = L(K, 0.42, 1.42, 0.92);
    K.cam([w.x - 3.4, w.y + 0.3, w.z + 1.6], [w.x - 2.0, w.y + 0.1, w.z + 0.5], [w.x, w.y, w.z], [w.x, w.y, w.z], lt / dur);
    K.ov('<div class="tag warn">CRISTAL LAMINADO</div>', 600, lt, K.wt('laminados', s0) - s0);
    const hits = [K.wt('rompen', s0), K.wt('ni', K.wt('rompen', s0)), K.wt('martillazos', s0) + 0.25].map((x) => x - s0);
    let level = 0;
    hits.forEach((h) => { if (lt > h) level++; });
    O.crack.visible = level > 0; K.setCracks(level, 0.5, 0.45);
    if (lt > hits[0] - 0.6) {
      O.hammer.visible = true;
      let swing = 1;
      hits.forEach((h) => { const d = lt - h; if (d > -0.3 && d < 0.35) swing = Math.min(swing, d < 0 ? -d / 0.3 : d / 0.35); });
      O.hammer.position.set(w.x - 0.35 - swing * 0.6, w.y + 0.15 + swing * 0.35, w.z + 0.05);
      O.hammer.rotation.set(0, 0, 0.3 + swing * 0.9);
      hits.forEach((h) => { const d = lt - h; if (d > 0 && d < 0.2) K.shake(0.03, t); });
    }
    if (level === 3) K.ov(K.MARK_NO, 760, lt, hits[2] + 0.1);
  };

  // [13] Ahora dime la verdad: ¿llevas un rompecristales en el coche? Pon sí o no en los comentarios.
  S[13] = (K, lt, dur, t) => {
    const s0 = t - lt;
    floatCar(K, t);
    K.cam([-9, 1.6, Z0 + 4], [-8, 1.4, Z0 + 3.2], [0, 0.6, Z0], [0, 0.6, Z0], lt / dur);
    const h = O.hero; h.visible = true;
    const cp = K.camera.position, f = new K.T.Vector3(); K.camera.getWorldDirection(f);
    const p = cp.clone().add(f.multiplyScalar(3.0));
    h.scale.setScalar(0.8);
    h.position.set(p.x, p.y + 0.15 + Math.sin(t * 2) * 0.03, p.z);
    h.rotation.set(0.2, t * 1.3, 0.35);
    const tl = K.wt('llevas', s0) - s0;
    K.ov('<div class="tag">¿LLEVAS UNO?</div>', 600, lt, tl);
    K.ov('<div class="pill si">SÍ</div>', 1380, lt, K.wt('si', s0) - s0, 'left:30%');
    K.ov('<div class="pill no">NO</div>', 1380, lt, K.wt('no', s0) - s0, 'left:70%');
    K.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1640, lt, K.wt('comentarios', s0) - s0);
  };
})();
