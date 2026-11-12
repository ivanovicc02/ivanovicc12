// "¿Qué pasaría si fueras el último humano?" — Ciudad de México (Paseo de la Reforma), con el personaje del canal.
// Todo es función pura del tiempo t (renderAt): se puede renderizar en paralelo.
(function () {
  const T = THREE;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  function rng(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const R = rng(11);
  const pulse = (t, a, w = 0.18) => Math.exp(-(((t - a) / w) ** 2));

  // ---------- render ----------
  const renderer = new T.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(1080, 1920, false);
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 1080 / 1920, 0.05, 30000);
  const fog = new T.FogExp2(0xd9dde0, 0.0004); scene.fog = fog;
  const SUN_DIR = new T.Vector3(-0.45, 0.55, 0.7).normalize();

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
  function canvasTex(w, h, draw, repeat = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; if (repeat) tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.anisotropy = 4; return tx;
  }
  const radial = (stops) => canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _v = new T.Vector3(), _s = new T.Vector3(), _c = new T.Color(), _e = new T.Euler();
  const mat = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.8 }, o));
  function box(parent, w, h, d, m, x, y, z, shadow = true) { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = shadow; b.receiveShadow = true; parent.add(b); return b; }
  const LINE = new T.ShaderMaterial({ side: T.BackSide, uniforms: { k: { value: 0.03 } },
    vertexShader: 'uniform float k; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * k, 1.0); }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(0.11,0.1,0.15,1.0); }' });
  const outline = (m) => { m.add(new T.Mesh(m.geometry, LINE)); return m; };

  // ---------- luces ----------
  const hemi = new T.HemisphereLight(0xdfe9ff, 0x9c8a74, 1.0); scene.add(hemi);
  const sun = new T.DirectionalLight(0xfff1dc, 2.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.05; scene.add(sun, sun.target);
  const lamp = new T.PointLight(0xffe2b0, 0, 14, 1.6); scene.add(lamp);            // luz interior
  const flash = new T.SpotLight(0xfff4dc, 0, 40, 0.38, 0.5, 1.2); flash.castShadow = true; scene.add(flash, flash.target); // linterna

  // ---------- cielo con estrellas (sigue a la cámara) ----------
  const skyG = new T.Group(); scene.add(skyG);
  const skyU = { top: { value: new T.Color('#4a86d4') }, hor: { value: new T.Color('#e9eef0') }, sunDir: { value: SUN_DIR.clone() }, glow: { value: 0.6 } };
  skyG.add(new T.Mesh(new T.SphereGeometry(20000, 40, 20), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, hor, sunDir; uniform float glow; varying vec3 vD;
      void main(){ vec3 d = normalize(vD); vec3 c = mix(hor, top, smoothstep(-0.02, 0.5, d.y));
        float s = max(dot(d, sunDir), 0.0); c += vec3(1.0,0.86,0.66) * (pow(s, 8.0)*0.3 + pow(s, 400.0)*2.5) * glow;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` })));
  const starG = new T.BufferGeometry(), sp = [];
  for (let i = 0; i < 1600; i++) { const a = R() * Math.PI * 2, y = 0.08 + R() * 0.92, r = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * r * 15000, y * 15000, Math.sin(a) * r * 15000); }
  starG.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
  const stars = new T.Points(starG, new T.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  skyG.add(stars);

  // ---------- personaje ----------
  const chico = window.makeChico(T); scene.add(chico.root);
  chico.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const bagMat = mat('#f4f1ea', { roughness: 0.9 });
  const bags = chico.hands.map((h, i) => { const b = new T.Mesh(new T.BoxGeometry(0.28, 0.36, 0.14), i ? mat('#e94f4f') : bagMat); b.position.set(0, -0.5, 0); h.add(outline(b)); return b; });
  const phoneHand = (() => { const g = new T.Group(); const b = new T.Mesh(new T.BoxGeometry(0.09, 0.17, 0.015), mat('#222')); g.add(b);
    const scr = new T.Mesh(new T.PlaneGeometry(0.08, 0.15), new T.MeshBasicMaterial({ map: canvasTex(128, 240, (g2, w, h) => { g2.fillStyle = '#0d1020'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#ff5a5a'; g2.font = 'bold 26px Inter'; g2.textAlign = 'center'; g2.fillText('SIN', w / 2, h / 2 - 8); g2.fillText('SEÑAL', w / 2, h / 2 + 24); g2.strokeStyle = '#ff5a5a'; g2.lineWidth = 6; g2.beginPath(); g2.arc(w / 2, 60, 26, Math.PI * 1.15, Math.PI * 1.85); g2.stroke(); }, false), toneMapped: false }));
    scr.position.z = 0.009; g.add(scr); g.position.set(0, -0.36, 0.06); g.rotation.x = -1.2; chico.hands[1].add(g); return g; })();
  const torchHand = (() => { const g = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(0.035, 0.045, 0.24, 10), mat('#333', { metalness: 0.5 })); b.rotation.x = Math.PI / 2; g.add(b);
    const lens = new T.Mesh(new T.CircleGeometry(0.04, 12), new T.MeshBasicMaterial({ color: '#fff8e0', toneMapped: false })); lens.position.z = 0.121; g.add(lens);
    g.position.set(0, -0.34, 0.08); chico.hands[0].add(g); return g; })();

  // ---------- sets ----------
  const SETS = {};
  const set = (name, X) => { const g = new T.Group(); g.position.x = X; scene.add(g); SETS[name] = { X, g }; return SETS[name]; };

  // === cuarto (y cocina) ===
  const plankTex = canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = ['#b07a4a', '#a8713f', '#b98552', '#a06a3c'][i % 4]; g.fillRect(0, i * 32, w, 32); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, i * 32, w, 2); g.fillRect((i * 97) % w, i * 32, 2, 32); } });
  const viewTex = canvasTex(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fb2e6'); gr.addColorStop(1, '#e8f0f2'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r2 = rng(3); for (let i = 0; i < 26; i++) { const x = r2() * w, bw = 20 + r2() * 50, bh = 80 + r2() * 260; g.fillStyle = ['#9aa7b4', '#b3bcc6', '#8695a5'][i % 3]; g.fillRect(x, h - bh, bw, bh); }
  }, false);
  function room(name, X, lux) {
    const S = set(name, X), g = S.g;
    const floor = new T.Mesh(new T.PlaneGeometry(10, 10), mat('#ffffff', { map: plankTex })); plankTex.repeat.set(3, 3); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
    const wallM = mat(lux ? '#efe3cc' : '#f2d6b0');
    box(g, 10, 3.4, 0.2, wallM, 0, 1.7, -4); box(g, 0.2, 3.4, 10, wallM, -4.5, 1.7, 0); box(g, 0.2, 3.4, 10, wallM, 4.5, 1.7, 0);
    box(g, 10, 0.12, 0.25, mat('#ffffff'), 0, 0.06, -3.88, false);
    const win = new T.Mesh(new T.PlaneGeometry(lux ? 4.4 : 2.4, 1.7), new T.MeshBasicMaterial({ map: viewTex, toneMapped: false })); win.position.set(lux ? 1 : 1.2, 1.75, -3.89); g.add(win); S.win = win;
    box(g, lux ? 4.6 : 2.6, 0.12, 0.2, mat('#ffffff'), win.position.x, 0.86, -3.84); box(g, lux ? 4.6 : 2.6, 0.12, 0.2, mat('#ffffff'), win.position.x, 2.64, -3.84);
    // cama
    const bx = lux ? -1.4 : -2.4, bw = lux ? 2.6 : 1.5;
    box(g, bw + 0.1, 0.35, 2.3, mat(lux ? '#3a2c22' : '#8b5a3c'), bx, 0.18, -2.6);
    box(g, bw, 0.28, 2.1, mat('#ffffff'), bx, 0.5, -2.6);
    S.blanket = box(g, bw + 0.04, 0.42, 1.5, mat(lux ? '#c9a24a' : '#3d6fb0', { roughness: 1 }), bx, 0.82, -2.15);
    box(g, bw * 0.8, 0.16, 0.45, mat('#fbfbfb'), bx, 0.72, -3.4);
    box(g, bw + 0.2, lux ? 1.6 : 0.9, 0.12, mat(lux ? '#c8a04a' : '#8b5a3c', { metalness: lux ? 0.6 : 0, roughness: 0.4 }), bx, lux ? 0.8 : 0.45, -3.76);
    if (lux) {
      const ch = new T.Mesh(new T.SphereGeometry(0.35, 16, 10), new T.MeshStandardMaterial({ color: '#fff3cf', emissive: '#ffd27a', emissiveIntensity: 1.4 })); ch.position.set(0, 3.0, -1.5); g.add(ch);
      for (const s of [-1, 1]) box(g, 0.5, 2.8, 0.15, mat('#8d1f2a'), 1 + s * 2.5, 1.6, -3.8);
    } else {
      box(g, 0.5, 0.55, 0.45, mat('#8b5a3c'), -1.3, 0.28, -3.5);
      // cocina: refri, barra, tarja y llave
      box(g, 2.2, 0.9, 0.7, mat('#e7e2d8'), 2.6, 0.45, -3.55); box(g, 2.24, 0.06, 0.74, mat('#5d5a57'), 2.6, 0.93, -3.55);
      box(g, 0.6, 0.12, 0.45, mat('#9aa3aa', { metalness: 0.7, roughness: 0.3 }), 2.3, 0.9, -3.5);
      const tap = new T.Mesh(new T.TorusGeometry(0.12, 0.025, 8, 16, Math.PI), mat('#c5ccd2', { metalness: 0.9, roughness: 0.2 })); tap.position.set(2.3, 1.04, -3.75); g.add(tap); S.tap = new T.Vector3(X + 2.42, 1.0, -3.75);
      const fr = box(g, 0.85, 1.95, 0.75, mat('#f4f6f7', { roughness: 0.35 }), 3.85, 0.98, -3.4);
      const door = new T.Group(); door.position.set(3.85 - 0.42, 0.98, -3.02); g.add(door);
      box(door, 0.85, 1.9, 0.06, mat('#eef1f2', { roughness: 0.35 }), 0.42, 0, 0); S.fridgeDoor = door; void fr;
      const inner = new T.Mesh(new T.PlaneGeometry(0.75, 1.8), new T.MeshBasicMaterial({ color: '#dff4ff' })); inner.position.set(3.85, 0.98, -3.02 - 0.01); g.add(inner); S.fridgeLight = inner;
    }
    return S;
  }
  const ROOM = room('room', 0, false), HOTEL = room('hotel', 4000, true);

  // === Ciudad: Paseo de la Reforma ===
  const CITY = set('city', 100000), CG = CITY.g;
  const asphalt = mat('#5b5a58', { roughness: 1 });
  const road = new T.Mesh(new T.PlaneGeometry(64, 4200), asphalt); road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -1300); road.receiveShadow = true; CG.add(road);
  const walkM = mat('#c9bfb2'); const ground = new T.Mesh(new T.PlaneGeometry(9000, 9000), mat('#b9ad9c')); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, -1500); ground.receiveShadow = true; CG.add(ground);
  for (const s of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(12, 4200), walkM); w.rotation.x = -Math.PI / 2; w.position.set(s * 38, 0.04, -1300); w.receiveShadow = true; CG.add(w); box(CG, 0.4, 0.25, 4200, mat('#d8d2c8'), s * 32, 0.12, -1300); }
  const median = new T.Mesh(new T.PlaneGeometry(6, 4200), mat('#6f8f4a')); median.rotation.x = -Math.PI / 2; median.position.set(0, 0.06, -1300); CG.add(median);
  for (let z = 150; z > -3400; z -= 9) { box(CG, 0.12, 0.02, 3, mat('#e9e6dc'), 12, 0.05, z, false); box(CG, 0.12, 0.02, 3, mat('#e9e6dc'), -12, 0.05, z, false); }
  // glorieta del Ángel de la Independencia
  const AZ = -260;
  const glor = new T.Mesh(new T.CylinderGeometry(26, 26, 0.6, 48), mat('#cfc6b8')); glor.position.set(0, 0.3, AZ); glor.receiveShadow = true; CG.add(glor);
  const ring = new T.Mesh(new T.TorusGeometry(22, 1.2, 8, 48), mat('#bdb3a3')); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.7, AZ); CG.add(ring);
  const pool = new T.Mesh(new T.CircleGeometry(21, 48), mat('#5aa7c2', { roughness: 0.2 })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.65, AZ); CG.add(pool); CITY.pool = pool;
  const stone = mat('#d9d1c2', { roughness: 0.85 });
  box(CG, 14, 3, 14, stone, 0, 2, AZ); box(CG, 10, 6, 10, stone, 0, 6.5, AZ);
  const col = new T.Mesh(new T.CylinderGeometry(1.6, 2.1, 36, 20), stone); col.position.set(0, 27.5, AZ); col.castShadow = true; CG.add(col);
  const capi = new T.Mesh(new T.CylinderGeometry(2.6, 1.8, 2.5, 20), stone); capi.position.set(0, 46.5, AZ); CG.add(capi);
  const gold = mat('#e2b33c', { metalness: 0.85, roughness: 0.3, emissive: '#5a3c00', emissiveIntensity: 0.3 });
  const angel = new T.Group(); angel.position.set(0, 48, AZ); CG.add(angel);
  { const b = new T.Mesh(new T.CylinderGeometry(0.5, 1.0, 4.2, 10), gold); b.position.y = 2.1; angel.add(b); const h = new T.Mesh(new T.SphereGeometry(0.5, 12, 10), gold); h.position.y = 4.6; angel.add(h);
    for (const s of [-1, 1]) { const w = new T.Mesh(new T.BoxGeometry(3.2, 1.6, 0.15), gold); w.position.set(s * 1.4, 3.6, -0.4); w.rotation.z = s * 0.5; angel.add(w); }
    const arm = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 2.4, 6), gold); arm.position.set(0.5, 5.4, 0); arm.rotation.z = -0.3; angel.add(arm);
    const crown = new T.Mesh(new T.TorusGeometry(0.4, 0.1, 6, 12), gold); crown.position.set(0.85, 6.6, 0); angel.add(crown); }
  // edificios (4 zonas que se apagan por separado) + 3 torres que se caen
  const winTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#6f8090'; g.fillRect(w * 0.18, h * 0.22, w * 0.64, h * 0.52); g.fillStyle = '#e8e4dc'; g.fillRect(0, h * 0.86, w, h * 0.14); });
  const glassTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#d4dde6'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6a8aa8'); gr.addColorStop(1, '#3d5774'); g.fillStyle = gr; g.fillRect(0, h * 0.1, w, h * 0.82); });
  const litTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const r2 = rng(8); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) if (r2() < 0.7) { g.fillStyle = '#ffd59a'; g.fillRect(x * 128 + 23, y * 128 + 28, 82, 66); } });
  function boxGeo(x, y0, z, w, d, h, color, fu = 4, fv = 3.4) {
    const g = new T.BoxGeometry(w, h, d); g.translate(x, y0 + h / 2, z);
    const uv = g.attributes.uv, n = g.attributes.normal, col2 = new Float32Array(uv.count * 3), c = new T.Color(color);
    for (let i = 0; i < uv.count; i++) { const ny = n.getY(i), nx = Math.abs(n.getX(i)); if (Math.abs(ny) > 0.5) uv.setXY(i, 0.02, 0.95); else uv.setXY(i, uv.getX(i) * (nx > 0.5 ? d : w) / fu, uv.getY(i) * h / fv); col2.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new T.BufferAttribute(col2, 3)); return g;
  }
  const ZONES = [[], [], [], []], ZG = [[], [], [], []];
  const STONE = ['#d8d2c6', '#c9c2b6', '#e6e0d4', '#bfb5a6', '#efe9df'];
  for (const s of [-1, 1]) for (let z = 120; z > -3400; z -= 46 + R() * 20) {
    for (let k = 0; k < 3; k++) {
      const x = s * (60 + k * 70 + R() * 20), zz = z - R() * 20;
      const tall = k === 0 && R() < 0.55, h = tall ? 70 + R() * 150 : 18 + R() * 50;
      const zone = clamp(Math.floor((-zz + 200) / 900), 0, 3);
      if (Math.abs(zz - AZ) < 40 && k === 0) continue;
      (tall ? ZG : ZONES)[zone].push(boxGeo(x, 0, zz, 30 + R() * 16, 30 + R() * 16, h, tall ? '#eef3f7' : STONE[(R() * STONE.length) | 0], tall ? 5 : 4, tall ? 4 : 3.4));
    }
  }
  const zoneMats = [];
  for (let i = 0; i < 4; i++) {
    const mw = new T.MeshStandardMaterial({ map: winTex, vertexColors: true, roughness: 0.9, emissiveMap: litTex, emissive: new T.Color('#ffcf8a'), emissiveIntensity: 0 });
    const mg = new T.MeshStandardMaterial({ map: glassTex, vertexColors: true, roughness: 0.35, metalness: 0.3, emissiveMap: litTex, emissive: new T.Color('#ffcf8a'), emissiveIntensity: 0 });
    for (const [geos, m] of [[ZONES[i], mw], [ZG[i], mg]]) if (geos.length) { const me = new T.Mesh(merge(geos), m); me.castShadow = me.receiveShadow = true; CG.add(me); }
    zoneMats.push(mw, mg);
  }
  const FALL = [];
  for (const [x, z, h, dir] of [[-75, -520, 180, 1], [85, -760, 210, -1], [-70, -1150, 160, 1]]) {
    const piv = new T.Group(); piv.position.set(x + dir * -16, 0, z); CG.add(piv);
    const m = new T.Mesh(boxGeo(dir * 16, 0, 0, 32, 32, h, '#eef3f7', 5, 4), zoneMats[1]); m.castShadow = true; piv.add(m);
    FALL.push({ piv, dir, h });
  }
  // farolas
  const lampHeads = [];
  for (const s of [-1, 1]) for (let z = 120; z > -1500; z -= 32) {
    box(CG, 0.25, 9, 0.25, mat('#3b3d40', { metalness: 0.6 }), s * 33, 4.5, z); box(CG, 2.2, 0.2, 0.3, mat('#3b3d40'), s * 32, 9, z);
    const hd = new T.Mesh(new T.BoxGeometry(1, 0.25, 0.5), new T.MeshStandardMaterial({ color: '#444', emissive: '#ffd08a', emissiveIntensity: 0 })); hd.position.set(s * 31.2, 8.85, z); CG.add(hd); lampHeads.push(hd);
  }
  // árboles de banqueta y camellón (crecen con los años)
  const crownM = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });
  const treeGeo = (() => { const c = new T.IcosahedronGeometry(3, 0); c.translate(0, 7, 0); const tr = new T.CylinderGeometry(0.25, 0.35, 5, 6); tr.translate(0, 2.5, 0); return merge([paint(noUV(c), '#5b8a3c'), paint(noUV(tr), '#5a4330')]); })();
  const TREES = [];
  for (const x of [-38, -1.5, 1.5, 38]) for (let z = 110; z > -2000; z -= 14) if (Math.abs(z - AZ) > 30 || Math.abs(x) > 30) TREES.push([x + (R() - 0.5), z + (R() - 0.5) * 4, 0.8 + R() * 0.4, R() * 6, 0]);
  for (let i = 0; i < 260; i++) TREES.push([(R() - 0.5) * 56, 100 - R() * 1500, 0.6 + R() * 0.9, R() * 6, 1]); // nuevos, en plena avenida
  const trees = new T.InstancedMesh(treeGeo, crownM, TREES.length); trees.castShadow = true; trees.receiveShadow = true; CG.add(trees);
  const GR = []; for (let i = 0; i < 2600; i++) GR.push([(R() - 0.5) * 66, 120 - R() * 1700, 0.5 + R() * 1.6, R() * 6]);
  const grass = new T.InstancedMesh((() => { const g = new T.ConeGeometry(0.7, 1.4, 5); g.translate(0, 0.6, 0); return paint(noUV(g), '#6f9a3e'); })(), crownM, GR.length); grass.receiveShadow = true; CG.add(grass);
  const cracks = new T.Mesh(new T.PlaneGeometry(64, 1800), new T.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(512, 2048, (g, w, h) => { const r2 = rng(4); g.strokeStyle = 'rgba(40,36,30,.8)'; g.lineWidth = 3; for (let i = 0; i < 120; i++) { let x = r2() * w, y = r2() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r2() - 0.5) * 50; y += (r2() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); } }, false), opacity: 0 }));
  cracks.rotation.x = -Math.PI / 2; cracks.position.set(0, 0.08, -700); CG.add(cracks);
  // coches detenidos (algunos con la puerta abierta)
  const carCols = ['#e8e8e8', '#1d1d20', '#b0262b', '#3c5c8a', '#9aa0a6', '#d9d2c0', '#2f7d4f'];
  const CARS = [];
  for (let i = 0; i < 46; i++) {
    const lane = [-26, -19, -9, 9, 19, 26][i % 6], z = 60 - i * 26 - R() * 18, g = new T.Group(), cm = mat(carCols[i % carCols.length], { roughness: 0.35, metalness: 0.4 });
    box(g, 1.8, 0.75, 4.3, cm, 0, 0.62, 0); box(g, 1.6, 0.6, 2.2, cm, 0, 1.3, -0.2); box(g, 1.62, 0.5, 2.0, mat('#25303a', { roughness: 0.1, metalness: 0.6 }), 0, 1.3, -0.2, false);
    for (const [wx, wz] of [[-0.85, 1.3], [0.85, 1.3], [-0.85, -1.3], [0.85, -1.3]]) { const w = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.25, 12), mat('#1a1a1a')); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.34, wz); g.add(w); }
    if (i % 3 === 0) { const d = new T.Group(); d.position.set(0.9, 0, 0.6); g.add(d); box(d, 0.08, 0.85, 1.25, cm, 0, 0.75, -0.62); d.rotation.y = 1.0; }
    g.position.set(lane + (R() - 0.5) * 2, 0, z); g.rotation.y = (R() - 0.5) * 0.5 + (lane < 0 ? Math.PI : 0); CG.add(g); CARS.push(g);
  }
  // celulares sonando (en el piso y en coches)
  const ringTex = radial([[0, 'rgba(120,200,255,0)'], [0.82, 'rgba(120,200,255,0)'], [0.9, 'rgba(160,220,255,.9)'], [1, 'rgba(120,200,255,0)']]);
  const PHONES = [];
  for (const [x, y, z] of [[3.2, 0.06, 18], [-9.5, 1.55, 8], [12, 0.06, 2]]) {
    const g = new T.Group(); g.position.set(x, y, z); CG.add(g);
    box(g, 0.09, 0.012, 0.17, mat('#151515'), 0, 0.006, 0, false);
    const scr = new T.Mesh(new T.PlaneGeometry(0.08, 0.15), new T.MeshBasicMaterial({ color: '#7fd0ff', toneMapped: false })); scr.rotation.x = -Math.PI / 2; scr.position.y = 0.013; g.add(scr);
    const rings = [0, 1, 2].map(() => { const r = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, toneMapped: false })); r.rotation.x = -Math.PI / 2; r.position.y = 0.02; g.add(r); return r; });
    PHONES.push({ g, scr, rings });
  }
  // tienda (lado izquierdo, frente a la cámara del plano)
  const shop = new T.Group(); shop.position.set(-44, 0, 20); shop.rotation.y = Math.PI / 2; CG.add(shop);
  box(shop, 16, 6, 0.4, mat('#e9e2d4'), 0, 3, -0.2); box(shop, 16, 1.4, 0.6, mat('#d94b3d'), 0, 6.2, 0.1);
  const sign = new T.Mesh(new T.PlaneGeometry(9, 1.1), new T.MeshBasicMaterial({ map: canvasTex(512, 64, (g, w, h) => { g.fillStyle = '#d94b3d'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 48px Inter'; g.textAlign = 'center'; g.fillText('SÚPER  24 H', w / 2, 48); }, false) })); sign.position.set(0, 6.2, 0.42); shop.add(sign);
  const glassF = new T.Mesh(new T.PlaneGeometry(13, 4), new T.MeshStandardMaterial({ color: '#9fc5d6', transparent: true, opacity: 0.35, roughness: 0.05 })); glassF.position.set(1, 2.2, 0.02); shop.add(glassF);
  for (let k = 0; k < 5; k++) for (let j = 0; j < 3; j++) box(shop, 2, 0.5, 0.6, mat(['#f2c14e', '#e8846b', '#7fb8d8', '#9ccf9a', '#d9a5c4'][(k + j) % 5]), -4 + k * 2.6, 0.8 + j * 1.1, -1.4, false);
  // deportivo rojo descapotable
  const sport = new T.Group(); CG.add(sport);
  { const red = mat('#d0161f', { roughness: 0.25, metalness: 0.5 }); const b = new T.Mesh(new T.BoxGeometry(2, 0.6, 4.4), red); b.position.y = 0.55; sport.add(outline(b));
    const nose = new T.Mesh(new T.BoxGeometry(1.9, 0.3, 1.2), red); nose.position.set(0, 0.75, -1.6); sport.add(nose);
    const ws = new T.Mesh(new T.BoxGeometry(1.8, 0.5, 0.06), mat('#bfe3ff', { transparent: true, opacity: 0.5 })); ws.position.set(0, 1.1, -0.65); ws.rotation.x = -0.5; sport.add(ws);
    for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) { const w = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.3, 14), mat('#151515')); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.36, wz); sport.add(w); } }
  sport.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  // animales: perros y venados
  function animal(kind) {
    const g = new T.Group(), c = kind === 'deer' ? mat('#9a6a3e') : mat(['#c9a27a', '#3a3330'][R() < 0.5 ? 0 : 1]);
    const L = kind === 'deer' ? 1 : 0.55;
    const body = new T.Mesh(new T.CapsuleGeometry(0.3 * L, 0.8 * L, 4, 10), c); body.rotation.x = Math.PI / 2; body.position.y = 1.1 * L; g.add(outline(body));
    const head = new T.Mesh(new T.SphereGeometry(0.22 * L, 12, 10), c); head.position.set(0, 1.55 * L, -0.75 * L); g.add(outline(head));
    const legs = [];
    for (const [x, z] of [[-0.18, -0.4], [0.18, -0.4], [-0.18, 0.4], [0.18, 0.4]]) { const p = new T.Group(); p.position.set(x * L, 0.9 * L, z * L); g.add(p); const l = new T.Mesh(new T.CylinderGeometry(0.06 * L, 0.05 * L, 0.9 * L, 6), c); l.position.y = -0.45 * L; p.add(l); legs.push(p); }
    if (kind === 'deer') for (const s of [-1, 1]) { const a = new T.Mesh(new T.CylinderGeometry(0.02, 0.03, 0.5, 5), mat('#e8dcc4')); a.position.set(s * 0.12, 1.85, -0.75); a.rotation.z = s * 0.4; g.add(a); }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); CG.add(g); return { g, legs };
  }
  const ANIM = [['deer', -8, 0.9], ['deer', -11, 0.85], ['deer', -6, 1.0], ['dog', 6, 1.5], ['dog', 8, 1.6]].map(([k, x, v], i) => ({ ...animal(k), x, v, o: i * 7 }));
  // pájaros
  const birdGeo = new T.BufferGeometry(); birdGeo.setAttribute('position', new T.BufferAttribute(new Float32Array([0, 0, 0.3, -1.3, 1, 0, 0, 0, -0.3, 0, 0, 0.3, 1.3, 1, 0, 0, 0, -0.3]), 3)); birdGeo.computeVertexNormals();
  const birds = new T.InstancedMesh(birdGeo, new T.MeshBasicMaterial({ color: '#2e2a28', side: T.DoubleSide }), 40); CG.add(birds);
  const BIRDS = []; for (let i = 0; i < 40; i++) BIRDS.push({ x: (R() - 0.5) * 140, y: 25 + R() * 60, z: -40 - R() * 260, v: (R() < 0.5 ? -1 : 1) * (6 + R() * 5), ph: R() * 6, s: 0.5 + R() * 0.3 });
  // hojas que vuela el viento
  const leaves = new T.InstancedMesh(paint(noUV(new T.PlaneGeometry(0.25, 0.15)), '#a8823a'), new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide }), 160); CG.add(leaves);
  const LV = []; for (let i = 0; i < 160; i++) LV.push({ x: (R() - 0.5) * 30, z: R() * 60 - 30, y: R() * 3, o: R(), sp: 4 + R() * 4 });

  // ---------- capa HTML ----------
  const $ = (id) => document.getElementById(id);
  const hud = $('hud'), hudLab = hud.querySelector('.lab'), hudNum = hud.querySelector('.num'), hudSub = hud.querySelector('.sub');
  const cap = $('cap'), black = $('black'), endEl = $('end'), cta = $('cta'), icons = [...document.querySelectorAll('#icons .ic')], iconsBox = $('icons'), flashL = $('flash');
  function setText(el, s) { if (el.__t !== s) { el.textContent = s; el.__t = s; } }
  function setHTML(el, s) { if (el.__h !== s) { el.innerHTML = s; el.__h = s; } }

  // ---------- datos ----------
  let S = {}, CAPS = [], WORDS = [], FIN = 60, D = null;
  const st = (k) => S[k][0], en = (k) => S[k][1];
  const key = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  function wt(w, n = 0, d = 0) { let c = 0; for (const x of WORDS) if (key(x.w) === key(w) && c++ === n) return x.start; return d; }
  let SH = [];
  window.loadProject = (data) => {
    D = data; S = data.scenes; CAPS = data.caps; WORDS = data.words; FIN = data.fin;
    const W = {
      tienda: wt('tienda', 0, st(4) + 3.2), coche: wt('coche', 0, st(4) + 4.6), manejar: wt('manejar', 0, st(4) + 3.7), dormir: wt('dormir', 0, st(4) + 5),
      cel: wt('celulares', 0, st(3) + 4.5), puede: wt('puedes', 0, st(4) + 2), silencio: wt('silencio', 0, st(8) + 2.4), anim: wt('animales', 0, st(8) + 7.7),
      refri: wt('refrigeradores', 0, st(7) + 2.9), llave: wt('llave', 0, st(7) + 5.3), internet: wt('internet', 0, st(7) + 1.4),
      tu: wt('tu', 0, st(10) + 0.2),
    };
    window.W = W;
    // planos: [inicio, fin, set, cámara A, cámara B, mira A, mira B, acción del personaje]
    const X0 = 6.5;
    SH = [
      [0, 2.6, 'room', [-1.2, 1.55, 0.2], [-1.4, 1.5, -0.2], [-2.4, 1.05, -2.9], [-2.4, 1.1, -2.9], 'bed'],
      [2.6, st(2), 'room', [1.2, 1.5, 1.2], [1.0, 1.45, 0.8], [0.6, 1.3, -1.8], [0.6, 1.35, -1.8], 'shock'],
      [st(2), st(3), 'city', [X0 + 3, 1.9, 34], [X0 + 2, 2.0, 30], [X0, 1.4, 20], [X0, 1.6, 16], 'walkout'],
      [st(3), W.cel - 0.1, 'city', [X0 - 6, 4, 40], [X0 + 4, 6, 4], [X0, 1, 20], [X0 - 4, 1, -40], 'standcars'],
      [W.cel - 0.1, st(4), 'city', [6.6, 1.7, 21.8], [6.2, 1.6, 21.3], [3.0, 0.7, 18.4], [3.0, 0.6, 18.4], 'lookphone'],
      [st(4), W.puede + 0.6, 'city', [X0, 1.9, 27], [X0, 1.8, 26], [X0, 1.3, 20], [X0, 1.3, 20], 'jump'],
      [W.puede + 0.6, W.manejar - 0.1, 'city', [-34, 1.6, 28], [-35, 1.7, 26], [-42, 1.5, 18], [-42, 1.5, 18], 'bags'],
      [W.manejar - 0.1, W.dormir - 0.15, 'city', [8.2, 2.1, -21], [8.2, 2.1, -111], [6.4, 1.1, -28], [6.4, 1.1, -118], 'drive'],
      [W.dormir - 0.15, st(5), 'hotel', [1.8, 1.9, 1.6], [1.6, 1.8, 1.2], [-1.4, 1.0, -2.4], [-1.4, 1.1, -2.4], 'bedjump'],
      [st(5), st(6), 'city', [30, 140, 250], [10, 120, 200], [0, 20, -900], [0, 10, -900], 'none'],
      [st(6), st(7), 'city', [X0 + 3, 1.7, 28], [X0 + 2.4, 1.6, 26], [X0, 1.4, 20], [X0, 1.4, 20], 'torch'],
      [st(7), st(8), 'room', [3.0, 1.6, -0.5], [2.9, 1.6, -0.7], [1.8, 1.25, -2.6], [1.9, 1.25, -2.7], 'kitchen'],
      [st(8), W.anim - 0.4, 'city', [-28, 1.5, 30], [-28.5, 1.6, 29], [-33.5, 0.9, 22.5], [-33.5, 0.9, 22.5], 'sit'],
      [W.anim - 0.4, st(9), 'city', [-30, 1.4, 31], [-30, 1.5, 30], [-12, 1.2, 14], [-10, 1.2, 10], 'sit'],
      [st(9), st(10), 'city', [10, 18, 70], [0, 40, 110], [0, 12, -200], [0, 20, -320], 'none'],
      [st(10), st(11), 'city', [1.6, 5.4, AZ + 11.5], [20, 60, AZ + 90], [0, 4.9, AZ + 7], [0, 30, AZ - 40], 'sad'],
      [st(11), D.duration, 'city', [X0, 1.7, 26], [X0, 1.65, 25], [X0, 1.5, 20], [X0, 1.5, 20], 'shrug'],
    ];
    return 'ultimo ' + data.duration.toFixed(1) + 's';
  };

  window.renderAt = function (t) {
    const sh = SH.find((s) => t >= s[0] && t < s[1]) || SH[SH.length - 1];
    const [a, b, setName, cA, cB, lA, lB, act] = sh;
    const Sx = SETS[setName].X;
    const u = act === 'sad' ? sm(a + 1.0, b + 0.5, t) ** 1.5 : sm(a - 0.3, b + 0.3, t);
    camera.position.set(Sx + lerp(cA[0], cB[0], u), lerp(cA[1], cB[1], u), lerp(cA[2], cB[2], u));
    const look = new T.Vector3(Sx + lerp(lA[0], lB[0], u), lerp(lA[1], lB[1], u), lerp(lA[2], lB[2], u));
    camera.position.x += Math.sin(t * 0.7) * 0.03; camera.position.y += Math.sin(t * 0.9) * 0.02;
    camera.lookAt(look); camera.updateMatrixWorld();
    for (const k in SETS) SETS[k].g.visible = k === setName;

    // ---- estado del mundo ----
    const night = sm(st(5) + 0.6, st(5) + 2.2, t) * (1 - sm(st(8) - 0.4, st(8) + 0.4, t));
    const power = 1 - sm(st(5) + 1.5, en(6) - 0.6, t);  // (solo referencia)
    void power;
    const offT = [wt('controle', 0, st(5) + 3.8), wt('plantas', 0, st(5) + 4.6), wt('apagan', 0, st(5) + 5.7), wt('una', 1, st(5) + 6.6)];
    const lit = [0, 1, 2, 3].map((i) => night * (1 - sm(offT[i], offT[i] + 0.25, t)));
    const street = night * (1 - sm(wt('oscuras', 0, st(6) + 3.3), wt('oscuras', 0, st(6) + 3.3) + 0.3, t)) * (t < st(6) ? 1 : 1);
    const years = sm(st(9), en(9) - 0.5, t) + (t >= st(10) ? 1 : 0) * 0;
    const grow = clamp(years + (t >= en(9) ? 1 : 0), 0, 1);
    const sunset = sm(st(11) - 0.2, en(11), t);
    const indoorDark = setName === 'room' && t >= st(7) && t < st(8);

    // cielo y luz
    skyG.position.copy(camera.position);
    const top = skyU.top.value, hor = skyU.hor.value;
    top.set('#4a86d4').lerp(new T.Color('#0b1024'), night).lerp(new T.Color('#3d4270'), sunset);
    hor.set('#e9eef0').lerp(new T.Color('#1d2440'), night).lerp(new T.Color('#f0956a'), sunset);
    skyU.glow.value = 0.6 * (1 - night) + 1.2 * sunset;
    stars.material.opacity = night * (1 - lit.reduce((s, x) => s + x, 0) / 5);
    fog.color.set('#d9dde0').lerp(new T.Color('#0e1220'), night).lerp(new T.Color('#d79a7c'), sunset).lerp(new T.Color('#c9d3c0'), grow * 0.4 * (1 - sunset));
    fog.density = setName === 'city' ? (0.0011 + 0.0012 * night) * (t >= st(5) && t < st(6) ? 0.35 : 1) * (t >= st(9) && t < st(11) ? 0.6 : 1) : 0.0;
    sun.intensity = setName === 'city' ? 2.6 * (1 - night * 0.97) * (1 - 0.3 * sunset) : (indoorDark ? 0 : 1.4);
    sun.color.set('#fff1dc').lerp(new T.Color('#ff9c6a'), sunset);
    hemi.intensity = (setName === 'city' ? 1.0 : 0.9) * (1 - 0.85 * night) * (indoorDark ? 0.12 : 1) + 0.15;
    const sd = setName === 'city' ? SUN_DIR : new T.Vector3(0.3, 0.6, 0.5).normalize();
    const tgt = setName === 'city' && (act === 'none' || act === 'sad') ? look : chico.root.position;
    sun.target.position.copy(tgt); sun.position.copy(tgt).addScaledVector(sd, 300);
    const ext = act === 'none' ? 300 : setName === 'city' ? 40 : 8;
    Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 800 }); sun.shadow.camera.updateProjectionMatrix();
    renderer.toneMappingExposure = 1.0 + 0.5 * night;
    lamp.intensity = setName !== 'city' && !indoorDark ? 6 : 0; lamp.position.set(Sx + 0.5, 2.8, -1);

    // ventanas encendidas y apagón por zonas
    zoneMats.forEach((m, i) => { m.emissiveIntensity = 1.6 * lit[(i / 2) | 0]; m.color.set('#ffffff').lerp(new T.Color('#9fb38a'), grow * 0.55); });
    lampHeads.forEach((h) => { h.material.emissiveIntensity = 3 * street; });

    // naturaleza que vuelve
    TREES.forEach((p, i) => { const s = p[4] ? p[2] * sm(0.15 + (i % 7) * 0.08, 0.9, grow) : p[2] * (1 + 0.6 * grow); _q.setFromEuler(_e.set(0, p[3], 0)); _m.compose(_v.set(p[0], 0, p[1]), _q, _s.setScalar(s)); trees.setMatrixAt(i, _m); });
    trees.instanceMatrix.needsUpdate = true;
    GR.forEach((p, i) => { const s = p[2] * sm((i % 13) / 26, 0.6 + (i % 13) / 26, grow); _q.setFromEuler(_e.set(0, p[3], 0)); _m.compose(_v.set(p[0], 0, p[1]), _q, _s.set(s, s * (0.6 + (i % 5) * 0.2), s)); grass.setMatrixAt(i, _m); });
    grass.instanceMatrix.needsUpdate = true; grass.visible = grow > 0.01;
    cracks.material.opacity = sm(0.1, 0.5, grow);
    asphalt.color.set('#5b5a58').lerp(new T.Color('#6b6a52'), grow * 0.5);
    CITY.pool.material.color.set('#5aa7c2').lerp(new T.Color('#4f6b3a'), grow);
    const tCaer = wt('edificios', 0, en(9) - 2), tCaer2 = wt('caer', 0, en(9) - 0.7);
    FALL.forEach((f, i) => { const t0 = [tCaer, tCaer2 - 0.4, tCaer2 + 0.4][i], k = clamp((t - t0) / 1.6, 0, 1); f.piv.rotation.z = f.dir * 1.45 * k * k; f.piv.position.y = -10 * k; f.piv.visible = k < 1 || t < t0 + 1.7; });
    CARS.forEach((c, i) => c.children.forEach((m) => { if (m.material && m.material.color && i % 2 === 0) m.material.color.lerp(new T.Color('#7a5a3a'), grow * 0.02); }));

    // celulares
    const ringing = t >= wt('celulares', 0, st(3) + 4.5) - 0.3 && t < st(4);
    PHONES.forEach((p, i) => { p.g.visible = setName === 'city' && t < st(4) + 1; p.scr.material.color.set(ringing && Math.sin(t * 12 + i) > -0.3 ? '#9be0ff' : '#1a2a33');
      p.rings.forEach((r, k) => { const ph = ((t * 1.3 + k / 3 + i * 0.2) % 1); r.visible = ringing; r.scale.setScalar(0.2 + ph * 1.6); r.material.opacity = 1 - ph; }); });

    // deportivo
    sport.visible = act === 'drive';
    if (sport.visible) { const z = lerp(-20, -110, (t - a) / (b - a)) - 8; sport.position.set(6, 0, z); }

    // animales
    const animOn = t >= W.anim - 0.6 && t < st(9);
    ANIM.forEach((A, i) => { A.g.visible = animOn; if (!animOn) return; const z = 26 - ((t - (W.anim - 0.6)) * A.v * 2.2 + A.o) ; A.g.position.set(A.x, 0, z); A.g.rotation.y = 0;
      A.legs.forEach((l, k) => { l.rotation.x = Math.sin(t * 8 * A.v + k * Math.PI) * 0.5; }); });
    // pájaros (vuelven en el silencio y con los años)
    const birdOn = setName === 'city' && (t < st(5) || t >= st(8));
    birds.visible = birdOn;
    if (birdOn) { BIRDS.forEach((bd, i) => { const flap = 0.15 + 0.85 * Math.abs(Math.sin(t * 9 + bd.ph * 3)); _q.setFromEuler(_e.set(0, bd.v > 0 ? 0 : Math.PI, 0)); _m.compose(_v.set(bd.x + bd.v * t, bd.y + Math.sin(t * 0.5 + bd.ph) * 3, bd.z), _q, _s.set(bd.s, bd.s * (flap * 2 - 1), bd.s)); birds.setMatrixAt(i, _m); }); birds.instanceMatrix.needsUpdate = true; }
    const windOn = t >= wt('viento', 0, st(8) + 6.5) - 0.5 && t < st(9);
    leaves.visible = windOn;
    if (windOn) { LV.forEach((l, i) => { const p = ((t * 0.25 * l.sp / 4 + l.o) % 1); _q.setFromEuler(_e.set(t * 3 + i, t * 2 + i, 0)); _m.compose(_v.set(l.x + (p - 0.5) * 50, 0.3 + l.y * Math.abs(Math.sin(t * 2 + i)), l.z + 20), _q, _s.setScalar(1)); leaves.setMatrixAt(i, _m); }); leaves.instanceMatrix.needsUpdate = true; }

    // ---- personaje ----
    const P = { phase: t };
    let pos = [0, 0, 20], rotY = 0, inBed = false;
    bags.forEach((bg) => (bg.visible = false)); phoneHand.visible = false; torchHand.visible = false; flash.intensity = 0;
    switch (act) {
      case 'bed': { inBed = true; const wake = sm(1.3, 2.0, t); pos = [-2.4, -0.05, -3.05]; Object.assign(P, { sit: 0.95, lean: -0.25 + 0.25 * wake, blink: 1 - wake, mouth: wake > 0.5 ? 'o' : 'flat', brow: wake * 0.6, armL: [-0.3, 0, 0.2], armR: [-0.3, 0, 0.2], look: 0.2 * wake }); break; }
      case 'shock': { pos = [0.6, 0, -1.6]; rotY = 0.35; const s = sm(wt('unico', 0, 3.3) - 0.2, wt('unico', 0, 3.3) + 0.2, t); Object.assign(P, { armL: [0, 0, lerp(0.1, 2.6, s)], armR: [0, 0, lerp(0.1, 2.6, s)], elbL: 2.2 * s, elbR: 2.2 * s, mouth: 'o', open: 1 + 0.3 * s, brow: 1, pupil: lerp(1, 0.75, s), blink: 0 }); break; }
      case 'walkout': { const k = sm(a, wt('nadie', 0, b - 0.8), t); pos = [0, 0, lerp(30, 21, k)]; rotY = Math.PI; const stop = t > wt('nadie', 0, b - 0.8); Object.assign(P, { walk: stop ? 0 : 1, look: Math.sin(t * 2.2) * 0.7, eyeX: Math.sin(t * 2.2), mouth: stop ? 'o' : 'flat', brow: 0.6, armL: stop ? [0, 0, 0.6] : undefined, armR: stop ? [0, 0, 0.6] : undefined, elbL: stop ? -1 : 0, elbR: stop ? -1 : 0 }); rotY = 0; pos = [6.5, 0, lerp(14, 21, k)]; break; }
      case 'standcars': { pos = [6.5, 0, 21]; rotY = Math.sin(t * 0.8) * 0.6; Object.assign(P, { look: Math.sin(t * 1.4) * 0.5, mouth: 'o', brow: 0.7, eyeX: Math.sin(t * 1.4) }); break; }
      case 'lookphone': { pos = [2.5, 0, 18.9]; rotY = 2.2; Object.assign(P, { nod: 0.45, eyeY: -1, mouth: 'flat', brow: 0.3, lean: 0.15 }); break; }
      case 'jump': { pos = [6.5, Math.abs(Math.sin((t - a) * 5.5)) * 0.7, 20]; Object.assign(P, { mouth: 'smile', armL: [0, 0, 2.4], armR: [0, 0, 2.4], brow: 0.5, blink: 0 }); break; }
      case 'bags': { pos = [-40, 0, 18.5]; rotY = -0.5 + Math.PI / 2 * 0; bags.forEach((bg) => (bg.visible = true)); Object.assign(P, { walk: 0.6, mouth: 'smile', armL: [0, 0, 0.15], armR: [0, 0, 0.15], brow: 0.4 }); rotY = 0.9; pos[0] = lerp(-41, -39, (t - a) / (b - a)); break; }
      case 'drive': { const z = lerp(-20, -110, (t - a) / (b - a)) - 8; pos = [6.45, -0.15, z + 0.3]; rotY = Math.PI; Object.assign(P, { sit: 1, mouth: 'smile', armL: [-1.2, 0, 0.1], armR: [-1.2, 0, 0.1], fore: 0, brow: 0.6, blink: 0 }); P.foreL = 0.4; P.foreR = 0.4; break; }
      case 'bedjump': { pos = [-1.4, 0.64 + Math.abs(Math.sin((t - a) * 5)) * 0.8, -2.5]; Object.assign(P, { mouth: 'smile', armL: [0, 0, 2.0], armR: [0, 0, 2.0], blink: 0, brow: 0.5 }); break; }
      case 'torch': { pos = [6.5, 0, 20]; rotY = 0.2; torchHand.visible = true; Object.assign(P, { armL: [-1.25, 0, 0.1], mouth: 'frown', brow: -0.6, look: Math.sin(t * 0.9) * 0.4, eyeX: Math.sin(t * 0.9) }); break; }
      case 'kitchen': { pos = [1.9, 0, -2.6]; rotY = 0.9; torchHand.visible = true; phoneHand.visible = t < wt('refrigeradores', 0, a + 2.9) - 0.3;
        Object.assign(P, { armL: [-1.25, 0, 0.1], armR: phoneHand.visible ? [-1.0, 0, 0.1] : [0, 0, 0.1], foreR: phoneHand.visible ? 0.6 : 0, mouth: 'frown', brow: -0.7, nod: phoneHand.visible ? 0.3 : 0 }); rotY = phoneHand.visible ? 0.7 : 1.4; break; }
      case 'sit': { pos = [0, 0.25, 22.5]; Object.assign(P, { sit: 1, mouth: 'frown', brow: -0.8, armL: [-0.6, 0, 0.1], armR: [-0.6, 0, 0.1], foreL: 1.2, foreR: 1.2, nod: t > W.anim - 0.4 ? -0.1 : 0.3, look: t > W.anim - 0.4 ? -0.6 : 0, eyeX: t > W.anim - 0.4 ? -1 : 0, eyeY: t > W.anim - 0.4 ? 0 : -0.6 }); pos = [-33.5, 0.25, 22.5]; rotY = Math.PI / 2; if (t > W.anim - 0.4) Object.assign(P, { mouth: 'o', brow: 0.6 }); break; }
      case 'sad': { pos = [0, 4.05 + 0.25, AZ + 7.2]; Object.assign(P, { sit: 1, mouth: 'frown', brow: -0.9, armL: [-0.6, 0, 0.1], armR: [-0.6, 0, 0.1], foreL: 1.2, foreR: 1.2, nod: 0.35, beard: 1 }); break; }
      case 'shrug': { pos = [6.5, 0, 20]; const s = sm(a + 0.2, a + 0.8, t); Object.assign(P, { armL: [0, 0, 0.9 * s], armR: [0, 0, 0.9 * s], elbL: -1.4 * s, elbR: -1.4 * s, mouth: t > wt('primero', 0, a + 1.6) ? 'smile' : 'o', brow: 0.7, tilt: 0.15 * Math.sin(t * 2), beard: 1 }); break; }
      default: pos = [0, -100, 0];
    }
    if (t >= st(9) && act !== 'none') P.beard = Math.max(P.beard || 0, 1);
    chico.root.visible = act !== 'none';
    chico.root.position.set(Sx + pos[0], pos[1], pos[2]); chico.root.rotation.y = rotY;
    chico.pose(P, t);
    if (inBed) ROOM.blanket.scale.y = 1;
    if (torchHand.visible) {
      torchHand.updateWorldMatrix(true, false); const p0 = new T.Vector3().setFromMatrixPosition(torchHand.matrixWorld);
      const dir = new T.Vector3(0, 0, 1).transformDirection(torchHand.matrixWorld);
      flash.position.copy(p0); flash.target.position.copy(p0).addScaledVector(dir, 10); flash.intensity = 60;
    }
    // refri y llave
    if (setName === 'room') { const od = sm(wt('refrigeradores', 0, st(7) + 2.9) - 0.4, wt('refrigeradores', 0, st(7) + 2.9) + 0.3, t) * (t >= st(7) ? 1 : 0); ROOM.fridgeDoor.rotation.y = -1.6 * od; ROOM.fridgeLight.material.color.set(t >= st(7) ? '#20282c' : '#dff4ff'); }

    renderer.render(scene, camera);

    // ---------- capa 2D ----------
    const endA = sm(FIN, FIN + 0.8, t);
    black.style.opacity = (0.92 * endA + (t < 0.35 ? 1 - t / 0.35 : 0)).toFixed(3); endEl.style.opacity = endA.toFixed(3);
    flashL.style.opacity = (0.5 * pulse(t, st(5) + 0.1, 0.12)).toFixed(3);
    // HUD
    let lab = '', num = '', sub = '', ha = 0;
    const fade = (x0, x1) => sm(x0, x0 + 0.4, t) * (1 - sm(x1 - 0.4, x1, t));
    if (t >= st(2) && t < st(4)) { lab = 'Humanos en la Tierra'; num = '1'; sub = 'Tú'; ha = fade(st(2), st(4)); }
    else if (t >= st(5) && t < st(6)) { lab = 'Tiempo solo'; num = Math.max(1, Math.round(lerp(1, 24, sm(st(5) + 0.3, en(5) - 0.3, t)))) + ' h'; sub = 'Sin nadie en las plantas de energía'; ha = fade(st(5), st(6)); }
    else if (t >= st(6) && t < st(7)) { lab = 'Tiempo solo'; num = 'Día ' + (t < wt('dos', 0, st(6) + 1) ? 1 : 2); sub = 'Todo el planeta sin luz'; ha = fade(st(6), st(7)); }
    else if (t >= st(9) && t < st(10)) { lab = 'Tiempo solo'; const y = Math.round(lerp(1, 20, sm(st(9) + 0.3, en(9) - 0.3, t))); num = y + (y === 1 ? ' año' : ' años'); sub = 'La naturaleza recupera la ciudad'; ha = fade(st(9), st(10)); }
    setText(hudLab, lab); setText(hudNum, num); setText(hudSub, sub); hud.style.opacity = ha.toFixed(3);
    // íconos de lo que se apaga
    const on7 = t >= st(7) && t < st(8);
    iconsBox.style.opacity = (on7 ? sm(st(7), st(7) + 0.3, t) * (1 - sm(en(7) - 0.4, en(7), t)) : 0).toFixed(3);
    const it = [W.internet, W.refri, W.llave];
    icons.forEach((el, i) => { el.style.opacity = sm(it[i] - 0.25, it[i] + 0.1, t).toFixed(3); el.classList.toggle('x', t > it[i] + 0.35); });
    cta.style.opacity = (sm(wt('primero', 0, st(11) + 1.6) - 0.2, wt('primero', 0, st(11) + 1.6) + 0.4, t) * (1 - endA)).toFixed(3);
    // subtítulos
    let ct = '', ca = 0, hl = [];
    for (const [a0, b0, s, h] of CAPS) if (t >= a0 - 0.12 && t < b0 + 0.15) { ct = s; hl = h; ca = sm(a0 - 0.12, a0 + 0.08, t) * (1 - sm(b0, b0 + 0.15, t)); }
    if (t > FIN) ca = 0;
    setHTML(cap, ct.split(' ').map((w) => (hl.includes(w.replace(/[¿?¡!.,…:;]/g, '')) ? `<b>${w}</b>` : w)).join(' '));
    cap.style.opacity = ca.toFixed(3);
    return true;
  };
})();
