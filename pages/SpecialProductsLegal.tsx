import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scale, AlertTriangle, FileText, ShieldAlert, BookOpen, Gavel, Copyright, ArrowLeft, CheckCircle2, DollarSign } from 'lucide-react';
import { SEO, SEOPresets } from '../components/SEO';
import { Button } from '../components/ui/Button';

export const SpecialProductsLegal: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO {...SEOPresets.specialProducts} />
      <div className="bg-slate-50 min-h-screen py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Back Button */}
          <Link 
            to="/lotto" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">กลับไปหน้าสินค้าพิเศษ</span>
          </Link>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6">
            <div className="bg-brand-gold p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Scale size={120} className="text-slate-900" />
              </div>
              <div className="relative z-10">
                <AlertTriangle size={64} className="mx-auto mb-4 text-slate-900" />
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">
                  กฎและเงื่อนไขการใช้บริการ
                </h1>
                <p className="text-lg font-bold text-slate-800">
                  บริการรับฝากซื้อ Megamillions และ Powerball
                </p>
                <p className="text-sm text-slate-700 mt-2">Terms & Conditions</p>
              </div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-8 space-y-8">
              
              {/* Age Check */}
              <div className="flex gap-4 items-start pb-6 border-b border-slate-200">
                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0 font-bold text-slate-900 text-lg">18+</div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">ยืนยันอายุ 20 ปีบริบูรณ์</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    ข้าพเจ้ายืนยันว่ามีอายุครบ 20 ปีบริบูรณ์ขึ้นไป และมีสติสัมปชัญญะครบถ้วนในการทำธุรกรรม
                  </p>
                </div>
              </div>

              {/* Service Fee */}
              <div className="flex gap-4 items-start pb-6 border-b border-slate-200">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center shrink-0 text-green-700 font-bold">
                  <DollarSign size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">ค่าบริการ: Powerball $5 / Mega Millions $11</h3>
                  <ul className="text-sm text-slate-500 space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100 mt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" /> 
                      <span>ไม่มีค่าธรรมเนียมแอบแฝง</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" /> 
                      <span>ไม่หักเปอร์เซ็นต์เงินรางวัล</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" /> 
                      <span>สินค้าเป็นกรรมสิทธิ์ของท่าน 100%</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="border-t-2 border-slate-300 pt-6">
                <div className="flex gap-4 items-start mb-6">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0 text-slate-900 font-bold">
                    <Scale size={24} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">กฎและเงื่อนไขการใช้บริการรับฝากซื้อ Megamillions และ Powerball</h2>
                    
                    <div className="space-y-4 text-sm text-slate-700">
                      {/* Rules List */}
                      <ul className="space-y-4 text-base text-slate-700 list-none pl-0">
                        <li className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-brand-gold">
                          <span className="text-brand-gold font-black text-lg shrink-0 mt-0.5">1.</span>
                          <span className="flex-1 leading-relaxed">
                            เว็บไซต์ให้บริการ <strong>รับฝากซื้อ Megamillions และ Powerball แทนลูกค้าเท่านั้น</strong> โดยทำหน้าที่เป็นผู้ให้บริการ ไม่ใช่ผู้ออกสลากหรือเจ้าของ Megamillions และ Powerball
                          </span>
                        </li>
                        
                        <li className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-brand-gold">
                          <span className="text-brand-gold font-black text-lg shrink-0 mt-0.5">2.</span>
                          <span className="flex-1 leading-relaxed">
                            ลูกค้าต้องตรวจสอบรายละเอียด Megamillions และ Powerball ที่ต้องการฝากซื้อ เช่น <strong>เลข งวด และจำนวน</strong> ให้ถูกต้องก่อนทำการยืนยันคำสั่งซื้อ
                          </span>
                        </li>
                        
                        <li className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-brand-gold">
                          <span className="text-brand-gold font-black text-lg shrink-0 mt-0.5">3.</span>
                          <span className="flex-1 leading-relaxed">
                            เมื่อทำการชำระเงินและยืนยันคำสั่งซื้อแล้ว ถือว่าลูกค้าเข้าใจและยอมรับว่า บริการนี้เป็นเพียงการรับฝากซื้อ และ<strong>ไม่สามารถยกเลิกหรือขอคืนเงินได้</strong> เว้นแต่กรณีที่ไม่สามารถดำเนินการฝากซื้อได้
                          </span>
                        </li>
                        
                        <li className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-brand-gold">
                          <span className="text-brand-gold font-black text-lg shrink-0 mt-0.5">4.</span>
                          <span className="flex-1 leading-relaxed">
                            หากลูกค้าถูก Megamillions และ Powerball ทางเว็บไซต์จะทำหน้าที่เป็น <strong>ตัวแทนในการดำเนินการขึ้นเงินรางวัลให้แก่ลูกค้า</strong>
                          </span>
                        </li>
                        
                        <li className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-brand-gold">
                          <span className="text-brand-gold font-black text-lg shrink-0 mt-0.5">5.</span>
                          <span className="flex-1 leading-relaxed">
                            เงินรางวัลที่ลูกค้าจะได้รับเป็น <strong>ยอดเงินสุทธิหลังจากหักภาษี ณ ที่จ่าย</strong> และค่าธรรมเนียมต่าง ๆ ตามที่กฎหมายและหน่วยงานของรัฐกำหนด
                          </span>
                        </li>
                        
                        <li className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-brand-gold">
                          <span className="text-brand-gold font-black text-lg shrink-0 mt-0.5">6.</span>
                          <span className="flex-1 leading-relaxed">
                            ระยะเวลาในการโอนเงินรางวัลให้แก่ลูกค้าขึ้นอยู่กับขั้นตอนและเงื่อนไขของหน่วยงานที่เกี่ยวข้อง
                          </span>
                        </li>
                        
                        <li className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-brand-gold">
                          <span className="text-brand-gold font-black text-lg shrink-0 mt-0.5">7.</span>
                          <span className="flex-1 leading-relaxed">
                            เว็บไซต์ไม่รับผิดชอบต่อความล่าช้าหรือความเสียหายที่เกิดจากหน่วยงานของรัฐหรือสถาบันการเงิน แต่อย่างไรก็ตาม ทางเราจะดำเนินการและประสานงานให้ลูกค้าอย่างดีที่สุด
                          </span>
                        </li>
                        
                        <li className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-brand-gold">
                          <span className="text-brand-gold font-black text-lg shrink-0 mt-0.5">8.</span>
                          <span className="flex-1 leading-relaxed">
                            เว็บไซต์ขอสงวนสิทธิ์ในการปฏิเสธการให้บริการ หากพบว่าการใช้บริการเข้าข่ายผิดกฎหมายหรือขัดต่อเงื่อนไขที่กำหนด
                          </span>
                        </li>
                        
                        <li className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-brand-gold">
                          <span className="text-brand-gold font-black text-lg shrink-0 mt-0.5">9.</span>
                          <span className="flex-1 leading-relaxed">
                            เว็บไซต์ขอสงวนสิทธิ์ในการเปลี่ยนแปลงกฎและเงื่อนไขโดยไม่ต้องแจ้งให้ทราบล่วงหน้า
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>


              {/* Footer Actions */}
              <div className="border-t-2 border-slate-300 pt-6 mt-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/lotto" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft size={18} className="mr-2" />
                      กลับไปหน้าสินค้าพิเศษ
                    </Button>
                  </Link>
                  <Link to="/" className="flex-1">
                    <Button variant="primary" className="w-full">
                      กลับหน้าหลัก
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

