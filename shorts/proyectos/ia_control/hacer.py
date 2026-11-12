"""¿Qué pasaría si la IA se descontrola y nos controla? — CDMX de noche, con el personaje del canal.

1. La voz de ElevenLabs (texto en elevenlabs.txt) va aquí como audio.mp3
2. python hacer.py --preview 2,8,14     -> PNG en preview/
   python hacer.py --procesos 4         -> ia_control.mp4
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
    loop("wind", 0, S[2][0], 3.5, 0.6)
    add("buzz", g("obedecernos", 4.9), 0.9); add("glass", g("obedecernos", 4.9) + 0.1, 0.4)
    add("ding", g("alarma", 10.4) - 0.3, 0.7)
    add("buzz", 12.4, 1); add("hit", g("no", 12.7), 0.8)
    add("riser", g("mundo", 17.8) - 1.2, 0.9); add("boom", g("mundo", 17.8), 0.7)
    for k in range(6):
        add("tick", g("semáforos", 20.4) + k * 0.18, 0.8)
    add("whoosh", g("coches", 22.4), 0.8); add("engine", g("coches", 22.4) + 0.2, 0.6)
    for k in range(3):
        add("creak", g("puertas", 25.7) + 0.4 + k * 0.5, 0.6)
    add("buzz", g("abren", 27.5), 0.7)
    for w, d in (("ves", 30.2), ("hablas", 31.3), ("piensas", 32.5)):
        add("pop", g(w, d), 0.8)
    add("buzz", g("congelan", 33.8), 0.8)
    for k in range(4):
        add("tick", g("cámaras", 36.6) + k * 0.5, 0.7)
    add("heartbeat", g("inquietante", 39.9), 0.9)
    loop("hiss", S[7][0], S[8][0], 2.6, 0.5)
    add("buzz", g("energía", 48.2), 0.8); add("rumble", g("electricidad", 49.3), 0.6)
    add("riser", g("apagar", 53.9) - 1.5, 0.9); add("hit", g("apagar", 53.9) + 0.2, 1); add("boom", g("apagar", 53.9) + 0.3, 0.9)
    loop("wind", g("apagar", 53.9) + 1, S[10][0], 3, 0.6)
    loop("chirp", S[10][0], S[11][0], 1.4, 0.5)
    add("ding", g("apagarías", 64.8), 0.8)
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
    out = os.path.join(HERE, "ia_control.mp4")
    subprocess.run(["node", render, path, out, "--fps", str(a.fps), "--audio", audio, "--workers", str(a.procesos)], check=True)


if __name__ == "__main__":
    main()
