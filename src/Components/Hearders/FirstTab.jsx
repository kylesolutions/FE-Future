import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Frame, FileText, Gift } from 'lucide-react';
import './FirstTab.css';

function FirstTab() {
  const navigate = useNavigate();

  const services = [
    {
      title: 'Print',
      icon: Printer,
      path: '/design',
      state: { isPrintOnly: true },
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Print & Frame',
      icon: Frame,
      path: '/design',
      state: { isPrintOnly: false },
      gradient: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Document Printing',
      icon: FileText,
      path: '/document',
      state: { isDocumentPrinting: true },
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Gift Printing',
      icon: Gift,
      path: '/gifting',
      state: { isGiftPrinting: true },
      gradient: 'from-rose-500 to-rose-600'
    }
  ];

  return (
    <div className="first-tab-container">
      <button
        className="back-btn"
        onClick={() => navigate('/')}
        aria-label="Go back to previous page"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="content-wrapper">
        <div className="header-section">
          <h1 className="main-title">Choose Your Service</h1>
          <p className="main-subtitle">Select the printing service that fits your needs</p>
        </div>

        <div className="services-grid">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.title}
                className="service-card"
                onClick={() => navigate(service.path, { state: service.state })}
              >
                <div className={`icon-wrapper bg-gradient-${service.gradient}`}>
                  <Icon size={32} strokeWidth={2} />
                </div>
                <h3 className="service-title">{service.title}</h3>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FirstTab;
