
import React, { useRef, useState, useEffect } from 'react';
import { ProductCard } from '../components/Marketplace/ProductCard';
import { Button } from '../components/ui/Button';
import { ArrowRight, Zap, ShieldCheck, Truck, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import { SEO, SEOPresets } from '../components/SEO';
import { getAllProducts, getFlashSaleProducts } from '../services/productService';
import { Product } from '../types';
import MissionWidget from '../components/MissionWidget';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['home', 'common']);
  const { siteContent } = useGlobal(); // Get content from Global State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load products from Firestore
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const [allProducts, flashProducts] = await Promise.all([
          getAllProducts(),
          getFlashSaleProducts()
        ]);
        setProducts(allProducts);
        setFlashSaleProducts(flashProducts);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  const { hero, promoBanners, categoryBanners } = siteContent;
  const hasBg = !!hero.backgroundImage;

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, children } = scrollContainerRef.current;
      if (children.length > 0) {
        const cardWidth = children[0].getBoundingClientRect().width;
        const gap = 16;
        const index = Math.round(scrollLeft / (cardWidth + gap));
        setActiveBanner(index);
      }
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 400;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const scrollToBanner = (index: number) => {
    if (scrollContainerRef.current) {
      const { children } = scrollContainerRef.current;
      if (children[0]) {
        const cardWidth = children[0].getBoundingClientRect().width;
        const gap = 16;
        scrollContainerRef.current.scrollTo({
          left: index * (cardWidth + gap),
          behavior: 'smooth'
        });
        setActiveBanner(index);
      }
    }
  };

  return (
    <>
      <SEO {...SEOPresets.home} />
      <div className="space-y-12 pb-20">
        
        {/* Hero Section - Editable Content */}
      <section className={`relative overflow-hidden transition-colors duration-500 ${hasBg ? 'bg-slate-900' : 'bg-brand-gold'}`}>
        
        {/* Background Image Logic */}
        {hasBg && (
           <div 
             className="absolute inset-0 bg-cover bg-center z-0 animate-in fade-in duration-700"
             style={{ backgroundImage: `url(${hero.backgroundImage})` }}
           />
        )}
        
        {/* Overlay - Changes based on if image exists */}
        <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${hasBg ? 'bg-black/50' : 'opacity-10'}`} 
             style={!hasBg ? { backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' } : {}}>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative z-10 flex flex-col items-center text-center gap-8">
          <div className="space-y-6 max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-black text-brand-gold rounded-full text-xs font-bold tracking-wide uppercase shadow-lg">
              {hero.badge}
            </span>
            <h1 className={`text-4xl md:text-7xl font-black leading-tight tracking-tight ${hasBg ? 'text-white' : 'text-slate-900'}`}>
              {hero.titleLine1} <br/>
              <span className={`inline-block border-b-8 leading-[1.1] pb-2 ${hasBg ? 'text-white border-white' : 'text-slate-900 border-black'}`}>
                {hero.titleLine2}
              </span>
            </h1>
            <p className={`text-lg md:text-xl max-w-2xl mx-auto font-medium ${hasBg ? 'text-slate-200' : 'text-slate-800'}`}>
              {hero.description}
            </p>
            <div className="flex gap-4 justify-center pt-6">
              <Button size="lg" variant={hasBg ? "primary" : "secondary"} className="px-10 shadow-xl" onClick={() => navigate('/category/all')}>{t('common:button.shopNow')}</Button>
              <Button 
                 size="lg" 
                 variant="outline" 
                 className={`px-10 ${hasBg ? 'border-white text-white hover:bg-white hover:text-slate-900' : 'border-black text-black hover:bg-black hover:text-brand-gold'}`}
                 onClick={() => navigate('/how-to-use')}
              >
                {t('common:button.howToBuy')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Split Promo Banners (50/50 Layout) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {promoBanners.slice(0, 2).map((banner) => (
            <div 
              key={banner.id} 
              className="relative aspect-[16/9] md:aspect-[16/8] rounded-2xl overflow-hidden cursor-pointer group shadow-md"
              onClick={() => banner.link && navigate(banner.link)}
            >
              <img 
                src={banner.image} 
                alt={banner.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-10">
                <div className="space-y-3 transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                  <span className="inline-block bg-black/80 backdrop-blur-sm text-brand-gold px-3 py-1 rounded text-[10px] md:text-xs font-black tracking-widest uppercase shadow-sm border border-brand-gold/30">
                    SPECIAL OFFER
                  </span>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white italic uppercase leading-none drop-shadow-lg tracking-tight">
                    {banner.title}
                  </h2>
                  <p className="text-slate-200 text-sm md:text-base font-medium drop-shadow-md line-clamp-2 max-w-sm">
                    {banner.subtitle}
                  </p>
                  <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="sm" className="shadow-lg hover:scale-105 transition-transform bg-brand-gold text-slate-900 border-none">
                      {t('common:button.viewMore')} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-slate-100 py-10 shadow-sm relative z-20 -mt-8 mx-4 rounded-xl max-w-7xl md:mx-auto border-t-4 border-brand-gold">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-8">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center text-slate-900 shrink-0">
              <ShieldCheck />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{t('home:trustBadges.authentic')}</h4>
              <p className="text-xs text-slate-500">{t('home:trustBadges.authenticDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center text-slate-900 shrink-0">
              <Truck />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{t('home:trustBadges.directFromUSA')}</h4>
              <p className="text-xs text-slate-500">{t('home:trustBadges.directFromUSADesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center text-slate-900 shrink-0">
              <CreditCard />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{t('home:trustBadges.securePayment')}</h4>
              <p className="text-xs text-slate-500">{t('home:trustBadges.securePaymentDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center text-slate-900 shrink-0">
              <Zap />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{t('home:trustBadges.fastShipping')}</h4>
              <p className="text-xs text-slate-500">{t('home:trustBadges.fastShippingDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Missions Widget */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <MissionWidget />
      </section>

      {/* Popular Categories - Editable */}
      <section className="max-w-7xl mx-auto px-4 relative group">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-2 h-8 bg-brand-gold block"></span>
            {t('home:sections.popularCategories')}
          </h2>
          <div className="flex gap-2">
             <button onClick={() => scroll('left')} className="p-3 rounded-full border border-slate-200 hover:bg-black hover:text-white text-slate-900 transition-colors">
               <ChevronLeft size={20} />
             </button>
             <button onClick={() => scroll('right')} className="p-3 rounded-full border border-slate-200 hover:bg-black hover:text-white text-slate-900 transition-colors">
               <ChevronRight size={20} />
             </button>
          </div>
        </div>
        
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4"
        >
          {categoryBanners.map((banner, index) => (
            <div 
              key={index} 
              className="min-w-[280px] md:min-w-[400px] aspect-[16/10] relative rounded-none overflow-hidden cursor-pointer snap-start group/card shadow-none border-2 border-transparent hover:border-brand-gold transition-all"
              onClick={() => navigate(banner.link || '/category')}
            >
              <img 
                src={banner.image} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110 filter grayscale group-hover/card:grayscale-0" 
                alt={banner.title} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                <span className="text-brand-gold font-bold text-sm mb-1 opacity-0 group-hover/card:opacity-100 transform translate-y-4 group-hover/card:translate-y-0 transition-all duration-300">
                  {banner.subtitle}
                </span>
                <h3 className="text-white text-2xl font-bold tracking-tight uppercase italic">{banner.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {categoryBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToBanner(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeBanner === idx 
                  ? 'w-8 bg-brand-gold' 
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Flash Sale - Black Background with Yellow Accents */}
      <section className="bg-black py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10 text-white">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h2 className="text-4xl font-black italic text-brand-gold tracking-tighter transform -skew-x-6">FLASH SALE</h2>
              <div className="flex gap-2 text-black font-black text-xl">
                <span className="bg-brand-gold px-3 py-1 rounded-sm">02</span>
                <span className="text-brand-gold flex items-center">:</span>
                <span className="bg-brand-gold px-3 py-1 rounded-sm">15</span>
                <span className="text-brand-gold flex items-center">:</span>
                <span className="bg-brand-gold px-3 py-1 rounded-sm">40</span>
              </div>
            </div>
            <Link to="/category/flash-sale" className="text-sm font-bold text-brand-gold border-b border-brand-gold hover:text-white hover:border-white transition-colors flex items-center gap-1">
              {t('common:button.viewAll')} <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loading ? (
              <div className="col-span-full text-center text-white py-8">{t('common:common.loading')}</div>
            ) : flashSaleProducts.length > 0 ? (
              flashSaleProducts.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center text-white py-8">{t('home:sections.noFlashSale')}</div>
            )}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-2 h-8 bg-black rounded-sm block"></span>
            {t('home:sections.bestSellers')}
          </h2>
          <Button variant="outline" onClick={() => navigate('/category/best-sellers')}>{t('common:button.viewAll')}</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-slate-600 py-8">{t('common:common.loading')}</div>
          ) : products.length > 0 ? (
            products.slice(0, 9).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center text-slate-600 py-8">{t('home:sections.noProducts')}</div>
          )}
        </div>
      </section>

      {/* สินค้าพิเศษ Banner */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-brand-gold rounded-none relative overflow-hidden border-2 border-black">
          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-4">
              <div className="inline-block bg-black text-brand-gold px-3 py-1 text-xs font-bold tracking-widest uppercase mb-2">Jackpot Alert</div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{t('home:lottoBanner.title')}</h2>
              <p className="text-slate-800 font-medium max-w-lg text-lg">
                {t('home:lottoBanner.description')}
              </p>
              <div className="pt-4">
                 <Button size="lg" variant="secondary" onClick={() => navigate('/lotto')} className="shadow-lg">{t('common:button.chooseYourNumbers')}</Button>
              </div>
            </div>
            <div className="flex gap-4 scale-90 md:scale-100">
               <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-4 border-black p-3">
                  <img src="/Powerball_logo.svg" alt="Powerball" className="w-full h-full object-contain" />
               </div>
               <div className="w-28 h-28 bg-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,215,0,1)] border-4 border-brand-gold p-2">
                  <img src="/Mega_Millions_Lottery_logo.svg" alt="Mega Millions" className="w-full h-full object-contain" />
               </div>
            </div>
          </div>
        </div>
      </section>

      </div>
    </>
  );
};
