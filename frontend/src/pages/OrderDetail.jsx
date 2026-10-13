import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../api";
import Loader from "../components/Loader";
import ProductArt from "../components/ProductArt";
import { formatDate, formatMoney, STATUS_LABEL } from "../utils/format";

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  const recheck = async () => {
    setChecking(true);
    try {
      setOrder(await api(`/orders/${id}/confirm`, { method: "POST" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setChecking(false);
    }
  };

  if (error && !order)
    return (
      <div className="container section">
        <div className="empty">
          <h3>{error}</h3>
          <Link to="/orders" className="btn btn-primary">Back to orders</Link>
        </div>
      </div>
    );
  if (!order) return <Loader />;

  return (
    <div className="container section narrow">
      {location.state?.justPaid && order.status === "paid" && (
        <div className="alert alert-success">
          <strong>Payment received.</strong> Thanks for your order. A summary is below.
        </div>
      )}
      {order.status === "failed" && (
        <div className="alert alert-error">
          The payment didn't go through. Your cart is still saved, so you can <Link to="/checkout">try again</Link>.
        </div>
      )}
      {order.status === "pending" && (
        <div className="alert alert-info">
          We're still waiting for the payment to be confirmed.{" "}
          <button className="link-btn" onClick={recheck} disabled={checking}>{checking ? "Checking…" : "Check again"}</button>
        </div>
      )}

      <div className="section-head">
        <div>
          <h1 className="h1">Order #{order.id}</h1>
          <p className="muted">Placed on {formatDate(order.created_at)}</p>
        </div>
        <span className={`status status-${order.status}`}>{STATUS_LABEL[order.status] || order.status}</span>
      </div>

      <div className="card pad">
        <div className="mini-list">
          {order.items.map((i) => (
            <div key={i.id} className="mini">
              <ProductArt art={i.art} color={i.color} />
              <div>
                <strong>{i.product_name}</strong>
                <span className="muted">Size {i.size} · Qty {i.quantity} · {formatMoney(i.unit_price_minor, order.currency)} each</span>
              </div>
              <span>{formatMoney(i.unit_price_minor * i.quantity, order.currency)}</span>
            </div>
          ))}
        </div>
        <div className="summary-row total"><span>Total</span><span>{formatMoney(order.total_minor, order.currency)}</span></div>
      </div>

      <p className="center"><Link to="/orders" className="link">All orders</Link></p>
    </div>
  );
}
