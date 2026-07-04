# Deployment Guide

Two pieces deploy separately: the **FastAPI backend → Render**, the **Next.js frontend → Vercel**. They find each other through two environment variables.

## 1. Push to GitHub

Create an empty repo at https://github.com/new (e.g. `image-compression-lab`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/image-compression-lab.git
git push -u origin main
```

## 2. Backend → Render

1. https://dashboard.render.com → **New** → **Blueprint**
2. Connect the GitHub repo. Render reads `render.yaml` automatically (Python web service, uvicorn, Python 3.13).
3. Deploy. Copy the service URL, e.g. `https://image-compression-xxxx.onrender.com`.
4. Verify it's alive: open `https://<that-url>/health` — should return `{"status":"healthy",...}`.

## 3. Frontend → Vercel

1. https://vercel.com/new → import the same GitHub repo.
2. **Root Directory: `frontend`** (important — the repo root is not the app).
3. Add an environment variable:
   - `NEXT_PUBLIC_API_URL` = the Render URL from step 2 (no trailing slash)
4. Deploy. Copy your Vercel URL, e.g. `https://image-compression-lab.vercel.app`.

## 4. Wire CORS (connect the two)

Back in Render → your service → **Environment**:
- Add `FRONTEND_URL` = your Vercel URL from step 3 (no trailing slash)
- Save (Render redeploys). This lets the backend accept requests from your frontend.

## Done — test the live site

Open your Vercel URL and run a compression. On your **phone**, the camera capture and in-browser AI captioning both work (both need HTTPS, which Vercel provides automatically).

## Honest caveats (Render free tier)

- **Cold starts:** the backend sleeps after ~15 min idle; the first request then takes ~50s to wake. Fine for a demo.
- **Ephemeral disk:** uploaded files and the SQLite Library reset on redeploy/restart. History works within a session but isn't permanent on the free tier. (Upgrade to a paid disk, or move the store to a hosted Postgres, to make it durable.)
- **AI captioning** downloads its ~200MB model to the visitor's browser on first use — served fine by Vercel, cached by the browser afterward.
