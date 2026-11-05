#!/usr/bin/env bash
# Descarga el modelo Whisper small (ONNX, int8) para sincronizar subtítulos con precisión.
set -e
cd "$(dirname "$0")"
mkdir -p modelos && cd modelos
[ -d sherpa-onnx-whisper-small ] && { echo "ya está"; exit 0; }
curl -L -o w.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2
tar xjf w.tar.bz2 && rm w.tar.bz2
rm -rf sherpa-onnx-whisper-small/test_wavs sherpa-onnx-whisper-small/small-encoder.onnx sherpa-onnx-whisper-small/small-decoder.onnx
pip install sherpa-onnx numpy
