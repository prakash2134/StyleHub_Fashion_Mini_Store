import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import ProductArt from "../components/ProductArt";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const CATEGORY_ART = {
  Tops: ["hoodie", "#FF7A6B"],
  Bottoms: ["jeans", "#3E5C9A"],
  Dresses: ["dress", "#E8A0BF"],
  Outerwear: ["jacket", "#4F8A7B"],
  Footwear: ["sneaker", "#6C4DFF"],
  Accessories: ["bag", "#D6C06B"],
};

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api("/products", { auth: false }).then(setProducts).catch(() => setProducts([]));
    api("/products/categories", { auth: false }).then(setCategories).catch(() => {});
  }, []);

  const featured = (products || []).filter((p) => p.badge === "Bestseller" || p.badge === "New").slice(0, 8);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>Clothes that keep up with you.</h1>
            <p>Tees, denim, jackets and sneakers for every day of the week. Pick your size, pay securely, and wear it tomorrow.</p>
            <div className="hero-cta">
              <Link to="/shop" className="btn btn-primary btn-lg">Shop the collection</Link>
              {!user && <Link to="/register" className="btn btn-ghost btn-lg">Create an account</Link>}
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-tile t1"><ProductArt art="hoodie" color="#D6F36B" tile={false} /></div>
            <div className="hero-tile t2"><ProductArt art="sneaker" color="#17142B" tile={false} /></div>
            <div className="hero-tile t3"><ProductArt art="tee" color="#FFFFFF" tile={false} /></div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Shop by category</h2>
          <Link to="/shop" className="link">See everything</Link>
        </div>
        <div className="cat-grid">
          {categories.map((c) => {
            const [art, color] = CATEGORY_ART[c.name] || ["tee", "#6C4DFF"];
            return (
              <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="cat-card">
                <ProductArt art={art} color={color} />
                <div>
                  <strong>{c.name}</strong>
                  <span className="muted">{c.count} styles</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>New and loved</h2>
          <Link to="/shop" className="link">Browse all</Link>
        </div>
        {products === null ? (
          <Loader />
        ) : (
          <div className="grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="container section">
        <div className="promise">
          <div>
            <h3>Secure checkout</h3>
            <p>Card payments are handled by Stripe. Your card details never touch our server.</p>
          </div>
          <div>
            <h3>Your cart follows you</h3>
            <p>Log in on any device and your bag is exactly how you left it.</p>
          </div>
          <div>
            <h3>Clear order history</h3>
            <p>Every order, its status and what was in it, all on one page.</p>
          </div>
        </div>
      </section>
    </>
  );
}
