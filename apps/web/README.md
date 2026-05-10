TreasuryOS web app (Next.js App Router).

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### API connectivity

All frontend API calls go through same-origin proxy route `app/api/proxy/[...path]/route.ts`.

- **Local** (default): proxies to `http://127.0.0.1:8000`
- **Production**: set `BACKEND_API_URL` to your FastAPI base URL
- **API auth**: if the backend requires `X-API-Key`, set `BACKEND_API_KEY` on the web service so the proxy injects it.

### Build

```bash
npm run build
```

## Learn More

Next.js docs: `https://nextjs.org/docs`
