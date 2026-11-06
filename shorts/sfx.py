"""Efectos de sonido sintetizados (sin samples con derechos) y mezcla final.

mezclar(voz, duración, eventos, tramos_submarinos, inicios_de_escena, salida)
  - voz: archivo de audio de la locución
  - eventos: [{"name": "pop"|"ding"|"buzz"|"whoosh"|"splash"|"glass"|"hit"|"boom"|"bubbles"|"riser"|"tick", "t": s, "vol": 0..1}]
  - tramos submarinos: [(t0, t1)] donde suena ambiente bajo el agua
  - se añade un "whoosh" en cada cambio de escena y una cama musical suave con ducking bajo la voz
"""
import subprocess

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
_rng = np.random.default_rng(7)


def _t(d):
    return np.arange(int(d * SR)) / SR


def _lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def _hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def _bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def _norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def _noise(d):
    return _rng.standard_normal(int(d * SR))


def whoosh(d=0.55):
    t = _t(d)
    n = _noise(d)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    # barrido: mezcla de bandas que sube de grave a agudo
    lo, hi = _bp(n, 300, 900), _bp(n, 1500, 5000)
    u = t / d
    return _norm((lo * (1 - u) + hi * u) * env, 0.6)


def pop():
    t = _t(0.12)
    f = 520 + 600 * (t / 0.12)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38)
    return _norm(s + 0.2 * _hp(_noise(0.12), 3000) * np.exp(-t * 90), 0.55)


def ding():
    t = _t(0.9)
    s = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(880, 1), (1320, 0.6), (1760, 0.25)])
    s2 = np.zeros_like(s)
    k = int(0.09 * SR)
    t2 = t[: len(t) - k]
    s2[k:] = sum(a * np.sin(2 * np.pi * f * t2) for f, a in [(1175, 1), (1760, 0.5)]) * np.exp(-t2 * 5)
    return _norm(s * np.exp(-t * 6) + s2, 0.5)


def buzz():
    t = _t(0.42)
    s = np.sign(np.sin(2 * np.pi * 130 * t)) * 0.5 + np.sin(2 * np.pi * 65 * t)
    s = _lp(s, 1200) * np.minimum(1, (0.42 - t) * 12) * np.minimum(1, t * 200)
    gate = (np.sin(2 * np.pi * 9 * t) > -0.3).astype(float)
    return _norm(s * gate, 0.5)


def splash():
    d = 1.8
    t = _t(d)
    body = _lp(_noise(d), 2500) * np.exp(-t * 2.6) * np.minimum(1, t * 60)
    thump = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 8)
    drops = np.zeros_like(t)
    for _ in range(40):
        st = _rng.uniform(0.1, 1.4)
        i = int(st * SR)
        tt = t[: len(t) - i]
        drops[i:] += np.sin(2 * np.pi * _rng.uniform(700, 1800) * tt) * np.exp(-tt * 60) * _rng.uniform(0.1, 0.4)
    return _norm(body + 0.9 * thump + drops * np.exp(-t * 1.5), 0.9)


def glass():
    d = 1.4
    t = _t(d)
    crack = _hp(_noise(d), 2500) * np.exp(-t * 14)
    tink = np.zeros_like(t)
    for _ in range(70):
        st = _rng.uniform(0, 1.0) ** 1.6
        i = int(st * SR)
        tt = t[: len(t) - i]
        tink[i:] += np.sin(2 * np.pi * _rng.uniform(2500, 7500) * tt) * np.exp(-tt * _rng.uniform(25, 60)) * _rng.uniform(0.1, 0.5)
    return _norm(crack + tink, 0.75)


def hit():
    t = _t(0.35)
    s = np.sin(2 * np.pi * (90 * np.exp(-t * 8) + 50) * t) * np.exp(-t * 14) + 0.5 * _lp(_noise(0.35), 3000) * np.exp(-t * 40)
    return _norm(s, 0.85)


def boom():
    d = 2.2
    t = _t(d)
    f = 30 + 50 * np.exp(-t * 3)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) + 0.6 * _lp(_noise(d), 400) * np.exp(-t * 2.5)
    return _norm(s * np.minimum(1, t * 150), 0.95)


def bubbles(d=1.6):
    t = _t(d)
    s = np.zeros_like(t)
    for _ in range(22):
        st = _rng.uniform(0, d - 0.15)
        i = int(st * SR)
        L = int(0.07 * SR)
        tt = np.arange(L) / SR
        f0 = _rng.uniform(300, 900)
        seg = np.sin(2 * np.pi * np.cumsum(f0 * (1 + tt * 12)) / SR) * np.exp(-tt * 45)
        s[i:i + L] += seg[: len(s) - i] * _rng.uniform(0.3, 1)
    return _norm(s, 0.45)


