import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Order
from ..payments import apply_payment_intent

router = APIRouter(prefix="/payments", tags=["Payments"])

HANDLED = {"payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled"}


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Optional but recommended: keeps orders correct even if the browser closes mid-payment."""
    if not settings.stripe_webhook_secret:
        raise HTTPException(503, "Webhook secret is not configured.")

    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, signature, settings.stripe_webhook_secret)
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(400, "Invalid webhook signature.")

    if event["type"] in HANDLED:
        intent = event["data"]["object"]
        order_id = (intent.get("metadata") or {}).get("order_id")
        order = db.get(Order, int(order_id)) if order_id and str(order_id).isdigit() else None
        if order and order.payment_intent_id == intent["id"]:
            apply_payment_intent(db, order, intent)
    return {"received": True}
