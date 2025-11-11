import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Details.css';
import { logoutUser } from '../../Redux/slices/userSlice';
import {
  Package,
  Users,
  Tag,
  Grid,
  Coffee,
  Crown,
  Shirt,
  Square,
  Pen,
  Printer,
  Ruler,
  FileText,
  Layers,
  ShoppingCart,
  Gift,
  Edit,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Palette
} from 'lucide-react';

// Base URL for images
const BASE_URL = 'http://82.180.146.4:8001';
// Fallback image for broken or missing images
const FALLBACK_IMAGE = 'https://via.placeholder.com/100x100?text=Image+Not+Found';

function Details() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [frames, setFrames] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mackBoards, setMackBoards] = useState([]);
  const [mugs, setMugs] = useState([]);
  const [caps, setCaps] = useState([]);
  const [tshirts, setTshirts] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [pens, setPens] = useState([]);
  const [printTypes, setPrintTypes] = useState([]);
  const [printSizes, setPrintSizes] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [laminationTypes, setLaminationTypes] = useState([]);
  const [frameOrders, setFrameOrders] = useState([]);
  const [giftOrders, setGiftOrders] = useState([]);
  const [documentOrders, setDocumentOrders] = useState([]);
  const [simpleDocumentOrders, setSimpleDocumentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('frames');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [themes, setThemes] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [photoBookPapers, setPhotoBookPapers] = useState([]);

  // Utility function to construct image URLs
  const getImageUrl = (path) => {
    if (!path) {
      console.warn('Image path is undefined or null');
      return FALLBACK_IMAGE;
    }
    if (path.startsWith('http')) {
      return path;
    }
    const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    console.log('Constructed image URL:', url);
    return url;
  };

  // Handle image load errors
  const handleImageError = (e) => {
    console.warn('Image failed to load:', e.target.src);
    e.target.src = FALLBACK_IMAGE;
  };

  // Redirect if not admin
  useEffect(() => {
    if (!user.username || user.type !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) throw new Error('No refresh token available');
      const response = await axios.post('http://82.180.146.4:8001/api/token/refresh/', { refresh });
      localStorage.setItem('token', response.data.access);
      return response.data.access;
    } catch (err) {
      console.error('Token refresh failed:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      dispatch(logoutUser());
      navigate('/login');
      return null;
    }
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        let token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          navigate('/login');
          return;
        }
        const [
          framesResponse,
          usersResponse,
          categoriesResponse,
          mackBoardsResponse,
          mugsResponse,
          capsResponse,
          tshirtsResponse,
          tilesResponse,
          pensResponse,
          printTypesResponse,
          printSizesResponse,
          paperTypesResponse,
          laminationTypesResponse,
          frameOrdersResponse,
          giftOrdersResponse,
          documentOrdersResponse,
          simpleDocumentOrdersResponse,
          themesResponse,
          backgroundsResponse,
          stickersResponse,
          photoBookPapersResponse
        ] = await Promise.all([
          axios.get('http://82.180.146.4:8001/frames/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/users/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/categories/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/mack_boards/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/mugs/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/caps/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/tshirts/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/tiles/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/pens/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/api/print-types/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/api/print-sizes/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/api/paper-types/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/api/lamination-types/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/save-items/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/gift-orders/list/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/api/document-print-orders/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/api/orders/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/themes/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/backgrounds/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/stickers/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://82.180.146.4:8001/photobook-papers/', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setFrames(framesResponse.data);
        setUsers(usersResponse.data);
        setCategories(categoriesResponse.data);
        setMackBoards(mackBoardsResponse.data);
        setMugs(mugsResponse.data);
        setCaps(capsResponse.data);
        setTshirts(tshirtsResponse.data);
        setTiles(tilesResponse.data);
        setPens(pensResponse.data);
        setPrintTypes(printTypesResponse.data);
        setPrintSizes(printSizesResponse.data);
        setPaperTypes(paperTypesResponse.data);
        setLaminationTypes(laminationTypesResponse.data);
        setFrameOrders(frameOrdersResponse.data);
        setGiftOrders(giftOrdersResponse.data);
        setDocumentOrders(documentOrdersResponse.data);
        setSimpleDocumentOrders(simpleDocumentOrdersResponse.data);
        setThemes(themesResponse.data);
        setBackgrounds(backgroundsResponse.data);
        setStickers(stickersResponse.data);
        setPhotoBookPapers(photoBookPapersResponse.data);
      } catch (err) {
        if (err.response?.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            try {
              const [
                framesResponse,
                usersResponse,
                categoriesResponse,
                mackBoardsResponse,
                mugsResponse,
                capsResponse,
                tshirtsResponse,
                tilesResponse,
                pensResponse,
                printTypesResponse,
                printSizesResponse,
                paperTypesResponse,
                laminationTypesResponse,
                frameOrdersResponse,
                giftOrdersResponse,
                documentOrdersResponse,
                simpleDocumentOrdersResponse,
                themesResponse,
                backgroundsResponse,
                stickersResponse,
                photoBookPapersResponse,
              ] = await Promise.all([
                axios.get('http://82.180.146.4:8001/frames/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/users/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/categories/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/mack_boards/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/mugs/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/caps/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/tshirts/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/tiles/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/pens/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/api/print-types/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/api/print-sizes/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/api/paper-types/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/api/lamination-types/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/save-items/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/gift-orders/list/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/api/document-print-orders/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/api/orders/', { headers: { Authorization: `Bearer ${newToken}` } }),
                axios.get('http://82.180.146.4:8001/themes/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://82.180.146.4:8001/backgrounds/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://82.180.146.4:8001/stickers/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://82.180.146.4:8001/photobook-papers/', { headers: { Authorization: `Bearer ${newToken}` } }),
              ]);
              setFrames(framesResponse.data);
              setUsers(usersResponse.data);
              setCategories(categoriesResponse.data);
              setMackBoards(mackBoardsResponse.data);
              setMugs(mugsResponse.data);
              setCaps(capsResponse.data);
              setTshirts(tshirtsResponse.data);
              setTiles(tilesResponse.data);
              setPens(pensResponse.data);
              setPrintTypes(printTypesResponse.data);
              setPrintSizes(printSizesResponse.data);
              setPaperTypes(paperTypesResponse.data);
              setLaminationTypes(laminationTypesResponse.data);
              setFrameOrders(frameOrdersResponse.data);
              setGiftOrders(giftOrdersResponse.data);
              setDocumentOrders(documentOrdersResponse.data);
              setSimpleDocumentOrders(simpleDocumentOrdersResponse.data);
              setThemes(themesResponse.data);
              setBackgrounds(backgroundsResponse.data);
              setStickers(stickersResponse.data);
              setPhotoBookPapers(photoBookPapersResponse.data);
            } catch (retryErr) {
              setError('Session expired. Please log in again.');
              navigate('/login');
            }
          } else {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError(err.message || 'Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, dispatch]);

  const handleSelectItem = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalType(null);
  };

  const handleUpdate = async (e, id, type, data) => {
    e.preventDefault();
    let url;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };
    let payload;
    let isMultipart = false;

    switch (type) {
      case 'frame':
        isMultipart = true;
        payload = new FormData();
        payload.append('name', data.get('name'));
        payload.append('price', Number(data.get('price')));
        payload.append('inner_width', Number(data.get('inner_width')));
        payload.append('inner_height', Number(data.get('inner_height')));
        const frameCategoryId = data.get('category_id');
        if (frameCategoryId) payload.append('category_id', frameCategoryId);
        const frameImage = data.get('image');
        const frameCornerImage = data.get('corner_image');
        if (frameImage && frameImage.size > 0) payload.append('image', frameImage);
        if (frameCornerImage && frameCornerImage.size > 0) payload.append('corner_image', frameCornerImage);
        url = `http://82.180.146.4:8001/frames/${id}/`;
        break;
      case 'color':
        isMultipart = true;
        payload = new FormData();
        payload.append('color_name', data.get('color_name'));
        payload.append('price', Number(data.get('price')));
        const colorImage = data.get('image');
        const colorCornerImage = data.get('corner_image');
        if (colorImage && colorImage.size > 0) payload.append('image', colorImage);
        if (colorCornerImage && colorCornerImage.size > 0) payload.append('corner_image', colorCornerImage);
        url = `http://82.180.146.4:8001/variants/color/${id}/`;
        break;
      case 'size':
        isMultipart = true;
        payload = new FormData();
        payload.append('size_name', data.get('size_name'));
        payload.append('inner_width', Number(data.get('inner_width')));
        payload.append('inner_height', Number(data.get('inner_height')));
        payload.append('price', Number(data.get('price')));
        const sizeImage = data.get('image');
        const sizeCornerImage = data.get('corner_image');
        if (sizeImage && sizeImage.size > 0) payload.append('image', sizeImage);
        if (sizeCornerImage && sizeCornerImage.size > 0) payload.append('corner_image', sizeCornerImage);
        url = `http://82.180.146.4:8001/variants/size/${id}/`;
        break;
      case 'finish':
        isMultipart = true;
        payload = new FormData();
        payload.append('finish_name', data.get('finish_name'));
        payload.append('price', Number(data.get('price')));
        const finishImage = data.get('image');
        const finishCornerImage = data.get('corner_image');
        if (finishImage && finishImage.size > 0) payload.append('image', finishImage);
        if (finishCornerImage && finishCornerImage.size > 0) payload.append('corner_image', finishCornerImage);
        url = `http://82.180.146.4:8001/variants/finish/${id}/`;
        break;
      case 'hanging':
        isMultipart = true;
        payload = new FormData();
        payload.append('hanging_name', data.get('hanging_name'));
        payload.append('price', Number(data.get('price')));
        const hangingImage = data.get('image');
        if (hangingImage && hangingImage.size > 0) payload.append('image', hangingImage);
        url = `http://82.180.146.4:8001/variants/hanging/${id}/`;
        break;
      case 'user':
        payload = {
          username: data.get('username'),
          email: data.get('email'),
          name: data.get('name'),
          phone: data.get('phone'),
          is_blocked: data.get('is_blocked') === 'true',
        };
        url = `http://82.180.146.4:8001/users/${id}/`;
        break;
      case 'category':
        payload = {
          frameCategory: data.get('frameCategory'),
        };
        url = `http://82.180.146.4:8001/categories/${id}/`;
        break;
      case 'mackboard':
        isMultipart = true;
        payload = new FormData();
        payload.append('board_name', data.get('board_name'));
        payload.append('price', Number(data.get('price')));
        const mackBoardImage = data.get('image');
        if (mackBoardImage && mackBoardImage.size > 0) payload.append('image', mackBoardImage);
        url = `http://82.180.146.4:8001/mack_boards/${id}/`;
        break;
      case 'mackboard_color':
        isMultipart = true;
        payload = new FormData();
        payload.append('color_name', data.get('color_name'));
        const mackBoardColorImage = data.get('image');
        if (mackBoardColorImage && mackBoardColorImage.size > 0) payload.append('image', mackBoardColorImage);
        url = `http://82.180.146.4:8001/mack_board_color_variants/${id}/`;
        break;
      case 'mug':
        isMultipart = true;
        payload = new FormData();
        payload.append('mug_name', data.get('mug_name'));
        payload.append('price', Number(data.get('price')));
        const mugImage = data.get('image');
        if (mugImage && mugImage.size > 0) payload.append('image', mugImage);
        const glbFile = data.get('glb_file');
        if (glbFile && glbFile.size > 0) payload.append('glb_file', glbFile);
        url = `http://82.180.146.4:8001/mugs/${id}/`;
        break;
      case 'cap':
        isMultipart = true;
        payload = new FormData();
        payload.append('cap_name', data.get('cap_name'));
        payload.append('price', Number(data.get('price')));
        const capImage = data.get('image');
        if (capImage && capImage.size > 0) payload.append('image', capImage);
        url = `http://82.180.146.4:8001/caps/${id}/`;
        break;
      case 'tshirt':
        isMultipart = true;
        payload = new FormData();
        payload.append('tshirt_name', data.get('tshirt_name'));
        const tshirtImage = data.get('image');
        if (tshirtImage && tshirtImage.size > 0) payload.append('image', tshirtImage);
        url = `http://82.180.146.4:8001/tshirts/${id}/`;
        break;
      case 'tshirt_color':
        isMultipart = true;
        payload = new FormData();
        payload.append('color_name', data.get('color_name'));
        payload.append('price', Number(data.get('price')));
        const tshirtColorImage = data.get('image');
        if (tshirtColorImage && tshirtColorImage.size > 0) payload.append('image', tshirtColorImage);
        url = `http://82.180.146.4:8001/tshirt_color_variants/${id}/`;
        break;
      case 'tshirt_size':
        isMultipart = true;
        payload = new FormData();
        payload.append('size_name', data.get('size_name'));
        payload.append('price', Number(data.get('price')));
        payload.append('inner_width', Number(data.get('inner_width')));
        payload.append('inner_height', Number(data.get('inner_height')));
        const tshirtSizeImage = data.get('image');
        if (tshirtSizeImage && tshirtSizeImage.size > 0) payload.append('image', tshirtSizeImage);
        url = `http://82.180.146.4:8001/tshirt_size_variants/${id}/`;
        break;
      case 'tile':
        isMultipart = true;
        payload = new FormData();
        payload.append('tile_name', data.get('tile_name'));
        payload.append('price', Number(data.get('price')));
        const tileImage = data.get('image');
        if (tileImage && tileImage.size > 0) payload.append('image', tileImage);
        url = `http://82.180.146.4:8001/tiles/${id}/`;
        break;
      case 'pen':
        isMultipart = true;
        payload = new FormData();
        payload.append('pen_name', data.get('pen_name'));
        payload.append('price', Number(data.get('price')));
        const penImage = data.get('image');
        if (penImage && penImage.size > 0) payload.append('image', penImage);
        url = `http://82.180.146.4:8001/pens/${id}/`;
        break;
      case 'printtype':
        payload = {
          name: data.get('name'),
          price: Number(data.get('price')),
        };
        url = `http://82.180.146.4:8001/api/print-types/${id}/`;
        break;
      case 'printsize':
        payload = {
          name: data.get('name'),
          price: Number(data.get('price')),
        };
        url = `http://82.180.146.4:8001/api/print-sizes/${id}/`;
        break;
      case 'papertype':
        payload = {
          name: data.get('name'),
          price: Number(data.get('price')),
        };
        url = `http://82.180.146.4:8001/api/paper-types/${id}/`;
        break;
      case 'laminationtype':
        payload = {
          name: data.get('name'),
          price: Number(data.get('price')),
        };
        url = `http://82.180.146.4:8001/api/lamination-types/${id}/`;
        break;
      default:
        return;
      case 'theme':
        payload = {
          theme_name: data.get('theme_name'),
        };
        url = `http://82.180.146.4:8001/themes/${id}/`;
        break;
      case 'background':
        isMultipart = true;
        payload = new FormData();
        payload.append('name', data.get('name'));
        payload.append('theme', data.get('theme'));
        const bgImage = data.get('image');
        if (bgImage && bgImage.size > 0) payload.append('image', bgImage);
        url = `http://82.180.146.4:8001/backgrounds/${id}/`;
        break;
      case 'sticker':
        isMultipart = true;
        payload = new FormData();
        payload.append('name', data.get('name'));
        payload.append('theme', data.get('theme'));
        const stickerImage = data.get('image');
        if (stickerImage && stickerImage.size > 0) payload.append('image', stickerImage);
        url = `http://82.180.146.4:8001/stickers/${id}/`;
        break;
      case 'photobookpaper':
        isMultipart = true;
        payload = new FormData();
        payload.append('size', data.get('size'));
        payload.append('price', Number(data.get('price')));
        const paperImage = data.get('image');
        if (paperImage && paperImage.size > 0) payload.append('image', paperImage);
        url = `http://82.180.146.4:8001/photobook-papers/${id}/`;
        break;
    }

    console.log('Data being sent:', payload);
    let token = localStorage.getItem('token');

    try {
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }

      headers['Content-Type'] = isMultipart ? 'multipart/form-data' : 'application/json';
      const response = await axios.put(url, payload, { headers });

      if (type === 'frame') {
        setFrames(frames.map((f) => (f.id === id ? response.data : f)));
      } else if (type === 'user') {
        setUsers(users.map((u) => (u.id === id ? response.data : u)));
      } else if (type === 'category') {
        setCategories(categories.map((c) => (c.id === id ? response.data : c)));
      } else if (type === 'mackboard') {
        setMackBoards(mackBoards.map((m) => (m.id === id ? response.data : m)));
      } else if (type === 'mackboard_color') {
        const mackBoardsResponse = await axios.get('http://82.180.146.4:8001/mack_boards/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMackBoards(mackBoardsResponse.data);
      } else if (type === 'mug') {
        setMugs(mugs.map((m) => (m.id === id ? response.data : m)));
      } else if (type === 'cap') {
        setCaps(caps.map((c) => (c.id === id ? response.data : c)));
      } else if (type === 'tshirt') {
        setTshirts(tshirts.map((t) => (t.id === id ? response.data : t)));
      } else if (type === 'tshirt_color' || type === 'tshirt_size') {
        const tshirtsResponse = await axios.get('http://82.180.146.4:8001/tshirts/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTshirts(tshirtsResponse.data);
      } else if (type === 'tile') {
        setTiles(tiles.map((t) => (t.id === id ? response.data : t)));
      } else if (type === 'pen') {
        setPens(pens.map((p) => (p.id === id ? response.data : p)));
      } else if (type === 'printtype') {
        setPrintTypes(printTypes.map((p) => (p.id === id ? response.data : p)));
      } else if (type === 'printsize') {
        setPrintSizes(printSizes.map((p) => (p.id === id ? response.data : p)));
      } else if (type === 'papertype') {
        setPaperTypes(paperTypes.map((p) => (p.id === id ? response.data : p)));
      } else if (type === 'laminationtype') {
        setLaminationTypes(laminationTypes.map((l) => (l.id === id ? response.data : l)));
      } else if (type === 'photobookpaper') {
        setPhotoBookPapers(photoBookPapers.map((p) => (p.id === id ? response.data : p)));
      }
      else {
        const framesResponse = await axios.get('http://82.180.146.4:8001/frames/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFrames(framesResponse.data);
      }

      handleCloseModal();
      alert('Update successful');
    } catch (err) {
      console.error('Update error:', err);
      if (err.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            headers['Authorization'] = `Bearer ${newToken}`;
            const response = await axios.put(url, payload, { headers });
            if (type === 'frame') {
              setFrames(frames.map((f) => (f.id === id ? response.data : f)));
            } else if (type === 'user') {
              setUsers(users.map((u) => (u.id === id ? response.data : u)));
            } else if (type === 'category') {
              setCategories(categories.map((c) => (c.id === id ? response.data : c)));
            } else if (type === 'mackboard') {
              setMackBoards(mackBoards.map((m) => (m.id === id ? response.data : m)));
            } else if (type === 'mackboard_color') {
              const mackBoardsResponse = await axios.get('http://82.180.146.4:8001/mack_boards/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setMackBoards(mackBoardsResponse.data);
            } else if (type === 'mug') {
              setMugs(mugs.map((m) => (m.id === id ? response.data : m)));
            } else if (type === 'cap') {
              setCaps(caps.map((c) => (c.id === id ? response.data : c)));
            } else if (type === 'tshirt') {
              setTshirts(tshirts.map((t) => (t.id === id ? response.data : t)));
            } else if (type === 'tshirt_color' || type === 'tshirt_size') {
              const tshirtsResponse = await axios.get('http://82.180.146.4:8001/tshirts/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setTshirts(tshirtsResponse.data);
            } else if (type === 'tile') {
              setTiles(tiles.map((t) => (t.id === id ? response.data : t)));
            } else if (type === 'pen') {
              setPens(pens.map((p) => (p.id === id ? response.data : p)));
            } else if (type === 'printtype') {
              setPrintTypes(printTypes.map((p) => (p.id === id ? response.data : p)));
            } else if (type === 'printsize') {
              setPrintSizes(printSizes.map((p) => (p.id === id ? response.data : p)));
            } else if (type === 'papertype') {
              setPaperTypes(paperTypes.map((p) => (p.id === id ? response.data : p)));
            } else if (type === 'laminationtype') {
              setLaminationTypes(laminationTypes.map((l) => (l.id === id ? response.data : l)));
            } else {
              const framesResponse = await axios.get('http://82.180.146.4:8001/frames/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setFrames(framesResponse.data);
            }
            handleCloseModal();
            alert('Update successful');
          } catch (retryErr) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else {
        alert('Failed to update: ' + (err.response?.data?.detail || err.response?.data?.board_name?.[0] || err.message));
      }
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    let token = localStorage.getItem('token');
    let url;

    switch (type) {
      case 'frame':
        url = `http://82.180.146.4:8001/frames/${id}/`;
        break;
      case 'color':
        url = `http://82.180.146.4:8001/variants/color/${id}/`;
        break;
      case 'size':
        url = `http://82.180.146.4:8001/variants/size/${id}/`;
        break;
      case 'finish':
        url = `http://82.180.146.4:8001/variants/finish/${id}/`;
        break;
      case 'hanging':
        url = `http://82.180.146.4:8001/variants/hanging/${id}/`;
        break;
      case 'user':
        url = `http://82.180.146.4:8001/users/${id}/`;
        break;
      case 'category':
        url = `http://82.180.146.4:8001/categories/${id}/`;
        break;
      case 'mackboard':
        url = `http://82.180.146.4:8001/mack_boards/${id}/`;
        break;
      case 'mackboard_color':
        url = `http://82.180.146.4:8001/mack_board_color_variants/${id}/`;
        break;
      case 'mug':
        url = `http://82.180.146.4:8001/mugs/${id}/`;
        break;
      case 'cap':
        url = `http://82.180.146.4:8001/caps/${id}/`;
        break;
      case 'tshirt':
        url = `http://82.180.146.4:8001/tshirts/${id}/`;
        break;
      case 'tshirt_color':
        url = `http://82.180.146.4:8001/tshirt_color_variants/${id}/`;
        break;
      case 'tshirt_size':
        url = `http://82.180.146.4:8001/tshirt_size_variants/${id}/`;
        break;
      case 'tile':
        url = `http://82.180.146.4:8001/tiles/${id}/`;
        break;
      case 'pen':
        url = `http://82.180.146.4:8001/pens/${id}/`;
        break;
      case 'printtype':
        url = `http://82.180.146.4:8001/api/print-types/${id}/`;
        break;
      case 'printsize':
        url = `http://82.180.146.4:8001/api/print-sizes/${id}/`;
        break;
      case 'papertype':
        url = `http://82.180.146.4:8001/api/paper-types/${id}/`;
        break;
      case 'laminationtype':
        url = `http://82.180.146.4:8001/api/lamination-types/${id}/`;
        break;
      case 'frameOrder':
        url = `http://82.180.146.4:8001/save-items/${id}/`;
        break;
      case 'giftOrder':
        url = `http://82.180.146.4:8001/gift-orders/${id}/`;
        break;
      case 'documentOrder':
        url = `http://82.180.146.4:8001/api/document-print-orders/${id}/`;
        break;
      case 'simpleDocumentOrder':
        url = `http://82.180.146.4:8001/api/orders/${id}/`;
        break;
      case 'theme':
        url = `http://82.180.146.4:8001/themes/${id}/`;
        break;
      case 'background':
        url = `http://82.180.146.4:8001/backgrounds/${id}/`;
        break;
      case 'sticker':
        url = `http://82.180.146.4:8001/stickers/${id}/`;
        break;
      case 'photobookpaper':
        url = `http://82.180.146.4:8001/photobook-papers/${id}/`;
        break;
      default:
        return;
    }

    try {
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }

      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (type === 'frame') {
        setFrames(frames.filter((f) => f.id !== id));
      } else if (type === 'user') {
        setUsers(users.filter((u) => u.id !== id));
      } else if (type === 'category') {
        setCategories(categories.filter((c) => c.id !== id));
      } else if (type === 'mackboard') {
        setMackBoards(mackBoards.filter((m) => m.id !== id));
      } else if (type === 'mackboard_color') {
        const mackBoardsResponse = await axios.get('http://82.180.146.4:8001/mack_boards/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMackBoards(mackBoardsResponse.data);
      } else if (type === 'mug') {
        setMugs(mugs.filter((m) => m.id !== id));
      } else if (type === 'cap') {
        setCaps(caps.filter((c) => c.id !== id));
      } else if (type === 'tshirt') {
        setTshirts(tshirts.filter((t) => t.id !== id));
      } else if (type === 'tshirt_color' || type === 'tshirt_size') {
        const tshirtsResponse = await axios.get('http://82.180.146.4:8001/tshirts/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTshirts(tshirtsResponse.data);
      } else if (type === 'tile') {
        setTiles(tiles.filter((t) => t.id !== id));
      } else if (type === 'pen') {
        setPens(pens.filter((p) => p.id !== id));
      } else if (type === 'printtype') {
        setPrintTypes(printTypes.filter((p) => p.id !== id));
      } else if (type === 'printsize') {
        setPrintSizes(printSizes.filter((p) => p.id !== id));
      } else if (type === 'papertype') {
        setPaperTypes(paperTypes.filter((p) => p.id !== id));
      } else if (type === 'laminationtype') {
        setLaminationTypes(laminationTypes.filter((l) => l.id !== id));
      } else if (type === 'frameOrder') {
        setFrameOrders(frameOrders.filter((o) => o.id !== id));
      } else if (type === 'giftOrder') {
        setGiftOrders(giftOrders.filter((o) => o.id !== id));
      } else if (type === 'documentOrder') {
        setDocumentOrders(documentOrders.filter((o) => o.id !== id));
      } else if (type === 'simpleDocumentOrder') {
        setSimpleDocumentOrders(simpleDocumentOrders.filter((o) => o.id !== id));
      }
      else if (type === 'theme') {
        setThemes(themes.filter((t) => t.id !== id));
      } else if (type === 'background') {
        setBackgrounds(backgrounds.filter((b) => b.id !== id));
        // Refresh themes
        const themesResponse = await axios.get('http://82.180.146.4:8001/themes/', { headers: { Authorization: `Bearer ${token}` } });
        setThemes(themesResponse.data);
      } else if (type === 'sticker') {
        setStickers(stickers.filter((s) => s.id !== id));
        // Refresh themes
        const themesResponse = await axios.get('http://82.180.146.4:8001/themes/', { headers: { Authorization: `Bearer ${token}` } });
        setThemes(themesResponse.data);
      }
      else if (type === 'photobookpaper') {
        setPhotoBookPapers(photoBookPapers.filter((p) => p.id !== id));
      } else {
        const framesResponse = await axios.get('http://82.180.146.4:8001/frames/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFrames(framesResponse.data);
      }

      handleCloseModal();
      alert('Delete successful');
    } catch (err) {
      console.error('Delete error:', err);
      if (err.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            await axios.delete(url, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            if (type === 'frame') {
              setFrames(frames.filter((f) => f.id !== id));
            } else if (type === 'user') {
              setUsers(users.filter((u) => u.id !== id));
            } else if (type === 'category') {
              setCategories(categories.filter((c) => c.id !== id));
            } else if (type === 'mackboard') {
              setMackBoards(mackBoards.filter((m) => m.id !== id));
            } else if (type === 'mackboard_color') {
              const mackBoardsResponse = await axios.get('http://82.180.146.4:8001/mack_boards/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setMackBoards(mackBoardsResponse.data);
            } else if (type === 'mug') {
              setMugs(mugs.filter((m) => m.id !== id));
            } else if (type === 'cap') {
              setCaps(caps.filter((c) => c.id !== id));
            } else if (type === 'tshirt') {
              setTshirts(tshirts.filter((t) => t.id !== id));
            } else if (type === 'tshirt_color' || type === 'tshirt_size') {
              const tshirtsResponse = await axios.get('http://82.180.146.4:8001/tshirts/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setTshirts(tshirtsResponse.data);
            } else if (type === 'tile') {
              setTiles(tiles.filter((t) => t.id !== id));
            } else if (type === 'pen') {
              setPens(pens.filter((p) => p.id !== id));
            } else if (type === 'printtype') {
              setPrintTypes(printTypes.filter((p) => p.id !== id));
            } else if (type === 'printsize') {
              setPrintSizes(printSizes.filter((p) => p.id !== id));
            } else if (type === 'papertype') {
              setPaperTypes(paperTypes.filter((p) => p.id !== id));
            } else if (type === 'laminationtype') {
              setLaminationTypes(laminationTypes.filter((l) => l.id !== id));
            } else if (type === 'frameOrder') {
              setFrameOrders(frameOrders.filter((o) => o.id !== id));
            } else if (type === 'giftOrder') {
              setGiftOrders(giftOrders.filter((o) => o.id !== id));
            } else if (type === 'documentOrder') {
              setDocumentOrders(documentOrders.filter((o) => o.id !== id));
            } else if (type === 'simpleDocumentOrder') {
              setSimpleDocumentOrders(simpleDocumentOrders.filter((o) => o.id !== id));
            } else {
              const framesResponse = await axios.get('http://82.180.146.4:8001/frames/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setFrames(framesResponse.data);
            }
            handleCloseModal();
            alert('Delete successful');
          } catch (retryErr) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else {
        alert('Failed to delete item: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const getTabIcon = (tabName) => {
    switch (tabName) {
      case 'frames': return <Package className="framedetails-tab-icon" />;
      case 'users': return <Users className="framedetails-tab-icon" />;
      case 'categories': return <Tag className="framedetails-tab-icon" />;
      case 'mackboards': return <Grid className="framedetails-tab-icon" />;
      case 'mugs': return <Coffee className="framedetails-tab-icon" />;
      case 'caps': return <Crown className="framedetails-tab-icon" />;
      case 'tshirts': return <Shirt className="framedetails-tab-icon" />;
      case 'tiles': return <Square className="framedetails-tab-icon" />;
      case 'pens': return <Pen className="framedetails-tab-icon" />;
      case 'printtypes': return <Printer className="framedetails-tab-icon" />;
      case 'printsizes': return <Ruler className="framedetails-tab-icon" />;
      case 'papertypes': return <FileText className="framedetails-tab-icon" />;
      case 'laminationtypes': return <Layers className="framedetails-tab-icon" />;
      case 'frameOrders': return <ShoppingCart className="framedetails-tab-icon" />;
      case 'giftOrders': return <Gift className="framedetails-tab-icon" />;
      case 'simpleDocumentOrders': return <FileText className="framedetails-tab-icon" />;
      case 'themes': return <Palette className="framedetails-tab-icon" />;
      case 'photobookpapers': return <FileText className="framedetails-tab-icon" />;
      default: return <Package className="framedetails-tab-icon" />;
    }
  };

  if (loading) {
    return (
      <div className="framedetails-loading-container">
        <div className="framedetails-loading-content">
          <Loader2 className="framedetails-loading-spinner" />
          <p className="framedetails-loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="framedetails-error-container">
        <div className="framedetails-error-content">
          <AlertCircle className="framedetails-error-icon" />
          <h3 className="framedetails-error-title">Error</h3>
          <p className="framedetails-error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="framedetails-container">
      <div className="framedetails-wrapper">
        {/* Sidebar */}
        <div className="framedetails-sidebar">
          <div className="framedetails-sidebar-header">
            <h2 className="framedetails-sidebar-title">Admin Dashboard</h2>
            <p className="framedetails-sidebar-subtitle">Manage your store</p>
          </div>
          <nav className="framedetails-nav">
            <button
              className={`framedetails-nav-item ${activeTab === 'frames' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('frames')}
            >
              {getTabIcon('frames')}
              <span>Frames</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'users' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              {getTabIcon('users')}
              <span>Users</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'categories' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              {getTabIcon('categories')}
              <span>Categories</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'mackboards' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('mackboards')}
            >
              {getTabIcon('mackboards')}
              <span>MatBoards</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'mugs' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('mugs')}
            >
              {getTabIcon('mugs')}
              <span>Mugs</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'caps' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('caps')}
            >
              {getTabIcon('caps')}
              <span>Caps</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'tshirts' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('tshirts')}
            >
              {getTabIcon('tshirts')}
              <span>T-shirts</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'tiles' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('tiles')}
            >
              {getTabIcon('tiles')}
              <span>Tiles</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'pens' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('pens')}
            >
              {getTabIcon('pens')}
              <span>Pens</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'printtypes' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('printtypes')}
            >
              {getTabIcon('printtypes')}
              <span>Print Types</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'printsizes' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('printsizes')}
            >
              {getTabIcon('printsizes')}
              <span>Print Sizes</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'papertypes' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('papertypes')}
            >
              {getTabIcon('papertypes')}
              <span>Paper Types</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'laminationtypes' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('laminationtypes')}
            >
              {getTabIcon('laminationtypes')}
              <span>Lamination Types</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'frameOrders' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('frameOrders')}
            >
              {getTabIcon('frameOrders')}
              <span>Frame Orders</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'giftOrders' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('giftOrders')}
            >
              {getTabIcon('giftOrders')}
              <span>Gift Orders</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'simpleDocumentOrders' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('simpleDocumentOrders')}
            >
              {getTabIcon('simpleDocumentOrders')}
              <span>Document Orders</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'themes' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('themes')}
            >
              {getTabIcon('themes')}
              <span>Themes</span>
            </button>
            <button
              className={`framedetails-nav-item ${activeTab === 'photobookpapers' ? 'framedetails-nav-item-active' : ''}`}
              onClick={() => setActiveTab('photobookpapers')}
            >
              {getTabIcon('photobookpapers')}
              <span>Photo Book Papers</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="framedetails-main">
          <div className="framedetails-content-card">
            {activeTab === 'frames' && (
              <div>
                <div className="framedetails-section-header">
                  <Package className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Frame Details</h2>
                </div>
                {frames.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Package className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No frames available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Image</th>
                            <th>Corner Image</th>
                            <th>Dimensions</th>
                            <th>Category</th>
                            <th>Created By</th>
                            <th>Created At</th>
                            <th>Color Variants</th>
                            <th>Size Variants</th>
                            <th>Finishing Variants</th>
                            <th>Hanging Variants</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {frames.map((frame) => (
                            <tr key={frame.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{frame.name}</td>
                              <td className="framedetails-price-cell">${frame.price}</td>
                              <td>
                                <img
                                  src={getImageUrl(frame.image)}
                                  alt={frame.name}
                                  className="framedetails-image"
                                  onError={handleImageError}
                                />
                              </td>
                              <td>
                                {frame.corner_image ? (
                                  <img
                                    src={getImageUrl(frame.corner_image)}
                                    alt={`${frame.name} corner`}
                                    className="framedetails-image"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span className="framedetails-no-data">No corner image</span>
                                )}
                              </td>
                              <td className="framedetails-dimensions">
                                {frame.inner_width} x {frame.inner_height}
                              </td>
                              <td>{frame.category?.frameCategory || 'None'}</td>
                              <td>
                                {frame.created_by
                                  ? frame.created_by.name || frame.created_by.username || 'Unknown'
                                  : 'Unknown'}
                              </td>
                              <td>{new Date(frame.created_at).toLocaleDateString()}</td>
                              <td>
                                <div className="framedetails-variants-list">
                                  {frame.color_variants.map((variant) => (
                                    <div key={variant.id} className="framedetails-variant-item">
                                      <span className="framedetails-variant-name">{variant.color_name}</span>
                                      <img
                                        src={getImageUrl(variant.image)}
                                        alt={variant.color_name}
                                        className="framedetails-variant-image"
                                        onError={handleImageError}
                                      />
                                      {variant.corner_image && (
                                        <img
                                          src={getImageUrl(variant.corner_image)}
                                          alt={`${variant.color_name} corner`}
                                          className="framedetails-variant-image"
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="framedetails-variant-edit-btn"
                                        onClick={() => handleSelectItem(variant, 'color')}
                                      >
                                        <Edit className="framedetails-btn-icon" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div className="framedetails-variants-list">
                                  {frame.size_variants.map((variant) => (
                                    <div key={variant.id} className="framedetails-variant-item">
                                      <span className="framedetails-variant-name">{variant.size_name}</span>
                                      {variant.image && (
                                        <img
                                          src={getImageUrl(variant.image)}
                                          alt={variant.size_name}
                                          className="framedetails-variant-image"
                                          onError={handleImageError}
                                        />
                                      )}
                                      {variant.corner_image && (
                                        <img
                                          src={getImageUrl(variant.corner_image)}
                                          alt={`${variant.size_name} corner`}
                                          className="framedetails-variant-image"
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="framedetails-variant-edit-btn"
                                        onClick={() => handleSelectItem(variant, 'size')}
                                      >
                                        <Edit className="framedetails-btn-icon" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div className="framedetails-variants-list">
                                  {frame.finishing_variants.map((variant) => (
                                    <div key={variant.id} className="framedetails-variant-item">
                                      <span className="framedetails-variant-name">{variant.finish_name}</span>
                                      <img
                                        src={getImageUrl(variant.image)}
                                        alt={variant.finish_name}
                                        className="framedetails-variant-image"
                                        onError={handleImageError}
                                      />
                                      {variant.corner_image && (
                                        <img
                                          src={getImageUrl(variant.corner_image)}
                                          alt={`${variant.finish_name} corner`}
                                          className="framedetails-variant-image"
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="framedetails-variant-edit-btn"
                                        onClick={() => handleSelectItem(variant, 'finish')}
                                      >
                                        <Edit className="framedetails-btn-icon" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div className="framedetails-variants-list">
                                  {frame.frameHanging_variant.map((variant) => (
                                    <div key={variant.id} className="framedetails-variant-item">
                                      <span className="framedetails-variant-name">{variant.hanging_name}</span>
                                      <img
                                        src={getImageUrl(variant.image)}
                                        alt={variant.hanging_name}
                                        className="framedetails-variant-image"
                                        onError={handleImageError}
                                      />
                                      <button
                                        className="framedetails-variant-edit-btn"
                                        onClick={() => handleSelectItem(variant, 'hanging')}
                                      >
                                        <Edit className="framedetails-btn-icon" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(frame, 'frame')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="framedetails-section-header">
                  <Users className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Registered Users</h2>
                </div>
                {users.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Users className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No users available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Blocked</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{user.username}</td>
                              <td>{user.email || 'N/A'}</td>
                              <td>{user.name || 'N/A'}</td>
                              <td>{user.phone || 'N/A'}</td>
                              <td>
                                <span className={`framedetails-role-badge ${user.is_staff ? 'framedetails-role-admin' : user.is_user ? 'framedetails-role-user' : 'framedetails-role-employee'}`}>
                                  {user.is_staff ? 'Admin' : user.is_user ? 'User' : 'Employee'}
                                </span>
                              </td>
                              <td>
                                <span className={`framedetails-status-badge ${user.is_blocked ? 'framedetails-status-blocked' : 'framedetails-status-active'}`}>
                                  {user.is_blocked ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(user, 'user')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'categories' && (
              <div>
                <div className="framedetails-section-header">
                  <Tag className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Frame Categories</h2>
                </div>
                {categories.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Tag className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No categories available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Category Name</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map((category) => (
                            <tr key={category.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{category.frameCategory}</td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(category, 'category')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mackboards' && (
              <div>
                <div className="framedetails-section-header">
                  <Grid className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">MatBoards</h2>
                </div>
                {mackBoards.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Grid className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No MatBoards available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Board Name</th>
                            <th>Image</th>
                            <th>Price</th>
                            <th>Color Variants</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mackBoards.map((mackBoard) => (
                            <tr key={mackBoard.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{mackBoard.board_name}</td>
                              <td>
                                {mackBoard.image ? (
                                  <img
                                    src={getImageUrl(mackBoard.image)}
                                    alt={mackBoard.board_name}
                                    className="framedetails-image"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span className="framedetails-no-data">No image</span>
                                )}
                              </td>
                              <td className="framedetails-price-cell">${mackBoard.price || 'N/A'}</td>
                              <td>
                                <div className="framedetails-variants-list">
                                  {mackBoard.color_variants.map((variant) => (
                                    <div key={variant.id} className="framedetails-variant-item">
                                      <span className="framedetails-variant-name">{variant.color_name}</span>
                                      {variant.image && (
                                        <img
                                          src={getImageUrl(variant.image)}
                                          alt={variant.color_name}
                                          className="framedetails-variant-image"
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="framedetails-variant-edit-btn"
                                        onClick={() => handleSelectItem(variant, 'mackboard_color')}
                                      >
                                        <Edit className="framedetails-btn-icon" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(mackBoard, 'mackboard')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mugs' && (
              <div>
                <div className="framedetails-section-header">
                  <Coffee className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Mugs</h2>
                </div>
                {mugs.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Coffee className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No mugs available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Mug Name</th>
                            <th>Image</th>
                            <th>GLB File</th>
                            <th>Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mugs.map((mug) => (
                            <tr key={mug.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{mug.mug_name}</td>
                              <td>
                                {mug.image ? (
                                  <img
                                    src={getImageUrl(mug.image)}
                                    alt={mug.mug_name}
                                    className="framedetails-image"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span className="framedetails-no-data">No image</span>
                                )}
                              </td>
                              <td>
                                {mug.glb_file ? (
                                  <a href={getImageUrl(mug.glb_file)} target="_blank" rel="noopener noreferrer" className="framedetails-file-link">
                                    View GLB
                                  </a>
                                ) : (
                                  <span className="framedetails-no-data">No GLB file</span>
                                )}
                              </td>
                              <td className="framedetails-price-cell">${mug.price || 'N/A'}</td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(mug, 'mug')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'caps' && (
              <div>
                <div className="framedetails-section-header">
                  <Crown className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Caps</h2>
                </div>
                {caps.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Crown className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No caps available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Cap Name</th>
                            <th>Image</th>
                            <th>Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caps.map((cap) => (
                            <tr key={cap.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{cap.cap_name}</td>
                              <td>
                                {cap.image ? (
                                  <img
                                    src={getImageUrl(cap.image)}
                                    alt={cap.cap_name}
                                    className="framedetails-image"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span className="framedetails-no-data">No image</span>
                                )}
                              </td>
                              <td className="framedetails-price-cell">${cap.price || 'N/A'}</td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(cap, 'cap')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tshirts' && (
              <div>
                <div className="framedetails-section-header">
                  <Shirt className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">T-shirt Details</h2>
                </div>
                {tshirts.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Shirt className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No t-shirts available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Name</th>
                            <th>Image</th>
                            <th>Created By</th>
                            <th>Created At</th>
                            <th>Color Variants</th>
                            <th>Size Variants</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tshirts.map((tshirt) => (
                            <tr key={tshirt.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{tshirt.tshirt_name}</td>
                              <td>
                                {tshirt.image ? (
                                  <img
                                    src={getImageUrl(tshirt.image)}
                                    alt={tshirt.tshirt_name}
                                    className="framedetails-image"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span className="framedetails-no-data">No image</span>
                                )}
                              </td>
                              <td>
                                {tshirt.created_by
                                  ? tshirt.created_by.name || tshirt.created_by.username || 'Unknown'
                                  : 'Unknown'}
                              </td>
                              <td>{new Date(tshirt.created_at).toLocaleDateString()}</td>
                              <td>
                                <div className="framedetails-variants-list">
                                  {tshirt.color_variants.map((variant) => (
                                    <div key={variant.id} className="framedetails-variant-item">
                                      <span className="framedetails-variant-name">{variant.color_name}</span>
                                      {variant.image && (
                                        <img
                                          src={getImageUrl(variant.image)}
                                          alt={variant.color_name}
                                          className="framedetails-variant-image"
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="framedetails-variant-edit-btn"
                                        onClick={() => handleSelectItem(variant, 'tshirt_color')}
                                      >
                                        <Edit className="framedetails-btn-icon" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div className="framedetails-variants-list">
                                  {tshirt.size_variants.map((variant) => (
                                    <div key={variant.id} className="framedetails-variant-item">
                                      <span className="framedetails-variant-name">{variant.size_name}</span>
                                      {variant.image && (
                                        <img
                                          src={getImageUrl(variant.image)}
                                          alt={variant.size_name}
                                          className="framedetails-variant-image"
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="framedetails-variant-edit-btn"
                                        onClick={() => handleSelectItem(variant, 'tshirt_size')}
                                      >
                                        <Edit className="framedetails-btn-icon" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(tshirt, 'tshirt')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tiles' && (
              <div>
                <div className="framedetails-section-header">
                  <Square className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Tiles</h2>
                </div>
                {tiles.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Square className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No tiles available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Tile Name</th>
                            <th>Image</th>
                            <th>Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tiles.map((tile) => (
                            <tr key={tile.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{tile.tile_name}</td>
                              <td>
                                {tile.image ? (
                                  <img
                                    src={getImageUrl(tile.image)}
                                    alt={tile.tile_name}
                                    className="framedetails-image"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span className="framedetails-no-data">No image</span>
                                )}
                              </td>
                              <td className="framedetails-price-cell">${tile.price || 'N/A'}</td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(tile, 'tile')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pens' && (
              <div>
                <div className="framedetails-section-header">
                  <Pen className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Pens</h2>
                </div>
                {pens.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Pen className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No pens available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Pen Name</th>
                            <th>Image</th>
                            <th>Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pens.map((pen) => (
                            <tr key={pen.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{pen.pen_name}</td>
                              <td>
                                {pen.image ? (
                                  <img
                                    src={getImageUrl(pen.image)}
                                    alt={pen.pen_name}
                                    className="framedetails-image"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span className="framedetails-no-data">No image</span>
                                )}
                              </td>
                              <td className="framedetails-price-cell">${pen.price || 'N/A'}</td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(pen, 'pen')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'printtypes' && (
              <div>
                <div className="framedetails-section-header">
                  <Printer className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Print Types</h2>
                </div>
                {printTypes.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Printer className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No print types available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printTypes.map((printType) => (
                            <tr key={printType.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{printType.name}</td>
                              <td className="framedetails-price-cell">${printType.price}</td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(printType, 'printtype')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'printsizes' && (
              <div>
                <div className="framedetails-section-header">
                  <Ruler className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Print Sizes</h2>
                </div>
                {printSizes.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Ruler className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No print sizes available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printSizes.map((printSize) => (
                            <tr key={printSize.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{printSize.name}</td>
                              <td className="framedetails-price-cell">${printSize.price}</td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(printSize, 'printsize')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'papertypes' && (
              <div>
                <div className="framedetails-section-header">
                  <FileText className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Paper Types</h2>
                </div>
                {paperTypes.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <FileText className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No paper types available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paperTypes.map((paperType) => (
                            <tr key={paperType.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{paperType.name}</td>
                              <td className="framedetails-price-cell">${paperType.price}</td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(paperType, 'papertype')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'laminationtypes' && (
              <div>
                <div className="framedetails-section-header">
                  <Layers className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Lamination Types</h2>
                </div>
                {laminationTypes.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Layers className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No lamination types available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {laminationTypes.map((laminationType) => (
                            <tr key={laminationType.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{laminationType.name}</td>
                              <td className="framedetails-price-cell">${laminationType.price}</td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(laminationType, 'laminationtype')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'frameOrders' && (
              <div>
                <div className="framedetails-section-header">
                  <ShoppingCart className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Frame Orders</h2>
                </div>
                {frameOrders.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <ShoppingCart className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No frame orders available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Total Price</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {frameOrders.map((order) => (
                            <tr key={order.id} className="framedetails-table-row">
                              <td className="framedetails-id-cell">{order.id}</td>
                              <td>{order.user.username}</td>
                              <td className="framedetails-price-cell">${order.total_price}</td>
                              <td>
                                <span className={`framedetails-status-badge framedetails-status-${order.status.toLowerCase()}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td>{new Date(order.created_at).toLocaleString()}</td>
                              <td>
                                <div className="framedetails-action-group">
                                  <button
                                    className="framedetails-action-btn framedetails-view-btn"
                                    onClick={() => handleSelectItem(order, 'frameOrder')}
                                  >
                                    <Edit className="framedetails-btn-icon" />
                                    View
                                  </button>
                                  <button
                                    className="framedetails-action-btn framedetails-delete-btn"
                                    onClick={() => handleDelete(order.id, 'frameOrder')}
                                  >
                                    <Trash2 className="framedetails-btn-icon" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'giftOrders' && (
              <div>
                <div className="framedetails-section-header">
                  <Gift className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Gift Orders</h2>
                </div>
                {giftOrders.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Gift className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No gift orders available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Total Price</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {giftOrders.map((order) => (
                            <tr key={order.id} className="framedetails-table-row">
                              <td className="framedetails-id-cell">{order.id}</td>
                              <td>{order.user.username}</td>
                              <td className="framedetails-price-cell">${order.total_price}</td>
                              <td>
                                <span className={`framedetails-status-badge framedetails-status-${order.status.toLowerCase()}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td>{new Date(order.created_at).toLocaleString()}</td>
                              <td>
                                <div className="framedetails-action-group">
                                  <button
                                    className="framedetails-action-btn framedetails-view-btn"
                                    onClick={() => handleSelectItem(order, 'giftOrder')}
                                  >
                                    <Edit className="framedetails-btn-icon" />
                                    View
                                  </button>
                                  <button
                                    className="framedetails-action-btn framedetails-delete-btn"
                                    onClick={() => handleDelete(order.id, 'giftOrder')}
                                  >
                                    <Trash2 className="framedetails-btn-icon" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'simpleDocumentOrders' && (
              <div>
                <div className="framedetails-section-header">
                  <FileText className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Simple Document Orders</h2>
                </div>
                {simpleDocumentOrders.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <FileText className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No simple document orders available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simpleDocumentOrders.map((order) => (
                            <tr key={order.id} className="framedetails-table-row">
                              <td className="framedetails-id-cell">{order.id}</td>
                              <td>{order.user.username}</td>
                              <td className="framedetails-price-cell">${order.total_amount}</td>
                              <td>
                                <span className={`framedetails-status-badge framedetails-status-${order.status.toLowerCase()}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td>{new Date(order.created_at).toLocaleString()}</td>
                              <td>
                                <div className="framedetails-action-group">
                                  <button
                                    className="framedetails-action-btn framedetails-view-btn"
                                    onClick={() => handleSelectItem(order, 'simpleDocumentOrder')}
                                  >
                                    <Edit className="framedetails-btn-icon" />
                                    View
                                  </button>
                                  <button
                                    className="framedetails-action-btn framedetails-delete-btn"
                                    onClick={() => handleDelete(order.id, 'simpleDocumentOrder')}
                                  >
                                    <Trash2 className="framedetails-btn-icon" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'themes' && (
              <div>
                <div className="framedetails-section-header">
                  <Palette className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Theme Details</h2>
                </div>
                {themes.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <Palette className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No themes available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Name</th>
                            <th>Created At</th>
                            <th>Backgrounds</th>
                            <th>Stickers</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {themes.map((theme) => (
                            <tr key={theme.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{theme.theme_name}</td>
                              <td>{new Date(theme.created_at).toLocaleDateString()}</td>
                              <td>
                                <div className="framedetails-variants-list">
                                  {theme.backgrounds.map((bg) => (
                                    <div key={bg.id} className="framedetails-variant-item">
                                      <span className="framedetails-variant-name">{bg.name}</span>
                                      <img
                                        src={getImageUrl(bg.image)}
                                        alt={bg.name}
                                        className="framedetails-variant-image"
                                        onError={handleImageError}
                                      />
                                      <button
                                        className="framedetails-variant-edit-btn"
                                        onClick={() => handleSelectItem(bg, 'background')}
                                      >
                                        <Edit className="framedetails-btn-icon" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div className="framedetails-variants-list">
                                  {theme.stickers.map((sticker) => (
                                    <div key={sticker.id} className="framedetails-variant-item">
                                      <span className="framedetails-variant-name">{sticker.name}</span>
                                      <img
                                        src={getImageUrl(sticker.image)}
                                        alt={sticker.name}
                                        className="framedetails-variant-image"
                                        onError={handleImageError}
                                      />
                                      <button
                                        className="framedetails-variant-edit-btn"
                                        onClick={() => handleSelectItem(sticker, 'sticker')}
                                      >
                                        <Edit className="framedetails-btn-icon" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(theme, 'theme')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'photobookpapers' && (
              <div>
                <div className="framedetails-section-header">
                  <FileText className="framedetails-section-icon" />
                  <h2 className="framedetails-section-title">Photo Book Papers</h2>
                </div>
                {photoBookPapers.length === 0 ? (
                  <div className="framedetails-empty-state">
                    <FileText className="framedetails-empty-icon" />
                    <p className="framedetails-empty-text">No photo book papers available</p>
                  </div>
                ) : (
                  <div className="framedetails-table-container">
                    <div className="framedetails-table-wrapper">
                      <table className="framedetails-table">
                        <thead className="framedetails-table-header">
                          <tr>
                            <th>Size</th>
                            <th>Image</th>
                            <th>Price</th>
                            <th>Created At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {photoBookPapers.map((paper) => (
                            <tr key={paper.id} className="framedetails-table-row">
                              <td className="framedetails-name-cell">{paper.size}</td>
                              <td>
                                {paper.image ? (
                                  <img
                                    src={getImageUrl(paper.image)}
                                    alt={paper.size}
                                    className="framedetails-image"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span className="framedetails-no-data">No image</span>
                                )}
                              </td>
                              <td className="framedetails-price-cell">${paper.price}</td>
                              <td>{new Date(paper.created_at).toLocaleDateString()}</td>
                              <td>
                                <button
                                  className="framedetails-action-btn framedetails-edit-btn"
                                  onClick={() => handleSelectItem(paper, 'photobookpaper')}
                                >
                                  <Edit className="framedetails-btn-icon" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="framedetails-modal-overlay">
          <div className="framedetails-modal">
            <div className="framedetails-modal-header">
              <h3 className="framedetails-modal-title">
                {modalType === 'frame' && 'Frame Details'}
                {modalType === 'color' && 'Color Variant Details'}
                {modalType === 'size' && 'Size Variant Details'}
                {modalType === 'finish' && 'Finishing Variant Details'}
                {modalType === 'hanging' && 'Hanging Variant Details'}
                {modalType === 'user' && 'User Details'}
                {modalType === 'category' && 'Category Details'}
                {modalType === 'mackboard' && 'MackBoard Details'}
                {modalType === 'mackboard_color' && 'MackBoard Color Variant Details'}
                {modalType === 'mug' && 'Mug Details'}
                {modalType === 'cap' && 'Cap Details'}
                {modalType === 'tshirt' && 'Tshirt Details'}
                {modalType === 'tshirt_color' && 'Tshirt Color Variant Details'}
                {modalType === 'tshirt_size' && 'Tshirt Size Variant Details'}
                {modalType === 'tile' && 'Tile Details'}
                {modalType === 'pen' && 'Pen Details'}
                {modalType === 'printtype' && 'Print Type Details'}
                {modalType === 'printsize' && 'Print Size Details'}
                {modalType === 'papertype' && 'Paper Type Details'}
                {modalType === 'laminationtype' && 'Lamination Type Details'}
                {modalType === 'frameOrder' && 'Frame Order Details'}
                {modalType === 'giftOrder' && 'Gift Order Details'}
                {modalType === 'simpleDocumentOrder' && 'Simple Document Order Details'}
                {modalType === 'theme' && 'Theme Details'}
                {modalType === 'background' && 'Background Details'}
                {modalType === 'sticker' && 'Sticker Details'}
                {modalType === 'photobookpaper' && 'Photo Book Paper Details'}
              </h3>
              <button className="framedetails-modal-close" onClick={handleCloseModal}>
                <X className="framedetails-close-icon" />
              </button>
            </div>
            <div className="framedetails-modal-body">
              {modalType === 'frame' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'frame', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="name"
                      defaultValue={selectedItem.name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Category</label>
                    <select
                      className="framedetails-form-select"
                      name="category_id"
                      defaultValue={selectedItem.category?.id || ''}
                    >
                      <option value="">-- Select Category (Optional) --</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.frameCategory}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Corner Image</label>
                    <input type="file" className="framedetails-form-file" name="corner_image" accept="image/*" />
                    {selectedItem.corner_image && (
                      <img
                        src={getImageUrl(selectedItem.corner_image)}
                        alt={`${selectedItem.name} corner`}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-form-row">
                    <div className="framedetails-form-group">
                      <label className="framedetails-form-label">Inner Width</label>
                      <input
                        type="number"
                        className="framedetails-form-input"
                        name="inner_width"
                        defaultValue={selectedItem.inner_width}
                        step="0.1"
                        required
                      />
                    </div>
                    <div className="framedetails-form-group">
                      <label className="framedetails-form-label">Inner Height</label>
                      <input
                        type="number"
                        className="framedetails-form-input"
                        name="inner_height"
                        defaultValue={selectedItem.inner_height}
                        step="0.1"
                        required
                      />
                    </div>
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'frame')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'color' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'color', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Color Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="color_name"
                      defaultValue={selectedItem.color_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.color_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Corner Image</label>
                    <input type="file" className="framedetails-form-file" name="corner_image" accept="image/*" />
                    {selectedItem.corner_image && (
                      <img
                        src={getImageUrl(selectedItem.corner_image)}
                        alt={`${selectedItem.color_name} corner`}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'color')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'size' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'size', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Size Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="size_name"
                      defaultValue={selectedItem.size_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-row">
                    <div className="framedetails-form-group">
                      <label className="framedetails-form-label">Inner Width</label>
                      <input
                        type="number"
                        className="framedetails-form-input"
                        name="inner_width"
                        defaultValue={selectedItem.inner_width}
                        required
                      />
                    </div>
                    <div className="framedetails-form-group">
                      <label className="framedetails-form-label">Inner Height</label>
                      <input
                        type="number"
                        className="framedetails-form-input"
                        name="inner_height"
                        defaultValue={selectedItem.inner_height}
                        required
                      />
                    </div>
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.size_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Corner Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="corner_image" accept="image/*" />
                    {selectedItem.corner_image && (
                      <img
                        src={getImageUrl(selectedItem.corner_image)}
                        alt={`${selectedItem.size_name} corner`}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'size')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'finish' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'finish', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Finish Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="finish_name"
                      defaultValue={selectedItem.finish_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.finish_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Corner Image</label>
                    <input type="file" className="framedetails-form-file" name="corner_image" accept="image/*" />
                    {selectedItem.corner_image && (
                      <img
                        src={getImageUrl(selectedItem.corner_image)}
                        alt={`${selectedItem.finish_name} corner`}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'finish')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'hanging' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'hanging', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Hanging Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="hanging_name"
                      defaultValue={selectedItem.hanging_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.hanging_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'hanging')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'user' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'user', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Username</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="username"
                      defaultValue={selectedItem.username}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Email</label>
                    <input
                      type="email"
                      className="framedetails-form-input"
                      name="email"
                      defaultValue={selectedItem.email}
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="name"
                      defaultValue={selectedItem.name}
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Phone</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="phone"
                      defaultValue={selectedItem.phone}
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Blocked</label>
                    <select
                      className="framedetails-form-select"
                      name="is_blocked"
                      defaultValue={selectedItem.is_blocked ? 'true' : 'false'}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'user')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'category' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'category', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Category Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="frameCategory"
                      defaultValue={selectedItem.frameCategory}
                      required
                    />
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'category')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'mackboard' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'mackboard', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Board Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="board_name"
                      defaultValue={selectedItem.board_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.board_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'mackboard')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'mackboard_color' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'mackboard_color', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Color Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="color_name"
                      defaultValue={selectedItem.color_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.color_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'mackboard_color')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'mug' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'mug', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Mug Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="mug_name"
                      defaultValue={selectedItem.mug_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.mug_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">GLB File (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="glb_file" />
                    {selectedItem.glb_file && (
                      <a href={getImageUrl(selectedItem.glb_file)} target="_blank" rel="noopener noreferrer" className="framedetails-file-link">
                        View Current GLB
                      </a>
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'mug')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'cap' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'cap', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Cap Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="cap_name"
                      defaultValue={selectedItem.cap_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.cap_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'cap')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'tshirt' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'tshirt', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Tshirt Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="tshirt_name"
                      defaultValue={selectedItem.tshirt_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.tshirt_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'tshirt')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'tshirt_color' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'tshirt_color', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Color Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="color_name"
                      defaultValue={selectedItem.color_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.color_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'tshirt_color')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'tshirt_size' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'tshirt_size', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Size Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="size_name"
                      defaultValue={selectedItem.size_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-row">
                    <div className="framedetails-form-group">
                      <label className="framedetails-form-label">Inner Width (Optional)</label>
                      <input
                        type="number"
                        className="framedetails-form-input"
                        name="inner_width"
                        defaultValue={selectedItem.inner_width}
                      />
                    </div>
                    <div className="framedetails-form-group">
                      <label className="framedetails-form-label">Inner Height (Optional)</label>
                      <input
                        type="number"
                        className="framedetails-form-input"
                        name="inner_height"
                        defaultValue={selectedItem.inner_height}
                      />
                    </div>
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.size_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'tshirt_size')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'tile' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'tile', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Tile Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="tile_name"
                      defaultValue={selectedItem.tile_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.tile_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'tile')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'pen' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'pen', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Pen Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="pen_name"
                      defaultValue={selectedItem.pen_name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.pen_name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'pen')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'printtype' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'printtype', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="name"
                      defaultValue={selectedItem.name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'printtype')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'printsize' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'printsize', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="name"
                      defaultValue={selectedItem.name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'printsize')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'papertype' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'papertype', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="name"
                      defaultValue={selectedItem.name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'papertype')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'laminationtype' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'laminationtype', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="name"
                      defaultValue={selectedItem.name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'laminationtype')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'frameOrder' && (
                <div className="framedetails-order-details">
                  <div className="framedetails-detail-grid">
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">ID:</span>
                      <span className="framedetails-detail-value">{selectedItem.id}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">User:</span>
                      <span className="framedetails-detail-value">{selectedItem.user.username}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Frame:</span>
                      <span className="framedetails-detail-value">{selectedItem.frame ? selectedItem.frame.name : 'Custom'}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Color Variant:</span>
                      <span className="framedetails-detail-value">{selectedItem.color_variant ? selectedItem.color_variant.color_name : 'N/A'}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Size Variant:</span>
                      <span className="framedetails-detail-value">{selectedItem.size_variant ? selectedItem.size_name : 'N/A'}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Finish Variant:</span>
                      <span className="framedetails-detail-value">{selectedItem.finish_variant ? selectedItem.finish_name : 'N/A'}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Hanging Variant:</span>
                      <span className="framedetails-detail-value">{selectedItem.hanging_variant ? selectedItem.hanging_name : 'N/A'}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Total Price:</span>
                      <span className="framedetails-detail-value framedetails-price-highlight">${selectedItem.total_price}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Status:</span>
                      <span className={`framedetails-status-badge framedetails-status-${selectedItem.status.toLowerCase()}`}>{selectedItem.status}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Created At:</span>
                      <span className="framedetails-detail-value">{new Date(selectedItem.created_at).toLocaleString()}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Print Unit:</span>
                      <span className="framedetails-detail-value">{selectedItem.print_unit}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Media Type:</span>
                      <span className="framedetails-detail-value">{selectedItem.media_type}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Paper Type:</span>
                      <span className="framedetails-detail-value">{selectedItem.paper_type}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Fit:</span>
                      <span className="framedetails-detail-value">{selectedItem.fit}</span>
                    </div>
                  </div>
                  {selectedItem.adjusted_image && (
                    <div className="framedetails-image-section">
                      <label className="framedetails-detail-label">Adjusted Image:</label>
                      <img
                        src={getImageUrl(selectedItem.adjusted_image)}
                        alt="Adjusted Image"
                        className="framedetails-order-image"
                        onError={handleImageError}
                      />
                    </div>
                  )}
                  <div className="framedetails-modal-footer">
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'frameOrder')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'giftOrder' && (
                <div className="framedetails-order-details">
                  <div className="framedetails-detail-grid">
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">ID:</span>
                      <span className="framedetails-detail-value">{selectedItem.id}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">User:</span>
                      <span className="framedetails-detail-value">{selectedItem.user.username}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Total Price:</span>
                      <span className="framedetails-detail-value framedetails-price-highlight">${selectedItem.total_price}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Status:</span>
                      <span className={`framedetails-status-badge framedetails-status-${selectedItem.status.toLowerCase()}`}>{selectedItem.status}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Created At:</span>
                      <span className="framedetails-detail-value">{new Date(selectedItem.created_at).toLocaleString()}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Gift Type:</span>
                      <span className="framedetails-detail-value">
                        {selectedItem.tshirt ? 'Tshirt' : selectedItem.mug ? 'Mug' : selectedItem.cap ? 'Cap' : selectedItem.tile ? 'Tile' : selectedItem.pen ? 'Pen' : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  {selectedItem.uploaded_image && (
                    <div className="framedetails-image-section">
                      <label className="framedetails-detail-label">Uploaded Image:</label>
                      <img
                        src={getImageUrl(selectedItem.uploaded_image)}
                        alt="Uploaded Image"
                        className="framedetails-order-image"
                        onError={handleImageError}
                      />
                    </div>
                  )}
                  <div className="framedetails-modal-footer">
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'giftOrder')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'simpleDocumentOrder' && (
                <div className="framedetails-order-details">
                  <div className="framedetails-detail-grid">
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">ID:</span>
                      <span className="framedetails-detail-value">{selectedItem.id}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">User:</span>
                      <span className="framedetails-detail-value">{selectedItem.user.username}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Total Amount:</span>
                      <span className="framedetails-detail-value framedetails-price-highlight">${selectedItem.total_amount}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Status:</span>
                      <span className={`framedetails-status-badge framedetails-status-${selectedItem.status.toLowerCase()}`}>{selectedItem.status}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Created At:</span>
                      <span className="framedetails-detail-value">{new Date(selectedItem.created_at).toLocaleString()}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Print Type:</span>
                      <span className="framedetails-detail-value">{selectedItem.print_type ? selectedItem.print_type.name : 'N/A'}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Print Size:</span>
                      <span className="framedetails-detail-value">{selectedItem.print_size ? selectedItem.print_size.name : 'N/A'}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Paper Type:</span>
                      <span className="framedetails-detail-value">{selectedItem.paper_type ? selectedItem.paper_type.name : 'N/A'}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Lamination:</span>
                      <span className="framedetails-detail-value">{selectedItem.lamination ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Lamination Type:</span>
                      <span className="framedetails-detail-value">{selectedItem.lamination_type ? selectedItem.lamination_type.name : 'N/A'}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Delivery Option:</span>
                      <span className="framedetails-detail-value">{selectedItem.delivery_option}</span>
                    </div>
                    <div className="framedetails-detail-item">
                      <span className="framedetails-detail-label">Quantity:</span>
                      <span className="framedetails-detail-value">{selectedItem.quantity}</span>
                    </div>
                  </div>
                  <div className="framedetails-files-section">
                    <h6 className="framedetails-files-title">Files:</h6>
                    <div className="framedetails-files-list">
                      {selectedItem.files.map((file, index) => (
                        <div key={index} className="framedetails-file-item">
                          <FileText className="framedetails-file-icon" />
                          <span className="framedetails-file-name">{file.file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="framedetails-modal-footer">
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'simpleDocumentOrder')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </div>
              )}
              {modalType === 'theme' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'theme', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Theme Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="theme_name"
                      defaultValue={selectedItem.theme_name}
                      required
                    />
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'theme')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'background' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'background', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="name"
                      defaultValue={selectedItem.name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Theme</label>
                    <select
                      className="framedetails-form-select"
                      name="theme"
                      defaultValue={selectedItem.theme.id}
                      required
                    >
                      {themes.map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.theme_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'background')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'sticker' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'sticker', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Name</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="name"
                      defaultValue={selectedItem.name}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Theme</label>
                    <select
                      className="framedetails-form-select"
                      name="theme"
                      defaultValue={selectedItem.theme.id}
                      required
                    >
                      {themes.map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.theme_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.name}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'sticker')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}
              {modalType === 'photobookpaper' && (
                <form
                  className="framedetails-form"
                  onSubmit={(e) => {
                    const formData = new FormData(e.target);
                    handleUpdate(e, selectedItem.id, 'photobookpaper', formData);
                  }}
                >
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Size</label>
                    <input
                      type="text"
                      className="framedetails-form-input"
                      name="size"
                      defaultValue={selectedItem.size}
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Price</label>
                    <input
                      type="number"
                      className="framedetails-form-input"
                      name="price"
                      defaultValue={selectedItem.price}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="framedetails-form-group">
                    <label className="framedetails-form-label">Image (Optional)</label>
                    <input type="file" className="framedetails-form-file" name="image" accept="image/*" />
                    {selectedItem.image && (
                      <img
                        src={getImageUrl(selectedItem.image)}
                        alt={selectedItem.size}
                        className="framedetails-preview-image"
                        onError={handleImageError}
                      />
                    )}
                  </div>
                  <div className="framedetails-modal-footer">
                    <button type="submit" className="framedetails-btn framedetails-btn-primary">
                      <CheckCircle className="framedetails-btn-icon" />
                      Update
                    </button>
                    <button
                      type="button"
                      className="framedetails-btn framedetails-btn-danger"
                      onClick={() => handleDelete(selectedItem.id, 'photobookpaper')}
                    >
                      <Trash2 className="framedetails-btn-icon" />
                      Delete
                    </button>
                    <button type="button" className="framedetails-btn framedetails-btn-secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Details;
