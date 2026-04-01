import { Link, NavLink } from "react-router-dom";

const linkClassName = ({ isActive }) => `nav-link${isActive ? " is-active" : ""}`;

export const Navbar = () => (
  <header className="navbar">
    <Link className="brand" to="/">
      PapRev
    </Link>
    <nav className="nav-links">
      <NavLink className={linkClassName} to="/">
        Upload
      </NavLink>
      <NavLink className={linkClassName} to="/dashboard">
        Dashboard
      </NavLink>
    </nav>
    <div className="nav-session">
      <span className="meta-pill">Starter Mode</span>
    </div>
  </header>
);
