/**
 * Navigation Component
 * 
 * Top navigation bar with links
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navigation.css";

function Navigation() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <span className="logo-icon">🎓</span>
          <Link to="/">SSI Sepolia</Link>
        </div>

        <ul className="nav-links">
          <li>
            <Link
              to="/issuer"
              className={`nav-link ${isActive("/issuer") ? "active" : ""}`}
            >
              <span className="icon">🏫</span>
              Issuer
            </Link>
          </li>
          <li>
            <Link
              to="/wallet"
              className={`nav-link ${isActive("/wallet") ? "active" : ""}`}
            >
              <span className="icon">👤</span>
              Wallet
            </Link>
          </li>
          <li>
            <Link
              to="/verify"
              className={`nav-link ${isActive("/verify") ? "active" : ""}`}
            >
              <span className="icon">🔍</span>
              Verify
            </Link>
          </li>
        </ul>

        <div className="nav-info">
          <span className="network-badge">Sepolia 🔗</span>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
