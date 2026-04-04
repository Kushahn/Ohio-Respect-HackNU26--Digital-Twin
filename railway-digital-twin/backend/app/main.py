import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import telemetry, health, history, config, auth, simulator_mode

app = FastAPI(
    title="Railway Digital Twin",
    description="Real-time telemetry and health index backend",
    version="1.0.0"
)

# CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(telemetry.router)
app.include_router(history.router)
app.include_router(config.router)
app.include_router(auth.router)
app.include_router(simulator_mode.router)

@app.on_event("startup")
async def startup_event():
    # In a full app, init db connection pools or background tasks here
    pass

@app.on_event("shutdown")
async def shutdown_event():
    pass
