// Prueba de 4 s: chancla vs. cucaracha, estilo macro (cámara a ras de piso, desenfoque de lente real).
// Unidades: centímetros. renderAt(t) es función pura del tiempo.
(function () {
  const T = THREE;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const hash = (x) => { const s = Math.sin(x * 127.1) * 43758.5453; return s - Math.floor(s); };
  function rng(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const W = 1080, H = 1920;
  const renderer = new T.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(28, W / H, 0.5, 2000);
  const TX = window.makeTexturas(T, renderer);
  TX.entorno(scene, '#7a4a3a', '#e8b890', '#6a5560');
  scene.fog = new T.Fog(0x4a2c2a, 120, 600);

  function canvasTex(w, h, draw, rep = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; if (rep) tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.anisotropy = 8; return tx; }

  // ---------- luces ----------
  scene.add(new T.HemisphereLight(0xffd9c0, 0x5a3a40, 0.9));
  const key = new T.DirectionalLight(0xffe0bc, 3.2); key.position.set(-30, 60, 40); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 }); key.shadow.bias = -0.0005; key.shadow.radius = 4; scene.add(key);
  const rim = new T.DirectionalLight(0xffc890, 2.2); rim.position.set(30, 20, -60); scene.add(rim);

  // ---------- piso y pared ----------
  const floorTex = canvasTex(1024, 1024, (g, w, h) => {
    const r2 = rng(3); g.fillStyle = '#bba6a8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60000; i++) { const v = 150 + r2() * 60; g.fillStyle = `rgba(${v + 20},${v},${v + 6},.25)`; g.fillRect(r2() * w, r2() * h, 2, 2); }
    for (let i = 0; i < 40; i++) { const x = r2() * w, y = r2() * h, r = 40 + r2() * 160, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(120,90,110,.12)'); gr.addColorStop(1, 'rgba(120,90,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    g.fillStyle = 'rgba(90,70,80,.35)'; g.fillRect(0, h / 2 - 2, w, 4); g.fillRect(w / 2 - 2, 0, 4, h);
  });
  floorTex.repeat.set(6, 6);
  const floor = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ map: floorTex, roughness: 0.28, metalness: 0.0, envMapIntensity: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallG = new T.Group(); wallG.position.z = -70; scene.add(wallG);
  const wood = new T.MeshStandardMaterial({ color: '#2e1b16', roughness: 0.55 });
  const wallM = new T.MeshStandardMaterial({ map: canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2e1a14'); gr.addColorStop(0.7, '#7a4a2e'); gr.addColorStop(1, '#94603c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false), roughness: 0.8 });
  const wall = new T.Mesh(new T.PlaneGeometry(500, 120), wallM); wall.position.y = 60; wallG.add(wall);
  const base = new T.Mesh(new T.BoxGeometry(500, 9, 3), wood); base.position.set(0, 4.5, 1.5); base.receiveShadow = true; wallG.add(base);
  for (let x = -240; x <= 240; x += 34) { const p = new T.Mesh(new T.BoxGeometry(2.6, 120, 2), wood); p.position.set(x, 60, 1); wallG.add(p); }

  // ---------- cucaracha ----------
  const shell = canvasTex(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4a220c'); gr.addColorStop(0.5, '#9a5220'); gr.addColorStop(1, '#5a2c10'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 11; i++) { const y = h * (0.08 + i * 0.08); g.fillStyle = 'rgba(255,200,140,.55)'; g.fillRect(0, y, w, 1.5); g.fillStyle = 'rgba(30,10,3,.45)'; g.fillRect(0, y + 1.5, w, 2.5); }
    const r2 = rng(7); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(255,200,140,${r2() * 0.08})`; g.fillRect(r2() * w, r2() * h, 2, 1); }
  }, false);
  const chitin = new T.MeshPhysicalMaterial({ map: shell, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.3 });
  const legM = new T.MeshPhysicalMaterial({ color: '#9a5426', roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const roach = new T.Group(); scene.add(roach);
  const body = new T.Group(); roach.add(body);
  const abd = new T.Mesh(new T.SphereGeometry(1, 48, 32), chitin); abd.geometry.rotateZ(Math.PI / 2); abd.scale.set(2.25, 0.46, 0.8); abd.position.set(-0.75, 0.66, 0); abd.castShadow = true; body.add(abd);
  const pron = new T.Mesh(new T.SphereGeometry(1, 40, 24), chitin); pron.geometry.rotateZ(Math.PI / 2); pron.scale.set(0.7, 0.36, 0.86); pron.position.set(1.25, 0.66, 0); pron.rotation.z = -0.25; pron.castShadow = true; body.add(pron);
  const head = new T.Group(); head.position.set(1.85, 0.45, 0); body.add(head);
  const hm = new T.Mesh(new T.SphereGeometry(0.32, 24, 16), new T.MeshPhysicalMaterial({ color: '#7a3c18', roughness: 0.3, clearcoat: 1 })); hm.scale.set(1, 1.1, 0.95); hm.castShadow = true; head.add(hm);
  for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(0.12, 16, 12), new T.MeshPhysicalMaterial({ color: '#0b0706', roughness: 0.1, clearcoat: 1 })); e.position.set(0.16, 0.08, s * 0.22); head.add(e); }
  const antM = new T.MeshStandardMaterial({ color: '#7a4220', roughness: 0.5 });
  const antennae = [-1, 1].map((s) => { const m = new T.Mesh(new T.BufferGeometry(), antM); m.castShadow = true; head.add(m); return { m, s }; });
  for (const s of [-1, 1]) { const c = new T.Mesh(new T.ConeGeometry(0.06, 0.6, 6), legM); c.rotation.z = Math.PI / 2 + 0.35; c.position.set(-3.05, 0.55, s * 0.25); body.add(c); }
  // patas: 3 pares, fémur + tibia (+ tarso), puestas con IK simple
  const LEGS = [];
  for (const [hx, reach] of [[0.95, 1.2], [0.15, 0.9], [-0.7, 1.6]]) for (const s of [-1, 1]) {
    const f = new T.Mesh(new T.CylinderGeometry(0.05, 0.065, 1, 8), legM), ti = new T.Mesh(new T.CylinderGeometry(0.035, 0.05, 1, 8), legM), ta = new T.Mesh(new T.CylinderGeometry(0.018, 0.03, 1, 6), legM);
    [f, ti, ta].forEach((m) => { m.castShadow = true; scene.add(m); });
    LEGS.push({ f, ti, ta, hx, reach, s, ph: (LEGS.length % 2) ^ (Math.floor(LEGS.length / 2) % 2) ? 0 : Math.PI });
  }
  const _a = new T.Vector3(), _b = new T.Vector3(), _up = new T.Vector3(0, 1, 0);
  function seg(m, a, b) { _a.subVectors(b, a); const L = _a.length(); m.position.addVectors(a, b).multiplyScalar(0.5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(_up, _a.normalize()); }

  // ---------- chancla ----------
  const chancla = new T.Group(); scene.add(chancla);
  const outline = new T.Shape();
  { const pts = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2, x = Math.cos(a), y = Math.sin(a); const wdt = y > 0 ? 4.6 + 1.0 * y : 4.0 + 0.4 * y; pts.push([x * wdt, y * 13]); } outline.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((p) => outline.lineTo(p[0], p[1])); }
  const soleTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#2442a6'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(10,20,70,.65)'; g.lineWidth = 6; for (let i = -h; i < w + h; i += 22) { g.beginPath(); g.moveTo(i, 0); g.quadraticCurveTo(i + 20, h / 2, i - 10, h); g.stroke(); } });
  soleTex.repeat.set(0.12, 0.12);
  const layer = (depth, y, color, map) => { const g = new T.ExtrudeGeometry(outline, { depth, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 3, curveSegments: 32 }); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); const m = new T.Mesh(g, new T.MeshPhysicalMaterial({ color, map: map || null, roughness: 0.55, clearcoat: 0.3 })); m.castShadow = m.receiveShadow = true; chancla.add(m); return m; };
  layer(1.1, 0, '#ffffff', soleTex); layer(0.28, 1.25, '#f1c232'); layer(0.9, 1.55, '#2f5bd0');
  const strapCurve = new T.CatmullRomCurve3([new T.Vector3(-4.6, 2.5, -1), new T.Vector3(-3, 6, 3), new T.Vector3(0, 6.5, 6.5), new T.Vector3(3, 6, 3), new T.Vector3(4.6, 2.5, -1)]);
  const strap = new T.Mesh(new T.TubeGeometry(strapCurve, 48, 0.7, 12, false), new T.MeshPhysicalMaterial({ color: '#7b3fd0', roughness: 0.4, clearcoat: 0.6 })); strap.castShadow = true; chancla.add(strap);

  // polvo del golpe
  const dustTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,240,225,.7)'); gr.addColorStop(1, 'rgba(255,240,225,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
  const DUST = []; for (let i = 0; i < 26; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: dustTex, transparent: true, depthWrite: false })); scene.add(s); DUST.push({ s, a: (i / 26) * Math.PI * 2 + hash(i) * 0.3, v: 6 + hash(i + 3) * 10 }); }
  const glow = new T.Sprite(new T.SpriteMaterial({ map: dustTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: '#fff3dc', toneMapped: false })); scene.add(glow);

  // ---------- post: profundidad de campo (desenfoque de lente) ----------
  const rt = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: 4 });
  rt.depthTexture = new T.DepthTexture(W, H); rt.depthTexture.type = T.UnsignedIntType;
  const post = new T.ShaderMaterial({
    uniforms: { tC: { value: rt.texture }, tD: { value: rt.depthTexture }, near: { value: camera.near }, far: { value: camera.far }, focus: { value: 14 }, ap: { value: 26 }, maxB: { value: 34 }, res: { value: new T.Vector2(W, H) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tC, tD; uniform float near, far, focus, ap, maxB; uniform vec2 res; varying vec2 vUv;
      float lin(float d){ float z = d * 2. - 1.; return 2. * near * far / (far + near - z * (far - near)); }
      float coc(float d){ return clamp(abs(d - focus) / d * ap, 0., maxB); }
      void main(){
        float d = lin(texture2D(tD, vUv).x); float c0 = coc(d);
        vec3 acc = texture2D(tC, vUv).rgb; float ws = 1.;
        for (int i = 1; i < 56; i++) {
          float fi = float(i); float a = fi * 2.39996; float r = sqrt(fi / 56.) * maxB;
          vec2 uv2 = vUv + vec2(cos(a), sin(a)) * r / res;
          float d2 = lin(texture2D(tD, uv2).x); float c2 = coc(d2);
          float cr = (d2 < d) ? c2 : min(c0, c2);             // el primer plano desenfocado se derrama sobre lo enfocado
          float w = smoothstep(r - 1.5, r + 1.5, cr);
          acc += texture2D(tC, uv2).rgb * w; ws += w;
        }
        gl_FragColor = vec4(acc / ws, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const pScene = new T.Scene(), pCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  pScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), post));

  // ---------- subtítulos palabra por palabra ----------
  const WORDS = [['¿Por', 0.05], ['qué', 0.22], ['le', 0.38], ['pegas', 0.5], ['con', 0.86], ['la', 1.0], ['chancla', 1.1, 1], ['a', 1.62], ['una', 1.72], ['cucaracha...', 1.88], ['y', 2.9], ['se', 3.04], ['va', 3.16], ['caminando?', 3.3]];
  const GROUPS = [[0, 4], [4, 7], [7, 10], [10, 14]];
  const cap = document.getElementById('cap');
  const grainEl = document.getElementById('grain'); grainEl.style.backgroundImage = `url(${TX.granoURL()})`;

  window.loadProject = (data) => 'cucaracha ' + data.duration + 's';
  window.renderAt = function (t) {
    // --- chancla: cae, aplasta, se levanta ---
    const tHit = 0.86, tUp = 1.55;
    let cy;
    if (t < tHit) { const u = clamp((t - 0.25) / (tHit - 0.25), 0, 1); cy = lerp(40, 0.02, u * u * u); }
    else if (t < tUp) cy = 0.02 + 0.15 * Math.exp(-(t - tHit) * 18) * Math.abs(Math.sin((t - tHit) * 50));
    else { const u = clamp((t - tUp) / 0.55, 0, 1); cy = lerp(0.02, 45, u * u); }
    const tilt = t < tHit ? lerp(0.35, 0, sm(0.25, tHit, t)) : t > tUp ? lerp(0, -0.3, sm(tUp, tUp + 0.55, t)) : 0;
    chancla.position.set(1.0, cy, -9.5); chancla.rotation.set(tilt, 0.12, 0);
    chancla.visible = cy < 44;

    // --- cucaracha: camina, aplastada, se recupera y se va ---
    const flat = sm(tHit - 0.02, tHit + 0.04, t) * (1 - sm(2.45, 2.62, t));
    const pop = t > 2.45 ? Math.exp(-(t - 2.62) * 7) * Math.sin((t - 2.62) * 26) * 0.25 * (t > 2.62 ? 1 : 0) : 0;
    const walking = t < tHit ? 1 : t > 2.95 ? 1 : 0;
    const walkT = t < tHit ? t : t - 2.95;
    const xPos = t < tHit ? lerp(-1.6, 0, sm(0, tHit, t)) : t > 2.95 ? (t - 2.95) * 4.2 : 0;
    roach.position.set(xPos, 0, 0);
    const sy = lerp(1, 0.32, flat) + pop, sxz = lerp(1, 1.12, flat);
    body.scale.set(sxz, sy, sxz); body.position.y = lerp(0, -0.08, flat);
    head.rotation.z = -0.15 + 0.08 * Math.sin(t * 9) * walking + (t > 2.6 && t < 2.95 ? 0.15 * Math.sin(t * 30) : 0);
    // patas (IK de dos huesos, trípode alterno al caminar)
    const sp = 12;
    for (const L of LEGS) {
      const ph = walkT * sp + L.ph, lift = walking ? Math.max(0, Math.sin(ph)) * 0.35 : 0, swing = walking ? Math.cos(ph) * 0.35 : 0;
      const splay = 1 + 0.45 * flat;
      const hip = _b.set(L.hx * sxz, lerp(0.62, 0.3, flat), L.s * 0.45).add(roach.position);
      const foot = new T.Vector3(L.hx * 1.25 + swing + (L.hx < 0 ? -0.55 : 0.35), lift, L.s * (L.reach * splay + 0.4)).add(roach.position);
      const mid = hip.clone().lerp(foot, 0.42); mid.y = Math.max(hip.y, foot.y) + lerp(0.42, 0.1, flat); mid.z += L.s * 0.25;
      const ank = foot.clone().lerp(mid, 0.18);
      seg(L.f, hip, mid); seg(L.ti, mid, ank); seg(L.ta, ank, foot);
    }
    // antenas
    antennae.forEach((A, i) => { const pts = []; const wav = Math.sin(t * 4 + i) * 0.4;
      for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push(new T.Vector3(0.25 + u * 3.6, 0.15 + Math.sin(u * 2.2) * (1.6 + wav) * (1 - 0.8 * flat), A.s * (0.15 + u * 0.9))); }
      A.m.geometry.dispose(); A.m.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.03, 5, false); });

    // polvo y destello del golpe
    const dk = clamp((t - tHit) / 0.9, 0, 1), dOn = t > tHit && dk < 1;
    DUST.forEach((d) => { d.s.visible = dOn; if (!dOn) return; const r = 4.6 + d.v * (1 - Math.pow(1 - dk, 3)) * 0.6; d.s.position.set(1.0 + Math.cos(d.a) * r, 0.4 + dk * 1.2, 3.5 + Math.sin(d.a) * r * 0.3); const s = 1.2 + dk * 3; d.s.scale.set(s, s, 1); d.s.material.opacity = 0.6 * (1 - dk); });
    glow.visible = t > tHit - 0.02 && t < tHit + 0.3; glow.material.opacity = 0.7; glow.position.set(0.5, 0.5, 2.5); const gs = 10 * Math.exp(-Math.abs(t - tHit - 0.03) * 12); glow.scale.set(gs * 1.6, gs * 0.5, 1);

    // cámara a ras de piso, temblor en el golpe y paneo al final
    const shake = 0.25 * Math.exp(-Math.max(0, t - tHit) * 8) * (t > tHit ? 1 : 0);
    const camX = lerp(0.4, 2.6, sm(3.0, 4.0, t));
    camera.position.set(camX + Math.sin(t * 61) * shake, 1.1 + Math.cos(t * 47) * shake * 0.5, 33);
    camera.lookAt(camX * 0.8, 1.6, 0); camera.updateMatrixWorld();
    post.uniforms.focus.value = camera.position.distanceTo(new T.Vector3(roach.position.x, 0.6, 0));

    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(pScene, pCam);

    // subtítulos
    let gi = 0; WORDS.forEach((w, i) => { if (t >= w[1] - 0.05) gi = GROUPS.findIndex((g) => i >= g[0] && i < g[1]); });
    const [g0, g1] = GROUPS[gi];
    let html = '';
    for (let i = g0; i < g1; i++) { const [w, ts, k] = WORDS[i]; const said = t >= ts - 0.05, now = said && (i + 1 >= g1 || t < WORDS[i + 1][1] - 0.05); html += `<span class="w${now ? ' now' : ''}${k && said ? ' key' : ''}" style="opacity:${said ? 1 : 0.35}">${w}</span>`; }
    if (cap.__h !== html) { cap.innerHTML = html; cap.__h = html; }
    grainEl.style.backgroundPosition = `${(hash(Math.floor(t * 30)) * 256) | 0}px ${(hash(Math.floor(t * 30) + 7) * 256) | 0}px`;
    return true;
  };
})();
