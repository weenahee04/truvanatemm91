
import React, { useState } from 'react';
import { Star, Minus, Plus, Heart, Share2, Truck, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('product');
  const { addToCart, toggleWishlist, isInWishlist } = useGlobal();
  const [qty, setQty] = useState(1);

  // Mock product data based on ID - in real app fetch this
  const product = {
    id: id || '1',
    title: 'Vitamin C 1000mg Kirkland Signature (500 Tablets)',
    priceUSD: 15,
    priceTHB: 590,
    originalPriceTHB: 890,
    rating: 4.8,
    reviews: 128,
    sold: 1200,
    isUSImport: true,
    category: 'Vitamins',
    description: "Kirkland Signature Vitamin C is a high potency, nutritional supplement. In addition to Vitamin C, our product also contains a citrus complex of bioflavonoids, which may assist in the body's absorption of Vitamin C, and rose hips, which are a natural source of Vitamin C.",
    images: [
      'https://picsum.photos/600/600?random=1',
      'https://picsum.photos/600/600?random=2',
      'https://picsum.photos/600/600?random=3',
      'https://picsum.photos/600/600?random=4',
    ]
  };

  const [mainImage, setMainImage] = useState(product.images[0]);
  const isLiked = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: product.title,
      priceUSD: product.priceUSD,
      priceTHB: product.priceTHB,
      image: product.images[0],
      rating: product.rating,
      sold: product.sold,
      category: product.category
    }, qty);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleToggleWishlist = () => {
    toggleWishlist({
      id: product.id,
      title: product.title,
      priceUSD: product.priceUSD,
      priceTHB: product.priceTHB,
      image: product.images[0],
      rating: product.rating,
      sold: product.sold,
      category: product.category
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 mb-6">
        {t('breadcrumbHome')} / {product.category} / <span className="text-slate-900 font-medium truncate">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Images Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-slate-200 sticky top-24">
            <img src={mainImage} alt={product.title} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, idx) => (
              <div 
                key={idx} 
                className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${mainImage === img ? 'border-brand-navy' : 'border-transparent hover:border-slate-300'}`}
                onClick={() => setMainImage(img)}
              >
                <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-brand-navy text-white text-xs px-2 py-1 rounded font-bold">US IMPORT</span>
              <span className="text-brand-red text-xs font-bold border border-brand-red px-2 py-1 rounded">Flash Sale</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{product.title}</h1>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1 text-brand-gold">
                <Star fill="currentColor" size={18} />
                <span className="font-bold text-slate-900 text-base">{product.rating}</span>
              </div>
              <div className="text-slate-400">|</div>
              <div className="text-slate-600">{product.reviews} {t('reviews')}</div>
              <div className="text-slate-400">|</div>
              <div className="text-slate-600">{product.sold} {t('sold')}</div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="flex items-end gap-4 mb-2">
              <span className="text-3xl font-bold text-brand-navy">฿{product.priceTHB.toLocaleString()}</span>
              <span className="text-lg text-slate-400 line-through mb-1">฿{product.originalPriceTHB.toLocaleString()}</span>
              <span className="bg-brand-red/10 text-brand-red px-2 py-1 rounded text-xs font-bold mb-2">
                -34%
              </span>
            </div>
            <p className="text-xs text-brand-blue font-medium">{t('memberPrice')}</p>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <span className="text-slate-700 font-medium">{t('quantity')}</span>
              <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                <button 
                  className="p-3 hover:bg-slate-100 text-slate-600"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <Minus size={16} />
                </button>
                <input 
                  type="text" 
                  className="w-12 text-center text-slate-900 font-medium focus:outline-none" 
                  value={qty} 
                  readOnly 
                />
                <button 
                  className="p-3 hover:bg-slate-100 text-slate-600"
                  onClick={() => setQty(qty + 1)}
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-xs text-slate-500">{t('inStock', { count: 50 })}</span>
            </div>

            <div className="flex gap-4">
              <Button size="lg" className="flex-1 bg-brand-navy hover:bg-slate-800 gap-2" onClick={handleAddToCart}>
                <ShoppingBag size={20} /> {t('addToCart')}
              </Button>
              <Button size="lg" variant="secondary" className="flex-1 gap-2" onClick={handleBuyNow}>
                {t('buyNow')}
              </Button>
              <button 
                className={`h-12 w-12 border rounded-lg flex items-center justify-center transition-colors ${isLiked ? 'border-red-500 text-red-500 bg-red-50' : 'border-slate-300 text-slate-600 hover:text-red-500 hover:border-red-500'}`}
                onClick={handleToggleWishlist}
              >
                <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          {/* Delivery & Warranty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-xl">
              <Truck className="text-brand-blue shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">{t('shippingTitle')}</h4>
                <p className="text-xs text-slate-500 mt-1">{t('shippingDesc')}</p>
              </div>
            </div>
             <div className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-xl">
              <ShieldCheck className="text-green-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">{t('warrantyTitle')}</h4>
                <p className="text-xs text-slate-500 mt-1">{t('warrantyDesc')}</p>
              </div>
            </div>
          </div>

          {/* Description Tabs */}
          <div className="border-t border-slate-200 pt-8">
            <h3 className="font-bold text-lg mb-4">{t('productDetails')}</h3>
            <p className="text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
