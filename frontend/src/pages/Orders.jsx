import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Loader from "../components/Loader";
import ProductArt from "../components/ProductArt";
import { useConfig } from "../context/ConfigContext";
import { formatDate, formatMoney, STATUS_LABEL } from "../utils/format";

export default function Orders() {
  const { currency } = useConfig();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/orders").then(setOrders).catch((e) => {
      setError(e.message);
      setOrders([]);
    });
  }, []);

  if (orders === null) return <Loader />;

  return (
    <div className="container section">
      <h1 className="h1">Your orders</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {orders.length === 0 && !error ? (
        <div className="empty">
          <h3>No orders yet</h3>
          <p>When you check out, your orders will appear here.</p>
          <Link to="/shop" className="btn btn-primary">Find something you like</Link>
        </div>
      ) : (
        <div className="stack">
          {orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="card order-row">
              <div className="order-thumbs">
                {o.items.slice(0, 3).map((i) => (
                  <ProductArt key={i.id} art={i.art} color={i.color} />
                ))}
              </div>
              <div className="order-meta">
                <strong>Order #{o.id}</strong>
                <span className="muted">{formatDate(o.created_at)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items</span>
              </div>
              <span className={`status status-${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span>
              <strong className="price">{formatMoney(o.total_minor, o.currency || currency)}</strong>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
