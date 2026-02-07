import React, { useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Scan, Upload, Image, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  BarChart3, Home, Camera, HardDrive, Ticket, Users, Wallet, MapPin,
  CreditCard, DollarSign, Settings, ChevronRight, Search, Eye, Download, TrendingUp,
  Trash2, Zap, FileText, Hash, Target, Loader2, Check, X, Link2, Award, Package, LogOut, Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ocrService, OCRResult, TicketMatch } from '../services/ocrService';
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
      { name: 'OCR สแกนตั๋ว', icon: Scan, path: '/admin/ocr-scanner', badge: 'New', isActive: true },
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

interface ScanResult {
  id: string;
  imageUrl: string;
  fileName: string;
  ocrResult: OCRResult | null;
  status: 'pending' | 'scanning' | 'completed' | 'error';
  matches: TicketMatch[];
  progress: number;
}

// Mock สินค้าพิเศษ orders for matching
const MOCK_ORDERS = [
  { orderNumber: 'LT-2024120001', ticketNumbers: ['123456', '789012', '345678'] },
  { orderNumber: 'LT-2024120002', ticketNumbers: ['456789', '012345', '678901'] },
  { orderNumber: 'LT-2024120003', ticketNumbers: ['234567', '890123', '567890'] },
  { orderNumber: 'LT-2024120004', ticketNumbers: ['111222', '333444', '555666'] },
  { orderNumber: 'LT-2024120005', ticketNumbers: ['777888', '999000', '121314'] },
];

