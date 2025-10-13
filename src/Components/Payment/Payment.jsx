import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Payment.css';
import { 
  CreditCard, 
  User, 
  Mail, 
  Phone, 
  MessageCircle, 
  FileText, 
  Image as ImageIcon,
  Gift,
  Printer,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Package
} from 'lucide-react';

const BASE_URL = 'http://82.180.146.4:8001';

function Payment() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    customMessage: '',
  });
  const [submissionError, setSubmissionError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const isAdmin = user.is_staff || user.is_superuser;

  // Initialize orders from location state or fetch for non-admins
  useEffect(() => {
    const fetchSavedOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        if (location.state?.selectedOrders) {
          setSavedOrders(location.state.selectedOrders);
          setLoading(false);
        } else {
          const [savedItemsResponse, giftOrdersResponse, documentOrdersResponse] = await Promise.all([
            axios.get(`${BASE_URL}/save-items/`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/gift-orders/list/`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/api/document-print-orders/`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => ({ data: [] })),
          ]);

          const savedItems = savedItemsResponse.data
            .filter(item => item.status?.trim().toLowerCase() === 'pending')
            .map(item => ({ ...item, type: 'frame' }));
          const giftOrders = giftOrdersResponse.data
            .filter(item => item.status?.trim().toLowerCase() === 'pending')
            .map(item => ({ ...item, type: 'gift' }));
          const documentOrders = documentOrdersResponse.data
            .filter(item => item.status?.trim().toLowerCase() === 'pending')
            .map(item => ({ ...item, type: 'document' }));

          const combinedOrders = [...savedItems, ...giftOrders, ...documentOrders];
          setSavedOrders(combinedOrders);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching saved orders:', error.response?.data || error.message);
        setSubmissionError('Failed to load orders. Please try again.');
        setLoading(false);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };
    fetchSavedOrders();
  }, [navigate, location.state]);

  // Handle customer form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission and send order confirmation email
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Basic validation
    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      setSubmissionError('Please fill in all required customer details.');
      setIsSubmitting(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
      setSubmissionError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }
    if (!/^\d{10}$/.test(customerDetails.phone)) {
      setSubmissionError('Phone number must be 10 digits.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      // Prepare order details for email
      const orderDetails = savedOrders.map((item) => {
        const imageUrl = item.type === 'document'
          ? getImageUrl(item.file)
          : getImageUrl(item.adjusted_image || item.cropped_image || item.preview_image || item.original_image);

        if (item.type === 'gift') {
          return {
            type: 'gift',
            content_type: item.content_type.split(' | ')[1],
            object_id: item.object_id,
            price: parseFloat(item.total_price).toFixed(2),
            imageUrl: imageUrl,
          };
        } else if (item.type === 'document') {
          return {
            type: 'document',
            print_type: item.print_type || 'N/A',
            print_size: item.print_size || 'N/A',
            paper_type: item.paper_type || 'N/A',
            quantity: item.quantity || 'N/A',
            lamination: item.lamination ? 'Yes' : 'No',
            lamination_type: item.lamination_type || 'N/A',
            delivery_method: item.delivery_method || 'N/A',
            delivery_charge: parseFloat(item.delivery_charge || 0).toFixed(2),
            price: parseFloat(item.total_price).toFixed(2),
            imageUrl: imageUrl,
          };
        } else {
          return {
            type: 'frame',
            frame: item.frame?.name || 'None',
            color: item.color_variant?.color_name || 'None',
            size: item.size_variant?.size_name || 'None',
            finish: item.finish_variant?.finish_name || 'None',
            hanging: item.hanging_variant?.hanging_name || 'None',
            printSize: `${item.print_width || 'N/A'} x ${item.print_height || 'N/A'} ${item.print_unit || 'inches'}`,
            mediaType: item.media_type || 'None',
            paperType: item.media_type === 'Photopaper' && item.paper_type ? item.paper_type : 'None',
            fit: item.fit || 'None',
            frameDepth: item.frame_depth ? `${item.frame_depth} px` : 'None',
            borderDepth: item.fit === 'bordered' ? `${item.border_depth || 0} px` : 'None',
            borderColor: item.fit === 'bordered' ? item.border_color || '#ffffff' : 'None',
            mackBoards: item.mack_boards && item.mack_boards.length > 0
              ? item.mack_boards
                  .map((mb) => `${mb.mack_board?.board_name || 'N/A'} (${mb.mack_board_color?.color_name || 'N/A'}, ${mb.width}px)`)
                  .join(', ')
              : 'None',
            price: item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00',
            imageUrl: imageUrl,
          };
        }
      });

      const totalCost = savedOrders.reduce((sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0), 0);

      // Send order confirmation email
      await axios.post(
        `${BASE_URL}/send-order-confirmation/`,
        {
          customerName: customerDetails.name,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
          orderDetails,
          totalCost: totalCost.toFixed(2),
          senderEmail: 'jayalakshmikyle@gmail.com',
          customMessage: customerDetails.customMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );

      // Update saved items status
      const savedItemIds = savedOrders.filter(item => item.type === 'frame').map(item => item.id);
      if (savedItemIds.length > 0) {
        await axios.post(
          `${BASE_URL}/update-saved-items-status/`,
          { orderIds: savedItemIds },
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
      }

      // Update gift orders status
      const giftOrderIds = savedOrders.filter(item => item.type === 'gift').map(item => item.id);
      if (giftOrderIds.length > 0) {
        await axios.post(
          `${BASE_URL}/update-gift-orders-status/`,
          { orderIds: giftOrderIds },
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
      }

      // Update document print orders status
      const documentOrderIds = savedOrders.filter(item => item.type === 'document').map(item => item.id);
      if (documentOrderIds.length > 0) {
        await axios.post(
          `${BASE_URL}/update-document-print-orders-status/`,
          { orderIds: documentOrderIds },
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
      }

      setSubmissionError('');
      setSubmissionSuccess(true);
    } catch (error) {
      console.error('Error sending order confirmation:', error.response?.data || error.message);
      setSubmissionError('Failed to send order confirmation. Please try again.');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle print bill
  const handlePrintBill = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Bill</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f8fafc; 
            }
            .bill-container { 
              max-width: 800px; 
              margin: auto; 
              background: white; 
              padding: 30px; 
              border-radius: 12px; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            }
            .bill-header { 
              text-align: center; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .bill-header h1 { 
              color: #1e293b; 
              margin: 0 0 10px 0; 
              font-size: 28px; 
            }
            .bill-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
            }
            .bill-table th, .bill-table td { 
              border: 1px solid #e2e8f0; 
              padding: 12px; 
              text-align: left; 
            }
            .bill-table th { 
              background: #f1f5f9; 
              font-weight: 600; 
              color: #374151; 
            }
            .total { 
              margin-top: 30px; 
              padding: 20px; 
              background: #f8fafc; 
              border-radius: 8px; 
              text-align: right; 
            }
            .total-amount { 
              font-size: 24px; 
              font-weight: bold; 
              color: #059669; 
            }
            .customer-details { 
              margin: 30px 0; 
              padding: 20px; 
              background: #f8fafc; 
              border-radius: 8px; 
            }
            .customer-details h3 { 
              margin-top: 0; 
              color: #1e293b; 
            }
            .item-image { 
              width: 60px; 
              height: 60px; 
              object-fit: cover; 
              border-radius: 6px; 
            }
            @media print {
              .no-print { display: none; }
              body { background: white; }
              .bill-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <div class="bill-header">
              <h1>Order Confirmation</h1>
              <p style="color: #64748b; margin: 0;">Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="customer-details">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customerDetails.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${customerDetails.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${customerDetails.phone || 'N/A'}</p>
              ${customerDetails.customMessage ? `<p><strong>Message:</strong> ${customerDetails.customMessage}</p>` : ''}
            </div>
            <table class="bill-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Details</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${savedOrders.map((item) => `
                  <tr>
                    <td>
                      ${item.type === 'document' ?
                        (item.file ? `<a href="${getImageUrl(item.file)}" target="_blank">📄 View Document</a>` : '📄 No File') :
                        `<img src="${getImageUrl(item.adjusted_image || item.cropped_image || item.preview_image || item.original_image)}" alt="Item" class="item-image" />`
                      }
                    </td>
                    <td>
                      ${item.type === 'gift' ? `
                        <p><strong>Type:</strong> ${item.content_type.split(' | ')[1]}</p>
                        <p><strong>ID:</strong> ${item.object_id}</p>
                      ` : item.type === 'document' ? `
                        <p><strong>Type:</strong> Document Print</p>
                        <p><strong>Print:</strong> ${item.print_type || 'N/A'}</p>
                        <p><strong>Size:</strong> ${item.print_size || 'N/A'}</p>
                        <p><strong>Paper:</strong> ${item.paper_type || 'N/A'}</p>
                        <p><strong>Qty:</strong> ${item.quantity || 'N/A'}</p>
                        <p><strong>Lamination:</strong> ${item.lamination ? 'Yes' : 'No'}</p>
                        <p><strong>Delivery:</strong> ${item.delivery_method || 'N/A'}</p>
                      ` : `
                        <p><strong>Frame:</strong> ${item.frame?.name || 'None'}</p>
                        ${item.color_variant ? `<p><strong>Color:</strong> ${item.color_variant.color_name}</p>` : ''}
                        ${item.size_variant ? `<p><strong>Size:</strong> ${item.size_variant.size_name}</p>` : ''}
                        <p><strong>Print:</strong> ${item.print_width || 'N/A'} x ${item.print_height || 'N/A'} ${item.print_unit}</p>
                        <p><strong>Media:</strong> ${item.media_type || 'None'}</p>
                      `}
                    </td>
                    <td style="font-weight: 600; color: #059669;">$${item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}</td>
                    <td>
                      <span style="display: inline-block; padding: 4px 8px; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 12px;">
                        ${item.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              <div class="total-amount">Total: $${totalCost.toFixed(2)}</div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <button class="no-print" onclick="window.print()" style="
                background: #3b82f6; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                cursor: pointer; 
                font-size: 16px;
                font-weight: 500;
              ">🖨️ Print Bill</button>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Construct image/file URLs
  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/100x100?text=Image+Not+Found';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Get item type icon
  const getItemTypeIcon = (type) => {
    switch (type) {
      case 'gift': return <Gift className="order-type-icon gift-icon" />;
      case 'document': return <FileText className="order-type-icon document-icon" />;
      default: return <ImageIcon className="order-type-icon frame-icon" />;
    }
  };

  // Calculate total cost
  const totalCost = savedOrders.reduce((sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0), 0);

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Loader2 className="loading-spinner-large" />
          <p className="loading-text">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (savedOrders.length === 0) {
    return (
      <div className="empty-container">
        <div className="empty-content">
          <Package className="empty-icon" />
          <h2 className="empty-title">No Orders Found</h2>
          <p className="empty-message">There are no pending orders to process at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-wrapper">
        {/* Header */}
        <div className="payment-header">
          <h1 className="payment-title">Order Confirmation</h1>
          <p className="payment-subtitle">Review your order and provide customer details</p>
        </div>

        <div className="payment-grid">
          {/* Order Summary */}
          <div className="order-summary">
            <div className="order-summary-header">
              <h2 className="order-summary-title">
                <CreditCard className="order-summary-icon" />
                Order Summary
              </h2>
              <span className="order-count-badge">
                {savedOrders.length} {savedOrders.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            <div className="order-items-container">
              {savedOrders.map((item) => (
                <div key={`${item.type}-${item.id}`} className="order-item">
                  <div className="order-item-content">
                    {/* Item Image/Icon */}
                    <div className="order-item-image">
                      {item.type === 'document' ? (
                        <div className="document-placeholder">
                          {item.file ? (
                            <a href={getImageUrl(item.file)} target="_blank" rel="noopener noreferrer" 
                               className="document-link">
                              <ExternalLink size={16} />
                              View
                            </a>
                          ) : (
                            <FileText size={24} color="#3b82f6" />
                          )}
                        </div>
                      ) : (
                        <img
                          src={getImageUrl(item.adjusted_image || item.cropped_image || item.preview_image || item.original_image)}
                          alt="Order item"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/64x64?text=No+Image'; }}
                        />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="order-item-details">
                      <div className="order-type-header">
                        {getItemTypeIcon(item.type)}
                        <span className="order-type-label">
                          {item.type === 'document' ? 'Document Print' : item.type}
                        </span>
                      </div>

                      <div className="order-details-list">
                        {item.type === 'gift' ? (
                          <>
                            <div className="order-detail-item">
                              <span className="order-detail-label">Type:</span> {item.content_type.split(' | ')[1]}
                            </div>
                            <div className="order-detail-item">
                              <span className="order-detail-label">ID:</span> {item.object_id}
                            </div>
                          </>
                        ) : item.type === 'document' ? (
                          <>
                            <div className="order-detail-item">
                              <span className="order-detail-label">Print:</span> {item.print_type || 'N/A'}
                            </div>
                            <div className="order-detail-item">
                              <span className="order-detail-label">Size:</span> {item.print_size || 'N/A'}
                            </div>
                            <div className="order-detail-item">
                              <span className="order-detail-label">Quantity:</span> {item.quantity || 'N/A'}
                            </div>
                            <div className="order-detail-item">
                              <span className="order-detail-label">Lamination:</span> {item.lamination ? 'Yes' : 'No'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="order-detail-item">
                              <span className="order-detail-label">Frame:</span> {item.frame?.name || 'None'}
                            </div>
                            {item.color_variant && (
                              <div className="order-detail-item">
                                <span className="order-detail-label">Color:</span> {item.color_variant.color_name}
                              </div>
                            )}
                            {item.size_variant && (
                              <div className="order-detail-item">
                                <span className="order-detail-label">Size:</span> {item.size_variant.size_name}
                              </div>
                            )}
                            <div className="order-detail-item">
                              <span className="order-detail-label">Print Size:</span> {item.print_width || 'N/A'} x {item.print_height || 'N/A'} {item.print_unit}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="order-item-footer">
                        <span className="order-price">
                          ${item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}
                        </span>
                        <span className="order-status">
                          {item.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="order-total">
              <div className="order-total-row">
                <span className="order-total-label">Total Amount</span>
                <span className="order-total-amount">${totalCost.toFixed(2)}</span>
              </div>
              <button onClick={handlePrintBill} className="print-bill-btn">
                <Printer size={16} />
                Print Bill
              </button>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="customer-details">
            <div className="customer-details-header">
              <User className="customer-details-icon" />
              <h2 className="customer-details-title">Customer Details</h2>
            </div>

            {submissionSuccess ? (
              <div className="success-container">
                <div className="success-icon-wrapper">
                  <Check className="success-icon" />
                </div>
                <h3 className="success-title">Order Confirmed!</h3>
                <p className="success-message">
                  Order confirmation has been sent to <br />
                  <span className="success-email">{customerDetails.email}</span>
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="customer-form">
                {/* Name Field */}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name *
                  </label>
                  <div className="form-input-wrapper">
                    <User className="form-input-icon" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={customerDetails.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address *
                  </label>
                  <div className="form-input-wrapper">
                    <Mail className="form-input-icon" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={customerDetails.email}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="customer@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number *
                  </label>
                  <div className="form-input-wrapper">
                    <Phone className="form-input-icon" />
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={customerDetails.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="1234567890"
                      maxLength="10"
                      required
                    />
                  </div>
                </div>

                {/* Custom Message Field */}
                <div className="form-group">
                  <label htmlFor="customMessage" className="form-label">
                    Custom Message (Optional)
                  </label>
                  <div className="form-input-wrapper">
                    <MessageCircle className="form-textarea-icon" />
                    <textarea
                      id="customMessage"
                      name="customMessage"
                      value={customerDetails.customMessage}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder="Add any special instructions or notes..."
                    />
                  </div>
                </div>

                {/* Error Message */}
                {submissionError && (
                  <div className="error-alert">
                    <AlertCircle className="error-icon" />
                    <div className="error-content">
                      <p className="error-title">Error</p>
                      <p className="error-message">{submissionError}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="submit-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="submit-btn-icon loading-spinner" />
                      Confirming Order...
                    </>
                  ) : (
                    <>
                      <Check className="submit-btn-icon" />
                      Confirm Order
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Payment;