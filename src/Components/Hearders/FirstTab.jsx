import { useNavigate } from 'react-router-dom';
import './firstTab.css';

function FirstTab() {
  const navigate = useNavigate();

  return (
    <div className="container-fluid main">
      <button
        className="back-button"
        onClick={() => navigate('/')}
        aria-label="Go back to previous page"
        title="Back"
      >
        <i className="bi bi-arrow-left-circle"></i>
      </button>
      <div className="row justify-content-center align-items-center">
        <div className="row g-3 justify-content-center">
          <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center">
            <button
              className="main-button"
              onClick={() => navigate('/design', { state: { isPrintOnly: true } })}
            >
              Print
            </button>
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center">
            <button
              className="main-button"
              onClick={() => navigate('/design', { state: { isPrintOnly: false } })}
            >
              Print & Frame
            </button>
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center">
            <button
              className="main-button"
              onClick={() => navigate('/document', { state: { isDocumentPrinting: true } })}
            >
              Document Printing
            </button>
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center">
            <button
              className="main-button"
              onClick={() => navigate('/gifting', { state: { isGiftPrinting: true } })}
            >
              Gift Printing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FirstTab;