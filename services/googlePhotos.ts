/**
 * Google Photos Integration Service
 * ระบบดึงรูปตั๋ว Lotto จาก Google Photos Album
 */

interface PhotoMetadata {
  id: string;
  filename: string;
  baseUrl: string;
  mimeType: string;
  creationTime: string;
  width: number;
  height: number;
}

interface Album {
  id: string;
  title: string;
  productUrl: string;
  coverPhotoBaseUrl?: string;
  mediaItemsCount?: string;
}

interface TicketPhoto {
  ticketNumber: string;
  orderNumber: string;
  photoUrl: string;
  thumbnail: string;
  uploadedAt: string;
  uploadedBy: string;
  photoId?: string; // เพิ่ม ID ของรูป
}

class GooglePhotosService {
  private albumId: string;
  private accessToken: string;

  constructor() {
    // Album ID จะได้จาก Google Photos shared album
    this.albumId = localStorage.getItem('google_photos_album_id') || '';
    this.accessToken = localStorage.getItem('google_photos_token') || '';
  }

  /**
   * ดึงรูปทั้งหมดจาก Album
   */
  async getAlbumPhotos(): Promise<PhotoMetadata[]> {
    try {
      if (!this.accessToken) {
        console.warn('No Google Photos access token found');
        return [];
      }

      if (!this.albumId) {
        console.warn('No Album ID set, fetching all recent photos instead');
        // ถ้าไม่มี albumId ให้ดึงรูปล่าสุดทั้งหมดแทน
        return await this.getAllRecentMediaItems();
      }

      console.log('Fetching photos from album:', this.albumId);

      const response = await fetch(
        `https://photoslibrary.googleapis.com/v1/mediaItems:search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            albumId: this.albumId,
            pageSize: 100,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch photos: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Photos fetched:', data.mediaItems?.length || 0);
      return data.mediaItems || [];
    } catch (error) {
      console.error('Error fetching album photos:', error);
      return [];
    }
  }

  /**
   * ดึงรูปล่าสุดทั้งหมด (ไม่ต้องระบุ Album)
   */
  async getAllRecentMediaItems(): Promise<PhotoMetadata[]> {
    try {
      const response = await fetch(
        `https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=50`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch media items: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Recent photos fetched:', data.mediaItems?.length || 0);
      return data.mediaItems || [];
    } catch (error) {
      console.error('Error fetching recent media items:', error);
      return [];
    }
  }

  /**
   * ค้นหารูปตั๋วตามเลขคำสั่งซื้อ
   * ใช้ filename pattern: LTO-2025-xxxxx-T1.jpg
   */
  async getTicketPhotosByOrder(orderNumber: string): Promise<TicketPhoto[]> {
    try {
      const photos = await this.getAlbumPhotos();
      
      const ticketPhotos: TicketPhoto[] = photos
        .filter((photo) => photo.filename.includes(orderNumber))
        .map((photo) => ({
          ticketNumber: this.extractTicketNumber(photo.filename),
          orderNumber: orderNumber,
          photoUrl: `${photo.baseUrl}=w2048-h2048`, // Full resolution
          thumbnail: `${photo.baseUrl}=w400-h400`, // Thumbnail
          uploadedAt: photo.creationTime,
          uploadedBy: 'USA Agent',
        }));

      return ticketPhotos;
    } catch (error) {
      console.error('Error getting ticket photos:', error);
      return [];
    }
  }

  /**
   * ดึงรูปตั๋วเดียว
   */
  async getTicketPhoto(ticketNumber: string): Promise<TicketPhoto | null> {
    try {
      const photos = await this.getAlbumPhotos();
      
      const photo = photos.find((p) => 
        p.filename.includes(ticketNumber)
      );

      if (!photo) return null;

      return {
        ticketNumber,
        orderNumber: this.extractOrderNumber(photo.filename),
        photoUrl: `${photo.baseUrl}=w2048-h2048`,
        thumbnail: `${photo.baseUrl}=w400-h400`,
        uploadedAt: photo.creationTime,
        uploadedBy: 'USA Agent',
      };
    } catch (error) {
      console.error('Error getting ticket photo:', error);
      return null;
    }
  }

  /**
   * ดึงรูปล่าสุด (สำหรับแดชบอร์ด)
   * แสดงรูปทั้งหมดจาก Album โดยใช้ชื่อไฟล์เป็น ID
   */
  async getRecentPhotos(limit: number = 20): Promise<TicketPhoto[]> {
    try {
      const photos = await this.getAlbumPhotos();
      
      return photos
        .slice(0, limit)
        .map((photo, index) => ({
          ticketNumber: this.extractTicketNumber(photo.filename) || `รูปที่ ${index + 1}`,
          orderNumber: this.extractOrderNumber(photo.filename) || photo.filename.replace(/\.[^/.]+$/, ''),
          photoUrl: `${photo.baseUrl}=w2048-h2048`,
          thumbnail: `${photo.baseUrl}=w400-h400`,
          uploadedAt: photo.creationTime,
          uploadedBy: 'USA Agent',
          photoId: photo.id, // เพิ่ม photo ID
        }));
    } catch (error) {
      console.error('Error getting recent photos:', error);
      return [];
    }
  }

  /**
   * ดึงรูปทั้งหมดจาก Album (ไม่ต้อง pattern ชื่อไฟล์)
   */
  async getAllPhotosFromAlbum(): Promise<TicketPhoto[]> {
    try {
      const photos = await this.getAlbumPhotos();
      
      return photos.map((photo, index) => ({
        ticketNumber: `รูปที่ ${index + 1}`,
        orderNumber: photo.filename.replace(/\.[^/.]+$/, ''), // ใช้ชื่อไฟล์เป็น order
        photoUrl: `${photo.baseUrl}=w2048-h2048`,
        thumbnail: `${photo.baseUrl}=w400-h400`,
        uploadedAt: photo.creationTime,
        uploadedBy: 'USA Agent',
        photoId: photo.id,
      }));
    } catch (error) {
      console.error('Error getting all photos:', error);
      return [];
    }
  }

  /**
   * Extract ticket number from filename
   * Pattern: LTO-2025-xxxxx-T1.jpg -> LTO-2025-xxxxx-T1
   */
  private extractTicketNumber(filename: string): string {
    const match = filename.match(/(LTO-\d{4}-\d+(-T\d+)?)/);
    return match ? match[1] : filename.replace(/\.[^/.]+$/, '');
  }

  /**
   * Extract order number from filename
   * Pattern: LTO-2025-xxxxx-T1.jpg -> LTO-2025-xxxxx
   */
  private extractOrderNumber(filename: string): string {
    const match = filename.match(/(LTO-\d{4}-\d+)/);
    return match ? match[1] : '';
  }

  /**
   * ดึงรายการ Albums ทั้งหมด
   */
  async listAlbums(): Promise<Album[]> {
    try {
      if (!this.accessToken) {
        console.warn('No Google Photos access token found');
        return [];
      }

      const response = await fetch(
        'https://photoslibrary.googleapis.com/v1/albums?pageSize=50',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch albums: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.albums || [];
    } catch (error) {
      console.error('Error fetching albums:', error);
      throw error;
    }
  }

  /**
   * ตั้งค่า Album ID
   */
  setAlbumId(albumId: string): void {
    this.albumId = albumId;
    localStorage.setItem('google_photos_album_id', albumId);
  }

  /**
   * ตั้งค่า Access Token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('google_photos_token', token);
  }

  /**
   * เช็คว่ามีการเชื่อมต่อหรือไม่
   */
  isConnected(): boolean {
    return !!(this.albumId && this.accessToken);
  }

  /**
   * ดึงรูปตั๋วทั้งหมด (alias for getRecentPhotos)
   */
  async getTicketPhotos(limit: number = 50): Promise<TicketPhoto[]> {
    return this.getRecentPhotos(limit);
  }

  /**
   * ค้นหารูปตั๋วด้วยเลขออเดอร์
   */
  async searchByOrderNumber(orderNumber: string): Promise<TicketPhoto[]> {
    try {
      const photos = await this.getAlbumPhotos();
      
      const matches = photos.filter((photo) => 
        photo.filename.toLowerCase().includes(orderNumber.toLowerCase())
      );

      return matches.map((photo, index) => ({
        ticketNumber: this.extractTicketNumber(photo.filename) || `รูปที่ ${index + 1}`,
        orderNumber: this.extractOrderNumber(photo.filename) || orderNumber,
        photoUrl: `${photo.baseUrl}=w2048-h2048`,
        thumbnail: `${photo.baseUrl}=w400-h400`,
        uploadedAt: photo.creationTime,
        uploadedBy: 'USA Agent',
        photoId: photo.id,
      }));
    } catch (error) {
      console.error('Error searching by order number:', error);
      return [];
    }
  }
}

// Export singleton instance
export const googlePhotosService = new GooglePhotosService();

// Export types
export type { PhotoMetadata, TicketPhoto, Album };
