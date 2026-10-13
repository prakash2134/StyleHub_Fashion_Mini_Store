import { useEffect, useState } from "react";
import { api } from "../../api";
import Loader from "../../components/Loader";
import ProductArt from "../../components/ProductArt";
import { useConfig } from "../../context/ConfigContext";
import { useToast } from "../../context/ToastContext";
import { formatMoney } from "../../utils/format";

const ARTS = ["tee", "hoodie", "jeans", "dress", "jacket", "sneaker", "bag", "cap"];
const BADGES = ["", "New", "Bestseller", "Low stock"];
const EMPTY = {
  name: "",
  description: "",
  category: "",
  price: "",
  stock: "10",
  art: "tee",
  color: "#6c4dff",
  sizes: "S, M, L, XL",
  badge: "",
};

function ProductForm({ initial, categories, onSaved, onClose }) {
  const { currency } = useConfig();
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const editing = Boolean(initial.id);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const price = parseFloat(form.price);
    if (!(price > 0)) {
      setError("Enter a price greater than 0.");
      return;
    }
    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      price_minor: Math.round(price * 100),
      stock: parseInt(form.stock, 10) || 0,
      art: form.art,
      color: form.color,
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      badge: form.badge || null,
    };
    setBusy(true);
    try {
      if (editing) await api(`/admin/products/${initial.id}`, { method: "PUT", body });
      else await api("/admin/products", { method: "POST", body });
      toast(editing ? "Product updated" : "Product created");
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal card" onSubmit={submit}>
        <div className="section-head tight">
          <h2>{editing ? "Edit product" : "Add product"}</h2>
          <button type="button" className="link-btn" onClick={onClose}>Close</button>
        </div>

        <div className="modal-grid">
          <div className="modal-preview">
            <ProductArt art={form.art} color={form.color} />
            <label className="field">
              <span>Illustration</span>
              <select className="input" value={form.art} onChange={set("art")}>
                {ARTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Colour</span>
              <input type="color" className="color-input" value={form.color} onChange={set("color")} />
            </label>
          </div>

          <div className="stack">
            {error && <div className="alert alert-error">{error}</div>}
            <label className="field"><span>Name</span><input className="input" required minLength={2} maxLength={120} value={form.name} onChange={set("name")} /></label>
            <label className="field"><span>Description</span><textarea className="input" required minLength={5} rows={3} value={form.description} onChange={set("description")} /></label>
            <div className="row-2">
              <label className="field">
                <span>Category</span>
                <input className="input" required list="cats" value={form.category} onChange={set("category")} />
                <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </label>
              <label className="field">
                <span>Badge</span>
                <select className="input" value={form.badge} onChange={set("badge")}>
                  {BADGES.map((b) => <option key={b} value={b}>{b || "None"}</option>)}
                </select>
              </label>
            </div>
            <div className="row-2">
              <label className="field"><span>Price ({currency.toUpperCase()})</span><input className="input" type="number" min="0" step="0.01" required value={form.price} onChange={set("price")} /></label>
              <label className="field"><span>Stock</span><input className="input" type="number" min="0" step="1" required value={form.stock} onChange={set("stock")} /></label>
            </div>
            <label className="field">
              <span>Sizes (comma separated)</span>
              <input className="input" required value={form.sizes} onChange={set("sizes")} />
            </label>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create product"}</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminProducts() {
  const { currency } = useConfig();
  const toast = useToast();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, object = form data

  const load = () =>
    api("/products", { auth: false })
      .then(setProducts)
      .catch((e) => {
        setError(e.message);
        setProducts([]);
      });

  useEffect(() => {
    load();
  }, []);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This also removes it from customers' carts.`)) return;
    try {
      await api(`/admin/products/${p.id}`, { method: "DELETE" });
      toast("Product deleted");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const edit = (p) =>
    setEditing({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price: String(p.price_minor / 100),
      stock: String(p.stock),
      art: p.art,
      color: p.color,
      sizes: p.sizes.join(", "),
      badge: p.badge || "",
    });

  if (products === null) return <Loader />;
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="stack">
      <div className="toolbar">
        <p className="muted">{products.length} products</p>
        <button className="btn btn-primary" onClick={() => setEditing({ ...EMPTY })}>Add product</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr><th></th><th>Name</th><th>Category</th><th className="right">Price</th><th className="right">Stock</th><th>Badge</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="thumb-cell"><ProductArt art={p.art} color={p.color} /></td>
                <td><strong>{p.name}</strong></td>
                <td>{p.category}</td>
                <td className="right price">{formatMoney(p.price_minor, currency)}</td>
                <td className={`right ${p.stock <= 5 ? "text-danger" : ""}`}>{p.stock}</td>
                <td className="muted">{p.badge || "–"}</td>
                <td className="right actions">
                  <button className="link-btn" onClick={() => edit(p)}>Edit</button>
                  <button className="link-btn danger" onClick={() => remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductForm
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
