import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Details.css';
import { logoutUser } from '../../Redux/slices/userSlice';

// Base URL for images
const BASE_URL = 'http://143.110.178.225';
// Fallback image for broken or missing images
const FALLBACK_IMAGE = 'https://via.placeholder.com/100x100?text=Image+Not+Found';

function Details() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [frames, setFrames] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('frames');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);

  // Utility function to construct image URLs
  const getImageUrl = (path) => {
    if (!path) {
      console.warn('Image path is undefined or null');
      return FALLBACK_IMAGE;
    }
    if (path.startsWith('http')) {
      return path;
    }
    const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    console.log('Constructed image URL:', url); // Debug log
    return url;
  };

  // Handle image load errors
  const handleImageError = (e) => {
    console.warn('Image failed to load:', e.target.src);
    e.target.src = FALLBACK_IMAGE;
  };

  // Redirect if not admin
  useEffect(() => {
    if (!user.username || user.type !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) throw new Error('No refresh token available');
      const response = await axios.post('http://143.110.178.225/api/token/refresh/', { refresh });
      localStorage.setItem('token', response.data.access);
      return response.data.access;
    } catch (err) {
      console.error('Token refresh failed:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      dispatch(logoutUser());
      navigate('/login');
      return null;
    }
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        let token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          navigate('/login');
          return;
        }

        const framesResponse = await axios.get('http://143.110.178.225/frames/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFrames(framesResponse.data);

        const usersResponse = await axios.get('http://143.110.178.225/users/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersResponse.data);
      } catch (err) {
        if (err.response?.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            try {
              const framesResponse = await axios.get('http://143.110.178.225/frames/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setFrames(framesResponse.data);

              const usersResponse = await axios.get('http://143.110.178.225/users/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setUsers(usersResponse.data);
            } catch (retryErr) {
              setError('Session expired. Please log in again.');
              navigate('/login');
            }
          } else {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError(err.message || 'Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, dispatch]);

  const handleSelectItem = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalType(null);
  };

  const handleUpdate = async (e, id, type, data) => {
    e.preventDefault();
    let token = localStorage.getItem('token');
    let url;
    switch (type) {
      case 'frame':
        url = `http://143.110.178.225/frames/${id}/`;
        break;
      case 'color':
        url = `http://143.110.178.225/variants/color/${id}/`;
        break;
      case 'size':
        url = `http://143.110.178.225/variants/size/${id}/`;
        break;
      case 'finish':
        url = `http://143.110.178.225/variants/finish/${id}/`;
        break;
      case 'hanging':
        url = `http://143.110.178.225/variants/hanging/${id}/`;
        break;
      case 'user':
        url = `http://143.110.178.225/users/${id}/`;
        break;
      default:
        return;
    }

    try {
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const response = await axios.put(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (type === 'frame') {
        setFrames(frames.map((f) => (f.id === id ? response.data : f)));
      } else if (type === 'user') {
        setUsers(users.map((u) => (u.id === id ? response.data : u)));
      } else {
        const framesResponse = await axios.get('http://143.110.178.225/frames/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFrames(framesResponse.data);
      }
      handleCloseModal();
      alert('Update successful');
    } catch (err) {
      console.error('Update error:', err);
      if (err.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const retryResponse = await axios.put(url, data, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            if (type === 'frame') {
              setFrames(frames.map((f) => (f.id === id ? retryResponse.data : f)));
            } else if (type === 'user') {
              setUsers(users.map((u) => (u.id === id ? retryResponse.data : u)));
            } else {
              const framesResponse = await axios.get('http://143.110.178.225/frames/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setFrames(framesResponse.data);
            }
            handleCloseModal();
            alert('Update successful');
          } catch (retryErr) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (err.response?.status === 403) {
        setError('Only admins can update items. Please log in with an admin account.');
        navigate('/login');
      } else {
        alert('Failed to update item: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    let token = localStorage.getItem('token');
    let url;
    switch (type) {
      case 'frame':
        url = `http://143.110.178.225/frames/${id}/`;
        break;
      case 'color':
        url = `http://143.110.178.225/variants/color/${id}/`;
        break;
      case 'size':
        url = `http://143.110.178.225/variants/size/${id}/`;
        break;
      case 'finish':
        url = `http://143.110.178.225/variants/finish/${id}/`;
        break;
      case 'hanging':
        url = `http://143.110.178.225/variants/hanging/${id}/`;
        break;
      case 'user':
        url = `http://143.110.178.225/users/${id}/`;
        break;
      default:
        return;
    }

    try {
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (type === 'frame') {
        setFrames(frames.filter((f) => f.id !== id));
      } else if (type === 'user') {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        const framesResponse = await axios.get('http://143.110.178.225/frames/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFrames(framesResponse.data);
      }
      handleCloseModal();
      alert('Delete successful');
    } catch (err) {
      console.error('Delete error:', err);
      if (err.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            await axios.delete(url, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            if (type === 'frame') {
              setFrames(frames.filter((f) => f.id !== id));
            } else if (type === 'user') {
              setUsers(users.filter((u) => u.id !== id));
            } else {
              const framesResponse = await axios.get('http://143.110.178.225/frames/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setFrames(framesResponse.data);
            }
            handleCloseModal();
            alert('Delete successful');
          } catch (retryErr) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else {
        alert('Failed to delete item: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-muted fs-4">Loading...</div>
      </div>
    );
  if (error)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-danger fs-4">Error: {error}</div>
      </div>
    );

  return (
    <div className="container-fluid py-4 details-container">
      <div className="row g-4">
        {/* Tabs Sidebar */}
        <div className="col-lg-3 col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">Admin Dashboard</h2>
              <ul className="nav nav-pills flex-column">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'frames' ? 'active' : ''}`}
                    onClick={() => setActiveTab('frames')}
                  >
                    <i className="bi bi-card-image"></i> Frames
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    <i className="bi bi-people"></i> Users
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-lg-9 col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              {activeTab === 'frames' && (
                <div>
                  <h2 className="card-title mb-4">Frame Details</h2>
                  {frames.length === 0 ? (
                    <p className="text-muted">No frames available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Price</th>
                            <th scope="col">Image</th>
                            <th scope="col">Dimensions</th>
                            <th scope="col">Created By</th>
                            <th scope="col">Color Variants</th>
                            <th scope="col">Size Variants</th>
                            <th scope="col">Finishing Variants</th>
                            <th scope="col">Hanging Variants</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {frames.map((frame) => (
                            <tr key={frame.id}>
                              <td>{frame.name}</td>
                              <td>${frame.price}</td>
                              <td>
                                <img
                                  src={getImageUrl(frame.image)}
                                  alt={frame.name}
                                  className="img-thumbnail"
                                  style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                  onError={handleImageError}
                                />
                              </td>
                              <td>
                                {frame.inner_width} x {frame.inner_height}
                              </td>
                              <td>
                                {frame.created_by
                                  ? frame.created_by.name || frame.created_by.username || 'Unknown'
                                  : 'Unknown'}
                              </td>
                              <td>
                                <ul className="list-unstyled">
                                  {frame.color_variants.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.color_name}</span>
                                      <img
                                        src={getImageUrl(variant.image)}
                                        alt={variant.color_name}
                                        className="img-thumbnail"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                        onError={handleImageError}
                                      />
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'color')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <ul className="list-unstyled">
                                  {frame.size_variants.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.size_name}</span>
                                      {variant.image && (
                                        <img
                                          src={getImageUrl(variant.image)}
                                          alt={variant.size_name}
                                          className="img-thumbnail ms-2"
                                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'size')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <ul className="list-unstyled">
                                  {frame.finishing_variants.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.finish_name}</span>
                                      <img
                                        src={getImageUrl(variant.image)}
                                        alt={variant.finish_name}
                                        className="img-thumbnail"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                        onError={handleImageError}
                                      />
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'finish')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <ul className="list-unstyled">
                                  {frame.frameHanging_variant.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.hanging_name}</span>
                                      <img
                                        src={getImageUrl(variant.image)}
                                        alt={variant.hanging_name}
                                        className="img-thumbnail"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                        onError={handleImageError}
                                      />
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'hanging')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(frame, 'frame')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <h2 className="card-title mb-4">Registered Users</h2>
                  {users.length === 0 ? (
                    <p className="text-muted">No users available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Username</th>
                            <th scope="col">Email</th>
                            <th scope="col">Name</th>
                            <th scope="col">Phone</th>
                            <th scope="col">Role</th>
                            <th scope="col">Blocked</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.username}</td>
                              <td>{user.email || 'N/A'}</td>
                              <td>{user.name || 'N/A'}</td>
                              <td>{user.phone || 'N/A'}</td>
                              <td>{user.is_staff ? 'Admin' : user.is_user ? 'User' : 'Employee'}</td>
                              <td>{user.is_blocked ? 'Yes' : 'No'}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(user, 'user')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Item Details */}
      {selectedItem && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalType === 'frame' && 'Frame Details'}
                  {modalType === 'color' && 'Color Variant Details'}
                  {modalType === 'size' && 'Size Variant Details'}
                  {modalType === 'finish' && 'Finishing Variant Details'}
                  {modalType === 'hanging' && 'Hanging Variant Details'}
                  {modalType === 'user' && 'User Details'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                {modalType === 'frame' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'frame', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        defaultValue={selectedItem.name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Inner Width</label>
                      <input
                        type="number"
                        className="form-control"
                        name="inner_width"
                        defaultValue={selectedItem.inner_width}
                        step="0.1"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Inner Height</label>
                      <input
                        type="number"
                        className="form-control"
                        name="inner_height"
                        defaultValue={selectedItem.inner_height}
                        step="0.1"
                        required
                      />
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'frame')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'color' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'color', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Color Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="color_name"
                        defaultValue={selectedItem.color_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.color_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'color')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'size' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'size', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Size Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="size_name"
                        defaultValue={selectedItem.size_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Inner Width</label>
                      <input
                        type="number"
                        className="form-control"
                        name="inner_width"
                        defaultValue={selectedItem.inner_width}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Inner Height</label>
                      <input
                        type="number"
                        className="form-control"
                        name="inner_height"
                        defaultValue={selectedItem.inner_height}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.size_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'size')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'finish' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'finish', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Finish Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="finish_name"
                        defaultValue={selectedItem.finish_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.finish_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'finish')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'hanging' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'hanging', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Hanging Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="hanging_name"
                        defaultValue={selectedItem.hanging_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.hanging_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'hanging')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'user' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'user', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        className="form-control"
                        name="username"
                        defaultValue={selectedItem.username}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        defaultValue={selectedItem.email}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        defaultValue={selectedItem.name}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        defaultValue={selectedItem.phone}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Blocked</label>
                      <select
                        className="form-control"
                        name="is_blocked"
                        defaultValue={selectedItem.is_blocked ? 'true' : 'false'}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'user')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Details;