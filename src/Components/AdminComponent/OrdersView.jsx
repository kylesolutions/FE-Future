import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Trash2, 
  Calendar,
  User,
  Package,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import './OrdersView.css';

const BASE_URL = 'http://localhost:8000';

function OrdersView() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the user is an admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(`${BASE_URL}/user/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
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

  // Fetch all saved orders
  useEffect(() => {
    const fetchSavedOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await axios.get(`${BASE_URL}/save-items/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedOrders(response.data);
        setFilteredOrders(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching saved orders:', error);
        setLoading(false);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };
    fetchSavedOrders();
  }, [navigate]);

  // Filter orders by date range
  useEffect(() => {
    let filtered = savedOrders;
    if (startDate || endDate) {
      filtered = savedOrders.filter((item) => {
        const orderDate = new Date(item.created_at);
        const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
        const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
        return (!start || orderDate >= start) && (!end || orderDate <= end);
      });
    }
    setFilteredOrders(filtered);
  }, [startDate, endDate, savedOrders]);

  // Update order status
  const handleUpdateStatus = async (itemId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [itemId]: true }));
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      await axios.put(
        `${BASE_URL}/save-items/${itemId}/`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSavedOrders((prevOrders) =>
        prevOrders.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to update this order.');
      } else if (error.response?.status === 404) {
        alert('Order not found.');
      } else {
        alert('Failed to update order status.');
      }
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Delete an order
  const handleDeleteOrder = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      await axios.delete(`${BASE_URL}/save-items/${itemId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedOrders((prevOrders) => prevOrders.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting order:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to delete this order.');
      } else if (error.response?.status === 404) {
        alert('Order not found.');
      } else {
        alert('Failed to delete order.');
      }
    }
  };

  // Download the original image
  const handleDownloadImage = async (imagePath) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const fullUrl = getImageUrl(imagePath);
      console.log('Downloading image from:', fullUrl);
      const response = await axios.get(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = imagePath.split('/').pop() || 'original_image.jpg';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error, 'imagePath:', imagePath);
      alert('Failed to download image. Please try again.');
    }
  };

  // Construct image URLs
  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/50x50?text=Image+Not+Found';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Toggle row expansion
  const toggleRow = (itemId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Calculate total cost
  const totalCost = filteredOrders.reduce(
    (sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0),
    0
  );

  // Get status badge styling
  const getStatusBadge = (status) => {
    const baseClasses = "frameorder-status-badge";
    switch (status?.toLowerCase()) {
      case 'paid':
        return `${baseClasses} frameorder-status-paid`;
      case 'pending':
        return `${baseClasses} frameorder-status-pending`;
      default:
        return `${baseClasses} frameorder-status-default`;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="frameorder-loading-container">
        <div className="frameorder-loading-content">
          <Loader2 className="frameorder-loading-spinner" />
          <p className="frameorder-loading-text">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div className="frameorder-empty-container">
        <div className="frameorder-empty-wrapper">
          <div className="frameorder-empty-card">
            <Package className="frameorder-empty-icon" />
            <h3 className="frameorder-empty-title">No Orders Found</h3>
            <p className="frameorder-empty-description">
              {startDate || endDate 
                ? "No orders found for the selected date range" 
                : "You don't have any orders yet"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="frameorder-container">
      <div className="frameorder-wrapper">
        {/* Header */}
        <div className="frameorder-header">
          <div className="frameorder-header-content">
            <h1 className="frameorder-title">Orders Dashboard</h1>
            <p className="frameorder-subtitle">Manage and track all orders in your system</p>
          </div>
          <div className="frameorder-stats">
            <div className="frameorder-stat-card">
              <div className="frameorder-stat-icon-wrapper">
                <Package className="frameorder-stat-icon" />
              </div>
              <div className="frameorder-stat-content">
                <div className="frameorder-stat-number">{filteredOrders.length}</div>
                <div className="frameorder-stat-label">Total Orders</div>
              </div>
            </div>
            <div className="frameorder-stat-card">
              <div className="frameorder-stat-icon-wrapper frameorder-stat-icon-revenue">
                <DollarSign className="frameorder-stat-icon" />
              </div>
              <div className="frameorder-stat-content">
                <div className="frameorder-stat-number">${totalCost.toFixed(2)}</div>
                <div className="frameorder-stat-label">Total Revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="frameorder-filters-section">
          <div className="frameorder-filters-header">
            <Calendar className="frameorder-filters-icon" />
            <h3 className="frameorder-filters-title">Filter by Date Range</h3>
          </div>
          <div className="frameorder-filters-grid">
            <div className="frameorder-filter-group">
              <label className="frameorder-filter-label">Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="MM/dd/yyyy"
                className="frameorder-date-picker"
                placeholderText="Select start date"
                isClearable
              />
            </div>
            <div className="frameorder-filter-group">
              <label className="frameorder-filter-label">End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                dateFormat="MM/dd/yyyy"
                className="frameorder-date-picker"
                placeholderText="Select end date"
                isClearable
              />
            </div>
            <div className="frameorder-total-cost-card">
              <div className="frameorder-total-cost-header">
                <DollarSign className="frameorder-total-cost-icon" />
                <span className="frameorder-total-cost-label">Total Cost</span>
              </div>
              <p className="frameorder-total-cost-amount">${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="frameorder-table-container">
          <div className="frameorder-table-wrapper">
            <table className="frameorder-table">
              <thead className="frameorder-table-header">
                <tr>
                  <th className="frameorder-th frameorder-th-expand"></th>
                  <th className="frameorder-th">Image</th>
                  <th className="frameorder-th">User</th>
                  <th className="frameorder-th">Frame</th>
                  <th className="frameorder-th">Mack Boards</th>
                  <th className="frameorder-th">Print Size</th>
                  <th className="frameorder-th">Media Type</th>
                  <th className="frameorder-th">Fit</th>
                  <th className="frameorder-th">Price</th>
                  <th className="frameorder-th">Status</th>
                  <th className="frameorder-th">Created At</th>
                  <th className="frameorder-th">Actions</th>
                </tr>
              </thead>
              <tbody className="frameorder-table-body">
                {filteredOrders.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <tr className={`frameorder-table-row ${expandedRows[item.id] ? 'frameorder-row-expanded' : ''}`}>
                      <td className="frameorder-td">
                        <button
                          className="frameorder-expand-btn"
                          onClick={() => toggleRow(item.id)}
                        >
                          {expandedRows[item.id] ? (
                            <ChevronUp className="frameorder-expand-icon" />
                          ) : (
                            <ChevronDown className="frameorder-expand-icon" />
                          )}
                        </button>
                      </td>
                      <td className="frameorder-td">
                        <div className="frameorder-image-container">
                          <img
                            src={getImageUrl(item.adjusted_image || item.cropped_image || item.original_image)}
                            alt="Order Item"
                            className="frameorder-order-image"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/50x50?text=Image+Not+Found';
                            }}
                          />
                        </div>
                      </td>
                      <td className="frameorder-td">
                        <div className="frameorder-user-info">
                          <User className="frameorder-user-icon" />
                          <span className="frameorder-user-name">
                            {item.user?.username || item.user || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="frameorder-td">
                        <span className="frameorder-frame-name">
                          {item.frame?.name || 'None'}
                        </span>
                      </td>
                      <td className="frameorder-td">
                        <div className="frameorder-mack-boards">
                          {item.mack_boards && item.mack_boards.length > 0 ? (
                            <div className="frameorder-mack-boards-list">
                              {item.mack_boards.slice(0, 2).map((mb, idx) => (
                                <div key={idx} className="frameorder-mack-board-tag">
                                  {mb.mack_board?.board_name || 'N/A'} ({mb.mack_board_color?.color_name || 'N/A'})
                                </div>
                              ))}
                              {item.mack_boards.length > 2 && (
                                <div className="frameorder-mack-board-more">
                                  +{item.mack_boards.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="frameorder-no-data">None</span>
                          )}
                        </div>
                      </td>
                      <td className="frameorder-td">
                        <span className="frameorder-print-size">
                          {item.print_width || 'N/A'} x {item.print_height || 'N/A'} {item.print_unit}
                        </span>
                      </td>
                      <td className="frameorder-td">
                        <div className="frameorder-media-info">
                          <span className="frameorder-media-type">
                            {item.media_type || 'None'}
                          </span>
                          {item.media_type === 'Photopaper' && item.paper_type && (
                            <div className="frameorder-paper-type">({item.paper_type})</div>
                          )}
                        </div>
                      </td>
                      <td className="frameorder-td">
                        <div className="frameorder-fit-info">
                          <span className="frameorder-fit-type">
                            {item.fit || 'None'}
                          </span>
                          {item.fit === 'bordered' && (
                            <div className="frameorder-border-info">
                              Border: {item.border_depth || 0}px, {item.border_color || '#ffffff'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="frameorder-td">
                        <span className="frameorder-price">
                          ${item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}
                        </span>
                      </td>
                      <td className="frameorder-td">
                        {isAdmin ? (
                          <div className="frameorder-status-select-wrapper">
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                              disabled={updatingStatus[item.id]}
                              className="frameorder-status-select"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                            </select>
                            {updatingStatus[item.id] ? (
                              <Loader2 className="frameorder-status-loading" />
                            ) : (
                              <ChevronDown className="frameorder-status-chevron" />
                            )}
                          </div>
                        ) : (
                          <span className={getStatusBadge(item.status)}>
                            {item.status || 'Unknown'}
                          </span>
                        )}
                      </td>
                      <td className="frameorder-td">
                        <div className="frameorder-date-info">
                          <Clock className="frameorder-date-icon" />
                          <span className="frameorder-date-text">
                            {format(new Date(item.created_at), 'MM/dd/yyyy HH:mm:ss')}
                          </span>
                        </div>
                      </td>
                      <td className="frameorder-td">
                        <div className="frameorder-actions">
                          {(isAdmin || item.user?.id === user?.id) && item.original_image && (
                            <button
                              className="frameorder-action-btn frameorder-download-btn"
                              onClick={() => handleDownloadImage(item.original_image)}
                            >
                              <Download className="frameorder-action-icon" />
                              Download
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              className="frameorder-action-btn frameorder-delete-btn"
                              onClick={() => handleDeleteOrder(item.id)}
                            >
                              <Trash2 className="frameorder-action-icon" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRows[item.id] && (
                      <tr className="frameorder-expanded-row">
                        <td colSpan="12" className="frameorder-expanded-cell">
                          <div className="frameorder-details-container">
                            <div className="frameorder-details-header">
                              <AlertCircle className="frameorder-details-icon" />
                              <h4 className="frameorder-details-title">
                                Order Details (ID: {item.id})
                              </h4>
                            </div>
                            
                            <div className="frameorder-details-grid">
                              {/* Left Column */}
                              <div className="frameorder-details-column">
                                <div className="frameorder-detail-group">
                                  <h5 className="frameorder-detail-group-title">Product Information</h5>
                                  <div className="frameorder-detail-items">
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Custom Size:</span>
                                      <span className="frameorder-detail-value">
                                        {item.custom_width || 'N/A'} x {item.custom_height || 'N/A'}
                                      </span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Color Variant:</span>
                                      <span className="frameorder-detail-value">{item.color_variant?.name || 'None'}</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Size Variant:</span>
                                      <span className="frameorder-detail-value">{item.size_variant?.name || 'None'}</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Finish Variant:</span>
                                      <span className="frameorder-detail-value">{item.finish_variant?.name || 'None'}</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Hanging Variant:</span>
                                      <span className="frameorder-detail-value">{item.hanging_variant?.name || 'None'}</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Custom Frame Color:</span>
                                      <span className="frameorder-detail-value">{item.custom_frame_color || 'None'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column */}
                              <div className="frameorder-details-column">
                                <div className="frameorder-detail-group">
                                  <h5 className="frameorder-detail-group-title">Transformations</h5>
                                  <div className="frameorder-detail-items">
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">X Position:</span>
                                      <span className="frameorder-detail-value">{item.transform_x || 0}</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Y Position:</span>
                                      <span className="frameorder-detail-value">{item.transform_y || 0}</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Scale:</span>
                                      <span className="frameorder-detail-value">{item.scale || 1}</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Rotation:</span>
                                      <span className="frameorder-detail-value">{item.rotation || 0}°</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Frame Rotation:</span>
                                      <span className="frameorder-detail-value">{item.frame_rotation || 0}°</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Frame Depth:</span>
                                      <span className="frameorder-detail-value">{item.frame_depth || 0}px</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Border Unit:</span>
                                      <span className="frameorder-detail-value">{item.border_unit || 'N/A'}</span>
                                    </div>
                                    <div className="frameorder-detail-item">
                                      <span className="frameorder-detail-label">Updated At:</span>
                                      <span className="frameorder-detail-value">
                                        {format(new Date(item.updated_at), 'MM/dd/yyyy HH:mm:ss')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Mack Boards Section */}
                            <div className="frameorder-mack-boards-section">
                              <h5 className="frameorder-detail-group-title">Mack Boards Configuration</h5>
                              {item.mack_boards && item.mack_boards.length > 0 ? (
                                <div className="frameorder-mack-boards-grid">
                                  {item.mack_boards.map((mb) => (
                                    <div key={mb.id} className="frameorder-mack-board-card">
                                      <div className="frameorder-mack-board-header">
                                        <span className="frameorder-mack-board-name">
                                          {mb.mack_board?.board_name || 'N/A'}
                                        </span>
                                        <span className="frameorder-mack-board-color">
                                          {mb.mack_board_color?.color_name || 'N/A'}
                                        </span>
                                      </div>
                                      <div className="frameorder-mack-board-details">
                                        <div className="frameorder-mack-board-detail">
                                          Width: <span className="frameorder-mack-board-value">{mb.width}px</span>
                                        </div>
                                        <div className="frameorder-mack-board-detail">
                                          Position: <span className="frameorder-mack-board-value">{mb.position}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="frameorder-no-mack-boards">No mack boards assigned to this order</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="frameorder-summary">
          <div className="frameorder-summary-content">
            <div className="frameorder-summary-left">
              <div className="frameorder-summary-icon-wrapper">
                <Package className="frameorder-summary-icon" />
              </div>
              <div className="frameorder-summary-info">
                <p className="frameorder-summary-title">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
                </p>
                <p className="frameorder-summary-subtitle">
                  {startDate || endDate ? 'In selected date range' : 'Total orders'}
                </p>
              </div>
            </div>
            <div className="frameorder-summary-right">
              <p className="frameorder-revenue-label">Total Revenue</p>
              <p className="frameorder-revenue-amount">${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdersView;