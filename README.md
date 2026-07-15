# click-casal

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm

### Setup Steps

1. **Copy environment files:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   Edit `backend/.env` if needed (defaults work for local dev).

2. **Start PostgreSQL:**
   ```bash
   docker compose up -d
   ```

3. **Setup backend:**
   ```bash
   cd backend
   npm install
   npx prisma migrate deploy
   node prisma/seed.js
   ```

4. **Start backend dev server:**
   ```bash
   npm run dev
   ```
   Backend runs on `http://localhost:3000`

5. **Setup & start frontend (in another terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

### Verify Setup

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5433 (user: `clickcasal`, password: `localdev`)

### Database

Migrations are auto-deployed on backend start. To manually run migrations or seed:
```bash
cd backend
npx prisma migrate deploy
node prisma/seed.js
```

test
