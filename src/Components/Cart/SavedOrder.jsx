import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const BASE_URL = 'http://82.180.146.4:8001';

function SavedOrder() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user); // Access user state from Redux
  const isAdmin = user.type === 'is_staff' || user.type === 'is_superuser';

  // Fetch saved orders on component mount
  useEffect(() => {
    const fetchSavedOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await axios.get(`${BASE_URL}/save-items/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // For non-admins, show only pending orders; admins see all orders
        const orders = isAdmin ? response.data : response.data.filter(item => item.status === 'pending');
        setSavedOrders(orders);
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
  }, [navigate, isAdmin]);

  // Remove a saved order
  const handleRemoveItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      await axios.delete(`${BASE_URL}/save-items/${itemId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedOrders((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  };

  // Navigate to payment page for a specific user's orders (for admins) or all pending orders (for non-admins)
  const handleSubmitOrder = (userId = null) => {
    const ordersToSubmit = userId
      ? savedOrders.filter((order) => order.user.id === userId)
      : savedOrders;
    navigate('/payment', { state: { selectedOrders: ordersToSubmit } });
  };

  // Construct image URLs
  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/100x100?text=Image+Not+Found';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Loading state
  if (loading) return <div className="text-center mt-5">Loading...</div>;

  // Empty state
  if (savedOrders.length === 0) return <div className="text-center mt-5">{isAdmin ? 'No orders found' : 'You have no pending orders'}</div>;

  // Group orders by user for admins
  const ordersByUser = isAdmin
    ? savedOrders.reduce((acc, item) => {
        const userId = item.user?.id || 'unknown';
        if (!acc[userId]) {
          acc[userId] = {
            username: item.user?.username || item.user || 'Unknown',
            orders: [],
          };
        }
        acc[userId].orders.push(item);
        return acc;
      }, {})
    : { [user.id || 'current']: { username: user.username || 'You', orders: savedOrders } };

  // Calculate total cost for all displayed orders
  const totalCost = savedOrders.reduce((sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0), 0);

  return (
    <div className="container mt-5">
      <h2>{isAdmin ? 'All Orders (Admin View)' : 'Your Pending Orders'}</h2>
      {Object.entries(ordersByUser).map(([userId, { username, orders }]) => (
        <div key={userId} className="mb-5">
          <h4>Orders for {username}</h4>
          <div className="row">
            {orders.map((item) => (
              <div key={item.id} className="col-12 mb-3">
                <div className="card">
                  <div className="card-body d-flex justify-content-between align-items-center">
                    <div className="d-flex">
                      <div>
                        <img
                          src={getImageUrl(item.adjusted_image || item.cropped_image || item.original_image)}
                          alt="Adjusted item"
                          style={{ height: '100px', width: '100px', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/100x100?text=Image+Not+Found'; }}
                        />
                      </div>
                    </div>
                    <div className="flex-grow-1 mx-3">
                      <p><strong>Frame:</strong> {item.frame?.name || 'None'}</p>
                      {item.color_variant && <p><strong>Color:</strong> {item.color_variant.color_name}</p>}
                      {item.size_variant && <p><strong>Size:</strong> {item.size_variant.size_name}</p>}
                      {item.finish_variant && <p><strong>Finish:</strong> {item.finish_variant.finish_name}</p>}
                      {item.hanging_variant && <p><strong>Hanging:</strong> {item.hanging_variant.hanging_name}</p>}
                      {(item.print_width || item.print_height) && (
                        <p><strong>Print Size:</strong> {item.print_width || 'N/A'} x {item.print_height || 'N/A'} {item.print_unit}</p>
                      )}
                      <p><strong>Media Type:</strong> {item.media_type || 'None'}</p>
                      {item.media_type === 'Photopaper' && item.paper_type && (
                        <p><strong>Paper Type:</strong> {item.paper_type}</p>
                      )}
                      <p><strong>Fit:</strong> {item.fit || 'None'}</p>
                      <p><strong>Frame Depth:</strong> {item.frame_depth || 'None'} px</p>
                      {item.fit === 'bordered' && (
                        <>
                          <p><strong>Border Depth:</strong> {item.border_depth || 0} px</p>
                          <p><strong>Border Color:</strong> {item.border_color || '#ffffff'}</p>
                        </>
                      )}
                      <p><strong>Price:</strong> ${item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}</p>
                      {isAdmin && <p><strong>Status:</strong> {item.status || 'Pending'}</p>}
                    </div>
                    <div className="d-flex flex-column">
                      <button
                        className="btn btn-secondary mb-2"
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
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {isAdmin && (
            <div className="mt-3">
              <button
                className="btn btn-success"
                onClick={() => handleSubmitOrder(userId)}
              >
                Submit Order for {username}
              </button>
            </div>
          )}
        </div>
      ))}
      {!isAdmin && (
        <div className="mt-3">
          <p><strong>Total Cost:</strong> ${totalCost.toFixed(2)}</p>
          <button className="btn btn-success" onClick={() => handleSubmitOrder()}>
            Submit Order
          </button>
        </div>
      )}
    </div>
  );
}

export default SavedOrder;
