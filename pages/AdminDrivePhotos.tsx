import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HardDrive, Search, RefreshCw, Image, ExternalLink, Copy, CheckCircle, 
  AlertCircle, Folder, Download, BarChart3, Home, Camera, Ticket, Users, 
  Wallet, MapPin, CreditCard, DollarSign, Settings, ChevronRight, Clock, 
  FolderOpen, Key, Link2, XCircle, Grid, List, ScanLine, Award, Package, LogOut, FileText, TrendingUp, Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { googleDriveService, TicketPhoto } from '../services/googleDrive';
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
      { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null },
      { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null },
    ]
  }
];

const AdminDrivePhotos: React.FC = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [folderUrl, setFolderUrl] = useState('');
  const [folderId, setFolderId] = useState('1HW0xHMSVztx7P7YSugyAeG2KrkezFYZj');
  const [apiKey, setApiKey] = useState('AIzaSyDRniilltwDNhjSgk7iZ43ahHqBTP8G3_w');
  const [isConnected, setIsConnected] = useState(false);
  const [photos, setPhotos] = useState<TicketPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [searchResults, setSearchResults] = useState<TicketPhoto[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<TicketPhoto | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = () => {
    const connected = googleDriveService.isConnected();
    setIsConnected(connected);
    if (connected) {
      loadPhotos();
    }
  };

  const handleConnect = async () => {
    try {
      setError('');
      setLoading(true);

      const extractedFolderId = folderUrl 
        ? folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1] || folderUrl
        : folderId;

      if (!extractedFolderId) {
        throw new Error('กรุณาใส่ Folder URL หรือ Folder ID');
      }

      if (!apiKey) {
        throw new Error('กรุณาใส่ API Key');
      }

      googleDriveService.setFolderId(extractedFolderId);
      googleDriveService.setApiKey(apiKey);
      
      await googleDriveService.getTicketPhotos();
      
      setIsConnected(true);
      setFolderId(extractedFolderId);
      await loadPhotos();
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError('');
      const ticketPhotos = await googleDriveService.getTicketPhotos();
      setPhotos(ticketPhotos);
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
      const results = await googleDriveService.searchByOrderNumber(searchOrder);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const displayPhotos = searchResults.length > 0 ? searchResults : photos;

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

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full"
          >
            <ChevronRight size={18} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            {!sidebarCollapsed && <span className="text-sm">ย่อเมนู</span>}
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
                  <HardDrive className="text-brand-gold" size={28} />
                  รูปตั๋วจาก Google Drive
                </h1>
                <p className="text-sm text-slate-500 mt-1">สำหรับใช้กับ ScanSnap Scanner - อัพโหลดอัตโนมัติ</p>
              </div>
              <div className="flex items-center gap-3">
                {isConnected && (
                  <Button variant="outline" onClick={loadPhotos} className="gap-2" disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    รีเฟรช
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Connection Section */}
          {!isConnected && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <FolderOpen className="text-blue-600" size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">เชื่อมต่อ Google Drive</h2>
                  <p className="text-slate-500 mt-1">ใส่ Folder ID และ API Key เพื่อเริ่มต้นใช้งาน</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Link2 size={16} /> Folder URL หรือ ID
                  </label>
                  <input
                    type="text"
                    value={folderUrl || folderId}
                    onChange={(e) => {
                      if (e.target.value.includes('drive.google.com')) {
                        setFolderUrl(e.target.value);
                      } else {
                        setFolderId(e.target.value);
                      }
                    }}
                    placeholder="https://drive.google.com/drive/folders/xxxxx หรือ Folder ID"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Key size={16} /> API Key
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <Button onClick={handleConnect} disabled={loading} className="w-full gap-2 py-3">
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <HardDrive size={18} />}
                  เชื่อมต่อ Google Drive
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
                    <p className="font-bold text-green-800">เชื่อมต่อสำเร็จ</p>
                    <p className="text-sm text-green-600">Folder ID: {folderId.substring(0, 20)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-green-700">{photos.length}</p>
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

              {/* Photos Grid/List */}
              {viewMode === 'grid' ? (
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
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">รูปภาพ</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">ชื่อไฟล์</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Order</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">วันที่อัพโหลด</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayPhotos.map((photo) => (
                        <tr key={photo.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <img src={photo.thumbnailUrl} alt={photo.filename} className="h-12 w-12 object-cover rounded-lg" />
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">{photo.filename}</td>
                          <td className="px-6 py-4">
                            {photo.orderNumber ? (
                              <span className="bg-brand-gold text-slate-900 text-xs font-bold px-2 py-1 rounded-lg">
                                {photo.orderNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(photo.uploadDate).toLocaleString('th-TH')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(photo.url, photo.id)}
                                className="p-2 hover:bg-slate-100 rounded-lg"
                                title="Copy URL"
                              >
                                {copiedId === photo.id ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                              </button>
                              <a href={photo.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-100 rounded-lg">
                                <ExternalLink size={16} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

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
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
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
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(selectedPhoto.url, selectedPhoto.id)} className="gap-2">
                  <Copy size={16} /> Copy URL
                </Button>
                <a href={selectedPhoto.url} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2">
                    <Download size={16} /> ดาวน์โหลด
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

export default AdminDrivePhotos;
