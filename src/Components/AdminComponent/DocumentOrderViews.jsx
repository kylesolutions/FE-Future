import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const BASE_URL = 'http://82.180.146.4:8001';

function DocumentOrderViews() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const isAdmin = user.is_staff || user.is_superuser;

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

        const response = await axios.get(`${BASE_URL}/api/document-print-orders/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const processedOrders = response.data.map(item => ({ ...item, type: 'document' }));
        console.log('Fetched document orders:', processedOrders);
        setOrders(processedOrders);
        setFilteredOrders(processedOrders);
        setError(null);
      } catch (error) {
        console.error('Error fetching document orders:', error);
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
      await axios.delete(`${BASE_URL}/api/document-print-orders/${orderId}/`, {
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
    }
  };

  // Handle downloading a file
  const handleDownloadFile = async (filePath) => {
    if (!filePath) {
      alert('No file available for download.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const fullUrl = getFileUrl(filePath);
      console.log('Downloading file from:', fullUrl);
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
      console.error('Error downloading file:', error, 'filePath:', filePath);
      alert('Failed to download file: ' + (error.response?.statusText || error.message));
    }
  };

  // Handle submitting orders to payment (non-admins only)
  const handleSubmitOrder = () => {
    if (!isAdmin) {
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
    (sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0),
    0
  );

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;
  if (filteredOrders.length === 0)
    return <div className="text-center mt-5">No document orders found for the selected date range</div>;

  return (
    <div className="container mt-5">
      <h2 className="orders-title">{isAdmin ? 'Document Orders Report' : 'Your Document Orders'}</h2>
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
              <th>File</th>
              <th>User</th>
              <th>Print Type</th>
              <th>Print Size</th>
              <th>Paper Type</th>
              <th>Quantity</th>
              <th>Lamination</th>
              <th>Lamination Type</th>
              <th>Delivery Method</th>
              <th>Delivery Charge</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={`document-${order.id}`}>
                <td>
                  {order.file ? (
                    <a
                      href={getFileUrl(order.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDownloadFile(order.file);
                      }}
                    >
                      {order.file.split('/').pop() || 'View File'}
                    </a>
                  ) : (
                    'No File'
                  )}
                </td>
                <td>{order.username || order.user || 'Unknown'}</td>
                <td>{order.print_type_name || 'N/A'}</td>
                <td>{order.print_size_name || 'N/A'}</td>
                <td>{order.paper_type_name || 'N/A'}</td>
                <td>{order.quantity || 'N/A'}</td>
                <td>{order.lamination ? 'Yes' : 'No'}</td>
                <td>{order.lamination_type_name || 'N/A'}</td>
                <td>{order.delivery_method || 'N/A'}</td>
                <td>${parseFloat(order.delivery_charge || 0).toFixed(2)}</td>
                <td>${parseFloat(order.total_price).toFixed(2)}</td>
                <td>{order.status || 'Pending'}</td>
                <td>{format(new Date(order.created_at), 'MM/dd/yyyy HH:mm:ss')}</td>
                <td>
                  <div className="d-flex gap-2">
                    {(isAdmin || order.user_id === user.id) && order.file && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDownloadFile(order.file)}
                      >
                        <i className="bi bi-download"></i> Download
                      </button>
                    )}
                    {(isAdmin || order.user_id === user.id) && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteOrder(order.id)}
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
        <p><strong>Total Cost:</strong> ${totalCost.toFixed(2)}</p>
        {!isAdmin && filteredOrders.length > 0 && (
          <button className="btn btn-success" onClick={handleSubmitOrder}>
            Submit Order
          </button>
        )}
      </div>
    </div>
  );
}

export default DocumentOrderViews;