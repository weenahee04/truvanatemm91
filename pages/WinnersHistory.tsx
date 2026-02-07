import React, { useState } from 'react';
import { Trophy, Calendar, MapPin, DollarSign, ChevronDown, ChevronUp, ArrowLeft, Star, Sparkles, TrendingUp, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useDrawResults, useNotableWinners, type DrawResult, type NotableWinner } from '../services/winnersService';
import { useJackpots } from '../services/jackpotService';
import { PowerballLogo, MegaMillionsLogo } from '../components/ui/LotteryLogos';

type GameFilter = 'all' | 'Powerball' | 'Mega Millions';
type TabType = 'winners' | 'draws';

export const WinnersHistory: React.FC = () => {
  const navigate = useNavigate();
  const { data: draws, loading: drawsLoading } = useDrawResults();
  const { data: winners } = useNotableWinners();
  const { data: jackpotData } = useJackpots();
  const [activeTab, setActiveTab] = useState<TabType>('winners');
  const [gameFilter, setGameFilter] = useState<GameFilter>('all');
  const [expandedWinner, setExpandedWinner] = useState<number | null>(null);
  const [showCount, setShowCount] = useState(10);

  const filteredWinners = gameFilter === 'all' 
    ? winners 
    : winners.filter(w => w.game === gameFilter);

  const filteredDraws = gameFilter === 'all'
    ? draws
    : draws.filter(d => d.game === gameFilter);

  const displayedDraws = filteredDraws.slice(0, showCount);

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-8 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-[200px] font-black">$</div>
          <div className="absolute bottom-10 right-10 text-[150px] font-black">$</div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> กลับ
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 bg-brand-gold rounded-xl flex items-center justify-center shadow-lg">
              <Trophy size={24} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Winners History</h1>
              <p className="text-slate-400 text-sm">ประวัติผู้ถูกรางวัล Powerball & Mega Millions</p>
            </div>
          </div>

          {/* Current Jackpots */}
          {jackpotData && (
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <div className="flex-1 bg-white/10 backdrop-blur rounded-xl px-5 py-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6"><PowerballLogo className="w-full h-full" /></div>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Powerball - Current</span>
                </div>
                <div className="text-2xl font-black text-white">{jackpotData.powerball.jackpot}</div>
                <div className="text-xs text-slate-400">{jackpotData.powerball.nextDraw}</div>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur rounded-xl px-5 py-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6"><MegaMillionsLogo className="w-full h-full" /></div>
                  <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Mega Millions - Current</span>
                </div>
                <div className="text-2xl font-black text-white">{jackpotData.megaMillions.jackpot}</div>
                <div className="text-xs text-slate-400">{jackpotData.megaMillions.nextDraw}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
        {/* Tab Switcher */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-1.5 flex gap-1 mb-6">
          <button
            onClick={() => setActiveTab('winners')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'winners'
                ? 'bg-brand-gold text-slate-900 shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Star size={16} /> ผู้ถูกรางวัลใหญ่
          </button>
          <button
            onClick={() => setActiveTab('draws')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'draws'
                ? 'bg-brand-gold text-slate-900 shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Calendar size={16} /> ผลการออกรางวัล
          </button>
        </div>

        {/* Game Filter */}
        <div className="flex items-center gap-2 mb-6">
          <Filter size={14} className="text-slate-400" />
          <div className="flex gap-2">
            {(['all', 'Powerball', 'Mega Millions'] as GameFilter[]).map(filter => (
              <button
                key={filter}
                onClick={() => setGameFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  gameFilter === filter
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {filter === 'all' ? 'ทั้งหมด' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Notable Winners Tab */}
        {activeTab === 'winners' && (
          <div className="space-y-4">
            {/* Stats Banner */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                <div className="text-2xl font-black text-brand-gold">{filteredWinners.length}</div>
                <div className="text-xs text-slate-500 font-medium">รางวัลใหญ่</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                <div className="text-2xl font-black text-green-600">$2.04B</div>
                <div className="text-xs text-slate-500 font-medium">รางวัลสูงสุด</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                <div className="text-2xl font-black text-blue-600">12+</div>
                <div className="text-xs text-slate-500 font-medium">รัฐที่ถูกรางวัล</div>
              </div>
            </div>

            {filteredWinners.map((winner, idx) => (
              <WinnerCard 
                key={idx} 
                winner={winner} 
                rank={idx + 1}
                isExpanded={expandedWinner === idx}
                onToggle={() => setExpandedWinner(expandedWinner === idx ? null : idx)}
              />
            ))}

            {filteredWinners.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Trophy size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">ไม่พบข้อมูลผู้ถูกรางวัล</p>
              </div>
            )}
          </div>
        )}

        {/* Draw Results Tab */}
        {activeTab === 'draws' && (
          <div className="space-y-3">
            {drawsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-brand-gold border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-slate-500 font-medium">กำลังโหลดผลการออกรางวัล...</p>
              </div>
            ) : displayedDraws.length > 0 ? (
              <>
                {displayedDraws.map((draw, idx) => (
                  <DrawResultCard key={`${draw.game}-${draw.date}-${idx}`} draw={draw} />
                ))}
                
                {filteredDraws.length > showCount && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCount(prev => prev + 20)}
                      className="gap-2"
                    >
                      <ChevronDown size={16} /> แสดงเพิ่มเติม ({filteredDraws.length - showCount} รายการ)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">ไม่พบข้อมูลผลการออกรางวัล</p>
                <p className="text-sm mt-1">ข้อมูลจะถูกดึงจาก API สาธารณะ</p>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 bg-brand-gold rounded-xl p-6 text-center border-2 border-black">
          <Sparkles size={32} className="mx-auto mb-3 text-slate-900" />
          <h3 className="text-xl font-black text-slate-900 mb-2">คุณอาจเป็นคนถัดไป!</h3>
          <p className="text-slate-800 text-sm mb-4">เลือกเลขของคุณวันนี้ แล้วลุ้นรางวัลใหญ่</p>
          <Button 
            onClick={() => navigate('/lotto')} 
            variant="secondary" 
            className="shadow-lg gap-2"
          >
            <TrendingUp size={16} /> เลือกเลขเลย
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Sub-components ─── */

const WinnerCard: React.FC<{
  winner: NotableWinner;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ winner, rank, isExpanded, onToggle }) => {
  const isPowerball = winner.game === 'Powerball';
  const bgColor = isPowerball ? 'border-l-red-500' : 'border-l-yellow-500';
  const badgeColor = isPowerball ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800';
  
  const getRankBadge = () => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden border-l-4 ${bgColor} transition-all`}>
      <button onClick={onToggle} className="w-full text-left p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="text-2xl flex-shrink-0">{getRankBadge()}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                  {winner.game}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(winner.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="text-xl md:text-2xl font-black text-slate-900 mb-1">{winner.jackpotAmount}</div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} /> {winner.winnerLocation}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-slate-400 mt-2">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-slate-100 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Winning Numbers */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">เลขที่ถูกรางวัล</div>
            <div className="flex items-center gap-2 flex-wrap">
              {winner.numbers.map((num, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {num}
                </div>
              ))}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                isPowerball ? 'bg-red-600 text-white' : 'bg-brand-gold text-slate-900'
              }`}>
                {winner.specialBall}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase">การรับเงิน</div>
              <div className="text-sm font-bold text-slate-900">{winner.claimType}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase">มูลค่ารางวัล</div>
              <div className="text-sm font-bold text-green-600">{winner.jackpotAmount}</div>
            </div>
          </div>

          {/* Story */}
          {winner.story && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="text-[10px] font-bold text-blue-500 uppercase mb-1">เรื่องราว</div>
              <p className="text-sm text-blue-900 leading-relaxed">{winner.story}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DrawResultCard: React.FC<{ draw: DrawResult }> = ({ draw }) => {
  const isPowerball = draw.game === 'Powerball';

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4 flex items-center gap-4">
      {/* Game Badge */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isPowerball ? 'bg-red-100' : 'bg-yellow-100'
      }`}>
        <div className="w-6 h-6">
          {isPowerball ? <PowerballLogo className="w-full h-full" /> : <MegaMillionsLogo className="w-full h-full" />}
        </div>
      </div>

      {/* Date & Game */}
      <div className="min-w-0 flex-shrink-0 w-28">
        <div className="text-xs font-bold text-slate-900">{draw.dateFormatted}</div>
        <div className={`text-[10px] font-bold ${isPowerball ? 'text-red-500' : 'text-yellow-600'}`}>
          {draw.game}
        </div>
      </div>

      {/* Numbers */}
      <div className="flex items-center gap-1.5 flex-wrap flex-1">
        {draw.numbers.map((num, i) => (
          <div key={i} className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-xs border border-slate-200">
            {num}
          </div>
        ))}
        {draw.specialBall > 0 && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
            isPowerball ? 'bg-red-600 text-white' : 'bg-brand-gold text-slate-900'
          }`}>
            {draw.specialBall}
          </div>
        )}
        {draw.multiplier && (
          <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-[10px] font-bold ml-1">
            x{draw.multiplier}
          </div>
        )}
      </div>
    </div>
  );
};

export default WinnersHistory;
