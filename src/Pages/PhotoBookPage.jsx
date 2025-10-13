import React from 'react';
import Navbar from '../Components/Nav/Navbar';
import PhotoBook from '../Components/Hearders/PhotoBook';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PhotoBookPage() {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <PhotoBook/>
      </ErrorBoundary>
    </>
  );
}

export default PhotoBookPage;