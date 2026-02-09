
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { RefreshCw, Plus, Trash2, X, Check, Dna, Trophy, Calendar, Clock, ChevronDown, ChevronUp, Scale, LogIn, UserPlus, Lock, AlertTriangle, CheckCircle2, DollarSign, FileText } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { SEO, SEOPresets } from '../components/SEO';
import { getLottoPricing } from '../services/lottoPricingService';
import { PowerballLogo, MegaMillionsLogo } from '../components/ui/LotteryLogos';
import { useJackpots } from '../services/jackpotService';

interface Ticket {
  id: number;
  numbers: number[];
  special: number;
  type: 'Powerball' | 'Mega Millions';
}

interface JackpotInfo {
  amount: number;
  unit: string;
  nextDraw: string;
  currency: string;
}

type GameType = 'Powerball' | 'Mega Millions';

const GAME_RULES = {
  'Powerball': { maxMain: 69, maxSpecial: 26, name: 'Powerball', color: 'bg-red-600', specialName: 'PB' },
  'Mega Millions': { maxMain: 70, maxSpecial: 25, name: 'Mega Millions', color: 'bg-brand-gold', specialName: 'MM' }
};

const PAST_DRAWS = [
  { date: 'Oct 25, 2023', jackpot: '$400 Million', numbers: [12, 24, 35, 46, 57], special: 10, type: 'Powerball' },
  { date: 'Oct 24, 2023', jackpot: '$150 Million', numbers: [5, 18, 22, 30, 41], special: 15, type: 'Mega Millions' },
  { date: 'Oct 23, 2023', jackpot: '$380 Million', numbers: [2, 14, 26, 38, 49], special: 8, type: 'Powerball' },
  { date: 'Oct 21, 2023', jackpot: '$340 Million', numbers: [10, 15, 21, 45, 60], special: 4, type: 'Powerball' },
];

// Ticket price will be loaded from Firestore dynamically

