"""Crea un short vertical a partir de una carpeta de proyecto.

La carpeta debe contener:
  audio.mp3 (o .wav/.m4a/.ogg/.opus)  -> la voz en off
  guion.txt                          -> el texto exacto del audio, con [n] y *resaltes*
  escenas.json                       -> qué se ve en cada escena [n]

Uso:
  python hacer_short.py proyectos/mi_tema                  # vídeo final
  python hacer_short.py proyectos/mi_tema --preview 1,4,9  # fotogramas PNG de prueba
  python hacer_short.py proyectos/mi_tema --voz-prueba     # genera audio robótico (espeak) para probar
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from alinear import align  # noqa: E402

AUDIO_EXT = ("mp3", "wav", "m4a", "ogg", "opus", "aac", "flac")


def find_audio(d):
    """audio.mp3, o varias partes (parte1.mp3, parte2.mp3...) que se unen en orden."""
    parts = sorted(f for ext in AUDIO_EXT for f in glob.glob(os.path.join(d, f"parte*.{ext}")))
    if parts:
        out = os.path.join(d, "_voz.wav")
        cmd = ["ffmpeg", "-v", "error", "-y"]
        for p in parts:
            cmd += ["-i", p]
        flt = "".join(f"[{i}:a]aresample=44100,aformat=channel_layouts=mono,apad=pad_dur=0.35[a{i}];" for i in range(len(parts)))
        flt += "".join(f"[a{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1[o]"
        subprocess.run(cmd + ["-filter_complex", flt, "-map", "[o]", out], check=True)
        print(f"[audio] unidas {len(parts)} partes: " + ", ".join(os.path.basename(p) for p in parts))
        return out
    for ext in AUDIO_EXT:
        f = glob.glob(os.path.join(d, f"audio.{ext}")) or [x for x in glob.glob(os.path.join(d, f"*.{ext}")) if not os.path.basename(x).startswith("_")]
        if f:
            return f[0]
    return None


def fake_voice(d):
    text = open(os.path.join(d, "guion.txt"), encoding="utf-8").read()
    text = re.sub(r"\[\d+\]", " ", text).replace("*", "")
    out = os.path.join(d, "audio.wav")
    subprocess.run(["espeak-ng", "-v", "es", "-s", "165", "-p", "45", "-w", out, text], check=True)
    print("voz de prueba:", out)


def build(d, method="auto"):
    audio = find_audio(d)
    if not audio:
        raise SystemExit(f"No hay audio en {d} (audio.mp3, .wav, .m4a...)")
    script = open(os.path.join(d, "guion.txt"), encoding="utf-8").read()
    cfg = json.load(open(os.path.join(d, "escenas.json"), encoding="utf-8"))
    al = align(script, audio, method)
    print(f"[alinear] {len(al['words'])} palabras, {al['duration']:.1f}s, método: {al['method']}")
    marca = None
    mp = os.path.join(HERE, "marca.json")
    if os.path.exists(mp) and cfg.get("marca", True):
        marca = json.load(open(mp, encoding="utf-8"))
        marca["logoUrl"] = "file://" + os.path.join(HERE, "engine", marca.get("logo", "logo.png"))
    tail = cfg.get("cola", 0.6) + (marca.get("cierre", 0) if marca else 0)
    total = al["duration"] + tail
    ids = sorted(al["markers"], key=lambda k: al["markers"][k])
    scenes = []
    for n, k in enumerate(ids):
        sc = dict(cfg.get("escenas", {}).get(str(k)) or {})
        if not sc and cfg.get("motor") != "3d":
            print(f"  aviso: la escena [{k}] no está en escenas.json; se usa un fondo vacío")
        sc["start"] = al["markers"][k] if n else 0.0
        sc["end"] = al["markers"][ids[n + 1]] if n + 1 < len(ids) else total
        sc["id"] = k
        scenes.append(sc)
    if not scenes:
        raise SystemExit("El guion no tiene marcas de escena [1], [2]...")
    extra = [os.path.abspath(p) for p in glob.glob(os.path.join(d, "*.js"))]
    data = {"duration": total, "words": al["words"], "scenes": scenes, "extraAssets": extra, "brand": marca}
    if cfg.get("motor") == "3d":
        data["page"] = os.path.join(HERE, "engine3d", "index.html")
    path = os.path.join(d, "data.json")
    json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return path, audio, cfg


def mix_music(d, voice, music, vol):
    out = os.path.join(d, "_mezcla.m4a")
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", voice, "-stream_loop", "-1", "-i", music,
        "-filter_complex", f"[1:a]volume={vol}[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0,apad=pad_dur=1[a]",
        "-map", "[a]", "-c:a", "aac", "-b:a", "192k", out], check=True)
    return out


def add_sfx(d, data_path, voice, render, cfg):
    """Efectos de sonido sintetizados + cama musical (ver sfx.py)."""
    import sfx
    data = json.load(open(data_path, encoding="utf-8"))
    ev = {"sfx": [], "uw": []}
    if True:
        evp = os.path.join(d, "_eventos.json")
        subprocess.run(["node", render, data_path, "-", "--events", evp], check=True)
        ev = json.load(open(evp))
    uw, cur = [], None
    for t, flag in ev["uw"]:
        if flag and cur is None:
            cur = t
        if not flag and cur is not None:
            uw.append((cur, t)); cur = None
    if cur is not None:
        uw.append((cur, data["duration"]))
    inicios = [s["start"] for s in data["scenes"]]
    out = os.path.join(d, "_mezcla.wav")
    sfx.mezclar(voice, data["duration"], ev["sfx"], uw, inicios, out,
                musica=cfg.get("cama_musical", True), vol_musica=cfg.get("volumen_cama", 0.08), estilo=cfg.get("musica_estilo", "pad"))
    print(f"[sonido] {len(ev['sfx'])} efectos, {len(uw)} tramos bajo el agua, {len(inicios) - 1} transiciones")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("proyecto")
    ap.add_argument("--preview", help="tiempos en segundos separados por comas")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--voz-prueba", action="store_true")
    ap.add_argument("--metodo", default="auto", choices=["auto", "whisper", "silencios"])
    a = ap.parse_args()
    d = os.path.abspath(a.proyecto)
    if a.voz_prueba:
        fake_voice(d)
    data, audio, cfg = build(d, a.metodo)
    render = os.path.join(HERE, "render.js")
    if a.preview:
        subprocess.run(["node", render, data, "-", "--frames", a.preview, "--outdir", os.path.join(d, "preview")], check=True)
        return
    if cfg.get("musica"):
        audio = mix_music(d, audio, os.path.join(d, cfg["musica"]), cfg.get("volumen_musica", 0.12))
    elif cfg.get("sonidos", True):
        audio = add_sfx(d, data, audio, render, cfg)
    out = os.path.join(d, cfg.get("salida", "short.mp4"))
    subprocess.run(["node", render, data, out, "--fps", str(a.fps), "--audio", audio], check=True)


if __name__ == "__main__":
    main()
