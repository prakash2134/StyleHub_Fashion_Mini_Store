import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container section">
      <div className="empty">
        <h3>We can't find that page</h3>
        <p>The link may be broken or the page may have moved.</p>
        <Link to="/" className="btn btn-primary">Go home</Link>
      </div>
    </div>
  );
}
