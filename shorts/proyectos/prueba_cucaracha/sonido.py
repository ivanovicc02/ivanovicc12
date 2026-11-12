"""Sonido de la prueba de 4 s (chancla y cucaracha), sintetizado con sfx.py."""
import os
import sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
import sfx  # noqa: E402

D = 4.0
n = int(D * sfx.SR)
out = np.zeros(n)


def put(s, t, vol):
    i = int(t * sfx.SR); L = min(len(s), n - i); out[i:i + L] += s[:L] * vol


amb = sfx._lp(sfx._noise(D), 400) * 0.02
out += amb
put(sfx.whoosh(0.6), 0.3, 0.5)
put(sfx.hit(), 0.86, 0.9); put(sfx.boom(), 0.86, 0.35); put(sfx.squelch(), 0.9, 0.5)
put(sfx.whoosh(0.5), 1.6, 0.35)
put(sfx.pop(), 2.62, 0.6); put(sfx.creak(0.5), 2.5, 0.4)
for k in range(10):
    put(sfx.tick(), 3.0 + k * 0.09, 0.25)
for k in range(5):
    put(sfx.tick(), 0.05 + k * 0.1, 0.18)
out = out / max(1e-9, np.max(np.abs(out))) * 0.9
import wave
with wave.open(os.path.join(HERE, "_sonido.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sfx.SR); w.writeframes((out * 32767).astype("<i2").tobytes())
