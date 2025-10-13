import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import axios from 'axios';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Group, Circle } from 'react-konva';
import { Canvas, useFrame } from '@react-three/fiber';
import { Decal, useGLTF, useTexture, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Upload, 
  Crop, 
  Check, 
  X, 
  Menu, 
  Package, 
  Coffee, 
  Crown, 
  Grid, 
  Pen, 
  Save, 
  Eye, 
  Loader,
  ShoppingCart,
  Palette,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Settings
} from 'lucide-react';
import './GiftPrint.css';

const BASE_URL = 'http://82.180.146.4:8001';

const useImageLoader = (url, crossOrigin = 'anonymous') => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.src = url;
    img.crossOrigin = crossOrigin;

    const handleLoad = () => {
      setImage(img);
      console.log('Image loaded:', url, 'Dimensions:', img.width, 'x', img.height);
    };

    const handleError = (error) => {
      console.error('Failed to load image:', url, error);
      setImage(null);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [url, crossOrigin]);

  return image;
};

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>Oops! Something went wrong</h3>
            <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const categoryIcons = {
  tshirts: Package,
  mugs: Coffee,
  caps: Crown,
  tiles: Grid,
  pens: Pen,
};

const categoryLabels = {
  tshirts: 'T-Shirts',
  mugs: 'Mugs',
  caps: 'Caps',
  tiles: 'Tiles',
  pens: 'Pens',
};

