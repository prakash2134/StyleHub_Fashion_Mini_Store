import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="StyleHub home">
      <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#6C4DFF" />
        <path d="M20 18l8-4q4 6 8 0l8 4 8 12-8 4-4-5v21H24V29l-4 5-8-4z" transform="translate(-2 2) scale(.92)" fill="#D6F36B" />
      </svg>
      <span>StyleHub</span>
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
  setOpen(false);
}, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo />
        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
          <span />
          <span />
        </button>
        <nav className={`nav-links ${open ? "is-open" : ""}`}>
          <NavLink to="/shop">Shop</NavLink>
          {user && !user.is_admin && <NavLink to="/orders">Orders</NavLink>}
          {user?.is_admin && <NavLink to="/admin">Admin</NavLink>}
          <div className="nav-actions">
            <Link to="/cart" className="cart-btn" aria-label={`Cart, ${cart.count} items`}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 7h12l-1 12H7L6 7z" />
                <path d="M9 7V6a3 3 0 016 0v1" />
              </svg>
              {cart.count > 0 && <b>{cart.count}</b>}
            </Link>
            {user ? (
              <>
                <span className="avatar" title={user.email}>{user.full_name.charAt(0).toUpperCase()}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
