import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

const BASE_URL = 'http://82.180.146.4:8000';

function OrdersView() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigate = useNavigate();

  // Fetch all saved orders on component mount
  useEffect(() => {
    const fetchSavedOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await axios.get(`${BASE_URL}/save-items/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedOrders(response.data);
        setFilteredOrders(response.data); // Initialize filtered orders
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

  // Filter orders based on date range
  useEffect(() => {
    let filtered = savedOrders;
    if (startDate || endDate) {
      filtered = savedOrders.filter((item) => {
        const orderDate = new Date(item.created_at);
        const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
        const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
        return (
          (!start || orderDate >= start) &&
          (!end || orderDate <= end)
        );
      });
    }
    setFilteredOrders(filtered);
  }, [startDate, endDate, savedOrders]);

  // Construct image URLs
  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/50x50?text=Image+Not+Found';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Calculate total cost for filtered orders
  const totalCost = filteredOrders.reduce((sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0), 0);

  // Loading state
  if (loading) return <div className="text-center mt-5">Loading...</div>;

  // Empty state
  if (filteredOrders.length === 0) return <div className="text-center mt-5">No orders found for the selected date range</div>;

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
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/50x50?text=Image+Not+Found'; }}
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
                      <small>Border: {item.border_depth || 0}px, {item.border_color || '#ffffff'}</small>
                    </div>
                  )}
                </td>
                <td>${item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}</td>
                <td>{item.status || 'Pending'}</td>
                <td>{format(new Date(item.created_at), 'MM/dd/yyyy HH:mm:ss')}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/', { state: { cartItem: {
                      id: item.id,
                      original_image: item.original_image ? getImageUrl(item.original_image) : null,
                      cropped_image: item.cropped_image ? getImageUrl(item.cropped_image) : null,
                      adjusted_image: item.adjusted_image ? getImageUrl(item.adjusted_image) : null,
                      frame: item.frame || null,
                      color_variant: item.color_variant || null,
                      size_variant: item.size_variant || null,
                      finish_variant: item.finish_variant || null,
                      hanging_variant: item.hanging_variant || null,
                      transform_x: item.transform_x || 0,
                      transform_y: item.transform_y || 0,
                      scale: item.scale || 1,
                      rotation: item.rotation || 0,
                      frame_rotation: item.frame_rotation || 0,
                      print_width: item.print_width || null,
                      print_height: item.print_height || null,
                      print_unit: item.print_unit || 'inches',
                      media_type: item.media_type || 'Photopaper',
                      paper_type: item.paper_type || null,
                      fit: item.fit || 'borderless',
                      border_depth: item.border_depth || 0,
                      border_color: item.border_color || '#ffffff',
                      status: item.status || 'pending',
                    } } })}
                  >
                    <i className="bi bi-pencil-square"></i> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <p><strong>Total Cost (Filtered Orders):</strong> ${totalCost.toFixed(2)}</p>
      </div>
    </div>
  );
}

export default OrdersView;