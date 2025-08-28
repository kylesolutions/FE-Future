import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FileText, 
  Package, 
  Gift, 
  Trash2, 
  ShoppingCart, 
  Calendar,
  DollarSign,
  User,
  AlertCircle,
  Loader,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  MapPin,
  FileImage,
  Palette,
  Ruler,
  Layers
} from 'lucide-react';
import './SavedOrder.css';

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
            <AlertCircle className="error-icon" />
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

const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-content">
      <div className="loading-spinner">
        <Loader className="spinner-icon" />
      </div>
      <p className="loading-text">Loading your orders...</p>
    </div>
  </div>
);

const EmptyState = ({ user }) => (
  <div className="empty-state">
    <div className="empty-content">
      <div className="empty-icon-container">
        <Package className="empty-icon" />
      </div>
      <h2 className="empty-title">No Pending Orders</h2>
      <p className="empty-description">
        {user?.username || 'You'} don't have any pending orders at the moment.
      </p>
      <button 
        onClick={() => window.history.back()} 
        className="empty-action-btn"
      >
        Continue Shopping
      </button>
    </div>
  </div>
);

const ErrorState = ({ error }) => (
  <div className="error-state">
    <div className="error-state-content">
      <AlertCircle className="error-state-icon" />
      <h3 className="error-state-title">Unable to Load Orders</h3>
      <p className="error-state-description">{error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="error-state-btn"
      >
        Retry
      </button>
    </div>
  </div>
);

const OrderTypeIcon = ({ type }) => {
  switch (type) {
    case 'gift':
      return <Gift className="order-type-icon gift-icon" />;
    case 'simple_document':
      return <FileText className="order-type-icon document-icon" />;
    default:
      return <Package className="order-type-icon frame-icon" />;
  }
};

const OrderTypeBadge = ({ type }) => {
  const getBadgeClass = () => {
    switch (type) {
      case 'gift':
        return 'order-badge gift-badge';
      case 'simple_document':
        return 'order-badge document-badge';
      default:
        return 'order-badge frame-badge';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'gift':
        return 'Gift Order';
      case 'simple_document':
        return 'Document Print';
      default:
        return 'Frame Order';
    }
  };

  return (
    <span className={getBadgeClass()}>
      <OrderTypeIcon type={type} />
      {getLabel()}
    </span>
  );
};

const OrderCard = ({ item, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove(item.id, item.type);
    setIsRemoving(false);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatContentType = (contentType) => {
    if (!contentType || typeof contentType !== 'string') return 'Unknown';
    return contentType.charAt(0).toUpperCase() + contentType.slice(1).replace('variant', ' Variant');
  };

  const imageUrl = getImageUrl(item.adjusted_image || item.cropped_image || item.preview_image || item.original_image || '');
  const isDocument = item.type === 'document' || item.type === 'simple_document';
  const price = item.total_price || item.total_amount || 0;

  return (
    <div className="order-card">
      <div className="order-card-content">
        {/* Image/Icon Section */}
        <div className="order-image-section">
          {isDocument ? (
            <div className="document-placeholder">
              <FileText className="document-icon" />
            </div>
          ) : imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt="Order preview"
              className="order-image"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="image-placeholder">
              <ImageIcon className="placeholder-icon" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="order-details">
          <div className="order-header">
            <div className="order-meta">
              <OrderTypeBadge type={item.type} />
              <div className="order-date">
                <Calendar className="date-icon" />
                {formatDate(item.created_at)}
              </div>
            </div>
            <div className="order-price">
              <DollarSign className="price-icon" />
              {parseFloat(price).toFixed(2)}
            </div>
          </div>

          {/* Order Details */}
          <div className="order-info">
            {item.type === 'gift' ? (
              <div className="info-grid">
                <div className="info-item">
                  <Palette className="info-icon" />
                  <span className="info-label">Type:</span>
                  <span className="info-value">{formatContentType(item.content_type)}</span>
                </div>
                <div className="info-item">
                  <Package className="info-icon" />
                  <span className="info-label">ID:</span>
                  <span className="info-value">{item.object_id || 'N/A'}</span>
                </div>
                {item.color && (
                  <div className="info-item">
                    <div className="color-swatch" style={{ backgroundColor: item.color }}></div>
                    <span className="info-label">Color:</span>
                    <span className="info-value">{item.color}</span>
                  </div>
                )}
                {item.size && (
                  <div className="info-item">
                    <Ruler className="info-icon" />
                    <span className="info-label">Size:</span>
                    <span className="info-value">{item.size}</span>
                  </div>
                )}
              </div>
            ) : item.type === 'simple_document' ? (
              <div className="info-grid">
                <div className="info-item">
                  <FileText className="info-icon" />
                  <span className="info-label">Print Type:</span>
                  <span className="info-value">{item.print_type?.name || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <Ruler className="info-icon" />
                  <span className="info-label">Size:</span>
                  <span className="info-value">{item.print_size?.name || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <FileImage className="info-icon" />
                  <span className="info-label">Paper:</span>
                  <span className="info-value">{item.paper_type?.name || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <Package className="info-icon" />
                  <span className="info-label">Quantity:</span>
                  <span className="info-value">{item.quantity || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <Layers className="info-icon" />
                  <span className="info-label">Lamination:</span>
                  <span className={`lamination-badge ${item.lamination ? 'lamination-yes' : 'lamination-no'}`}>
                    {item.lamination ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="info-item">
                  <MapPin className="info-icon" />
                  <span className="info-label">Delivery:</span>
                  <span className="info-value">{item.delivery_option || 'N/A'}</span>
                </div>
                {item.delivery_option === 'delivery' && (
                  <div className="info-item full-width">
                    <MapPin className="info-icon" />
                    <span className="info-label">Address:</span>
                    <span className="info-value">
                      {item.address_house_name}, {item.address_city}, {item.address_pin}
                    </span>
                  </div>
                )}
                {item.files_data && item.files_data.length > 0 && (
                  <div className="info-item full-width">
                    <FileImage className="info-icon" />
                    <span className="info-label">Files:</span>
                    <span className="info-value">
                      {item.files_data.map(f => f.file.split('/').pop()).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="info-grid">
                {item.frame && (
                  <div className="info-item">
                    <Package className="info-icon" />
                    <span className="info-label">Frame:</span>
                    <span className="info-value">{item.frame.name}</span>
                  </div>
                )}
                {item.mack_boards?.length > 0 && (
                  <div className="info-item full-width">
                    <Layers className="info-icon" />
                    <span className="info-label">Mack Boards:</span>
                    <span className="info-value">
                      {item.mack_boards.map((mb) => 
                        `${mb.mack_board?.board_name || 'Unknown'} (${mb.width}px${mb.color ? `, ${mb.color}` : ''})`
                      ).join(', ')}
                    </span>
                  </div>
                )}
                <div className="variant-grid">
                  {item.color_variant && (
                    <div className="info-item">
                      <Palette className="info-icon" />
                      <span className="info-label">Color:</span>
                      <span className="info-value">{item.color_variant.color_name}</span>
                    </div>
                  )}
                  {item.size_variant && (
                    <div className="info-item">
                      <Ruler className="info-icon" />
                      <span className="info-label">Size:</span>
                      <span className="info-value">{item.size_variant.size_name}</span>
                    </div>
                  )}
                  {item.finish_variant && (
                    <div className="info-item">
                      <span className="info-label">Finish:</span>
                      <span className="info-value">{item.finish_variant.finish_name}</span>
                    </div>
                  )}
                  {item.hanging_variant && (
                    <div className="info-item">
                      <span className="info-label">Hanging:</span>
                      <span className="info-value">{item.hanging_variant.hanging_name}</span>
                    </div>
                  )}
                </div>
                {(item.print_width || item.print_height) && (
                  <div className="info-item">
                    <Ruler className="info-icon" />
                    <span className="info-label">Print Size:</span>
                    <span className="info-value">
                      {item.print_width || 'N/A'} x {item.print_height || 'N/A'} {item.print_unit}
                    </span>
                  </div>
                )}
                {item.media_type && (
                  <div className="info-item">
                    <FileImage className="info-icon" />
                    <span className="info-label">Media:</span>
                    <span className="info-value">{item.media_type}</span>
                  </div>
                )}
                {item.fit && (
                  <div className="info-item">
                    <span className="info-label">Fit:</span>
                    <span className="info-value">{item.fit}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions Section */}
        <div className="order-actions">
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="remove-btn"
            title="Remove item"
          >
            {isRemoving ? (
              <Loader className="btn-icon spinning" />
            ) : (
              <Trash2 className="btn-icon" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

function SavedOrder() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [printTypes, setPrintTypes] = useState([]);
  const [printSizes, setPrintSizes] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [laminationTypes, setLaminationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

        setPrintTypes(printTypesResponse.data);
        setPrintSizes(printSizesResponse.data);
        setPaperTypes(paperTypesResponse.data);
        setLaminationTypes(laminationTypesResponse.data);

        const savedItems = savedItemsResponse.data
          .filter(item => (item.status || 'pending').trim().toLowerCase() === 'pending')
          .map(item => ({ ...item, type: 'frame' }));
        
        const giftOrders = giftOrdersResponse.data
          .filter(item => (item.status || 'pending').trim().toLowerCase() === 'pending')
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
        setSavedOrders(orders);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching saved orders:', error);
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

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/payment', { state: { selectedOrders: savedOrders } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost = savedOrders.reduce((sum, item) => {
    const price = item.total_price || item.total_amount || 0;
    return sum + parseFloat(price);
  }, 0);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  if (savedOrders.length === 0) return <EmptyState user={user} />;

  return (
    <ErrorBoundary>
      <div className="saved-order-container">
        <div className="saved-order-content">
          {/* Header */}
          <div className="page-header">
            <div className="header-content">
              <div className="header-icon">
                <Package className="header-icon-svg" />
              </div>
              <h1 className="page-title">Your Pending Orders</h1>
            </div>
            <div className="header-meta">
              <User className="meta-icon" />
              <span>Orders for {user?.username || 'You'}</span>
              <span className="meta-separator">•</span>
              <span>{savedOrders.length} item{savedOrders.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Orders List */}
          <div className="orders-list">
            {savedOrders.map((item) => (
              <OrderCard
                key={`${item.type}-${item.id}`}
                item={item}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>

          {/* Summary and Actions */}
          <div className="order-summary">
            <div className="summary-content">
              <div className="total-cost">
                <span className="cost-label">Total Cost:</span>
                <div className="cost-amount">
                  <DollarSign className="cost-icon" />
                  {totalCost.toFixed(2)}
                </div>
              </div>
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="btn-icon spinning" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="btn-icon" />
                    Submit Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default SavedOrder;