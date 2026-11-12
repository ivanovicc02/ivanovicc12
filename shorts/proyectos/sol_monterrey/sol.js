// "¿Qué pasaría si el Sol explotara?" — vista de Monterrey, N.L.
// Escena 3D low-poly (three.js). Todo es función pura del tiempo t (renderAt(t)),
// así que se puede renderizar en paralelo y en cualquier orden.
(function () {
  const T = THREE;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  function rng(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const R = rng(2026);
  function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v); }
  function fbm(x, y, o = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }

  // ---------- línea de tiempo (segundos) ----------
  const TL = { title: 3.6, light: 26, bright: 36, heat: 48, here: 64, black: 71.4, end: 80 };
  const CAPS = [
    [4.0, 8.8, 'El Sol acaba de explotar.'],
    [9.4, 14.6, 'Y no lo sabrás sino hasta dentro de ocho minutos.'],
    [15.2, 20.2, 'Su luz todavía viene en camino.'],
    [20.8, 25.6, 'Monterrey sigue como si nada.'],
    [26.6, 30.8, 'Luego el Sol se pone más brillante.'],
    [31.4, 35.6, 'Y más brillante.'],
    [36.6, 41.6, 'Todo lo que toca empieza a arder.'],
    [42.2, 47.4, 'El agua del Paseo Santa Lucía hierve.'],
    [48.6, 53.6, 'Después ves la explosión.'],
    [54.2, 58.8, 'Ocupa la mitad del cielo.'],
    [59.4, 63.8, 'No hay lugar en la Tierra donde esconderse.'],
  ];

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
  const camera = new T.PerspectiveCamera(58, 1080 / 1920, 0.5, 40000);
  const fog = new T.FogExp2(0xd8d2c6, 0.00009);
  scene.fog = fog;

  const SUN_DIR = new T.Vector3(-0.1, 0.235, -1).normalize();

  // ---------- luces ----------
  const hemi = new T.HemisphereLight(0xcfe0ff, 0x8a7458, 1.0);
  scene.add(hemi);
  const sun = new T.DirectionalLight(0xffe2b8, 2.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -140, right: 140, top: 260, bottom: -260, near: 10, far: 3000 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.3;
  sun.target.position.set(0, 0, -200);
  sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 1200);
  scene.add(sun, sun.target);
  const fillL = new T.DirectionalLight(0x9db8ff, 0.35);
  fillL.position.set(200, 300, 400); scene.add(fillL);

  // ---------- utilidades de geometría ----------
  function merge(geos) { // geometrías ya transformadas -> una sola no indexada
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
  function canvasTex(w, h, draw, repeat = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
    if (repeat) { tx.wrapS = tx.wrapT = T.RepeatWrapping; }
    tx.anisotropy = 4;
    return tx;
  }
  const radial = (stops) => canvasTex(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, false);

  // ---------- cielo ----------
  const skyU = {
    top: { value: new T.Color('#3f78c6') }, hor: { value: new T.Color('#e6dccb') },
    sunDir: { value: SUN_DIR.clone() }, glowCol: { value: new T.Color('#ffd9a0') }, glowAmt: { value: 1 },
    whiteCol: { value: new T.Color('#fff6e6') }, white: { value: 0 },
  };
  const sky = new T.Mesh(new T.SphereGeometry(30000, 48, 24), new T.ShaderMaterial({
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
  }));
  scene.add(sky);

  // disco del sol y su halo (sprites)
  const sunTex = radial([[0, 'rgba(255,255,252,1)'], [0.3, 'rgba(255,252,240,1)'], [0.34, 'rgba(255,238,200,.6)'], [0.55, 'rgba(255,214,150,.14)'], [1, 'rgba(255,200,140,0)']]);
  const sunSprite = new T.Sprite(new T.SpriteMaterial({ map: sunTex, fog: false, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
  sunSprite.position.copy(SUN_DIR).multiplyScalar(25000);
  scene.add(sunSprite);
  const sunCore = new T.Sprite(new T.SpriteMaterial({ map: radial([[0, 'rgba(255,255,255,1)'], [0.82, 'rgba(255,253,245,1)'], [1, 'rgba(255,250,235,0)']]), fog: false, depthWrite: false, transparent: true, toneMapped: false }));
  sunCore.position.copy(SUN_DIR).multiplyScalar(24900); scene.add(sunCore);

  // nubes
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
  for (let i = 0; i < 9; i++) {
    const m = new T.SpriteMaterial({ map: cloudTex, fog: false, depthWrite: false, transparent: true, opacity: 0.8 });
    const s = new T.Sprite(m);
    const z = -9000 - R() * 9000, x = (R() < 0.5 ? -1 : 1) * (3000 + R() * 5000), y = 2200 + R() * 2600;
    s.position.set(x, y, z); s.scale.set(5000 + R() * 4000, 1500 + R() * 900, 1);
    s.userData.x0 = x; s.userData.v = 8 + R() * 10; scene.add(s); clouds.push(s);
  }

  // ---------- terreno: Cerro de la Silla y sierras ----------
  const SILLA_X = -560, SILLA_Z = -5400;
  function silla(xr) { // perfil de la Silla (xr = x relativo al centro)
    const a = 1180 * Math.exp(-(((xr + 600) / 430) ** 2)); // pico norte (redondeado)
    const b = 760 * Math.exp(-((xr / 520) ** 2));          // la "silla"
    const c = 1300 * Math.exp(-Math.abs(xr - 430) / 170);  // pico sur, agudo
    const d = 520 * Math.exp(-((xr / 1900) ** 2));         // falda
    return Math.pow(a ** 4 + b ** 4 + c ** 4 + d ** 4, 0.25);
  }
  function terrainH(x, z) {
    let h = 0;
    const p = silla(x - SILLA_X);
    h = Math.max(h, p * Math.pow(Math.max(0, 1 - Math.abs(z - SILLA_Z) / (900 + p * 0.9)), 1.4));
    // Sierra Madre a la derecha y lomas al fondo
    const sm1 = 950 * sm(400, 2600, x) * Math.pow(Math.max(0, 1 - Math.abs(z - (-7600 + x * 0.6)) / 2200), 1.3);
    const back = (350 + 450 * fbm(x * 0.0004, 3.1)) * Math.pow(Math.max(0, 1 - Math.abs(z + 10500) / 2600), 1.2);
    const mitras = 700 * Math.exp(-(((x + 3400) / 900) ** 2)) * Math.pow(Math.max(0, 1 - Math.abs(z + 6000) / 1600), 1.4);
    h = Math.max(h, sm1, back, mitras);
    if (h > 5) h += (fbm(x * 0.004, z * 0.004, 4) - 0.5) * 130 * Math.min(1, h / 300);
    return h - 3;
  }
  {
    const g = new T.PlaneGeometry(30000, 11000, 240, 110);
    g.rotateX(-Math.PI / 2); g.translate(0, 0, -8400);
    const p = g.attributes.position, cols = new Float32Array(p.count * 3);
    const cLow = new T.Color('#7b8059'), cMid = new T.Color('#86866a'), cHi = new T.Color('#9a8f7c'), c = new T.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = terrainH(x, z);
      p.setY(i, h);
      const u = clamp(h / 1100, 0, 1), n = fbm(x * 0.01, z * 0.01, 3);
      c.copy(cLow).lerp(cMid, sm(0.15, 0.5, u + (n - 0.5) * 0.3)).lerp(cHi, sm(0.55, 0.95, u + (n - 0.5) * 0.3));
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new T.BufferAttribute(cols, 3));
    g.computeVertexNormals();
    const m = new T.Mesh(g.toNonIndexed(), new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
    m.geometry.computeVertexNormals();
    scene.add(m);
  }
  // suelo de la ciudad
  const groundMat = new T.MeshStandardMaterial({ color: '#a39782', roughness: 1 });
  const ground = new T.Mesh(new T.PlaneGeometry(40000, 40000), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; scene.add(ground);

  // ---------- edificios ----------
  const winTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#6f7c8a';
    g.fillRect(w * 0.2, h * 0.22, w * 0.6, h * 0.5);
    g.fillStyle = '#e5e1d8'; g.fillRect(0, h * 0.86, w, h * 0.14);
  });
  const glassTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#d7e3ee'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5f7f9e'); gr.addColorStop(1, '#3f5a78');
    g.fillStyle = gr; g.fillRect(0, h * 0.12, w, h * 0.8);
    g.fillStyle = '#c4d0dc'; g.fillRect(w * 0.48, 0, w * 0.04, h);
  });
  function boxGeo(x, z, w, d, h, color, fu = 4, fv = 3.4, y0 = 0) {
    const g = new T.BoxGeometry(w, h, d); g.translate(x, y0 + h / 2, z);
    const uv = g.attributes.uv, n = g.attributes.normal, col = new Float32Array(uv.count * 3);
    for (let i = 0; i < uv.count; i++) {
      const ny = n.getY(i), nx = Math.abs(n.getX(i));
      if (Math.abs(ny) > 0.5) uv.setXY(i, 0.02, 0.95); // techo: color liso
      else uv.setXY(i, uv.getX(i) * (nx > 0.5 ? d : w) / fu, uv.getY(i) * h / fv);
      col.set([color.r, color.g, color.b], i * 3);
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    return g;
  }
  const bldMat = new T.MeshStandardMaterial({ map: winTex, vertexColors: true, roughness: 0.9 });
  const glassMat = new T.MeshStandardMaterial({ map: glassTex, vertexColors: true, roughness: 0.35, metalness: 0.35 });
  const PAL = ['#e8e1d3', '#d9cbb3', '#cfc6b8', '#e4d2bd', '#bfb7aa', '#efe9df', '#d6b79a', '#c9c2b5'].map((c) => new T.Color(c));
  const lowG = [], towG = [], roofSpots = [];
  for (let gx = -4200; gx <= 4200; gx += 64) {
    for (let gz = -60; gz >= -5200; gz -= 64) {
      if (Math.abs(gx) < 95 && gz > -1060) continue;            // Macroplaza
      if (gz < -900 && gz > -980 && Math.abs(gx) < 600) continue;
      const vis = Math.abs(gx) < 120 + Math.abs(gz) * 0.42;      // solo lo que cabe en cuadro
      if (!vis) continue;
      for (let k = 0; k < 2; k++) {
        const x = gx + (k ? 16 : -16) + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 18;
        const near = Math.abs(gx) < 300 && gz > -1400;
        const h = near ? 14 + R() * 45 : 6 + R() * R() * 26;
        const w = 18 + R() * 10, d = 22 + R() * 30;
        lowG.push(boxGeo(x, z, w, d, h, PAL[(R() * PAL.length) | 0]));
        if (near && gz > -700) roofSpots.push(new T.Vector3(x, h, z));
      }
    }
  }
  // torres (zona centro / Valle Oriente al fondo)
  const TOWERS = [[260, -1500, 150], [330, -1650, 210], [420, -1560, 125], [190, -1900, 175], [520, -2100, 240], [380, -2350, 160],
    [-260, -1700, 120], [-380, -2200, 190], [-180, -2600, 140], [640, -2700, 205], [-520, -2900, 165], [120, -2300, 110]];
  for (const [x, z, h] of TOWERS) {
    const w = 26 + R() * 14, d = 26 + R() * 12;
    towG.push(boxGeo(x, z, w, d, h, new T.Color('#e8eef4'), 6, 4));
    towG.push(boxGeo(x, z, w * 0.6, d * 0.6, 12, new T.Color('#c8ced6'), 6, 4, h));
  }
  const lowMesh = new T.Mesh(merge(lowG), bldMat); lowMesh.castShadow = lowMesh.receiveShadow = true; scene.add(lowMesh);
  const towMesh = new T.Mesh(merge(towG), glassMat); towMesh.castShadow = towMesh.receiveShadow = true; scene.add(towMesh);

  // ---------- Macroplaza ----------
  const paveMat = new T.MeshStandardMaterial({ color: '#cdb9a2', roughness: 0.95 });
  const plaza = new T.Mesh(new T.PlaneGeometry(92, 1100), paveMat);
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.02, -490); plaza.receiveShadow = true; scene.add(plaza);
  const grassMat = new T.MeshStandardMaterial({ color: '#6f9348', roughness: 1 });
  for (let z = -40; z > -1000; z -= 110) {
    for (const x of [-30, 30]) {
      const gp = new T.Mesh(new T.PlaneGeometry(22, 70), grassMat);
      gp.rotation.x = -Math.PI / 2; gp.position.set(x, 0.05, z - 35); gp.receiveShadow = true; scene.add(gp);
    }
  }
  // calles (franjas oscuras)
  const asphalt = new T.MeshStandardMaterial({ color: '#57534e', roughness: 1 });
  for (const [x, z, w, d] of [[0, -470, 3000, 26], [-80, -1500, 22, 3000], [104, -1500, 22, 3000], [0, -1080, 3000, 30]]) {
    const r = new T.Mesh(new T.PlaneGeometry(w, d), asphalt); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.03, z); r.receiveShadow = true; scene.add(r);
  }
  // Paseo Santa Lucía (canal)
  const waterMat = new T.MeshStandardMaterial({ color: '#3f8fa3', roughness: 0.15, metalness: 0.2, emissive: '#000000' });
  const canal = new T.Mesh(new T.PlaneGeometry(16, 1300), waterMat);
  canal.rotation.x = -Math.PI / 2; canal.position.set(64, 0.06, -560); canal.receiveShadow = true; scene.add(canal);
  const stoneMat = new T.MeshStandardMaterial({ color: '#b9a690', roughness: 1 });
  for (const x of [55, 73]) { const e = new T.Mesh(new T.BoxGeometry(2.4, 0.8, 1300), stoneMat); e.position.set(x, 0.4, -560); e.castShadow = e.receiveShadow = true; scene.add(e); }
  // fuente
  const pool = new T.Mesh(new T.CylinderGeometry(13, 13, 0.6, 32), waterMat); pool.position.set(0, 0.3, -205); scene.add(pool);
  const rim = new T.Mesh(new T.TorusGeometry(13, 0.7, 6, 40), stoneMat); rim.rotation.x = Math.PI / 2; rim.position.set(0, 0.6, -205); scene.add(rim);
  // Faro del Comercio (prisma naranja)
  const faroMat = new T.MeshStandardMaterial({ color: '#f0682c', roughness: 0.7 });
  const faro = new T.Mesh(new T.BoxGeometry(7.5, 70, 2.6), faroMat); faro.position.set(20, 35, -395); faro.castShadow = faro.receiveShadow = true; scene.add(faro);
  const faroTop = new T.Mesh(new T.BoxGeometry(7.9, 1.2, 3.0), new T.MeshStandardMaterial({ color: '#2f2f33' })); faroTop.position.set(20, 70.4, -395); scene.add(faroTop);
  // Palacio de Gobierno al fondo de la plaza
  const palMat = new T.MeshStandardMaterial({ color: '#d4a07f', roughness: 0.9 });
  const pal = new T.Mesh(new T.BoxGeometry(90, 22, 40), palMat); pal.position.set(0, 11, -1010); pal.castShadow = pal.receiveShadow = true; scene.add(pal);
  const cols = new T.Mesh(new T.BoxGeometry(30, 30, 30), palMat); cols.position.set(0, 15, -990); scene.add(cols);
  const dome = new T.Mesh(new T.SphereGeometry(9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: '#c79a76' })); dome.position.set(0, 30, -990); scene.add(dome);
  // azotea / barandal en primer plano
  const concrete = new T.MeshStandardMaterial({ color: '#8f8a84', roughness: 0.95 });
  const rail = new T.MeshStandardMaterial({ color: '#4a4c50', roughness: 0.5, metalness: 0.5 });
  const roof = new T.Mesh(new T.BoxGeometry(200, 33, 60), concrete); roof.position.set(0, 16.5, 92); roof.receiveShadow = true; scene.add(roof);
  const para = new T.Mesh(new T.BoxGeometry(200, 1.4, 0.5), concrete); para.position.set(0, 33.7, 62.4); para.receiveShadow = true; scene.add(para);
  const bar = new T.Mesh(new T.BoxGeometry(200, 0.18, 0.18), rail); bar.position.set(0, 35.5, 62.4); scene.add(bar);
  for (let x = -40; x <= 40; x += 2.4) { const p = new T.Mesh(new T.BoxGeometry(0.08, 1.2, 0.08), rail); p.position.set(x, 34.9, 62.4); scene.add(p); }

  // ---------- árboles (instanciados) ----------
  const crownMat = new T.MeshStandardMaterial({ color: '#5c8a3e', flatShading: true, roughness: 1 });
  const trunkMat = new T.MeshStandardMaterial({ color: '#5a4330', roughness: 1 });
  const treePos = [];
  for (let z = -10; z > -1000; z -= 13) for (const x of [-44, -16, 16, 44]) if (!(Math.abs(z + 205) < 18 && Math.abs(x) < 20) && !(Math.abs(z + 395) < 10 && x === 16)) treePos.push([x + (R() - 0.5) * 3, z + (R() - 0.5) * 4, 0.8 + R() * 0.5]);
  for (let i = 0; i < 1600; i++) { // arbolado de la ciudad
    const z = -100 - R() * 3500, x = (R() - 0.5) * 2 * (150 + Math.abs(z) * 0.42);
    if (Math.abs(x) < 100 && z > -1060) continue;
    treePos.push([x, z, 1 + R() * 0.8]);
  }
  const crownGeo = new T.IcosahedronGeometry(3.2, 0); crownGeo.translate(0, 6.5, 0);
  const trunkGeo = new T.CylinderGeometry(0.35, 0.45, 5, 5); trunkGeo.translate(0, 2.5, 0);
  const crowns = new T.InstancedMesh(crownGeo, crownMat, treePos.length);
  const trunks = new T.InstancedMesh(trunkGeo, trunkMat, treePos.length);
  crowns.castShadow = trunks.castShadow = true; crowns.receiveShadow = true;
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _v = new T.Vector3(), _s = new T.Vector3(), _c = new T.Color(), _e = new T.Euler();
  treePos.forEach(([x, z, s], i) => {
    _q.setFromEuler(_e.set(0, R() * 6, 0)); _m.compose(_v.set(x, 0, z), _q, _s.set(s, s * (0.9 + R() * 0.3), s));
    crowns.setMatrixAt(i, _m); trunks.setMatrixAt(i, _m);
    crowns.setColorAt(i, _c.set(['#ffffff', '#e4f0d8', '#d8e8c6', '#f0f4e0'][i % 4]));
  });
  scene.add(crowns, trunks);

  // ---------- personas ----------
  const personGeo = (() => {
    const body = new T.CylinderGeometry(0.2, 0.24, 1.25, 6); body.translate(0, 0.62 + 0.25, 0);
    const legs = new T.BoxGeometry(0.34, 0.3, 0.2); legs.translate(0, 0.15, 0);
    const head = new T.IcosahedronGeometry(0.16, 1); head.translate(0, 1.66, 0);
    return merge([body, legs, head]);
  })();
  const NP = 750;
  const people = new T.InstancedMesh(personGeo, new T.MeshStandardMaterial({ roughness: 0.9 }), NP);
  people.castShadow = true;
  const SHIRTS = ['#d84a3c', '#2f6fb3', '#f2f2ee', '#26262a', '#f0b429', '#3a9a5b', '#9b59b6', '#e57aa3', '#4fb3c9', '#8a6a4a'];
  const P = [];
  for (let i = 0; i < NP; i++) {
    const p = { x: (R() - 0.5) * 84, z: 45 - R() * 560, a: R() * Math.PI * 2, v: 0.8 + R() * 0.7, L: 6 + R() * 30, ph: R() * 50, still: R() < 0.3, out: 45.2 + R() * 2.2 };
    if (Math.abs(p.z + 205) < 15 && Math.abs(p.x) < 15) p.x += 20;
    if (Math.abs(p.x - 64) < 9) p.x -= 20;
    P.push(p); people.setColorAt(i, _c.set(SHIRTS[i % SHIRTS.length]));
  }
  scene.add(people);

  // ---------- coches ----------
  const NC = 110;
  const carGeo = (() => { const a = new T.BoxGeometry(4.2, 1.1, 1.8); a.translate(0, 0.75, 0); const b = new T.BoxGeometry(2.3, 0.7, 1.6); b.translate(-0.2, 1.6, 0); return merge([a, b]); })();
  const cars = new T.InstancedMesh(carGeo, new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.4 }), NC);
  cars.castShadow = true;
  const CARS = [];
  for (let i = 0; i < NC; i++) {
    const lane = i % 4; // 0,1: avenida transversal ; 2,3: Zaragoza
    CARS.push({ lane, o: R() * 1400, v: 9 + R() * 6 });
    cars.setColorAt(i, _c.set(['#e8e8e8', '#1d1d20', '#b0262b', '#3c5c8a', '#9aa0a6', '#d9d2c0'][i % 6]));
  }
  scene.add(cars);

  // ---------- pájaros ----------
  const birdGeo = new T.BufferGeometry();
  birdGeo.setAttribute('position', new T.BufferAttribute(new Float32Array([0, 0, 0.3, -1.3, 1, 0, 0, 0, -0.3, 0, 0, 0.3, 1.3, 1, 0, 0, 0, -0.3]), 3));
  birdGeo.computeVertexNormals();
  const NB = 34;
  const birds = new T.InstancedMesh(birdGeo, new T.MeshBasicMaterial({ color: '#3a3430', side: T.DoubleSide }), NB);
  const BIRDS = [];
  for (let i = 0; i < NB; i++) BIRDS.push({ x: (R() - 0.5) * 300, y: 60 + R() * 140, z: -60 - R() * 500, v: (R() < 0.5 ? -1 : 1) * (7 + R() * 6), ph: R() * 6, s: 0.8 + R() * 0.5, r: 20 + R() * 40 });
  scene.add(birds);

  // ---------- bola de fuego ----------
  const NOISE3 = `float h3(vec3 p){ p = fract(p*0.3183099 + .1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float n3(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
      return mix(mix(mix(h3(i+vec3(0,0,0)),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y), f.z); }
    float fb(vec3 p){ float s=0.0, a=0.5; for(int i=0;i<6;i++){ s+=a*n3(p); p*=2.07; a*=0.5; } return s; }`;
  const fireU = { uTime: { value: 0 }, uBright: { value: 1 }, uAlpha: { value: 1 } };
  const fireball = new T.Mesh(new T.SphereGeometry(1, 96, 64), new T.ShaderMaterial({
    uniforms: fireU, fog: false, transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: `uniform float uTime, uBright, uAlpha; varying vec3 vP; varying vec3 vN; varying vec3 vV; ${NOISE3}
      void main(){
        vec3 q = vP*2.4 + vec3(0.0, -uTime*0.05, uTime*0.03);
        float w = fb(q + fb(q*1.7 + uTime*0.04)*1.6);
        float limb = clamp(dot(vN, vV), 0.0, 1.0);
        vec3 deep = vec3(0.55, 0.12, 0.02), mid = vec3(1.0, 0.45, 0.08), hot = vec3(1.0, 0.86, 0.55), core = vec3(1.0, 0.98, 0.9);
        vec3 c = mix(deep, mid, smoothstep(0.25, 0.5, w));
        c = mix(c, hot, smoothstep(0.5, 0.68, w));
        c = mix(c, core, smoothstep(0.72, 0.95, w) * 0.7);
        c *= 0.55 + 0.9*smoothstep(0.3, 0.75, w);
        c *= uBright * (0.7 + 0.5*limb);
        float a = smoothstep(0.0, 0.25, limb) * uAlpha;
        gl_FragColor = vec4(c, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  fireball.position.copy(SUN_DIR).multiplyScalar(20000);
  fireball.visible = false; scene.add(fireball);
  const fbGlow = new T.Sprite(new T.SpriteMaterial({ map: radial([[0, 'rgba(255,220,160,.9)'], [0.4, 'rgba(255,170,90,.45)'], [1, 'rgba(255,140,60,0)']]), fog: false, depthWrite: false, blending: T.AdditiveBlending, transparent: true }));
  fbGlow.position.copy(fireball.position).multiplyScalar(0.98); fbGlow.visible = false; scene.add(fbGlow);

  // ---------- fuego, humo, vapor y escombros ----------
  const flameTex = radial([[0, 'rgba(255,250,220,1)'], [0.25, 'rgba(255,200,90,.9)'], [0.55, 'rgba(255,110,30,.45)'], [1, 'rgba(200,50,10,0)']]);
  const smokeTex = canvasTex(256, 256, (g, w, h) => {
    const r2 = rng(9);
    for (let i = 0; i < 18; i++) {
      const x = w * (0.3 + r2() * 0.4), y = h * (0.3 + r2() * 0.4), r = 40 + r2() * 60;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  }, false);
  const nearTrees = treePos.slice(0, 280);
  const FIRES = [];
  for (let i = 0; i < 90; i++) {
    const usesRoof = i % 3 === 0 && roofSpots.length;
    const p = usesRoof ? roofSpots[(R() * roofSpots.length) | 0] : (() => { const tp = nearTrees[(R() * nearTrees.length) | 0]; return new T.Vector3(tp[0], 6.5 * tp[2], tp[1]); })();
    const s = new T.Sprite(new T.SpriteMaterial({ map: flameTex, depthWrite: false, blending: T.AdditiveBlending, transparent: true, fog: false }));
    s.position.copy(p); s.visible = false; scene.add(s);
    FIRES.push({ s, p, t0: 37 + R() * 6, size: usesRoof ? 9 + R() * 8 : 5 + R() * 4, ph: R() * 10 });
  }
  const SMOKE = [];
  const smokeSrc = FIRES.filter((_, i) => i % 3 === 0).slice(0, 24);
  smokeSrc.forEach((f, j) => {
    for (let k = 0; k < 9; k++) {
      const s = new T.Sprite(new T.SpriteMaterial({ map: smokeTex, depthWrite: false, transparent: true, color: '#2c2a28' }));
      s.visible = false; scene.add(s);
      SMOKE.push({ s, f, k, life: 7 + (j % 4), drift: 6 + R() * 6 });
    }
  });
  const STEAM = [];
  for (let i = 0; i < 70; i++) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: smokeTex, depthWrite: false, transparent: true, color: '#ffffff' }));
    s.visible = false; scene.add(s);
    STEAM.push({ s, x: 64 + (R() - 0.5) * 12, z: -20 - R() * 700, ph: R(), life: 2.5 + R() * 2 });
  }
  const ND = 420;
  const debris = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: '#2e2219', roughness: 1 }), ND);
  const DEB = [];
  for (let i = 0; i < ND; i++) DEB.push({ o: R(), x: (R() - 0.5), y: R(), s: 0.4 + R() * R() * 5, sp: 2 + R() * 6, ax: R() * 6, ay: R() * 6 });
  debris.visible = false; scene.add(debris);

  // ---------- capa HTML ----------
  const $ = (id) => document.getElementById(id);
  const hud = $('hud'), hudLab = hud.querySelector('.lab'), hudNum = hud.querySelector('.num'), hudSub = hud.querySelector('.sub');
  const cap = $('cap'), title = $('title'), flash = $('flash'), black = $('black'), endEl = $('end'), dust = $('dust'), glow = $('sunglow');
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  let capText = null;
  function setText(el, s) { if (el.__t !== s) { el.textContent = s; el.__t = s; } }

  // ---------- colores que cambian ----------
  const C = (h) => new T.Color(h);
  const COL = {
    top0: C('#3f78c6'), top1: C('#fff3dc'), top2: C('#e0893c'), top3: C('#b0703a'),
    hor0: C('#e6dccb'), hor2: C('#f6a85a'), hor3: C('#c98a4e'),
    fog0: C('#d8d2c6'), fog1: C('#fff1d8'), fog2: C('#e7a463'), fog3: C('#b97b44'), fogX: C('#7a4a2c'),
    crown0: C('#5c8a3e'), crown1: C('#6b4a24'), crown2: C('#1e1712'),
    ground0: C('#a39782'), ground2: C('#6e5038'), pave0: C('#cdb9a2'), pave2: C('#8a6a4f'),
    bld0: C('#ffffff'), bld2: C('#9a7458'), sun0: C('#ffe2b8'), sun2: C('#ff9a4a'),
    water0: C('#3f8fa3'), water2: C('#8c6e52'),
  };
  const mix3 = (out, a, b, c, u, v) => out.copy(a).lerp(b, u).lerp(c, v);

  function sunScreen() {
    const p = sunSprite.position.clone().project(camera);
    return [(p.x * 0.5 + 0.5) * 1080, (-p.y * 0.5 + 0.5) * 1920, p.z < 1];
  }

  // ---------- render de un instante ----------
  let DUR = TL.end;
  window.loadProject = (data) => { DUR = data.duration || TL.end; return 'sol_monterrey ' + DUR.toFixed(1) + 's'; };
  window.renderAt = function (t) {
    const uB = sm(TL.light, TL.bright, t);              // brillo creciente
    const uH = sm(TL.bright, TL.heat - 2, t);           // calor
    const uX = sm(TL.heat, TL.here, t);                 // explosión que se acerca
    const uS = sm(TL.here - 1.5, TL.here + 1.5, t);     // tormenta de escombros
    const cool = sm(TL.heat - 4, TL.heat + 3, t);   // el blanco cede al fuego
    const flashB = Math.pow(uB, 1.6) * (1 - sm(TL.bright + 2, TL.heat + 2, t));

    // cámara: ligero acercamiento y vaivén, temblor al final
    const cz = 70 - t * 0.12, cy = 40.5 + Math.sin(t * 0.21) * 0.25;
    camera.position.set(Math.sin(t * 0.13) * 1.2, cy, cz);
    camera.lookAt(-30 + Math.sin(t * 0.1) * 4, 150, -1500);
    const shake = 0.06 * uX * uX + 0.9 * uS * (1 - sm(TL.black - 0.6, TL.black, t));
    if (shake > 0) { camera.position.x += Math.sin(t * 57) * shake + Math.sin(t * 23) * shake * 0.6; camera.position.y += Math.cos(t * 49) * shake; }
    camera.updateMatrixWorld();

    // exposición y luces
    renderer.toneMappingExposure = 0.95 + 1.6 * Math.pow(uB, 1.5) * (1 - 0.5 * uH - 0.5 * cool) - 0.15 * uX + 0.1 * uS;
    sun.intensity = 2.8 + 12 * Math.pow(uB, 2) - 4 * uX - 6 * uS;
    sun.color.copy(COL.sun0).lerp(COL.sun2, Math.max(uH * 0.5, uX));
    hemi.intensity = 1.0 + 1.4 * uB - 0.6 * uS;
    hemi.color.set('#cfe0ff').lerp(COL.sun2, uX);

    // cielo
    mix3(skyU.top.value, COL.top0, COL.top1, COL.top2, uB, uX); skyU.top.value.lerp(COL.top3, uS);
    mix3(skyU.hor.value, COL.hor0, COL.top1, COL.hor2, uB, uX); skyU.hor.value.lerp(COL.hor3, uS);
    skyU.glowAmt.value = 0.7 + 6 * Math.pow(uB, 2) * (1 - cool * 0.8);
    skyU.white.value = 0.75 * Math.pow(uB, 2) * (1 - cool);
    fog.color.copy(COL.fog0).lerp(COL.fog1, uB).lerp(COL.fog2, Math.max(uH * 0.4, cool)).lerp(COL.fogX, uX * 0.55).lerp(COL.fog3, uS);
    fog.density = 0.00009 + 0.0001 * uB + 0.00025 * uH * (1 - cool * 0.6) + 0.0002 * uX + 0.0035 * Math.pow(uS, 1.6);

    // sol
    const sunS = 2200 * (1 + 7 * Math.pow(uB, 2)) * (1 - cool * 0.85);
    sunSprite.scale.set(sunS, sunS, 1); sunSprite.visible = uX < 0.98;
    const coreS = 520 * (1 + 2 * uB) * (1 - cool); sunCore.scale.set(coreS, coreS, 1); sunCore.visible = coreS > 5;
    clouds.forEach((c) => { c.position.x = c.userData.x0 + t * c.userData.v; c.material.opacity = 0.8 * (1 - uB * 0.8) * (1 - uX); });

    // calor: todo se oscurece / quema
    const burn = sm(TL.bright + 0.5, TL.heat - 1, t), char = sm(TL.bright + 4, TL.here, t);
    crownMat.color.copy(COL.crown0).lerp(COL.crown1, burn).lerp(COL.crown2, char);
    groundMat.color.copy(COL.ground0).lerp(COL.ground2, Math.max(burn * 0.7, uX));
    paveMat.color.copy(COL.pave0).lerp(COL.pave2, Math.max(burn * 0.6, uX));
    grassMat.color.set('#6f9348').lerp(COL.crown1, burn).lerp(COL.crown2, char * 0.8);
    bldMat.color.copy(COL.bld0).lerp(COL.bld2, Math.max(burn * 0.5, uX));
    glassMat.color.copy(COL.bld0).lerp(COL.bld2, Math.max(burn * 0.5, uX));
    waterMat.color.copy(COL.water0).lerp(COL.water2, sm(42, 50, t));
    waterMat.emissive.setRGB(0.25 * uH * (1 - uX), 0.12 * uH * (1 - uX), 0.03 * uH);

    // personas
    let run = 0; { const a = 38.5, b = 41; const N = 24; for (let i = 0; i < N; i++) { const x = a + (t - a) * (i + 0.5) / N; run += sm(a, b, x) * (t - a) / N; } if (t < a) run = 0; }
    const S = t + 2.5 * run;
    for (let i = 0; i < NP; i++) {
      const p = P[i];
      const gone = sm(p.out, p.out + 0.6, t);
      const s = gone >= 1 ? 0 : 1;
      let d = p.still && t < 38.5 ? 0 : ((S * p.v + p.ph) % (2 * p.L));
      if (d > p.L) d = 2 * p.L - d;
      const dir = d === 0 ? 0 : 1;
      const x = p.x + Math.cos(p.a) * d * dir, z = p.z + Math.sin(p.a) * d * dir;
      const bob = p.still && t < 38.5 ? 0 : Math.abs(Math.sin(S * p.v * 4 + i)) * 0.06;
      _q.setFromEuler(_e.set(0, -p.a, 0)); _m.compose(_v.set(x, bob, z), _q, _s.set(s, s * (1 - gone * 0.6), s));
      people.setMatrixAt(i, _m);
    }
    people.instanceMatrix.needsUpdate = true;

    // coches (se detienen con el calor)
    let drive; { const a = 38, b = 41, u = clamp((t - a) / (b - a), 0, 1); drive = t < a ? t : a + (b - a) * (u - u * u / 2); }
    for (let i = 0; i < NC; i++) {
      const c = CARS[i]; const d = ((c.o + drive * c.v) % 1400);
      const visible = uS < 0.5;
      if (c.lane < 2) _v.set(c.lane ? 700 - d : -700 + d, 0, -470 + (c.lane ? -6 : 6));
      else _v.set(c.lane === 2 ? 98 : 110, 0, c.lane === 2 ? -200 - d : -1600 + d);
      _q.setFromEuler(_e.set(0, c.lane < 2 ? (c.lane ? Math.PI : 0) : (c.lane === 2 ? Math.PI / 2 : -Math.PI / 2), 0));
      _m.compose(_v, _q, _s.setScalar(visible ? 1 : 0)); cars.setMatrixAt(i, _m);
    }
    cars.instanceMatrix.needsUpdate = true;

    // pájaros (se van cuando calienta)
    const flee = sm(TL.light + 4, TL.bright + 2, t);
    for (let i = 0; i < NB; i++) {
      const b = BIRDS[i];
      const x = b.x + b.v * t + Math.sin(t * 0.3 + b.ph) * b.r, y = b.y + Math.sin(t * 0.5 + b.ph) * 6 + flee * 400, z = b.z + Math.cos(t * 0.3 + b.ph) * b.r;
      const flap = 0.15 + 0.85 * Math.abs(Math.sin(t * 9 + b.ph * 3));
      _q.setFromEuler(_e.set(0, b.v > 0 ? 0 : Math.PI, 0)); _m.compose(_v.set(x, y, z), _q, _s.set(b.s, b.s * (flap * 2 - 1), b.s));
      birds.setMatrixAt(i, _m);
    }
    birds.instanceMatrix.needsUpdate = true;
    birds.visible = flee < 0.99;

    // bola de fuego
    fireball.visible = fbGlow.visible = t > TL.heat - 0.5 && t < TL.here + 2;
    if (fireball.visible) {
      const r = 1600 + 11500 * Math.pow(uX, 1.15);
      fireball.scale.setScalar(r);
      fireball.position.copy(SUN_DIR).multiplyScalar(22000 - 4000 * uX);
      fireball.rotation.set(t * 0.01, t * 0.02, 0);
      fireU.uTime.value = t; fireU.uBright.value = 1.5 - 0.3 * uX; fireU.uAlpha.value = sm(TL.heat - 0.5, TL.heat + 1.5, t) * (1 - sm(TL.here, TL.here + 2, t));
      fbGlow.position.copy(fireball.position).multiplyScalar(0.98); fbGlow.scale.setScalar(r * 2.6);
      fbGlow.material.opacity = 0.3 * fireU.uAlpha.value;
    }

    // fuegos
    for (const f of FIRES) {
      const a = sm(f.t0, f.t0 + 2, t) * (1 - sm(TL.here + 0.5, TL.here + 2, t));
      f.s.visible = a > 0.01;
      if (!f.s.visible) continue;
      const fl = 0.8 + 0.25 * Math.sin(t * 13 + f.ph) + 0.15 * Math.sin(t * 29 + f.ph * 2);
      const sz = f.size * a * fl * (1 + uX * 0.6);
      f.s.scale.set(sz, sz * 1.5, 1); f.s.position.set(f.p.x, f.p.y + sz * 0.45, f.p.z);
      f.s.material.opacity = a;
    }
    for (const m of SMOKE) {
      const t0 = m.f.t0 + 0.8;
      const age = (((t - t0) / m.life) + m.k / 9) % 1;
      const on = t > t0 && (t - t0) > (m.k / 9) * m.life * 0.2;
      const fade = 1 - sm(TL.here, TL.here + 2, t);
      m.s.visible = on && fade > 0.01;
      if (!m.s.visible) continue;
      const sz = 8 + age * 55;
      m.s.position.set(m.f.p.x + age * m.drift * 6, m.f.p.y + 6 + age * 90, m.f.p.z + age * 40);
      m.s.scale.set(sz, sz, 1);
      m.s.material.opacity = 0.75 * Math.sin(Math.PI * age) * sm(t0, t0 + 2, t) * fade;
    }
    for (const st of STEAM) {
      const age = ((t / st.life) + st.ph) % 1;
      const a = sm(42, 44.5, t) * (1 - sm(TL.heat + 6, TL.here, t));
      st.s.visible = a > 0.01;
      if (!st.s.visible) continue;
      const sz = 3 + age * 14;
      st.s.position.set(st.x + Math.sin(age * 6 + st.ph * 9) * 2, 0.5 + age * 18, st.z);
      st.s.scale.set(sz, sz, 1); st.s.material.opacity = 0.55 * Math.sin(Math.PI * age) * a;
    }

    // escombros
    debris.visible = t > TL.here - 2.5 && t < TL.black;
    if (debris.visible) {
      const k = sm(TL.here - 2.5, TL.here + 0.5, t);
      for (let i = 0; i < ND; i++) {
        const d = DEB[i];
        const u = ((t - (TL.here - 2.5)) * 0.35 * (0.6 + d.sp * 0.15) + d.o) % 1;
        const z = camera.position.z - 900 + u * 960, depth = camera.position.z - z;
        const x = d.x * (depth * 0.7 + 20), y = camera.position.y - 60 + d.y * (depth * 1.1 + 70) - u * 30;
        const s = d.s * k;
        _q.setFromEuler(_e.set(t * d.sp + d.ax, t * d.sp * 0.7 + d.ay, 0)); _m.compose(_v.set(x, y, z), _q, _s.set(s, s * 0.35, s * 0.8));
        debris.setMatrixAt(i, _m);
      }
      debris.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);

    // ---------- capa 2D ----------
    const [sx, sy, sOn] = sunScreen();
    const ga = (0.25 + 0.75 * Math.pow(uB, 1.3)) * (1 - cool) * (sOn ? 1 : 0);
    const gr = 260 + 1400 * Math.pow(uB, 2);
    glow.style.background = `radial-gradient(circle ${gr}px at ${sx.toFixed(0)}px ${sy.toFixed(0)}px, rgba(255,250,235,${(0.9 * ga).toFixed(3)}), rgba(255,226,170,${(0.35 * ga).toFixed(3)}) 45%, rgba(255,210,150,0) 100%)`;
    dust.style.opacity = (0.1 * uX + 0.55 * Math.pow(uS, 1.3)).toFixed(3);
    flash.style.opacity = (0.55 * flashB + 0.6 * Math.exp(-Math.pow((t - TL.here) / 0.35, 2))).toFixed(3);
    black.style.opacity = sm(TL.black - 1.0, TL.black, t).toFixed(3);

    title.style.opacity = (sm(0.2, 0.9, t) * (1 - sm(TL.title - 0.7, TL.title, t))).toFixed(3);
    endEl.style.opacity = (t > TL.black ? sm(TL.black + 0.8, TL.black + 1.8, t) : 0).toFixed(3);

    // HUD
    let lab = '', num = '', sub = '', ha = 0;
    if (t >= TL.title - 0.4 && t < TL.light) {
      const u = clamp((t - (TL.title)) / (TL.light - TL.title), 0, 1);
      const rem = Math.max(0, Math.ceil(500 * Math.pow(1 - u, 1.35)));
      lab = 'Su luz llega en'; num = `${Math.floor(rem / 60)}:${String(rem % 60).padStart(2, '0')}`; sub = 'A 150 millones de km';
      ha = sm(TL.title - 0.4, TL.title + 0.4, t);
    } else if (t >= TL.light && t < TL.bright) {
      lab = 'Luz solar'; num = fmt(Math.pow(401, sm(TL.light, TL.bright - 0.3, t))) + '×'; sub = 'Veces más fuerte'; ha = 1;
    } else if (t >= TL.bright && t < TL.heat) {
      const u = sm(TL.bright, TL.heat - 0.5, t);
      lab = 'Temperatura del suelo'; num = fmt(35 + 1335 * Math.pow(u, 1.4)) + ' °C'; sub = 'El acero se funde a 1,370 °C'; ha = 1;
    } else if (t >= TL.heat && t < TL.here) {
      const u = clamp((t - TL.heat) / (TL.here - TL.heat), 0, 1);
      lab = 'Onda expansiva'; num = fmt(149600000 * Math.pow(1 - u, 1.8)) + ' km'; sub = 'A 10,000 km por segundo'; ha = 1;
    } else if (t >= TL.here && t < TL.black) {
      lab = 'Onda expansiva'; num = 'AQUÍ'; sub = ''; ha = 1 - sm(TL.black - 1.2, TL.black - 0.4, t);
    }
    setText(hudLab, lab); setText(hudNum, num); setText(hudSub, sub);
    hud.style.opacity = ha.toFixed(3);

    // subtítulos
    let ct = '', ca = 0;
    for (const [a, b, s] of CAPS) if (t >= a - 0.3 && t < b + 0.3) { ct = s; ca = sm(a - 0.3, a + 0.3, t) * (1 - sm(b - 0.3, b + 0.3, t)); }
    if (ct !== capText) { cap.textContent = ct; capText = ct; }
    cap.style.opacity = ca.toFixed(3);
    return true;
  };
  window.TIMELINE = TL;
})();
