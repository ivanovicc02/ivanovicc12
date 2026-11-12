# Shorts animados estilo "curiosidades de supervivencia"

Generador de vídeos verticales (1080x1920, 30 fps) con ilustración 2D, cámara con zoom,
partículas y subtítulos palabra a palabra con resaltado, al estilo de @pingucuriosso.

- Análisis del nicho y lista de temas: [`analisis/analisis_pingucuriosso.md`](analisis/analisis_pingucuriosso.md)
- Motor: `shorts/` (Chromium + Playwright dibuja cada fotograma en SVG, ffmpeg lo codifica)

## Requisitos

```bash
apt-get install -y ffmpeg espeak-ng   # espeak-ng solo para la voz de prueba
pip install faster-whisper            # opcional: sincronía exacta (necesita acceso a huggingface.co)
# Node 18+ y Playwright con Chromium
```

## Flujo de trabajo

1. Elige un tema de la lista.
2. Crea `shorts/proyectos/<tema>/` con:
   - `audio.mp3`: tu voz en off (o .wav/.m4a/.ogg).
   - `guion.txt`: el texto **exacto** del audio, con marcas de escena `[1] [2] ...` y
     `*palabras*` clave entre asteriscos para el recuadro azul.
   - `escenas.json`: qué se ve en cada escena (fondo, personajes, cámara, datos).
   - Opcional: `musica.mp3` + `"musica": "musica.mp3"` en `escenas.json`.
3. Vista previa y render:

```bash
cd shorts
python hacer_short.py proyectos/<tema> --preview 1,5,10   # PNG en proyectos/<tema>/preview
python hacer_short.py proyectos/<tema>                    # -> proyectos/<tema>/short.mp4
```

Sin faster-whisper, la sincronía de subtítulos se calcula detectando los silencios del
audio y repartiendo las palabras por sílabas (por eso hace falta el texto del guion).

## escenas.json

```json
{
  "escenas": {
    "1": {
      "bg": "forest",
      "camera": {"from": [540, 1150, 1.0], "to": [540, 1150, 1.25]},
      "items": [{"type": "bearFront", "variant": "grizzly", "x": 540, "y": 1780, "roarAt": 1.2}],
      "badge": {"text": "300", "unit": "kg", "at": 0.5}
    }
  }
}
```

- **Fondos** (`bg`): `forest`, `forestNight`, `meadow`, `plains`, `storm`, `grass` (vista cenital), `sand`, `water`, `dark`.
- **Cámara**: `[x, y, zoom]` del centro de la vista al empezar y al acabar la escena.
- **Extras**: `shake` (temblor), `flash` (destello al entrar), `particles: "none"`, `vignette: false`.
- **Items** (`type`): `bear` (perfil; `anim`: idle/walk/charge/roar; `variant`: grizzly/black/brown/polar),
  `bearFront`, `hikerLying` (cenital), `hikerBack` (`anim: run`, `arms: up`), `trunk`, `fist`,
  `glow` (arco que señala), `check`, `cross`, `label` (texto), `image` (PNG propio), `bush`.
  Comunes: `x`, `y` (posición de los pies), `scale`, `flip`, `enter`/`exit` (segundos dentro de la escena),
  `move: {from, to, start, end, ease}`.
- Para animales nuevos se añade una función en `shorts/engine/assets.js`, o un `.js` dentro de la
  carpeta del proyecto (se carga solo).

El proyecto de ejemplo está en `shorts/proyectos/demo_oso` (con voz robótica de prueba: `--voz-prueba`).

## Modo 3D (three.js)

Para vídeos en 3D low-poly, `escenas.json` lleva `"motor": "3d"` y la carpeta del proyecto
incluye un `escena3d.js` con los planos (`window.SHOTS[n] = (K, lt, dur, t) => {...}`).
El kit (`shorts/engine3d/kit.js`) trae: cielo de atardecer, río con olas, orillas con pinos,
modo submarino automático (niebla, rayos de luz), coche con puerta/ventanilla animables y
agua interior, personas (sentado, nadando, flotando), móvil, rompecristales, martillo,
flechas, burbujas, cristales rotos, grietas y salpicaduras. Las etiquetas en pantalla se ponen
con `K.ov(...)` y `K.wt('palabra')` da el instante exacto en que se dice una palabra.

```bash
cd shorts/engine3d && npm install          # instala three.js
cd .. && ./descargar_modelo.sh             # Whisper para sincronía exacta (opcional)
python hacer_short.py proyectos/coche_agua_comentarios
```

Si el audio es de ElevenLabs puedes usar su texto tal cual como `guion.txt`: las etiquetas
`[serious]`, `[short pause]`... se ignoran y las palabras en MAYÚSCULAS salen resaltadas.

## Proyecto especial: ¿Qué pasaría si el Sol explotara? (Monterrey)

`shorts/proyectos/sol_monterrey/` es un video sin voz, al estilo "qué pasaría si…": vista desde
una azotea hacia la Macroplaza, el Faro del Comercio, el Paseo Santa Lucía y el Cerro de la Silla,
con contadores en pantalla (llegada de la luz, brillo, temperatura, onda expansiva), subtítulos
en español y sonido ambiental sintetizado (`sonido.py`). La escena es `escena.html` + `sol.js`
(three.js) y todo depende solo del tiempo, así que se puede renderizar en paralelo.

```bash
cd shorts/engine3d && npm install
cd ../proyectos/sol_monterrey
python hacer.py --preview 2,30,55,66     # PNG en preview/
python hacer.py --procesos 4            # -> sol_monterrey.mp4 (80 s, 1080x1920)
```

Los textos y tiempos están en `CAPS` y `TL` al principio de `sol.js`.
