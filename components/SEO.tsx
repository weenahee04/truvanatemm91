import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Truvamate | สินค้าอเมริกา & สินค้าพิเศษจาก USA',
  description = 'บริการฝากซื้อสินค้าจากอเมริกา และสินค้าพิเศษจาก USA ส่งตรงถึงไทย สินค้าแบรนด์ดัง ของแท้ 100% บริการมืออาชีพ ปลอดภัย เชื่อถือได้',
  keywords = 'ฝากซื้อสินค้าอเมริกา, สินค้าจากอเมริกา, USA import, สินค้าพิเศษ USA, ของฝากอเมริกา, Truvamate',
  image = 'https://truvamatenewversion-master.vercel.app/og-image.jpg',
  url
}) => {
  const location = useLocation();
  const baseUrl = 'https://truvamatenewversion-master.vercel.app';
  const fullUrl = url || `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', fullUrl, true);
    updateMetaTag('og:type', 'website', true);

    // Twitter tags
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', image, true);
    updateMetaTag('twitter:card', 'summary_large_image', true);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

  }, [title, description, keywords, image, fullUrl]);

  return null;
};

// SEO presets for different pages
export const SEOPresets = {
  home: {
    title: 'Truvamate | สินค้าอเมริกา & สินค้าพิเศษจาก USA',
    description: 'บริการฝากซื้อสินค้าจากอเมริกา และสินค้าพิเศษจาก USA ส่งตรงถึงไทย สินค้าแบรนด์ดัง ของแท้ 100% บริการมืออาชีพ ปลอดภัย เชื่อถือได้',
    keywords: 'ฝากซื้อสินค้าอเมริกา, สินค้าจากอเมริกา, USA import, สินค้าพิเศษ USA, ของฝากอเมริกา, Truvamate, ซื้อของจากอเมริกา'
  },
  specialProducts: {
    title: 'สินค้าพิเศษจาก USA | Truvamate - บริการฝากซื้อสินค้าพิเศษจากอเมริกา',
    description: 'บริการฝากซื้อสินค้าพิเศษจาก USA ส่งตรงถึงไทย ราคา Powerball $5 / Mega Millions $11 ปลอดภัย มั่นใจ บริการโปร่งใส ไม่มีค่าธรรมเนียมแอบแฝง',
    keywords: 'สินค้าพิเศษ USA, Powerball, Mega Millions, ฝากซื้อสินค้าพิเศษ, Truvamate, USA special products'
  },
  howToUse: {
    title: 'วิธีใช้งาน - Truvamate | คู่มือการฝากซื้อสินค้าจากอเมริกา',
    description: 'คู่มือการใช้งาน Truvamate บริการฝากซื้อสินค้าจากอเมริกา ง่ายๆ เพียง 4 ขั้นตอน เลือกสินค้า ชำระเงิน รับสินค้าถึงบ้าน',
    keywords: 'วิธีใช้งาน Truvamate, คู่มือฝากซื้อ, วิธีซื้อสินค้าจากอเมริกา, how to use Truvamate'
  },
  terms: {
    title: 'ข้อกำหนดและเงื่อนไข | Truvamate - Messenger Service',
    description: 'ข้อกำหนดและเงื่อนไขการใช้บริการ Truvamate บริการ Messenger Service ฝากซื้อสินค้าจากอเมริกา ปฏิบัติตาม PDPA',
    keywords: 'ข้อกำหนดการใช้งาน, terms and conditions, PDPA, messenger service, Truvamate'
  },
  legal: {
    title: 'นโยบายความเป็นส่วนตัว | Truvamate',
    description: 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล Truvamate ปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
    keywords: 'นโยบายความเป็นส่วนตัว, privacy policy, PDPA, Truvamate'
  }
};
