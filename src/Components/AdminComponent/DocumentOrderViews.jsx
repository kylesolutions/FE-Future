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
  FileText, 
  User, 
  DollarSign,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import './DocumentOrderViews.css';

const BASE_URL = 'http://82.180.146.4:8001';

function DocumentOrderViews() {
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

  // Fetch document orders on component mount
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

        const response = await axios.get(`${BASE_URL}/api/orders/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const processedOrders = response.data.map(item => ({ ...item, type: 'document' }));
        setOrders(processedOrders);
        setFilteredOrders(processedOrders);
        setError(null);
      } catch (error) {
        console.error('Error fetching document orders:', error);
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
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    setDeleting(orderId);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      
      await axios.delete(`${BASE_URL}/api/orders/${orderId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setOrders((prevOrders) => prevOrders.filter((item) => item.id !== orderId));
      setFilteredOrders((prevFiltered) => prevFiltered.filter((item) => item.id !== orderId));
      
      // Success notification could be added here
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

  // Handle downloading a file
  const handleDownloadFile = async (filePath, orderId) => {
    if (!filePath) {
      alert('No file available for download.');
      return;
    }
    
    setDownloading(orderId);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      
      const fullUrl = getFileUrl(filePath);
      const response = await axios.get(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = filePath.split('/').pop() || 'document_order_file.pdf';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file: ' + (error.response?.statusText || error.message));
    } finally {
      setDownloading(null);
    }
  };

  // Handle submitting orders to payment
  const handleSubmitOrder = () => {
    if (!isAdmin && filteredOrders.length > 0) {
      navigate('/payment', { state: { selectedOrders: filteredOrders } });
    }
  };

  // Construct file URLs
  const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Calculate total cost
  const totalCost = filteredOrders.reduce(
    (sum, item) => sum + (item.total_amount ? parseFloat(item.total_amount) : 0),
    0
  );

  // Reset filters
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (loading) {
    return (
      <div className="doc-orders-loading">
        <div className="doc-orders-loading-content">
          <div className="doc-orders-spinner"></div>
          <h3>Loading Orders</h3>
          <p>Please wait while we fetch your document orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doc-orders-error">
        <div className="doc-orders-error-content">
          <AlertTriangle className="doc-orders-error-icon" />
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="doc-orders-retry-btn"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-orders-container">
      <div className="doc-orders-header">
        <div className="doc-orders-header-content">
          <div className="doc-orders-title-section">
            <FileText className="doc-orders-main-icon" />
            <div>
              <h1 className="doc-orders-title">
                {isAdmin ? 'Document Orders Dashboard' : 'My Document Orders'}
              </h1>
              <p className="doc-orders-subtitle">
                {isAdmin ? 'Manage all customer orders' : `Welcome back, ${user?.username || 'User'}`}
              </p>
            </div>
          </div>
          
          <div className="doc-orders-stats">
            <div className="doc-orders-stat-card">
              <FileText size={20} />
              <div>
                <span className="doc-orders-stat-number">{filteredOrders.length}</span>
                <span className="doc-orders-stat-label">Orders</span>
              </div>
            </div>
            <div className="doc-orders-stat-card">
              <DollarSign size={20} />
              <div>
                <span className="doc-orders-stat-number">${totalCost.toFixed(2)}</span>
                <span className="doc-orders-stat-label">Total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="doc-orders-content">
        {/* Filters Section */}
        <div className="doc-orders-filters-card">
          <div className="doc-orders-filters-header">
            <div className="doc-orders-filters-title">
              <Filter size={18} />
              <span>Filter Orders</span>
            </div>
            <button 
              className="doc-orders-filters-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          
          {showFilters && (
            <div className="doc-orders-filters-content">
              <div className="doc-orders-date-filters">
                <div className="doc-orders-date-group">
                  <label className="doc-orders-date-label">
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
                    className="doc-orders-datepicker"
                    placeholderText="Select start date"
                    isClearable
                  />
                </div>
                <div className="doc-orders-date-group">
                  <label className="doc-orders-date-label">
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
                    className="doc-orders-datepicker"
                    placeholderText="Select end date"
                    isClearable
                  />
                </div>
              </div>
              
              {(startDate || endDate) && (
                <button 
                  className="doc-orders-reset-btn"
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
          <div className="doc-orders-empty">
            <FileText className="doc-orders-empty-icon" />
            <h3>No orders found</h3>
            <p>
              {startDate || endDate 
                ? "No orders match your selected date range. Try adjusting the filters."
                : "You haven't placed any document orders yet."
              }
            </p>
            {(startDate || endDate) && (
              <button className="doc-orders-reset-btn" onClick={resetFilters}>
                <RefreshCw size={16} />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="doc-orders-table-card">
            <div className="doc-orders-table-container">
              <table className="doc-orders-table">
                <thead>
                  <tr>
                    <th>Files</th>
                    <th>User</th>
                    <th>Print Details</th>
                    <th>Quantity</th>
                    <th>Delivery</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="doc-orders-table-row">
                      <td className="doc-orders-files-cell">
                        {order.files_data?.length > 0 ? (
                          <div className="doc-orders-files-list">
                            {order.files_data.map((f, idx) => (
                              <button
                                key={idx}
                                className="doc-orders-file-link"
                                onClick={() => handleDownloadFile(f.file, order.id)}
                                disabled={downloading === order.id}
                              >
                                <FileText size={14} />
                                <span>{f.file.split('/').pop()}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="doc-orders-no-files">No files</span>
                        )}
                      </td>
                      
                      <td className="doc-orders-user-cell">
                        <div className="doc-orders-user-info">
                          <User size={16} />
                          <span>{order.user || 'Unknown'}</span>
                        </div>
                      </td>
                      
                      <td className="doc-orders-details-cell">
                        <div className="doc-orders-print-details">
                          <div className="doc-orders-detail-item">
                            <strong>Type:</strong> {order.print_type_name || 'N/A'}
                          </div>
                          <div className="doc-orders-detail-item">
                            <strong>Size:</strong> {order.print_size_name || 'N/A'}
                          </div>
                          <div className="doc-orders-detail-item">
                            <strong>Paper:</strong> {order.paper_type_name || 'N/A'}
                          </div>
                          {order.lamination && (
                            <div className="doc-orders-detail-item">
                              <strong>Lamination:</strong> {order.lamination_type_name || 'Yes'}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="doc-orders-quantity-cell">
                        <span className="doc-orders-quantity-badge">
                          {order.quantity || 0}
                        </span>
                      </td>
                      
                      <td className="doc-orders-delivery-cell">
                        <div className="doc-orders-delivery-info">
                          <div className="doc-orders-delivery-method">
                            {order.delivery_option || 'N/A'}
                          </div>
                          {order.delivery_option === 'delivery' && (
                            <div className="doc-orders-address">
                              {`${order.address_house_name || ''}, ${order.address_city || ''}, ${order.address_pin || ''}`}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="doc-orders-amount-cell">
                        <span className="doc-orders-amount">
                          ${order.total_amount ? parseFloat(order.total_amount).toFixed(2) : '0.00'}
                        </span>
                      </td>
                      
                      <td className="doc-orders-date-cell">
                        <div className="doc-orders-date-info">
                          <Clock size={14} />
                          <span>{format(new Date(order.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      
                      <td className="doc-orders-actions-cell">
                        <div className="doc-orders-actions">
                          {(isAdmin || order.user === user?.username) && order.files_data?.length > 0 && (
                            <button
                              className="doc-orders-action-btn doc-orders-download-btn"
                              onClick={() => handleDownloadFile(order.files_data[0].file, order.id)}
                              disabled={downloading === order.id}
                            >
                              {downloading === order.id ? (
                                <div className="doc-orders-btn-spinner"></div>
                              ) : (
                                <Download size={16} />
                              )}
                            </button>
                          )}
                          
                          {(isAdmin || order.user === user?.username) && (
                            <button
                              className="doc-orders-action-btn doc-orders-delete-btn"
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={deleting === order.id}
                            >
                              {deleting === order.id ? (
                                <div className="doc-orders-btn-spinner"></div>
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary and Actions */}
        {filteredOrders.length > 0 && (
          <div className="doc-orders-summary-card">
            <div className="doc-orders-total-section">
              <div className="doc-orders-total-info">
                <div>
                  <span className="doc-orders-total-label">Total Amount</span>
                  <span className="doc-orders-total-amount">${totalCost.toFixed(2)}</span>
                </div>
              </div>
              
              {!isAdmin && (
                <button 
                  className="doc-orders-submit-btn"
                  onClick={handleSubmitOrder}
                >
                  <span>Submit Order</span>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
            
            <div className="doc-orders-summary-stats">
              <div className="doc-orders-summary-stat">
                <span className="doc-orders-summary-stat-label">Orders Selected</span>
                <span className="doc-orders-summary-stat-value">{filteredOrders.length}</span>
              </div>
              
              {startDate && endDate && (
                <div className="doc-orders-summary-stat">
                  <span className="doc-orders-summary-stat-label">Date Range</span>
                  <span className="doc-orders-summary-stat-value">
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

export default DocumentOrderViews;