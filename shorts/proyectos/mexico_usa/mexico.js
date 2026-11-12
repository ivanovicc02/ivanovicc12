// "¿Qué pasaría si Estados Unidos comprara México?" — con el personaje del canal, estilo cinematográfico
// (luz cálida, desenfoque de lente real, materiales brillantes, subtítulos palabra por palabra).
(function () {
  const T = THREE;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const hash = (x) => { const s = Math.sin(x * 127.1) * 43758.5453; return s - Math.floor(s); };
  function rng(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const R = rng(1853);
  const W = 1080, H = 1920;

  const renderer = new T.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, W / H, 0.05, 4000);
  const fog = new T.Fog(0xe8c9a0, 60, 400); scene.fog = fog;
  const TX = window.makeTexturas(T, renderer);
  TX.entorno(scene, '#7aa0d0', '#f2d2a8', '#6a5a4a');

  function canvasTex(w, h, draw, rep = false) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; if (rep) tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.anisotropy = 8; tx.userData = { c }; return tx; }
  const mat = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.75 }, o));
  function box(p, w, h, d, m, x, y, z, sh = true) { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = sh; b.receiveShadow = true; p.add(b); return b; }
  const LINE = new T.ShaderMaterial({ side: T.BackSide, uniforms: { k: { value: 0.02 } }, vertexShader: 'uniform float k; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * k, 1.0); }', fragmentShader: 'void main(){ gl_FragColor = vec4(0.11,0.1,0.15,1.0); }' });
  const outline = (m) => { m.add(new T.Mesh(m.geometry, LINE)); return m; };

  // ---------- luces ----------
  const hemi = new T.HemisphereLight(0xffe6c8, 0x6a5040, 0.9); scene.add(hemi);
  const sun = new T.DirectionalLight(0xffd6a0, 3.2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3; scene.add(sun, sun.target);
  const SUN_DIR = new T.Vector3(-0.55, 0.42, 0.72).normalize();
  const lampL = new T.PointLight(0xffc27a, 0, 10, 1.6); lampL.castShadow = true; scene.add(lampL);

  // ---------- cielo ----------
  const skyG = new T.Group(); scene.add(skyG);
  const skyU = { top: { value: new T.Color('#5a8fd6') }, hor: { value: new T.Color('#f5c79a') }, sunDir: { value: SUN_DIR.clone() } };
  skyG.add(new T.Mesh(new T.SphereGeometry(3000, 40, 20), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, hor, sunDir; varying vec3 vD; void main(){ vec3 d = normalize(vD); vec3 c = mix(hor, top, smoothstep(-0.02, 0.5, d.y));
      float s = max(dot(d, sunDir), 0.); c += vec3(1.,.8,.55) * (pow(s, 10.) * .35 + pow(s, 300.) * 2.);
      gl_FragColor = vec4(c, 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` })));

  // ---------- personaje ----------
  const chico = window.makeChico(T); scene.add(chico.root);
  // billetes en la mano (pesos -> dólares)
  function billTex(usd) {
    return canvasTex(256, 120, (g, w, h) => {
      g.fillStyle = usd ? '#a9c7a0' : '#d9a6c8'; g.fillRect(0, 0, w, h);
      g.strokeStyle = usd ? '#2f5a34' : '#7a2f66'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = usd ? '#2f5a34' : '#7a2f66'; g.beginPath(); g.ellipse(w / 2, h / 2, 34, 40, 0, 0, Math.PI * 2); g.fill();
      g.font = 'bold 34px Inter'; g.fillText(usd ? '$100' : '$500', 18, 46); g.font = 'bold 16px Inter'; g.fillText(usd ? 'DÓLARES' : 'PESOS', w - 92, h - 18);
    });
  }
  const PESO = billTex(false), DOLAR = billTex(true);
  const billM = new T.MeshStandardMaterial({ map: PESO, side: T.DoubleSide, roughness: 0.7 });
  const bills = new T.Group(); for (let i = 0; i < 5; i++) { const b = new T.Mesh(new T.PlaneGeometry(0.16, 0.075), billM); b.position.set(0.02 * i - 0.04, 0.01 * i, 0); b.rotation.z = -0.4 + i * 0.18; bills.add(b); } bills.position.set(0, -0.36, 0.07); bills.rotation.x = -1.0; chico.hands[1].add(bills);
  // pasaporte (verde -> azul)
  const passTex = (blue) => canvasTex(200, 280, (g, w, h) => { g.fillStyle = blue ? '#1d2f5e' : '#1f4d34'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8b55a'; g.textAlign = 'center'; g.font = 'bold 22px Inter'; g.fillText(blue ? 'PASSPORT' : 'PASAPORTE', w / 2, 60); g.beginPath(); g.arc(w / 2, 140, 40, 0, Math.PI * 2); g.lineWidth = 5; g.strokeStyle = '#d8b55a'; g.stroke(); g.font = 'bold 18px Inter'; g.fillText(blue ? 'U.S.A.' : 'MÉXICO', w / 2, 230); });
  const PASS_G = passTex(false), PASS_B = passTex(true);
  const passM = new T.MeshStandardMaterial({ map: PASS_G, roughness: 0.5 });
  const pass = new T.Mesh(new T.BoxGeometry(0.09, 0.125, 0.012), [mat('#e8e2d0'), mat('#e8e2d0'), mat('#e8e2d0'), mat('#e8e2d0'), passM, passM]);
  const passG = new T.Group(); passG.add(pass); passG.position.set(0, -0.37, 0.08); passG.rotation.x = -1.25; chico.hands[1].add(passG);
  // taco en la mano
  const tacoG = new T.Group(); { const tort = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.02, 20, 1, false, 0, Math.PI), mat('#e8c27a', { roughness: 0.9 })); tort.rotation.set(Math.PI / 2, 0, Math.PI / 2); tacoG.add(tort); const fill = new T.Mesh(new T.BoxGeometry(0.11, 0.03, 0.02), mat('#8a3a1c')); fill.position.y = 0.035; tacoG.add(fill); const cil = new T.Mesh(new T.BoxGeometry(0.1, 0.01, 0.018), mat('#3f8a3a')); cil.position.y = 0.052; tacoG.add(cil); } tacoG.position.set(0, -0.36, 0.07); chico.hands[1].add(tacoG);

  // ---------- sets ----------
  const SETS = {};
  const set = (name, X) => { const g = new T.Group(); g.position.x = X; scene.add(g); SETS[name] = { X, g }; return SETS[name]; };

  // === pueblo mexicano ===
  const P = set('pueblo', 0), PG = P.g;
  const cob = canvasTex(512, 512, (g, w, h) => { const r2 = rng(2); g.fillStyle = '#6e6258'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? 0 : -24; x < w; x += 48) { const v = 120 + r2() * 50; g.fillStyle = `rgb(${v + 10},${v},${v - 12})`; g.beginPath(); g.roundRect(x + 3, y + 3, 42, 26, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 8, y + 6, 26, 5); } }, true);
  cob.repeat.set(4, 60);
  const street = new T.Mesh(new T.PlaneGeometry(10, 240), mat('#ffffff', { map: cob, roughness: 0.6 })); street.rotation.x = -Math.PI / 2; street.position.z = -90; street.receiveShadow = true; PG.add(street);
  const banq = TX.banqueta(); banq.repeat.set(1, 60);
  for (const s of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(2.4, 240), mat('#ffffff', { map: banq })); w.rotation.x = -Math.PI / 2; w.position.set(s * 6.2, 0.15, -90); w.receiveShadow = true; PG.add(w); box(PG, 0.25, 0.15, 240, mat('#cfc6b8'), s * 5.05, 0.075, -90); }
  const plaster = (c) => { const t = canvasTex(256, 256, (g, w, h) => { const r2 = rng(c.length); g.fillStyle = c; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${r2() < 0.5 ? '0,0,0' : '255,255,255'},.05)`; g.fillRect(r2() * w, r2() * h, 3, 3); } g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(0, h - 22, w, 22); }, true); return t; };
  const HOUSES = ['#e8a33c', '#d9534f', '#3fa7a0', '#f1d36b', '#8e6bbf', '#e57aa3', '#5aa0d8', '#f0eadc'];
  const winM = mat('#2c3b4a', { roughness: 0.1, metalness: 0.6 }), frameM = mat('#f4efe4'), doorM = mat('#6b4126', { roughness: 0.6 });
  for (const s of [-1, 1]) for (let z = 8, i = 0; z > -200; i++) {
    const wd = 5 + R() * 4, hh = 4 + R() * 3.5, c = HOUSES[(i * 3 + (s > 0 ? 1 : 0)) % HOUSES.length], m = mat('#ffffff', { map: plaster(c), roughness: 0.9 });
    m.map.repeat.set(wd / 4, hh / 4);
    const x = s * 9.9, cz = z - wd / 2;
    box(PG, 5, hh, wd, m, x, hh / 2, cz); box(PG, 5.2, 0.3, wd + 0.2, mat('#f4efe4'), x, hh + 0.15, cz);
    const fx = x - s * 2.52;
    box(PG, 0.08, 2.4, 1.3, doorM, fx, 1.2, cz + wd * 0.2, false); box(PG, 0.1, 2.6, 1.5, frameM, fx + s * 0.02, 1.3, cz + wd * 0.2, false);
    for (const dz of [-wd * 0.22]) { box(PG, 0.08, 1.2, 1.0, winM, fx, 2.0, cz + dz, false); box(PG, 0.1, 1.4, 1.2, frameM, fx + s * 0.02, 2.0, cz + dz, false); }
    if (hh > 6) { box(PG, 0.08, 1.2, 1.0, winM, fx, hh - 1.4, cz, false); box(PG, 0.6, 0.12, 1.6, mat('#3a2a20'), fx - s * 0.3, hh - 2.1, cz, false); }
    z -= wd + 0.1;
  }
  // papel picado y foquitos
  const pp = ['#e94f6c', '#f6c344', '#3fb5a8', '#8e6bbf', '#ff8a3d', '#5aa0d8'];
  const ppTex = pp.map((c) => canvasTex(128, 160, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, h - 20); for (let x = w; x >= 0; x -= 16) g.lineTo(x, h - (x / 16) % 2 * 20); g.closePath(); g.fill(); g.globalCompositeOperation = 'destination-out'; const r2 = rng(c.length * 7); for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(14 + r2() * 100, 18 + r2() * 110, 4 + r2() * 8, 0, Math.PI * 2); g.fill(); } g.fillRect(20, 60, 88, 6); }));
  const BULBS = [];
  for (let z = 4; z > -60; z -= 7) for (let i = -9; i <= 9; i++) {
    const x = i * 0.85, y = 6.3 - Math.cos((i / 9) * Math.PI / 2) * 0 - (1 - (i / 9) ** 2) * 0.9;
    const f = new T.Mesh(new T.PlaneGeometry(0.6, 0.75), new T.MeshStandardMaterial({ map: ppTex[(i + 9 + z) % 6 & 7 % 6] || ppTex[0], transparent: true, side: T.DoubleSide, alphaTest: 0.3, roughness: 0.8 }));
    f.position.set(x, y - 0.4, z); f.rotation.y = 0.05 * Math.sin(i + z); f.castShadow = true; PG.add(f);
    if (i % 3 === 0) { const b = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshStandardMaterial({ color: '#fff3d0', emissive: '#ffb84a', emissiveIntensity: 0 })); b.position.set(x, y + 0.05, z - 3.5); PG.add(b); BULBS.push(b); }
  }
  // espectacular "SE VENDE"
  const signTex = canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#f4efe4'; g.fillRect(0, 0, w, h); g.fillStyle = '#c62f2f'; g.fillRect(0, 0, w, 120); g.fillStyle = '#fff'; g.font = 'bold 96px Inter'; g.textAlign = 'center'; g.fillText('SE VENDE', w / 2, 96); g.fillStyle = '#1a1a1a'; g.font = 'bold 150px Inter'; g.fillText('MÉXICO', w / 2, 330); g.font = '600 48px Inter'; g.fillText('INFORMES: WASHINGTON D.C.', w / 2, 440); });
  const billboard = new T.Group(); billboard.position.set(0, 0, -24); PG.add(billboard);
  box(billboard, 0.3, 7, 0.3, mat('#3a3d42', { metalness: 0.7 }), -3, 3.5, 0); box(billboard, 0.3, 7, 0.3, mat('#3a3d42', { metalness: 0.7 }), 3, 3.5, 0);
  const bb = new T.Mesh(new T.PlaneGeometry(8, 4), new T.MeshStandardMaterial({ map: signTex, roughness: 0.6 })); bb.position.set(0, 7.5, 0.2); billboard.add(bb);
  const stamp = new T.Mesh(new T.PlaneGeometry(5.2, 1.6), new T.MeshBasicMaterial({ map: canvasTex(512, 160, (g, w, h) => { g.strokeStyle = '#d61f1f'; g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20); g.fillStyle = '#d61f1f'; g.font = 'bold 110px Inter'; g.textAlign = 'center'; g.fillText('VENDIDO', w / 2, 120); }), transparent: true, depthWrite: false })); stamp.position.set(0.3, 7.4, 0.25); stamp.rotation.z = 0.18; billboard.add(stamp);
  // tiendita
  const shop = new T.Group(); shop.position.set(-7.4, 0, -3); shop.rotation.y = Math.PI / 2; PG.add(shop);
  { const sh = new T.Mesh(new T.PlaneGeometry(3.6, 0.7), new T.MeshBasicMaterial({ map: canvasTex(512, 100, (g, w, h) => { g.fillStyle = '#2f7d4f'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff6d8'; g.font = 'bold 64px Inter'; g.textAlign = 'center'; g.fillText('ABARROTES', w / 2, 74); }) })); sh.position.set(0, 3.2, 0.05); shop.add(sh);
    box(shop, 3.4, 2.7, 0.1, mat('#1d1a18'), 0, 1.4, -0.3, false);
    for (let r = 0; r < 4; r++) { box(shop, 3.2, 0.06, 0.5, mat('#8a6040'), 0, 0.5 + r * 0.6, -0.1); for (let k = 0; k < 9; k++) box(shop, 0.25, 0.35, 0.25, mat(['#e94f4f', '#f6c344', '#3fb5a8', '#ffffff', '#5aa0d8', '#ff8a3d'][(k + r) % 6], { roughness: 0.4 }), -1.4 + k * 0.35, 0.72 + r * 0.6, -0.05); } }
  const PRICE = new T.Mesh(new T.PlaneGeometry(0.9, 0.45), new T.MeshBasicMaterial({ map: canvasTex(256, 128, () => {}) })); PRICE.position.set(1.0, 1.6, 0.25); shop.add(PRICE);
  function drawPrice(txt, red) { const c = PRICE.material.map.userData.c, g = c.getContext('2d'); g.fillStyle = red ? '#fff0f0' : '#fffbe8'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#c62f2f'; g.lineWidth = 6; g.strokeRect(4, 4, 248, 120); g.fillStyle = '#1a1a1a'; g.font = 'bold 44px Inter'; g.textAlign = 'center'; g.fillText(txt, 128, 80); PRICE.material.map.needsUpdate = true; }
  // puesto de tacos
  const stand = new T.Group(); stand.position.set(3.2, 0, -6); PG.add(stand);
  { box(stand, 2.2, 1.0, 1.0, mat('#d9d2c4', { metalness: 0.5, roughness: 0.3 }), 0, 0.5, 0); box(stand, 2.3, 0.06, 1.1, mat('#9aa0a6', { metalness: 0.8, roughness: 0.25 }), 0, 1.03, 0);
    const um = new T.Mesh(new T.ConeGeometry(1.8, 0.7, 12, 1, true), new T.MeshStandardMaterial({ color: '#d9473a', side: T.DoubleSide })); um.position.y = 2.6; stand.add(um); box(stand, 0.06, 2.5, 0.06, mat('#555'), 0, 1.3, 0);
    const ts = new T.Mesh(new T.PlaneGeometry(1.6, 0.4), new T.MeshBasicMaterial({ map: canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#f6c344'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a1f1f'; g.font = 'bold 44px Inter'; g.textAlign = 'center'; g.fillText('TACOS', w / 2, 48); }) })); ts.position.set(0, 0.6, 0.51); stand.add(ts);
    const lamp = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), new T.MeshStandardMaterial({ color: '#fff3d0', emissive: '#ffb84a', emissiveIntensity: 3 })); lamp.position.set(0, 2.1, 0); stand.add(lamp); }
  // balón
  const ball = new T.Mesh(new T.SphereGeometry(0.11, 24, 16), new T.MeshStandardMaterial({ map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#fafafa'; g.fillRect(0, 0, w, h); g.fillStyle = '#151515'; for (let i = 0; i < 12; i++) { const x = (i % 6) * 44 + (i > 5 ? 22 : 0) + 10, y = i > 5 ? 90 : 34; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); } g.fill(); } }), roughness: 0.4 })); ball.castShadow = true; PG.add(ball);
  // gasolinera (anuncio de precios)
  const gas = new T.Group(); gas.position.set(4.2, 0, -14); PG.add(gas);
  box(gas, 0.3, 5, 0.3, mat('#3a3d42', { metalness: 0.7 }), 0, 2.5, 0);
  const gasSign = new T.Mesh(new T.PlaneGeometry(2.6, 2.6), new T.MeshBasicMaterial({ map: canvasTex(320, 320, () => {}), toneMapped: false })); gasSign.position.set(0, 5.4, 0.2); gas.add(gasSign);
  function drawGas(v) { const c = gasSign.material.map.userData.c, g = c.getContext('2d'); g.fillStyle = '#1e7a3c'; g.fillRect(0, 0, 320, 320); g.fillStyle = '#fff'; g.font = 'bold 44px Inter'; g.textAlign = 'center'; g.fillText('GASOLINA', 160, 60); g.fillStyle = '#111'; g.fillRect(20, 90, 280, 200); g.fillStyle = v > 30 ? '#ff4a4a' : '#ffd23f'; g.font = 'bold 110px Inter'; g.fillText('$' + v.toFixed(1), 160, 230); gasSign.material.map.needsUpdate = true; }
  // avión
  const plane = new T.Group(); { const fus = new T.Mesh(new T.CylinderGeometry(0.6, 0.5, 9, 12), mat('#f4f6f8', { metalness: 0.3, roughness: 0.3 })); fus.rotation.z = Math.PI / 2; plane.add(fus); box(plane, 2, 0.15, 10, mat('#e0e4e8'), 0, 0, 0); box(plane, 1.4, 1.6, 0.15, mat('#2f5bd0'), -4, 0.9, 0); } plane.scale.setScalar(1.5); PG.add(plane);

  // === despacho con mapa de 1853 ===
  const DS = set('despacho', 10000), DG = DS.g;
  { const fl = new T.Mesh(new T.PlaneGeometry(20, 20), mat('#ffffff', { map: (() => { const t = TX.madera(); t.repeat.set(3, 3); return t; })(), roughness: 0.5 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; DG.add(fl);
    const wallT = TX.pared('#5a3a2a'); wallT.repeat.set(3, 1); box(DG, 20, 6, 0.2, mat('#ffffff', { map: wallT }), 0, 3, -3);
    for (let i = 0; i < 18; i++) box(DG, 0.18, 0.25 + R() * 0.1, 0.22, mat(['#7a2f2f', '#2f4a7a', '#3a6a3a', '#8a6a2a'][i % 4]), -2.8 + i * 0.2, 2.15, -2.75);
    box(DG, 3.8, 0.08, 0.3, mat('#4a2c1c'), -1.1, 2.0, -2.75);
    const desk = mat('#5a3420', { roughness: 0.35, envMapIntensity: 0.8 }); box(DG, 2.6, 0.08, 1.4, desk, 0, 0.92, 0); for (const [x, z] of [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]]) box(DG, 0.08, 0.9, 0.08, desk, x, 0.45, z);
    const lampG = new T.Group(); lampG.position.set(0.95, 0.96, -0.4); DG.add(lampG); box(lampG, 0.04, 0.5, 0.04, mat('#c9a050', { metalness: 0.8, roughness: 0.3 }), 0, 0.25, 0); const sh = new T.Mesh(new T.ConeGeometry(0.2, 0.22, 16, 1, true), mat('#2f5a3a', { side: T.DoubleSide })); sh.position.y = 0.55; lampG.add(sh); DS.lampPos = new T.Vector3(10000 + 0.95, 1.4, -0.4); }
  const MAP1853 = new T.Mesh(new T.PlaneGeometry(1.5, 1.0), new T.MeshStandardMaterial({ map: canvasTex(900, 600, () => {}), roughness: 0.9 })); MAP1853.rotation.x = -Math.PI / 2; MAP1853.position.set(-0.15, 0.965, 0.05); MAP1853.receiveShadow = true; DG.add(MAP1853);
  const coin = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.01, 40), [new T.MeshStandardMaterial({ color: '#c9cdd2', metalness: 0.95, roughness: 0.25 }), new T.MeshStandardMaterial({ map: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#c9cdd2'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9b44a'; g.beginPath(); g.arc(64, 64, 42, 0, Math.PI * 2); g.fill(); g.fillStyle = '#7a5a10'; g.font = 'bold 46px Inter'; g.textAlign = 'center'; g.fillText('$10', 64, 80); }), metalness: 0.9, roughness: 0.25 }), new T.MeshStandardMaterial({ color: '#d9b44a', metalness: 0.95, roughness: 0.25 })]);
  coin.castShadow = true; DG.add(coin);

  // === frontera (muro en el desierto) ===
  const FR = set('frontera', 20000), FG = FR.g;
  { const sand = canvasTex(512, 512, (g, w, h) => { const r2 = rng(4); g.fillStyle = '#c9a074'; g.fillRect(0, 0, w, h); for (let i = 0; i < 30000; i++) { const v = 170 + r2() * 50; g.fillStyle = `rgba(${v + 30},${v},${v - 40},.3)`; g.fillRect(r2() * w, r2() * h, 2, 2); } }, true); sand.repeat.set(60, 60);
    const gr = new T.Mesh(new T.PlaneGeometry(800, 800), mat('#ffffff', { map: sand, roughness: 0.95 })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; FG.add(gr);
    const rust = mat('#7a4a2e', { roughness: 0.6, metalness: 0.5 });
    const geos = []; for (let x = -200; x <= 200; x += 0.42) { const g = new T.BoxGeometry(0.16, 9, 0.16); g.translate(x, 4.5, -3); geos.push(g); }
    const wallM = new T.Mesh((() => { const parts = geos.map((g) => g.toNonIndexed()); const out = new T.BufferGeometry(); for (const nm of ['position', 'normal']) { const arr = new Float32Array(parts.reduce((s, p) => s + p.attributes[nm].array.length, 0)); let o = 0; for (const p of parts) { arr.set(p.attributes[nm].array, o); o += p.attributes[nm].array.length; } out.setAttribute(nm, new T.BufferAttribute(arr, 3)); } return out; })(), rust); wallM.castShadow = wallM.receiveShadow = true; FG.add(wallM);
    box(FG, 400, 0.4, 0.5, rust, 0, 9.1, -3);
    for (let i = 0; i < 40; i++) { const m = new T.Mesh(new T.ConeGeometry(30 + R() * 50, 20 + R() * 40, 6), mat('#9a6a4a', { flatShading: true })); m.position.set(-300 + i * 16 + R() * 10, 0, -200 - R() * 150); FG.add(m); }
    for (let i = 0; i < 30; i++) { const c = new T.Mesh(new T.CapsuleGeometry(0.18, 1.2, 4, 8), mat('#4f7a3a')); c.position.set(-30 + R() * 60, 0.8, 2 + R() * 30); c.castShadow = true; FG.add(c); } }

  // === plaza con asta bandera ===
  const PL = set('plaza', 30000), PLG = PL.g;
  { const st = canvasTex(512, 512, (g, w, h) => { const r2 = rng(6); for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { const v = 170 + r2() * 30; g.fillStyle = `rgb(${v},${v - 8},${v - 20})`; g.fillRect(x, y, 64, 64); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x, y, 64, 2); g.fillRect(x, y, 2, 64); } }, true); st.repeat.set(40, 40);
    const gr = new T.Mesh(new T.PlaneGeometry(300, 300), mat('#ffffff', { map: st, roughness: 0.55 })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; PLG.add(gr);
    const stoneM = mat('#d8c8b0', { roughness: 0.8 }), darkM = mat('#3a2e28');
    box(PLG, 80, 22, 6, stoneM, 0, 11, -90); for (const s of [-1, 1]) { box(PLG, 9, 42, 9, stoneM, s * 30, 21, -88); const d = new T.Mesh(new T.SphereGeometry(4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#c9b48a')); d.position.set(s * 30, 42, -88); PLG.add(d); }
    for (let i = -3; i <= 3; i++) box(PLG, 3, 8, 0.4, darkM, i * 8, 6, -86.8, false);
    const dome = new T.Mesh(new T.SphereGeometry(8, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#c9b48a')); dome.position.set(0, 22, -95); PLG.add(dome);
    box(PLG, 0.6, 1.2, 0.6, stoneM, 0, 0.6, -6); const pole = new T.Mesh(new T.CylinderGeometry(0.12, 0.18, 22, 12), mat('#c9cdd2', { metalness: 0.9, roughness: 0.25 })); pole.position.set(0, 11, -6); pole.castShadow = true; PLG.add(pole); }
  // banderas ondeando
  function flagTex(kind, stars = 50) {
    return canvasTex(600, 360, (g, w, h) => {
      if (kind === 'mx') { g.fillStyle = '#006847'; g.fillRect(0, 0, w / 3, h); g.fillStyle = '#ffffff'; g.fillRect(w / 3, 0, w / 3, h); g.fillStyle = '#ce1126'; g.fillRect(2 * w / 3, 0, w / 3, h);
        g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(w / 2, h / 2 - 6, 34, 42, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#3f7a3a'; g.lineWidth = 8; g.beginPath(); g.arc(w / 2, h / 2 + 4, 52, 0.3, Math.PI - 0.3); g.stroke(); return; }
      for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#b22234'; g.fillRect(0, (i * h) / 13, w, h / 13 + 1); }
      const cw = w * 0.42, ch = (h * 7) / 13; g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, cw, ch);
      const cols = Math.ceil(Math.sqrt(stars * 1.6)), rows = Math.ceil(stars / cols); g.fillStyle = '#fff'; let k = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols && k < stars; c++, k++) { const x = (c + 0.5) * cw / cols, y = (r + 0.5) * ch / rows, s = Math.min(cw / cols, ch / rows) * 0.32; g.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5 - Math.PI / 2, rr = j % 2 ? s * 0.45 : s; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
    });
  }
  const FLAG_MX = flagTex('mx'), FLAGS_US = {}; const usFlag = (n) => (FLAGS_US[n] = FLAGS_US[n] || flagTex('us', n));
  const flagGeo = new T.PlaneGeometry(4.2, 2.5, 30, 16); flagGeo.translate(2.1, 0, 0);
  const flagBase = Float32Array.from(flagGeo.attributes.position.array);
  const flag = new T.Mesh(flagGeo, new T.MeshStandardMaterial({ map: FLAG_MX, side: T.DoubleSide, roughness: 0.75 })); flag.castShadow = true; PLG.add(flag);

  // ---------- post: desenfoque de lente ----------
  const rt = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: 4 }); rt.depthTexture = new T.DepthTexture(W, H); rt.depthTexture.type = T.UnsignedIntType;
  const post = new T.ShaderMaterial({
    uniforms: { tC: { value: rt.texture }, tD: { value: rt.depthTexture }, near: { value: camera.near }, far: { value: camera.far }, focus: { value: 3 }, ap: { value: 14 }, maxB: { value: 22 }, res: { value: new T.Vector2(W, H) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tC, tD; uniform float near, far, focus, ap, maxB; uniform vec2 res; varying vec2 vUv;
      float lin(float d){ float z = d * 2. - 1.; return 2. * near * far / (far + near - z * (far - near)); }
      float coc(float d){ return clamp(abs(d - focus) / d * ap, 0., maxB); }
      void main(){ float d = lin(texture2D(tD, vUv).x); float c0 = coc(d); vec3 acc = texture2D(tC, vUv).rgb; float ws = 1.;
        for (int i = 1; i < 40; i++) { float fi = float(i); float a = fi * 2.39996; float r = sqrt(fi / 40.) * maxB; vec2 uv2 = vUv + vec2(cos(a), sin(a)) * r / res;
          float d2 = lin(texture2D(tD, uv2).x); float c2 = coc(d2); float cr = (d2 < d) ? c2 : min(c0, c2); float w = smoothstep(r - 1.5, r + 1.5, cr); acc += texture2D(tC, uv2).rgb * w; ws += w; }
        vec3 c = acc / ws; c = mix(c, c * vec3(1.06, 1.0, 0.92), 0.6);
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const pScene = new T.Scene(), pCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1); pScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), post));

  // ---------- mapa 2D (SVG) para la frontera ----------
  const MX = [[-117.1, 32.5], [-114.7, 32.7], [-111, 31.3], [-108.2, 31.3], [-108.2, 31.8], [-106.5, 31.8], [-104.5, 29.6], [-103, 29], [-101.4, 29.8], [-99.5, 27.5], [-97.2, 25.9], [-97.7, 24], [-97.8, 22.2], [-97.2, 20.6], [-96.1, 19.1], [-94.8, 18.5], [-92.5, 18.6], [-91, 18.9], [-90.5, 19.8], [-90.4, 21], [-88.5, 21.6], [-87, 21.5], [-87.5, 19.5], [-88.3, 18.4], [-89.1, 17.9], [-91.4, 17.3], [-90.4, 16], [-92.2, 15], [-93.9, 16.1], [-95.2, 16.2], [-96.5, 15.7], [-98.6, 16.4], [-99.9, 16.8], [-101.6, 17.7], [-103.5, 18.3], [-104.9, 19.4], [-105.6, 20.5], [-105.3, 21.6], [-106.4, 23.2], [-108.4, 25.3], [-109.4, 26.6], [-110.8, 27.9], [-112.2, 29.4], [-112.8, 30.9], [-114.7, 31.7], [-114.4, 30.2], [-113.4, 29], [-112.6, 27.6], [-111.6, 26.2], [-110.6, 24.6], [-109.9, 22.9], [-111, 24.2], [-112.1, 24.8], [-112.2, 26.2], [-114.1, 27.6], [-114.6, 28.5], [-115.8, 30.4], [-116.6, 31.6]];
  const US = [[-124.7, 48.4], [-124, 46], [-124.4, 42], [-123.8, 39.8], [-122.5, 37.7], [-120.6, 34.6], [-118.3, 33.8], [-117.1, 32.5], [-114.7, 32.7], [-111, 31.3], [-108.2, 31.3], [-108.2, 31.8], [-106.5, 31.8], [-104.5, 29.6], [-103, 29], [-101.4, 29.8], [-99.5, 27.5], [-97.2, 25.9], [-97.4, 27.8], [-94.7, 29.4], [-91, 29.2], [-89.4, 29], [-88, 30.4], [-85, 29.7], [-83, 29], [-82.6, 27.5], [-81.8, 26], [-80.4, 25.2], [-80.1, 26.9], [-81.4, 30.7], [-79.1, 33.4], [-76.5, 34.7], [-75.5, 35.6], [-76, 37], [-74, 40.5], [-70, 41.6], [-70.7, 43], [-67, 44.8], [-69.2, 47.4], [-71.5, 45], [-75, 45], [-79, 43.3], [-82.5, 41.7], [-83.5, 46], [-89.5, 48], [-95, 49], [-123, 49]];
  const CA = [[-92.2, 15], [-91.4, 17.3], [-89.1, 17.9], [-88.3, 16], [-87, 15.8], [-83.2, 15], [-83.6, 11], [-85.7, 11.2], [-87.5, 13], [-89.5, 13.5], [-91.5, 13.9]];
  const BORDER = MX.slice(0, 11), GT = [[-92.2, 15], [-90.4, 16], [-91.4, 17.3], [-89.1, 17.9], [-88.3, 18.4]];
  const px = ([lo, la]) => `${((lo + 126) * 16).toFixed(1)},${((50 - la) * 16).toFixed(1)}`;
  const poly = (pts) => 'M' + pts.map(px).join('L') + 'Z', line = (pts) => 'M' + pts.map(px).join('L');
  const svg = document.getElementById('mapa');
  svg.innerHTML = `<rect width="1100" height="660" fill="#bcd7e8"/><path d="${poly(US)}" fill="#e9dcc3" stroke="#6a5a48" stroke-width="2"/><path id="mxp" d="${poly(MX)}" fill="#cfe3c6" stroke="#6a5a48" stroke-width="2"/><path d="${poly(CA)}" fill="#e2d8c8" stroke="#6a5a48" stroke-width="2"/>
    <path id="b1" d="${line(BORDER)}" fill="none" stroke="#e02525" stroke-width="9" stroke-dasharray="14 8"/><path id="b2" d="${line(GT)}" fill="none" stroke="#e02525" stroke-width="9" stroke-dasharray="14 8" opacity="0"/>
    <text x="300" y="250" font-family="Inter" font-weight="800" font-size="40" fill="#5a4a38">ESTADOS UNIDOS</text><text id="mxt" x="400" y="470" font-family="Inter" font-weight="800" font-size="34" fill="#3a5a30">MÉXICO</text><text x="640" y="610" font-family="Inter" font-weight="700" font-size="22" fill="#5a4a38">GUATEMALA</text>`;
  // mapa antiguo de 1853 (textura del despacho)
  { const c = MAP1853.material.map.userData.c, g = c.getContext('2d'), w = 900, h = 600;
    const gr = g.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, 520); gr.addColorStop(0, '#efdcb0'); gr.addColorStop(1, '#b8945c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const q = ([lo, la]) => [(lo + 126) * 13 - 10, (50 - la) * 13 + 40];
    const fillP = (pts, col) => { g.beginPath(); pts.forEach((p, i) => { const [x, y] = q(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 2; g.stroke(); };
    fillP(US, 'rgba(160,120,70,.25)'); fillP(MX, 'rgba(120,140,70,.25)');
    const mes = [[-111, 31.3], [-108.2, 31.3], [-108.2, 31.8], [-106.5, 31.8], [-106.6, 32.4], [-114.6, 32.7]];
    fillP(mes, 'rgba(200,40,30,.55)'); g.fillStyle = '#5a1a10'; g.font = 'bold italic 26px serif'; g.fillText('La Mesilla · 1853', 140, 170);
    g.font = 'italic 22px serif'; g.fillStyle = '#4a2a10'; g.fillText('$10,000,000', 200, 205); MAP1853.material.map.needsUpdate = true; }

  // ---------- HTML ----------
  const $ = (id) => document.getElementById(id);
  const cap = $('cap'), hud = $('hud'), hudLab = hud.querySelector('.lab'), hudNum = hud.querySelector('.num'), hudSub = hud.querySelector('.sub'), mapBox = $('mapbox'), cta = $('cta'), black = $('black'), endEl = $('end'), grain = $('grain'), flashL = $('flash');
  grain.style.backgroundImage = `url(${TX.granoURL()})`;
  const setText = (el, s) => { if (el.__t !== s) { el.textContent = s; el.__t = s; } };

  let S = {}, WORDS = [], FIN = 70, D = null, SH = [], WT = {}, GROUPS = [];
  const st = (k) => S[k][0], en = (k) => S[k][1];
  const key = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  function wt(w, n = 0, d = 0) { let c = 0; for (const x of WORDS) if (key(x.w) === key(w) && c++ === n) return x.start; return d; }
  window.loadProject = (data) => {
    D = data; S = data.scenes; WORDS = data.words; FIN = data.fin;
    // grupos de subtítulo: hasta 4 palabras, cortando en puntuación
    let cur = []; WORDS.forEach((w, i) => { cur.push(i); if (/[.?!…,:;]$/.test(w.w) || cur.length >= 4) { GROUPS.push(cur); cur = []; } }); if (cur.length) GROUPS.push(cur);
    WT = { comprara: wt('comprara', 0, 3), y1853: wt('1853', 0, 8.5), mesilla: wt('mesilla', 0, 14), peso: wt('peso', 0, 20.9), dolares: wt('dolares', 1, 25.7), azul: wt('azul', 0, 27.9), nueva: wt('nueva', 0, 29.4), mitad: wt('mitad', 0, 33.9), guate: wt('guatemala', 0, 36.6),
      e32: wt('32', 0, 39.3), m400: wt('400', 0, 43.5), tacos: wt('tacos', 0, 48.5), futbol: wt('futbol', 0, 50.9), renta: wt('renta', 0, 55.7), gasolina: wt('gasolina', 0, 57.1), existiria: wt('existiria', 0, 62.1), venta: wt('venta', 0, 69.4), aceptarias: wt('aceptarias', 0, 71.4) };
    const X0 = 0;
    SH = [
      [0, st(2), 'pueblo', [1.3, 1.75, 4.2], [1.1, 1.7, 3.8], [0, 4.2, -24], [0, 4.0, -24], 'sign'],
      [st(2), st(3), 'despacho', [-0.2, 1.75, 1.6], [0.2, 1.45, 1.1], [-0.2, 0.95, 0], [-0.3, 0.95, -0.05], 'desk'],
      [st(3), st(4), 'pueblo', [-3.3, 1.55, -4.4], [-3.6, 1.5, -4.0], [-6.0, 1.25, -1.8], [-6.0, 1.25, -1.8], 'shop'],
      [st(4), st(5), 'pueblo', [0.9, 1.55, 3.6], [0.7, 1.5, 3.0], [0, 1.45, 1], [0, 2.5, 0], 'passport'],
      [st(5), WT.mitad + 0.2, 'frontera', [3.6, 1.6, 6.0], [2.6, 1.8, 5.2], [0, 1.6, 0], [0, 3, -3], 'wall'],
      [WT.mitad + 0.2, st(6), 'frontera', [8, 2, 10], [7, 2.2, 9], [0, 3, -3], [0, 3, -3], 'none'],
      [st(6), st(7), 'plaza', [7, 3, 15], [6, 3.5, 13], [1.5, 13, -6], [1.5, 14, -6], 'none'],
      [st(7), WT.tacos - 0.2, 'pueblo', [1.6, 1.6, -0.6], [1.3, 1.55, -1.1], [0.8, 1.3, -5], [0.8, 1.3, -5], 'wave'],
      [WT.tacos - 0.2, WT.futbol - 0.2, 'pueblo', [1.4, 1.6, -2.0], [1.5, 1.55, -2.4], [2.6, 1.3, -5.2], [2.6, 1.3, -5.2], 'taco'],
      [WT.futbol - 0.2, st(8), 'pueblo', [2.4, 1.1, -1.0], [2.2, 1.2, -1.4], [0.8, 0.8, -5.5], [0.8, 1.0, -7], 'kick'],
      [st(8), st(9), 'pueblo', [1.4, 1.4, -8.6], [1.2, 1.5, -9.2], [3.4, 3.8, -14], [3.6, 4.6, -14], 'gas'],
      [st(9), st(10), 'plaza', [1.8, 1.5, 0.4], [1.4, 1.5, -0.2], [0.2, 4, -6], [0.2, 2.5, -6], 'sad'],
      [st(10), st(11), 'plaza', [7, 2.5, 16], [6.5, 3, 15], [1.2, 10, -6], [1.2, 13, -6], 'none'],
      [st(11), D.duration, 'plaza', [0.6, 1.5, 4.4], [0.55, 1.5, 4.1], [0, 1.85, -1], [0, 1.85, -1], 'choose'],
    ];
    return 'mexico_usa ' + data.duration.toFixed(1) + 's';
  };

  let lastPrice = '', lastGas = -1;
  window.renderAt = function (t) {
    const sh = SH.find((s) => t >= s[0] && t < s[1]) || SH[SH.length - 1];
    const [a, b, setName, cA, cB, lA, lB, act] = sh;
    const Sx = SETS[setName].X, u = sm(a - 0.2, b + 0.2, t);
    camera.position.set(Sx + lerp(cA[0], cB[0], u), lerp(cA[1], cB[1], u), lerp(cA[2], cB[2], u));
    const look = new T.Vector3(Sx + lerp(lA[0], lB[0], u), lerp(lA[1], lB[1], u), lerp(lA[2], lB[2], u));
    camera.position.x += Math.sin(t * 0.7) * 0.015; camera.position.y += Math.sin(t * 0.9) * 0.01;
    camera.lookAt(look); camera.updateMatrixWorld();
    for (const k in SETS) SETS[k].g.visible = k === setName;

    // luz según escena: dorada de tarde, noche en los tacos, interior cálido en el despacho
    const night = setName === 'pueblo' && t >= st(7) && t < st(9) ? 1 : 0;
    const dusk = setName === 'frontera' ? 1 : 0;
    skyG.position.copy(camera.position);
    skyU.top.value.set(night ? '#0e1430' : dusk ? '#3a4a8a' : '#5a8fd6'); skyU.hor.value.set(night ? '#3a2a40' : dusk ? '#ff9a5a' : '#f5c79a');
    fog.color.set(night ? '#1a1828' : dusk ? '#e8a070' : setName === 'despacho' ? '#2a1a12' : '#e8c9a0');
    sun.intensity = setName === 'despacho' ? 0.4 : night ? 0.25 : 3.2; sun.color.set(dusk ? '#ffb070' : night ? '#8fa2d0' : '#ffd6a0');
    hemi.intensity = night ? 0.35 : setName === 'despacho' ? 0.35 : 0.9;
    const tgt = chico.root.visible ? chico.root.position : look;
    sun.target.position.copy(tgt); sun.position.copy(tgt).addScaledVector(SUN_DIR, 60);
    const ext = act === 'none' ? 40 : 8; Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 200 }); sun.shadow.camera.updateProjectionMatrix();
    renderer.toneMappingExposure = night ? 1.45 : setName === 'despacho' ? 1.3 : 1.05;
    lampL.intensity = setName === 'despacho' ? 9 : night ? 6 : 0;
    if (setName === 'despacho') lampL.position.copy(DS.lampPos); else lampL.position.set(3.2, 2.1, -6);
    BULBS.forEach((b) => (b.material.emissiveIntensity = night ? 4 : 0.3));

    // objetos animados
    stamp.visible = t >= WT.comprara - 0.05; const sk = sm(WT.comprara - 0.05, WT.comprara + 0.12, t); stamp.scale.setScalar(lerp(2.2, 1, sk)); stamp.material.opacity = sk;
    coin.position.set(Sx + 0.35, 0.965 + 0.03 + Math.abs(Math.sin(t * 2)) * 0.0, 0.3); coin.rotation.set(Math.PI / 2 * sm(0, 1, ((t * 0.3) % 1)) * 0 + t * 6, 0, 0.3); coin.position.y = 1.03;
    billM.map = t >= WT.dolares - 0.1 ? DOLAR : PESO;
    passM.map = t >= WT.azul - 0.1 ? PASS_B : PASS_G; passG.rotation.y = Math.PI * 2 * sm(WT.azul - 0.4, WT.azul + 0.1, t);
    plane.visible = act === 'passport'; plane.position.set(lerp(-60, 60, (t - WT.nueva + 1.5) / 5), 28, -60); plane.rotation.y = 0;
    const price = t < WT.peso ? '$25 MXN' : '$1.40 USD'; if (price !== lastPrice) { drawPrice(price, t >= WT.peso); lastPrice = price; }
    const gv = Math.round(lerp(24.5, 41.9, sm(WT.gasolina - 0.4, WT.gasolina + 1.2, t)) * 10) / 10; if (gv !== lastGas) { drawGas(gv); lastGas = gv; }
    const kick = clamp((t - (WT.futbol + 0.1)) / 1.2, 0, 1); ball.position.set(0.8 + kick * 1.5, 0.11 + Math.sin(kick * Math.PI) * 0.6, -4.6 - kick * 6); ball.rotation.set(-kick * 20, 0, 0);
    // bandera: EE.UU. con estrellas que suben (escena 6), México en 9-11
    if (setName === 'plaza') {
      const us = t >= st(6) && t < st(7); const n = Math.round(lerp(50, 82, sm(WT.e32 - 0.2, WT.e32 + 0.8, t)));
      flag.material.map = us ? usFlag(n) : FLAG_MX; flag.material.needsUpdate = true;
      let hgt = 20.5; if (t >= st(9) && t < st(10)) hgt = lerp(20.5, 2.6, sm(WT.existiria - 0.3, WT.existiria + 2.0, t)); if (t >= st(10) && t < st(11)) hgt = lerp(2.6, 20.5, sm(st(10), WT.venta, t));
      flag.position.set(0.12, hgt - 1.2, -6);
      const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = flagBase[i * 3], y = flagBase[i * 3 + 1]; p.setZ(i, Math.sin(x * 1.6 - t * 6 + y * 0.6) * 0.18 * (x / 4.2)); p.setY(i, y - x * 0.04 * Math.sin(t * 2)); } p.needsUpdate = true; flag.geometry.computeVertexNormals();
    }

    // ---- personaje ----
    const PP = {}; let pos = [0, 0, 0], rotY = 0; bills.visible = false; passG.visible = false; tacoG.visible = false;
    switch (act) {
      case 'sign': { pos = [0.5, 0, 0.6]; rotY = Math.PI - 0.3; const s = sm(WT.comprara, WT.comprara + 0.3, t); Object.assign(PP, { look: 0.2, nod: -0.25, armL: [0, 0, lerp(0.1, 2.6, s)], armR: [0, 0, lerp(0.1, 2.6, s)], elbL: 2.2 * s, elbR: 2.2 * s, mouth: 'o', brow: 0.6 + 0.4 * s, blink: 0 }); if (t > WT.comprara) rotY = lerp(Math.PI - 0.3, -0.2, sm(WT.comprara + 0.1, WT.comprara + 0.5, t)); break; }
      case 'desk': { pos = [-0.2, 0, -0.95]; rotY = 0; Object.assign(PP, { nod: 0.5, eyeY: -1, armL: [-0.7, 0, 0.1], armR: [-0.7, 0, 0.1], foreL: 0.9, foreR: 0.9, mouth: t > WT.mesilla ? 'o' : 'flat', brow: 0.4 }); break; }
      case 'shop': { pos = [-5.8, 0, -1.8]; rotY = 1.9; bills.visible = true; Object.assign(PP, { armR: [-1.15, 0, 0.15], foreR: 0.6, nod: 0.3, eyeY: -0.8, mouth: t > WT.dolares ? 'o' : 'frown', brow: t > WT.dolares ? 1 : -0.4 }); if (t > WT.peso + 0.6 && t < WT.dolares - 0.3) { PP.look = -0.6; PP.nod = 0; PP.eyeY = 0; } break; }
      case 'passport': { pos = [0, 0, 0.6]; rotY = 0.15; passG.visible = true; Object.assign(PP, { armR: [-1.2, 0, 0.1], foreR: 0.6, nod: t > WT.nueva - 0.3 ? -0.5 : 0.3, eyeY: t > WT.nueva - 0.3 ? 1 : -1, mouth: t > WT.azul ? 'smile' : 'flat', brow: 0.6 }); break; }
      case 'wall': { pos = [0, 0, 0]; rotY = 0.6; Object.assign(PP, { look: -0.3, nod: -0.5, eyeY: 1, mouth: 'o', brow: 0.7 }); break; }
      case 'lookflag': { pos = [0.6, 0, -2.0]; rotY = 0.4; Object.assign(PP, { nod: -0.6, eyeY: 1, mouth: t > WT.m400 ? 'o' : 'flat', brow: 0.8 }); break; }
      case 'wave': { pos = [0.8, 0, -5]; rotY = 0.3; Object.assign(PP, { armR: [0, 0, 2.6], elbR: 0.6 * Math.sin(t * 8), mouth: 'smile', brow: 0.5 }); break; }
      case 'taco': { pos = [2.5, 0, -4.9]; rotY = -0.5; tacoG.visible = true; Object.assign(PP, { armR: [-1.3, 0, 0.2], foreR: 1.0, mouth: 'smile', brow: 0.6, blink: Math.sin(t * 3) > 0.6 ? 1 : 0 }); break; }
      case 'kick': { pos = [0.6, 0, -4.2]; rotY = Math.PI; const k = sm(WT.futbol - 0.1, WT.futbol + 0.15, t); Object.assign(PP, { legR: -1.1 * k * (1 - sm(WT.futbol + 0.3, WT.futbol + 0.7, t)), armL: [0, 0, 0.8], armR: [0, 0, 0.8], mouth: 'smile', brow: 0.6 }); break; }
      case 'gas': { pos = [2.6, 0, -11.6]; rotY = Math.PI + 0.4; Object.assign(PP, { nod: -0.6, eyeY: 1, mouth: 'o', brow: 1, armL: [0, 0, lerp(0.1, 2.6, sm(WT.gasolina, WT.gasolina + 0.4, t))], armR: [0, 0, lerp(0.1, 2.6, sm(WT.gasolina, WT.gasolina + 0.4, t))], elbL: 2.2 * sm(WT.gasolina, WT.gasolina + 0.4, t), elbR: 2.2 * sm(WT.gasolina, WT.gasolina + 0.4, t) }); break; }
      case 'sad': { pos = [0.9, 0, -2.6]; rotY = 0.5; Object.assign(PP, { nod: 0.4, mouth: 'frown', brow: -1, armL: [0, 0, 0.05], armR: [0, 0, 0.05], look: -0.3 }); break; }
      case 'proud': { pos = [0.9, 0, -2.4]; rotY = 0.6; const s = sm(st(10), st(10) + 0.6, t); Object.assign(PP, { nod: -0.6, eyeY: 1, armL: [0, 0, 0.9 * s], armR: [0, 0, 0.9 * s], elbL: -1.4 * s, elbR: -1.4 * s, mouth: 'smile', brow: 0.4 }); break; }
      case 'choose': { pos = [0, 0, 0]; const s = sm(a + 0.2, a + 0.8, t); Object.assign(PP, { armL: [0, 0, 0.9 * s], armR: [0, 0, 0.9 * s], elbL: -1.4 * s, elbR: -1.4 * s, mouth: t > wt('defenderias', 0, 73.3) ? 'smile' : 'o', brow: 0.7, tilt: 0.15 * Math.sin(t * 2), look: t < wt('defenderias', 0, 73.3) ? -0.3 : 0.3 }); break; }
      default: pos = [0, -100, 0];
    }
    chico.root.visible = act !== 'none';
    chico.root.position.set(Sx + pos[0], pos[1], pos[2]); chico.root.rotation.y = rotY; chico.pose(PP, t);

    // enfoque en el personaje (o en el punto que mira la cámara)
    const fp = chico.root.visible ? chico.root.position.clone().setY(1.5) : look;
    post.uniforms.focus.value = camera.position.distanceTo(act === 'sign' && t < WT.comprara + 0.4 ? new T.Vector3(Sx, 7.5, -24) : act === 'desk' ? new T.Vector3(Sx - 0.2, 0.96, 0) : act === 'gas' ? new T.Vector3(Sx + 2.6, 1.4, -11.6) : fp);
    post.uniforms.ap.value = setName === 'despacho' ? 6 : 14;
    renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(pScene, pCam);

    // ---------- capa 2D ----------
    const endA = sm(FIN, FIN + 0.8, t);
    black.style.opacity = (0.9 * endA + (t < 0.3 ? 1 - t / 0.3 : 0)).toFixed(3); endEl.style.opacity = endA.toFixed(3);
    grain.style.backgroundPosition = `${(hash(Math.floor(t * 30)) * 256) | 0}px ${(hash(Math.floor(t * 30) + 7) * 256) | 0}px`;
    flashL.style.opacity = (0.5 * Math.exp(-(((t - WT.dolares) / 0.12) ** 2)) + 0.4 * Math.exp(-(((t - WT.azul) / 0.12) ** 2))).toFixed(3);
    // mapa de la frontera
    const mOn = t >= WT.mitad + 0.2 && t < st(7);
    mapBox.style.opacity = (mOn ? sm(WT.mitad + 0.2, WT.mitad + 0.6, t) * (1 - sm(st(6) + 1.5, st(6) + 2, t)) : 0).toFixed(3);
    if (mOn) { const mv = sm(WT.guate - 0.6, WT.guate + 0.4, t); document.getElementById('b1').setAttribute('opacity', (1 - mv).toFixed(2)); document.getElementById('b2').setAttribute('opacity', mv.toFixed(2)); document.getElementById('mxp').setAttribute('fill', mv > 0.5 ? '#e9dcc3' : '#cfe3c6'); }
    // HUD
    let lab = '', num = '', sub = '', ha = 0;
    const fade = (x0, x1) => sm(x0, x0 + 0.4, t) * (1 - sm(x1 - 0.4, x1, t));
    if (t >= WT.y1853 - 0.2 && t < st(3)) { lab = '1853 · La Mesilla'; num = '$' + Math.round(10e6 * sm(WT.y1853 + 4, wt('dolares', 0, 16.2) + 0.3, t)).toLocaleString('en-US'); sub = 'Dólares'; ha = fade(WT.y1853 - 0.2, st(3)); }
    else if (t >= WT.e32 - 0.3 && t < st(7)) { lab = t < WT.m400 - 0.4 ? 'Estrellas en la bandera' : 'Habitantes en EE.UU.'; num = t < WT.m400 - 0.4 ? String(Math.round(lerp(50, 82, sm(WT.e32 - 0.2, WT.e32 + 0.8, t)))) : Math.round(lerp(340, 470, sm(WT.m400 - 0.3, WT.m400 + 1.2, t))) + ' millones'; sub = t < WT.m400 - 0.4 ? '+32 nuevos estados' : 'Con México incluido'; ha = fade(WT.e32 - 0.3, st(7)); }
    else if (t >= st(7) && t < WT.tacos - 0.2) { lab = 'Hablarían español'; num = '1 de cada 3'; sub = 'En todo el país'; ha = fade(st(7), WT.tacos - 0.2); }
    setText(hudLab, lab); setText(hudNum, num); setText(hudSub, sub); hud.style.opacity = ha.toFixed(3);
    cta.style.opacity = (sm(WT.aceptarias - 0.2, WT.aceptarias + 0.3, t) * (1 - endA)).toFixed(3);
    // subtítulos palabra por palabra
    let gi = 0; WORDS.forEach((w, i) => { if (t >= w.start - 0.05) gi = GROUPS.findIndex((g) => g.includes(i)); });
    const g = GROUPS[gi] || []; let html = '';
    g.forEach((i, j) => { const w = WORDS[i], said = t >= w.start - 0.05, nxt = WORDS[g[j + 1]]; const now = said && (!nxt || t < nxt.start - 0.05); html += `<span class="w${now ? ' now' : ''}${w.hl && said ? ' key' : ''}" style="opacity:${said ? 1 : 0.4}">${w.w}</span>`; });
    if (t > FIN || t < 0.05) html = '';
    if (cap.__h !== html) { cap.innerHTML = html; cap.__h = html; }
    return true;
  };
})();
