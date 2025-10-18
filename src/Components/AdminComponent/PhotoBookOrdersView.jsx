import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Calendar, FileText, Image as ImageIcon, Type, Sticker, X, Trash2 } from 'lucide-react';
import './PhotoBookOrdersView.css';

const BASE_URL = 'http://82.180.146.4:8001';
const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=600';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f0f0f0" stroke="%23cbd5e0" stroke-width="2" stroke-dasharray="8,4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="%23a0aec0"%3EDrop Photo%3C/text%3E%3C/svg%3E';

const getImageUrl = (path) => {
  if (!path) {
    console.warn('getImageUrl: No path provided, using FALLBACK_IMAGE');
    return FALLBACK_IMAGE;
  }
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

function PreviewModal({ imageUrl, onClose }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      console.log(`Modal image preloaded: ${imageUrl}`);
      setIsImageLoaded(true);
    };
    img.onerror = () => {
      console.error(`Failed to preload modal image: ${imageUrl}`);
      setIsImageLoaded(true);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imageUrl, onClose]);

  return (
    <div className="photobook-preview-modal">
      <div className="photobook-modal-overlay" onClick={onClose}></div>
      <div className="photobook-modal-content">
        <button className="photobook-modal-close-button" onClick={onClose} title="Close">
          <X size={24} />
        </button>
        {!isImageLoaded && (
          <div className="photobook-modal-loading">
            <div className="photobook-loading-spinner"></div>
            <p>Loading preview...</p>
          </div>
        )}
        <img
          src={imageUrl}
          alt="Page Preview"
          className={`photobook-modal-preview-image ${isImageLoaded ? 'loaded' : ''}`}
          onError={(e) => {
            console.error(`Failed to load modal preview image: ${imageUrl}`);
            e.target.src = FALLBACK_IMAGE;
            setIsImageLoaded(true);
          }}
        />
      </div>
    </div>
  );
}

