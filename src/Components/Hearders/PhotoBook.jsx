import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Image as ImageIcon, Sparkles, Sticker as StickerIcon, Upload, ArrowLeft, Type, ChevronLeft, ChevronRight, ChevronDown, AlignLeft, AlignCenter, AlignRight, Bold, Minimize2, Trash2, ZoomIn, ZoomOut, RotateCw, Maximize2, Save, Scissors, X, HelpCircle, BookOpen } from 'lucide-react';
import './PhotoBook.css';
import domtoimage from 'dom-to-image';
import { removeBackground } from '@imgly/background-removal';
import ReactDOM from 'react-dom';

const BASE_URL = 'http://82.180.146.4:8001';
const FALLBACK_IMAGE = 'https://via.placeholder.com/300x200?text=No+Image';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e0e0e0" stroke="%23999" stroke-width="2" stroke-dasharray="5,5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3EDrop Photo Here%3C/text%3E%3C/svg%3E';

const ItemTypes = {
  IMAGE: 'image',
  STICKER: 'sticker',
  ELEMENT: 'element',
  FRAME: 'frame',
};

const getImageUrl = (path) => {
  if (!path) return FALLBACK_IMAGE;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const getAspectRatio = (size) => {
  const ratios = { 'A4': '210/297', '8x10': '8/10' };
  return ratios[size] || '1';
};

// Help Modal Component
function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const guideSections = [
    {
      icon: Sparkles,
      title: 'Theme Selection',
      description: 'Choose a beautiful theme for your photobook. Each theme comes with multiple background options to personalize your spreads.'
    },
    {
      icon: ImageIcon,
      title: 'Paper Size Selection',
      description: 'Select the perfect paper size like A4 or 8x10 for your photobook. Prices vary based on size.'
    },
    {
      icon: Upload,
      title: 'Upload Photos',
      description: 'Upload your images from the Photos tab in the sidebar. Drag them onto pages to place them.'
    },
    {
      icon: StickerIcon,
      title: 'Add Stickers & Decorations',
      description: 'Browse stickers in the sidebar and drag them to decorate your pages. Resize and rotate as needed.'
    },
    {
      icon: Plus,
      title: 'Add Frames',
      description: 'Drag frames from the Frames tab to create photo placeholders in various shapes like circle, square, or hexagon.'
    },
    {
      icon: Type,
      title: 'Add Text',
      description: 'Click "Add Text" in the header to place editable text boxes. Double-click to edit content.'
    },
    {
      icon: Bold,
      title: 'Text Styling',
      description: 'When text is selected, use the global toolbar at the top to change font, size, color, alignment, bold, and background.'
    },
    {
      icon: Maximize2,
      title: 'Resize Elements',
      description: 'Select an element and drag the corner handle to resize proportionally, or side handles for horizontal/vertical.'
    },
    {
      icon: RotateCw,
      title: 'Rotate Elements',
      description: 'Click the rotate icon in the element toolbar to rotate by 15 degrees increments.'
    },
    {
      icon: ZoomIn,
      title: 'Zoom & Pan Images',
      description: 'For images, use zoom in/out in the toolbar. Drag inside the image to pan the view.'
    },
    {
      icon: Scissors,
      title: 'Remove Background',
      description: 'Select an image and click the scissors icon to automatically remove the background.'
    },
    {
      icon: Save,
      title: 'Save Order',
      description: 'Click "Save Order" to generate previews and submit your photobook for printing. Total price is calculated automatically.'
    },
    {
      icon: ChevronLeft,
      title: 'Navigate Pages',
      description: 'Use Previous/Next buttons to flip through spreads. Add new pages automatically when navigating forward.'
    }
  ];

  return (
    <div className="pb-help-modal-overlay" onClick={onClose}>
      <div className="pb-help-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="pb-help-modal-header">
          <h2><BookOpen size={24} className="pb-help-icon" /> Photobook Editor Guide</h2>
          <button onClick={onClose} className="pb-help-close-btn">
            <X size={24} />
          </button>
        </div>
        <div className="pb-help-modal-body">
          <p>Welcome to your Photobook Editor! Follow this guide to create stunning memories.</p>
          <div className="pb-help-sections">
            {guideSections.map((section, index) => (
              <div key={index} className="pb-help-section">
                <section.icon size={32} className="pb-help-section-icon" />
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pb-help-modal-footer">
          <button onClick={onClose} className="pb-help-done-btn">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

// ThemeSelector Component
function ThemeSelector({ themes, onSelect }) {
  const [showHelp, setShowHelp] = useState(false);

  const safeThemes = Array.isArray(themes) ? themes : [];

  return (
    <div className="pb-theme-container">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <div className="pb-theme-header-section">
        <div className="pb-theme-header-actions">
          <button className="pb-help-btn" onClick={() => setShowHelp(true)}>
            <HelpCircle size={20} />
          </button>
        </div>
        <h1>Personalize Your Photobook</h1>
        <p className="pb-theme-subtitle">Create beautiful memories with our photobook printing service</p>
      </div>
      <div className="pb-theme-selection-section">
        <h2>Select Your Photobook Theme</h2>
        {safeThemes.length === 0 ? (
          <div className="pb-theme-empty-state">
            <Sparkles size={48} />
            <p>No themes available</p>
            <p className="pb-theme-hint">Please check your connection or try again later</p>
          </div>
        ) : (
          <div className="pb-theme-grid">
            {safeThemes.map((theme) => (
              <div
                key={theme.id}
                className="pb-theme-card"
                onClick={() => onSelect(theme)}
              >
                <div className="pb-theme-image-wrapper">
                  <img
                    src={theme.backgrounds && theme.backgrounds[0] ? getImageUrl(theme.backgrounds[0].image) : FALLBACK_IMAGE}
                    alt={theme.theme_name || 'Theme'}
                  />
                </div>
                <div className="pb-theme-info">
                  <h3>{theme.theme_name || 'Unnamed Theme'}</h3>
                  <p>{theme.backgrounds ? theme.backgrounds.length : 0} backgrounds available</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// PaperSelector Component
function PaperSelector({ papers, onSelect, onBack }) {
  const [showHelp, setShowHelp] = useState(false);

  const safePapers = Array.isArray(papers) ? papers : [];

  return (
    <div className="pb-paper-container">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <div className="pb-paper-header-section">
        <div className="pb-paper-header-actions">
          <button className="pb-help-btn" onClick={() => setShowHelp(true)}>
            <HelpCircle size={20} />
          </button>
        </div>
        <h1>Choose Your Photobook Size</h1>
        <p className="pb-paper-subtitle">Select the perfect size for your memories</p>
      </div>
      <button className="pb-paper-back-button" onClick={onBack}>
        <ArrowLeft size={20} />
        Back to Themes
      </button>
      <div className="pb-paper-selection-section">
        {safePapers.length === 0 ? (
          <div className="pb-paper-empty-state">
            <p>No paper sizes available</p>
            <p className="pb-sidebar-hint">Please check your connection or try again later</p>
          </div>
        ) : (
          <div className="pb-paper-grid">
            {safePapers.map((paper) => (
              <div
                key={paper.id}
                className="pb-paper-card"
                onClick={() => onSelect(paper)}
              >
                <div className="pb-paper-image-wrapper">
                  <img src={getImageUrl(paper.image)} alt={paper.size || 'Paper'} />
                </div>
                <div className="pb-paper-info">
                  <h3>{paper.size || 'Unknown Size'}</h3>
                  <p className="pb-paper-price">${Number(paper.price || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// DraggableItem Component
function DraggableItem({ src, type, shape }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type === 'image' ? ItemTypes.IMAGE : type === 'sticker' ? ItemTypes.STICKER : ItemTypes.FRAME,
    item: { src, type, shape },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [src, type, shape]);

  const getFrameStyle = () => {
    const baseStyle = {
      width: '100px',
      height: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#e0e0e0',
      border: '2px dashed #999',
    };

    switch (shape) {
      case 'circle':
        return { ...baseStyle, borderRadius: '50%' };
      case 'oval':
        return { ...baseStyle, borderRadius: '50% / 30%' };
      case 'square':
        return { ...baseStyle };
      case 'hexagon':
        return {
          ...baseStyle,
          clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
        };
      case 'rectangle':
      default:
        return { ...baseStyle, width: '120px', height: '80px' };
    }
  };

  return (
    <div
      ref={drag}
      className="pb-draggable-item"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      aria-label={type === 'frame' ? `Drag to add a ${shape} photo frame` : ''}
    >
      {type === 'frame' ? (
        <div style={getFrameStyle()}>
          <span style={{ fontSize: '12px', color: '#999' }}>{shape.charAt(0).toUpperCase() + shape.slice(1)}</span>
        </div>
      ) : (
        <img src={src} alt="" draggable={false} />
      )}
    </div>
  );
}

// DraggableElement Component
function DraggableElement({ element, pageId, onUpdate, onDelete, pageRef, onTextSelect, onTextDeselect }) {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null);
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [imageOffsetX, setImageOffsetX] = useState(element.imageOffsetX || 0);
  const [imageOffsetY, setImageOffsetY] = useState(element.imageOffsetY || 0);
  const [imageScale, setImageScale] = useState(element.imageScale || 1);
  const elementRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  // Text styling state
  const [fontFamily, setFontFamily] = useState(element.fontFamily ?? 'Arial');
  const [fontSize, setFontSize] = useState(element.fontSize ?? 16);
  const [fontColor, setFontColor] = useState(element.fontColor ?? '#000000');
  const [backgroundColor, setBackgroundColor] = useState(element.backgroundColor ?? null);
  const [textAlign, setTextAlign] = useState(element.textAlign ?? 'left');
  const [isBold, setIsBold] = useState(element.isBold ?? false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        elementRef.current &&
        !elementRef.current.contains(e.target) &&
        !e.target.closest('.pb-element-toolbar') &&
        !e.target.closest('.pb-global-text-toolbar')
      ) {
        setIsSelected(false);
        setIsEditing(false);
        if (element.type === 'text') {
          onTextDeselect();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [element.type, onTextDeselect]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    setIsSelected(true);
    if (element.type === 'text') {
      onTextSelect(pageId, element);
    }
    if (element.type === 'text' && e.detail === 2) {
      setIsEditing(true);
      return;
    }
    setIsDraggingElement(true);
    const pageRect = pageRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - element.x - pageRect.left,
      y: e.clientY - element.y - pageRect.top,
    });
  };

  const handleImageMouseDown = (e) => {
    if (e.button !== 0 || element.type !== 'image') return;
    e.stopPropagation();
    e.preventDefault();
    setIsSelected(true);
    setIsDraggingImage(true);
    setImageDragStart({
      x: e.clientX - imageOffsetX,
      y: e.clientY - imageOffsetY,
    });
  };

  const handleMouseMove = (e) => {
    if (isDraggingElement && pageRef.current) {
      const pageRect = pageRef.current.getBoundingClientRect();
      const newX = e.clientX - pageRect.left - dragStart.x;
      const newY = e.clientY - pageRect.top - dragStart.y;
      const constrainedX = Math.max(0, Math.min(newX, pageRect.width - element.width));
      const constrainedY = Math.max(0, Math.min(newY, pageRect.height - element.height));
      onUpdate(pageId, element.id, { x: constrainedX, y: constrainedY });
    } else if (isDraggingImage && imageRef.current) {
      const newOffsetX = e.clientX - imageDragStart.x;
      const newOffsetY = e.clientY - imageDragStart.y;
      setImageOffsetX(newOffsetX);
      setImageOffsetY(newOffsetY);
      onUpdate(pageId, element.id, { imageOffsetX: newOffsetX, imageOffsetY: newOffsetY });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingElement(false);
    setIsDraggingImage(false);
  };

  useEffect(() => {
    if (isDraggingElement || isDraggingImage) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingElement, isDraggingImage, dragStart, imageDragStart]);

  const handleResizeStart = (e, type) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeType(type);
    setResizeStart({
      width: element.width,
      height: element.height,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    let updates = {};
    if (resizeType === 'horizontal') {
      const newWidth = Math.max(50, resizeStart.width + deltaX);
      updates = { width: newWidth };
    } else if (resizeType === 'vertical') {
      const newHeight = Math.max(50, resizeStart.height + deltaY);
      updates = { height: newHeight };
    } else if (resizeType === 'proportional') {
      const delta = Math.max(deltaX, deltaY);
      const newWidth = Math.max(50, resizeStart.width + delta);
      const newHeight = Math.max(50, resizeStart.height + delta);
      updates = { width: newWidth, height: newHeight };
    }
    onUpdate(pageId, element.id, updates);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeType(null);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStart, resizeType]);

  const handleImageZoomIn = (e) => {
    e.stopPropagation();
    const newScale = imageScale * 1.1;
    setImageScale(newScale);
    onUpdate(pageId, element.id, { imageScale: newScale });
  };

  const handleImageZoomOut = (e) => {
    e.stopPropagation();
    const newScale = Math.max(0.5, imageScale * 0.9);
    setImageScale(newScale);
    onUpdate(pageId, element.id, { imageScale: newScale });
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    onUpdate(pageId, element.id, {
      width: element.width * 1.1,
      height: element.height * 1.1,
    });
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    onUpdate(pageId, element.id, {
      width: Math.max(50, element.width * 0.9),
      height: Math.max(50, element.height * 0.9),
    });
  };

  const handleRotate = (e) => {
    e.stopPropagation();
    onUpdate(pageId, element.id, {
      rotation: (element.rotation + 15) % 360,
    });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(pageId, element.id);
    if (element.type === 'text') {
      onTextDeselect();
    }
  };



  const handleTextChange = (e) => {
    onUpdate(pageId, element.id, { content: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const token = localStorage.getItem('token');
    const config = token ? { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } } : {};
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await axios.post(`${BASE_URL}/upload-images/`, formData, config);
      const imageUrl = getImageUrl(response.data.image);
      onUpdate(pageId, element.id, { content: imageUrl, type: 'image', imageOffsetX: 0, imageOffsetY: 0, imageScale: 1 });
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleRemoveBackground = async (e) => {
    e.stopPropagation();
    if (element.type !== 'image') return;
    setIsRemovingBackground(true);
    try {
      const response = await fetch(element.content);
      const blob = await response.blob();
      const resultBlob = await removeBackground(blob, {
        output: { format: 'image/png' },
      });
      const file = new File([resultBlob], `nobg_${Date.now()}.png`, { type: 'image/png' });
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } } : {};
      const formData = new FormData();
      formData.append('image', file);
      const uploadResponse = await axios.post(`${BASE_URL}/upload-images/`, formData, config);
      const newImageUrl = getImageUrl(uploadResponse.data.image);
      onUpdate(pageId, element.id, { content: newImageUrl });
    } catch (err) {
      console.error('Background removal failed:', err);
      alert('Failed to remove background. Please try again or use a different image.');
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleUploadClick = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };

  useEffect(() => {
    setFontFamily(element.fontFamily ?? 'Arial');
    setFontSize(element.fontSize ?? 16);
    setFontColor(element.fontColor ?? '#000000');
    setBackgroundColor(element.backgroundColor ?? null);
    setTextAlign(element.textAlign ?? 'left');
    setIsBold(element.isBold ?? false);
    setImageOffsetX(element.imageOffsetX ?? 0);
    setImageOffsetY(element.imageOffsetY ?? 0);
    setImageScale(element.imageScale ?? 1);
  }, [element]);

  // Text styling handlers
  const handleFontFamilyChange = (e) => {
    const newFont = e.target.value;
    setFontFamily(newFont);
    onUpdate(pageId, element.id, { fontFamily: newFont });
  };

  const handleFontSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setFontSize(newSize);
    onUpdate(pageId, element.id, { fontSize: newSize });
  };

  const handleFontColorChange = (e) => {
    const newColor = e.target.value;
    setFontColor(newColor);
    onUpdate(pageId, element.id, { fontColor: newColor });
  };

  const handleBackgroundColorChange = (e) => {
    const newColor = e.target.value;
    setBackgroundColor(newColor);
    onUpdate(pageId, element.id, { backgroundColor: newColor });
  };

  const handleTextAlignChange = (align) => {
    setTextAlign(align);
    onUpdate(pageId, element.id, { textAlign: align });
  };

  const handleBoldToggle = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    onUpdate(pageId, element.id, { isBold: newBold });
  };

  const getFrameShapeStyle = () => {
    switch (element.shape) {
      case 'circle':
        return { borderRadius: '50%', clipPath: 'circle(50% at 50% 50%)' };
      case 'oval':
        return { borderRadius: '50% / 30%', clipPath: 'ellipse(50% 30% at 50% 50%)' };
      case 'square':
        return { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' };
      case 'hexagon':
        return { clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' };
      case 'rectangle':
      default:
        return { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' };
    }
  };

  const renderContent = () => {
    if (element.type === 'text') {
      const textStyle = {
        padding: '8px',
        fontFamily,
        fontSize: `${fontSize}px`,
        color: fontColor,
        textAlign,
        fontWeight: isBold ? 'bold' : 'normal',
        background: backgroundColor || 'transparent',
        border: element.content ? 'none' : '1px dashed #ccc',
      };
      if (isEditing) {
        return (
          <textarea
            ref={textareaRef}
            value={element.content}
            onChange={(e) => onUpdate(pageId, element.id, { content: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onClick={(e) => e.stopPropagation()}
            className="pb-element-text-editor"
            style={{
              ...textStyle,
              width: '100%',
              height: '100%',
              border: '1px solid #ccc',
              background: backgroundColor || 'transparent',
              resize: 'none',
              outline: 'none',
            }}
          />
        );
      }
      return (
        <div
          className="pb-element-text-content"
          style={textStyle}
        >
          {element.content || 'Double click to edit'}
        </div>
      );
    }
    if (element.type === 'placeholder' || element.type === 'image') {
      const shapeStyle = getFrameShapeStyle();
      return (
        <div className="pb-element-placeholder-frame" style={{ ...shapeStyle, overflow: 'hidden' }}>
          <div
            ref={imageRef}
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              transform: `translate(${imageOffsetX}px, ${imageOffsetY}px) scale(${imageScale})`,
              cursor: element.type === 'image' ? 'move' : 'default',
            }}
            onMouseDown={handleImageMouseDown}
          >
            <img
              src={element.content || PLACEHOLDER_IMAGE}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                clipPath: 'inherit',
                borderRadius: 'inherit',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
          </div>
          {!element.content && (
            <div className="pb-element-upload-overlay">
              <button className="pb-element-upload-icon-btn" onClick={handleUploadClick}>
                <Upload size={24} />
                <span>Upload Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}
          {isRemovingBackground && (
            <div className="pb-element-loading-overlay">
              <div className="pb-global-spinner"></div>
              <span>Removing Background...</span>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="pb-element-image-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img
          src={element.content}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          draggable={false}
        />
        {isRemovingBackground && (
          <div className="pb-element-loading-overlay">
            <div className="pb-global-spinner"></div>
            <span>Removing Background...</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={elementRef}
      className={`pb-element-wrapper ${isSelected ? 'pb-element-selected' : ''} ${element.type === 'text' ? 'pb-element-text' : ''}`}
      style={{
        position: 'absolute',
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: element.zIndex,
        cursor: isDraggingElement ? 'grabbing' : isEditing ? 'text' : 'grab',
        userSelect: 'none',
        transformOrigin: 'center center',
      }}
      onMouseDown={isEditing ? null : handleMouseDown}
    >
      {renderContent()}
      {isSelected && !isEditing && (
        <>
          <div className="pb-element-border"></div>
          {/* Resize handles */}
          <div className="pb-element-resize-handle pb-element-resize-vertical" onMouseDown={(e) => handleResizeStart(e, 'vertical')} title="Resize vertical">
            <Maximize2 size={12} />
          </div>
          <div className="pb-element-resize-handle pb-element-resize-horizontal" onMouseDown={(e) => handleResizeStart(e, 'horizontal')} title="Resize horizontal">
            <Maximize2 size={12} />
          </div>
          <div className="pb-element-resize-handle pb-element-resize-proportional" onMouseDown={(e) => handleResizeStart(e, 'proportional')} title="Resize Proportionally">
            <Maximize2 size={12} />
          </div>

          {/* MODERN CANVA-STYLE TOOLBAR - Common tools only for text, full for others */}
          <div className="pb-element-toolbar-modern" onClick={(e) => e.stopPropagation()}>
            {/* Common Tools */}
            <button className="pb-toolbar-btn" onClick={handleZoomIn}><Maximize2 size={12} /></button>
            <button className="pb-toolbar-btn" onClick={handleZoomOut}><Minimize2 size={12} /></button>
            <button className="pb-toolbar-btn" onClick={handleRotate}><RotateCw size={12} /></button>

            {element.type === 'image' && (
              <>
                <button className="pb-toolbar-btn" onClick={handleRemoveBackground}><Scissors size={12} /></button>
                <button className="pb-toolbar-btn" onClick={handleImageZoomIn}><ZoomIn size={12} /></button>
                <button className="pb-toolbar-btn" onClick={handleImageZoomOut}><ZoomOut size={12} /></button>
              </>
            )}

            <button className="pb-toolbar-btn delete" onClick={handleDelete}><Trash2 size={12} /></button>
          </div>
        </>
      )}
    </div>
  );
}

// PageCanvas Component
function PageCanvas({ page, position, paperSize, onAddElement, onUpdateElement, onDeleteElement, pageRefs, onTextSelect, onTextDeselect }) {
  const pageRef = useRef(null);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: [ItemTypes.IMAGE, ItemTypes.STICKER, ItemTypes.FRAME],
      drop: (item, monitor) => {
        const offset = monitor.getSourceClientOffset();
        if (!offset || !pageRef.current) return;
        const pageRect = pageRef.current.getBoundingClientRect();
        const x = offset.x - pageRect.left;
        const y = offset.y - pageRect.top;

        const placeholder = page.elements.find((el) => {
          if (el.type !== 'placeholder' && el.type !== 'image') return false;
          const elX = el.x;
          const elY = el.y;
          const elWidth = el.width;
          const elHeight = el.height;
          return x >= elX && x <= elX + elWidth && y >= elY && y <= elY + elHeight;
        });

        if (item.type === ItemTypes.IMAGE && placeholder) {
          onUpdateElement(page.id, placeholder.id, {
            type: 'image',
            content: item.src,
            imageOffsetX: 0,
            imageOffsetY: 0,
            imageScale: 1,
          });
        } else {
          const elementWidth = item.type === 'sticker' ? 150 : item.type === 'frame' ? 200 : 200;
          const elementHeight = item.type === 'sticker' ? 150 : item.type === 'frame' ? 200 : 200;
          const newElement = {
            type: item.type === 'frame' ? 'placeholder' : item.type,
            content: item.type === 'frame' ? '' : item.src,
            x: Math.max(0, Math.min(x - elementWidth / 2, pageRect.width - elementWidth)),
            y: Math.max(0, Math.min(y - elementHeight / 2, pageRect.height - elementHeight)),
            width: elementWidth,
            height: elementHeight,
            rotation: 0,
            zIndex: Math.max(0, ...page.elements.map((el) => el.zIndex || 0)) + 1,
            shape: item.type === 'frame' ? item.shape : undefined,
            fontFamily: item.type === 'text' ? 'Arial' : undefined,
            fontSize: item.type === 'text' ? 16 : undefined,
            fontColor: item.type === 'text' ? '#000000' : undefined,
            backgroundColor: item.type === 'text' ? null : undefined,
            textAlign: item.type === 'text' ? 'left' : undefined,
            isBold: item.type === 'text' ? false : undefined,
          };
          onAddElement(page.id, newElement);
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [page.id, page.elements]
  );

  useEffect(() => {
    pageRefs.current[page.id] = pageRef.current;
    return () => {
      delete pageRefs.current[page.id];
    };
  }, [page.id]);

  drop(pageRef);

  return (
    <div
      ref={pageRef}
      className={`pb-page pb-page-${position} ${isOver ? 'pb-page-drag-over' : ''}`}
      style={{
        aspectRatio: getAspectRatio(paperSize),
        background: 'transparent',
      }}
    >
      <div className="pb-page-content">
        {page.elements.map((element) => (
          <DraggableElement
            key={element.id}
            element={element}
            pageId={page.id}
            onUpdate={onUpdateElement}
            onDelete={onDeleteElement}
            pageRef={pageRef}
            onTextSelect={onTextSelect}
            onTextDeselect={onTextDeselect}
          />
        ))}
      </div>
    </div>
  );
}

// BookSpread Component
function BookSpread({ leftPage, rightPage, background, paperSize, onAddElement, onUpdateElement, onDeleteElement, pageRefs, onTextSelect, onTextDeselect }) {
  return (
    <div
      className="pb-spread"
      style={{
        backgroundImage: background ? `url(${background})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="pb-spread-spine"></div>
      {leftPage && (
        <PageCanvas
          page={leftPage}
          position="left"
          paperSize={paperSize}
          onAddElement={onAddElement}
          onUpdateElement={onUpdateElement}
          onDeleteElement={onDeleteElement}
          pageRefs={pageRefs}
          onTextSelect={onTextSelect}
          onTextDeselect={onTextDeselect}
        />
      )}
      {rightPage && (
        <PageCanvas
          page={rightPage}
          position="right"
          paperSize={paperSize}
          onAddElement={onAddElement}
          onUpdateElement={onUpdateElement}
          onDeleteElement={onDeleteElement}
          pageRefs={pageRefs}
          onTextSelect={onTextSelect}
          onTextDeselect={onTextDeselect}
        />
      )}
    </div>
  );
}

// Sidebar Component
function Sidebar({ uploadedImages, themeBackgrounds, stickers, onImageUpload, onBackgroundSelect }) {
  const [activeTab, setActiveTab] = useState('photos');
  const frameShapes = [
    { id: 'rectangle', name: 'Rectangle', shape: 'rectangle' },
    { id: 'square', name: 'Square', shape: 'square' },
    { id: 'circle', name: 'Circle', shape: 'circle' },
    { id: 'oval', name: 'Oval', shape: 'oval' },
    { id: 'hexagon', name: 'Hexagon', shape: 'hexagon' },
  ];

  return (
    <div className="pb-sidebar">
      <div className="pb-sidebar-tab-buttons col-lg-12">
        <div className='col-lg-6'>
          <button
            className={`pb-sidebar-tab-btn ${activeTab === 'photos' ? 'pb-sidebar-tab-active' : ''}`}
            onClick={() => setActiveTab('photos')}
            aria-label="Photos tab"
          >
            <ImageIcon size={18} />
            Photos
          </button>
          <button
            className={`pb-sidebar-tab-btn ${activeTab === 'themes' ? 'pb-sidebar-tab-active' : ''}`}
            onClick={() => setActiveTab('themes')}
            aria-label="Themes tab"
          >
            <Sparkles size={18} />
            Themes
          </button>
        </div>
        <div className='col-lg-6'>
          <button
            className={`pb-sidebar-tab-btn ${activeTab === 'stickers' ? 'pb-sidebar-tab-active' : ''}`}
            onClick={() => setActiveTab('stickers')}
            aria-label="Stickers tab"
          >
            <StickerIcon size={18} />
            Stickers
          </button>
          <button
            className={`pb-sidebar-tab-btn ${activeTab === 'frames' ? 'pb-sidebar-tab-active' : ''}`}
            onClick={() => setActiveTab('frames')}
            aria-label="Frames tab"
          >
            <Plus size={18} />
            Frames
          </button>
        </div>
      </div>
      <div className="pb-sidebar-tab-content">
        {activeTab === 'photos' && (
          <div className="pb-sidebar-tab-panel">
            <div className="pb-sidebar-upload-section">
              <label htmlFor="file-upload" className="pb-sidebar-upload-btn">
                <Upload size={18} />
                Upload Photos
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={onImageUpload}
                style={{ display: 'none' }}
              />
            </div>
            {uploadedImages.length > 0 ? (
              <div className="pb-sidebar-item-grid">
                {uploadedImages.map((img, index) => (
                  <DraggableItem key={index} src={img.url} type="image" />
                ))}
              </div>
            ) : (
              <div className="pb-sidebar-empty-state">
                <ImageIcon size={48} />
                <p>No photos uploaded yet</p>
                <p className="pb-sidebar-hint">Upload photos to get started</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'themes' && (
          <div className="pb-sidebar-tab-panel">
            <h3 className="pb-sidebar-panel-title">Theme Backgrounds</h3>
            {themeBackgrounds.length > 0 ? (
              <div className="pb-sidebar-item-grid">
                {themeBackgrounds.map((bg, index) => (
                  <div
                    key={index}
                    className="pb-sidebar-theme-bg-item"
                    onClick={() => onBackgroundSelect(bg)}
                  >
                    <img src={bg.url} alt={`Background ${index + 1}`} />
                    <div className="pb-sidebar-overlay">
                      <span>Apply</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pb-sidebar-empty-state">
                <Sparkles size={48} />
                <p>No backgrounds available</p>
                <p className="pb-sidebar-hint">Select a theme with backgrounds</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'stickers' && (
          <div className="pb-sidebar-tab-panel">
            <h3 className="pb-sidebar-panel-title">Stickers & Decorations</h3>
            {stickers.length > 0 ? (
              <div className="pb-sidebar-item-grid">
                {stickers.map((sticker, index) => (
                  <DraggableItem key={index} src={sticker.url} type="sticker" />
                ))}
              </div>
            ) : (
              <div className="pb-sidebar-empty-state">
                <StickerIcon size={48} />
                <p>No stickers available</p>
                <p className="pb-sidebar-hint">Add stickers to decorate your photobook</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'frames' && (
          <div className="pb-sidebar-tab-panel">
            <h3 className="pb-sidebar-panel-title">Frames</h3>
            <div className="pb-sidebar-item-grid">
              {frameShapes.map((frame) => (
                <DraggableItem
                  key={frame.id}
                  src={PLACEHOLDER_IMAGE}
                  type="frame"
                  shape={frame.shape}
                />
              ))}
            </div>
            <p className="pb-sidebar-hint">Drag a frame to any page to add a photo placeholder.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GlobalTextToolbar({ element, pageId, onUpdate, onClose }) {
  const [fontFamily, setFontFamily] = useState(element.fontFamily || 'Arial');
  const [fontSize, setFontSize] = useState(element.fontSize || 16);
  const [fontColor, setFontColor] = useState(element.fontColor || '#000000');
  const [backgroundColor, setBackgroundColor] = useState(element.backgroundColor || null);
  const [textAlign, setTextAlign] = useState(element.textAlign || 'left');
  const [isBold, setIsBold] = useState(element.isBold || false);

  const fonts = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Dancing Script', 'Pacifico', 'Lobster', 'Roboto'];
  const sizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

  useEffect(() => {
    setFontFamily(element.fontFamily || 'Arial');
    setFontSize(element.fontSize || 16);
    setFontColor(element.fontColor || '#000000');
    setBackgroundColor(element.backgroundColor || null);
    setTextAlign(element.textAlign || 'left');
    setIsBold(element.isBold || false);
  }, [element]);

  const handleUpdate = (updates) => {
    onUpdate(pageId, element.id, updates);
  };

  const handleFontFamilyChange = (e) => {
    const newFont = e.target.value;
    setFontFamily(newFont);
    handleUpdate({ fontFamily: newFont });
  };

  const handleFontSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setFontSize(newSize);
    handleUpdate({ fontSize: newSize });
  };

  const handleFontColorChange = (e) => {
    const newColor = e.target.value;
    setFontColor(newColor);
    handleUpdate({ fontColor: newColor });
  };

  const handleBackgroundColorChange = (e) => {
    const newColor = e.target.value;
    setBackgroundColor(newColor);
    handleUpdate({ backgroundColor: newColor });
  };

  const handleTextAlignChange = (align) => {
    setTextAlign(align);
    handleUpdate({ textAlign: align });
  };

  const handleBoldToggle = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    handleUpdate({ isBold: newBold });
  };

  return (
    <div className="pb-global-text-toolbar" onClick={(e) => e.stopPropagation()}>
      <div className="pb-toolbar-group">
        <select
          value={fontFamily}
          onChange={handleFontFamilyChange}
          className="pb-toolbar-select"
        >
          {fonts.map(f => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>

        <select
          value={fontSize}
          onChange={handleFontSizeChange}
          className="pb-toolbar-select"
        >
          {sizes.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="pb-toolbar-group">
        <input
          type="color"
          value={fontColor}
          onChange={handleFontColorChange}
          className="pb-toolbar-color"
          title="Text Color"
        />
        <input
          type="color"
          value={backgroundColor || '#ffffff'}
          onChange={handleBackgroundColorChange}
          className="pb-toolbar-color"
          title="Background Color"
        />
      </div>

      <div className="pb-toolbar-group">
        <button
          className={`pb-toolbar-btn ${textAlign === 'left' ? 'active' : ''}`}
          onClick={() => handleTextAlignChange('left')}
        >
          <AlignLeft size={16} />
        </button>
        <button
          className={`pb-toolbar-btn ${textAlign === 'center' ? 'active' : ''}`}
          onClick={() => handleTextAlignChange('center')}
        >
          <AlignCenter size={16} />
        </button>
        <button
          className={`pb-toolbar-btn ${textAlign === 'right' ? 'active' : ''}`}
          onClick={() => handleTextAlignChange('right')}
        >
          <AlignRight size={16} />
        </button>
        <button
          className={`pb-toolbar-btn ${isBold ? 'active' : ''}`}
          onClick={handleBoldToggle}
        >
          <Bold size={16} />
        </button>
      </div>

      <button className="pb-toolbar-close-btn" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

// PhotoBookEditor Component
function PhotoBookEditor({ theme, paper, stickers, onBack }) {
  const [selectedTextElement, setSelectedTextElement] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [pages, setPages] = useState([
    {
      id: 1,
      elements: [
        {
          id: `${Date.now()}-default-left`,
          type: 'placeholder',
          content: '',
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          rotation: 0,
          zIndex: 1,
          shape: 'rectangle',
        },
      ],
    },
    {
      id: 2,
      elements: [
        {
          id: `${Date.now()}-default-right`,
          type: 'placeholder',
          content: '',
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          rotation: 0,
          zIndex: 1,
          shape: 'rectangle',
        },
      ],
    },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedBackground, setSelectedBackground] = useState(
    theme.backgrounds && Array.isArray(theme.backgrounds) && theme.backgrounds[0]
      ? { id: theme.backgrounds[0].id, url: getImageUrl(theme.backgrounds[0].image) }
      : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const user = useSelector((state) => state.user);
  const pageRefs = useRef({});
  const spreadRef = useRef(null);
  const [previewDebugUrls, setPreviewDebugUrls] = useState([]);

  const calculateTotalPrice = () => {
    const basePrice = parseFloat(paper.price || 0);
    const pagePrice = 2.00;
    const stickerPrice = 0.50;
    const totalPages = pages.filter((page) =>
      page.elements.some((el) => el.type !== 'placeholder' || el.content)
    ).length;
    const totalStickers = pages.reduce(
      (count, page) => count + page.elements.filter((el) => el.type === 'sticker').length,
      0
    );
    return (basePrice + totalPages * pagePrice + totalStickers * stickerPrice).toFixed(2);
  };

  const generateSpreadPreview = async (leftPage, rightPage, spreadIndex) => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.height = '600px';
      document.body.appendChild(tempDiv);

      ReactDOM.render(
        <BookSpread
          leftPage={leftPage}
          rightPage={rightPage}
          background={selectedBackground ? selectedBackground.url : ''}
          paperSize={paper.size}
          onAddElement={() => { }}
          onUpdateElement={() => { }}
          onDeleteElement={() => { }}
          pageRefs={pageRefs}
        />,
        tempDiv
      );

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 500);
        });
      });

      const images = tempDiv.getElementsByTagName('img');
      const imagePromises = Array.from(images).map((img) => {
        return new Promise((resolve, reject) => {
          if (img.complete && img.naturalWidth !== 0) {
            console.log(`Image loaded: ${img.src}`);
            resolve();
          } else {
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
              console.log(`Image loaded: ${img.src}`);
              resolve();
            };
            img.onerror = () => {
              console.error(`Failed to load image: ${img.src}`);
              reject(new Error(`Failed to load image: ${img.src}`));
            };
            img.src = img.src;
          }
        });
      });

      console.log(`Preloading ${imagePromises.length} images for spread ${spreadIndex + 1}`);
      await Promise.all(imagePromises).catch((err) => {
        console.error('Image preload failed:', err);
      });

      const dataUrl = await domtoimage.toPng(tempDiv, {
        quality: 1.0,
        width: 800,
        height: 600,
        cacheBust: true,
      });
      console.log(`Generated preview for spread ${spreadIndex + 1} (pages ${leftPage?.id || 'none'}, ${rightPage?.id || 'none'}): ${dataUrl.substring(0, 50)}...`);

      ReactDOM.unmountComponentAtNode(tempDiv);
      document.body.removeChild(tempDiv);

      setPreviewDebugUrls((prev) => [
        ...prev,
        { spreadIndex, pageIds: [leftPage?.id, rightPage?.id].filter(Boolean), dataUrl },
      ]);

      return {
        spreadIndex,
        pageIds: [leftPage?.id, rightPage?.id].filter(Boolean),
        dataUrl,
      };
    } catch (err) {
      console.error(`Failed to generate spread preview for spread ${spreadIndex + 1}:`, err);
      return null;
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const token = localStorage.getItem('token');
    const config = token ? { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } } : {};

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await axios.post(`${BASE_URL}/upload-images/`, formData, config);
        return { id: response.data.id, url: getImageUrl(response.data.image) };
      });
      const uploaded = await Promise.all(uploadPromises);
      setUploadedImages([...uploadedImages, ...uploaded]);
    } catch (err) {
      console.error('Image upload failed:', err);
      setSaveError('Failed to upload images. Please try again.');
    }
  };

  const addElementToPage = (pageId, element) => {
    setPages((prevPages) =>
      prevPages.map((page) => {
        if (page.id === pageId) {
          const maxZIndex = Math.max(0, ...page.elements.map((el) => el.zIndex || 0));
          return {
            ...page,
            elements: [
              ...page.elements,
              {
                ...element,
                id: `${Date.now()}-${Math.random()}`,
                zIndex: maxZIndex + 1,
                fontFamily: element.type === 'text' ? 'Arial' : undefined,
                fontSize: element.type === 'text' ? 16 : undefined,
                fontColor: element.type === 'text' ? '#000000' : undefined,
                backgroundColor: element.type === 'text' ? null : undefined,
                textAlign: element.type === 'text' ? 'left' : undefined,
                isBold: element.type === 'text' ? false : undefined,
              },
            ],
          };
        }
        return page;
      })
    );
  };

  const updateElement = (pageId, elementId, updates) => {
    setPages((prevPages) =>
      prevPages.map((page) => {
        if (page.id === pageId) {
          return {
            ...page,
            elements: page.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)),
          };
        }
        return page;
      })
    );
  };

  const deleteElement = (pageId, elementId) => {
    setPages((prevPages) =>
      prevPages.map((page) => {
        if (page.id === pageId) {
          return {
            ...page,
            elements: page.elements.filter((el) => el.id !== elementId),
          };
        }
        return page;
      })
    );
  };

  const handleTextSelect = (pageId, element) => {
    setSelectedTextElement({ pageId, element });
  };

  const handleTextDeselect = () => {
    setSelectedTextElement(null);
  };

  const addTextElement = () => {
    const currentPage = pages[currentPageIndex];
    if (currentPage) {
      addElementToPage(currentPage.id, {
        type: 'text',
        content: 'Double click to edit',
        x: 150,
        y: 150,
        width: 200,
        height: 60,
        rotation: 0,
        fontFamily: 'Arial',
        fontSize: 16,
        fontColor: '#000000',
        backgroundColor: null,
        textAlign: 'left',
        isBold: false,
      });
    }
  };

  const addNewPages = () => {
    const lastPageId = pages[pages.length - 1].id;
    setPages([
      ...pages,
      {
        id: lastPageId + 1,
        elements: [
          {
            id: `${Date.now()}-default-${lastPageId + 1}`,
            type: 'placeholder',
            content: '',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            rotation: 0,
            zIndex: 1,
            shape: 'rectangle',
          },
        ],
      },
      {
        id: lastPageId + 2,
        elements: [
          {
            id: `${Date.now()}-default-${lastPageId + 2}`,
            type: 'placeholder',
            content: '',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            rotation: 0,
            zIndex: 1,
            shape: 'rectangle',
          },
        ],
      },
    ]);
  };

  const goToPreviousSpread = () => {
    if (currentPageIndex >= 2) {
      setCurrentPageIndex(currentPageIndex - 2);
    }
  };

  const goToNextSpread = () => {
    if (currentPageIndex + 2 < pages.length) {
      setCurrentPageIndex(currentPageIndex + 2);
    } else {
      addNewPages();
      setCurrentPageIndex(currentPageIndex + 2);
    }
  };

  const handleSaveOrder = async () => {
    if (!user) {
      setSaveError('You must be logged in to save an order.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setPreviewDebugUrls([]);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const validPages = pages.filter((page) =>
        page.elements.some((el) => el.type !== 'placeholder' || (el.type === 'placeholder' && el.content))
      );

      if (validPages.length === 0) {
        setSaveError('No customized pages to save. Add images, text, or stickers to at least one page.');
        setIsSaving(false);
        return;
      }

      const originalPageIndex = currentPageIndex;
      const spreadPreviews = [];
      for (let index = 0; index < Math.ceil(validPages.length / 2); index++) {
        const newPageIndex = index * 2;
        setCurrentPageIndex(newPageIndex);

        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 500);
          });
        });

        const leftPage = validPages[newPageIndex];
        const rightPage = validPages[newPageIndex + 1];
        console.log(`Generating preview for spread ${index + 1} (pages ${leftPage?.id || 'none'}, ${rightPage?.id || 'none'})`);

        if (!spreadRef.current) {
          console.warn(`Spread ref not available for spread ${index + 1}`);
          continue;
        }

        const images = spreadRef.current.getElementsByTagName('img');
        const imagePromises = Array.from(images).map((img) => {
          return new Promise((resolve, reject) => {
            if (img.complete && img.naturalWidth !== 0) {
              console.log(`Image loaded: ${img.src}`);
              resolve();
            } else {
              img.crossOrigin = 'Anonymous';
              img.onload = () => {
                console.log(`Image loaded: ${img.src}`);
                resolve();
              };
              img.onerror = () => {
                console.error(`Failed to load image: ${img.src}`);
                reject(new Error(`Failed to load image: ${img.src}`));
              };
              img.src = img.src;
            }
          });
        });

        console.log(`Preloading ${imagePromises.length} images for spread ${index + 1}`);
        await Promise.all(imagePromises).catch((err) => {
          console.error('Image preload failed:', err);
        });

        const dataUrl = await domtoimage.toPng(spreadRef.current, {
          quality: 1.0,
          width: 900,
          height: 600,
          cacheBust: true,
        });
        console.log(`Generated preview for spread ${index + 1}: ${dataUrl.substring(0, 50)}...`);

        setPreviewDebugUrls((prev) => [
          ...prev,
          { spreadIndex: index, pageIds: [leftPage?.id, rightPage?.id].filter(Boolean), dataUrl },
        ]);

        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `spread_${index + 1}_preview.png`, { type: 'image/png' });
        console.log(`Generated file for spread ${index + 1}:`, { name: file.name, size: file.size, type: file.type });
        spreadPreviews.push({ pageIds: [leftPage?.id, rightPage?.id].filter(Boolean), file });
      }

      setCurrentPageIndex(originalPageIndex);

      const validPreviews = spreadPreviews.filter((preview) => preview !== null);
      if (validPreviews.length === 0) {
        setSaveError('Failed to generate any previews. Please try again.');
        setIsSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append('theme_id', theme.id);
      formData.append('paper_id', paper.id);
      formData.append('total_price', calculateTotalPrice());

      validPages.forEach((page, index) => {
        const pageData = {
          page_number: index + 1,
          background_id: selectedBackground ? selectedBackground.id : null,
          elements: page.elements
            .filter((el) => el.type !== 'placeholder' || (el.type === 'placeholder' && el.content))
            .map((el) => ({
              type: el.type,
              content: el.content,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              rotation: el.rotation,
              z_index: el.zIndex,
              shape: el.shape,
              fontFamily: el.fontFamily,
              fontSize: el.fontSize,
              fontColor: el.fontColor,
              backgroundColor: el.backgroundColor,
              textAlign: el.textAlign,
              isBold: el.isBold,
            })),
          client_page_id: page.id,
        };
        formData.append(`pages[${index}]`, JSON.stringify(pageData));
        console.log(`Appended page data for index ${index} (client_page_id: ${page.id}):`, pageData);
      });

      validPreviews.forEach((preview, index) => {
        preview.pageIds.forEach((pageId) => {
          console.log(`Appending page_previews[${pageId}]:`, { name: preview.file.name, size: preview.file.size });
          formData.append(`page_previews[${pageId}]`, preview.file);
        });
      });

      for (let [key, value] of formData.entries()) {
        console.log(`FormData entry: ${key} = ${value instanceof File ? `${value.name} (${value.size} bytes)` : value}`);
      }

      const response = await axios.post(`${BASE_URL}/orders/create/`, formData, config);
      console.log('Order saved:', response.data);
      alert('Order saved successfully!');
    } catch (err) {
      console.error('Order save failed:', err.response?.data || err.message);
      setSaveError('Failed to save order. Please check your connection or try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-editor-container">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <div className="pb-editor-header">
        <button className="pb-paper-back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="pb-editor-header-info">
          <h2>
            {theme.theme_name || 'Unnamed Theme'} - {paper.size || 'Unknown Size'}
          </h2>
          <span className="pb-editor-page-indicator">
            Pages {currentPageIndex + 1}-{currentPageIndex + 2} of {pages.length}
          </span>
          <span className="pb-editor-price-display">Total Price: ${calculateTotalPrice()}</span>
        </div>
        <div className="pb-editor-header-actions">
          <button className="pb-help-btn" onClick={() => setShowHelp(true)}>
            <HelpCircle size={20} />
          </button>
          <button className="pb-editor-action-btn" onClick={addTextElement}>
            <Type size={18} />
            Add Text
          </button>
          <button className="pb-editor-action-btn" onClick={handleSaveOrder} disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
      {saveError && <div className="pb-editor-error-message">{saveError}</div>}

      {selectedTextElement && (
        <GlobalTextToolbar
          element={selectedTextElement.element}
          pageId={selectedTextElement.pageId}
          onUpdate={updateElement}
          onClose={() => setSelectedTextElement(null)}
        />
      )}

      <div className="pb-editor-main">
        <Sidebar
          uploadedImages={uploadedImages}
          themeBackgrounds={
            theme.backgrounds && Array.isArray(theme.backgrounds)
              ? theme.backgrounds.map((bg) => ({ id: bg.id, url: getImageUrl(bg.image) }))
              : []
          }
          stickers={Array.isArray(stickers) ? stickers.map((s) => ({ id: s.id, url: getImageUrl(s.image) })) : []}
          onImageUpload={handleImageUpload}
          onBackgroundSelect={(bg) => {
            console.log('Applying background:', bg);
            setSelectedBackground(bg);
          }}
        />
        <div className="pb-editor-canvas-area">
          <div className="pb-editor-canvas-wrapper">
            <div ref={spreadRef} className="pb-spread-wrapper">
              <BookSpread
                leftPage={pages[currentPageIndex]}
                rightPage={pages[currentPageIndex + 1]}
                background={selectedBackground ? selectedBackground.url : ''}
                paperSize={paper.size}
                onAddElement={addElementToPage}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
                pageRefs={pageRefs}
                onTextSelect={handleTextSelect}
                onTextDeselect={handleTextDeselect}
              />
            </div>
          </div>
          {previewDebugUrls.length > 0 && (
            <div className="pb-editor-preview-debug">
              <h3>Debug Previews</h3>
              {previewDebugUrls.map((preview) => (
                <div key={preview.spreadIndex}>
                  <p>Spread {preview.spreadIndex + 1} (Pages {preview.pageIds.join(', ')})</p>
                  <img src={preview.dataUrl} alt={`Spread ${preview.spreadIndex + 1} Preview`} style={{ width: '200px', height: 'auto' }} />
                </div>
              ))}
            </div>
          )}
          <div className="pb-editor-pagination-controls">
            <button className="pb-editor-nav-btn" onClick={goToPreviousSpread} disabled={currentPageIndex === 0}>
              <ChevronLeft size={20} />
              Previous
            </button>
            <button className="pb-editor-nav-btn" onClick={goToNextSpread}>
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// PhotoBook Main Component
function PhotoBook() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [step, setStep] = useState(1);
  const [themes, setThemes] = useState([]);
  const [papers, setPapers] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [stickers, setStickers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const themesRes = await axios.get(`${BASE_URL}/themes/`, config).catch((err) => {
          console.error('Failed to fetch themes:', err);
          return { data: [] };
        });

        const papersRes = await axios.get(`${BASE_URL}/photobook-papers/`, config).catch((err) => {
          console.error('Failed to fetch papers:', err);
          return { data: [] };
        });

        const stickersRes = await axios.get(`${BASE_URL}/stickers/`, config).catch((err) => {
          console.error('Failed to fetch stickers:', err);
          return { data: [] };
        });

        setThemes(Array.isArray(themesRes.data) ? themesRes.data : []);
        setPapers(Array.isArray(papersRes.data) ? papersRes.data : []);
        setStickers(Array.isArray(stickersRes.data) ? stickersRes.data : []);

        if (!themesRes.data.length && !papersRes.data.length && !stickersRes.data.length) {
          setError('Failed to load data from all endpoints. Please check your connection or try again.');
        }
      } catch (err) {
        console.error('Unexpected error during data fetch:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    setStep(2);
  };

  const handlePaperSelect = (paper) => {
    setSelectedPaper(paper);
    setStep(3);
  };

  const handleBackToThemes = () => {
    setStep(1);
    setSelectedTheme(null);
    setSelectedPaper(null);
  };

  const handleBackToPapers = () => {
    setStep(2);
    setSelectedPaper(null);
  };

  if (isLoading) {
    return (
      <div className="pb-global-loading-container">
        <div className="pb-global-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-global-error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (step === 1) {
    return <ThemeSelector themes={themes} onSelect={handleThemeSelect} />;
  }

  if (step === 2) {
    return <PaperSelector papers={papers} onSelect={handlePaperSelect} onBack={handleBackToThemes} />;
  }

  if (step === 3 && selectedTheme && selectedPaper) {
    return (
      <DndProvider backend={HTML5Backend}>
        <PhotoBookEditor
          theme={selectedTheme}
          paper={selectedPaper}
          stickers={stickers}
          onBack={handleBackToPapers}
        />
      </DndProvider>
    );
  }

  return null;
}

export default PhotoBook;