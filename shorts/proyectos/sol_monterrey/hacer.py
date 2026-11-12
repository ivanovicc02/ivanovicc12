"""¿Qué pasaría si el Sol explotara? — versión Monterrey, N.L.

Video sin voz: solo subtítulos, contadores y sonido ambiental sintetizado.

  python hacer.py --preview 2,12,30,40,55,66,76   # PNG en preview/
  python hacer.py --procesos 4                    # -> sol_monterrey.mp4
"""
import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SHORTS = os.path.dirname(os.path.dirname(HERE))
DURACION = 80.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--procesos", type=int, default=1)
    a = ap.parse_args()
    data = os.path.join(HERE, "data.json")
    json.dump({"duration": DURACION, "page": os.path.join(HERE, "escena.html")}, open(data, "w"))
    render = os.path.join(SHORTS, "render.js")
    if a.preview:
        subprocess.run(["node", render, data, "-", "--frames", a.preview, "--outdir", os.path.join(HERE, "preview")], check=True)
        return
    audio = os.path.join(HERE, "_sonido.wav")
    subprocess.run([sys.executable, os.path.join(HERE, "sonido.py"), audio, str(DURACION)], check=True)
    out = os.path.join(HERE, "sol_monterrey.mp4")
    subprocess.run(["node", render, data, out, "--fps", str(a.fps), "--audio", audio, "--workers", str(a.procesos)], check=True)


if __name__ == "__main__":
    main()
