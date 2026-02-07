import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SiteContent, Banner, HeroContent } from '../types';

const SITE_CONTENT_DOC_ID = 'main_content';

// Default content
const DEFAULT_CONTENT: SiteContent = {
  hero: {
    badge: 'OFFICIAL US IMPORTER',
    titleLine1: 'สินค้าอเมริกา',
    titleLine2: 'ส่งตรงถึงบ้านคุณ',
    description: 'พบกับสินค้าแบรนด์ดังและสินค้าพิเศษนำเข้าจาก USA กว่า 10,000 รายการ บริการฝากซื้อที่เชื่อถือได้',
    backgroundImage: 'https://i.ibb.co/s9g0FvQd/3.png'
  },
  promoBanners: [
    { 
      id: 1, 
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070', 
      title: 'MEGA US SALE', 
      subtitle: 'สินค้าแบรนด์ดังลดสูงสุด 70%', 
      link: '/category/flash-sale' 
    },
    { 
      id: 2, 
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070', 
      title: 'NEW ARRIVALS', 
      subtitle: 'คอลเลคชั่นใหม่ส่งตรงจาก NYC', 
      link: '/category/new' 
    }
  ],
  categoryBanners: [
    { id: 1, title: 'Summer Collection', subtitle: 'สดใสรับซัมเมอร์', image: 'https://picsum.photos/800/500?random=101', link: '/category/fashion' },
    { id: 2, title: 'Vintage Vibes', subtitle: 'สไตล์วินเทจสุดคลาสสิค', image: 'https://picsum.photos/800/500?random=102', link: '/category/fashion' },
    { id: 3, title: 'Outdoor Living', subtitle: 'ตกแต่งสวนและมุมพักผ่อน', image: 'https://picsum.photos/800/500?random=103', link: '/category/home' },
    { id: 4, title: 'Gadget Zone', subtitle: 'เทคโนโลยีล้ำสมัย', image: 'https://picsum.photos/800/500?random=104', link: '/category/electronics' },
    { id: 5, title: 'Healthy Life', subtitle: 'วิตามินนำเข้าจาก USA', image: 'https://picsum.photos/800/500?random=105', link: '/category/vitamins' },
    { id: 6, title: 'Kids & Toys', subtitle: 'ของเล่นเสริมพัฒนาการ', image: 'https://picsum.photos/800/500?random=106', link: '/category/toys' }
  ]
};

// Get site content from Firestore
export const getSiteContent = async (): Promise<SiteContent> => {
  try {
    const docRef = doc(db, 'site_content', SITE_CONTENT_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as SiteContent;
    } else {
      // Initialize with default content
      await setDoc(docRef, {
        ...DEFAULT_CONTENT,
        updatedAt: new Date().toISOString()
      });
      return DEFAULT_CONTENT;
    }
  } catch (error) {
    console.error('Error getting site content:', error);
    return DEFAULT_CONTENT;
  }
};

// Update hero section
export const updateHeroContent = async (hero: HeroContent): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'site_content', SITE_CONTENT_DOC_ID);
    await updateDoc(docRef, {
      hero,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Update promo banners
export const updatePromoBanners = async (banners: Banner[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'site_content', SITE_CONTENT_DOC_ID);
    await updateDoc(docRef, {
      promoBanners: banners,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Update category banners
export const updateCategoryBanners = async (banners: Banner[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'site_content', SITE_CONTENT_DOC_ID);
    await updateDoc(docRef, {
      categoryBanners: banners,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Update entire site content
export const updateSiteContent = async (content: SiteContent): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'site_content', SITE_CONTENT_DOC_ID);
    await setDoc(docRef, {
      ...content,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Initialize site content (run once)
export const initializeSiteContent = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const content = await getSiteContent();
    console.log('Site content initialized:', content);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
