import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function Admin() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [mode, setMode] = useState('create'); // 'create' or 'add_variants'
  const [frames, setFrames] = useState([]);
  const [selectedFrameId, setSelectedFrameId] = useState('');
  const [frameData, setFrameData] = useState({
    name: '',
    price: '',
    inner_width: '',
    inner_height: '',
    image: null,
  });
  const [variants, setVariants] = useState({
    color: [{ color_name: '', image: null, image_key: `color_0_${Date.now()}`, price: '' }],
    size: [{ size_name: '', inner_width: '', inner_height: '', image: null, image_key: `size_0_${Date.now()}`, price: '' }],
    finish: [{ finish_name: '', image: null, image_key: `finish_0_${Date.now()}`, price: '' }],
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

  // Fetch frames for dropdown
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const response = await axios.get('http://143.110.178.225/frames/');
        setFrames(response.data);
      } catch (err) {
        console.error('Failed to fetch frames:', err);
        setError('Failed to load frames.');
      }
    };
    fetchFrames();
  }, []);

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) throw new Error('No refresh token available');
      const response = await axios.post('http://143.110.178.225/api/token/refresh/', { refresh });
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
      ...(variantType === 'color' && { color_name: '', image: null, image_key: `color_${newVariants[variantType].length}_${timestamp}`, price: '' }),
      ...(variantType === 'size' && { size_name: '', inner_width: '', inner_height: '', image: null, image_key: `size_${newVariants[variantType].length}_${timestamp}`, price: '' }),
      ...(variantType === 'finish' && { finish_name: '', image: null, image_key: `finish_${newVariants[variantType].length}_${timestamp}`, price: '' }),
      ...(variantType === 'hanging' && { hanging_name: '', image: null, image_key: `hanging_${newVariants[variantType].length}_${timestamp}`, price: '' }),
    });
    setVariants(newVariants);
  };

  const removeVariant = (variantType, index) => {
    const newVariants = { ...variants };
    newVariants[variantType].splice(index, 1);
    setVariants(newVariants);
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
        const frameResponse = await axios.post('http://143.110.178.225/frames/', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        frameId = frameResponse.data.id;
        console.log('Frame created:', frameResponse.data);
      } else {
        // Use selected frame for adding variants
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
            if (key !== 'image' && key !== 'image_key' && variant[key] !== '' && variant[key] !== null) {
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
          const variantImage = variants[variant.variant_type].find(
            (v) => v.image_key === variant.image_key
          )?.image;
          if (variantImage) {
            variantFormData.append(variant.image_key, variantImage);
          }
        });

        console.log('Submitting variants for frame ID:', frameId);
        console.log('variants:', variantsData);
        for (let [key, value] of variantFormData.entries()) {
          console.log(`${key}: ${value}`);
        }

        const variantResponse = await axios.post(
          `http://143.110.178.225/frames/${frameId}/variants/`, // Fixed endpoint
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
          : 'Variants added successfully!'
      );
      setFrameData({
        name: '',
        price: '',
        inner_width: '',
        inner_height: '',
        image: null,
      });
      setVariants({
        color: [{ color_name: '', image: null, image_key: `color_0_${Date.now()}` }],
        size: [{ size_name: '', inner_width: '', inner_height: '', image: null, image_key: `size_0_${Date.now()}` }],
        finish: [{ finish_name: '', image: null, image_key: `finish_0_${Date.now()}` }],
        hanging: [{ hanging_name: '', image: null, image_key: `hanging_0_${Date.now()}` }],
      });
      setSelectedFrameId('');
      setMode('create');
    } catch (error) {
      console.error('Submission error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        const newToken = await refreshToken(); // Fixed typo
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
              frameResponse = await axios.post('http://143.110.178.225/frames/', formData, {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                  'Content-Type': 'multipart/form-data',
                },
              });
              frameId = frameResponse.data.id;
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
                  if (key !== 'image' && key !== 'image_key' && variant[key] !== '') {
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
                const variantImage = variants[variant.variant_type].find(
                  (v) => v.image_key === variant.image_key
                )?.image;
                if (variantImage) {
                  variantFormData.append(variant.image_key, variantImage);
                }
              });

              await axios.post(
                `http://143.110.178.225/frames/${frameId}/variants/`, // Fixed endpoint
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
                : 'Variants added successfully!'
            );
            setFrameData({
              name: '',
              price: '',
              inner_width: '',
              inner_height: '',
              image: null,
            });
            setVariants({
              color: [{ color_name: '', image: null, image_key: `color_0_${Date.now()}`,price: '' }],
              size: [{ size_name: '', inner_width: '', inner_height: '', image: null, image_key: `size_0_${Date.now()}`,price: '' }],
              finish: [{ finish_name: '', image: null, image_key: `finish_0_${Date.now()}`,price: '' }],
              hanging: [{ hanging_name: '', image: null, image_key: `hanging_0_${Date.now()}`,price: '' }],
            });
            setSelectedFrameId('');
            setMode('create');
          } catch (retryError) {
            setError('Session expired. Please log in again.');
            navigate('/');
          }
        } else {
          setError('Session expired. Please log in again.');
          navigate('/');
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

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const selectedFrameName = frames.find((f) => f.id === Number(selectedFrameId))?.name || '';

  return (
    <div className="container mt-5">
      <h2>{mode === 'create' ? 'Create Frame' : 'Add Variants to Frame'}</h2>
      <div className="mb-3">
        <label className="form-label">Mode</label>
        <select
          className="form-control"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="create">Create New Frame</option>
          <option value="add_variants">Add Variants to Existing Frame</option>
        </select>
      </div>
      <form onSubmit={handleSubmit}>
        {mode === 'create' && (
          <>
            <h3>Frame Details</h3>
            <div className="mb-3">
              <label>Name</label>
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
              <label>Price</label>
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
              <label>Inner Width</label>
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
              <label>Inner Height</label>
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
              <label>Frame Image</label>
              <input
                type="file"
                name="image"
                onChange={handleFrameChange}
                className="form-control"
                accept="image/*"
                required
              />
            </div>
          </>
        )}
        {mode === 'add_variants' && (
          <div className="mb-3">
            <label>Select Frame</label>
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
              <label>Color Name</label>
              <input
                type="text"
                name="color_name"
                value={variant.color_name}
                onChange={(e) => handleVariantChange('color', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label>Price</label>
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
              <label>Color Image</label>
              <input
                type="file"
                name="image"
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
              <label>Size Name</label>
              <input
                type="text"
                name="size_name"
                value={variant.size_name}
                onChange={(e) => handleVariantChange('size', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label>Inner Width</label>
              <input
                type="number"
                name="inner_width"
                value={variant.inner_width}
                onChange={(e) => handleVariantChange('size', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label>Inner Height</label>
              <input
                type="number"
                name="inner_height"
                value={variant.inner_height}
                onChange={(e) => handleVariantChange('size', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label>Price</label>
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
              <label>Size Image (Optional)</label>
              <input
                type="file"
                name="image"
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
              <label>Finish Name</label>
              <input
                type="text"
                name="finish_name"
                value={variant.finish_name}
                onChange={(e) => handleVariantChange('finish', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label>Price</label>
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
              <label>Finish Image</label>
              <input
                type="file"
                name="image"
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
              <label>Hanging Name</label>
              <input
                type="text"
                name="hanging_name"
                value={variant.hanging_name}
                onChange={(e) => handleVariantChange('hanging', index, e)}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label>Price</label>
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
              <label>Hanging Image</label>
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
                : 'Add Variants'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default Admin;