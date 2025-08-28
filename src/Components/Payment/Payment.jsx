import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Payment.css';

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

          console.log('Raw SavedItems response:', savedItemsResponse.data);
          console.log('Raw GiftOrders response:', giftOrdersResponse.data);
          console.log('Raw DocumentOrders response:', documentOrdersResponse.data);

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
          console.log('Processed orders:', combinedOrders);
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
    // Basic validation
    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      setSubmissionError('Please fill in all required customer details.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
      setSubmissionError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(customerDetails.phone)) {
      setSubmissionError('Phone number must be 10 digits.');
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
      imageUrl: imageUrl, // Include image URL if applicable
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
      imageUrl: imageUrl, // Include document file URL
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
      imageUrl: imageUrl, // Include frame image URL
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
            body { font-family: Arial, sans-serif; margin: 20px; }
            .bill-container { max-width: 800px; margin: auto; }
            .bill-header { text-align: center; }
            .bill-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .bill-table th, .bill-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .bill-table th { background-color: #f2f2f2; }
            .total { margin-top: 20px; font-weight: bold; text-align: right; }
            .customer-details { margin-top: 20px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <div class="bill-header">
              <h1>Order Bill</h1>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="customer-details">
              <p><strong>Customer Name:</strong> ${customerDetails.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${customerDetails.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${customerDetails.phone || 'N/A'}</p>
              ${customerDetails.customMessage ? `<p><strong>Custom Message:</strong> ${customerDetails.customMessage}</p>` : ''}
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
                        (item.file ? `<a href="${getImageUrl(item.file)}" target="_blank">View Document</a>` : 'No File') :
                        `<img src="${getImageUrl(item.adjusted_image || item.cropped_image || item.preview_image || item.original_image)}" alt="Item" style="width: 50px; height: 50px; object-fit: cover;" />`
                      }
                    </td>
                    <td>
                      ${item.type === 'gift' ? `
                        <p><strong>Item Type:</strong> ${item.content_type.split(' | ')[1]}</p>
                        <p><strong>Item ID:</strong> ${item.object_id}</p>
                      ` : item.type === 'document' ? `
                        <p><strong>Order Type:</strong> Document Print</p>
                        <p><strong>Print Type:</strong> ${item.print_type || 'N/A'}</p>
                        <p><strong>Print Size:</strong> ${item.print_size || 'N/A'}</p>
                        <p><strong>Paper Type:</strong> ${item.paper_type || 'N/A'}</p>
                        <p><strong>Quantity:</strong> ${item.quantity || 'N/A'}</p>
                        <p><strong>Lamination:</strong> ${item.lamination ? 'Yes' : 'No'}</p>
                        ${item.lamination ? `<p><strong>Lamination Type:</strong> ${item.lamination_type || 'N/A'}</p>` : ''}
                        <p><strong>Delivery Method:</strong> ${item.delivery_method || 'N/A'}</p>
                        <p><strong>Delivery Charge:</strong> $${parseFloat(item.delivery_charge || 0).toFixed(2)}</p>
                      ` : `
                        <p><strong>Frame:</strong> ${item.frame?.name || 'None'}</p>
                        ${item.color_variant ? `<p><strong>Color:</strong> ${item.color_variant.color_name}</p>` : ''}
                        ${item.size_variant ? `<p><strong>Size:</strong> ${item.size_variant.size_name}</p>` : ''}
                        ${item.finish_variant ? `<p><strong>Finish:</strong> ${item.finish_variant.finish_name}</p>` : ''}
                        ${item.hanging_variant ? `<p><strong>Hanging:</strong> ${item.hanging_variant.hanging_name}</p>` : ''}
                        ${(item.print_width || item.print_height) ? `<p><strong>Print Size:</strong> ${item.print_width || 'N/A'} x ${item.print_height || 'N/A'} ${item.print_unit}</p>` : ''}
                        <p><strong>Media Type:</strong> ${item.media_type || 'None'}</p>
                        ${item.media_type === 'Photopaper' && item.paper_type ? `<p><strong>Paper Type:</strong> ${item.paper_type}</p>` : ''}
                        <p><strong>Fit:</strong> ${item.fit || 'None'}</p>
                        ${item.frame_depth ? `<p><strong>Frame Depth:</strong> ${item.frame_depth} px</p>` : ''}
                        ${item.fit === 'bordered' ? `
                          <p><strong>Border Depth:</strong> ${item.border_depth || 0} px</p>
                          <p><strong>Border Color:</strong> ${item.border_color || '#ffffff'}</p>
                        ` : ''}
                        ${item.mack_boards && item.mack_boards.length > 0 ? `
                          <p><strong>Mack Boards:</strong> ${item.mack_boards
                            .map((mb) => `${mb.mack_board?.board_name || 'N/A'} (${mb.mack_board_color?.color_name || 'N/A'}, ${mb.width}px)`)
                            .join(', ')}</p>
                        ` : ''}
                      `}
                    </td>
                    <td>$${item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}</td>
                    <td>${item.status || 'Pending'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              <p>Total Cost: $${totalCost.toFixed(2)}</p>
            </div>
            <button class="no-print" onclick="window.print()">Print Bill</button>
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

  // Calculate total cost
  const totalCost = savedOrders.reduce((sum, item) => sum + (item.total_price ? parseFloat(item.total_price) : 0), 0);

  // Loading state
  if (loading) return <div className="text-center mt-5">Loading...</div>;

  // Empty state
  if (savedOrders.length === 0) return <div className="text-center mt-5">No orders to process</div>;

  return (
    <div className="container mt-5">
      <h2>Order Confirmation</h2>
      <div className="row">
        <div className="col-md-6">
          <h4>Order Summary</h4>
          {savedOrders.map((item) => (
            <div key={`${item.type}-${item.id}`} className="card mb-3">
              <div className="card-body d-flex align-items-center">
                {item.type === 'document' ? (
                  <div style={{ marginRight: '15px' }}>
                    {item.file ? (
                      <a href={getImageUrl(item.file)} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    ) : (
                      'No File'
                    )}
                  </div>
                ) : (
                  <img
                    src={getImageUrl(item.adjusted_image || item.cropped_image || item.preview_image || item.original_image)}
                    alt="Item"
                    style={{ height: '80px', width: '80px', objectFit: 'cover', marginRight: '15px' }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=Image+Not+Found'; }}
                  />
                )}
                <div>
                  {item.type === 'gift' ? (
                    <>
                      <p><strong>Item Type:</strong> {item.content_type.split(' | ')[1]}</p>
                      <p><strong>Item ID:</strong> {item.object_id}</p>
                      <p><strong>Price:</strong> ${parseFloat(item.total_price).toFixed(2)}</p>
                      <p><strong>Status:</strong> {item.status || 'Pending'}</p>
                    </>
                  ) : item.type === 'document' ? (
                    <>
                      <p><strong>Order Type:</strong> Document Print</p>
                      <p><strong>Print Type:</strong> {item.print_type || 'N/A'}</p>
                      <p><strong>Print Size:</strong> {item.print_size || 'N/A'}</p>
                      <p><strong>Paper Type:</strong> {item.paper_type || 'N/A'}</p>
                      <p><strong>Quantity:</strong> {item.quantity || 'N/A'}</p>
                      <p><strong>Lamination:</strong> {item.lamination ? 'Yes' : 'No'}</p>
                      {item.lamination && <p><strong>Lamination Type:</strong> {item.lamination_type || 'N/A'}</p>}
                      <p><strong>Delivery Method:</strong> {item.delivery_method || 'N/A'}</p>
                      <p><strong>Delivery Charge:</strong> ${parseFloat(item.delivery_charge || 0).toFixed(2)}</p>
                      <p><strong>Price:</strong> ${parseFloat(item.total_price).toFixed(2)}</p>
                      <p><strong>Status:</strong> {item.status || 'Pending'}</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Frame:</strong> {item.frame?.name || 'None'}</p>
                      {item.color_variant && <p><strong>Color:</strong> {item.color_variant.color_name}</p>}
                      {item.size_variant && <p><strong>Size:</strong> {item.size_variant.size_name}</p>}
                      {item.finish_variant && <p><strong>Finish:</strong> {item.finish_variant.finish_name}</p>}
                      {item.hanging_variant && <p><strong>Hanging:</strong> {item.hanging_variant.hanging_name}</p>}
                      <p><strong>Print Size:</strong> {item.print_width || 'N/A'} x {item.print_height || 'N/A'} {item.print_unit}</p>
                      <p><strong>Media Type:</strong> {item.media_type || 'None'}</p>
                      {item.media_type === 'Photopaper' && item.paper_type && (
                        <p><strong>Paper Type:</strong> {item.paper_type}</p>
                      )}
                      <p><strong>Fit:</strong> {item.fit || 'None'}</p>
                      {item.mack_boards && item.mack_boards.length > 0 && (
                        <p><strong>Mack Boards:</strong> {item.mack_boards
                          .map((mb) => `${mb.mack_board?.board_name || 'N/A'} (${mb.mack_board_color?.color_name || 'N/A'}, ${mb.width}px)`)
                          .join(', ')}</p>
                      )}
                      <p><strong>Price:</strong> ${item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}</p>
                      <p><strong>Status:</strong> {item.status || 'Pending'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="mt-3">
            <p><strong>Total Cost:</strong> ${totalCost.toFixed(2)}</p>
            <button className="btn btn-primary" onClick={handlePrintBill}>
              Print Bill
            </button>
          </div>
        </div>
        <div className="col-md-6">
          <h4>Customer Details</h4>
          {submissionSuccess ? (
            <div className="alert alert-success">
              Order confirmation sent to {customerDetails.email}!
            </div>
          ) : (
            <form onSubmit={handleFormSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={customerDetails.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={customerDetails.email}
                  onChange={handleInputChange}
                  placeholder="example@domain.com"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={customerDetails.phone}
                  onChange={handleInputChange}
                  placeholder="1234567890"
                  maxLength="10"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="customMessage" className="form-label">Custom Message (Optional)</label>
                <textarea
                  className="form-control"
                  id="customMessage"
                  name="customMessage"
                  value={customerDetails.customMessage}
                  onChange={handleInputChange}
                  placeholder="Add a custom message to include in the email"
                  rows="4"
                />
              </div>
              {submissionError && <div className="alert alert-danger">{submissionError}</div>}
              <button type="submit" className="btn btn-success">Confirm Order</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Payment;