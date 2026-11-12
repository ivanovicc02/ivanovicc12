"""¿Qué pasaría si se derritiera todo el hielo del planeta? — Groenlandia, Cancún, Veracruz, Miami y Nueva York.

1. La voz de ElevenLabs (texto en elevenlabs.txt) va aquí como audio.mp3
2. python hacer.py --preview 2,8,14     -> PNG en preview/
   python hacer.py --procesos 4         -> hielo.mp4

Subtítulos, cortes de cámara y nivel del mar se sincronizan con la voz (guion.txt, marcas [1]..[10]).
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


def eventos(data):
    """Efectos de sonido según escenas y palabras (todo sintetizado, ver sfx.py)."""
    S = {int(k): v for k, v in data["scenes"].items()}
    W = {}
    for w in data["words"]:
        W.setdefault(re.sub(r"[^a-záéíóúñ0-9]", "", w["w"].lower()), w["start"])
    ev = []
    add = lambda name, t, vol=1: ev.append({"name": name, "t": round(t, 2), "vol": vol})

    def loop(name, a, b, step, vol=1):
        t = a
        while t < b:
            add(name, t, vol); t += step
    loop("waves", 0, S[2][0], 5, 0.9)                       # playa
    loop("wind", S[2][0], S[3][0], 3.5, 1.2)                # hielo
    for k in range(7):
        t0 = S[2][0] + (S[2][1] - S[2][0]) * (0.12 + k * 0.12)
        add("creak", t0 - 0.6, 0.7); add("rumble", t0, 0.8); add("splash", t0 + 1.6, 0.9)
    loop("waves", S[3][0], S[5][0], 5, 0.9)
    for w in ("playas", "calles", "casas"):
        if w in W:
            add("splash", W[w] + 0.2, 1); add("rumble", W[w], 0.6)
    loop("waves", S[5][0], S[6][0], 4, 1.1)
    for w in ("cancún", "veracruz", "miami", "nueva"):
        if w in W:
            add("whoosh", W[w] - 0.25, 1)
    add("riser", S[5][1] - 1.8, 1)
    add("boom", S[6][0], 0.8)                               # bajo el agua
    tor = W.get("tormentas", S[7][0] + 4.5)
    add("hiss", S[7][0], 0.7)                               # calor
    loop("hiss", tor - 0.5, S[8][0], 2.6, 1.6)              # lluvia
    loop("wind", tor - 0.5, S[8][0], 3, 1.6)
    for t in (S[7][0] + 4.7, W.get("huracanes", S[7][0] + 5.8), W.get("monstruosos", S[7][0] + 6.8)):
        add("boom", t, 0.9); add("rumble", t + 0.2, 0.9)
    loop("wind", S[8][0], S[9][0], 3.5, 0.8)
    loop("step", S[8][0], S[9][0], 0.37, 0.25)
    add("riser", S[9][0], 0.8); loop("wind", S[9][0], S[10][0], 3, 0.7)
    loop("waves", S[10][0], data["duration"], 5, 0.6)
    add("ding", S[10][0] + 0.4, 0.8)
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
    sfx.mezclar(voz, total, eventos(data), [(S["6"][0], S["7"][0])], [S[k][0] for k in sorted(S, key=int)], audio,
                musica=True, vol_musica=0.07)
    out = os.path.join(HERE, "hielo.mp4")
    subprocess.run(["node", render, path, out, "--fps", str(a.fps), "--audio", audio, "--workers", str(a.procesos)], check=True)


if __name__ == "__main__":
    main()
