# Field Journal Labs

Runnable companions to the [Field Journal](https://llody9977.github.io/journal/) — each lab demonstrates one specific flaw from the notes, with real crypto (Python's `cryptography` library, which wraps OpenSSL — output is byte-identical to the equivalent `openssl enc` command).

First lab: **ECB codebook attack** (`/ecb/`) — build a reference codebook from a known key, then read a "secret" ciphertext back off it using nothing but block-for-block matching. No key is used or needed in the deduction step itself.

## Structure

- `app.py` — Flask app factory, registers one blueprint per lab, `/` lists all labs
- `labs_ecb/` — the ECB lab: `core.py` (crypto logic, no Flask dependency, independently testable) + `routes.py` (Flask blueprint)
- `templates/`, `static/` — shared layout/CSS/JS plus per-lab templates under `templates/<lab>/`

### Adding a new lab

1. `mkdir labs_<name>`, write `core.py` (pure logic) and `routes.py` (a `Blueprint`).
2. Add templates under `templates/<name>/`.
3. Register the blueprint in `app.py` and add an entry to the `LABS` list there.

## Run locally

```bash
cd labs
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open http://localhost:8080/.

## Run in Docker

```bash
cd labs
docker build -t field-journal-labs .
docker run -p 8080:8080 field-journal-labs
```

## Deploy to Google Cloud Run

From the `labs/` directory (this is the build context — the Dockerfile expects to be built from here, not the repo root):

```bash
gcloud run deploy field-journal-labs \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

`--source .` has Cloud Build build the `Dockerfile` in this directory and push straight to Cloud Run — no separate registry push step needed. Re-run the same command to deploy updates.

Notes for Cloud Run specifically:
- The app already binds to `$PORT` (Cloud Run injects this; defaults to 8080 locally).
- Set a stable `FLASK_SECRET_KEY` environment variable in production (`--set-env-vars FLASK_SECRET_KEY=<random value>`) — otherwise every container instance/restart gets its own random key, which invalidates any in-flight flash-message cookies across instances. Nothing else in this app relies on server-side session state.
- No database, no persistent storage — every request is stateless, which is what makes this safe to scale to zero and back on Cloud Run.

## Security notes

This is an educational tool, not a secrets manager:
- Every request is stateless — nothing uploaded or generated is written to disk or kept after the response is sent.
- Use a throwaway random key (the "Generate random key" button) — never a real production key.
- Only printable ASCII is accepted for secret text, by design (see the ECB lab's own caveat for why).
