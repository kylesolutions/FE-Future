import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Group, Circle } from 'react-konva';
import useImage from 'use-image';
import { Upload, Crop, Check, X, Menu, Package, Coffee, Crown, Grid, Pen, Save } from 'lucide-react';
import './GiftPrint.css';

const BASE_URL = 'http://82.180.146.4:8001';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>Something went wrong</h3>
            <p>{this.state.error?.message || 'Unknown error occurred'}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const categoryIcons = {
  tshirts: Package,
  mugs: Coffee,
  caps: Crown,
  tiles: Grid,
  pens: Pen,
};

function GiftPrint() {
  const [giftItems, setGiftItems] = useState({
    tshirts: [],
    mugs: [],
    caps: [],
    tiles: [],
    pens: [],
  });
  const [selectedCategory, setSelectedCategory] = useState('tshirts');
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState({ x: 1, y: 1 });
  const [imageRotation, setImageRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 100, y: 100, width: 150, height: 150 });
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState(null);
  const imageRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const stageRef = useRef(null);

  // Calculate canvas size based on container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newSize = Math.min(containerWidth - 40, window.innerHeight * 0.6, 600);
        setCanvasSize({ width: newSize, height: newSize });
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Fetch gift items from backend
  useEffect(() => {
    const fetchGiftItems = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const endpoints = {
          tshirts: '/tshirts/',
          mugs: '/mugs/',
          caps: '/caps/',
          tiles: '/tiles/',
          pens: '/pens/',
        };
        const responses = await Promise.all(
          Object.keys(endpoints).map((category) =>
            axios.get(`${BASE_URL}${endpoints[category]}`, { headers })
          )
        );
        const fetchedItems = {
          tshirts: responses[0].data,
          mugs: responses[1].data,
          caps: responses[2].data,
          tiles: responses[3].data,
          pens: responses[4].data,
        };
        setGiftItems(fetchedItems);
        console.log('Fetched gift items:', fetchedItems);
        // Log IDs to verify
        Object.keys(fetchedItems).forEach((category) => {
          console.log(`${category} IDs:`, fetchedItems[category].map(item => item.id));
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching gift items:', error);
        console.error('Server response:', error.response?.data);
        setError(`Failed to load gift items: ${error.response?.statusText || error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchGiftItems();
  }, []);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          const maxDimension = canvasSize.width * 0.5;
          const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
          setUploadedImage(reader.result);
          setImagePosition({ x: canvasSize.width * 0.25, y: canvasSize.height * 0.25 });
          setImageScale({ x: scale, y: scale });
          setImageRotation(0);
          setCropRect({
            x: canvasSize.width * 0.25,
            y: canvasSize.height * 0.25,
            width: maxDimension * 0.5,
            height: maxDimension * 0.5,
          });
          setIsImageSelected(false);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle save order
  const handleSaveOrder = async () => {
    if (!selectedItem || !uploadedImage) {
      setOrderFeedback({ type: 'error', message: 'Please select an item and upload an image.' });
      return;
    }

    // Validate selectedItem.id
    if (!selectedItem.id || isNaN(parseInt(selectedItem.id)) || parseInt(selectedItem.id) <= 0) {
      console.error('Invalid selectedItem.id:', selectedItem.id);
      console.log('Current selectedItem:', selectedItem);
      setOrderFeedback({ type: 'error', message: 'Invalid item selected. Please select a valid item.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setOrderFeedback({ type: 'error', message: 'You must be logged in to save an order.' });
        return;
      }

      // Convert base64 uploadedImage to a File object
      const response = await fetch(uploadedImage);
      const blob = await response.blob();
      const file = new File([blob], 'custom_image.png', { type: 'image/png' });

      // Prepare form data
      const formData = new FormData();
      const contentType = selectedCategory.slice(0, -1); // e.g., 'mug'
      formData.append('content_type', contentType);
      formData.append('object_id', parseInt(selectedItem.id).toString()); // Ensure integer as string
      formData.append('uploaded_image', file);
      formData.append('image_position_x', imagePosition.x.toString());
      formData.append('image_position_y', imagePosition.y.toString());
      formData.append('image_scale_x', imageScale.x.toString());
      formData.append('image_scale_y', imageScale.y.toString());
      formData.append('image_rotation', imageRotation.toString());
      formData.append('total_price', (selectedItem.price || 0).toString());

      // Log FormData contents for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`FormData: ${key}=${value}`);
      }

      // Send POST request
      const result = await axios.post(`${BASE_URL}/gift-orders/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setOrderFeedback({ type: 'success', message: 'Order saved successfully!' });
      console.log('Order saved:', result.data);
    } catch (error) {
      console.error('Error saving order:', error);
      console.error('Server response:', error.response?.data);
      setOrderFeedback({
        type: 'error',
        message: error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to save order. Please try again.',
      });
    }

    // Clear feedback after 5 seconds
    setTimeout(() => setOrderFeedback(null), 5000);
  };

  // Load images for Konva
  const [giftImage] = useImage(selectedItem?.image ? (selectedItem.image.startsWith('http') ? selectedItem.image : `${BASE_URL}${selectedItem.image}`) : '');
  const [userImage] = useImage(uploadedImage || '');

  // Update transformer for image
  useEffect(() => {
    if (imageRef.current && transformerRef.current && isImageSelected && !isCropping && uploadedImage) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [uploadedImage, isCropping, isImageSelected]);

  // Handle image click to show transformer
  const handleImageClick = () => {
    if (!isCropping && uploadedImage) {
      setIsImageSelected(true);
    }
  };

  // Handle stage click to hide transformer
  const handleStageClick = (e) => {
    if (e.target === stageRef.current.getStage() && !isCropping) {
      setIsImageSelected(false);
    }
  };

  // Handle save button
  const handleSave = () => {
    setIsImageSelected(false);
  };

  // Handle drag for image
  const handleDragEnd = (e) => {
    setImagePosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  // Handle transform for image (resize and rotate)
  const handleTransformEnd = (e) => {
    const node = imageRef.current;
    if (node) {
      setImageScale({
        x: node.scaleX(),
        y: node.scaleY(),
      });
      setImagePosition({
        x: node.x(),
        y: node.y(),
      });
      setImageRotation(node.rotation());
    }
  };

  // Handle crop toggle
  const handleCrop = () => {
    if (isCropping) {
      setIsCropping(false);
      setCropRect({
        x: canvasSize.width * 0.25,
        y: canvasSize.height * 0.25,
        width: canvasSize.width * 0.5,
        height: canvasSize.width * 0.5,
      });
      setIsImageSelected(true);
    } else {
      setIsCropping(true);
      setIsImageSelected(false);
      if (userImage) {
        const maxDimension = canvasSize.width * 0.5;
        setCropRect({
          x: imagePosition.x,
          y: imagePosition.y,
          width: (userImage.width || 100) * imageScale.x * 0.5,
          height: (userImage.height || 100) * imageScale.y * 0.5,
        });
      }
    }
  };

  // Apply crop with mug-specific logic
  const applyCrop = () => {
    if (userImage && selectedCategory === 'mugs') {
      const imgWidth = userImage.width * imageScale.x;
      const imgHeight = userImage.height * imageScale.y;
      const cropX = (cropRect.x - imagePosition.x) / imageScale.x;
      const cropY = (cropRect.y - imagePosition.y) / imageScale.y;
      const cropWidth = cropRect.width / imageScale.x;
      const cropHeight = cropRect.height / imageScale.y;

      const mugMaxWidth = canvasSize.width * 0.8;
      const adjustedCropWidth = Math.min(cropWidth, mugMaxWidth / imageScale.x);

      setImagePosition({ x: cropRect.x, y: cropRect.y });
      setImageScale({
        x: cropRect.width / (userImage.width || 100),
        y: cropRect.height / (userImage.height || 100),
      });
      setImageRotation(0);

      const img = new window.Image();
      img.src = uploadedImage;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = adjustedCropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, cropX, cropY, adjustedCropWidth, cropHeight, 0, 0, adjustedCropWidth, cropHeight);
        setUploadedImage(canvas.toDataURL());
        setIsCropping(false);
        setIsImageSelected(true);
      };
    } else if (userImage) {
      const imgWidth = userImage.width * imageScale.x;
      const imgHeight = userImage.height * imageScale.y;
      const cropX = (cropRect.x - imagePosition.x) / imageScale.x;
      const cropY = (cropRect.y - imagePosition.y) / imageScale.y;
      const cropWidth = cropRect.width / imageScale.x;
      const cropHeight = cropRect.height / imageScale.y;

      setImagePosition({ x: cropRect.x, y: cropRect.y });
      setImageScale({
        x: cropRect.width / (userImage.width || 100),
        y: cropRect.height / (userImage.height || 100),
      });
      setImageRotation(0);

      const img = new window.Image();
      img.src = uploadedImage;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        setUploadedImage(canvas.toDataURL());
        setIsCropping(false);
        setIsImageSelected(true);
      };
    }
  };

  // Handle crop rectangle resizing via handles with mug-specific constraints
  const handleCropHandleDrag = (handle, e) => {
    const newCropRect = { ...cropRect };
    const { x, y } = e.target.position();

    const minSize = 20;
    const maxX = canvasSize.width - minSize;
    const maxY = canvasSize.height - minSize;
    const mugMaxWidth = selectedCategory === 'mugs' ? canvasSize.width * 0.8 : canvasSize.width;

    switch (handle) {
      case 'top-left':
        newCropRect.x = Math.max(0, Math.min(x, newCropRect.x + newCropRect.width - minSize));
        newCropRect.y = Math.max(0, Math.min(y, newCropRect.y + newCropRect.height - minSize));
        newCropRect.width = Math.max(minSize, Math.min(newCropRect.width + (newCropRect.x - x), mugMaxWidth));
        newCropRect.height = Math.max(minSize, newCropRect.height + (newCropRect.y - y));
        break;
      case 'top-right':
        newCropRect.y = Math.max(0, Math.min(y, newCropRect.y + newCropRect.height - minSize));
        newCropRect.width = Math.max(minSize, Math.min(x - newCropRect.x, mugMaxWidth));
        newCropRect.height = Math.max(minSize, newCropRect.height + (newCropRect.y - y));
        break;
      case 'bottom-left':
        newCropRect.x = Math.max(0, Math.min(x, newCropRect.x + newCropRect.width - minSize));
        newCropRect.width = Math.max(minSize, Math.min(newCropRect.width + (newCropRect.x - x), mugMaxWidth));
        newCropRect.height = Math.max(minSize, y - newCropRect.y);
        break;
      case 'bottom-right':
        newCropRect.width = Math.max(minSize, Math.min(x - newCropRect.x, mugMaxWidth));
        newCropRect.height = Math.max(minSize, y - newCropRect.y);
        break;
      case 'top':
        newCropRect.y = Math.max(0, Math.min(y, newCropRect.y + newCropRect.height - minSize));
        newCropRect.height = Math.max(minSize, newCropRect.height + (newCropRect.y - y));
        break;
      case 'bottom':
        newCropRect.height = Math.max(minSize, y - newCropRect.y);
        break;
      case 'left':
        newCropRect.x = Math.max(0, Math.min(x, newCropRect.x + newCropRect.width - minSize));
        newCropRect.width = Math.max(minSize, Math.min(newCropRect.width + (newCropRect.x - x), mugMaxWidth));
        break;
      case 'right':
        newCropRect.width = Math.max(minSize, Math.min(x - newCropRect.x, mugMaxWidth));
        break;
      default:
        break;
    }

    setCropRect(newCropRect);
    e.target.position(getHandlePosition(handle, newCropRect));
  };

  // Calculate handle positions
  const getHandlePosition = (handle, rect) => {
    switch (handle) {
      case 'top-left':
        return { x: rect.x, y: rect.y };
      case 'top-right':
        return { x: rect.x + rect.width, y: rect.y };
      case 'bottom-left':
        return { x: rect.x, y: rect.y + rect.height };
      case 'bottom-right':
        return { x: rect.x + rect.width, y: rect.y + rect.height };
      case 'top':
        return { x: rect.x + rect.width / 2, y: rect.y };
      case 'bottom':
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
      case 'left':
        return { x: rect.x, y: rect.y + rect.height / 2 };
      case 'right':
        return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
      default:
        return { x: 0, y: 0 };
    }
  };

  // Handle flexible side dragging for image
  const handleSideDrag = (side, e) => {
    const node = imageRef.current;
    if (node) {
      const newScale = { ...imageScale };
      const newPosition = { ...imagePosition };
      const { x, y } = e.target.position();
      const minSize = 20;

      switch (side) {
        case 'left':
          newScale.x = Math.max(minSize / (userImage.width || 100), (imagePosition.x + imageScale.x * (userImage.width || 100) - x) / (userImage.width || 100));
          newPosition.x = x;
          break;
        case 'right':
          newScale.x = Math.max(minSize / (userImage.width || 100), (x - imagePosition.x) / (userImage.width || 100));
          break;
        case 'top':
          newScale.y = Math.max(minSize / (userImage.height || 100), (imagePosition.y + imageScale.y * (userImage.height || 100) - y) / (userImage.height || 100));
          newPosition.y = y;
          break;
        case 'bottom':
          newScale.y = Math.max(minSize / (userImage.height || 100), (y - imagePosition.y) / (userImage.height || 100));
          break;
        default:
          break;
      }

      if (selectedCategory === 'mugs') {
        const maxWidth = canvasSize.width * 0.8;
        newScale.x = Math.min(newScale.x, maxWidth / (userImage.width || 100));
      }

      setImageScale(newScale);
      setImagePosition(newPosition);
      e.target.position(getSideHandlePosition(side, newPosition, newScale, userImage));
    }
  };

  // Calculate side handle positions
  const getSideHandlePosition = (side, position, scale, image) => {
    const imgWidth = (image.width || 100) * scale.x;
    const imgHeight = (image.height || 100) * scale.y;
    switch (side) {
      case 'left':
        return { x: position.x, y: position.y + imgHeight / 2 };
      case 'right':
        return { x: position.x + imgWidth, y: position.y + imgHeight / 2 };
      case 'top':
        return { x: position.x + imgWidth / 2, y: position.y };
      case 'bottom':
        return { x: position.x + imgWidth / 2, y: position.y + imgHeight };
      default:
        return { x: 0, y: 0 };
    }
  };

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <ErrorBoundary>
      <div className="gift-print-workspace">
        <div className="mobile-header">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            <Menu size={24} />
            <span>Categories</span>
          </button>
          <h1 className="workspace-title">Gift Designer</h1>
        </div>

        <div className={`gift-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h2>Gift Categories</h2>
            <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="error-alert">
              <p>{error}</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading gift items...</p>
            </div>
          )}

          <div className="categories-list">
            {Object.keys(giftItems).map((category) => {
              const Icon = categoryIcons[category];
              return (
                <div key={category} className="category-section">
                  <button
                    className={`category-header ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedItem(null);
                    }}
                  >
                    <Icon size={20} />
                    <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                  </button>

                  {selectedCategory === category && (
                    <div className="items-grid">
                      {giftItems[category].map((item) => (
                        <div
                          key={item.id}
                          className={`item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedItem(item);
                            setIsSidebarOpen(false);
                            console.log('Selected item:', item);
                          }}
                        >
                          {item.image && (
                            <div className="gift-item-image">
                              <img
                                src={item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}`}
                                alt={item[`${category.slice(0, -1)}_name`] || item.name || 'Item'}
                                onError={(e) => {
                                  console.log('Image failed to load:', e.target.src);
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA2NUw1MCA0NUw2NSA2NUgzNVoiIGZpbGw9IiNEMUQ1REIiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iNSIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4K';
                                }}
                              />
                            </div>
                          )}
                          <div className="gift-item-info">
                            <h4>{item[`${category.slice(0, -1)}_name`] || item.name || 'Unnamed Item'}</h4>
                            {item.price && <p className="gift-item-price">${item.price}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="main-workspace" ref={containerRef}>
          <div className="workspace-controls">
            <div className="gift-control-group">
              <button className="gift-control-btn primary" onClick={triggerFileUpload}>
                <Upload size={18} />
                <span>Upload Image</span>
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
            </div>

            {uploadedImage && (
              <div className="gift-control-group">
                <button
                  className={`gift-control-btn ${isCropping ? 'danger' : 'secondary'}`}
                  onClick={handleCrop}
                >
                  {isCropping ? <X size={18} /> : <Crop size={18} />}
                  <span>{isCropping ? 'Cancel Crop' : 'Crop Image'}</span>
                </button>

                {isCropping && (
                  <button className="gift-control-btn success" onClick={applyCrop}>
                    <Check size={18} />
                    <span>Apply Crop</span>
                  </button>
                )}
                {!isCropping && (
                  <button className="gift-control-btn success" onClick={handleSave}>
                    <Save size={18} />
                    <span>Save</span>
                  </button>
                )}
                {selectedItem && uploadedImage && (
                  <button className="gift-control-btn primary" onClick={handleSaveOrder}>
                    <Save size={18} />
                    <span>Save Order</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {orderFeedback && (
            <div className={`order-feedback ${orderFeedback.type}`}>
              <p>{orderFeedback.message}</p>
            </div>
          )}

          <div className="canvas-workspace">
            <div className="gift-canvas-container">
              <Stage
                width={canvasSize.width}
                height={canvasSize.height}
                className="gift-design-canvas"
                ref={stageRef}
                onClick={handleStageClick}
              >
                <Layer>
                  {giftImage && (() => {
                    const maxDimension = Math.min(canvasSize.width, canvasSize.height);
                    const aspectRatio = giftImage.width / giftImage.height;
                    let width, height;

                    if (selectedCategory === 'mugs') {
                      width = canvasSize.width * 0.9;
                      height = width / aspectRatio;
                      if (height > canvasSize.height * 0.9) {
                        height = canvasSize.height * 0.9;
                        width = height * aspectRatio;
                      }
                    } else {
                      width = giftImage.width;
                      height = giftImage.height;
                      const scale = Math.min(maxDimension / giftImage.width, maxDimension / giftImage.height, 1);
                      width *= scale;
                      height *= scale;
                    }

                    const x = (canvasSize.width - width) / 2;
                    const y = (canvasSize.height - height) / 2;

                    return (
                      <KonvaImage
                        image={giftImage}
                        width={width}
                        height={height}
                        x={x}
                        y={y}
                      />
                    );
                  })()}
                  {userImage && (
                    <Group
                      clipX={isCropping ? cropRect.x : undefined}
                      clipY={isCropping ? cropRect.y : undefined}
                      clipWidth={isCropping ? cropRect.width : undefined}
                      clipHeight={isCropping ? cropRect.height : undefined}
                    >
                      <KonvaImage
                        image={userImage}
                        x={imagePosition.x}
                        y={imagePosition.y}
                        scaleX={imageScale.x}
                        scaleY={imageScale.y}
                        rotation={imageRotation}
                        draggable={!isCropping}
                        ref={imageRef}
                        onClick={handleImageClick}
                        onTap={handleImageClick}
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                      />
                    </Group>
                  )}
                  {isCropping && (
                    <>
                      <Rect
                        x={cropRect.x}
                        y={cropRect.y}
                        width={cropRect.width}
                        height={cropRect.height}
                        stroke="#667eea"
                        strokeWidth={2}
                        draggable={false}
                      />
                      {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'].map(
                        (handle) => (
                          <Circle
                            key={handle}
                            x={getHandlePosition(handle, cropRect).x}
                            y={getHandlePosition(handle, cropRect).y}
                            radius={8}
                            fill="white"
                            stroke="#667eea"
                            strokeWidth={2}
                            draggable
                            onDragMove={(e) => handleCropHandleDrag(handle, e)}
                            onDragEnd={(e) => handleCropHandleDrag(handle, e)}
                          />
                        )
                      )}
                    </>
                  )}
                  {!isCropping && userImage && isImageSelected && (
                    <>
                      {['left', 'right', 'top', 'bottom'].map((side) => (
                        <Circle
                          key={side}
                          x={getSideHandlePosition(side, imagePosition, imageScale, userImage).x}
                          y={getSideHandlePosition(side, imagePosition, imageScale, userImage).y}
                          radius={8}
                          fill="white"
                          stroke="#667eea"
                          strokeWidth={2}
                          draggable
                          onDragMove={(e) => handleSideDrag(side, e)}
                          onDragEnd={(e) => handleSideDrag(side, e)}
                        />
                      ))}
                    </>
                  )}
                  {userImage && !isCropping && isImageSelected && (
                    <Transformer
                      ref={transformerRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 20 || newBox.height < 20) {
                          return oldBox;
                        }
                        return newBox;
                      }}
                    />
                  )}
                </Layer>
              </Stage>
            </div>
          </div>

          {selectedItem && (
            <div className="status-bar">
              <div className="selected-item-info">
                <span>Selected: {selectedItem[`${selectedCategory.slice(0, -1)}_name`] || selectedItem.name || 'Unnamed Item'}</span>
                {selectedItem.price && <span className="price">Price: ${selectedItem.price}</span>}
              </div>
            </div>
          )}
        </div>

        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      </div>
    </ErrorBoundary>
  );
}

export default GiftPrint;