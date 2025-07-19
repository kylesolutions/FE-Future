import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'http://82.180.146.4:8001';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await axios.get(`${BASE_URL}/cart/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartItems(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cart:', error);
        setLoading(false);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };
    fetchCart();
  }, [navigate]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const response = await axios.put(`${BASE_URL}/cart/items/${itemId}/`, { quantity: newQuantity }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems((prevItems) => prevItems.map((item) => (item.id === itemId ? response.data : item)));
    } catch (error) {
      console.error('Error updating quantity:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      await axios.delete(`${BASE_URL}/cart/items/${itemId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/100x100?text=Image+Not+Found';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  if (cartItems.length === 0) return <div className="text-center mt-5">Your cart is empty</div>;

  const totalCost = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

  return (
    <div className="container mt-5">
      <h2>Your Cart</h2>
      <div className="row">
        {cartItems.map((item) => (
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
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  <p><strong>Price:</strong> ${parseFloat(item.total_price).toFixed(2)}</p>
                </div>
                <div className="d-flex flex-column">
                  <div className="btn-group mb-2">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                  </div>
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
                    } } })}
                  >
                    <i className="bi bi-pencil-square"></i>
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
        <p><strong>Total Cost:</strong> ${totalCost.toFixed(2)}</p>
        <button className="btn btn-success" onClick={() => alert('Checkout not implemented yet')}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default Cart;