// Special Products page (formerly known as Lotto)
export const Lotto: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useGlobal(); // Check login status
  const [activeGame, setActiveGame] = useState<GameType>('Powerball');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { data: jackpotApiData } = useJackpots();
  
  // Jackpot data from real-time API
  const [jackpots, setJackpots] = useState<Record<GameType, JackpotInfo>>({
    'Powerball': { amount: 0, unit: 'MILLION', nextDraw: 'Loading...', currency: '$' },
    'Mega Millions': { amount: 0, unit: 'MILLION', nextDraw: 'Loading...', currency: '$' }
  });

  // Load tickets from location.state (when navigating back) or localStorage, or use default
  const loadTicketsFromStorage = (): Ticket[] => {
    // First, check if tickets are passed via location.state (from checkout back button)
    if (location.state?.tickets && Array.isArray(location.state.tickets) && location.state.tickets.length > 0) {
      // Save to localStorage for persistence
      localStorage.setItem('truvamate_lotto_tickets', JSON.stringify(location.state.tickets));
      return location.state.tickets;
    }
    
    // Otherwise, try loading from localStorage
    try {
      const savedTickets = localStorage.getItem('truvamate_lotto_tickets');
      if (savedTickets) {
        const parsed = JSON.parse(savedTickets);
        // Validate that it's an array with ticket structure
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].numbers) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading tickets from storage:', error);
    }
    // Default ticket if no saved tickets
    return [{ id: 1, numbers: [5, 12, 23, 34, 45], special: 10, type: 'Powerball' }];
  };

  const [tickets, setTickets] = useState<Ticket[]>(loadTicketsFromStorage());
  
  // Update tickets when location.state changes (e.g., when navigating back from checkout)
  useEffect(() => {
    if (location.state?.tickets && Array.isArray(location.state.tickets) && location.state.tickets.length > 0) {
      setTickets(location.state.tickets);
      localStorage.setItem('truvamate_lotto_tickets', JSON.stringify(location.state.tickets));
    }
  }, [location.state]);

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // State for Login Modal
  const [showLegalConsent, setShowLegalConsent] = useState(false); // State for Legal Consent Modal
  const [legalStep, setLegalStep] = useState(1);
  const [ticketPriceUSD, setTicketPriceUSD] = useState(5); // Default fallback price in USD
  const [pricingData, setPricingData] = useState<Record<GameType, number>>({
    'Powerball': 5,
    'Mega Millions': 11
  });
  
  const [tempNumbers, setTempNumbers] = useState<number[]>([]);
  const [tempSpecial, setTempSpecial] = useState<number | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false); // State for accepting terms
  const [numDraws, setNumDraws] = useState(1); // Number of advance draws (1 = current draw only)

  // Load ticket prices from Firestore for both games
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const pricing = await getLottoPricing();
        const prices: Record<GameType, number> = {
          'Powerball': 5,
          'Mega Millions': 11
        };
        
        pricing.products.forEach(product => {
          if (product.id === 'powerball') {
            prices['Powerball'] = product.pricePerLine + product.serviceFee;
          } else if (product.id === 'megamillions') {
            prices['Mega Millions'] = product.pricePerLine + product.serviceFee;
          }
        });
        
        setPricingData(prices);
        setTicketPriceUSD(prices[activeGame]);
      } catch (error) {
        console.error('Error loading prices:', error);
        // Use defaults on error
        setPricingData({ 'Powerball': 5, 'Mega Millions': 11 });
        setTicketPriceUSD(activeGame === 'Powerball' ? 5 : 11);
      }
    };
    loadPrices();
  }, []);

  // Update ticket price when activeGame changes
  useEffect(() => {
    setTicketPriceUSD(pricingData[activeGame]);
  }, [activeGame, pricingData]);

  // Save tickets to localStorage whenever tickets change
  useEffect(() => {
    if (tickets.length > 0) {
      localStorage.setItem('truvamate_lotto_tickets', JSON.stringify(tickets));
    }
  }, [tickets]);

  // Check for consent on mount
  useEffect(() => {
    const hasConsented = localStorage.getItem('truvamate_special_consent');
    if (!hasConsented) {
      setShowLegalConsent(true);
      setAcceptedTerms(false); // Reset checkbox when modal opens
    }

  }, []);

  // Update jackpots when real-time API data arrives
  useEffect(() => {
    if (jackpotApiData) {
      const pbRaw = jackpotApiData.powerball.jackpotRaw;
      const mmRaw = jackpotApiData.megaMillions.jackpotRaw;
      setJackpots({
        'Powerball': {
          amount: pbRaw >= 1_000_000_000 ? Math.round(pbRaw / 1_000_000_000 * 10) / 10 : Math.round(pbRaw / 1_000_000),
          unit: pbRaw >= 1_000_000_000 ? 'BILLION' : 'MILLION',
          nextDraw: jackpotApiData.powerball.nextDraw,
          currency: '$'
        },
        'Mega Millions': {
          amount: mmRaw >= 1_000_000_000 ? Math.round(mmRaw / 1_000_000_000 * 10) / 10 : Math.round(mmRaw / 1_000_000),
          unit: mmRaw >= 1_000_000_000 ? 'BILLION' : 'MILLION',
          nextDraw: jackpotApiData.megaMillions.nextDraw,
          currency: '$'
        }
      });
    }
  }, [jackpotApiData]);

  const handleLegalConsent = () => {
    if (!acceptedTerms) {
      return; // Don't proceed if terms not accepted
    }
    localStorage.setItem('truvamate_special_consent', 'true');
    setShowLegalConsent(false);
  };

  const generateRandomNumbers = () => {
    const nums = new Set<number>();
    const max = GAME_RULES[activeGame].maxMain;
    while(nums.size < 5) {
      nums.add(Math.floor(Math.random() * max) + 1);
    }
    return Array.from(nums).sort((a,b) => a-b);
  };

  const generateRandomSpecial = () => {
    const max = GAME_RULES[activeGame].maxSpecial;
    return Math.floor(Math.random() * max) + 1;
  };

  const handleQuickPickInModal = () => {
    setTempNumbers(generateRandomNumbers());
    setTempSpecial(generateRandomSpecial());
  };

  const toggleNumber = (num: number) => {
    if (tempNumbers.includes(num)) {
      setTempNumbers(tempNumbers.filter(n => n !== num));
    } else {
      if (tempNumbers.length < 5) {
        setTempNumbers([...tempNumbers, num].sort((a,b) => a-b));
      }
    }
  };

  const toggleSpecial = (num: number) => {
    if (tempSpecial === num) {
      setTempSpecial(null);
    } else {
      setTempSpecial(num);
    }
  };

  const confirmSelection = () => {
    if (tempNumbers.length === 5 && tempSpecial !== null) {
      setTickets([...tickets, { 
        id: Date.now(), 
        numbers: tempNumbers, 
        special: tempSpecial,
        type: activeGame
      }]);
      setIsSelectorOpen(false);
      // Reset
      setTempNumbers([]);
      setTempSpecial(null);
    }
  };

  const openSelector = () => {
    setTempNumbers([]);
    setTempSpecial(null);
    setIsSelectorOpen(true);
  };

  const removeTicket = (id: number) => {
    setTickets(tickets.filter(t => t.id !== id));
  };

  const handleCheckout = () => {
    if (tickets.length === 0) return;

    // Check if user is logged in
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    // Save tickets to localStorage before navigating (already saved via useEffect, but ensure it's saved)
    localStorage.setItem('truvamate_lotto_tickets', JSON.stringify(tickets));
    
    navigate('/checkout', { state: { source: 'special-products', tickets: tickets, numDraws: numDraws } });
  };

  const currentRule = GAME_RULES[activeGame];

  return (
    <>
      <SEO {...SEOPresets.specialProducts} />
      <div className="bg-slate-50 min-h-screen pb-20">
        
        {/* Legal Consent Modal */}
      {showLegalConsent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl md:max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-brand-gold p-6 text-center">
                 <AlertTriangle size={48} className="mx-auto mb-2 text-slate-900" />
                 <h2 className="text-2xl font-black text-slate-900 uppercase">ข้อตกลงการใช้งาน</h2>
                 <p className="text-sm font-bold text-slate-800">สินค้าพิเศษ USA Messenger Service</p>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Age Check */}
                <div className="flex gap-4 items-start">
                   <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0 font-bold text-slate-900">18+</div>
                   <div>
                      <h3 className="font-bold text-slate-900">ยืนยันอายุ 20 ปีบริบูรณ์</h3>
                      <p className="text-sm text-slate-600">ข้าพเจ้ายืนยันว่ามีอายุครบ 20 ปีบริบูรณ์ขึ้นไป และมีสติสัมปชัญญะครบถ้วนในการทำธุรกรรม</p>
                   </div>
                </div>

                {/* Service Fee */}
                <div className="flex gap-4 items-start">
                   <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0 text-green-700 font-bold">
                     <DollarSign size={20} />
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-900">ค่าบริการ: Powerball $5 / Mega Millions $11</h3>
                      <ul className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded border border-slate-100 mt-2">
                         <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> ไม่มีค่าธรรมเนียมแอบแฝง</li>
                         <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> ไม่หักเปอร์เซ็นต์เงินรางวัล</li>
                         <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> สินค้าเป็นกรรมสิทธิ์ของท่าน 100%</li>
                      </ul>
                   </div>
                </div>

                 {/* Legal */}
                <div className="flex gap-4 items-start">
                   <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0 text-slate-900 font-bold">
                     <Scale size={20} />
                   </div>
                   <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-3">กฎและเงื่อนไขการใช้บริการ</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        บริการรับฝากซื้อ Megamillions และ Powerball
                      </p>
                      <Link 
                        to="/special-products-legal" 
                        className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-navy font-semibold text-sm underline mb-4"
                      >
                        อ่านเงื่อนไขและข้อกำหนดทั้งหมด
                        <Scale size={16} />
                      </Link>
                      
                      {/* Terms & Conditions */}
                      <div className="space-y-4 text-sm text-slate-700">
                        <div>
                          <h4 className="font-bold text-slate-900 mb-3">กฎและเงื่อนไขการใช้บริการรับฝากซื้อ Megamillions และ Powerball</h4>
                          <ul className="space-y-2.5 text-xs text-slate-600 list-none pl-0 mt-3">
                            <li className="flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5 font-bold">1.</span>
                              <span>เว็บไซต์ให้บริการ <strong>รับฝากซื้อ Megamillions และ Powerball แทนลูกค้าเท่านั้น</strong> โดยทำหน้าที่เป็นผู้ให้บริการ ไม่ใช่ผู้ออกสลากหรือเจ้าของ Megamillions และ Powerball</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5 font-bold">2.</span>
                              <span>ลูกค้าต้องตรวจสอบรายละเอียด Megamillions และ Powerball ที่ต้องการฝากซื้อ เช่น <strong>เลข งวด และจำนวน</strong> ให้ถูกต้องก่อนทำการยืนยันคำสั่งซื้อ</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5 font-bold">3.</span>
                              <span>เมื่อทำการชำระเงินและยืนยันคำสั่งซื้อแล้ว ถือว่าลูกค้าเข้าใจและยอมรับว่า บริการนี้เป็นเพียงการรับฝากซื้อ และ<strong>ไม่สามารถยกเลิกหรือขอคืนเงินได้</strong> เว้นแต่กรณีที่ไม่สามารถดำเนินการฝากซื้อได้</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5 font-bold">4.</span>
                              <span>หากลูกค้าถูก Megamillions และ Powerball ทางเว็บไซต์จะทำหน้าที่เป็น <strong>ตัวแทนในการดำเนินการขึ้นเงินรางวัลให้แก่ลูกค้า</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5 font-bold">5.</span>
                              <span>เงินรางวัลที่ลูกค้าจะได้รับเป็น <strong>ยอดเงินสุทธิหลังจากหักภาษี ณ ที่จ่าย</strong> และค่าธรรมเนียมต่าง ๆ ตามที่กฎหมายและหน่วยงานของรัฐกำหนด</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5 font-bold">6.</span>
                              <span>ระยะเวลาในการโอนเงินรางวัลให้แก่ลูกค้าขึ้นอยู่กับขั้นตอนและเงื่อนไขของหน่วยงานที่เกี่ยวข้อง</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5 font-bold">7.</span>
                              <span>เว็บไซต์ไม่รับผิดชอบต่อความล่าช้าหรือความเสียหายที่เกิดจากหน่วยงานของรัฐหรือสถาบันการเงิน แต่อย่างไรก็ตาม ทางเราจะดำเนินการและประสานงานให้ลูกค้าอย่างดีที่สุด</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5 font-bold">8.</span>
                              <span>เว็บไซต์ขอสงวนสิทธิ์ในการปฏิเสธการให้บริการ หากพบว่าการใช้บริการเข้าข่ายผิดกฎหมายหรือขัดต่อเงื่อนไขที่กำหนด</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-slate-400 mt-0.5 font-bold">9.</span>
                              <span>เว็บไซต์ขอสงวนสิทธิ์ในการเปลี่ยนแปลงกฎและเงื่อนไขโดยไม่ต้องแจ้งให้ทราบล่วงหน้า</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Link to full legal page */}
                <div className="border-t border-slate-200 pt-4">
                  <Link 
                    to="/special-products-legal" 
                    className="flex items-center justify-center gap-2 text-brand-blue hover:text-brand-navy font-semibold text-sm underline"
                  >
                    <FileText size={16} />
                    อ่านเงื่อนไขและข้อกำหนดฉบับเต็ม
                  </Link>
                </div>

              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200">
                 {/* Accept Terms Checkbox */}
                 <label className="flex items-start gap-3 mb-4 p-4 bg-white rounded-lg border-2 border-slate-200 hover:border-brand-gold transition-colors cursor-pointer">
                   <input
                     type="checkbox"
                     checked={acceptedTerms}
                     onChange={(e) => setAcceptedTerms(e.target.checked)}
                     className="mt-1 w-5 h-5 text-brand-gold border-slate-300 rounded focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 cursor-pointer"
                   />
                   <span className="text-sm text-slate-700 flex-1">
                     <strong className="text-slate-900">ข้าพเจ้าเข้าใจว่า</strong> เว็บไซต์เป็นเพียงผู้ให้บริการรับฝากซื้อสินค้าพิเศษ (Megamillions และ Powerball) และยินยอมรับเงินรางวัลเป็นยอดสุทธิหลังหักภาษีตามเงื่อนไขของทางรัฐ
                   </span>
                 </label>
                 
                 <Button 
                   onClick={handleLegalConsent} 
                   disabled={!acceptedTerms}
                   className="w-full shadow-lg h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                 >
                    ข้าพเจ้ายอมรับและเข้าสู่เว็บไซต์
                 </Button>
                 <div className="text-center mt-3">
                    <Link to="/" className="text-xs text-slate-400 font-bold hover:text-slate-600">ปฏิเสธและกลับหน้าหลัก</Link>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden text-center p-6 md:p-8">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-navy">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">กรุณาเข้าสู่ระบบ</h3>
            <p className="text-slate-600 mb-6 text-sm">
              เพื่อความปลอดภัยในการบันทึกความเป็นเจ้าของสินค้าและสิทธิในการรับสินค้า กรุณาเข้าสู่ระบบก่อนทำรายการ
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full gap-2 shadow-lg"
              >
                <LogIn size={18} /> เข้าสู่ระบบ
              </Button>
              <Button 
                onClick={() => navigate('/login')} 
                variant="outline" 
                className="w-full gap-2"
              >
                <UserPlus size={18} /> สมัครสมาชิก
              </Button>
            </div>
            <button 
              onClick={() => setShowLoginPrompt(false)} 
              className="mt-6 text-xs text-slate-400 font-bold hover:text-slate-900"
            >
              ยกเลิกและทำรายการภายหลัง
            </button>
          </div>
        </div>
      )}

      {/* Number Selector Modal - Full Screen on Mobile */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-[800] flex items-end md:items-center justify-center bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white w-full h-full md:h-auto md:max-w-3xl md:max-h-[90vh] md:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 md:fade-in md:zoom-in">
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-brand-gold shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  Pick {activeGame}
                </h3>
                <p className="text-slate-800 text-xs md:text-sm font-medium line-clamp-1">
                  5 Balls (1-{currentRule.maxMain}) & 1 {activeGame === 'Powerball' ? 'Red' : 'Gold'} Ball (1-{currentRule.maxSpecial})
                </p>
              </div>
              <button onClick={() => setIsSelectorOpen(false)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                <X size={24} className="text-slate-900" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 bg-slate-50">
              
              {/* White Balls Selection */}
              <div>
                <div className="sticky top-0 bg-slate-50 z-10 py-2 flex justify-between items-end mb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
                    <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs md:text-sm border-2 border-slate-900">1</span>
                    Select 5 Numbers
                  </h4>
                  <span className="text-xs md:text-sm font-bold text-brand-blue">{tempNumbers.length}/5 Selected</span>
                </div>
                <div className="grid grid-cols-7 gap-2 md:gap-3">
                  {Array.from({length: currentRule.maxMain}, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => toggleNumber(num)}
                      disabled={!tempNumbers.includes(num) && tempNumbers.length >= 5}
                      className={`
                        aspect-square rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-100 touch-manipulation
                        ${tempNumbers.includes(num) 
                          ? 'bg-slate-900 text-brand-gold scale-105 shadow-md ring-1 ring-brand-gold' 
                          : 'bg-white text-slate-900 border border-slate-200'}
                        ${(!tempNumbers.includes(num) && tempNumbers.length >= 5) ? 'opacity-30 cursor-not-allowed' : ''}
                      `}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Ball Selection */}
              <div>
                 <div className="sticky top-0 bg-slate-50 z-10 py-2 flex justify-between items-end mb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
                    <span className={`w-6 h-6 md:w-8 md:h-8 rounded-full text-white flex items-center justify-center text-xs md:text-sm border-2 ${activeGame === 'Powerball' ? 'bg-red-600 border-red-600' : 'bg-brand-gold border-brand-gold text-black'}`}>
                      {currentRule.specialName}
                    </span>
                    Select Special Ball
                  </h4>
                  <span className={`text-xs md:text-sm font-bold ${tempSpecial ? 'text-brand-navy' : 'text-slate-400'}`}>{tempSpecial ? 'Selected' : 'Required'}</span>
                </div>
                <div className="grid grid-cols-7 gap-2 md:gap-3">
                  {Array.from({length: currentRule.maxSpecial}, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => toggleSpecial(num)}
                      className={`
                        aspect-square rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-100 touch-manipulation
                        ${tempSpecial === num
                          ? (activeGame === 'Powerball' ? 'bg-red-600 text-white scale-105 shadow-md ring-1 ring-red-300' : 'bg-brand-gold text-black scale-105 shadow-md ring-1 ring-yellow-200')
                          : (activeGame === 'Powerball' ? 'bg-red-50 text-red-900 border border-red-100' : 'bg-yellow-50 text-yellow-900 border border-yellow-100')}
                      `}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex flex-row items-center gap-3 shrink-0 pb-safe">
              <Button variant="outline" onClick={handleQuickPickInModal} className="flex-1 gap-2 border-slate-300 h-12">
                <Dna size={18} /> <span className="hidden sm:inline">Quick Pick</span><span className="sm:hidden">Auto</span>
              </Button>
              <Button 
                onClick={confirmSelection} 
                disabled={tempNumbers.length !== 5 || tempSpecial === null}
                className="flex-[2] gap-2 shadow-lg disabled:opacity-50 disabled:shadow-none h-12"
              >
                <Check size={18} /> Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* สินค้าพิเศษ Hero - Dynamic */}
      <div className="bg-brand-gold text-slate-900 pt-6 pb-20 md:pt-10 md:pb-24 relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <div className="text-[150px] md:text-[200px] font-black leading-none">$</div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          
          {/* Game Switcher */}
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="bg-black/10 p-1 md:p-1.5 rounded-2xl flex gap-1.5 md:gap-2 backdrop-blur-sm shadow-lg">
              <button 
                onClick={() => setActiveGame('Powerball')}
                className={`px-4 md:px-5 py-2 md:py-3 rounded-xl font-bold transition-all flex items-center gap-2 md:gap-3 min-w-[140px] md:min-w-[180px] justify-center ${
                  activeGame === 'Powerball' 
                    ? 'bg-white text-slate-900 shadow-xl scale-105 border-2 border-slate-900' 
                    : 'text-slate-800 hover:bg-white/70 opacity-70 hover:opacity-100 border-2 border-transparent'
                }`}
              >
                <div className="w-16 h-16 md:w-24 md:h-24 flex-shrink-0">
                  <PowerballLogo className="w-full h-full" />
                </div>
                <span className="text-sm md:text-base uppercase tracking-tight">Powerball</span>
              </button>
              <button 
                onClick={() => setActiveGame('Mega Millions')}
                className={`px-4 md:px-5 py-2 md:py-3 rounded-xl font-bold transition-all flex items-center gap-2 md:gap-3 min-w-[140px] md:min-w-[180px] justify-center ${
                  activeGame === 'Mega Millions' 
                    ? 'bg-white text-slate-900 shadow-xl scale-105 border-2 border-slate-900' 
                    : 'text-slate-800 hover:bg-white/70 opacity-70 hover:opacity-100 border-2 border-transparent'
                }`}
              >
                <div className="w-16 h-16 md:w-24 md:h-24 flex-shrink-0">
                  <MegaMillionsLogo className="w-full h-full" />
                </div>
                <span className="text-sm md:text-base uppercase tracking-tight">Mega Millions</span>
              </button>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-black px-3 py-1 rounded-sm text-brand-gold text-[10px] md:text-xs font-bold mb-4 md:mb-6 animate-pulse tracking-widest uppercase shadow-lg">
              <Trophy size={12} /> JACKPOT ALERT
            </div>
            <h1 className="text-4xl md:text-7xl font-black mb-2 tracking-tighter uppercase">
              {activeGame}
            </h1>
            <div className="text-6xl md:text-9xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] md:drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] mb-4 text-stroke-2">
              {jackpots[activeGame].amount
                ? `${jackpots[activeGame].currency}${jackpots[activeGame].amount}${jackpots[activeGame].unit === 'BILLION' ? 'B' : 'M'}`
                : '---'}
            </div>
            <p className="text-sm md:text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
              <Calendar size={16} /> Next Draw: {jackpots[activeGame].nextDraw}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12 md:-mt-16 relative z-20">
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <span>Your Tickets</span>
            <span className="text-xs md:text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Price: $5 USD , $11 USD / Ticket</span>
          </h2>

          {tickets.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 mb-8">
              <div className="inline-flex h-16 w-16 bg-white rounded-full items-center justify-center shadow-sm mb-4">
                 <Dna className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-500 font-medium mb-4">No tickets selected yet</p>
              <Button onClick={openSelector}>Select Lucky Numbers</Button>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {tickets.map((ticket, idx) => (
                <div key={ticket.id} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 group hover:border-brand-gold transition-colors relative">
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-400 w-6">#{idx + 1}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${ticket.type === 'Powerball' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                        {ticket.type}
                      </span>
                    </div>
                     <button onClick={() => removeTicket(ticket.id)} className="sm:hidden p-2 text-slate-400 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="flex gap-2 sm:gap-3 flex-1 justify-center sm:justify-start">
                    {ticket.numbers.map((num, i) => (
                      <div key={i} className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center font-bold text-slate-900 shadow-sm text-sm sm:text-lg">
                        {num}
                      </div>
                    ))}
                    <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full text-white flex items-center justify-center font-bold shadow-md text-sm sm:text-lg border-2 border-black/10 ${ticket.type === 'Powerball' ? 'bg-red-600' : 'bg-brand-gold text-black'}`}>
                      {ticket.special}
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex items-center gap-2 ml-auto">
                    <button onClick={() => removeTicket(ticket.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={openSelector}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-brand-gold hover:text-slate-900 hover:bg-yellow-50 transition-all flex items-center justify-center gap-2 mb-8 uppercase tracking-wide bg-white"
          >
            <Plus size={20} /> Add {activeGame} Ticket
          </button>

          {/* Advance Draws Selector */}
          {tickets.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-4 md:p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-brand-navy rounded-full flex items-center justify-center text-white shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">Advance Play — ซื้อล่วงหน้าหลายงวด</h3>
                  <p className="text-xs text-slate-500">เลือกจำนวนงวดที่ต้องการ ระบบจะซื้อเลขชุดเดียวกันให้ทุกงวดอัตโนมัติ</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 5, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumDraws(n)}
                    className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all border-2 ${
                      numDraws === n
                        ? 'bg-brand-navy text-white border-brand-navy shadow-md scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-brand-navy hover:text-brand-navy'
                    }`}
                  >
                    {n === 1 ? '1 งวด (ปัจจุบัน)' : `${n} งวด`}
                  </button>
                ))}
              </div>
              {numDraws > 1 && (
                <div className="mt-3 bg-white rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span className="text-slate-700">
                      เลขชุดเดียวกัน <strong>{tickets.length} ใบ</strong> × <strong>{numDraws} งวด</strong> = <strong>{tickets.length * numDraws} ใบ</strong> รวม
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 ml-6">ระบบจะซื้อให้อัตโนมัติทุกงวดจนครบ {numDraws} งวด</p>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="text-center sm:text-left">
                <div className="text-slate-500 text-sm font-medium">Total Amount ({tickets.length} Tickets × {numDraws} Draw{numDraws > 1 ? 's' : ''})</div>
                <div className="text-4xl font-black text-slate-900">
                  ${(tickets.reduce((total, ticket) => {
                    const ticketPrice = ticket.type === 'Powerball' ? pricingData['Powerball'] : pricingData['Mega Millions'];
                    return total + ticketPrice;
                  }, 0) * numDraws).toLocaleString()} USD
                </div>
                {numDraws > 1 && (
                  <div className="text-xs text-brand-navy font-semibold mt-1 flex items-center gap-1 justify-center sm:justify-start">
                    <Calendar size={12} /> Advance Play: {numDraws} draws
                  </div>
                )}
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 justify-center sm:justify-start">
                  * Price: Powerball $5 USD, Mega Millions $11 USD per Ticket
               </div>
               <Link to="/special-products-legal" className="text-xs text-brand-blue hover:underline flex items-center gap-1 mt-2 justify-center sm:justify-start">
                 <Scale size={12} /> อ่านข้อตกลงและเงื่อนไขการใช้บริการ
               </Link>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
               <Button variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={() => setTickets([])}>Clear</Button>
               <Button variant="primary" size="lg" className="flex-1 sm:w-48 shadow-lg" disabled={tickets.length === 0} onClick={handleCheckout}>Checkout</Button>
            </div>
          </div>
        </div>

        {/* Jackpot History Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <button 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors"
          >
            <h3 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-brand-navy" size={24} /> Past Draw Results
            </h3>
            {isHistoryOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
          </button>
          
          {isHistoryOpen && (
            <div className="border-t border-slate-100 divide-y divide-slate-50 animate-in slide-in-from-top-2">
              {PAST_DRAWS.map((draw, idx) => (
                <div key={idx} className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <div className="text-xs text-slate-500 font-bold uppercase">{draw.type}</div>
                    <div className="font-bold text-slate-900">{draw.date}</div>
                    <div className="text-brand-gold font-black">{draw.jackpot}</div>
                  </div>
                  <div className="flex gap-2">
                    {draw.numbers.map((num, i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                        {num}
                      </div>
                    ))}
                    <div className={`h-8 w-8 rounded-full text-white flex items-center justify-center font-bold text-sm ${draw.type === 'Powerball' ? 'bg-red-600' : 'bg-brand-gold text-slate-900'}`}>
                      {draw.special}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Winners History Link */}
        <div className="mt-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-center border border-slate-700">
          <Trophy size={32} className="mx-auto mb-3 text-brand-gold" />
          <h3 className="text-lg font-black text-white mb-1">ดูประวัติผู้ถูกรางวัลทั้งหมด</h3>
          <p className="text-slate-400 text-sm mb-4">ตรวจสอบผลรางวัลย้อนหลังและเรื่องราวของผู้โชคดี</p>
          <Link to="/winners" className="inline-flex items-center gap-2 bg-brand-gold text-slate-900 px-6 py-3 rounded-lg font-bold text-sm hover:bg-yellow-400 transition-colors shadow-lg">
            <Trophy size={16} /> Winners History
          </Link>
        </div>

      </div>
      </div>
    </>
  );
};
