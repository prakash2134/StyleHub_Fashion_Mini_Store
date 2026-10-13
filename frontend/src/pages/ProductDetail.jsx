import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../api";
import Loader from "../components/Loader";
import ProductArt from "../components/ProductArt";
import QtyStepper from "../components/QtyStepper";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useConfig } from "../context/ConfigContext";
import { useToast } from "../context/ToastContext";
import { formatMoney } from "../utils/format";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { currency } = useConfig();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    setProduct(null);
    setError("");
    setSize("");
    setQty(1);
    api(`/products/${id}`, { auth: false })
      .then((p) => {
        setProduct(p);
        if (p.sizes.length === 1) setSize(p.sizes[0]);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <div className="container section">
        <div className="empty">
          <h3>{error}</h3>
          <Link to="/shop" className="btn btn-primary">Back to the shop</Link>
        </div>
      </div>
    );
  if (!product) return <Loader />;

  const soldOut = product.stock <= 0;

  const handleAdd = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (!size) {
      setSizeError(true);
      return;
    }
    setBusy(true);
    try {
      await addItem(product.id, size, qty);
      toast(`${product.name} added to your cart`);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section">
      <p className="crumbs">
        <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
      </p>
      <div className="detail">
        <div className="detail-media">
          <ProductArt art={product.art} color={product.color} />
        </div>
        <div className="detail-info">
          {product.badge && <span className="tag tag-inline">{product.badge}</span>}
          <h1 className="h1">{product.name}</h1>
          <p className="detail-price">{formatMoney(product.price_minor, currency)}</p>
          <p className="detail-desc">{product.description}</p>

          <div className="field">
            <div className="field-row">
              <label>Size</label>
              {sizeError && <span className="field-error">Choose a size first</span>}
            </div>
            <div className="sizes">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`size ${size === s ? "is-active" : ""}`}
                  onClick={() => {
                    setSize(s);
                    setSizeError(false);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Quantity</label>
            <QtyStepper value={qty} onChange={setQty} max={Math.min(10, Math.max(product.stock, 1))} disabled={soldOut} />
          </div>

          <button className="btn btn-primary btn-lg btn-block" onClick={handleAdd} disabled={busy || soldOut}>
            {soldOut ? "Sold out" : busy ? "Adding…" : user ? "Add to cart" : "Log in to add to cart"}
          </button>
          {!soldOut && product.stock <= 5 && <p className="note warn">Only {product.stock} left in stock.</p>}
        </div>
      </div>
    </div>
  );
}
