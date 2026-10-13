from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product
from ..schemas import CategoryOut, ProductOut

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=list[ProductOut])
def list_products(
    category: str | None = None,
    q: str | None = Query(default=None, max_length=60),
    sort: Literal["featured", "price_asc", "price_desc", "newest"] = "featured",
    db: Session = Depends(get_db),
):
    stmt = select(Product)
    if category:
        stmt = stmt.where(Product.category == category)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(Product.name.ilike(like) | Product.description.ilike(like))
    order = {
        "featured": Product.id.asc(),
        "price_asc": Product.price_minor.asc(),
        "price_desc": Product.price_minor.desc(),
        "newest": Product.created_at.desc(),
    }[sort]
    return db.scalars(stmt.order_by(order, Product.id.asc())).all()


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Product.category, func.count(Product.id)).group_by(Product.category).order_by(Product.category)
    ).all()
    return [CategoryOut(name=name, count=count) for name, count in rows]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found.")
    return product
