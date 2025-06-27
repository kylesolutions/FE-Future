import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Headers.css';

const BASE_URL = 'http://localhost:8000';
const FALLBACK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABYSURBVHhe7cExAQAwDMCg7f8/8A2BFXgJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA+yU/AJSsIW0W2i4AAAAASUVORK5CYII=';

function Headers({ activeCategory, onCategorySelect, cartItem }) {
  const [frames, setFrames] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [nextId, setNextId] = useState(0);
  const [cropping, setCropping] = useState(false);
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropBox, setCropBox] = useState({ x: 100, y: 100, width: 200, height: 200, startX: 0, startY: 0, isResizing: false, resizeHandle: '' });
  const [originalImage, setOriginalImage] = useState(null);
  const [frameImage, setFrameImage] = useState(null);
  const [variantImages, setVariantImages] = useState({});
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const cartItemProcessed = useRef(false);

  const getImageUrl = useCallback((path) => {
    if (!path) return FALLBACK_IMAGE;
    if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    const hasFrame = selectedImage && selectedImage.frame && frameImage;

    let innerX = 0;
    let innerY = 0;
    let innerWidth = canvas.width;
    let innerHeight = canvas.height;

    if (hasFrame) {
      // Assume a 10% border on each side (adjustable based on frame data)
      const borderPercentage = 0.1;
      const borderWidth = canvas.width * borderPercentage;
      const borderHeight = canvas.height * borderPercentage;
      innerX = borderWidth;
      innerY = borderHeight;
      innerWidth = canvas.width - 2 * borderWidth;
      innerHeight = canvas.height - 2 * borderHeight;
    }

    if (cropping) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);

      ctx.save();
      ctx.beginPath();
      ctx.rect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      ctx.clip();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((imageTransform.rotation * Math.PI) / 180);
      ctx.scale(imageTransform.scale, imageTransform.scale);
      ctx.translate(imageTransform.x, imageTransform.y);
      ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
      ctx.restore();
    } else {
      if (hasFrame) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(innerX, innerY, innerWidth, innerHeight);
        ctx.clip();
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((imageTransform.rotation * Math.PI) / 180);
      ctx.scale(imageTransform.scale, imageTransform.scale);
      ctx.translate(imageTransform.x, imageTransform.y);
      ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
      ctx.restore();

      if (hasFrame) {
        ctx.restore();
        ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
      }
    }
  }, [cropping, cropBox, originalImage, imageTransform, frameImage, selectedImageId, uploadedImages]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get(`${BASE_URL}/frames/`, config);
        setFrames(response.data);
      } catch (error) {
        console.error('Error fetching frames:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };
    fetchFrames();
  }, [navigate]);

  useEffect(() => {
    if (selectedImageId === null) {
      setOriginalImage(null);
      setFrameImage(null);
      return;
    }

    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    if (!selectedImage) {
      setOriginalImage(null);
      setFrameImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = getImageUrl(selectedImage.cropped_url || selectedImage.original_url);
    img.onload = () => {
      console.log('Loaded originalImage:', img.src);
      if (selectedImageId === selectedImage.id) {
        setOriginalImage(img);
      }
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${img.src}`);
      if (selectedImageId === selectedImage.id) {
        setOriginalImage(null);
      }
    };
  }, [selectedImageId, uploadedImages, getImageUrl]);

  useEffect(() => {
    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    if (selectedImage && selectedImage.frame) {
      const frameSrc = selectedImage.variants?.finish?.image ||
                       selectedImage.variants?.color?.image ||
                       selectedImage.variants?.size?.image ||
                       selectedImage.variants?.hanging?.image ||
                       selectedImage.frame.image;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(frameSrc);
      img.onload = () => {
        console.log('Frame image loaded:', img.src);
        if (selectedImageId === selectedImage.id) {
          setFrameImage(img);
        }
      };
      img.onerror = () => {
        console.error(`Failed to load frame image: ${img.src}`);
        if (selectedImageId === selectedImage.id) {
          setFrameImage(null);
        }
      };
    } else {
      setFrameImage(null);
    }
  }, [selectedImageId, uploadedImages, getImageUrl]);

  useEffect(() => {
    if (activeCategory === 'crop' && selectedImageId !== null && !cropping) {
      setImageTransform({ x: 0, y: 0, scale: 1, rotation: 0 });
      setCropping(true);
    } else if (activeCategory === 'remove' && selectedImageId !== null) {
      const updatedImages = uploadedImages.filter((img) => img.id !== selectedImageId);
      setUploadedImages(updatedImages);
      setSelectedImageId(updatedImages.length > 0 ? updatedImages[0].id : null);
      onCategorySelect('frame');
    }
  }, [activeCategory, selectedImageId, cropping, uploadedImages, onCategorySelect]);

  const triggerUpload = () => fileInputRef.current.click();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const canvasWidth = 400;
        const canvasHeight = 400;
        const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
        const newImage = {
          id: nextId,
          original_file: file,
          original_url: url,
          cropped_file: null,
          cropped_url: null,
          adjusted_file: null,
          adjusted_url: null,
          frame: null,
          variants: { color: null, size: null, finish: null, hanging: null },
          transform: { x: 0, y: 0, scale, rotation: 0 },
        };
        setUploadedImages((prev) => [...prev, newImage]);
        setSelectedImageId(nextId);
        setNextId((prev) => prev + 1);
        setCropping(false);
        onCategorySelect('frame');
      };
    }
  };

  const selectImage = (id) => {
    setSelectedImageId(id);
    setCropping(false);
    const selectedImage = uploadedImages.find((img) => img.id === id);
    if (selectedImage) {
      setImageTransform(selectedImage.transform);
    }
  };

  const handleImageError = (e) => {
    console.warn(`Image failed to load: ${e.target.src}`);
    e.target.src = FALLBACK_IMAGE;
  };

  const handleCanvasMouseDown = useCallback((e) => {
    if (!uploadedImages.find((img) => img.id === selectedImageId)) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (cropping) {
      const handleSize = 8;
      const items = [
        { x: cropBox.x - handleSize / 2, y: cropBox.y - handleSize / 2, type: 'nw' },
        { x: cropBox.x + cropBox.width - handleSize / 2, y: cropBox.y - handleSize / 2, type: 'ne' },
        { x: cropBox.x - handleSize / 2, y: cropBox.y + cropBox.height - handleSize / 2, type: 'sw' },
        { x: cropBox.x + cropBox.width - handleSize / 2, y: cropBox.y + cropBox.height - handleSize / 2, type: 'se' },
        { x: cropBox.x + cropBox.width / 2 - handleSize / 2, y: cropBox.y - handleSize / 2, type: 'n' },
        { x: cropBox.x + cropBox.width / 2 - handleSize / 2, y: cropBox.y + cropBox.height - handleSize / 2, type: 's' },
        { x: cropBox.x - handleSize / 2, y: cropBox.y + cropBox.height / 2 - handleSize / 2, type: 'w' },
        { x: cropBox.x + cropBox.width - handleSize / 2, y: cropBox.y + cropBox.height / 2 - handleSize / 2, type: 'e' },
      ];

      for (const handle of items) {
        if (mouseX >= handle.x && mouseX <= handle.x + handleSize && mouseY >= handle.y && mouseY <= handle.y + handleSize) {
          setCropBox((prev) => ({ ...prev, isResizing: true, resizeHandle: handle.type, startX: mouseX, startY: mouseY }));
          return;
        }
      }

      if (mouseX >= cropBox.x && mouseX <= cropBox.x + cropBox.width && mouseY >= cropBox.y && mouseY <= cropBox.y + cropBox.height) {
        setCropBox((prev) => ({ ...prev, startX: mouseX - cropBox.x, startY: mouseY - cropBox.y }));
        setIsDragging(true);
        return;
      }
    } else {
      setIsDragging(true);
      setDragStart({ x: mouseX, y: mouseY });
    }
  }, [cropping, cropBox, selectedImageId, uploadedImages]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!uploadedImages.find((img) => img.id === selectedImageId)) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (cropping) {
      if (cropBox.isResizing) {
        const deltaX = mouseX - cropBox.startX;
        const deltaY = mouseY - cropBox.startY;

        setCropBox((prev) => {
          const newBox = { ...prev };
          const maxX = 400 - newBox.width;
          const maxY = 400 - newBox.height;

          switch (prev.resizeHandle) {
            case 'nw':
              newBox.x = Math.max(0, prev.x + deltaX);
              newBox.y = Math.max(0, prev.y + deltaY);
              newBox.width = Math.max(50, prev.width - deltaX);
              newBox.height = Math.max(50, prev.height - deltaY);
              if (newBox.x > maxX) newBox.x = maxX;
              if (newBox.y > maxY) newBox.y = maxY;
              break;
            case 'ne':
              newBox.y = Math.max(0, prev.y + deltaY);
              newBox.width = Math.max(50, mouseX - prev.x);
              newBox.height = Math.max(50, prev.height - deltaY);
              if (newBox.y > maxY) newBox.y = maxY;
              break;
            case 'sw':
              newBox.x = Math.max(0, prev.x + deltaX);
              newBox.width = Math.max(50, prev.width - deltaX);
              newBox.height = Math.max(50, mouseY - prev.y);
              if (newBox.x > maxX) newBox.x = maxX;
              break;
            case 'se':
              newBox.width = Math.max(50, mouseX - prev.x);
              newBox.height = Math.max(50, mouseY - prev.y);
              break;
            case 'n':
              newBox.y = Math.max(0, prev.y + deltaY);
              newBox.height = Math.max(50, prev.height - deltaY);
              if (newBox.y > maxY) newBox.y = maxY;
              break;
            case 's':
              newBox.height = Math.max(50, mouseY - prev.y);
              break;
            case 'w':
              newBox.x = Math.max(0, prev.x + deltaX);
              newBox.width = Math.max(50, prev.width - deltaX);
              if (newBox.x > maxX) newBox.x = maxX;
              break;
            case 'e':
              newBox.width = Math.max(50, mouseX - prev.x);
              break;
            default:
              return prev;
          }

          newBox.startX = mouseX;
          newBox.startY = mouseY;
          return newBox;
        });
      } else if (isDragging) {
        setCropBox((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(400 - prev.width, mouseX - prev.startX)),
          y: Math.max(0, Math.min(400 - prev.height, mouseY - prev.startY)),
        }));
      }
    } else if (isDragging) {
      const newTransform = {
        x: imageTransform.x + (mouseX - dragStart.x) * 0.5,
        y: imageTransform.y + (mouseY - dragStart.y) * 0.5,
        scale: imageTransform.scale,
        rotation: imageTransform.rotation,
      };
      setImageTransform(newTransform);
      setUploadedImages((prev) =>
        prev.map((img) => (img.id === selectedImageId ? { ...img, transform: newTransform } : img))
      );
      setDragStart({ x: mouseX, y: mouseY });
    }
  }, [cropping, cropBox, isDragging, dragStart, selectedImageId, uploadedImages, imageTransform]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setCropBox((prev) => ({ ...prev, isResizing: false, resizeHandle: '' }));
  }, []);

  const adjustScale = useCallback((delta) => {
    const newTransform = { ...imageTransform, scale: Math.max(0.1, Math.min(3, imageTransform.scale + delta)) };
    setImageTransform(newTransform);
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === selectedImageId ? { ...img, transform: newTransform } : img))
    );
  }, [imageTransform, selectedImageId]);

  const adjustRotation = useCallback((delta) => {
    const newTransform = { ...imageTransform, rotation: (imageTransform.rotation + delta) % 360 };
    setImageTransform(newTransform);
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === selectedImageId ? { ...img, transform: newTransform } : img))
    );
  }, [imageTransform, selectedImageId]);

  const resetToOriginal = useCallback(() => {
    const original = uploadedImages.find((img) => img.id === selectedImageId);
    if (original) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(original.original_url);
      img.onload = () => {
        const canvasWidth = 400;
        const canvasHeight = 400;
        const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
        const newTransform = { x: 0, y: 0, scale, rotation: 0 };
        setUploadedImages((prev) =>
          prev.map((img) => (img.id === selectedImageId ? { ...img, cropped_file: null, cropped_url: null, adjusted_file: null, adjusted_url: null, transform: newTransform } : img))
        );
        setImageTransform(newTransform);
        setOriginalImage(img);
      };
    }
  }, [selectedImageId, uploadedImages, getImageUrl]);

  const toggleCropMode = useCallback(() => {
    setCropping((prev) => !prev);
    if (!cropping) {
      setCropBox({ x: 100, y: 100, width: 200, height: 200, startX: 0, startY: 0, isResizing: false, resizeHandle: '' });
    }
  }, [cropping]);

  const applyCrop = useCallback(async () => {
    if (!originalImage || !cropping) return;

    const cropCanvas = document.createElement('canvas');
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    cropCanvas.width = cropBox.width;
    cropCanvas.height = cropBox.height;

    const canvasWidth = 400;
    const canvasHeight = 400;
    const imageScale = Math.min(originalImage.width / canvasWidth, originalImage.height / canvasHeight) * imageTransform.scale;
    const scaledWidth = originalImage.width * imageTransform.scale;
    const scaledHeight = originalImage.height * imageTransform.scale;

    const imageCenterX = canvasWidth / 2 + imageTransform.x;
    const imageCenterY = canvasHeight / 2 + imageTransform.y;

    const cos = Math.cos((imageTransform.rotation * Math.PI) / 180);
    const sin = Math.sin((imageTransform.rotation * Math.PI) / 180);

    const cropCenterX = cropBox.x + cropBox.width / 2;
    const cropCenterY = cropBox.y + cropBox.height / 2;

    let relX = cropCenterX - imageCenterX;
    let relY = cropCenterY - imageCenterY;

    const unrotatedX = relX * cos + relY * sin;
    const unrotatedY = -relX * sin + relY * cos;

    const sourceX = (unrotatedX / imageTransform.scale) + (originalImage.width / 2);
    const sourceY = (unrotatedY / imageTransform.scale) + (originalImage.height / 2);
    const sourceWidth = cropBox.width / imageTransform.scale;
    const sourceHeight = cropBox.height / imageTransform.scale;

    ctx.save();
    ctx.translate(cropCanvas.width / 2, cropCanvas.height / 2);
    ctx.rotate((imageTransform.rotation * Math.PI) / 180);
    ctx.drawImage(
      originalImage,
      sourceX - sourceWidth / 2,
      sourceY - sourceHeight / 2,
      sourceWidth,
      sourceHeight,
      -cropCanvas.width / 2,
      -cropCanvas.height / 2,
      cropCanvas.width,
      cropCanvas.height
    );
    ctx.restore();

    const croppedImageUrl = cropCanvas.toDataURL('image/png', 1.0);
    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);

    if (selectedImage) {
      cropCanvas.toBlob(async (croppedBlob) => {
        const croppedFile = new File([croppedBlob], `cropped_${selectedImage.original_file?.name || 'image.png'}`, { type: 'image/png' });
        let croppedUrl = croppedImageUrl;

        const token = localStorage.getItem('token');
        if (token) {
          try {
            const formData = new FormData();
            formData.append('cropped_image', croppedFile);
            const response = await axios.post(`${BASE_URL}/upload-cropped-image/`, formData, {
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            croppedUrl = response.data.cropped_url;
            console.log('Cropped image uploaded successfully:', croppedUrl);
          } catch (error) {
            console.error('Error saving cropped image:', error.response?.data || error.message);
            if (error.response?.status === 401) {
              alert('Session expired. Please log in again.');
              localStorage.removeItem('token');
              navigate('/');
              return;
            }
            console.warn('Using blob URL due to upload failure:', croppedUrl);
          }
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = getImageUrl(croppedUrl);
        img.onload = () => {
          const canvasWidth = 400;
          const canvasHeight = 400;
          const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
          const newTransform = { x: 0, y: 0, scale, rotation: 0 };
          setUploadedImages((prev) =>
            prev.map((img) =>
              img.id === selectedImageId
                ? { ...img, cropped_file: croppedFile, cropped_url: croppedUrl, transform: newTransform }
                : img
            )
          );
          setImageTransform(newTransform);
          setOriginalImage(img);
          setCropping(false);
          onCategorySelect('frame');
        };
      }, 'image/png', 1.0);
    }
  }, [cropping, cropBox, originalImage, selectedImageId, uploadedImages, imageTransform, onCategorySelect, navigate, getImageUrl]);

  const cancelCrop = useCallback(() => setCropping(false), []);

  const resetTransform = useCallback(() => {
    const original = uploadedImages.find((img) => img.id === selectedImageId);
    if (original) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(original.original_url);
      img.onload = () => {
        const canvasWidth = 400;
        const canvasHeight = 400;
        const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
        const newTransform = { x: 0, y: 0, scale, rotation: 0 };
        setUploadedImages((prev) =>
          prev.map((img) => (img.id === selectedImageId ? { ...img, cropped_file: null, cropped_url: null, adjusted_file: null, adjusted_url: null, transform: newTransform } : img))
        );
        setImageTransform(newTransform);
        setOriginalImage(img);
      };
    }
  }, [selectedImageId, uploadedImages, getImageUrl]);

  const handleSelectFrame = useCallback((frame) => {
    setFrameImage(null);
    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    if (selectedImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(selectedImage.cropped_url || selectedImage.original_url);
      img.onload = () => {
        const canvasWidth = 400;
        const canvasHeight = 400;
        // Assume a 10% border on each side (adjustable based on frame data)
        const borderPercentage = 0.1;
        const innerWidth = canvasWidth * (1 - 2 * borderPercentage);
        const innerHeight = canvasHeight * (1 - 2 * borderPercentage);
        // Calculate scale to fit the image within the frame's inner dimensions
        const scale = Math.min(innerWidth / img.width, innerHeight / img.height);
        const newTransform = { x: 0, y: 0, scale, rotation: 0 };
        setUploadedImages((prev) =>
          prev.map((img) =>
            img.id === selectedImageId
              ? { ...img, frame, variants: { color: null, size: null, finish: null, hanging: null }, transform: newTransform }
              : img
          )
        );
        setImageTransform(newTransform);
        setOriginalImage(img);
      };
    }
  }, [selectedImageId, uploadedImages, getImageUrl]);

  const handleVariantSelect = useCallback((variant, type) => {
    setUploadedImages((prev) =>
      prev.map((img) =>
        img.id === selectedImageId ? { ...img, variants: { ...img.variants, [type]: variant } } : img
      )
    );
  }, [selectedImageId]);

  const resetVariants = useCallback(() => {
    setUploadedImages((prev) =>
      prev.map((img) =>
        img.id === selectedImageId ? { ...img, frame: null, variants: { color: null, size: null, finish: null, hanging: null } } : img
      )
    );
    setFrameImage(null);
  }, [selectedImageId]);

  const calculatePrice = (image) => {
    if (!image || !image.frame) return 0;
    let price = parseFloat(image.frame.price || 0);
    if (image.variants.color) price += parseFloat(image.variants.color.price || 0);
    if (image.variants.size) price += parseFloat(image.variants.size.price || 0);
    if (image.variants.finish) price += parseFloat(image.variants.finish.price || 0);
    if (image.variants.hanging) price += parseFloat(image.variants.hanging.price || 0);
    return price;
  };

  const handleAddToCart = async () => {
    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    if (!selectedImage || !selectedImage.frame) {
      alert('Please select a frame');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const adjustedImageUrl = canvas.toDataURL('image/png', 1.0);
    let adjustedFile;
    await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        adjustedFile = new File([blob], `adjusted_${selectedImage.original_file?.name || 'image.png'}`, { type: 'image/png' });
        resolve();
      }, 'image/png', 1.0);
    });

    const formData = new FormData();
    formData.append('frame', selectedImage.frame.id);
    formData.append('adjusted_image', adjustedFile);
    if (selectedImage.variants.color) formData.append('color_variant', selectedImage.variants.color.id);
    if (selectedImage.variants.size) formData.append('size_variant', selectedImage.variants.size.id);
    if (selectedImage.variants.finish) formData.append('finish_variant', selectedImage.variants.finish.id);
    if (selectedImage.variants.hanging) formData.append('hanging_variant', selectedImage.variants.hanging.id);
    formData.append('quantity', 1);

    if (!selectedImage.cartItemId) {
      formData.append('original_image', selectedImage.original_file);
      if (selectedImage.cropped_file) {
        formData.append('cropped_image', selectedImage.cropped_file);
      }
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      let response;
      if (selectedImage.cartItemId) {
        response = await axios.put(`${BASE_URL}/cart/items/${selectedImage.cartItemId}/`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await axios.post(`${BASE_URL}/add-to-cart/`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
      }
      alert(selectedImage.cartItemId ? 'Cart item updated successfully' : 'Added to cart successfully');

      setUploadedImages((prev) =>
        prev.map((img) =>
          img.id === selectedImageId
            ? { ...img, adjusted_url: response.data.adjusted_image, cartItemId: response.data.id }
            : img
        )
      );
      navigate('/cart');
    } catch (error) {
      console.error('Error updating cart:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      } else {
        alert('Error updating cart');
      }
    }
  };

  useEffect(() => {
    if (cartItem && !cartItemProcessed.current) {
      console.log('Initializing cart item:', {
        original: cartItem.original_image,
        cropped: cartItem.cropped_image,
        adjusted: cartItem.adjusted_image,
      });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(cartItem.cropped_image || cartItem.original_image);
      img.onload = () => {
        const canvasWidth = 400;
        const canvasHeight = 400;
        const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
        const image = {
          id: nextId,
          original_url: cartItem.original_image ? getImageUrl(cartItem.original_image) : null,
          cropped_url: cartItem.cropped_image ? getImageUrl(cartItem.cropped_image) : null,
          adjusted_url: cartItem.adjusted_image ? getImageUrl(cartItem.adjusted_image) : null,
          original_file: null,
          cropped_file: null,
          adjusted_file: null,
          frame: cartItem.frame,
          variants: {
            color: cartItem.color_variant || null,
            size: cartItem.size_variant || null,
            finish: cartItem.finish_variant || null,
            hanging: cartItem.hanging_variant || null,
          },
          transform: { x: 0, y: 0, scale, rotation: 0 },
          cartItemId: cartItem.id,
        };
        setUploadedImages([image]);
        setSelectedImageId(nextId);
        setNextId((prev) => prev + 1);
        cartItemProcessed.current = true;
        onCategorySelect('frame');
      };
      img.onerror = () => {
        console.error('Failed to load cart item image:', img.src);
      };
    }
  }, [cartItem, nextId, onCategorySelect, getImageUrl]);

  if (uploadedImages.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '500px', border: '2px dashed #ccc' }}>
        <button className="btn btn-primary" onClick={triggerUpload}>
          Upload Image
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
      </div>
    );
  }

  const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);

  return (
    <div className="row">
      <div className="col-lg-8">
        {cropping && selectedImage ? (
          <div
            className="main-image mb-3 d-flex flex-column justify-content-center align-items-center"
            style={{ height: '500px', position: 'relative', backgroundColor: '#f8f9fa' }}
          >
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="border border-gray-300 rounded"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            <div className="controls" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-success crop-btn" onClick={applyCrop} title="Apply Crop">
                <i className="bi bi-check"></i>
              </button>
              <button className="btn btn-danger crop-btn" onClick={cancelCrop} title="Cancel">
                <i className="bi bi-x"></i>
              </button>
            </div>
          </div>
        ) : (
          <div
            className="main-image mb-3 d-flex flex-column justify-content-center align-items-center"
            style={{ height: '500px', border: '1px solid #ddd' }}
          >
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="border border-gray-300 rounded"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            {selectedImage && (
              <div className="image-controls mt-3">
                <button className="btn btn-outline" onClick={() => adjustScale(0.1)}>Zoom In</button>
                <button className="btn btn-outline" onClick={() => adjustScale(-0.1)}>Zoom Out</button>
                <button className="btn btn-outline" onClick={() => adjustRotation(90)}>Rotate Right</button>
                <button className="btn btn-outline" onClick={() => adjustRotation(-90)}>Rotate Left</button>
                <button className="btn btn-outline" onClick={toggleCropMode}>Crop Image</button>
                <button className="btn btn-outline" onClick={resetToOriginal}>Reset to Original</button>
                <button className="btn btn-outline" onClick={resetTransform}>Reset Position</button>
                <button className="btn btn-outline" onClick={resetVariants}>Reset Variants</button>
              </div>
            )}
          </div>
        )}
        <div className="thumbnails d-flex flex-wrap align-items-center">
          {uploadedImages.map((img) => (
            <div
              key={img.id}
              className={`thumbnail m-2 ${img.id === selectedImageId ? 'border border-primary' : ''}`}
              onClick={() => selectImage(img.id)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={getImageUrl(img.cropped_url || img.original_url)}
                alt="Thumbnail"
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                onError={handleImageError}
              />
            </div>
          ))}
          <div className="add-more m-2">
            <button className="btn btn-outline-secondary" onClick={triggerUpload}>
              <i className="bi bi-plus-lg"></i> Add More
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
        </div>
      </div>

      <div className="col-lg-4">
        <div className="p-3" style={{ border: '1px solid #ddd', height: 'auto', overflow: 'auto' }}>
          {activeCategory === 'frame' && (
            <div>
              <h3>Select Frame</h3>
              <div className="frame-list d-flex flex-wrap">
                {frames.length > 0 ? (
                  frames.map((frame) => (
                    <div
                      key={frame.id}
                      className={`frame-item m-2 p-2 ${selectedImage?.frame?.id === frame.id ? 'border border-primary' : ''}`}
                      onClick={() => handleSelectFrame(frame)}
                      style={{ cursor: 'pointer', textAlign: 'center', minWidth: '120px' }}
                    >
                      <img
                        src={getImageUrl(frame.image)}
                        alt={frame.name}
                        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                        onError={handleImageError}
                      />
                      <p>${frame.price}</p>
                    </div>
                  ))
                ) : (
                  <p>No frames available</p>
                )}
              </div>
            </div>
          )}
          {activeCategory === 'color' && (
            <div>
              <h3>Select Color</h3>
              <div className="frame-list d-flex flex-wrap">
                {selectedImage?.frame ? (
                  selectedImage.frame.color_variants.length > 0 ? (
                    selectedImage.frame.color_variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`frame-item m-2 p-2 ${selectedImage.variants.color?.id === variant.id ? 'border border-primary' : ''}`}
                        onClick={() => handleVariantSelect(variant, 'color')}
                        style={{ cursor: 'pointer', textAlign: 'center', minWidth: '120px', border: '1px solid #ddd' }}
                      >
                        <img
                          src={getImageUrl(variant.image)}
                          alt={variant.color_name}
                          style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                          onError={handleImageError}
                        />
                        <p>{variant.color_name || 'No name'}</p>
                      </div>
                    ))
                  ) : (
                    <p>No color variants available</p>
                  )
                ) : (
                  <p>Please select a frame first</p>
                )}
              </div>
            </div>
          )}
          {activeCategory === 'size' && (
            <div>
              <h3>Select Size</h3>
              <div className="frame-list d-flex flex-wrap">
                {selectedImage?.frame ? (
                  selectedImage.frame.size_variants.length > 0 ? (
                    selectedImage.frame.size_variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`frame-item m-2 p-2 ${selectedImage.variants.size?.id === variant.id ? 'border border-primary' : ''}`}
                        onClick={() => handleVariantSelect(variant, 'size')}
                        style={{ cursor: 'pointer', textAlign: 'center', minWidth: '120px', border: '1px solid #ddd' }}
                      >
                        <img
                          src={getImageUrl(variant.image)}
                          alt={variant.size_name}
                          style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                          onError={handleImageError}
                        />
                        <p>{variant.size_name || 'No name'}</p>
                      </div>
                    ))
                  ) : (
                    <p>No size variants available</p>
                  )
                ) : (
                  <p>Please select a frame first</p>
                )}
              </div>
            </div>
          )}
          {activeCategory === 'finish' && (
            <div>
              <h3>Select Finish</h3>
              <div className="frame-list d-flex flex-wrap">
                {selectedImage?.frame ? (
                  selectedImage.frame.finishing_variants.length > 0 ? (
                    selectedImage.frame.finishing_variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`frame-item m-2 p-2 ${selectedImage.variants.finish?.id === variant.id ? 'border border-primary' : ''}`}
                        onClick={() => handleVariantSelect(variant, 'finish')}
                        style={{ cursor: 'pointer', textAlign: 'center', minWidth: '120px', border: '1px solid #ddd' }}
                      >
                        <img
                          src={getImageUrl(variant.image)}
                          alt={variant.finish_name}
                          style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                          onError={handleImageError}
                        />
                        <p>{variant.finish_name || 'No name'}</p>
                      </div>
                    ))
                  ) : (
                    <p>No finishing variants available</p>
                  )
                ) : (
                  <p>Please select a frame first</p>
                )}
              </div>
            </div>
          )}
          {activeCategory === 'hanging' && (
            <div>
              <h3>Select Hanging</h3>
              <div className="frame-list">
                {selectedImage?.frame ? (
                  selectedImage.frame.frameHanging_variant?.length > 0 ? (
                    selectedImage.frame.frameHanging_variant.map((variant) => (
                      <div
                        key={variant.id}
                        className={`frame-item m-2 p-2 ${selectedImage.variants.hanging?.id === variant.id ? 'border border-primary' : ''}`}
                        onClick={() => handleVariantSelect(variant, 'hanging')}
                        style={{ cursor: 'pointer', textAlign: 'center', minWidth: '120px', border: '1px solid #ddd' }}
                      >
                        <img
                          src={getImageUrl(variant.image)}
                          alt={variant.hanging_name}
                          style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                          onError={handleImageError}
                        />
                        <p>{variant.hanging_name || 'No name'}</p>
                      </div>
                    ))
                  ) : (
                    <p>No hanging variants available</p>
                  )
                ) : (
                  <p>Please select a frame first</p>
                )}
              </div>
            </div>
          )}
          <div className="mt-3">
            <h3>Selected Options</h3>
            <p><strong>Frame:</strong> {selectedImage?.frame?.name || 'None'}</p>
            <p><strong>Color:</strong> {selectedImage?.variants?.color?.color_name || 'None'}</p>
            <p><strong>Size:</strong> {selectedImage?.variants?.size?.size_name || 'None'}</p>
            <p><strong>Finish:</strong> {selectedImage?.variants?.finish?.finish_name || 'None'}</p>
            <p><strong>Hanging:</strong> {selectedImage?.variants?.hanging?.hanging_name || 'None'}</p>
            {selectedImage && selectedImage.frame && (
              <>
                <p><strong>Price:</strong> ${calculatePrice(selectedImage).toFixed(2)}</p>
                <button className="btn btn-primary mt-2" onClick={handleAddToCart}>
                  {selectedImage.cartItemId ? 'Update Cart' : 'Add to Cart'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Headers;

