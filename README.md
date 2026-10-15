# Spotter-AI — Weather-Aware Truck Routing

Full-stack web app for the Spotter-AI assessment: compare **three HGV routes** using **weather at ETA-matched checkpoints**, **load-aware risk rules**, and a **0–48 hour corridor heatmap**.

## Live demo (local)

| Service   | URL |
|-----------|-----|
| Frontend  | http://localhost:5173 |
| Backend   | http://localhost:8000 |
| Health    | http://localhost:8000/api/health/ |

## Features (assessment mapping)

| Requirement | Implementation |
|-------------|----------------|
| Origin, destination, departure, load weight | Left sidebar **Trip details** |
| 3 route options | OpenRouteService `driving-hgv`; alternatives under 100 km; avoid-feature variants on longer hauls |
| Weather every 10 / 25 / 50 mi | Checkpoint spacing toggles; ETA-based hourly sample from Open-Meteo |
| Risk + load rules | `backend/api/domain/risk_engine.py` |
| Route recommendation | `backend/api/domain/recommender.py` |
| Map + checkpoints + heatmap slider | Dashboard map + bottom **Overview** tab |

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, MUI, Leaflet (road + satellite tiles)
- **Backend:** Django 6, Django REST Framework
- **Routing / geocoding:** [OpenRouteService](https://openrouteservice.org) (API key required)
- **Weather:** [Open-Meteo](https://open-meteo.com) (free, no key)

## Architecture

```text
Browser (React)
    │  POST /api/trips/analyze/
    ▼
Django API
    ├── ORS: geocode + 3× HGV directions (GeoJSON)
    ├── Checkpoints: sample polyline every N miles + ETA
    ├── Open-Meteo: hourly wind / rain / snow at checkpoint locations
    ├── Risk engine: thresholds + load rules
    └── Recommender: no-travel → severe → high → avg risk → duration
```

```text
Spotter-AI/
├── backend/                 Django project
│   ├── config/              Settings, URLs
│   └── api/
│       ├── domain/          Risk levels, scoring, recommendation
│       ├── integrations/    ORS + Open-Meteo clients
│       ├── services/        Trip analysis orchestration
│       └── tests/           Pytest for risk / ranking
├── frontend/                Vite React dashboard
├── .env.example             Copy to .env (repo root)
└── requirements.txt         Python dependencies
```

## Prerequisites

- **Python 3.12+** (3.14 tested)
- **Node.js 20+**
- **OpenRouteService API key** — [sign up](https://openrouteservice.org/dev/#/signup)

## Setup

### 1. Clone and Python environment

```powershell
cd Spotter-AI
py -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

### 2. Environment variables

Create **`.env` in the repo root** (same folder as `backend/` and `frontend/`):

```powershell
Copy-Item .env.example .env
notepad .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `ORS_API_KEY` | **Yes** | OpenRouteService key (routing + geocoding) |
| `DJANGO_SECRET_KEY` | Prod | Random string for production |
| `DJANGO_DEBUG` | No | `true` for local dev |
| `DJANGO_ALLOWED_HOSTS` | Prod | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | No | Default includes Vite `http://localhost:5173` |

Do **not** put `ORS_API_KEY` in `frontend/.env` — the browser never calls ORS directly.

### 3. Backend

```powershell
cd backend
..\.venv\Scripts\python manage.py migrate
..\.venv\Scripts\python manage.py runserver
```

### 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Vite proxies `/api` → `http://127.0.0.1:8000` during development.

### 5. Production build (frontend)

```powershell
cd frontend
npm run build
```

Serve `frontend/dist` via static host. Set `VITE_API_BASE` to your API origin if the API is on another domain (see `frontend/.env.example`).

## API

### `GET /api/health/`

```json
{ "status": "ok" }
```

### `POST /api/trips/analyze/`

**Request**

```json
{
  "origin": "Chicago, IL",
  "destination": "Detroit, MI",
  "departure_at": "2026-10-16T14:00:00+00:00",
  "load_weight_lb": 32000,
  "checkpoint_interval_miles": 25
}
```

| Field | Type | Notes |
|-------|------|--------|
| `origin` / `destination` | string | Geocoded via ORS |
| `departure_at` | ISO 8601 datetime | Used for checkpoint ETAs |
| `load_weight_lb` | number | Load rules (e.g. 45–54 mph + >30k lb → No Travel) |
| `checkpoint_interval_miles` | number | Optional; default `25` (use 10, 25, or 50) |

**Response (summary)**

- `routes[]` — up to 3 items with `geometry`, `checkpoints`, `stats`, `heatmap`
- `recommended_route_id` — best route per assessment tie-break rules
- Each checkpoint: `weather`, `risk`, `eta`, `mile`

**Errors**

- `502` — ORS or weather integration failure (message in `detail`)

## Risk rules (reference)

Weather thresholds use the assessment tables (wind mph, rain in/hr, snow in/hr). Per checkpoint, the **worst** of wind / rain / snow applies, then **load rules**:

- ≥55 mph wind → **No Travel**
- 45–54 mph + load > 30,000 lb → **No Travel**
- 35–44 mph + load > 40,000 lb → at least **Severe**

**Recommendation order:** fewest no-travel miles → severe → high → lowest average risk score → shortest duration.

## Tests

```powershell
cd backend
..\.venv\Scripts\pytest api/tests -q
```

## Troubleshooting

| Issue | What to do |
|-------|------------|
| `ORS_API_KEY is not configured` | Add key to **root** `.env`, restart Django |
| ORS `400` on long trips | Fixed in app: long hauls use route **variants** instead of ORS `alternative_routes` (>100 km) |
| Open-Meteo `503` | Temporary; wait and retry. Use **25 mi** spacing to reduce calls. Backend retries and dedupes fetches |
| Analyze takes 30–60 s | Normal for long routes (many checkpoint weather lookups) |
| CORS errors | Add frontend URL to `CORS_ALLOWED_ORIGINS` |

## Deployment (outline)

**Backend (e.g. Render, Railway, Fly.io)**

1. Set build: `pip install -r requirements.txt`
2. Start: `cd backend && gunicorn config.wsgi:application`
3. Env: `ORS_API_KEY`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` (your frontend URL)

**Frontend (e.g. Vercel, Netlify, Cloudflare Pages)**

1. Build: `cd frontend && npm run build`
2. Publish `dist/`
3. Set `VITE_API_BASE=https://your-api.example.com`

## Loom walkthrough script (~5–10 min)

1. **Intro** — Problem: choose safest truck route given weather, load, and time.
2. **Inputs** — Chicago → Detroit, departure, 32k lb, 25 mi checkpoints.
3. **Find safe routes** — Wait for analysis; mention backend + ORS + Open-Meteo.
4. **Route cards** — Recommended route, risk breakdown bars, compare three options.
5. **Map** — Polylines, checkpoint colors, satellite view, heatmap legend.
6. **Slider** — Move 0–48 h forecast; heatmap updates along corridor.
7. **Checkpoints tab** — ETA, wind, rain, risk per mile.
8. **Code** — Quick peek: `risk_engine.py`, `trip_analyzer.py`, dashboard components.
9. **Run locally** — `.env`, `runserver`, `npm run dev`, pytest.

## License

Submitted as part of the Spotter-AI technical assessment.
