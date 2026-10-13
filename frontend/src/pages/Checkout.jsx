import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "../api";
import Loader from "../components/Loader";
import ProductArt from "../components/ProductArt";
import { useCart } from "../context/CartContext";
import { useConfig } from "../context/ConfigContext";
import { formatMoney } from "../utils/format";

const stripeCache = {};
const getStripe = (key) => (stripeCache[key] ||= loadStripe(key));

const appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#6C4DFF",
    colorText: "#17142B",
    fontFamily: "Manrope, system-ui, sans-serif",
    borderRadius: "12px",
  },
};

function PaymentForm({ order }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { refresh } = useCart();
  const { currency } = useConfig();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({ elements, redirect: "if_required" });

    try {
      // Always ask the server to sync with Stripe, so the order status is right in both cases.
      const updated = await api(`/orders/${order.id}/confirm`, { method: "POST" });
      if (stripeError) {
        setError(stripeError.message || "Your payment didn't go through. Please try another card.");
        setBusy(false);
        return;
      }
      await refresh();
      navigate(`/orders/${order.id}`, { replace: true, state: { justPaid: updated.status === "paid" } });
    } catch (err) {
      setError(stripeError?.message || err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="stack">
      <PaymentElement />
      {error && <div className="alert alert-error">{error}</div>}
      <button className="btn btn-primary btn-lg btn-block" disabled={!stripe || busy}>
        {busy ? "Processing payment…" : `Pay ${formatMoney(order.total_minor, currency)}`}
      </button>
      <p className="note">
        Test mode: use card <b>4242 4242 4242 4242</b>, any future expiry and any CVC. To see a failure, use <b>4000 0000 0000 0002</b>.
      </p>
    </form>
  );
}

export default function Checkout() {
  const { cart, loading } = useCart();
  const config = useConfig();
  const [session, setSession] = useState(null); // { order, client_secret }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <Loader />;

  if (cart.items.length === 0 && !session)
    return (
      <div className="container section">
        <div className="empty">
          <h3>Nothing to check out yet</h3>
          <p>Your cart is empty.</p>
          <Link to="/shop" className="btn btn-primary">Browse products</Link>
        </div>
      </div>
    );

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      setSession(await api("/orders/checkout", { method: "POST" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const items = session ? session.order.items : null;
  const total = session ? session.order.total_minor : cart.total_minor;

  return (
    <div className="container section">
      <h1 className="h1">Checkout</h1>
      <div className="two-col">
        <section className="card pad">
          <h3>Payment</h3>
          {!config.payments_enabled && (
            <div className="alert alert-error">
              Payments aren't set up yet. Add your Stripe test keys to <code>backend/.env</code> and restart the API.
            </div>
          )}
          {!session ? (
            <div className="stack">
              <p className="muted">Review your order, then continue to enter your card details.</p>
              {error && <div className="alert alert-error">{error}</div>}
              <button className="btn btn-primary btn-lg btn-block" onClick={start} disabled={busy || !config.payments_enabled}>
                {busy ? "Preparing secure payment…" : "Continue to payment"}
              </button>
              <Link to="/cart" className="link center">Back to cart</Link>
            </div>
          ) : (
            <Elements key={session.client_secret} stripe={getStripe(config.stripe_publishable_key)} options={{ clientSecret: session.client_secret, appearance }}>
              <PaymentForm order={session.order} />
            </Elements>
          )}
        </section>

        <aside className="card summary">
          <h3>{session ? `Order #${session.order.id}` : "Order summary"}</h3>
          <div className="mini-list">
            {session
              ? items.map((i) => (
                  <div key={i.id} className="mini">
                    <ProductArt art={i.art} color={i.color} />
                    <div>
                      <strong>{i.product_name}</strong>
                      <span className="muted">Size {i.size} · Qty {i.quantity}</span>
                    </div>
                    <span>{formatMoney(i.unit_price_minor * i.quantity, config.currency)}</span>
                  </div>
                ))
              : cart.items.map((i) => (
                  <div key={i.id} className="mini">
                    <ProductArt art={i.product.art} color={i.product.color} />
                    <div>
                      <strong>{i.product.name}</strong>
                      <span className="muted">Size {i.size} · Qty {i.quantity}</span>
                    </div>
                    <span>{formatMoney(i.line_total_minor, config.currency)}</span>
                  </div>
                ))}
          </div>
          <div className="summary-row"><span>Shipping</span><span>Free</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatMoney(total, config.currency)}</span></div>
        </aside>
      </div>
    </div>
  );
}
