import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="container section">
      <div className="section-head">
        <h1 className="h1">Admin</h1>
      </div>
      <nav className="admin-tabs">
        <NavLink to="/admin" end>Overview</NavLink>
        <NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/admin/users">Customers</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
