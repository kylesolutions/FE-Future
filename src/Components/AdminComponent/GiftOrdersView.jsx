import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Download, Trash2 } from 'lucide-react';

const BASE_URL = 'http://localhost:8000';

function GiftOrdersView() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null); // Track which order is being deleted
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const isAdmin = user.is_staff || user.is_superuser;

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
        console.log('Fetched gift orders:', processedOrders);
        setOrders(processedOrders);
        setFilteredOrders(processedOrders);
        setError(null);
      } catch (error) {
        console.error('Error fetching gift orders:', error);
        console.error('Server response:', error.response?.data);
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
    setDeleting(orderId);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      await axios.delete(`${BASE_URL}/gift-orders/${orderId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prevOrders) => prevOrders.filter((item) => item.id !== orderId));
      setFilteredOrders((prevFiltered) => prevFiltered.filter((item) => item.id !== orderId));
      alert('Order deleted successfully.');
    } catch (error) {
      console.error('Error deleting order:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        alert('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to delete this order.');
      } else if (error.response?.status === 404) {
        alert('Order not found.');
      } else {
        alert('Failed to delete order: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setDeleting(null);
    }
  };

  // Handle downloading an image
  const handleDownloadImage = async (imagePath) => {
    if (!imagePath) {
      alert('No image available for download.');
      return;
    }
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
      const filename = imagePath.split('/').pop() || 'gift_order_image.jpg';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error, 'imagePath:', imagePath);
      alert('Failed to download image: ' + (error.response?.statusText || error.message));
    }
  };

  // Construct image URLs
  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/50x50?text=Image+Not+Found';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Calculate total cost
  const totalCost = filteredOrders.reduce(
    (sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0),
    0
  );

  if (loading) {
    return (
      <div className="gift-loading-container">
        <div className="gift-loading-content">
          <div className="gift-loading-spinner"></div>
          <p>Loading gift orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gift-error-container">
        <div className="gift-error-content">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="gift-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return <div className="gift-empty-state">No gift orders found for the selected date range</div>;
  }

  return (
    <div className="gift-orders-workspace">
      <style>{`
        /* Gift Orders Workspace Styles */
        .gift-orders-workspace {
          min-height: 100vh;
          background: linear-gradient(135deg, #f1eedd 0%, #e7d98a 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* Loading States */
        .gift-loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #f1eedd 0%, #e7d98a 100%);
        }

        .gift-loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 40px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          color: #4a5568;
        }

        .gift-loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(102, 126, 234, 0.2);
          border-top: 4px solid #e7d98a;
          border-radius: 50%;
          animation: giftSpin 1s linear infinite;
        }

        @keyframes giftSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Error Boundary */
        .gift-error-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .gift-error-content {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 400px;
        }

        .gift-error-content h3 {
          color: #e53e3e;
          margin-bottom: 16px;
          font-size: 24px;
          font-weight: 600;
        }

        .gift-error-content p {
          color: #718096;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .gift-retry-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #FFD700 0%, #998304 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .gift-retry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        /* Main Content */
        .gift-main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          margin-bottom: 200px; /* Space for footer */
        }

        .gift-orders-title {
          color: #2d3748;
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 16px;
          text-align: center;
        }

        .gift-orders-subtitle {
          color: #718096;
          font-size: 16px;
          margin-bottom: 32px;
          text-align: center;
        }

        /* Date Filter */
        .gift-date-filter {
          display: flex;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .gift-date-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .gift-date-label {
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
        }

        .gift-datepicker {
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          background: white;
          transition: all 0.2s ease;
          color: #2d3748;
        }

        .gift-datepicker:focus {
          outline: none;
          border-color: #e7d98a;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        /* Table Styles */
        .gift-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .gift-table th,
        .gift-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid rgba(102, 126, 234, 0.1);
        }

        .gift-table th {
          background: #2d3748;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .gift-table td {
          font-size: 14px;
          color: #4a5568;
        }

        .gift-table img {
          height: 50px;
          width: 50px;
          object-fit: cover;
          border-radius: 8px;
        }

        .gift-table-actions {
          display: flex;
          gap: 12px;
        }

        .gift-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .gift-action-btn.download {
          background: #48bb78;
          color: white;
        }

        .gift-action-btn.download:hover {
          background: #38a169;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
        }

        .gift-action-btn.delete {
          background: #e53e3e;
          color: white;
        }

        .gift-action-btn.delete:hover {
          background: #c53030;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(229, 62, 62, 0.3);
        }

        .gift-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .gift-btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: giftSpin 1s linear infinite;
        }

        /* Empty State */
        .gift-empty-state {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          color: #4a5568;
          font-size: 16px;
          margin: 40px auto;
          max-width: 500px;
        }

        /* Total Cost */
        .gift-total-cost {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: rgba(102, 126, 234, 0.05);
          border: 1px solid rgba(102, 126, 234, 0.1);
          border-radius: 12px;
          margin-top: 24px;
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
        }

        .gift-total-cost span {
          color: #e7d98a;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .gift-orders-workspace {
            padding: 15px;
          }

          .gift-main-content {
            padding: 24px;
            margin-bottom: 250px;
          }

          .gift-orders-title {
            font-size: 24px;
          }

          .gift-orders-subtitle {
            font-size: 14px;
          }

          .gift-date-filter {
            gap: 16px;
            flex-direction: column;
          }

          .gift-table th,
          .gift-table td {
            padding: 12px;
            font-size: 13px;
          }

          .gift-table img {
            height: 40px;
            width: 40px;
          }

          .gift-action-btn {
            padding: 6px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .gift-orders-workspace {
            padding: 10px;
          }

          .gift-main-content {
            padding: 16px;
          }

          .gift-orders-title {
            font-size: 20px;
          }

          .gift-date-filter {
            gap: 12px;
          }

          .gift-datepicker {
            font-size: 13px;
          }

          .gift-table th,
          .gift-table td {
            padding: 8px;
            font-size: 12px;
          }

          .gift-table img {
            height: 30px;
            width: 30px;
          }

          .gift-action-btn {
            padding: 5px 10px;
            font-size: 11px;
          }

          .gift-total-cost {
            font-size: 16px;
          }
        }

        /* Smooth Animations */
        * {
          box-sizing: border-box;
        }

        .gift-orders-workspace * {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Custom Scrollbar */
        .gift-main-content::-webkit-scrollbar {
          width: 6px;
        }

        .gift-main-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }

        .gift-main-content::-webkit-scrollbar-thumb {
          background: rgba(102, 126, 234, 0.3);
          border-radius: 3px;
        }

        .gift-main-content::-webkit-scrollbar-thumb:hover {
          background: rgba(102, 126, 234, 0.5);
        }
      `}</style>
      <div className="gift-main-content">
        <h2 className="gift-orders-title">{isAdmin ? 'Gift Orders Report' : 'Your Gift Orders'}</h2>
        <h4 className="gift-orders-subtitle">{isAdmin ? 'All Users' : `Orders for ${user.username || 'You'}`}</h4>
        <div className="gift-date-filter">
          <div className="gift-date-group">
            <label className="gift-date-label">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="MM/dd/yyyy"
              className="gift-datepicker"
              placeholderText="Select start date"
              isClearable
            />
          </div>
          <div className="gift-date-group">
            <label className="gift-date-label">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="MM/dd/yyyy"
              className="gift-datepicker"
              placeholderText="Select end date"
              isClearable
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="gift-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Preview Image</th>
                <th>User</th>
                <th>Item Type</th>
                <th>Item ID</th>
                <th>Image Position X</th>
                <th>Image Position Y</th>
                <th>Image Scale X</th>
                <th>Image Scale Y</th>
                <th>Image Rotation</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={`gift-${order.id}`}>
                  <td>
                    <img
                      src={getImageUrl(order.uploaded_image)}
                      alt="Uploaded Image"
                      onError={(e) => {
                        console.log('Image failed to load:', e.target.src);
                        e.target.src = 'https://via.placeholder.com/50x50?text=Image+Not+Found';
                      }}
                    />
                  </td>
                  <td>
                    <img
                      src={getImageUrl(order.preview_image)}
                      alt="Preview Image"
                      onError={(e) => {
                        console.log('Image failed to load:', e.target.src);
                        e.target.src = 'https://via.placeholder.com/50x50?text=Image+Not+Found';
                      }}
                    />
                  </td>
                  <td>{order.user || 'Unknown'}</td>
                  <td>{order.content_type || 'Unknown'}</td>
                  <td>{order.object_id || 'N/A'}</td>
                  <td>{order.image_position_x || 'N/A'}</td>
                  <td>{order.image_position_y || 'N/A'}</td>
                  <td>{order.image_scale_x || 'N/A'}</td>
                  <td>{order.image_scale_y || 'N/A'}</td>
                  <td>{order.image_rotation || 'N/A'}</td>
                  <td>${parseFloat(order.total_price || 0).toFixed(2)}</td>
                  <td>{order.status || 'Pending'}</td>
                  <td>{format(new Date(order.created_at), 'MM/dd/yyyy HH:mm:ss')}</td>
                  <td className="gift-table-actions">
                    
                      <button
                        className="gift-action-btn download"
                        onClick={() => handleDownloadImage(order.uploaded_image)}
                      >
                        <Download size={16} />
                        Download
                      </button>
                    
                    
                      <button
                        className="gift-action-btn delete"
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deleting === order.id}
                      >
                        {deleting === order.id ? (
                          <div className="gift-btn-spinner"></div>
                        ) : (
                          <>
                            <Trash2 size={16} />
                            Delete
                          </>
                        )}
                      </button>
                    
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="gift-total-cost">
          <span>Total Cost:</span>
          <span>${totalCost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default GiftOrdersView;