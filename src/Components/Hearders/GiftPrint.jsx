import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Group, Circle } from 'react-konva';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import useImage from 'use-image';
import { Upload, Crop, Check, X, Menu, Package, Coffee, Crown, Grid, Pen, Save, Eye } from 'lucide-react';
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
        <div className="alert alert-danger m-3">
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message || 'Unknown error occurred'}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
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

function Mug3D({ textureUrl, canvasSize }) {
  const meshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, textureUrl, (loader) => {
    loader.crossOrigin = 'anonymous';
  });

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5; // Rotate mug for better viewing
    }
  });

  // Simple cylindrical mug geometry
  const radius = 1;
  const height = 2;
  const radialSegments = 32;

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <cylinderGeometry args={[radius, radius, height, radialSegments]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

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
  const [selectedColorVariant, setSelectedColorVariant] = useState(null);
  const [selectedSizeVariant, setSelectedSizeVariant] = useState(null);
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
  const [is3DView, setIs3DView] = useState(false); // State for toggling 2D/3D view
  const imageRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const stageRef = useRef(null);

  // Clear variants for non-T-shirt categories or when no item is selected
  useEffect(() => {
    if (selectedCategory !== 'tshirts' || !selectedItem) {
      setSelectedColorVariant(null);
      setSelectedSizeVariant(null);
    }
  }, [selectedCategory, selectedItem]);

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

  // Load images for Konva
  const [giftImage] = useImage(
    selectedCategory === 'tshirts' && selectedColorVariant?.image
      ? selectedColorVariant.image.startsWith('http')
        ? selectedColorVariant.image
        : `${BASE_URL}${selectedColorVariant.image}`
      : selectedItem?.image
      ? selectedItem.image.startsWith('http')
        ? selectedItem.image
        : `${BASE_URL}${selectedItem.image}`
      : '',
    'anonymous'
  );
  const [userImage] = useImage(uploadedImage || '', 'anonymous');

  // Update transformer for image
  useEffect(() => {
    if (imageRef.current && transformerRef.current && isImageSelected && !isCropping && uploadedImage && !is3DView) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [uploadedImage, isCropping, isImageSelected, is3DView]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.src = reader.result;
        img.crossOrigin = 'anonymous';
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

  // Generate preview image for 2D view
  const generatePreviewImage = async () => {
    if (!stageRef.current || !giftImage || !userImage) {
      console.error('Missing required elements for preview generation:', {
        stage: !!stageRef.current,
        giftImage: !!giftImage,
        userImage: !!userImage,
      });
      return null;
    }

    const stage = stageRef.current.getStage();
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d');

    // Draw gift item or variant image
    const selectedImage = selectedCategory === 'tshirts' && selectedColorVariant?.image ? selectedColorVariant.image : selectedItem?.image;
    const imgSrc = selectedImage
      ? selectedImage.startsWith('http')
        ? selectedImage
        : `${BASE_URL}${selectedImage}`
      : '';
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = () => {
        console.error('Error loading gift image:', imgSrc);
        resolve();
      };
    });

    if (img.complete && img.naturalWidth !== 0) {
      const giftWidth = img.width * Math.min(canvasSize.width / img.width, canvasSize.height / img.height, 1);
      const giftHeight = img.height * Math.min(canvasSize.width / img.width, canvasSize.height / img.height, 1);
      const giftX = (canvasSize.width - giftWidth) / 2;
      const giftY = (canvasSize.height - giftHeight) / 2;
      try {
        ctx.drawImage(img, giftX, giftY, giftWidth, giftHeight);
      } catch (e) {
        console.error('Error drawing gift image:', e);
        setOrderFeedback({ type: 'error', message: 'Failed to draw gift image due to a security restriction.' });
        return null;
      }
    }

    // Draw user-uploaded image with transformations
    ctx.save();
    ctx.translate(imagePosition.x, imagePosition.y);
    ctx.rotate((imageRotation * Math.PI) / 180);
    ctx.scale(imageScale.x, imageScale.y);
    try {
      ctx.drawImage(userImage, 0, 0, userImage.width, userImage.height);
    } catch (e) {
      console.error('Error drawing user image:', e);
      setOrderFeedback({ type: 'error', message: 'Failed to draw user image due to a security restriction.' });
      return null;
    }
    ctx.restore();

    try {
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Error exporting canvas:', e);
      setOrderFeedback({
        type: 'error',
        message: 'Failed to generate preview due to a security error. Ensure images are served with CORS.',
      });
      return null;
    }
  };

  // Handle save order
  const handleSaveOrder = async () => {
    if (!selectedItem || !uploadedImage) {
      setOrderFeedback({ type: 'error', message: 'Please select an item and upload an image.' });
      return;
    }

    if (selectedCategory === 'tshirts' && (!selectedColorVariant || !selectedSizeVariant)) {
      setOrderFeedback({ type: 'error', message: 'Please select both a color and size variant for the T-shirt.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setOrderFeedback({ type: 'error', message: 'You must be logged in to save an order.' });
        return;
      }

      // Convert base64 images to File objects
      const uploadedResponse = await fetch(uploadedImage);
      const uploadedBlob = await uploadedResponse.blob();
      const uploadedFile = new File([uploadedBlob], 'custom_image.png', { type: 'image/png' });

      let previewImage;
      if (selectedCategory === 'mugs' && is3DView) {
        // For 3D view, use the uploaded image directly as the preview (simplified)
        previewImage = uploadedImage;
      } else {
        previewImage = await generatePreviewImage();
        if (!previewImage) {
          setOrderFeedback({ type: 'error', message: 'Failed to generate preview image.' });
          return;
        }
      }

      const previewResponse = await fetch(previewImage);
      const previewBlob = await previewResponse.blob();
      const previewFile = new File([previewBlob], 'preview_image.png', { type: 'image/png' });

      // Prepare form data
      const formData = new FormData();
      formData.append(`${selectedCategory.slice(0, -1)}`, selectedItem.id);
      if (selectedCategory === 'tshirts') {
        formData.append('tshirt_color_variant', selectedColorVariant.id);
        formData.append('tshirt_size_variant', selectedSizeVariant.id);
        formData.append('total_price', (Number(selectedColorVariant.price) + Number(selectedSizeVariant.price)).toString());
      } else {
        formData.append('total_price', selectedItem.price.toString());
      }
      formData.append('uploaded_image', uploadedFile);
      formData.append('preview_image', previewFile);
      formData.append('image_position_x', imagePosition.x.toString());
      formData.append('image_position_y', imagePosition.y.toString());
      formData.append('image_scale_x', imageScale.x.toString());
      formData.append('image_scale_y', imageScale.y.toString());
      formData.append('image_rotation', imageRotation.toString());
      formData.append('status', 'pending');

      // Log FormData contents
      console.log('Saving order with state:', {
        selectedCategory,
        selectedItem: selectedItem
          ? {
              id: selectedItem.id,
              name:
                selectedItem.tshirt_name ||
                selectedItem.mug_name ||
                selectedItem.cap_name ||
                selectedItem.tile_name ||
                selectedItem.pen_name,
            }
          : null,
        selectedColorVariant: selectedColorVariant ? { id: selectedColorVariant.id, color: selectedColorVariant.color_name } : null,
        selectedSizeVariant: selectedSizeVariant ? { id: selectedSizeVariant.id, size: selectedSizeVariant.size_name } : null,
      });
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`FormData: ${key}=${typeof value === 'object' ? value.name : value}`);
      }

      // Send POST request
      const result = await axios.post(`${BASE_URL}/gift-orders/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Order saved:', result.data);
      setOrderFeedback({ type: 'success', message: `Order saved successfully! ID: ${result.data.id}` });
      setUploadedImage(null);
      setSelectedItem(null);
      setSelectedColorVariant(null);
      setSelectedSizeVariant(null);
      setImagePosition({ x: 0, y: 0 });
      setImageScale({ x: 1, y: 1 });
      setImageRotation(0);
      setIsImageSelected(false);
      setIsCropping(false);
      setIs3DView(false);
    } catch (error) {
      console.error('Error saving order:', error);
      console.error('Server response:', error.response?.data);
      let errorMessage = 'Failed to save order. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'object' && !Array.isArray(error.response.data)) {
          errorMessage = Object.keys(error.response.data)
            .map((key) => {
              const value = error.response.data[key];
              return Array.isArray(value) ? `${key}: ${value.join(', ')}` : `${key}: ${value}`;
            })
            .join(' ');
        } else {
          errorMessage = 'An unexpected server error occurred.';
        }
      }
      setOrderFeedback({ type: 'error', message: errorMessage });
    }

    setTimeout(() => setOrderFeedback(null), 5000);
  };

  // Handle image click to show transformer
  const handleImageClick = () => {
    if (!isCropping && uploadedImage && !is3DView) {
      setIsImageSelected(true);
    }
  };

  // Handle stage click to hide transformer
  const handleStageClick = (e) => {
    if (e.target === stageRef.current?.getStage() && !isCropping && !is3DView) {
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

  // Handle transform for image
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
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = adjustedCropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, cropX, cropY, adjustedCropWidth, cropHeight, 0, 0, adjustedCropWidth, cropHeight);
        try {
          setUploadedImage(canvas.toDataURL('image/png'));
        } catch (e) {
          console.error('Error exporting cropped image:', e);
          setOrderFeedback({ type: 'error', message: 'Failed to crop image due to a security error.' });
        }
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
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        try {
          setUploadedImage(canvas.toDataURL('image/png'));
        } catch (e) {
          console.error('Error exporting cropped image:', e);
          setOrderFeedback({ type: 'error', message: 'Failed to crop image due to a security error.' });
        }
        setIsCropping(false);
        setIsImageSelected(true);
      };
    }
  };

  // Handle crop rectangle resizing
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
          newScale.x = Math.max(
            minSize / (userImage.width || 100),
            (imagePosition.x + imageScale.x * (userImage.width || 100) - x) / (userImage.width || 100)
          );
          newPosition.x = x;
          break;
        case 'right':
          newScale.x = Math.max(minSize / (userImage.width || 100), (x - imagePosition.x) / (userImage.width || 100));
          break;
        case 'top':
          newScale.y = Math.max(
            minSize / (userImage.height || 100),
            (imagePosition.y + imageScale.y * (userImage.height || 100) - y) / (userImage.height || 100)
          );
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

  // Toggle between 2D and 3D view
  const toggleView = () => {
    setIs3DView(!is3DView);
    setIsImageSelected(false);
    setIsCropping(false);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <ErrorBoundary>
      <div className="container-fluid gift-print-workspace">
        <div className="d-flex align-items-center justify-content-between p-3 bg-light border-bottom d-lg-none">
          <button className="btn btn-outline-primary" onClick={toggleSidebar}>
            <Menu size={24} />
            <span className="ms-2">Categories</span>
          </button>
          <h1 className="h4 m-0">Gift Designer</h1>
        </div>

        <div className={`gift-sidebar ${isSidebarOpen ? 'open' : ''} col-lg-3 bg-white border-end p-3`}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5">Gift Categories</h2>
            <button className="btn btn-outline-secondary d-lg-none" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="alert alert-danger">
              <p>{error}</p>
            </div>
          )}

          {loading && (
            <div className="text-center">
              <div className="spinner-border" role="status"></div>
              <p>Loading gift items...</p>
            </div>
          )}

          <div className="categories-list">
            {Object.keys(giftItems).map((category) => {
              const Icon = categoryIcons[category];
              return (
                <div key={category} className="mb-3">
                  <button
                    className={`btn btn-outline-primary w-100 text-start mb-2 ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedItem(null);
                      setSelectedColorVariant(null);
                      setSelectedSizeVariant(null);
                      setIs3DView(category === 'mugs' ? is3DView : false); // Reset 3D view for non-mug categories
                    }}
                  >
                    <Icon size={20} className="me-2" />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>

                  {selectedCategory === category && (
                    <div className="row row-cols-1 g-2">
                      {giftItems[category].map((item) => (
                        <div
                          key={item.id}
                          className={`card ${selectedItem?.id === item.id ? 'border-primary' : ''}`}
                          onClick={() => {
                            setSelectedItem(item);
                            setSelectedColorVariant(null);
                            setSelectedSizeVariant(null);
                            setIsSidebarOpen(false);
                            console.log('Selected item:', item);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.image && (
                            <div className="card-img-top p-2">
                              <img
                                src={item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}`}
                                alt={item[`${category.slice(0, -1)}_name`] || item.name || 'Item'}
                                className="img-fluid"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  console.log('Image failed to load:', e.target.src);
                                  e.target.src =
                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA2NUw1MCA0NUw2NSA2NUgzNVoiIGZpbGw9IiNEMUQ1REIiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iNSIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4K';
                                }}
                                style={{ maxHeight: '100px', objectFit: 'contain' }}
                              />
                            </div>
                          )}
                          <div className="card-body">
                            <h5 className="card-title">{item[`${category.slice(0, -1)}_name`] || item.name || 'Unnamed Item'}</h5>
                            {item.price && <p className="card-text text-muted">${item.price}</p>}
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

        <div className="main-workspace col-lg-9 p-3" ref={containerRef}>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <div>
              <button className="btn btn-primary" onClick={triggerFileUpload}>
                <Upload size={18} className="me-2" />
                Upload Image
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
            </div>

            {selectedCategory === 'tshirts' && selectedItem && (
              <div className="d-flex gap-2">
                <select
                  value={selectedColorVariant?.id || ''}
                  onChange={(e) => {
                    const variant = selectedItem.color_variants.find((v) => v.id === parseInt(e.target.value));
                    setSelectedColorVariant(variant || null);
                    console.log('Selected color variant:', variant);
                  }}
                  className="form-select"
                >
                  <option value="">Select Color</option>
                  {selectedItem.color_variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.color_name} (${variant.price})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSizeVariant?.id || ''}
                  onChange={(e) => {
                    const variant = selectedItem.size_variants.find((v) => v.id === parseInt(e.target.value));
                    setSelectedSizeVariant(variant || null);
                    console.log('Selected size variant:', variant);
                  }}
                  className="form-select"
                >
                  <option value="">Select Size</option>
                  {selectedItem.size_variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.size_name} (${variant.price})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCategory === 'tshirts' && selectedItem && selectedItem.color_variants.length === 0 && (
              <div>
                <p className="text-danger">No color variants available for this T-shirt.</p>
              </div>
            )}

            {selectedCategory === 'tshirts' && selectedItem && selectedItem.size_variants.length === 0 && (
              <div>
                <p className="text-danger">No size variants available for this T-shirt.</p>
              </div>
            )}

            {uploadedImage && (
              <div className="d-flex gap-2">
                {selectedCategory === 'mugs' && (
                  <button className="btn btn-outline-secondary" onClick={toggleView}>
                    <Eye size={18} className="me-2" />
                    {is3DView ? 'Switch to 2D View' : 'Switch to 3D View'}
                  </button>
                )}
                {!is3DView && (
                  <>
                    <button
                      className={`btn ${isCropping ? 'btn-danger' : 'btn-outline-secondary'}`}
                      onClick={handleCrop}
                    >
                      {isCropping ? <X size={18} className="me-2" /> : <Crop size={18} className="me-2" />}
                      {isCropping ? 'Cancel Crop' : 'Crop Image'}
                    </button>

                    {isCropping && (
                      <button className="btn btn-success" onClick={applyCrop}>
                        <Check size={18} className="me-2" />
                        Apply Crop
                      </button>
                    )}
                    {!isCropping && (
                      <button className="btn btn-success" onClick={handleSave}>
                        <Save size={18} className="me-2" />
                        Save
                      </button>
                    )}
                  </>
                )}
                {selectedItem && uploadedImage && (selectedCategory !== 'tshirts' || (selectedColorVariant && selectedSizeVariant)) && (
                  <button className="btn btn-primary" onClick={handleSaveOrder}>
                    <Save size={18} className="me-2" />
                    Save Order
                  </button>
                )}
              </div>
            )}
          </div>

          {orderFeedback && (
            <div className={`alert alert-${orderFeedback.type === 'success' ? 'success' : 'danger'} mb-3`}>
              <p>{orderFeedback.message}</p>
            </div>
          )}

          <div className="canvas-workspace card p-3">
            <div className="gift-canvas-container">
              {selectedCategory === 'mugs' && is3DView && uploadedImage ? (
                <Canvas
                  style={{ width: canvasSize.width, height: canvasSize.height }}
                  camera={{ position: [0, 0, 5], fov: 50 }}
                >
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} intensity={1} />
                  <Mug3D textureUrl={uploadedImage} canvasSize={canvasSize} />
                </Canvas>
              ) : (
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
                          stroke="#0d6efd"
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
                              stroke="#0d6efd"
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
                            stroke="#0d6efd"
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
              )}
            </div>
          </div>

          {selectedItem && (
            <div className="card-footer bg-light mt-3">
              <div className="d-flex flex-wrap gap-2">
                <span>
                  <strong>Selected:</strong>{' '}
                  {selectedItem[`${selectedCategory.slice(0, -1)}_name`] || selectedItem.name || 'Unnamed Item'}
                </span>
                {selectedCategory === 'tshirts' && selectedColorVariant && selectedSizeVariant && (
                  <span>
                    <strong>Variant:</strong> {selectedColorVariant.color_name} - {selectedSizeVariant.size_name}
                  </span>
                )}
                {(selectedCategory === 'tshirts'
                  ? selectedColorVariant && selectedSizeVariant
                    ? Number(selectedColorVariant.price) + Number(selectedSizeVariant.price)
                    : 0
                  : selectedItem?.price) && (
                  <span>
                    <strong>Price:</strong> $
                    {selectedCategory === 'tshirts'
                      ? selectedColorVariant && selectedSizeVariant
                        ? (Number(selectedColorVariant.price) + Number(selectedSizeVariant.price)).toFixed(2)
                        : '0.00'
                      : selectedItem.price}
                  </span>
                )}
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