export const AdminOCRScanner: React.FC = () => {
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const { logout, showToast, user } = useGlobal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'drive' | 'results'>('upload');
  const [drivePhotos, setDrivePhotos] = useState<TicketPhoto[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [selectedDrivePhotos, setSelectedDrivePhotos] = useState<Set<string>>(new Set());
  const [searchTicket, setSearchTicket] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newResults: ScanResult[] = Array.from(files).map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      imageUrl: URL.createObjectURL(file),
      fileName: file.name,
      ocrResult: null,
      status: 'pending' as const,
      matches: [],
      progress: 0,
    }));
    
    setScanResults(prev => [...prev, ...newResults]);
    setActiveTab('results');
  }, []);

  // Scan a single image
  const scanImage = async (result: ScanResult) => {
    setScanResults(prev => prev.map(r => 
      r.id === result.id ? { ...r, status: 'scanning' as const, progress: 0 } : r
    ));

    try {
      const ocrResult = await ocrService.scanTicketImage(result.imageUrl, (progress) => {
        setScanResults(prev => prev.map(r => 
          r.id === result.id ? { ...r, progress } : r
        ));
      });

      // Match with orders
      const matches: TicketMatch[] = [];
      for (const order of MOCK_ORDERS) {
        for (const ticketNumber of order.ticketNumbers) {
          const matchResult = ocrService.matchTicketNumbers(ocrResult.possibleLottoNumbers, ticketNumber);
          if (matchResult.isMatch) {
            matches.push({
              orderNumber: order.orderNumber,
              ticketNumber,
              matchedPhotoUrl: result.imageUrl,
              matchConfidence: matchResult.confidence,
              ocrNumbers: ocrResult.possibleLottoNumbers,
              isExactMatch: matchResult.matchType === 'exact',
              partialMatches: [],
            });
          }
        }
      }

      setScanResults(prev => prev.map(r => 
        r.id === result.id ? { ...r, status: 'completed' as const, ocrResult, matches, progress: 100 } : r
      ));
    } catch (error) {
      console.error('Scan error:', error);
      setScanResults(prev => prev.map(r => 
        r.id === result.id ? { ...r, status: 'error' as const } : r
      ));
    }
  };

  // Scan all pending images
  const scanAllPending = async () => {
    setIsScanning(true);
    const pending = scanResults.filter(r => r.status === 'pending');
    
    for (const result of pending) {
      await scanImage(result);
    }
    
    setIsScanning(false);
  };

  // Load photos from Google Drive
  const loadDrivePhotos = async () => {
    setIsLoadingDrive(true);
    try {
      const photos = await googleDriveService.getTicketPhotos();
      setDrivePhotos(photos);
    } catch (error) {
      console.error('Error loading drive photos:', error);
    }
    setIsLoadingDrive(false);
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

  // Add selected Drive photos to scan queue
  const addDrivePhotosToQueue = () => {
    const selected = drivePhotos.filter(p => selectedDrivePhotos.has(p.id));
    const newResults: ScanResult[] = selected.map((photo, index) => ({
      id: `drive-${Date.now()}-${index}`,
      imageUrl: photo.thumbnailUrl || photo.webViewUrl,
      fileName: photo.name,
      ocrResult: null,
      status: 'pending' as const,
      matches: [],
      progress: 0,
    }));
    
    setScanResults(prev => [...prev, ...newResults]);
    setSelectedDrivePhotos(new Set());
    setActiveTab('results');
  };

  // Remove scan result
  const removeResult = (id: string) => {
    setScanResults(prev => prev.filter(r => r.id !== id));
  };

  // Clear all results
  const clearAllResults = () => {
    setScanResults([]);
  };

  // Filter results by search
  const filteredResults = searchTicket 
    ? scanResults.filter(r => 
        r.ocrResult?.possibleLottoNumbers.some(n => n.includes(searchTicket)) ||
        r.matches.some(m => m.ticketNumber.includes(searchTicket))
      )
    : scanResults;

  // Stats
  const stats = {
    total: scanResults.length,
    pending: scanResults.filter(r => r.status === 'pending').length,
    completed: scanResults.filter(r => r.status === 'completed').length,
    matched: scanResults.filter(r => r.matches.length > 0).length,
    errors: scanResults.filter(r => r.status === 'error').length,
  };

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
                  const isActive = item.isActive || routeLocation.pathname === item.path;
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
                  <Scan className="text-brand-gold" size={28} />
                  OCR สแกนตั๋วหวย
                </h1>
                <p className="text-sm text-slate-500 mt-1">สแกนรูปตั๋วหวยและจับคู่เลขอัตโนมัติ</p>
              </div>
              <div className="flex items-center gap-3">
                {stats.pending > 0 && (
                  <Button onClick={scanAllPending} disabled={isScanning} className="gap-2 bg-green-600 hover:bg-green-700">
                    {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                    สแกนทั้งหมด ({stats.pending})
                  </Button>
                )}
                {scanResults.length > 0 && (
                  <Button onClick={clearAllResults} variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 size={18} />
                    ล้างทั้งหมด
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">รูปทั้งหมด</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Image className="text-blue-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">รอสแกน</p>
                  <p className="text-2xl font-black text-orange-600 mt-1">{stats.pending}</p>
                </div>
                <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Loader2 className="text-orange-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">สแกนแล้ว</p>
                  <p className="text-2xl font-black text-green-600 mt-1">{stats.completed}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">จับคู่สำเร็จ</p>
                  <p className="text-2xl font-black text-purple-600 mt-1">{stats.matched}</p>
                </div>
                <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Target className="text-purple-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ผิดพลาด</p>
                  <p className="text-2xl font-black text-red-600 mt-1">{stats.errors}</p>
                </div>
                <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="text-red-600" size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
                  activeTab === 'upload' 
                    ? 'text-brand-gold border-b-2 border-brand-gold bg-amber-50' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Upload size={18} className="inline mr-2" />
                อัพโหลดรูป
              </button>
              <button
                onClick={() => { setActiveTab('drive'); loadDrivePhotos(); }}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
                  activeTab === 'drive' 
                    ? 'text-brand-gold border-b-2 border-brand-gold bg-amber-50' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <HardDrive size={18} className="inline mr-2" />
                Google Drive
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
                  activeTab === 'results' 
                    ? 'text-brand-gold border-b-2 border-brand-gold bg-amber-50' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText size={18} className="inline mr-2" />
                ผลการสแกน ({stats.completed})
              </button>
            </div>

            <div className="p-6">
              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div>
                  <div 
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-brand-gold transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFileUpload(e.dataTransfer.files);
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                    <p className="text-lg font-bold text-slate-900 mb-2">ลากไฟล์มาวางหรือคลิกเพื่อเลือก</p>
                    <p className="text-sm text-slate-500">รองรับไฟล์ภาพ JPG, PNG, WEBP (สูงสุด 10 ไฟล์)</p>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-bold text-amber-800">เคล็ดลับการสแกน</p>
                        <ul className="text-sm text-amber-700 mt-1 space-y-1">
                          <li>• ถ่ายรูปให้ชัดเจน ตัวเลขต้องมองเห็นได้ชัด</li>
                          <li>• หลีกเลี่ยงแสงสะท้อนและเงา</li>
                          <li>• ถ่ายให้ตรง ไม่เอียงมากเกินไป</li>
                          <li>• ถ้าเลขไม่ตรง สามารถกรอกเลขเองได้</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Drive Tab */}
              {activeTab === 'drive' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-slate-600">เลือกรูปจาก Google Drive เพื่อสแกน</p>
                    <div className="flex items-center gap-3">
                      {selectedDrivePhotos.size > 0 && (
                        <Button onClick={addDrivePhotosToQueue} className="gap-2">
                          <Scan size={18} />
                          เพิ่มเข้าคิวสแกน ({selectedDrivePhotos.size})
                        </Button>
                      )}
                      <Button onClick={loadDrivePhotos} variant="outline" className="gap-2" disabled={isLoadingDrive}>
                        <RefreshCw size={18} className={isLoadingDrive ? 'animate-spin' : ''} />
                        รีเฟรช
                      </Button>
                    </div>
                  </div>

                  {isLoadingDrive ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-brand-gold" size={32} />
                    </div>
                  ) : drivePhotos.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <HardDrive size={48} className="mx-auto mb-4 text-slate-300" />
                      <p>ไม่พบรูปใน Google Drive</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {drivePhotos.map((photo) => (
                        <div 
                          key={photo.id}
                          onClick={() => {
                            const newSelected = new Set(selectedDrivePhotos);
                            if (newSelected.has(photo.id)) {
                              newSelected.delete(photo.id);
                            } else {
                              newSelected.add(photo.id);
                            }
                            setSelectedDrivePhotos(newSelected);
                          }}
                          className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                            selectedDrivePhotos.has(photo.id) 
                              ? 'ring-4 ring-brand-gold' 
                              : 'hover:ring-2 hover:ring-slate-300'
                          }`}
                        >
                          <img 
                            src={photo.thumbnailUrl || '/placeholder.jpg'} 
                            alt={photo.name}
                            className="w-full aspect-square object-cover"
                          />
                          {selectedDrivePhotos.has(photo.id) && (
                            <div className="absolute top-2 right-2 h-6 w-6 bg-brand-gold rounded-full flex items-center justify-center">
                              <Check size={14} className="text-slate-900" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white truncate">{photo.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Results Tab */}
              {activeTab === 'results' && (
                <div>
                  {/* Search */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchTicket}
                        onChange={(e) => setSearchTicket(e.target.value)}
                        placeholder="ค้นหาเลขตั๋ว..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  {filteredResults.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                      <p>ยังไม่มีรูปในคิว</p>
                      <p className="text-sm mt-1">อัพโหลดรูปหรือเลือกจาก Google Drive</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredResults.map((result) => (
                        <div 
                          key={result.id}
                          className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                        >
                          <div className="flex gap-4">
                            {/* Image */}
                            <div className="w-32 h-32 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                              <img 
                                src={result.imageUrl} 
                                alt={result.fileName}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-bold text-slate-900 truncate">{result.fileName}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {result.status === 'pending' && (
                                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
                                        รอสแกน
                                      </span>
                                    )}
                                    {result.status === 'scanning' && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                                        <Loader2 size={12} className="animate-spin" />
                                        กำลังสแกน {result.progress.toFixed(0)}%
                                      </span>
                                    )}
                                    {result.status === 'completed' && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle size={12} />
                                        สแกนเสร็จ
                                      </span>
                                    )}
                                    {result.status === 'error' && (
                                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1">
                                        <XCircle size={12} />
                                        ผิดพลาด
                                      </span>
                                    )}
                                    {result.matches.length > 0 && (
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                                        <Target size={12} />
                                        จับคู่ได้ {result.matches.length} รายการ
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {result.status === 'pending' && (
                                    <Button 
                                      onClick={() => scanImage(result)} 
                                      size="sm" 
                                      className="gap-1"
                                    >
                                      <Scan size={14} />
                                      สแกน
                                    </Button>
                                  )}
                                  <button 
                                    onClick={() => removeResult(result.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>
                              </div>

                              {/* OCR Results */}
                              {result.ocrResult && (
                                <div className="mt-3">
                                  <p className="text-xs text-slate-500 mb-1">
                                    เลขที่พบ (ความแม่นยำ {result.ocrResult.confidence.toFixed(1)}%):
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {result.ocrResult.possibleLottoNumbers.length > 0 ? (
                                      result.ocrResult.possibleLottoNumbers.slice(0, 10).map((num, i) => (
                                        <span 
                                          key={i}
                                          className="font-mono text-sm bg-white px-3 py-1 rounded-lg border border-slate-200"
                                        >
                                          {num}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm text-slate-400">ไม่พบเลข 6 หลัก</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Matches */}
                              {result.matches.length > 0 && (
                                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <p className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1">
                                    <CheckCircle size={14} />
                                    จับคู่กับคำสั่งซื้อ
                                  </p>
                                  <div className="space-y-2">
                                    {result.matches.map((match, i) => (
                                      <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                          <Link2 size={14} className="text-green-600" />
                                          <span className="font-bold text-green-800">{match.orderNumber}</span>
                                          <span className="font-mono bg-white px-2 py-0.5 rounded text-green-700">
                                            {match.ticketNumber}
                                          </span>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          match.isExactMatch 
                                            ? 'bg-green-200 text-green-800' 
                                            : 'bg-yellow-200 text-yellow-800'
                                        }`}>
                                          {match.isExactMatch ? 'ตรงเป๊ะ' : `${match.matchConfidence.toFixed(0)}%`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminOCRScanner;
