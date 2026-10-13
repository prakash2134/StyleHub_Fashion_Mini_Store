import { useEffect, useState } from "react";
import { api } from "../../api";
import Loader from "../../components/Loader";
import { useConfig } from "../../context/ConfigContext";
import { formatDate, formatMoney } from "../../utils/format";

export default function AdminUsers() {
  const { currency } = useConfig();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/admin/users").then(setUsers).catch((e) => {
      setError(e.message);
      setUsers([]);
    });
  }, []);

  if (users === null) return <Loader />;

  return (
    <div className="stack">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th className="right">Paid orders</th><th className="right">Spent</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.full_name}</strong></td>
                <td className="muted">{u.email}</td>
                <td>{u.is_admin ? <span className="status status-paid">Admin</span> : "Customer"}</td>
                <td>{formatDate(u.created_at)}</td>
                <td className="right">{u.paid_orders}</td>
                <td className="right price">{formatMoney(u.total_spent_minor, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
