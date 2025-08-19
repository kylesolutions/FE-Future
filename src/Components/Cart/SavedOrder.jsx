import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FileText } from 'lucide-react';

const BASE_URL = 'http://82.180.146.4:8001';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>Something went wrong</h3>
            <p>{this.state.error?.message || 'Unknown error occurred'}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SavedOrder() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [printTypes, setPrintTypes] = useState([]);
  const [printSizes, setPrintSizes] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [laminationTypes, setLaminationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    const fetchSavedOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const [
          savedItemsResponse,
          giftOrdersResponse,
          simpleDocumentOrdersResponse,
          printTypesResponse,
          printSizesResponse,
          paperTypesResponse,
          laminationTypesResponse,
        ] = await Promise.all([
          axios.get(`${BASE_URL}/save-items/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch((err) => {
            console.error('SavedItems error:', err);
            return { data: [] };
          }),
          axios.get(`${BASE_URL}/gift-orders/list/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch((err) => {
            console.error('GiftOrders error:', err);
            return { data: [] };
          }),
          axios.get(`${BASE_URL}/api/orders/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch((err) => {
            console.error('SimpleDocumentOrders error:', err);
            return { data: [] };
          }),
          axios.get(`${BASE_URL}/api/print-types/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch((err) => {
            console.error('PrintTypes error:', err);
            return { data: [] };
          }),
          axios.get(`${BASE_URL}/api/print-sizes/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch((err) => {
            console.error('PrintSizes error:', err);
            return { data: [] };
          }),
          axios.get(`${BASE_URL}/api/paper-types/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch((err) => {
            console.error('PaperTypes error:', err);
            return { data: [] };
          }),
          axios.get(`${BASE_URL}/api/lamination-types/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch((err) => {
            console.error('LaminationTypes error:', err);
            return { data: [] };
          }),
        ]);

        console.log('Raw SavedItems response:', savedItemsResponse.data);
        console.log('Raw GiftOrders response:', giftOrdersResponse.data);
        console.log('Raw SimpleDocumentOrders response:', simpleDocumentOrdersResponse.data);
        console.log('Raw PrintTypes response:', printTypesResponse.data);
        console.log('Raw PrintSizes response:', printSizesResponse.data);
        console.log('Raw PaperTypes response:', paperTypesResponse.data);
        console.log('Raw LaminationTypes response:', laminationTypesResponse.data);
        console.log('Authenticated user:', user);

        setPrintTypes(printTypesResponse.data);
        setPrintSizes(printSizesResponse.data);
        setPaperTypes(paperTypesResponse.data);
        setLaminationTypes(laminationTypesResponse.data);

        const savedItems = savedItemsResponse.data
          .filter(item => (item.status || 'pending').trim().toLowerCase() === 'pending')
          .map(item => ({ ...item, type: 'frame' }));
        const giftOrders = giftOrdersResponse.data
          .filter(item => {
            console.log(`Gift order ${item.id} status: ${item.status || 'undefined'}`);
            return (item.status || 'pending').trim().toLowerCase() === 'pending';
          })
          .map(item => ({ ...item, type: 'gift' }));
        const simpleDocumentOrders = simpleDocumentOrdersResponse.data
          .filter(item => (item.status || 'pending').trim().toLowerCase() === 'pending')
          .map(item => ({
            ...item,
            type: 'simple_document',
            print_type: printTypesResponse.data.find(pt => pt.id === item.print_type) || { name: 'N/A' },
            print_size: printSizesResponse.data.find(ps => ps.id === item.print_size) || { name: 'N/A' },
            paper_type: paperTypesResponse.data.find(pt => pt.id === item.paper_type) || { name: 'N/A' },
            lamination_type: item.lamination ? (laminationTypesResponse.data.find(lt => lt.id === item.lamination_type) || { name: 'N/A' }) : null,
          }));
        const orders = [...savedItems, ...giftOrders, ...simpleDocumentOrders];
        console.log('Processed orders:', orders);

        setSavedOrders(orders);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching saved orders:', error);
        console.error('Error response:', error.response?.data);
        setError(error.response?.data?.detail || error.message || 'Failed to load saved orders. Please try again.');
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

      let endpoint;
      if (itemType === 'gift') {
        endpoint = `${BASE_URL}/gift-orders/${itemId}/`;
      } else if (itemType === 'simple_document') {
        endpoint = `${BASE_URL}/api/orders/${itemId}/`;
      } else {
        endpoint = `${BASE_URL}/save-items/${itemId}/`;
      }

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

  const formatContentType = (contentType) => {
    if (!contentType || typeof contentType !== 'string') {
      console.warn('Invalid contentType:', contentType);
      return 'Unknown';
    }
    return contentType.charAt(0).toUpperCase() + contentType.slice(1).replace('variant', ' Variant');
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;
  if (savedOrders.length === 0) {
    console.log('No pending orders after processing. User:', user);
    return <div className="text-center mt-5">You have no pending orders</div>;
  }

  return (
    <ErrorBoundary>
      <div className="container mt-5">
        <h2>Your Pending Orders</h2>
        <div className="mb-5">
          <h4>Orders for {user?.username || 'You'}</h4>
          <div className="row">
            {savedOrders.map((item) => (
              <div key={`${item.type}-${item.id}`} className="col-12 mb-3">
                <div className="card">
                  <div className="card-body d-flex justify-content-between align-items-center">
                    <div className="d-flex">
                      <div>
                        {item.type === 'document' || item.type === 'simple_document' ? (
                          <div style={{ height: '100px', width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
                            <FileText size={50} color="#6c757d" />
                          </div>
                        ) : (
                          <img
                            src={getImageUrl(item.adjusted_image || item.cropped_image || item.preview_image || item.original_image || '')}
                            alt="Order item"
                            style={{ height: '100px', width: '100px', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/100x100?text=Image+Not+Found'; }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex-grow-1 mx-3">
                      {item.type === 'gift' ? (
                        <>
                          <p><strong>Item Type:</strong> {formatContentType(item.content_type)}</p>
                          <p><strong>Item ID:</strong> {item.object_id || 'N/A'}</p>
                          <p><strong>Price:</strong> ${item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}</p>
                          <p><strong>Created At:</strong> {formatDate(item.created_at)}</p>
                          <p><strong>Status:</strong> {item.status || 'Pending'}</p>
                          {item.color && <p><strong>Color:</strong> {item.color}</p>}
                          {item.size && <p><strong>Size:</strong> {item.size}</p>}
                        </>
                      ) : item.type === 'simple_document' ? (
                        <>
                          <p><strong>Order Type:</strong> Simple Document Print</p>
                          <p><strong>Print Type:</strong> {item.print_type?.name || 'N/A'}</p>
                          <p><strong>Print Size:</strong> {item.print_size?.name || 'N/A'}</p>
                          <p><strong>Paper Type:</strong> {item.paper_type?.name || 'N/A'}</p>
                          <p><strong>Quantity:</strong> {item.quantity || 'N/A'}</p>
                          <p><strong>Lamination:</strong> {item.lamination ? 'Yes' : 'No'}</p>
                          {item.lamination && <p><strong>Lamination Type:</strong> {item.lamination_type?.name || 'N/A'}</p>}
                          <p><strong>Delivery Option:</strong> {item.delivery_option || 'N/A'}</p>
                          {item.delivery_option === 'delivery' && (
                            <p><strong>Address:</strong> {item.address_house_name}, {item.address_city}, {item.address_pin}</p>
                          )}
                          <p><strong>Price:</strong> ${item.total_amount ? parseFloat(item.total_amount).toFixed(2) : '0.00'}</p>
                          <p><strong>Created At:</strong> {formatDate(item.created_at)}</p>
                          <p><strong>Files:</strong> {item.files_data?.map(f => f.file.split('/').pop()).join(', ') || 'None'}</p>
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
            <p><strong>Total Cost:</strong> ${savedOrders.reduce((sum, item) => sum + (item.total_price || item.total_amount ? parseFloat(item.total_price || item.total_amount) : 0), 0).toFixed(2)}</p>
            <button className="btn btn-success" onClick={() => handleSubmitOrder()}>
              Submit Order
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default SavedOrder;