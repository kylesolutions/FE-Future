import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Download, 
  Trash2, 
  Calendar, 
  Gift, 
  User, 
  DollarSign,
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock,
  Image as ImageIcon,
  Eye,
  RotateCw,
  Move,
  ZoomIn
} from 'lucide-react';
import './GiftOrdersView.css';

const BASE_URL = 'http://82.180.146.4:8001';

function GiftOrdersView() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const isAdmin = user?.is_staff || user?.is_superuser;

  // Fetch gift orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to view orders.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${BASE_URL}/gift-orders/list/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const processedOrders = response.data.map(item => ({ ...item, type: 'gift' }));
        setOrders(processedOrders);
        setFilteredOrders(processedOrders);
        setError(null);
      } catch (error) {
        console.error('Error fetching gift orders:', error);
        setError(`Failed to load orders: ${error.response?.statusText || error.message}`);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  // Filter orders by date range
  useEffect(() => {
    let filtered = orders;
    if (startDate || endDate) {
      filtered = orders.filter((item) => {
        const orderDate = new Date(item.created_at);
        const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
        const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
        return (!start || orderDate >= start) && (!end || orderDate <= end);
      });
    }
    setFilteredOrders(filtered);
  }, [startDate, endDate, orders]);

  // Handle deleting an order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this gift order? This action cannot be undone.')) {
      return;
    }

    setDeleting(orderId);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      
      await axios.delete(`${BASE_URL}/gift-orders/${orderId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setOrders((prevOrders) => prevOrders.filter((item) => item.id !== orderId));
      setFilteredOrders((prevFiltered) => prevFiltered.filter((item) => item.id !== orderId));
      
    } catch (error) {
      console.error('Error deleting order:', error);
      let errorMessage = 'Failed to delete order.';
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this order.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Order not found.';
      }
      
      alert(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  // Handle downloading an image
  const handleDownloadImage = async (imagePath, orderId) => {
    if (!imagePath) {
      alert('No image available for download.');
      return;
    }
    
    setDownloading(orderId);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      
      const fullUrl = getImageUrl(imagePath);
      const response = await axios.get(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = imagePath.split('/').pop() || 'gift_order_image.jpg';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image: ' + (error.response?.statusText || error.message));
    } finally {
      setDownloading(null);
    }
  };

  // Construct image URLs
  const getImageUrl = (path) => {
    if (!path) return 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Calculate total cost
  const totalCost = filteredOrders.reduce(
    (sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0),
    0
  );

  // Reset filters
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (loading) {
    return (
      <div className="gift-orders-loading">
        <div className="gift-orders-loading-content">
          <div className="gift-orders-spinner"></div>
          <h3>Loading Gift Orders</h3>
          <p>Please wait while we fetch your gift orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gift-orders-error">
        <div className="gift-orders-error-content">
          <AlertTriangle className="gift-orders-error-icon" />
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="gift-orders-retry-btn"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gift-orders-container">
      <div className="gift-orders-header">
        <div className="gift-orders-header-content">
          <div className="gift-orders-title-section">
            <Gift className="gift-orders-main-icon" />
            <div>
              <h1 className="gift-orders-title">
                {isAdmin ? 'Gift Orders Dashboard' : 'My Gift Orders'}
              </h1>
              <p className="gift-orders-subtitle">
                {isAdmin ? 'Manage all customer gift orders' : `Welcome back, ${user?.username || 'User'}`}
              </p>
            </div>
          </div>
          
          <div className="gift-orders-stats">
            <div className="gift-orders-stat-card">
              <Gift size={20} />
              <div>
                <span className="gift-orders-stat-number">{filteredOrders.length}</span>
                <span className="gift-orders-stat-label">Orders</span>
              </div>
            </div>
            <div className="gift-orders-stat-card">
              <DollarSign size={20} />
              <div>
                <span className="gift-orders-stat-number">${totalCost.toFixed(2)}</span>
                <span className="gift-orders-stat-label">Total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="gift-orders-content">
        {/* Filters Section */}
        <div className="gift-orders-filters-card">
          <div className="gift-orders-filters-header">
            <div className="gift-orders-filters-title">
              <Filter size={18} />
              <span>Filter Orders</span>
            </div>
            <button 
              className="gift-orders-filters-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          
          {showFilters && (
            <div className="gift-orders-filters-content">
              <div className="gift-orders-date-filters">
                <div className="gift-orders-date-group">
                  <label className="gift-orders-date-label">
                    <Calendar size={16} />
                    Start Date
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="MMM dd, yyyy"
                    className="gift-orders-datepicker"
                    placeholderText="Select start date"
                    isClearable
                  />
                </div>
                <div className="gift-orders-date-group">
                  <label className="gift-orders-date-label">
                    <Calendar size={16} />
                    End Date
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="MMM dd, yyyy"
                    className="gift-orders-datepicker"
                    placeholderText="Select end date"
                    isClearable
                  />
                </div>
              </div>
              
              {(startDate || endDate) && (
                <button 
                  className="gift-orders-reset-btn"
                  onClick={resetFilters}
                >
                  <RefreshCw size={16} />
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="gift-orders-empty">
            <Gift className="gift-orders-empty-icon" />
            <h3>No gift orders found</h3>
            <p>
              {startDate || endDate 
                ? "No orders match your selected date range. Try adjusting the filters."
                : "You haven't placed any gift orders yet."
              }
            </p>
            {(startDate || endDate) && (
              <button className="gift-orders-reset-btn" onClick={resetFilters}>
                <RefreshCw size={16} />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="gift-orders-table-card">
            <div className="gift-orders-table-container">
              <table className="gift-orders-table">
                <thead>
                  <tr>
                    <th>Images</th>
                    <th>User</th>
                    <th>Item Details</th>
                    <th>Transform</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="gift-orders-table-row">
                      <td className="gift-orders-images-cell">
                        <div className="gift-orders-images-container">
                          <div className="gift-orders-image-item">
                            <ImageIcon size={12} />
                            <img
                              src={getImageUrl(order.uploaded_image)}
                              alt="Uploaded"
                              className="gift-orders-image"
                              onError={(e) => {
                                e.target.src = 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop';
                              }}
                            />
                            <span className="gift-orders-image-label">Upload</span>
                          </div>
                          <div className="gift-orders-image-item">
                            <Eye size={12} />
                            <img
                              src={getImageUrl(order.preview_image)}
                              alt="Preview"
                              className="gift-orders-image"
                              onError={(e) => {
                                e.target.src = 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop';
                              }}
                            />
                            <span className="gift-orders-image-label">Preview</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="gift-orders-user-cell">
                        <div className="gift-orders-user-info">
                          <User size={16} />
                          <span>{order.user || 'Unknown'}</span>
                        </div>
                      </td>
                      
                      <td className="gift-orders-details-cell">
                        <div className="gift-orders-item-details">
                          <div className="gift-orders-detail-item">
                            <strong>Type:</strong> {order.content_type || 'Unknown'}
                          </div>
                          <div className="gift-orders-detail-item">
                            <strong>ID:</strong> {order.object_id || 'N/A'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="gift-orders-transform-cell">
                        <div className="gift-orders-transform-details">
                          <div className="gift-orders-transform-item">
                            <Move size={12} />
                            <span>X: {order.image_position_x || '0'}, Y: {order.image_position_y || '0'}</span>
                          </div>
                          <div className="gift-orders-transform-item">
                            <ZoomIn size={12} />
                            <span>Scale: {order.image_scale_x || '1'}x{order.image_scale_y || '1'}</span>
                          </div>
                          <div className="gift-orders-transform-item">
                            <RotateCw size={12} />
                            <span>Rotation: {order.image_rotation || '0'}°</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="gift-orders-price-cell">
                        <span className="gift-orders-price">
                          ${parseFloat(order.total_price || 0).toFixed(2)}
                        </span>
                      </td>
                      
                      <td className="gift-orders-status-cell">
                        <span className={`gift-orders-status gift-orders-status-${(order.status || 'pending').toLowerCase()}`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      
                      <td className="gift-orders-date-cell">
                        <div className="gift-orders-date-info">
                          <Clock size={14} />
                          <span>{format(new Date(order.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      
                      <td className="gift-orders-actions-cell">
                        <div className="gift-orders-actions">
                          <button
                            className="gift-orders-action-btn gift-orders-download-btn"
                            onClick={() => handleDownloadImage(order.uploaded_image, order.id)}
                            disabled={downloading === order.id}
                          >
                            {downloading === order.id ? (
                              <div className="gift-orders-btn-spinner"></div>
                            ) : (
                              <Download size={16} />
                            )}
                          </button>
                          
                          <button
                            className="gift-orders-action-btn gift-orders-delete-btn"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deleting === order.id}
                          >
                            {deleting === order.id ? (
                              <div className="gift-orders-btn-spinner"></div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {filteredOrders.length > 0 && (
          <div className="gift-orders-summary-card">
            <div className="gift-orders-total-section">
              <div className="gift-orders-total-info">
                <DollarSign className="gift-orders-total-icon" />
                <div>
                  <span className="gift-orders-total-label">Total Amount</span>
                  <span className="gift-orders-total-amount">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="gift-orders-summary-stats">
              <div className="gift-orders-summary-stat">
                <span className="gift-orders-summary-stat-label">Orders Selected</span>
                <span className="gift-orders-summary-stat-value">{filteredOrders.length}</span>
              </div>
              
              {startDate && endDate && (
                <div className="gift-orders-summary-stat">
                  <span className="gift-orders-summary-stat-label">Date Range</span>
                  <span className="gift-orders-summary-stat-value">
                    {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GiftOrdersView;