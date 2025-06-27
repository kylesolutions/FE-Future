import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { logoutUser } from '../../Redux/slices/userSlice';

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState('profile');
  const [resetPassword, setResetPassword] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogout = async () => {
    try {
      dispatch(logoutUser());
      localStorage.removeItem('token');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Failed to logout. Please try again.');
    }
  };

  const handleTabClick = (tab) => {
    if (tab === 'logout') {
      handleLogout();
    } else {
      setActiveTab(tab);
      setError(null);
      setSuccess(null);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setResetPassword({ ...resetPassword, [name]: value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (resetPassword.new_password !== resetPassword.confirm_new_password) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      // Placeholder for password reset API call
      // await axios.post('http://localhost:8000/api/reset-password/', resetPassword, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      // });
      setSuccess('Password updated successfully!');
      setResetPassword({ current_password: '', new_password: '', confirm_new_password: '' });
    } catch (error) {
      setError('Failed to update password. Please try again.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="profile-card">
            <h2 className="profile-card-title">Profile Details</h2>
            <div className="profile-detail">
              <span className="profile-label">Username</span>
              <span className="profile-value">{user.username || 'N/A'}</span>
            </div>
            <div className="profile-detail">
              <span className="profile-label">Name</span>
              <span className="profile-value">{user.name || 'N/A'}</span>
            </div>
            <div className="profile-detail">
              <span className="profile-label">Email</span>
              <span className="profile-value">{user.email || 'N/A'}</span>
            </div>
            <div className="profile-detail">
              <span className="profile-label">Phone</span>
              <span className="profile-value">{user.phone || 'N/A'}</span>
            </div>
            <div className="profile-detail">
              <span className="profile-label">Address</span>
              <span className="profile-value">{user.address || 'N/A'}</span>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="profile-card">
            <h2 className="profile-card-title">Your Orders</h2>
            <p className="profile-empty-text">No orders yet.</p>
          </div>
        );
      case 'reset-password':
        return (
          <div className="profile-card">
            <h2 className="profile-card-title">Reset Password</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form className="profile-form" onSubmit={handlePasswordSubmit}>
              <div className="profile-form-group">
                <label htmlFor="current_password">Current Password</label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={resetPassword.current_password}
                  onChange={handlePasswordChange}
                  className="profile-input"
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="new_password">New Password</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={resetPassword.new_password}
                  onChange={handlePasswordChange}
                  className="profile-input"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="confirm_new_password">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm_new_password"
                  name="confirm_new_password"
                  value={resetPassword.confirm_new_password}
                  onChange={handlePasswordChange}
                  className="profile-input"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <button type="submit" className="profile-btn-primary">
                Update Password
              </button>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-sidebar">
        <div className="profile-sidebar-header">
          <h3 className="profile-sidebar-title">User Dashboard</h3>
        </div>
        <ul className="profile-nav">
          <li className="profile-nav-item">
            <button
              className={`profile-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabClick('profile')}
            >
              <i className="bi bi-person me-2"></i> Profile
            </button>
          </li>
          <li className="profile-nav-item">
            <button
              className={`profile-nav-link ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => handleTabClick('orders')}
            >
              <i className="bi bi-cart me-2"></i> Orders
            </button>
          </li>
          <li className="profile-nav-item">
            <button
              className={`profile-nav-link ${activeTab === 'reset-password' ? 'active' : ''}`}
              onClick={() => handleTabClick('reset-password')}
            >
              <i className="bi bi-lock me-2"></i> Reset Password
            </button>
          </li>
          <li className="profile-nav-item">
            <button className="profile-nav-link" onClick={() => handleTabClick('logout')}>
              <i className="bi bi-box-arrow-right me-2"></i> Logout
            </button>
          </li>
        </ul>
      </div>
      <div className="profile-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default Profile;