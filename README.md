# Restaurant Ordering & Management System

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
