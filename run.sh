#!/usr/bin/env bash
# Builds the frontend and starts the backend, which serves everything on
# one port. See README.md for the two-terminal hot-reload dev workflow.
set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.example to .env and set ODDS_API_KEY first." >&2
  exit 1
fi

if [ ! -d .venv ]; then
  echo "Creating Python virtualenv..."
  python3 -m venv .venv
fi
.venv/bin/pip install -q -r requirements.txt

echo "Building frontend..."
(cd frontend && npm install --silent && npm run build)

echo "Starting server at http://localhost:8000"
.venv/bin/uvicorn backend.main:app --port 8000
