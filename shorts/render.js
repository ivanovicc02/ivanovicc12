// Renderiza un proyecto (data.json) a MP4 1080x1920 con Chromium + ffmpeg.
// uso: node render.js data.json salida.mp4 [--fps 30] [--audio a.mp3] [--frames 1.5,3,7 --outdir dir]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > 0 ? process.argv[i + 1] : def;
}

(async () => {
  const dataPath = process.argv[2], out = process.argv[3];
  const fps = Number(arg('fps', 30));
  const audio = arg('audio', null);
  const frames = arg('frames', null);
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[página]', e.message));
  await page.goto('file://' + path.join(__dirname, 'engine', 'index.html'));
  if (data.extraAssets) {
    for (const f of data.extraAssets) await page.addScriptTag({ path: f });
  }
  await page.evaluate(() => document.fonts.ready);
  console.log('proyecto:', await page.evaluate((d) => window.loadProject(d), data));

  if (frames) {
    // modo vista previa: fotogramas sueltos en PNG
    const dir = arg('outdir', '.');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of frames.split(',').map(Number)) {
      await page.evaluate((t) => window.renderAt(t), t);
      await page.screenshot({ path: path.join(dir, `frame_${t.toFixed(2)}.png`) });
    }
    await browser.close();
    return;
  }

  const total = Math.ceil(data.duration * fps);
  const ffArgs = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
  if (audio) ffArgs.push('-i', audio);
  ffArgs.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(fps));
  if (audio) ffArgs.push('-af', 'apad', '-c:a', 'aac', '-b:a', '192k', '-shortest');
  ffArgs.push('-movflags', '+faststart', out);
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  let ffDone = false;
  ff.on('close', () => (ffDone = true));
  const t0 = Date.now();
  for (let i = 0; i < total && !ffDone; i++) {
    await page.evaluate((t) => window.renderAt(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => { ff.stdin.once('drain', r); ff.once('close', r); });
    if (i % (fps * 5) === 0) process.stdout.write(`\r  fotograma ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  if (!ffDone) await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log(`\nlisto: ${out} en ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})();
