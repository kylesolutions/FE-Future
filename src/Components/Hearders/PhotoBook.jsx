import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Image as ImageIcon, Trash2, Type } from 'lucide-react';
import './PhotoBook.css';

const BASE_URL = 'http://82.180.146.4:8001';
const FALLBACK_IMAGE = 'https://via.placeholder.com/150?text=No+Image';
const ItemTypes = {
  IMAGE: 'image',
  STICKER: 'sticker',
  TEXT: 'text',
  PLACEHOLDER: 'placeholder',
};

function PhotoBook() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [step, setStep] = useState(1); // 1: themes, 2: papers, 3: editor
  const [themes, setThemes] = useState([]);
  const [papers, setPapers] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [pages, setPages] = useState([{ id: 1, elements: [] }, { id: 2, elements: [] }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState('photos');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getImageUrl = (path) => {
    if (!path) return FALLBACK_IMAGE;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [themesRes, papersRes, stickersRes] = await Promise.all([
          axios.get(`${BASE_URL}/themes/`, config),
          axios.get(`${BASE_URL}/photobook-papers/`, config),
          axios.get(`${BASE_URL}/stickers/`, config),
        ]);
        setThemes(themesRes.data);
        setPapers(papersRes.data);
        setStickers(stickersRes.data);
      } catch (err) {
        setError('Failed to load data. Please try again.');
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setUploadedImages([...uploadedImages, ...newImages]);
  };

  const addElementToPage = (type, content, pageId, x = 50, y = 50) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    const newPages = [...pages];
    newPages[pageIndex].elements.push({
      type,
      content,
      x,
      y,
      width: type === 'placeholder' ? 150 : 200,
      height: type === 'placeholder' ? 150 : 200,
      scale: 1,
    });
    setPages(newPages);
  };

  const updateElement = (pageId, elementIndex, updates) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    const newPages = [...pages];
    newPages[pageIndex].elements[elementIndex] = { ...newPages[pageIndex].elements[elementIndex], ...updates };
    setPages(newPages);
  };

  const deleteElement = (pageId, elementIndex) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    const newPages = [...pages];
    newPages[pageIndex].elements.splice(elementIndex, 1);
    setPages(newPages);
  };

  const applyThemeBackground = (themeImage) => {
    const bookSpread = document.querySelector('.book-spread');
    if (bookSpread) {
      bookSpread.style.backgroundImage = `url(${themeImage})`;
      bookSpread.style.backgroundSize = '800px 600px'; // Match total width and height
      bookSpread.style.backgroundRepeat = 'no-repeat';
    }
  };

  const resizeElement = (pageId, elementIndex, delta) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    const newPages = [...pages];
    const element = newPages[pageIndex].elements[elementIndex];
    newPages[pageIndex].elements[elementIndex] = {
      ...element,
      width: Math.max(50, element.width + delta),
      height: Math.max(50, element.height + delta),
    };
    setPages(newPages);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  if (step === 1) {
    return (
      <div className="photobook-container">
        <h1>Personalize Photobook Online</h1>
        <h2>Photobook Printing Online</h2>
        <h3>Select your photobook theme</h3>
        <div className="theme-list">
          {themes.map((theme) => (
            <div key={theme.id} className="theme-item" onClick={() => handleThemeSelect(theme)}>
              <img src={theme.backgrounds[0] ? getImageUrl(theme.backgrounds[0].image) : FALLBACK_IMAGE} alt={theme.theme_name} />
              <p>{theme.theme_name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="photobook-container">
        <h3>Select your photobook size</h3>
        <div className="paper-list">
          {papers.map((paper) => (
            <div key={paper.id} className="paper-item" onClick={() => handlePaperSelect(paper)}>
              <img src={getImageUrl(paper.image)} alt={paper.size} />
              <p>{paper.size}</p>
              <p>${paper.price}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="editor-container">
          <div className="sidebar">
            <div className="tab-buttons">
              <button className={activeTab === 'photos' ? 'active' : ''} onClick={() => setActiveTab('photos')}>
                <ImageIcon /> Photos
              </button>
              <button className={activeTab === 'themes' ? 'active' : ''} onClick={() => setActiveTab('themes')}>
                <ImageIcon /> Themes
              </button>
              <button className={activeTab === 'stickers' ? 'active' : ''} onClick={() => setActiveTab('stickers')}>
                <ImageIcon /> Stickers
              </button>
            </div>
            <div className="tab-content">
              {activeTab === 'photos' && (
                <div className="photos-section">
                  <h4><Plus /> Add Photos</h4>
                  <input type="file" multiple onChange={handleImageUpload} />
                  <div className="item-list">
                    {uploadedImages.map((img, index) => (
                      <DraggableImage key={index} src={img} />
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'themes' && (
                <div className="themes-section">
                  <h4>Themes</h4>
                  <div className="item-list">
                    {selectedTheme.backgrounds.map((bg) => (
                      <DraggableImage key={bg.id} src={getImageUrl(bg.image)} onClick={() => applyThemeBackground(getImageUrl(bg.image))} />
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'stickers' && (
                <div className="stickers-section">
                  <h4>Stickers</h4>
                  <div className="item-list">
                    {stickers.map((sticker) => (
                      <DraggableSticker key={sticker.id} src={getImageUrl(sticker.image)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="editor-main">
            <div className="book-spread">
              <Page
                page={pages[0]}
                paperSize={selectedPaper.size}
                isActive={currentPage === 0}
                updateElement={(i, u) => updateElement(pages[0].id, i, u)}
                deleteElement={(i) => deleteElement(pages[0].id, i)}
                addElement={(t, c) => addElementToPage(t, c, pages[0].id)}
                resizeElement={(i, d) => resizeElement(pages[0].id, i, d)}
                side="left"
              />
              <Page
                page={pages[1]}
                paperSize={selectedPaper.size}
                isActive={currentPage === 1}
                updateElement={(i, u) => updateElement(pages[1].id, i, u)}
                deleteElement={(i) => deleteElement(pages[1].id, i)}
                addElement={(t, c) => addElementToPage(t, c, pages[1].id)}
                resizeElement={(i, d) => resizeElement(pages[1].id, i, d)}
                side="right"
              />
            </div>
            <div className="editor-controls">
              <button onClick={() => addElementToPage('placeholder', FALLBACK_IMAGE, pages[currentPage].id)}>Add Image Space</button>
              <button onClick={() => addElementToPage('text', 'New Text', pages[currentPage].id)}><Type /> Add Text</button>
              <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}>Previous Page</button>
              <button onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}>Next Page</button>
            </div>
          </div>
        </div>
      </DndProvider>
    );
  }
}

const DraggableImage = ({ src, onClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.IMAGE,
    item: { src, type: 'image' },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <img
      ref={drag}
      src={src}
      alt="draggable"
      className="draggable-item"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onClick}
    />
  );
};

const DraggableSticker = ({ src }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.STICKER,
    item: { src, type: 'sticker' },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <img ref={drag} src={src} alt="draggable" className="draggable-item" style={{ opacity: isDragging ? 0.5 : 1 }} />
  );
};

const Page = ({ page, paperSize, isActive, updateElement, deleteElement, addElement, resizeElement, side }) => {
  const ref = useRef(null);
  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.IMAGE, ItemTypes.STICKER, ItemTypes.TEXT, ItemTypes.PLACEHOLDER],
    drop: (item, monitor) => {
      const rect = ref.current.getBoundingClientRect();
      const delta = monitor.getDifferenceFromInitialOffset();
      const x = Math.round(delta.x + (monitor.getInitialClientOffset().x - rect.left));
      const y = Math.round(delta.y + (monitor.getInitialClientOffset().y - rect.top));
      addElement(item.type, item.src || item.content, page.id, x, y);
    },
  }));

  const handleDrag = (index, e) => {
    if (!isActive) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - page.elements[index].width / 2;
    const y = e.clientY - rect.top - page.elements[index].height / 2;
    updateElement(page.id, index, { x, y });
  };

  return (
    <div
      ref={ref}
      className={`page ${isActive ? 'active' : ''} ${side}`}
      style={{ aspectRatio: getAspectRatio(paperSize) }}
    >
      <div ref={drop} className="page-content">
        {page.elements.map((el, index) => (
          <div
            key={index}
            className="element"
            style={{ left: `${el.x}px`, top: `${el.y}px`, width: `${el.width}px`, height: `${el.height}px` }}
            draggable={isActive}
            onDrag={(e) => handleDrag(index, e)}
          >
            {el.type === 'text' ? (
              <textarea
                value={el.content}
                onChange={(e) => updateElement(page.id, index, { content: e.target.value })}
                style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', resize: 'none' }}
              />
            ) : (
              <img src={el.content} alt="" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
            )}
            {isActive && (
              <div className="element-controls">
                <button className="delete-btn" onClick={() => deleteElement(page.id, index)}>
                  <Trash2 />
                </button>
                {(el.type === 'sticker' || el.type === 'image') && (
                  <>
                    <button onClick={() => resizeElement(page.id, index, 20)}>Zoom In</button>
                    <button onClick={() => resizeElement(page.id, index, -20)}>Zoom Out</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const getAspectRatio = (size) => {
  const ratios = { 'A4': '210/297', '8x10': '8/10' };
  return ratios[size] || '1';
};

export default PhotoBook;
