import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import ProductArt from "../components/ProductArt";
import QtyStepper from "../components/QtyStepper";
import { useCart } from "../context/CartContext";
import { useConfig } from "../context/ConfigContext";
import { useToast } from "../context/ToastContext";
import { formatMoney } from "../utils/format";

export default function Cart() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const { currency } = useConfig();
  const toast = useToast();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);

  const run = async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader />;

  if (cart.items.length === 0)
    return (
      <div className="container section">
        <div className="empty">
          <h3>Your cart is empty</h3>
          <p>Add a few pieces and they'll show up here.</p>
          <Link to="/shop" className="btn btn-primary">Start shopping</Link>
        </div>
      </div>
    );

  return (
    <div className="container section">
      <h1 className="h1">Your cart</h1>
      <div className="two-col">
        <div className="stack">
          {cart.items.map((item) => (
            <div key={item.id} className="card line">
              <Link to={`/product/${item.product.id}`} className="line-thumb">
                <ProductArt art={item.product.art} color={item.product.color} />
              </Link>
              <div className="line-main">
                <Link to={`/product/${item.product.id}`}><h3>{item.product.name}</h3></Link>
                <p className="muted">Size {item.size} · {formatMoney(item.product.price_minor, currency)} each</p>
                <div className="line-actions">
                  <QtyStepper
                    value={item.quantity}
                    disabled={busyId === item.id}
                    max={Math.min(10, item.product.stock)}
                    onChange={(q) => run(item.id, () => updateItem(item.id, q))}
                  />
                  <button className="link-btn" disabled={busyId === item.id} onClick={() => run(item.id, () => removeItem(item.id))}>
                    Remove
                  </button>
                </div>
              </div>
              <strong className="price">{formatMoney(item.line_total_minor, currency)}</strong>
            </div>
          ))}
        </div>

        <aside className="card summary">
          <h3>Order summary</h3>
          <div className="summary-row"><span>Items ({cart.count})</span><span>{formatMoney(cart.total_minor, currency)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>Free</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatMoney(cart.total_minor, currency)}</span></div>
          <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate("/checkout")}>Go to checkout</button>
          <Link to="/shop" className="link center">Keep shopping</Link>
        </aside>
      </div>
    </div>
  );
}
