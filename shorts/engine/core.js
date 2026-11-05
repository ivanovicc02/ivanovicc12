// Motor de render para shorts estilo "explicador animado" (9:16, 1080x1920).
// Expone window.loadProject(data) y window.renderAt(t). Todo es determinista
// para que cada fotograma salga igual en cada render.

(function () {
  const W = 1080, H = 1920;
  const ASSETS = (window.ASSETS = window.ASSETS || {});
  let P = null;          // proyecto cargado
  let chunks = [];       // frases de subtítulos
  const cache = {};      // SVG estáticos ya generados

  // ---------- utilidades ----------
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = {
    linear: (u) => u,
    inOut: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
    out: (u) => 1 - Math.pow(1 - u, 3),
    in: (u) => u * u * u,
    back: (u) => { const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); },
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  window.SH = { rng, clamp, lerp, ease, esc, W, H };

  // ---------- fondos ----------
  function pine(x, base, h, w, color) {
    // pino estilizado de 4 pisos
    let s = '';
    const tiers = 4;
    for (let i = 0; i < tiers; i++) {
      const top = base - h + (h * i) / (tiers + 0.6);
      const bot = top + h * 0.42;
      const ww = w * (0.45 + (0.55 * (i + 1)) / tiers);
      s += `<polygon points="${x},${top} ${x - ww / 2},${bot} ${x + ww / 2},${bot}" fill="${color}"/>`;
    }
    s += `<rect x="${x - w * 0.05}" y="${base - h * 0.12}" width="${w * 0.1}" height="${h * 0.14}" fill="${color}"/>`;
    return s;
  }

  function skyDefs(id, stops) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops
      .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  }

  // Paletas de cielo reutilizables
  const SKIES = {
    sunset: [[0, '#1d1636'], [0.35, '#3d2752'], [0.62, '#8e4767'], [0.8, '#d9746a'], [1, '#f6b36f']],
    day:    [[0, '#3d7fd0'], [0.6, '#8fc3ef'], [1, '#e6f2f7']],
    night:  [[0, '#05070f'], [0.6, '#101a33'], [1, '#283a5c']],
    storm:  [[0, '#14161d'], [0.6, '#2d3442'], [1, '#56607a']],
  };

  function bgLandscape(o) {
    // o: {sky, horizon, ground:[c1,c2,c3], mountains, pinesFar, pinesNear, seed}
    const key = 'land' + JSON.stringify(o);
    if (cache[key]) return cache[key];
    const r = rng(o.seed || 7);
    const hz = o.horizon || 1060;
    let s = `<defs>${skyDefs('sky_' + o.skyName, SKIES[o.skyName] || SKIES.sunset)}
      <linearGradient id="gr_${o.skyName}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${o.ground[0]}"/><stop offset="0.35" stop-color="${o.ground[1]}"/>
        <stop offset="1" stop-color="${o.ground[2]}"/></linearGradient></defs>`;
    s += `<rect x="-600" y="-600" width="${W + 1200}" height="${hz + 600}" fill="url(#sky_${o.skyName})"/>`;
    if (o.stars) {
      for (let i = 0; i < 90; i++) s += `<circle cx="${r() * (W + 400) - 200}" cy="${r() * hz * 0.7}" r="${1 + r() * 2.2}" fill="#fff" opacity="${0.3 + r() * 0.6}"/>`;
    }
    if (o.moon) s += `<circle cx="790" cy="380" r="70" fill="#f4efd6"/><circle cx="765" cy="365" r="70" fill="${SKIES[o.skyName][0][1]}" opacity="0"/>`;
    if (o.mountains !== false) {
      let pts = `-600,${hz}`;
      for (let x = -600; x <= W + 600; x += 120) pts += ` ${x},${hz - 70 - r() * 130}`;
      pts += ` ${W + 600},${hz}`;
      s += `<polygon points="${pts}" fill="${o.mountainColor || '#5b3f78'}" opacity="0.9"/>`;
    }
    if (o.pines !== false) {
      for (let x = -600; x < W + 600; x += 55 + r() * 40) s += pine(x, hz + 8, 200 + r() * 170, 120 + r() * 50, o.pineFar || '#22403f');
      for (let x = -620; x < W + 620; x += 90 + r() * 80) s += pine(x, hz + 14, 280 + r() * 230, 160 + r() * 70, o.pineNear || '#173332');
    }
    s += `<rect x="-600" y="${hz}" width="${W + 1200}" height="${H - hz + 900}" fill="url(#gr_${o.skyName})"/>`;
    s += `<rect x="-600" y="${hz - 3}" width="${W + 1200}" height="7" fill="#fff6c8" opacity="0.75"/>`;
    // briznas de hierba
    for (let i = 0; i < 260; i++) {
      const x = r() * (W + 1200) - 600, y = hz + 30 + Math.pow(r(), 0.8) * (H - hz + 700);
      const h = 8 + (y - hz) * 0.03 + r() * 12;
      s += `<path d="M${x} ${y} l${-3 + r() * 6} ${-h}" stroke="${o.blade || '#2f5a22'}" stroke-width="${2 + (y - hz) * 0.004}" opacity="${0.35 + r() * 0.4}" stroke-linecap="round"/>`;
    }
    return (cache[key] = s);
  }

  function bgGrassTop(o) {
    const key = 'grass' + JSON.stringify(o);
    if (cache[key]) return cache[key];
    const r = rng(o.seed || 3);
    let s = `<rect x="-600" y="-600" width="${W + 1200}" height="${H + 1200}" fill="${o.base || '#55802b'}"/>`;
    const greens = o.greens || ['#7fa83a', '#3f6a1f', '#9bbf4a', '#47731f', '#2f5419', '#b4cf5c'];
    let d = {};
    for (let i = 0; i < 4200; i++) {
      const x = r() * (W + 1200) - 600, y = r() * (H + 1200) - 600;
      const c = greens[(r() * greens.length) | 0];
      const a = r() * Math.PI * 2, L = 10 + r() * 22;
      (d[c] = d[c] || []).push(`M${x.toFixed(0)} ${y.toFixed(0)}l${(Math.cos(a) * L).toFixed(1)} ${(Math.sin(a) * L).toFixed(1)}`);
    }
    for (const c in d) s += `<path d="${d[c].join('')}" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
    // flores pequeñas
    for (let i = 0; i < 40; i++) s += `<circle cx="${r() * W}" cy="${r() * H}" r="${3 + r() * 3}" fill="${['#f4d7e8', '#fff5c2', '#e8a6c9'][i % 3]}" opacity=".8"/>`;
    return (cache[key] = s);
  }

  const BACKGROUNDS = {
    forest: () => bgLandscape({ skyName: 'sunset', ground: ['#a7bd4f', '#5f8c33', '#2c5420'] }),
    forestNight: () => bgLandscape({ skyName: 'night', ground: ['#3b5a3a', '#223a26', '#101e14'], stars: true, mountainColor: '#1d2840', pineFar: '#0f1f22', pineNear: '#0a1517', blade: '#0d1a10' }),
    meadow: () => bgLandscape({ skyName: 'day', ground: ['#b5d06a', '#74a83f', '#3e6e26'], mountainColor: '#7d9cc4', pineFar: '#2f6a4a', pineNear: '#21503a' }),
    plains: () => bgLandscape({ skyName: 'sunset', ground: ['#d8b866', '#b48b45', '#6e5428'], pines: false, mountainColor: '#6b4472', blade: '#7c5e2a' }),
    storm: () => bgLandscape({ skyName: 'storm', ground: ['#6d7f58', '#465a3a', '#26331f'], mountainColor: '#3a4255', pineFar: '#1d2a2a', pineNear: '#141f1f' }),
    grass: () => bgGrassTop({}),
    sand: () => bgGrassTop({ base: '#d9b779', greens: ['#c9a466', '#e6c98e', '#b88f53', '#f0d8a6'] }),
    water: () => bgWater(),
    dark: () => `<rect x="-600" y="-600" width="${W + 1200}" height="${H + 1200}" fill="#0f0f1a"/>`,
  };
  function bgWater() {
    const key = 'water';
    if (cache[key]) return cache[key];
    const r = rng(11);
    let s = `<defs>${skyDefs('sea', [[0, '#5fc3d9'], [0.5, '#1f7fa6'], [1, '#0b3a5c']])}</defs>`;
    s += `<rect x="-600" y="-600" width="${W + 1200}" height="${H + 1200}" fill="url(#sea)"/>`;
    for (let i = 0; i < 60; i++) s += `<path d="M${r() * W * 1.6 - 300} ${r() * H} q30 -14 60 0 t60 0" stroke="#bfefff" stroke-width="4" fill="none" opacity="${0.15 + r() * 0.3}"/>`;
    return (cache[key] = s);
  }
  window.BACKGROUNDS = BACKGROUNDS;

  // Partículas flotantes (luciérnagas / polvo), en coordenadas de pantalla
  function particles(t, kind) {
    if (kind === 'none') return '';
    const r = rng(99);
    let s = '';
    const n = 34;
    for (let i = 0; i < n; i++) {
      const bx = r() * W, by = r() * H, sp = 8 + r() * 18, ph = r() * 6.28, rad = 2 + r() * 3.5;
      const x = bx + Math.sin(t * 0.5 + ph) * 30;
      const y = ((by - t * sp) % H + H) % H;
      const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2 + ph));
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="#fff4b8" opacity="${a.toFixed(2)}"/>`;
    }
    return s;
  }

  // ---------- subtítulos ----------
  function buildChunks(words) {
    const out = [];
    let cur = [], chars = 0;
    words.forEach((w, i) => {
      cur.push(i); chars += w.w.length + 1;
      const end = /[.?!:…]$/.test(w.w) || w.w.endsWith('...');
      const comma = /[,;]$/.test(w.w);
      if (end || (comma && chars >= 14) || chars >= 30) { out.push(cur); cur = []; chars = 0; }
    });
    if (cur.length) out.push(cur);
    return out;
  }

  function renderCaptions(t) {
    const el = document.getElementById('captions');
    if (!P || !P.words || !P.words.length) { el.innerHTML = ''; return; }
    const words = P.words;
    let ci = -1;
    for (let i = 0; i < chunks.length; i++) if (words[chunks[i][0]].start <= t + 0.02) ci = i;
    const last = words[words.length - 1];
    if (ci < 0 || t > last.end + 0.6) { el.innerHTML = ''; return; }
    const ch = chunks[ci];
    let html = '', nowIdx = -1;
    ch.forEach((wi) => { if (words[wi].start <= t + 0.02) nowIdx = wi; });
    ch.forEach((wi) => {
      const w = words[wi];
      if (wi > nowIdx) return;
      const cls = ['w', wi === nowIdx ? 'now' : 'past'];
      if (w.hl && wi === nowIdx) cls.push('hl');
      const pop = wi === nowIdx ? clamp((t - w.start) / 0.12, 0, 1) : 1;
      const sc = 0.82 + 0.18 * ease.back(pop);
      html += `<span class="${cls.join(' ')}" style="transform:scale(${sc.toFixed(3)})">` +
        (w.hl && wi === nowIdx ? '<i class="dot d1"></i><i class="dot d2"></i>' : '') +
        `<span class="t">${esc(w.w)}</span></span> `;
    });
    el.innerHTML = html;
  }

  // ---------- escenas ----------
  function itemPos(it, lt, dur) {
    let x = it.x ?? 540, y = it.y ?? 1500;
    if (it.move) {
      const m = it.move;
      const t0 = m.start ?? 0, t1 = m.end ?? dur;
      const u = (ease[m.ease || 'inOut'])(clamp((lt - t0) / Math.max(0.01, t1 - t0), 0, 1));
      x = lerp(m.from[0], m.to[0], u); y = lerp(m.from[1], m.to[1], u);
    }
    return [x, y];
  }

  function drawItem(it, sc, lt, t) {
    const fn = ASSETS[it.type];
    if (!fn) return `<text x="540" y="960" fill="red" font-size="40">asset? ${esc(it.type)}</text>`;
    const dur = sc.end - sc.start;
    const enter = it.enter ?? 0;
    if (lt < enter) return '';
    if (it.exit != null && lt > it.exit) return '';
    const [x, y] = itemPos(it, lt, dur);
    let s = it.scale ?? 1;
    const popU = clamp((lt - enter) / 0.35, 0, 1);
    if (it.pop !== false && enter > 0) s *= ease.back(popU);
    const flip = it.flip ? -1 : 1;
    const rot = it.rot ?? 0;
    const inner = fn(it, { t, lt: lt - enter, dur, u: clamp(lt / dur, 0, 1) });
    const op = it.opacity ?? 1;
    return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot}) scale(${(s * flip).toFixed(3)},${s.toFixed(3)})" opacity="${op}">${inner}</g>`;
  }

  function badge(b, lt) {
    const at = b.at ?? 0.2;
    if (lt < at) return '';
    const u = ease.back(clamp((lt - at) / 0.35, 0, 1));
    const txt = esc(b.text), unit = esc(b.unit || '');
    const wtxt = txt.length * 62 + unit.length * 30 + 80;
    const y = b.y ?? 600;
    return `<g transform="translate(540,${y}) scale(${u.toFixed(3)})">
      <rect x="${-wtxt / 2}" y="-70" width="${wtxt}" height="130" rx="34" fill="#141414" opacity="0.82"/>
      <text x="${unit ? -18 : 0}" y="28" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="104" fill="${b.color || '#ffe7b0'}">${txt}<tspan font-size="48" dx="10" fill="#ffe7b0">${unit}</tspan></text></g>`;
  }

  window.loadProject = function (data) {
    P = data;
    chunks = buildChunks(P.words || []);
    for (const k in cache) delete cache[k];
    return { chunks: chunks.length, scenes: (P.scenes || []).length };
  };

  window.renderCaptionsAt = renderCaptions;
  window.getProject = () => P;

  window.renderAt = function (t) {
    const svg = document.getElementById('stage');
    const scenes = P.scenes;
    let sc = scenes[0];
    for (const s of scenes) if (t >= s.start) sc = s;
    const lt = t - sc.start, dur = Math.max(0.01, sc.end - sc.start);
    // cámara
    const cam = sc.camera || {};
    const c0 = cam.from || [540, 960, 1], c1 = cam.to || c0;
    const cu = ease[cam.ease || 'inOut'](clamp(lt / dur, 0, 1));
    let cx = lerp(c0[0], c1[0], cu), cy = lerp(c0[1], c1[1], cu), z = lerp(c0[2], c1[2], cu);
    // pequeño "punch" al entrar en la escena
    if (sc.punch !== false) z *= 1 + 0.06 * (1 - ease.out(clamp(lt / 0.3, 0, 1)));
    if (sc.shake) {
      const k = typeof sc.shake === 'number' ? sc.shake : 10;
      cx += Math.sin(t * 53) * k; cy += Math.cos(t * 47) * k;
    }
    const bg = (BACKGROUNDS[sc.bg || 'forest'] || BACKGROUNDS.forest)();
    let items = '';
    (sc.items || []).forEach((it) => (items += drawItem(it, sc, lt, t)));
    let overlay = particles(t, sc.particles || 'fireflies');
    if (sc.badge) overlay += badge(sc.badge, lt);
    if (sc.vignette !== false) overlay += `<defs><radialGradient id="vg" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vg)"/>`;
    svg.innerHTML = `<g transform="translate(${W / 2},${H / 2}) scale(${z.toFixed(4)}) translate(${(-cx).toFixed(1)},${(-cy).toFixed(1)})">${bg}${items}</g>${overlay}`;
    // destello
    const fl = document.getElementById('flash');
    fl.style.opacity = sc.flash ? (0.85 * (1 - clamp(lt / 0.25, 0, 1))).toFixed(2) : 0;
    renderCaptions(t);
  };
})();
