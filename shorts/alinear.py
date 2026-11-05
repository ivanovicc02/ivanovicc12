"""Sincroniza el texto del guion con el audio (tiempos palabra a palabra).

Formato del guion (guion.txt):
  - Texto normal tal cual se dice en el audio.
  - [1], [2], [3]...  marcan dónde empieza cada escena (ver escenas.json).
  - *palabra*         resalta esa palabra en el subtítulo (recuadro azul).

Método:
  1. Si faster-whisper y su modelo están disponibles, se usan sus tiempos
     reales y se emparejan con las palabras del guion.
  2. Si no, se detectan los silencios del audio con ffmpeg y se reparten las
     palabras sobre el tiempo con voz, proporcionalmente a sus sílabas.
"""
import difflib
import json
import re
import subprocess
import sys
import unicodedata

# [n] = escena; [etiquetas de ElevenLabs] y <break .../> se ignoran
TOKEN = re.compile(r"\[(\d+)\]|\[[^\]]*\]|<[^>]*>|(\S+)")


def parse_script(text):
    words, markers = [], {}
    for m in TOKEN.finditer(text):
        if m.group(1):
            markers[int(m.group(1))] = len(words)
            continue
        raw = m.group(2)
        if raw is None:
            continue
        hl = "*" in raw
        w = raw.replace("*", "")
        letters = re.sub(r"[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]", "", w)
        if len(letters) > 1 and letters.isupper():
            # MAYÚSCULAS = énfasis para ElevenLabs -> resaltado en minúsculas
            hl = True
            w = w.lower()
            if not words or re.search(r"[.?!…:]$", words[-1]["w"]):
                w = w[:1].upper() + w[1:]
        if w and not re.fullmatch(r"[.…,;:!?¡¿]+", w):
            words.append({"w": w, "hl": hl})
    return words, markers


def audio_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def speech_segments(path, noise_db=-34, min_sil=0.16):
    dur = audio_duration(path)
    err = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path, "-af", f"silencedetect=noise={noise_db}dB:d={min_sil}", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    sil = list(zip(starts, ends + [dur] * (len(starts) - len(ends))))
    segs, cur = [], 0.0
    for s, e in sil:
        if s > cur + 0.03:
            segs.append((cur, s))
        cur = max(cur, e)
    if cur < dur - 0.03:
        segs.append((cur, dur))
    return segs or [(0.0, dur)], dur


def syllables(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    w = re.sub(r"[^a-zñ0-9]", "", w)
    if w.isdigit():
        return 2 * len(w)
    n = len(re.findall(r"[aeiouy]+", w))
    return max(1, n)


def align_by_silence(words, audio):
    segs, dur = speech_segments(audio)
    speech_total = sum(e - s for s, e in segs)
    weights = [syllables(w["w"]) + 0.35 for w in words]
    total_w = sum(weights)

    def speech_to_real(x):
        acc = 0.0
        for s, e in segs:
            L = e - s
            if x <= acc + L:
                return s + (x - acc)
            acc += L
        return segs[-1][1]

    acc = 0.0
    for w, wt in zip(words, weights):
        a = acc / total_w * speech_total
        acc += wt
        b = acc / total_w * speech_total
        w["start"] = round(speech_to_real(a + 1e-4), 3)
        w["end"] = round(speech_to_real(b - 1e-4), 3)
    return dur, "silencios"


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    return re.sub(r"[^a-z0-9ñ]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))


def align_whisper(words, audio):
    from faster_whisper import WhisperModel  # noqa: puede no estar instalado

    model = WhisperModel("small", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(audio, language="es", word_timestamps=True)
    rec = [(w.word.strip(), w.start, w.end) for s in segments for w in s.words]
    a = [norm(w["w"]) for w in words]
    b = [norm(r[0]) for r in rec]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            words[blk.a + k]["start"], words[blk.a + k]["end"] = rec[blk.b + k][1], rec[blk.b + k][2]
    # rellenar huecos interpolando
    known = [i for i, w in enumerate(words) if "start" in w]
    if not known:
        raise RuntimeError("whisper no reconoció nada del guion")
    for i, w in enumerate(words):
        if "start" in w:
            continue
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        t0 = words[prev]["end"] if prev is not None else 0.0
        t1 = words[nxt]["start"] if nxt is not None else audio_duration(audio)
        n0 = prev if prev is not None else -1
        n1 = nxt if nxt is not None else len(words)
        span = (t1 - t0) / (n1 - n0 - 1)
        w["start"] = t0 + span * (i - n0 - 1)
        w["end"] = w["start"] + span
    return audio_duration(audio), "whisper"


def align(script_text, audio, method="auto"):
    words, markers = parse_script(script_text)
    if not words:
        raise SystemExit("El guion está vacío")
    used = None
    if method in ("auto", "whisper"):
        try:
            dur, used = align_whisper(words, audio)
        except Exception as e:  # sin modelo o sin red
            if method == "whisper":
                raise
            print(f"[alinear] whisper no disponible ({type(e).__name__}); uso detección de silencios")
    if not used:
        dur, used = align_by_silence(words, audio)
    marks = {k: (0.0 if i == 0 else words[i]["start"] if i < len(words) else dur) for k, i in markers.items()}
    return {"duration": dur, "words": words, "markers": marks, "method": used}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("uso: python alinear.py audio.mp3 guion.txt")
    res = align(open(sys.argv[2], encoding="utf-8").read(), sys.argv[1])
    print(json.dumps(res, ensure_ascii=False, indent=1))
