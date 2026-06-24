# DownloadMedia Counter API

A tiny standalone Express.js counter API that stores the global download count in `count.json`.

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/downloads` | Returns `{ count: N }` |
| `POST` | `/api/downloads/hit` | Increments and returns `{ count: N+1 }` |

## Running Locally

```bash
cd website/counterApi
npm install
npm start
# Runs on http://localhost:3001
```

## Deploying to Render (Free)

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) and create a **New Web Service**.
3. Set the **Root Directory** to `website/counterApi`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `npm start`.
6. Deploy — Render gives you a public URL like `https://downloadmedia-counter.onrender.com`.
7. Update the `COUNTER_API_URL` constant in `website/script.js` with your live URL.

## Persisting `count.json` on Render

> ⚠️ Render's free tier spins down and resets the filesystem on each deploy.
> To persist data between deploys, set `count.json` to store in a mounted disk (available on Render paid plans)
> OR replace the JSON file with a free Render-compatible database like **Railway Postgres** or **MongoDB Atlas** (free tier).

For maximum simplicity and zero cost, the JSON file approach works fine for low-traffic use.
