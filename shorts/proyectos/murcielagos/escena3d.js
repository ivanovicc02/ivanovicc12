// Planos 3D de "¿Qué pasaría si los murciélagos desaparecieran?"
// Mundos propios: "campo" (noche / día / atardecer), "cueva" y el "studio" del kit (podio).
// Los tiempos internos salen de las palabras reales del audio con W(K, 'palabra').
(function () {
  const O = {};
  const W = (K, w, after = 0) => K.wt(w, K.s0 + after) - K.s0;
  const pop = (K, lt, at, d = 0.35) => K.ease.back(K.clamp((lt - at) / d, 0, 1));
  const prog = (K, lt, a, b) => K.clamp((lt - a) / (b - a), 0, 1);

  // ---------- modelos ----------
  function wingShape(T) {
    const s = new T.Shape();
    s.moveTo(0, 0.22);
    s.quadraticCurveTo(0.55, 0.62, 1.05, 0.62);
    s.quadraticCurveTo(1.45, 0.6, 1.75, 0.34);
    s.quadraticCurveTo(1.5, 0.12, 1.42, -0.12);
    s.quadraticCurveTo(1.22, 0.02, 1.02, -0.22);
    s.quadraticCurveTo(0.8, -0.05, 0.6, -0.26);
    s.quadraticCurveTo(0.4, -0.08, 0.2, -0.2);
    s.quadraticCurveTo(0.08, -0.05, 0, -0.08);
    s.lineTo(0, 0.22);
    return s;
  }

  function makeBat(K, o = {}) {
    const T = K.T, g = new T.Group();
    const fur = K.mat(o.fur || '#5c4a73'), belly = K.mat(o.belly || '#9a86b3');
    const wingM = new T.MeshStandardMaterial({ color: o.wing || '#3b2e50', side: T.DoubleSide, roughness: 0.8 });
    const boneM = K.mat('#2a2038');
    const pink = K.mat('#f08fae'), white = K.mat('#ffffff', { roughness: 0.25 }), black = K.mat('#111117', { roughness: 0.2 });
    const body = K.mesh(new T.SphereGeometry(0.4, 22, 16), fur); body.scale.set(0.95, 1.1, 0.85); g.add(body);
    const bel = K.mesh(new T.SphereGeometry(0.3, 16, 12), belly, false, false); bel.position.set(0, -0.03, 0.17); bel.scale.set(0.85, 1.05, 0.6); g.add(bel);
    const head = new T.Group(); head.position.y = 0.62; g.add(head);
    const hs = K.mesh(new T.SphereGeometry(0.46, 26, 20), fur); hs.scale.set(1.06, 0.95, 0.95); head.add(hs);
    [-1, 1].forEach((k) => {
      const e = K.mesh(new T.ConeGeometry(0.18, 0.58, 6), fur); e.position.set(k * 0.27, 0.5, -0.03); e.rotation.z = -k * 0.38; head.add(e);
      const ie = K.mesh(new T.ConeGeometry(0.1, 0.4, 6), pink, false, false); ie.position.set(k * 0.255, 0.46, 0.06); ie.rotation.z = -k * 0.38; head.add(ie);
    });
    const pupils = [];
    [-1, 1].forEach((k) => {
      const eg = new T.Group(); eg.position.set(k * 0.175, 0.06, 0.34); head.add(eg);
      const w = K.mesh(new T.SphereGeometry(0.15, 18, 14), white, false, false); w.scale.set(1, 1.18, 0.65); eg.add(w);
      const p = K.mesh(new T.SphereGeometry(0.085, 14, 10), black, false, false); p.position.set(0, -0.01, 0.075); eg.add(p); pupils.push(p);
      const gl = K.mesh(new T.SphereGeometry(0.028, 8, 6), white, false, false); gl.position.set(0.03, 0.045, 0.14); eg.add(gl);
      const ck = K.mesh(new T.SphereGeometry(0.07, 10, 8), K.mat('#ff9bb5', { transparent: true, opacity: 0.6 }), false, false);
      ck.position.set(k * 0.3, -0.13, 0.33); ck.scale.set(1, 0.6, 0.4); head.add(ck);
    });
    const nose = K.mesh(new T.SphereGeometry(0.06, 12, 8), pink, false, false); nose.position.set(0, -0.08, 0.44); nose.scale.set(1.35, 0.8, 0.8); head.add(nose);
    const mouth = K.mesh(new T.TorusGeometry(0.085, 0.016, 6, 16, Math.PI), black, false, false); mouth.position.set(0, -0.15, 0.42); mouth.rotation.z = Math.PI; head.add(mouth);
    [-1, 1].forEach((k) => { const f = K.mesh(new T.ConeGeometry(0.022, 0.08, 5), white, false, false); f.position.set(k * 0.045, -0.255, 0.43); f.rotation.x = Math.PI; head.add(f); });
    // hongo de "nariz blanca" (oculto por defecto)
    const fungus = new T.Group(); fungus.position.set(0, -0.1, 0.43); head.add(fungus);
    for (let i = 0; i < 9; i++) {
      const f = K.mesh(new T.IcosahedronGeometry(0.05 + (i % 3) * 0.015, 0), K.mat('#f4f4ef', { flat: true }), false, false);
      f.position.set(Math.cos(i * 2.4) * 0.12, Math.sin(i * 2.4) * 0.08, Math.abs(Math.sin(i)) * 0.03); fungus.add(f);
    }
    fungus.visible = false;
    const wings = [];
    [-1, 1].forEach((k) => {
      const pv = new T.Group(); pv.position.set(k * 0.3, 0.16, -0.05); g.add(pv);
      const m = K.mesh(new T.ShapeGeometry(wingShape(T)), wingM); m.scale.x = k; pv.add(m);
      [[1.05, 0.62, 1.02, -0.22], [1.05, 0.62, 0.6, -0.26], [1.05, 0.62, 1.42, -0.12]].forEach(([x0, y0, x1, y1]) => {
        const L = Math.hypot(x1 - x0, y1 - y0);
        const b = K.mesh(new T.CylinderGeometry(0.018, 0.018, L, 5), boneM, false, false);
        b.position.set(k * (x0 + x1) / 2, (y0 + y1) / 2, 0.01); b.rotation.z = Math.atan2(k * (x1 - x0), -(y1 - y0)); pv.add(b);
      });
      const arm = K.mesh(new T.CylinderGeometry(0.03, 0.03, 1.1, 6), boneM, false, false);
      arm.position.set(k * 0.53, 0.42, 0.01); arm.rotation.z = -k * 1.2; pv.add(arm);
      wings.push(pv);
    });
    [-1, 1].forEach((k) => { const f = K.mesh(new T.ConeGeometry(0.05, 0.16, 5), boneM); f.position.set(k * 0.12, -0.46, 0.05); f.rotation.x = Math.PI; g.add(f); });
    g.userData = { wings, head, pupils, fungus, mouth };
    if (o.scale) g.scale.setScalar(o.scale);
    return g;
  }
  function flap(bat, t, amp = 0.8, speed = 13, ph = 0) {
    const a = Math.sin(t * speed + ph) * amp;
    const [wl, wr] = bat.userData.wings;
    wl.rotation.set(0, 0, -a); wr.rotation.set(0, 0, a);
  }
  function fold(bat) {
    const [wl, wr] = bat.userData.wings;
    wl.rotation.set(0, -1.05, 0.95); wr.rotation.set(0, 1.05, -0.95);
  }

  function makeAgave(K, stalk = true, R = Math.random) {
    const T = K.T, g = new T.Group();
    const leafM = [K.mat('#6aa39b', { flat: true }), K.mat('#5c938c', { flat: true }), K.mat('#7bb3a8', { flat: true })];
    for (let ring = 0; ring < 3; ring++) {
      const n = 9 - ring * 2;
      for (let i = 0; i < n; i++) {
        const L = 1.7 - ring * 0.4;
        const geo = new T.ConeGeometry(0.17, L, 4); geo.translate(0, L / 2, 0);
        const m = K.mesh(geo, leafM[(i + ring) % 3]); m.scale.z = 0.35;
        const a = (i / n) * Math.PI * 2 + ring * 0.4;
        m.rotation.order = 'YXZ'; m.rotation.y = a; m.rotation.x = 0.95 - ring * 0.32;
        g.add(m);
      }
    }
    const flowers = [];
    if (stalk) {
      const H = 4.6;
      const st = K.mesh(new T.CylinderGeometry(0.05, 0.11, H, 7), K.mat('#7c8a46', { flat: true })); st.position.y = H / 2; g.add(st);
      const fM = new T.MeshStandardMaterial({ color: 0xf2c94c, emissive: 0x6b4a00, emissiveIntensity: 0.4, flatShading: true });
      for (let i = 0; i < 6; i++) {
        const y = H * 0.62 + i * 0.3, a = i * 2.1, len = 0.5 - i * 0.05;
        const br = K.mesh(new T.CylinderGeometry(0.025, 0.03, len, 5), K.mat('#7c8a46'), false, false);
        br.position.set(Math.cos(a) * len / 2, y, Math.sin(a) * len / 2); br.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2); g.add(br);
        const fl = K.mesh(new T.IcosahedronGeometry(0.2 - i * 0.015, 0), fM.clone());
        fl.position.set(Math.cos(a) * len, y + 0.12, Math.sin(a) * len); fl.scale.set(1, 0.75, 1); g.add(fl); flowers.push(fl);
      }
      g.userData.top = new T.Vector3(0, H * 0.62 + 0.9, 0);
    }
    g.userData.flowers = flowers;
    return g;
  }

  function makeBottle(K) {
    const T = K.T, g = new T.Group();
    const pts = [[0, 0], [0.42, 0], [0.45, 0.06], [0.45, 1.25], [0.38, 1.5], [0.16, 1.72], [0.14, 2.15], [0.15, 2.2], [0, 2.2]].map(([x, y]) => new T.Vector2(x, y));
    const glass = new T.MeshPhysicalMaterial({ color: 0xffc86b, roughness: 0.08, transmission: 0.2, transparent: true, opacity: 0.8 });
    g.add(K.mesh(new T.LatheGeometry(pts, 24), glass));
    const cap = K.mesh(new T.CylinderGeometry(0.17, 0.17, 0.28, 16), K.mat('#7a4a22')); cap.position.y = 2.3; g.add(cap);
    const label = K.textPlane((x, Wd, H) => {
      x.fillStyle = '#fbf3df'; x.beginPath(); x.roundRect(0, 0, Wd, H, 30); x.fill();
      x.strokeStyle = '#b8862b'; x.lineWidth = 14; x.beginPath(); x.roundRect(14, 14, Wd - 28, H - 28, 22); x.stroke();
      x.fillStyle = '#2f6b55';
      for (let i = 0; i < 9; i++) { x.save(); x.translate(Wd / 2, H * 0.58); x.rotate((i - 4) * 0.3); x.beginPath(); x.moveTo(-14, 0); x.lineTo(0, -H * 0.3); x.lineTo(14, 0); x.fill(); x.restore(); }
      x.fillStyle = '#9b2c2c'; x.font = `900 ${H * 0.2}px Inter, sans-serif`; x.textAlign = 'center'; x.fillText('TEQUILA', Wd / 2, H * 0.84);
    }, 0.82, 0.66, 512, true);
    label.position.set(0, 0.68, 0.455); g.add(label);
    return g;
  }

  function makeHand(K) {
    const T = K.T, g = new T.Group();
    const skin = K.mat('#e8a982'), nail = K.mat('#f6d6c6', { roughness: 0.3 });
    const fist = K.mesh(new T.SphereGeometry(1, 22, 16), skin); fist.scale.set(1.05, 0.95, 0.85); g.add(fist);
    for (let i = 0; i < 4; i++) {
      const f = K.mesh(new T.CapsuleGeometry(0.24, 0.55, 4, 10), skin); f.rotation.z = Math.PI / 2;
      f.position.set(0.15, 0.45 - i * 0.36, 0.72); g.add(f);
    }
    const th = K.mesh(new T.CapsuleGeometry(0.3, 1.0, 6, 12), skin); th.position.set(-0.5, 1.15, 0.2); th.rotation.z = 0.12; g.add(th);
    const nl = K.mesh(new T.SphereGeometry(0.2, 14, 10), nail, false, false); nl.scale.set(1, 1.2, 0.35); nl.position.set(-0.56, 1.65, 0.47); g.add(nl);
    const cuff = K.mesh(new T.CylinderGeometry(0.75, 0.8, 1.6, 16), K.mat('#2f6fb8')); cuff.position.set(0.1, -1.4, 0); g.add(cuff);
    return g;
  }

  function makeCorn(K) {
    const T = K.T, g = new T.Group();
    const st = K.mesh(new T.CylinderGeometry(0.035, 0.055, 2.3, 5), K.mat('#6f9b3a', { flat: true })); st.position.y = 1.15; g.add(st);
    for (let i = 0; i < 4; i++) {
      const geo = new T.ConeGeometry(0.08, 1.1, 3); geo.translate(0, 0.55, 0);
      const l = K.mesh(geo, K.mat(i % 2 ? '#7fae45' : '#5f8f34', { flat: true }), false, false);
      l.scale.z = 0.3; l.position.y = 0.6 + i * 0.4; l.rotation.order = 'YXZ'; l.rotation.y = i * 1.9; l.rotation.x = 0.9; g.add(l);
    }
    const cob = K.mesh(new T.CylinderGeometry(0.07, 0.05, 0.4, 6), K.mat('#f2c94c', { flat: true })); cob.position.set(0.08, 1.3, 0); cob.rotation.z = -0.4; g.add(cob);
    const tas = K.mesh(new T.ConeGeometry(0.08, 0.4, 4), K.mat('#d9b86a', { flat: true })); tas.position.y = 2.45; g.add(tas);
    return g;
  }

  function makeTree(K, R, tall = 1) {
    const T = K.T, g = new T.Group();
    const h = (2.2 + R() * 1.5) * tall;
    const tr = K.mesh(new T.CylinderGeometry(0.14, 0.24, h, 6), K.mat('#6b4a2e', { flat: true })); tr.position.y = h / 2; g.add(tr);
    const greens = ['#2f8a3c', '#3fa047', '#25733a', '#4fb34e'];
    for (let i = 0; i < 3; i++) {
      const c = K.mesh(new T.IcosahedronGeometry(1.0 + R() * 0.6, 0), K.mat(greens[(i + Math.floor(R() * 4)) % 4], { flat: true }));
      c.position.set((R() - 0.5) * 1.2, h + 0.3 + i * 0.4, (R() - 0.5) * 1.2); g.add(c);
    }
    return g;
  }

  function makeCactus(K) {
    const T = K.T, g = new T.Group();
    const cm = K.mat('#3f8a4a', { flat: true }), fruitM = K.mat('#d8264f', { flat: true }), scaleM = K.mat('#5fbf4a', { flat: true });
    const trunk = K.mesh(new T.CylinderGeometry(0.42, 0.48, 4.2, 9), cm); trunk.position.y = 2.1; g.add(trunk);
    const top = K.mesh(new T.SphereGeometry(0.42, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2), cm); top.position.y = 4.2; g.add(top);
    const fruits = [];
    [[-1, 1.6, 1.4], [1, 2.2, 1.1]].forEach(([k, y, h]) => {
      const a = K.mesh(new T.CylinderGeometry(0.28, 0.3, 0.9, 8), cm); a.rotation.z = Math.PI / 2; a.position.set(k * 0.75, y, 0); g.add(a);
      const up = K.mesh(new T.CylinderGeometry(0.28, 0.3, h, 8), cm); up.position.set(k * 1.15, y + h / 2, 0); g.add(up);
      const tp = K.mesh(new T.SphereGeometry(0.28, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), cm); tp.position.set(k * 1.15, y + h, 0); g.add(tp);
      const f = new T.Group(); f.position.set(k * 1.15, y + h + 0.35, 0); g.add(f); fruits.push(f);
    });
    const f0 = new T.Group(); f0.position.set(0, 4.65, 0); g.add(f0); fruits.push(f0);
    fruits.forEach((f) => {
      f.add(K.mesh(new T.IcosahedronGeometry(0.32, 1), fruitM));
      for (let i = 0; i < 8; i++) { const s = K.mesh(new T.ConeGeometry(0.06, 0.18, 4), scaleM, false, false); const a = i * 0.8; s.position.set(Math.cos(a) * 0.3, (i % 3 - 1) * 0.15, Math.sin(a) * 0.3); s.lookAt(0, 0, 0); s.rotateX(-Math.PI / 2); f.add(s); }
    });
    g.userData.fruits = fruits;
    return g;
  }

  function makeDurian(K) {
    const T = K.T, g = new T.Group();
    const geo = new T.IcosahedronGeometry(0.6, 1);
    g.add(K.mesh(geo, K.mat('#9fa83a', { flat: true })));
    const p = geo.attributes.position, seen = new Set();
    for (let i = 0; i < p.count; i++) {
      const v = new T.Vector3(p.getX(i), p.getY(i), p.getZ(i)); const key = v.toArray().map((x) => x.toFixed(2)).join();
      if (seen.has(key)) continue; seen.add(key);
      const s = K.mesh(new T.ConeGeometry(0.08, 0.22, 4), K.mat('#7d8a2a', { flat: true }), false, false);
      s.position.copy(v.clone().multiplyScalar(1.05)); s.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.clone().normalize()); g.add(s);
    }
    g.scale.set(1, 1.2, 1);
    return g;
  }

  function makePlane(K) {
    const T = K.T, g = new T.Group();
    const yel = K.mat('#f2c230', { roughness: 0.4 }), red = K.mat('#e5484d', { roughness: 0.45 }), dark = K.mat('#1d1d22');
    const fus = K.mesh(new T.CylinderGeometry(0.38, 0.16, 3.2, 12), yel); fus.rotation.z = -Math.PI / 2; g.add(fus);
    const nose = K.mesh(new T.SphereGeometry(0.38, 14, 10), red); nose.scale.set(0.6, 1, 1); nose.position.x = 1.6; g.add(nose);
    [0.42, -0.28].forEach((y) => { const w = K.mesh(new T.BoxGeometry(0.9, 0.07, 5.4), red); w.position.set(0.5, y, 0); g.add(w); });
    [-1.6, 1.6].forEach((z) => { const s = K.mesh(new T.CylinderGeometry(0.025, 0.025, 0.7, 5), dark); s.position.set(0.5, 0.07, z); g.add(s); });
    const hz = K.mesh(new T.BoxGeometry(0.5, 0.05, 1.7), red); hz.position.set(-1.45, 0.05, 0); g.add(hz);
    const vt = K.mesh(new T.BoxGeometry(0.6, 0.75, 0.05), red); vt.position.set(-1.5, 0.42, 0); g.add(vt);
    const pil = K.mesh(new T.SphereGeometry(0.17, 12, 10), K.mat('#c98d66')); pil.position.set(0.0, 0.5, 0); g.add(pil);
    const hel = K.mesh(new T.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), K.mat('#7a4a22')); hel.position.set(-0.02, 0.53, 0); g.add(hel);
    const prop = new T.Group(); prop.position.x = 1.86; g.add(prop);
    prop.add(K.mesh(new T.BoxGeometry(0.06, 1.5, 0.14), dark));
    [-0.9, 0.9].forEach((z) => { const wh = K.mesh(new T.CylinderGeometry(0.17, 0.17, 0.1, 12), dark); wh.rotation.x = Math.PI / 2; wh.position.set(0.7, -0.75, z * 0.6); g.add(wh); });
    const tank = K.mesh(new T.CylinderGeometry(0.06, 0.06, 4.6, 6), K.mat('#9aa0a6', { metalness: 0.6, roughness: 0.4 })); tank.rotation.x = Math.PI / 2; tank.position.set(0.2, -0.36, 0); g.add(tank);
    g.userData.prop = prop;
    return g;
  }

  function makeHeart(K) {
    const T = K.T, s = new T.Shape();
    s.moveTo(0, -0.5); s.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.35); s.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5);
    const g = new T.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3 });
    g.center();
    return K.mesh(g, new T.MeshStandardMaterial({ color: 0xff3d6a, emissive: 0x7a0020, emissiveIntensity: 0.4, roughness: 0.35 }));
  }

  function billTexture(K) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#7fc98a'; x.fillRect(0, 0, 512, 256);
    x.strokeStyle = '#2f7a45'; x.lineWidth = 12; x.strokeRect(14, 14, 484, 228);
    x.fillStyle = '#2f7a45'; x.beginPath(); x.ellipse(256, 128, 70, 82, 0, 0, 7); x.fill();
    x.fillStyle = '#d9f2dc'; x.font = '900 120px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 256, 134);
    const t = new K.T.CanvasTexture(c); t.colorSpace = K.T.SRGBColorSpace; return t;
  }

  // ---------- construcción ----------
  window.BUILD3D = function (K) {
    const T = K.T, scene = K.scene, R = window.SH.rng(42);
    scene.add(K.camera);
    K.sunDisc.visible = false;

    // ---- mundo "campo" ----
    const campo = new T.Group(); scene.add(campo); campo.visible = false;
    K.worlds.campo = campo;
    const gg = new T.PlaneGeometry(420, 420, 90, 90); gg.rotateX(-Math.PI / 2);
    {
      const p = gg.attributes.position, cols = new Float32Array(p.count * 3), c = new T.Color();
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
        const hill = K.smooth(25, 80, d) * (6 * Math.sin(x * 0.045) * Math.cos(z * 0.05) + 7 * Math.sin(x * 0.02 + z * 0.03) + 5);
        p.setY(i, hill + (R() - 0.5) * 0.35);
        c.set(['#5fae4a', '#6bbb52', '#56a043', '#78c45a'][Math.floor(R() * 4)]); c.toArray(cols, i * 3);
      }
      gg.setAttribute('color', new T.BufferAttribute(cols, 3)); gg.computeVertexNormals();
    }
    O.ground = K.mesh(gg, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }), false, true);
    campo.add(O.ground);
    // montañas lejanas
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, r = 140 + R() * 40, h = 30 + R() * 35;
      const m = K.mesh(new T.ConeGeometry(25 + R() * 20, h, 6), K.mat(['#5f7f6a', '#6d8a70', '#577565'][i % 3], { flat: true }), false, false);
      m.position.set(Math.cos(a) * r, h / 2 - 2, Math.sin(a) * r); campo.add(m);
      if (i % 2 === 0) { const sn = K.mesh(new T.ConeGeometry(8, h * 0.28, 6), K.mat('#f4f6f8', { flat: true }), false, false); sn.position.set(m.position.x, h - 2 - h * 0.14 + 0.5, m.position.z); campo.add(sn); }
    }
    // nubes
    O.clouds = new T.Group(); campo.add(O.clouds);
    for (let i = 0; i < 12; i++) {
      const cl = new T.Group();
      for (let k = 0; k < 4; k++) { const b = K.mesh(new T.IcosahedronGeometry(2.5 + R() * 2, 0), K.mat('#ffffff', { flat: true }), false, false); b.position.set(k * 3 - 4.5, R() * 1.5, R() * 2); cl.add(b); }
      const a = R() * Math.PI * 2, r = 50 + R() * 70; cl.position.set(Math.cos(a) * r, 28 + R() * 14, Math.sin(a) * r); O.clouds.add(cl);
    }
    // estrellas y luna
    {
      const n = 1800, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const u = 0.05 + R() * 0.95, a = R() * Math.PI * 2, Rr = 380; pos[i * 3] = Math.sqrt(1 - u * u) * Math.cos(a) * Rr; pos[i * 3 + 1] = u * Rr; pos[i * 3 + 2] = Math.sqrt(1 - u * u) * Math.sin(a) * Rr; }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
      O.stars = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false })); campo.add(O.stars);
    }
    O.moon = new T.Group(); campo.add(O.moon);
    O.moon.add(new T.Mesh(new T.SphereGeometry(10, 32, 24), new T.MeshBasicMaterial({ color: 0xfff3cf, fog: false })));
    [[3, 2, 9.2, 1.8], [-4, -3, 9.4, 2.4], [1, -5, 9.1, 1.2]].forEach(([x, y, z, r]) => { const cr = new T.Mesh(new T.CircleGeometry(r, 20), new T.MeshBasicMaterial({ color: 0xeadbb0, fog: false })); cr.position.set(x, y, z); O.moon.add(cr); });
    {
      const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
      const gr = x.createRadialGradient(128, 128, 30, 128, 128, 128); gr.addColorStop(0, 'rgba(255,240,200,0.55)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthWrite: false, fog: false, blending: T.AdditiveBlending })); sp.scale.set(55, 55, 1); O.moon.add(sp);
    }
    // agaves
    O.agaveField = new T.Group(); campo.add(O.agaveField);
    for (let i = 0; i < 70; i++) {
      const a = makeAgave(K, i % 9 === 0, R); const row = Math.floor(i / 10), col = i % 10;
      a.position.set((col - 4.5) * 3.2 + (R() - 0.5), 0, -4 - row * 3.2 + (R() - 0.5)); a.scale.setScalar(0.85 + R() * 0.3); a.rotation.y = R() * 6; O.agaveField.add(a);
    }
    O.agave = makeAgave(K, true); O.agave.position.set(0, 0, 0); campo.add(O.agave);
    // maizal
    O.cornField = new T.Group(); campo.add(O.cornField);
    const corn = makeCorn(K);
    for (let r = 0; r < 14; r++) for (let c = 0; c < 16; c++) {
      const zz = 6 - r * 1.5; if (zz > 2.2) continue; const p = corn.clone(); p.position.set((c - 7.5) * 1.6 + (R() - 0.5) * 0.4, 0, 6 - r * 1.5 + (R() - 0.5) * 0.4); p.rotation.y = R() * 6; p.scale.setScalar(0.9 + R() * 0.25); O.cornField.add(p);
    }
    // selva
    O.jungle = new T.Group(); campo.add(O.jungle);
    for (let i = 0; i < 46; i++) {
      const tr = makeTree(K, R, 1.3); const a = R() * Math.PI - Math.PI, r = 9 + R() * 26;
      tr.position.set(Math.cos(a) * r * 1.3, 0, -6 + Math.sin(a) * r); tr.scale.setScalar(1 + R() * 0.8); O.jungle.add(tr);
    }
    O.cactus = makeCactus(K); campo.add(O.cactus);
    O.durian = makeDurian(K); campo.add(O.durian);
    O.saplings = [];
    for (let i = 0; i < 7; i++) { const s = makeTree(K, R, 0.8); campo.add(s); O.saplings.push(s); }
    // dinero
    O.money = [];
    const bm = [K.mat('#3f8f55'), K.mat('#3f8f55'), new T.MeshStandardMaterial({ map: billTexture(K), roughness: 0.8 }), K.mat('#3f8f55'), K.mat('#5aa86a'), K.mat('#5aa86a')];
    const billGeo = new T.BoxGeometry(1.0, 0.07, 0.5);
    for (let s = 0; s < 5; s++) { const st = []; for (let i = 0; i < 26; i++) { const b = new T.Mesh(billGeo, bm); b.castShadow = true; campo.add(b); st.push(b); } O.money.push(st); }
    O.plane = makePlane(K); campo.add(O.plane);
    O.hand = makeHand(K); campo.add(O.hand);
    O.bottle = makeBottle(K); scene.add(O.bottle);
    O.person = K.makePerson({ shirt: '#f2c230', pants: '#2f5fb8', scale: 1.7 }); campo.add(O.person);
    O.paper = K.textPlane((x, Wd, H) => {
      x.fillStyle = '#fbf8f1'; x.fillRect(0, 0, Wd, H);
      x.fillStyle = '#7a1f1f'; x.fillRect(0, 0, Wd, H * 0.13);
      x.fillStyle = '#fff'; x.font = `900 ${H * 0.075}px DejaVu Serif, serif`; x.textAlign = 'center'; x.fillText('SCIENCE · 2024', Wd / 2, H * 0.09);
      x.fillStyle = '#22222a'; x.font = `800 ${H * 0.05}px Inter, sans-serif`;
      ['Menos murciélagos', 'más insecticidas', 'más muertes de bebés'].forEach((l, i) => { x.fillText(l, Wd / 2, H * (0.22 + i * 0.075)); if (i < 2) { x.fillText('↓', Wd / 2, H * (0.255 + i * 0.075)); } });
      const gx = Wd * 0.12, gy = H * 0.9, gw = Wd * 0.76, gh = H * 0.42;
      x.strokeStyle = '#555'; x.lineWidth = 6; x.beginPath(); x.moveTo(gx, gy - gh); x.lineTo(gx, gy); x.lineTo(gx + gw, gy); x.stroke();
      x.strokeStyle = '#3a6fd0'; x.lineWidth = 12; x.beginPath(); x.moveTo(gx, gy - gh * 0.85); x.bezierCurveTo(gx + gw * 0.4, gy - gh * 0.8, gx + gw * 0.5, gy - gh * 0.25, gx + gw, gy - gh * 0.15); x.stroke();
      x.strokeStyle = '#d93a3a'; x.beginPath(); x.moveTo(gx, gy - gh * 0.2); x.bezierCurveTo(gx + gw * 0.45, gy - gh * 0.22, gx + gw * 0.55, gy - gh * 0.7, gx + gw, gy - gh * 0.9); x.stroke();
      x.font = `700 ${H * 0.033}px Inter, sans-serif`; x.fillStyle = '#3a6fd0'; x.textAlign = 'left'; x.fillText('murciélagos', gx + 20, gy - gh * 0.92);
      x.fillStyle = '#d93a3a'; x.fillText('insecticidas', gx + gw * 0.52, gy - gh * 0.95);
    }, 3, 4.2, 1000, true);
    campo.add(O.paper);

    // ---- mundo "cueva" ----
    const cueva = new T.Group(); scene.add(cueva); cueva.visible = false; K.worlds.cueva = cueva;
    const rockM = [K.mat('#3d3546', { flat: true }), K.mat('#4a4054', { flat: true }), K.mat('#332c3c', { flat: true })];
    const fl = K.mesh(new T.PlaneGeometry(60, 60, 20, 20), rockM[1], false, true); fl.geometry.rotateX(-Math.PI / 2);
    { const p = fl.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, (R() - 0.5) * 0.3); fl.geometry.computeVertexNormals(); }
    cueva.add(fl);
    const ceil = K.mesh(new T.PlaneGeometry(60, 60, 20, 20), rockM[0], false, true); ceil.geometry.rotateX(Math.PI / 2);
    { const p = ceil.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, 6.5 + (R() - 0.5) * 0.8); ceil.geometry.computeVertexNormals(); }
    cueva.add(ceil);
    for (let i = 0; i < 40; i++) {
      const h = 0.6 + R() * 1.8, s = K.mesh(new T.ConeGeometry(0.15 + R() * 0.3, h, 6), rockM[i % 3], false, false);
      s.rotation.x = Math.PI; s.position.set((R() - 0.5) * 24, 6.5 - h / 2, -2 - R() * 14); cueva.add(s);
      const h2 = 0.4 + R() * 1.2, g2 = K.mesh(new T.ConeGeometry(0.2 + R() * 0.3, h2, 6), rockM[(i + 1) % 3]); g2.position.set((R() - 0.5) * 24, h2 / 2, -3 - R() * 14); cueva.add(g2);
    }
    for (let i = 0; i < 30; i++) { const b = K.mesh(new T.DodecahedronGeometry(1.5 + R() * 2.5, 0), rockM[i % 3]); const side = i % 2 ? 1 : -1; b.position.set(side * (7 + R() * 4), R() * 6, -R() * 20 + 4); cueva.add(b); }
    O.caveBats = [];
    for (let i = 0; i < 9; i++) {
      const b = makeBat(K, { scale: 0.75 }); b.userData.home = new T.Vector3(((i % 5) - 2) * 1.5 + (Math.floor(i / 5) ? 0.75 : 0), 5.55 - (i % 2) * 0.15, -1.5 - Math.floor(i / 5) * 2.2);
      cueva.add(b); O.caveBats.push(b);
    }

    // ---- podio en el estudio ----
    O.podium = new T.Group(); K.worlds.studio.add(O.podium);
    [[0, 1.7, '#f2c230', '1'], [-1.75, 1.15, '#c9ced6', '2'], [1.75, 0.8, '#d08a4a', '3']].forEach(([x, h, c, n]) => {
      const b = K.mesh(new T.BoxGeometry(1.7, h, 1.7), K.mat(c, { roughness: 0.5 })); b.position.set(x, h / 2, 0); O.podium.add(b);
      const lab = K.textPlane((ctx, Wd, H) => { ctx.font = `900 ${H * 0.8}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = H * 0.08; ctx.strokeStyle = '#1b1b22'; ctx.strokeText(n, Wd / 2, H * 0.54); ctx.fillStyle = '#fff'; ctx.fillText(n, Wd / 2, H * 0.54); }, 1.1, 1.1, 256);
      lab.position.set(x, Math.min(h * 0.55, 0.9), 0.86); O.podium.add(lab);
    });
    O.star = new T.Group(); K.worlds.studio.add(O.star);
    { const s = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.18 : 0.42, a = Math.PI / 2 + i * Math.PI / 5; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const m = K.mesh(new T.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }), new T.MeshStandardMaterial({ color: 0xffd84a, emissive: 0x8a6a00, emissiveIntensity: 0.6 })); O.star.add(m); }

    // ---- personajes y partículas compartidos ----
    O.hero = makeBat(K); scene.add(O.hero);
    O.flock = [];
    for (let i = 0; i < 22; i++) { const b = makeBat(K, { scale: 0.7 }); campo.add(b); O.flock.push(b); }
    O.hearts = [];
    for (let i = 0; i < 6; i++) { const h = makeHeart(K); scene.add(h); O.hearts.push(h); }
    const inst = (geo, mat, n) => { const m = new T.InstancedMesh(geo, mat, n); m.frustumCulled = false; scene.add(m); return m; };
    O.bugs = inst(new T.OctahedronGeometry(0.06, 0), new T.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.7 }), 260);
    for (let i = 0; i < 260; i++) O.bugs.setColorAt(i, new T.Color(i % 3 ? '#4a3a2e' : '#22222a'));
    O.motes = inst(new T.IcosahedronGeometry(0.05, 0), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5, transparent: true, opacity: 0.85, flatShading: true }), 300);
    O.puffs = inst(new T.IcosahedronGeometry(0.25, 0), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, flatShading: true }), 280);
    O.dummy = new T.Object3D();
  };

  // ---------- partículas ----------
  function hideInst(im) { const d = O.dummy; d.position.set(0, -999, 0); d.scale.setScalar(0.0001); d.updateMatrix(); for (let i = 0; i < im.count; i++) im.setMatrixAt(i, d.matrix); im.instanceMatrix.needsUpdate = true; }
  function setInst(im, i, x, y, z, s, rx = 0, ry = 0) { const d = O.dummy; d.position.set(x, y, z); d.rotation.set(rx, ry, 0); d.scale.setScalar(Math.max(0.0001, s)); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
  // enjambre de insectos alrededor de c; eat (0..1) = fracción comida (absorbida por "to")
  function swarm(K, c, rad, n, t, eat = 0, to = null, seed = 3) {
    const r = window.SH.rng(seed);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.28, b = r() * 6.28, sp = 0.6 + r(), rr = rad * (0.4 + r() * 0.6);
      let x = c.x + Math.cos(a + t * sp) * rr, y = c.y + Math.sin(b + t * sp * 1.3) * rr * 0.6, z = c.z + Math.sin(a + t * sp) * rr * 0.6;
      let s = 0.5 + r() * 0.35;
      const k = (i / n);
      if (to && k < eat) { const u = K.clamp((eat - k) * 6, 0, 1); x = K.lerp(x, to.x, u); y = K.lerp(y, to.y, u); z = K.lerp(z, to.z, u); s *= 1 - u; }
      setInst(O.bugs, i, x, y, z, s, t * 20 + i, t * 9 + i);
    }
    O.bugs.instanceMatrix.needsUpdate = true;
  }
  function puff(K, p, tau, i0 = 0, n = 12, color = '#ffffff', size = 1) {
    if (tau < 0 || tau > 0.9) return;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28, out = 0.4 + tau * 1.6;
      setInst(O.puffs, i0 + i, p.x + Math.cos(a) * out * size, p.y + Math.sin(a * 1.7) * out * 0.6 * size + tau * 0.5, p.z + Math.sin(a) * out * 0.5 * size, (1 - tau) * 1.1 * size);
    }
    O.puffs.instanceMatrix.needsUpdate = true;
  }

  // ---------- ambientes ----------
  const PRESETS = {
    noche: { top: '#070b26', mid: '#1b2660', hor: '#3d4f94', hemi: 0x9fb0ff, ground: 0x1a2440, hi: 0.75, sun: 0xc9d6ff, si: 1.6, fog: 0x1a2350, fn: 40, ff: 240, stars: true, moon: true, clouds: false },
    dia: { top: '#2f7fd8', mid: '#74b6ef', hor: '#d4ecff', hemi: 0xffffff, ground: 0x4a6a3a, hi: 1.15, sun: 0xfff1d6, si: 2.6, fog: 0xcde6ff, fn: 60, ff: 260, stars: false, moon: false, clouds: true },
    tarde: { top: '#3a2a6a', mid: '#c4607a', hor: '#ffb470', hemi: 0xffd2b0, ground: 0x3a3a50, hi: 1.0, sun: 0xffb27a, si: 2.4, fog: 0xe89a7e, fn: 50, ff: 240, stars: false, moon: false, clouds: true },
    gris: { top: '#5a6270', mid: '#8a919c', hor: '#b9bec6', hemi: 0xdfe4ea, ground: 0x404448, hi: 0.95, sun: 0xe6e9ee, si: 1.4, fog: 0xa9afb8, fn: 30, ff: 180, stars: false, moon: false, clouds: true },
  };
  function ambient(K, name) {
    const p = PRESETS[name];
    K.setWorld('campo');
    K.scene.background = null; K.sky.visible = true;
    K.skyMat.uniforms.top.value.set(p.top); K.skyMat.uniforms.mid.value.set(p.mid); K.skyMat.uniforms.hor.value.set(p.hor);
    K.hemi.color.set(p.hemi); K.hemi.groundColor.set(p.ground); K.hemi.intensity = p.hi;
    K.sun.color.set(p.sun); K.sun.intensity = p.si;
    K.scene.fog = new K.T.Fog(p.fog, p.fn, p.ff);
    O.stars.visible = p.stars; O.moon.visible = p.moon; O.clouds.visible = p.clouds;
  }
  function studio(K, dim = false) {
    K.setWorld('studio');
    K.scene.background = null; K.sky.visible = true;
    K.skyMat.uniforms.top.value.set(dim ? '#0c0a1e' : '#1d1636'); K.skyMat.uniforms.mid.value.set(dim ? '#2a1d3e' : '#8e4767'); K.skyMat.uniforms.hor.value.set(dim ? '#4a2f4a' : '#f6b36f');
    K.scene.fog = new K.T.Fog(dim ? 0x2a1d3e : 0xe7a07a, 40, 160);
    K.hemi.color.set(0xffd6b0); K.hemi.groundColor.set(0x2b4a3c); K.hemi.intensity = dim ? 0.5 : 1.2; K.sun.color.set(0xffc48a); K.sun.intensity = dim ? 1.2 : 2.4;
    O.podium.visible = true;
  }
  function cave(K) {
    K.setWorld('cueva');
    K.scene.background = new K.T.Color('#0d0a14'); K.sky.visible = false;
    K.scene.fog = new K.T.Fog(0x0d0a14, 6, 30);
    K.hemi.color.set(0x9a8cd0); K.hemi.groundColor.set(0x1a1424); K.hemi.intensity = 0.8; K.sun.color.set(0xffd6a0); K.sun.intensity = 1.6;
  }

  window.RESET3D = function (K, t) {
    const hide = [O.hero, O.bottle, O.agave, O.agaveField, O.cornField, O.jungle, O.cactus, O.durian, O.plane, O.hand, O.person, O.paper, O.podium, O.star].concat(O.flock, O.hearts, O.saplings);
    hide.forEach((o) => (o.visible = false));
    O.money.forEach((st) => st.forEach((b) => (b.visible = false)));
    [O.bugs, O.motes, O.puffs].forEach(hideInst);
    const h = O.hero; h.scale.setScalar(1); h.rotation.set(0, 0, 0); h.userData.fungus.visible = false; h.userData.pupils.forEach((p) => p.position.set(0, -0.01, 0.075));
    O.agave.userData.flowers.forEach((f) => { f.material.color.set(0xf2c94c); f.material.emissive.set(0x6b4a00); f.scale.set(1, 0.75, 1); });
    K.focus = new K.T.Vector3(0, 0, 0);
    K.flash = 0; K.filter = '';
  };

  const S = (window.SHOTS = {});

  // [1] ¿Qué pasaría si todos los murciélagos del mundo desaparecieran?
  S[1] = (K, lt, dur, t) => {
    ambient(K, 'noche');
    const td = W(K, 'desaparecieran');
    O.moon.position.set(4, 38, -120);
    K.cam([0, 1.6, 12], [0, 2.2, 9], [0, 9, -20], [0, 10, -20], lt / dur, 55);
    O.flock.forEach((b, i) => {
      const r = window.SH.rng(i + 9);
      const lane = r(), sp = 2.2 + r() * 1.5;
      const x = -16 + ((lt * sp + r() * 34) % 34), y = 4 + lane * 13, z = -10 - r() * 14;
      const tv = td + i * 0.04;
      const s = lt < tv ? 0.7 : 0.7 * (1 - K.clamp((lt - tv) / 0.18, 0, 1));
      if (s > 0.01) { b.visible = true; b.position.set(x, y + Math.sin(t * 3 + i) * 0.4, z); b.rotation.set(0.15, 0.9, 0); b.scale.setScalar(s); flap(b, t, 0.9, 14, i); }
      if (lt > tv) puff(K, { x, y, z }, (lt - tv) / 0.6, (i % 18) * 12, 12, '#fff', 0.8);
    });
    if (lt > td) K.sfx('pop', K.s0 + td, 0.6);
    K.sfx('whoosh', K.s0 + 0.2, 0.5);
    K.ov('<div class="tag" style="font-size:150px;padding:0 50px">?</div>', 380, lt, td + 0.3);
  };

  // [2] Muchos dirían: "¡Qué bueno!"... Pero sería un DESASTRE.
  S[2] = (K, lt, dur, t) => {
    ambient(K, 'noche');
    O.moon.position.set(-30, 40, -120);
    const tq = W(K, 'bueno'), tp = W(K, 'pero'), td = W(K, 'desastre');
    const p = O.person; p.visible = true;
    K.pose(p, 'stand');
    const happy = lt < tp;
    const jump = happy && lt > tq - 0.3 ? Math.abs(Math.sin((lt - tq + 0.3) * 7)) * 0.35 : 0;
    p.position.set(0, 0.63 * 1.7 + jump, 0); p.rotation.set(0, -Math.PI / 2, 0);
    K.setMood(p, happy ? 'happy' : 'scared');
    if (happy && lt > tq - 0.3) { p.userData.armL.rotation.set(-2.6 + Math.sin(t * 12) * 0.2, 0, 0); p.userData.armR.rotation.set(2.6 - Math.sin(t * 12) * 0.2, 0, 0); }
    if (!happy) { p.userData.armL.rotation.set(-0.35, 0, 1.3 + Math.sin(t * 20) * 0.08); p.userData.armR.rotation.set(0.35, 0, 1.3 - Math.sin(t * 20) * 0.08); }
    K.cam([0, 1.9, 6.2], [0, 1.8, 5.0], [0, 1.6, 0], [0, 1.6, 0], lt / dur, 50);
    if (lt > td) { K.shake(0.06 * Math.max(0, 1 - (lt - td) / 0.8), t); K.filter = `saturate(${(1 - 0.5 * K.clamp((lt - td) / 0.5, 0, 1)).toFixed(2)})`; K.sfx('boom', K.s0 + td, 0.6); }
    K.ov('<div class="tag" style="background:#2bb673;color:#fff">¡QUÉ BUENO!</div>', 380, happy ? lt : -1, tq - 0.1);
    K.ov('<div class="tag warn" style="background:#e5484d;color:#fff;font-size:96px">¡DESASTRE!</div>', 380, lt, td);
    K.focus = new K.T.Vector3(0, 0, 0);
  };

  function podiumShot(K, lt, dur, t, n, dim) {
    studio(K, dim);
    const xs = { 1: 0, 2: -1.75, 3: 1.75 }, hs = { 1: 1.7, 2: 1.15, 3: 0.8 };
    const x = xs[n], h = hs[n];
    const b = O.hero; b.visible = true;
    const land = K.ease.out(K.clamp(lt / 0.7, 0, 1));
    const bx = n === 1 ? x - 0.35 : x; b.position.set(K.lerp(bx - 3, bx, land), h + 0.55 + (1 - land) * 2.5, 0.1); b.scale.setScalar(0.8);
    if (land < 1) flap(b, t, 0.9, 15); else fold(b);
    if (n === 1) { O.star.visible = true; O.star.position.set(x + 1.0, h + 2.3, 0.2); O.star.rotation.y = t * 2; O.star.scale.setScalar(pop(K, lt, 0.5)); }
    K.cam([x * 0.3, h + 1.0, 5.6], [x * 0.6, h + 0.8, 4.4], [x, h + 0.3, 0], [x, h + 0.3, 0], lt / dur, 50);
    K.focus = new K.T.Vector3(x, 0, 0);
    if (lt < 0.05) K.sfx('whoosh', K.s0, 0.6);
    K.sfx('hit', K.s0 + 0.7, 0.5);
  }

  // [3] Primero... adiós al tequila.
  S[3] = (K, lt, dur, t) => {
    podiumShot(K, lt, dur, t, 1, false);
    const tt = W(K, 'tequila');
    const bo = O.bottle;
    if (lt > tt - 0.2) {
      const out = K.clamp((lt - tt - 0.9) / 0.35, 0, 1);
      bo.visible = out < 1; bo.position.set(0.5, 1.7, 0.35); bo.rotation.set(0, -0.3, Math.sin(t * 6) * 0.08 * (1 - out));
      bo.scale.setScalar(0.42 * pop(K, lt, tt - 0.2) * (1 - out));
      if (out > 0) puff(K, { x: 0.5, y: 2.2, z: 0.35 }, (lt - tt - 0.9) / 0.6, 0, 12, '#fff', 0.7);
      O.hero.userData.wings[1].rotation.set(0, 0.4, 0.4 + Math.sin(t * 10) * 0.5); // dice adiós con el ala
    }
    K.ov('<div class="tag">ADIÓS AL TEQUILA</div>', 380, lt, tt);
  };

  // [4] El agave florece de noche... murciélago magueyero. Sin él, el agave silvestre no podría reproducirse.
  S[4] = (K, lt, dur, t) => {
    ambient(K, 'noche');
    O.moon.position.set(-25, 30, -120);
    O.agaveField.visible = true; O.agave.visible = true;
    O.agave.position.set(0, 0, 0); O.agave.scale.setScalar(1);
    const tp = W(K, 'poliniza'), tm = W(K, 'magueyero'), ts = W(K, 'sin'), tn = W(K, 'no', 3);
    const top = O.agave.userData.top;
    const b = O.hero; b.scale.setScalar(0.55);
    // vuelo: entra desde la izquierda hasta las flores, luego se va y desaparece
    const ua = K.ease.inOut(K.clamp((lt - (tp - 1.2)) / 1.3, 0, 1));
    const gone = K.clamp((lt - ts) / 0.25, 0, 1);
    if (gone < 1) {
      b.visible = true;
      const hx = Math.sin(t * 2.2) * 0.15, hy = Math.sin(t * 3.1) * 0.1;
      b.position.set(K.lerp(-6, top.x - 0.75, ua) + hx, K.lerp(top.y + 2, top.y, ua) + hy, K.lerp(2, top.z + 0.5, ua));
      b.rotation.set(0, ua < 1 ? 0.9 : 0.6, 0); b.scale.setScalar(0.55 * (1 - gone)); flap(b, t, 0.85, 16);
    }
    if (lt > ts) puff(K, b.position, (lt - ts) / 0.6, 0, 12, '#fff', 0.6);
    // polen
    if (lt > tp - 0.2 && lt < ts + 0.3) {
      const r = window.SH.rng(4);
      for (let i = 0; i < 70; i++) { const a = r() * 6.28, rr = 0.3 + r() * 1.1, sp = 0.5 + r(); setInst(O.motes, i, top.x + Math.cos(a + t * sp) * rr, top.y - 0.4 + ((r() + t * 0.25 * sp) % 1) * 1.6, top.z + Math.sin(a + t * sp) * rr * 0.5, 0.6 + r() * 0.6); }
      O.motes.instanceMatrix.needsUpdate = true;
    }
    // sin murciélago: las flores se marchitan
    const wilt = K.clamp((lt - ts - 0.3) / 1.4, 0, 1);
    O.agave.userData.flowers.forEach((f) => { f.material.color.set(0xf2c94c).lerp(new K.T.Color('#6b4a2e'), wilt); f.material.emissive.set(0x6b4a00).multiplyScalar(1 - wilt); f.scale.set(1 - wilt * 0.4, 0.75 - wilt * 0.4, 1 - wilt * 0.4); });
    K.cam([3.2, 2.2, 7.5], [2.2, 3.4, 5.8], [0, 2.4, 0], [0, 3.1, 0], lt / dur, 52);
    K.focus = new K.T.Vector3(0, 0, 0);
    K.ov('<div class="tag">FLORECE DE NOCHE</div>', 380, lt < tm ? lt : -1, W(K, 'florece'));
    K.ov('<div class="tag" style="background:#ffd84a">MURCIÉLAGO MAGUEYERO</div>', 380, lt < ts ? lt : -1, tm);
    K.ov(K.MARK_NO, 350, lt, tn);
  };

  // [5] Segundo... las plagas.
  S[5] = (K, lt, dur, t) => {
    podiumShot(K, lt, dur, t, 2, false);
    const tp = W(K, 'plagas');
    if (lt > tp - 0.3) {
      const k = K.clamp((lt - tp + 0.3) / 0.8, 0, 1);
      swarm(K, new K.T.Vector3(-1.75, 2.3, 0.6), 2.4 * k + 0.2, Math.floor(220 * k), t);
      O.hero.userData.pupils.forEach((p) => p.position.set(Math.sin(t * 9) * 0.03, 0.01, 0.075));
      K.sfx('buzz', K.s0 + tp - 0.2, 0.35);
    }
    K.ov('<div class="tag warn">¡PLAGAS!</div>', 380, lt, tp);
  };

  // [6] Un murciélago del tamaño de tu pulgar se come cada noche la mitad de su peso en insectos.
  S[6] = (K, lt, dur, t) => {
    ambient(K, 'noche');
    O.moon.position.set(20, 32, -120);
    const tpu = W(K, 'pulgar'), tc = W(K, 'come'), tm = W(K, 'mitad');
    const hd = O.hand; hd.visible = true;
    const up = K.ease.out(K.clamp((lt - tpu + 0.6) / 0.6, 0, 1));
    hd.position.set(0.8, K.lerp(-3.5, 0.2, up), 0); hd.scale.setScalar(0.62); hd.rotation.set(0, -0.35, 0);
    const b = O.hero; b.visible = true; b.scale.setScalar(0.62);
    b.position.set(-0.75, 1.2 + Math.sin(t * 3) * 0.08, 0.2); flap(b, t, 0.75, 15); b.rotation.set(0, 0.25, 0);
    if (lt > tc - 0.2) {
      const eat = K.clamp((lt - tc) / 2.2, 0, 1);
      const mouth = new K.T.Vector3(-0.75, 1.55, 0.6);
      swarm(K, new K.T.Vector3(-0.2, 1.6, 0.2), 1.6, 140, t, eat, mouth, 7);
      b.userData.mouth.scale.set(1, 1 + Math.abs(Math.sin(t * 14)) * 1.2, 1);
      for (let k = 0; k < 6; k++) K.sfx('pop', K.s0 + tc + 0.2 + k * 0.33, 0.25);
    }
    K.cam([0, 1.5, 6.4], [0, 1.4, 5.4], [0, 1.25, 0], [0, 1.25, 0], lt / dur, 50);
    K.ov('<div class="tag">DEL TAMAÑO DE UN PULGAR</div>', 380, lt < tm ? lt : -1, tpu);
    K.ov('<div class="badge">½ <small>de su peso cada noche</small></div>', 380, lt, tm);
  };

  // [7] Solo en Estados Unidos, ese trabajo gratis vale más de tres mil millones de dólares al año.
  S[7] = (K, lt, dur, t) => {
    ambient(K, 'dia');
    O.cornField.visible = true;
    const tg = W(K, 'gratis'), tm = W(K, 'millones');
    const pos = [[-2.2, 2.2], [-1.1, 1.0], [0, 2.6], [1.1, 1.0], [2.2, 2.2]];
    O.money.forEach((st, s) => st.forEach((b, i) => {
      const at = tg + s * 0.12 + i * 0.085;
      if (lt < at) return;
      const k = K.ease.out(K.clamp((lt - at) / 0.25, 0, 1));
      b.visible = true; b.position.set(pos[s][0], 0.04 + i * 0.075 + (1 - k) * 2.5, pos[s][1] * 0.4 + 4.0); b.rotation.set(0, (s - 2) * 0.15 + Math.sin(i * 1.7) * 0.08, 0);
      if (i % 4 === 0) K.sfx('tick', K.s0 + at, 0.25);
    }));
    const b = O.hero; b.visible = true; b.scale.setScalar(0.6);
    b.position.set(Math.sin(t * 0.9) * 1.8, 3.0 + Math.sin(t * 2) * 0.2, 3.0); b.rotation.set(0.1, Math.cos(t * 0.9) * 0.8, 0); flap(b, t, 0.8, 14);
    K.cam([0, 3.4, 11], [0, 2.8, 9.4], [0, 0.9, 3.6], [0, 1.0, 3.6], lt / dur, 50);
    K.focus = new K.T.Vector3(0, 0, 2);
    K.ov('<div class="tag">TRABAJO GRATIS</div>', 380, lt < tm ? lt : -1, tg);
    K.ov('<div class="badge" style="color:#7dff9a">+$3,000 <small>millones / año</small></div>', 380, lt, tm);
  };

  // [8] Tercero... y esto ya pasó.
  S[8] = (K, lt, dur, t) => {
    podiumShot(K, lt, dur, t, 3, true);
    K.ov('<div class="tag" style="background:#1b1b22;color:#fff">ESTO YA PASÓ</div>', 380, lt, W(K, 'esto'));
  };

  // [9] En 2006, un hongo empezó a matar millones de murciélagos en Estados Unidos.
  S[9] = (K, lt, dur, t) => {
    cave(K);
    const th = W(K, 'hongo'), tm = W(K, 'matar');
    O.caveBats.forEach((b, i) => {
      const h = b.userData.home; b.visible = true; b.scale.setScalar(0.75);
      fold(b);
      b.userData.fungus.visible = lt > th + i * 0.08;
      b.userData.fungus.scale.setScalar(K.clamp((lt - th - i * 0.08) / 0.4, 0, 1) * 1.2);
      const tf = tm + 0.1 + ((i * 5) % 9) * 0.22;
      if (lt < tf) { b.position.set(h.x, h.y + Math.sin(t * 1.5 + i) * 0.03, h.z); b.rotation.set(0, 0, Math.PI + Math.sin(t * 1.2 + i) * 0.05); }
      else {
        const d = lt - tf, y = Math.max(0.3, h.y - 4.9 * d * d);
        b.position.set(h.x + d * 0.2, y, h.z); b.rotation.set(0, 0, Math.PI - K.clamp(d * 3.2, 0, 1) * (Math.PI / 2 + 0.2 * (i % 2 ? 1 : -1)));
        if (y <= 0.3) K.sfx('hit', K.s0 + tf + Math.sqrt((h.y - 0.3) / 4.9), 0.25);
      }
    });
    K.cam([0, 3.2, 7.5], [0, 3.6, 5.6], [0, 4.4, -2], [0, 4.0, -2], lt / dur, 52);
    K.focus = new K.T.Vector3(0, 3, -2);
    K.ov('<div class="badge">2006</div>', 380, lt < th ? lt : -1, W(K, '2006'));
    K.ov('<div class="tag" style="background:#f4f4ef">HONGO "NARIZ BLANCA"</div>', 380, lt, th);
  };

  // [10] Los agricultores usaron 31% más insecticidas...
  S[10] = (K, lt, dur, t) => {
    ambient(K, 'gris');
    O.cornField.visible = true;
    const t31 = W(K, '31');
    const pl = O.plane; pl.visible = true;
    const v = 3.0, x0 = -6.5; pl.scale.setScalar(1.4);
    const px = (tt) => x0 + v * tt;
    pl.position.set(px(lt), 4.2 + Math.sin(t * 1.5) * 0.15, -1); pl.rotation.set(Math.sin(t * 1.3) * 0.05, 0, 0.04);
    pl.userData.prop.rotation.x = t * 40;
    const r = window.SH.rng(11);
    for (let i = 0; i < 300; i++) {
      const life = 2.6, ph = r() * life, age = (lt + ph) % life;
      const te = lt - age; if (te < 0) continue;
      const zc = (r() - 0.5) * 4.6;
      setInst(O.motes, i, px(te) - 0.2 - age * 0.6, 3.75 - age * 1.4 - age * age * 0.25, -1 + zc + (r() - 0.5) * age, (0.8 + age * 1.6) * (0.6 + r() * 0.5));
    }
    O.motes.material.color.set('#d6f0b0'); O.motes.instanceMatrix.needsUpdate = true;
    K.cam([1.5, 3.0, 14], [3, 3.2, 12.5], [0, 2.4, -1], [2.5, 2.6, -1], lt / dur, 52);
    K.focus = new K.T.Vector3(0, 0, 0);
    K.sfx('rumble', K.s0, 0.35); K.sfx('hiss', K.s0 + 0.3, 0.4);
    K.ov('<div class="badge" style="color:#ff6b6b">+31% <small>insecticidas</small></div>', 380, lt, t31);
  };

  // [11] y un estudio lo relacionó con más de mil muertes de bebés.
  S[11] = (K, lt, dur, t) => {
    ambient(K, 'tarde');
    const te = W(K, 'estudio'), tm = W(K, 'mil');
    const p = O.paper; p.visible = true;
    p.position.set(0, 2.4, 0); p.rotation.set(-0.05, Math.sin(t * 0.6) * 0.06, 0);
    p.scale.setScalar(pop(K, lt, te - 0.3, 0.45));
    K.cam([0.6, 2.2, 8.6], [0, 2.1, 7.6], [0, 2.7, 0], [0, 2.7, 0], lt / dur, 52);
    K.focus = new K.T.Vector3(0, 2, 0);
    K.filter = `saturate(${(0.9 - 0.5 * K.clamp((lt - tm) / 0.6, 0, 1)).toFixed(2)})`;
    K.ov('<div class="tag">UN ESTUDIO (2024)</div>', 300, lt < tm ? lt : -1, te);
    K.ov('<div class="badge" style="color:#ff6b6b">+1,000 <small>bebés</small></div>', 300, lt, tm);
  };

  // [12] Y no acaba ahí... también perderíamos pitayas, el durián, y selvas enteras que crecen de las semillas que ellos esparcen.
  S[12] = (K, lt, dur, t) => {
    ambient(K, 'tarde');
    O.jungle.visible = true;
    const tpi = W(K, 'pitayas'), tdu = W(K, 'durian'), tse = W(K, 'selvas'), tcr = W(K, 'crecen'), tes = W(K, 'esparcen');
    const c = O.cactus; c.visible = lt > tpi - 0.3; c.position.set(-2.0, 0, 0); c.scale.setScalar(0.85 * pop(K, lt, tpi - 0.3));
    c.userData.fruits.forEach((f, i) => f.scale.setScalar(1 + 0.08 * Math.sin(t * 5 + i)));
    const d = O.durian; d.visible = lt > tdu - 0.2; d.position.set(1.7, 1.9 + Math.sin(t * 2) * 0.1, 1.5); d.rotation.y = t * 0.8; d.scale.set(1, 1.2, 1).multiplyScalar(pop(K, lt, tdu - 0.2));
    // murciélago esparciendo semillas
    const b = O.hero; b.visible = lt > tse - 0.6; b.scale.setScalar(0.55);
    const u = K.clamp((lt - tse + 0.6) / 3.4, 0, 1);
    const bx = K.lerp(-6, 6, u), by = 4.6 + Math.sin(t * 2.5) * 0.25;
    b.position.set(bx, by, 0.8); b.rotation.set(0.1, 1.2, 0); flap(b, t, 0.85, 15);
    if (lt > tse) {
      const r = window.SH.rng(21);
      for (let i = 0; i < 40; i++) {
        const te = tse + i * 0.08; if (lt < te) break;
        const age = lt - te, ex = K.lerp(-6, 6, K.clamp((te - tse + 0.6) / 3.4, 0, 1));
        const y = Math.max(0.05, by - 0.3 - 4.9 * age * age);
        setInst(O.motes, i, ex + age * 0.6, y, 0.8 + (r() - 0.5) * 2, 1.6);
      }
      O.motes.material.color.set('#5a3a1a'); O.motes.instanceMatrix.needsUpdate = true;
    }
    O.saplings.forEach((s, i) => {
      const at = tcr + i * 0.18; if (lt < at) return;
      s.visible = true; s.position.set(-4.5 + i * 1.5, 0, 2.2 + (i % 2) * 0.8); s.scale.setScalar(0.55 * K.ease.back(K.clamp((lt - at) / 0.6, 0, 1)));
      K.sfx('pop', K.s0 + at, 0.3);
    });
    K.cam([0, 3.0, 11], [0, 3.3, 9.2], [0, 2.4, 0], [0, 2.6, 0], lt / dur, 52);
    K.focus = new K.T.Vector3(0, 0, 0);
    K.ov('<div class="tag" style="background:#e5484d;color:#fff">PITAYAS</div>', 380, lt < tdu ? lt : -1, tpi);
    K.ov('<div class="tag" style="background:#c7d14a">DURIÁN</div>', 380, lt < tse ? lt : -1, tdu);
    K.ov('<div class="tag" style="background:#2bb673;color:#fff">SELVAS ENTERAS</div>', 380, lt < tes ? lt : -1, tse);
    K.ov('<div class="tag" style="background:#2bb673;color:#fff">ELLOS SIEMBRAN</div>', 380, lt, tes);
  };

  // [13] Así que la próxima vez que veas uno... mejor dale las gracias.
  S[13] = (K, lt, dur, t) => {
    ambient(K, 'tarde');
    O.jungle.visible = true;
    const tg = W(K, 'gracias');
    const b = O.hero; b.visible = true; b.scale.setScalar(1);
    b.position.set(0, 2.0 + Math.sin(t * 2.5) * 0.12, 0); flap(b, t, 0.6, 9);
    if (lt > tg - 0.1) { b.rotation.set(0, 0, Math.sin((lt - tg) * 9) * 0.12); b.userData.mouth.scale.set(1.3, 1.6, 1); }
    O.hearts.forEach((h, i) => {
      const at = tg + i * 0.12; if (lt < at) return;
      const d = lt - at; h.visible = true;
      h.position.set(Math.cos(i * 1.05) * (0.9 + d * 0.5), 2.6 + d * 0.9 + Math.sin(i) * 0.3, 0.6 + Math.sin(i * 1.05) * 0.4);
      h.rotation.y = Math.sin(t * 3 + i) * 0.5; h.scale.setScalar(0.35 * K.ease.back(K.clamp(d / 0.3, 0, 1)));
    });
    K.cam([0, 2.3, 6.0], [0, 2.3, 4.6], [0, 2.1, 0], [0, 2.2, 0], lt / dur, 50);
    K.focus = new K.T.Vector3(0, 0, 0);
    K.ov('<div class="tag" style="background:#ff6b9a;color:#fff">¡GRACIAS!</div>', 380, lt, tg);
  };

  // [14] ¿Tú les tienes miedo o te caen bien? Te leo en los comentarios.
  S[14] = (K, lt, dur, t) => {
    ambient(K, 'noche');
    O.moon.position.set(0, 26, -120);
    const tmi = W(K, 'miedo'), tb = W(K, 'bien'), tc = W(K, 'comentarios');
    const b = O.hero; b.visible = true; b.scale.setScalar(0.9);
    b.position.set(0, 2.1 + Math.sin(t * 2.5) * 0.12, 0); flap(b, t, 0.7, 11);
    b.rotation.set(0, Math.sin(t * 1.4) * 0.25, 0);
    K.cam([0, 2.6, 6.6], [0, 2.6, 5.6], [0, 2.7, 0], [0, 2.7, 0], lt / dur, 50);
    K.ov('<div class="pill no" style="font-size:70px;padding:10px 46px;white-space:nowrap">MIEDO</div>', 250, lt, tmi);
    K.ov('<div class="pill si" style="font-size:70px;padding:10px 46px;white-space:nowrap">ME CAEN BIEN</div>', 390, lt, tb);
    K.ovRaw('<div class="bubble"><i></i><i></i><i></i></div>', 1450, lt, tc);
  };
})();
