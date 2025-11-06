# Billsnack API (backend)

This folder contains a minimal Node/Express API that connects to a MySQL database.

Quick setup (Windows PowerShell):

1. Start MySQL with Docker Compose (will create database and table from `models/init.sql`):

```powershell
cd server; docker-compose up -d --build
```

2. Install dependencies and run server:

```powershell
cd server; npm install; npm run dev
```

Note: the server enables CORS for the frontend dev server at http://localhost:5173 by default. To change the allowed origin, set `CORS_ORIGIN` in `server/.env` before starting the server.

3. Verify:

GET http://localhost:4000/ -> API root

Health check: GET http://localhost:4000/health

Products endpoints (JSON):

- GET /api/products
- GET /api/products/:id
- POST /api/products { name, description, price, stock }
- PUT /api/products/:id { name, description, price, stock }
- DELETE /api/products/:id

Environment variables: copy `.env.example` to `.env` and adjust if needed.
