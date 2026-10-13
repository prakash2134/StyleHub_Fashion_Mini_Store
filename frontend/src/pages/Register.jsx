import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import ProductArt from "../components/ProductArt";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError("Use at least 8 characters, with at least one letter and one number.");
      return;
    }
    setBusy(true);
    try {
      await register(form.full_name.trim(), form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-side" aria-hidden="true">
        <h2>Join StyleHub.</h2>
        <p>Save your cart, check out in seconds and track every order.</p>
        <ProductArt art="hoodie" color="#FF7A6B" tile={false} />
      </div>
      <form className="auth-form" onSubmit={submit}>
        <h1 className="h1">Create your account</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <label className="field">
          <span>Full name</span>
          <input className="input" autoComplete="name" required minLength={2} maxLength={80} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="field">
          <span>Password</span>
          <input className="input" type="password" autoComplete="new-password" required maxLength={64} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <small className="muted">At least 8 characters, with a letter and a number.</small>
        </label>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        <p className="center muted">
          Already registered? <Link to="/login" state={location.state} className="link">Log in</Link>
        </p>
      </form>
    </div>
  );
}
