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
  PYTHON=""
  for candidate in python3.13 python3.12 python3.11 python3.10 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then
      version="$("$candidate" -c 'import sys; print(sys.version_info[:2] >= (3, 10))')"
      if [ "$version" = "True" ]; then
        PYTHON="$candidate"
        break
      fi
    fi
  done
  if [ -z "$PYTHON" ]; then
    echo "No Python >=3.10 found (requirements.txt's pinned 'requests' needs it). Install one (e.g. 'brew install python@3.12') and re-run." >&2
    exit 1
  fi
  "$PYTHON" -m venv .venv
fi
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

echo "Building frontend..."
(cd frontend && npm install --silent && npm run build)

echo "Starting server at http://localhost:8000"
.venv/bin/uvicorn backend.main:app --port 8000
