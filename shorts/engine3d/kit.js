// Kit 3D low-poly (three.js) para shorts verticales.
// Construye un mundo reutilizable (cielo, río con olas, orillas, pinos, fondo del río)
// y modelos (coche, personas, móvil, rompecristales, martillo, flechas, burbujas,
// cristales rotos, salpicaduras). El guion de cada proyecto (escena3d.js) define
// window.SHOTS = { [idEscena]: (K, lt, dur, t) => {...} } y mueve cámara y objetos.
(function () {
  const T = THREE;
  const { rng, clamp, lerp, ease } = window.SH;
  const K = (window.K3 = {});
  K.T = T; K.clamp = clamp; K.lerp = lerp; K.ease = ease;
  K.smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

  // ---------- render básico ----------
  const canvas = document.getElementById('gl');
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(1080, 1920, false);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 1080 / 1920, 0.05, 900);
  K.renderer = renderer; K.scene = scene; K.camera = camera;

  const matCache = {};
  K.mat = (color, o = {}) => {
    const key = color + JSON.stringify(o);
    if (!matCache[key]) matCache[key] = new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.0, flatShading: !!o.flat }, o));
    return matCache[key];
  };
  function mesh(geo, mat, cast = true, recv = true) {
    const m = new T.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; return m;
  }
  K.mesh = mesh;

  // ---------- luces ----------
  const hemi = new T.HemisphereLight(0xffd6b0, 0x2b4a3c, 1.1);
  scene.add(hemi);
  const sun = new T.DirectionalLight(0xffc48a, 2.6);
  sun.position.set(-40, 30, 35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 150 });
  sun.shadow.bias = -0.0005;
  scene.add(sun); scene.add(sun.target);
  const fill = new T.DirectionalLight(0x8fb6ff, 0.5);
  fill.position.set(30, 20, -30); scene.add(fill);
  K.sun = sun; K.hemi = hemi;

  // ---------- cielo degradado ----------
  const skyMat = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new T.Color('#1d1636') }, mid: { value: new T.Color('#8e4767') }, hor: { value: new T.Color('#f6b36f') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 hor; varying vec3 vP;
      void main(){ float h = clamp(vP.y, -0.2, 1.0);
        vec3 c = h < 0.12 ? mix(hor, mid, smoothstep(-0.02, 0.12, h)) : mix(mid, top, smoothstep(0.12, 0.6, h));
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const sky = new T.Mesh(new T.SphereGeometry(600, 32, 16), skyMat);
  scene.add(sky);
  // sol bajo
  const sunDisc = new T.Mesh(new T.CircleGeometry(18, 32), new T.MeshBasicMaterial({ color: 0xffe2a8, fog: false }));
  sunDisc.position.set(-300, 40, 330); sunDisc.lookAt(0, 0, 0); scene.add(sunDisc);

  // ---------- agua ----------
  K.wave = (x, z, t) => 0.13 * Math.sin(x * 0.35 + t * 1.6) + 0.09 * Math.sin(z * 0.5 + t * 1.15) + 0.05 * Math.sin((x + z) * 0.9 + t * 2.3);
  const waterGeo = new T.PlaneGeometry(260, 260, 130, 130);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new T.MeshStandardMaterial({ color: 0x3a93a8, roughness: 0.32, metalness: 0.15, transparent: true, opacity: 0.9, side: T.DoubleSide, flatShading: true });
  const water = mesh(waterGeo, waterMat, false, true);
  scene.add(water);
  const wpos = waterGeo.attributes.position, wbase = Float32Array.from(wpos.array);
  K.updateWater = (t) => {
    for (let i = 0; i < wpos.count; i++) {
      const x = wbase[i * 3], z = wbase[i * 3 + 2];
      wpos.array[i * 3 + 1] = K.wave(x, z, t);
    }
    wpos.needsUpdate = true; waterGeo.computeVertexNormals();
  };

  // ---------- terreno ----------
  const R = rng(21);
  const BED = -9, BANK = 2.5;
  K.BED = BED; K.BANK = BANK;
  const bed = mesh(new T.PlaneGeometry(260, 260, 40, 40), K.mat('#5d5a45', { flat: true }), false, true);
  bed.geometry.rotateX(-Math.PI / 2);
  { const p = bed.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, BED + (R() - 0.5) * 0.6); bed.geometry.computeVertexNormals(); }
  scene.add(bed);
  for (let i = 0; i < 70; i++) {
    const r = mesh(new T.DodecahedronGeometry(0.3 + R() * 1.2, 0), K.mat(['#5b5f5a', '#6c6a5c', '#4a4f4c'][i % 3], { flat: true }));
    r.position.set((R() - 0.5) * 120, BED + 0.2, (R() - 0.5) * 26); r.rotation.set(R() * 3, R() * 3, R() * 3); scene.add(r);
  }
  // algas
  K.weeds = [];
  for (let i = 0; i < 90; i++) {
    const h = 1 + R() * 2.8;
    const g = new T.ConeGeometry(0.12 + R() * 0.12, h, 4); g.translate(0, h / 2, 0);
    const w = mesh(g, K.mat(['#3f7a3a', '#5c8f3c', '#2f6633'][i % 3], { flat: true }), false, false);
    w.position.set((R() - 0.5) * 100, BED, (R() - 0.5) * 26); w.userData.ph = R() * 6; scene.add(w); K.weeds.push(w);
  }
  const grassM = K.mat('#6f9a3a', { flat: true }), dirtM = K.mat('#6b4a2e', { flat: true });
  function bank(z0, z1) {
    const g = new T.BoxGeometry(300, BANK - BED + 2, Math.abs(z1 - z0));
    const m = new T.Mesh(g, [dirtM, dirtM, grassM, dirtM, dirtM, dirtM]);
    m.position.set(0, (BANK + BED - 2) / 2, (z0 + z1) / 2); m.receiveShadow = true; m.castShadow = true; scene.add(m);
  }
  bank(-15, -140); bank(15, 140);
  // carretera y quitamiedos
  const road = mesh(new T.PlaneGeometry(300, 7), K.mat('#3b3b40'), false, true);
  road.rotation.x = -Math.PI / 2; road.position.set(0, BANK + 0.02, -21.5); scene.add(road);
  for (let x = -150; x < 150; x += 6) {
    const d = mesh(new T.PlaneGeometry(2.6, 0.22), K.mat('#f2efe2'), false, true);
    d.rotation.x = -Math.PI / 2; d.position.set(x, BANK + 0.03, -21.5); scene.add(d);
  }
  for (let x = -60; x < 60; x += 3) {
    if (x > -6 && x < 6) continue; // hueco por donde cae el coche
    const p = mesh(new T.BoxGeometry(0.15, 0.8, 0.15), K.mat('#9aa0a6', { metalness: 0.6, roughness: 0.4 }));
    p.position.set(x, BANK + 0.4, -17.2); scene.add(p);
  }
  [[-60, -6], [6, 60]].forEach(([a, b]) => {
    const r = mesh(new T.BoxGeometry(b - a, 0.25, 0.08), K.mat('#c3c8cc', { metalness: 0.7, roughness: 0.35 }));
    r.position.set((a + b) / 2, BANK + 0.7, -17.1); scene.add(r);
  });
  // pinos
  function pine(x, z, h) {
    const g = new T.Group();
    const trunk = mesh(new T.CylinderGeometry(0.18, 0.25, h * 0.25, 6), K.mat('#5a3a22', { flat: true }));
    trunk.position.y = h * 0.12; g.add(trunk);
    const cols = ['#1f4a3f', '#24574a', '#1a3f37'];
    for (let i = 0; i < 3; i++) {
      const c = mesh(new T.ConeGeometry(h * (0.32 - i * 0.07), h * 0.42, 7), K.mat(cols[i], { flat: true }));
      c.position.y = h * (0.35 + i * 0.2); g.add(c);
    }
    g.position.set(x, BANK, z); scene.add(g);
  }
  for (let i = 0; i < 140; i++) {
    const side = i % 2 ? 1 : -1;
    const z = side > 0 ? 18 + R() * 60 : -27 - R() * 60;
    pine((R() - 0.5) * 220, z, 5 + R() * 6);
  }
  for (let i = 0; i < 40; i++) {
    const b = mesh(new T.IcosahedronGeometry(0.6 + R() * 0.8, 0), K.mat('#3f7a2c', { flat: true }));
    b.position.set((R() - 0.5) * 120, BANK + 0.3, R() > 0.5 ? 16 + R() * 4 : -15.5 - R() * 1.2); if (Math.abs(b.position.x) > 9) scene.add(b);
  }

  // ---------- rayos de luz bajo el agua ----------
  K.shafts = [];
  for (let i = 0; i < 9; i++) {
    const g = new T.CylinderGeometry(0.6, 2.4, 12, 12, 1, true); g.translate(0, -6, 0);
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0.06, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    m.position.set(-18 + i * 4.5, 0, -6 + (i % 3) * 5); m.rotation.z = 0.25; m.visible = false; scene.add(m); K.shafts.push(m);
  }

  // ---------- modo submarino ----------
  const fogAir = new T.Fog(0xe7a07a, 60, 320), fogWater = new T.Fog(0x0e5a6c, 1.5, 26);
  K.underwater = false;
  K.setUnderwater = (u) => {
    K.underwater = u;
    scene.fog = u ? fogWater : fogAir;
    sky.visible = !u; sunDisc.visible = !u;
    scene.background = u ? new T.Color(0x0e5a6c) : null;
    hemi.color.set(u ? 0x9fe6ff : 0xffd6b0); hemi.intensity = u ? 1.3 : 1.1;
    sun.intensity = u ? 1.3 : 2.6;
    K.shafts.forEach((s) => (s.visible = u));
    waterMat.color.set(u ? 0x9fdcea : 0x3a93a8);
    waterMat.opacity = u ? 0.55 : 0.9;
  };
  K.setUnderwater(false);

  // ---------- COCHE ----------
  function extrude(shape, depth, mat, bevel = 0.06) {
    const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1 });
    g.translate(0, 0, -depth / 2);
    return mesh(g, mat);
  }
  const glassMat = () => new T.MeshPhysicalMaterial({ color: 0xbfe3ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.32, side: T.DoubleSide, depthWrite: false });
  K.makeCar = function (color = '#d6453d') {
    const car = new T.Group();
    const body = K.mat(color, { roughness: 0.35, metalness: 0.25 });
    const dark = K.mat('#1b1b1f', { roughness: 0.6 });
    const s = new T.Shape();
    s.moveTo(-2.2, 0.35); s.lineTo(2.15, 0.35); s.lineTo(2.25, 0.62); s.lineTo(2.1, 0.98); s.lineTo(1.05, 1.08);
    s.lineTo(-1.4, 1.1); s.lineTo(-2.12, 1.02); s.lineTo(-2.25, 0.7); s.lineTo(-2.2, 0.35);
    const lower = extrude(s, 1.78, body, 0.08); car.add(lower);
    // techo y pilares
    const roof = mesh(new T.BoxGeometry(1.5, 0.08, 1.74), body); roof.position.set(-0.3, 1.78, 0); car.add(roof);
    const pillar = (x0, y0, x1, y1, z) => {
      const L = Math.hypot(x1 - x0, y1 - y0);
      const p = mesh(new T.BoxGeometry(0.09, L, 0.09), body);
      p.position.set((x0 + x1) / 2, (y0 + y1) / 2, z); p.rotation.z = -Math.atan2(x1 - x0, y1 - y0); car.add(p);
    };
    [0.86, -0.86].forEach((z) => { pillar(1.1, 1.06, 0.45, 1.78, z); pillar(-1.38, 1.08, -1.05, 1.78, z); pillar(-0.22, 1.08, -0.22, 1.78, z); });
    // cristales
    const pane = (pts, z, mat) => {
      const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((p) => sh.lineTo(p[0], p[1]));
      const m = new T.Mesh(new T.ShapeGeometry(sh), mat); m.position.z = z; m.renderOrder = 2; return m;
    };
    const gm = glassMat();
    car.add(pane([[-1.33, 1.1], [-0.27, 1.1], [-0.27, 1.74], [-1.03, 1.74]], 0.85, gm));
    car.add(pane([[-1.33, 1.1], [-0.27, 1.1], [-0.27, 1.74], [-1.03, 1.74]], -0.85, gm));
    car.add(pane([[-0.17, 1.1], [1.03, 1.1], [0.43, 1.74], [-0.17, 1.74]], -0.85, gm));
    const ws = mesh(new T.PlaneGeometry(1.7, 0.98), gm, false, false); ws.position.set(0.78, 1.42, 0); ws.rotation.set(0, Math.PI / 2, 0); ws.rotateX(-0.83); ws.renderOrder = 2; car.add(ws);
    const rw = mesh(new T.PlaneGeometry(1.7, 0.72), gm, false, false); rw.position.set(-1.2, 1.43, 0); rw.rotation.set(0, -Math.PI / 2, 0); rw.rotateX(-0.42); rw.renderOrder = 2; car.add(rw);
    // puerta del conductor (lado +z) con su ventanilla, en un pivote de bisagra
    const doorPivot = new T.Group(); doorPivot.position.set(1.05, 0, 0.9); car.add(doorPivot);
    const door = mesh(new T.BoxGeometry(1.25, 0.7, 0.07), body); door.position.set(-0.62, 0.72, 0.02); doorPivot.add(door);
    const seam = mesh(new T.BoxGeometry(1.27, 0.72, 0.05), dark); seam.position.set(-0.62, 0.72, -0.005); doorPivot.add(seam);
    const handle = mesh(new T.BoxGeometry(0.22, 0.05, 0.05), K.mat('#d9d9de', { metalness: 0.8, roughness: 0.3 })); handle.position.set(-1.0, 0.9, 0.07); doorPivot.add(handle);
    const winMat = glassMat(); winMat.opacity = 0.38;
    const winGroup = new T.Group(); doorPivot.add(winGroup);
    const win = pane([[-1.22, 1.1], [-0.02, 1.1], [-0.62, 1.74], [-1.22, 1.74]], -0.05, winMat); winGroup.add(win);
    // ruedas
    const tire = K.mat('#151517', { roughness: 0.9 }), hub = K.mat('#c9ccd1', { metalness: 0.7, roughness: 0.3 });
    [[1.35, 0.92], [1.35, -0.92], [-1.4, 0.92], [-1.4, -0.92]].forEach(([x, z]) => {
      const w = mesh(new T.CylinderGeometry(0.42, 0.42, 0.3, 20), tire); w.rotation.x = Math.PI / 2; w.position.set(x, 0.42, z); car.add(w);
      const h = mesh(new T.CylinderGeometry(0.22, 0.22, 0.32, 12), hub); h.rotation.x = Math.PI / 2; h.position.set(x, 0.42, z); car.add(h);
    });
    // luces
    const head = new T.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe9a0, emissiveIntensity: 1.6 });
    const tail = new T.MeshStandardMaterial({ color: 0xff4040, emissive: 0xff2020, emissiveIntensity: 1.2 });
    [0.62, -0.62].forEach((z) => {
      const h = mesh(new T.BoxGeometry(0.06, 0.16, 0.4), head); h.position.set(2.23, 0.78, z); car.add(h);
      const tl = mesh(new T.BoxGeometry(0.06, 0.14, 0.42), tail); tl.position.set(-2.24, 0.82, z); car.add(tl);
    });
    // interior: asientos, volante
    const seatM = K.mat('#2e2f38');
    [[0.15, 0.45], [0.15, -0.45]].forEach(([x, z]) => {
      const a = mesh(new T.BoxGeometry(0.55, 0.15, 0.55), seatM); a.position.set(x, 0.62, z); car.add(a);
      const b = mesh(new T.BoxGeometry(0.14, 0.75, 0.52), seatM); b.position.set(x - 0.3, 1.0, z); b.rotation.z = 0.12; car.add(b);
    });
    const bench = mesh(new T.BoxGeometry(0.6, 0.15, 1.5), seatM); bench.position.set(-0.95, 0.62, 0); car.add(bench);
    const bb = mesh(new T.BoxGeometry(0.14, 0.7, 1.5), seatM); bb.position.set(-1.27, 1.0, 0); bb.rotation.z = 0.15; car.add(bb);
    const sw = mesh(new T.TorusGeometry(0.19, 0.035, 8, 20), dark); sw.position.set(0.68, 1.05, 0.45); sw.rotation.y = Math.PI / 2; sw.rotation.x = 0.5; car.add(sw);
    // agua dentro del habitáculo
    const inMat = new T.MeshStandardMaterial({ color: 0x2aa8c9, transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false });
    const inner = new T.Mesh(new T.BoxGeometry(2.5, 1, 1.66), inMat); inner.position.set(-0.15, 0.4, 0); inner.renderOrder = 3; car.add(inner);
    // ocupantes
    const driver = K.makePerson({ shirt: '#2fb3a3' }); K.pose(driver, 'sit'); driver.position.set(0.2, 0.62, 0.45); car.add(driver);
    const kid1 = K.makePerson({ shirt: '#f2c230', scale: 0.72 }); K.pose(kid1, 'sit'); kid1.position.set(-0.9, 0.62, 0.42); car.add(kid1);
    const kid2 = K.makePerson({ shirt: '#e8709a', scale: 0.6 }); K.pose(kid2, 'sit'); kid2.position.set(-0.9, 0.62, -0.42); car.add(kid2);
    const belt = mesh(new T.BoxGeometry(0.04, 0.75, 0.09), K.mat('#16161a')); belt.position.set(0.36, 1.06, 0.45); belt.rotation.x = 0.8; car.add(belt);
    Object.assign(car.userData, { sw, doorPivot, winGroup, win, winMat, inner, driver, kid1, kid2, belt });
    car.traverse((o) => { if (o.isMesh && o.material && o.material.transparent) o.castShadow = false; });
    return car;
  };

  // ---------- PERSONAS ----------
  K.makePerson = function (o = {}) {
    const g = new T.Group();
    const sc = o.scale || 1;
    const skin = K.mat(o.skin || '#c98d66'), shirt = K.mat(o.shirt || '#2fb3a3'), pants = K.mat(o.pants || '#2f5fb8'), hair = K.mat(o.hair || '#3a2418');
    const torso = mesh(new T.CapsuleGeometry(0.2, 0.42, 4, 10), shirt); torso.position.y = 0.45; g.add(torso);
    const head = mesh(new T.SphereGeometry(0.17, 16, 12), skin); head.position.y = 0.92; g.add(head);
    const hr = mesh(new T.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.1), hair); hr.position.y = 0.94; hr.rotation.z = 0.15; g.add(hr);
    const limb = (mat, r, L) => { const p = new T.Group(); const m = mesh(new T.CapsuleGeometry(r, L, 3, 8), mat); m.position.y = -L / 2 - r; p.add(m); return p; };
    const armL = limb(shirt, 0.07, 0.38), armR = limb(shirt, 0.07, 0.38);
    armL.position.set(0, 0.7, 0.26); armR.position.set(0, 0.7, -0.26); g.add(armL, armR);
    const legL = limb(pants, 0.09, 0.42), legR = limb(pants, 0.09, 0.42);
    legL.position.set(0, 0.15, 0.11); legR.position.set(0, 0.15, -0.11); g.add(legL, legR);
    g.scale.setScalar(sc);
    Object.assign(g.userData, { armL, armR, legL, legR, head });
    return g;
  };
  K.pose = function (p, kind, t = 0) {
    const u = p.userData;
    p.rotation.set(0, 0, 0);
    if (kind === 'sit') {
      u.legL.rotation.set(0, 0, Math.PI / 2); u.legR.rotation.set(0, 0, Math.PI / 2);
      u.armL.rotation.set(0, 0, 0.9); u.armR.rotation.set(0, 0, 0.9);
    } else if (kind === 'swim') {
      p.rotation.z = -1.25; // cuerpo inclinado hacia arriba (cabeza delante)
      const a = t * 5;
      u.armL.rotation.set(0, 0, Math.PI + Math.sin(a) * 1.2); u.armR.rotation.set(0, 0, Math.PI + Math.sin(a + Math.PI) * 1.2);
      u.legL.rotation.set(0, 0, Math.sin(a * 1.6) * 0.35); u.legR.rotation.set(0, 0, -Math.sin(a * 1.6) * 0.35);
    } else if (kind === 'tread') {
      const a = t * 4;
      u.armL.rotation.set(Math.sin(a) * 0.5 - 1.2, 0, 0.6); u.armR.rotation.set(-Math.sin(a) * 0.5 + 1.2, 0, 0.6);
      u.legL.rotation.set(0, 0, Math.sin(a * 1.3) * 0.4); u.legR.rotation.set(0, 0, -Math.sin(a * 1.3) * 0.4);
    } else if (kind === 'reach') {
      u.legL.rotation.set(0, 0, Math.PI / 2); u.legR.rotation.set(0, 0, Math.PI / 2);
      u.armL.rotation.set(0, 0, 1.6); u.armR.rotation.set(0, 0, 0.9);
    } else {
      [u.armL, u.armR, u.legL, u.legR].forEach((l) => l.rotation.set(0, 0, 0));
    }
  };

  // ---------- OBJETOS ----------
  function labelTexture(draw, w = 256, h = 512) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return tx;
  }
  K.makePhone = function (num = '911') {
    const g = new T.Group();
    const b = mesh(new T.BoxGeometry(0.42, 0.85, 0.05), K.mat('#1c1c22', { roughness: 0.3, metalness: 0.4 })); g.add(b);
    const tx = labelTexture((x, w, h) => {
      const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#20263a'); gr.addColorStop(1, '#0d1020');
      x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.fillStyle = '#fff'; x.font = '800 92px Inter, sans-serif'; x.textAlign = 'center'; x.fillText(num, w / 2, 190);
      x.font = '600 30px Inter, sans-serif'; x.fillStyle = '#9fb0d0'; x.fillText('Llamando...', w / 2, 240);
      x.fillStyle = '#e5484d'; x.beginPath(); x.arc(w / 2, 410, 46, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.fillRect(w / 2 - 26, 404, 52, 12);
    });
    const scr = new T.Mesh(new T.PlaneGeometry(0.38, 0.8), new T.MeshBasicMaterial({ map: tx, toneMapped: false }));
    scr.position.z = 0.027; g.add(scr);
    return g;
  };
  K.makeBreaker = function () {
    const g = new T.Group();
    const red = K.mat('#e5484d', { roughness: 0.45 }), steel = K.mat('#cfd3d8', { metalness: 0.9, roughness: 0.25 });
    const h = mesh(new T.CylinderGeometry(0.1, 0.12, 0.9, 16), red); h.position.y = -0.45; g.add(h);
    for (let i = 0; i < 4; i++) { const r = mesh(new T.TorusGeometry(0.115, 0.018, 6, 16), K.mat('#a82f33')); r.rotation.x = Math.PI / 2; r.position.y = -0.2 - i * 0.16; g.add(r); }
    const head = mesh(new T.BoxGeometry(0.5, 0.16, 0.16), red); g.add(head);
    const tipA = mesh(new T.ConeGeometry(0.07, 0.18, 12), steel); tipA.rotation.z = -Math.PI / 2; tipA.position.x = 0.33; g.add(tipA);
    const tipB = mesh(new T.ConeGeometry(0.07, 0.18, 12), steel); tipB.rotation.z = Math.PI / 2; tipB.position.x = -0.33; g.add(tipB);
    const blade = mesh(new T.BoxGeometry(0.03, 0.22, 0.05), steel); blade.position.set(0.0, -0.98, 0); g.add(blade);
    return g;
  };
  K.makeHammer = function () {
    const g = new T.Group();
    const h = mesh(new T.CylinderGeometry(0.06, 0.07, 1.1, 10), K.mat('#a8743f')); h.position.y = -0.55; g.add(h);
    const head = mesh(new T.BoxGeometry(0.55, 0.2, 0.2), K.mat('#7d838a', { metalness: 0.85, roughness: 0.3 })); g.add(head);
    return g;
  };
  K.makeArrow = function (color = '#ffffff') {
    const g = new T.Group();
    const m = new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
    const s = mesh(new T.CylinderGeometry(0.07, 0.07, 0.9, 10), m, false, false); s.position.y = 0.45; g.add(s);
    const c = mesh(new T.ConeGeometry(0.18, 0.36, 12), m, false, false); c.position.y = 1.05; g.add(c);
    return g; // apunta a +y
  };
  K.makeRing = function (color) {
    const m = new T.Mesh(new T.TorusGeometry(0.16, 0.035, 8, 32), new T.MeshBasicMaterial({ color, toneMapped: false }));
    return m;
  };

  // grietas (cristal laminado): textura que se redibuja por nivel
  const crackCanvas = document.createElement('canvas'); crackCanvas.width = crackCanvas.height = 512;
  const crackTex = new T.CanvasTexture(crackCanvas);
  let crackLevel = -1;
  K.crackTexture = crackTex;
  K.setCracks = function (level, cx = 0.25, cy = 0.35) {
    if (level === crackLevel) return; crackLevel = level;
    const x = crackCanvas.getContext('2d'); x.clearRect(0, 0, 512, 512);
    if (level <= 0) { crackTex.needsUpdate = true; return; }
    const r = rng(5); const px = cx * 512, py = cy * 512;
    x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 3;
    const rays = 7 + level * 6, len = 90 + level * 120;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + r() * 0.3; let X = px, Y = py; x.beginPath(); x.moveTo(X, Y);
      for (let s = 0; s < 6; s++) { X += Math.cos(a + (r() - 0.5) * 0.5) * len / 6; Y += Math.sin(a + (r() - 0.5) * 0.5) * len / 6; x.lineTo(X, Y); }
      x.stroke();
    }
    for (let k = 1; k <= level * 2; k++) { x.beginPath(); x.arc(px, py, k * 26, 0, Math.PI * 2); x.lineWidth = 2; x.stroke(); }
    crackTex.needsUpdate = true;
  };
  K.makeCrackPane = function (w, h) {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false, toneMapped: false }));
    m.renderOrder = 4; return m;
  };

  // partículas deterministas: cristales, salpicadura, burbujas
  function instanced(geo, mat, n) { const m = new T.InstancedMesh(geo, mat, n); m.frustumCulled = false; scene.add(m); return m; }
  const dummy = new T.Object3D();
  K.shards = instanced(new T.TetrahedronGeometry(0.06, 0), new T.MeshStandardMaterial({ color: 0xdff4ff, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.85 }), 140);
  K.splash = instanced(new T.IcosahedronGeometry(0.07, 0), new T.MeshStandardMaterial({ color: 0xeaf8ff, emissive: 0x8fc4d8, emissiveIntensity: 0.5, roughness: 0.2, transparent: true, opacity: 0.75, flatShading: true }), 300);
  K.bubbles = instanced(new T.SphereGeometry(0.05, 10, 8), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9fe8ff, emissiveIntensity: 0.5, transparent: true, opacity: 0.45, roughness: 0.05 }), 160);
  const hideAll = (im) => { dummy.position.set(0, -999, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix(); for (let i = 0; i < im.count; i++) im.setMatrixAt(i, dummy.matrix); im.instanceMatrix.needsUpdate = true; };
  K.hideParticles = () => { hideAll(K.shards); hideAll(K.splash); hideAll(K.bubbles); };

  K.burstShards = function (origin, normal, tau) {
    const r = rng(77);
    for (let i = 0; i < K.shards.count; i++) {
      const sp = 1 + r() * 3;
      const v = new T.Vector3(normal.x * sp + (r() - 0.5) * 2.5, (r() - 0.2) * 2.2, normal.z * sp + (r() - 0.5) * 2.5);
      const drag = 1 - Math.exp(-tau * 2.2);
      dummy.position.set(origin.x + (r() - 0.5) * 0.9 + v.x * drag / 2.2, origin.y + (r() - 0.5) * 0.5 + v.y * drag / 2.2 - 0.8 * tau * tau, origin.z + v.z * drag / 2.2);
      dummy.rotation.set(r() * 6 + tau * 8, r() * 6 + tau * 5, 0);
      dummy.scale.setScalar(tau < 0 ? 0.0001 : 0.4 + r() * 1.0);
      dummy.updateMatrix(); K.shards.setMatrixAt(i, dummy.matrix);
    }
    K.shards.instanceMatrix.needsUpdate = true;
  };
  K.splashAt = function (origin, tau) {
    const r = rng(31);
    for (let i = 0; i < K.splash.count; i++) {
      const a = r() * Math.PI * 2, out = 2 + r() * 5, up = 4 + r() * 8;
      const y = origin.y + up * tau - 9.8 * tau * tau;
      dummy.position.set(origin.x + Math.cos(a) * out * tau * 1.4, y, origin.z + Math.sin(a) * out * tau * 1.4);
      dummy.scale.setScalar(tau < 0 || y < -0.2 ? 0.0001 : (0.6 + r()) * (1.2 - Math.min(1, tau)));
      dummy.updateMatrix(); K.splash.setMatrixAt(i, dummy.matrix);
    }
    K.splash.instanceMatrix.needsUpdate = true;
  };
  K.bubblesFrom = function (src, t, spread = 1.5, rate = 1, top = 0) {
    const r = rng(13);
    for (let i = 0; i < K.bubbles.count; i++) {
      const per = 2.5 + r() * 2.5, ph = r() * per;
      const life = ((t * rate + ph) % per) / per;
      const ox = (r() - 0.5) * spread * 2.4, oz = (r() - 0.5) * spread * 2;
      const y = src.y + life * (top - src.y);
      dummy.position.set(src.x + ox + Math.sin(t * 3 + i) * 0.15, y, src.z + oz + Math.cos(t * 2.5 + i) * 0.15);
      dummy.scale.setScalar(i < 160 * Math.min(1, rate) ? (0.4 + r() * 1.0) * (0.6 + life) : 0.0001);
      dummy.updateMatrix(); K.bubbles.setMatrixAt(i, dummy.matrix);
    }
    K.bubbles.instanceMatrix.needsUpdate = true;
  };

  // ---------- cámara ----------
  const tmpA = new T.Vector3(), tmpB = new T.Vector3();
  K.cam = function (p0, p1, l0, l1, u, fov) {
    u = ease.inOut(clamp(u, 0, 1));
    camera.position.set(lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u), lerp(p0[2], p1[2], u));
    tmpA.set(lerp(l0[0], l1[0], u), lerp(l0[1], l1[1], u), lerp(l0[2], l1[2], u));
    camera.lookAt(tmpA);
    if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  };
  K.shake = function (amt, t) { camera.position.x += Math.sin(t * 61) * amt; camera.position.y += Math.cos(t * 53) * amt; };

  // ---------- overlays HTML ----------
  const ovEl = document.getElementById('overlay');
  let ovHtml = [];
  K.ov = function (html, y, lt, at, extraStyle = '') {
    if (lt < at) return;
    const u = ease.back(clamp((lt - at) / 0.3, 0, 1));
    ovHtml.push(`<div class="ov" style="top:${y}px;transform:translateX(-50%) scale(${u.toFixed(3)});${extraStyle}">${html}</div>`);
  };
  K.ovRaw = function (html, y, lt, at) { // ya centrado por su propia clase (margin-left)
    if (lt < at) return;
    const u = ease.back(clamp((lt - at) / 0.3, 0, 1));
    ovHtml.push(`<div class="ov" style="top:${y}px;transform:scale(${u.toFixed(3)})">${html}</div>`);
  };
  K.MARK_OK = '<div class="mark ok"><svg viewBox="-60 -60 120 120"><path d="M-36 2 L-8 30 L40 -28" stroke="#fff" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  K.MARK_NO = '<div class="mark no"><svg viewBox="-60 -60 120 120"><path d="M-32 -32 L32 32 M32 -32 L-32 32" stroke="#fff" stroke-width="20" stroke-linecap="round"/></svg></div>';

  // tiempo de una palabra del guion (n-ésima aparición, a partir de un instante)
  K.wt = function (word, after = 0) {
    const P = window.getProject();
    const n = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
    const w = P.words.find((x) => x.start >= after - 0.01 && n(x.w) === n(word));
    return w ? w.start : after;
  };

  // ---------- render por fotograma ----------
  K.objects = {};
  let built = false;
  window.renderAt = function (t) {
    const P = window.getProject();
    if (!built) { if (window.BUILD3D) window.BUILD3D(K); built = true; }
    const scenes = P.scenes;
    let sc = scenes[0];
    for (const s of scenes) if (t >= s.start) sc = s;
    const lt = t - sc.start, dur = Math.max(0.01, sc.end - sc.start);
    ovHtml = [];
    K.hideParticles();
    K.updateWater(t);
    K.weeds.forEach((w) => (w.rotation.z = Math.sin(t * 1.3 + w.userData.ph) * 0.18));
    camera.fov = 50; camera.updateProjectionMatrix();
    const shot = window.SHOTS && window.SHOTS[sc.id];
    if (window.RESET3D) window.RESET3D(K, t);
    if (shot) shot(K, lt, dur, t);
    // sigue la sombra al centro de interés
    sun.target.position.copy(K.focus || new T.Vector3()); sun.position.copy(sun.target.position).add(new T.Vector3(-40, 30, 35));
    const uw = camera.position.y < K.wave(camera.position.x, camera.position.z, t) - 0.05;
    if (uw !== K.underwater) K.setUnderwater(uw);
    renderer.render(scene, camera);
    ovEl.innerHTML = ovHtml.join('');
    const fl = document.getElementById('flash');
    fl.style.background = K.flashColor || '#fff';
    fl.style.opacity = (K.flash || 0).toFixed(2);
    window.renderCaptionsAt(t);
  };
})();
