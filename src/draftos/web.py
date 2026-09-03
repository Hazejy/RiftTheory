"""Local, read-only HTTP adapter for the shared DraftOS analysis core."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, ConfigDict, Field, StrictStr

from .champion_analysis import analyze_champions
from .champion_data import load_champion_profiles
from .composition import BASELINE_CAPABILITIES, analyze_composition
from .report import build_report
from .selection import select_champions
from .strategy_data import load_strategic_profiles


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    picks: list[StrictStr] = Field(min_length=1, max_length=5)


def create_app(data_directory: Path | None = None, static_directory: Path | None = None) -> FastAPI:
    root = Path(__file__).resolve().parents[2]
    data = data_directory if data_directory is not None else root / "data"
    static = static_directory if static_directory is not None else root / "web" / "dist"
    app = FastAPI(title="DraftOS local API", version="0.1.0", docs_url=None, redoc_url=None)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost", "testserver"])

    def catalog():
        try:
            return load_champion_profiles(data / "champion_profiles.json")
        except (OSError, ValueError, KeyError, TypeError):
            raise HTTPException(503, "Local champion data is unavailable or invalid.") from None

    @app.get("/api/champions")
    def champions():
        return {"profiles": [
            {"champion_name": profile.name, "role": profile.role.value,
             "capabilities": sorted(item.value for item in profile.capabilities)}
            for profile in sorted(catalog(), key=lambda item: (item.name, item.role.value))
        ], "is_complete_catalog": False}

    @app.post("/api/analyze")
    def analyze(request: AnalysisRequest):
        profiles = catalog()
        try:
            selected = select_champions(request.picks, profiles)
        except ValueError as error:
            raise HTTPException(422, str(error)) from error
        try:
            strategies = load_strategic_profiles(data / "strategic_profiles.json")
            assessments = analyze_champions(selected, strategies)
        except (OSError, ValueError, KeyError, TypeError):
            raise HTTPException(503, "Local strategic data is unavailable or invalid.") from None
        return build_report(
            assessments, analyze_composition(selected, set(BASELINE_CAPABILITIES)), is_demo=False,
        )

    if static.is_dir():
        app.mount("/", StaticFiles(directory=static, html=True), name="web")
    else:
        @app.get("/")
        def missing_build():
            raise HTTPException(503, "Build the frontend first: npm.cmd --prefix web run build")
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
