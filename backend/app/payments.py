"""Stripe helpers shared by the orders router and the webhook."""
import stripe
from fastapi import HTTPException
from sqlalchemy import delete
from sqlalchemy.orm import Session

from .config import settings
from .models import CartItem, Order, OrderStatus, Product

stripe.api_key = settings.stripe_secret_key


def require_stripe() -> None:
    if not settings.stripe_configured:
        raise HTTPException(
            503,
            "Payments aren't set up yet. Add your Stripe test keys to backend/.env and restart the server.",
        )


def create_payment_intent(order: Order) -> stripe.PaymentIntent:
    try:
        return stripe.PaymentIntent.create(
            amount=order.total_minor,
            currency=order.currency,
            description=f"StyleHub order #{order.id}",
            metadata={"order_id": str(order.id), "user_id": str(order.user_id)},
            automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
        )
    except stripe.StripeError as exc:
        raise HTTPException(502, getattr(exc, "user_message", None) or "Couldn't start the payment. Please try again.")


def retrieve_payment_intent(payment_intent_id: str) -> stripe.PaymentIntent:
    try:
        return stripe.PaymentIntent.retrieve(payment_intent_id)
    except stripe.StripeError:
        raise HTTPException(502, "Couldn't check the payment status. Please try again in a moment.")


def apply_payment_intent(db: Session, order: Order, pi) -> Order:
    """Moves an order to the status that matches the Stripe PaymentIntent. Idempotent."""
    if order.status == OrderStatus.PAID.value:
        return order

    status = pi["status"]
    if status == "succeeded":
        order.status = OrderStatus.PAID.value
        for item in order.items:  # reduce stock once, when the order becomes paid
            product = db.get(Product, item.product_id) if item.product_id else None
            if product:
                product.stock = max(0, product.stock - item.quantity)
        db.execute(delete(CartItem).where(CartItem.user_id == order.user_id))
    elif status == "canceled":
        order.status = OrderStatus.CANCELLED.value
    elif status == "requires_payment_method" and pi.get("last_payment_error"):
        order.status = OrderStatus.FAILED.value
    # any other state (processing, requires_action...) keeps the order pending
    db.commit()
    return order
