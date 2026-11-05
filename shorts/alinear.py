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
import math
import os
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
            if words and "pause" in m.group(0).lower() or (words and m.group(0).startswith("<break")):
                words[-1]["brk"] = True
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


def boundary_score(w):
    """Probabilidad de que tras esta palabra haya una pausa en el audio."""
    t = w["w"]
    if w.get("brk") or t.endswith("...") or t.endswith("…"):
        return 0.0
    if re.search(r"[.?!:]$", t):
        return 0.1
    if re.search(r"[,;]$", t):
        return 0.4
    return 1.6


def align_by_segments(words, audio):
    """Empareja cada tramo de voz con un grupo de palabras (DP), respetando la puntuación."""
    segs, dur = speech_segments(audio)
    K, N = len(segs), len(words)
    if K > N:
        return align_by_silence(words, audio)
    wt = [syllables(w["w"]) + 0.35 for w in words]
    cum = [0.0]
    for x in wt:
        cum.append(cum[-1] + x)
    rate = sum(e - s for s, e in segs) / cum[-1]
    INF = float("inf")
    # best[k][j]: coste de asignar los k primeros tramos a las j primeras palabras
    best = [[INF] * (N + 1) for _ in range(K + 1)]
    back = [[0] * (N + 1) for _ in range(K + 1)]
    best[0][0] = 0.0
    for k in range(1, K + 1):
        d = segs[k - 1][1] - segs[k - 1][0]
        jmin, jmax = k, N - (K - k)
        for j in range(jmin, jmax + 1):
            bs = 0.0 if j == N else boundary_score(words[j - 1])
            for i in range(k - 1, j):
                if best[k - 1][i] == INF:
                    continue
                pred = rate * (cum[j] - cum[i])
                c = best[k - 1][i] + (math.log((d + 0.15) / (pred + 0.15))) ** 2 * 4 + bs
                if c < best[k][j]:
                    best[k][j], back[k][j] = c, i
    bounds, j = [N], N
    for k in range(K, 0, -1):
        j = back[k][j]
        bounds.append(j)
    bounds.reverse()
    for k in range(K):
        s0, s1 = segs[k]
        i0, i1 = bounds[k], bounds[k + 1]
        tot = cum[i1] - cum[i0]
        for i in range(i0, i1):
            words[i]["start"] = round(s0 + (s1 - s0) * (cum[i] - cum[i0]) / tot, 3)
            words[i]["end"] = round(s0 + (s1 - s0) * (cum[i + 1] - cum[i0]) / tot, 3)
    return dur, "tramos+puntuación"


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


MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "modelos", "sherpa-onnx-whisper-small")


def align_sherpa(words, audio):
    """Transcribe cada tramo de voz con Whisper (sherpa-onnx) y asigna las palabras
    del guion a su tramo; dentro de cada tramo reparte por sílabas."""
    import numpy as np
    import sherpa_onnx

    m = os.path.join(MODEL_DIR, "small-")
    if not os.path.exists(m + "encoder.int8.onnx"):
        raise FileNotFoundError("modelo no descargado (ejecuta descargar_modelo.sh)")
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=m + "encoder.int8.onnx", decoder=m + "decoder.int8.onnx", tokens=m + "tokens.txt",
        language="es", task="transcribe", num_threads=os.cpu_count() or 2)
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    segs, dur = speech_segments(audio)
    rec_words = []  # (palabra normalizada, nº de tramo)
    for k, (s, e) in enumerate(segs):
        st = rec.create_stream()
        st.accept_waveform(16000, a[int(max(0, s - 0.1) * 16000):int((e + 0.1) * 16000)])
        rec.decode_stream(st)
        for w in st.result.text.split():
            if norm(w):
                rec_words.append((norm(w), k))
    seg_of = [None] * len(words)
    sm = difflib.SequenceMatcher(a=[norm(w["w"]) for w in words], b=[r[0] for r in rec_words], autojunk=False)
    for blk in sm.get_matching_blocks():
        for i in range(blk.size):
            seg_of[blk.a + i] = rec_words[blk.b + i][1]
    # huecos (palabras mal reconocidas): van a tramos sin texto entre sus vecinos,
    # o al tramo siguiente si la palabra anterior cerraba frase; si no, al anterior.
    i = 0
    while i < len(words):
        if seg_of[i] is not None:
            i += 1
            continue
        j = i
        while j < len(words) and seg_of[j] is None:
            j += 1
        p = seg_of[i - 1] if i > 0 else -1
        q = seg_of[j] if j < len(words) else len(segs)
        free = [k for k in range(p + 1, q) if k not in seg_of]
        for n, idx in enumerate(range(i, j)):
            if free:
                seg_of[idx] = free[min(len(free) - 1, n * len(free) // (j - i))]
            elif p >= 0 and (q >= len(segs) or not re.search(r"[.?!:…]$", words[i - 1]["w"])):
                seg_of[idx] = p
            else:
                seg_of[idx] = min(q, len(segs) - 1)
        i = j
    for i in range(1, len(words)):  # monótono
        seg_of[i] = max(seg_of[i], seg_of[i - 1])
    unused = sorted(set(range(len(segs))) - set(seg_of))
    if unused:
        print(f"[alinear] aviso: {len(unused)} tramo(s) de audio sin texto del guion: "
              + ", ".join(f"{segs[k][0]:.1f}s" for k in unused))
    for k in set(seg_of):
        idx = [i for i in range(len(words)) if seg_of[i] == k]
        s0, s1 = segs[k]
        wt = [syllables(words[i]["w"]) + 0.35 for i in idx]
        tot, acc = sum(wt), 0.0
        for i, x in zip(idx, wt):
            words[i]["start"] = round(s0 + (s1 - s0) * acc / tot, 3)
            acc += x
            words[i]["end"] = round(s0 + (s1 - s0) * acc / tot, 3)
    return dur, "whisper (sherpa-onnx)"


def align(script_text, audio, method="auto"):
    words, markers = parse_script(script_text)
    if not words:
        raise SystemExit("El guion está vacío")
    used = None
    if method in ("auto", "whisper"):
        for fn in (align_sherpa, align_whisper):
            try:
                dur, used = fn(words, audio)
                break
            except Exception as e:  # sin modelo o sin red
                print(f"[alinear] {fn.__name__} no disponible ({type(e).__name__}: {e})"[:160])
        if not used and method == "whisper":
            raise SystemExit("No hay modelo de transcripción disponible")
    if not used:
        dur, used = align_by_segments(words, audio)
    for w in words:
        w.pop("brk", None)
    marks = {k: (0.0 if i == 0 else words[i]["start"] if i < len(words) else dur) for k, i in markers.items()}
    return {"duration": dur, "words": words, "markers": marks, "method": used}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("uso: python alinear.py audio.mp3 guion.txt")
    res = align(open(sys.argv[2], encoding="utf-8").read(), sys.argv[1])
    print(json.dumps(res, ensure_ascii=False, indent=1))
