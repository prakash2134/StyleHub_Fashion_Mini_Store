from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import CartItem, Product, User
from ..schemas import CartAdd, CartItemOut, CartOut, CartUpdate, ProductOut

router = APIRouter(prefix="/cart", tags=["Cart"])

MAX_PER_LINE = 10


def build_cart(db: Session, user: User) -> CartOut:
    rows = db.scalars(
        select(CartItem).where(CartItem.user_id == user.id).order_by(CartItem.id.asc())
    ).all()
    items = [
        CartItemOut(
            id=r.id,
            product=ProductOut.model_validate(r.product),
            size=r.size,
            quantity=r.quantity,
            line_total_minor=r.product.price_minor * r.quantity,
        )
        for r in rows
    ]
    return CartOut(
        items=items,
        count=sum(i.quantity for i in items),
        total_minor=sum(i.line_total_minor for i in items),
    )


def _own_item(db: Session, user: User, item_id: int) -> CartItem:
    item = db.get(CartItem, item_id)
    if not item or item.user_id != user.id:  # never reveal other users' rows
        raise HTTPException(404, "Cart item not found.")
    return item


def _check_stock(product: Product, quantity: int) -> None:
    if product.stock <= 0:
        raise HTTPException(409, f"{product.name} is out of stock.")
    if quantity > product.stock:
        raise HTTPException(409, f"Only {product.stock} left of {product.name}.")


@router.get("", response_model=CartOut)
def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_cart(db, user)


@router.post("/items", response_model=CartOut, status_code=status.HTTP_201_CREATED)
def add_item(payload: CartAdd, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(404, "Product not found.")
    if payload.size not in product.sizes:
        raise HTTPException(422, "Please choose a valid size.")

    line = db.scalar(
        select(CartItem).where(
            CartItem.user_id == user.id,
            CartItem.product_id == product.id,
            CartItem.size == payload.size,
        )
    )
    new_qty = (line.quantity if line else 0) + payload.quantity
    if new_qty > MAX_PER_LINE:
        raise HTTPException(409, f"You can add up to {MAX_PER_LINE} of the same item.")
    _check_stock(product, new_qty)

    if line:
        line.quantity = new_qty
    else:
        db.add(CartItem(user_id=user.id, product_id=product.id, size=payload.size, quantity=new_qty))
    db.commit()
    return build_cart(db, user)


@router.patch("/items/{item_id}", response_model=CartOut)
def update_item(
    item_id: int,
    payload: CartUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _own_item(db, user, item_id)
    _check_stock(item.product, payload.quantity)
    item.quantity = payload.quantity
    db.commit()
    return build_cart(db, user)


@router.delete("/items/{item_id}", response_model=CartOut)
def remove_item(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = _own_item(db, user, item_id)
    db.delete(item)
    db.commit()
    return build_cart(db, user)


@router.delete("", response_model=CartOut)
def clear_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(CartItem).where(CartItem.user_id == user.id))
    db.commit()
    return build_cart(db, user)
