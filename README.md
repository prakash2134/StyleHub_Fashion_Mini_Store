# StyleHub – Fashion Mini Store

A full-stack fashion store: register, log in, browse products, build a cart and pay with Stripe (test mode).

| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy 2 ORM (no raw SQL) |
| Database | SQLite (auto-created and seeded with 16 products on first start) |
| Auth | JWT (PyJWT) and bcrypt password hashing |
| Payments | Stripe PaymentIntents + Stripe Elements (test mode) |
| Frontend | React 18 + Vite, React Router |

## 1. Prerequisites
- Python 3.10 or newer
- Node.js 18 or newer
- A free Stripe account, for test keys: https://dashboard.stripe.com/test/apikeys

## 2. Run the backend
```bash
cd backend
python -m venv .venv

# macOS / Linux
source .venv/bin/activate
# Windows (PowerShell)
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt

cp .env.example .env        # Windows: copy .env.example .env
```
Open `backend/.env` and set:
- `SECRET_KEY`: any long random string. Generate one with
  `python -c "import secrets; print(secrets.token_urlsafe(48))"`
- `STRIPE_SECRET_KEY` (`sk_test_...`) and `STRIPE_PUBLISHABLE_KEY` (`pk_test_...`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_NAME`: the admin account that is created on startup (see section 5)

Start the API:
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive API docs: http://localhost:8000/docs

## 3. Run the frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. Vite proxies `/api` to the backend, so there is nothing to configure.

## 4. Try the whole flow
1. Sign up, then browse the shop.
2. Pick a size, add items to the cart, change quantities.
3. Go to checkout, then **Continue to payment**.
4. Pay with a Stripe test card:

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 0002` | Declined, order shows "Payment failed" and the cart is kept |
| `4000 0025 0000 3155` | Asks for 3-D Secure authentication |

Use any future expiry date, any 3-digit CVC and any postal code.

## 5. Admin panel
Set these in `backend/.env` before starting the API:
```
ADMIN_EMAIL=admin@stylehub.com
ADMIN_PASSWORD=Admin@12345
ADMIN_NAME=Store Admin
```
On startup the API creates this account (or promotes it if the email is already registered). Log in at http://localhost:5173/login with that email and password, and you land on **/admin**. Change the password to your own before sharing the project.

The admin area has:
- **Overview:** revenue, paid orders, customers, products, low-stock count, a 7-day sales chart and recent orders.
- **Products:** add, edit and delete products (name, description, category, price, stock, sizes, badge, illustration and colour with a live preview).
- **Orders:** every customer's orders, filterable by status.
- **Customers:** all users with their paid orders and total spent.

Admin endpoints live under `/api/admin/*` and return 403 for non-admin users.

## 6. Currency
Prices are stored as integers in minor units (paise or cents). The currency is set with `CURRENCY` in `backend/.env` (default `inr`). The seed prices in `app/seed.py` are written in paise, so change them too if you switch to another currency.

## 7. Webhook (optional, recommended)
The browser flow already confirms payments by asking Stripe for the PaymentIntent status. A webhook additionally keeps orders correct if the user closes the tab mid-payment:
```bash
stripe listen --forward-to localhost:8000/api/payments/webhook
```
Copy the `whsec_...` secret it prints into `STRIPE_WEBHOOK_SECRET` in `backend/.env` and restart the API.

## 8. API overview
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account, returns JWT |
| POST | `/api/auth/login` | – | Log in, returns JWT |
| GET | `/api/auth/me` | ✔ | Current user |
| GET | `/api/products` | – | List (`category`, `q`, `sort`) |
| GET | `/api/products/categories` | – | Categories with counts |
| GET | `/api/products/{id}` | – | Single product |
| GET | `/api/cart` | ✔ | Your cart with totals |
| POST | `/api/cart/items` | ✔ | Add item `{product_id, size, quantity}` |
| PATCH | `/api/cart/items/{id}` | ✔ | Update quantity |
| DELETE | `/api/cart/items/{id}` | ✔ | Remove item |
| POST | `/api/orders/checkout` | ✔ | Create order and Stripe PaymentIntent |
| POST | `/api/orders/{id}/confirm` | ✔ | Sync order status with Stripe |
| GET | `/api/orders` | ✔ | Order history |
| GET | `/api/orders/{id}` | ✔ | Order detail |
| POST | `/api/payments/webhook` | Stripe signature | Payment events |
| GET | `/api/admin/stats` | Admin | Dashboard numbers |
| POST / PUT / DELETE | `/api/admin/products[/{id}]` | Admin | Manage products |
| GET | `/api/admin/orders` | Admin | All orders (`status_filter`) |
| GET | `/api/admin/users` | Admin | All users with totals |

## 9. How it is built
- **Order total is computed on the server** from database prices, never from the browser.
- **Stripe secret key stays on the server**, loaded from `.env`. Only the publishable key is sent to the browser.
- **Order lifecycle:** `pending` → `paid` / `failed` / `cancelled`. Stock is reduced and the cart is cleared only when the order becomes `paid`. Status updates are idempotent, so the confirm endpoint and the webhook can both run safely.
- **Order items are snapshots** of name, size and price at purchase time.
- **Users only see their own cart and orders.** Other users' IDs return 404.
- **Validation:** Pydantic schemas on every input, with readable error messages returned to the UI.

## 10. Project structure
```
stylehub/
├── backend/
│   ├── app/
│   │   ├── main.py          app, CORS, error handling, startup seed
│   │   ├── config.py        settings from .env
│   │   ├── database.py      engine + session
│   │   ├── models.py        User, Product, CartItem, Order, OrderItem
│   │   ├── schemas.py       request/response validation
│   │   ├── security.py      bcrypt + JWT
│   │   ├── deps.py          get_current_user (protected routes)
│   │   ├── payments.py      Stripe helpers + status sync
│   │   ├── seed.py          sample catalogue
│   │   └── routers/         auth, products, cart, orders, payments
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── api.js           fetch wrapper + JWT header
        ├── context/         auth, cart, config, toasts
        ├── components/      Navbar, ProductArt (SVG garments), ProductCard...
        └── pages/           Home, Shop, ProductDetail, Cart, Checkout, Orders...
```

## 11. Before going live
- Use a long random `SECRET_KEY` and serve everything over HTTPS.
- The JWT is stored in `localStorage` for simplicity. For stricter XSS protection, move it to an HttpOnly cookie.
- Add rate limiting on login and register, and use Alembic migrations instead of `create_all`.
- Replace SQLite with PostgreSQL if you expect real traffic.
- Swap in live Stripe keys and register a live webhook endpoint.

## Troubleshooting
- **"Payments aren't set up yet"**: the Stripe keys in `backend/.env` are empty. Add them and restart uvicorn.
- **"Can't reach the server"**: the backend isn't running on port 8000.
- **Reset the data**: stop the API and delete `backend/stylehub.db`. It is recreated and re-seeded on the next start.
