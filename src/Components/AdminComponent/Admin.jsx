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
  const [selectedFrameId, setSelectedFrameId] = useState('');
  const [frameData, setFrameData] = useState({
    name: '',
    price: '',
    inner_width: '',
    inner_height: '',
    image: null,
    corner_image: null,
    category_id: '', // Add category_id
  });
  const [categoryData, setCategoryData] = useState({ frameCategory: '' }); // For creating new categories
  const [variants, setVariants] = useState({
    color: [{ color_name: '', image: null, corner_image: null, image_key: `color_0_${Date.now()}`, price: '' }],
    size: [{ size_name: '', inner_width: '', inner_height: '', image: null, corner_image: null, image_key: `size_0_${Date.now()}`, price: '' }],
    finish: [{ finish_name: '', image: null, corner_image: null, image_key: `finish_0_${Date.now()}`, price: '' }],
    hanging: [{ hanging_name: '', image: null, image_key: `hanging_0_${Date.now()}`, price: '' }],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (!user.username || user.type !== 'admin') {
      setError('Please log in as an admin to access this page.');
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch frames and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [framesResponse, categoriesResponse] = await Promise.all([
          axios.get('http://localhost:8000/frames/'),
          axios.get('http://localhost:8000/categories/')
        ]);
        setFrames(framesResponse.data);
        setCategories(categoriesResponse.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load frames or categories.');
      }
    };
    fetchData();
  }, []);

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) throw new Error('No refresh token available');
      const response = await axios.post('http://localhost:8000/api/token/refresh/', { refresh });
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

  const handleFrameChange = (e) => {
    const { name, value, files } = e.target;
    setFrameData({ ...frameData, [name]: files ? files[0] : value });
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryData({ ...categoryData, [name]: value });
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
      const response = await axios.post('http://localhost:8000/categories/', categoryData, {
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
            const response = await axios.post('http://localhost:8000/categories/', categoryData, {
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
        // Create new frame
        const formData = new FormData();
        for (const key in frameData) {
          if (frameData[key] !== '' && frameData[key] !== null) {
            formData.append(key, frameData[key]);
          }
        }
        console.log('Submitting frame data:');
        for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }
        const frameResponse = await axios.post('http://localhost:8000/frames/', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        frameId = frameResponse.data.id;
        console.log('Frame created:', frameResponse.data);
        setFrames([...frames, frameResponse.data]); // Update frames list
      } else if (mode === 'edit') {
        // Update existing frame
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
        console.log('Updating frame data:');
        for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }
        const frameResponse = await axios.put(`http://localhost:8000/frames/${frameId}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Frame updated:', frameResponse.data);
        setFrames(frames.map(f => f.id === Number(frameId) ? frameResponse.data : f));
      } else {
        // Add variants to existing frame
        frameId = selectedFrameId;
        if (!frameId) {
          setError('Please select a frame to add variants.');
          return;
        }
      }

      // Prepare variants for bulk creation
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

        console.log('Submitting variants for frame ID:', frameId);
        console.log('variants:', variantsData);
        for (let [key, value] of variantFormData.entries()) {
          console.log(`${key}: ${value}`);
        }

        const variantResponse = await axios.post(
          `http://localhost:8000/frames/${frameId}/variants/`,
          variantFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Variants created:', variantResponse.data);
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
              frameResponse = await axios.post('http://localhost:8000/frames/', formData, {
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
              frameResponse = await axios.put(`http://localhost:8000/frames/${frameId}/`, formData, {
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
                `http://localhost:8000/frames/${frameId}/variants/`,
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
        setError(
          'Failed to submit: ' +
          (error.response?.data?.errors?.map((e) => e.error).join('; ') ||
            JSON.stringify(error.response?.data) ||
            error.message)
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFrame = async (frameId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/frames/${frameId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFrameData({
        name: response.data.name,
        price: response.data.price,
        inner_width: response.data.inner_width,
        inner_height: response.data.inner_height,
        image: null, // File inputs are cleared; user must re-upload if updating
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

      <h2>{mode === 'create' ? 'Create Frame' : mode === 'edit' ? 'Edit Frame' : 'Add Variants to Frame'}</h2>
      {/* Frame Form */}
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