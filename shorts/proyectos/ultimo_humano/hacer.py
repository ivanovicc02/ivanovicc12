"""¿Qué pasaría si fueras el último humano? — Ciudad de México, con el personaje del canal (engine3d/personaje.js).

1. La voz de ElevenLabs (texto en elevenlabs.txt) va aquí como audio.mp3
2. python hacer.py --preview 2,8,14     -> PNG en preview/
   python hacer.py --procesos 4         -> ultimo_humano.mp4
"""
import argparse
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SHORTS = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, SHORTS)
import sfx  # noqa: E402
import numpy as np  # noqa: E402
from alinear import align  # noqa: E402

COLA = 4.5


def frases(words, maxw=6):
    trozos, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r"[.?!…]$", w["w"]) or (re.search(r"[,:;]$", w["w"]) and len(cur) >= 3):
            trozos.append(cur); cur = []
    if cur:
        trozos.append(cur)
    caps = []
    for c in trozos:
        n = -(-len(c) // maxw); k = -(-len(c) // n)
        caps += [c[i:i + k] for i in range(0, len(c), k)]
    out = [[round(c[0]["start"], 3), round(c[-1]["end"], 3), " ".join(x["w"] for x in c), [x["w"].strip("¿?¡!.,…:;") for x in c if x.get("hl")]] for c in caps]
    for i in range(len(out) - 1):
        if out[i + 1][0] - out[i][1] < 0.6:
            out[i][1] = out[i + 1][0] - 0.05
    return out


def ring():
    t = sfx._t(1.6)
    on = ((t % 0.4) < 0.3) & (t < 1.2)
    s = (np.sin(2 * np.pi * 1300 * t) + np.sin(2 * np.pi * 1700 * t)) * on * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 20 * t)))
    return sfx._norm(sfx._lp(s, 4000), 0.5)


def bark():
    t = sfx._t(0.25)
    f = 420 * np.exp(-t * 4)
    s = sum(np.sin(2 * np.pi * np.cumsum(f * k) / sfx.SR) / k for k in (1, 2, 3)) * np.exp(-t * 14) * np.minimum(1, t * 200)
    return sfx._norm(sfx._bp(s + 0.3 * sfx._noise(0.25) * np.exp(-t * 20), 250, 2500), 0.6)


def engine():
    d = 2.0; t = sfx._t(d)
    f = 70 + 60 * t / d
    s = sum(np.sin(2 * np.pi * np.cumsum(f * k) / sfx.SR) / k for k in (1, 2, 3, 4))
    return sfx._norm(sfx._lp(s, 900) * np.minimum(1, t * 6) * np.minimum(1, (d - t) * 3), 0.7)


def chirp():
    d = 0.5; t = sfx._t(d); s = np.zeros_like(t)
    for k in range(3):
        i = int(k * 0.12 * sfx.SR); L = int(0.08 * sfx.SR); tt = np.arange(L) / sfx.SR
        s[i:i + L] += np.sin(2 * np.pi * np.cumsum(3200 + 1500 * np.sin(np.pi * tt / 0.08)) / sfx.SR) * np.sin(np.pi * tt / 0.08)
    return sfx._norm(s, 0.35)


for _n, _f in (("ring", ring), ("bark", bark), ("engine", engine), ("chirp", chirp)):
    sfx.SOUNDS[_n] = _f
sfx.GAIN.update({"ring": 0.3, "bark": 0.45, "engine": 0.55, "chirp": 0.3})


def eventos(data):
    S = {int(k): v for k, v in data["scenes"].items()}
    W = {}
    for w in data["words"]:
        W.setdefault(re.sub(r"[^a-záéíóúñ0-9]", "", w["w"].lower()), w["start"])
    g = lambda w, d: W.get(w, d)
    ev = []
    add = lambda name, t, vol=1: ev.append({"name": name, "t": round(t, 2), "vol": vol})

    def loop(name, a, b, step, vol=1):
        t = a
        while t < b:
            add(name, t, vol); t += step
    loop("chirp", 0.4, S[2][0], 1.7, 0.6)
    add("pop", g("único", 3.3), 0.8)
    loop("wind", S[2][0], S[4][0], 3.5, 0.8)
    loop("step", S[2][0], g("nadie", 7.6), 0.42, 0.5)
    add("creak", g("puertas", 11.4), 0.7)
    for k in range(4):
        add("ring", g("celulares", 13.0) + k * 0.55, 0.9 - k * 0.1)
    add("ding", g("tienda", 19.1) - 0.2, 0.9); add("engine", g("manejar", 19.5) - 0.1, 1); add("bounce" if False else "pop", g("hotel", 21.9), 0.8)
    for t in (g("controle", 26.6), g("plantas", 27.4), g("apagan", 28.5), g("una", 29.4)):
        add("buzz", t, 0.6); add("hit", t + 0.1, 0.7)
    add("boom", g("oscuras", 33.5), 0.6)
    loop("wind", S[6][0], S[7][0], 3.5, 0.6)
    add("pop", g("internet", 35.7), 0.7); add("creak", g("refrigeradores", 37.2), 0.7); add("drip", g("llave", 39.6) + 0.3, 1); add("drip", g("llave", 39.6) + 0.9, 0.7)
    loop("wind", g("viento", 46.8) - 0.5, S[9][0], 3, 1.2)
    add("heartbeat", g("silencio", 42.7), 0.6)
    for k in range(3):
        add("bark", g("animales", 48.0) + 0.2 + k * 0.4, 0.8)
    loop("chirp", S[9][0], S[10][0], 1.3, 0.6)
    add("rumble", g("edificios", 54.5), 1); add("boom", g("caer", 55.8), 0.9); add("rumble", g("caer", 55.8) + 0.3, 0.9)
    loop("wind", S[10][0], S[11][0], 3, 0.7)
    add("ding", g("primero", 61.2), 0.8)
    loop("chirp", S[11][0], data["duration"], 2.1, 0.4)
    return ev


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--procesos", type=int, default=1)
    a = ap.parse_args()
    voz = os.path.join(HERE, "audio.mp3")
    al = align(open(os.path.join(HERE, "guion.txt"), encoding="utf-8").read(), voz)
    print(f"[voz] {al['method']}, {al['duration']:.1f}s")
    last = max(w["end"] for w in al["words"])
    total = round(last + COLA, 2)
    ids = sorted(al["markers"], key=lambda k: al["markers"][k])
    scenes = {str(k): [al["markers"][k], al["markers"][ids[n + 1]] if n + 1 < len(ids) else total] for n, k in enumerate(ids)}
    words = [{"w": w["w"], "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in al["words"]]
    data = {"duration": total, "page": os.path.join(HERE, "escena.html"), "scenes": scenes, "words": words,
            "caps": frases(al["words"]), "fin": last + 0.4}
    path = os.path.join(HERE, "data.json")
    json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    render = os.path.join(SHORTS, "render.js")
    if a.preview:
        subprocess.run(["node", render, path, "-", "--frames", a.preview, "--outdir", os.path.join(HERE, "preview")], check=True)
        return
    S = data["scenes"]
    audio = os.path.join(HERE, "_mezcla.wav")
    sfx.mezclar(voz, total, eventos(data), [], [S[k][0] for k in sorted(S, key=int)], audio,
                musica=True, vol_musica=0.07)
    out = os.path.join(HERE, "ultimo_humano.mp4")
    subprocess.run(["node", render, path, out, "--fps", str(a.fps), "--audio", audio, "--workers", str(a.procesos)], check=True)


if __name__ == "__main__":
    main()
