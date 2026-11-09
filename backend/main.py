from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from config import settings
from database import engine, Base
from seed_data import init_and_seed_db
from routers import public, subscriptions, reports, auth, admin, hospitals, feeds

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and seed database on startup
    print(f"[{settings.PROJECT_NAME}] Initializing database...")
    init_and_seed_db()
    yield
    print(f"[{settings.PROJECT_NAME}] Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Production Early Warning & Decision-Support System for Dengue and Malaria Outbreaks.",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request processing time header
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time-Sec"] = f"{process_time:.4f}"
    return response

# Register Routers
app.include_router(public.router)
app.include_router(subscriptions.router)
app.include_router(reports.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(hospitals.router)
app.include_router(feeds.router)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "HEALTHY",
        "docs": "/docs",
        "timestamp": time.time()
    }

@app.get("/healthz")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
