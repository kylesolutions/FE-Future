import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Printer, Package, Truck, Save } from 'lucide-react';
axios.defaults.baseURL = 'http://82.180.146.4:8001';

function DocPrint() {
  const [files, setFiles] = useState([]);
  const [printTypes, setPrintTypes] = useState([]);
  const [printSizes, setPrintSizes] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [laminationTypes, setLaminationTypes] = useState([]);
  const [formData, setFormData] = useState({
    printType: '',
    printSize: '',
    paperType: '',
    lamination: false,
    laminationType: '',
    deliveryOption: 'collection',
    address: { city: '', pin: '', houseName: '' },
    quantity: 1,
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to access this page');
      return;
    }
    setLoading(true);
    Promise.all([
      axios.get('/api/print-types/', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/print-sizes/', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/paper-types/', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/lamination-types/', { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([printTypesRes, printSizesRes, paperTypesRes, laminationTypesRes]) => {
        setPrintTypes(printTypesRes.data);
        setPrintSizes(printSizesRes.data);
        setPaperTypes(paperTypesRes.data);
        setLaminationTypes(laminationTypesRes.data);
        setError('');
      })
      .catch((err) => setError('Failed to load options'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Calculate total amount
    let total = 0;
    const selectedPrintType = printTypes.find(pt => pt.id === parseInt(formData.printType));
    const selectedPrintSize = printSizes.find(ps => ps.id === parseInt(formData.printSize));
    const selectedPaperType = paperTypes.find(pt => pt.id === parseInt(formData.paperType));
    const selectedLaminationType = laminationTypes.find(lt => lt.id === parseInt(formData.laminationType));
    if (selectedPrintType) total += parseFloat(selectedPrintType.price);
    if (selectedPrintSize) total += parseFloat(selectedPrintSize.price);
    if (selectedPaperType) total += parseFloat(selectedPaperType.price);
    if (formData.lamination && selectedLaminationType) total += parseFloat(selectedLaminationType.price);
    if (formData.deliveryOption === 'delivery') total += 5.00; // Delivery charge
    total *= formData.quantity;
    setTotalAmount(total.toFixed(2));
  }, [formData, printTypes, printSizes, paperTypes, laminationTypes]);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
    setError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [addressField]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const handleLaminationToggle = () => {
    setFormData({ ...formData, lamination: !formData.lamination, laminationType: '' });
  };

  const handleSaveOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login');
      return;
    }
    if (files.length === 0) {
      setError('Please upload at least one file');
      return;
    }
    if (!formData.printType || !formData.printSize || !formData.paperType || (formData.lamination && !formData.laminationType)) {
      setError('Please fill all required fields');
      return;
    }
    if (formData.deliveryOption === 'delivery' && (!formData.address.city || !formData.address.pin || !formData.address.houseName)) {
      setError('Please fill all address fields for delivery');
      return;
    }
    setLoading(true);
    const orderData = new FormData();
    files.forEach((file) => {
      orderData.append('files', file);
    });
    orderData.append('print_type', formData.printType);
    orderData.append('print_size', formData.printSize);
    orderData.append('paper_type', formData.paperType);
    orderData.append('lamination', formData.lamination);
    if (formData.lamination) orderData.append('lamination_type', formData.laminationType);
    orderData.append('delivery_option', formData.deliveryOption);
    orderData.append('quantity', formData.quantity);
    if (formData.deliveryOption === 'delivery') {
      orderData.append('address_city', formData.address.city);
      orderData.append('address_pin', formData.address.pin);
      orderData.append('address_house_name', formData.address.houseName);
    }
    try {
      const response = await axios.post('/api/orders/', orderData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      });
      alert('Order saved successfully!');
      setFiles([]);
      setFormData({
        printType: '',
        printSize: '',
        paperType: '',
        lamination: false,
        laminationType: '',
        deliveryOption: 'collection',
        address: { city: '', pin: '', houseName: '' },
        quantity: 1,
      });
      setTotalAmount(0);
      setError('');
    } catch (err) {
      console.error('Save order error:', err.response?.data);
      setError(err.response?.data?.detail || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="docprint-loading-container">
        <div className="docprint-loading-content">
          <div className="docprint-loading-spinner"></div>
          <p>Loading printing options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="docprint-workspace">
      <style>{`
        /* Document Print Workspace Styles */
        .docprint-workspace {
          min-height: 100vh;
          background: linear-gradient(135deg, #f1eedd 0%, #e7d98a 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* Loading States */
        .docprint-loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #f1eedd 0%, #e7d98a 100%);
        }

        .docprint-loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 40px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          color: #4a5568;
        }

        .docprint-loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(102, 126, 234, 0.2);
          border-top: 4px solid #e7d98a;
          border-radius: 50%;
          animation: docprintSpin 1s linear infinite;
        }

        @keyframes docprintSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Error Boundary */
        .docprint-error-boundary {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .docprint-error-content {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 400px;
        }

        .docprint-error-content h3 {
          color: #e53e3e;
          margin-bottom: 16px;
          font-size: 24px;
          font-weight: 600;
        }

        .docprint-error-content p {
          color: #718096;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .docprint-retry-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #FFD700 0%, #998304 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .docprint-retry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        /* Header Styles */
        .docprint-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .docprint-header-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .docprint-header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #f1eedd 0%, #e7d98a 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .docprint-header-text {
          flex: 1;
        }

        .docprint-title {
          margin: 0 0 8px 0;
          color: #2d3748;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .docprint-subtitle {
          margin: 0;
          color: #718096;
          font-size: 16px;
          line-height: 1.5;
        }

        /* Form Container */
        .docprint-form-container {
          display: flex;
          justify-content: center;
          flex: 1;
          padding-bottom: 200px; /* Ensures content is not hidden by footer */
        }

        .docprint-form-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 100%;
          max-width: 700px;
        }

        /* Error Alert */
        .docprint-error-alert {
          background: rgba(229, 62, 62, 0.1);
          border: 1px solid rgba(229, 62, 62, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          color: #e53e3e;
          font-size: 14px;
          line-height: 1.5;
        }

        /* Section Styles */
        .docprint-section {
          margin-bottom: 30px;
          padding-bottom: 30px;
          border-bottom: 1px solid rgba(102, 126, 234, 0.1);
        }

        .docprint-section:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .docprint-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          color: #2d3748;
        }

        .docprint-section-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        /* Upload Area */
        .docprint-upload-area {
          position: relative;
        }

        .docprint-file-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .docprint-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 20px;
          border: 2px dashed #e7d98a;
          border-radius: 16px;
          background: rgba(102, 126, 234, 0.05);
          cursor: pointer;
          transition: all 0.2s ease;
          color: #e7d98a;
          text-align: center;
        }

        .docprint-upload-label:hover {
          background: rgba(102, 126, 234, 0.1);
          border-color: #e7d98a;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
        }

        .docprint-upload-label span {
          font-size: 16px;
          font-weight: 600;
        }

        .docprint-upload-label small {
          font-size: 12px;
          opacity: 0.8;
        }

        /* Form Elements */
        .docprint-options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .docprint-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .docprint-form-group-nested {
          margin-top: 12px;
        }

        .docprint-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 4px;
        }

        .docprint-input,
        .docprint-select {
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          background: white;
          transition: all 0.2s ease;
          color: #2d3748;
        }

        .docprint-input:focus,
        .docprint-select:focus {
          outline: none;
          border-color: #e7d98a;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        .docprint-select {
          cursor: pointer;
        }

        .docprint-checkbox-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .docprint-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        /* Price Summary */
        .docprint-price-summary {
          background: rgba(102, 126, 234, 0.05);
          border: 1px solid rgba(102, 126, 234, 0.1);
          border-radius: 16px;
          padding: 20px;
        }

        .docprint-price-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .docprint-price-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #4a5568;
        }

        .docprint-price-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 2px solid rgba(102, 126, 234, 0.2);
          font-size: 18px;
          font-weight: 700;
          color: #2d3748;
        }

        /* Action Button */
        .docprint-actions {
          display: flex;
          justify-content: center;
          margin-top: 30px;
        }

        .docprint-save-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #f1eedd 0%, #e7d98a 100%);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          min-width: 200px;
        }

        .docprint-save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
        }

        .docprint-save-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .docprint-save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .docprint-btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: docprintSpin 1s linear infinite;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .docprint-workspace {
            padding: 15px;
          }

          .docprint-header {
            padding: 20px;
            margin-bottom: 20px;
          }

          .docprint-header-content {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }

          .docprint-header-icon {
            width: 50px;
            height: 50px;
          }

          .docprint-title {
            font-size: 24px;
          }

          .docprint-subtitle {
            font-size: 14px;
          }

          .docprint-form-card {
            padding: 20px;
          }

          .docprint-options-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .docprint-section {
            margin-bottom: 25px;
            padding-bottom: 25px;
          }

          .docprint-upload-label {
            padding: 30px 15px;
          }

          .docprint-price-summary {
            padding: 15px;
          }

          .docprint-save-btn {
            padding: 14px 24px;
            font-size: 14px;
            min-width: 180px;
          }

          .docprint-form-container {
            padding-bottom: 250px; /* Adjusted for mobile */
          }
        }

        @media (max-width: 480px) {
          .docprint-workspace {
            padding: 10px;
          }

          .docprint-header {
            padding: 15px;
          }

          .docprint-title {
            font-size: 20px;
          }

          .docprint-form-card {
            padding: 15px;
          }

          .docprint-section-header h3 {
            font-size: 16px;
          }

          .docprint-upload-label {
            padding: 25px 10px;
          }

          .docprint-upload-label span {
            font-size: 14px;
          }

          .docprint-input,
          .docprint-select {
            padding: 10px 12px;
            font-size: 13px;
          }

          .docprint-price-total {
            font-size: 16px;
          }

          .docprint-save-btn {
            padding: 12px 20px;
            font-size: 13px;
            min-width: 160px;
          }
        }

        /* Smooth Animations */
        * {
          box-sizing: border-box;
        }

        .docprint-workspace * {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      {error ? (
        <div className="docprint-error-boundary">
          <div className="docprint-error-content">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="docprint-retry-btn">
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="docprint-workspace">
          <div className="docprint-header">
            <div className="docprint-header-content">
              <div className="docprint-header-icon">
                <Printer size={32} />
              </div>
              <div className="docprint-header-text">
                <h1 className="docprint-title">Document Printing</h1>
                <p className="docprint-subtitle">Professional printing services for all your document needs</p>
              </div>
            </div>
          </div>
          <div className="docprint-form-container">
            <div className="docprint-form-card">
              {error && (
                <div className="docprint-error-alert">
                  <p>{error}</p>
                </div>
              )}
              <div className="docprint-section">
                <div className="docprint-section-header">
                  <FileText size={20} />
                  <h3>Upload Documents</h3>
                </div>
                <div className="docprint-upload-area">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="docprint-file-input"
                    id="docprint-file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                  />
                  <label htmlFor="docprint-file-upload" className="docprint-upload-label">
                    <FileText size={24} />
                    <span>Choose Files</span>
                    <small>PDF, DOC, DOCX, JPG, PNG</small>
                  </label>
                  {files.length > 0 && (
                    <div className="docprint-file-list">
                      {files.map((file, index) => (
                        <div key={index} className="docprint-file-selected">
                          <FileText size={16} />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="docprint-section">
                <div className="docprint-section-header">
                  <Printer size={20} />
                  <h3>Print Options</h3>
                </div>
                <div className="docprint-options-grid">
                  <div className="docprint-form-group">
                    <label className="docprint-label">Print Type</label>
                    <select
                      name="printType"
                      value={formData.printType}
                      onChange={handleFormChange}
                      className="docprint-select"
                    >
                      <option value="">Select Print Type</option>
                      {printTypes.map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.name} - ${pt.price}</option>
                      ))}
                    </select>
                  </div>
                  <div className="docprint-form-group">
                    <label className="docprint-label">Print Size</label>
                    <select
                      name="printSize"
                      value={formData.printSize}
                      onChange={handleFormChange}
                      className="docprint-select"
                    >
                      <option value="">Select Print Size</option>
                      {printSizes.map(ps => (
                        <option key={ps.id} value={ps.id}>{ps.name} - ${ps.price}</option>
                      ))}
                    </select>
                  </div>
                  <div className="docprint-form-group">
                    <label className="docprint-label">Paper Type</label>
                    <select
                      name="paperType"
                      value={formData.paperType}
                      onChange={handleFormChange}
                      className="docprint-select"
                    >
                      <option value="">Select Paper Type</option>
                      {paperTypes.map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.name} - ${pt.price}</option>
                      ))}
                    </select>
                  </div>
                  <div className="docprint-form-group">
                    <label className="docprint-label">Lamination</label>
                    <div className="docprint-checkbox-group">
                      <input
                        type="checkbox"
                        checked={formData.lamination}
                        onChange={handleLaminationToggle}
                        className="docprint-checkbox"
                      />
                      <span>Enable Lamination</span>
                    </div>
                    {formData.lamination && (
                      <div className="docprint-form-group-nested">
                        <label className="docprint-label">Lamination Type</label>
                        <select
                          name="laminationType"
                          value={formData.laminationType}
                          onChange={handleFormChange}
                          className="docprint-select"
                        >
                          <option value="">Select Lamination Type</option>
                          {laminationTypes.map(lt => (
                            <option key={lt.id} value={lt.id}>{lt.name} - ${lt.price}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="docprint-form-group">
                    <label className="docprint-label">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleFormChange}
                      min="1"
                      className="docprint-input"
                    />
                  </div>
                  <div className="docprint-form-group">
                    <label className="docprint-label">
                      <Truck size={16} />
                      Delivery Option
                    </label>
                    <select
                      name="deliveryOption"
                      value={formData.deliveryOption}
                      onChange={handleFormChange}
                      className="docprint-select"
                    >
                      <option value="collection">Collection ($0.00)</option>
                      <option value="delivery">Delivery ($5.00)</option>
                    </select>
                  </div>
                </div>
              </div>
              {formData.deliveryOption === 'delivery' && (
                <div className="docprint-section">
                  <div className="docprint-section-header">
                    <Package size={20} />
                    <h3>Delivery Address</h3>
                  </div>
                  <div className="docprint-options-grid">
                    <div className="docprint-form-group">
                      <label className="docprint-label">City</label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleFormChange}
                        placeholder="City"
                        className="docprint-input"
                      />
                    </div>
                    <div className="docprint-form-group">
                      <label className="docprint-label">Pin Code</label>
                      <input
                        type="text"
                        name="address.pin"
                        value={formData.address.pin}
                        onChange={handleFormChange}
                        placeholder="Pin Code"
                        className="docprint-input"
                      />
                    </div>
                    <div className="docprint-form-group">
                      <label className="docprint-label">House Name</label>
                      <input
                        type="text"
                        name="address.houseName"
                        value={formData.address.houseName}
                        onChange={handleFormChange}
                        placeholder="House Name"
                        className="docprint-input"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="docprint-section">
                <div className="docprint-section-header">
                  <Save size={20} />
                  <h3>Price Summary</h3>
                </div>
                <div className="docprint-price-summary">
                  <div className="docprint-price-breakdown">
                    {formData.printType && (
                      <div className="docprint-price-item">
                        <span>Print Type ({printTypes.find(pt => pt.id === parseInt(formData.printType))?.name}):</span>
                        <span>${parseFloat(printTypes.find(pt => pt.id === parseInt(formData.printType))?.price || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.printSize && (
                      <div className="docprint-price-item">
                        <span>Print Size ({printSizes.find(ps => ps.id === parseInt(formData.printSize))?.name}):</span>
                        <span>${parseFloat(printSizes.find(ps => ps.id === parseInt(formData.printSize))?.price || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.paperType && (
                      <div className="docprint-price-item">
                        <span>Paper Type ({paperTypes.find(pt => pt.id === parseInt(formData.paperType))?.name}):</span>
                        <span>${parseFloat(paperTypes.find(pt => pt.id === parseInt(formData.paperType))?.price || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.lamination && formData.laminationType && (
                      <div className="docprint-price-item">
                        <span>Lamination ({laminationTypes.find(lt => lt.id === parseInt(formData.laminationType))?.name}):</span>
                        <span>${parseFloat(laminationTypes.find(lt => lt.id === parseInt(formData.laminationType))?.price || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.deliveryOption === 'delivery' && (
                      <div className="docprint-price-item">
                        <span>Delivery:</span>
                        <span>$5.00</span>
                      </div>
                    )}
                    <div className="docprint-price-item">
                      <span>Quantity:</span>
                      <span>× {formData.quantity}</span>
                    </div>
                    <div className="docprint-price-total">
                      <span>Total:</span>
                      <span>${totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="docprint-actions">
                <button
                  onClick={handleSaveOrder}
                  disabled={loading}
                  className="docprint-save-btn"
                >
                  {loading ? (
                    <>
                      <div className="docprint-btn-spinner"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Save Print Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocPrint;