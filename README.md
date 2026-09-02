# ARTLOOP

ARTLOOP is a web dashboard for managing illustration queues, posting schedules, improvement notes, SUZURI summaries, and the private automation workflow.

## Production architecture

- Frontend: static `index.html` + `assets/characters.svg`
- Backend: Vercel Functions under `api/`
- Authentication: signed HttpOnly session cookie
- Automation: private GitHub Actions workflow in `geoharori/SUZURI-Sticker-Automation`
- Store data: SUZURI API

GitHub Pages can serve the frontend, but it cannot execute the `api/` backend. Use the Vercel deployment for the connected production app.

## Required Vercel environment variables

Set these as encrypted/sensitive production variables in Vercel:

- `ARTLOOP_ADMIN_PASSWORD`
- `ARTLOOP_SESSION_SECRET` — use a long random value (32+ bytes recommended)
- `ARTLOOP_GITHUB_TOKEN` — token with only the minimum permission needed to dispatch the private automation workflow
- `SUZURI_API_KEY`

Optional display/status variables:

- `OPENAI_API_KEY`
- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`
- `ARTLOOP_AUTOMATION_REPO` (defaults to `geoharori/SUZURI-Sticker-Automation`)
- `ARTLOOP_WORKFLOW_FILE` (defaults to `sticker-test.yml`)

Do not commit secret values to this public repository.

## Tests

GitHub Actions runs `tests/backend-security.test.mjs` on pushes and pull requests. It covers authentication, session cookies, origin protection, workflow triggering behavior, SUZURI response filtering, malformed login payloads, and logout behavior.
