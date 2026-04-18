# inventory-service

Inventory API with in-memory demo items and stock reservation.

## Run locally

1. Install dependencies:
   - `npm install`
2. Copy env file:
   - `copy .env.example .env` (Windows)
3. Start service:
   - `npm start`

The service runs on port `3001` by default.
All routes are prefixed with `/api/inventory`.

## Docker

- Build image:
  - `docker build -t demo/inventory-service:latest .`
- Run container:
  - `docker run --rm -p 3001:3001 --env-file .env demo/inventory-service:latest`

## Environment variables

- `PORT` - HTTP port (default: `3001`)