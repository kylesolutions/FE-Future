import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Calendar, FileText, Image as ImageIcon, Type, Sticker } from 'lucide-react';
import './PhotoBookOrdersView.css';

const BASE_URL = 'http://82.180.146.4:8001';
const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=300';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f0f0f0" stroke="%23cbd5e0" stroke-width="2" stroke-dasharray="8,4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="%23a0aec0"%3EDrop Photo%3C/text%3E%3C/svg%3E';

const getImageUrl = (path) => {
  if (!path) return FALLBACK_IMAGE;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

function PhotoBookOrdersView() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

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
        throw new Error('Failed to fetch orders');
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

  const handleBack = () => {
    window.history.back();
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Group pages into spreads (pairs of pages)
  const getSpreads = (pages) => {
    const spreads = [];
    for (let i = 0; i < pages.length; i += 2) {
      const leftPage = pages[i];
      const rightPage = pages[i + 1];
      spreads.push({ leftPage, rightPage });
    }
    return spreads;
  };

  if (isLoading) {
    return (
      <div className="orders-view">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-view">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p className="error-message">{error}</p>
          <button onClick={fetchOrders} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-view">
      <div className="orders-header">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="header-content">
          <h1 className="header-title">My Photobook Orders</h1>
          <p className="header-subtitle">View and manage all your photobook creations</p>
        </div>
        <div className="orders-count">
          <Package size={20} />
          <span>{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h2>No orders yet</h2>
          <p>Your photobook orders will appear here once you create them.</p>
          <button onClick={handleBack} className="create-button">
            Create Your First Photobook
          </button>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3 className="order-title">Order #{order.id}</h3>
                  <div className="order-meta">
                    <span className="meta-item">
                      <Calendar size={14} />
                      {formatDate(order.created_at)}
                    </span>
                    {order.user && (
                      <span className="meta-item">
                        👤 {order.user}
                      </span>
                    )}
                  </div>
                </div>
                <div className="order-price">
                  <span className="price-label">Total</span>
                  <span className="price-value">${Number(order.total_price || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="order-details">
                <div className="detail-row">
                  <span className="detail-label">Theme:</span>
                  <span className="detail-value">{order.theme?.theme_name || 'Classic'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Paper Size:</span>
                  <span className="detail-value">{order.paper?.size || 'Standard'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Pages:</span>
                  <span className="detail-value">{order.pages?.length || 0} pages</span>
                </div>
              </div>

              {order.pages && order.pages.length > 0 && (
                <>
                  <button
                    className="expand-button"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    {expandedOrder === order.id ? 'Hide Pages' : 'View Pages'}
                  </button>

                  {expandedOrder === order.id && (
                    <div className="pages-section">
                      <h4 className="pages-title">
                        <FileText size={18} />
                        Spreads Preview
                      </h4>
                      <div className="pages-grid">
                        {getSpreads(order.pages).map((spread, index) => (
                          <div key={index} className="spread-card">
                            <div className="spread-number-badge">
                              Spread {index + 1} (Pages {spread.leftPage?.page_number || ''}{spread.rightPage ? `-${spread.rightPage.page_number}` : ''})
                            </div>

                            {spread.leftPage?.preview_image && (
                              <div className="spread-preview">
                                <img
                                  src={getImageUrl(spread.leftPage.preview_image)}
                                  alt={`Spread ${index + 1} preview`}
                                  className="spread-preview-image"
                                  onError={(e) => {
                                    console.error(`Failed to load preview image: ${spread.leftPage.preview_image}`);
                                    e.target.src = FALLBACK_IMAGE;
                                  }}
                                />
                              </div>
                            )}

                            {(spread.leftPage?.elements || spread.rightPage?.elements) && (
                              <div className="elements-section">
                                <div className="elements-header">
                                  <span className="elements-count">
                                    {((spread.leftPage?.elements?.length || 0) + (spread.rightPage?.elements?.length || 0))} elements
                                  </span>
                                </div>
                                <div className="elements-list">
                                  {spread.leftPage?.elements?.map((element, idx) => (
                                    <div key={`left-${idx}`} className="element-item">
                                      {element.type === 'image' && (
                                        <>
                                          <div className="element-icon">
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
                                              className="element-thumbnail"
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
                                          <div className="element-icon">
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
                                              className="element-thumbnail"
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
                                          <div className="element-icon">
                                            <Type size={16} />
                                          </div>
                                          <div className="element-text-preview">
                                            {element.content || 'Text element'}
                                          </div>
                                        </>
                                      )}
                                      {element.type === 'placeholder' && (
                                        <>
                                          <div className="element-icon placeholder">
                                            <ImageIcon size={16} />
                                          </div>
                                          <img
                                            src={element.content || PLACEHOLDER_IMAGE}
                                            alt="Placeholder"
                                            className="element-thumbnail placeholder"
                                          />
                                        </>
                                      )}
                                    </div>
                                  ))}
                                  {spread.rightPage?.elements?.map((element, idx) => (
                                    <div key={`right-${idx}`} className="element-item">
                                      {element.type === 'image' && (
                                        <>
                                          <div className="element-icon">
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
                                              className="element-thumbnail"
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
                                          <div className="element-icon">
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
                                              className="element-thumbnail"
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
                                          <div className="element-icon">
                                            <Type size={16} />
                                          </div>
                                          <div className="element-text-preview">
                                            {element.content || 'Text element'}
                                          </div>
                                        </>
                                      )}
                                      {element.type === 'placeholder' && (
                                        <>
                                          <div className="element-icon placeholder">
                                            <ImageIcon size={16} />
                                          </div>
                                          <img
                                            src={element.content || PLACEHOLDER_IMAGE}
                                            alt="Placeholder"
                                            className="element-thumbnail placeholder"
                                          />
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(!spread.leftPage?.elements && !spread.rightPage?.elements) && (
                              <div className="no-elements">
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
    </div>
  );
}

export default PhotoBookOrdersView;