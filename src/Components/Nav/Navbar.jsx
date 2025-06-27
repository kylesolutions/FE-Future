import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Nav.css';

function Navbar({ onLoginClick }) {
  const navigate = useNavigate();
  const user = useSelector(state => state.user); // Access user state from Redux
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check admin status on mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('http://localhost:8000/user/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAdmin(response.data.is_staff || false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error.response?.data || error.message);
        setIsAdmin(false);
        // Handle token expiration or invalid token
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, []);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleDesignClick = () => {
    navigate('/');
  };

  if (isLoading) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary future-nav">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img src="/Images/future_studio_Logo.png" alt="Logo" style={{ width: '120px' }} />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/" onClick={handleDesignClick}>Design</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/cluster">Cluster</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/installation-care">Installation & Care</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/faqs">FAQs</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/cart">
                <i className="bi bi-bag-check me-1"></i>Cart
              </Link>
            </li>
            {(user.type == "admin") && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin/create-frame">Create Frame</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/details">Details</Link>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center">
            {user.username ? (
              <div className="dropdown">
                <button
                  className="profile-button btn btn-outline-primary dropdown-toggle"
                  type="button"
                  id="profileDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={handleProfileClick}
                >
                  <i className="bi bi-person-circle me-1"></i>{user.name || user.username}
                </button>
              </div>
            ) : (
              <button className="login-button btn btn-primary" onClick={onLoginClick}>
                Login/Signup
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;