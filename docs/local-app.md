# Local DraftOS application

## What this release is

A functioning React/TypeScript interface backed by the existing Python analysis
core through FastAPI. One local server serves the built UI and read-only API.
It is not yet a packaged Windows desktop app or an internet-hosted service.
The UI and core are intended to be shared by those later delivery formats.

The application uses local JSON files. It does not send picks to Riot, external
AI services, or analytics providers. Only clicking a reference link opens an
external website. Fonts and visual elements are local; no remote asset requests
are required. Choices are not persisted across a page reload.

## Initial installation (PowerShell, repository root)

Requires Python 3.11+ and a recent Node.js release supported by Vite. This build
was verified with Node 24.19.0. Package installation needs network access.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm.cmd --prefix web ci
npm.cmd --prefix web run build
```

The virtual environment avoids global Python package changes. No activation
script or PowerShell execution-policy change is needed. npm dependencies are
pinned in `web/package-lock.json`; do not commit `.venv`, `node_modules` or `dist`.

## Normal use

Double-click `start-draftos.cmd`, or run from the repository root:

```powershell
.\start-draftos.cmd
```

Once startup completes, open <http://127.0.0.1:8000>. Keep the server window open;
Ctrl+C stops it. The launcher does not install packages or change system settings.
An alternative start command is:

```powershell
.\.venv\Scripts\python.exe -m src.draftos.web
```

Select Anivia in Mid and/or Malphite in Top, then choose Analyze composition.
Starter picks selects these two without claiming a full draft. Empty roles are
allowed. Jungle, Bot and Support currently have no catalog entries and are
disabled with a clear explanation. This is missing knowledge, not role exclusion.

Changing or clearing picks invalidates displayed results and cancels in-flight
requests. A failed request preserves your picks and allows another attempt.
Reload the catalog with Retry if the server was unavailable when the page opened.
No fake win chances, matchup scores or invented strategic identities are shown.

## Developer mode

Start the Python server above in one terminal. In another:

```powershell
npm.cmd --prefix web run dev
```

Open the address printed by Vite. Its `/api` proxy forwards to the local Python
server. The normal built application needs only port 8000 and no Vite process.
Rebuild the frontend after UI changes before using the normal launcher again.

## Verification

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
npm.cmd --prefix web test
npm.cmd --prefix web run build
```

Backend tests include CLI/API equivalence, request validation, unavailable data,
host restrictions and static file isolation. Frontend tests cover selection,
missing identities, errors/retry and stale-response cancellation. Browser QA also
checks the actual production build at desktop and narrow viewport sizes.

The installed Starlette test client currently emits a non-failing deprecation
warning for its httpx adapter. This affects the test tooling, not application
requests; the HTTP tests pass. Review the adapter when updating dependencies.

## Boundaries and troubleshooting

- Bind only to `127.0.0.1`. No authentication, public deployment, updater or
  desktop installer is implemented. Do not expose this development server online.
- If port 8000 is occupied, stop the existing DraftOS process or resolve the port
  conflict; the launcher does not terminate other applications.
- A missing frontend message means `npm.cmd --prefix web run build` is needed.
- If Python imports fail, use the explicit `.venv` interpreter above and install
  `requirements.txt`; the system interpreter may not have web dependencies.
- No draft history, bans, opponent selection or live game connection yet.
- Anivia's colors remain provisional, with an unknown assessment patch.

## API

- `GET /api/champions`: available local profiles and an incomplete-catalog flag.
- `POST /api/analyze`: `{"picks":["Anivia:mid"]}`, one to five fixed-role picks.
- Invalid selections return HTTP 422; unavailable/invalid local data returns 503.
- Successful analysis follows [report schema v1](analysis-report.md).

Implementation references: [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/)
and [Vite getting started](https://vite.dev/guide/). Domain decisions remain in
Python, not in the UI or transport adapters.
