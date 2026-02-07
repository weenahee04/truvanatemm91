import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, DollarSign, Package, Tag, FileText, Truck, Save, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { addProduct, updateProduct, getProductById } from '../services/productService';
import { uploadImage } from '../services/storageService';
import { useGlobal } from '../context/GlobalContext';
import { auth } from '../config/firebase';

interface ProductFormData {
  title: string;
  description: string;
  sku: string;
  priceUSD: number;
  priceTHB: number;
  originalPriceTHB?: number;
  category: string;
  subcategory?: string;
  brand?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  mainImage: string;
  additionalImages: string[];
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  shipsFrom: string;
  status: 'draft' | 'active' | 'out_of_stock' | 'discontinued';
  isFeatured: boolean;
  isFlashSale: boolean;
  flashSaleEndsAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Toys & Games',
  'Books',
  'Automotive',
  'Health & Wellness',
  'Food & Beverages',
  'สินค้าพิเศษ',
  'Other'
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'discontinued', label: 'Discontinued' }
];

export const SellerProductSettings: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useGlobal();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    sku: '',
    priceUSD: 0,
    priceTHB: 0,
    originalPriceTHB: undefined,
    category: '',
    subcategory: '',
    brand: '',
    stockQuantity: 0,
    lowStockThreshold: 5,
    mainImage: '',
    additionalImages: [],
    weight: undefined,
    dimensions: {
      length: undefined,
      width: undefined,
      height: undefined
    },
    shipsFrom: 'USA',
    status: 'draft',
    isFeatured: false,
    isFlashSale: false,
    flashSaleEndsAt: undefined,
    metaTitle: '',
    metaDescription: '',
    keywords: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && id) {
      loadProduct(id);
    }
  }, [id, isEditMode]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const product = await getProductById(productId);
      if (product) {
        setFormData({
          title: product.title || '',
          description: (product as any).description || '',
          sku: (product as any).sku || '',
          priceUSD: product.priceUSD || 0,
          priceTHB: product.priceTHB || 0,
          originalPriceTHB: product.originalPriceTHB,
          category: product.category || '',
          subcategory: (product as any).subcategory || '',
          brand: (product as any).brand || '',
          stockQuantity: (product as any).stockQuantity || 0,
          lowStockThreshold: (product as any).lowStockThreshold || 5,
          mainImage: product.image || '',
          additionalImages: (product as any).additionalImages || [],
          weight: (product as any).weight,
          dimensions: (product as any).dimensions || {},
          shipsFrom: (product as any).shipsFrom || 'USA',
          status: (product as any).status || 'draft',
          isFeatured: (product as any).isFeatured || false,
          isFlashSale: product.isFlashSale || false,
          flashSaleEndsAt: (product as any).flashSaleEndsAt,
          metaTitle: (product as any).metaTitle || '',
          metaDescription: (product as any).metaDescription || '',
          keywords: (product as any).keywords || []
        });
      }
    } catch (error) {
      showToast('error', 'Failed to load product');
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Product title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required';
    }
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (formData.priceUSD <= 0) {
      newErrors.priceUSD = 'Price must be greater than 0';
    }
    if (formData.priceTHB <= 0) {
      newErrors.priceTHB = 'THB price must be greater than 0';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.mainImage) {
      newErrors.mainImage = 'Main product image is required';
    }
    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File, isMain: boolean = false) => {
    try {
      setUploading(true);
      const user = auth.currentUser;
      if (!user) {
        showToast('error', 'Please login to upload images');
        return;
      }

      const result = await uploadImage(file, 'products');
      
      if (!result.success || !result.url) {
        const errorMsg = result.error || 'Failed to upload image';
        showToast('error', errorMsg);
        console.error('Upload failed:', errorMsg);
        return;
      }
      
      if (isMain) {
        setFormData(prev => ({ ...prev, mainImage: result.url! }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          additionalImages: [...prev.additionalImages, result.url!] 
        }));
      }
      
      showToast('success', 'Image uploaded successfully');
    } catch (error) {
      showToast('error', 'Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('error', 'Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        showToast('error', 'Please login to save product');
        return;
      }

      const productData = {
        ...formData,
        sellerId: user.uid,
        createdAt: isEditMode ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isEditMode && id) {
        const result = await updateProduct(id, productData);
        if (result.success) {
          showToast('success', 'Product updated successfully');
          navigate('/seller/products');
        } else {
          showToast('error', result.error || 'Failed to update product');
        }
      } else {
        const result = await addProduct(productData);
        if (result.success) {
          showToast('success', 'Product created successfully');
          navigate('/seller/products');
        } else {
          showToast('error', result.error || 'Failed to create product');
        }
      }
    } catch (error) {
      showToast('error', 'An error occurred while saving the product');
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy mx-auto mb-4"></div>
          <p className="text-slate-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-slate-600 mt-1">
                {isEditMode ? 'Update your product information' : 'Create a new product listing'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/seller/products')}
              className="gap-2"
            >
              <X size={18} /> Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText size={20} /> Basic Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Product Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent ${
                        errors.title ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Enter product title"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={6}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent ${
                        errors.description ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Describe your product in detail..."
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => updateField('sku', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent ${
                          errors.sku ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="SKU-2024-001"
                      />
                      {errors.sku && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.sku}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => updateField('brand', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                        placeholder="Brand name"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} /> Pricing
                </h2>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Price (USD) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.priceUSD}
                        onChange={(e) => updateField('priceUSD', parseFloat(e.target.value) || 0)}
                        className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent ${
                          errors.priceUSD ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.priceUSD && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.priceUSD}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Price (THB) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">฿</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.priceTHB}
                        onChange={(e) => updateField('priceTHB', parseFloat(e.target.value) || 0)}
                        className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent ${
                          errors.priceTHB ? 'border-red-500' : 'border-slate-300'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.priceTHB && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.priceTHB}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Original Price (THB)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">฿</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.originalPriceTHB || ''}
                        onChange={(e) => updateField('originalPriceTHB', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">For showing discount</p>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ImageIcon size={20} /> Product Images
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Main Image <span className="text-red-500">*</span>
                    </label>
                    {formData.mainImage ? (
                      <div className="relative inline-block">
                        <img
                          src={formData.mainImage}
                          alt="Main product"
                          className="w-32 h-32 object-cover rounded-lg border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => updateField('mainImage', '')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-brand-navy transition-colors">
                        <Upload size={24} className="text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, true);
                          }}
                          disabled={uploading}
                        />
                      </label>
                    )}
                    {errors.mainImage && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.mainImage}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Additional Images
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {formData.additionalImages.map((img, index) => (
                        <div key={index} className="relative">
                          <img
                            src={img}
                            alt={`Additional ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border border-slate-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-brand-navy transition-colors">
                        <Upload size={20} className="text-slate-400 mb-1" />
                        <span className="text-xs text-slate-500">Add</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, false);
                          }}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Package size={20} /> Inventory
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => updateField('stockQuantity', parseInt(e.target.value) || 0)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent ${
                        errors.stockQuantity ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="0"
                      min="0"
                    />
                    {errors.stockQuantity && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.stockQuantity}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) => updateField('lowStockThreshold', parseInt(e.target.value) || 5)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                      placeholder="5"
                      min="0"
                    />
                    <p className="text-xs text-slate-500 mt-1">Alert when stock falls below this</p>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Truck size={20} /> Shipping Information
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ships From
                    </label>
                    <select
                      value={formData.shipsFrom}
                      onChange={(e) => updateField('shipsFrom', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                    >
                      <option value="USA">USA</option>
                      <option value="Thailand">Thailand</option>
                      <option value="China">China</option>
                      <option value="Japan">Japan</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight || ''}
                      onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dimensions (cm)
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dimensions?.length || ''}
                      onChange={(e) => updateField('dimensions', {
                        ...formData.dimensions,
                        length: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                      placeholder="Length"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dimensions?.width || ''}
                      onChange={(e) => updateField('dimensions', {
                        ...formData.dimensions,
                        width: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                      placeholder="Width"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dimensions?.height || ''}
                      onChange={(e) => updateField('dimensions', {
                        ...formData.dimensions,
                        height: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                      placeholder="Height"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Category & Status */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Tag size={20} /> Category & Status
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => updateField('category', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent ${
                        errors.category ? 'border-red-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.category}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      value={formData.subcategory}
                      onChange={(e) => updateField('subcategory', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => updateField('status', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Options</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => updateField('isFeatured', e.target.checked)}
                      className="w-4 h-4 text-brand-navy border-slate-300 rounded focus:ring-brand-navy"
                    />
                    <span className="text-sm text-slate-700">Featured Product</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFlashSale}
                      onChange={(e) => updateField('isFlashSale', e.target.checked)}
                      className="w-4 h-4 text-brand-navy border-slate-300 rounded focus:ring-brand-navy"
                    />
                    <span className="text-sm text-slate-700">Flash Sale</span>
                  </label>

                  {formData.isFlashSale && (
                    <div className="ml-7">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Flash Sale Ends At
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.flashSaleEndsAt || ''}
                        onChange={(e) => updateField('flashSaleEndsAt', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SEO (Optional) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">SEO Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => updateField('metaTitle', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                      placeholder="SEO title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => updateField('metaDescription', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                      placeholder="SEO description"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading || uploading}
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/seller/products')}
                  className="w-full mt-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

