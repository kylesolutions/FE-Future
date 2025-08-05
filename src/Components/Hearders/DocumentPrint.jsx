
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, FileText, Printer, Package, Truck, Shield, Calculator, Save } from 'lucide-react';
import './DocumentPrint.css';

const BASE_URL = 'http://82.180.146.4:8001';

function DocumentPrint() {
  const [file, setFile] = useState(null);
  const [printTypes, setPrintTypes] = useState([]);
  const [printSizes, setPrintSizes] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [laminationTypes, setLaminationTypes] = useState([]);
  const [printType, setPrintType] = useState('');
  const [printSize, setPrintSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paperType, setPaperType] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Collection');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [lamination, setLamination] = useState('No');
  const [laminationType, setLaminationType] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [vat, setVat] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.user.id);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      try {
        const [printTypeRes, printSizeRes, paperTypeRes, laminationTypeRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/print-types/`, config),
          axios.get(`${BASE_URL}/api/print-sizes/`, config),
          axios.get(`${BASE_URL}/api/paper-types/`, config),
          axios.get(`${BASE_URL}/api/lamination-types/`, config),
        ]);
        setPrintTypes(printTypeRes.data);
        setPrintSizes(printSizeRes.data);
        setPaperTypes(paperTypeRes.data);
        setLaminationTypes(laminationTypeRes.data);
        if (printTypeRes.data.length === 0 || printSizeRes.data.length === 0 || paperTypeRes.data.length === 0) {
          setError('Required printing options are not available. Please contact support.');
        } else {
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
        setError('Failed to load printing options. Please try again.');
        if (error.response?.status === 401) {
          alert('Session expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          dispatch({ type: 'LOGOUT_USER' });
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, [navigate, dispatch]);

  useEffect(() => {
    const calculateTotalPrice = () => {
      let price = 0;
      const selectedPrintType = printType ? printTypes.find(pt => pt.id === parseInt(printType)) : null;
      const selectedPrintSize = printSize ? printSizes.find(ps => ps.id === parseInt(printSize)) : null;
      const selectedPaperType = paperType ? paperTypes.find(pt => pt.id === parseInt(paperType)) : null;
      const selectedLaminationType = laminationType ? laminationTypes.find(lt => lt.id === parseInt(laminationType)) : null;
      
      // Safely parse prices, default to 0 if invalid
      if (selectedPrintType) price += parseFloat(selectedPrintType.price) || 0;
      if (selectedPrintSize) price += parseFloat(selectedPrintSize.price) || 0;
      if (selectedPaperType) price += parseFloat(selectedPaperType.price) || 0;
      if (lamination === 'Yes' && selectedLaminationType) price += parseFloat(selectedLaminationType.price) || 0;
      
      const subtotalPrice = price * quantity;
      const vatAmount = subtotalPrice * 0.05; // 5% VAT
      const total = subtotalPrice + vatAmount + deliveryCharge;
      
      setSubtotal(round(subtotalPrice, 2));
      setVat(round(vatAmount, 2));
      setTotalPrice(round(total, 2));
    };
    calculateTotalPrice();
  }, [printType, printSize, paperType, lamination, laminationType, quantity, deliveryCharge, printTypes, printSizes, paperTypes, laminationTypes]);

  const round = (value, decimals) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  };

  const getSafePrice = (price) => {
    return parseFloat(price) || 0;
  };

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setError(null);
    }
  };

  const handleDeliveryChange = (e) => {
    const method = e.target.value;
    setDeliveryMethod(method);
    setDeliveryCharge(method === 'Delivery' ? 10 : 0);
    setDeliveryAddress(method === 'Collection' ? '' : deliveryAddress);
    setError(null);
  };

  const handleAddressChange = (e) => {
    setDeliveryAddress(e.target.value);
    setError(null);
  };

  const handleLaminationChange = (e) => {
    const value = e.target.value;
    setLamination(value);
    setLaminationType('');
    setError(null);
  };

  const handleLaminationTypeChange = (e) => {
    const value = e.target.value;
    setLaminationType(value);
    setError(null);
  };

  const handleSave = async () => {
    if (!file) {
      setError('Please upload a file.');
      return;
    }
    if (quantity < 1) {
      setError('Quantity must be at least 1.');
      return;
    }
    if (!printType || isNaN(parseInt(printType))) {
      setError('Please select a valid print type.');
      return;
    }
    if (!printSize || isNaN(parseInt(printSize))) {
      setError('Please select a valid print size.');
      return;
    }
    if (!paperType || isNaN(parseInt(paperType))) {
      setError('Please select a valid paper type.');
      return;
    }
    if (deliveryMethod === 'Delivery' && !deliveryAddress.trim()) {
      setError('Please provide a delivery address.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to save the order.');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    let finalUserId = userId;
    if (!finalUserId) {
      try {
        const response = await axios.get(`${BASE_URL}/api/current-user/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        finalUserId = response.data.id;
        localStorage.setItem('userId', finalUserId);
        dispatch({
          type: 'UPDATE_USER',
          payload: {
            id: response.data.id,
            username: response.data.username,
            name: response.data.name || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            type: response.data.is_staff ? 'admin' : response.data.is_user ? 'user' : 'employee',
            is_blocked: response.data.is_blocked || false,
          },
        });
      } catch (error) {
        console.error('Error fetching user ID:', error);
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        dispatch({ type: 'LOGOUT_USER' });
        navigate('/login');
        setLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('print_type', printType);
    formData.append('print_size', printSize);
    formData.append('quantity', quantity);
    formData.append('paper_type', paperType);
    formData.append('delivery_method', deliveryMethod);
    formData.append('delivery_charge', deliveryCharge);
    formData.append('lamination', lamination === 'Yes' ? 'true' : 'false');
    if (lamination === 'Yes' && laminationType && laminationType !== '') {
      formData.append('lamination_type', laminationType);
    }
    if (deliveryMethod === 'Delivery') {
      formData.append('address', deliveryAddress);
    }

    try {
      console.log('Sending FormData:', [...formData.entries()]);
      const response = await axios.post(`${BASE_URL}/api/document-print-orders/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Print order saved successfully!');
      setFile(null);
      setPrintType('');
      setPrintSize('');
      setQuantity(1);
      setPaperType('');
      setDeliveryMethod('Collection');
      setDeliveryAddress('');
      setLamination('No');
      setLaminationType('');
      setDeliveryCharge(0);
      setSubtotal(0);
      setVat(0);
      setTotalPrice(0);
      navigate('/savedorder');
    } catch (error) {
      console.error('Error saving print order:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        try {
          const refreshResponse = await axios.post(`${BASE_URL}/api/token/refresh/`, {
            refresh: localStorage.getItem('refreshToken'),
          });
          localStorage.setItem('token', refreshResponse.data.access);
          const retryResponse = await axios.post(`${BASE_URL}/api/document-print-orders/`, formData, {
            headers: {
              Authorization: `Bearer ${refreshResponse.data.access}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          alert('Print order saved successfully!');
          setFile(null);
          setPrintType('');
          setPrintSize('');
          setQuantity(1);
          setPaperType('');
          setDeliveryMethod('Collection');
          setDeliveryAddress('');
          setLamination('No');
          setLaminationType('');
          setDeliveryCharge(0);
          setSubtotal(0);
          setVat(0);
          setTotalPrice(0);
          navigate('/savedorder');
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          setError('Session expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          dispatch({ type: 'LOGOUT_USER' });
          navigate('/login');
        }
      } else {
        setError('Error saving print order: ' + JSON.stringify(error.response?.data || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && printTypes.length === 0) {
    return (
      <div className="document-loading-container">
        <div className="document-loading-content">
          <div className="document-loading-spinner"></div>
          <p>Loading printing options...</p>
        </div>
      </div>
    );
  }

  if (printTypes.length === 0 || printSizes.length === 0 || paperTypes.length === 0) {
    return (
      <div className="document-error-container">
        <div className="document-error-content">
          <p>Printing options are not available. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-print-workspace">
      <div className="document-print-container">
        <div className="document-header">
          <div className="document-header-content">
            <div className="document-header-icon">
              <Printer size={32} />
            </div>
            <div className="document-header-text">
              <h1 className="document-title">Document Printing</h1>
              <p className="document-subtitle">Professional printing services for all your document needs</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="document-error-alert">
            <p>{error}</p>
          </div>
        )}

        <div className="document-form-container">
          <div className="document-form-card">
            <div className="document-section">
              <div className="document-section-header">
                <Upload size={20} />
                <h3>Upload Document</h3>
              </div>
              <div className="document-upload-area">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={handleFileChange}
                  className="document-file-input"
                  id="document-file-upload"
                />
                <label htmlFor="document-file-upload" className="document-upload-label">
                  <FileText size={24} />
                  <span>Choose File</span>
                  <small>PDF, DOC, DOCX, JPG, PNG</small>
                </label>
                {file && (
                  <div className="document-file-selected">
                    <FileText size={16} />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="document-section">
              <div className="document-section-header">
                <Printer size={20} />
                <h3>Print Options</h3>
              </div>
              <div className="document-options-grid">
                <div className="document-form-group">
                  <label className="document-label">Print Type</label>
                  <select
                    value={printType}
                    onChange={(e) => {
                      setPrintType(e.target.value);
                      setError(null);
                    }}
                    className="document-select"
                  >
                    <option value="">Select Print Type</option>
                    {printTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="document-form-group">
                  <label className="document-label">Print Size</label>
                  <select
                    value={printSize}
                    onChange={(e) => {
                      setPrintSize(e.target.value);
                      setError(null);
                    }}
                    className="document-select"
                  >
                    <option value="">Select Print Size</option>
                    {printSizes.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="document-form-group">
                  <label className="document-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(parseInt(e.target.value) || 1);
                      setError(null);
                    }}
                    className="document-input"
                  />
                </div>

                <div className="document-form-group">
                  <label className="document-label">Paper Type</label>
                  <select
                    value={paperType}
                    onChange={(e) => {
                      setPaperType(e.target.value);
                      setError(null);
                    }}
                    className="document-select"
                  >
                    <option value="">Select Paper Type</option>
                    {paperTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="document-section">
              <div className="document-section-header">
                <Package size={20} />
                <h3>Delivery & Extras</h3>
              </div>
              <div className="document-options-grid">
                <div className="document-form-group">
                  <label className="document-label">
                    <Truck size={16} />
                    Delivery Method
                  </label>
                  <select
                    value={deliveryMethod}
                    onChange={handleDeliveryChange}
                    className="document-select"
                  >
                    <option value="Collection">Collection (AED 0)</option>
                    <option value="Delivery">Delivery (AED 10)</option>
                  </select>
                  {deliveryMethod === 'Delivery' && (
                    <div className="document-form-group-nested">
                      <label className="document-label">Delivery Address</label>
                      <textarea
                        value={deliveryAddress}
                        onChange={handleAddressChange}
                        className="document-textarea"
                        placeholder="Enter your delivery address"
                        rows="4"
                      />
                    </div>
                  )}
                </div>

                <div className="document-form-group">
                  <label className="document-label">
                    <Shield size={16} />
                    Lamination
                  </label>
                  <select
                    value={lamination}
                    onChange={handleLaminationChange}
                    className="document-select"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                  {lamination === 'Yes' && (
                    <div className="document-form-group-nested">
                      <label className="document-label">Lamination Type (Optional)</label>
                      <select
                        value={laminationType}
                        onChange={handleLaminationTypeChange}
                        className="document-select"
                      >
                        <option value="">Select Lamination Type</option>
                        {laminationTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="document-section">
              <div className="document-section-header">
                <Calculator size={20} />
                <h3>Price Summary</h3>
              </div>
              <div className="document-price-summary">
                <div className="document-price-breakdown">
                  {printType && printTypes.find(pt => pt.id === parseInt(printType)) && (
                    <div className="document-price-item">
                      <span>Print Type ({printTypes.find(pt => pt.id === parseInt(printType)).name}):</span>
                      <span>AED {getSafePrice(printTypes.find(pt => pt.id === parseInt(printType)).price).toFixed(2)}</span>
                    </div>
                  )}
                  {printSize && printSizes.find(ps => ps.id === parseInt(printSize)) && (
                    <div className="document-price-item">
                      <span>Print Size ({printSizes.find(ps => ps.id === parseInt(printSize)).name}):</span>
                      <span>AED {getSafePrice(printSizes.find(ps => ps.id === parseInt(printSize)).price).toFixed(2)}</span>
                    </div>
                  )}
                  {paperType && paperTypes.find(pt => pt.id === parseInt(paperType)) && (
                    <div className="document-price-item">
                      <span>Paper Type ({paperTypes.find(pt => pt.id === parseInt(paperType)).name}):</span>
                      <span>AED {getSafePrice(paperTypes.find(pt => pt.id === parseInt(paperType)).price).toFixed(2)}</span>
                    </div>
                  )}
                  {lamination === 'Yes' && laminationType && laminationTypes.find(lt => lt.id === parseInt(laminationType)) && (
                    <div className="document-price-item">
                      <span>Lamination Type ({laminationTypes.find(lt => lt.id === parseInt(laminationType)).name}):</span>
                      <span>AED {getSafePrice(laminationTypes.find(lt => lt.id === parseInt(laminationType)).price).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="document-price-item">
                    <span>Quantity:</span>
                    <span>× {quantity}</span>
                  </div>
                  <div className="document-price-item">
                    <span>Subtotal:</span>
                    <span>AED {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="document-price-item">
                    <span>VAT (5%):</span>
                    <span>AED {vat.toFixed(2)}</span>
                  </div>
                  {deliveryCharge > 0 && (
                    <div className="document-price-item">
                      <span>Delivery:</span>
                      <span>AED {deliveryCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="document-price-total">
                    <span>Total:</span>
                    <span>AED {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="document-actions">
              <button
                onClick={handleSave}
                disabled={loading || !file || !printType || !printSize || !paperType || (deliveryMethod === 'Delivery' && !deliveryAddress.trim())}
                className="document-save-btn"
              >
                {loading ? (
                  <>
                    <div className="document-btn-spinner"></div>
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
    </div>
  );
}

export default DocumentPrint;
