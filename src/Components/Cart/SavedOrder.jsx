import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';


const BASE_URL = 'http://82.180.146.4:8001';

function SavedOrder() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    const fetchSavedOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await axios.get(`${BASE_URL}/save-items/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Raw response data:', response.data); // Log raw data
        console.log('Authenticated user:', user); // Log user details
        const orders = response.data.filter(item => {
          const status = item.status?.trim().toLowerCase(); // Normalize status
          console.log(`Item ${item.id} status: "${status}"`); // Log each item's status
          return status === 'pending';
        });
        console.log('Processed orders:', orders); // Log filtered orders
        setSavedOrders(orders);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching saved orders:', error);
        console.log('Error response:', error.response?.data); // Log error details
        setLoading(false);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };
    fetchSavedOrders();
  }, [navigate, user]);

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

  const handleSubmitOrder = () => {
    navigate('/payment', { state: { selectedOrders: savedOrders } });
  };

   const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/100x100?text=Image+Not+Found';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

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
                    <p><strong>Mack Boards:</strong> 
                      {item.mack_boards?.length > 0 
                        ? item.mack_boards.map((mb) => `${mb.mack_board.board_name} (${mb.width}px)`).join(', ')
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
                        mackBoards: item.mack_boards?.map((mb) => ({
                          mackBoard: mb.mack_board,
                          width: mb.width
                        })) || [],
                        color_variant: item.color_variant || null,
                        size_variant: item.size_variant || null,
                        finish_variant: item.finish_variant || null,
                        hanging_variant: item.hanging_variant || null,
                        transform_x: item.transform_x || 0,
                        transform_y: item.transform_y || 0,
                        scale: item.scale || 1,
                        rotation: item.rotation || 0,
                        frame_rotation: item.rotation || 0,
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