import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Details.css';
import { logoutUser } from '../../Redux/slices/userSlice';
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
          simpleDocumentOrdersResponse
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
                simpleDocumentOrdersResponse
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
      } else {
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
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-muted fs-4">Loading...</div>
      </div>
    );
  if (error)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-danger fs-4">Error: {error}</div>
      </div>
    );
  return (
    <div className="container-fluid py-4 details-container">
      <div className="row g-4">
        {/* Tabs Sidebar */}
        <div className="col-lg-3 col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">Admin Dashboard</h2>
              <ul className="nav nav-pills flex-column">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'frames' ? 'active' : ''}`}
                    onClick={() => setActiveTab('frames')}
                  >
                    <i className="bi bi-card-image"></i> Frames
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    <i className="bi bi-people"></i> Users
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                  >
                    <i className="bi bi-tags"></i> Categories
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'mackboards' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mackboards')}
                  >
                    <i className="bi bi-fullscreen"></i> MatBoards
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'mugs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mugs')}
                  >
                    <i className="bi bi-cup"></i> Mugs
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'caps' ? 'active' : ''}`}
                    onClick={() => setActiveTab('caps')}
                  >
                    <i className="bi bi-hat"></i> Caps
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'tshirts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tshirts')}
                  >
                    <i className="bi bi-tshirt"></i> Tshirts
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'tiles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tiles')}
                  >
                    <i className="bi bi-grid"></i> Tiles
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'pens' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pens')}
                  >
                    <i className="bi bi-pen"></i> Pens
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'printtypes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('printtypes')}
                  >
                    <i className="bi bi-printer"></i> Print Types
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'printsizes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('printsizes')}
                  >
                    <i className="bi bi-rulers"></i> Print Sizes
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'papertypes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('papertypes')}
                  >
                    <i className="bi bi-file-earmark"></i> Paper Types
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'laminationtypes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('laminationtypes')}
                  >
                    <i className="bi bi-layers"></i> Lamination Types
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'frameOrders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('frameOrders')}
                  >
                    <i className="bi bi-box-seam"></i> Frame Orders
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'giftOrders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('giftOrders')}
                  >
                    <i className="bi bi-gift"></i> Gift Orders
                  </button>
                </li>
                
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'simpleDocumentOrders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('simpleDocumentOrders')}
                  >
                    <i className="bi bi-file-earmark-text"></i> Simple Document Orders
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* Content Area */}
        <div className="col-lg-9 col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              {activeTab === 'frames' && (
                <div>
                  <h2 className="card-title mb-4">Frame Details</h2>
                  {frames.length === 0 ? (
                    <p className="text-muted">No frames available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Price</th>
                            <th scope="col">Image</th>
                            <th scope="col">Corner Image</th>
                            <th scope="col">Dimensions</th>
                            <th scope="col">Category</th>
                            <th scope="col">Created By</th>
                            <th scope="col">Created At</th>
                            <th scope="col">Color Variants</th>
                            <th scope="col">Size Variants</th>
                            <th scope="col">Finishing Variants</th>
                            <th scope="col">Hanging Variants</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {frames.map((frame) => (
                            <tr key={frame.id}>
                              <td>{frame.name}</td>
                              <td>${frame.price}</td>
                              <td>
                                <img
                                  src={getImageUrl(frame.image)}
                                  alt={frame.name}
                                  className="img-thumbnail"
                                  style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                  onError={handleImageError}
                                />
                              </td>
                              <td>
                                {frame.corner_image ? (
                                  <img
                                    src={getImageUrl(frame.corner_image)}
                                    alt={`${frame.name} corner`}
                                    className="img-thumbnail"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span>No corner image</span>
                                )}
                              </td>
                              <td>
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
                                <ul className="list-unstyled">
                                  {frame.color_variants.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.color_name}</span>
                                      <img
                                        src={getImageUrl(variant.image)}
                                        alt={variant.color_name}
                                        className="img-thumbnail"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                        onError={handleImageError}
                                      />
                                      {variant.corner_image && (
                                        <img
                                          src={getImageUrl(variant.corner_image)}
                                          alt={`${variant.color_name} corner`}
                                          className="img-thumbnail ms-2"
                                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'color')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <ul className="list-unstyled">
                                  {frame.size_variants.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.size_name}</span>
                                      {variant.image && (
                                        <img
                                          src={getImageUrl(variant.image)}
                                          alt={variant.size_name}
                                          className="img-thumbnail ms-2"
                                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                          onError={handleImageError}
                                        />
                                      )}
                                      {variant.corner_image && (
                                        <img
                                          src={getImageUrl(variant.corner_image)}
                                          alt={`${variant.size_name} corner`}
                                          className="img-thumbnail ms-2"
                                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'size')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <ul className="list-unstyled">
                                  {frame.finishing_variants.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.finish_name}</span>
                                      <img
                                        src={getImageUrl(variant.image)}
                                        alt={variant.finish_name}
                                        className="img-thumbnail"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                        onError={handleImageError}
                                      />
                                      {variant.corner_image && (
                                        <img
                                          src={getImageUrl(variant.corner_image)}
                                          alt={`${variant.finish_name} corner`}
                                          className="img-thumbnail ms-2"
                                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'finish')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <ul className="list-unstyled">
                                  {frame.frameHanging_variant.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.hanging_name}</span>
                                      <img
                                        src={getImageUrl(variant.image)}
                                        alt={variant.hanging_name}
                                        className="img-thumbnail"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                        onError={handleImageError}
                                      />
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'hanging')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(frame, 'frame')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'users' && (
                <div>
                  <h2 className="card-title mb-4">Registered Users</h2>
                  {users.length === 0 ? (
                    <p className="text-muted">No users available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Username</th>
                            <th scope="col">Email</th>
                            <th scope="col">Name</th>
                            <th scope="col">Phone</th>
                            <th scope="col">Role</th>
                            <th scope="col">Blocked</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.username}</td>
                              <td>{user.email || 'N/A'}</td>
                              <td>{user.name || 'N/A'}</td>
                              <td>{user.phone || 'N/A'}</td>
                              <td>{user.is_staff ? 'Admin' : user.is_user ? 'User' : 'Employee'}</td>
                              <td>{user.is_blocked ? 'Yes' : 'No'}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(user, 'user')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'categories' && (
                <div>
                  <h2 className="card-title mb-4">Frame Categories</h2>
                  {categories.length === 0 ? (
                    <p className="text-muted">No categories available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Category Name</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map((category) => (
                            <tr key={category.id}>
                              <td>{category.frameCategory}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(category, 'category')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'mackboards' && (
                <div>
                  <h2 className="card-title mb-4">MatBoards</h2>
                  {mackBoards.length === 0 ? (
                    <p className="text-muted">No MatBoards available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Board Name</th>
                            <th scope="col">Image</th>
                            <th scope="col">Price</th>
                            <th scope="col">Color Variants</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mackBoards.map((mackBoard) => (
                            <tr key={mackBoard.id}>
                              <td>{mackBoard.board_name}</td>
                              <td>
                                {mackBoard.image ? (
                                  <img
                                    src={getImageUrl(mackBoard.image)}
                                    alt={mackBoard.board_name}
                                    className="img-thumbnail"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span>No image</span>
                                )}
                              </td>
                              <td>${mackBoard.price || 'N/A'}</td>
                              <td>
                                <ul className="list-unstyled">
                                  {mackBoard.color_variants.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.color_name}</span>
                                      {variant.image && (
                                        <img
                                          src={getImageUrl(variant.image)}
                                          alt={variant.color_name}
                                          className="img-thumbnail"
                                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'mackboard_color')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(mackBoard, 'mackboard')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'mugs' && (
                <div>
                  <h2 className="card-title mb-4">Mugs</h2>
                  {mugs.length === 0 ? (
                    <p className="text-muted">No mugs available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Mug Name</th>
                            <th scope="col">Image</th>
                            <th scope="col">GLB File</th>
                            <th scope="col">Price</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mugs.map((mug) => (
                            <tr key={mug.id}>
                              <td>{mug.mug_name}</td>
                              <td>
                                {mug.image ? (
                                  <img
                                    src={getImageUrl(mug.image)}
                                    alt={mug.mug_name}
                                    className="img-thumbnail"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span>No image</span>
                                )}
                              </td>
                              <td>
                                {mug.glb_file ? (
                                  <a href={getImageUrl(mug.glb_file)} target="_blank" rel="noopener noreferrer">
                                    View GLB
                                  </a>
                                ) : (
                                  <span>No GLB file</span>
                                )}
                              </td>
                              <td>${mug.price || 'N/A'}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(mug, 'mug')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'caps' && (
                <div>
                  <h2 className="card-title mb-4">Caps</h2>
                  {caps.length === 0 ? (
                    <p className="text-muted">No caps available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Cap Name</th>
                            <th scope="col">Image</th>
                            <th scope="col">Price</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caps.map((cap) => (
                            <tr key={cap.id}>
                              <td>{cap.cap_name}</td>
                              <td>
                                {cap.image ? (
                                  <img
                                    src={getImageUrl(cap.image)}
                                    alt={cap.cap_name}
                                    className="img-thumbnail"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span>No image</span>
                                )}
                              </td>
                              <td>${cap.price || 'N/A'}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(cap, 'cap')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'tshirts' && (
                <div>
                  <h2 className="card-title mb-4">Tshirt Details</h2>
                  {tshirts.length === 0 ? (
                    <p className="text-muted">No tshirts available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Image</th>
                            <th scope="col">Created By</th>
                            <th scope="col">Created At</th>
                            <th scope="col">Color Variants</th>
                            <th scope="col">Size Variants</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tshirts.map((tshirt) => (
                            <tr key={tshirt.id}>
                              <td>{tshirt.tshirt_name}</td>
                              <td>
                                {tshirt.image ? (
                                  <img
                                    src={getImageUrl(tshirt.image)}
                                    alt={tshirt.tshirt_name}
                                    className="img-thumbnail"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span>No image</span>
                                )}
                              </td>
                              <td>
                                {tshirt.created_by
                                  ? tshirt.created_by.name || tshirt.created_by.username || 'Unknown'
                                  : 'Unknown'}
                              </td>
                              <td>{new Date(tshirt.created_at).toLocaleDateString()}</td>
                              <td>
                                <ul className="list-unstyled">
                                  {tshirt.color_variants.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.color_name}</span>
                                      {variant.image && (
                                        <img
                                          src={getImageUrl(variant.image)}
                                          alt={variant.color_name}
                                          className="img-thumbnail"
                                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'tshirt_color')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <ul className="list-unstyled">
                                  {tshirt.size_variants.map((variant) => (
                                    <li key={variant.id} className="d-flex align-items-center mb-2">
                                      <span className="me-2">{variant.size_name}</span>
                                      {variant.image && (
                                        <img
                                          src={getImageUrl(variant.image)}
                                          alt={variant.size_name}
                                          className="img-thumbnail"
                                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                          onError={handleImageError}
                                        />
                                      )}
                                      <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleSelectItem(variant, 'tshirt_size')}
                                      >
                                        Edit
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(tshirt, 'tshirt')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'tiles' && (
                <div>
                  <h2 className="card-title mb-4">Tiles</h2>
                  {tiles.length === 0 ? (
                    <p className="text-muted">No tiles available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Tile Name</th>
                            <th scope="col">Image</th>
                            <th scope="col">Price</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tiles.map((tile) => (
                            <tr key={tile.id}>
                              <td>{tile.tile_name}</td>
                              <td>
                                {tile.image ? (
                                  <img
                                    src={getImageUrl(tile.image)}
                                    alt={tile.tile_name}
                                    className="img-thumbnail"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span>No image</span>
                                )}
                              </td>
                              <td>${tile.price || 'N/A'}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(tile, 'tile')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'pens' && (
                <div>
                  <h2 className="card-title mb-4">Pens</h2>
                  {pens.length === 0 ? (
                    <p className="text-muted">No pens available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Pen Name</th>
                            <th scope="col">Image</th>
                            <th scope="col">Price</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pens.map((pen) => (
                            <tr key={pen.id}>
                              <td>{pen.pen_name}</td>
                              <td>
                                {pen.image ? (
                                  <img
                                    src={getImageUrl(pen.image)}
                                    alt={pen.pen_name}
                                    className="img-thumbnail"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <span>No image</span>
                                )}
                              </td>
                              <td>${pen.price || 'N/A'}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(pen, 'pen')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'printtypes' && (
                <div>
                  <h2 className="card-title mb-4">Print Types</h2>
                  {printTypes.length === 0 ? (
                    <p className="text-muted">No print types available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Price</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printTypes.map((printType) => (
                            <tr key={printType.id}>
                              <td>{printType.name}</td>
                              <td>${printType.price}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(printType, 'printtype')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'printsizes' && (
                <div>
                  <h2 className="card-title mb-4">Print Sizes</h2>
                  {printSizes.length === 0 ? (
                    <p className="text-muted">No print sizes available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Price</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printSizes.map((printSize) => (
                            <tr key={printSize.id}>
                              <td>{printSize.name}</td>
                              <td>${printSize.price}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(printSize, 'printsize')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'papertypes' && (
                <div>
                  <h2 className="card-title mb-4">Paper Types</h2>
                  {paperTypes.length === 0 ? (
                    <p className="text-muted">No paper types available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Price</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paperTypes.map((paperType) => (
                            <tr key={paperType.id}>
                              <td>{paperType.name}</td>
                              <td>${paperType.price}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(paperType, 'papertype')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'laminationtypes' && (
                <div>
                  <h2 className="card-title mb-4">Lamination Types</h2>
                  {laminationTypes.length === 0 ? (
                    <p className="text-muted">No lamination types available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Price</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {laminationTypes.map((laminationType) => (
                            <tr key={laminationType.id}>
                              <td>{laminationType.name}</td>
                              <td>${laminationType.price}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(laminationType, 'laminationtype')}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'frameOrders' && (
                <div>
                  <h2 className="card-title mb-4">Frame Orders</h2>
                  {frameOrders.length === 0 ? (
                    <p className="text-muted">No frame orders available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">ID</th>
                            <th scope="col">User</th>
                            <th scope="col">Total Price</th>
                            <th scope="col">Status</th>
                            <th scope="col">Created At</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {frameOrders.map((order) => (
                            <tr key={order.id}>
                              <td>{order.id}</td>
                              <td>{order.user.username}</td>
                              <td>${order.total_price}</td>
                              <td>{order.status}</td>
                              <td>{new Date(order.created_at).toLocaleString()}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(order, 'frameOrder')}
                                >
                                  View
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(order.id, 'frameOrder')}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'giftOrders' && (
                <div>
                  <h2 className="card-title mb-4">Gift Orders</h2>
                  {giftOrders.length === 0 ? (
                    <p className="text-muted">No gift orders available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">ID</th>
                            <th scope="col">User</th>
                            <th scope="col">Total Price</th>
                            <th scope="col">Status</th>
                            <th scope="col">Created At</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {giftOrders.map((order) => (
                            <tr key={order.id}>
                              <td>{order.id}</td>
                              <td>{order.user.username}</td>
                              <td>${order.total_price}</td>
                              <td>{order.status}</td>
                              <td>{new Date(order.created_at).toLocaleString()}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(order, 'giftOrder')}
                                >
                                  View
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(order.id, 'giftOrder')}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'simpleDocumentOrders' && (
                <div>
                  <h2 className="card-title mb-4">Simple Document Orders</h2>
                  {simpleDocumentOrders.length === 0 ? (
                    <p className="text-muted">No simple document orders available</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">ID</th>
                            <th scope="col">User</th>
                            <th scope="col">Total Amount</th>
                            <th scope="col">Status</th>
                            <th scope="col">Created At</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simpleDocumentOrders.map((order) => (
                            <tr key={order.id}>
                              <td>{order.id}</td>
                              <td>{order.user.username}</td>
                              <td>${order.total_amount}</td>
                              <td>{order.status}</td>
                              <td>{new Date(order.created_at).toLocaleString()}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info me-2"
                                  onClick={() => handleSelectItem(order, 'simpleDocumentOrder')}
                                >
                                  View
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(order.id, 'simpleDocumentOrder')}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal for Item Details */}
      {selectedItem && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
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
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                {modalType === 'frame' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'frame', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        defaultValue={selectedItem.name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Category</label>
                      <select
                        className="form-control"
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
                    <div className="mb-3">
                      <label className="form-label">Image</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Corner Image</label>
                      <input type="file" className="form-control" name="corner_image" accept="image/*" />
                      {selectedItem.corner_image && (
                        <img
                          src={getImageUrl(selectedItem.corner_image)}
                          alt={`${selectedItem.name} corner`}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Inner Width</label>
                      <input
                        type="number"
                        className="form-control"
                        name="inner_width"
                        defaultValue={selectedItem.inner_width}
                        step="0.1"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Inner Height</label>
                      <input
                        type="number"
                        className="form-control"
                        name="inner_height"
                        defaultValue={selectedItem.inner_height}
                        step="0.1"
                        required
                      />
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'frame')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'color' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'color', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Color Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="color_name"
                        defaultValue={selectedItem.color_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.color_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Corner Image</label>
                      <input type="file" className="form-control" name="corner_image" accept="image/*" />
                      {selectedItem.corner_image && (
                        <img
                          src={getImageUrl(selectedItem.corner_image)}
                          alt={`${selectedItem.color_name} corner`}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'color')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'size' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'size', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Size Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="size_name"
                        defaultValue={selectedItem.size_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Inner Width</label>
                      <input
                        type="number"
                        className="form-control"
                        name="inner_width"
                        defaultValue={selectedItem.inner_width}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Inner Height</label>
                      <input
                        type="number"
                        className="form-control"
                        name="inner_height"
                        defaultValue={selectedItem.inner_height}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image (Optional)</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.size_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Corner Image (Optional)</label>
                      <input type="file" className="form-control" name="corner_image" accept="image/*" />
                      {selectedItem.corner_image && (
                        <img
                          src={getImageUrl(selectedItem.corner_image)}
                          alt={`${selectedItem.size_name} corner`}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'size')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'finish' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'finish', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Finish Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="finish_name"
                        defaultValue={selectedItem.finish_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.finish_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Corner Image</label>
                      <input type="file" className="form-control" name="corner_image" accept="image/*" />
                      {selectedItem.corner_image && (
                        <img
                          src={getImageUrl(selectedItem.corner_image)}
                          alt={`${selectedItem.finish_name} corner`}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'finish')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'hanging' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'hanging', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Hanging Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="hanging_name"
                        defaultValue={selectedItem.hanging_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.hanging_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'hanging')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'user' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'user', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        className="form-control"
                        name="username"
                        defaultValue={selectedItem.username}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        defaultValue={selectedItem.email}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        defaultValue={selectedItem.name}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        defaultValue={selectedItem.phone}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Blocked</label>
                      <select
                        className="form-control"
                        name="is_blocked"
                        defaultValue={selectedItem.is_blocked ? 'true' : 'false'}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'user')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'category' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'category', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Category Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="frameCategory"
                        defaultValue={selectedItem.frameCategory}
                        required
                      />
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'category')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'mackboard' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'mackboard', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Board Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="board_name"
                        defaultValue={selectedItem.board_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image (Optional)</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.board_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'mackboard')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'mackboard_color' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'mackboard_color', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Color Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="color_name"
                        defaultValue={selectedItem.color_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image (Optional)</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.color_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'mackboard_color')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'mug' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'mug', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Mug Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="mug_name"
                        defaultValue={selectedItem.mug_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image (Optional)</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.mug_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">GLB File (Optional)</label>
                      <input type="file" className="form-control" name="glb_file" />
                      {selectedItem.glb_file && (
                        <a href={getImageUrl(selectedItem.glb_file)} target="_blank" rel="noopener noreferrer">
                          View Current GLB
                        </a>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'mug')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'cap' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'cap', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Cap Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="cap_name"
                        defaultValue={selectedItem.cap_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image (Optional)</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.cap_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'cap')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'tshirt' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'tshirt', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Tshirt Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="tshirt_name"
                        defaultValue={selectedItem.tshirt_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image (Optional)</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.tshirt_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'tshirt')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'tshirt_color' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'tshirt_color', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Color Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="color_name"
                        defaultValue={selectedItem.color_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image (Optional)</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.color_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'tshirt_color')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'tshirt_size' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'tshirt_size', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Size Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="size_name"
                        defaultValue={selectedItem.size_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Inner Width (Optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="inner_width"
                        defaultValue={selectedItem.inner_width}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Inner Height (Optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="inner_height"
                        defaultValue={selectedItem.inner_height}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image (Optional)</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.size_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'tshirt_size')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'tile' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'tile', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Tile Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="tile_name"
                        defaultValue={selectedItem.tile_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image (Optional)</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.tile_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'tile')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'pen' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'pen', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Pen Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="pen_name"
                        defaultValue={selectedItem.pen_name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image (Optional)</label>
                      <input type="file" className="form-control" name="image" accept="image/*" />
                      {selectedItem.image && (
                        <img
                          src={getImageUrl(selectedItem.image)}
                          alt={selectedItem.pen_name}
                          className="img-thumbnail mt-2"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'pen')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'printtype' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'printtype', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        defaultValue={selectedItem.name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'printtype')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'printsize' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'printsize', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        defaultValue={selectedItem.name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'printsize')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'papertype' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'papertype', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        defaultValue={selectedItem.name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'papertype')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'laminationtype' && (
                  <form
                    onSubmit={(e) => {
                      const formData = new FormData(e.target);
                      handleUpdate(e, selectedItem.id, 'laminationtype', formData);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        defaultValue={selectedItem.name}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        defaultValue={selectedItem.price}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'laminationtype')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </form>
                )}
                {modalType === 'frameOrder' && (
                  <div>
                    <p><strong>ID:</strong> {selectedItem.id}</p>
                    <p><strong>User:</strong> {selectedItem.user.username}</p>
                    <p><strong>Frame:</strong> {selectedItem.frame ? selectedItem.frame.name : 'Custom'}</p>
                    <p><strong>Color Variant:</strong> {selectedItem.color_variant ? selectedItem.color_variant.color_name : 'N/A'}</p>
                    <p><strong>Size Variant:</strong> {selectedItem.size_variant ? selectedItem.size_name : 'N/A'}</p>
                    <p><strong>Finish Variant:</strong> {selectedItem.finish_variant ? selectedItem.finish_name : 'N/A'}</p>
                    <p><strong>Hanging Variant:</strong> {selectedItem.hanging_variant ? selectedItem.hanging_name : 'N/A'}</p>
                    <p><strong>Total Price:</strong> ${selectedItem.total_price}</p>
                    <p><strong>Status:</strong> {selectedItem.status}</p>
                    <p><strong>Created At:</strong> {new Date(selectedItem.created_at).toLocaleString()}</p>
                    <p><strong>Print Unit:</strong> {selectedItem.print_unit}</p>
                    <p><strong>Media Type:</strong> {selectedItem.media_type}</p>
                    <p><strong>Paper Type:</strong> {selectedItem.paper_type}</p>
                    <p><strong>Fit:</strong> {selectedItem.fit}</p>
                    {selectedItem.adjusted_image && (
                      <div>
                        <label>Adjusted Image:</label>
                        <img
                          src={getImageUrl(selectedItem.adjusted_image)}
                          alt="Adjusted Image"
                          className="img-thumbnail"
                          style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      </div>
                    )}
                    {/* Add more fields as needed */}
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'frameOrder')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </div>
                )}
                {modalType === 'giftOrder' && (
                  <div>
                    <p><strong>ID:</strong> {selectedItem.id}</p>
                    <p><strong>User:</strong> {selectedItem.user.username}</p>
                    <p><strong>Total Price:</strong> ${selectedItem.total_price}</p>
                    <p><strong>Status:</strong> {selectedItem.status}</p>
                    <p><strong>Created At:</strong> {new Date(selectedItem.created_at).toLocaleString()}</p>
                    <p><strong>Gift Type:</strong> {selectedItem.tshirt ? 'Tshirt' : selectedItem.mug ? 'Mug' : selectedItem.cap ? 'Cap' : selectedItem.tile ? 'Tile' : selectedItem.pen ? 'Pen' : 'Unknown'}</p>
                    {/* Add specific gift details */}
                    {selectedItem.uploaded_image && (
                      <div>
                        <label>Uploaded Image:</label>
                        <img
                          src={getImageUrl(selectedItem.uploaded_image)}
                          alt="Uploaded Image"
                          className="img-thumbnail"
                          style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      </div>
                    )}
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'giftOrder')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </div>
                )}
                
                {modalType === 'simpleDocumentOrder' && (
                  <div>
                    <p><strong>ID:</strong> {selectedItem.id}</p>
                    <p><strong>User:</strong> {selectedItem.user.username}</p>
                    <p><strong>Total Amount:</strong> ${selectedItem.total_amount}</p>
                    <p><strong>Status:</strong> {selectedItem.status}</p>
                    <p><strong>Created At:</strong> {new Date(selectedItem.created_at).toLocaleString()}</p>
                    <p><strong>Print Type:</strong> {selectedItem.print_type ? selectedItem.print_type.name : 'N/A'}</p>
                    <p><strong>Print Size:</strong> {selectedItem.print_size ? selectedItem.print_size.name : 'N/A'}</p>
                    <p><strong>Paper Type:</strong> {selectedItem.paper_type ? selectedItem.paper_type.name : 'N/A'}</p>
                    <p><strong>Lamination:</strong> {selectedItem.lamination ? 'Yes' : 'No'}</p>
                    <p><strong>Lamination Type:</strong> {selectedItem.lamination_type ? selectedItem.lamination_type.name : 'N/A'}</p>
                    <p><strong>Delivery Option:</strong> {selectedItem.delivery_option}</p>
                    <p><strong>Quantity:</strong> {selectedItem.quantity}</p>
                    <h6>Files:</h6>
                    <ul>
                      {selectedItem.files.map((file, index) => (
                        <li key={index}>
                          <p><strong>File:</strong> {file.file}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(selectedItem.id, 'simpleDocumentOrder')}
                      >
                        Delete
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Details;