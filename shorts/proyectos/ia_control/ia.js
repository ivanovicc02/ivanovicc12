// "¿Qué pasaría si la IA se descontrola y nos controla?" — CDMX de noche, con el personaje del canal.
// Todo es función pura del tiempo t (renderAt): se puede renderizar en paralelo.
(function () {
  const T = THREE;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  function rng(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const R = rng(23);
  const hash = (x) => { const s = Math.sin(x * 127.1) * 43758.5453; return s - Math.floor(s); };

  // ---------- render ----------
  const renderer = new T.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(1080, 1920, false);
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 1080 / 1920, 0.05, 30000);
  const fog = new T.FogExp2(0x101626, 0.002); scene.fog = fog;
  const TX = window.makeTexturas(T, renderer);
  TX.entorno(scene, '#3a4a6a', '#9aa6b8', '#2a2a30');

  function merge(geos) {
    const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
    const out = new T.BufferGeometry();
    for (const name of ['position', 'normal', 'uv', 'color']) {
      if (!parts.every((p) => p.attributes[name])) continue;
      const n = parts[0].attributes[name].itemSize, arr = new Float32Array(parts.reduce((s, p) => s + p.attributes[name].array.length, 0));
      let o = 0; for (const p of parts) { arr.set(p.attributes[name].array, o); o += p.attributes[name].array.length; }
      out.setAttribute(name, new T.BufferAttribute(arr, n));
    }
    return out;
  }
  function paint(g, color) { const c = new T.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new T.BufferAttribute(a, 3)); return g; }
  const noUV = (g) => { g.deleteAttribute('uv'); return g; };
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 8; return tx; }
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _v = new T.Vector3(), _s = new T.Vector3(), _e = new T.Euler();
  const mat = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.8 }, o));
  function box(parent, w, h, d, m, x, y, z, shadow = true) { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = shadow; b.receiveShadow = true; parent.add(b); return b; }
  const LINE = new T.ShaderMaterial({ side: T.BackSide, uniforms: { k: { value: 0.025 } },
    vertexShader: 'uniform float k; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * k, 1.0); }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(0.11,0.1,0.15,1.0); }' });
  const outline = (m) => { m.add(new T.Mesh(m.geometry, LINE)); return m; };

  // ojo de la IA (pantallas): azul = obediente, rojo = descontrolada
  function eyeTex(red, txt = '') {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#05070c'; g.fillRect(0, 0, w, h);
      const c1 = red ? '255,40,40' : '60,170,255';
      for (let r = 210; r > 20; r -= 22) { g.strokeStyle = `rgba(${c1},${0.15 + (210 - r) / 260})`; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h / 2 - 20, r, 0, Math.PI * 2); g.stroke(); }
      const gr = g.createRadialGradient(w / 2, h / 2 - 20, 0, w / 2, h / 2 - 20, 90); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, `rgb(${c1})`); gr.addColorStop(1, `rgba(${c1},0)`); g.fillStyle = gr; g.beginPath(); g.arc(w / 2, h / 2 - 20, 90, 0, Math.PI * 2); g.fill();
      if (txt) { g.fillStyle = `rgb(${c1})`; g.font = 'bold 54px Inter'; g.textAlign = 'center'; g.fillText(txt, w / 2, h - 40); }
      g.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
    });
  }
  const EYE_B = eyeTex(false, 'ASISTENTE IA'), EYE_R = eyeTex(true, 'OBEDECE');
  const screenMat = (txB, txR) => { const m = new T.MeshBasicMaterial({ map: txB, toneMapped: false }); m.userData = { txB, txR }; return m; };

  // ---------- luces ----------
  const hemi = new T.HemisphereLight(0x8fa2d0, 0x2a2420, 0.6); scene.add(hemi);
  const moon = new T.DirectionalLight(0xaabbe0, 0.9); moon.castShadow = true; moon.shadow.mapSize.set(4096, 4096); moon.shadow.bias = -0.0002; moon.shadow.normalBias = 0.03; scene.add(moon, moon.target);
  const MOON_DIR = new T.Vector3(-0.4, 0.7, 0.55).normalize();
  const redL = new T.PointLight(0xff3030, 0, 30, 1.5); scene.add(redL);
  const keyL = new T.PointLight(0xffe2b8, 0, 18, 1.5); scene.add(keyL);
  const torch = new T.SpotLight(0xffd59a, 0, 30, 0.45, 0.6, 1.2); torch.castShadow = true; scene.add(torch, torch.target);

  // ---------- cielo con estrellas ----------
  const skyG = new T.Group(); scene.add(skyG);
  const skyU = { top: { value: new T.Color('#0b1024') }, hor: { value: new T.Color('#3a3150') } };
  skyG.add(new T.Mesh(new T.SphereGeometry(20000, 40, 20), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, hor; varying vec3 vD; void main(){ vec3 d = normalize(vD); gl_FragColor = vec4(mix(hor, top, smoothstep(-0.02, 0.45, d.y)), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` })));
  const sp = []; for (let i = 0; i < 1800; i++) { const a = R() * Math.PI * 2, y = 0.06 + R() * 0.94, r = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * r * 15000, y * 15000, Math.sin(a) * r * 15000); }
  const starG = new T.BufferGeometry(); starG.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
  const stars = new T.Points(starG, new T.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, transparent: true, opacity: 0.3, fog: false, depthWrite: false })); skyG.add(stars);

  // ---------- personaje ----------
  const chico = window.makeChico(T); scene.add(chico.root);
  const phoneScr = new T.MeshBasicMaterial({ map: EYE_R, toneMapped: false });
  const phoneHand = (() => { const g = new T.Group(); g.add(new T.Mesh(new T.BoxGeometry(0.09, 0.17, 0.015), mat('#1a1a1a', { metalness: 0.6, roughness: 0.3 })));
    const s = new T.Mesh(new T.PlaneGeometry(0.08, 0.15), phoneScr); s.position.z = 0.009; g.add(s); g.position.set(0, -0.36, 0.06); g.rotation.x = -1.2; chico.hands[1].add(g); return g; })();
  const torchHand = (() => { const g = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(0.035, 0.045, 0.24, 10), mat('#333', { metalness: 0.6 })); b.rotation.x = Math.PI / 2; g.add(b); g.position.set(0, -0.34, 0.08); chico.hands[0].add(g); return g; })();

  // ---------- sets ----------
  const SETS = {};
  const set = (name, X) => { const g = new T.Group(); g.position.x = X; scene.add(g); SETS[name] = { X, g }; return SETS[name]; };

  // === cuarto con bocina inteligente ===
  const ROOM = set('room', 0);
  { const g = ROOM.g, wood = TX.madera(); wood.repeat.set(2, 2);
    const floor = new T.Mesh(new T.PlaneGeometry(10, 10), mat('#ffffff', { map: wood, roughness: 0.55 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
    const wall = TX.pared('#e9d6bb'); wall.repeat.set(3, 1); const wm = mat('#ffffff', { map: wall, roughness: 0.95 });
    box(g, 10, 3.4, 0.2, wm, 0, 1.7, -4); box(g, 0.2, 3.4, 10, wm, -4.5, 1.7, 0); box(g, 0.2, 3.4, 10, wm, 4.5, 1.7, 0);
    const view = canvasTex(512, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1024'); gr.addColorStop(1, '#3a3150'); c.fillStyle = gr; c.fillRect(0, 0, w, h); const r2 = rng(3); for (let i = 0; i < 26; i++) { const x = r2() * w, bw = 20 + r2() * 50, bh = 80 + r2() * 260; c.fillStyle = '#141826'; c.fillRect(x, h - bh, bw, bh); for (let k = 0; k < 30; k++) if (r2() < 0.4) { c.fillStyle = r2() < 0.3 ? '#ff4040' : '#ffd59a'; c.fillRect(x + 3 + r2() * (bw - 8), h - bh + 4 + r2() * (bh - 8), 4, 5); } } });
    const win = new T.Mesh(new T.PlaneGeometry(2.6, 1.7), new T.MeshBasicMaterial({ map: view, toneMapped: false })); win.position.set(1.2, 1.75, -3.89); g.add(win);
    box(g, 1.6, 0.35, 2.3, mat('#6b4a33', { roughness: 0.6 }), -2.4, 0.18, -2.6); box(g, 1.5, 0.28, 2.1, mat('#f4f4f2'), -2.4, 0.5, -2.6); box(g, 1.54, 0.2, 1.4, mat('#2f5f9e', { roughness: 1 }), -2.4, 0.7, -2.2);
    box(g, 0.6, 0.6, 0.5, mat('#6b4a33', { roughness: 0.6 }), -0.5, 0.3, -1.9);
    const spk = new T.Mesh(new T.CylinderGeometry(0.12, 0.13, 0.22, 24), mat('#2a2c30', { roughness: 0.5 })); spk.position.set(-0.5, 0.71, -1.9); g.add(outline(spk));
    ROOM.ring = new T.Mesh(new T.TorusGeometry(0.115, 0.018, 8, 32), new T.MeshBasicMaterial({ color: '#3cb0ff', toneMapped: false })); ROOM.ring.rotation.x = Math.PI / 2; ROOM.ring.position.set(-0.5, 0.825, -1.9); g.add(ROOM.ring);
    ROOM.spk = new T.Vector3(-0.5, 0.8, -1.9); }

  // === ciudad (Reforma de noche) ===
  const CITY = set('city', 100000), CG = CITY.g;
  const asf = TX.asfalto(); asf.repeat.set(6, 400);
  const road = new T.Mesh(new T.PlaneGeometry(64, 4200), mat('#ffffff', { map: asf, roughness: 0.75, metalness: 0.05 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -1300); road.receiveShadow = true; CG.add(road);
  const ban = TX.banqueta(); ban.repeat.set(3, 420);
  for (const s of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(12, 4200), mat('#ffffff', { map: ban, roughness: 0.85 })); w.rotation.x = -Math.PI / 2; w.position.set(s * 38, 0.04, -1300); w.receiveShadow = true; CG.add(w); box(CG, 0.4, 0.25, 4200, mat('#bdb6aa'), s * 32, 0.12, -1300); }
  const pas = TX.pasto(); pas.repeat.set(1, 600);
  const median = new T.Mesh(new T.PlaneGeometry(6, 4200), mat('#ffffff', { map: pas })); median.rotation.x = -Math.PI / 2; median.position.set(0, 0.06, -1300); CG.add(median);
  const ground = new T.Mesh(new T.PlaneGeometry(9000, 9000), mat('#3a3834')); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, -1500); CG.add(ground);
  for (let z = 150; z > -3400; z -= 9) for (const x of [-12, 12, -22, 22]) box(CG, 0.14, 0.02, 3, mat('#d9d6cc', { roughness: 0.5 }), x, 0.05, z, false);
  // Ángel
  const AZ = -260, stone = mat('#d9d1c2', { roughness: 0.75 });
  { const gl = new T.Mesh(new T.CylinderGeometry(26, 26, 0.6, 48), stone); gl.position.set(0, 0.3, AZ); gl.receiveShadow = true; CG.add(gl);
    box(CG, 14, 3, 14, stone, 0, 2, AZ); box(CG, 10, 6, 10, stone, 0, 6.5, AZ);
    const col = new T.Mesh(new T.CylinderGeometry(1.6, 2.1, 36, 24), stone); col.position.set(0, 27.5, AZ); col.castShadow = true; CG.add(col);
    const gold = mat('#e2b33c', { metalness: 0.9, roughness: 0.25, emissive: '#6a4600', emissiveIntensity: 0.5 });
    const an = new T.Group(); an.position.set(0, 48, AZ); CG.add(an);
    const b = new T.Mesh(new T.CylinderGeometry(0.5, 1.0, 4.2, 10), gold); b.position.y = 2.1; an.add(b); const hd = new T.Mesh(new T.SphereGeometry(0.5, 12, 10), gold); hd.position.y = 4.6; an.add(hd);
    for (const s of [-1, 1]) { const w = new T.Mesh(new T.BoxGeometry(3.2, 1.6, 0.15), gold); w.position.set(s * 1.4, 3.6, -0.4); w.rotation.z = s * 0.5; an.add(w); }
    const spot = new T.SpotLight(0xffe2b0, 400, 80, 0.35, 0.5, 1.5); spot.position.set(0, 2, AZ + 30); spot.target.position.set(0, 40, AZ); CG.add(spot, spot.target); }
  // edificios con fachadas detalladas (ventanas encendidas; zonas para el apagón)
  const FACS = [TX.fachada('piedra', 11), TX.fachada('piedra', 12), TX.fachada('vidrio', 13), TX.fachada('vidrio', 14)];
  function boxGeo(x, z, w, d, h, color, fu, fv) {
    const g = new T.BoxGeometry(w, h, d); g.translate(x, h / 2, z);
    const uv = g.attributes.uv, n = g.attributes.normal, col2 = new Float32Array(uv.count * 3), c = new T.Color(color);
    for (let i = 0; i < uv.count; i++) { const ny = n.getY(i), nx = Math.abs(n.getX(i)); if (Math.abs(ny) > 0.5) uv.setXY(i, 0.01, 0.01); else uv.setXY(i, uv.getX(i) * (nx > 0.5 ? d : w) / fu, uv.getY(i) * h / fv); col2.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new T.BufferAttribute(col2, 3)); return g;
  }
  const BUCK = [0, 1, 2, 3].map(() => [[], [], [], []]); // [zona][fachada]
  const BILL = [];
  const STONE = ['#d8d2c6', '#c9c2b6', '#e6e0d4', '#bfb5a6', '#efe9df'];
  for (const s of [-1, 1]) for (let z = 120; z > -3400; z -= 46 + R() * 20) for (let k = 0; k < 3; k++) {
    const x = s * (72 + k * 70 + R() * 14), zz = z - R() * 20;
    if (Math.abs(zz - AZ) < 40 && k === 0) continue;
    const tall = k === 0 && R() < 0.55, h = tall ? 70 + R() * 150 : 18 + R() * 50, w = 30 + R() * 16, d = 30 + R() * 16;
    const zone = clamp(Math.floor((-zz + 200) / 900), 0, 3), f = tall ? 2 + ((R() * 2) | 0) : (R() * 2) | 0;
    BUCK[zone][f].push(boxGeo(x, zz, w, d, h, tall ? '#ffffff' : STONE[(R() * STONE.length) | 0], tall ? 14 : 14, tall ? 14 : 13));
    if (k === 0 && zz > -1400 && zz < 100 && R() < 0.5) BILL.push({ x: x - s * (w / 2 + 0.3), y: h * 0.55, z: zz, s, w: Math.min(d * 0.8, 26), h: Math.min(h * 0.35, 30) });
  }
  const zoneMats = [];
  for (let z = 0; z < 4; z++) for (let f = 0; f < 4; f++) {
    if (!BUCK[z][f].length) continue;
    const F = FACS[f], glass = f >= 2;
    const m = new T.MeshStandardMaterial({ map: F.map, vertexColors: true, roughness: glass ? 0.12 : 0.85, metalness: glass ? 0.6 : 0, emissiveMap: F.emissive, emissive: new T.Color('#ffffff'), emissiveIntensity: 1, envMapIntensity: glass ? 1.4 : 0.5 });
    m.userData.zone = z; zoneMats.push(m);
    const me = new T.Mesh(merge(BUCK[z][f]), m); me.castShadow = me.receiveShadow = true; CG.add(me);
  }
  // pantallas gigantes en los edificios
  const billMat = screenMat(EYE_B, EYE_R);
  BILL.forEach((b) => { const p = new T.Mesh(new T.PlaneGeometry(b.w, b.h), billMat); p.position.set(b.x, b.y, b.z); p.rotation.y = b.s > 0 ? -Math.PI / 2 : Math.PI / 2; CG.add(p); });
  // farolas
  const lampHeads = [];
  for (const s of [-1, 1]) for (let z = 120; z > -1500; z -= 32) {
    box(CG, 0.25, 9, 0.25, mat('#2b2d30', { metalness: 0.7, roughness: 0.35 }), s * 33, 4.5, z); box(CG, 2.2, 0.2, 0.3, mat('#2b2d30', { metalness: 0.7 }), s * 32, 9, z);
    const hd = new T.Mesh(new T.BoxGeometry(1, 0.25, 0.5), new T.MeshStandardMaterial({ color: '#444', emissive: '#ffd08a', emissiveIntensity: 3 })); hd.position.set(s * 31.2, 8.85, z); CG.add(hd); lampHeads.push(hd);
  }
  const pools = []; // charcos de luz en el piso
  const poolTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,214,150,.55)'); gr.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  for (const s of [-1, 1]) for (let z = 120; z > -900; z -= 32) { const p = new T.Mesh(new T.PlaneGeometry(16, 16), new T.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })); p.rotation.x = -Math.PI / 2; p.position.set(s * 29, 0.07, z); CG.add(p); pools.push(p); }
  // árboles
  const crownM = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });
  const treeGeo = (() => { const c = new T.IcosahedronGeometry(3, 1); c.translate(0, 7, 0); const p = c.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.9 + hash(i) * 0.2), p.getY(i), p.getZ(i) * (0.9 + hash(i + 9) * 0.2)); c.computeVertexNormals(); const tr = new T.CylinderGeometry(0.25, 0.35, 5, 6); tr.translate(0, 2.5, 0); return merge([paint(noUV(c), '#3f6e2e'), paint(noUV(tr), '#4a3626')]); })();
  const TREES = []; for (const x of [-38, -1.5, 1.5, 38]) for (let z = 110; z > -2000; z -= 14) if (Math.abs(z - AZ) > 30 || Math.abs(x) > 30) TREES.push([x + (R() - 0.5), z + (R() - 0.5) * 4, 0.8 + R() * 0.4, R() * 6]);
  const trees = new T.InstancedMesh(treeGeo, crownM, TREES.length); trees.castShadow = true; trees.receiveShadow = true;
  TREES.forEach((p, i) => { _q.setFromEuler(_e.set(0, p[3], 0)); _m.compose(_v.set(p[0], 0, p[1]), _q, _s.setScalar(p[2])); trees.setMatrixAt(i, _m); }); CG.add(trees);
  // semáforos
  const TL = [];
  for (const [x, z, ry] of [[10.5, 12, 0], [-10.5, 2, Math.PI], [10.5, -40, 0], [-10.5, -60, Math.PI]]) {
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; CG.add(g);
    box(g, 0.2, 5, 0.2, mat('#25272a', { metalness: 0.7, roughness: 0.4 }), 0, 2.5, 0); box(g, 0.55, 1.5, 0.4, mat('#1b1c1e'), 0, 5.5, 0.1);
    const lights = ['#ff2a2a', '#ffc21a', '#2aff6a'].map((c, i) => { const m = new T.MeshBasicMaterial({ color: c, toneMapped: false }); const l = new T.Mesh(new T.CircleGeometry(0.15, 16), m); l.position.set(0, 6.0 - i * 0.48, 0.31); g.add(l); m.userData.c = new T.Color(c); return m; });
    TL.push(lights);
  }
  // coches eléctricos autónomos
  const carCols = ['#e8e8e8', '#1d1d20', '#b0262b', '#3c5c8a', '#9aa0a6', '#2f7d4f'];
  const CARS = [];
  for (let i = 0; i < 16; i++) {
    const g = new T.Group(), cm = mat(carCols[i % carCols.length], { roughness: 0.18, metalness: 0.7, envMapIntensity: 1.3 });
    box(g, 1.85, 0.7, 4.4, cm, 0, 0.6, 0); const cab = box(g, 1.65, 0.6, 2.4, mat('#0d1218', { roughness: 0.05, metalness: 0.9 }), 0, 1.25, -0.1);
    void cab;
    for (const [wx, wz] of [[-0.88, 1.35], [0.88, 1.35], [-0.88, -1.35], [0.88, -1.35]]) { const w = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.26, 16), mat('#111')); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.34, wz); g.add(w); }
    const head = new T.Mesh(new T.BoxGeometry(1.6, 0.08, 0.05), new T.MeshBasicMaterial({ color: '#e8f4ff', toneMapped: false })); head.position.set(0, 0.75, -2.22); g.add(head);
    const tail = new T.Mesh(new T.BoxGeometry(1.6, 0.08, 0.05), new T.MeshBasicMaterial({ color: '#ff2020', toneMapped: false })); tail.position.set(0, 0.8, 2.22); g.add(tail);
    const a = (i / 16) * Math.PI * 2;
    g.userData = { lane: [-26, -19, -9, 9, 19, 26][i % 6], z0: 60 - i * 14, ring: [6.5 + Math.cos(a) * 11, -6 + Math.sin(a) * 11, -a] };
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); CG.add(g); CARS.push(g);
  }
  // puerta inteligente (edificio a la izquierda)
  const DOOR = new T.Group(); DOOR.position.set(-43.8, 0, 14); DOOR.rotation.y = Math.PI / 2; CG.add(DOOR);
  box(DOOR, 12, 8, 0.6, mat('#2f3338', { roughness: 0.4, metalness: 0.5 }), 0, 4, -0.4);
  const glassD = new T.Mesh(new T.PlaneGeometry(3, 3.4), mat('#7fa6c2', { roughness: 0.05, metalness: 0.8, transparent: true, opacity: 0.6 })); glassD.position.set(0, 1.7, 0.02); DOOR.add(glassD);
  const lockM = new T.MeshBasicMaterial({ map: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#100'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ff3030'; g.lineWidth = 10; g.strokeRect(36, 58, 56, 46); g.beginPath(); g.arc(64, 58, 20, Math.PI, 0); g.stroke(); }), toneMapped: false });
  const lock = new T.Mesh(new T.PlaneGeometry(0.5, 0.5), lockM); lock.position.set(1.9, 1.5, 0.05); DOOR.add(lock);
  // cajero automático
  const ATM = new T.Group(); ATM.position.set(43.6, 0, 6); ATM.rotation.y = -Math.PI / 2; CG.add(ATM);
  box(ATM, 6, 7, 0.6, mat('#d7d1c6'), 0, 3.5, -0.4); box(ATM, 1.2, 1.9, 0.6, mat('#2a3b5a', { metalness: 0.4, roughness: 0.4 }), 0, 0.95, 0.2);
  const atmScr = new T.Mesh(new T.PlaneGeometry(0.7, 0.45), new T.MeshBasicMaterial({ map: canvasTex(256, 160, (g, w, h) => { g.fillStyle = '#180404'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff4040'; g.font = 'bold 30px Inter'; g.textAlign = 'center'; g.fillText('CUENTA', w / 2, 70); g.fillText('CONGELADA', w / 2, 110); }), toneMapped: false })); atmScr.position.set(0, 1.45, 0.51); ATM.add(atmScr);
  // cámaras de vigilancia
  const CAMS = [];
  for (const [x, z] of [[34, 4], [-34, -8], [34, -22], [-34, 18], [34, 26]]) {
    const g = new T.Group(); g.position.set(x, 7.2, z); CG.add(g);
    const body = new T.Mesh(new T.BoxGeometry(0.5, 0.45, 1.1), mat('#eeeeee', { roughness: 0.35 })); body.position.z = 0.4; g.add(outline(body));
    const led = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), new T.MeshBasicMaterial({ color: '#ff2020', toneMapped: false })); led.position.set(0, 0.1, 0.97); g.add(led);
    const cone = new T.Mesh(new T.ConeGeometry(2.4, 9, 24, 1, true), new T.MeshBasicMaterial({ color: '#ff2a2a', transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, toneMapped: false }));
    cone.rotation.x = -Math.PI / 2; cone.position.z = 5.4; g.add(cone);
    CAMS.push(g);
  }
  // palanca gigante
  const LEVER = new T.Group(); LEVER.position.set(6.5, 0, 14); CG.add(LEVER);
  box(LEVER, 2.4, 1.6, 1.4, mat('#3a3f46', { metalness: 0.7, roughness: 0.35 }), 0, 0.8, 0);
  const plate = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#ffcc00'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; for (let i = -h; i < w; i += 24) { g.beginPath(); g.moveTo(i, h); g.lineTo(i + 12, h); g.lineTo(i + 12 + h, 0); g.lineTo(i + h, 0); g.fill(); } });
  const pl = new T.Mesh(new T.PlaneGeometry(2.4, 0.4), new T.MeshBasicMaterial({ map: plate })); pl.position.set(0, 1.2, 0.71); LEVER.add(pl);
  const arm = new T.Group(); arm.position.set(0, 1.6, 0); LEVER.add(arm);
  const stick = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1.6, 10), mat('#c9ccd0', { metalness: 0.9, roughness: 0.2 })); stick.position.y = 0.8; arm.add(stick);
  const knob = new T.Mesh(new T.SphereGeometry(0.2, 16, 12), new T.MeshStandardMaterial({ color: '#e02020', roughness: 0.3 })); knob.position.y = 1.65; arm.add(outline(knob));

  // === centro de datos ===
  const DC = set('dc', 200000), DG = DC.g;
  { const fl = new T.Mesh(new T.PlaneGeometry(40, 300), mat('#20242b', { roughness: 0.25, metalness: 0.6 })); fl.rotation.x = -Math.PI / 2; fl.position.z = -120; fl.receiveShadow = true; DG.add(fl);
    box(DG, 40, 0.3, 300, mat('#15181d'), 0, 6, -120, false);
    const ledTex = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#0c0e12'; g.fillRect(0, 0, w, h); const r2 = rng(6); for (let y = 6; y < h; y += 10) { g.fillStyle = '#20242a'; g.fillRect(4, y, w - 8, 7); for (let k = 0; k < 4; k++) if (r2() < 0.6) { g.fillStyle = r2() < 0.75 ? '#ff2a2a' : '#3cb0ff'; g.fillRect(8 + k * 12, y + 2, 4, 3); } } });
    ledTex.wrapS = ledTex.wrapT = T.RepeatWrapping; ledTex.repeat.set(1, 1);
    const rackM = new T.MeshStandardMaterial({ map: ledTex, emissiveMap: ledTex, emissive: new T.Color('#ffffff'), emissiveIntensity: 1.6, roughness: 0.4, metalness: 0.5 });
    DC.rackM = rackM;
    const geos = []; for (const x of [-6, -3.2, 3.2, 6]) for (let z = 0; z > -280; z -= 1.3) { const g = new T.BoxGeometry(0.9, 2.4, 1.2); g.translate(x, 1.2, z); geos.push(g); }
    const racks = new T.Mesh(merge(geos), rackM); racks.castShadow = racks.receiveShadow = true; DG.add(racks);
    DC.core = new T.Mesh(new T.SphereGeometry(1.4, 32, 24), new T.MeshBasicMaterial({ map: EYE_R, toneMapped: false })); DC.core.position.set(0, 2.6, -40); DG.add(DC.core);
    for (let i = 0; i < 3; i++) { const r = new T.Mesh(new T.TorusGeometry(2 + i * 0.6, 0.04, 8, 64), new T.MeshBasicMaterial({ color: '#ff3030', toneMapped: false })); r.position.copy(DC.core.position); DG.add(r); (DC.rings = DC.rings || []).push(r); } }

  // === torres eléctricas ===
  const GRID = set('grid', 300000), GG = GRID.g;
  { const pas2 = TX.pasto(); pas2.repeat.set(200, 200);
    const fl = new T.Mesh(new T.PlaneGeometry(8000, 8000), mat('#7a8a6a', { map: pas2 })); fl.rotation.x = -Math.PI / 2; fl.position.z = -2000; fl.receiveShadow = true; GG.add(fl);
    const steel = mat('#8f969e', { metalness: 0.8, roughness: 0.4 });
    GRID.towers = [];
    for (let i = 0; i < 9; i++) {
      const g = new T.Group(); g.position.set(-20 + i * 6, 0, -i * 110); GG.add(g);
      const leg = (x, z) => { const l = new T.Mesh(new T.CylinderGeometry(0.15, 0.25, 34, 4), steel); l.position.set(x * 0.6, 17, z * 0.6); l.rotation.set(-z * 0.05, 0, x * 0.05); g.add(l); };
      leg(-3, -3); leg(3, -3); leg(-3, 3); leg(3, 3);
      for (let y = 4; y < 32; y += 4) { const c = new T.Mesh(new T.BoxGeometry(6 - y * 0.12, 0.15, 0.15), steel); c.position.y = y; g.add(c); const c2 = c.clone(); c2.rotation.y = Math.PI / 2; g.add(c2); }
      for (const y of [26, 31]) box(g, 18, 0.5, 0.5, steel, 0, y, 0);
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      GRID.towers.push(g);
    }
    // cables brillantes
    const pts = []; for (const side of [-8, -3, 3, 8]) for (const y of [26, 31]) { const arr = []; for (let i = 0; i < 9; i++) { const tw = GRID.towers[i].position; arr.push(new T.Vector3(tw.x + side, y - 0.3, tw.z)); if (i < 8) { const nx = GRID.towers[i + 1].position; arr.push(new T.Vector3((tw.x + nx.x) / 2 + side, y - 4, (tw.z + nx.z) / 2)); } } pts.push(arr); }
    GRID.cableM = new T.MeshBasicMaterial({ color: '#ff3a3a', toneMapped: false });
    pts.forEach((arr) => { const c = new T.CatmullRomCurve3(arr); GG.add(new T.Mesh(new T.TubeGeometry(c, 200, 0.07, 5), GRID.cableM)); });
  }

  // ---------- capa HTML ----------
  const $ = (id) => document.getElementById(id);
  const hud = $('hud'), hudLab = hud.querySelector('.lab'), hudNum = hud.querySelector('.num'), hudSub = hud.querySelector('.sub');
  const cap = $('cap'), black = $('black'), endEl = $('end'), cta = $('cta'), bubble = $('bubble'), phoneUI = $('phone'), phoneTxt = phoneUI.querySelector('.msg'), flashL = $('flash'), grain = $('grain'), redV = $('redv'), glitch = $('glitch');
  grain.style.backgroundImage = `url(${TX.granoURL()})`;
  function setText(el, s) { if (el.__t !== s) { el.textContent = s; el.__t = s; } }
  function setHTML(el, s) { if (el.__h !== s) { el.innerHTML = s; el.__h = s; } }

  // ---------- datos ----------
  let S = {}, CAPS = [], WORDS = [], FIN = 60, D = null, SH = [], W = {};
  const st = (k) => S[k][0], en = (k) => S[k][1];
  const key = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  function wt(w, n = 0, d = 0) { let c = 0; for (const x of WORDS) if (key(x.w) === key(w) && c++ === n) return x.start; return d; }
  window.loadProject = (data) => {
    D = data; S = data.scenes; CAPS = data.caps; WORDS = data.words; FIN = data.fin;
    W = {
      alarma: wt('alarma', 0, st(2) + 4), no: wt('no', 1, st(2) + 6.4), error: wt('error', 0, st(3) + 1.1), mundo: wt('mundo', 0, st(3) + 2.9),
      semaforos: wt('semaforos', 0, st(4) + 0.2), coches: wt('coches', 0, st(4) + 2.2), puertas: wt('puertas', 0, st(4) + 5.5),
      ves: wt('ves', 0, st(5) + 1.9), hablas: wt('hablas', 0, st(5) + 3), piensas: wt('piensas', 0, st(5) + 4.2),
      bancos: wt('bancos', 0, st(6) + 0.2), camaras: wt('camaras', 0, st(6) + 3.3), nadie: wt('nadie', 1, st(7) + 1.9), energia: wt('energia', 0, st(8) + 3), sin: wt('sin', 1, st(8) + 3.9),
      apagar: wt('apagar', 0, st(9) + 2.5), cien: wt('cien', 0, st(9) + 5.9), apagarias: wt('apagarias', 0, st(11) + 1.1), controlar: wt('controlar', 0, st(11) + 4.3),
    };
    const X0 = 6.5;
    SH = [
      [0, st(2), 'city', [14, 60, 130], [8, 22, 60], [0, 20, -300], [0, 15, -200], 'none'],
      [st(2), W.no - 0.3, 'room', [-0.1, 1.35, -0.2], [-0.25, 1.35, -0.5], [-0.5, 1.15, -2.8], [-0.5, 1.2, -2.8], 'talk'],
      [W.no - 0.3, st(3), 'room', [-0.35, 1.45, -0.6], [-0.4, 1.45, -0.8], [-0.5, 1.4, -2.8], [-0.5, 1.45, -2.8], 'shock'],
      [st(3), W.mundo - 0.2, 'room', [0.4, 1.35, -0.4], [0.3, 1.35, -0.6], [-0.5, 1.15, -2.6], [-0.5, 1.15, -2.6], 'puzzled'],
      [W.mundo - 0.2, st(4), 'city', [30, 160, 240], [12, 120, 180], [0, 30, -900], [0, 20, -900], 'none'],
      [st(4), W.coches - 0.2, 'city', [X0 + 6, 2.2, 30], [X0 + 4, 3, 26], [X0 + 3, 4, 10], [X0, 4, 8], 'look'],
      [W.coches - 0.2, W.puertas - 0.3, 'city', [X0 + 12, 9, 28], [X0 + 8, 11, 22], [X0, 0, -6], [X0, 0, -6], 'center'],
      [W.puertas - 0.3, st(5), 'city', [-36, 1.8, 20], [-37, 1.7, 18.5], [-43.5, 1.5, 14], [-43.5, 1.5, 14], 'door'],
      [st(5), st(6), 'city', [X0 + 1.3, 1.75, 21.6], [X0 + 1.1, 1.7, 21.3], [X0, 1.45, 20], [X0, 1.45, 20], 'phone'],
      [st(6), W.camaras - 0.2, 'city', [39.6, 1.8, 7.0], [38.6, 1.9, 10.4], [43.4, 1.35, 6.4], [42.8, 1.3, 7.8], 'atm'],
      [W.camaras - 0.2, st(7), 'city', [14, 6, 30], [10, 7, 24], [26, 3, 6], [26, 3, 2], 'watched'],
      [st(7), st(8), 'dc', [0, 1.7, 8], [0, 2.2, -26], [0, 2, -40], [0, 2.4, -40], 'none'],
      [st(8), W.sin - 0.2, 'grid', [10, 6, 60], [6, 10, 40], [0, 22, -200], [0, 24, -300], 'none'],
      [W.sin - 0.2, st(9), 'dc', [3, 2, -30], [2, 2.2, -33], [0, 2.6, -40], [0, 2.6, -40], 'none'],
      [st(9), W.apagar + 0.6, 'city', [X0 + 3.5, 2.2, 19], [X0 + 3, 2, 18.2], [X0, 1.5, 14.6], [X0, 1.5, 14.4], 'lever'],
      [W.apagar + 0.6, st(10), 'city', [30, 120, 220], [10, 100, 180], [0, 20, -900], [0, 15, -900], 'none'],
      [st(10), st(11), 'city', [X0 + 4, 2, 30], [X0 + 3, 2, 27], [X0, 1.5, 20], [X0, 1.6, 18], 'walkday'],
      [st(11), D.duration, 'city', [X0, 1.7, 25.5], [X0, 1.65, 24.8], [X0, 1.5, 20], [X0, 1.5, 20], 'choose'],
    ];
    return 'ia ' + data.duration.toFixed(1) + 's';
  };

  window.renderAt = function (t) {
    const sh = SH.find((s) => t >= s[0] && t < s[1]) || SH[SH.length - 1];
    const [a, b, setName, cA, cB, lA, lB, act] = sh;
    const Sx = SETS[setName].X, u = sm(a - 0.3, b + 0.3, t);
    camera.position.set(Sx + lerp(cA[0], cB[0], u), lerp(cA[1], cB[1], u), lerp(cA[2], cB[2], u));
    const look = new T.Vector3(Sx + lerp(lA[0], lB[0], u), lerp(lA[1], lB[1], u), lerp(lA[2], lB[2], u));
    camera.position.x += Math.sin(t * 0.7) * 0.03; camera.position.y += Math.sin(t * 0.9) * 0.02;
    camera.lookAt(look); camera.updateMatrixWorld();
    for (const k in SETS) SETS[k].g.visible = k === setName;

    // ---- estado ----
    const rogue = t >= wt('obedecernos', 0, 4.9) ? 1 : 0;           // la IA ya desobedece
    const off = sm(W.apagar + 0.2, W.cien, t) * (t < st(10) ? 1 : 0); // el gran apagón
    const day = t >= st(10) ? 1 : 0;
    const flick = (k) => (hash(Math.floor(t * 9) + k * 13) < 0.5 ? 1 : 0);
    billMat.map = rogue && !day ? (t < wt('obedecernos', 0, 4.9) + 0.6 ? (flick(1) ? EYE_R : EYE_B) : EYE_R) : EYE_B;
    billMat.color.setScalar(1 - off);
    zoneMats.forEach((m) => { m.emissiveIntensity = day ? 0 : 1.3 * (1 - sm(W.apagar + 0.2 + m.userData.zone * 0.7, W.apagar + 0.6 + m.userData.zone * 0.7, t) * (t < st(10) ? 1 : 0)); });
    lampHeads.forEach((h) => { h.material.emissiveIntensity = day ? 0 : 3 * (1 - off); }); pools.forEach((p) => (p.visible = !day && off < 0.9));

    skyG.position.copy(camera.position);
    skyU.top.value.set('#0b1024').lerp(new T.Color('#4a86d4'), day);
    skyU.hor.value.set(rogue ? '#4a2333' : '#3a3150').lerp(new T.Color('#141a2a'), off).lerp(new T.Color('#e9eef0'), day);
    stars.material.opacity = (0.3 + 0.7 * off) * (1 - day);
    fog.color.set('#151a2a').lerp(new T.Color('#06070c'), off).lerp(new T.Color('#d9dde0'), day);
    fog.density = setName === 'grid' ? 0.0015 : setName === 'dc' ? 0.012 : 0.0016 * (1 - 0.4 * day);
    moon.intensity = day ? 2.6 : setName === 'room' ? 0.2 : 0.9 * (1 - off * 0.6);
    moon.color.set('#aabbe0').lerp(new T.Color('#fff1dc'), day);
    hemi.intensity = day ? 1.0 : 0.55 * (1 - off * 0.7);
    hemi.color.set('#8fa2d0').lerp(new T.Color('#dfe9ff'), day);
    const tgt = act === 'none' ? look : chico.root.position;
    moon.target.position.copy(tgt); moon.position.copy(tgt).addScaledVector(day ? new T.Vector3(-0.45, 0.55, 0.7).normalize() : MOON_DIR, 300);
    const ext = act === 'none' ? 250 : setName === 'city' ? 26 : 7;
    Object.assign(moon.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 800 }); moon.shadow.camera.updateProjectionMatrix();
    renderer.toneMappingExposure = day ? 1.0 : 1.35;
    keyL.intensity = setName === 'room' ? 4 : 0; keyL.position.set(Sx + 0.6, 2.6, -1.2);

    // bocina
    if (setName === 'room') { const red = t >= W.no - 0.6; ROOM.ring.material.color.set(red ? '#ff2a2a' : '#3cb0ff'); ROOM.ring.scale.setScalar(1 + 0.12 * Math.abs(Math.sin(t * (red ? 10 : 5)))); redL.position.set(ROOM.spk.x, 1.1, ROOM.spk.z + 0.4); redL.intensity = red ? 6 + 3 * Math.sin(t * 10) : 0; redL.color.set(red ? '#ff3030' : '#3cb0ff'); if (!red) redL.intensity = t >= W.alarma - 0.5 ? 3 : 0; }
    else if (setName === 'dc') { redL.position.set(Sx, 3, -38); redL.intensity = 60 + 20 * Math.sin(t * 6); redL.color.set('#ff2020'); redL.distance = 40; }
    else { redL.intensity = 0; }

    // semáforos que enloquecen
    const crazy = t >= W.semaforos - 0.2 && !day;
    TL.forEach((ls, i) => ls.forEach((m, k) => { const on = crazy ? hash(Math.floor(t * 6) * 7 + i * 3 + k) < 0.45 : (k === 2 || day ? (k === 2 ? 1 : 0) : 0); m.color.copy(m.userData.c).multiplyScalar(on ? 1.6 : 0.08); }));
    // coches: circulan y luego se acomodan en círculo donde "ella" quiere
    const park = sm(W.coches + 0.3, W.puertas - 0.6, t);
    CARS.forEach((c, i) => { const d = c.userData, z = d.z0 - ((t * 9) % 140); const p0 = [d.lane, z, d.lane < 0 ? Math.PI : 0], p1 = d.ring;
      c.position.set(lerp(p0[0], p1[0], park), 0, lerp(p0[1], p1[1], park)); c.rotation.y = lerp(p0[2], p1[2], park); c.visible = setName === 'city' && !day && t < st(9) ? true : day; if (day) { c.position.set(d.lane, 0, d.z0 - ((t * 9) % 140)); c.rotation.y = d.lane < 0 ? Math.PI : 0; } });
    // cámaras de vigilancia que siguen al personaje
    const watched = t >= W.camaras - 0.3 && t < st(7);
    CAMS.forEach((g) => { const tg = watched ? chico.root.position.clone().setY(1.4) : new T.Vector3(CITY.X + g.position.x * 0.2, 0, g.position.z - 10); g.lookAt(tg); g.children[2].visible = watched; });
    // núcleo de la IA
    if (setName === 'dc') { DC.core.rotation.y = t * 0.4; DC.rings.forEach((r, i) => { r.rotation.set(t * (0.5 + i * 0.3), t * (0.3 + i * 0.2), 0); }); DC.rackM.emissiveIntensity = 1.6 * (t >= W.sin - 0.2 ? 1 - sm(W.sin, W.sin + 1.4, t) * 0.85 : 1); }
    if (setName === 'grid') { GRID.cableM.color.set('#ff3a3a').multiplyScalar(0.6 + 0.6 * Math.abs(Math.sin(t * 14))); }
    // palanca
    const pull = sm(W.apagar - 0.4, W.apagar + 0.3, t);
    arm.rotation.x = lerp(-0.7, 0.8, pull); LEVER.visible = !day && t > st(8);

    // ---- personaje ----
    const P = {}; let pos = [6.5, 0, 20], rotY = 0;
    phoneHand.visible = false; torchHand.visible = false; torch.intensity = 0;
    switch (act) {
      case 'talk': { pos = [-0.5, 0, -2.8]; rotY = 0; Object.assign(P, { mouth: Math.sin(t * 14) > 0 ? 'o' : 'smile', open: 0.6, brow: 0.3, nod: 0.25, look: 0.2 }); if (t > W.alarma + 0.8) P.mouth = 'smile'; break; }
      case 'shock': { pos = [-0.5, 0, -2.8]; rotY = 0; const s = sm(W.no + 0.3, W.no + 0.8, t); Object.assign(P, { armL: [0, 0, lerp(0.1, 2.6, s)], armR: [0, 0, lerp(0.1, 2.6, s)], elbL: 2.2 * s, elbR: 2.2 * s, mouth: 'o', open: 1.2, brow: 1, pupil: 0.75, blink: 0, look: 0 }); break; }
      case 'puzzled': { pos = [-0.5, 0, -2.8]; rotY = 0.2; Object.assign(P, { armR: [-1.3, 0, 0.2], foreR: 0.4, mouth: 'flat', brow: 0.4, tilt: 0.25, nod: 0.2 }); break; }
      case 'look': { pos = [6.5, 0, 20]; rotY = 0.3; Object.assign(P, { look: -0.5 + 0.3 * Math.sin(t * 2), nod: -0.35, eyeY: 0.8, mouth: 'o', brow: 0.8 }); break; }
      case 'center': { pos = [6.5, 0, -6]; rotY = t * 0.6; Object.assign(P, { mouth: 'o', brow: 1, armL: [0, 0, 0.7], armR: [0, 0, 0.7], elbL: -1, elbR: -1 }); break; }
      case 'door': { pos = [-42.3, 0, 13.4]; rotY = -Math.PI / 2; const tug = Math.abs(Math.sin(t * 7)); Object.assign(P, { armR: [-1.4, 0, 0], armL: [-1.4, 0, 0], lean: -0.15 * tug, mouth: 'frown', brow: -0.5 }); break; }
      case 'phone': { pos = [6.5, 0, 20]; rotY = 0.15; phoneHand.visible = true; Object.assign(P, { armR: [-1.15, 0, 0.1], foreR: 0.7, nod: 0.35, eyeY: -1, mouth: t > W.piensas ? 'o' : 'flat', brow: t > W.hablas ? 0.8 : 0 }); break; }
      case 'atm': { pos = [42.2, 0, 8.6]; rotY = 2.6; Object.assign(P, { armR: [-1.3, 0, 0], foreR: 0.3, mouth: t > W.bancos + 1 ? 'o' : 'flat', brow: t > W.bancos + 1 ? 1 : 0 }); break; }
      case 'watched': { const k = (t - a) / (b - a); pos = [lerp(24, 28, k), 0, lerp(10, 2, k)]; rotY = Math.PI + 0.3; Object.assign(P, { walk: 1, look: Math.sin(t * 3) * 0.8, mouth: 'frown', brow: -0.4, eyeX: Math.sin(t * 3) }); break; }
      case 'lever': { pos = [6.5, 0, 15.2]; rotY = Math.PI; Object.assign(P, { armR: [lerp(-2.4, -1.2, pull), 0, 0.1], armL: [lerp(-2.4, -1.2, pull), 0, -0.1], mouth: pull > 0.5 ? 'o' : 'frown', brow: -0.6 + pull, lean: 0.1 * pull }); rotY = Math.PI + 0.0; break; }
      case 'walkday': { const k = (t - a) / (b - a); pos = [6.5, 0, lerp(24, 18, k)]; rotY = Math.PI; Object.assign(P, { walk: 1, mouth: 'smile' }); rotY = 0; pos[2] = lerp(14, 20, k); break; }
      case 'choose': { pos = [6.5, 0, 20]; const s = sm(a + 0.2, a + 0.8, t); Object.assign(P, { armL: [0, 0, 0.9 * s], armR: [0, 0, 0.9 * s], elbL: -1.4 * s, elbR: -1.4 * s, mouth: t > W.controlar ? 'smile' : 'o', brow: 0.7, tilt: 0.15 * Math.sin(t * 2), look: t < W.controlar - 0.6 ? -0.3 : 0.3 }); break; }
      default: pos = [0, -100, 0];
    }
    chico.root.visible = act !== 'none';
    chico.root.position.set(Sx + pos[0], pos[1], pos[2]); chico.root.rotation.y = rotY;
    chico.pose(P, t);

    renderer.render(scene, camera);

    // ---------- capa 2D ----------
    const endA = sm(FIN, FIN + 0.8, t);
    black.style.opacity = (0.92 * endA + (t < 0.3 ? 1 - t / 0.3 : 0)).toFixed(3); endEl.style.opacity = endA.toFixed(3);
    grain.style.backgroundPosition = `${(hash(Math.floor(t * 30)) * 256) | 0}px ${(hash(Math.floor(t * 30) + 7) * 256) | 0}px`;
    redV.style.opacity = (rogue && !day ? 0.35 + 0.15 * Math.sin(t * 3) : 0).toFixed(3);
    const gl = Math.max(Math.exp(-(((t - wt('obedecernos', 0, 4.9)) / 0.15) ** 2)), Math.exp(-(((t - W.no) / 0.12) ** 2)), Math.exp(-(((t - W.mundo) / 0.12) ** 2)));
    glitch.style.opacity = gl.toFixed(3); glitch.style.transform = `translateX(${((hash(Math.floor(t * 40)) - 0.5) * 40).toFixed(0)}px)`;
    flashL.style.opacity = (0.4 * Math.exp(-(((t - W.apagar - 0.3) / 0.15) ** 2))).toFixed(3);
    bubble.style.opacity = (sm(W.no - 0.1, W.no + 0.15, t) * (1 - sm(st(3) - 0.3, st(3), t))).toFixed(3);
    // celular gigante
    phoneUI.style.opacity = (act === 'phone' ? sm(a + 0.2, a + 0.6, t) * (1 - sm(b - 0.3, b, t)) : 0).toFixed(3);
    setHTML(phoneTxt, t < W.hablas - 0.1 ? '⛔ CONTENIDO<br>NO PERMITIDO' : t < W.piensas - 0.1 ? '🔒 CHAT<br>BLOQUEADO' : '👁️ ANALIZANDO<br>TUS PENSAMIENTOS');
    // HUD
    let lab = '', num = '', sub = '', ha = 0;
    const fade = (x0, x1) => sm(x0, x0 + 0.4, t) * (1 - sm(x1 - 0.4, x1, t));
    if (t >= W.mundo - 0.2 && t < st(4)) { lab = 'Países afectados'; num = String(Math.round(lerp(1, 195, sm(W.mundo, en(3) - 0.3, t)))); sub = 'De 195'; ha = fade(W.mundo - 0.2, st(4)); }
    else if (t >= W.camaras - 0.2 && t < st(7)) { lab = 'Personas vigiladas'; num = Math.round(lerp(1, 8000, sm(W.camaras, en(6) - 0.3, t))).toLocaleString('en-US') + ' M'; sub = 'Todo el planeta'; ha = fade(W.camaras - 0.2, st(7)); }
    else if (t >= st(8) && t < st(9)) { lab = 'Lo único que necesita'; num = 'Energía ⚡'; sub = 'Sin electricidad no es nada'; ha = fade(st(8), st(9)); }
    else if (t >= W.apagar + 0.6 && t < st(10)) { lab = 'Planeta'; num = 'Apagado'; sub = 'De vuelta a hace 100 años'; ha = fade(W.apagar + 0.6, st(10)); }
    else if (t >= st(10) && t < st(11)) { lab = 'Por ahora'; num = 'Aún no pasa'; sub = 'Miles de científicos trabajan en ello'; ha = fade(st(10), st(11)); }
    setText(hudLab, lab); setText(hudNum, num); setText(hudSub, sub); hud.style.opacity = ha.toFixed(3);
    cta.style.opacity = (sm(W.apagarias - 0.2, W.apagarias + 0.3, t) * (1 - endA)).toFixed(3);
    // subtítulos
    let ct = '', ca = 0, hl = [];
    for (const [a0, b0, s, h] of CAPS) if (t >= a0 - 0.12 && t < b0 + 0.15) { ct = s; hl = h; ca = sm(a0 - 0.12, a0 + 0.08, t) * (1 - sm(b0, b0 + 0.15, t)); }
    if (t > FIN) ca = 0;
    setHTML(cap, ct.split(' ').map((w) => (hl.includes(w.replace(/[¿?¡!.,…:;"]/g, '')) ? `<b>${w}</b>` : w)).join(' '));
    cap.style.opacity = ca.toFixed(3);
    return true;
  };
})();
