"""¿Qué pasaría si Estados Unidos comprara México? — personaje del canal, estilo cinematográfico con desenfoque.

1. La voz de ElevenLabs (texto en elevenlabs.txt) va aquí como audio.mp3
2. python hacer.py --preview 2,8,14     -> PNG en preview/
   python hacer.py --procesos 4         -> mexico_usa.mp4
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
    loop("chirp", 0.3, S[2][0], 1.6, 0.4)
    add("hit", g("comprara", 3.0), 1); add("boom", g("comprara", 3.0), 0.5)
    add("ching", g("1853", 8.5), 0.6); add("whoosh", g("mesilla", 14.0) - 0.3, 0.6)
    add("whoosh", g("peso", 20.9) - 0.2, 0.7); add("ching", 25.7, 0.9)
    add("pop", g("azul", 27.9), 0.8); add("whoosh", g("nueva", 29.4) - 0.5, 0.9)
    loop("wind", S[5][0], S[6][0], 3, 0.8)
    add("riser", g("guatemala", 36.6) - 1.4, 0.7)
    for k in range(6):
        add("tick", g("32", 39.3) + k * 0.12, 0.6)
    add("ding", g("400", 43.5) + 0.8, 0.7)
    loop("chirp", S[7][0], S[8][0], 1.8, 0.3)
    add("hit", g("fútbol", 50.9) + 0.1, 0.8); add("swoosh", g("fútbol", 50.9) + 0.15, 0.6)
    for w, d in (("renta", 55.7), ("comida", 56.3), ("gasolina", 57.1)):
        add("ching", g(w, d), 0.6)
    add("buzz", g("gringo", 59.2), 0.5)
    add("heartbeat", g("existiría", 62.1), 0.8); loop("wind", S[9][0], S[11][0], 3, 0.5)
    add("riser", g("venta", 69.4) - 1.4, 0.7); add("boom", g("venta", 69.4), 0.4)
    add("ding", g("aceptarías", 71.4), 0.8)
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
    words = [{"w": w["w"], "start": round(w["start"], 3), "end": round(w["end"], 3), "hl": bool(w.get("hl"))} for w in al["words"]]
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
    out = os.path.join(HERE, "mexico_usa.mp4")
    subprocess.run(["node", render, path, out, "--fps", str(a.fps), "--audio", audio, "--workers", str(a.procesos)], check=True)


if __name__ == "__main__":
    main()
