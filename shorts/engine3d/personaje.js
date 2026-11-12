// Personaje del canal en 3D: chico de pelo café, ojos grandes, suéter turquesa tejido y jeans.
// Estilo "pegatina": contorno oscuro grueso alrededor de cada pieza (casco invertido por normales).
// uso: const chico = window.makeChico(THREE); scene.add(chico.root); chico.pose({...}, t);
(function () {
  window.makeChico = function (T, o = {}) {
    const OUT = o.outline ?? 0.022;
    const C = {
      skin: '#f0c39c', hair: '#6a4630', sweater: '#37b3ad', collar: '#24425e', jeans: '#3f5f97', shoe: '#4b2f22',
      line: '#1d1a26', mouth: '#5a1e1e', cheek: '#f29a9a', ...(o.colors || {}),
    };
    function tex(w, h, draw) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
      const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; return t;
    }
    // punto tejido (ochos verticales) para el suéter
    const knit = tex(128, 128, (g, w, h) => {
      g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 16) for (let y = 0; y < h; y += 12) {
        g.fillStyle = '#ffffff';
        g.beginPath(); g.ellipse(x + 4, y + 6, 3.6, 6.5, -0.45, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(x + 12, y + 6, 3.6, 6.5, 0.45, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < w; x += 16) g.fillRect(x + 7.5, 0, 1, h);
    });
    knit.repeat.set(5, 4);
    const denim = tex(128, 128, (g, w, h) => {
      g.fillStyle = '#c9c9c9'; g.fillRect(0, 0, w, h);
      for (let i = -h; i < w; i += 3) { g.strokeStyle = `rgba(255,255,255,${0.25 + 0.3 * Math.random()})`; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); }
      for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); }
    });
    denim.repeat.set(2, 4);
    const hairTex = tex(64, 64, (g, w, h) => {
      g.fillStyle = '#e0e0e0'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},.25)`; g.beginPath(); const x = Math.random() * w; g.moveTo(x, 0); g.quadraticCurveTo(x + 6, h / 2, x - 2, h); g.stroke(); }
    });
    hairTex.repeat.set(3, 2);
    const M = {
      skin: new T.MeshStandardMaterial({ color: C.skin, roughness: 0.6 }),
      hair: new T.MeshStandardMaterial({ color: C.hair, roughness: 0.65, map: hairTex }),
      sweater: new T.MeshStandardMaterial({ color: C.sweater, roughness: 0.95, map: knit, bumpMap: knit, bumpScale: 0.02 }),
      collar: new T.MeshStandardMaterial({ color: C.collar, roughness: 0.9 }),
      jeans: new T.MeshStandardMaterial({ color: C.jeans, roughness: 0.9, map: denim, bumpMap: denim, bumpScale: 0.01 }),
      shoe: new T.MeshStandardMaterial({ color: C.shoe, roughness: 0.55 }),
      white: new T.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25 }),
      black: new T.MeshStandardMaterial({ color: '#141218', roughness: 0.3 }),
      mouth: new T.MeshStandardMaterial({ color: C.mouth, roughness: 0.7 }),
      cheek: new T.MeshBasicMaterial({ color: C.cheek, transparent: true, opacity: 0.55, depthWrite: false }),
      line: new T.ShaderMaterial({
        side: T.BackSide, uniforms: { k: { value: OUT }, col: { value: new T.Color(C.line) } },
        vertexShader: 'uniform float k; void main(){ vec3 p = position + normal * k; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
        fragmentShader: 'uniform vec3 col; void main(){ gl_FragColor = vec4(col, 1.0); }',
      }),
    };
    function part(geo, mat, parent, x = 0, y = 0, z = 0, outline = true) {
      const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m);
      if (outline) { const l = new T.Mesh(geo, M.line); m.add(l); }
      return m;
    }
    const piv = (parent, x, y, z) => { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; };
    const cap = (r, len) => new T.CapsuleGeometry(r, len, 6, 14);

    const root = new T.Group();
    const body = piv(root, 0, 0, 0);
    const hips = piv(body, 0, 0.86, 0);
    // piernas (muslo + pantorrilla) y zapatos
    const legs = [-1, 1].map((s) => {
      const thigh = piv(hips, s * 0.13, 0, 0);
      part(cap(0.12, 0.34), M.jeans, thigh, 0, -0.2, 0);
      const knee = piv(thigh, 0, -0.42, 0);
      part(cap(0.115, 0.3), M.jeans, knee, 0, -0.18, 0);
      const shoe = new T.SphereGeometry(0.13, 16, 10); shoe.scale(0.95, 0.55, 1.35);
      part(shoe, M.shoe, knee, 0, -0.4, 0.06);
      return { thigh, knee };
    });
    // torso: campana redondeada (torno)
    const torsoG = new T.LatheGeometry([[0, -0.08], [0.3, -0.06], [0.37, 0.02], [0.37, 0.2], [0.34, 0.4], [0.27, 0.52], [0.12, 0.58], [0, 0.585]].map((p) => new T.Vector2(p[0], p[1])), 28);
    const chest = piv(hips, 0, 0, 0);
    part(torsoG, M.sweater, chest, 0, 0, 0);
    const hem = new T.TorusGeometry(0.335, 0.035, 8, 28); hem.rotateX(Math.PI / 2);
    part(hem, M.sweater, chest, 0, -0.05, 0, false);
    const collar = new T.TorusGeometry(0.12, 0.045, 8, 22); collar.rotateX(Math.PI / 2);
    part(collar, M.collar, chest, 0, 0.57, 0);
    // brazos (hombro -> codo -> mano)
    const arms = [-1, 1].map((s) => {
      const sh = piv(chest, s * 0.355, 0.42, 0);
      part(cap(0.1, 0.22), M.sweater, sh, 0, -0.15, 0);
      const el = piv(sh, 0, -0.3, 0);
      part(cap(0.095, 0.2), M.sweater, el, 0, -0.13, 0);
      part(new T.SphereGeometry(0.085, 14, 10), M.skin, el, 0, -0.3, 0);
      return { sh, el, s };
    });
    // cabeza
    const neck = piv(chest, 0, 0.6, 0);
    const head = piv(neck, 0, 0.3, 0);
    const skull = new T.SphereGeometry(0.37, 32, 22); skull.scale(1, 1.02, 0.94);
    part(skull, M.skin, head, 0, 0, 0);
    for (const s of [-1, 1]) part(new T.SphereGeometry(0.075, 12, 8), M.skin, head, s * 0.35, -0.02, -0.02);
    const hairCap = new T.SphereGeometry(0.39, 32, 16, 0, Math.PI * 2, 0, 1.25); hairCap.rotateX(-0.42);
    part(hairCap, M.hair, head, 0, 0.02, -0.015);
    const fringe = new T.SphereGeometry(0.2, 18, 10); fringe.scale(1.55, 0.48, 0.8);
    part(fringe, M.hair, head, -0.04, 0.24, 0.2);
    const tuft = new T.ConeGeometry(0.035, 0.14, 6); tuft.rotateZ(-0.6);
    part(tuft, M.hair, head, 0.1, 0.37, 0.12);
    // cara
    const face = piv(head, 0, 0, 0);
    const eyes = [-1, 1].map((s) => {
      const e = piv(face, s * 0.135, 0.06, 0.28);
      const ball = new T.SphereGeometry(0.105, 22, 16); ball.scale(1, 1.08, 0.6);
      part(ball, M.white, e, 0, 0, 0);
      const pupil = part(new T.SphereGeometry(0.036, 14, 10), M.black, e, 0, 0, 0.055, false);
      const shine = part(new T.SphereGeometry(0.011, 8, 6), M.white, pupil, 0.012, 0.014, 0.03, false);
      const lid = new T.SphereGeometry(0.112, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2); lid.scale(1, 1.08, 0.64);
      const lidM = part(lid, M.skin, e, 0, 0, 0, false);
      void shine; return { e, pupil, lid: lidM };
    });
    const brows = [-1, 1].map((s) => { const b = part(new T.CapsuleGeometry(0.018, 0.09, 4, 8).rotateZ(Math.PI / 2), M.hair, face, s * 0.14, 0.2, 0.3, false); return b; });
    part(new T.SphereGeometry(0.045, 12, 10), M.skin, face, 0, -0.04, 0.345);
    const mouthO = piv(face, 0, -0.17, 0.315);
    const oGeo = new T.SphereGeometry(0.07, 18, 12); oGeo.scale(0.8, 1.15, 0.35);
    part(oGeo, M.mouth, mouthO, 0, 0, 0, true);
    part(new T.BoxGeometry(0.07, 0.025, 0.02), M.white, mouthO, 0, 0.055, 0.015, false);
    const smile = new T.TorusGeometry(0.075, 0.017, 8, 16, Math.PI); smile.rotateZ(Math.PI);
    const mouthS = part(smile, M.mouth, face, 0, -0.13, 0.33, false);
    const mouthF = part(new T.TorusGeometry(0.06, 0.016, 8, 16, Math.PI), M.mouth, face, 0, -0.2, 0.32, false);
    for (const s of [-1, 1]) { const c = part(new T.CircleGeometry(0.06, 16), M.cheek, face, s * 0.23, -0.08, 0.3, false); c.rotation.y = s * 0.55; c.castShadow = false; }
    // barba (aparece con los años)
    const beardG = new T.SphereGeometry(0.33, 24, 12, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.35); beardG.scale(1.02, 1.1, 0.98);
    const beard = part(beardG, M.hair, head, 0, -0.03, 0.02, false); beard.visible = false;

    const R = (g, x = 0, y = 0, z = 0) => g.rotation.set(x, y, z);
    // pose: valores en radianes; cualquier campo omitido vuelve a reposo
    function pose(p = {}, t = 0) {
      const walk = p.walk || 0, ph = (p.phase ?? t) * (p.speed || 7);
      const sw = Math.sin(ph) * 0.55 * walk;
      body.position.set(0, (p.y || 0) + Math.abs(Math.cos(ph)) * 0.05 * walk, 0);
      body.rotation.set(p.lean || 0, 0, 0);
      R(hips, 0, p.twist || 0, 0);
      legs.forEach((L, i) => {
        const s = i ? -1 : 1, sit = p.sit || 0;
        R(L.thigh, -sw * s - sit * 1.5 + (p.legL && !i ? p.legL : 0) + (p.legR && i ? p.legR : 0), 0, 0);
        R(L.knee, Math.max(0, sw * s) * 0.6 + sit * 1.5, 0, 0);
      });
      arms.forEach((A) => {
        // arm: [adelante(-)/atrás(+), giro, abrir hacia el lado/arriba]; elb: doblar codo hacia dentro; fore: doblar codo hacia delante
        const k = A.s < 0 ? 'L' : 'R', a = p['arm' + k] || [0, 0, 0], e = p['elb' + k] ?? 0, f = p['fore' + k] ?? 0;
        R(A.sh, a[0] + sw * A.s * 0.8, a[1] || 0, A.s * (0.1 + (a[2] || 0)));
        R(A.el, -f, 0, A.s * e);
      });
      R(neck, p.nod || 0, p.look || 0, p.tilt || 0);
      const px = clamp(p.eyeX || 0, -1, 1) * 0.035, py = clamp(p.eyeY || 0, -1, 1) * 0.03;
      const blink = p.blink ?? (((t * 0.37) % 1) > 0.965 ? 1 : 0);
      eyes.forEach((E) => { E.pupil.position.set(px, py, 0.055); E.pupil.scale.setScalar(p.pupil || 1); E.lid.scale.set(1, lerp(0.02, 1, blink), 1); E.lid.visible = blink > 0.01; });
      const br = p.brow || 0; // >0 sorprendido (arriba), <0 triste
      brows.forEach((b, i) => { b.position.y = 0.2 + br * 0.05; b.rotation.z = (i ? -1 : 1) * (br < 0 ? br * 0.5 : br * 0.15); });
      const m = p.mouth || 'smile';
      mouthO.visible = m === 'o'; mouthO.scale.set(1, p.open || 1, 1);
      mouthS.visible = m === 'smile'; mouthF.visible = m === 'frown';
      beard.visible = (p.beard || 0) > 0.01; beard.scale.setScalar(0.85 + 0.15 * (p.beard || 0));
    }
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, u) => a + (b - a) * u;
    pose({}, 0);
    return { root, pose, M, hands: arms.map((a) => a.el), head };
  };
})();
