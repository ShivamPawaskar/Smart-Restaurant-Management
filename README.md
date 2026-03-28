# Restaurant Ordering & Management System..

Full-stack restaurant platform with local SQLite, Node.js + Express REST API, JWT auth (single active session), RBAC, Socket.IO real-time updates, and React + Tailwind dashboards.

## Key Features
- Public Zomato-style menu landing page (no login required to browse)
- Ordering enabled only for logged-in `customer` users
- Customer selects table number after login
- Customer can call waiter; manager receives real-time notification
- Kitchen and manager role-based live order updates

## Tech Stack
- Backend: Node.js, Express, SQLite, JWT, Socket.IO
- Frontend: React, Vite, Tailwind CSS
- Testing: Jest (unit tests)

## Folder Structure
```text
.
├── backend
│   ├── sql
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   └── setup.js
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── routes
│   │   ├── services
│   │   ├── utils
│   │   ├── app.js
│   │   └── server.js
│   ├── tests
│   ├── .env.example
│   └── package.json
└── frontend
    ├── src
    │   ├── api
    │   ├── components
    │   ├── context
    │   ├── hooks
    │   ├── pages
    │   ├── styles
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    └── package.json
```

## Local Setup (SQLite)

### 1) Configure backend env
Set SQLite DB file path in backend env.

```bash
cd backend
cp .env.example .env
```

Set:
- `SQLITE_PATH=./data/restaurant.sqlite`

### 2) Setup backend
```bash
cd backend
npm install
npm run db:setup
npm run dev
```

### 3) Setup frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:5000/api`

## Auth + Roles
- Roles: `customer`, `kitchen`, `manager`
- JWT contains role + session id
- Single active login enforced using `users.session_id`
- Role-protected API routes

## API Routes
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/me/table-number`
- `GET /api/menu`
- `POST /api/orders`
- `GET /api/orders/me`
- `GET /api/orders/kitchen`
- `PATCH /api/orders/:orderId/kitchen-status`
- `GET /api/orders/manager`
- `PATCH /api/orders/:orderId/serve`
- `PATCH /api/orders/:orderId/payment`
- `GET /api/orders/payments`
- `POST /api/orders/waiter-call`
- `GET /api/orders/waiter-calls`
- `PATCH /api/orders/waiter-calls/:callId/resolve`
- `GET /api/analytics/overview`
- `POST /api/feedback`
- `GET /api/feedback`

## Testing
```bash
cd backend
npm test
```

Covered critical units:
- Auth password hashing + JWT claims
- Role authorization middleware
- Order item total and status transition rules

## Deploy (Vercel + Backend Host)

### Frontend on Vercel
1. Push code to GitHub.
2. In Vercel, import the repo.
3. Set **Root Directory** to `frontend`.
4. Build settings:
  - Build Command: `npm run build`
  - Output Directory: `dist`
5. Add env var in Vercel:
  - `VITE_API_URL=https://<your-backend-domain>/api`
6. Deploy.

`frontend/vercel.json` is included so React routes work on refresh.

### Backend hosting (recommended: Render/Railway/VM)
Your backend uses Socket.IO + SQLite file storage. This is not a good fit for Vercel serverless functions.

Host backend separately on:
- Render
- Railway
- VPS/EC2

Then set:
- backend `CLIENT_URL` to your Vercel frontend URL
- frontend `VITE_API_URL` to backend `/api` URL

### Render Backend (recommended)
This repo includes `render.yaml` for backend deployment.

1. Push code to GitHub.
2. In Render, create **Blueprint** from repo (it will read `render.yaml`).
3. In Render service env vars, set:
  - `JWT_SECRET` = strong random secret
  - `CLIENT_URL` = your Vercel frontend URL (for CORS + Socket.IO)
4. Deploy.

What this config does:
- Deploys `backend` as Node web service
- Mounts persistent disk at `/var/data`
- Uses `SQLITE_PATH=/var/data/restaurant.sqlite`
- Runs `npm run db:setup && npm start`

Your frontend Vercel env should be:
- `VITE_API_URL=https://<your-render-service>.onrender.com/api`

## Deploy on Railway (GitHub repo)

This repo is a monorepo, so create **2 Railway services** from the same GitHub repository:
- `backend` service (Node + SQLite + Socket.IO)
- `frontend` service (Vite build served as static SPA)

### 1) Push latest code to GitHub
Railway will deploy from your GitHub repo branch.

### 2) Create Railway project + backend service
1. In Railway, click **New Project** -> **Deploy from GitHub repo**.
2. Select this repository.
3. For the backend service settings, set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm run db:setup && npm start`

4. Add backend environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=<strong-random-secret>`
   - `JWT_EXPIRES_IN=8h`
   - `SQLITE_PATH=/data/restaurant.sqlite`
   - `CLIENT_URL=<your-frontend-public-url>` (set after frontend deploy)
   - `CLIENT_URLS=<your-frontend-public-url>` (comma-separated if multiple domains)

5. Add a Railway **Volume** and mount it at:
   - `/data`

6. Deploy backend and copy its public URL (for example `https://api-service.up.railway.app`).

### 3) Create Railway frontend service (same repo)
1. Add another service in the same Railway project from the same GitHub repository.
2. Set frontend service settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`

3. Add frontend environment variable:
   - `VITE_API_URL=https://<your-backend-public-domain>/api`

4. Deploy frontend and copy its public URL.

### 4) Final env wiring
After frontend is live, update backend env:
- `CLIENT_URL=https://<your-frontend-public-domain>`
- `CLIENT_URLS=https://<your-frontend-public-domain>`

Redeploy backend so CORS + Socket.IO origin settings match the frontend domain.

### 5) Smoke checks
- Backend health: `https://<backend-domain>/api/health`
- Frontend loads without blank page
- Login/signup works
- Real-time kitchen/manager updates work (Socket.IO)
