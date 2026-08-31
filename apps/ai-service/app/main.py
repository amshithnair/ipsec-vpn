"""
IPSEC-VPN AI Service — FastAPI Application
Main entry point for the Python analysis engine.
"""

import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    # Startup: load rules engine
    from app.scoring.rules_engine import RulesEngine
    rules_path = os.getenv("RULES_PATH", "rules/security-rules.yaml")
    app.state.rules_engine = RulesEngine(rules_path)
    print(f"[AI-Service] Rules engine loaded from {rules_path}")
    print(f"[AI-Service] Version: {app.state.rules_engine.version}")
    yield
    # Shutdown
    print("[AI-Service] Shutting down")


app = FastAPI(
    title="IPSEC-VPN AI Analysis Service",
    description="IPsec VPN protocol analysis, classification, and security assessment engine",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — only the Go backend should call this in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "1.0.0",
        "timestamp": time.time(),
    }
