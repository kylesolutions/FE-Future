import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Settings,
  Plus,
  Edit,
  Package,
  Coffee,
  Crown,
  Grid,
  Pen,
  FileText,
  Printer,
  Layers,
  Shield,
  Hash,
  Palette,
  Maximize2,
  Sparkles,
  Bookmark,
  Upload,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import './admin.css';

const BASE_URL = 'http://82.180.146.4:8001';

function Admin() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [mode, setMode] = useState('create'); // 'create', 'add_variants', or 'edit' for frames
  const [tshirtMode, setTshirtMode] = useState('create'); // 'create', 'edit', or 'add_variants' for tshirts
  const [frames, setFrames] = useState([]);
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
  const [selectedFrameId, setSelectedFrameId] = useState('');
  const [selectedTshirtId, setSelectedTshirtId] = useState('');
  const [frameData, setFrameData] = useState({
    name: '',
    price: '',
    inner_width: '',
    inner_height: '',
    image: null,
    corner_image: null,
    category_id: '',
  });
  const [categoryData, setCategoryData] = useState({ frameCategory: '' });
  const [mackBoardData, setMackBoardData] = useState({ board_name: '', image: null, price: '' });
  const [mugData, setMugData] = useState({ mug_name: '', price: '', image: null, glb_file: null });
  const [capData, setCapData] = useState({ cap_name: '', price: '', image: null });
  const [tshirtData, setTshirtData] = useState({ tshirt_name: '', image: null });
  const [colorVariants, setColorVariants] = useState([
    { color_name: '', price: '', image: null, image_key: `color_0_${Date.now()}` }
  ]);
  const [sizeVariants, setSizeVariants] = useState([
    { size_name: '', inner_width: '', inner_height: '', price: '', image: null, image_key: `size_0_${Date.now()}` }
  ]);
  const [tileData, setTileData] = useState({ tile_name: '', price: '', image: null });
  const [penData, setPenData] = useState({ pen_name: '', price: '', image: null });
  const [printTypeData, setPrintTypeData] = useState({ name: '', price: '', image: null });
  const [printSizeData, setPrintSizeData] = useState({ name: '', price: '', image: null });
  const [paperTypeData, setPaperTypeData] = useState({ name: '', price: '', image: null });
  const [laminationTypeData, setLaminationTypeData] = useState({ name: '', price: '', image: null });
  const [variants, setVariants] = useState({
    color: [{ color_name: '', image: null, corner_image: null, image_key: `color_0_${Date.now()}`, price: '' }],
    size: [{ size_name: '', inner_width: '', inner_height: '', image: null, corner_image: null, image_key: `size_0_${Date.now()}`, price: '' }],
    finish: [{ finish_name: '', image: null, corner_image: null, image_key: `finish_0_${Date.now()}`, price: '' }],
    hanging: [{ hanging_name: '', image: null, image_key: `hanging_0_${Date.now()}`, price: '' }],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [colorVariantData, setColorVariantData] = useState({ mack_board: '', color_name: '', image: null });
  const [activeSection, setActiveSection] = useState('frames');
  const [themes, setThemes] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [themeData, setThemeData] = useState({ theme_name: '' });
  const [backgroundData, setBackgroundData] = useState({ theme: '', name: '', image: null });
  const [stickerData, setStickerData] = useState({ theme: '', name: '', image: null });
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [themeMode, setThemeMode] = useState('create'); // 'create' or 'edit' for themes
  const [photoBookPapers, setPhotoBookPapers] = useState([]);
  const [photoBookPaperData, setPhotoBookPaperData] = useState({ size: '', price: '', image: null });

  // Redirect if not admin
  useEffect(() => {
    if (!user.username || user.type !== 'admin') {
      setError('Please log in as an admin to access this page.');
      navigate('/login');
    }
  }, [user, navigate]);
  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const [
          framesResponse, categoriesResponse, mackBoardsResponse, mugsResponse, capsResponse,
          tshirtsResponse, tilesResponse, pensResponse, printTypesResponse, printSizesResponse,
          paperTypesResponse, laminationTypesResponse, themesResponse, backgroundsResponse, stickersResponse,photoBookPapersResponse
        ] = await Promise.all([
          axios.get(`${BASE_URL}/frames/`, config),
          axios.get(`${BASE_URL}/categories/`, config),
          axios.get(`${BASE_URL}/mack_boards/`, config),
          axios.get(`${BASE_URL}/mugs/`, config),
          axios.get(`${BASE_URL}/caps/`, config),
          axios.get(`${BASE_URL}/tshirts/`, config),
          axios.get(`${BASE_URL}/tiles/`, config),
          axios.get(`${BASE_URL}/pens/`, config),
          axios.get(`${BASE_URL}/api/print-types/`, config),
          axios.get(`${BASE_URL}/api/print-sizes/`, config),
          axios.get(`${BASE_URL}/api/paper-types/`, config),
          axios.get(`${BASE_URL}/api/lamination-types/`, config),
          axios.get(`${BASE_URL}/themes/`, config),
          axios.get(`${BASE_URL}/backgrounds/`, config),
          axios.get(`${BASE_URL}/stickers/`, config),
          axios.get(`${BASE_URL}/photobook-papers/`, config),
        ]);
        setFrames(framesResponse.data);
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
        setThemes(themesResponse.data);
        setBackgrounds(backgroundsResponse.data);
        setStickers(stickersResponse.data);
        setPhotoBookPapers(photoBookPapersResponse.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          navigate('/login');
        } else {
          setError('Failed to load data.');
        }
      }
    };
    fetchData();
  }, [navigate]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);
  // Refresh token function
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) throw new Error('No refresh token available');
      const response = await axios.post(`${BASE_URL}/api/token/refresh/`, { refresh });
      localStorage.setItem('token', response.data.access);
      return response.data.access;
    } catch (err) {
      console.error('Token refresh failed:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      navigate('/login');
      return null;
    }
  };
  // Handlers for form changes
  const handleFrameChange = (e) => {
    const { name, value, files } = e.target;
    setFrameData({ ...frameData, [name]: files ? files[0] : value });
  };
  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryData({ ...categoryData, [name]: value });
  };
  const handleMackBoardChange = (e) => {
    const { name, value, files } = e.target;
    setMackBoardData({ ...mackBoardData, [name]: files ? files[0] : value });
  };
  const handleMugChange = (e) => {
    const { name, value, files } = e.target;
    setMugData({ ...mugData, [name]: files ? files[0] : value });
  };
  const handleCapChange = (e) => {
    const { name, value, files } = e.target;
    setCapData({ ...capData, [name]: files ? files[0] : value });
  };
  const handleTshirtChange = (e) => {
    const { name, value, files } = e.target;
    setTshirtData({ ...tshirtData, [name]: files ? files[0] : value });
  };
  const handleColorVariantChange = (index, e) => {
    const { name, value, files } = e.target;
    const newVariants = [...colorVariants];
    newVariants[index] = { ...newVariants[index], [name]: files ? files[0] : value };
    setColorVariants(newVariants);
  };
  const handleSizeVariantChange = (index, e) => {
    const { name, value, files } = e.target;
    const newVariants = [...sizeVariants];
    newVariants[index] = { ...newVariants[index], [name]: files ? files[0] : value };
    setSizeVariants(newVariants);
  };
  const addColorVariant = () => {
    setColorVariants([
      ...colorVariants,
      { color_name: '', price: '', image: null, image_key: `color_${colorVariants.length}_${Date.now()}` }
    ]);
  };
  const addSizeVariant = () => {
    setSizeVariants([
      ...sizeVariants,
      { size_name: '', inner_width: '', inner_height: '', price: '', image: null, image_key: `size_${sizeVariants.length}_${Date.now()}` }
    ]);
  };
  const removeColorVariant = (index) => {
    setColorVariants(colorVariants.filter((_, i) => i !== index));
  };
  const removeSizeVariant = (index) => {
    setSizeVariants(sizeVariants.filter((_, i) => i !== index));
  };
  const handleTileChange = (e) => {
    const { name, value, files } = e.target;
    setTileData({ ...tileData, [name]: files ? files[0] : value });
  };
  const handlePenChange = (e) => {
    const { name, value, files } = e.target;
    setPenData({ ...penData, [name]: files ? files[0] : value });
  };
  const handlePrintTypeChange = (e) => {
    const { name, value, files } = e.target;
    setPrintTypeData({ ...printTypeData, [name]: files ? files[0] : value });
  };
  const handlePrintSizeChange = (e) => {
    const { name, value, files } = e.target;
    setPrintSizeData({ ...printSizeData, [name]: files ? files[0] : value });
  };
  const handlePaperTypeChange = (e) => {
    const { name, value, files } = e.target;
    setPaperTypeData({ ...paperTypeData, [name]: files ? files[0] : value });
  };
  const handleLaminationTypeChange = (e) => {
    const { name, value, files } = e.target;
    setLaminationTypeData({ ...laminationTypeData, [name]: files ? files[0] : value });
  };
  const handleVariantChange = (variantType, index, e) => {
    const { name, value, files } = e.target;
    const newVariants = { ...variants };
    newVariants[variantType][index] = {
      ...newVariants[variantType][index],
      [name]: files ? files[0] : value,
    };
    setVariants(newVariants);
  };
  const addVariant = (variantType) => {
    const newVariants = { ...variants };
    const timestamp = Date.now();
    newVariants[variantType].push({
      ...(variantType === 'color' && { color_name: '', image: null, corner_image: null, image_key: `color_${newVariants[variantType].length}_${timestamp}`, price: '' }),
      ...(variantType === 'size' && { size_name: '', inner_width: '', inner_height: '', image: null, corner_image: null, image_key: `size_${newVariants[variantType].length}_${timestamp}`, price: '' }),
      ...(variantType === 'finish' && { finish_name: '', image: null, corner_image: null, image_key: `finish_${newVariants[variantType].length}_${timestamp}`, price: '' }),
      ...(variantType === 'hanging' && { hanging_name: '', image: null, image_key: `hanging_${newVariants[variantType].length}_${timestamp}`, price: '' }),
    });
    setVariants(newVariants);
  };
  const removeVariant = (variantType, index) => {
    const newVariants = { ...variants };
    newVariants[variantType].splice(index, 1);
    setVariants(newVariants);
  };
  const handleColorVariantDataChange = (e) => {
    const { name, value, files } = e.target;
    setColorVariantData({ ...colorVariantData, [name]: files ? files[0] : value });
  };
  const handleThemeChange = (e) => {
    const { name, value } = e.target;
    setThemeData({ ...themeData, [name]: value });
  };

  const handleBackgroundChange = (e) => {
    const { name, value, files } = e.target;
    setBackgroundData({ ...backgroundData, [name]: files ? files[0] : value });
  };

  const handleStickerChange = (e) => {
    const { name, value, files } = e.target;
    setStickerData({ ...stickerData, [name]: files ? files[0] : value });
  };

  const handlePhotoBookPaperChange = (e) => {
  const { name, value, files } = e.target;
  setPhotoBookPaperData({ ...photoBookPaperData, [name]: files ? files[0] : value });
};


  const handleThemeSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (themeMode === 'create') {
        const response = await axios.post(`${BASE_URL}/themes/`, themeData, config);
        setThemes([...themes, response.data]);
        setSuccess('Theme created successfully!');
        setThemeData({ theme_name: '' });
      } else if (themeMode === 'edit') {
        if (!selectedThemeId) {
          setError('Please select a theme to edit.');
          return;
        }
        const response = await axios.put(`${BASE_URL}/themes/${selectedThemeId}/`, themeData, config);
        setThemes(themes.map((t) => (t.id === Number(selectedThemeId) ? response.data : t)));
        setSuccess('Theme updated successfully!');
        setThemeData({ theme_name: '' });
        setSelectedThemeId('');
        setThemeMode('create');
      }
    } catch (error) {
      console.error('Theme submission error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (!newToken) {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError('Only admins can perform this action.');
      } else {
        const errorMessage = error.response?.data
          ? Object.keys(error.response.data)
            .map((key) => `${key}: ${Array.isArray(error.response.data[key]) ? error.response.data[key].join(', ') : error.response.data[key]}`)
            .join('; ')
          : error.message;
        setError(`Failed to submit: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  // T-shirt submit handler
  const handleTshirtSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      if (tshirtMode === 'create' || tshirtMode === 'edit') {
        if (!tshirtData.tshirt_name) {
          setError('T-shirt name is required.');
          return;
        }
      }
      let tshirtId;
      if (tshirtMode === 'create') {
        const formData = new FormData();
        formData.append('tshirt_name', tshirtData.tshirt_name);
        if (tshirtData.image) formData.append('image', tshirtData.image);
        const response = await axios.post(`${BASE_URL}/tshirts/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        tshirtId = response.data.id;
        setTshirts([...tshirts, response.data]);
      } else if (tshirtMode === 'edit') {
        tshirtId = selectedTshirtId;
        if (!tshirtId) {
          setError('Please select a T-shirt to edit.');
          return;
        }
        const formData = new FormData();
        formData.append('tshirt_name', tshirtData.tshirt_name);
        if (tshirtData.image) formData.append('image', tshirtData.image);
        const response = await axios.put(`${BASE_URL}/tshirts/${tshirtId}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setTshirts(tshirts.map((t) => (t.id === tshirtId ? response.data : t)));
      } else {
        tshirtId = selectedTshirtId;
        if (!tshirtId) {
          setError('Please select a T-shirt to add variants.');
          return;
        }
      }
      // Handle variants
      const validColorVariants = colorVariants.filter(v => v.color_name && v.price && !isNaN(parseFloat(v.price)));
      const validSizeVariants = sizeVariants.filter(v => v.size_name && v.inner_width && v.inner_height && v.price && !isNaN(parseFloat(v.price)));
      // Check duplicates for colors
      const colorNames = validColorVariants.map(v => v.color_name);
      if (new Set(colorNames).size !== colorNames.length) {
        setError('Duplicate color names are not allowed.');
        return;
      }
      // Check duplicates for sizes
      const sizeNames = validSizeVariants.map(v => v.size_name);
      if (new Set(sizeNames).size !== sizeNames.length) {
        setError('Duplicate size names are not allowed.');
        return;
      }
      if (tshirtMode === 'create' && (validColorVariants.length === 0 || validSizeVariants.length === 0)) {
        setError('At least one color and one size variant are required for creation.');
        return;
      }
      // Update existing variants if in edit mode
      if (tshirtMode === 'edit') {
        for (const variant of colorVariants.filter(v => v.id)) {
          const formData = new FormData();
          formData.append('color_name', variant.color_name);
          formData.append('price', variant.price);
          if (variant.image instanceof File) formData.append('image', variant.image);
          await axios.put(`${BASE_URL}/tshirt_color_variants/${variant.id}/`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
        }
        for (const variant of sizeVariants.filter(v => v.id)) {
          const formData = new FormData();
          formData.append('size_name', variant.size_name);
          formData.append('inner_width', variant.inner_width);
          formData.append('inner_height', variant.inner_height);
          formData.append('price', variant.price);
          if (variant.image instanceof File) formData.append('image', variant.image);
          await axios.put(`${BASE_URL}/tshirt_size_variants/${variant.id}/`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      }
      // Add new variants
      const newColorVariants = (tshirtMode === 'edit' ? colorVariants.filter(v => !v.id) : validColorVariants);
      const newSizeVariants = (tshirtMode === 'edit' ? sizeVariants.filter(v => !v.id) : validSizeVariants);
      if (newColorVariants.length > 0 || newSizeVariants.length > 0) {
        const variantsData = [
          ...newColorVariants.map(v => ({
            variant_type: 'color',
            color_name: v.color_name,
            price: v.price,
            image_key: v.image_key,
          })),
          ...newSizeVariants.map(v => ({
            variant_type: 'size',
            size_name: v.size_name,
            inner_width: v.inner_width,
            inner_height: v.inner_height,
            price: v.price,
            image_key: v.image_key,
          })),
        ];
        const variantFormData = new FormData();
        variantFormData.append('variants', JSON.stringify(variantsData));
        variantsData.forEach((v) => {
          const allVariants = v.variant_type === 'color' ? colorVariants : sizeVariants;
          const entry = allVariants.find(entry => entry.image_key === v.image_key);
          if (entry.image instanceof File) {
            variantFormData.append(v.image_key, entry.image);
          }
        });
        const response = await axios.post(`${BASE_URL}/tshirts/${tshirtId}/variants/`, variantFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        // Optionally update state with created variants
      }
      setSuccess(
        tshirtMode === 'create' ? 'T-shirt and variants created successfully!' :
          tshirtMode === 'edit' ? 'T-shirt updated successfully!' :
            'Variants added successfully!'
      );
      setTshirtData({ tshirt_name: '', image: null });
      setColorVariants([{ color_name: '', price: '', image: null, image_key: `color_0_${Date.now()}` }]);
      setSizeVariants([{ size_name: '', inner_width: '', inner_height: '', price: '', image: null, image_key: `size_0_${Date.now()}` }]);
      setSelectedTshirtId('');
      setTshirtMode('create');
      // Refresh T-shirts list
      const token2 = localStorage.getItem('token');
      const tshirtsResponse = await axios.get(`${BASE_URL}/tshirts/`, { headers: { Authorization: `Bearer ${token2}` } });
      setTshirts(tshirtsResponse.data);
    } catch (error) {
      console.error('T-shirt submission error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (!newToken) {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError('Only admins can perform this action.');
      } else {
        const errorMessage = error.response?.data
          ? Object.keys(error.response.data)
            .map((key) =>
              `${key}: ${Array.isArray(error.response.data[key])
                ? error.response.data[key].join(', ')
                : error.response.data[key]
              }`
            )
            .join('; ')
          : error.message;
        setError(`Failed to submit: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTshirt = async (tshirtId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/tshirts/${tshirtId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTshirtData({ tshirt_name: response.data.tshirt_name, image: null });
      setColorVariants(response.data.color_variants.map((v, i) => ({
        id: v.id,
        color_name: v.color_name,
        price: v.price,
        image: null,
        image_key: `color_${i}_${Date.now()}`
      })));
      setSizeVariants(response.data.size_variants.map((v, i) => ({
        id: v.id,
        size_name: v.size_name,
        inner_width: v.inner_width,
        inner_height: v.inner_height,
        price: v.price,
        image: null,
        image_key: `size_${i}_${Date.now()}`
      })));
      setSelectedTshirtId(tshirtId);
      setTshirtMode('edit');
    } catch (error) {
      console.error('Error fetching T-shirt:', error);
      setError('Failed to load T-shirt data.');
    }
  };

  const handleDeleteVariant = async (variantId, variantType) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BASE_URL}/tshirt_${variantType}_variants/${variantId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (variantType === 'color') {
        setColorVariants(colorVariants.filter((v) => v.id !== variantId));
      } else {
        setSizeVariants(sizeVariants.filter((v) => v.id !== variantId));
      }
      setSuccess(`${variantType.charAt(0).toUpperCase() + variantType.slice(1)} variant deleted successfully!`);
    } catch (error) {
      console.error('Error deleting variant:', error);
      setError('Failed to delete variant.');
    }
  };

  // Generic submit handler
  const createSubmitHandler = (endpoint, data, successMessage, resetData) => {
    return async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Session expired. Please log in again.');
          navigate('/login');
          return;
        }
        const isFormData = data instanceof FormData || Object.values(data).some((value) => value instanceof File);
        const requestData = isFormData
          ? (() => {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
              if (value !== null && value !== '') {
                formData.append(key, value);
              }
            });
            return formData;
          })()
          : data;
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(isFormData && { 'Content-Type': 'multipart/form-data' }),
          },
        };
        const response = await axios.post(`${BASE_URL}${endpoint}`, requestData, config);
        setSuccess(successMessage);
        resetData();
        // Update state based on endpoint
        if (endpoint.includes('categories')) setCategories((prev) => [...prev, response.data]);
        else if (endpoint.includes('mack_boards')) setMackBoards((prev) => [...prev, response.data]);
        else if (endpoint.includes('mugs')) setMugs((prev) => [...prev, response.data]);
        else if (endpoint.includes('caps')) setCaps((prev) => [...prev, response.data]);
        else if (endpoint.includes('tiles')) setTiles((prev) => [...prev, response.data]);
        else if (endpoint.includes('pens')) setPens((prev) => [...prev, response.data]);
        else if (endpoint.includes('print-types')) setPrintTypes((prev) => [...prev, response.data]);
        else if (endpoint.includes('print-sizes')) setPrintSizes((prev) => [...prev, response.data]);
        else if (endpoint.includes('paper-types')) setPaperTypes((prev) => [...prev, response.data]);
        else if (endpoint.includes('lamination-types')) setLaminationTypes((prev) => [...prev, response.data]);
        else if (endpoint.includes('photobook-papers')) setPhotoBookPapers((prev) => [...prev, response.data]);
      } catch (error) {
        console.error('Submission error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          const newToken = await refreshToken();
          if (!newToken) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else if (error.response?.status === 403) {
          setError('Only admins can perform this action.');
        } else {
          const errorMessage = error.response?.data
            ? Object.keys(error.response.data)
              .map((key) =>
                `${key}: ${Array.isArray(error.response.data[key])
                  ? error.response.data[key].join(', ')
                  : error.response.data[key]
                }`
              )
              .join('; ')
            : error.message;
          setError(`Failed to submit: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
      }
    };
  };
  // Submit handlers for other sections
  const handleCategorySubmit = createSubmitHandler(
    '/categories/',
    categoryData,
    'Category created successfully!',
    () => setCategoryData({ frameCategory: '' })
  );
  const handleMackBoardSubmit = createSubmitHandler(
    '/mack_boards/',
    mackBoardData,
    'MatBoard created successfully!',
    () => setMackBoardData({ board_name: '', image: null, price: '' })
  );
  const handleMugSubmit = createSubmitHandler(
    '/mugs/',
    mugData,
    'Mug created successfully!',
    () => setMugData({ mug_name: '', price: '', image: null, glb_file: null })
  );
  const handleCapSubmit = createSubmitHandler(
    '/caps/',
    capData,
    'Cap created successfully!',
    () => setCapData({ cap_name: '', price: '', image: null })
  );
  const handleTileSubmit = createSubmitHandler(
    '/tiles/',
    tileData,
    'Tile created successfully!',
    () => setTileData({ tile_name: '', price: '', image: null })
  );
  const handlePenSubmit = createSubmitHandler(
    '/pens/',
    penData,
    'Pen created successfully!',
    () => setPenData({ pen_name: '', price: '', image: null })
  );
  const handlePrintTypeSubmit = createSubmitHandler(
    '/api/print-types/',
    printTypeData,
    'Print Type created successfully!',
    () => setPrintTypeData({ name: '', price: '', image: null })
  );
  const handlePrintSizeSubmit = createSubmitHandler(
    '/api/print-sizes/',
    printSizeData,
    'Print Size created successfully!',
    () => setPrintSizeData({ name: '', price: '', image: null })
  );
  const handlePaperTypeSubmit = createSubmitHandler(
    '/api/paper-types/',
    paperTypeData,
    'Paper Type created successfully!',
    () => setPaperTypeData({ name: '', price: '', image: null })
  );
  const handleLaminationTypeSubmit = createSubmitHandler(
    '/api/lamination-types/',
    laminationTypeData,
    'Lamination Type created successfully!',
    () => setLaminationTypeData({ name: '', price: '', image: null })
  );
  const handleColorVariantSubmit = createSubmitHandler(
    '/mack_board_color_variants/',
    colorVariantData,
    'Color variant created successfully!',
    () => setColorVariantData({ mack_board: '', color_name: '', image: null })
  );
  const handleBackgroundSubmit = createSubmitHandler(
    '/backgrounds/',
    backgroundData,
    'Background created successfully!',
    () => setBackgroundData({ theme: '', name: '', image: null })
  );

  const handleStickerSubmit = createSubmitHandler(
    '/stickers/',
    stickerData,
    'Sticker created successfully!',
    () => setStickerData({ theme: '', name: '', image: null })
  );
  
  const handlePhotoBookPaperSubmit = createSubmitHandler(
  '/photobook-papers/',
  photoBookPaperData,
  'Photo Book Paper created successfully!',
  () => setPhotoBookPaperData({ size: '', price: '', image: null })
);


  // Frame submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    let frameId;
    try {
      let token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      if (mode === 'create') {
        const formData = new FormData();
        for (const key in frameData) {
          if (frameData[key] !== '' && frameData[key] !== null) {
            formData.append(key, frameData[key]);
          }
        }
        const frameResponse = await axios.post(`${BASE_URL}/frames/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        frameId = frameResponse.data.id;
        setFrames([...frames, frameResponse.data]);
      } else if (mode === 'edit') {
        frameId = selectedFrameId;
        if (!frameId) {
          setError('Please select a frame to edit.');
          return;
        }
        const formData = new FormData();
        for (const key in frameData) {
          if (frameData[key] !== '' && frameData[key] !== null) {
            formData.append(key, frameData[key]);
          }
        }
        const frameResponse = await axios.put(`${BASE_URL}/frames/${frameId}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setFrames(frames.map((f) => (f.id === Number(frameId) ? frameResponse.data : f)));
      } else {
        frameId = selectedFrameId;
        if (!frameId) {
          setError('Please select a frame to add variants.');
          return;
        }
      }
      const variantsData = [];
      for (const variantType in variants) {
        variants[variantType].forEach((variant, index) => {
          const hasData = Object.values(variant).some(
            (value) => value !== '' && value !== null && value !== variant.image_key
          );
          if (!hasData) {
            console.log(`Skipping empty variant: ${variantType}[${index}]`);
            return;
          }
          const variantData = {
            variant_type: variantType === 'finish' ? 'finish' : variantType,
            image_key: variant.image_key,
          };
          for (const key in variant) {
            if (key !== 'image' && key !== 'corner_image' && key !== 'image_key' && variant[key] !== '' && variant[key] !== null) {
              variantData[key] = variant[key];
            }
          }
          variantsData.push(variantData);
        });
      }
      if (variantsData.length > 0) {
        const variantFormData = new FormData();
        variantFormData.append('variants', JSON.stringify(variantsData));
        variantsData.forEach((variant) => {
          const variantEntry = variants[variant.variant_type].find(
            (v) => v.image_key === variant.image_key
          );
          if (variantEntry?.image) {
            variantFormData.append(variant.image_key, variantEntry.image);
          }
          if (variantEntry?.corner_image && variant.variant_type !== 'hanging') {
            variantFormData.append(`${variant.image_key}_corner`, variantEntry.corner_image);
          }
        });
        await axios.post(
          `${BASE_URL}/frames/${frameId}/variants/`,
          variantFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }
      setSuccess(
        mode === 'create'
          ? 'Frame and variants created successfully!'
          : mode === 'edit'
            ? 'Frame updated successfully!'
            : 'Variants added successfully!'
      );
      setFrameData({
        name: '',
        price: '',
        inner_width: '',
        inner_height: '',
        image: null,
        corner_image: null,
        category_id: '',
      });
      setVariants({
        color: [{ color_name: '', image: null, corner_image: null, image_key: `color_0_${Date.now()}`, price: '' }],
        size: [{ size_name: '', inner_width: '', inner_height: '', image: null, corner_image: null, image_key: `size_0_${Date.now()}`, price: '' }],
        finish: [{ finish_name: '', image: null, corner_image: null, image_key: `finish_0_${Date.now()}`, price: '' }],
        hanging: [{ hanging_name: '', image: null, image_key: `hanging_0_${Date.now()}`, price: '' }],
      });
      setSelectedFrameId('');
      setMode('create');
    } catch (error) {
      console.error('Submission error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (!newToken) {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError('Only admins can perform this action.');
        navigate('/');
      } else {
        const errorMessage = error.response?.data
          ? Object.keys(error.response.data)
            .map((key) =>
              `${key}: ${Array.isArray(error.response.data[key])
                ? error.response.data[key].join(', ')
                : error.response.data[key]
              }`
            )
            .join('; ')
          : error.message;
        setError(`Failed to submit: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTheme = async (themeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/themes/${themeId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setThemeData({ theme_name: response.data.theme_name });
      setSelectedThemeId(themeId);
      setThemeMode('edit');
    } catch (error) {
      console.error('Error fetching theme:', error);
      setError('Failed to load theme data.');
    }
  };

  const handleDeleteTheme = async (themeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BASE_URL}/themes/${themeId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setThemes(themes.filter((t) => t.id !== Number(themeId)));
      setSuccess('Theme deleted successfully!');
      setThemeData({ theme_name: '' });
      setSelectedThemeId('');
      setThemeMode('create');
    } catch (error) {
      console.error('Error deleting theme:', error);
      setError('Failed to delete theme.');
    }
  };

  const handleEditFrame = async (frameId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/frames/${frameId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFrameData({
        name: response.data.name,
        price: response.data.price,
        inner_width: response.data.inner_width,
        inner_height: response.data.inner_height,
        image: null,
        corner_image: null,
        category_id: response.data.category?.id || '',
      });
      setSelectedFrameId(frameId);
      setMode('edit');
    } catch (error) {
      console.error('Error fetching frame:', error);
      setError('Failed to load frame data.');
    }
  };

  if (error && !user.username) {
    return (
      <div className="admin-error-page">
        <div className="admin-error-content">
          <AlertCircle size={48} />
          <h2>Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const selectedFrameName = frames.find((f) => f.id === Number(selectedFrameId))?.name || '';
  const selectedTshirtName = tshirts.find((t) => t.id === Number(selectedTshirtId))?.tshirt_name || '';

  const sectionIcons = {
    frames: Hash,
    categories: Layers,
    gifts: Package,
    printing: Printer,
    photobook: Palette,
  };

  const giftIcons = {
    mugs: Coffee,
    caps: Crown,
    tshirts: Package,
    tiles: Grid,
    pens: Pen,
  };

  return (
    <div className="admin-workspace">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-icon">
            <Settings size={32} />
          </div>
          <div className="admin-header-text">
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Manage your store inventory and settings</p>
          </div>
        </div>
      </div>
      {/* Alerts */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="admin-alert admin-alert-success">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}
      <div className="admin-container">
        {/* Sidebar Navigation */}
        <div className="admin-sidebar">
          <div className="admin-nav-sections">
            {Object.entries(sectionIcons).map(([section, Icon]) => (
              <button
                key={section}
                className={`admin-nav-item ${activeSection === section ? 'active' : ''}`}
                onClick={() => setActiveSection(section)}
              >
                <Icon size={20} />
                <span>{section.charAt(0).toUpperCase() + section.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Main Content */}
        <div className="admin-main-content">
          {/* Frames Section */}
          {activeSection === 'frames' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <Hash size={24} />
                <h2>Frame Management</h2>
              </div>
              <div className="admin-mode-selector">
                <div className="admin-form-group">
                  <label className="admin-label">Mode</label>
                  <select
                    className="admin-select"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="create">Create New Frame</option>
                    <option value="edit">Edit Existing Frame</option>
                    <option value="add_variants">Add Variants to Existing Frame</option>
                  </select>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="admin-form">
                {(mode === 'create' || mode === 'edit') && (
                  <div className="admin-card">
                    <h3 className="admin-card-title">Frame Details</h3>
                    <div className="admin-form-grid">
                      <div className="admin-form-group">
                        <label className="admin-label">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={frameData.name}
                          onChange={handleFrameChange}
                          className="admin-input"
                          required
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">Price</label>
                        <input
                          type="number"
                          name="price"
                          value={frameData.price}
                          onChange={handleFrameChange}
                          className="admin-input"
                          required
                          step="0.01"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">Inner Width</label>
                        <input
                          type="number"
                          name="inner_width"
                          value={frameData.inner_width}
                          onChange={handleFrameChange}
                          className="admin-input"
                          required
                          step="0.1"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">Inner Height</label>
                        <input
                          type="number"
                          name="inner_height"
                          value={frameData.inner_height}
                          onChange={handleFrameChange}
                          className="admin-input"
                          required
                          step="0.1"
                        />
                      </div>
                      <div className="admin-form-group admin-form-group-full">
                        <label className="admin-label">Category</label>
                        <select
                          name="category_id"
                          value={frameData.category_id}
                          onChange={handleFrameChange}
                          className="admin-select"
                        >
                          <option value="">-- Select Category (Optional) --</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.frameCategory}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">
                          Frame Image{mode === 'edit' ? ' (Optional)' : ''}
                        </label>
                        <div className="admin-file-input">
                          <Upload size={20} />
                          <input
                            type="file"
                            name="image"
                            onChange={handleFrameChange}
                            accept="image/*"
                            required={mode === 'create'}
                          />
                          <span>Choose frame image</span>
                        </div>
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-label">
                          Frame Corner Image{mode === 'edit' ? ' (Optional)' : ''}
                        </label>
                        <div className="admin-file-input">
                          <Upload size={20} />
                          <input
                            type="file"
                            name="corner_image"
                            onChange={handleFrameChange}
                            accept="image/*"
                            required={mode === 'create'}
                          />
                          <span>Choose corner image</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {mode === 'edit' && (
                  <div className="admin-card">
                    <h3 className="admin-card-title">Select Frame to Edit</h3>
                    <div className="admin-form-group">
                      <select
                        className="admin-select"
                        value={selectedFrameId}
                        onChange={(e) => handleEditFrame(e.target.value)}
                        required
                      >
                        <option value="">-- Select Frame --</option>
                        {frames.map((frame) => (
                          <option key={frame.id} value={frame.id}>
                            {frame.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {mode === 'add_variants' && (
                  <div className="admin-card">
                    <h3 className="admin-card-title">Select Frame</h3>
                    <div className="admin-form-group">
                      <select
                        className="admin-select"
                        value={selectedFrameId}
                        onChange={(e) => setSelectedFrameId(e.target.value)}
                        required
                      >
                        <option value="">-- Select Frame --</option>
                        {frames.map((frame) => (
                          <option key={frame.id} value={frame.id}>
                            {frame.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {/* Variants Sections */}
                {['color', 'size', 'finish', 'hanging'].map((variantType) => {
                  const icons = { color: Palette, size: Maximize2, finish: Sparkles, hanging: Bookmark };
                  const Icon = icons[variantType];
                  return (
                    <div key={variantType} className="admin-card">
                      <div className="admin-variant-header">
                        <div className="admin-variant-title">
                          <Icon size={20} />
                          <h3>{variantType.charAt(0).toUpperCase() + variantType.slice(1)} Variants {selectedFrameName && `for ${selectedFrameName}`}</h3>
                        </div>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          onClick={() => addVariant(variantType)}
                        >
                          <Plus size={16} />
                          Add {variantType.charAt(0).toUpperCase() + variantType.slice(1)}
                        </button>
                      </div>
                      <div className="admin-variants-grid">
                        {variants[variantType].map((variant, index) => (
                          <div key={variant.image_key} className="admin-variant-card">
                            <div className="admin-variant-card-header">
                              <span>#{index + 1}</span>
                              <button
                                type="button"
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => removeVariant(variantType, index)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="admin-variant-fields">
                              <div className="admin-form-group">
                                <label className="admin-label">
                                  {variantType.charAt(0).toUpperCase() + variantType.slice(1)} Name
                                </label>
                                <input
                                  type="text"
                                  name={`${variantType}_name`}
                                  value={variant[`${variantType}_name`] || ''}
                                  onChange={(e) => handleVariantChange(variantType, index, e)}
                                  className="admin-input"
                                />
                              </div>
                              {variantType === 'size' && (
                                <>
                                  <div className="admin-form-group">
                                    <label className="admin-label">Inner Width</label>
                                    <input
                                      type="number"
                                      name="inner_width"
                                      value={variant.inner_width || ''}
                                      onChange={(e) => handleVariantChange(variantType, index, e)}
                                      className="admin-input"
                                      step="0.1"
                                    />
                                  </div>
                                  <div className="admin-form-group">
                                    <label className="admin-label">Inner Height</label>
                                    <input
                                      type="number"
                                      name="inner_height"
                                      value={variant.inner_height || ''}
                                      onChange={(e) => handleVariantChange(variantType, index, e)}
                                      className="admin-input"
                                      step="0.1"
                                    />
                                  </div>
                                </>
                              )}
                              <div className="admin-form-group">
                                <label className="admin-label">Price</label>
                                <input
                                  type="number"
                                  name="price"
                                  value={variant.price || ''}
                                  onChange={(e) => handleVariantChange(variantType, index, e)}
                                  className="admin-input"
                                  step="0.01"
                                />
                              </div>
                              <div className="admin-form-group">
                                <label className="admin-label">{variantType.charAt(0).toUpperCase() + variantType.slice(1)} Image</label>
                                <div className="admin-file-input">
                                  <Upload size={16} />
                                  <input
                                    type="file"
                                    name="image"
                                    onChange={(e) => handleVariantChange(variantType, index, e)}
                                    accept="image/*"
                                  />
                                  <span>Choose image</span>
                                </div>
                              </div>
                              {variantType !== 'hanging' && (
                                <div className="admin-form-group">
                                  <label className="admin-label">Corner Image</label>
                                  <div className="admin-file-input">
                                    <Upload size={16} />
                                    <input
                                      type="file"
                                      name="corner_image"
                                      onChange={(e) => handleVariantChange(variantType, index, e)}
                                      accept="image/*"
                                    />
                                    <span>Choose corner image</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="admin-form-actions">
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader size={16} className="admin-spinner" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        {mode === 'create' ? 'Create Frame' : mode === 'edit' ? 'Update Frame' : 'Add Variants'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* Categories Section */}
          {activeSection === 'categories' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <Layers size={24} />
                <h2>Category Management</h2>
              </div>
              <div className="admin-card">
                <h3 className="admin-card-title">Create Category</h3>
                <form onSubmit={handleCategorySubmit} className="admin-form">
                  <div className="admin-form-group">
                    <label className="admin-label">Category Name</label>
                    <input
                      type="text"
                      name="frameCategory"
                      value={categoryData.frameCategory}
                      onChange={handleCategoryChange}
                      className="admin-input"
                      required
                    />
                  </div>
                  <div className="admin-form-actions">
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader size={16} className="admin-spinner" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Create Category
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
              {/* MatBoard Section */}
              <div className="admin-card">
                <h3 className="admin-card-title">Create MatBoard</h3>
                <form onSubmit={handleMackBoardSubmit} className="admin-form">
                  <div className="admin-form-grid">
                    <div className="admin-form-group">
                      <label className="admin-label">Board Name</label>
                      <input
                        type="text"
                        name="board_name"
                        value={mackBoardData.board_name}
                        onChange={handleMackBoardChange}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Price (Optional)</label>
                      <input
                        type="number"
                        name="price"
                        value={mackBoardData.price}
                        onChange={handleMackBoardChange}
                        className="admin-input"
                        step="0.01"
                      />
                    </div>
                    <div className="admin-form-group admin-form-group-full">
                      <label className="admin-label">Image (Optional)</label>
                      <div className="admin-file-input">
                        <Upload size={20} />
                        <input
                          type="file"
                          name="image"
                          onChange={handleMackBoardChange}
                          accept="image/*"
                        />
                        <span>Choose board image</span>
                      </div>
                    </div>
                  </div>
                  <div className="admin-form-actions">
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader size={16} className="admin-spinner" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Create MatBoard
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
              {/* MatBoard Color Variant Section */}
              <div className="admin-card">
                <h3 className="admin-card-title">Create MatBoard Color Variant</h3>
                <form onSubmit={handleColorVariantSubmit} className="admin-form">
                  <div className="admin-form-grid">
                    <div className="admin-form-group">
                      <label className="admin-label">Select MatBoard</label>
                      <select
                        name="mack_board"
                        value={colorVariantData.mack_board}
                        onChange={handleColorVariantDataChange}
                        className="admin-select"
                        required
                      >
                        <option value="">-- Select MatBoard --</option>
                        {mackBoards.map((mackBoard) => (
                          <option key={mackBoard.id} value={mackBoard.id}>
                            {mackBoard.board_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Color Name</label>
                      <input
                        type="text"
                        name="color_name"
                        value={colorVariantData.color_name}
                        onChange={handleColorVariantDataChange}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div className="admin-form-group admin-form-group-full">
                      <label className="admin-label">Color Image</label>
                      <div className="admin-file-input">
                        <Upload size={20} />
                        <input
                          type="file"
                          name="image"
                          onChange={handleColorVariantDataChange}
                          accept="image/*"
                        />
                        <span>Choose color image</span>
                      </div>
                    </div>
                  </div>
                  <div className="admin-form-actions">
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader size={16} className="admin-spinner" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Create Color Variant
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Gifts Section */}
          {activeSection === 'gifts' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <Package size={24} />
                <h2>Gift Items Management</h2>
              </div>
              <div className="admin-gifts-grid">
                {/* Mugs */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <Coffee size={20} />
                    <h3>Create Mug</h3>
                  </div>
                  <form onSubmit={handleMugSubmit} className="admin-form">
                    <div className="admin-form-group">
                      <label className="admin-label">Mug Name</label>
                      <input
                        type="text"
                        name="mug_name"
                        value={mugData.mug_name}
                        onChange={handleMugChange}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Price</label>
                      <input
                        type="number"
                        name="price"
                        value={mugData.price}
                        onChange={handleMugChange}
                        className="admin-input"
                        required
                        step="0.01"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Image (Optional)</label>
                      <div className="admin-file-input">
                        <Upload size={16} />
                        <input
                          type="file"
                          name="image"
                          onChange={handleMugChange}
                          accept="image/*"
                        />
                        <span>Choose image</span>
                      </div>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">3D Model (GLB) (Optional)</label>
                      <div className="admin-file-input">
                        <Upload size={16} />
                        <input
                          type="file"
                          name="glb_file"
                          onChange={handleMugChange}
                          accept=".glb"
                        />
                        <span>Choose GLB file</span>
                      </div>
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" disabled={isLoading}>
                      {isLoading ? <Loader size={14} className="admin-spinner" /> : <Plus size={14} />}
                      Create
                    </button>
                  </form>
                </div>
                {/* Caps */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <Crown size={20} />
                    <h3>Create Cap</h3>
                  </div>
                  <form onSubmit={handleCapSubmit} className="admin-form">
                    <div className="admin-form-group">
                      <label className="admin-label">Cap Name</label>
                      <input
                        type="text"
                        name="cap_name"
                        value={capData.cap_name}
                        onChange={handleCapChange}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Price</label>
                      <input
                        type="number"
                        name="price"
                        value={capData.price}
                        onChange={handleCapChange}
                        className="admin-input"
                        required
                        step="0.01"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Image (Optional)</label>
                      <div className="admin-file-input">
                        <Upload size={16} />
                        <input
                          type="file"
                          name="image"
                          onChange={handleCapChange}
                          accept="image/*"
                        />
                        <span>Choose image</span>
                      </div>
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" disabled={isLoading}>
                      {isLoading ? <Loader size={14} className="admin-spinner" /> : <Plus size={14} />}
                      Create
                    </button>
                  </form>
                </div>
                {/* T-shirts */}
                <div className="admin-card">
                  <div className="admin-section-header">
                    <Package size={20} />
                    <h2>T-shirt Management</h2>
                  </div>
                  <div className="admin-mode-selector">
                    <div className="admin-form-group">
                      <label className="admin-label">Mode</label>
                      <select
                        className="admin-select"
                        value={tshirtMode}
                        onChange={(e) => setTshirtMode(e.target.value)}
                      >
                        <option value="create">Create New T-shirt</option>
                        <option value="edit">Edit Existing T-shirt</option>
                        <option value="add_variants">Add Variants to Existing T-shirt</option>
                      </select>
                    </div>
                  </div>
                  <form onSubmit={handleTshirtSubmit} className="admin-form">
                    {(tshirtMode === 'create' || tshirtMode === 'edit') && (
                      <div className="admin-card">
                        <h3 className="admin-card-title">T-shirt Details</h3>
                        <div className="admin-form-group">
                          <label className="admin-label">T-shirt Name</label>
                          <input
                            type="text"
                            name="tshirt_name"
                            value={tshirtData.tshirt_name}
                            onChange={handleTshirtChange}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Image {tshirtMode === 'edit' ? '(Optional)' : ''}</label>
                          <div className="admin-file-input">
                            <Upload size={16} />
                            <input
                              type="file"
                              name="image"
                              onChange={handleTshirtChange}
                              accept="image/*"
                            />
                            <span>Choose image</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {tshirtMode === 'edit' || tshirtMode === 'add_variants' && (
                      <div className="admin-card">
                        <h3 className="admin-card-title">Select T-shirt</h3>
                        <div className="admin-form-group">
                          <select
                            className="admin-select"
                            value={selectedTshirtId}
                            onChange={(e) => handleEditTshirt(e.target.value)}
                            required
                          >
                            <option value="">-- Select T-shirt --</option>
                            {tshirts.map((tshirt) => (
                              <option key={tshirt.id} value={tshirt.id}>
                                {tshirt.tshirt_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {tshirtMode === 'edit' && selectedTshirtId && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleDeleteTshirt(selectedTshirtId)}
                          >
                            <Trash2 size={14} />
                            Delete T-shirt
                          </button>
                        )}
                      </div>
                    )}
                    {/* Color Variants */}
                    <div className="admin-card">
                      <div className="admin-variant-header">
                        <div className="admin-variant-title">
                          <Palette size={20} />
                          <h3>Color Variants {selectedTshirtName && `for ${selectedTshirtName}`}</h3>
                        </div>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          onClick={addColorVariant}
                        >
                          <Plus size={16} />
                          Add Color Variant
                        </button>
                      </div>
                      <div className="admin-variants-grid">
                        {colorVariants.map((variant, index) => (
                          <div key={variant.image_key || variant.id} className="admin-variant-card">
                            <div className="admin-variant-card-header">
                              <span>Color Variant #{index + 1}</span>
                              <button
                                type="button"
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => {
                                  if (variant.id) {
                                    handleDeleteVariant(variant.id, 'color');
                                  } else {
                                    removeColorVariant(index);
                                  }
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="admin-variant-fields">
                              <div className="admin-form-group">
                                <label className="admin-label">Color Name</label>
                                <input
                                  type="text"
                                  name="color_name"
                                  value={variant.color_name}
                                  onChange={(e) => handleColorVariantChange(index, e)}
                                  className="admin-input"
                                  required
                                  placeholder="e.g., Red"
                                />
                              </div>
                              <div className="admin-form-group">
                                <label className="admin-label">Price</label>
                                <input
                                  type="number"
                                  name="price"
                                  value={variant.price}
                                  onChange={(e) => handleColorVariantChange(index, e)}
                                  className="admin-input"
                                  required
                                  step="0.01"
                                  placeholder="e.g., 2.00"
                                />
                              </div>
                              <div className="admin-form-group">
                                <label className="admin-label">Image (Optional)</label>
                                <div className="admin-file-input">
                                  <Upload size={16} />
                                  <input
                                    type="file"
                                    name="image"
                                    onChange={(e) => handleColorVariantChange(index, e)}
                                    accept="image/*"
                                  />
                                  <span>Choose image</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Size Variants */}
                    <div className="admin-card">
                      <div className="admin-variant-header">
                        <div className="admin-variant-title">
                          <Maximize2 size={20} />
                          <h3>Size Variants {selectedTshirtName && `for ${selectedTshirtName}`}</h3>
                        </div>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          onClick={addSizeVariant}
                        >
                          <Plus size={16} />
                          Add Size Variant
                        </button>
                      </div>
                      <div className="admin-variants-grid">
                        {sizeVariants.map((variant, index) => (
                          <div key={variant.image_key || variant.id} className="admin-variant-card">
                            <div className="admin-variant-card-header">
                              <span>Size Variant #{index + 1}</span>
                              <button
                                type="button"
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => {
                                  if (variant.id) {
                                    handleDeleteVariant(variant.id, 'size');
                                  } else {
                                    removeSizeVariant(index);
                                  }
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="admin-variant-fields">
                              <div className="admin-form-group">
                                <label className="admin-label">Size Name</label>
                                <select
                                  name="size_name"
                                  value={variant.size_name}
                                  onChange={(e) => handleSizeVariantChange(index, e)}
                                  className="admin-select"
                                  required
                                >
                                  <option value="">-- Select Size --</option>
                                  <option value="S">Small</option>
                                  <option value="M">Medium</option>
                                  <option value="L">Large</option>
                                  <option value="XL">Extra Large</option>
                                  <option value="XXL">Double Extra Large</option>
                                </select>
                              </div>
                              <div className="admin-form-group">
                                <label className="admin-label">Inner Width</label>
                                <input
                                  type="number"
                                  name="inner_width"
                                  value={variant.inner_width}
                                  onChange={(e) => handleSizeVariantChange(index, e)}
                                  className="admin-input"
                                  required
                                  step="0.1"
                                  placeholder="e.g., 20.0"
                                />
                              </div>
                              <div className="admin-form-group">
                                <label className="admin-label">Inner Height</label>
                                <input
                                  type="number"
                                  name="inner_height"
                                  value={variant.inner_height}
                                  onChange={(e) => handleSizeVariantChange(index, e)}
                                  className="admin-input"
                                  required
                                  step="0.1"
                                  placeholder="e.g., 30.0"
                                />
                              </div>
                              <div className="admin-form-group">
                                <label className="admin-label">Price</label>
                                <input
                                  type="number"
                                  name="price"
                                  value={variant.price}
                                  onChange={(e) => handleSizeVariantChange(index, e)}
                                  className="admin-input"
                                  required
                                  step="0.01"
                                  placeholder="e.g., 19.99"
                                />
                              </div>
                              <div className="admin-form-group">
                                <label className="admin-label">Image (Optional)</label>
                                <div className="admin-file-input">
                                  <Upload size={16} />
                                  <input
                                    type="file"
                                    name="image"
                                    onChange={(e) => handleSizeVariantChange(index, e)}
                                    accept="image/*"
                                  />
                                  <span>Choose image</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="admin-form-actions">
                      <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" disabled={isLoading}>
                        {isLoading ? <Loader size={14} className="admin-spinner" /> : <Plus size={14} />}
                        {tshirtMode === 'create' ? 'Create' : tshirtMode === 'edit' ? 'Update' : 'Add Variants'}
                      </button>
                    </div>
                  </form>
                </div>
                {/* Tiles */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <Grid size={20} />
                    <h3>Create Tile</h3>
                  </div>
                  <form onSubmit={handleTileSubmit} className="admin-form">
                    <div className="admin-form-group">
                      <label className="admin-label">Tile Name</label>
                      <input
                        type="text"
                        name="tile_name"
                        value={tileData.tile_name}
                        onChange={handleTileChange}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Price</label>
                      <input
                        type="number"
                        name="price"
                        value={tileData.price}
                        onChange={handleTileChange}
                        className="admin-input"
                        required
                        step="0.01"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Image (Optional)</label>
                      <div className="admin-file-input">
                        <Upload size={16} />
                        <input
                          type="file"
                          name="image"
                          onChange={handleTileChange}
                          accept="image/*"
                        />
                        <span>Choose image</span>
                      </div>
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" disabled={isLoading}>
                      {isLoading ? <Loader size={14} className="admin-spinner" /> : <Plus size={14} />}
                      Create
                    </button>
                  </form>
                </div>
                {/* Pens */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <Pen size={20} />
                    <h3>Create Pen</h3>
                  </div>
                  <form onSubmit={handlePenSubmit} className="admin-form">
                    <div className="admin-form-group">
                      <label className="admin-label">Pen Name</label>
                      <input
                        type="text"
                        name="pen_name"
                        value={penData.pen_name}
                        onChange={handlePenChange}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Price</label>
                      <input
                        type="number"
                        name="price"
                        value={penData.price}
                        onChange={handlePenChange}
                        className="admin-input"
                        required
                        step="0.01"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Image (Optional)</label>
                      <div className="admin-file-input">
                        <Upload size={16} />
                        <input
                          type="file"
                          name="image"
                          onChange={handlePenChange}
                          accept="image/*"
                        />
                        <span>Choose image</span>
                      </div>
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" disabled={isLoading}>
                      {isLoading ? <Loader size={14} className="admin-spinner" /> : <Plus size={14} />}
                      Create
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
          {/* Printing Section */}
          {activeSection === 'printing' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <Printer size={24} />
                <h2>Printing Options Management</h2>
              </div>
              <div className="admin-printing-grid">
                {/* Print Types */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <FileText size={20} />
                    <h3>Create Print Type</h3>
                  </div>
                  <form onSubmit={handlePrintTypeSubmit} className="admin-form">
                    <div className="admin-form-group">
                      <label className="admin-label">Print Type Name</label>
                      <input
                        type="text"
                        name="name"
                        value={printTypeData.name}
                        onChange={handlePrintTypeChange}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Price</label>
                      <input
                        type="number"
                        name="price"
                        value={printTypeData.price}
                        onChange={handlePrintTypeChange}
                        className="admin-input"
                        required
                        step="0.01"
                      />
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" disabled={isLoading}>
                      {isLoading ? <Loader size={14} className="admin-spinner" /> : <Plus size={14} />}
                      Create
                    </button>
                  </form>
                </div>
                {/* Print Sizes */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <Maximize2 size={20} />
                    <h3>Create Print Size</h3>
                  </div>
                  <form onSubmit={handlePrintSizeSubmit} className="admin-form">
                    <div className="admin-form-group">
                      <label className="admin-label">Print Size Name</label>
                      <input
                        type="text"
                        name="name"
                        value={printSizeData.name}
                        onChange={handlePrintSizeChange}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Price</label>
                      <input
                        type="number"
                        name="price"
                        value={printSizeData.price}
                        onChange={handlePrintSizeChange}
                        className="admin-input"
                        required
                        step="0.01"
                      />
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" disabled={isLoading}>
                      {isLoading ? <Loader size={14} className="admin-spinner" /> : <Plus size={14} />}
                      Create
                    </button>
                  </form>
                </div>
                {/* Paper Types */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <FileText size={20} />
                    <h3>Create Paper Type</h3>
                  </div>
                  <form onSubmit={handlePaperTypeSubmit} className="admin-form">
                    <div className="admin-form-group">
                      <label className="admin-label">Paper Type Name</label>
                      <input
                        type="text"
                        name="name"
                        value={paperTypeData.name}
                        onChange={handlePaperTypeChange}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Price</label>
                      <input
                        type="number"
                        name="price"
                        value={paperTypeData.price}
                        onChange={handlePaperTypeChange}
                        className="admin-input"
                        required
                        step="0.01"
                      />
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" disabled={isLoading}>
                      {isLoading ? <Loader size={14} className="admin-spinner" /> : <Plus size={14} />}
                      Create
                    </button>
                  </form>
                </div>
                {/* Lamination Types */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <Shield size={20} />
                    <h3>Create Lamination Type</h3>
                  </div>
                  <form onSubmit={handleLaminationTypeSubmit} className="admin-form">
                    <div className="admin-form-group">
                      <label className="admin-label">Lamination Type Name</label>
                      <input
                        type="text"
                        name="name"
                        value={laminationTypeData.name}
                        onChange={handleLaminationTypeChange}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Price</label>
                      <input
                        type="number"
                        name="price"
                        value={laminationTypeData.price}
                        onChange={handleLaminationTypeChange}
                        className="admin-input"
                        required
                        step="0.01"
                      />
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" disabled={isLoading}>
                      {isLoading ? <Loader size={14} className="admin-spinner" /> : <Plus size={14} />}
                      Create
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'photobook' && (
  <div className="admin-section">
    <div className="admin-section-header">
      <Palette size={24} />
      <h2>Photobook Management</h2>
    </div>
    {/* Theme Management */}
    <div className="admin-card">
      <div className="admin-section-header">
        <Palette size={20} />
        <h3>Theme Management</h3>
      </div>
      <div className="admin-mode-selector">
        <div className="admin-form-group">
          <label className="admin-label">Mode</label>
          <select
            className="admin-select"
            value={themeMode}
            onChange={(e) => setThemeMode(e.target.value)}
          >
            <option value="create">Create New Theme</option>
            <option value="edit">Edit Existing Theme</option>
          </select>
        </div>
      </div>
      <form onSubmit={handleThemeSubmit} className="admin-form">
        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label className="admin-label">Theme Name</label>
            <input
              type="text"
              name="theme_name"
              value={themeData.theme_name}
              onChange={handleThemeChange}
              className="admin-input"
              required
            />
          </div>
          {themeMode === 'edit' && (
            <div className="admin-form-group">
              <label className="admin-label">Select Theme</label>
              <select
                className="admin-select"
                value={selectedThemeId}
                onChange={(e) => handleEditTheme(e.target.value)}
                required
              >
                <option value="">-- Select Theme --</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.theme_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader size={16} className="admin-spinner" />
                {themeMode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {themeMode === 'create' ? 'Create Theme' : 'Update Theme'}
              </>
            )}
          </button>
          {themeMode === 'edit' && selectedThemeId && (
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              onClick={() => handleDeleteTheme(selectedThemeId)}
            >
              <Trash2 size={16} />
              Delete Theme
            </button>
          )}
        </div>
      </form>
    </div>
    {/* Background Management */}
    <div className="admin-card">
      <div className="admin-card-header">
        <Layers size={20} />
        <h3>Create Background</h3>
      </div>
      <form onSubmit={handleBackgroundSubmit} className="admin-form">
        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label className="admin-label">Select Theme</label>
            <select
              name="theme"
              value={backgroundData.theme}
              onChange={handleBackgroundChange}
              className="admin-select"
              required
            >
              <option value="">-- Select Theme --</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.theme_name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Background Name</label>
            <input
              type="text"
              name="name"
              value={backgroundData.name}
              onChange={handleBackgroundChange}
              className="admin-input"
              required
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Image</label>
            <div className="admin-file-input">
              <Upload size={16} />
              <input
                type="file"
                name="image"
                onChange={handleBackgroundChange}
                accept="image/*"
                required
              />
              <span>Choose background image</span>
            </div>
          </div>
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader size={16} className="admin-spinner" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create Background
              </>
            )}
          </button>
        </div>
      </form>
    </div>
    {/* Sticker Management */}
    <div className="admin-card">
      <div className="admin-card-header">
        <Sparkles size={20} />
        <h3>Create Sticker</h3>
      </div>
      <form onSubmit={handleStickerSubmit} className="admin-form">
        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label className="admin-label">Select Theme</label>
            <select
              name="theme"
              value={stickerData.theme}
              onChange={handleStickerChange}
              className="admin-select"
              required
            >
              <option value="">-- Select Theme --</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.theme_name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Sticker Name</label>
            <input
              type="text"
              name="name"
              value={stickerData.name}
              onChange={handleStickerChange}
              className="admin-input"
              required
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Image</label>
            <div className="admin-file-input">
              <Upload size={16} />
              <input
                type="file"
                name="image"
                onChange={handleStickerChange}
                accept="image/*"
                required
              />
              <span>Choose sticker image</span>
            </div>
          </div>
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader size={16} className="admin-spinner" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create Sticker
              </>
            )}
          </button>
        </div>
      </form>
    </div>
    {/* PhotoBookPaper Management */}
    <div className="admin-card">
      <div className="admin-card-header">
        <FileText size={20} />
        <h3>Create Photo Book Paper</h3>
      </div>
      <form onSubmit={handlePhotoBookPaperSubmit} className="admin-form">
        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label className="admin-label">Size</label>
            <input
              type="text"
              name="size"
              value={photoBookPaperData.size}
              onChange={handlePhotoBookPaperChange}
              className="admin-input"
              required
              placeholder="e.g., A4"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Price</label>
            <input
              type="number"
              name="price"
              value={photoBookPaperData.price}
              onChange={handlePhotoBookPaperChange}
              className="admin-input"
              required
              step="0.01"
              placeholder="e.g., 5.00"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Image (Optional)</label>
            <div className="admin-file-input">
              <Upload size={16} />
              <input
                type="file"
                name="image"
                onChange={handlePhotoBookPaperChange}
                accept="image/*"
              />
              <span>Choose paper image</span>
            </div>
          </div>
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader size={16} className="admin-spinner" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create Photo Book Paper
              </>
            )}
          </button>
        </div>
      </form>
    </div>
    {/* PhotoBookPapers List */}
    <div className="admin-card">
      <div className="admin-card-header">
        <FileText size={20} />
        <h3>Photo Book Papers</h3>
      </div>
      <div className="admin-list">
        {photoBookPapers.map((paper) => (
          <div key={paper.id} className="admin-list-item">
            <span>{paper.size} - ${paper.price}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
}
export default Admin;
