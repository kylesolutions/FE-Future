import React, { useState, useEffect } from 'react';
import axios from 'axios';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import './GiftOrdersView.css';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const BASE_URL = 'http://82.180.146.4:8001';

function GiftOrdersView() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const isAdmin = user.type === 'is_staff' || user.type === 'is_superuser';

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

  // Handle downloading an image
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
      const filename = imagePath.split('/').pop() || 'gift_order_image.jpg';
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

  // Handle submitting orders to payment (non-admins only)
  const handleSubmitOrder = () => {
    if (!isAdmin) {
      navigate('/payment', { state: { selectedOrders: filteredOrders } });
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
    return <div className="text-center mt-5">No gift orders found for the selected date range</div>;

  return (
    <div className="container mt-5">
      <h2 className="orders-title">{isAdmin ? 'Gift Orders Report' : 'Your Gift Orders'}</h2>
      <h4>{isAdmin ? 'All Users' : `Orders for ${user.username || 'You'}`}</h4>
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
                    alt="Order Image"
                    style={{ height: '50px', width: '50px', objectFit: 'cover' }}
                    onError={(e) => {
                      console.log('Image failed to load:', e.target.src);
                      e.target.src = 'https://via.placeholder.com/50x50?text=Image+Not+Found';
                    }}
                  />
                </td>
                <td>{order.username || order.user || 'Unknown'}</td>
                <td>{order.content_type.split(' | ')[1]}</td>
                <td>{order.object_id}</td>
                <td>{order.image_position_x}</td>
                <td>{order.image_position_y}</td>
                <td>{order.image_scale_x}</td>
                <td>{order.image_scale_y }</td>
                <td>{order.image_rotation}</td>
                <td>${parseFloat(order.total_price).toFixed(2)}</td>
                <td>{order.status || 'Pending'}</td>
                <td>{format(new Date(order.created_at), 'MM/dd/yyyy HH:mm:ss')}</td>
                <td>
                  <div className="d-flex gap-2">
                    {(isAdmin || order.user === user.id) && order.uploaded_image && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDownloadImage(order.uploaded_image)}
                      >
                        <i className="bi bi-download"></i> Download
                      </button>
                    )}
                    
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <i className="bi bi-trash"></i> Delete
                      </button>
                    
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GiftOrdersView;