import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const BASE_URL = 'http://localhost:8000';

function SavedOrder() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    const fetchSavedOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        // Fetch SavedItems
        const savedItemsResponse = await axios.get(`${BASE_URL}/save-items/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Raw SavedItems response:', savedItemsResponse.data);

        // Fetch GiftOrders
        const giftOrdersResponse = await axios.get(`${BASE_URL}/gift-orders/list/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Raw GiftOrders response:', giftOrdersResponse.data);

        console.log('Authenticated user:', user);

        // Combine and process orders
        const savedItems = savedItemsResponse.data
          .filter(item => item.status?.trim().toLowerCase() === 'pending')
          .map(item => ({ ...item, type: 'frame' }));
        const giftOrders = giftOrdersResponse.data
          .filter(item => item.status?.trim().toLowerCase() === 'pending')
          .map(item => ({ ...item, type: 'gift' }));
        const orders = [...savedItems, ...giftOrders];
        console.log('Processed orders:', orders);

        setSavedOrders(orders);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching saved orders:', error);
        setError(error.response?.data?.detail || error.message || 'Failed to load saved orders. Please try again.');
        console.log('Error response:', error.response?.data);
        setLoading(false);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };
    fetchSavedOrders();
  }, [navigate, user]);

  const handleRemoveItem = async (itemId, itemType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const endpoint = itemType === 'gift' 
        ? `${BASE_URL}/gift-orders/${itemId}/`
        : `${BASE_URL}/save-items/${itemId}/`;

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedOrders((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to remove item. Please try again.');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  };

  const handleSubmitOrder = () => {
    navigate('/payment', { state: { selectedOrders: savedOrders } });
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/100x100?text=Image+Not+Found';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;
  if (savedOrders.length === 0) {
    console.log('No pending orders after processing. User:', user);
    return <div className="text-center mt-5">You have no pending orders</div>;
  }

  return (
    <div className="container mt-5">
      <h2>Your Pending Orders</h2>
      <div className="mb-5">
        <h4>Orders for {user.username || 'You'}</h4>
        <div className="row">
          {savedOrders.map((item) => (
            <div key={`${item.type}-${item.id}`} className="col-12 mb-3">
              <div className="card">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div className="d-flex">
                    <div>
                      <img
                        src={getImageUrl(item.adjusted_image || item.cropped_image || item.uploaded_image || item.original_image)}
                        alt="Order item"
                        style={{ height: '100px', width: '100px', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100x100?text=Image+Not+Found'; }}
                      />
                    </div>
                  </div>
                  <div className="flex-grow-1 mx-3">
                    {item.type === 'gift' ? (
                      <>
                        <p><strong>Item Type:</strong> {item.content_type.split(' | ')[1]}</p>
                        <p><strong>Item ID:</strong> {item.object_id}</p>
                        <p><strong>Price:</strong> ${parseFloat(item.total_price).toFixed(2)}</p>
                        <p><strong>Created At:</strong> {formatDate(item.created_at)}</p>
                        <p><strong>Status:</strong> {item.status || 'Pending'}</p>
                      </>
                    ) : (
                      <>
                        <p><strong>Frame:</strong> {item.frame?.name || 'None'}</p>
                        <p><strong>Mack Boards:</strong>
                          {item.mack_boards?.length > 0
                            ? item.mack_boards.map((mb) => `${mb.mack_board?.board_name || 'Unknown'} (${mb.width}px${mb.color ? `, ${mb.color}` : ''})`).join(', ')
                            : 'None'}
                        </p>
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
                        <p><strong>Status:</strong> {item.status || 'Pending'}</p>
                      </>
                    )}
                  </div>
                  <div className="d-flex flex-column">
                    <button
                      className="btn btn-secondary mb-2"
                      onClick={() => navigate(item.type === 'gift' ? '/gift-designer' : '/', {
                        state: {
                          cartItem: {
                            id: item.id,
                            type: item.type,
                            original_image: item.original_image ? getImageUrl(item.original_image) : null,
                            cropped_image: item.cropped_image ? getImageUrl(item.cropped_image) : null,
                            adjusted_image: item.adjusted_image ? getImageUrl(item.adjusted_image) : null,
                            uploaded_image: item.uploaded_image ? getImageUrl(item.uploaded_image) : null,
                            frame: item.frame || null,
                            mack_boards: item.mack_boards?.map((mb) => ({
                              mack_board: mb.mack_board,
                              width: mb.width,
                              color: mb.color,
                            })) || [],
                            color_variant: item.color_variant || null,
                            size_variant: item.size_variant || null,
                            finish_variant: item.finish_variant || null,
                            hanging_variant: item.hanging_variant || null,
                            transform_x: item.transform_x || item.image_position_x || 0,
                            transform_y: item.transform_y || item.image_position_y || 0,
                            scale: item.scale || Math.min(item.image_scale_x || 1, item.image_scale_y || 1),
                            rotation: item.rotation || item.image_rotation || 0,
                            frame_rotation: item.frame_rotation || 0,
                            print_width: item.print_width || null,
                            print_height: item.print_height || null,
                            print_unit: item.print_unit || 'inches',
                            media_type: item.media_type || 'Photopaper',
                            paper_type: item.paper_type || null,
                            fit: item.fit || 'borderless',
                            border_depth: item.border_depth || 0,
                            border_color: item.border_color || '#ffffff',
                            border_unit: item.border_unit || 'px',
                            status: item.status || 'pending',
                            custom_frame_color: item.custom_frame_color || null,
                            content_type: item.content_type || null,
                            object_id: item.object_id || null,
                          }
                        }
                      })}
                    >
                      <i className="bi bi-pencil-square"></i> Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRemoveItem(item.id, item.type)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <p><strong>Total Cost:</strong> ${savedOrders.reduce((sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0), 0).toFixed(2)}</p>
          <button className="btn btn-success" onClick={() => handleSubmitOrder()}>
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default SavedOrder;