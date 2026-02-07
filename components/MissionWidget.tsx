import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, Gift, CheckCircle2 } from 'lucide-react';
import { getMissionsWithProgress, MissionWithProgress } from '../services/missionService';

const MissionWidget: React.FC = () => {
  const { t, i18n } = useTranslation('missions');
  const { user } = useGlobal();
  const lang = (i18n.language || 'th') as 'th' | 'en' | 'zh';

  const [missions, setMissions] = useState<MissionWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadMissions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadMissions = async () => {
    if (!user?.id) return;
    try {
      const data = await getMissionsWithProgress(user.id);
      // Show max 3 unclaimed missions
      const unclaimed = data.filter(m => !m.userClaimed).slice(0, 3);
      setMissions(unclaimed);
    } catch (error) {
      console.error('Error loading missions widget:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not logged in or no missions
  if (!user?.id || loading || missions.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
          <Trophy size={18} className="text-amber-500" />
          {t('todaysMissions')}
        </h3>
        <Link
          to="/missions"
          className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5"
        >
          {t('allMissions')} <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-2">
        {missions.map(mission => {
          const percent = Math.min(100, (mission.userProgress / mission.condition.threshold) * 100);
          const isCompleted = mission.userCompleted;

          return (
            <Link
              key={mission.id}
              to="/missions"
              className="flex items-center gap-3 bg-white/80 rounded-xl p-3 hover:bg-white transition-colors"
            >
              <span className="text-2xl flex-shrink-0">{mission.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">
                  {mission.title[lang] || mission.title.th}
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCompleted ? 'bg-green-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
                    <Gift size={12} /> {t('claimReward')}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {Math.round(percent)}%
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MissionWidget;
