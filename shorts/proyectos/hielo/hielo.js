// "¿Qué pasaría si se derritiera todo el hielo del planeta?" — Groenlandia, Cancún, Veracruz, Miami y Nueva York.
// Escena 3D low-poly (three.js). Todo es función pura del tiempo t (renderAt(t)): se puede renderizar en paralelo.
// Cada lugar es un "set" en su propia posición X del mundo; la cámara corta entre sets y el mar es uno solo.
(function () {
  const T = THREE;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  function rng(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const R = rng(70);
  function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v); }
  function fbm(x, y, o = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }

  // ---------- render ----------
  const canvas = document.getElementById('gl');
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(1080, 1920, false);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(58, 1080 / 1920, 1, 60000);
  const fog = new T.FogExp2(0xd8d2c6, 0.0001);
  scene.fog = fog;
  const SUN_DIR = new T.Vector3(0.35, 0.42, -1).normalize();
  const ICE_SUN = new T.Vector3(0.5, 0.45, 0.8).normalize();

  // ---------- utilidades ----------
  function merge(geos) {
    const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
    const out = new T.BufferGeometry();
    for (const name of ['position', 'normal', 'uv', 'color']) {
      if (!parts.every((p) => p.attributes[name])) continue;
      const n = parts[0].attributes[name].itemSize;
      const arr = new Float32Array(parts.reduce((s, p) => s + p.attributes[name].array.length, 0));
      let o = 0; for (const p of parts) { arr.set(p.attributes[name].array, o); o += p.attributes[name].array.length; }
      out.setAttribute(name, new T.BufferAttribute(arr, n));
    }
    return out;
  }
  function paint(g, color) { // color por vértice a una geometría
    const c = new T.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new T.BufferAttribute(a, 3)); return g;
  }
  function noUV(g) { g.deleteAttribute('uv'); return g; }
  function canvasTex(w, h, draw, repeat = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
    if (repeat) tx.wrapS = tx.wrapT = T.RepeatWrapping;
    tx.anisotropy = 4; return tx;
  }
  const radial = (stops) => canvasTex(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, false);
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _v = new T.Vector3(), _s = new T.Vector3(), _c = new T.Color(), _e = new T.Euler();

  // ---------- luces ----------
  const hemi = new T.HemisphereLight(0xd6e6ff, 0x9a8a70, 1.0); scene.add(hemi);
  const sun = new T.DirectionalLight(0xfff0d8, 2.9);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -500, right: 500, top: 500, bottom: -500, near: 10, far: 4000 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.4;
  scene.add(sun, sun.target);

  // ---------- cielo (sigue a la cámara) ----------
  const skyG = new T.Group(); scene.add(skyG);
  const skyU = {
    top: { value: new T.Color('#3f7fd0') }, hor: { value: new T.Color('#dfe7ea') },
    sunDir: { value: SUN_DIR.clone() }, glowCol: { value: new T.Color('#ffe2b0') }, glowAmt: { value: 0.8 },
    whiteCol: { value: new T.Color('#f2f0ff') }, white: { value: 0 },
  };
  skyG.add(new T.Mesh(new T.SphereGeometry(50000, 48, 24), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, hor, sunDir, glowCol, whiteCol; uniform float glowAmt, white; varying vec3 vD;
      void main(){ vec3 d = normalize(vD); float h = d.y;
        vec3 c = mix(hor, top, smoothstep(-0.02, 0.55, h));
        float s = max(dot(d, sunDir), 0.0);
        c += glowCol * (pow(s, 6.0) * 0.35 + pow(s, 60.0) * 0.9 + pow(s, 900.0) * 3.0) * glowAmt;
        c = mix(c, whiteCol, white);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  })));
  const sunSprite = new T.Sprite(new T.SpriteMaterial({ map: radial([[0, 'rgba(255,255,252,1)'], [0.3, 'rgba(255,252,240,1)'], [0.34, 'rgba(255,238,200,.6)'], [0.55, 'rgba(255,214,150,.14)'], [1, 'rgba(255,200,140,0)']]), fog: false, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
  sunSprite.position.copy(SUN_DIR).multiplyScalar(40000); skyG.add(sunSprite);
  const cloudTex = canvasTex(512, 256, (g, w, h) => {
    const r2 = rng(5);
    for (let i = 0; i < 26; i++) {
      const x = w * (0.15 + r2() * 0.7), y = h * (0.45 + r2() * 0.25), r = 30 + r2() * 70;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  }, false);
  const clouds = [];
  for (let i = 0; i < 16; i++) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: cloudTex, fog: false, depthWrite: false, transparent: true, opacity: 0.8 }));
    const a = R() * Math.PI * 2, d = 12000 + R() * 16000;
    s.position.set(Math.cos(a) * d, 2500 + R() * 3500, Math.sin(a) * d); s.scale.set(7000 + R() * 6000, 2000 + R() * 1200, 1);
    s.userData.p = s.position.clone(); skyG.add(s); clouds.push(s);
  }

  // ---------- mar (un solo plano que sigue a la cámara) ----------
  const waterNormal = (() => {
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d'), img = g.createImageData(N, N);
    const H = (x, y) => fbm(x / 22, y / 22, 4) + 0.5 * fbm(x / 7 + 9, y / 7, 3);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = H((x + 1) % N, y) - H((x - 1 + N) % N, y), dy = H(x, (y + 1) % N) - H(x, (y - 1 + N) % N);
      const i = (y * N + x) * 4; img.data[i] = 128 + dx * 600; img.data[i + 1] = 128 + dy * 600; img.data[i + 2] = 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; return tx;
  })();
  const TILE = 60;
  waterNormal.repeat.set(140000 / TILE / 40, 140000 / TILE / 40);
  const seaMat = new T.MeshStandardMaterial({ color: '#2f8fa6', roughness: 0.22, metalness: 0.05, normalMap: waterNormal, normalScale: new T.Vector2(0.6, 0.6), side: T.DoubleSide, transparent: true, opacity: 0.93 });
  const sea = new T.Mesh(new T.PlaneGeometry(140000, 140000), seaMat);
  sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true; scene.add(sea);

  // ---------- texturas de edificios ----------
  const winTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#6f8090'; g.fillRect(w * 0.18, h * 0.22, w * 0.64, h * 0.52);
    g.fillStyle = '#e8e4dc'; g.fillRect(0, h * 0.86, w, h * 0.14);
  });
  const balcTex = canvasTex(128, 128, (g, w, h) => { // hoteles de playa: balcones
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#86b4c8'; g.fillRect(w * 0.1, h * 0.22, w * 0.8, h * 0.32);
    g.fillStyle = '#f4f2ee'; g.fillRect(0, h * 0.62, w, h * 0.12);
  });
  const glassTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#d4dde6'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5f7f9e'); gr.addColorStop(1, '#3d5774');
    g.fillStyle = gr; g.fillRect(0, h * 0.1, w, h * 0.82); g.fillStyle = '#c0cbd6'; g.fillRect(w * 0.48, 0, w * 0.04, h);
  });
  const MAT = {
    win: new T.MeshStandardMaterial({ map: winTex, vertexColors: true, roughness: 0.9 }),
    balc: new T.MeshStandardMaterial({ map: balcTex, vertexColors: true, roughness: 0.85 }),
    glass: new T.MeshStandardMaterial({ map: glassTex, vertexColors: true, roughness: 0.35, metalness: 0.35 }),
    plain: new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
    land: new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }),
    ice: new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.55, metalness: 0.05 }),
  };
  function boxGeo(x, y0, z, w, d, h, color, fu = 4, fv = 3.4, ry = 0) {
    const g = new T.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y0 + h / 2, z);
    const uv = g.attributes.uv, n = g.attributes.normal, col = new Float32Array(uv.count * 3), c = new T.Color(color);
    for (let i = 0; i < uv.count; i++) {
      const ny = n.getY(i), nx = Math.abs(n.getX(i));
      if (Math.abs(ny) > 0.5) uv.setXY(i, 0.02, 0.95);
      else uv.setXY(i, uv.getX(i) * (nx > 0.5 ? d : w) / fu, uv.getY(i) * h / fv);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); return g;
  }
  function addMerged(group, geos, mat, shadow = true) {
    if (!geos.length) return null;
    const m = new T.Mesh(merge(geos), mat); m.castShadow = m.receiveShadow = shadow; group.add(m); return m;
  }

  // ---------- modelos instanciados (palmeras, sombrillas, personas, coches) ----------
  const palmGeo = (() => {
    const parts = [];
    for (let k = 0; k < 5; k++) { const s = new T.CylinderGeometry(0.28 - k * 0.03, 0.32 - k * 0.03, 2.4, 6); s.translate(k * 0.18, 1.2 + k * 2.3, 0); parts.push(paint(noUV(s), '#8a6f4f')); }
    for (let k = 0; k < 7; k++) {
      const leaf = new T.BoxGeometry(4.6, 0.12, 0.9); leaf.translate(2.3, 0, 0); leaf.rotateZ(-0.35); leaf.rotateY(k / 7 * Math.PI * 2); leaf.translate(0.9, 11.6, 0);
      parts.push(paint(noUV(leaf), k % 2 ? '#3f7d33' : '#4f9440'));
    }
    return merge(parts);
  })();
  const umbGeo = (() => { const c = new T.ConeGeometry(1.5, 0.6, 10); c.translate(0, 2.3, 0); const p = new T.CylinderGeometry(0.04, 0.04, 2.3, 4); p.translate(0, 1.15, 0); return merge([paint(noUV(c), '#ffffff'), paint(noUV(p), '#dddddd')]); })();
  const personGeo = (() => {
    const b = new T.CylinderGeometry(0.2, 0.24, 1.25, 6); b.translate(0, 0.87, 0);
    const l = new T.BoxGeometry(0.34, 0.3, 0.2); l.translate(0, 0.15, 0);
    const h = new T.IcosahedronGeometry(0.16, 1); h.translate(0, 1.66, 0);
    return merge([noUV(b), noUV(l), noUV(h)]);
  })();
  const carGeo = (() => { const a = new T.BoxGeometry(4.2, 1.1, 1.8); a.translate(0, 0.75, 0); const b = new T.BoxGeometry(2.3, 0.7, 1.6); b.translate(-0.2, 1.6, 0); return merge([noUV(a), noUV(b)]); })();
  const vcMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
  const SHIRTS = ['#d84a3c', '#2f6fb3', '#f2f2ee', '#26262a', '#f0b429', '#3a9a5b', '#9b59b6', '#e57aa3', '#4fb3c9', '#8a6a4a'];
  const CARC = ['#e8e8e8', '#1d1d20', '#b0262b', '#3c5c8a', '#9aa0a6', '#d9d2c0'];
  function instanced(geo, mat, list, group, colors, shadow = true) { // list: [x,y,z,s,ry]
    const im = new T.InstancedMesh(geo, mat, list.length); im.castShadow = shadow; im.receiveShadow = true;
    list.forEach((p, i) => {
      _q.setFromEuler(_e.set(p[5] || 0, p[4] || 0, p[6] || 0)); _m.compose(_v.set(p[0], p[1], p[2]), _q, _s.setScalar(p[3] || 1)); im.setMatrixAt(i, _m);
      if (colors) im.setColorAt(i, _c.set(colors[i % colors.length]));
    });
    im.userData.list = list; group.add(im); return im;
  }

  // ---------- terreno de cada set ----------
  const SETS = {};
  function makeSet(name, X, hf, o = {}) {
    const g = new T.Group(); g.position.x = X; scene.add(g);
    const W = o.W || 9000, Dp = o.D || 9000, z0 = o.z0 ?? -3000, seg = o.seg || 200;
    const geo = new T.PlaneGeometry(W, Dp, seg, seg); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, z0);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new T.Color();
    const pal = o.pal || { sand: '#e6d6ad', grass: '#7b9a52', rock: '#8c8474', wet: '#b9a57e' };
    const cs = new T.Color(pal.sand), cg = new T.Color(pal.grass), cr = new T.Color(pal.rock), cw = new T.Color(pal.wet);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = hf(x, z); p.setY(i, h);
      const n = fbm(x * 0.02, z * 0.02, 3);
      if (o.colorFn) o.colorFn(c, x, z, h, n);
      else { c.copy(h < 0 ? cw : cs).lerp(cg, sm(2.5, 6, h + (n - 0.5) * 4)).lerp(cr, sm(120, 260, h + (n - 0.5) * 60)); }
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const mesh = new T.Mesh(geo.toNonIndexed(), o.mat || MAT.land); mesh.geometry.computeVertexNormals(); mesh.receiveShadow = true; g.add(mesh);
    const set = { name, X, h: hf, g, mesh }; SETS[name] = set; return set;
  }
  const under = (z) => -2 - z * 0.02;   // fondo marino (z > 0)

  // ===== Groenlandia (hielo) =====
  {
    const hf = (x, z) => {
      if (z > 0) return -35 - z * 0.01;
      const cliff = 190 * sm(0, -90, z + (fbm(x * 0.004, 2) - 0.5) * 140);
      return -35 + 35 * sm(0, -10, z) + cliff + 40 * sm(-200, -3000, z) + (fbm(x * 0.003, z * 0.003, 4) - 0.5) * 60 * sm(-150, -600, z);
    };
    const S = makeSet('ice', 0, hf, {
      W: 7000, D: 6000, z0: -2000, seg: 220, mat: MAT.ice,
      colorFn: (c, x, z, h, n) => c.set('#eef4fa').lerp(new T.Color('#9fc7e0'), sm(0.4, 0.8, n) * 0.35),
    });
    // caras del acantilado azuladas: recolorear según la normal
    const m = S.mesh, nrm = m.geometry.attributes.normal, colA = m.geometry.attributes.color;
    for (let i = 0; i < nrm.count; i++) if (nrm.getY(i) < 0.6) { const k = 1 - nrm.getY(i); colA.setXYZ(i, lerp(colA.getX(i), 0.55, k * 0.6), lerp(colA.getY(i), 0.78, k * 0.6), lerp(colA.getZ(i), 0.92, k * 0.5)); }
    // icebergs
    const bergs = [];
    for (let i = 0; i < 70; i++) bergs.push([(R() - 0.5) * 2600, 0, 60 + R() * 2200, 4 + R() * R() * 26, R() * 6]);
    const bg = new T.DodecahedronGeometry(1, 0); bg.scale(1.6, 0.9, 1.2);
    S.bergs = instanced(paint(noUV(bg), '#f2f8fc'), MAT.ice, bergs, S.g, null);
    // bloques que se desprenden
    S.calves = [];
    for (let i = 0; i < 7; i++) {
      const b = new T.Mesh(new T.BoxGeometry(30 + R() * 30, 70 + R() * 60, 25 + R() * 20), new T.MeshStandardMaterial({ color: '#dcebf5', flatShading: true, roughness: 0.5 }));
      const x = -600 + i * 190 + (R() - 0.5) * 80; b.userData = { x, z: -10, t0: 0.12 + i * 0.12, h: hf(x, -20) }; b.castShadow = true; S.g.add(b); S.calves.push(b);
    }
  }

  // ===== Cancún (zona hotelera) =====
  {
    const hf = (x, z) => {
      if (z > 0) return under(z) - 0.5;
      const n = fbm(x * 0.003, z * 0.003, 3);
      if (z > -60) return lerp(0.2, 2.2, -z / 60);
      if (z > -420) return 2.2 + n * 2.5;
      if (z > -1500) return -1.2;                     // laguna Nichupté
      return 3 + 12 * n;
    };
    const S = makeSet('cancun', 30000, hf, { pal: { sand: '#f2ead2', grass: '#6f9a4a', rock: '#8c8474', wet: '#d8cfae' } });
    const hot = [], bal = [], palms = [], umb = [], ppl = [], pcol = [];
    for (let x = -2600; x < 2600; x += 95 + R() * 50) {
      const z = -150 - R() * 140, y = hf(x, z), kind = R();
      const col = ['#ffffff', '#f6efe2', '#efe4d2', '#fff7ea', '#e9eef2'][(R() * 5) | 0];
      if (kind < 0.55) { // hotel escalonado tipo pirámide
        const lv = 6 + ((R() * 10) | 0), w = 60 + R() * 40, d = 46;
        for (let k = 0; k < lv; k++) bal.push(boxGeo(x, y + k * 3.6, z + k * 3.4, w - k * 2.2, d - k * 4, 3.6, col, 4.5, 3.6));
      } else { // torre de hotel
        const h = 30 + R() * 55; bal.push(boxGeo(x, y, z, 26 + R() * 30, 22 + R() * 10, h, col, 4.5, 3.6, (R() - 0.5) * 0.5));
      }
    }
    // el hotel de referencia (20 pisos = 70 m), cerca de la cámara del plano 3
    bal.push(boxGeo(-80, hf(-80, -120), -120, 34, 24, 70, '#fffaf0', 4.5, 3.5));
    for (let x = -2600; x < 2600; x += 16 + R() * 20) palms.push([x, hf(x, -70), -66 - R() * 30, 0.8 + R() * 0.4, R() * 6, (R() - 0.5) * 0.15, (R() - 0.5) * 0.2]);
    for (let i = 0; i < 260; i++) { const x = (R() - 0.5) * 3000, z = -12 - R() * 40; umb.push([x, hf(x, z), z, 1, R() * 6]); }
    for (let i = 0; i < 700; i++) { const x = (R() - 0.5) * 3000, z = 6 - R() * 52; ppl.push([x, Math.max(0, hf(x, z)), z, 1, R() * 6]); }
    addMerged(S.g, bal, MAT.balc);
    // casas y calles de la ciudad (tierra firme, detrás de la laguna)
    const town = [];
    for (let i = 0; i < 900; i++) { const x = (R() - 0.5) * 6000, z = -1600 - R() * 2400; town.push(boxGeo(x, hf(x, z) - 0.5, z, 10 + R() * 14, 10 + R() * 14, 4 + R() * 9, ['#f1e6d4', '#e7d3b9', '#f4f0ea', '#dfe7ea'][i % 4])); }
    addMerged(S.g, town, MAT.win);
    S.palms = instanced(palmGeo, vcMat, palms, S.g, null);
    S.umb = instanced(umbGeo, vcMat, umb, S.g, ['#e23b4c', '#2f7fd1', '#f4c430', '#ffffff', '#27a37a', '#ff7f2a']);
    S.ppl = instanced(personGeo, new T.MeshStandardMaterial({ roughness: 0.9 }), ppl, S.g, SHIRTS);
    S.hotelRef = new T.Vector3(30000 - 80, hf(-80, -120), -120 + 12);
  }

  // ===== Veracruz (puerto, malecón, fuerte) =====
  {
    const hf = (x, z) => {
      const fort = 3.5 * sm(170, 120, Math.hypot(x + 230, z - 330));
      if (z > 0) return Math.max(under(z), fort - 1);
      return 1.5 + 9 * sm(0, -2000, z) + 18 * fbm(x * 0.002, z * 0.002, 3) * sm(-300, -2500, z) + 260 * sm(-3500, -6500, z) * fbm(x * 0.0007, 4.2);
    };
    const S = makeSet('veracruz', 60000, hf, { pal: { sand: '#cfc2a2', grass: '#7f9a56', rock: '#867d6c', wet: '#a8997a' } });
    const low = [], plain = [];
    const COL = ['#f2c14e', '#e8846b', '#7fb8d8', '#f2efe6', '#d9a5c4', '#9ccf9a', '#f5deb3'];
    for (let x = -2200; x < 2200; x += 26) for (let z = -40; z > -2600; z -= 30) {
      if (R() < 0.18) continue;
      const w = 18 + R() * 8, d = 20 + R() * 8, h = 6 + R() * R() * 22 + (Math.abs(x) < 400 && z > -500 ? 6 : 0);
      low.push(boxGeo(x + (R() - 0.5) * 6, hf(x, z) - 0.5, z + (R() - 0.5) * 6, w, d, h, COL[(R() * COL.length) | 0]));
    }
    for (let i = 0; i < 14; i++) { const x = -900 + i * 70 + (R() - 0.5) * 30, z = -60 - R() * 200; low.push(boxGeo(x, hf(x, z) - 0.5, z, 26, 22, 55 + R() * 55, '#f4f1ea', 4.5, 3.5)); }
    // edificio del faro (Venustiano Carranza) en el malecón
    low.push(boxGeo(-70, hf(-70, -60), -60, 60, 30, 18, '#efe2bd'));
    plain.push(paint(noUV((() => { const g = new T.BoxGeometry(9, 22, 9); g.translate(-70, hf(-70, -60) + 29, -60); return g; })()), '#e9d9a8'));
    // malecón
    plain.push(paint(noUV((() => { const g = new T.BoxGeometry(2400, 2.5, 6); g.translate(-500, 1.2, 2); return g; })()), '#bdb4a2'));
    // fuerte de San Juan de Ulúa
    for (const [dx, dz, w, d] of [[0, 0, 150, 110], [-80, -60, 36, 36], [80, -60, 36, 36], [-80, 60, 36, 36], [80, 60, 36, 36]])
      plain.push(paint(noUV((() => { const g = new T.BoxGeometry(w, 12, d); g.translate(-230 + dx, 6, 330 + dz); return g; })()), '#a39b8a'));
    // grúas del puerto y barcos
    for (let i = 0; i < 6; i++) {
      const x = 260 + i * 70, z = -30;
      const leg = (dx, dz) => { const g = new T.BoxGeometry(2, 40, 2); g.translate(x + dx, 20, z + dz); return paint(noUV(g), i % 2 ? '#d6452f' : '#f2f2f2'); };
      plain.push(leg(-8, -8), leg(8, -8), leg(-8, 8), leg(8, 8));
      const boom = new T.BoxGeometry(4, 4, 90); boom.translate(x, 46, z + 30); plain.push(paint(noUV(boom), '#d6452f'));
      const cab = new T.BoxGeometry(18, 8, 18); cab.translate(x, 42, z); plain.push(paint(noUV(cab), '#f2f2f2'));
    }
    addMerged(S.g, low, MAT.win); addMerged(S.g, plain, MAT.plain);
    S.ships = [];
    for (let i = 0; i < 4; i++) {
      const grp = new T.Group();
      const hull = new T.Mesh(new T.BoxGeometry(150, 12, 26), new T.MeshStandardMaterial({ color: ['#2b3f5c', '#7a2b2b', '#2f5a3a', '#333'][i], roughness: 0.6 }));
      hull.position.y = 2; grp.add(hull);
      for (let k = 0; k < 5; k++) { const c = new T.Mesh(new T.BoxGeometry(12, 9, 20), new T.MeshStandardMaterial({ color: ['#c0392b', '#2980b9', '#f1c40f', '#27ae60'][k % 4] })); c.position.set(-50 + k * 22, 12, 0); grp.add(c); }
      const br = new T.Mesh(new T.BoxGeometry(14, 16, 22), new T.MeshStandardMaterial({ color: '#f2f2f2' })); br.position.set(62, 14, 0); grp.add(br);
      grp.position.set(330 + i * 120, 0, 110 + i * 70); grp.rotation.y = 0.05 * i; grp.traverse((o) => { o.castShadow = o.receiveShadow = true; }); S.g.add(grp); S.ships.push(grp);
    }
    S.palms = instanced(palmGeo, vcMat, [...Array(90)].map(() => { const x = -1800 + R() * 1900; return [x, 2.5, -12 - R() * 8, 0.9, R() * 6]; }), S.g, null);
  }

  // ===== Miami Beach =====
  {
    const hf = (x, z) => (z > 0 ? under(z) - 0.5 : z > -90 ? lerp(0.2, 2.2, -z / 90) : 2.2 + 1.5 * fbm(x * 0.003, z * 0.003, 3));
    const S = makeSet('miami', 90000, hf, { pal: { sand: '#efe3c4', grass: '#6c9a4c', rock: '#8c8474', wet: '#d2c49f' } });
    const deco = [], condo = [], plain = [];
    const PAST = ['#f7c6d0', '#bfe6e0', '#fde8a7', '#cfe0f7', '#f8d7b5', '#e2d1f2', '#ffffff'];
    for (let x = -2600; x < 2600; x += 26 + R() * 10) deco.push(boxGeo(x, 2, -125 - R() * 8, 22, 18, 10 + R() * 8, PAST[(R() * PAST.length) | 0]));
    for (let x = -2600; x < 2600; x += 60 + R() * 60) {
      const z = -230 - R() * 450, h = 70 + R() * 140;
      condo.push(boxGeo(x, 2, z, 30 + R() * 20, 24 + R() * 16, h, R() < 0.5 ? '#ffffff' : '#e9f2f6', 5, 3.4));
    }
    // torres de salvavidas de colores
    const LG = ['#ff6fa8', '#ffd23f', '#3ec6c6', '#ff8c42', '#8fd16a', '#b98cff'];
    for (let i = 0; i < 26; i++) {
      const x = -2400 + i * 190, z = -38, c = LG[i % LG.length];
      for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { const g = new T.BoxGeometry(0.25, 3, 0.25); g.translate(x + dx, hf(x, z) + 1.5, z + dz); plain.push(paint(noUV(g), '#f2f2f2')); }
      const hut = new T.BoxGeometry(4, 2.6, 3.4); hut.translate(x, hf(x, z) + 4.3, z); plain.push(paint(noUV(hut), c));
      const rf = new T.BoxGeometry(4.6, 0.4, 4); rf.translate(x, hf(x, z) + 5.8, z); plain.push(paint(noUV(rf), '#ffffff'));
    }
    addMerged(S.g, deco, MAT.win); addMerged(S.g, condo, MAT.glass); addMerged(S.g, plain, MAT.plain);
    S.palms = instanced(palmGeo, vcMat, [...Array(240)].map(() => { const x = (R() - 0.5) * 5200; return [x, 2.2, -95 - R() * 14, 0.9 + R() * 0.4, R() * 6]; }), S.g, null);
    const umb = []; for (let i = 0; i < 220; i++) { const x = (R() - 0.5) * 4000, z = -8 - R() * 60; umb.push([x, hf(x, z), z, 1, R() * 6]); }
    S.umb = instanced(umbGeo, vcMat, umb, S.g, ['#e23b4c', '#2f7fd1', '#f4c430', '#ffffff', '#27a37a']);
  }

  // ===== Nueva York (Manhattan desde la bahía) =====
  {
    const hf = (x, z) => {
      const lib = 5 * sm(130, 80, Math.hypot(x - 240, z - 1050));
      if (z > 0) return Math.max(-30 - z * 0.01, lib - 1);
      return 1.5 + 6 * fbm(x * 0.002, z * 0.002, 3) + 12 * sm(-1000, -4000, z);
    };
    const S = makeSet('nyc', 120000, hf, { pal: { sand: '#9d9886', grass: '#6f8a52', rock: '#7c776c', wet: '#7a7464' } });
    const glass = [], stone = [], plain = [];
    const STONE = ['#c9c2b6', '#b7aea0', '#d8d2c6', '#a69a8a', '#bfc5c9'];
    for (let x = -1300; x <= 1300; x += 48) for (let z = -60; z > -4200; z -= 52) {
      if (R() < 0.12) continue;
      const down = Math.exp(-(((z + 500) / 450) ** 2)), mid = Math.exp(-(((z + 3000) / 700) ** 2));
      const h = 25 + R() * 45 + (down + mid) * (60 + R() * 220) * Math.exp(-((x / 900) ** 2));
      const w = 26 + R() * 14, d = 26 + R() * 14, y = hf(x, z) - 0.5;
      if (h > 120 && R() < 0.6) glass.push(boxGeo(x, y, z, w, d, h, R() < 0.5 ? '#eef3f7' : '#dfe8ef', 5, 4));
      else stone.push(boxGeo(x, y, z, w, d, h, STONE[(R() * STONE.length) | 0]));
    }
    // Empire State (escalonado + aguja) y One World Trade Center (prisma que se afila)
    const es = [[60, 50, 0, 25], [44, 36, 25, 200], [32, 28, 225, 70], [20, 18, 295, 40], [8, 8, 335, 30]];
    es.forEach(([w, d, y0, h]) => stone.push(boxGeo(-120, hf(-120, -2900) + y0, -2900, w, d, h, '#d6cdbd')));
    plain.push(paint(noUV((() => { const g = new T.CylinderGeometry(0.6, 2.2, 70, 6); g.translate(-120, hf(-120, -2900) + 400, -2900); return g; })()), '#c9c2b6'));
    const wtc = new T.CylinderGeometry(20, 46, 417, 4, 1); wtc.rotateY(Math.PI / 4); wtc.translate(80, hf(80, -450) + 208, -450);
    const wtcM = new T.Mesh(wtc, new T.MeshStandardMaterial({ color: '#a9c3d8', roughness: 0.2, metalness: 0.6, flatShading: true })); wtcM.castShadow = true; S.g.add(wtcM);
    plain.push(paint(noUV((() => { const g = new T.CylinderGeometry(0.8, 1.5, 120, 6); g.translate(80, hf(80, -450) + 476, -450); return g; })()), '#d9dde0'));
    addMerged(S.g, glass, MAT.glass); addMerged(S.g, stone, MAT.win); addMerged(S.g, plain, MAT.plain);
    // Estatua de la Libertad
    const lib = new T.Group(), verde = new T.MeshStandardMaterial({ color: '#7fb8a4', roughness: 0.7, flatShading: true }), piedra = new T.MeshStandardMaterial({ color: '#b9ae99', roughness: 0.9 });
    const add = (geo, mat, x, y, z, rz = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz; m.castShadow = true; lib.add(m); return m; };
    add(new T.CylinderGeometry(34, 38, 8, 11), piedra, 0, 4, 0);
    add(new T.BoxGeometry(20, 26, 20), piedra, 0, 21, 0); add(new T.BoxGeometry(14, 22, 14), piedra, 0, 45, 0);
    add(new T.CylinderGeometry(4.2, 7, 30, 10), verde, 0, 71, 0);
    add(new T.SphereGeometry(3, 10, 8), verde, 0, 89, 0);
    for (let k = 0; k < 7; k++) { const sp = add(new T.ConeGeometry(0.5, 3.5, 4), verde, Math.cos(k / 6 * Math.PI) * 2.6, 91.5 + Math.sin(k / 6 * Math.PI) * 1.2, 0, (k / 6 - 0.5) * -1.6); sp.position.z = 0.5; }
    add(new T.CylinderGeometry(0.9, 1.1, 14, 6), verde, 3.6, 92, 0, -0.18);
    const torch = add(new T.CylinderGeometry(1.4, 0.8, 2.5, 8), verde, 4.9, 99.5, 0);
    const flame = add(new T.SphereGeometry(1.3, 8, 6), new T.MeshStandardMaterial({ color: '#ffd36b', emissive: '#ffb32b', emissiveIntensity: 1.2 }), 4.9, 101.5, 0);
    add(new T.BoxGeometry(3, 5, 1), verde, -3.5, 76, 1.5);
    lib.position.set(240, hf(240, 1050), 1050); lib.rotation.y = -0.15; S.g.add(lib);
    void torch; void flame;
  }

  // ===== Cerro con carretera (gente huyendo) y vista de mapa =====
  {
    const hf = (x, z) => {
      const base = -60 + 0.085 * (z + 3200) + 90 * sm(-3200, 2500, z);
      const n = (fbm(x * 0.00028 + 3, z * 0.00028, 5) - 0.5) * 520;
      return base + n * sm(-9000, -2000, z + x * 0.1) + 40 * (fbm(x * 0.002, z * 0.002, 3) - 0.5);
    };
    const S = makeSet('hills', 150000, hf, { W: 46000, D: 40000, z0: -8000, seg: 260, colorFn: (c, x, z, h, n) => c.set(h < 72 ? '#b7a77f' : '#6f8f45').lerp(new T.Color('#4f7336'), sm(0.45, 0.75, n)).lerp(new T.Color('#8a8170'), sm(700, 1000, h)) });
    // ciudad ahogada al pie del cerro
    const tw = [];
    for (let i = 0; i < 420; i++) { const x = (R() - 0.5) * 3600, z = -1900 - R() * 2200, y = hf(x, z); if (y > 60) continue; tw.push(boxGeo(x, y - 1, z, 20 + R() * 20, 20 + R() * 20, 10 + R() * R() * 150, ['#e8e4dc', '#d9d2c4', '#eef2f5'][i % 3])); }
    addMerged(S.g, tw, MAT.win);
    // carretera serpenteando cerro arriba hacia la cámara
    const roadX = (z) => 90 * Math.sin(z / 380);
    const pts = [];
    for (let z = -1700; z <= 760; z += 8) pts.push(z);
    const pos = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const za = pts[i], zb = pts[i + 1], xa = roadX(za), xb = roadX(zb), w = 7;
      const ya = hf(xa, za) + 0.4, yb = hf(xb, zb) + 0.4;
      pos.push(xa - w, ya, za, xa + w, ya, za, xb - w, yb, zb, xa + w, ya, za, xb + w, yb, zb, xb - w, yb, zb);
    }
    const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3)); rg.computeVertexNormals();
    const road = new T.Mesh(rg, new T.MeshStandardMaterial({ color: '#4e4b47', roughness: 1, side: T.DoubleSide })); road.receiveShadow = true; S.g.add(road);
    S.roadX = roadX;
    const cars = [], ppl = [];
    for (let i = 0; i < 260; i++) cars.push({ o: i * 9.5, lane: i % 2 });
    for (let i = 0; i < 900; i++) ppl.push({ o: R() * 2400, side: R() < 0.5 ? -1 : 1, off: 9 + R() * 14, v: 1 + R() * 0.6 });
    S.cars = new T.InstancedMesh(carGeo, new T.MeshStandardMaterial({ roughness: 0.5, metalness: 0.3 }), cars.length); S.cars.castShadow = true;
    cars.forEach((_, i) => S.cars.setColorAt(i, _c.set(CARC[i % CARC.length]))); S.g.add(S.cars); S.carL = cars;
    S.ppl = new T.InstancedMesh(personGeo, new T.MeshStandardMaterial({ roughness: 0.9 }), ppl.length); S.ppl.castShadow = true;
    ppl.forEach((_, i) => S.ppl.setColorAt(i, _c.set(SHIRTS[i % SHIRTS.length]))); S.g.add(S.ppl); S.pplL = ppl;
    S.trees = instanced((() => { const c = new T.IcosahedronGeometry(4, 0); c.translate(0, 6, 0); return paint(noUV(c), '#4f7a3a'); })(), vcMat,
      [...Array(1500)].map(() => { const x = (R() - 0.5) * 3000, z = -1500 + R() * 2600; return [x, hf(x, z) - 0.5, z, 0.7 + R() * 0.8, R() * 6]; }).filter((p) => Math.abs(p[0] - roadX(p[2])) > 30), S.g, null);
  }

  // ---------- lluvia y rayos ----------
  const NR = 3000, rainPos = new Float32Array(NR * 6), rainGeo = new T.BufferGeometry();
  rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3));
  const rainMat = new T.LineBasicMaterial({ color: '#cfd8e2', transparent: true, opacity: 0, fog: false });
  const rain = new T.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; scene.add(rain);
  const RAIN = []; for (let i = 0; i < NR; i++) RAIN.push({ x: R() - 0.5, z: R(), o: R(), sp: 0.8 + R() * 0.4 });
  const boltMat = new T.MeshBasicMaterial({ color: '#f4f2ff', fog: false, transparent: true, opacity: 0, toneMapped: false });
  const bolts = [0, 1, 2].map((k) => {
    const r2 = rng(40 + k * 9), parts = []; let x = 0, y = 0;
    for (let i = 0; i < 16; i++) {
      const nx = x + (r2() - 0.5) * 200, ny = y - 90 - r2() * 50, len = Math.hypot(nx - x, ny - y), g = new T.BoxGeometry(16, len, 4);
      g.rotateZ(-Math.atan2(nx - x, -(ny - y))); g.translate((x + nx) / 2, (y + ny) / 2, 0); parts.push(g); x = nx; y = ny;
    }
    const m = new T.Mesh(merge(parts.map(noUV)), boltMat); m.visible = false; scene.add(m); return m;
  });

  // ---------- capa HTML ----------
  const $ = (id) => document.getElementById(id);
  const hud = $('hud'), hudLab = hud.querySelector('.lab'), hudNum = hud.querySelector('.num'), hudSub = hud.querySelector('.sub');
  const cap = $('cap'), flash = $('flash'), black = $('black'), endEl = $('end'), tint = $('tint'), uw = $('uw'), loc = $('loc'), cta = $('cta');
  const ruler = $('ruler'), rulerLab = ruler.querySelector('.l');
  const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  function setText(el, s) { if (el.__t !== s) { el.textContent = s; el.__t = s; } }
  function setHTML(el, s) { if (el.__h !== s) { el.innerHTML = s; el.__h = s; } }

  // ---------- datos del proyecto ----------
  let D = null, S = {}, CAPS = [], WORDS = [], FIN = 50;
  const st = (k) => S[k][0], en = (k) => S[k][1];
  function wt(w, n = 0) { // instante en que se dice la palabra (n-ésima aparición)
    const k = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    let c = 0; for (const x of WORDS) if (k(x.w) === k(w) && c++ === n) return x.start;
    return null;
  }
  let SHOTS = [], SEA = [];
  window.loadProject = (data) => {
    D = data; S = data.scenes; CAPS = data.caps; WORDS = data.words; FIN = data.fin;
    const W = (w, d, n = 0) => wt(w, n) ?? d;
    const tPl = W('playas', st(4) + 1.5), tCa = W('calles', st(4) + 3), tCs = W('casas', st(4) + 4.6);
    const tCun = W('Cancún', st(5) + 1.4), tVer = W('Veracruz', st(5) + 2), tMia = W('Miami', st(5) + 2.5), tNY = W('Nueva', st(5) + 3.2);
    const tHur = W('tormentas', st(7) + 4.5);
    // nivel del mar: [tiempo, metros]
    SEA = [[0, 0], [st(4), 0], [tPl + 0.4, 3], [tCa + 0.4, 10], [tCs + 0.5, 24], [st(5) + 0.3, 26], [en(5) - 0.4, 70], [D.duration, 70]];
    // planos: [inicio, fin, set, posA, posB, mirarA, mirarB]
    const G = (x, z, dy) => SETS.hills.h(x, z) + dy;
    SHOTS = [
      [0, st(2), 'cancun', [260, 70, 30], [200, 46, -5], [-500, 18, -170], [-520, 16, -170]],
      [st(2), st(3), 'ice', [-150, 150, 900], [-60, 115, 600], [0, 150, -200], [40, 140, -200]],
      [st(3), st(4), 'cancun', [60, 30, 90], [90, 40, 120], [-80, 40, -120], [-80, 40, -120]],
      [st(4), tCun - 0.1, 'cancun', [250, 55, 40], [290, 72, 80], [-500, 5, -170], [-500, 5, -170]],
      [tCun - 0.1, tVer - 0.05, 'cancun', [320, 95, 90], [335, 98, 100], [-500, 12, -170], [-500, 12, -170]],
      [tVer - 0.05, tMia - 0.05, 'veracruz', [220, 80, 470], [205, 82, 450], [-150, 15, -350], [-150, 15, -350]],
      [tMia - 0.05, tNY - 0.05, 'miami', [260, 85, 20], [250, 86, 10], [-600, 45, -200], [-600, 45, -200]],
      [tNY - 0.05, st(6), 'nyc', [380, 110, 1700], [320, 95, 1450], [-60, 170, -900], [-60, 160, -900]],
      [st(6), st(7), 'nyc', [200, 50, 420], [150, -24, 220], [-60, 10, -400], [-60, 0, -400]],
      [st(7), tHur - 0.2, 'miami', [300, 82, 60], [280, 78, 40], [-600, 45, -220], [-600, 45, -220]],
      [tHur - 0.2, st(8), 'miami', [250, 76, 30], [240, 72, 20], [-600, 40, -220], [-600, 40, -220]],
      [st(8), st(9), 'hills', [40, G(40, 520, 40), 520], [20, G(20, 400, 38), 400], [-60, 40, -2600], [-40, 40, -2600]],
      [st(9), st(10), 'hills', [20, G(20, 400, 38), 400], [0, 9000, 5000], [-40, 40, -2600], [0, -400, -6000]],
      [st(10), D.duration, 'cancun', [160, 95, 140], [140, 88, 120], [-80, 60, -120], [-120, 55, -140]],
    ];
    window.SEA = SEA; window.SHOTS = SHOTS;
    return 'hielo ' + data.duration.toFixed(1) + 's';
  };
  function seaLevel(t) {
    for (let i = 0; i < SEA.length - 1; i++) { const [a, la] = SEA[i], [b, lb] = SEA[i + 1]; if (t <= b) return lerp(la, lb, b > a ? sm(a, b, t) : 1); }
    return SEA[SEA.length - 1][1];
  }

  const C = (h) => new T.Color(h);
  const SEA_COL = { cancun: C('#2fb3c0'), veracruz: C('#4f8a8c'), miami: C('#37a7c2'), nyc: C('#3b5d73'), ice: C('#1f4a63'), hills: C('#3f7f98') };

  window.renderAt = function (t) {
    const shot = SHOTS.find((s) => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
    const [a, b, setName, pA, pB, lA, lB] = shot;
    const set = SETS[setName], X = set.X;
    const u = setName === 'hills' && a === st(9) ? sm(a, b, t) ** 1.4 : sm(a - 0.6, b + 0.6, t);
    camera.position.set(X + lerp(pA[0], pB[0], u), lerp(pA[1], pB[1], u), lerp(pA[2], pB[2], u));
    const look = _v.set(X + lerp(lA[0], lB[0], u), lerp(lA[1], lB[1], u), lerp(lA[2], lB[2], u));
    camera.position.x += Math.sin(t * 0.17) * 0.6; camera.position.y += Math.sin(t * 0.23) * 0.25;
    { const gh = set.h(camera.position.x - X, camera.position.z); if (camera.position.y < gh + 8) camera.position.y = gh + 8; }
    const L = seaLevel(t);

    // fases de ambiente
    const heat = sm(st(7), st(7) + 1.5, t) * (1 - sm(wt('tormentas') ?? st(7) + 4.5, (wt('tormentas') ?? st(7) + 4.5) + 1, t));
    const storm = sm((wt('tormentas') ?? st(7) + 4.5) - 0.6, (wt('tormentas') ?? st(7) + 4.5) + 0.6, t) * (1 - sm(st(8) - 0.2, st(8) + 0.3, t));
    const dusk = sm(st(10) - 0.3, st(10) + 0.3, t);
    const mapv = setName === 'hills' && t >= st(9) ? sm(st(9), en(9), t) : 0;
    let fl = 0;
    if (storm > 0) for (const r of [st(7) + 4.7, wt('huracanes') ?? st(7) + 5.8, wt('monstruosos') ?? st(7) + 6.8]) fl = Math.max(fl, Math.exp(-(((t - r) / 0.07) ** 2)) + 0.7 * Math.exp(-(((t - r - 0.2) / 0.06) ** 2)));
    fl *= storm;
    const shake = 0.15 * fl + 0.5 * storm;
    if (shake > 0) { camera.position.x += Math.sin(t * 53) * shake; camera.position.y += Math.cos(t * 47) * shake * 0.6; }
    camera.lookAt(look); camera.updateMatrixWorld();

    // cielo y luz según el lugar
    const isIce = setName === 'ice';
    skyG.position.copy(camera.position);
    clouds.forEach((c, i) => { c.position.set(c.userData.p.x + t * 30, c.userData.p.y, c.userData.p.z); c.material.opacity = (isIce ? 0.95 : 0.75) * (1 - heat) * (1 - storm); c.material.color.set(storm > 0.5 ? '#555a62' : '#ffffff'); });
    skyU.top.value.set(isIce ? '#8ea9c0' : '#3f7fd0').lerp(C('#c9b98f'), heat).lerp(C('#262b33'), storm).lerp(C('#2d3158'), dusk);
    skyU.hor.value.set(isIce ? '#e4ecf0' : '#e2eaec').lerp(C('#f2d4a0'), heat).lerp(C('#545b65'), storm).lerp(C('#e48b5c'), dusk);
    skyU.glowAmt.value = (0.8 + 2.5 * heat) * (1 - storm) + 0.5 * dusk;
    skyU.white.value = 0.15 * heat + 0.3 * fl;
    sunSprite.scale.setScalar(3200 * (1 + 1.5 * heat) * (1 - storm) * (isIce ? 0.6 : 1));
    fog.color.set(isIce ? '#dfe8ee' : '#d9e2e6').lerp(C('#efd2a0'), heat).lerp(C('#4c535c'), storm).lerp(C('#9a7a72'), dusk);
    fog.density = mapv > 0 ? lerp(0.00011, 0.000028, mapv) : (isIce ? 0.00016 : 0.00011) + 0.00012 * heat + 0.0005 * storm;
    sun.intensity = (isIce ? 2.2 : 2.9) * (1 + 0.4 * heat) * (1 - 0.95 * storm) * (1 - 0.55 * dusk);
    sun.color.set('#fff0d8').lerp(C('#ffd08a'), heat).lerp(C('#ff9a5a'), dusk);
    hemi.intensity = (1 - 0.45 * storm) * (1 - 0.3 * dusk) + 3.5 * fl;
    renderer.toneMappingExposure = 0.95 + 0.25 * heat - 0.05 * storm - 0.1 * dusk;
    sun.target.position.set(look.x, 0, look.z).lerp(camera.position, 0.45); sun.target.position.y = 0;
    sun.position.copy(sun.target.position).addScaledVector(isIce ? ICE_SUN : SUN_DIR, 2000);
    const sc = mapv > 0.2 ? 6000 : 500; Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, far: 2000 + sc * 2 }); sun.shadow.camera.updateProjectionMatrix();

    // mar
    sea.position.set(camera.position.x, L + Math.sin(t * 0.8) * 0.15 * (1 + 6 * storm), camera.position.z);
    seaMat.color.copy(SEA_COL[setName]).lerp(C('#5a4d3c'), setName === 'hills' ? 0 : sm(5, 30, L) * 0.35).lerp(C('#2c3a42'), storm).lerp(C('#3b3a55'), dusk * 0.6);
    seaMat.normalScale.setScalar(0.6 + 1.6 * storm);
    waterNormal.offset.set((camera.position.x / 40) / TILE + t * 0.01 * (1 + 4 * storm), (camera.position.z / 40) / TILE + t * 0.006);
    seaMat.roughness = 0.22 + 0.2 * storm;

    // sets: solo el visible
    for (const k in SETS) SETS[k].g.visible = k === setName;

    // Groenlandia: icebergs flotando y bloques que caen
    if (isIce) {
      const ice = SETS.ice;
      ice.bergs.userData.list.forEach((p, i) => { _q.setFromEuler(_e.set(0.05 * Math.sin(t + i), p[4], 0)); _m.compose(_v.set(p[0] + t * 1.5, -p[3] * 0.25 + Math.sin(t * 0.9 + i) * 0.4, p[2]), _q, _s.setScalar(p[3])); ice.bergs.setMatrixAt(i, _m); });
      ice.bergs.instanceMatrix.needsUpdate = true;
      ice.calves.forEach((c) => {
        const t0 = lerp(st(2), en(2), c.userData.t0), k = clamp((t - t0) / 1.8, 0, 1);
        const y = c.userData.h - 30 - 210 * k * k, tilt = 1.2 * k * k;
        c.position.set(c.userData.x, Math.max(y, -60), c.userData.z + 30 * k); c.rotation.set(tilt, 0, 0.3 * k);
        c.visible = t > t0 - 3;
      });
    }
    // Cancún: la gente se va de la playa cuando sube el mar; palmeras con viento
    if (setName === 'cancun') {
      const cs = SETS.cancun;
      cs.ppl.userData.list.forEach((p, i) => {
        const gone = L > 0.5 || t > st(4) + 0.3 ? sm(0, 1, (Math.max(L, 0.01) - p[1] + 1.5) / 1.5) : 0;
        _q.setFromEuler(_e.set(0, p[4], 0)); _m.compose(_v.set(p[0] + Math.sin(t * 0.5 + i) * 2, p[1], p[2] - gone * 30), _q, _s.setScalar(gone >= 1 ? 0 : 1)); cs.ppl.setMatrixAt(i, _m);
      });
      cs.ppl.instanceMatrix.needsUpdate = true;
      cs.umb.visible = L < 4;
    }
    for (const k of ['cancun', 'miami', 'veracruz']) {
      if (k !== setName) continue;
      const pm = SETS[k].palms, wind = 0.04 + 0.35 * storm;
      pm.userData.list.forEach((p, i) => { _q.setFromEuler(_e.set((p[5] || 0) + Math.sin(t * 2.3 + i) * wind * 0.4, p[4], (p[6] || 0) + Math.sin(t * 1.7 + i * 0.7) * wind)); _m.compose(_v.set(p[0], p[1], p[2]), _q, _s.setScalar(p[3])); pm.setMatrixAt(i, _m); });
      pm.instanceMatrix.needsUpdate = true;
    }
    if (setName === 'veracruz') SETS.veracruz.ships.forEach((s, i) => { s.position.y = L + Math.sin(t * 0.7 + i) * 0.4; s.rotation.z = Math.sin(t * 0.6 + i) * 0.02; });
    // Cerro: coches y gente subiendo
    if (setName === 'hills') {
      const hs = SETS.hills, H = hs.h, rx = hs.roadX;
      hs.carL.forEach((c, i) => {
        const z = -1650 + ((c.o + t * 2.2) % 2400), x = rx(z) + (c.lane ? 3 : -3), y = H(x, z) + 0.4;
        const dz = 2, ang = Math.atan2(rx(z + dz) - rx(z), dz);
        _q.setFromEuler(_e.set(0, -Math.PI / 2 + ang, 0)); _m.compose(_v.set(x, y, z), _q, _s.setScalar(1)); hs.cars.setMatrixAt(i, _m);
      });
      hs.pplL.forEach((p, i) => {
        const z = -1650 + ((p.o + t * p.v * 1.4) % 2400), x = rx(z) + p.side * p.off, y = H(x, z);
        _q.setFromEuler(_e.set(0, 0, 0)); _m.compose(_v.set(x, y + Math.abs(Math.sin(t * 6 + i)) * 0.05, z), _q, _s.setScalar(1.15)); hs.ppl.setMatrixAt(i, _m);
      });
      hs.cars.instanceMatrix.needsUpdate = true; hs.ppl.instanceMatrix.needsUpdate = true;
    }

    // lluvia y rayos
    rain.visible = storm > 0.02;
    if (rain.visible) {
      rainMat.opacity = 0.55 * storm; const cp = camera.position;
      const fw = new T.Vector3(); camera.getWorldDirection(fw); fw.y = 0; fw.normalize(); const rt = new T.Vector3(-fw.z, 0, fw.x);
      for (let i = 0; i < NR; i++) {
        const r = RAIN[i], dpt = 4 + r.z * 140, side = r.x * dpt * 1.3;
        const x = cp.x + fw.x * dpt + rt.x * side, z = cp.z + fw.z * dpt + rt.z * side, H = 100, y = cp.y + 50 - ((t * 28 * r.sp + r.o * H) % H);
        rainPos.set([x, y, z, x - 0.8, y - 3, z + 0.3], i * 6);
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
    const RT = [st(7) + 4.7, wt('huracanes') ?? st(7) + 5.8, wt('monstruosos') ?? st(7) + 6.8];
    bolts.forEach((bo, i) => {
      const r = RT[i], aa = Math.exp(-(((t - r) / 0.09) ** 2)) + 0.7 * Math.exp(-(((t - r - 0.2) / 0.07) ** 2));
      bo.visible = storm > 0.1 && aa > 0.08;
      if (bo.visible) { bo.position.set(camera.position.x + [-900, 600, -200][i], 1500, camera.position.z - 3600); bo.lookAt(camera.position.x, 1500, camera.position.z); boltMat.opacity = Math.min(1, aa); }
    });

    // bajo el agua
    const below = camera.position.y < sea.position.y;
    if (below) { fog.color.set('#1a6672'); fog.density = 0.0011; hemi.intensity = 1.1; }

    renderer.render(scene, camera);

    // ---------- capa 2D ----------
    uw.style.opacity = below ? '1' : '0';
    tint.style.background = `rgba(255,150,40,${(0.12 * heat).toFixed(3)})`;
    flash.style.opacity = (0.45 * fl).toFixed(3);
    const endA = sm(FIN, FIN + 0.8, t);
    black.style.opacity = (0.9 * endA).toFixed(3); endEl.style.opacity = endA.toFixed(3);

    // nombre del lugar
    const LOC = { cancun: 'CANCÚN', veracruz: 'VERACRUZ', miami: 'MIAMI', nyc: 'NUEVA YORK', ice: 'GROENLANDIA', hills: '' };
    const showLoc = (t >= st(1) && t < st(2) + 0) || (t >= st(5) && t < st(6)) || (t >= st(2) && t < st(3));
    setText(loc, LOC[setName]); loc.style.opacity = (showLoc && LOC[setName] ? sm(a, a + 0.15, t) * (1 - sm(b - 0.1, b, t)) * (1 - endA) : 0).toFixed(3);

    // HUD
    let lab = '', num = '', sub = '', ha = 0;
    const fade = (x0, x1) => sm(x0, x0 + 0.4, t) * (1 - sm(x1 - 0.4, x1, t));
    if (t >= st(2) && t < st(3)) { lab = 'Nivel del mar'; num = '+' + fmt(70 * sm(st(2) + 0.6, en(2) - 0.6, t)) + ' m'; sub = 'Si se derrite todo el hielo'; ha = fade(st(2), st(3)); }
    else if (t >= st(4) && t < st(7)) { lab = 'Nivel del mar'; num = '+' + fmt(L) + ' m'; sub = t < st(5) ? 'Playas, calles, casas' : 'Ciudades bajo el agua'; ha = fade(st(4), st(7)) * (below ? 0 : 1); }
    else if (t >= st(7) && t < st(8)) { const hs = storm > 0.5; lab = hs ? 'Huracanes' : 'Temperatura del planeta'; num = hs ? 'Categoría 5+' : '+' + fmt(2 + 4 * sm(st(7) + 0.5, st(7) + 4, t), 1) + ' °C'; sub = hs ? 'Más fuertes y más seguidos' : 'Sin hielo que refleje el Sol'; ha = fade(st(7), st(8)); }
    else if (t >= st(8) && t < st(9)) { lab = 'Personas en la costa'; num = fmt(1000 * sm(st(8) + 0.4, en(8) - 0.8, t)) + ' millones'; sub = 'Tendrían que mudarse'; ha = fade(st(8), st(9)); }
    else if (t >= st(9) && t < st(10)) { lab = 'Nivel del mar'; num = '+70 m'; sub = 'El nuevo mapa del mundo'; ha = fade(st(9), st(10)); }
    setText(hudLab, lab); setText(hudNum, num); setText(hudSub, sub);
    hud.style.opacity = ha.toFixed(3);

    // regla de 20 pisos (plano 3)
    if (t >= st(3) && t < st(4) && setName === 'cancun') {
      const base = SETS.cancun.hotelRef.clone(), top = base.clone(); top.y += 70; base.x += 22; top.x += 22;
      const p0 = base.project(camera), p1 = top.project(camera);
      const x = (p0.x * 0.5 + 0.5) * 1080, y0 = (-p0.y * 0.5 + 0.5) * 1920, y1 = (-p1.y * 0.5 + 0.5) * 1920;
      const grow = sm(st(3) + 0.3, (wt('20') ?? st(3) + 3.5), t);
      ruler.style.left = x.toFixed(0) + 'px'; ruler.style.top = (y0 - (y0 - y1) * grow).toFixed(0) + 'px'; ruler.style.height = ((y0 - y1) * grow).toFixed(0) + 'px';
      setText(rulerLab, fmt(20 * grow) + ' pisos · ' + fmt(70 * grow) + ' m');
      ruler.style.opacity = fade(st(3), st(4)).toFixed(3);
    } else ruler.style.opacity = '0';

    cta.style.opacity = (sm(st(10) + 0.3, st(10) + 0.9, t) * (1 - endA)).toFixed(3);

    // subtítulos
    let ct = '', ca = 0, hl = [];
    for (const [a0, b0, s, h] of CAPS) if (t >= a0 - 0.12 && t < b0 + 0.15) { ct = s; hl = h; ca = sm(a0 - 0.12, a0 + 0.08, t) * (1 - sm(b0, b0 + 0.15, t)); }
    if (t > FIN) ca = 0;
    setHTML(cap, ct.split(' ').map((w) => (hl.includes(w.replace(/[¿?¡!.,…:;]/g, '')) ? `<b>${w}</b>` : w)).join(' '));
    cap.style.opacity = ca.toFixed(3);
    return true;
  };
})();
