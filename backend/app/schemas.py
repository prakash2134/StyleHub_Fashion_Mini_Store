import re
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_serializer, field_validator


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8, max_length=64)

    @field_validator("email")
    @classmethod
    def lower_email(cls, v: str) -> str:
        return v.lower()

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("password")
    @classmethod
    def strong_enough(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must include at least one letter and one number")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=64)

    @field_validator("email")
    @classmethod
    def lower_email(cls, v: str) -> str:
        return v.lower()


class UserOut(ORM):
    id: int
    email: EmailStr
    full_name: str
    is_admin: bool = False


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Products ----------
class ProductOut(ORM):
    id: int
    name: str
    description: str
    category: str
    price_minor: int
    color: str
    art: str
    stock: int
    sizes: list[str]
    badge: str | None = None


class CategoryOut(BaseModel):
    name: str
    count: int


# ---------- Cart ----------
class CartAdd(BaseModel):
    product_id: int
    size: str = Field(min_length=1, max_length=20)
    quantity: int = Field(default=1, ge=1, le=10)


class CartUpdate(BaseModel):
    quantity: int = Field(ge=1, le=10)


class CartItemOut(BaseModel):
    id: int
    product: ProductOut
    size: str
    quantity: int
    line_total_minor: int


class CartOut(BaseModel):
    items: list[CartItemOut]
    count: int
    total_minor: int


# ---------- Orders ----------
def _as_utc(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


class OrderItemOut(ORM):
    id: int
    product_id: int | None
    product_name: str
    art: str
    color: str
    size: str
    unit_price_minor: int
    quantity: int


class OrderOut(ORM):
    id: int
    status: str
    total_minor: int
    currency: str
    created_at: datetime
    items: list[OrderItemOut]

    @field_serializer("created_at")
    def _ser_created(self, v: datetime) -> str:
        return _as_utc(v)


class CheckoutOut(BaseModel):
    order: OrderOut
    client_secret: str


# ---------- Admin ----------
class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=5, max_length=2000)
    category: str = Field(min_length=2, max_length=40)
    price_minor: int = Field(gt=0, le=100_000_000)
    color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    art: Literal["tee", "hoodie", "jeans", "dress", "jacket", "sneaker", "bag", "cap"]
    stock: int = Field(ge=0, le=100_000)
    sizes: list[str] = Field(min_length=1, max_length=12)
    badge: str | None = Field(default=None, max_length=20)

    @field_validator("name", "description", "category")
    @classmethod
    def strip_text(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Value is too short")
        return v

    @field_validator("sizes")
    @classmethod
    def clean_sizes(cls, v: list[str]) -> list[str]:
        cleaned = []
        for s in v:
            s = s.strip()
            if not s or len(s) > 20:
                raise ValueError("Each size must be 1-20 characters")
            if s not in cleaned:
                cleaned.append(s)
        return cleaned

    @field_validator("badge")
    @classmethod
    def clean_badge(cls, v: str | None) -> str | None:
        v = (v or "").strip()
        return v or None


class AdminOrderOut(OrderOut):
    customer_name: str
    customer_email: str


class AdminUserOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_admin: bool
    created_at: datetime
    paid_orders: int
    total_spent_minor: int

    @field_serializer("created_at")
    def _ser_created(self, v: datetime) -> str:
        return _as_utc(v)


class DailySales(BaseModel):
    date: str
    revenue_minor: int


class AdminStats(BaseModel):
    currency: str
    revenue_minor: int
    paid_orders: int
    total_orders: int
    customers: int
    products: int
    low_stock: int
    daily: list[DailySales]
    recent_orders: list[AdminOrderOut]