def riser(d=1.6):
    t = _t(d)
    f = 200 * (1 + 3 * (t / d) ** 2)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + _bp(_noise(d), 1000, 6000) * 0.6
    return _norm(s * (t / d) ** 2, 0.5)


def tick():
    t = _t(0.05)
    return _norm(np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 160), 0.4)


def squelch():
    """succión de barro / arena mojada"""
    d = 0.7
    t = _t(d)
    body = _lp(_noise(d), 600) * np.exp(-t * 5) * np.minimum(1, t * 40)
    f = 180 - 120 * (t / d)
    pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-((t - 0.45) ** 2) / 0.004)
    return _norm(body + 0.8 * pop + bubbles(d) * 0.3, 0.8)


def waves(d=6.0):
    t = _t(d)
    n = _lp(_noise(d), 900, 2)
    env = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 3.2 - 1.5)) ** 2
    return _norm(n * env, 0.6)


def heartbeat(d=1.6):
    t = _t(d)
    s = np.zeros_like(t)
    for st, a in [(0.0, 1), (0.22, 0.7), (0.8, 1), (1.02, 0.7)]:
        i = int(st * SR)
        tt = t[: len(t) - i]
        s[i:] += a * np.sin(2 * np.pi * 52 * tt) * np.exp(-tt * 22)
    return _norm(_lp(s, 200), 0.9)


def projector(d=2.5):
    t = _t(d)
    clicks = (np.sin(2 * np.pi * 24 * t) > 0.92).astype(float)
    s = _hp(_noise(d), 1500) * clicks * 0.8 + _lp(_noise(d), 300) * 0.25
    return _norm(s, 0.5)


def drip():
    t = _t(0.25)
    f = 900 + 1400 * (t / 0.25)
    return _norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30), 0.5)


def swoosh():
    return whoosh(0.32)


def rumble(d=2.0):
    t = _t(d)
    s = _lp(_noise(d), 120, 4) * np.sin(np.pi * np.clip(t / d, 0, 1))
    return _norm(s + 0.4 * np.sin(2 * np.pi * 38 * t) * np.sin(np.pi * t / d), 0.9)


def hiss(d=3.0):
    t = _t(d)
    return _norm(_hp(_noise(d), 3500) * np.minimum(1, t * 4) * np.minimum(1, (d - t) * 4) * (0.8 + 0.2 * np.sin(2 * np.pi * 3 * t)), 0.5)


def creak(d=0.9):
    t = _t(d)
    f = 220 + 90 * np.sin(2 * np.pi * 1.3 * t)
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * t))
    return _norm(_bp(s, 300, 2500) * np.sin(np.pi * t / d), 0.5)


def bee(d=1.6):
    t = _t(d)
    f = 230 + 25 * np.sin(2 * np.pi * 3.1 * t) + 10 * np.sin(2 * np.pi * 7.3 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sign(np.sin(ph)) * 0.5 + np.sin(2 * ph) * 0.3
    s = _bp(s, 180, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t) ** 2)
    return _norm(s * np.minimum(1, t * 8) * np.minimum(1, (d - t) * 8), 0.45)


def ching():
    t = _t(0.9)
    s = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, a, k in [(2093, 1, 6), (2637, 0.7, 7), (3136, 0.5, 9), (4186, 0.3, 12)])
    click = _hp(_noise(0.9), 3000) * np.exp(-t * 80) * 0.6
    return _norm(s + click, 0.55)


def wind(d=4.0):
    t = _t(d)
    n = _bp(_noise(d), 250, 1200)
    env = 0.4 + 0.6 * np.sin(np.pi * t / d) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * t))
    return _norm(n * env, 0.5)


def moo(d=1.4):
    t = _t(d)
    f = 110 + 25 * np.sin(np.pi * t / d) - 15 * (t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(k * ph) / k for k in range(1, 9))
    s = _bp(s, 150, 900) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.7
    return _norm(s, 0.6)


def step():
    t = _t(0.18)
    return _norm(_lp(_noise(0.18), 900) * np.exp(-t * 35) + 0.5 * np.sin(2 * np.pi * 80 * t) * np.exp(-t * 30), 0.6)


SOUNDS = {"whoosh": whoosh, "pop": pop, "ding": ding, "buzz": buzz, "splash": splash, "glass": glass,
          "hit": hit, "boom": boom, "bubbles": bubbles, "riser": riser, "tick": tick,
          "squelch": squelch, "waves": waves, "heartbeat": heartbeat, "projector": projector, "drip": drip,
          "swoosh": swoosh, "rumble": rumble, "step": step, "hiss": hiss, "creak": creak,
          "bee": bee, "ching": ching, "wind": wind, "moo": moo}
