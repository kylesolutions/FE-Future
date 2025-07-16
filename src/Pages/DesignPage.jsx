import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../Components/Nav/Navbar';
import Login from '../Components/SignupLogin/Login';
import Signup from '../Components/SignupLogin/Signup';
import './DesignPage.css';
import NavIcons from '../Components/NavIcons/NavIcons';
import Headers from '../Components/Hearders/Headers';

function DesignPage() {
  const [activeCategory, setActiveCategory] = useState('frame');
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [cartItem, setCartItem] = useState(null);
  const [hasUploadedImages, setHasUploadedImages] = useState(false);
  const location = useLocation();
  const isPrintOnly = location.state?.isPrintOnly || false;

  useEffect(() => {
    if (location.state?.cartItem) {
      setCartItem(location.state.cartItem);
      setHasUploadedImages(true);
      setSelectedFrame(location.state.cartItem.frame || null);
      setActiveCategory('frame');
    }
  }, [location.state]);

  const handleLoginClose = () => setShowLogin(false);
  const handleSignupClose = () => setShowSignup(false);
  const switchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  return (
    <>
      <div className="design-workspace">
        <div className="workspace-header">
          <Navbar onLoginClick={() => setShowLogin(true)} />
        </div>
        
        <div className="workspace-content">
          {hasUploadedImages && !isPrintOnly && (
            <div className="sidebar-navigation">
              <NavIcons 
                activeCategory={activeCategory}
                onCategorySelect={setActiveCategory} 
              />
            </div>
          )}
          
          <div className={`main-workspace ${hasUploadedImages && !isPrintOnly ? 'with-sidebar' : 'full-width'}`}>
            <Headers
              activeCategory={activeCategory}
              onCategorySelect={setActiveCategory}
              cartItem={cartItem}
              setHasUploadedImages={setHasUploadedImages}
              onSelectFrame={setSelectedFrame}
              isPrintOnly={isPrintOnly}
            />
          </div>
        </div>
      </div>

      {showLogin && (
        <div className="modal-overlay" onClick={handleLoginClose}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Welcome Back</h2>
              <button className="modal-close" onClick={handleLoginClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <Login onLoginSuccess={handleLoginClose} />
            </div>
            <div className="modal-footer">
              <p>
                Don't have an account? <button className="link-button" onClick={switchToSignup}>Sign up here</button>
              </p>
            </div>
          </div>
        </div>
      )}

      {showSignup && (
        <div className="modal-overlay" onClick={handleSignupClose}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Account</h2>
              <button className="modal-close" onClick={handleSignupClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <Signup onSignupSuccess={handleSignupClose} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DesignPage;