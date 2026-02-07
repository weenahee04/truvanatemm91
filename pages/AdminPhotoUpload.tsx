import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Camera, Search, RefreshCw, Image, ExternalLink, CheckCircle, AlertCircle, 
  Upload, BarChart3, Home, HardDrive, Ticket, Users, Wallet, MapPin, 
  CreditCard, DollarSign, Settings, ChevronRight, Clock, Key, Link2, XCircle,
  Grid, List, FolderOpen, Eye, ScanLine, Award, Package, LogOut, FileText, Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { googlePhotosService, TicketPhoto, Album } from '../services/googlePhotos';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout } from '../services/authService';
import { canSeeAdminNavPath } from '../utils/adminNav';

// Sidebar Menu Items
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
      { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null },
      { name: 'Admin management', icon: Shield, path: '/admin/management', badge: null },
    ]
  },
  {
    title: 'ตั้งค่า',
    items: [
      { name: 'Hero & Banners', icon: Image, path: '/admin', badge: null },
      { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null },
      { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null },
      { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null },
    ]
  }
];

const AdminPhotoUpload: React.FC = () => {
  const location = useLocation();
  const { user, logout, showToast } = useGlobal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [albumId, setAlbumId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [recentPhotos, setRecentPhotos] = useState<TicketPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOrder, setSearchOrder] = useState('');
  const [searchResults, setSearchResults] = useState<TicketPhoto[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [showAlbumList, setShowAlbumList] = useState(false);
  const [albumError, setAlbumError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<TicketPhoto | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = () => {
    const connected = googlePhotosService.isConnected();
    setIsConnected(connected);
    if (connected) {
      loadRecentPhotos();
    }
  };

  const handleConnect = () => {
    if (!albumId || !accessToken) {
      setError('กรุณาใส่ Album ID และ Access Token');
      return;
    }

    googlePhotosService.setAlbumId(albumId);
    googlePhotosService.setAccessToken(accessToken);
    setIsConnected(true);
    setError('');
    loadRecentPhotos();
  };

  const loadAlbumsList = async () => {
    if (!accessToken) {
      setAlbumError('กรุณาใส่ Access Token ก่อน');
      return;
    }

    try {
      setLoadingAlbums(true);
      setAlbumError('');
      setShowAlbumList(true);
      
      googlePhotosService.setAccessToken(accessToken);
      const albumsList = await googlePhotosService.listAlbums();
      setAlbums(albumsList);
      
      if (albumsList.length === 0) {
        setAlbumError('ไม่พบ Album ใน Google Photos ของคุณ กรุณาสร้าง Album ใหม่');
      }
    } catch (err: any) {
      console.error('Error loading albums:', err);
      setAlbumError(err.message || 'เกิดข้อผิดพลาดในการโหลด Albums');
    } finally {
      setLoadingAlbums(false);
    }
  };

  const selectAlbum = (album: Album) => {
    setAlbumId(album.id);
    setShowAlbumList(false);
  };

  const loadRecentPhotos = async () => {
    try {
      setLoading(true);
      const photos = await googlePhotosService.getTicketPhotos();
      setRecentPhotos(photos);
    } catch (err: any) {
      console.error('Error loading photos:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดรูป');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchOrder.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const results = await googlePhotosService.searchByOrderNumber(searchOrder);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayPhotos = searchResults.length > 0 ? searchResults : recentPhotos;

  return (
    <div className="flex min-h-screen bg-slate-100">
      
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white fixed left-0 top-0 h-full overflow-y-auto transition-all duration-300 z-40 flex flex-col`}>
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

        <nav className="flex-1 py-4 overflow-y-auto">
          {MENU_SECTIONS.map((section, sectionIndex) => {
            const visibleItems = section.items.filter(item => canSeeAdminNavPath(user?.role, item.path));
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
                  const isActive = (item as any).isActive || location.pathname === item.path;
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

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full"
          >
            <ChevronRight size={18} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            {!sidebarCollapsed && <span className="text-sm">ย่อเมนู</span>}
          </button>
          <button 
            onClick={async () => {
              try {
                await authLogout();
                logout();
                navigate('/admin/login');
                showToast('ออกจากระบบสำเร็จ', 'success');
              } catch (error) {
                console.error('Logout error:', error);
                showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
              }
            }}
            className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors w-full"
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span className="text-sm">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Camera className="text-brand-gold" size={28} />
                  รูปตั๋วจาก Google Photos
                </h1>
                <p className="text-sm text-slate-500 mt-1">จัดการรูปตั๋วที่อัพโหลดจาก Google Photos API</p>
              </div>
              <div className="flex items-center gap-3">
                {isConnected && (
                  <Button variant="outline" onClick={loadRecentPhotos} className="gap-2" disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    รีเฟรช
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-yellow-600 shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-yellow-800">หมายเหตุ: Google Photos API มีข้อจำกัด</h3>
                <p className="text-yellow-700 mt-1">
                  เนื่องจาก OAuth 2.0 ต้องมี Verification จาก Google, แนะนำให้ใช้{' '}
                  <Link to="/admin/drive-photos" className="text-brand-gold font-bold underline">
                    Google Drive แทน
                  </Link>{' '}
                  ซึ่งใช้งานง่ายกว่าและรองรับ ScanSnap Scanner
                </p>
              </div>
            </div>
          </div>

          {/* Connection Section */}
          {!isConnected && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Camera className="text-purple-600" size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">เชื่อมต่อ Google Photos</h2>
                  <p className="text-slate-500 mt-1">ใส่ Album ID และ Access Token เพื่อเริ่มต้นใช้งาน</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Key size={16} /> Access Token
                  </label>
                  <input
                    type="text"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="ya29.xxx..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                  />
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <FolderOpen size={16} /> Album ID
                    </label>
                    <input
                      type="text"
                      value={albumId}
                      onChange={(e) => setAlbumId(e.target.value)}
                      placeholder="Album ID"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                    />
                  </div>
                  <Button onClick={loadAlbumsList} variant="outline" className="gap-2" disabled={loadingAlbums}>
                    {loadingAlbums ? <RefreshCw size={18} className="animate-spin" /> : <FolderOpen size={18} />}
                    ดู Albums
                  </Button>
                </div>

                {/* Album List */}
                {showAlbumList && (
                  <div className="bg-slate-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                    <h4 className="font-bold text-slate-700 mb-3">เลือก Album</h4>
                    {albumError ? (
                      <p className="text-red-600 text-sm">{albumError}</p>
                    ) : (
                      <div className="space-y-2">
                        {albums.map((album) => (
                          <button
                            key={album.id}
                            onClick={() => selectAlbum(album)}
                            className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-brand-gold transition-colors"
                          >
                            <p className="font-medium text-slate-900">{album.title}</p>
                            <p className="text-xs text-slate-500">ID: {album.id.substring(0, 20)}...</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <Button onClick={handleConnect} disabled={loading} className="w-full gap-2 py-3">
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <Camera size={18} />}
                  เชื่อมต่อ Google Photos
                </Button>
              </div>
            </div>
          )}

          {/* Connected State */}
          {isConnected && (
            <>
              {/* Status Card */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-green-800">เชื่อมต่อ Google Photos สำเร็จ</p>
                    <p className="text-sm text-green-600">Album ID: {albumId.substring(0, 20)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-green-700">{recentPhotos.length}</p>
                  <p className="text-sm text-green-600">รูปทั้งหมด</p>
                </div>
              </div>

              {/* Search & View Toggle */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={searchOrder}
                      onChange={(e) => setSearchOrder(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="ค้นหา Order Number (เช่น LTO-2025-123456)"
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                    />
                  </div>
                  <Button onClick={handleSearch} className="gap-2 px-6">
                    <Search size={18} /> ค้นหา
                  </Button>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayPhotos.map((photo) => (
                  <div 
                    key={photo.id} 
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div className="aspect-square relative">
                      <img 
                        src={photo.thumbnailUrl} 
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                      />
                      {photo.orderNumber && (
                        <div className="absolute top-2 left-2 bg-brand-gold text-slate-900 text-xs font-bold px-2 py-1 rounded-lg">
                          {photo.orderNumber}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-slate-900 text-sm truncate">{photo.filename}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Clock size={12} /> {new Date(photo.uploadDate).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {displayPhotos.length === 0 && !loading && (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                  <Image size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">ไม่พบรูปภาพ</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{selectedPhoto.filename}</h3>
              <button onClick={() => setSelectedPhoto(null)} className="p-2 hover:bg-white/10 rounded-lg text-white">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-4">
              <img src={selectedPhoto.url} alt={selectedPhoto.filename} className="w-full h-auto max-h-[70vh] object-contain" />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  {selectedPhoto.orderNumber && (
                    <span className="bg-brand-gold text-slate-900 text-sm font-bold px-3 py-1 rounded-lg mr-3">
                      {selectedPhoto.orderNumber}
                    </span>
                  )}
                  <span className="text-sm text-slate-500">
                    อัพโหลด: {new Date(selectedPhoto.uploadDate).toLocaleString('th-TH')}
                  </span>
                </div>
                <a href={selectedPhoto.url} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2">
                    <ExternalLink size={16} /> เปิดใน Google Photos
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPhotoUpload;
