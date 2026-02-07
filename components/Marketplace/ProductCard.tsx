
import React from 'react';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../../context/GlobalContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useGlobal();

  const isLiked = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div 
      className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.isUSImport && (
          <div className="absolute top-2 left-2 bg-brand-navy/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md">
            🇺🇸 US IMPORT
          </div>
        )}
        {product.isFlashSale && (
          <div className="absolute top-2 right-2 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded shadow-md animate-pulse">
            FLASH SALE
          </div>
        )}
        <button 
          onClick={handleToggleWishlist}
          className={`absolute bottom-2 right-2 p-2 rounded-full shadow-sm transition-all ${isLiked ? 'bg-red-50 text-red-500' : 'bg-white/80 text-slate-400 hover:text-red-500'}`}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-4">
        <div className="text-xs text-slate-500 mb-1">{product.category}</div>
        <h3 className="font-medium text-slate-900 line-clamp-2 text-sm h-10 mb-2 group-hover:text-brand-blue transition-colors">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-1 mb-3">
          <div className="flex text-brand-gold">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />
            ))}
          </div>
          <span className="text-xs text-slate-400">({product.sold} ขายแล้ว)</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            {product.originalPriceTHB && (
              <div className="text-xs text-slate-400 line-through">฿{product.originalPriceTHB.toLocaleString()}</div>
            )}
            <div className="text-lg font-bold text-brand-navy">฿{product.priceTHB.toLocaleString()}</div>
          </div>
          <button 
            className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-brand-gold hover:text-slate-900 transition-colors"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
