/**
 * Google Drive Integration Service
 * ระบบดึงรูปตั๋ว Lotto จาก Google Drive
 * ใช้กับ ScanSnap Scanner
 */

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
  createdTime: string;
  modifiedTime: string;
}

interface TicketPhoto {
  ticketNumber: string;
  orderNumber: string;
  photoUrl: string;
  thumbnail: string;
  downloadUrl: string;
  uploadedAt: string;
  fileName: string;
}

class GoogleDriveService {
  private folderId: string;
  private accessToken: string;
  private apiKey: string;

  constructor() {
    this.folderId = localStorage.getItem('google_drive_folder_id') || '';
    this.accessToken = localStorage.getItem('google_drive_token') || '';
    this.apiKey = localStorage.getItem('google_drive_api_key') || '';
  }

  /**
   * ดึงไฟล์ทั้งหมดจาก Folder
   */
  async getFolderFiles(): Promise<DriveFile[]> {
    try {
      if (!this.folderId) {
        console.warn('No Google Drive folder ID set');
        return [];
      }

      // ใช้ API Key (ไม่ต้อง OAuth) ถ้า folder เป็น public
      const authHeader = this.accessToken 
        ? `Bearer ${this.accessToken}`
        : '';
      
      const apiKeyParam = this.apiKey ? `&key=${this.apiKey}` : '';

      const query = `'${this.folderId}' in parents and mimeType contains 'image/' and trashed = false`;
      const fields = 'files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime)';
      
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=createdTime desc&pageSize=50${apiKeyParam}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Drive API Error:', errorData);
        throw new Error(`Failed to fetch files: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Files fetched:', data.files?.length || 0);
      return data.files || [];
    } catch (error) {
      console.error('Error fetching folder files:', error);
      throw error;
    }
  }

  /**
   * แปลง Drive files เป็น TicketPhoto
   */
  async getTicketPhotos(): Promise<TicketPhoto[]> {
    try {
      const files = await this.getFolderFiles();
      
      return files.map((file, index) => ({
        ticketNumber: this.extractTicketNumber(file.name) || `รูปที่ ${index + 1}`,
        orderNumber: this.extractOrderNumber(file.name) || file.name.replace(/\.[^/.]+$/, ''),
        photoUrl: `https://drive.google.com/uc?export=view&id=${file.id}`,
        thumbnail: file.thumbnailLink || `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
        uploadedAt: file.createdTime,
        fileName: file.name,
      }));
    } catch (error) {
      console.error('Error getting ticket photos:', error);
      return [];
    }
  }

  /**
   * ค้นหารูปตามเลข Order
   */
  async searchByOrderNumber(orderNumber: string): Promise<TicketPhoto[]> {
    try {
      const allPhotos = await this.getTicketPhotos();
      return allPhotos.filter(photo => 
        photo.fileName.toLowerCase().includes(orderNumber.toLowerCase()) ||
        photo.orderNumber.toLowerCase().includes(orderNumber.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching photos:', error);
      return [];
    }
  }

  /**
   * Extract ticket number from filename
   */
  private extractTicketNumber(filename: string): string {
    const match = filename.match(/(LTO-\d{4}-\d+(-T\d+)?)/i);
    return match ? match[1].toUpperCase() : '';
  }

  /**
   * Extract order number from filename
   */
  private extractOrderNumber(filename: string): string {
    const match = filename.match(/(LTO-\d{4}-\d+)/i);
    return match ? match[1].toUpperCase() : '';
  }

  /**
   * ตั้งค่า Folder ID
   */
  setFolderId(folderId: string): void {
    this.folderId = folderId;
    localStorage.setItem('google_drive_folder_id', folderId);
  }

  /**
   * ตั้งค่า Access Token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('google_drive_token', token);
  }

  /**
   * ตั้งค่า API Key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('google_drive_api_key', apiKey);
  }

  /**
   * ล้างการตั้งค่า
   */
  clearSettings(): void {
    this.folderId = '';
    this.accessToken = '';
    this.apiKey = '';
    localStorage.removeItem('google_drive_folder_id');
    localStorage.removeItem('google_drive_token');
    localStorage.removeItem('google_drive_api_key');
  }

  /**
   * เช็คว่ามีการเชื่อมต่อหรือไม่
   */
  isConnected(): boolean {
    return !!(this.folderId && (this.accessToken || this.apiKey));
  }

  /**
   * ดึง Folder ID จาก URL
   */
  static extractFolderIdFromUrl(url: string): string {
    // Pattern: https://drive.google.com/drive/folders/FOLDER_ID
    const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : url;
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();

// Export types
export type { DriveFile, TicketPhoto };
