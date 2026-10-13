import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import Loader from "../../components/Loader";
import { formatDate, formatMoney, STATUS_LABEL } from "../../utils/format";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/admin/stats").then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <Loader />;

  const money = (v) => formatMoney(v, stats.currency);
  const max = Math.max(...stats.daily.map((d) => d.revenue_minor), 1);

  const cards = [
    ["Revenue", money(stats.revenue_minor)],
    ["Paid orders", stats.paid_orders],
    ["Customers", stats.customers],
    ["Products", stats.products],
    ["Low stock", stats.low_stock, stats.low_stock > 0],
  ];

  return (
    <div className="stack">
      <div className="stat-grid">
        {cards.map(([label, value, warn]) => (
          <div key={label} className={`card stat ${warn ? "stat-warn" : ""}`}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="two-col admin-cols">
        <section className="card pad">
          <h3>Sales, last 7 days</h3>
          <div className="bars">
            {stats.daily.map((d) => (
              <div key={d.date} className="bar-col" title={`${d.date}: ${money(d.revenue_minor)}`}>
                <div className="bar" style={{ height: `${Math.max((d.revenue_minor / max) * 100, 3)}%` }} />
                <span>{new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card pad">
          <div className="section-head tight">
            <h3>Recent orders</h3>
            <Link to="/admin/orders" className="link">View all</Link>
          </div>
          {stats.recent_orders.length === 0 ? (
            <p className="muted">No orders yet.</p>
          ) : (
            <div className="mini-list">
              {stats.recent_orders.map((o) => (
                <div key={o.id} className="recent-row">
                  <div>
                    <strong>#{o.id} · {o.customer_name}</strong>
                    <span className="muted">{formatDate(o.created_at)}</span>
                  </div>
                  <span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  <span className="price">{money(o.total_minor)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
