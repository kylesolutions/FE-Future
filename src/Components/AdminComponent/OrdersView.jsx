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
  const [expandedRows, setExpandedRows] = useState({}); // Track expanded rows
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

  if (loading || isLoading) return <div className="text-center mt-5">Loading...</div>;
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
          <thead className="table">
            <tr>
              <th></th> {/* For expand/collapse button */}
              <th>Image</th>
              <th>User</th>
              <th>Frame</th>
              <th>Mack Boards</th>
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
              <React.Fragment key={item.id}>
                <tr>
                  <td>
                    <button
                      className="btn btn-link btn-sm"
                      onClick={() => toggleRow(item.id)}
                    >
                      <i className={`bi ${expandedRows[item.id] ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                    </button>
                  </td>
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
                    {item.mack_boards && item.mack_boards.length > 0
                      ? item.mack_boards
                          .map((mb) => `${mb.mack_board?.board_name || 'N/A'} (${mb.mack_board_color?.color_name || 'N/A'})`)
                          .join(', ')
                      : 'None'}
                  </td>
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
                  <td>
                    {isAdmin ? (
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className="form-select form-select-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    ) : (
                      item.status
                    )}
                  </td>
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
                {expandedRows[item.id] && (
                  <tr>
                    <td colSpan="12">
                      <div className="p-3 bg-light">
                        <h5>Order Details (ID: {item.id})</h5>
                        <div className="row">
                          <div className="col-md-6">
                            <p><strong>Custom Size:</strong> {item.custom_width || 'N/A'} x {item.custom_height || 'N/A'}</p>
                            <p><strong>Color Variant:</strong> {item.color_variant?.name || 'None'}</p>
                            <p><strong>Size Variant:</strong> {item.size_variant?.name || 'None'}</p>
                            <p><strong>Finish Variant:</strong> {item.finish_variant?.name || 'None'}</p>
                            <p><strong>Hanging Variant:</strong> {item.hanging_variant?.name || 'None'}</p>
                            <p><strong>Custom Frame Color:</strong> {item.custom_frame_color || 'None'}</p>
                          </div>
                          <div className="col-md-6">
                            <p><strong>Transformations:</strong></p>
                            <ul>
                              <li>X: {item.transform_x || 0}</li>
                              <li>Y: {item.transform_y || 0}</li>
                              <li>Scale: {item.scale || 1}</li>
                              <li>Rotation: {item.rotation || 0}°</li>
                              <li>Frame Rotation: {item.frame_rotation || 0}°</li>
                            </ul>
                            <p><strong>Frame Depth:</strong> {item.frame_depth || 0}px</p>
                            <p><strong>Border Unit:</strong> {item.border_unit || 'N/A'}</p>
                            <p><strong>Updated At:</strong> {format(new Date(item.updated_at), 'MM/dd/yyyy HH:mm:ss')}</p>
                          </div>
                        </div>
                        <p><strong>Mack Boards:</strong></p>
                        {item.mack_boards && item.mack_boards.length > 0 ? (
                          <ul>
                            {item.mack_boards.map((mb) => (
                              <li key={mb.id}>
                                {mb.mack_board?.board_name || 'N/A'} ({mb.mack_board_color?.color_name || 'N/A'}) - 
                                Width: {mb.width}px, Position: {mb.position}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>None</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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