import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function Admin() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [mode, setMode] = useState('create'); // 'create', 'add_variants', or 'edit'
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
  const [mugData, setMugData] = useState({ mug_name: '', price: '', image: null });
  const [capData, setCapData] = useState({ cap_name: '', price: '', image: null });
  const [tshirtData, setTshirtData] = useState({ tshirt_name: '', price: '', image: null });
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
  const [colorVariantData, setColorVariantData] = useState({ mack_board_id: '', color_name: '', image: null });

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
          paperTypesResponse, laminationTypesResponse
        ] = await Promise.all([
          axios.get('http://82.180.146.4:8001/frames/', config),
          axios.get('http://82.180.146.4:8001/categories/', config),
          axios.get('http://82.180.146.4:8001/mack_boards/', config),
          axios.get('http://82.180.146.4:8001/mugs/', config),
          axios.get('http://82.180.146.4:8001/caps/', config),
          axios.get('http://82.180.146.4:8001/tshirts/', config),
          axios.get('http://82.180.146.4:8001/tiles/', config),
          axios.get('http://82.180.146.4:8001/pens/', config),
          axios.get('http://82.180.146.4:8001/api/print-types/', config),
          axios.get('http://82.180.146.4:8001/api/print-sizes/', config),
          axios.get('http://82.180.146.4:8001/api/paper-types/', config),
          axios.get('http://82.180.146.4:8001/api/lamination-types/', config),
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

  const handleColorVariantChange = (e) => {
    const { name, value, files } = e.target;
    setColorVariantData({ ...colorVariantData, [name]: files ? files[0] : value });
  };

  // Submit handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const response = await axios.post('http://82.180.146.4:8001/categories/', categoryData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories([...categories, response.data]);
      setCategoryData({ frameCategory: '' });
      alert('Category created successfully!');
    } catch (error) {
      console.error('Category creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const response = await axios.post('http://82.180.146.4:8001/categories/', categoryData, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            setCategories([...categories, response.data]);
            setCategoryData({ frameCategory: '' });
            alert('Category created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else {
        setError('Failed to create category: ' + (error.response?.data?.frameCategory?.[0] || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMackBoardSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('board_name', mackBoardData.board_name);
      if (mackBoardData.image) {
        formData.append('image', mackBoardData.image);
      }
      if (mackBoardData.price) {
        formData.append('price', mackBoardData.price);
      }
      const response = await axios.post('http://82.180.146.4:8001/mack_boards/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setMackBoards([...mackBoards, response.data]);
      setMackBoardData({ board_name: '', image: null, price: '' });
      alert('MatBoard created successfully!');
    } catch (error) {
      console.error('MackBoard creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('board_name', mackBoardData.board_name);
            if (mackBoardData.image) {
              formData.append('image', mackBoardData.image);
            }
            if (mackBoardData.price) {
              formData.append('price', mackBoardData.price);
            }
            const response = await axios.post('http://82.180.146.4:8001/mack_boards/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            setMackBoards([...mackBoards, response.data]);
            setMackBoardData({ board_name: '', image: null, price: '' });
            alert('MatBoard created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError('Only admins can create MatBoards.');
      } else {
        setError('Failed to create MatBoard: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorVariantSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('mack_board', colorVariantData.mack_board_id);
      formData.append('color_name', colorVariantData.color_name);
      if (colorVariantData.image) {
        formData.append('image', colorVariantData.image);
      }
      const response = await axios.post('http://82.180.146.4:8001/mack_board_color_variants/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Color variant created successfully!');
      setColorVariantData({ mack_board_id: '', color_name: '', image: null });
    } catch (error) {
      console.error('Color variant creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('mack_board', colorVariantData.mack_board_id);
            formData.append('color_name', colorVariantData.color_name);
            if (colorVariantData.image) {
              formData.append('image', colorVariantData.image);
            }
            const response = await axios.post('http://82.180.146.4:8001/mack_board_color_variants/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            alert('Color variant created successfully!');
            setColorVariantData({ mack_board_id: '', color_name: '', image: null });
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError('Only admins can create color variants.');
      } else {
        setError('Failed to create color variant: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMugSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('mug_name', mugData.mug_name);
      formData.append('price', mugData.price);
      if (mugData.image) {
        formData.append('image', mugData.image);
      }
      const response = await axios.post('http://82.180.146.4:8001/mugs/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setMugs([...mugs, response.data]);
      setMugData({ mug_name: '', price: '', image: null });
      alert('Mug created successfully!');
    } catch (error) {
      console.error('Mug creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('mug_name', mugData.mug_name);
            formData.append('price', mugData.price);
            if (mugData.image) {
              formData.append('image', mugData.image);
            }
            const response = await axios.post('http://82.180.146.4:8001/mugs/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            setMugs([...mugs, response.data]);
            setMugData({ mug_name: '', price: '', image: null });
            alert('Mug created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else {
        setError('Failed to create Mug: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('cap_name', capData.cap_name);
      formData.append('price', capData.price);
      if (capData.image) {
        formData.append('image', capData.image);
      }
      const response = await axios.post('http://82.180.146.4:8001/caps/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setCaps([...caps, response.data]);
      setCapData({ cap_name: '', price: '', image: null });
      alert('Cap created successfully!');
    } catch (error) {
      console.error('Cap creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('cap_name', capData.cap_name);
            formData.append('price', capData.price);
            if (capData.image) {
              formData.append('image', capData.image);
            }
            const response = await axios.post('http://82.180.146.4:8001/caps/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            setCaps([...caps, response.data]);
            setCapData({ cap_name: '', price: '', image: null });
            alert('Cap created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else {
        setError('Failed to create Cap: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTshirtSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('tshirt_name', tshirtData.tshirt_name);
      formData.append('price', tshirtData.price);
      if (tshirtData.image) {
        formData.append('image', tshirtData.image);
      }
      const response = await axios.post('http://82.180.146.4:8001/tshirts/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setTshirts([...tshirts, response.data]);
      setTshirtData({ tshirt_name: '', price: '', image: null });
      alert('Tshirt created successfully!');
    } catch (error) {
      console.error('Tshirt creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('tshirt_name', tshirtData.tshirt_name);
            formData.append('price', tshirtData.price);
            if (tshirtData.image) {
              formData.append('image', tshirtData.image);
            }
            const response = await axios.post('http://82.180.146.4:8001/tshirts/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            setTshirts([...tshirts, response.data]);
            setTshirtData({ tshirt_name: '', price: '', image: null });
            alert('Tshirt created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else {
        setError('Failed to create Tshirt: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('tile_name', tileData.tile_name);
      formData.append('price', tileData.price);
      if (tileData.image) {
        formData.append('image', tileData.image);
      }
      const response = await axios.post('http://82.180.146.4:8001/tiles/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setTiles([...tiles, response.data]);
      setTileData({ tile_name: '', price: '', image: null });
      alert('Tile created successfully!');
    } catch (error) {
      console.error('Tile creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('tile_name', tileData.tile_name);
            formData.append('price', tileData.price);
            if (tileData.image) {
              formData.append('image', tileData.image);
            }
            const response = await axios.post('http://82.180.146.4:8001/tiles/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            setTiles([...tiles, response.data]);
            setTileData({ tile_name: '', price: '', image: null });
            alert('Tile created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else {
        setError('Failed to create Tile: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePenSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('pen_name', penData.pen_name);
      formData.append('price', penData.price);
      if (penData.image) {
        formData.append('image', penData.image);
      }
      const response = await axios.post('http://82.180.146.4:8001/pens/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setPens([...pens, response.data]);
      setPenData({ pen_name: '', price: '', image: null });
      alert('Pen created successfully!');
    } catch (error) {
      console.error('Pen creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('pen_name', penData.pen_name);
            formData.append('price', penData.price);
            if (penData.image) {
              formData.append('image', penData.image);
            }
            const response = await axios.post('http://82.180.146.4:8001/pens/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            setPens([...pens, response.data]);
            setPenData({ pen_name: '', price: '', image: null });
            alert('Pen created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else {
        setError('Failed to create Pen: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintTypeSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('name', printTypeData.name);
      formData.append('price', printTypeData.price);
      if (printTypeData.image) {
        formData.append('image', printTypeData.image);
      }
      const response = await axios.post('http://82.180.146.4:8001/api/print-types/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setPrintTypes([...printTypes, response.data]);
      setPrintTypeData({ name: '', price: '', image: null });
      alert('Print Type created successfully!');
    } catch (error) {
      console.error('Print Type creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('name', printTypeData.name);
            formData.append('price', printTypeData.price);
            if (printTypeData.image) {
              formData.append('image', printTypeData.image);
            }
            const response = await axios.post('http://82.180.146.4:8001/api/print-types/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            setPrintTypes([...printTypes, response.data]);
            setPrintTypeData({ name: '', price: '', image: null });
            alert('Print Type created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError('Only admins can create Print Types.');
      } else {
        setError('Failed to create Print Type: ' + (error.response?.data?.name?.[0] || error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintSizeSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('name', printSizeData.name);
      formData.append('price', printSizeData.price);
      if (printSizeData.image) {
        formData.append('image', printSizeData.image);
      }
      const response = await axios.post('http://82.180.146.4:8001/api/print-sizes/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setPrintSizes([...printSizes, response.data]);
      setPrintSizeData({ name: '', price: '', image: null });
      alert('Print Size created successfully!');
    } catch (error) {
      console.error('Print Size creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('name', printSizeData.name);
            formData.append('price', printSizeData.price);
            if (printSizeData.image) {
              formData.append('image', printSizeData.image);
            }
            const response = await axios.post('http://82.180.146.4:8001/api/print-sizes/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            setPrintSizes([...printSizes, response.data]);
            setPrintSizeData({ name: '', price: '', image: null });
            alert('Print Size created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError('Only admins can create Print Sizes.');
      } else {
        setError('Failed to create Print Size: ' + (error.response?.data?.name?.[0] || error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaperTypeSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('name', paperTypeData.name);
      formData.append('price', paperTypeData.price);
      if (paperTypeData.image) {
        formData.append('image', paperTypeData.image);
      }
      const response = await axios.post('http://82.180.146.4:8001/api/paper-types/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setPaperTypes([...paperTypes, response.data]);
      setPaperTypeData({ name: '', price: '', image: null });
      alert('Paper Type created successfully!');
    } catch (error) {
      console.error('Paper Type creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('name', paperTypeData.name);
            formData.append('price', paperTypeData.price);
            if (paperTypeData.image) {
              formData.append('image', paperTypeData.image);
            }
            const response = await axios.post('http://82.180.146.4:8001/api/paper-types/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            setPaperTypes([...paperTypes, response.data]);
            setPaperTypeData({ name: '', price: '', image: null });
            alert('Paper Type created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError('Only admins can create Paper Types.');
      } else {
        setError('Failed to create Paper Type: ' + (error.response?.data?.name?.[0] || error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaminationTypeSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const formData = new FormData();
      formData.append('name', laminationTypeData.name);
      formData.append('price', laminationTypeData.price);
      if (laminationTypeData.image) {
        formData.append('image', laminationTypeData.image);
      }
      const response = await axios.post('http://82.180.146.4:8001/api/lamination-types/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setLaminationTypes([...laminationTypes, response.data]);
      setLaminationTypeData({ name: '', price: '', image: null });
      alert('Lamination Type created successfully!');
    } catch (error) {
      console.error('Lamination Type creation error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const formData = new FormData();
            formData.append('name', laminationTypeData.name);
            formData.append('price', laminationTypeData.price);
            if (laminationTypeData.image) {
              formData.append('image', laminationTypeData.image);
            }
            const response = await axios.post('http://82.180.146.4:8001/api/lamination-types/', formData, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'multipart/form-data',
              },
            });
            setLaminationTypes([...laminationTypes, response.data]);
            setLaminationTypeData({ name: '', price: '', image: null });
            alert('Lamination Type created successfully!');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError('Only admins can create Lamination Types.');
      } else {
        setError('Failed to create Lamination Type: ' + (error.response?.data?.name?.[0] || error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
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
        const frameResponse = await axios.post('http://82.180.146.4:8001/frames/', formData, {
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
        const frameResponse = await axios.put(`http://82.180.146.4:8001/frames/${frameId}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setFrames(frames.map(f => f.id === Number(frameId) ? frameResponse.data : f));
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
          `http://82.180.146.4:8001/frames/${frameId}/variants/`,
          variantFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      alert(
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
        if (newToken) {
          try {
            let frameResponse;
            if (mode === 'create') {
              const formData = new FormData();
              for (const key in frameData) {
                if (frameData[key] !== '' && frameData[key] !== null) {
                  formData.append(key, frameData[key]);
                }
              }
              frameResponse = await axios.post('http://82.180.146.4:8001/frames/', formData, {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                  'Content-Type': 'multipart/form-data',
                },
              });
              frameId = frameResponse.data.id;
              setFrames([...frames, frameResponse.data]);
            } else if (mode === 'edit') {
              frameId = selectedFrameId;
              const formData = new FormData();
              for (const key in frameData) {
                if (frameData[key] !== '' && frameData[key] !== null) {
                  formData.append(key, frameData[key]);
                }
              }
              frameResponse = await axios.put(`http://82.180.146.4:8001/frames/${frameId}/`, formData, {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                  'Content-Type': 'multipart/form-data',
                },
              });
              setFrames(frames.map(f => f.id === Number(frameId) ? frameResponse.data : f));
            } else {
              frameId = selectedFrameId;
            }

            const variantsData = [];
            for (const variantType in variants) {
              variants[variantType].forEach((variant) => {
                const hasData = Object.values(variant).some(
                  (value) => value !== '' && value !== null && value !== variant.image_key
                );
                if (!hasData) return;
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
                `http://82.180.146.4:8001/frames/${frameId}/variants/`,
                variantFormData,
                {
                  headers: {
                    Authorization: `Bearer ${newToken}`,
                    'Content-Type': 'multipart/form-data',
                  },
                }
              );
            }
            alert(
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
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError('Only admins can perform this action.');
        navigate('/');
      } else {
        setError('Failed to submit: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFrame = async (frameId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://82.180.146.4:8001/frames/${frameId}/`, {
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

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const selectedFrameName = frames.find((f) => f.id === Number(selectedFrameId))?.name || '';

  return (
    <div className="container mt-5">
      <h2>Admin Dashboard</h2>

      <h3>Create Print Type</h3>
      <form onSubmit={handlePrintTypeSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Print Type Name</label>
          <input
            type="text"
            name="name"
            value={printTypeData.name}
            onChange={handlePrintTypeChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            name="price"
            value={printTypeData.price}
            onChange={handlePrintTypeChange}
            className="form-control"
            required
            step="0.01"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Print Type'}
        </button>
      </form>

      <h3>Create Print Size</h3>
      <form onSubmit={handlePrintSizeSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Print Size Name</label>
          <input
            type="text"
            name="name"
            value={printSizeData.name}
            onChange={handlePrintSizeChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            name="price"
            value={printSizeData.price}
            onChange={handlePrintSizeChange}
            className="form-control"
            required
            step="0.01"
          />
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Print Size'}
        </button>
      </form>

      <h3>Create Paper Type</h3>
      <form onSubmit={handlePaperTypeSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Paper Type Name</label>
          <input
            type="text"
            name="name"
            value={paperTypeData.name}
            onChange={handlePaperTypeChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            name="price"
            value={paperTypeData.price}
            onChange={handlePaperTypeChange}
            className="form-control"
            required
            step="0.01"
          />
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Paper Type'}
        </button>
      </form>

      <h3>Create Lamination Type</h3>
      <form onSubmit={handleLaminationTypeSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Lamination Type Name</label>
          <input
            type="text"
            name="name"
            value={laminationTypeData.name}
            onChange={handleLaminationTypeChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            name="price"
            value={laminationTypeData.price}
            onChange={handleLaminationTypeChange}
            className="form-control"
            required
            step="0.01"
          />
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Lamination Type'}
        </button>
      </form>
      
      <h3>Create Category</h3>
      <form onSubmit={handleCategorySubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Category Name</label>
          <input
            type="text"
            name="frameCategory"
            value={categoryData.frameCategory}
            onChange={handleCategoryChange}
            className="form-control"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Category'}
        </button>
      </form>

      <h3>Create MatBoard</h3>
      <form onSubmit={handleMackBoardSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Board Name</label>
          <input
            type="text"
            name="board_name"
            value={mackBoardData.board_name}
            onChange={handleMackBoardChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price (Optional)</label>
          <input
            type="number"
            name="price"
            value={mackBoardData.price}
            onChange={handleMackBoardChange}
            className="form-control"
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Image (Optional)</label>
          <input
            type="file"
            name="image"
            onChange={handleMackBoardChange}
            className="form-control"
            accept="image/*"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create MatBoard'}
        </button>
      </form>

      <h3>Create MatBoard Color Variant</h3>
      <form onSubmit={handleColorVariantSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Select MatBoard</label>
          <select
            name="mack_board_id"
            value={colorVariantData.mack_board_id}
            onChange={handleColorVariantChange}
            className="form-control"
            required
          >
            <option value="">-- Select MackBoard --</option>
            {mackBoards.map((mackBoard) => (
              <option key={mackBoard.id} value={mackBoard.id}>
                {mackBoard.board_name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Color Name</label>
          <input
            type="text"
            name="color_name"
            value={colorVariantData.color_name}
            onChange={handleColorVariantChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Color Image</label>
          <input
            type="file"
            name="image"
            onChange={handleColorVariantChange}
            className="form-control"
            accept="image/*"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Color Variant'}
        </button>
      </form>

      <h3>Create Mug</h3>
      <form onSubmit={handleMugSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Mug Name</label>
          <input
            type="text"
            name="mug_name"
            value={mugData.mug_name}
            onChange={handleMugChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            name="price"
            value={mugData.price}
            onChange={handleMugChange}
            className="form-control"
            required
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Image (Optional)</label>
          <input
            type="file"
            name="image"
            onChange={handleMugChange}
            className="form-control"
            accept="image/*"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Mug'}
        </button>
      </form>

      <h3>Create Cap</h3>
      <form onSubmit={handleCapSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Cap Name</label>
          <input
            type="text"
            name="cap_name"
            value={capData.cap_name}
            onChange={handleCapChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            name="price"
            value={capData.price}
            onChange={handleCapChange}
            className="form-control"
            required
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Image (Optional)</label>
          <input
            type="file"
            name="image"
            onChange={handleCapChange}
            className="form-control"
            accept="image/*"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Cap'}
        </button>
      </form>

      <h3>Create Tshirt</h3>
      <form onSubmit={handleTshirtSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Tshirt Name</label>
          <input
            type="text"
            name="tshirt_name"
            value={tshirtData.tshirt_name}
            onChange={handleTshirtChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            name="price"
            value={tshirtData.price}
            onChange={handleTshirtChange}
            className="form-control"
            required
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Image (Optional)</label>
          <input
            type="file"
            name="image"
            onChange={handleTshirtChange}
            className="form-control"
            accept="image/*"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Tshirt'}
        </button>
      </form>

      <h3>Create Tile</h3>
      <form onSubmit={handleTileSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Tile Name</label>
          <input
            type="text"
            name="tile_name"
            value={tileData.tile_name}
            onChange={handleTileChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            name="price"
            value={tileData.price}
            onChange={handleTileChange}
            className="form-control"
            required
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Image (Optional)</label>
          <input
            type="file"
            name="image"
            onChange={handleTileChange}
            className="form-control"
            accept="image/*"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Tile'}
        </button>
      </form>

      <h3>Create Pen</h3>
      <form onSubmit={handlePenSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Pen Name</label>
          <input
            type="text"
            name="pen_name"
            value={penData.pen_name}
            onChange={handlePenChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            name="price"
            value={penData.price}
            onChange={handlePenChange}
            className="form-control"
            required
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Image (Optional)</label>
          <input
            type="file"
            name="image"
            onChange={handlePenChange}
            className="form-control"
            accept="image/*"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Pen'}
        </button>
      </form>

      <h2>{mode === 'create' ? 'Create Frame' : mode === 'edit' ? 'Edit Frame' : 'Add Variants to Frame'}</h2>
      <div className="mb-3">
        <label className="form-label">Mode</label>
        <select
          className="form-control"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="create">Create New Frame</option>
          <option value="edit">Edit Existing Frame</option>
          <option value="add_variants">Add Variants to Existing Frame</option>
        </select>
      </div>
      <form onSubmit={handleSubmit}>
        {(mode === 'create' || mode === 'edit') && (
          <>
            <h3>Frame Details</h3>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                value={frameData.name}
                onChange={handleFrameChange}
                className="form-control"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Price</label>
              <input
                type="number"
                name="price"
                value={frameData.price}
                onChange={handleFrameChange}
                className="form-control"
                required
                step="0.01"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Inner Width</label>
              <input
                type="number"
                name="inner_width"
                value={frameData.inner_width}
                onChange={handleFrameChange}
                className="form-control"
                required
                step="0.1"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Inner Height</label>
              <input
                type="number"
                name="inner_height"
                value={frameData.inner_height}
                onChange={handleFrameChange}
                className="form-control"
                required
                step="0.1"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Category</label>
              <select
                name="category_id"
                value={frameData.category_id}
                onChange={handleFrameChange}
                className="form-control"
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
              <label className="form-label">Frame Image{mode === 'edit' ? ' (Optional)' : ''}</label>
              <input
                type="file"
                name="image"
                onChange={handleFrameChange}
                className="form-control"
                accept="image/*"
                required={mode === 'create'}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Frame Corner Image{mode === 'edit' ? ' (Optional)' : ''}</label>
              <input
                type="file"
                name="corner_image"
                onChange={handleFrameChange}
                className="form-control"
                accept="image/*"
                required={mode === 'create'}
              />
            </div>
          </>
        )}
        {mode === 'edit' && (
          <div className="mb-3">
            <label className="form-label">Select Frame to Edit</label>
            <select
              className="form-control"
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
        )}
        {mode === 'add_variants' && (
          <div className="mb-3">
            <label className="form-label">Select Frame</label>
            <select
              className="form-control"
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
        )}
        <h3>Color Variants {selectedFrameName && `for ${selectedFrameName}`}</h3>
        {variants.color.map((variant, index) => (
          <div key={variant.image_key} className="border p-3 mb-3">
            <div className="mb-3">
              <label className="form-label">Color Name</label>
              <input
                type="text"
                name="color_name"
                value={variant.color_name}
                onChange={(e) => handleVariantChange('color', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Price</label>
              <input
                type="number"
                name="price"
                value={variant.price}
                onChange={(e) => handleVariantChange('color', index, e)}
                className="form-control"
                step="0.01"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Color Image</label>
              <input
                type="file"
                name="image"
                onChange={(e) => handleVariantChange('color', index, e)}
                className="form-control"
                accept="image/*"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Color Corner Image</label>
              <input
                type="file"
                name="corner_image"
                onChange={(e) => handleVariantChange('color', index, e)}
                className="form-control"
                accept="image/*"
              />
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => removeVariant('color', index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary mb-3"
          onClick={() => addVariant('color')}
        >
          Add Color Variant
        </button>

        <h3>Size Variants {selectedFrameName && `for ${selectedFrameName}`}</h3>
        {variants.size.map((variant, index) => (
          <div key={variant.image_key} className="border p-3 mb-3">
            <div className="mb-3">
              <label className="form-label">Size Name</label>
              <input
                type="text"
                name="size_name"
                value={variant.size_name}
                onChange={(e) => handleVariantChange('size', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Inner Width</label>
              <input
                type="number"
                name="inner_width"
                value={variant.inner_width}
                onChange={(e) => handleVariantChange('size', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Inner Height</label>
              <input
                type="number"
                name="inner_height"
                value={variant.inner_height}
                onChange={(e) => handleVariantChange('size', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Price</label>
              <input
                type="number"
                name="price"
                value={variant.price}
                onChange={(e) => handleVariantChange('size', index, e)}
                className="form-control"
                step="0.01"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Size Image (Optional)</label>
              <input
                type="file"
                name="image"
                onChange={(e) => handleVariantChange('size', index, e)}
                className="form-control"
                accept="image/*"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Size Corner Image (Optional)</label>
              <input
                type="file"
                name="corner_image"
                onChange={(e) => handleVariantChange('size', index, e)}
                className="form-control"
                accept="image/*"
              />
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => removeVariant('size', index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary mb-3"
          onClick={() => addVariant('size')}
        >
          Add Size Variant
        </button>

        <h3>Finishing Variants {selectedFrameName && `for ${selectedFrameName}`}</h3>
        {variants.finish.map((variant, index) => (
          <div key={variant.image_key} className="border p-3 mb-3">
            <div className="mb-3">
              <label className="form-label">Finish Name</label>
              <input
                type="text"
                name="finish_name"
                value={variant.finish_name}
                onChange={(e) => handleVariantChange('finish', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Price</label>
              <input
                type="number"
                name="price"
                value={variant.price}
                onChange={(e) => handleVariantChange('finish', index, e)}
                className="form-control"
                step="0.01"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Finish Image</label>
              <input
                type="file"
                name="image"
                onChange={(e) => handleVariantChange('finish', index, e)}
                className="form-control"
                accept="image/*"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Finish Corner Image</label>
              <input
                type="file"
                name="corner_image"
                onChange={(e) => handleVariantChange('finish', index, e)}
                className="form-control"
                accept="image/*"
              />
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => removeVariant('finish', index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary mb-3"
          onClick={() => addVariant('finish')}
        >
          Add Finishing Variant
        </button>

        <h3>Hanging Variants {selectedFrameName && `for ${selectedFrameName}`}</h3>
        {variants.hanging.map((variant, index) => (
          <div key={variant.image_key} className="border p-3 mb-3">
            <div className="mb-3">
              <label className="form-label">Hanging Name</label>
              <input
                type="text"
                name="hanging_name"
                value={variant.hanging_name}
                onChange={(e) => handleVariantChange('hanging', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Price</label>
              <input
                type="number"
                name="price"
                value={variant.price}
                onChange={(e) => handleVariantChange('hanging', index, e)}
                className="form-control"
                step="0.01"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Hanging Image</label>
              <input
                type="file"
                name="image"
                onChange={(e) => handleVariantChange('hanging', index, e)}
                className="form-control"
                accept="image/*"
              />
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => removeVariant('hanging', index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary mb-3"
          onClick={() => addVariant('hanging')}
        >
          Add Hanging Variant
        </button>
        <div>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading
              ? 'Submitting...'
              : mode === 'create'
              ? 'Create Frame'
              : mode === 'edit'
              ? 'Update Frame'
              : 'Add Variants'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Admin;