function Mug3D({ mugData, uploadedImage }) {
  const groupRef = useRef();
  const meshRef = useRef();

  const { scene, error } = useGLTF(
    mugData?.glb_file_url ? mugData.glb_file_url : '',
    true,
    (error) => {
      console.error('GLB loading error:', mugData?.glb_file_url, error);
    }
  );

  if (error) {
    console.error('GLB loading failed:', error.message);
    return null;
  }

  useEffect(() => {
    if (scene) {
      let targetMesh = null;
      scene.traverse((child) => {
        if (child.isMesh && !targetMesh) {
          targetMesh = child;
          meshRef.current = child;
          console.log('Target mesh found:', {
            name: child.name || 'Unnamed',
            uuid: child.uuid,
            geometry: child.geometry.type,
            vertexCount: child.geometry.attributes.position?.count || 0,
          });
        }
      });
      if (!targetMesh) {
        console.error('No suitable mesh found in GLB model:', mugData?.glb_file_url);
      } else {
        console.log('Mesh assigned to meshRef:', meshRef.current.name || 'Unnamed');
      }
    }
  }, [scene, mugData?.glb_file_url]);

  const decalTexture = useTexture(
    uploadedImage || '',
    (texture) => {
      if (texture.image) {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;
        texture.flipY = false;
        texture.needsUpdate = true;
        console.log('Decal texture loaded:', {
          url: uploadedImage,
          width: texture.image.width,
          height: texture.image.height,
          format: texture.format,
          type: texture.type,
        });
      } else {
        console.error('Decal texture image is undefined:', uploadedImage);
      }
    },
    (error) => {
      console.error('Failed to load decal texture:', uploadedImage, error);
    }
  );

  useEffect(() => {
    return () => {
      if (decalTexture) {
        decalTexture.dispose();
        console.log('Decal texture disposed:', uploadedImage);
      }
    };
  }, [decalTexture, uploadedImage]);

  useEffect(() => {
    if (scene) {
      console.log('GLB model loaded successfully:', mugData.glb_file_url);
    }
    if (decalTexture && uploadedImage) {
      console.log('Decal texture loaded successfully:', {
        url: uploadedImage.substring(0, 50) + '...',
        dimensions: `${decalTexture.image?.width}x${decalTexture.image?.height}`,
      });
    } else if (uploadedImage) {
      console.warn('Decal texture not loaded:', {
        hasUploadedImage: !!uploadedImage,
        hasDecalTexture: !!decalTexture,
        hasImage: !!decalTexture?.image,
      });
    }
  }, [scene, decalTexture, mugData?.glb_file_url, uploadedImage]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const boundingBox = useMemo(() => {
    if (!scene) return new THREE.Box3();
    const box = new THREE.Box3().setFromObject(scene);
    console.log('Mug bounding box:', {
      min: box.min.toArray(),
      max: box.max.toArray(),
      size: box.getSize(new THREE.Vector3()).toArray(),
    });
    return box;
  }, [scene]);

  const mugSize = boundingBox.getSize(new THREE.Vector3());
  const mugRadius = Math.max(mugSize.x, mugSize.z) / 2;
  const mugHeight = mugSize.y;
  console.log('Mug dimensions:', {
    height: mugHeight.toFixed(3),
    radius: mugRadius.toFixed(3),
  });

  let decalPosition = [0, 0, mugRadius * 1.01];
  let decalRotation = [0, 0, 0];
  let decalScale = [0.1, 0.1, 0.1];

  if (decalTexture && uploadedImage && decalTexture.image && mugHeight > 0 && mugRadius > 0) {
    const aspect = decalTexture.image.width / decalTexture.image.height;
    const maxDecalWidth = mugRadius * 1.5;
    const maxDecalHeight = mugHeight * 0.6;

    let scaleX = maxDecalWidth;
    let scaleY = maxDecalWidth / aspect;

    if (scaleY > maxDecalHeight) {
      scaleY = maxDecalHeight;
      scaleX = maxDecalHeight * aspect;
    }
    if (scaleX > maxDecalWidth) {
      scaleX = maxDecalWidth;
      scaleY = maxDecalWidth / aspect;
    }

    decalScale = [scaleX, scaleY, 1];
    decalPosition = [0, mugHeight * 0.1, mugRadius * 1.01];
    console.log('Decal configuration:', {
      position: decalPosition.map(v => v.toFixed(3)),
      rotation: decalRotation.map(v => v.toFixed(3)),
      scale: decalScale.map(v => v.toFixed(3)),
      textureSize: `${decalTexture.image.width}x${decalTexture.image.height}`,
    });
  } else {
    console.warn('Decal not applied:', {
      hasDecalTexture: !!decalTexture,
      hasUploadedImage: !!uploadedImage,
      hasImage: !!decalTexture?.image,
      mugHeight: mugHeight > 0,
      mugRadius: mugRadius > 0,
    });
  }

  const mugColor = mugData?.color ? new THREE.Color(mugData.color) : new THREE.Color('#ffffff');

  return (
    <group ref={groupRef} scale={[0.5, 0.5, 0.5]}>
      <primitive
        object={scene}
        castShadow={false}
        receiveShadow={false}
      >
        <meshStandardMaterial
          color={mugColor}
          metalness={0.2}
          roughness={0.6}
        />
        {decalTexture && uploadedImage && meshRef.current && decalTexture.image ? (
          <Decal
            mesh={meshRef.current}
            position={decalPosition}
            rotation={decalRotation}
            scale={decalScale}
            map={decalTexture}
            depthTest={true}
            depthWrite={false}
            debug={true}
          />
        ) : (
          console.warn('Decal component not rendered:', {
            hasDecalTexture: !!decalTexture,
            hasUploadedImage: !!uploadedImage,
            hasMesh: !!meshRef.current,
            hasImage: !!decalTexture?.image,
          })
        )}
      </primitive>
    </group>
  );
}

function GiftPrint() {
  const [giftItems, setGiftItems] = useState({
    tshirts: [], mugs: [], caps: [], tiles: [], pens: [],
  });
  const [selectedCategory, setSelectedCategory] = useState('tshirts');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedColorVariant, setSelectedColorVariant] = useState(null);
  const [selectedSizeVariant, setSelectedSizeVariant] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState({ x: 1, y: 1 });
  const [imageRotation, setImageRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 100, y: 100, width: 150, height: 150 });
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [printableArea, setPrintableArea] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState(null);
  const [is3DView, setIs3DView] = useState(false);
  const imageRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    if (selectedCategory !== 'tshirts' || !selectedItem) {
      setSelectedColorVariant(null);
      setSelectedSizeVariant(null);
    }
  }, [selectedCategory, selectedItem]);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newSize = Math.min(containerWidth - 40, window.innerHeight * 0.6, 500);
        setCanvasSize({ width: newSize, height: newSize });

        if (selectedCategory === 'tshirts' && selectedItem) {
          const pixelsPerInch = newSize / 20;
          const areaWidth = 12 * pixelsPerInch;
          const areaHeight = 16 * pixelsPerInch;
          const areaX = (newSize - areaWidth) / 2;
          const areaY = (newSize - areaHeight) / 2 + newSize * 0.1;
          setPrintableArea({ x: areaX, y: areaY, width: areaWidth, height: areaHeight });
        } else {
          setPrintableArea(null);
        }
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [selectedCategory, selectedItem]);

  useEffect(() => {
    const fetchGiftItems = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const endpoints = {
          tshirts: '/tshirts/',
          mugs: '/mugs/',
          caps: '/caps/',
          tiles: '/tiles/',
          pens: '/pens/',
        };
        const responses = await Promise.all(
          Object.keys(endpoints).map((category) =>
            axios.get(`${BASE_URL}${endpoints[category]}`, { headers })
          )
        );
        const fetchedItems = {
          tshirts: responses[0].data,
          mugs: responses[1].data,
          caps: responses[2].data,
          tiles: responses[3].data,
          pens: responses[4].data,
        };
        setGiftItems(fetchedItems);
        setError(null);
      } catch (error) {
        console.error('Error fetching gift items:', error);
        setError(`Failed to load gift items: ${error.response?.statusText || error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchGiftItems();
  }, []);

  const giftImageUrl = useMemo(() => {
    if (selectedCategory === 'tshirts' && selectedColorVariant?.image) {
      return selectedColorVariant.image.startsWith('http') ? selectedColorVariant.image : `${BASE_URL}${selectedColorVariant.image}`;
    }
    if (selectedItem?.image) {
      return selectedItem.image.startsWith('http') ? selectedItem.image : `${BASE_URL}${selectedItem.image}`;
    }
    return '';
  }, [selectedCategory, selectedItem, selectedColorVariant]);

  const giftImage = useImageLoader(giftImageUrl);
  const userImageImage = useImageLoader(uploadedImage);

  useEffect(() => {
    if (imageRef.current && transformerRef.current && isImageSelected && !isCropping && uploadedImage && !is3DView) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [uploadedImage, isCropping, isImageSelected, is3DView]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.src = reader.result;
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const maxTextureSize = 512;
          let { width, height } = img;
          if (width > maxTextureSize || height > maxTextureSize) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const scale = Math.min(maxTextureSize / width, maxTextureSize / height);
            canvas.width = width * scale;
            canvas.height = height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            img.src = canvas.toDataURL('image/png');
          }
          console.log('Uploaded image data URL:', img.src.substring(0, 50) + '...');
          const maxDimension = Math.min(canvasSize.width, canvasSize.height) * 0.5;
          const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
          let initialX, initialY;
          if (selectedCategory === 'tshirts' && printableArea) {
            const imgWidth = img.width * scale;
            const imgHeight = img.height * scale;
            initialX = printableArea.x + (printableArea.width - imgWidth) / 2;
            initialY = printableArea.y + (printableArea.height - imgHeight) / 2;
          } else {
            initialX = canvasSize.width * 0.25;
            initialY = canvasSize.height * 0.25;
          }
          setUploadedImage(img.src);
          setImagePosition({ x: initialX, y: initialY });
          setImageScale({ x: scale, y: scale });
          setImageRotation(0);
          setCropRect({
            x: initialX,
            y: initialY,
            width: img.width * scale,
            height: img.height * scale,
          });
          setIsImageSelected(false);
        };
        img.onerror = (error) => {
          console.error('Error loading uploaded image:', error);
          setOrderFeedback({ type: 'error', message: 'Failed to load uploaded image.' });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCrop = () => {
    if (!userImageImage || !uploadedImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = cropRect.width;
    canvas.height = cropRect.height;
    const ctx = canvas.getContext('2d');

    ctx.translate(-cropRect.x + imagePosition.x, -cropRect.y + imagePosition.y);
    ctx.rotate((imageRotation * Math.PI) / 180);
    ctx.scale(imageScale.x, imageScale.y);

    try {
      ctx.drawImage(userImageImage, 0, 0);
      const croppedImage = canvas.toDataURL('image/png');
      setUploadedImage(croppedImage);
      setImagePosition({ x: cropRect.x, y: cropRect.y });
      setImageScale({ x: 1, y: 1 });
      setImageRotation(0);
      setIsCropping(false);
      setIsImageSelected(true);
    } catch (e) {
      console.error('Error applying crop:', e);
      setOrderFeedback({ type: 'error', message: 'Failed to crop image due to a security restriction.' });
    }
  };

  const generatePreviewImage = async () => {
    if (!stageRef.current || !giftImage || !userImageImage) {
      console.error('Missing required elements for preview generation');
      return null;
    }

    const stage = stageRef.current.getStage();
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d');

    const selectedImage = selectedCategory === 'tshirts' && selectedColorVariant?.image ? selectedColorVariant.image : selectedItem?.image;
    const imgSrc = selectedImage
      ? selectedImage.startsWith('http')
        ? selectedImage
        : `${BASE_URL}${selectedImage}`
      : '';
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = () => {
        console.error('Error loading gift image:', imgSrc);
        resolve();
      };
    });

    if (img.complete && img.naturalWidth !== 0) {
      const giftWidth = img.width * Math.min(canvasSize.width / img.width, canvasSize.height / img.height, 1);
      const giftHeight = img.height * Math.min(canvasSize.width / img.width, canvasSize.height / img.height, 1);
      const giftX = (canvasSize.width - giftWidth) / 2;
      const giftY = (canvasSize.height - giftHeight) / 2;
      try {
        ctx.drawImage(img, giftX, giftY, giftWidth, giftHeight);
      } catch (e) {
        console.error('Error drawing gift image:', e);
        setOrderFeedback({ type: 'error', message: 'Failed to draw gift image due to a security restriction.' });
        return null;
      }
    }

    ctx.save();
    ctx.translate(imagePosition.x, imagePosition.y);
    ctx.rotate((imageRotation * Math.PI) / 180);
    ctx.scale(imageScale.x, imageScale.y);
    try {
      ctx.drawImage(userImageImage, 0, 0, userImageImage.width, userImageImage.height);
    } catch (e) {
      console.error('Error drawing user image:', e);
      setOrderFeedback({ type: 'error', message: 'Failed to draw user image due to a security restriction.' });
      return null;
    }
    ctx.restore();

    try {
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Error exporting canvas:', e);
      setOrderFeedback({
        type: 'error',
        message: 'Failed to generate preview due to a security error. Ensure images are served with CORS.',
      });
      return null;
    }
  };

  const handleSaveOrder = async () => {
    if (!selectedItem || !uploadedImage) {
      setOrderFeedback({ type: 'error', message: 'Please select an item and upload an image.' });
      return;
    }

    if (selectedCategory === 'tshirts' && (!selectedColorVariant || !selectedSizeVariant)) {
      setOrderFeedback({ type: 'error', message: 'Please select both a color and size variant for the T-shirt.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setOrderFeedback({ type: 'error', message: 'You must be logged in to save an order.' });
        return;
      }

      const uploadedResponse = await fetch(uploadedImage);
      const uploadedBlob = await uploadedResponse.blob();
      const uploadedFile = new File([uploadedBlob], 'custom_image.png', { type: 'image/png' });

      let previewImage;
      if (selectedCategory === 'mugs' && is3DView) {
        previewImage = uploadedImage;
      } else {
        previewImage = await generatePreviewImage();
        if (!previewImage) {
          setOrderFeedback({ type: 'error', message: 'Failed to generate preview image.' });
          return;
        }
      }

      const previewResponse = await fetch(previewImage);
      const previewBlob = await previewResponse.blob();
      const previewFile = new File([previewBlob], 'preview_image.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append(`${selectedCategory.slice(0, -1)}`, selectedItem.id);
      if (selectedCategory === 'tshirts') {
        formData.append('tshirt_color_variant', selectedColorVariant.id);
        formData.append('tshirt_size_variant', selectedSizeVariant.id);
        formData.append('total_price', (Number(selectedColorVariant.price) + Number(selectedSizeVariant.price)).toString());
        formData.append('image_position_x', (imagePosition.x - (printableArea?.x || 0)).toString());
        formData.append('image_position_y', (imagePosition.y - (printableArea?.y || 0)).toString());
      } else {
        formData.append('total_price', selectedItem.price.toString());
        formData.append('image_position_x', imagePosition.x.toString());
        formData.append('image_position_y', imagePosition.y.toString());
      }
      formData.append('image_scale_x', imageScale.x.toString());
      formData.append('image_scale_y', imageScale.y.toString());
      formData.append('image_rotation', imageRotation.toString());
      formData.append('uploaded_image', uploadedFile);
      formData.append('preview_image', previewFile);
      formData.append('status', 'pending');

      const result = await axios.post(`${BASE_URL}/gift-orders/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setOrderFeedback({ type: 'success', message: `Order saved successfully! ID: ${result.data.id}` });
      setUploadedImage(null);
      setSelectedItem(null);
      setSelectedColorVariant(null);
      setSelectedSizeVariant(null);
      setImagePosition({ x: 0, y: 0 });
      setImageScale({ x: 1, y: 1 });
      setImageRotation(0);
      setIsImageSelected(false);
      setIsCropping(false);
      setIs3DView(false);
      setPrintableArea(null);
    } catch (error) {
      console.error('Error saving order:', error);
      let errorMessage = 'Failed to save order. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'object' && !Array.isArray(error.response.data)) {
          errorMessage = Object.keys(error.response.data)
            .map((key) => {
              const value = error.response.data[key];
              return Array.isArray(value) ? `${key}: ${value.join(', ')}` : `${key}: ${value}`;
            })
            .join(' ');
        } else {
          errorMessage = 'An unexpected server error occurred.';
        }
      }
      setOrderFeedback({ type: 'error', message: errorMessage });
    }

    setTimeout(() => setOrderFeedback(null), 5000);
  };

  const handleImageClick = () => {
    if (!isCropping && uploadedImage && !is3DView) {
      setIsImageSelected(true);
    }
  };

  const handleStageClick = (e) => {
    if (e.target === stageRef.current?.getStage() && !isCropping && !is3DView) {
      setIsImageSelected(false);
    }
  };

  const handleSave = () => {
    setIsImageSelected(false);
  };

  const handleDragEnd = (e) => {
    let newX = e.target.x();
    let newY = e.target.y();
    if (selectedCategory === 'tshirts' && printableArea && userImageImage) {
      const imgWidth = (userImageImage.width || 100) * imageScale.x;
      const imgHeight = (userImageImage.height || 100) * imageScale.y;
      newX = Math.max(printableArea.x, Math.min(newX, printableArea.x + printableArea.width - imgWidth));
      newY = Math.max(printableArea.y, Math.min(newY, printableArea.y + printableArea.height - imgHeight));
      e.target.x(newX);
      e.target.y(newY);
    }
    setImagePosition({ x: newX, y: newY });
  };

  const handleTransformEnd = (e) => {
    const node = imageRef.current;
    if (node && userImageImage) {
      let newScaleX = node.scaleX();
      let newScaleY = node.scaleY();
      let newX = node.x();
      let newY = node.y();
      if (selectedCategory === 'tshirts' && printableArea) {
        const imgWidth = (userImageImage.width || 100) * newScaleX;
        const imgHeight = (userImageImage.height || 100) * newScaleY;
        newScaleX = Math.min(newScaleX, printableArea.width / (userImageImage.width || 100));
        newScaleY = Math.min(newScaleY, printableArea.height / (userImageImage.height || 100));
        newX = Math.max(printableArea.x, Math.min(newX, printableArea.x + printableArea.width - imgWidth));
        newY = Math.max(printableArea.y, Math.min(newY, printableArea.y + printableArea.height - imgHeight));
        node.scaleX(newScaleX);
        node.scaleY(newScaleY);
        node.x(newX);
        node.y(newY);
      }
      setImageScale({ x: newScaleX, y: newScaleY });
      setImagePosition({ x: newX, y: newY });
      setImageRotation(node.rotation());
    }
  };

  const handleCrop = () => {
    if (isCropping) {
      setIsCropping(false);
      setCropRect({
        x: printableArea ? printableArea.x + printableArea.width * 0.25 : canvasSize.width * 0.25,
        y: printableArea ? printableArea.y + printableArea.height * 0.25 : canvasSize.height * 0.25,
        width: canvasSize.width * 0.5,
        height: canvasSize.width * 0.5,
      });
      setIsImageSelected(true);
    } else {
      setIsCropping(true);
      setIsImageSelected(false);
      if (userImageImage) {
        setCropRect({
          x: imagePosition.x,
          y: imagePosition.y,
          width: (userImageImage.width || 100) * imageScale.x,
          height: (userImageImage.height || 100) * imageScale.y,
        });
      }
    }
  };

  const handleCropHandleDrag = (handle, e) => {
    const newCropRect = { ...cropRect };
    const { x, y } = e.target.position();

    const minSize = 20;
    let maxX = canvasSize.width - minSize;
    let maxY = canvasSize.height - minSize;
    let maxWidth = canvasSize.width;

    if (selectedCategory === 'tshirts' && printableArea) {
      maxX = printableArea.x + printableArea.width - minSize;
      maxY = printableArea.y + printableArea.height - minSize;
      maxWidth = printableArea.width;
    } else if (selectedCategory === 'mugs') {
      maxWidth = canvasSize.width * 0.8;
    }

    switch (handle) {
      case 'top-left':
        newCropRect.x = Math.max(printableArea ? printableArea.x : 0, Math.min(x, newCropRect.x + newCropRect.width - minSize));
        newCropRect.y = Math.max(printableArea ? printableArea.y : 0, Math.min(y, newCropRect.y + newCropRect.height - minSize));
        newCropRect.width = Math.max(minSize, Math.min(newCropRect.width + (newCropRect.x - x), maxWidth));
        newCropRect.height = Math.max(minSize, newCropRect.height + (newCropRect.y - y));
        break;
      case 'top-right':
        newCropRect.y = Math.max(printableArea ? printableArea.y : 0, Math.min(y, newCropRect.y + newCropRect.height - minSize));
        newCropRect.width = Math.max(minSize, Math.min(x - newCropRect.x, maxWidth));
        newCropRect.height = Math.max(minSize, newCropRect.height + (newCropRect.y - y));
        break;
      case 'bottom-left':
        newCropRect.x = Math.max(printableArea ? printableArea.x : 0, Math.min(x, newCropRect.x + newCropRect.width - minSize));
        newCropRect.width = Math.max(minSize, Math.min(newCropRect.width + (newCropRect.x - x), maxWidth));
        newCropRect.height = Math.max(minSize, y - newCropRect.y);
        break;
      case 'bottom-right':
        newCropRect.width = Math.max(minSize, Math.min(x - newCropRect.x, maxWidth));
        newCropRect.height = Math.max(minSize, y - newCropRect.y);
        break;
      case 'top':
        newCropRect.y = Math.max(printableArea ? printableArea.y : 0, Math.min(y, newCropRect.y + newCropRect.height - minSize));
        newCropRect.height = Math.max(minSize, newCropRect.height + (newCropRect.y - y));
        break;
      case 'bottom':
        newCropRect.height = Math.max(minSize, y - newCropRect.y);
        break;
      case 'left':
        newCropRect.x = Math.max(printableArea ? printableArea.x : 0, Math.min(x, newCropRect.x + newCropRect.width - minSize));
        newCropRect.width = Math.max(minSize, Math.min(newCropRect.width + (newCropRect.x - x), maxWidth));
        break;
      case 'right':
        newCropRect.width = Math.max(minSize, Math.min(x - newCropRect.x, maxWidth));
        break;
      default:
        break;
    }

    setCropRect(newCropRect);
    e.target.position(getHandlePosition(handle, newCropRect));
  };

  const getHandlePosition = (handle, rect) => {
    switch (handle) {
      case 'top-left':
        return { x: rect.x, y: rect.y };
      case 'top-right':
        return { x: rect.x + rect.width, y: rect.y };
      case 'bottom-left':
        return { x: rect.x, y: rect.y + rect.height };
      case 'bottom-right':
        return { x: rect.x + rect.width, y: rect.y + rect.height };
      case 'top':
        return { x: rect.x + rect.width / 2, y: rect.y };
      case 'bottom':
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
      case 'left':
        return { x: rect.x, y: rect.y + rect.height / 2 };
      case 'right':
        return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const handleSideDrag = (side, e) => {
    const node = imageRef.current;
    if (node && userImageImage) {
      const newScale = { ...imageScale };
      const newPosition = { ...imagePosition };
      const { x, y } = e.target.position();
      const minSize = 20;

      let maxWidth = canvasSize.width;
      let minX = 0;
      let minY = 0;

      if (selectedCategory === 'tshirts' && printableArea) {
        maxWidth = printableArea.width;
        minX = printableArea.x;
        minY = printableArea.y;
      } else if (selectedCategory === 'mugs') {
        maxWidth = canvasSize.width * 0.8;
      }

      switch (side) {
        case 'left':
          newScale.x = Math.max(
            minSize / (userImageImage.width || 100),
            (imagePosition.x + imageScale.x * (userImageImage.width || 100) - x) / (userImageImage.width || 100)
          );
          newPosition.x = x;
          break;
        case 'right':
          newScale.x = Math.max(minSize / (userImageImage.width || 100), (x - imagePosition.x) / (userImageImage.width || 100));
          break;
        case 'top':
          newScale.y = Math.max(
            minSize / (userImageImage.height || 100),
            (imagePosition.y + imageScale.y * (userImageImage.height || 100) - y) / (userImageImage.height || 100)
          );
          newPosition.y = y;
          break;
        case 'bottom':
          newScale.y = Math.max(minSize / (userImageImage.height || 100), (y - imagePosition.y) / (userImageImage.height || 100));
          break;
      }

      if (selectedCategory === 'tshirts' && printableArea) {
        newScale.x = Math.min(newScale.x, printableArea.width / (userImageImage.width || 100));
        newScale.y = Math.min(newScale.y, printableArea.height / (userImageImage.height || 100));
        newPosition.x = Math.max(minX, Math.min(newPosition.x, minX + printableArea.width - (userImageImage.width || 100) * newScale.x));
        newPosition.y = Math.max(minY, Math.min(newPosition.y, minY + printableArea.height - (userImageImage.height || 100) * newScale.y));
      } else if (selectedCategory === 'mugs') {
        newScale.x = Math.min(newScale.x, maxWidth / (userImageImage.width || 100));
      }

      setImageScale(newScale);
      setImagePosition(newPosition);
      e.target.position(getSideHandlePosition(side, newPosition, newScale, userImageImage));
    }
  };

  const getSideHandlePosition = (side, position, scale, image) => {
    const imgWidth = (image.width || 100) * scale.x;
    const imgHeight = (image.height || 100) * scale.y;
    switch (side) {
      case 'left':
        return { x: position.x, y: position.y + imgHeight / 2 };
      case 'right':
        return { x: position.x + imgWidth, y: position.y + imgHeight / 2 };
      case 'top':
        return { x: position.x + imgWidth / 2, y: position.y };
      case 'bottom':
        return { x: position.x + imgWidth / 2, y: position.y + imgHeight };
      default:
        return { x: 0, y: 0 };
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleView = () => {
    setIs3DView(!is3DView);
    setIsImageSelected(false);
    setIsCropping(false);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <ErrorBoundary>
      <div className="gift-print-app">
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <button className="mobile-menu-btn" onClick={toggleSidebar}>
                <Menu size={24} />
              </button>
              <h1 className="app-title">Gift Designer Studio</h1>
            </div>
            <div className="header-right">
              {selectedItem && uploadedImage && (selectedCategory !== 'tshirts' || (selectedColorVariant && selectedSizeVariant)) && (
                <button className="save-order-btn" onClick={handleSaveOrder}>
                  <ShoppingCart size={18} />
                  Save Order
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="app-body">
          {/* Sidebar */}
          <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="sidebar-header">
              <h2>Categories</h2>
              <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <Loader className="spinner" />
                <p>Loading products...</p>
              </div>
            )}

            <div className="categories-container">
              {Object.keys(giftItems).map((category) => {
                const Icon = categoryIcons[category];
                return (
                  <div key={category} className="category-section">
                    <button
                      className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setSelectedItem(null);
                        setSelectedColorVariant(null);
                        setSelectedSizeVariant(null);
                        setIs3DView(category === 'mugs' ? is3DView : false);
                        setPrintableArea(null);
                      }}
                    >
                      <Icon size={20} />
                      <span>{categoryLabels[category]}</span>
                    </button>

                    {selectedCategory === category && (
                      <div className="products-grid">
                        {giftItems[category].map((item) => (
                          <div
                            key={item.id}
                            className={`product-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedItem(item);
                              setSelectedColorVariant(null);
                              setSelectedSizeVariant(null);
                              setIsSidebarOpen(false);
                            }}
                          >
                            <div className="product-image">
                              {item.image ? (
                                <img
                                  src={item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}`}
                                  alt={item[`${category.slice(0, -1)}_name`] || item.name || 'Product'}
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA2NUw1MCA0NUw2NSA2NUgzNVoiIGZpbGw9IiNEMUQ1REIiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzNSIgcj0iNSIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4K';
                                  }}
                                />
                              ) : (
                                <div className="placeholder-image">
                                  <Icon size={32} />
                                </div>
                              )}
                            </div>
                            <div className="product-info">
                              <h3 className="product-name">
                                {item[`${category.slice(0, -1)}_name`] || item.name || 'Unnamed Product'}
                              </h3>
                              {item.price && <p className="product-price">${item.price}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Main Content */}
          <main className="main-content" ref={containerRef}>
            {/* Toolbar */}
            <div className="toolbar">
              <div className="toolbar-section">
                <button className="tool-btn primary" onClick={triggerFileUpload}>
                  <Upload size={18} />
                  Upload Image
                </button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
              </div>

              {selectedCategory === 'tshirts' && selectedItem && (
                <div className="toolbar-section">
                  <select
                    value={selectedColorVariant?.id || ''}
                    onChange={(e) => {
                      const variant = selectedItem.color_variants.find((v) => v.id === parseInt(e.target.value));
                      setSelectedColorVariant(variant || null);
                    }}
                    className="variant-select"
                  >
                    <option value="">Select Color</option>
                    {selectedItem.color_variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.color_name} (${variant.price})
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedSizeVariant?.id || ''}
                    onChange={(e) => {
                      const variant = selectedItem.size_variants.find((v) => v.id === parseInt(e.target.value));
                      setSelectedSizeVariant(variant || null);
                    }}
                    className="variant-select"
                  >
                    <option value="">Select Size</option>
                    {selectedItem.size_variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.size_name} (${variant.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {uploadedImage && (
                <div className="toolbar-section">
                  {selectedCategory === 'mugs' && selectedItem?.glb_file_url && (
                    <button className="tool-btn" onClick={toggleView}>
                      <Eye size={18} />
                      {is3DView ? '2D View' : '3D View'}
                    </button>
                  )}
                  {!is3DView && (
                    <>
                      <button
                        className={`tool-btn ${isCropping ? 'danger' : ''}`}
                        onClick={handleCrop}
                      >
                        {isCropping ? <X size={18} /> : <Crop size={18} />}
                        {isCropping ? 'Cancel' : 'Crop'}
                      </button>
                      {isCropping && (
                        <button className="tool-btn success" onClick={applyCrop}>
                          <Check size={18} />
                          Apply
                        </button>
                      )}
                      {!isCropping && (
                        <button className="tool-btn" onClick={handleSave}>
                          <Save size={18} />
                          Save
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Feedback Messages */}
            {orderFeedback && (
              <div className={`feedback-message ${orderFeedback.type}`}>
                <p>{orderFeedback.message}</p>
              </div>
            )}

            {/* Canvas Area */}
            <div className="canvas-area">
              <div className="canvas-container">
                {selectedCategory === 'mugs' && is3DView && selectedItem?.glb_file_url ? (
                  <div className="canvas-3d">
                    <Suspense fallback={
                      <div className="loading-3d">
                        <Loader className="spinner" />
                        <p>Loading 3D Model...</p>
                      </div>
                    }>
                      <Canvas
                        style={{ width: canvasSize.width, height: canvasSize.height }}
                        camera={{ position: [0, 0, 0.5], fov: 50 }}
                        gl={{
                          preserveDrawingBuffer: false,
                          antialias: true,
                          powerPreference: 'low-power',
                          failIfMajorPerformanceCaveat: true,
                          stencil: false,
                          alpha: false,
                        }}
                        onContextLost={(e) => {
                          console.error('WebGL context lost:', e);
                          setOrderFeedback({
                            type: 'error',
                            message: '3D rendering failed. Try refreshing or using a simpler model.',
                          });
                        }}
                        onContextRestored={() => {
                          console.log('WebGL context restored');
                          setOrderFeedback(null);
                        }}
                      >
                        <ambientLight intensity={0.4} />
                        <pointLight position={[0.5, 0.5, 0.5]} intensity={0.6} />
                        <Mug3D mugData={selectedItem} uploadedImage={uploadedImage} />
                        <OrbitControls enableZoom={true} />
                      </Canvas>
                    </Suspense>
                  </div>
                ) : (
                  <div className="canvas-2d">
                    <Stage
                      width={canvasSize.width}
                      height={canvasSize.height}
                      className="design-canvas"
                      ref={stageRef}
                      onClick={handleStageClick}
                    >
                      <Layer>
                        {giftImage && (() => {
                          const maxDimension = Math.min(canvasSize.width, canvasSize.height);
                          const aspectRatio = giftImage.width / giftImage.height;
                          let width, height;

                          if (selectedCategory === 'mugs') {
                            width = canvasSize.width * 0.9;
                            height = width / aspectRatio;
                            if (height > canvasSize.height * 0.9) {
                              height = canvasSize.height * 0.9;
                              width = height * aspectRatio;
                            }
                          } else {
                            width = giftImage.width;
                            height = giftImage.height;
                            const scale = Math.min(maxDimension / giftImage.width, maxDimension / giftImage.height, 1);
                            width *= scale;
                            height *= scale;
                          }

                          const x = (canvasSize.width - width) / 2;
                          const y = (canvasSize.height - height) / 2;

                          return (
                            <KonvaImage
                              image={giftImage}
                              width={width}
                              height={height}
                              x={x}
                              y={y}
                            />
                          );
                        })()}
                        {userImageImage && (
                          <Group
                            clipX={isCropping && selectedCategory === 'tshirts' ? printableArea?.x : isCropping ? cropRect.x : undefined}
                            clipY={isCropping && selectedCategory === 'tshirts' ? printableArea?.y : isCropping ? cropRect.y : undefined}
                            clipWidth={isCropping && selectedCategory === 'tshirts' ? printableArea?.width : isCropping ? cropRect.width : undefined}
                            clipHeight={isCropping && selectedCategory === 'tshirts' ? printableArea?.height : isCropping ? cropRect.height : undefined}
                          >
                            <KonvaImage
                              image={userImageImage}
                              x={imagePosition.x}
                              y={imagePosition.y}
                              scaleX={imageScale.x}
                              scaleY={imageScale.y}
                              rotation={imageRotation}
                              draggable={!isCropping}
                              ref={imageRef}
                              onClick={handleImageClick}
                              onTap={handleImageClick}
                              onDragEnd={handleDragEnd}
                              onTransformEnd={handleTransformEnd}
                            />
                          </Group>
                        )}
                        {isCropping && (
                          <>
                            <Rect
                              x={cropRect.x}
                              y={cropRect.y}
                              width={cropRect.width}
                              height={cropRect.height}
                              stroke="#6366f1"
                              strokeWidth={2}
                              draggable={false}
                            />
                            {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'].map(
                              (handle) => (
                                <Circle
                                  key={handle}
                                  x={getHandlePosition(handle, cropRect).x}
                                  y={getHandlePosition(handle, cropRect).y}
                                  radius={8}
                                  fill="white"
                                  stroke="#6366f1"
                                  strokeWidth={2}
                                  draggable
                                  onDragMove={(e) => handleCropHandleDrag(handle, e)}
                                  onDragEnd={(e) => handleCropHandleDrag(handle, e)}
                                />
                              )
                            )}
                          </>
                        )}
                        {!isCropping && userImageImage && isImageSelected && (
                          <>
                            {['left', 'right', 'top', 'bottom'].map((side) => (
                              <Circle
                                key={side}
                                x={getSideHandlePosition(side, imagePosition, imageScale, userImageImage).x}
                                y={getSideHandlePosition(side, imagePosition, imageScale, userImageImage).y}
                                radius={8}
                                fill="white"
                                stroke="#6366f1"
                                strokeWidth={2}
                                draggable
                                onDragMove={(e) => handleSideDrag(side, e)}
                                onDragEnd={(e) => handleSideDrag(side, e)}
                              />
                            ))}
                          </>
                        )}
                        {userImageImage && !isCropping && isImageSelected && (
                          <Transformer
                            ref={transformerRef}
                            boundBoxFunc={(oldBox, newBox) => {
                              if (newBox.width < 20 || newBox.height < 20) {
                                return oldBox;
                              }
                              if (selectedCategory === 'tshirts' && printableArea && userImageImage) {
                                const scaleX = newBox.width / (userImageImage.width || 100);
                                const scaleY = newBox.height / (userImageImage.height || 100);
                                const imgWidth = (userImageImage.width || 100) * scaleX;
                                const imgHeight = (userImageImage.height || 100) * scaleY;
                                const newX = Math.max(printableArea.x, Math.min(newBox.x, printableArea.x + printableArea.width - imgWidth));
                                const newY = Math.max(printableArea.y, Math.min(newBox.y, printableArea.y + printableArea.height - imgHeight));
                                return {
                                  ...newBox,
                                  x: newX,
                                  y: newY,
                                  width: Math.min(newBox.width, printableArea.width),
                                  height: Math.min(newBox.height, printableArea.height),
                                };
                              }
                              return newBox;
                            }}
                          />
                        )}
                      </Layer>
                    </Stage>
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            {selectedItem && (
              <div className="product-summary">
                <div className="summary-content">
                  <div className="summary-item">
                    <span className="label">Selected:</span>
                    <span className="value">
                      {selectedItem[`${selectedCategory.slice(0, -1)}_name`] || selectedItem.name || 'Unnamed Product'}
                    </span>
                  </div>
                  {selectedCategory === 'tshirts' && selectedColorVariant && selectedSizeVariant && (
                    <div className="summary-item">
                      <span className="label">Variant:</span>
                      <span className="value">
                        {selectedColorVariant.color_name} - {selectedSizeVariant.size_name}
                      </span>
                    </div>
                  )}
                  {(selectedCategory === 'tshirts'
                    ? selectedColorVariant && selectedSizeVariant
                      ? Number(selectedColorVariant.price) + Number(selectedSizeVariant.price)
                      : 0
                    : selectedItem?.price) && (
                    <div className="summary-item">
                      <span className="label">Price:</span>
                      <span className="value price">
                        $
                        {selectedCategory === 'tshirts'
                          ? selectedColorVariant && selectedSizeVariant
                            ? (Number(selectedColorVariant.price) + Number(selectedSizeVariant.price)).toFixed(2)
                            : '0.00'
                          : selectedItem.price}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      </div>
    </ErrorBoundary>
  );
}

export default GiftPrint;