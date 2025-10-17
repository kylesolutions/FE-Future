import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Image as ImageIcon, Sparkles, Sticker as StickerIcon, Upload, ArrowLeft, Type, ChevronLeft, ChevronRight, Trash2, ZoomIn, ZoomOut, RotateCw, Maximize2, Save, Scissors } from 'lucide-react';
import './PhotoBook.css';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';
import { removeBackground } from '@imgly/background-removal'; // Import the library

const BASE_URL = 'http://82.180.146.4:8001';
const FALLBACK_IMAGE = 'https://via.placeholder.com/300x200?text=No+Image';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e0e0e0" stroke="%23999" stroke-width="2" stroke-dasharray="5,5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3EDrop Photo Here%3C/text%3E%3C/svg%3E';

const ItemTypes = {
  IMAGE: 'image',
  STICKER: 'sticker',
  ELEMENT: 'element',
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

// ThemeSelector Component (unchanged)
function ThemeSelector({ themes, onSelect }) {
  const safeThemes = Array.isArray(themes) ? themes : [];

  return (
    <div className="photobook-container">
      <div className="header-section">
        <h1>Personalize Your Photobook</h1>
        <p className="subtitle">Create beautiful memories with our photobook printing service</p>
      </div>
      <div className="selection-section">
        <h2>Select Your Photobook Theme</h2>
        {safeThemes.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={48} />
            <p>No themes available</p>
            <p className="hint">Please check your connection or try again later</p>
          </div>
        ) : (
          <div className="theme-grid">
            {safeThemes.map((theme) => (
              <div
                key={theme.id}
                className="theme-card"
                onClick={() => onSelect(theme)}
              >
                <div className="theme-image-wrapper">
                  <img
                    src={theme.backgrounds && theme.backgrounds[0] ? getImageUrl(theme.backgrounds[0].image) : FALLBACK_IMAGE}
                    alt={theme.theme_name || 'Theme'}
                  />
                </div>
                <div className="theme-info">
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

// PaperSelector Component (unchanged)
function PaperSelector({ papers, onSelect, onBack }) {
  const safePapers = Array.isArray(papers) ? papers : [];

  return (
    <div className="photobook-container">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={20} />
        Back to Themes
      </button>
      <div className="header-section">
        <h1>Choose Your Photobook Size</h1>
        <p className="subtitle">Select the perfect size for your memories</p>
      </div>
      <div className="selection-section">
        {safePapers.length === 0 ? (
          <div className="empty-state">
            <p>No paper sizes available</p>
            <p className="hint">Please check your connection or try again later</p>
          </div>
        ) : (
          <div className="paper-grid">
            {safePapers.map((paper) => (
              <div
                key={paper.id}
                className="paper-card"
                onClick={() => onSelect(paper)}
              >
                <div className="paper-image-wrapper">
                  <img src={getImageUrl(paper.image)} alt={paper.size || 'Paper'} />
                </div>
                <div className="paper-info">
                  <h3>{paper.size || 'Unknown Size'}</h3>
                  <p className="price">${Number(paper.price || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// DraggableItem Component (unchanged)
function DraggableItem({ src, type }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type === 'image' ? ItemTypes.IMAGE : ItemTypes.STICKER,
    item: { src, type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [src, type]);

  return (
    <div
      ref={drag}
      className="draggable-item"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <img src={src} alt="" draggable={false} />
    </div>
  );
}

// DraggableElement Component (Updated with Background Removal)
function DraggableElement({ element, pageId, onUpdate, onDelete, pageRef }) {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const elementRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (elementRef.current && !elementRef.current.contains(e.target)) {
        setIsSelected(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    console.log('Mouse down on element:', { type: element.type, id: element.id, content: element.content });
    setIsSelected(true);
    if (element.type === 'text' && e.detail === 2) {
      console.log('Double-click detected, enabling text edit');
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

  const handleMouseMove = (e) => {
    if (!isDraggingElement || !pageRef.current) return;
    const pageRect = pageRef.current.getBoundingClientRect();
    const newX = e.clientX - pageRect.left - dragStart.x;
    const newY = e.clientY - pageRect.top - dragStart.y;
    const constrainedX = Math.max(0, Math.min(newX, pageRect.width - element.width));
    const constrainedY = Math.max(0, Math.min(newY, pageRect.height - element.height));
    console.log('Moving element:', { newX, newY, constrainedX, constrainedY });
    onUpdate(pageId, element.id, { x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDraggingElement(false);
  };

  useEffect(() => {
    if (isDraggingElement) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingElement, dragStart]);

  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
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
    const delta = Math.max(deltaX, deltaY);
    const newWidth = Math.max(50, resizeStart.width + delta);
    const newHeight = Math.max(50, resizeStart.height + delta);
    onUpdate(pageId, element.id, { width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
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
  }, [isResizing, resizeStart]);

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
  };

  const handleTextChange = (e) => {
    console.log('Text changed:', e.target.value);
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
      console.log('Image uploaded for placeholder:', imageUrl);
      onUpdate(pageId, element.id, { content: imageUrl, type: 'image' });
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
      console.log('Removing background for image:', element.content);
      const response = await fetch(element.content);
      const blob = await response.blob();
      const resultBlob = await removeBackground(blob, {
        output: { format: 'image/png' }, // Ensure PNG output for transparency
      });
      console.log('Background removed successfully, blob size:', resultBlob.size);

      // Convert resultBlob to a File for upload
      const file = new File([resultBlob], `nobg_${Date.now()}.png`, { type: 'image/png' });
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } } : {};
      const formData = new FormData();
      formData.append('image', file);
      const uploadResponse = await axios.post(`${BASE_URL}/upload-images/`, formData, config);
      const newImageUrl = getImageUrl(uploadResponse.data.image);
      console.log('Uploaded background-removed image:', newImageUrl);

      // Update element with new image URL
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
    console.log('Upload icon clicked, triggering file input');
    fileInputRef.current.click();
  };

  const renderContent = () => {
    if (element.type === 'text') {
      if (isEditing) {
        return (
          <textarea
            ref={textareaRef}
            value={element.content}
            onChange={handleTextChange}
            onBlur={() => {
              console.log('Textarea blurred, ending edit');
              setIsEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-editor"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'transparent',
              resize: 'none',
              outline: 'none',
              fontSize: '16px',
              fontFamily: 'Arial, sans-serif',
              padding: '8px',
            }}
          />
        );
      }
      return (
        <div className="text-content" style={{ padding: '8px', fontSize: '16px' }}>
          {element.content || 'Double click to edit'}
        </div>
      );
    }
    if (element.type === 'placeholder') {
      return (
        <div className="placeholder-frame">
          <img
            src={element.content || PLACEHOLDER_IMAGE}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
          {!element.content && (
            <div className="upload-overlay">
              <button className="upload-icon-btn" onClick={handleUploadClick}>
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
        </div>
      );
    }
    return (
      <img
        src={element.content}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} // Changed to 'contain' to preserve transparency
        draggable={false}
      />
    );
  };

  return (
    <div
      ref={elementRef}
      className={`draggable-element ${isSelected ? 'selected' : ''} ${element.type === 'text' ? 'text-element' : ''}`}
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
          <div className="element-border"></div>
          <div className="resize-handle" onMouseDown={handleResizeStart}>
            <Maximize2 size={12} />
          </div>
          <div className="element-toolbar">
            {element.type === 'image' && (
              <>
                <button
                  className="toolbar-btn"
                  onClick={handleRemoveBackground}
                  title="Remove Background"
                  disabled={isRemovingBackground}
                >
                  <Scissors size={14} />
                </button>
                <button className="toolbar-btn" onClick={handleZoomIn} title="Zoom In">
                  <ZoomIn size={14} />
                </button>
                <button className="toolbar-btn" onClick={handleZoomOut} title="Zoom Out">
                  <ZoomOut size={14} />
                </button>
                <button className="toolbar-btn" onClick={handleRotate} title="Rotate">
                  <RotateCw size={14} />
                </button>
              </>
            )}
            {element.type !== 'text' && element.type !== 'image' && (
              <>
                <button className="toolbar-btn" onClick={handleZoomIn} title="Zoom In">
                  <ZoomIn size={14} />
                </button>
                <button className="toolbar-btn" onClick={handleZoomOut} title="Zoom Out">
                  <ZoomOut size={14} />
                </button>
                <button className="toolbar-btn" onClick={handleRotate} title="Rotate">
                  <RotateCw size={14} />
                </button>
              </>
            )}
            <button className="toolbar-btn delete" onClick={handleDelete} title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// PageCanvas Component (unchanged)
function PageCanvas({ page, position, paperSize, onAddElement, onUpdateElement, onDeleteElement, pageRefs }) {
  const pageRef = useRef(null);
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: [ItemTypes.IMAGE, ItemTypes.STICKER],
      drop: (item, monitor) => {
        const offset = monitor.getSourceClientOffset();
        if (!offset || !pageRef.current) return;
        const pageRect = pageRef.current.getBoundingClientRect();
        const elementWidth = item.type === 'sticker' ? 150 : 200;
        const elementHeight = item.type === 'sticker' ? 150 : 200;
        const x = offset.x - pageRect.left - elementWidth / 2;
        const y = offset.y - pageRect.top - elementHeight / 2;
        const newElement = {
          type: item.type,
          content: item.src,
          x: Math.max(0, Math.min(x, pageRect.width - elementWidth)),
          y: Math.max(0, Math.min(y, pageRect.height - elementHeight)),
          width: elementWidth,
          height: elementHeight,
          rotation: 0,
          zIndex: Math.max(0, ...page.elements.map((el) => el.zIndex || 0)) + 1,
        };
        onAddElement(page.id, newElement);
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [page.id]
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
      className={`page ${position} ${isOver ? 'drag-over' : ''}`}
      style={{
        aspectRatio: getAspectRatio(paperSize),
        background: 'transparent',
      }}
    >
      <div className="page-content">
        {page.elements.map((element) => (
          <DraggableElement
            key={element.id}
            element={element}
            pageId={page.id}
            onUpdate={onUpdateElement}
            onDelete={onDeleteElement}
            pageRef={pageRef}
          />
        ))}
      </div>
    </div>
  );
}

// BookSpread Component (unchanged)
function BookSpread({ leftPage, rightPage, background, paperSize, onAddElement, onUpdateElement, onDeleteElement, pageRefs }) {
  return (
    <div
      className="book-spread"
      style={{
        backgroundImage: background ? `url(${background})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="book-spine"></div>
      {leftPage && (
        <PageCanvas
          page={leftPage}
          position="left"
          paperSize={paperSize}
          onAddElement={onAddElement}
          onUpdateElement={onUpdateElement}
          onDeleteElement={onDeleteElement}
          pageRefs={pageRefs}
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
        />
      )}
    </div>
  );
}

// Sidebar Component (unchanged)
function Sidebar({ uploadedImages, themeBackgrounds, stickers, onImageUpload, onBackgroundSelect }) {
  const [activeTab, setActiveTab] = useState('photos');

  return (
    <div className="sidebar">
      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          <ImageIcon size={18} />
          Photos
        </button>
        <button
          className={`tab-btn ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          <Sparkles size={18} />
          Themes
        </button>
        <button
          className={`tab-btn ${activeTab === 'stickers' ? 'active' : ''}`}
          onClick={() => setActiveTab('stickers')}
        >
          <StickerIcon size={18} />
          Stickers
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'photos' && (
          <div className="tab-panel">
            <div className="upload-section">
              <label htmlFor="file-upload" className="upload-btn">
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
              <div className="item-grid">
                {uploadedImages.map((img, index) => (
                  <DraggableItem key={index} src={img.url} type="image" />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <ImageIcon size={48} />
                <p>No photos uploaded yet</p>
                <p className="hint">Upload photos to get started</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'themes' && (
          <div className="tab-panel">
            <h3 className="panel-title">Theme Backgrounds</h3>
            {themeBackgrounds.length > 0 ? (
              <div className="item-grid">
                {themeBackgrounds.map((bg, index) => (
                  <div
                    key={index}
                    className="theme-bg-item"
                    onClick={() => onBackgroundSelect(bg)}
                  >
                    <img src={bg.url} alt={`Background ${index + 1}`} />
                    <div className="overlay">
                      <span>Apply</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Sparkles size={48} />
                <p>No backgrounds available</p>
                <p className="hint">Select a theme with backgrounds</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'stickers' && (
          <div className="tab-panel">
            <h3 className="panel-title">Stickers & Decorations</h3>
            {stickers.length > 0 ? (
              <div className="item-grid">
                {stickers.map((sticker, index) => (
                  <DraggableItem key={index} src={sticker.url} type="sticker" />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <StickerIcon size={48} />
                <p>No stickers available</p>
                <p className="hint">Add stickers to decorate your photobook</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// PhotoBookEditor Component (Updated to Handle PNG Uploads)
function PhotoBookEditor({ theme, paper, stickers, onBack }) {
  const [pages, setPages] = useState([
    {
      id: 1,
      elements: [
        {
          id: `${Date.now()}-${Math.random()}`,
          type: 'placeholder',
          content: '',
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          rotation: 0,
          zIndex: 1,
        },
      ],
    },
    {
      id: 2,
      elements: [
        {
          id: `${Date.now()}-${Math.random()}`,
          type: 'placeholder',
          content: '',
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          rotation: 0,
          zIndex: 1,
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

  const calculateTotalPrice = () => {
    const basePrice = parseFloat(paper.price || 0);
    const pagePrice = 2.00;
    const stickerPrice = 0.50;
    const totalPages = pages.length;
    const totalStickers = pages.reduce(
      (count, page) => count + page.elements.filter((el) => el.type === 'sticker').length,
      0
    );
    return (basePrice + totalPages * pagePrice + totalStickers * stickerPrice).toFixed(2);
  };

  const generateSpreadPreview = async (leftPageId, rightPageId, spreadIndex) => {
    if (!spreadRef.current) {
      console.error('Spread element not found');
      return null;
    }
    try {
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
            img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
            img.src = img.src;
          }
        });
      });

      console.log(`Preloading ${imagePromises.length} images for spread ${spreadIndex + 1}`);
      await Promise.all(imagePromises).catch((err) => {
        console.error('Image preload failed:', err);
      });

      const scale = 3; // Increase resolution for better quality
      const node = spreadRef.current;
      const style = window.getComputedStyle(node);
      const width = parseInt(style.width) * scale;
      const height = parseInt(style.height) * scale;

      const dataUrl = await domtoimage.toJpeg(spreadRef.current, {
        quality: 1.0, // High quality
        width,
        height,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`,
        },
        cacheBust: true,
      });
      console.log(`Generated spread preview for spread ${spreadIndex + 1}`);
      return {
        spreadIndex,
        pageIds: [leftPageId, rightPageId].filter(Boolean),
        dataUrl,
      };
    } catch (err) {
      console.error(`Failed to generate spread preview for pages ${leftPageId}, ${rightPageId}:`, err);
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
      uploaded.forEach((img) => {
        const currentPage = pages[currentPageIndex];
        if (currentPage) {
          addElementToPage(currentPage.id, {
            type: 'image',
            content: img.url,
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            rotation: 0,
          });
        }
      });
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
      });
    }
  };

  const addImagePlaceholder = () => {
    const currentPage = pages[currentPageIndex];
    if (currentPage) {
      addElementToPage(currentPage.id, {
        type: 'placeholder',
        content: '',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        rotation: 0,
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
            id: `${Date.now()}-${Math.random()}`,
            type: 'placeholder',
            content: '',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            rotation: 0,
            zIndex: 1,
          },
        ],
      },
      {
        id: lastPageId + 2,
        elements: [
          {
            id: `${Date.now()}-${Math.random()}`,
            type: 'placeholder',
            content: '',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            rotation: 0,
            zIndex: 1,
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

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const validPages = pages.filter((page) => page.elements.length > 0);

      const spreadPreviews = await Promise.all(
        Array.from({ length: Math.ceil(validPages.length / 2) }, async (_, index) => {
          const leftPage = validPages[index * 2];
          const rightPage = validPages[index * 2 + 1];
          const preview = await generateSpreadPreview(leftPage?.id, rightPage?.id, index);
          if (!preview) return null;
          const response = await fetch(preview.dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `spread_${index + 1}_preview.jpg`, { type: 'image/jpeg' });
          console.log(`Generated file for spread ${index + 1}:`, { name: file.name, size: file.size, type: file.type });
          return { pageIds: preview.pageIds, file };
        })
      );

      const validPreviews = spreadPreviews.filter((preview) => preview !== null);

      const formData = new FormData();
      formData.append('theme_id', theme.id);
      formData.append('paper_id', paper.id);
      formData.append('total_price', calculateTotalPrice());

      validPages.forEach((page, index) => {
        const pageData = {
          page_number: index + 1,
          background_id: selectedBackground ? selectedBackground.id : null,
          elements: page.elements.map((el) => ({
            type: el.type,
            content: el.content,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            rotation: el.rotation,
            z_index: el.zIndex,
          })),
          client_page_id: page.id,
        };
        formData.append(`pages[${index}]`, JSON.stringify(pageData));
        console.log(`Appended page data for index ${index}:`, pageData);
      });

      validPreviews.forEach((preview) => {
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

  const leftPage = pages[currentPageIndex];
  const rightPage = pages[currentPageIndex + 1];

  return (
    <div className="editor-container">
      <div className="editor-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="header-info">
          <h2>
            {theme.theme_name || 'Unnamed Theme'} - {paper.size || 'Unknown Size'}
          </h2>
          <span className="page-indicator">
            Pages {currentPageIndex + 1}-{currentPageIndex + 2} of {pages.length}
          </span>
          <span className="price-display">Total Price: ${calculateTotalPrice()}</span>
        </div>
        <div className="header-actions">
          <button className="action-btn" onClick={addTextElement}>
            <Type size={18} />
            Add Text
          </button>
          <button className="action-btn" onClick={addImagePlaceholder}>
            <Plus size={18} />
            Add Frame
          </button>
          <button className="action-btn" onClick={handleSaveOrder} disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
      {saveError && <div className="error-message">{saveError}</div>}
      <div className="editor-main">
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
        <div className="canvas-area">
          <div className="canvas-wrapper">
            <div ref={spreadRef} className="spread-wrapper">
              <BookSpread
                leftPage={leftPage}
                rightPage={rightPage}
                background={selectedBackground ? selectedBackground.url : ''}
                paperSize={paper.size}
                onAddElement={addElementToPage}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
                pageRefs={pageRefs}
              />
            </div>
          </div>
          <div className="pagination-controls">
            <button className="nav-btn" onClick={goToPreviousSpread} disabled={currentPageIndex === 0}>
              <ChevronLeft size={20} />
              Previous
            </button>
            <button className="nav-btn" onClick={goToNextSpread}>
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main PhotoBook Component (unchanged)
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
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
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

