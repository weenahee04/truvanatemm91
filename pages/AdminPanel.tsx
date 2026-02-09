import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { 
  LayoutDashboard, Image, Type, Save, ExternalLink, Plus, Trash2, AlertCircle,
  BarChart3, Home, Settings, Camera, HardDrive, MapPin, Ticket, Users, Wallet,
  ChevronRight, Bell, CreditCard, DollarSign, TrendingUp, ScanLine, Award, Package, LogOut, FileText, Shield, Trophy
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Banner } from '../types';
import { logout as authLogout } from '../services/authService';
import { canSeeAdminNavPath } from '../utils/adminNav';

// Sidebar Menu Items - เหมือนกับ Dashboard
const MENU_SECTIONS = [
  {
    title: 'หลัก',
    items: [
      { name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard', badge: null },
      { name: 'กลับหน้าหลัก', icon: Home, path: '/', badge: null },
    ]
  },
  {
    title: 'จัดการหวย',
    items: [
      { name: 'คำสั่งซื้อหวย', icon: Ticket, path: '/admin/lotto-orders', badge: '12' },
      { name: 'รูปตั๋ว (Google Photos)', icon: Camera, path: '/admin/photo-upload', badge: null },
      { name: 'รูปตั๋ว (Google Drive)', icon: HardDrive, path: '/admin/drive-photos', badge: null },
      { name: 'OCR สแกนตั๋ว', icon: ScanLine, path: '/admin/ocr-scanner', badge: 'New' },
    ]
  },
  {
    title: 'จัดการระบบ',
    items: [
      { name: 'ผู้ใช้งาน', icon: Users, path: '/admin/users', badge: '3' },
      { name: 'Seller Management', icon: Package, path: '/admin/sellers', badge: null },
      { name: 'การเงิน', icon: Wallet, path: '/admin/payments', badge: null },
      { name: 'การออกบิล', icon: FileText, path: '/admin/billing', badge: null },
      { name: 'Referral System', icon: Award, path: '/admin/referrals', badge: null },
      // { name: 'กิจกรรมประจำวัน', icon: Trophy, path: '/admin/missions', badge: null },
      { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null },
      { name: 'Admin management', icon: Shield, path: '/admin/management', badge: null },
    ]
  },
  {
    title: 'เนื้อหาเว็บไซต์',
    items: [
      { name: 'Hero & Banners', icon: Image, path: '/admin', badge: null, isActive: true },
      { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null },
      { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null },
      { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null },
      { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null },
    ]
  }
];

export const AdminPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { siteContent, updateSiteContent, showToast, logout, user } = useGlobal();
  const [activeTab, setActiveTab] = useState<'hero' | 'promo' | 'category'>('hero');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Local state for form handling before saving
  const [formData, setFormData] = useState(siteContent);
  const [isSaved, setIsSaved] = useState(false);

  // Sync formData when siteContent changes (initial load)
  useEffect(() => {
    setFormData(siteContent);
  }, [siteContent]);

  const handleChange = (section: keyof typeof siteContent, index: number | null, field: string, value: string) => {
    setFormData(prev => {
      if (section === 'hero') {
        return {
          ...prev,
          hero: { ...prev.hero, [field]: value }
        };
      }
      
      if (Array.isArray(prev[section]) && index !== null) {
        const newArray = [...prev[section] as any[]];
        newArray[index] = { ...newArray[index], [field]: value };
        return { ...prev, [section]: newArray };
      }
      return prev;
    });
    setIsSaved(false);
  };

  const handleAddBanner = (section: 'promoBanners' | 'categoryBanners') => {
    const newBanner: Banner = {
      id: Date.now(),
      title: 'New Banner',
      subtitle: 'Description here',
      image: 'https://picsum.photos/800/600',
      link: '/'
    };

    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], newBanner]
    }));
    setIsSaved(false);
  };

  const handleRemoveBanner = (section: 'promoBanners' | 'categoryBanners', index: number) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      setFormData(prev => ({
        ...prev,
        [section]: prev[section].filter((_, i) => i !== index)
      }));
      setIsSaved(false);
    }
  };

  const handleSave = () => {
    updateSiteContent(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      logout(); // Call GlobalContext logout
      navigate('/admin/login');
      showToast('ออกจากระบบสำเร็จ', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      
      {/* Sidebar - Fixed Left (เหมือน Dashboard) */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white fixed left-0 top-0 h-full overflow-y-auto transition-all duration-300 z-40 flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {sidebarCollapsed ? (
              <img 
                src="/truvamate-logo.png" 
                alt="Truvamate" 
                className="h-10 w-auto"
              />
            ) : (
              <div className="flex items-center gap-3">
                <img 
                  src="/truvamate-logo.png" 
                  alt="Truvamate" 
                  className="h-8 w-auto"
                />
                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block mt-1">Admin Panel</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Menu Sections */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {MENU_SECTIONS.map((section, sectionIndex) => {
            const visibleItems = section.items.filter((item) => canSeeAdminNavPath(user?.role, item.path));
            if (visibleItems.length === 0) return null;
            return (
            <div key={sectionIndex} className="mb-6">
              {!sidebarCollapsed && (
                <div className="px-6 mb-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">{section.title}</span>
                </div>
              )}
              <div className="space-y-1 px-3">
                {visibleItems.map((item, itemIndex) => {
                  const isActive = (('isActive' in item) && Boolean((item as any).isActive)) || location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={itemIndex}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-brand-gold text-slate-900 font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <Icon size={20} className="shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-sm">{item.name}</span>
                          {item.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.badge === 'New' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-red-500 text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full"
          >
            <ChevronRight size={18} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            {!sidebarCollapsed && <span className="text-sm">ย่อเมนู</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors w-full"
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span className="text-sm">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Image className="text-brand-gold" size={28} />
                  จัดการเนื้อหาเว็บไซต์
                </h1>
                <p className="text-sm text-slate-500 mt-1">Hero, Promo Banners, Category Banners</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Tab Selector */}
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('hero')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'hero'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Type size={16} className="inline mr-2" />
                    Hero
                  </button>
                  <button
                    onClick={() => setActiveTab('promo')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'promo'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Image size={16} className="inline mr-2" />
                    Promo
                  </button>
                  <button
                    onClick={() => setActiveTab('category')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'category'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutDashboard size={16} className="inline mr-2" />
                    Category
                  </button>
                </div>
                
                {/* Actions */}
                <Link to="/" target="_blank" className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="View Live Site">
                  <ExternalLink size={20} className="text-slate-600" />
                </Link>
                <Button onClick={handleSave} className="gap-2 shadow-lg" disabled={isSaved}>
                  <Save size={18} /> {isSaved ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          
          {/* Hero Editor */}
          {activeTab === 'hero' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="font-bold text-xl text-slate-900 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
                <Type className="text-brand-gold" size={24} />
                Main Hero Section
              </h3>
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Badge Text</label>
                  <input 
                    type="text" 
                    value={formData.hero.badge}
                    onChange={(e) => handleChange('hero', null, 'badge', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Title Line 1</label>
                    <input 
                      type="text" 
                      value={formData.hero.titleLine1}
                      onChange={(e) => handleChange('hero', null, 'titleLine1', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-bold text-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Title Line 2 (Underlined)</label>
                    <input 
                      type="text" 
                      value={formData.hero.titleLine2}
                      onChange={(e) => handleChange('hero', null, 'titleLine2', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-bold text-lg text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                  <textarea 
                    value={formData.hero.description}
                    onChange={(e) => handleChange('hero', null, 'description', e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Background Image URL (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.hero.backgroundImage || ''}
                    onChange={(e) => handleChange('hero', null, 'backgroundImage', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Leave empty to use the default Yellow background. Recommended size: 1920x800px.
                  </p>
                  {formData.hero.backgroundImage?.includes('canva.com/design') && (
                     <div className="mt-2 text-xs text-red-500 font-bold bg-red-50 p-3 rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} />
                        Warning: This looks like a Canva Design link. Please use the "Copy Image Address" (ends in .jpg/.png) instead.
                     </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Promo Banners Editor */}
          {activeTab === 'promo' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm text-yellow-800 flex justify-between items-center">
                <span className="flex items-center gap-2"><AlertCircle size={16} /> Use high-resolution landscape images (approx 1600x600) for best results.</span>
                <Button size="sm" onClick={() => handleAddBanner('promoBanners')} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
                  <Plus size={16} /> Add New Slide
                </Button>
              </div>

              {formData.promoBanners.map((banner, index) => (
                <div key={banner.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative group">
                  <button 
                    onClick={() => handleRemoveBanner('promoBanners', index)}
                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10"
                    title="Delete Banner"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="h-8 w-8 bg-brand-gold rounded-lg flex items-center justify-center text-slate-900 font-black text-sm">
                        {index + 1}
                      </span>
                      Slide #{index + 1}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Image URL</label>
                        <input 
                          type="text" 
                          value={banner.image}
                          onChange={(e) => handleChange('promoBanners', index, 'image', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                        <input 
                          type="text" 
                          value={banner.title}
                          onChange={(e) => handleChange('promoBanners', index, 'title', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subtitle</label>
                        <input 
                          type="text" 
                          value={banner.subtitle}
                          onChange={(e) => handleChange('promoBanners', index, 'subtitle', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preview</label>
                      <div className="aspect-[16/6] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                        <img src={banner.image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-4">
                           <h3 className="text-white font-black text-xl italic uppercase">{banner.title}</h3>
                           <p className="text-white text-xs">{banner.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.promoBanners.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-xl bg-white">
                  <p className="text-slate-500 mb-4">No banners active.</p>
                  <Button onClick={() => handleAddBanner('promoBanners')}>Add First Banner</Button>
                </div>
              )}
            </div>
          )}

          {/* Category Banners Editor */}
          {activeTab === 'category' && (
             <div className="space-y-6">
               <div className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                 <span className="font-bold text-slate-700">Manage Popular Categories</span>
                 <Button size="sm" onClick={() => handleAddBanner('categoryBanners')} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
                    <Plus size={16} /> Add Category
                 </Button>
               </div>

               <div className="grid grid-cols-1 gap-6">
                 {formData.categoryBanners.map((banner, index) => (
                   <div key={banner.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-start relative group">
                      <button 
                        onClick={() => handleRemoveBanner('categoryBanners', index)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10"
                        title="Delete Category"
                      >
                        <Trash2 size={20} />
                      </button>

                      <div className="w-full md:w-48 aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                        <img src={banner.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex justify-between">
                           <h4 className="font-bold text-slate-900 flex items-center gap-2">
                             <span className="h-8 w-8 bg-brand-gold rounded-lg flex items-center justify-center text-slate-900 font-black text-sm">
                               {index + 1}
                             </span>
                             Card #{index + 1}
                           </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                            <input 
                              type="text" 
                              value={banner.title}
                              onChange={(e) => handleChange('categoryBanners', index, 'title', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subtitle</label>
                            <input 
                              type="text" 
                              value={banner.subtitle}
                              onChange={(e) => handleChange('categoryBanners', index, 'subtitle', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Image URL</label>
                            <input 
                              type="text" 
                              value={banner.image}
                              onChange={(e) => handleChange('categoryBanners', index, 'image', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-xs text-slate-900"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link URL</label>
                            <input 
                              type="text" 
                              value={banner.link || ''}
                              onChange={(e) => handleChange('categoryBanners', index, 'link', e.target.value)}
                              placeholder="/category/fashion"
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-xs text-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
