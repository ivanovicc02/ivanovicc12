// Texturas procedurales de mejor calidad (sin imágenes externas) y entorno de reflejos.
// uso: const X = window.makeTexturas(THREE, renderer); X.asfalto(), X.banqueta(), X.pasto(), X.fachada(tipo), X.entorno(scene, cielo)
(function () {
  window.makeTexturas = function (T, renderer) {
    function rng(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    function tex(w, h, draw, srgb = true) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
      const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; if (srgb) t.colorSpace = T.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
    }
    function speckle(g, w, h, n, cols, r2, size = 2) { for (let i = 0; i < n; i++) { g.fillStyle = cols[(r2() * cols.length) | 0]; const s = 0.5 + r2() * size; g.fillRect(r2() * w, r2() * h, s, s); } }
    const X = {};
    X.asfalto = () => tex(512, 512, (g, w, h) => {
      const r2 = rng(1); g.fillStyle = '#5a5956'; g.fillRect(0, 0, w, h);
      speckle(g, w, h, 26000, ['#4a4946', '#66655f', '#53524e', '#71706a', '#3f3e3b'], r2, 2.2);
      for (let i = 0; i < 14; i++) { const x = r2() * w, y = r2() * h, r = 20 + r2() * 70, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(30,28,26,.22)'); gr.addColorStop(1, 'rgba(30,28,26,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      g.strokeStyle = 'rgba(30,30,28,.5)'; g.lineWidth = 1.2;
      for (let i = 0; i < 10; i++) { let x = r2() * w, y = r2() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r2() - 0.5) * 40; y += (r2() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    });
    X.banqueta = () => tex(512, 512, (g, w, h) => {
      const r2 = rng(2), n = 4, s = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 196 + ((r2() * 18) | 0); g.fillStyle = `rgb(${v},${v - 6},${v - 14})`; g.fillRect(i * s, j * s, s, s); }
      speckle(g, w, h, 9000, ['rgba(120,112,100,.35)', 'rgba(255,255,255,.25)', 'rgba(90,84,76,.3)'], r2, 1.6);
      g.fillStyle = 'rgba(80,74,66,.75)'; for (let i = 0; i <= n; i++) { g.fillRect(i * s - 2, 0, 4, h); g.fillRect(0, i * s - 2, w, 4); }
    });
    X.pasto = () => tex(512, 512, (g, w, h) => {
      const r2 = rng(3); g.fillStyle = '#5f8a3c'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { const x = r2() * w, y = r2() * h; g.strokeStyle = ['#4f7a30', '#73a04a', '#5a8638', '#86b25a', '#456b2a'][(r2() * 5) | 0]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r2() - 0.5) * 4, y - 3 - r2() * 6); g.stroke(); }
    });
    X.madera = () => tex(512, 512, (g, w, h) => {
      const r2 = rng(4);
      for (let i = 0; i < 8; i++) { const base = ['#a8703f', '#b27b48', '#9c673a', '#b88452'][i % 4]; g.fillStyle = base; g.fillRect(0, i * 64, w, 64);
        for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(60,35,15,${0.06 + r2() * 0.1})`; g.beginPath(); const y = i * 64 + r2() * 64; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (r2() - 0.5) * 8, w * 0.6, y + (r2() - 0.5) * 8, w, y); g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, i * 64, w, 2); g.fillRect(((i * 197) % w), i * 64, 2, 64); }
    });
    X.pared = (color = '#ecdcc4') => tex(256, 256, (g, w, h) => { const r2 = rng(5); g.fillStyle = color; g.fillRect(0, 0, w, h); speckle(g, w, h, 5000, ['rgba(0,0,0,.035)', 'rgba(255,255,255,.05)'], r2, 3); });
    // fachadas: ventanas con marco, parteluz, persianas variadas y reflejo; emissive con ventanas encendidas al azar
    X.fachada = (tipo = 'piedra', seed = 7) => {
      const r2 = rng(seed), cols = 4, rows = 4;
      const lit = [];
      const map = tex(512, 512, (g, w, h) => {
        const cw = w / cols, ch = h / rows;
        g.fillStyle = tipo === 'vidrio' ? '#cfd8e1' : '#ffffff'; g.fillRect(0, 0, w, h);
        if (tipo !== 'vidrio') speckle(g, w, h, 6000, ['rgba(0,0,0,.05)', 'rgba(255,255,255,.08)'], r2, 2);
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const x = i * cw, y = j * ch, mx = tipo === 'vidrio' ? 3 : cw * 0.16, my = tipo === 'vidrio' ? 4 : ch * 0.2;
          const gr = g.createLinearGradient(x, y, x + cw, y + ch);
          gr.addColorStop(0, tipo === 'vidrio' ? '#7d9bb8' : '#7b8d9e'); gr.addColorStop(0.5, tipo === 'vidrio' ? '#45607e' : '#4c5d6e'); gr.addColorStop(1, tipo === 'vidrio' ? '#6b88a6' : '#62748a');
          g.fillStyle = gr; g.fillRect(x + mx, y + my, cw - 2 * mx, ch - 2 * my);
          const blind = r2(); if (blind < 0.35) { g.fillStyle = `rgba(235,228,214,${0.6 + r2() * 0.3})`; g.fillRect(x + mx, y + my, cw - 2 * mx, (ch - 2 * my) * (0.2 + r2() * 0.7)); }
          g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(x + mx, y + my); g.lineTo(x + mx + (cw - 2 * mx) * 0.45, y + my); g.lineTo(x + mx, y + my + (ch - 2 * my) * 0.6); g.fill();
          g.fillStyle = tipo === 'vidrio' ? 'rgba(210,220,230,.9)' : 'rgba(70,70,72,.8)'; g.fillRect(x + cw / 2 - 1.5, y + my, 3, ch - 2 * my);
          if (tipo !== 'vidrio') { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + mx - 3, y + ch - my, cw - 2 * mx + 6, 5); }
          lit.push(r2() < 0.55);
        }
      });
      const emissive = tex(512, 512, (g, w, h) => {
        const cw = w / cols, ch = h / rows; g.fillStyle = '#000'; g.fillRect(0, 0, w, h); let k = 0;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { if (lit[k++]) { const mx = tipo === 'vidrio' ? 3 : cw * 0.16, my = tipo === 'vidrio' ? 4 : ch * 0.2; g.fillStyle = ['#ffd59a', '#ffe7c0', '#cfe3ff', '#ffc77a'][(i + j) % 4]; g.fillRect(i * cw + mx, j * ch + my, cw - 2 * mx, ch - 2 * my); } }
      });
      return { map, emissive };
    };
    // grano de película (imagen para superponer en HTML)
    X.granoURL = () => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), img = g.createImageData(256, 256), r2 = rng(9);
      for (let i = 0; i < img.data.length; i += 4) { const v = (r2() * 255) | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); return c.toDataURL(); };
    // mapa de entorno (reflejos suaves en vidrio, metal y coches) a partir de un cielo degradado
    X.entorno = (scene, top = '#6d94c8', hor = '#e8e4dc', ground = '#5d5850') => {
      const s = new T.Scene();
      const m = new T.ShaderMaterial({ side: T.BackSide, uniforms: { a: { value: new T.Color(top) }, b: { value: new T.Color(hor) }, c: { value: new T.Color(ground) } },
        vertexShader: 'varying vec3 v; void main(){ v = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: 'uniform vec3 a,b,c; varying vec3 v; void main(){ float y = normalize(v).y; vec3 col = y > 0. ? mix(b, a, smoothstep(0.,0.6,y)) : mix(b, c, smoothstep(0.,0.2,-y)); gl_FragColor = vec4(col,1.); }' });
      s.add(new T.Mesh(new T.SphereGeometry(10, 32, 16), m));
      const pm = new T.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.02); scene.environment = rt.texture; return rt.texture;
    };
    return X;
  };
})();
