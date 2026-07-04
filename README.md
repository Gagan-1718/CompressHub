# Image Compression Lab — Delta Prediction + Huffman Coding

A full-stack web app that **losslessly compresses images with Huffman coding**, built to demonstrate entropy coding end to end: upload an image, watch it get compressed by a Huffman tree built for *that specific image*, inspect the actual codes, and compare against industry algorithms.

**Stack:** Next.js 14 (frontend) · FastAPI + NumPy (backend) · deployed on Vercel + Render

## Why this is interesting

Plain Huffman coding barely compresses photographs (~0–5%): raw pixel bytes are spread too evenly across 0–255, and Huffman coding can only exploit *frequency skew*. This app applies a **delta prediction filter** first (the same idea as PNG's filter step): each byte is replaced by its difference from the neighboring pixel's same color channel. Real images are locally smooth, so the deltas cluster tightly around 0 — exactly the skewed distribution Huffman coding thrives on.

The filter itself compresses nothing (output is byte-for-byte the same size). **All compression comes from the Huffman coder** — the filter just feeds it better-shaped data. Measured results:

| Image type | Plain Huffman | Delta + Huffman |
|---|---|---|
| Smooth gradient | 5.2% saved | **87.5% saved** |
| Synthetic landscape | 5.5% saved | **41.1% saved** |
| Random noise | ~0% | ~0% (honest worst case — no algorithm compresses noise) |

Compression is fully lossless: every image is round-trip verified (decompressed output is pixel-identical to the input).

## Features

- **Upload → compress → results** flow with side-by-side original/compressed comparison and a fullscreen lightbox
- **Algorithm comparison** on every run: plain Huffman vs. delta+Huffman on the same pixels, showing exactly what the filter buys
- **Entropy analysis**: Shannon entropy before/after filtering vs. bits/byte actually achieved (typical coding efficiency: 88–99% of the theoretical floor)
- **Live Huffman code table**: the most frequent pixel deltas and the actual variable-length codes the tree assigned them
- **One-click sample images** (best case / typical / worst case) to explore algorithm behavior instantly
- Download the decoded PNG, or the raw `.huff` artifact (`?raw=true`)
- Compression of a 12 MP image in ~3 s (vectorized NumPy bit-packing)

## The `.huff` container format

```
[4-byte big-endian metadata length][JSON metadata][Huffman-coded bytes]
```

The JSON metadata carries the serialized Huffman tree, bit padding, original array shape/dtype, and a flag for the delta filter — everything needed to decode the file back to exact pixels.

## Running locally

**Backend** (Python 3.13):
```bash
python -m venv backend/.venv
backend/.venv/Scripts/pip install -r backend/requirements.txt   # Windows
python -m uvicorn backend.main:app --port 8000
```

**Frontend** (Node 20+):
```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev
```

Open http://localhost:3000.

**Tests** (18 round-trip/edge-case tests):
```bash
python -m pytest backend/tests -v
```

## Deployment

- **Backend → Render**: uses `render.yaml` (Python web service, uvicorn). Set the `FRONTEND_URL` env var to your deployed frontend origin for CORS.
- **Frontend → Vercel**: root directory `frontend/`. Set `NEXT_PUBLIC_API_URL` to the Render backend URL.

## Architecture

```
frontend/                  Next.js 14 app router
  app/                     pages: upload, results, analytics, how-it-works
  components/              UploadDropZone, ImageComparison, AlgorithmAnalysis, ...
backend/
  main.py                  FastAPI app + CORS
  routes/compression.py    upload / compress / job / download endpoints
  services/compression/
    huffman.py             Huffman tree, encode/decode, serialization
    __init__.py            HuffmanCompressionService + delta filter
    analysis.py            algorithm comparison, entropy, code table
  services/image_processing.py   PIL/NumPy pixel extraction & reconstruction
  tests/                   pytest suite
```

Known tradeoff: job state lives in memory (a dict), so results don't survive a backend restart — fine for a demo on free-tier hosting, and the natural next step is SQLite/Postgres.
