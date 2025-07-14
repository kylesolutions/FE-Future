import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Headers.css';

const BASE_URL = 'http://82.180.146.4:8001';
const FALLBACK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABYSURBVHhe7cExAQAwDMCg7f8/8A2BFXgJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA+yU/AJSsIW0W2i4AAAAASUVORK5CYII=';
const DEFAULT_CANVAS_WIDTH = 400;
const DEFAULT_CANVAS_HEIGHT = 400;
const DEFAULT_INNER_WIDTH = 320;
const DEFAULT_INNER_HEIGHT = 320;
const DPI = 96;

function Headers({ activeCategory, onCategorySelect, cartItem, setHasUploadedImages, isPrintOnly }) {
  const [frames, setFrames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [nextId, setNextId] = useState(0);
  const [cropping, setCropping] = useState(false);
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [frameTransform, setFrameTransform] = useState({ rotation: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropBox, setCropBox] = useState({ x: 100, y: 100, width: 200, height: 200, startX: 0, startY: 0, isResizing: false, resizeHandle: '' });
  const [originalImage, setOriginalImage] = useState(null);
  const [frameImage, setFrameImage] = useState(null);
  const [variantImages, setVariantImages] = useState({});
  const [customSize, setCustomSize] = useState({ width: '', height: '', applied: false });
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const getImageUrl = useCallback((path) => {
    if (!path) return FALLBACK_IMAGE;
    if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }, []);

  const updatePrintOptions = (key, value) => {
    setUploadedImages((prev) =>
      prev.map((img) =>
        img.id === selectedImageId
          ? { ...img, printOptions: { ...img.printOptions, [key]: value } }
          : img
      )
    );
  };
  useEffect(() => {
    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    if (selectedImage && !isPrintOnly && selectedImage.frame && originalImage) {
      const borderDepth = parseInt(selectedImage.printOptions.borderDepth) || 0;
      const frameDepth = parseInt(selectedImage.printOptions.frameDepth) || 0;
      const innerWidth = (selectedImage.variants?.size?.inner_width || selectedImage.frame.inner_width || DEFAULT_INNER_WIDTH) - 2 * frameDepth;
      const innerHeight = (selectedImage.variants?.size?.inner_height || selectedImage.frame.inner_height || DEFAULT_INNER_HEIGHT) - 2 * frameDepth;
      const effectiveInnerWidth = innerWidth - 2 * borderDepth;
      const effectiveInnerHeight = innerHeight - 2 * borderDepth;
      if (effectiveInnerWidth > 0 && effectiveInnerHeight > 0) {
        const scale = Math.min(effectiveInnerWidth / originalImage.width, effectiveInnerHeight / originalImage.height);
        const currentTransform = selectedImage.transform;
        const newTransform = { ...currentTransform, scale };
        if (currentTransform.scale !== scale) {
          setImageTransform(newTransform);
          setUploadedImages((prev) =>
            prev.map((img) => (img.id === selectedImageId ? { ...img, transform: newTransform } : img))
          );
        }
      }
    }
  }, [selectedImageId, uploadedImages, originalImage, isPrintOnly]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    const hasFrame = !isPrintOnly && selectedImage && selectedImage.frame && frameImage;

    let canvasWidth = DEFAULT_CANVAS_WIDTH;
    let canvasHeight = DEFAULT_CANVAS_HEIGHT;
    let innerWidth = selectedImage?.variants?.size?.inner_width || selectedImage?.frame?.inner_width || DEFAULT_INNER_WIDTH;
    let innerHeight = selectedImage?.variants?.size?.inner_height || selectedImage?.frame?.inner_height || DEFAULT_INNER_HEIGHT;

    if (isPrintOnly && selectedImage?.printOptions?.size?.width && selectedImage?.printOptions?.size?.height && !cropping) {
      const widthInInches = selectedImage.printOptions.size.unit === 'cm' ? selectedImage.printOptions.size.width / 2.54 : selectedImage.printOptions.size.width;
      const heightInInches = selectedImage.printOptions.size.unit === 'cm' ? selectedImage.printOptions.size.height / 2.54 : selectedImage.printOptions.size.height;
      canvasWidth = widthInInches * DPI;
      canvasHeight = heightInInches * DPI;
    } else if (!isPrintOnly && hasFrame) {
      canvasWidth = DEFAULT_CANVAS_WIDTH;
      canvasHeight = DEFAULT_CANVAS_HEIGHT;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let innerX = (canvasWidth - innerWidth) / 2;
    let innerY = (canvasHeight - innerHeight) / 2;

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
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);

      const handleSize = 8;
      const handles = [
        { x: cropBox.x, y: cropBox.y },
        { x: cropBox.x + cropBox.width, y: cropBox.y },
        { x: cropBox.x, y: cropBox.y + cropBox.height },
        { x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height },
        { x: cropBox.x + cropBox.width / 2, y: cropBox.y },
        { x: cropBox.x + cropBox.width / 2, y: cropBox.y + cropBox.height },
        { x: cropBox.x, y: cropBox.y + cropBox.height / 2 },
        { x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height / 2 },
      ];

      ctx.fillStyle = 'white';
      handles.forEach((handle) => {
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      });
    } else if (isPrintOnly) {
      if (selectedImage.printOptions.fit === 'borderless') {
        const scale = Math.max(canvasWidth / originalImage.width, canvasHeight / originalImage.height);
        const scaledWidth = originalImage.width * scale;
        const scaledHeight = originalImage.height * scale;
        const x = (canvasWidth - scaledWidth) / 2;
        const y = (canvasHeight - scaledHeight) / 2;
        ctx.drawImage(originalImage, x, y, scaledWidth, scaledHeight);
      } else {
        const borderDepth = parseInt(selectedImage.printOptions.borderDepth) || 0;
        const borderColor = selectedImage.printOptions.borderColor || '#ffffff';
        
        if (borderDepth > 0) {
          ctx.fillStyle = borderColor;
          ctx.fillRect(0, 0, canvasWidth, borderDepth);
          ctx.fillRect(0, canvasHeight - borderDepth, canvasWidth, borderDepth);
          ctx.fillRect(0, borderDepth, borderDepth, canvasHeight - 2 * borderDepth);
          ctx.fillRect(canvasWidth - borderDepth, borderDepth, borderDepth, canvasHeight - 2 * borderDepth);
        }
        
        const imageWidth = canvasWidth - 2 * borderDepth;
        const imageHeight = canvasHeight - 2 * borderDepth;
        if (imageWidth > 0 && imageHeight > 0) {
          const scale = Math.min(imageWidth / originalImage.width, imageHeight / originalImage.height);
          const scaledWidth = originalImage.width * scale;
          const scaledHeight = originalImage.height * scale;
          const x = borderDepth + (imageWidth - scaledWidth) / 2;
          const y = borderDepth + (imageHeight - scaledHeight) / 2;
          ctx.drawImage(originalImage, x, y, scaledWidth, scaledHeight);
        }
      }
    } else {
       const frameDepth = selectedImage?.printOptions?.frameDepth ? parseInt(selectedImage.printOptions.frameDepth) : 0;
  const borderDepth = selectedImage?.printOptions?.borderDepth ? parseInt(selectedImage.printOptions.borderDepth) : 0;
  const borderColor = selectedImage?.printOptions?.borderColor || '#ffffff';
      
      if (hasFrame) {
        innerX = (canvasWidth - innerWidth) / 2 + frameDepth;
        innerY = (canvasHeight - innerHeight) / 2 + frameDepth;
        innerWidth -= 2 * frameDepth;
        innerHeight -= 2 * frameDepth;

        if (borderDepth > 0) {
          ctx.fillStyle = borderColor;
          ctx.fillRect(innerX, innerY, innerWidth, borderDepth);
          ctx.fillRect(innerX, innerY + innerHeight - borderDepth, innerWidth, borderDepth);
          ctx.fillRect(innerX, innerY + borderDepth, borderDepth, innerHeight - 2 * borderDepth);
          ctx.fillRect(innerX + innerWidth - borderDepth, innerY + borderDepth, borderDepth, innerHeight - 2 * borderDepth);
          
          innerX += borderDepth;
          innerY += borderDepth;
          innerWidth -= 2 * borderDepth;
          innerHeight -= 2 * borderDepth;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(innerX, innerY, innerWidth, innerHeight);
        ctx.clip();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((imageTransform.rotation * Math.PI) / 180);
        ctx.scale(imageTransform.scale, imageTransform.scale);
        ctx.translate(imageTransform.x, imageTransform.y);
        ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
        ctx.restore();

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.save();
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate((frameTransform.rotation * Math.PI) / 180);
        tempCtx.drawImage(frameImage, -tempCanvas.width / 2, -tempCanvas.height / 2, tempCanvas.width, tempCanvas.height);
        tempCtx.restore();

        if (selectedImage.customFrameColor) {
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imageData.data;

          const hex = selectedImage.customFrameColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4 , 16));

          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha > 0) {
              data[i] = r;
              data[i + 1] = g;
              data[i + 2] = b;
            }
          }

          tempCtx.putImageData(imageData, 0, 0);
        }

        ctx.drawImage(tempCanvas, 0, 0);
      } else {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((imageTransform.rotation * Math.PI) / 180);
        ctx.scale(imageTransform.scale, imageTransform.scale);
        ctx.translate(imageTransform.x, imageTransform.y);
        ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
        ctx.restore();
      }
    }
  }, [cropping, cropBox, originalImage, imageTransform, frameTransform, frameImage, selectedImageId, uploadedImages, isPrintOnly]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const fetchFrames = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      let url = `${BASE_URL}/frames/`;
      if (categoryId) {
        url += `?category_id=${categoryId}`;
      }
      const response = await axios.get(url, config);
      setFrames(response.data);
    } catch (error) {
      console.error('Error fetching frames:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  };

  useEffect(() => {
    fetchFrames(selectedCategory);
  }, [selectedCategory, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get(`${BASE_URL}/categories/`, config);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };
    fetchCategories();
  }, [navigate]);

  useEffect(() => {
    setHasUploadedImages(uploadedImages.length > 0);
  }, [uploadedImages, setHasUploadedImages]);

  useEffect(() => {
    if (selectedImageId === null) {
      setOriginalImage(null);
      setFrameImage(null);
      setFrameTransform({ rotation: 0 });
      setCustomSize({ width: '', height: '', applied: false });
      return;
    }

    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    if (!selectedImage) {
      setOriginalImage(null);
      setFrameImage(null);
      setFrameTransform({ rotation: 0 });
      setCustomSize({ width: '', height: '', applied: false });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = getImageUrl(selectedImage.cropped_url || selectedImage.original_url);
    img.onload = () => {
      if (selectedImageId === selectedImage.id) {
        setOriginalImage(img);
        setFrameTransform({ rotation: selectedImage.frameTransform?.rotation || 0 });
        setCustomSize(selectedImage.customSize || { width: '', height: '', applied: false });
      }
    };
  }, [selectedImageId, uploadedImages, getImageUrl]);

  useEffect(() => {
    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    if (selectedImage && selectedImage.frame) {
      let frameSrc;
      if (selectedImage.customFrameColor) {
        frameSrc = selectedImage.frame.image;
      } else {
        frameSrc = selectedImage.variants?.finish?.image || selectedImage.variants?.color?.image || selectedImage.variants?.size?.image || selectedImage.variants?.hanging?.image || selectedImage.frame.image;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(frameSrc);
      img.onload = () => {
        if (selectedImageId === selectedImage.id) {
          setFrameImage(img);
        }
      };
    } else {
      setFrameImage(null);
    }
  }, [selectedImageId, uploadedImages, getImageUrl]);

  useEffect(() => {
    if (cartItem) {
      const img = new Image();
      img.src = getImageUrl(cartItem.cropped_image || cartItem.original_image);
      img.onload = () => {
        const image = {
          id: nextId,
          original_url: cartItem.original_image,
          cropped_url: cartItem.cropped_image,
          adjusted_url: cartItem.adjusted_image,
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
          transform: {
            x: cartItem.transform_x || 0,
            y: cartItem.transform_y || 0,
            scale: cartItem.scale || 1,
            rotation: cartItem.rotation || 0,
          },
          frameTransform: { rotation: cartItem.frame_rotation || 0 },
          customSize: cartItem.custom_size || { width: '', height: '', applied: false },
          cartItemId: cartItem.id,
          printOptions: cartItem.printOptions || {
            size: { width: cartItem.print_width || '', height: cartItem.print_height || '', unit: cartItem.print_unit || 'inches' },
            mediaType: cartItem.media_type || 'Photopaper',
            paperType: cartItem.paper_type || 'Premium Luster',
            fit: cartItem.fit || 'borderless',
            borderDepth: cartItem.border_depth || '0',
            borderColor: cartItem.border_color || '#ffffff',
            frameDepth: cartItem.frame_depth || '0',
          },
          customFrameColor: cartItem.custom_frame_color || null,
        };
        setUploadedImages([image]);
        setSelectedImageId(nextId);
        setNextId((prev) => prev + 1);
        setImageTransform(image.transform);
        setFrameTransform(image.frameTransform);
        setCustomSize(image.customSize);
        setOriginalImage(img);
        onCategorySelect('frame');
      };
    }
  }, [cartItem, nextId, onCategorySelect, getImageUrl]);

  useEffect(() => {
    if (activeCategory === 'crop' && selectedImageId !== null && !cropping) {
      const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
      if (selectedImage) {
        const img = new Image();
        img.src = getImageUrl(selectedImage.cropped_url || selectedImage.original_url);
        img.onload = () => {
          const canvasWidth = DEFAULT_CANVAS_WIDTH;
          const canvasHeight = DEFAULT_CANVAS_HEIGHT;
          const innerWidth = selectedImage.variants?.size?.inner_width || selectedImage.frame?.inner_width || DEFAULT_INNER_WIDTH;
          const innerHeight = selectedImage.variants?.size?.inner_height || selectedImage.frame?.inner_height || DEFAULT_INNER_HEIGHT;
          const scale = Math.min(innerWidth / img.width, innerHeight / img.height);
          const displayedWidth = img.width * scale;
          const displayedHeight = img.height * scale;
          const canvasX = (canvasWidth - displayedWidth) / 2;
          const canvasY = (canvasHeight - displayedHeight) / 2;
          setImageTransform({ x: 0, y: 0, scale, rotation: 0 });
          setCropBox({
            x: canvasX,
            y: canvasY,
            width: displayedWidth,
            height: displayedHeight,
            startX: 0,
            startY: 0,
            isResizing: false,
            resizeHandle: '',
          });
          setCropping(true);
        };
      }
    } else if (activeCategory === 'remove' && selectedImageId !== null) {
      const updatedImages = uploadedImages.filter((img) => img.id !== selectedImageId);
      setUploadedImages(updatedImages);
      setSelectedImageId(updatedImages.length > 0 ? updatedImages[0].id : null);
      setCustomSize({ width: '', height: '', applied: false });
      onCategorySelect('frame');
    }
  }, [activeCategory, selectedImageId, cropping, uploadedImages, onCategorySelect, getImageUrl]);

  const triggerUpload = () => fileInputRef.current.click();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const scale = Math.min(DEFAULT_INNER_WIDTH / img.width, DEFAULT_INNER_HEIGHT / img.height);
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
          frameTransform: { rotation: 0 },
          customSize: { width: '', height: '', applied: false },
          printOptions: {
            size: { width: '', height: '', unit: 'inches' },
            mediaType: 'Photopaper',
            paperType: 'Premium Luster',
            fit: 'borderless',
            borderDepth: '0',
            borderColor: '#ffffff',
            frameDepth: '0',
          },
          customFrameColor: null,
        };
        setUploadedImages((prev) => [...prev, newImage]);
        setSelectedImageId(nextId);
        setNextId((prev) => prev + 1);
        setFrameTransform({ rotation: 0 });
        setCustomSize({ width: '', height: '', applied: false });
        onCategorySelect('crop');
      };
    }
  };

  const selectImage = (id) => {
    setSelectedImageId(id);
    setCropping(false);
    const selectedImage = uploadedImages.find((img) => img.id === id);
    if (selectedImage) {
      setImageTransform(selectedImage.transform);
      setFrameTransform(selectedImage.frameTransform || { rotation: 0 });
      setCustomSize(selectedImage.customSize || { width: '', height: '', applied: false });
    }
  };

  const handleImageError = (e) => {
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

    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    const canvasWidth = DEFAULT_CANVAS_WIDTH;
    const canvasHeight = DEFAULT_CANVAS_HEIGHT;

    if (cropping) {
      const handleSize = 8;
      const handles = [
        { x: cropBox.x, y: cropBox.y, type: 'nw' },
        { x: cropBox.x + cropBox.width, y: cropBox.y, type: 'ne' },
        { x: cropBox.x, y: cropBox.y + cropBox.height, type: 'sw' },
        { x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height, type: 'se' },
        { x: cropBox.x + cropBox.width / 2, y: cropBox.y, type: 'n' },
        { x: cropBox.x + cropBox.width / 2, y: cropBox.y + cropBox.height, type: 's' },
        { x: cropBox.x, y: cropBox.y + cropBox.height / 2, type: 'w' },
        { x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height / 2, type: 'e' },
      ];

      let cursor = 'default';
      for (const handle of handles) {
        if (mouseX >= handle.x - handleSize / 2 && mouseX <= handle.x + handleSize / 2 &&
          mouseY >= handle.y - handleSize / 2 && mouseY <= handle.y + handleSize / 2) {
          switch (handle.type) {
            case 'nw': cursor = 'nwse-resize'; break;
            case 'ne': cursor = 'nesw-resize'; break;
            case 'sw': cursor = 'nesw-resize'; break;
            case 'se': cursor = 'nwse-resize'; break;
            case 'n': cursor = 'ns-resize'; break;
            case 's': cursor = 'ns-resize'; break;
            case 'w': cursor = 'ew-resize'; break;
            case 'e': cursor = 'ew-resize'; break;
          }
          break;
        }
      }
      if (cursor === 'default' &&
        mouseX >= cropBox.x && mouseX <= cropBox.x + cropBox.width &&
        mouseY >= cropBox.y && mouseY <= cropBox.y + cropBox.height) {
        cursor = 'move';
      }
      canvasRef.current.style.cursor = cursor;

      if (cropBox.isResizing) {
        const deltaX = mouseX - cropBox.startX;
        const deltaY = mouseY - cropBox.startY;

        setCropBox((prev) => {
          const newBox = { ...prev };
          const maxX = canvasWidth - newBox.width;
          const maxY = canvasHeight - newBox.height;

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
          }
          newBox.startX = mouseX;
          newBox.startY = mouseY;
          return newBox;
        });
      } else if (isDragging) {
        setCropBox((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(canvasWidth - prev.width, mouseX - prev.startX)),
          y: Math.max(0, Math.min(canvasHeight - prev.height, mouseY - prev.startY)),
        }));
      }
    } else if (isDragging) {
      const deltaX = (mouseX - dragStart.x) / imageTransform.scale;
      const deltaY = (mouseY - dragStart.y) / imageTransform.scale;
      const rad = (imageTransform.rotation * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const rotatedDeltaX = deltaX * cos - deltaY * sin;
      const rotatedDeltaY = deltaX * sin + deltaY * cos;
      const newTransform = {
        x: imageTransform.x + rotatedDeltaX,
        y: imageTransform.y + rotatedDeltaY,
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

  const handleCanvasMouseLeave = useCallback(() => {
    setIsDragging(false);
    setCropBox((prev) => ({ ...prev, isResizing: false, resizeHandle: '' }));
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  }, []);

  const adjustScale = useCallback((delta) => {
    const newTransform = { ...imageTransform, scale: Math.max(0.1, Math.min(3, imageTransform.scale + delta)) };
    setImageTransform(newTransform);
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === selectedImageId ? { ...img, transform: newTransform } : img))
    );
  }, [imageTransform, selectedImageId]);

  const adjustImageRotation = useCallback((delta) => {
    const newTransform = { ...imageTransform, rotation: (imageTransform.rotation + delta) % 360 };
    setImageTransform(newTransform);
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === selectedImageId ? { ...img, transform: newTransform } : img))
    );
  }, [imageTransform, selectedImageId]);

  const adjustFrameRotation = useCallback((delta) => {
    const newFrameTransform = { rotation: (frameTransform.rotation + delta) % 360 };
    setFrameTransform(newFrameTransform);
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === selectedImageId ? { ...img, frameTransform: newFrameTransform } : img))
    );
  }, [frameTransform, selectedImageId]);

  const resetToOriginal = useCallback(() => {
    const original = uploadedImages.find((img) => img.id === selectedImageId);
    if (original) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(original.original_url);
      img.onload = () => {
        const canvasWidth = DEFAULT_CANVAS_WIDTH;
        const canvasHeight = DEFAULT_CANVAS_HEIGHT;
        const innerWidth = original.variants?.size?.inner_width || original.frame?.inner_width || DEFAULT_INNER_WIDTH;
        const innerHeight = original.variants?.size?.inner_height || original.frame?.inner_height || DEFAULT_INNER_HEIGHT;
        const scale = Math.min(innerWidth / img.width, innerHeight / img.height);
        const newTransform = { x: 0, y: 0, scale, rotation: 0 };
        const newFrameTransform = { rotation: 0 };
        setUploadedImages((prev) =>
          prev.map((img) => (img.id === selectedImageId ? { ...img, cropped_file: null, cropped_url: null, adjusted_file: null, adjusted_url: null, transform: newTransform, frameTransform: newFrameTransform, customSize: { width: '', height: '', applied: false }, customFrameColor: null, printOptions: { ...img.printOptions, frameDepth: '0' } } : img))
        );
        setImageTransform(newTransform);
        setFrameTransform(newFrameTransform);
        setCustomSize({ width: '', height: '', applied: false });
        setOriginalImage(img);
      };
    }
  }, [selectedImageId, uploadedImages, getImageUrl]);

  const toggleCropMode = useCallback(() => {
    if (!cropping) {
      if (originalImage && imageTransform) {
        const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
        const canvasWidth = DEFAULT_CANVAS_WIDTH;
        const canvasHeight = DEFAULT_CANVAS_HEIGHT;
        const innerWidth = selectedImage?.variants?.size?.inner_width || selectedImage?.frame?.inner_width || DEFAULT_INNER_WIDTH;
        const innerHeight = selectedImage?.variants?.size?.inner_height || selectedImage?.frame?.inner_height || DEFAULT_INNER_HEIGHT;
        const displayedWidth = originalImage.width * imageTransform.scale;
        const displayedHeight = originalImage.height * imageTransform.scale;
        const canvasX = (canvasWidth - displayedWidth) / 2;
        const canvasY = (canvasHeight - displayedHeight) / 2;
        setCropBox({
          x: canvasX,
          y: canvasY,
          width: displayedWidth,
          height: displayedHeight,
          startX: 0,
          startY: 0,
          isResizing: false,
          resizeHandle: '',
        });
      }
    }
    setCropping((prev) => !prev);
  }, [cropping, originalImage, imageTransform, selectedImageId, uploadedImages]);

  const applyCrop = useCallback(async () => {
    if (!originalImage || !cropping) return;

    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    const canvasWidth = DEFAULT_CANVAS_WIDTH;
    const canvasHeight = DEFAULT_CANVAS_HEIGHT;

    const cropCanvas = document.createElement('canvas');
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    cropCanvas.width = cropBox.width;
    cropCanvas.height = cropBox.height;

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
          } catch (error) {
            console.error('Error saving cropped image:', error.response?.data || error.message);
            if (error.response?.status === 401) {
              alert('Session expired. Please log in again.');
              localStorage.removeItem('token');
              navigate('/');
              return;
            }
          }
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = getImageUrl(croppedUrl);
        img.onload = () => {
          const innerWidth = selectedImage.variants?.size?.inner_width || selectedImage.frame?.inner_width || DEFAULT_INNER_WIDTH;
          const innerHeight = selectedImage.variants?.size?.inner_height || selectedImage.frame?.inner_height || DEFAULT_INNER_HEIGHT;
          const scale = Math.min(innerWidth / img.width, innerHeight / img.height);
          const newTransform = { x: 0, y: 0, scale, rotation: 0 };

          const croppedWidthInches = (cropBox.width / DPI).toFixed(2);
          const croppedHeightInches = (cropBox.height / DPI).toFixed(2);

          const currentPrintOptions = selectedImage.printOptions || {};
          const defaultSize = {
            width: currentPrintOptions.size?.width || croppedWidthInches,
            height: currentPrintOptions.size?.height || croppedHeightInches,
            unit: currentPrintOptions.size?.unit || 'inches',
          };

          setUploadedImages((prev) =>
            prev.map((img) =>
              img.id === selectedImageId
                ? {
                    ...img,
                    cropped_file: croppedFile,
                    cropped_url: croppedUrl,
                    transform: newTransform,
                    printOptions: {
                      ...currentPrintOptions,
                      size: defaultSize,
                    },
                  }
                : img
            )
          );
          setImageTransform(newTransform);
          setOriginalImage(img);
          setCropping(false);
          onCategorySelect(isPrintOnly ? 'print' : 'frame');
        };
      }, 'image/png', 1.0);
    }
  }, [cropping, cropBox, originalImage, selectedImageId, uploadedImages, imageTransform, onCategorySelect, navigate, getImageUrl, isPrintOnly]);

  const cancelCrop = useCallback(() => setCropping(false), []);

  const resetTransform = useCallback(() => {
    const original = uploadedImages.find((img) => img.id === selectedImageId);
    if (original) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(original.original_url);
      img.onload = () => {
        const canvasWidth = DEFAULT_CANVAS_WIDTH;
        const canvasHeight = DEFAULT_CANVAS_HEIGHT;
        const innerWidth = original.variants?.size?.inner_width || original.frame?.inner_width || DEFAULT_INNER_WIDTH;
        const innerHeight = original.variants?.size?.inner_height || original.frame?.inner_height || DEFAULT_INNER_HEIGHT;
        const scale = Math.min(innerWidth / img.width, innerHeight / img.height);
        const newTransform = { x: 0, y: 0, scale, rotation: 0 };
        const newFrameTransform = { rotation: 0 };
        setUploadedImages((prev) =>
          prev.map((img) => (img.id === selectedImageId ? { ...img, cropped_file: null, cropped_url: null, adjusted_file: null, adjusted_url: null, transform: newTransform, frameTransform: newFrameTransform, customSize: { width: '', height: '', applied: false }, customFrameColor: null, printOptions: { ...img.printOptions, frameDepth: '0' } } : img))
        );
        setImageTransform(newTransform);
        setFrameTransform(newFrameTransform);
        setCustomSize({ width: '', height: '', applied: false });
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
        const canvasWidth = DEFAULT_CANVAS_WIDTH;
        const canvasHeight = DEFAULT_CANVAS_HEIGHT;
        const innerWidth = frame.inner_width || DEFAULT_INNER_WIDTH;
        const innerHeight = frame.inner_height || DEFAULT_INNER_HEIGHT;
        const scale = Math.max(innerWidth / img.width, innerHeight / img.height);
        const innerX = (canvasWidth - innerWidth) / 2;
        const innerY = (canvasHeight - innerHeight) / 2;
        const innerCenterX = innerX + innerWidth / 2;
        const innerCenterY = innerY + innerHeight / 2;
        const newTransform = {
          x: (innerCenterX - canvasWidth / 2) / scale,
          y: (innerCenterY - canvasHeight / 2) / scale,
          scale,
          rotation: 0,
        };
        const newFrameTransform = { rotation: 0 };
        setUploadedImages((prev) =>
          prev.map((img) =>
            img.id === selectedImageId
              ? { ...img, frame, variants: { color: null, size: null, finish: null, hanging: null }, transform: newTransform, frameTransform: newFrameTransform, customSize: { width: '', height: '', applied: false }, customFrameColor: null, cartItemId: img.cartItemId, printOptions: { ...img.printOptions, frameDepth: '0' } }
              : img
          )
        );
        setImageTransform(newTransform);
        setFrameTransform(newFrameTransform);
        setCustomSize({ width: '', height: '', applied: false });
        setOriginalImage(img);
      };
    }
  }, [selectedImageId, uploadedImages, getImageUrl]);

  const handleVariantSelect = useCallback((variant, type) => {
    setUploadedImages((prev) =>
      prev.map((img) =>
        img.id === selectedImageId
          ? {
              ...img,
              variants: { ...img.variants, [type]: variant },
              customFrameColor: type === 'color' ? null : img.customFrameColor,
              customSize: type === 'size' ? { width: '', height: '', applied: false } : img.customSize,
              cartItemId: img.cartItemId,
            }
          : img
      )
    );
    if (type === 'size') {
      const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
      if (selectedImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = getImageUrl(selectedImage.cropped_url || selectedImage.original_url);
        img.onload = () => {
          const canvasWidth = DEFAULT_CANVAS_WIDTH;
          const canvasHeight = DEFAULT_CANVAS_HEIGHT;
          const innerWidth = variant.inner_width || DEFAULT_INNER_WIDTH;
          const innerHeight = variant.inner_height || DEFAULT_INNER_HEIGHT;
          const scale = Math.max(innerWidth / img.width, innerHeight / img.height);
          const innerX = (canvasWidth - innerWidth) / 2;
          const innerY = (canvasHeight - innerHeight) / 2;
          const innerCenterX = innerX + innerWidth / 2;
          const innerCenterY = innerY + innerHeight / 2;
          const newTransform = {
            x: (innerCenterX - canvasWidth / 2) / scale,
            y: (innerCenterY - canvasHeight / 2) / scale,
            scale,
            rotation: 0,
          };
          setUploadedImages((prev) =>
            prev.map((img) =>
              img.id === selectedImageId
                ? { ...img, transform: newTransform }
                : img
            )
          );
          setImageTransform(newTransform);
          setCustomSize({ width: '', height: '', applied: false });
          setOriginalImage(img);
        };
      }
    }
  }, [selectedImageId, uploadedImages, getImageUrl]);

  const handleCustomSizeSubmit = useCallback((e) => {
    e.preventDefault();
    const width = parseFloat(customSize.width);
    const height = parseFloat(customSize.height);
    if (width > 0 && height > 0) {
      setUploadedImages((prev) =>
        prev.map((img) =>
          img.id === selectedImageId
            ? { ...img, customSize: { width, height, applied: false } }
            : img
        )
      );
      setCustomSize({ width, height, applied: false });
    } else {
      alert('Please enter valid width and height values in inches.');
    }
  }, [customSize, selectedImageId]);

  const resetVariants = useCallback(() => {
    setUploadedImages((prev) =>
      prev.map((img) =>
        img.id === selectedImageId
          ? { ...img, frame: null, variants: { color: null, size: null, finish: null, hanging: null }, frameTransform: { rotation: 0 }, customSize: { width: '', height: '', applied: false }, customFrameColor: null, printOptions: { ...img.printOptions, frameDepth: '0' } }
          : img
      )
    );
    setFrameImage(null);
    setFrameTransform({ rotation: 0 });
    setCustomSize({ width: '', height: '', applied: false });
  }, [selectedImageId]);

  const calculatePrice = (image) => {
    if (!image) return 0;
    if (isPrintOnly) {
      let price = 5;
      const area = (image.printOptions.size.width || 0) * (image.printOptions.size.height || 0);
      price += area * 0.3;
      return price;
    }
    if (!image.frame) return 0;
    let price = parseFloat(image.frame.price || 0);
    if (image.variants.color) price += parseFloat(image.variants.color.price || 0);
    if (image.variants.size) price += parseFloat(image.variants.size.price || 0);
    if (image.variants.finish) price += parseFloat(image.variants.finish.price || 0);
    if (image.variants.hanging) price += parseFloat(image.variants.hanging.price || 0);
    if (image.customSize.width && image.customSize.height) price += 10;
    if (image.printOptions.frameDepth && parseInt(image.printOptions.frameDepth) > 0) price += 5;
    return price;
  };

  const handleSave = async () => {
    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    if (!isPrintOnly && (!selectedImage || !selectedImage.frame)) {
      alert('Please select a frame');
      return;
    }

    let printWidth = selectedImage.printOptions.size.width;
    let printHeight = selectedImage.printOptions.size.height;
    if (!printWidth || !printHeight) {
      const croppedWidthInches = (cropBox.width / DPI).toFixed(2);
      const croppedHeightInches = (cropBox.height / DPI).toFixed(2);
      printWidth = printWidth || croppedWidthInches;
      printHeight = printHeight || croppedHeightInches;
      setUploadedImages((prev) =>
        prev.map((img) =>
          img.id === selectedImageId
            ? {
                ...img,
                printOptions: {
                  ...img.printOptions,
                  size: { width: printWidth, height: printHeight, unit: img.printOptions.size.unit || 'inches' },
                },
              }
            : img
        )
      );
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const adjustedImageUrl = canvas.toDataURL('image/png', 1.0);
    let adjustedFile;
    await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        adjustedFile = new File([blob], `adjusted_${selectedImage.original_file?.name || 'image.png'}`, {
          type: 'image/png',
        });
        resolve();
      }, 'image/png', 1.0);
    });

    const formData = new FormData();
    formData.append('print_width', printWidth);
    formData.append('print_height', printHeight);
    formData.append('print_unit', selectedImage.printOptions.size.unit || 'inches');
    formData.append('media_type', selectedImage.printOptions.mediaType);
    formData.append('paper_type', selectedImage.printOptions.paperType);
    formData.append('fit', selectedImage.printOptions.fit);
    formData.append('border_depth', selectedImage.printOptions.borderDepth);
    formData.append('border_color', selectedImage.printOptions.borderColor);
    formData.append('frame_depth', selectedImage.printOptions.frameDepth || '0');
    formData.append('custom_frame_color', selectedImage.customFrameColor || '');

    if (!isPrintOnly) {
      formData.append('frame', selectedImage.frame.id);
      if (selectedImage.variants.color) formData.append('color_variant', selectedImage.variants.color.id);
      if (selectedImage.variants.size) formData.append('size_variant', selectedImage.variants.size.id);
      if (selectedImage.variants.finish) formData.append('finish_variant', selectedImage.variants.finish.id);
      if (selectedImage.variants.hanging) formData.append('hanging_variant', selectedImage.variants.hanging.id);
      if (selectedImage.customSize.width && selectedImage.customSize.height) {
        formData.append('custom_width', selectedImage.customSize.width);
        formData.append('custom_height', selectedImage.customSize.height);
      }
      formData.append('transform_x', selectedImage.transform.x);
      formData.append('transform_y', selectedImage.transform.y);
      formData.append('scale', selectedImage.transform.scale);
      formData.append('rotation', selectedImage.transform.rotation);
      formData.append('frame_rotation', selectedImage.frameTransform.rotation);
    }

    formData.append('adjusted_image', adjustedFile);

    if (!selectedImage.cartItemId) {
      if (selectedImage.original_file) {
        formData.append('original_image', selectedImage.original_file);
      }
      if (selectedImage.cropped_file) {
        formData.append('cropped_image', selectedImage.cropped_file);
      }
    }

    const price = calculatePrice(selectedImage);
    formData.append('total_price', price.toFixed(2));

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      let response;
      if (selectedImage.cartItemId) {
        response = await axios.put(`${BASE_URL}/save-items/${selectedImage.cartItemId}/`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await axios.post(`${BASE_URL}/save-items/`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
      }

      alert(selectedImage.cartItemId ? 'Item updated successfully' : 'Item saved successfully');
      setUploadedImages((prev) =>
        prev.map((img) =>
          img.id === selectedImageId
            ? { ...img, adjusted_url: response.data.adjusted_image, cartItemId: response.data.id }
            : img
        )
      );
      navigate('/savedorder');
    } catch (error) {
      console.error('Error saving item:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      } else {
        alert('Error saving item: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
  };

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

  const renderPrintOptions = () => {
    if (!selectedImage || !selectedImage.printOptions) {
      return <div className="print-options mt-3 p-3 bg-light rounded" style={{ border: '1px solid #ffc800' }}>
        <p className="text-center text-muted">No image selected or print options unavailable</p>
      </div>;
    }

    return (
      <div className="print-options mt-3 p-3 bg-light rounded" style={{ border: '1px solid #ffc800' }}>
        <h4>Print Options</h4>
        <div className="mb-2">
          <label>Size:</label>
          <input
            type="number"
            placeholder="Width"
            value={selectedImage.printOptions.size.width || ''}
            onChange={(e) => updatePrintOptions('size', { ...selectedImage.printOptions.size, width: e.target.value })}
            className="form-control d-inline-block w-auto mx-2"
            min="1"
          />

          <span>x</span>
          <input
            type="number"
            placeholder="Height"
            value={selectedImage.printOptions.size.height || ''}
            onChange={(e) => updatePrintOptions('size', { ...selectedImage.printOptions.size, height: e.target.value })}
            className="form-control d-inline-block w-auto mx-2"
            min="1"
          />
          <select
            value={selectedImage.printOptions.size.unit || 'inches'}
            onChange={(e) => updatePrintOptions('size', { ...selectedImage.printOptions.size, unit: e.target.value })}
            className="form-select d-inline-block w-auto"
          >
            <option value="inches">Inches</option>
            <option value="cm">Cm</option>
          </select>
        </div>
        <div className="mb-2">
          <label>Media:</label>
          <select
            value={selectedImage.printOptions.mediaType || 'Photopaper'}
            onChange={(e) => updatePrintOptions('mediaType', e.target.value)}
            className="form-select w-auto d-inline-block mx-2"
          >
            <option value="Photopaper">Photopaper</option>
            <option value="Fine Art Paper">Fine Art Paper</option>
            <option value="Canvas">Canvas</option>
          </select>
          {selectedImage.printOptions.mediaType === 'Photopaper' && (
            <select
              value={selectedImage.printOptions.paperType || 'Premium Luster'}
              onChange={(e) => updatePrintOptions('paperType', e.target.value)}
              className="form-select w-auto d-inline-block mx-2"
            >
              <option value="Premium Luster">Premium Luster</option>
              <option value="Premium Matte">Premium Matte</option>
              <option value="Premium Glossy">Premium Glossy</option>
              <option value="Metallic Glossy">Metallic Glossy</option>
              <option value="Premium Satin">Premium Satin</option>
            </select>
          )}
        </div>
        <div className="mb-2">
          <label>Fit:</label>
          <div className="form-check form-check-inline mx-2">
            <input
              type="radio"
              name="fit"
              value="borderless"
              checked={selectedImage.printOptions.fit === 'borderless'}
              onChange={() => updatePrintOptions('fit', 'borderless')}
              className="form-check-input"
            />
            <label className="form-check-label">Borderless</label>
          </div>
          <div className="form-check form-check-inline">
            <input
              type="radio"
              name="fit"
              value="bordered"
              checked={selectedImage.printOptions.fit === 'bordered'}
              onChange={() => updatePrintOptions('fit', 'bordered')}
              className="form-check-input"
            />
            <label className="form-check-label">Bordered</label>
          </div>
        </div>
        {selectedImage.printOptions.fit === 'bordered' && (
          <div className="mb-2">
            <label>Border Settings:</label>
            <input
              type="number"
              placeholder="Depth (px)"
              value={selectedImage.printOptions.borderDepth || '0'}
              onChange={(e) => updatePrintOptions('borderDepth', e.target.value)}
              className="form-control d-inline-block w-auto mx-2"
              min="0"
            />
            <input
              type="color"
              value={selectedImage.printOptions.borderColor || '#ffffff'}
              onChange={(e) => updatePrintOptions('borderColor', e.target.value)}
              className="form-control-color d-inline-block mx-2"
            />
          </div>
        )}

        {!isPrintOnly && selectedImage.frame && (
          <div className="mb-2">
            <label>Frame Depth:</label>
            <input
              type="number"
              placeholder="Depth (px)"
              value={selectedImage.printOptions.frameDepth || '0'}
              onChange={(e) => updatePrintOptions('frameDepth', e.target.value)}
              className="form-control d-inline-block w-auto mx-2"
              min="0"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="row">
      <div className="col-lg-12">
        {cropping && selectedImage ? (
          <div
            className="main-image mb-3 d-flex flex-column justify-content-center align-items-center"
            style={{ height: '500px', position: 'relative', backgroundColor: '#f8f9fa' }}
          >
            <canvas
              ref={canvasRef}
              width={DEFAULT_CANVAS_WIDTH}
              height={DEFAULT_CANVAS_HEIGHT}
              className="border border-gray-300 rounded"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
            />
            <div className="controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-success crop-btn" onClick={applyCrop} title="Apply Crop">
                  <i className="bi bi-check"></i>
                </button>
                <button className="btn btn-danger crop-btn" onClick={cancelCrop} title="Cancel">
                  <i className="bi bi-x"></i>
                </button>
              </div>
              <p style={{ margin: 0 }}>
                Crop Size: {(cropBox.width / DPI).toFixed(2)} x {(cropBox.height / DPI).toFixed(2)} inches | Aspect Ratio: {(cropBox.width / cropBox.height).toFixed(2)}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="main-image mb-3 d-flex flex-column justify-content-center align-items-center"
            style={{ height: '500px', border: '1px solid #ddd' }}
          >

            <canvas
              ref={canvasRef}
              width={DEFAULT_CANVAS_WIDTH}
              height={DEFAULT_CANVAS_HEIGHT}
              className="border border-gray-300 rounded"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
            />
            {selectedImage && (
              <div className="image-controls mt-3">
                <button className="btn btn-outline" onClick={() => adjustScale(0.1)} title="Zoom In">
                  <i className="bi bi-zoom-in"></i>
                </button>
                <button className="btn btn-outline" onClick={() => adjustScale(-0.1)} title="Zoom Out">
                  <i className="bi bi-zoom-out"></i>
                </button>
                <button className="btn btn-outline" onClick={() => adjustImageRotation(90)} title="Rotate Image Right">
                  <i className="bi bi-arrow-clockwise"></i>Image
                </button>
                <button className="btn btn-outline" onClick={() => adjustImageRotation(-90)} title="Rotate Image Left">
                  <i className="bi bi-arrow-counterclockwise"></i>Image
                </button>
                {selectedImage.frame && (
                  <>
                    <button className="btn btn-outline" onClick={() => adjustFrameRotation(90)} title="Rotate Frame Right">
                      <i className="bi bi-arrow-clockwise"></i> Frame
                    </button>
                    <button className="btn btn-outline" onClick={() => adjustFrameRotation(-90)} title="Rotate Frame Left">
                      <i className="bi bi-arrow-counterclockwise"></i> Frame
                    </button>
                  </>
                )}
                <button className="btn btn-outline" onClick={toggleCropMode} title="Crop">
                  <i className="bi bi-crop"></i>
                </button>
                <button className="btn btn-outline" onClick={resetToOriginal} title="Reset Position">
                  <i className="bi bi-arrow-repeat"></i>
                </button>
                <button className="btn btn-outline" onClick={resetTransform} title="Reset Image">
                  <i className="bi bi-bootstrap-reboot"></i>
                </button>
                {!isPrintOnly && <button className="btn btn-outline" onClick={resetVariants}>None Frame</button>}
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
 
      <div className="row">
        <div className="col-12">
          <div className="p-4 bg-light rounded shadow-sm" style={{ border: '1px solid #ffc800', minHeight: '200px', overflow: 'auto' }}>
            {!cropping && selectedImage && renderPrintOptions()}
            {!isPrintOnly && !cropping && (
              <>
                {activeCategory === 'frame' && (
                  <div>
                    <h3 className="mb-3 text-center">Select Frame Category</h3>
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="form-select mb-3 mx-auto"
                      style={{ maxWidth: '300px' }}
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.frameCategory}
                        </option>
                      ))}
                    </select>
                    <h3 className="mb-3 text-center">Select Frame</h3>
                    <div className="frame-list d-flex flex-wrap justify-content-center gap-3">
                      {frames.length > 0 ? (
                        frames.map((frame) => (
                          <div
                            key={frame.id}
                            className={`frame-item p-3 bg-white rounded shadow-sm ${selectedImage?.frame?.id === frame.id ? 'border border-primary' : 'border border-light'}`}
                            onClick={() => handleSelectFrame(frame)}
                            style={{ cursor: 'pointer', width: '150px', textAlign: 'center' }}
                          >
                            <img
                              src={getImageUrl(frame.corner_image)}
                              alt={frame.name}
                              style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto' }}
                              onError={handleImageError}
                            />
                            <p className="mt-2 mb-0">${frame.price}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted">No frames available</p>
                      )}
                    </div>
                  </div>
                )}
                {activeCategory === 'color' && (
                  <div>
                    <h3 className="mb-3 text-center">Select Color</h3>
                    <div className="frame-list d-flex flex-wrap justify-content-center gap-3">
                      {selectedImage?.frame ? (
                        <>
                          {selectedImage.frame.color_variants.length > 0 ? (
                            selectedImage.frame.color_variants.map((variant) => (
                              <div
                                key={variant.id}
                                className={`frame-item p-3 bg-white rounded shadow-sm ${selectedImage.variants.color?.id === variant.id ? 'border border-primary' : 'border border-light'}`}
                                onClick={() => handleVariantSelect(variant, 'color')}
                                style={{ cursor: 'pointer', width: '150px', textAlign: 'center' }}
                              >
                                <img
                                  src={getImageUrl(variant.corner_image)}
                                  alt={variant.color_name}
                                  style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto' }}
                                  onError={handleImageError}
                                />
                                <p className="mt-2 mb-0">{variant.color_name || 'No name'}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-muted">No color variants available</p>
                          )}
                          <div className="custom-color p-3 bg-white rounded shadow-sm" style={{ width: '150px', textAlign: 'center' }}>
                            <h4>Custom Color</h4>
                            <input
                              type="color"
                              value={selectedImage.customFrameColor || '#000000'}
                              onChange={(e) => {
                                setUploadedImages((prev) =>
                                  prev.map((img) =>
                                    img.id === selectedImageId ? { ...img, customFrameColor: e.target.value, variants: { ...img.variants, color: null } } : img
                                  )
                                );
                              }}
                              className="form-control-color"
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-muted">Please select a frame first</p>
                      )}
                    </div>
                  </div>
                )}
                {activeCategory === 'size' && (
                  <div>
                    <h3 className="mb-3 text-center">Select Size</h3>
                    <div className="frame-list d-flex flex-wrap justify-content-center gap-3">
                      {selectedImage?.frame ? (
                        <>
                          <div className="custom-size p-3 bg-white rounded shadow-sm" style={{ width: '200px', textAlign: 'center' }}>
                            <h4>Custom Size</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="Width (inches)"
                                value={customSize.width}
                                onChange={(e) => setCustomSize({ ...customSize, width: e.target.value })}
                                style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                              />
                              <input
                                type="number"
                                step="0.1"
                                placeholder="Height (inches)"
                                value={customSize.height}
                                onChange={(e) => setCustomSize({ ...customSize, height: e.target.value })}
                                style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                              />
                              <button
                                className="btn btn-primary"
                                onClick={handleCustomSizeSubmit}
                                disabled={!customSize.width || !customSize.height}
                              >
                                Apply Custom Size
                              </button>
                            </div>
                          </div>
                          {selectedImage.frame.size_variants.length > 0 ? (
                            selectedImage.frame.size_variants.map((variant) => (
                              <div
                                key={variant.id}
                                className={`frame-item p-3 bg-white rounded shadow-sm ${selectedImage.variants.size?.id === variant.id ? 'border border-primary' : 'border border-light'}`}
                                onClick={() => handleVariantSelect(variant, 'size')}
                                style={{ cursor: 'pointer', width: '150px', textAlign: 'center' }}
                              >
                                <img
                                  src={getImageUrl(variant.corner_image)}
                                  alt={variant.size_name}
                                  style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto' }}
                                  onError={handleImageError}
                                />
                                <p className="mt-2 mb-0">{variant.size_name || 'No name'}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-muted">No predefined size variants available</p>
                          )}
                        </>
                      ) : (
                        <p className="text-center text-muted">Please select a frame first</p>
                      )}
                    </div>
                  </div>
                )}
                {activeCategory === 'finish' && (
                  <div>
                    <h3 className="mb-3 text-center">Select Finish</h3>
                    <div className="frame-list d-flex flex-wrap justify-content-center gap-3">
                      {selectedImage?.frame ? (
                        selectedImage.frame.finishing_variants.length > 0 ? (
                          selectedImage.frame.finishing_variants.map((variant) => (
                            <div
                              key={variant.id}
                              className={`frame-item p-3 bg-white rounded shadow-sm ${selectedImage.variants.finish?.id === variant.id ? 'border border-primary' : 'border border-light'}`}
                              onClick={() => handleVariantSelect(variant, 'finish')}
                              style={{ cursor: 'pointer', width: '150px', textAlign: 'center' }}
                            >
                              <img
                                src={getImageUrl(variant.corner_image)}
                                alt={variant.finish_name}
                                style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto' }}
                                onError={handleImageError}
                              />
                              <p className="mt-2 mb-0">{variant.finish_name || 'No name'}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted">No finishing variants available</p>
                        )
                      ) : (
                        <p className="text-center text-muted">Please select a frame first</p>
                      )}
                    </div>
                  </div>
                )}
                {activeCategory === 'hanging' && (
                  <div>
                    <h3 className="mb-3 text-center">Select Hanging</h3>
                    <div className="frame-list d-flex flex-wrap justify-content-center gap-3">
                      {selectedImage?.frame ? (
                        selectedImage.frame.frameHanging_variant?.length > 0 ? (
                          selectedImage.frame.frameHanging_variant.map((variant) => (
                            <div
                              key={variant.id}
                              className={`frame-item p-3 bg-white rounded shadow-sm ${selectedImage.variants.hanging?.id === variant.id ? 'border border-primary' : 'border border-light'}`}
                              onClick={() => handleVariantSelect(variant, 'hanging')}
                              style={{ cursor: 'pointer', width: '150px', textAlign: 'center' }}
                            >
                              <img
                                src={getImageUrl(variant.image)}
                                alt={variant.hanging_name}
                                style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto' }}
                                onError={handleImageError}
                              />
                              <p className="mt-2 mb-0">{variant.hanging_name || 'No name'}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted">No hanging variants available</p>
                        )
                      ) : (
                        <p className="text-center text-muted">Please select a frame first</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="mt-4">
              <h3 className="mb-3 text-center">Selected Options</h3>
              <div className="options-list bg-white p-3 rounded shadow-sm">
                <div className="d-flex justify-content-between mb-2">
                  <strong>Size:</strong>
                  <span>
                    {(selectedImage?.customSize?.width && selectedImage?.customSize?.height)
                      ? `${selectedImage.customSize.width}x${selectedImage.customSize.height} inches (Custom)`
                      : `${selectedImage?.printOptions?.size?.width || 'N/A'}x${selectedImage?.printOptions?.size?.height || 'N/A'} ${selectedImage?.printOptions?.size?.unit || 'inches'}`}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <strong>Media:</strong>
                  <span>{selectedImage?.printOptions?.mediaType || 'None'}</span>
                </div>
                {selectedImage?.printOptions?.mediaType === 'Photopaper' && (
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Paper Type:</strong>
                    <span>{selectedImage?.printOptions?.paperType || 'None'}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between mb-2">
                  <strong>Fit:</strong>
                  <span>{selectedImage?.printOptions?.fit || 'None'}</span>
                </div>
                {selectedImage?.printOptions?.fit === 'bordered' && (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Border Depth:</strong>
                      <span>{selectedImage?.printOptions?.borderDepth || '0'} px</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Border Color:</strong>
                      <span>{selectedImage?.printOptions?.borderColor || '#ffffff'}</span>
                    </div>
                  </>
                )}
                {!isPrintOnly && (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Frame:</strong>
                      <span>{selectedImage?.frame?.name || 'None'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Frame Color:</strong>
                      <span>{selectedImage?.customFrameColor ? `Custom (${selectedImage.customFrameColor})` : selectedImage?.variants?.color?.color_name || 'None'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Size:</strong>
                      <span>{selectedImage?.variants?.size?.size_name || 'None'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Finish:</strong>
                      <span>{selectedImage?.variants?.finish?.finish_name || 'None'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Hanging:</strong>
                      <span>{selectedImage?.variants?.hanging?.hanging_name || 'None'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Image Rotation:</strong>
                      <span>{selectedImage?.transform?.rotation || 0}°</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Frame Rotation:</strong>
                      <span>{selectedImage?.frameTransform?.rotation || 0}°</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Frame Depth:</strong>
                      <span>{selectedImage?.printOptions?.frameDepth || 0} px</span>
                    </div>
                  </>
                )}
                {(isPrintOnly ? (selectedImage?.printOptions?.size?.width && selectedImage?.printOptions?.size?.height) : selectedImage?.frame) && (
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Price:</strong>
                    <span>${calculatePrice(selectedImage).toFixed(2)}</span>
                  </div>
                )}
              </div>
              {selectedImage && (selectedImage.frame || isPrintOnly) && (
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-primary" onClick={handleSave}>
                    {selectedImage.cartItemId ? 'Update' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Headers;