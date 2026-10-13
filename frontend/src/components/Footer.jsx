import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <strong className="footer-brand">StyleHub</strong>
          <p>Everyday fashion, simple checkout.</p>
        </div>
        <div className="footer-links">
          <Link to="/shop">Shop all</Link>
          <Link to="/orders">Your orders</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <p className="footer-note">Demo store running Stripe in test mode. No real payments are taken.</p>
      </div>
    </footer>
  );
}
