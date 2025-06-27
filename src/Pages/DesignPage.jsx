import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../Components/Nav/Navbar';
import NavIcons from '../Components/NavIcons/NavIcons';
import Headers from '../Components/Hearders/Headers';
import Login from '../Components/SignupLogin/Login';
import Signup from '../Components/SignupLogin/Signup';
import './modal.css';

function DesignPage() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [cartItem, setCartItem] = useState(null); // Add state for cartItem
  const location = useLocation(); // Use location to access navigation state

  // Update cartItem when location.state changes
  useEffect(() => {
    setCartItem(location.state?.cartItem || null);
  }, [location.state]);

  const handleLoginClose = () => setShowLogin(false);
  const handleSignupClose = () => setShowSignup(false);
  const switchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  return (
    <>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <Navbar onLoginClick={() => setShowLogin(true)} />
          </div>
          <div className="col-lg-1">
            <NavIcons onCategorySelect={setActiveCategory} />
          </div>
          <div className="col-lg-11">
            <Headers
              activeCategory={activeCategory}
              selectedFrame={selectedFrame}
              onSelectFrame={setSelectedFrame}
              onCategorySelect={setActiveCategory}
              cartItem={cartItem} // Pass cartItem as a prop
            />
          </div>
        </div>
      </div>

      {/* Login and Signup modals remain unchanged */}
      {showLogin && (
        <div className="modal fade show" style={{ display: 'block' }} onClick={handleLoginClose}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content custom-modal">
              <div className="modal-header">
                <h5 className="modal-title">Login</h5>
                <button type="button" className="btn-close" onClick={handleLoginClose}></button>
              </div>
              <div className="modal-body">
                <Login onLoginSuccess={handleLoginClose} />
              </div>
              <div className="modal-footer">
                <p className="footer-message">
                  Not registered? <a onClick={switchToSignup}>Signup here</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSignup && (
        <div className="modal fade show" style={{ display: 'block' }} onClick={handleSignupClose}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content custom-modal">
              <div className="modal-header">
                <h5 className="modal-title">Signup</h5>
                <button type="button" className="btn-close" onClick={handleSignupClose}></button>
              </div>
              <div className="modal-body">
                <Signup/>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DesignPage;