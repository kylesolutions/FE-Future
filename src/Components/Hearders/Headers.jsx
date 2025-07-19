import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, ZoomIn, ZoomOut, RotateCw, RotateCcw, Crop, RotateCw as RotateClockwise, MousePointerClick as RotateCounterClockwise, RefreshCw, Rewind, Plus, Check, X, Save, Search, Plus as PlusIcon, Minus } from 'lucide-react';
import './Headers.css';

const BASE_URL = 'http://localhost:8000';
const FALLBACK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABYSURBVHhe7cExAQAwDMCg7f8/8A2BFXgJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA+yU/AJSsIW0W2i4AAAAASUVORK5CYII=';
const DEFAULT_CANVAS_WIDTH = 400;
const DEFAULT_CANVAS_HEIGHT = 400;
const DEFAULT_INNER_WIDTH = 320;
const DEFAULT_INNER_HEIGHT = 320;
const DPI = 96;

function Headers({ activeCategory, onCategorySelect, cartItem, setHasUploadedImages, isPrintOnly }) {
  const [frames, setFrames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mackBoards, setMackBoards] = useState([]);
  const [mackBoardImage, setMackBoardImage] = React.useState(null);
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
  const [cropWidth, setCropWidth] = useState('');
  const [cropHeight, setCropHeight] = useState('');
  const [cropUnit, setCropUnit] = useState('inches');
  const [isMagnified, setIsMagnified] = useState(false);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [magnificationFactor, setMagnificationFactor] = useState(5);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const borderColorInputRef = useRef(null);
  const magnifierCanvasRef = useRef(null);
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

  const getBorderDepthInPixels = (borderDepth, borderUnit) => {
    if (borderUnit === 'px') {
      return parseInt(borderDepth) || 0;
    } else if (borderUnit === 'inches') {
      return (parseFloat(borderDepth) || 0) * DPI;
    } else if (borderUnit === 'cm') {
      return (parseFloat(borderDepth) / 2.54 || 0) * DPI;
    }
    return 0;
  };

  useEffect(() => {
    const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
    if (selectedImage && !isPrintOnly && selectedImage.frame && originalImage) {
      const borderDepth = getBorderDepthInPixels(selectedImage.printOptions.borderDepth, selectedImage.printOptions.borderUnit);
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

    canvas.width = DEFAULT_CANVAS_WIDTH;
    canvas.height = DEFAULT_CANVAS_HEIGHT;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let innerWidth = selectedImage?.variants?.size?.inner_width || selectedImage?.frame?.inner_width || DEFAULT_INNER_WIDTH;
    let innerHeight = selectedImage?.variants?.size?.inner_height || selectedImage?.frame?.inner_height || DEFAULT_INNER_HEIGHT;

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

      ctx.fillStyle = '#333';
      handles.forEach((handle) => {
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      });
    } else if (isPrintOnly && selectedImage?.printOptions?.size?.width && selectedImage?.printOptions?.size?.height) {
      const widthInInches = selectedImage.printOptions.size.unit === 'cm' ? selectedImage.printOptions.size.width / 2.54 : selectedImage.printOptions.size.width;
      const heightInInches = selectedImage.printOptions.size.unit === 'cm' ? selectedImage.printOptions.size.height / 2.54 : selectedImage.printOptions.size.height;
      const printWidth = widthInInches * DPI;
      const printHeight = heightInInches * DPI;
      const printAspect = widthInInches / heightInInches;

      const margin = 40;
      const maxPreviewWidth = canvas.width - 2 * margin;
      const maxPreviewHeight = canvas.height - 2 * margin;

      let previewWidth, previewHeight;
      if (printAspect > maxPreviewWidth / maxPreviewHeight) {
        previewWidth = maxPreviewWidth;
        previewHeight = maxPreviewWidth / printAspect;
      } else {
        previewHeight = maxPreviewHeight;
        previewWidth = maxPreviewHeight * printAspect;
      }

      const previewX = (canvas.width - previewWidth) / 2;
      const previewY = (canvas.height - previewHeight) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(previewX, previewY, previewWidth, previewHeight);
      ctx.clip();

      const borderDepth = getBorderDepthInPixels(selectedImage.printOptions.borderDepth, selectedImage.printOptions.borderUnit);
      const borderScale = previewWidth / printWidth;

      if (selectedImage.printOptions.fit === 'borderless') {
        const imageScale = Math.max(previewWidth / originalImage.width, previewHeight / originalImage.height);
        const totalScale = imageScale * imageTransform.scale;
        ctx.save();
        ctx.translate(previewX + previewWidth / 2, previewY + previewHeight / 2);
        ctx.rotate((imageTransform.rotation * Math.PI) / 180);
        ctx.scale(totalScale, totalScale);
        ctx.translate(imageTransform.x, imageTransform.y);
        ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
        ctx.restore();
      } else {
        const borderDepthPreview = borderDepth * borderScale;
        const imagePreviewWidth = previewWidth - 2 * borderDepthPreview;
        const imagePreviewHeight = previewHeight - 2 * borderDepthPreview;

        if (imagePreviewWidth > 0 && imagePreviewHeight > 0) {
          const borderColor = selectedImage.printOptions.borderColor || '#ffffff';
          ctx.fillStyle = borderColor;
          ctx.fillRect(previewX, previewY, previewWidth, previewHeight);

          ctx.save();
          ctx.translate(previewX + borderDepthPreview, previewY + borderDepthPreview);
          ctx.beginPath();
          ctx.rect(0, 0, imagePreviewWidth, imagePreviewHeight);
          ctx.clip();
          const imageScale = Math.min(imagePreviewWidth / originalImage.width, imagePreviewHeight / originalImage.height);
          const totalScale = imageScale * imageTransform.scale;
          ctx.translate(imagePreviewWidth / 2, imagePreviewHeight / 2);
          ctx.rotate((imageTransform.rotation * Math.PI) / 180);
          ctx.scale(totalScale, totalScale);
          ctx.translate(imageTransform.x, imageTransform.y);
          ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
          ctx.restore();
        }
      }
      ctx.restore();
    } else {
      const frameDepth = selectedImage?.printOptions?.frameDepth ? parseInt(selectedImage.printOptions.frameDepth) : 0;
      const borderDepth = getBorderDepthInPixels(selectedImage?.printOptions?.borderDepth, selectedImage?.printOptions?.borderUnit);
      const borderColor = selectedImage?.printOptions?.borderColor || '#ffffff';

      let innerX = (canvas.width - innerWidth) / 2;
      let innerY = (canvas.height - innerHeight) / 2;

      if (hasFrame) {
        const frameDepth = selectedImage?.printOptions?.frameDepth ? parseInt(selectedImage.printOptions.frameDepth) : 0;
        const borderDepth = getBorderDepthInPixels(selectedImage?.printOptions?.borderDepth, selectedImage?.printOptions?.borderUnit);
        const borderColor = selectedImage?.printOptions?.borderColor || '#ffffff';

        let innerX = (canvas.width - innerWidth) / 2;
        let innerY = (canvas.height - innerHeight) / 2;

        innerX += frameDepth;
        innerY += frameDepth;
        innerWidth -= 2 * frameDepth;
        innerHeight -= 2 * frameDepth;

        let matDepth = 0;
        if (selectedImage.mackBoard) {
          matDepth = frameDepth || 20; // Fallback to 20px if frameDepth is 0
          console.log('Drawing MackBoard with matDepth:', matDepth, 'MackBoard:', selectedImage.mackBoard.board_name);
        }

        if (matDepth > 0) {
  if (mackBoardImage) {
    const pattern = ctx.createPattern(mackBoardImage, 'repeat');
    ctx.fillStyle = pattern;
    console.log('Drawing MackBoard pattern at:', { innerX, innerY, innerWidth, innerHeight, matDepth });
    ctx.fillRect(innerX, innerY, innerWidth, matDepth); // Top
    ctx.fillRect(innerX, innerY + innerHeight - matDepth, innerWidth, matDepth); // Bottom
    ctx.fillRect(innerX, innerY + matDepth, matDepth, innerHeight - 2 * matDepth); // Left
    ctx.fillRect(innerX + innerWidth - matDepth, innerY + matDepth, matDepth, innerHeight - 2 * matDepth); // Right
  } else {
    ctx.fillStyle = '#f0f0f0';
    console.warn('MackBoard image not loaded, using fallback color');
    ctx.fillRect(innerX, innerY, innerWidth, matDepth); // Top
    ctx.fillRect(innerX, innerY + innerHeight - matDepth, innerWidth, matDepth); // Bottom
    ctx.fillRect(innerX, innerY + matDepth, matDepth, innerHeight - 2 * matDepth); // Left
    ctx.fillRect(innerX + innerWidth - matDepth, innerY + matDepth, matDepth, innerHeight - 2 * matDepth); // Right
  }

  innerX += matDepth;
  innerY += matDepth;
  innerWidth -= 2 * matDepth;
  innerHeight -= 2 * matDepth;
}

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

        const scale = Math.min(tempCanvas.width / frameImage.width, tempCanvas.height / frameImage.height);
        tempCtx.save();
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate((frameTransform.rotation * Math.PI) / 180);
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(frameImage, -frameImage.width / 2, -frameImage.height / 2);
        tempCtx.restore();

        if (selectedImage.customFrameColor) {
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imageData.data;
          const hex = selectedImage.customFrameColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);

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
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((imageTransform.rotation * Math.PI) / 180);
        ctx.scale(imageTransform.scale, imageTransform.scale);
        ctx.translate(imageTransform.x, imageTransform.y);
        ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
        ctx.restore();
      }
    }
  }, [cropping, cropBox, originalImage, imageTransform, frameTransform, frameImage, selectedImageId, uploadedImages, isPrintOnly, mackBoardImage]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        let url = `${BASE_URL}/frames/`;
        if (selectedCategory) {
          url += `?category_id=${selectedCategory}`;
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
    fetchFrames();
  }, [selectedCategory, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const [categoriesResponse, mackBoardsResponse] = await Promise.all([
          axios.get(`${BASE_URL}/categories/`, config),
          axios.get(`${BASE_URL}/mackboards/`, config),
        ]);
        setCategories(categoriesResponse.data);
        setMackBoards(mackBoardsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      }
    };
    fetchData();
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
          mackBoard: cartItem.mackBoard || null,
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
            mediaType: cartItem.media_type || null,
            paperType: cartItem.paper_type || null,
            fit: cartItem.fit || 'borderless',
            borderDepth: cartItem.border_depth || '0',
            borderColor: cartItem.border_color || '#ffffff',
            frameDepth: cartItem.frame_depth || '0',
            borderUnit: cartItem.border_unit || 'px',
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
          const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
          setImageTransform({ x: 0, y: 0, scale, rotation: 0 });
          setCropBox({
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            startX: 0,
            startY: 0,
            isResizing: false,
            resizeHandle: '',
          });
          setCropping(true);
          const currentSize = selectedImage.printOptions.size;
          if (currentSize.width && currentSize.height) {
            setCropWidth(currentSize.width);
            setCropHeight(currentSize.height);
            setCropUnit(currentSize.unit);
          } else {
            setCropWidth('');
            setCropHeight('');
            setCropUnit('inches');
          }
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
          mackBoard: null,
          variants: { color: null, size: null, finish: null, hanging: null },
          transform: { x: 0, y: 0, scale, rotation: 0 },
          frameTransform: { rotation: 0 },
          customSize: { width: '', height: '', applied: false },
          printOptions: {
            size: { width: '', height: '', unit: 'inches' },
            mediaType: '',
            paperType: '',
            fit: 'borderless',
            borderDepth: '0',
            borderColor: '#ffffff',
            frameDepth: '0',
            borderUnit: 'px',
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
  if (!canvasRef.current) {
    console.error('Canvas reference is not defined');
    return;
  }
  if (!uploadedImages.find((img) => img.id === selectedImageId)) return;

  const rect = canvasRef.current.getBoundingClientRect();
  if (!rect) return;

  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);

  if (!cropping && selectedImage?.printOptions.fit === 'bordered') {
    const borderDepth = getBorderDepthInPixels(selectedImage.printOptions.borderDepth, selectedImage.printOptions.borderUnit);
    if (
      mouseY < borderDepth ||
      mouseY > canvasRef.current.height - borderDepth ||
      mouseX < borderDepth ||
      mouseX > canvasRef.current.width - borderDepth
    ) {
      borderColorInputRef.current.click();
      return;
    }
  }

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

    if (isMagnifierActive && magnifierCanvasRef.current) {
      const magnifierCtx = magnifierCanvasRef.current.getContext('2d');
      const magnifierSize = 100;
      const sSize = magnifierSize / magnificationFactor;
      const sx = Math.max(0, Math.min(canvasWidth - sSize, mouseX - sSize / 2));
      const sy = Math.max(0, Math.min(canvasHeight - sSize, mouseY - sSize / 2));
      magnifierCtx.clearRect(0, 0, magnifierSize, magnifierSize);
      magnifierCtx.drawImage(
        canvasRef.current,
        sx, sy, sSize, sSize,
        0, 0, magnifierSize, magnifierSize
      );
      magnifierCtx.fillStyle = 'white';
      magnifierCtx.font = '12px Arial';
      magnifierCtx.fillText(`${magnificationFactor}x`, 5, 15);
      setMagnifierPosition({ x: e.clientX + 10, y: e.clientY + 10 });
    }
  }, [cropping, cropBox, isDragging, dragStart, selectedImageId, uploadedImages, imageTransform, isMagnifierActive, magnificationFactor]);

  const handleCanvasMouseUp = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const distance = Math.sqrt((mouseX - dragStart.x) ** 2 + (mouseY - dragStart.y) ** 2);
    if (distance < 5 && !cropping) {
      setIsMagnified(true);
    }
    setIsDragging(false);
    setCropBox((prev) => ({ ...prev, isResizing: false, resizeHandle: '' }));
  }, [dragStart, cropping]);

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
          prev.map((img) => (img.id === selectedImageId ? { ...img, cropped_file: null, cropped_url: null, adjusted_file: null, adjusted_url: null, transform: newTransform, frameTransform: newFrameTransform, customSize: { width: '', height: '', applied: false }, customFrameColor: null, printOptions: { ...img.printOptions, frameDepth: '0' }, mackBoard: null } : img))
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
          const defaultSize = {
            width: cropWidth || (cropBox.width / DPI).toFixed(2),
            height: cropHeight || (cropBox.height / DPI).toFixed(2),
            unit: cropUnit
          };
          const scale = Math.min(DEFAULT_CANVAS_WIDTH / img.width, DEFAULT_CANVAS_HEIGHT / img.height);
          const newTransform = { x: 0, y: 0, scale: scale > 1 ? 1 : scale, rotation: 0 };

          setUploadedImages((prev) =>
            prev.map((img) =>
              img.id === selectedImageId
                ? {
                  ...img,
                  cropped_file: croppedFile,
                  cropped_url: croppedUrl,
                  transform: newTransform,
                  printOptions: {
                    ...img.printOptions,
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
  }, [cropping, cropBox, originalImage, imageTransform, selectedImageId, uploadedImages, cropWidth, cropHeight, cropUnit, onCategorySelect, navigate, getImageUrl]);

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
          prev.map((img) => (img.id === selectedImageId ? { ...img, cropped_file: null, cropped_url: null, adjusted_file: null, adjusted_url: null, transform: newTransform, frameTransform: newFrameTransform, customSize: { width: '', height: '', applied: false }, customFrameColor: null, printOptions: { ...img.printOptions, frameDepth: '0' }, mackBoard: null } : img))
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
              ? { ...img, frame, variants: { color: null, size: null, finish: null, hanging: null }, transform: newTransform, frameTransform: newFrameTransform, customSize: { width: '', height: '', applied: false }, customFrameColor: null, cartItemId: img.cartItemId, printOptions: { ...img.printOptions, frameDepth: '0' }, mackBoard: null }
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
          ? { ...img, frame: null, mackBoard: null, variants: { color: null, size: null, finish: null, hanging: null }, frameTransform: { rotation: 0 }, customSize: { width: '', height: '', applied: false }, customFrameColor: null, printOptions: { ...img.printOptions, frameDepth: '0' } }
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
        adjustedFile = new File([blob], 'adjusted.png', { type: 'image/png' });
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
    formData.append('border_unit', selectedImage.printOptions.borderUnit);
    formData.append('frame_depth', selectedImage.printOptions.frameDepth || '0');
    formData.append('custom_frame_color', selectedImage.customFrameColor || '');
    if (selectedImage.mackBoard) {
      formData.append('mack_board', selectedImage.mackBoard.id);
    }

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

    if (!selectedImage.cartItemId) {
      if (selectedImage.original_file) {
        const ext = selectedImage.original_file.name.split('.').pop();
        const originalFile = new File([selectedImage.original_file], `original.${ext}`, {
          type: selectedImage.original_file.type,
        });
        formData.append('original_image', originalFile);
      }
      if (selectedImage.cropped_file) {
        const croppedFile = new File([selectedImage.cropped_file], 'cropped.png', {
          type: 'image/png',
        });
        formData.append('cropped_image', croppedFile);
      }
    }
    formData.append('adjusted_image', adjustedFile);

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

 useEffect(() => {
  const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
  if (selectedImage?.mackBoard?.image) {
    const url = getImageUrl(selectedImage.mackBoard.image);
    console.log('Attempting to load MackBoard image from:', url);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      console.log('MackBoard image loaded successfully from:', url);
      setMackBoardImage(img);
    };
    img.onerror = () => {
      console.error('Failed to load MackBoard image from:', url);
      setMackBoardImage(null);
    };
  } else {
    setMackBoardImage(null);
  }
}, [selectedImageId, uploadedImages, getImageUrl]);

  if (uploadedImages.length === 0) {
    return (
      <div className="upload-area">
        <div className="upload-content">
          <Upload size={48} className="upload-icon" />
          <h3>Upload Your Images</h3>
          <p>Drag and drop or click to select images</p>
          <button className="upload-button" onClick={triggerUpload}>
            Choose Files
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
        </div>
      </div>
    );
  }

  const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);

  if (cropping && selectedImage) {
    return (
      <div className="modern-headers">
        <div className="canvas-section">
          <div className="crop-container">
            <div className="crop-canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={DEFAULT_CANVAS_WIDTH}
                height={DEFAULT_CANVAS_HEIGHT}
                className="design-canvas crop-mode"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
              />
            </div>
            <div className="crop-controls">
              <div className="crop-actions">
                <button className="crop-action-btn apply" onClick={applyCrop}>
                  <Check size={16} />
                  Apply Crop
                </button>
                <button className="crop-action-btn cancel" onClick={cancelCrop}>
                  <X size={16} />
                  Cancel
                </button>
              </div>
              <div className="crop-settings">
                <div className="crop-size-inputs">
                  <input
                    type="number"
                    value={cropWidth}
                    onChange={(e) => setCropWidth(e.target.value)}
                    placeholder="Width"
                    className="crop-size-input"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    value={cropHeight}
                    onChange={(e) => setCropHeight(e.target.value)}
                    placeholder="Height"
                    className="crop-size-input"
                  />
                  <select
                    value={cropUnit}
                    onChange={(e) => setCropUnit(e.target.value)}
                    className="crop-unit-select"
                  >
                    <option value="inches">Inches</option>
                    <option value="cm">Cm</option>
                  </select>
                </div>
                <div className="crop-info">
                  <p>Crop Size: {(cropBox.width / DPI).toFixed(2)} × {(cropBox.height / DPI).toFixed(2)} inches</p>
                  <p>Aspect Ratio: {(cropBox.width / cropBox.height).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderPrintOptions = () => {
    if (!selectedImage || !selectedImage.printOptions) {
      return (
        <div className="print-options-empty">
          <p>No image selected or print options unavailable</p>
        </div>
      );
    }

    const isSizeReadOnly = selectedImage.cropped_url !== null;

    return (
      <div className="print-options-panel">
        <h3>Print Options</h3>

        <div className="option-group">
          <label>Size</label>
          <div className="size-controls">
            <input
              type="number"
              placeholder="Width"
              value={selectedImage.printOptions.size.width || ''}
              onChange={(e) => updatePrintOptions('size', { ...selectedImage.printOptions.size, width: e.target.value })}
              className="size-input"
              min="1"
              disabled={isSizeReadOnly}
            />
            <span className="size-separator">×</span>
            <input
              type="number"
              placeholder="Height"
              value={selectedImage.printOptions.size.height || ''}
              onChange={(e) => updatePrintOptions('size', { ...selectedImage.printOptions.size, height: e.target.value })}
              className="size-input"
              min="1"
              disabled={isSizeReadOnly}
            />
            <select
              value={selectedImage.printOptions.size.unit || 'inches'}
              onChange={(e) => updatePrintOptions('size', { ...selectedImage.printOptions.size, unit: e.target.value })}
              className="unit-select"
              disabled={isSizeReadOnly}
            >
              <option value="inches">Inches</option>
              <option value="cm">Cm</option>
            </select>
          </div>
        </div>

        <div className="option-group">
          <label>Media</label>
          <select
            value={selectedImage.printOptions.mediaType || ''}
            onChange={(e) => updatePrintOptions('mediaType', e.target.value)}
            className="media-select"
          >
            <option value="">-- Select Media --</option>
            <option value="Photopaper">Photopaper</option>
            <option value="Fine Art Paper">Fine Art Paper</option>
            <option value="Canvas">Canvas</option>
          </select>

          {selectedImage.printOptions.mediaType === 'Photopaper' && (
            <select
              value={selectedImage.printOptions.paperType || ''}
              onChange={(e) => updatePrintOptions('paperType', e.target.value)}
              className="paper-select"
            >
              <option value="">-- Select Paper Type --</option>
              <option value="Premium Luster">Premium Luster</option>
              <option value="Premium Matte">Premium Matte</option>
              <option value="Premium Glossy">Premium Glossy</option>
              <option value="Metallic Glossy">Metallic Glossy</option>
              <option value="Premium Satin">Premium Satin</option>
            </select>
          )}
        </div>

        <div className="option-group">
          <label>Fit</label>
          <div className="fit-controls">
            <label className="radio-label">
              <input
                type="radio"
                name="fit"
                value="borderless"
                checked={selectedImage.printOptions.fit === 'borderless'}
                onChange={() => updatePrintOptions('fit', 'borderless')}
              />
              Borderless
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="fit"
                value="bordered"
                checked={selectedImage.printOptions.fit === 'bordered'}
                onChange={() => updatePrintOptions('fit', 'bordered')}
              />
              Bordered
            </label>
          </div>
        </div>

        {selectedImage.printOptions.fit === 'bordered' && (
          <div className="option-group">
            <label>Border Settings</label>
            <div className="border-controls">
              <input
                type="number"
                placeholder="Depth"
                value={selectedImage.printOptions.borderDepth || '0'}
                onChange={(e) => updatePrintOptions('borderDepth', e.target.value)}
                className="border-input"
                min="0"
              />
              <select
                value={selectedImage.printOptions.borderUnit || 'px'}
                onChange={(e) => updatePrintOptions('borderUnit', e.target.value)}
                className="unit-select"
              >
                <option value="px">px</option>
                <option value="inches">inches</option>
                <option value="cm">cm</option>
              </select>
              <input
                type="color"
                ref={borderColorInputRef}
                value={selectedImage.printOptions.borderColor || '#ffffff'}
                onChange={(e) => updatePrintOptions('borderColor', e.target.value)}
                className="color-input"
              />
            </div>
          </div>
        )}

        {!isPrintOnly && selectedImage.frame && (
          <div className="option-group">
            <label>Frame Depth</label>
            <input
              type="number"
              placeholder="Depth (px)"
              value={selectedImage.printOptions.frameDepth || '0'}
              onChange={(e) => updatePrintOptions('frameDepth', e.target.value)}
              className="frame-input"
              min="0"
            />
          </div>
        )}
      </div>
    );
  };

  const renderCategoryContent = () => {
    if (!selectedImage) return null;

    switch (activeCategory) {
      case 'frame':
        return (
          <div className="category-panel">
            <h3>Select Frame</h3>
            <div className="category-selector">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.frameCategory}
                  </option>
                ))}
              </select>
            </div>
            <div className="items-grid">
              {frames.length > 0 ? (
                frames.map((frame) => (
                  <div
                    key={frame.id}
                    className={`item-card ${selectedImage?.frame?.id === frame.id ? 'selected' : ''}`}
                    onClick={() => handleSelectFrame(frame)}
                  >
                    <div className="item-image">
                      <img
                        src={getImageUrl(frame.corner_image)}
                        alt={frame.name}
                        onError={handleImageError}
                      />
                    </div>
                    <div className="item-info">
                      <p className="item-price">${frame.price}</p>
                      <p className="item-name">{frame.name}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-items">No frames available</div>
              )}
            </div>
          </div>
        );

      case 'color':
        return (
          <div className="category-panel">
            <h3>Select Color</h3>
            <div className="items-grid">
              {selectedImage?.frame ? (
                <>
                  {selectedImage.frame.color_variants.length > 0 ? (
                    selectedImage.frame.color_variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`item-card ${selectedImage.variants.color?.id === variant.id ? 'selected' : ''}`}
                        onClick={() => handleVariantSelect(variant, 'color')}
                      >
                        <div className="item-image">
                          <img
                            src={getImageUrl(variant.corner_image)}
                            alt={variant.color_name}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="item-info">
                          <p className="item-name">{variant.color_name || 'No name'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-items">No color variants available</div>
                  )}
                  <div className="custom-color-card">
                    <div className="custom-color-content">
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
                        className="custom-color-input"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-items">Please select a frame first</div>
              )}
            </div>
          </div>
        );

      case 'size':
        return (
          <div className="category-panel">
            <h3>Select Size</h3>
            <div className="items-grid">
              {selectedImage?.frame ? (
                <>
                  <div className="custom-size-card">
                    <div className="custom-size-content">
                      <h4>Custom Size</h4>
                      <form className="custom-size-form" onSubmit={handleCustomSizeSubmit}>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Width (inches)"
                          value={customSize.width}
                          onChange={(e) => setCustomSize({ ...customSize, width: e.target.value })}
                          className="custom-size-input"
                        />
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Height (inches)"
                          value={customSize.height}
                          onChange={(e) => setCustomSize({ ...customSize, height: e.target.value })}
                          className="custom-size-input"
                        />
                        <button
                          type="submit"
                          className="custom-size-apply"
                          disabled={!customSize.width || !customSize.height}
                        >
                          Apply Custom Size
                        </button>
                      </form>
                    </div>
                  </div>
                  {selectedImage.frame.size_variants.length > 0 ? (
                    selectedImage.frame.size_variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`item-card ${selectedImage.variants.size?.id === variant.id ? 'selected' : ''}`}
                        onClick={() => handleVariantSelect(variant, 'size')}
                      >
                        <div className="item-image">
                          <img
                            src={getImageUrl(variant.corner_image)}
                            alt={variant.size_name}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="item-info">
                          <p className="item-name">{variant.size_name || 'No name'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-items">No predefined size variants available</div>
                  )}
                </>
              ) : (
                <div className="no-items">Please select a frame first</div>
              )}
            </div>
          </div>
        );

      case 'finish':
        return (
          <div className="category-panel">
            <h3>Select Finish</h3>
            <div className="items-grid">
              {selectedImage?.frame ? (
                selectedImage.frame.finishing_variants.length > 0 ? (
                  selectedImage.frame.finishing_variants.map((variant) => (
                    <div
                      key={variant.id}
                      className={`item-card ${selectedImage.variants.finish?.id === variant.id ? 'selected' : ''}`}
                      onClick={() => handleVariantSelect(variant, 'finish')}
                    >
                      <div className="item-image">
                        <img
                          src={getImageUrl(variant.corner_image)}
                          alt={variant.finish_name}
                          onError={handleImageError}
                        />
                      </div>
                      <div className="item-info">
                        <p className="item-name">{variant.finish_name || 'No name'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-items">No finishing variants available</div>
                )
              ) : (
                <div className="no-items">Please select a frame first</div>
              )}
            </div>
          </div>
        );

      case 'hanging':
        return (
          <div className="category-panel">
            <h3>Select Hanging</h3>
            <div className="items-grid">
              {selectedImage?.frame ? (
                selectedImage.frame.frameHanging_variant?.length > 0 ? (
                  selectedImage.frame.frameHanging_variant.map((variant) => (
                    <div
                      key={variant.id}
                      className={`item-card ${selectedImage.variants.hanging?.id === variant.id ? 'selected' : ''}`}
                      onClick={() => handleVariantSelect(variant, 'hanging')}
                    >
                      <div className="item-image">
                        <img
                          src={getImageUrl(variant.image)}
                          alt={variant.hanging_name}
                          onError={handleImageError}
                        />
                      </div>
                      <div className="item-info">
                        <p className="item-name">{variant.hanging_name || 'No name'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-items">No hanging variants available</div>
                )
              ) : (
                <div className="no-items">Please select a frame first</div>
              )}
            </div>
          </div>
        );

      case 'mackboard':
        return (
          <div className="category-panel">
            <h3>Select MackBoard</h3>
            <div className="items-grid">
              {selectedImage?.frame ? (
                <>
                  <div
                    className={`item-card ${selectedImage.mackBoard === null ? 'selected' : ''}`}
                    onClick={() => setUploadedImages(prev => prev.map(img => img.id === selectedImageId ? { ...img, mackBoard: null } : img))}
                  >
                    <div className="item-image">
                      <img src={FALLBACK_IMAGE} alt="No MackBoard" />
                    </div>
                    <div className="item-info">
                      <p className="item-name">No MackBoard</p>
                    </div>
                  </div>
                  {mackBoards.length > 0 ? (
                    mackBoards.map((mackBoard) => (
                      <div
                        key={mackBoard.id}
                        className={`item-card ${selectedImage.mackBoard?.id === mackBoard.id ? 'selected' : ''}`}
                        onClick={() => setUploadedImages(prev => prev.map(img => img.id === selectedImageId ? { ...img, mackBoard } : img))}
                      >
                        <div className="item-image">
                          <img
                            src={getImageUrl(mackBoard.image)}
                            alt={mackBoard.board_name}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="item-info">
                          <p className="item-name">{mackBoard.board_name}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-items">No MackBoards available</div>
                  )}
                </>
              ) : (
                <div className="no-items">Please select a frame first</div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modern-headers">
      <div className="canvas-section">
        <div className="canvas-container">
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={DEFAULT_CANVAS_WIDTH}
              height={DEFAULT_CANVAS_HEIGHT}
              className="design-canvas"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
            />
          </div>
          {isMagnified && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
              onClick={() => setIsMagnified(false)}
            >
              <img
                src={getImageUrl(selectedImage.cropped_url || selectedImage.original_url)}
                alt="Magnified"
                style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
              />
            </div>
          )}

          {isMagnifierActive && (
            <div
              className="magnifier"
              style={{ position: 'fixed', left: magnifierPosition.x, top: magnifierPosition.y }}
            >
              <canvas ref={magnifierCanvasRef} width={100} height={100} />
            </div>
          )}

          {selectedImage && (
            <div className="canvas-controls">
              <div className="control-group">
                <button className="control-btn" onClick={() => adjustScale(0.1)} title="Zoom In">
                  <ZoomIn size={16} />
                  Zoom In
                </button>
                <button className="control-btn" onClick={() => adjustScale(-0.1)} title="Zoom Out">
                  <ZoomOut size={16} />
                  Zoom Out
                </button>
              </div>

              <div className="control-group">
                <button className="control-btn" onClick={() => adjustImageRotation(90)} title="Rotate Image Right">
                  <RotateCw size={16} />
                  Image
                </button>
                <button className="control-btn" onClick={() => adjustImageRotation(-90)} title="Rotate Image Left">
                  <RotateCounterClockwise size={16} />
                  Image
                </button>
              </div>

              {selectedImage.frame && (
                <div className="control-group">
                  <button className="control-btn" onClick={() => adjustFrameRotation(90)} title="Rotate Frame Right">
                    <RotateClockwise size={16} />
                    Frame
                  </button>
                  <button className="control-btn" onClick={() => adjustFrameRotation(-90)} title="Rotate Frame Left">
                    <RotateCounterClockwise size={16} />
                    Frame
                  </button>
                </div>
              )}

              <div className="control-group">
                <button className="control-btn" onClick={toggleCropMode} title="Crop">
                  <Crop size={16} />
                  Crop
                </button>
                <button className="control-btn" onClick={resetToOriginal} title="Reset Position">
                  <RefreshCw size={16} />
                  Reset
                </button>
                <button className="control-btn" onClick={resetTransform} title="Reset Image">
                  <Rewind size={16} />
                  Original
                </button>
              </div>

              <div className="control-group">
                <button
                  className="control-btn"
                  onClick={() => setIsMagnifierActive(!isMagnifierActive)}
                  title="Toggle Magnifier"
                >
                  <Search size={16} />
                  Magnifier
                </button>
              </div>

              <div className="control-group">
                <button
                  className="control-btn"
                  onClick={() => setMagnificationFactor(prev => Math.min(10, prev + 1))}
                  title="Increase Magnification"
                >
                  <PlusIcon size={16} />
                  Zoom+
                </button>
                <button
                  className="control-btn"
                  onClick={() => setMagnificationFactor(prev => Math.max(1, prev - 1))}
                  title="Decrease Magnification"
                >
                  <Minus size={16} />
                  Zoom-
                </button>
              </div>

              {!isPrintOnly && (
                <div className="control-group">
                  <button className="control-btn remove-frame" onClick={resetVariants}>
                    Remove Frame
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="thumbnails-section">
            <div className="thumbnails-container">
              {uploadedImages.map((img) => (
                <div
                  key={img.id}
                  className={`thumbnail ${img.id === selectedImageId ? 'selected' : ''}`}
                  onClick={() => selectImage(img.id)}
                >
                  <img
                    src={getImageUrl(img.cropped_url || img.original_url)}
                    alt="Thumbnail"
                    onError={handleImageError}
                  />
                </div>
              ))}
              <div className="add-thumbnail" onClick={triggerUpload}>
                <Plus size={20} />
                <span>Add</span>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
            </div>
          </div>
        </div>
      </div>

      <div className="options-section">
        <div className="options-container">
          {renderPrintOptions()}

          {!isPrintOnly && renderCategoryContent()}

          <div className="summary-section">
            <h3>Summary</h3>
            <div className="summary-content">
              <div className="summary-item">
                <span>Size:</span>
                <span>
                  {(selectedImage?.customSize?.width && selectedImage?.customSize?.height)
                    ? `${selectedImage.customSize.width}×${selectedImage.customSize.height} inches (Custom)`
                    : `${selectedImage?.printOptions?.size?.width || 'N/A'}×${selectedImage?.printOptions?.size?.height || 'N/A'} ${selectedImage?.printOptions?.size?.unit || 'inches'}`}
                </span>
              </div>
              <div className="summary-item">
                <span>Media:</span>
                <span>{selectedImage?.printOptions?.mediaType || 'None'}</span>
              </div>
              {selectedImage?.printOptions?.mediaType === 'Photopaper' && (
                <div className="summary-item">
                  <span>Paper Type:</span>
                  <span>{selectedImage?.printOptions?.paperType || 'None'}</span>
                </div>
              )}
              <div className="summary-item">
                <span>Fit:</span>
                <span>{selectedImage?.printOptions?.fit || 'None'}</span>
              </div>
              {!isPrintOnly && (
                <>
                  <div className="summary-item">
                    <span>Frame:</span>
                    <span>{selectedImage?.frame?.name || 'None'}</span>
                  </div>
                  <div className="summary-item">
                    <span>MackBoard:</span>
                    <span>{selectedImage?.mackBoard?.board_name || 'None'}</span>
                  </div>
                  <div className="summary-item">
                    <span>Frame Color:</span>
                    <span>{selectedImage?.customFrameColor ? `Custom (${selectedImage.customFrameColor})` : selectedImage?.variants?.color?.color_name || 'None'}</span>
                  </div>
                  <div className="summary-item">
                    <span>Finish:</span>
                    <span>{selectedImage?.variants?.finish?.finish_name || 'None'}</span>
                  </div>
                  <div className="summary-item">
                    <span>Hanging:</span>
                    <span>{selectedImage?.variants?.hanging?.hanging_name || 'None'}</span>
                  </div>
                </>
              )}
              {(isPrintOnly ? (selectedImage?.printOptions?.size?.width && selectedImage?.printOptions?.size?.height) : selectedImage?.frame) && (
                <div className="summary-item price">
                  <span>Total Price:</span>
                  <span>${calculatePrice(selectedImage).toFixed(2)}</span>
                </div>
              )}
            </div>
            {selectedImage && (selectedImage.frame || isPrintOnly) && (
              <button className="save-button" onClick={handleSave}>
                <Save size={20} />
                {selectedImage.cartItemId ? 'Update Item' : 'Save Item'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Headers;