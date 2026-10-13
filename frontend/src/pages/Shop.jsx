import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import ProductCard from "../components/ProductCard";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const sort = params.get("sort") || "featured";
  const q = params.get("q") || "";

  const [search, setSearch] = useState(q);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    api("/products/categories", { auth: false }).then(setCategories).catch(() => {});
  }, []);

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== q) update("q", search.trim());
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (q) qs.set("q", q);
    qs.set("sort", sort);
    setProducts(null);
    setError("");
    api(`/products?${qs}`, { auth: false })
      .then(setProducts)
      .catch((e) => {
        setError(e.message);
        setProducts([]);
      });
  }, [category, q, sort]);

  return (
    <div className="container section">
      <div className="section-head">
        <h1 className="h1">{category || "All products"}</h1>
      </div>

      <div className="toolbar">
        <div className="chips" role="tablist" aria-label="Categories">
          <button className={`chip ${!category ? "is-active" : ""}`} onClick={() => update("category", "")}>All</button>
          {categories.map((c) => (
            <button key={c.name} className={`chip ${category === c.name ? "is-active" : ""}`} onClick={() => update("category", c.name)}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <input className="input" type="search" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
          <select className="input" value={sort} onChange={(e) => update("sort", e.target.value === "featured" ? "" : e.target.value)} aria-label="Sort products">
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {products === null ? (
        <div className="grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card skeleton-card" />
          ))}
        </div>
      ) : products.length === 0 && !error ? (
        <div className="empty">
          <h3>No products match your search</h3>
          <p>Try a different keyword or clear the filters.</p>
          <button className="btn btn-primary" onClick={() => { setSearch(""); setParams({}, { replace: true }); }}>Clear filters</button>
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
