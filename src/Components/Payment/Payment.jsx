import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const BASE_URL = 'http://82.180.146.4:8000';

function Payment() {
  const [savedOrders, setSavedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [submissionError, setSubmissionError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const isAdmin = user.type === 'is_staff' || user.type === 'is_superuser';

  // Initialize orders from location state or fetch for non-admins
  useEffect(() => {
    const fetchSavedOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        // Use orders from location.state if provided
        if (location.state?.selectedOrders) {
          setSavedOrders(location.state.selectedOrders);
          setLoading(false);
        } else {
          // Fetch pending orders for non-admins
          const response = await axios.get(`${BASE_URL}/save-items/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const pendingOrders = response.data.filter(item => item.status === 'pending');
          setSavedOrders(pendingOrders);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching saved orders:', error.response?.data || error.message);
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
      setSubmissionError('Please fill in all customer details.');
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
      const orderDetails = savedOrders.map((item) => ({
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
        price: item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00',
      }));

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
        },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );

      // Update saved orders status to 'paid'
      await axios.post(
        `${BASE_URL}/update-saved-items-status/`,
        { orderIds: savedOrders.map((item) => item.id) },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );

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
                      <img src="${getImageUrl(item.adjusted_image || item.cropped_image || item.original_image)}" alt="Item" style="width: 50px; height: 50px; object-fit: cover;" />
                    </td>
                    <td>
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

  // Construct image URLs
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
            <div key={item.id} className="card mb-3">
              <div className="card-body d-flex align-items-center">
                <img
                  src={getImageUrl(item.adjusted_image || item.cropped_image || item.original_image)}
                  alt="Item"
                  style={{ height: '80px', width: '80px', objectFit: 'cover', marginRight: '15px' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=Image+Not+Found'; }}
                />
                <div>
                  <p><strong>Frame:</strong> {item.frame?.name || 'None'}</p>
                  <p><strong>Print Size:</strong> {item.print_width || 'N/A'} x {item.print_height || 'N/A'} {item.print_unit}</p>
                  <p><strong>Price:</strong> ${item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}</p>
                  <p><strong>Status:</strong> {item.status || 'Pending'}</p>
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
