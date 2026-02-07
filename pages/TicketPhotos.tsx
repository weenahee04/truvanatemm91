import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { googlePhotosService, TicketPhoto } from '../services/googlePhotos';

/**
 * หน้าแสดงรูปตั๋ว Lotto สำหรับลูกค้า
 * ลูกค้าจะเห็นรูปตั๋วจริงที่ซื้อจาก USA
 */
const TicketPhotos: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  
  const [photos, setPhotos] = useState<TicketPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<TicketPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPhotos();
  }, [orderNumber]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError('');

      if (!orderNumber) {
        setError('ไม่พบเลขที่คำสั่งซื้อ');
        return;
      }

      // ตรวจสอบว่าเชื่อมต่อ Google Photos หรือไม่
      if (!googlePhotosService.isConnected()) {
        setError('ระบบยังไม่ได้เชื่อมต่อกับ Google Photos กรุณาติดต่อผู้ดูแลระบบ');
        return;
      }

      const ticketPhotos = await googlePhotosService.getTicketPhotosByOrder(orderNumber);
      
      if (ticketPhotos.length === 0) {
        setError('ยังไม่มีรูปตั๋วในระบบ กรุณารอ Agent อัพโหลดรูป (ภายใน 24 ชั่วโมง)');
      }

      setPhotos(ticketPhotos);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('เกิดข้อผิดพลาดในการโหลดรูปตั๋ว');
    } finally {
      setLoading(false);
    }
  };

  const openPhotoModal = (photo: TicketPhoto) => {
    setSelectedPhoto(photo);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-gold mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดรูปตั๋ว...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-brand-gold hover:text-yellow-600 mb-4 flex items-center"
          >
            <span className="mr-2">←</span> กลับ
          </button>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            รูปตั๋ว Lotto จริง
          </h1>
          <p className="text-gray-600">
            คำสั่งซื้อ: <span className="font-semibold">{orderNumber}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            📸 รูปถ่ายตั๋วจริงจาก USA Agent
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div>
            <div className="mb-4">
              <p className="text-gray-700">
                พบ <span className="font-bold text-brand-gold">{photos.length}</span> ตั๋ว
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => openPhotoModal(photo)}
                >
                  {/* Photo */}
                  <div className="aspect-w-4 aspect-h-3 bg-gray-200">
                    <img
                      src={photo.thumbnail}
                      alt={photo.ticketNumber}
                      className="w-full h-64 object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="font-semibold text-gray-800 mb-1">
                      {photo.ticketNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      อัพโหลดโดย: {photo.uploadedBy}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(photo.uploadedAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* View Button */}
                  <div className="px-4 pb-4">
                    <button className="w-full bg-brand-gold text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors">
                      ดูขนาดเต็ม
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        {photos.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>หมายเหตุ:</strong> รูปเหล่านี้เป็นรูปถ่ายตั๋วจริงที่ Agent ซื้อจาก USA 
                  กรุณาเก็บรักษาหมายเลขตั๋วไว้เพื่อตรวจสอบผล
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Modal (Fullscreen) */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center p-4"
          onClick={closePhotoModal}
        >
          <div className="relative max-w-6xl w-full">
            {/* Close Button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={selectedPhoto.photoUrl}
              alt={selectedPhoto.ticketNumber}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Info Overlay */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xl font-bold mb-2">{selectedPhoto.ticketNumber}</p>
              <p className="text-sm opacity-90">
                อัพโหลดโดย: {selectedPhoto.uploadedBy} • {' '}
                {new Date(selectedPhoto.uploadedAt).toLocaleDateString('th-TH')}
              </p>
              <a
                href={selectedPhoto.photoUrl}
                download={`${selectedPhoto.ticketNumber}.jpg`}
                className="inline-block mt-4 bg-brand-gold text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                ดาวน์โหลดรูป
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketPhotos;