function PhotoBookOrdersView() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await fetch(`${BASE_URL}/orders/`, config);

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched orders:', data);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Unable to load your orders. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete Order #${orderId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/orders/${orderId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete order: ${response.status}`);
      }

      // Update state to remove the deleted order
      setOrders(orders.filter((order) => order.id !== orderId));
      console.log(`Order ${orderId} deleted successfully`);
      if (expandedOrder === orderId) {
        setExpandedOrder(null);
      }
    } catch (err) {
      console.error(`Failed to delete order ${orderId}:`, err);
      setError(`Failed to delete order: ${err.message}`);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handlePreviewClick = (imageUrl) => {
    setSelectedPreview(imageUrl);
  };

  const closePreviewModal = () => {
    setSelectedPreview(null);
  };

  const getSpreads = (pages) => {
    const spreads = [];
    for (let i = 0; i < pages.length; i += 2) {
      const leftPage = pages[i];
      const rightPage = pages[i + 1] || null;
      const leftPreview = leftPage?.preview_image ? getImageUrl(leftPage.preview_image) : FALLBACK_IMAGE;
      const rightPreview = rightPage?.preview_image ? getImageUrl(rightPage.preview_image) : null;
      console.log(
        `Spread ${i / 2 + 1}: leftPage=${leftPage?.id || 'none'}, rightPage=${rightPage?.id || 'none'}, leftPreview=${leftPreview}, rightPreview=${rightPreview || 'none'}`
      );
      spreads.push({ leftPage, rightPage, leftPreview, rightPreview });
    }
    return spreads;
  };

  if (isLoading) {
    return (
      <div className="photobook-orders-view">
        <div className="photobook-loading-state">
          <div className="photobook-loading-spinner"></div>
          <p className="photobook-loading-text">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="photobook-orders-view">
        <div className="photobook-error-state">
          <div className="photobook-error-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p className="photobook-error-message">{error}</p>
          <button onClick={fetchOrders} className="photobook-retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="photobook-orders-view">
      <div className="photobook-orders-header">
        <button className="photobook-back-button" onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="photobook-header-content">
          <h1 className="photobook-header-title">My Photobook Orders</h1>
          <p className="photobook-header-subtitle">View and manage all your photobook creations</p>
        </div>
        <div className="photobook-orders-count">
          <Package size={20} />
          <span>{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="photobook-empty-state">
          <div className="photobook-empty-icon">📚</div>
          <h2>No orders yet</h2>
          <p>Your photobook orders will appear here once you create them.</p>
          <button onClick={handleBack} className="photobook-create-button">
            Create Your First Photobook
          </button>
        </div>
      ) : (
        <div className="photobook-orders-grid">
          {orders.map((order) => (
            <div key={order.id} className="photobook-order-card">
              <div className="photobook-order-header">
                <div className="photobook-order-info">
                  <h3 className="photobook-order-title">Order #{order.id}</h3>
                  <div className="photobook-order-meta">
                    <span className="photobook-meta-item">
                      <Calendar size={14} />
                      {formatDate(order.created_at)}
                    </span>
                    {order.user && (
                      <span className="photobook-meta-item">
                        👤 {order.user}
                      </span>
                    )}
                  </div>
                </div>
                <div className="photobook-order-actions">
                  <button
                    className="photobook-delete-button"
                    onClick={() => handleDeleteOrder(order.id)}
                    title="Delete Order"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="photobook-order-price">
                    <span className="photobook-price-label">Total</span>
                    <span className="photobook-price-value">${Number(order.total_price || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="photobook-order-details">
                <div className="photobook-detail-row">
                  <span className="photobook-detail-label">Theme:</span>
                  <span className="photobook-detail-value">{order.theme?.theme_name || 'Classic'}</span>
                </div>
                <div className="photobook-detail-row">
                  <span className="photobook-detail-label">Paper Size:</span>
                  <span className="photobook-detail-value">{order.paper?.size || 'Standard'}</span>
                </div>
                <div className="photobook-detail-row">
                  <span className="photobook-detail-label">Pages:</span>
                  <span className="photobook-detail-value">{order.pages?.length || 0} pages</span>
                </div>
              </div>

              {order.pages && order.pages.length > 0 && (
                <>
                  <button
                    className="photobook-expand-button"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    {expandedOrder === order.id ? 'Hide Pages' : 'View Pages'}
                  </button>

                  {expandedOrder === order.id && (
                    <div className="photobook-pages-section">
                      <h4 className="photobook-pages-title">
                        <FileText size={18} />
                        Spreads Preview
                      </h4>
                      <div className="photobook-pages-grid">
                        {getSpreads(order.pages).map((spread, index) => (
                          <div key={index} className="photobook-spread-card">
                            <div className="photobook-spread-number-badge">
                              Spread {index + 1} (Pages {spread.leftPage?.page_number || 'N/A'}{spread.rightPage ? `-${spread.rightPage.page_number}` : ''})
                            </div>

                            <div className="photobook-spread-preview">
                              <div className="spread-preview-container">
                                <div className="spread-preview-left">
                                  <img
                                    src={spread.leftPreview}
                                    alt={`Spread ${index + 1} Left Page Preview`}
                                    className="photobook-spread-preview-image"
                                    onClick={() => handlePreviewClick(spread.leftPreview)}
                                    onError={(e) => {
                                      console.error(`Failed to load left preview image for spread ${index + 1}: ${spread.leftPreview}`);
                                      e.target.src = FALLBACK_IMAGE;
                                    }}
                                  />
                                </div>
                                {spread.rightPage && spread.rightPreview && (
                                  <div className="spread-preview-right">
                                    <img
                                      src={spread.rightPreview}
                                      alt={`Spread ${index + 1} Right Page Preview`}
                                      className="photobook-spread-preview-image"
                                      onClick={() => handlePreviewClick(spread.rightPreview)}
                                      onError={(e) => {
                                        console.error(`Failed to load right preview image for spread ${index + 1}: ${spread.rightPreview}`);
                                        e.target.src = FALLBACK_IMAGE;
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {(spread.leftPage?.elements || spread.rightPage?.elements) && (
                              <div className="photobook-elements-section">
                                <div className="photobook-elements-header">
                                  <span className="photobook-elements-count">
                                    {((spread.leftPage?.elements?.length || 0) + (spread.rightPage?.elements?.length || 0))} elements
                                  </span>
                                </div>
                                <div className="photobook-elements-list">
                                  {spread.leftPage?.elements?.map((element, idx) => (
                                    <div key={`left-${idx}`} className="photobook-element-item">
                                      {element.type === 'image' && (
                                        <>
                                          <div className="photobook-element-icon">
                                            <ImageIcon size={16} />
                                          </div>
                                          <a
                                            href={getImageUrl(element.content)}
                                            download
                                            title="Click to download image"
                                          >
                                            <img
                                              src={getImageUrl(element.content)}
                                              alt="Element"
                                              className="photobook-element-thumbnail"
                                              onError={(e) => {
                                                console.error(`Failed to load element image: ${element.content}`);
                                                e.target.src = FALLBACK_IMAGE;
                                              }}
                                            />
                                          </a>
                                        </>
                                      )}
                                      {element.type === 'sticker' && (
                                        <>
                                          <div className="photobook-element-icon">
                                            <Sticker size={16} />
                                          </div>
                                          <a
                                            href={getImageUrl(element.content)}
                                            download
                                            title="Click to download sticker"
                                          >
                                            <img
                                              src={getImageUrl(element.content)}
                                              alt="Sticker"
                                              className="photobook-element-thumbnail"
                                              onError={(e) => {
                                                console.error(`Failed to load sticker image: ${element.content}`);
                                                e.target.src = FALLBACK_IMAGE;
                                              }}
                                            />
                                          </a>
                                        </>
                                      )}
                                      {element.type === 'text' && (
                                        <>
                                          <div className="photobook-element-icon">
                                            <Type size={16} />
                                          </div>
                                          <div className="photobook-element-text-preview">
                                            {element.content || 'Text element'}
                                          </div>
                                        </>
                                      )}
                                      {element.type === 'placeholder' && (
                                        <>
                                          <div className="photobook-element-icon placeholder">
                                            <ImageIcon size={16} />
                                          </div>
                                          <img
                                            src={element.content || PLACEHOLDER_IMAGE}
                                            alt="Placeholder"
                                            className="photobook-element-thumbnail placeholder"
                                          />
                                        </>
                                      )}
                                    </div>
                                  ))}
                                  {spread.rightPage?.elements?.map((element, idx) => (
                                    <div key={`right-${idx}`} className="photobook-element-item">
                                      {element.type === 'image' && (
                                        <>
                                          <div className="photobook-element-icon">
                                            <ImageIcon size={16} />
                                          </div>
                                          <a
                                            href={getImageUrl(element.content)}
                                            download
                                            title="Click to download image"
                                          >
                                            <img
                                              src={getImageUrl(element.content)}
                                              alt="Element"
                                              className="photobook-element-thumbnail"
                                              onError={(e) => {
                                                console.error(`Failed to load element image: ${element.content}`);
                                                e.target.src = FALLBACK_IMAGE;
                                              }}
                                            />
                                          </a>
                                        </>
                                      )}
                                      {element.type === 'sticker' && (
                                        <>
                                          <div className="photobook-element-icon">
                                            <Sticker size={16} />
                                          </div>
                                          <a
                                            href={getImageUrl(element.content)}
                                            download
                                            title="Click to download sticker"
                                          >
                                            <img
                                              src={getImageUrl(element.content)}
                                              alt="Sticker"
                                              className="photobook-element-thumbnail"
                                              onError={(e) => {
                                                console.error(`Failed to load sticker image: ${element.content}`);
                                                e.target.src = FALLBACK_IMAGE;
                                              }}
                                            />
                                          </a>
                                        </>
                                      )}
                                      {element.type === 'text' && (
                                        <>
                                          <div className="photobook-element-icon">
                                            <Type size={16} />
                                          </div>
                                          <div className="photobook-element-text-preview">
                                            {element.content || 'Text element'}
                                          </div>
                                        </>
                                      )}
                                      {element.type === 'placeholder' && (
                                        <>
                                          <div className="photobook-element-icon placeholder">
                                            <ImageIcon size={16} />
                                          </div>
                                          <img
                                            src={element.content || PLACEHOLDER_IMAGE}
                                            alt="Placeholder"
                                            className="photobook-element-thumbnail placeholder"
                                          />
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(!spread.leftPage?.elements && !spread.rightPage?.elements) && (
                              <div className="photobook-no-elements">
                                No elements added
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {selectedPreview && (
        <PreviewModal imageUrl={selectedPreview} onClose={closePreviewModal} />
      )}
    </div>
  );
}

export default PhotoBookOrdersView;