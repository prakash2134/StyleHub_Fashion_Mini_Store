from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import Base, SessionLocal, engine, ensure_schema
from .routers import admin, auth, cart, orders, payments, products
from .seed import ensure_admin, seed_products


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_schema()
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_products(db)
        ensure_admin(db)
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError):
    messages = []
    for err in exc.errors():
        where = [str(p) for p in err["loc"] if p not in ("body", "query", "path")]
        msg = str(err["msg"]).removeprefix("Value error, ")
        messages.append(f"{where[-1]}: {msg}" if where else msg)
    return JSONResponse(
        status_code=422,
        content={"detail": messages[0] if messages else "Invalid request.", "errors": messages},
    )


@app.get("/api/health", tags=["Meta"])
def health():
    return {"status": "ok"}


@app.get("/api/config", tags=["Meta"])
def public_config():
    """Everything the browser needs to know. Only the *publishable* Stripe key is exposed."""
    return {
        "currency": settings.currency.lower(),
        "stripe_publishable_key": settings.stripe_publishable_key,
        "payments_enabled": settings.stripe_configured,
    }


for router in (auth.router, products.router, cart.router, orders.router, payments.router, admin.router):
    app.include_router(router, prefix="/api")
