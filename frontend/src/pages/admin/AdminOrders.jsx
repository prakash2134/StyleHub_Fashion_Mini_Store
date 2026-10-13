import { useEffect, useState } from "react";
import { api } from "../../api";
import Loader from "../../components/Loader";
import { formatDate, formatMoney, STATUS_LABEL } from "../../utils/format";

const FILTERS = ["all", "paid", "pending", "failed", "cancelled"];

export default function AdminOrders() {
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setOrders(null);
    setError("");
    api(`/admin/orders?status_filter=${filter}`)
      .then(setOrders)
      .catch((e) => {
        setError(e.message);
        setOrders([]);
      });
  }, [filter]);

  return (
    <div className="stack">
      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f} className={`chip ${filter === f ? "is-active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {orders === null ? (
        <Loader />
      ) : orders.length === 0 ? (
        <div className="empty"><h3>No orders here</h3></div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Date</th><th>Status</th><th className="right">Total</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>#{o.id}</strong></td>
                  <td>{o.customer_name}<br /><span className="muted">{o.customer_email}</span></td>
                  <td className="muted">{o.items.map((i) => `${i.quantity}× ${i.product_name} (${i.size})`).join(", ")}</td>
                  <td>{formatDate(o.created_at)}</td>
                  <td><span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                  <td className="right price">{formatMoney(o.total_minor, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
