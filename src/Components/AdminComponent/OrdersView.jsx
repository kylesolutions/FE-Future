import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

const BASE_URL = 'http://82.180.146.4:8001';

function OrdersView() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user); // Access user state from Redux
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
    }
  };

  // Delete an order
  const handleDeleteOrder = async (itemId) => {
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
        const fullUrl = getImageUrl(imagePath); // Get the correct full URL
        console.log('Downloading image from:', fullUrl); // Debug log
        const response = await axios.get(fullUrl, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob', // Handle binary data
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = imagePath.split('/').pop() || 'original_image.jpg'; // Extract filename
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

  // Calculate total cost
  const totalCost = filteredOrders.reduce(
    (sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0),
    0
  );

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (filteredOrders.length === 0)
    return <div className="text-center mt-5">No orders found for the selected date range</div>;

  return (
    <div className="container mt-5">
      <h2>Orders Report</h2>
      <div className="mb-4">
        <div className="d-flex gap-3 flex-wrap">
          <div>
            <label className="form-label">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="MM/dd/yyyy"
              className="form-control"
              placeholderText="Select start date"
              isClearable
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="MM/dd/yyyy"
              className="form-control"
              placeholderText="Select end date"
              isClearable
            />
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Image</th>
              <th>User</th>
              <th>Frame</th>
              <th>Print Size</th>
              <th>Media Type</th>
              <th>Fit</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((item) => (
              <tr key={item.id}>
                <td>
                  <img
                    src={getImageUrl(item.adjusted_image || item.cropped_image || item.original_image)}
                    alt="Item"
                    style={{ height: '50px', width: '50px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/50x50?text=Image+Not+Found';
                    }}
                  />
                </td>
                <td>{item.user?.username || item.user || 'Unknown'}</td>
                <td>{item.frame?.name || 'None'}</td>
                <td>
                  {item.print_width || 'N/A'} x {item.print_height || 'N/A'} {item.print_unit}
                </td>
                <td>
                  {item.media_type || 'None'}
                  {item.media_type === 'Photopaper' && item.paper_type && ` (${item.paper_type})`}
                </td>
                <td>
                  {item.fit || 'None'}
                  {item.fit === 'bordered' && (
                    <div>
                      <small>
                        Border: {item.border_depth || 0}px, {item.border_color || '#ffffff'}
                      </small>
                    </div>
                  )}
                </td>
                <td>${item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}</td>
                <td>{item.status}</td>
                <td>{format(new Date(item.created_at), 'MM/dd/yyyy HH:mm:ss')}</td>
                <td>
                  <div className="d-flex gap-2">
                    {(isAdmin || item.user?.id === user?.id) && item.original_image && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDownloadImage(item.original_image)}
                      >
                        <i className="bi bi-download"></i> Download
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteOrder(item.id)}
                      >
                        <i className="bi bi-trash"></i> Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <p>
          <strong>Total Cost (Filtered Orders):</strong> ${totalCost.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

export default OrdersView;