
import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Filter, ChevronDown, Grid, List, Check, Ticket, ArrowRight } from 'lucide-react';
import { ProductCard } from '../components/Marketplace/ProductCard';
import { getAllProducts, getProductsByCategory, getFlashSaleProducts } from '../services/productService';
import { Product } from '../types';

export const CategoryListing: React.FC = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('category');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Get current pathname from location (updates automatically)
  const currentPath = location.pathname;
  
  // Helper function to check if category is selected
  const isCategoryActive = (categorySlug: string, englishSlug?: string): boolean => {
    // Get current slug (from URL)
    const currentSlug = slug || '';
    
    // Check multiple variations
    const checks = [
      // Direct slug match
      currentSlug === categorySlug,
      currentSlug === englishSlug,
      // Pathname match
      currentPath === `/category/${categorySlug}`,
      currentPath === `/category/${englishSlug}`,
      currentPath.endsWith(`/${categorySlug}`),
      currentPath.endsWith(`/${englishSlug}`),
      // Try decode
      currentSlug && decodeURIComponent(currentSlug) === categorySlug,
      currentSlug && decodeURIComponent(currentSlug) === englishSlug,
    ];
    
    return checks.some(Boolean);
  };
  
  // Calculate active categories
  const activeCategories = {
    vitamins: isCategoryActive('วิตามิน-อาหารเสริม', 'vitamins'),
    fashion: isCategoryActive('แฟชั่น-กระเป๋า', 'fashion'),
    electronics: isCategoryActive('อิเล็กทรอนิกส์', 'electronics'),
    home: isCategoryActive('ของใช้ในบ้าน'),
    flashSale: isCategoryActive('flash-sale'),
    special: isCategoryActive('สินค้าพิเศษ'),
  };

  // Load products based on category slug
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        let loadedProducts: Product[] = [];

        if (slug === 'flash-sale') {
          // Load flash sale products
          loadedProducts = await getFlashSaleProducts();
        } else if (slug === 'สินค้าพิเศษ') {
          // Load products with category "สินค้าพิเศษ"
          loadedProducts = await getProductsByCategory('สินค้าพิเศษ');
        } else if (slug === 'new' || slug === 'all') {
          // Load all products (new arrivals)
          loadedProducts = await getAllProducts();
          // Sort by createdAt desc for new products
          if (slug === 'new') {
            loadedProducts = loadedProducts.sort((a, b) => {
              const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
              const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
              return dateB - dateA;
            });
          }
        } else if (slug) {
          // Load products by category (decode URL slug)
          const categorySlug = decodeURIComponent(slug);
          loadedProducts = await getProductsByCategory(categorySlug);
        } else {
          // Default: load all products
          loadedProducts = await getAllProducts();
        }

        setProducts(loadedProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
    // Reset to page 1 when category changes
    setCurrentPage(1);
  }, [slug]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-brand-navy">{t('breadcrumbHome')}</Link>
        <span className="mx-2">/</span>
        <Link to="/category" className="hover:text-brand-navy">{t('breadcrumbCategory')}</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium capitalize">
          {slug === 'สินค้าพิเศษ' ? t('specialProducts') : 
           slug === 'flash-sale' ? 'Flash Sale' :
           slug === 'new' ? t('newProducts') :
           slug === 'all' ? t('allProducts') :
           slug ? decodeURIComponent(slug) : t('allProducts')}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Filter size={20} /> {t('filters')}
            </h3>
            
            {/* Category Filter */}
            <div className="border-b border-slate-200 pb-6 mb-6">
              <h4 className="font-medium mb-3 text-slate-900">{t('categories')}</h4>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link 
                    to="/category/vitamins" 
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all ${
                      activeCategories.vitamins
                        ? 'bg-brand-gold/10 text-brand-navy font-semibold border border-brand-gold/30' 
                        : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      activeCategories.vitamins
                        ? 'bg-brand-gold border-brand-gold' 
                        : 'border-slate-300'
                    }`}>
                      {activeCategories.vitamins && (
                        <Check size={14} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>{t('catVitamins')}</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/category/fashion" 
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all ${
                      activeCategories.fashion
                        ? 'bg-brand-gold/10 text-brand-navy font-semibold border border-brand-gold/30' 
                        : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      activeCategories.fashion
                        ? 'bg-brand-gold border-brand-gold' 
                        : 'border-slate-300'
                    }`}>
                      {activeCategories.fashion && (
                        <Check size={14} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>{t('catFashion')}</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/category/electronics" 
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all ${
                      activeCategories.electronics
                        ? 'bg-brand-gold/10 text-brand-navy font-semibold border border-brand-gold/30' 
                        : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      activeCategories.electronics
                        ? 'bg-brand-gold border-brand-gold' 
                        : 'border-slate-300'
                    }`}>
                      {activeCategories.electronics && (
                        <Check size={14} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>{t('catElectronics')}</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/category/ของใช้ในบ้าน" 
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all ${
                      activeCategories.home
                        ? 'bg-brand-gold/10 text-brand-navy font-semibold border border-brand-gold/30' 
                        : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      activeCategories.home
                        ? 'bg-brand-gold border-brand-gold' 
                        : 'border-slate-300'
                    }`}>
                      {activeCategories.home && (
                        <Check size={14} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>{t('catHome')}</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/category/flash-sale" 
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all ${
                      activeCategories.flashSale
                        ? 'bg-brand-gold/10 text-brand-navy font-semibold border border-brand-gold/30' 
                        : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      activeCategories.flashSale
                        ? 'bg-brand-gold border-brand-gold' 
                        : 'border-slate-300'
                    }`}>
                      {activeCategories.flashSale && (
                        <Check size={14} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>Flash Sale</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/category/สินค้าพิเศษ" 
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all ${
                      activeCategories.special
                        ? 'bg-brand-gold/10 text-brand-navy font-semibold border border-brand-gold/30' 
                        : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      activeCategories.special
                        ? 'bg-brand-gold border-brand-gold' 
                        : 'border-slate-300'
                    }`}>
                      {activeCategories.special && (
                        <Check size={14} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span>{t('specialProducts')}</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Price Filter */}
            <div className="border-b border-slate-200 pb-6 mb-6">
              <h4 className="font-medium mb-3">{t('priceRange')}</h4>
              <div className="flex items-center gap-2 mb-4">
                <input type="number" placeholder="Min" className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900" />
                <span>-</span>
                <input type="number" placeholder="Max" className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-slate-900" />
              </div>
              <button className="w-full py-1.5 bg-slate-100 text-slate-700 rounded text-sm font-medium hover:bg-brand-gold hover:text-slate-900 transition-colors">
                {t('search')}
              </button>
            </div>

            {/* Rating Filter */}
            <div>
              <h4 className="font-medium mb-3">{t('rating')}</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                 <li className="flex items-center gap-2 cursor-pointer hover:text-brand-navy">
                    <input type="radio" name="rating" className="text-brand-navy focus:ring-brand-gold" /> {t('star5')}
                 </li>
                 <li className="flex items-center gap-2 cursor-pointer hover:text-brand-navy">
                    <input type="radio" name="rating" className="text-brand-navy focus:ring-brand-gold" /> {t('star4up')}
                 </li>
                 <li className="flex items-center gap-2 cursor-pointer hover:text-brand-navy">
                    <input type="radio" name="rating" className="text-brand-navy focus:ring-brand-gold" /> {t('star3up')}
                 </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-slate-900 capitalize">
              {slug === 'flash-sale' ? 'Flash Sale' : 
               slug === 'new' ? t('newProducts') :
               slug === 'all' ? t('allProducts') :
               slug === 'สินค้าพิเศษ' ? t('specialProducts') :
               slug ? decodeURIComponent(slug) : t('allProducts')} 
              <span className="text-sm font-normal text-slate-500 ml-2">({t('itemCount', { count: products.length })})</span>
            </h1>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">{t('sortBy')}</span>
                <div className="relative group">
                  <button className="flex items-center gap-1 font-medium hover:text-brand-blue">
                    {t('recommended')} <ChevronDown size={14} />
                  </button>
                  {/* Dropdown would go here */}
                </div>
              </div>
              
              <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-brand-navy text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  <Grid size={18} />
                </button>
                <button 
                   onClick={() => setViewMode('list')}
                   className={`p-2 ${viewMode === 'list' ? 'bg-brand-navy text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-600">
              <div className="inline-block w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>{t('loading')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Special Products Card - Show first when viewing "สินค้าพิเศษ" category */}
              {slug === 'สินค้าพิเศษ' && (
                <div 
                  onClick={() => navigate('/special-products')}
                  className="bg-gradient-to-br from-brand-gold via-yellow-400 to-brand-gold rounded-xl border-2 border-black overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative col-span-2 md:col-span-1"
                >
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-900 to-brand-navy">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white z-10">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Ticket size={40} className="text-brand-gold" />
                      </div>
                      <h3 className="font-black text-xl mb-2 text-white">US Powerball & Mega Millions</h3>
                      <p className="text-sm text-white/90 mb-4 line-clamp-2">
                        {t('lottoDesc')}
                      </p>
                      <div className="flex items-center gap-2 text-brand-gold font-bold text-sm group-hover:gap-3 transition-all">
                        <span>{t('pickNumbers')}</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    {/* Decorative Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    </div>
                  </div>
                  <div className="p-4 bg-white border-t-2 border-black">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">{t('specialProducts')}</div>
                        <div className="text-sm font-bold text-slate-900">US Lottery</div>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                          <span className="text-white font-black text-[10px]">PB</span>
                        </div>
                        <div className="w-6 h-6 bg-brand-gold rounded-full flex items-center justify-center border border-black">
                          <span className="text-black font-black text-[10px]">MM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Regular Products */}
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : slug !== 'สินค้าพิเศษ' ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  <p className="text-lg font-medium mb-2">{t('noProducts')}</p>
                  <p className="text-sm">{t('noProductsDesc')}</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Pagination */}
          {products.length > 0 && (
            <div className="mt-12 flex justify-center gap-2">
              <button 
                onClick={() => setCurrentPage(1)}
                className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-colors ${
                  currentPage === 1
                    ? 'border-brand-navy bg-brand-navy text-white'
                    : 'border-slate-300 bg-white hover:border-brand-navy hover:text-brand-navy'
                }`}
              >
                1
              </button>
              {products.length > 16 && (
                <>
                  <button 
                    onClick={() => setCurrentPage(2)}
                    className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-colors ${
                      currentPage === 2
                        ? 'border-brand-navy bg-brand-navy text-white'
                        : 'border-slate-300 bg-white hover:border-brand-navy hover:text-brand-navy'
                    }`}
                  >
                    2
                  </button>
                  {products.length > 32 && (
                    <>
                      <button 
                        onClick={() => setCurrentPage(3)}
                        className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-colors ${
                          currentPage === 3
                            ? 'border-brand-navy bg-brand-navy text-white'
                            : 'border-slate-300 bg-white hover:border-brand-navy hover:text-brand-navy'
                        }`}
                      >
                        3
                      </button>
                      {products.length > 64 && (
                        <>
                          <span className="flex items-end px-2 text-slate-400">...</span>
                          <button 
                            onClick={() => setCurrentPage(Math.ceil(products.length / 16))}
                            className="h-10 w-10 rounded-lg border border-slate-300 bg-white flex items-center justify-center hover:border-brand-navy hover:text-brand-navy transition-colors"
                          >
                            {Math.ceil(products.length / 16)}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
