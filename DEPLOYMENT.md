# Deploy PitLane IQ

## Backend on Railway

1. Create a Railway project from the GitHub repo.
2. Use the repository root as the service root.
3. Railway will use `railway.json` and run:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

4. Add these Railway variables:

```bash
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
OPENROUTER_API_KEY=your_openrouter_key_optional
GRANITE_MODEL=ibm-granite/granite-4.1-8b
DATABASE_PATH=/app/data/pitlane.db
FASTF1_CACHE=/app/data/cache
FRONTEND_URL=https://your-vercel-app.vercel.app
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

5. In Railway service settings, generate a public domain.
6. Test the backend health endpoint:

```bash
https://your-railway-domain.railway.app/api/health
```

For persistent SQLite/cache data across redeploys, attach a Railway volume and mount it to `/app/data`.

## Frontend on Vercel

1. Import the same GitHub repo in Vercel.
2. Set Root Directory to `dashboard`.
3. Use the Vite preset. The expected build settings are:

```bash
npm install
npm run build
dist
```

4. Add this Vercel variable:

```bash
VITE_API_BASE=https://your-railway-domain.railway.app
```

`VITE_API_BASE` can include `/api`, but it does not need to. The app normalizes it.

5. After Vercel deploys, copy the final Vercel URL back into Railway as `FRONTEND_URL` and `ALLOWED_ORIGINS`, then redeploy the Railway service.
