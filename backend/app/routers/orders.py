import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..deps import get_current_user
from ..models import CartItem, Order, OrderItem, OrderStatus, User
from ..payments import apply_payment_intent, create_payment_intent, require_stripe, retrieve_payment_intent
from ..schemas import CheckoutOut, OrderOut

router = APIRouter(prefix="/orders", tags=["Orders"])


def _own_order(db: Session, user: User, order_id: int) -> Order:
    order = db.get(Order, order_id)
    if not order or order.user_id != user.id:
        raise HTTPException(404, "Order not found.")
    return order


def _retire_unpaid_orders(db: Session, user: User) -> None:
    """Before a new checkout, settle or cancel earlier unpaid attempts."""
    stale = db.scalars(
        select(Order).where(
            Order.user_id == user.id,
            Order.status.in_([OrderStatus.PENDING.value, OrderStatus.FAILED.value]),
        )
    ).all()
    for order in stale:
        if order.payment_intent_id:
            try:
                pi = stripe.PaymentIntent.retrieve(order.payment_intent_id)
                apply_payment_intent(db, order, pi)  # it may actually have been paid
                if order.status != OrderStatus.PAID.value and pi["status"] != "canceled":
                    stripe.PaymentIntent.cancel(order.payment_intent_id)
            except stripe.StripeError:
                pass
        if order.status != OrderStatus.PAID.value:
            order.status = OrderStatus.CANCELLED.value
    db.commit()


@router.post("/checkout", response_model=CheckoutOut, status_code=status.HTTP_201_CREATED)
def checkout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_stripe()

    _retire_unpaid_orders(db, user)

    cart = db.scalars(select(CartItem).where(CartItem.user_id == user.id)).all()
    if not cart:
        raise HTTPException(400, "Your cart is empty.")
    for line in cart:
        if line.quantity > line.product.stock:
            raise HTTPException(409, f"Only {line.product.stock} left of {line.product.name}. Update your cart to continue.")

    order = Order(
        user_id=user.id,
        status=OrderStatus.PENDING.value,
        currency=settings.currency.lower(),
        total_minor=sum(l.product.price_minor * l.quantity for l in cart),
        items=[
            OrderItem(
                product_id=l.product_id,
                product_name=l.product.name,
                art=l.product.art,
                color=l.product.color,
                size=l.size,
                unit_price_minor=l.product.price_minor,
                quantity=l.quantity,
            )
            for l in cart
        ],
    )
    db.add(order)
    db.flush()  # gives us order.id for the Stripe metadata

    try:
        intent = create_payment_intent(order)
    except HTTPException:
        db.rollback()
        raise
    order.payment_intent_id = intent.id
    db.commit()
    return CheckoutOut(order=OrderOut.model_validate(order), client_secret=intent.client_secret)


@router.get("", response_model=list[OrderOut])
def list_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Order)
        .where(Order.user_id == user.id, Order.status != OrderStatus.CANCELLED.value)
        .order_by(Order.created_at.desc(), Order.id.desc())
    ).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _own_order(db, user, order_id)


@router.post("/{order_id}/confirm", response_model=OrderOut)
def confirm_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Asks Stripe what happened and updates the order. Safe to call repeatedly."""
    require_stripe()
    order = _own_order(db, user, order_id)
    if order.payment_intent_id and order.status != OrderStatus.PAID.value:
        intent = retrieve_payment_intent(order.payment_intent_id)
        apply_payment_intent(db, order, intent)
    return order