GAIN = {"whoosh": 0.35, "pop": 0.32, "ding": 0.4, "buzz": 0.35, "splash": 0.6, "glass": 0.5, "hit": 0.55,
        "boom": 0.6, "bubbles": 0.35, "riser": 0.35, "tick": 0.3, "squelch": 0.6, "waves": 0.35,
        "heartbeat": 0.7, "projector": 0.3, "drip": 0.35, "swoosh": 0.3, "rumble": 0.6, "step": 0.4, "hiss": 0.25, "creak": 0.4, "bee": 0.35, "ching": 0.45, "wind": 0.4, "moo": 0.5}


def music_bed(d, mood="tension"):
    """Pad atmosférico en La menor con pulso suave (estilo documental)."""
    t = _t(d)
    chords = [[110, 164.8, 220, 261.6], [87.3, 130.8, 174.6, 220], [98, 146.8, 196, 246.9], [82.4, 123.5, 164.8, 207.7]]
    out = np.zeros_like(t)
    seg = 4.0
    for k, ch in enumerate(chords * int(d / (seg * 4) + 2)):
        a = int(k * seg * SR)
        if a >= len(t):
            break
        b = min(len(t), int((k + 1) * seg * SR) + int(0.8 * SR))
        tt = t[a:b] - t[a]
        env = np.minimum(1, tt / 0.8) * np.minimum(1, (tt[-1] - tt + 1e-3) / 0.8)
        for f in ch:
            out[a:b] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 1.003 * tt + 1)) * env
    out = _lp(out, 900)
    pulse = np.zeros_like(t)
    beat = 60 / 76
    for i in range(int(d / beat)):
        a = int(i * beat * SR)
        L = min(int(0.3 * SR), len(t) - a)
        tt = np.arange(L) / SR
        pulse[a:a + L] += np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 18) * (1 if i % 2 == 0 else 0.6)
    return _norm(out, 1) * 0.6 + pulse * 0.5


def underwater(d):
    n = _lp(_noise(d), 280, 4) * 4
    return _norm(n + bubbles(d) * 0.4, 0.5)


def load_audio(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).astype(np.float64)


AMBIENT = {"bee", "wind", "hiss", "waves", "heartbeat", "rumble", "projector", "bubbles", "riser"}


def nivelar_voz(path):
    """Sube las partes susurradas: normalizador dinámico (por ventanas) + limitador suave."""
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-af",
                          "dynaudnorm=f=250:g=15:p=0.9:m=12:s=8:b=1,alimiter=limit=0.9",
                          "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).astype(np.float64)


def mezclar(voz, dur, eventos, submarino, inicios, salida, musica=True, vol_musica=0.08):
    n = int((dur + 0.5) * SR)
    v = nivelar_voz(voz)
    voice = np.zeros(n)
    voice[: min(n, len(v))] = v[:n]
    fx = np.zeros(n)
    amb = np.zeros(n)
    cache = {}

    def put(name, t, vol):
        if name not in cache:
            cache[name] = SOUNDS[name]()
        s = cache[name] * GAIN.get(name, 0.4) * vol
        i = int(max(0, t) * SR)
        if i >= n:
            return
        L = min(len(s), n - i)
        (amb if name in AMBIENT else fx)[i:i + L] += s[:L]

    for t in inicios[1:]:
        put("whoosh", t - 0.25, 1)
    for e in eventos:
        put(e["name"], e["t"], e.get("vol", 1))
        if e["name"] in ("pop", "ding", "buzz"):
            put("swoosh", e["t"] - 0.12, 0.6)
    # ambiente submarino
    if submarino:
        a = underwater(min(dur, 30)) * 0.25
        mask = np.zeros(n)
        for a0, b0 in submarino:
            mask[int(a0 * SR):int(b0 * SR)] = 1
        k = int(0.25 * SR)
        mask = np.convolve(mask, np.ones(k) / k, mode="same")
        amb += np.tile(a, n // len(a) + 1)[:n] * mask
    # actividad de la voz (0..1) para bajar efectos mientras habla
    win = int(0.25 * SR)
    env = np.convolve(np.abs(voice), np.ones(win) / win, mode="same")
    act = np.clip(env / (np.percentile(env[env > 1e-4], 60) + 1e-9), 0, 1) if np.any(env > 1e-4) else env * 0
    act = np.convolve(act, np.ones(win) / win, mode="same")
    mix = voice + fx * (1 - 0.35 * act) + amb * (1 - 0.7 * act)
    if musica:
        bed = music_bed(dur + 0.5)[:n]
        mix += bed * vol_musica * (1 - 0.6 * act)
    mix = mix / max(1.0, np.max(np.abs(mix)) / 0.97)
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "pcm_s16le", salida], input=pcm.tobytes(), check=True)
    return salida
