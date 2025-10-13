import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Nav.css';

function Navbar() {
  const navigate = useNavigate();
  const user = useSelector(state => state.user); // Access user state from Redux
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check admin status on mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token); // Debug token
        if (token) {
          const response = await axios.get('http://82.180.146.4:8001/user/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('User data:', response.data); // Debug response
          setIsAdmin(response.data.is_staff || false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error.response?.data || error.message);
        setIsAdmin(false);
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
    return (
      <div className="text-center p-3">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary future-nav">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img src="/Images/future_studio_Logo.png" alt="Logo" className="navbar-logo" />
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
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/" onClick={handleDesignClick}>Design</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/savedorder">
                <i className="bi bi-bag-check me-1"></i>Saved Order
              </Link>
            </li>
            {isAdmin && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin/create-frame">Create</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/details">Details</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/ordersview">Photos Order List</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/giftorder">Gift Order List</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/documentorder">Doc Order List</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/photobookorders">Photobook Order List</Link>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center gap-2">
            {user.username ? (
              <div className="dropdown">
                <button
                  className="profile-button btn btn-outline-primary dropdown-toggle"
                  type="button"
                  id="profileDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle me-1"></i>{user.name || user.username}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                  <li>
                    <Link className="dropdown-item" to="/profile" onClick={handleProfileClick}>
                      Profile
                    </Link>
                    </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary login-button" onClick={() => navigate('/login')}>
                  Login
                </button>
                <button className="btn btn-primary signup-button" onClick={() => navigate('/signup')}>
                  Signup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;