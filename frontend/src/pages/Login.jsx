import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import ProductArt from "../components/ProductArt";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      navigate(loggedIn.is_admin && !location.state?.from ? "/admin" : from, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-side" aria-hidden="true">
        <h2>Welcome back.</h2>
        <p>Your bag and past orders are waiting.</p>
        <ProductArt art="jacket" color="#D6F36B" tile={false} />
      </div>
      <form className="auth-form" onSubmit={submit}>
        <h1 className="h1">Log in</h1>
        {location.state?.from && <div className="alert alert-info">Log in to continue.</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="field">
          <span>Password</span>
          <input className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
        <p className="center muted">
          New to StyleHub? <Link to="/register" state={location.state} className="link">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
