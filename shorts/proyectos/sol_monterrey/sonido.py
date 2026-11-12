"""Sonido ambiental sintetizado para "¿Qué pasaría si el Sol explotara?" (sin voz, sin samples).

uso: python sonido.py salida.wav 80
Sigue la misma línea de tiempo que sol.js.
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
TL = dict(title=3.6, light=26, bright=36, heat=48, here=64, black=71.4)
rng = np.random.default_rng(13)


def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], "band", fs=SR, output="sos"), x)


def sm(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)


def norm(x):
    return x / (np.max(np.abs(x)) + 1e-9)


def canal(dur, seed):
    global rng
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    noise = lambda: rng.standard_normal(n)

    # ciudad: tráfico lejano, murmullo de gente y aire
    traf = norm(lp(np.cumsum(noise()) * 0.02, 180)) * (0.7 + 0.3 * np.sin(2 * np.pi * t / 9.0))
    murm = norm(bp(noise(), 250, 900)) * (0.6 + 0.4 * lp(np.abs(noise()), 1.5) * 3)
    air = norm(bp(noise(), 1500, 5000))
    city = 2.4 * (0.16 * traf + 0.05 * murm + 0.015 * air) * (1 - sm(36, 42, t))
    out += city

    # pájaros (trinos) hasta que se van
    for _ in range(60):
        t0 = rng.uniform(0.5, 33)
        f0 = rng.uniform(2600, 4800)
        for k in range(rng.integers(2, 6)):
            s = t0 + k * rng.uniform(0.07, 0.16)
            d = rng.uniform(0.04, 0.11)
            i0, m = int(s * SR), int(d * SR)
            if i0 + m >= n:
                continue
            tt = np.arange(m) / SR
            f = f0 * (1 + 0.25 * np.sin(np.pi * tt / d)) + rng.uniform(-300, 300)
            out[i0:i0 + m] += 0.07 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2 * (1 - sm(28, 34, s))

    # claxon lejano
    for s, f in ((11.3, 415), (11.55, 415), (19.8, 370)):
        i0, m = int(s * SR), int(0.22 * SR)
        tt = np.arange(m) / SR
        h = sum(np.sin(2 * np.pi * f * j * tt) / j for j in (1, 2, 3))
        out[i0:i0 + m] += 0.02 * lp(h, 1200) * np.sin(np.pi * tt / 0.22)

    # el Sol se aviva: zumbido agudo que sube y siseo
    glide = 180 + 900 * sm(TL["light"], TL["bright"] + 4, t) ** 1.5
    whine = np.sin(2 * np.pi * np.cumsum(glide) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(glide * 1.5) / SR)
    out += 0.05 * whine * sm(TL["light"], TL["bright"], t) * (1 - sm(TL["bright"] + 3, TL["heat"], t))
    hiss = norm(hp(noise(), 3500))
    out += 0.09 * hiss * sm(TL["light"] + 3, TL["bright"] + 2, t) * (1 - sm(TL["heat"] - 2, TL["heat"] + 3, t))

    # fuego: crujidos + rugido
    crack = np.zeros(n)
    for s in rng.uniform(36.5, TL["here"], 900):
        i0 = int(s * SR); m = int(rng.uniform(0.004, 0.02) * SR)
        crack[i0:i0 + m] += rng.standard_normal(m) * np.exp(-np.arange(m) / (m / 4)) * rng.uniform(0.3, 1)
    out += 0.35 * hp(crack, 900) * sm(36.5, 40, t)
    roar = norm(lp(noise(), 500))
    out += 0.12 * roar * sm(37, 44, t) * (1 - sm(TL["here"], TL["here"] + 1, t))

    # agua hirviendo
    for s in rng.uniform(42, 50, 500):
        i0 = int(s * SR); d = rng.uniform(0.01, 0.03); m = int(d * SR)
        tt = np.arange(m) / SR
        f = rng.uniform(400, 1400) * (1 + tt / d)
        out[i0:i0 + m] += 0.04 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d)

    # la explosión se acerca: estruendo grave creciente
    g = sm(TL["heat"], TL["here"], t) ** 2.2
    rumble = norm(lp(noise(), 70, 4)) + 0.5 * np.sin(2 * np.pi * 38 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))
    out += 0.65 * rumble * g * (1 - sm(TL["black"] - 0.3, TL["black"], t))
    out += 0.1 * norm(bp(noise(), 120, 600)) * g

    # impacto y tormenta de escombros
    i0 = int(TL["here"] * SR); m = int(3.5 * SR)
    tt = np.arange(m) / SR
    boom = lp(rng.standard_normal(m), 160, 4) * np.exp(-tt * 1.3) * 3 + np.sin(2 * np.pi * 48 * tt * np.exp(-tt * 0.4)) * np.exp(-tt * 1.6)
    out[i0:i0 + m] += 0.9 * norm(boom)
    gust = 0.6 + 0.4 * lp(np.abs(noise()), 0.8) * 4
    storm = norm(bp(noise(), 200, 2500)) * gust + 0.6 * norm(hp(noise(), 2500))
    out += 0.42 * storm * sm(TL["here"] - 1, TL["here"] + 0.6, t)
    for s in rng.uniform(TL["here"], TL["black"] - 0.3, 70):
        j = int(s * SR); m2 = int(0.05 * SR)
        out[j:j + m2] += 0.25 * lp(rng.standard_normal(m2), 1500) * np.exp(-np.arange(m2) / (m2 / 5))

    # corte a negro: silencio en la tarjeta final
    out *= 1 - sm(TL["black"] - 0.25, TL["black"], t)
    return out


def main():
    salida, dur = sys.argv[1], float(sys.argv[2])
    l, r = canal(dur, 13), canal(dur, 14)
    st = np.stack([l, r], 1)
    st = np.tanh(st * 1.4) / np.tanh(1.4) * 0.92  # saturación suave
    st = st / max(1e-9, np.max(np.abs(st))) * 0.89
    with wave.open(salida, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())
    print("sonido:", salida)


if __name__ == "__main__":
    main()
