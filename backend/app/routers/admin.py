from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..deps import get_current_admin
from ..models import Order, OrderStatus, Product, User
from ..schemas import (
    AdminOrderOut,
    AdminStats,
    AdminUserOut,
    DailySales,
    OrderOut,
    ProductIn,
    ProductOut,
)

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)])

LOW_STOCK_AT = 5


def _admin_order(order: Order) -> AdminOrderOut:
    return AdminOrderOut(
        **OrderOut.model_validate(order).model_dump(),
        customer_name=order.user.full_name,
        customer_email=order.user.email,
    )


def _as_aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


# ---------- Dashboard ----------
@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db)):
    paid = Order.status == OrderStatus.PAID.value
    revenue = db.scalar(select(func.coalesce(func.sum(Order.total_minor), 0)).where(paid)) or 0
    paid_orders = db.scalar(select(func.count(Order.id)).where(paid)) or 0
    total_orders = db.scalar(
        select(func.count(Order.id)).where(Order.status != OrderStatus.CANCELLED.value)
    ) or 0

    today = datetime.now(timezone.utc).date()
    days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    buckets = {d: 0 for d in days}
    since = datetime.combine(days[0], datetime.min.time(), tzinfo=timezone.utc)
    for o in db.scalars(select(Order).where(paid, Order.created_at >= since)).all():
        day = _as_aware(o.created_at).date()
        if day in buckets:
            buckets[day] += o.total_minor

    recent = db.scalars(
        select(Order)
        .where(Order.status != OrderStatus.CANCELLED.value)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(5)
    ).all()

    return AdminStats(
        currency=settings.currency.lower(),
        revenue_minor=revenue,
        paid_orders=paid_orders,
        total_orders=total_orders,
        customers=db.scalar(select(func.count(User.id)).where(User.is_admin.is_(False))) or 0,
        products=db.scalar(select(func.count(Product.id))) or 0,
        low_stock=db.scalar(select(func.count(Product.id)).where(Product.stock <= LOW_STOCK_AT)) or 0,
        daily=[DailySales(date=d.isoformat(), revenue_minor=v) for d, v in buckets.items()],
        recent_orders=[_admin_order(o) for o in recent],
    )


# ---------- Products ----------
@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductIn, db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    return product


@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductIn, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found.")
    for field, value in payload.model_dump().items():
        setattr(product, field, value)
    db.commit()
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found.")
    db.delete(product)  # cart lines are removed, past orders keep their snapshot
    db.commit()


# ---------- Orders ----------
@router.get("/orders", response_model=list[AdminOrderOut])
def all_orders(
    status_filter: Literal["all", "paid", "pending", "failed", "cancelled"] = "all",
    db: Session = Depends(get_db),
):
    stmt = select(Order).order_by(Order.created_at.desc(), Order.id.desc())
    if status_filter != "all":
        stmt = stmt.where(Order.status == status_filter)
    return [_admin_order(o) for o in db.scalars(stmt).all()]


# ---------- Users ----------
@router.get("/users", response_model=list[AdminUserOut])
def all_users(db: Session = Depends(get_db)):
    paid = Order.status == OrderStatus.PAID.value
    totals = {
        user_id: (count, spent)
        for user_id, count, spent in db.execute(
            select(Order.user_id, func.count(Order.id), func.coalesce(func.sum(Order.total_minor), 0))
            .where(paid)
            .group_by(Order.user_id)
        ).all()
    }
    users = db.scalars(select(User).order_by(User.created_at.desc(), User.id.desc())).all()
    return [
        AdminUserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            is_admin=u.is_admin,
            created_at=u.created_at,
            paid_orders=totals.get(u.id, (0, 0))[0],
            total_spent_minor=totals.get(u.id, (0, 0))[1],
        )
        for u in users
    ]
