from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import settings
from .models import Product, User
from .security import hash_password

CLOTHING = ["XS", "S", "M", "L", "XL"]
WAIST = ["28", "30", "32", "34", "36"]
SHOES = ["6", "7", "8", "9", "10", "11"]
ONE = ["One Size"]

# price_minor is in minor units (paise for INR, cents for USD).
PRODUCTS = [
    ("Everyday Boxy Tee", "Heavyweight 220 GSM cotton with a relaxed, boxy cut. Pre-washed so it feels soft from day one.", "Tops", 79900, "#6C4DFF", "tee", 40, CLOTHING, "Bestseller"),
    ("Pocket Tee in Sage", "A garment-dyed tee with a chest pocket and a slightly longer hem. Easy with everything.", "Tops", 89900, "#7FB08A", "tee", 32, CLOTHING, None),
    ("Cloud Fleece Hoodie", "Brushed fleece lining, double-layer hood and a kangaroo pocket. Built for cold evenings.", "Tops", 249900, "#FF7A6B", "hoodie", 25, CLOTHING, "New"),
    ("Studio Zip Hoodie", "A mid-weight zip hoodie with ribbed cuffs and hidden side pockets.", "Tops", 279900, "#2B2A4C", "hoodie", 18, CLOTHING, None),
    ("Straight Fit Denim", "Mid-rise, straight leg, rigid indigo denim that softens with every wear.", "Bottoms", 229900, "#3E5C9A", "jeans", 30, WAIST, "Bestseller"),
    ("Washed Black Jeans", "Slim-tapered jeans in stretch denim with a faded black wash.", "Bottoms", 209900, "#34324A", "jeans", 22, WAIST, None),
    ("Linen Slip Dress", "A bias-cut midi dress in breathable linen with adjustable straps.", "Dresses", 329900, "#E8A0BF", "dress", 15, CLOTHING, "New"),
    ("Sunday Wrap Dress", "Soft viscose wrap dress with a flowy skirt and a tie waist.", "Dresses", 299900, "#D9A441", "dress", 20, CLOTHING, None),
    ("Bomber Jacket", "Lightweight water-resistant shell with a quilted lining and ribbed trims.", "Outerwear", 399900, "#4F8A7B", "jacket", 14, CLOTHING, None),
    ("Quilted Puffer Jacket", "Warm recycled fill in a packable shape. Two zip pockets, one inside.", "Outerwear", 459900, "#6C4DFF", "jacket", 10, CLOTHING, "Low stock"),
    ("Court Sneakers", "Clean leather-look uppers with a cushioned insole and a grippy rubber sole.", "Footwear", 349900, "#F2EEE6", "sneaker", 28, SHOES, "Bestseller"),
    ("Runner Mesh Sneakers", "Breathable mesh with a lightweight foam midsole for all-day wear.", "Footwear", 319900, "#FF7A6B", "sneaker", 26, SHOES, None),
    ("Canvas Tote", "Thick organic canvas with an inside zip pocket. Carries a laptop and lunch.", "Accessories", 69900, "#D6C06B", "bag", 50, ONE, None),
    ("Weekender Crossbody", "A compact crossbody with an adjustable strap and two zip compartments.", "Accessories", 149900, "#2B2A4C", "bag", 24, ONE, "New"),
    ("Washed Cotton Cap", "Six-panel cap in washed cotton twill with a metal buckle strap.", "Accessories", 49900, "#3E5C9A", "cap", 60, ONE, None),
    ("Colour Block Cap", "Structured cap with a contrast brim and an embroidered logo.", "Accessories", 54900, "#D6F36B", "cap", 45, ONE, None),
]


def seed_products(db: Session) -> None:
    if db.scalar(select(func.count()).select_from(Product)):
        return
    for name, desc, cat, price, color, art, stock, sizes, badge in PRODUCTS:
        db.add(
            Product(
                name=name,
                description=desc,
                category=cat,
                price_minor=price,
                color=color,
                art=art,
                stock=stock,
                sizes=sizes,
                badge=badge,
            )
        )
    db.commit()


def ensure_admin(db: Session) -> None:
    """Creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD, or promotes an existing user."""
    if not (settings.admin_email and settings.admin_password):
        return
    email = settings.admin_email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        db.add(
            User(
                email=email,
                full_name=settings.admin_name,
                hashed_password=hash_password(settings.admin_password),
                is_admin=True,
            )
        )
    elif not user.is_admin:
        user.is_admin = True
    db.commit()
