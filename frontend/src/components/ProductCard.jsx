import { Link } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";
import { formatMoney } from "../utils/format";
import ProductArt from "./ProductArt";

export default function ProductCard({ product }) {
  const { currency } = useConfig();
  const soldOut = product.stock <= 0;
  return (
    <Link to={`/product/${product.id}`} className="card product-card">
      <div className="product-card-media">
        <ProductArt art={product.art} color={product.color} />
        {soldOut ? (
          <span className="tag tag-muted">Sold out</span>
        ) : (
          product.badge && <span className={`tag ${product.badge === "Low stock" ? "tag-warn" : ""}`}>{product.badge}</span>
        )}
      </div>
      <div className="product-card-body">
        <div>
          <h3>{product.name}</h3>
          <p className="muted">{product.category}</p>
        </div>
        <strong className="price">{formatMoney(product.price_minor, currency)}</strong>
      </div>
    </Link>
  );
}
