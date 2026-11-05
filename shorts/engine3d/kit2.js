// Ampliación del kit 3D: mundos "space" y "studio" + modelos para temas generales
// (planeta, calendario, revista, pizarra, gráfica, multitudes, familia, mochila).
(function () {
  const K = window.K3, T = K.T, scene = K.scene;
  const { rng } = window.SH;
  const mesh = K.mesh;

  // ---------- texto en 3D (plano con textura de canvas) ----------
  K.textPlane = function (draw, w, h, px = 1024, lit = false) {
    const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w);
    draw(c.getContext('2d'), c.width, c.height);
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4;
    const mat = lit ? new T.MeshStandardMaterial({ map: tx, roughness: 0.8, transparent: true })
      : new T.MeshBasicMaterial({ map: tx, transparent: true, toneMapped: false });
    const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); return m;
  };
  K.label3d = function (text, o = {}) {
    const size = o.size || 0.5, color = o.color || '#ffffff';
    const w = size * Math.max(1, text.length * 0.62), h = size * 1.3;
    return K.textPlane((x, W, H) => {
      x.font = `${o.weight || 800} ${H * 0.75}px Inter, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      if (o.bg) { x.fillStyle = o.bg; x.beginPath(); x.roundRect(4, 4, W - 8, H - 8, H * 0.3); x.fill(); }
      x.fillStyle = color; x.fillText(text, W / 2, H / 2 + H * 0.04);
    }, w, h, 512);
  };

  // ---------- mundo: espacio ----------
  const spaceG = new T.Group(); scene.add(spaceG); spaceG.visible = false;
  {
    const r = rng(8), n = 2500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, R = 300 + r() * 100;
      pos[i * 3] = Math.sqrt(1 - u * u) * Math.cos(a) * R; pos[i * 3 + 1] = u * R; pos[i * 3 + 2] = Math.sqrt(1 - u * u) * Math.sin(a) * R;
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    spaceG.add(new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, fog: false })));
  }
  K.worlds.space = spaceG;
  K.worldHooks.space = () => {
    scene.background = new T.Color('#05060f'); scene.fog = null;
    K.sky.visible = false; K.sunDisc.visible = false;
    K.hemi.color.set(0x9fb6ff); K.hemi.groundColor.set(0x0a0a14); K.hemi.intensity = 0.35; K.sun.intensity = 3.2;
  };

  // ---------- mundo: estudio (plataforma sobre cielo de atardecer) ----------
  const studioG = new T.Group(); scene.add(studioG); studioG.visible = false;
  const floor = mesh(new T.CylinderGeometry(14, 14, 0.6, 64), K.mat('#2c4f52'), false, true);
  floor.position.y = -0.3; studioG.add(floor);
  const rim = mesh(new T.TorusGeometry(14, 0.08, 8, 96), new T.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }), false, false);
  rim.rotation.x = Math.PI / 2; studioG.add(rim);
  const ground = mesh(new T.PlaneGeometry(400, 400), K.mat('#1f3a3d'), false, true);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.62; studioG.add(ground);
  K.worlds.studio = studioG;
  K.worldHooks.studio = () => {
    scene.background = null; scene.fog = new T.Fog(0xe7a07a, 40, 160);
    K.sky.visible = true; K.sunDisc.visible = false;
    K.hemi.color.set(0xffd6b0); K.hemi.groundColor.set(0x2b4a3c); K.hemi.intensity = 1.2; K.sun.intensity = 2.4;
  };
  K.studioFloor = floor;

  // ---------- planeta Tierra low-poly ----------
  K.makeGlobe = function () {
    const g = new T.Group();
    const geo = new T.IcosahedronGeometry(1, 5).toNonIndexed();
    const p = geo.attributes.position, cols = new Float32Array(p.count * 3);
    const noise = (x, y, z) => Math.sin(x * 3.1 + 1.3) * Math.cos(y * 2.7 - 0.4) + Math.sin(z * 3.7 + x * 1.9) * 0.6 + Math.cos(y * 5.3 + z * 2.1) * 0.35;
    const c = new T.Color();
    for (let i = 0; i < p.count; i += 3) {
      const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
      const f = noise(x, y, z);
      if (Math.abs(y) > 0.86) c.set('#f2f6fa');
      else if (f > 0.75) c.set('#8a7a5a');
      else if (f > 0.35) c.set(f > 0.55 ? '#4f8f3e' : '#64a84a');
      else c.set(f > 0.15 ? '#3a8fd0' : '#2a6db0');
      for (let k = 0; k < 3; k++) c.toArray(cols, (i + k) * 3);
    }
    geo.setAttribute('color', new T.BufferAttribute(cols, 3));
    const earth = mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 }));
    g.add(earth);
    const atmo = new T.Mesh(new T.SphereGeometry(1.08, 48, 32), new T.MeshBasicMaterial({ color: 0x6fc3ff, transparent: true, opacity: 0.18, side: T.BackSide, blending: T.AdditiveBlending, depthWrite: false }));
    g.add(atmo);
    // nubes
    const r = rng(4);
    for (let i = 0; i < 26; i++) {
      const cl = mesh(new T.IcosahedronGeometry(0.06 + r() * 0.06, 0), K.mat('#ffffff', { flat: true }), false, false);
      const u = r() * 2 - 1, a = r() * Math.PI * 2;
      cl.position.set(Math.sqrt(1 - u * u) * Math.cos(a), u * 0.8, Math.sqrt(1 - u * u) * Math.sin(a)).multiplyScalar(1.05);
      cl.lookAt(0, 0, 0); cl.scale.set(1.8, 1.2, 0.35); earth.add(cl);
    }
    g.userData.earth = earth; g.userData.atmo = atmo;
    return g;
  };

  // ---------- calendario ----------
  K.makeCalendar = function (day = '13', month = 'NOVIEMBRE 2026', weekday = 'VIERNES') {
    const g = new T.Group();
    const back = mesh(new T.BoxGeometry(1.6, 1.9, 0.08), K.mat('#e8e2d6')); g.add(back);
    const front = K.textPlane((x, W, H) => {
      x.fillStyle = '#fbf8f2'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#d93a3a'; x.fillRect(0, 0, W, H * 0.24);
      x.fillStyle = '#fff'; x.font = `800 ${H * 0.1}px Inter, sans-serif`; x.textAlign = 'center'; x.fillText(month, W / 2, H * 0.16);
      x.fillStyle = '#1b1b22'; x.font = `900 ${H * 0.5}px Inter, sans-serif`; x.fillText(day, W / 2, H * 0.74);
      x.fillStyle = '#d93a3a'; x.font = `800 ${H * 0.09}px Inter, sans-serif`; x.fillText(weekday, W / 2, H * 0.92);
    }, 1.56, 1.86, 800, true);
    front.position.z = 0.045; g.add(front);
    for (let i = 0; i < 6; i++) { const ring = mesh(new T.TorusGeometry(0.05, 0.015, 6, 12), K.mat('#8d939a', { metalness: 0.8, roughness: 0.3 })); ring.position.set(-0.55 + i * 0.22, 0.95, 0.05); g.add(ring); }
    return g;
  };

  // ---------- portada de la revista (1960) ----------
  K.makeJournal = function () {
    const g = new T.Group();
    const page = K.textPlane((x, W, H) => {
      x.fillStyle = '#efe4c8'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#7a1f1f'; x.fillRect(0, 0, W, H * 0.17);
      x.fillStyle = '#f6eedb'; x.font = `900 ${H * 0.11}px DejaVu Serif, serif`; x.textAlign = 'center'; x.fillText('SCIENCE', W / 2, H * 0.13);
      x.fillStyle = '#3a2e22'; x.font = `600 ${H * 0.035}px DejaVu Serif, serif`; x.fillText('1960', W / 2, H * 0.23);
      x.fillRect(W * 0.1, H * 0.26, W * 0.8, 3);
      x.font = `800 ${H * 0.07}px DejaVu Serif, serif`;
      ['Doomsday:', 'Friday,', '13 November,', 'A.D. 2026'].forEach((l, i) => x.fillText(l, W / 2, H * (0.38 + i * 0.085)));
      x.font = `italic 500 ${H * 0.032}px DejaVu Serif, serif`;
      x.fillText('H. von Foerster, P. M. Mora, L. W. Amiot', W / 2, H * 0.76);
      x.globalAlpha = 0.25; x.fillStyle = '#6b5a3a';
      for (let i = 0; i < 9; i++) x.fillRect(W * 0.12, H * (0.81 + i * 0.018), W * (0.76 - (i % 3) * 0.08), 4);
    }, 1.5, 2.0, 900, true);
    page.material.side = T.DoubleSide;
    g.add(page);
    return g;
  };

  // ---------- pizarra con la fórmula ----------
  K.makeChalkboard = function () {
    const g = new T.Group();
    const frame = mesh(new T.BoxGeometry(4.4, 2.6, 0.12), K.mat('#6b4528')); g.add(frame);
    const board = K.textPlane((x, W, H) => {
      x.fillStyle = '#2f4a3a'; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(255,255,255,.85)'; x.fillStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 5;
      x.font = `500 ${H * 0.13}px DejaVu Serif, serif`; x.textAlign = 'left';
      x.fillText('N(t) =      C', W * 0.08, H * 0.25);
      x.fillRect(W * 0.3, H * 0.29, W * 0.5, 5);
      x.fillText('(2026,9 − t)', W * 0.36, H * 0.44);
      // mini gráfica que se dispara
      x.beginPath(); x.moveTo(W * 0.1, H * 0.92); x.lineTo(W * 0.1, H * 0.55); x.moveTo(W * 0.1, H * 0.92); x.lineTo(W * 0.9, H * 0.92); x.stroke();
      x.beginPath();
      for (let i = 0; i <= 60; i++) { const u = i / 60, X = W * (0.1 + u * 0.62), Y = H * (0.92 - Math.min(0.37, 0.012 / (1.02 - u))); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }
      x.stroke();
      x.setLineDash([12, 10]); x.beginPath(); x.moveTo(W * 0.73, H * 0.55); x.lineTo(W * 0.73, H * 0.92); x.stroke();
      x.font = `500 ${H * 0.07}px DejaVu Serif, serif`; x.fillText('2026', W * 0.69, H * 0.99 - 4);
    }, 4.2, 2.4, 1024, true);
    board.position.z = 0.065; g.add(board);
    return g;
  };

  K.addGlasses = function (p) {
    const m = K.mat('#1a1a1f', { metalness: 0.5, roughness: 0.3 });
    [-1, 1].forEach((k) => { const r = mesh(new T.TorusGeometry(0.055, 0.009, 6, 20), m, false, false); r.position.set(0.205, 0.985, k * 0.068); r.rotation.y = Math.PI / 2; p.add(r); });
    const b = mesh(new T.BoxGeometry(0.01, 0.01, 0.04), m, false, false); b.position.set(0.21, 0.99, 0); p.add(b);
  };

  // ---------- gráfica de población 3D ----------
  // eje x: años comprimidos (cuanto más cerca de 2026, más espacio)
  K.yearX = (yr) => (-Math.log10(2030 - yr) + 1.0) * 3.2;   // 0 -> -7.4 ; 1960 -> -2.7 ; 2026 -> 1.27
  K.makePopGraph = function () {
    const g = new T.Group();
    const axM = K.mat('#f3ead8');
    const ax = mesh(new T.BoxGeometry(9.6, 0.06, 0.06), axM); ax.position.set(-2.8, 0, 0); g.add(ax);
    const ay = mesh(new T.BoxGeometry(0.06, 6.6, 0.06), axM); ay.position.set(-7.6, 3.3, 0); g.add(ay);
    const Y = (n) => Math.min(9, n * 0.55);
    const model = [], real = [];
    for (let yr = 0; yr <= 2026.8; yr += (yr < 1900 ? 25 : yr < 2000 ? 2 : 0.05)) { const n = 200.6 / (2026.87 - yr); model.push(new T.Vector3(K.yearX(yr), n * 0.55, 0)); if (n * 0.55 > 11) break; }
    const data = [[0, 0.2], [1000, 0.3], [1500, 0.45], [1700, 0.6], [1800, 1.0], [1850, 1.2], [1900, 1.6], [1930, 2.0], [1950, 2.5], [1960, 3.0], [1970, 3.7], [1980, 4.4], [1990, 5.3], [2000, 6.1], [2010, 6.9], [2020, 7.8], [2026, 8.2]];
    data.forEach(([yr, n]) => real.push(new T.Vector3(K.yearX(yr), Y(n), 0.05)));
    const tube = (pts, color, r) => {
      const curve = new T.CatmullRomCurve3(pts);
      const geo = new T.TubeGeometry(curve, 300, r, 8, false);
      const m = mesh(geo, new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.4 }), true, false);
      m.userData.total = geo.index.count; m.userData.curve = curve;
      m.userData.xs = Array.from({ length: 301 }, (_, i) => curve.getPointAt(i / 300).x);
      return m;
    };
    const modelLine = tube(model, '#ff5a4f', 0.07); g.add(modelLine);
    const realLine = tube(real, '#4fd1ff', 0.07); g.add(realLine);
    const dots = new T.Group(); g.add(dots);
    data.filter((d) => d[0] <= 1960).forEach(([yr, n]) => { const s = mesh(new T.SphereGeometry(0.12, 12, 8), K.mat('#ffffff')); s.position.set(K.yearX(yr), Y(n), 0.1); dots.add(s); });
    const asym = new T.Group(); g.add(asym);
    for (let i = 0; i < 14; i++) { const d = mesh(new T.BoxGeometry(0.05, 0.3, 0.05), new T.MeshBasicMaterial({ color: 0xff5a4f, toneMapped: false })); d.position.set(K.yearX(2026.87), 0.2 + i * 0.5, 0); asym.add(d); }
    const l1960 = K.label3d('1960', { size: 0.42 }); l1960.position.set(K.yearX(1960), -0.45, 0); g.add(l1960);
    const l2026 = K.label3d('2026', { size: 0.42, color: '#ff8a80' }); l2026.position.set(K.yearX(2026.87), -0.45, 0); g.add(l2026);
    const l0 = K.label3d('Año 0', { size: 0.42 }); l0.position.set(K.yearX(0) + 0.3, -0.45, 0); g.add(l0);
    Object.assign(g.userData, { modelLine, realLine, dots, asym, Y });
    // fracción de la línea hasta cierta coordenada x (para dibujar "hasta el año X")
    g.userData.uForX = (line, x) => { const xs = line.userData.xs; let i = 0; while (i < 300 && xs[i] < x) i++; return i / 300; };
    g.userData.pointAt = (line, u) => line.userData.curve.getPointAt(Math.min(1, Math.max(0, u)));
    g.userData.setProgress = (pm, pr) => {
      modelLine.geometry.setDrawRange(0, Math.floor(modelLine.userData.total * pm / 6) * 6);
      realLine.geometry.setDrawRange(0, Math.floor(realLine.userData.total * pr / 6) * 6);
      modelLine.visible = pm > 0.001; realLine.visible = pr > 0.001;
    };
    return g;
  };

  // ---------- multitud (instanciada) ----------
  K.makeCrowd = function (n = 2500, radius = 13) {
    const g = new T.Group();
    const body = new T.InstancedMesh(new T.CapsuleGeometry(0.13, 0.32, 3, 6), new T.MeshStandardMaterial({ roughness: 0.7 }), n);
    const head = new T.InstancedMesh(new T.SphereGeometry(0.11, 8, 6), new T.MeshStandardMaterial({ roughness: 0.7 }), n);
    const r = rng(3), d = new T.Object3D(), c = new T.Color();
    const shirts = ['#2fb3a3', '#f2c230', '#e8709a', '#5b7cff', '#f07f2a', '#e5484d', '#8bd16a', '#ffffff'];
    const skins = ['#c98d66', '#a5694a', '#e0b08a', '#7a4a32'];
    const pts = [];
    for (let i = 0; i < n; i++) {
      // espiral de Fermat: los primeros quedan en el centro y la multitud crece hacia fuera
      const rr = radius * Math.sqrt((i + 0.5) / n), a = i * 2.39996;
      pts.push([Math.cos(a) * rr + (r() - 0.5) * 0.15, Math.sin(a) * rr + (r() - 0.5) * 0.15]);
      d.position.set(pts[i][0], 0.3, pts[i][1]); d.rotation.y = r() * 6; d.updateMatrix(); body.setMatrixAt(i, d.matrix);
      d.position.y = 0.66; d.updateMatrix(); head.setMatrixAt(i, d.matrix);
      body.setColorAt(i, c.set(shirts[i % shirts.length])); head.setColorAt(i, c.set(skins[(i * 7) % skins.length]));
    }
    body.castShadow = true; g.add(body, head);
    g.userData.setCount = (k) => { body.count = head.count = Math.max(0, Math.min(n, Math.floor(k))); };
    g.userData.bob = (t) => { /* pequeño movimiento: se hace con la posición del grupo */ g.position.y = Math.sin(t * 6) * 0.01; };
    return g;
  };

  // ---------- mochila de emergencia y su contenido ----------
  function rounded(w, h, r) {
    const s = new T.Shape();
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  }
  function ext(shape, depth, mat, bevel = 0.05) {
    const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 });
    g.translate(0, 0, -depth / 2); return mesh(g, mat);
  }
  K.makeBackpack = function () {
    const g = new T.Group();
    const orange = K.mat('#f07f2a', { roughness: 0.65 }), dark = K.mat('#b85a17'), blue = K.mat('#3456c4');
    const body = ext(rounded(1.3, 1.7, 0.35), 0.7, orange, 0.12); body.position.y = 0.95; g.add(body);
    const pocket = ext(rounded(0.95, 0.6, 0.18), 0.22, dark, 0.06); pocket.position.set(0, 0.6, 0.45); g.add(pocket);
    const zip = mesh(new T.BoxGeometry(0.7, 0.03, 0.03), K.mat('#2a2a2f')); zip.position.set(0, 0.83, 0.6); g.add(zip);
    const flap = ext(rounded(1.32, 0.55, 0.2), 0.75, blue, 0.06); flap.position.set(0, 1.75, 0); g.add(flap);
    [-0.4, 0.4].forEach((x) => { const st = mesh(new T.BoxGeometry(0.16, 1.5, 0.06), blue); st.position.set(x, 1.0, -0.42); g.add(st); });
    const handle = mesh(new T.TorusGeometry(0.16, 0.035, 8, 16, Math.PI), blue); handle.position.set(0, 2.05, 0); g.add(handle);
    // cruz blanca (emergencia)
    const cr = new T.Group(); cr.position.set(0, 1.35, 0.42);
    [[0.32, 0.1], [0.1, 0.32]].forEach(([w, h]) => { const b = mesh(new T.BoxGeometry(w, h, 0.03), K.mat('#ffffff')); cr.add(b); });
    g.add(cr);
    g.userData.flap = flap;
    return g;
  };
  K.makeItem = function (kind) {
    const g = new T.Group();
    if (kind === 'agua') {
      const b = mesh(new T.CylinderGeometry(0.16, 0.16, 0.7, 20), new T.MeshPhysicalMaterial({ color: 0x7fd3ff, transparent: true, opacity: 0.7, roughness: 0.05 })); g.add(b);
      const w = mesh(new T.CylinderGeometry(0.14, 0.14, 0.5, 20), K.mat('#2f9be0')); w.position.y = -0.08; g.add(w);
      const cap = mesh(new T.CylinderGeometry(0.08, 0.08, 0.1, 16), K.mat('#2a5cc4')); cap.position.y = 0.42; g.add(cap);
      const lab = mesh(new T.CylinderGeometry(0.165, 0.165, 0.18, 20), K.mat('#ffffff')); g.add(lab);
    } else if (kind === 'linterna') {
      const b = mesh(new T.CylinderGeometry(0.09, 0.09, 0.6, 16), K.mat('#2a2a30', { metalness: 0.4 })); b.rotation.z = Math.PI / 2; g.add(b);
      const h = mesh(new T.CylinderGeometry(0.16, 0.1, 0.2, 16), K.mat('#f2c230')); h.rotation.z = Math.PI / 2; h.position.x = 0.38; g.add(h);
      const lens = mesh(new T.CircleGeometry(0.14, 20), new T.MeshBasicMaterial({ color: 0xfff6c8, toneMapped: false })); lens.rotation.y = Math.PI / 2; lens.position.x = 0.485; g.add(lens);
      const beam = new T.Mesh(new T.ConeGeometry(0.7, 2.4, 24, 1, true), new T.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false }));
      beam.rotation.z = Math.PI / 2; beam.position.x = 1.7; beam.visible = false; g.add(beam);
    } else if (kind === 'radio') {
      const b = ext(rounded(0.8, 0.5, 0.08), 0.25, K.mat('#3b3f48'), 0.03); g.add(b);
      const grill = K.textPlane((x, W, H) => { x.fillStyle = '#23252b'; x.fillRect(0, 0, W, H); x.fillStyle = '#555a66'; for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) { x.beginPath(); x.arc(20 + i * 26, 18 + j * 26, 8, 0, 7); x.fill(); } }, 0.4, 0.3, 256, true);
      grill.position.set(-0.15, 0, 0.16); g.add(grill);
      const dial = mesh(new T.CylinderGeometry(0.08, 0.08, 0.05, 16), K.mat('#e5484d')); dial.rotation.x = Math.PI / 2; dial.position.set(0.24, 0.05, 0.16); g.add(dial);
      const ant = mesh(new T.CylinderGeometry(0.012, 0.012, 0.8, 6), K.mat('#c9ccd1', { metalness: 0.8 })); ant.position.set(0.3, 0.6, 0); ant.rotation.z = -0.3; g.add(ant);
    } else if (kind === 'botiquin') {
      const b = ext(rounded(0.75, 0.55, 0.08), 0.3, K.mat('#f4f4f4'), 0.03); g.add(b);
      [[0.3, 0.09], [0.09, 0.3]].forEach(([w, h]) => { const c = mesh(new T.BoxGeometry(w, h, 0.02), K.mat('#e5484d')); c.position.z = 0.19; g.add(c); });
      const hd = mesh(new T.TorusGeometry(0.1, 0.025, 6, 12, Math.PI), K.mat('#e5484d')); hd.position.y = 0.3; g.add(hd);
    } else if (kind === 'documentos') {
      const f = mesh(new T.BoxGeometry(0.7, 0.5, 0.04), K.mat('#f2c230')); g.add(f);
      const pp = K.textPlane((x, W, H) => { x.fillStyle = '#fbf7ee'; x.fillRect(0, 0, W, H); x.fillStyle = '#2f5fb8'; x.fillRect(W * 0.08, H * 0.12, W * 0.3, H * 0.4); x.fillStyle = '#9aa0aa'; for (let i = 0; i < 5; i++) x.fillRect(W * 0.45, H * (0.15 + i * 0.12), W * 0.45, 6); }, 0.6, 0.42, 256, true);
      pp.position.z = 0.025; g.add(pp);
    } else if (kind === 'efectivo') {
      for (let i = 0; i < 6; i++) { const b = mesh(new T.BoxGeometry(0.62, 0.02, 0.3), K.mat(i % 2 ? '#7cc47a' : '#5fae5c')); b.position.y = i * 0.022; b.rotation.y = (i % 3) * 0.06; g.add(b); }
      const band = mesh(new T.BoxGeometry(0.1, 0.15, 0.32), K.mat('#f2e6c8')); band.position.y = 0.06; g.add(band);
    }
    return g;
  };
})();
