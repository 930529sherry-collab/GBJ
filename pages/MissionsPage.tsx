import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mission, UserProfile, FeedItem, JournalEntry, Store, Notification } from '../types';
import { MOCK_MISSIONS } from '../constants';
import { ArrowPathIcon, XIcon } from '../components/icons/ActionIcons';
import { updateUserProfile, getUserFeed, journalApi, getStores, addNotificationToUser } from '../utils/api';
import { auth } from '../firebase/config';

const MissionDetailModal: React.FC<{
    mission: Mission & { progress: number, claimed: boolean } | null;
    isOpen: boolean;
    onClose: () => void;
    onClaim: (missionId: number) => void;
    isClaiming: boolean;
}> = ({ mission, isOpen, onClose, onClaim, isClaiming }) => {
    if (!isOpen || !mission) return null;
    const navigate = useNavigate();

    const isComplete = mission.progress >= mission.goal;
    const progressPercentage = Math.min((mission.progress / mission.goal) * 100, 100);
    
    const getMissionAction = (missionId: number) => {
        switch (missionId) {
            case 1:
            case 2:
            case 4:
            case 5:
            case 6:
            case 8:
            case 11:
            case 12:
                return { label: '前往打卡', path: '/feed' };
            case 3:
            case 7:
                 return { label: '前往動態', path: '/feed' };
            case 9:
                 return { label: '前往店家評論', path: '/list' };
            case 10:
                 return { label: '查看動態', path: '/feed' };
            default:
                return null;
        }
    };
    
    const action = getMissionAction(mission.id);

    const handleActionClick = () => {
        if (action) {
            onClose();
            navigate(action.path);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="relative bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10">
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-muted hover:text-brand-light transition-colors"><XIcon /></button>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-brand-accent">{mission.title}</h2>
                    <p className="text-brand-muted mt-2 mb-4">{mission.description}</p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                        <span className="text-brand-light">進度</span>
                        <span className="text-brand-muted">{mission.progress} / {mission.goal}</span>
                    </div>
                    <div className="w-full bg-brand-primary h-4 rounded-full border-2 border-brand-accent/20">
                        <div className="bg-brand-accent h-full rounded-sm" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-lg font-bold text-brand-light">獎勵</p>
                    <p className="text-brand-accent font-bold">{mission.reward.xp} XP {mission.reward.points ? `+ ${mission.reward.points} 酒幣` : ''}</p>
                </div>

                <div className="mt-6">
                    {isComplete && !mission.claimed ? (
                        <button onClick={() => onClaim(mission.id)} disabled={isClaiming} className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted">
                            {isClaiming ? '領取中...' : '領取獎勵'}
                        </button>
                    ) : mission.claimed ? (
                        <p className="text-center text-green-500 font-bold py-3">已領取</p>
                    ) : (
                        action && (
                            <button onClick={handleActionClick} className="w-full bg-brand-brown-cta text-brand-text-on-accent font-bold py-3 px-4 rounded-lg hover:bg-brand-brown-cta-hover transition-colors">
                                {action.label}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

const LevelUpModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    levelUpData: { newLevel: number; rewards: { xp?: number; points?: number } } | null;
}> = ({ isOpen, onClose, levelUpData }) => {
    if (!isOpen || !levelUpData) return null;
    return (
        <div className="fixed inset-0 z-[60] flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="relative bg-brand-secondary rounded-2xl p-8 w-full max-w-sm border-2 border-yellow-400 shadow-2xl shadow-yellow-400/20 text-center">
                 <h2 className="text-4xl font-black text-brand-accent tracking-wider mb-2">等級提升！</h2>
                 <p className="text-brand-light mb-6 text-lg">恭喜你達到了</p>
                 <div className="flex items-center justify-center mb-8">
                      <span className="text-7xl font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                         {levelUpData.newLevel}
                     </span>
                     <span className="text-3xl font-bold text-brand-accent ml-2">等</span>
                 </div>
                 <button onClick={onClose} className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-transform hover:scale-105">
                     太棒了！
                 </button>
            </div>
        </div>
    );
};


const MissionsPage: React.FC = () => {
    const [missions, setMissions] = useState<(Mission & { progress: number, claimed: boolean })[]>([]);
    const [filter, setFilter] = useState<'all' | 'completed'>('all');
    const [loading, setLoading] = useState(true);
    const [selectedMission, setSelectedMission] = useState<Mission & { progress: number, claimed: boolean } | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);
    const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
    const [levelUpData, setLevelUpData] = useState<{ newLevel: number; rewards: { xp?: number; points?: number } } | null>(null);
    
    useEffect(() => {
        const calculateMissionProgress = async () => {
            setLoading(true);
            try {
                const profileStr = localStorage.getItem('userProfile');
                if (!profileStr) return;
                
                const userProfile: UserProfile = JSON.parse(profileStr);
                const uid = String(userProfile.id);

                if (uid === '0') {
                    const missionsWithProgress = MOCK_MISSIONS.map(m => ({...m, progress: 0, claimed: false}));
                    setMissions(missionsWithProgress);
                    return;
                }

                // This calculation is now handled by the central `updateAllMissionProgress`
                // Here we just merge the latest progress from profile
                const missionsWithProgress = MOCK_MISSIONS.map(mission => {
                    const progress = userProfile.missionProgress?.[mission.id] || 0;
                    return {
                        ...mission,
                        progress: Math.min(progress, mission.goal),
                        claimed: (userProfile.completedMissionIds || []).includes(mission.id),
                    };
                });
                setMissions(missionsWithProgress);

            } catch (error) {
                console.error("Failed to calculate mission progress:", error);
            } finally {
                setLoading(false);
            }
        };

        calculateMissionProgress();
    }, []);

    const handleClaimReward = async (missionId: number) => {
         if (isClaiming) return;
         setIsClaiming(true);

         const profileStr = localStorage.getItem('userProfile');
         if (!profileStr) { setIsClaiming(false); return; }
         
         const userProfile: UserProfile = JSON.parse(profileStr);
         const missionToClaim = missions.find(m => m.id === missionId);

         if (!missionToClaim) { setIsClaiming(false); return; }

         const initialLevel = userProfile.level;
         const { xp: newXp, points: newPoints } = missionToClaim.reward;
         
         let updatedProfile: UserProfile = {
             ...userProfile,
             xp: userProfile.xp + newXp,
             points: (userProfile.points || 0) + (newPoints || 0),
             completedMissionIds: [...(userProfile.completedMissionIds || []), missionId]
         };

         while (updatedProfile.xp >= updatedProfile.xpToNextLevel) {
            updatedProfile.level += 1;
            updatedProfile.xp -= updatedProfile.xpToNextLevel;
            updatedProfile.xpToNextLevel = Math.floor(updatedProfile.xpToNextLevel * 1.2);
            updatedProfile.points += 10; // Level up bonus
         }

         try {
             await updateUserProfile(String(userProfile.id), {
                 xp: updatedProfile.xp,
                 points: updatedProfile.points,
                 level: updatedProfile.level,
                 xpToNextLevel: updatedProfile.xpToNextLevel,
                 completedMissionIds: updatedProfile.completedMissionIds
             });
             localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
             
             setMissions(prev => prev.map(m => m.id === missionId ? { ...m, claimed: true } : m));
             
             if(updatedProfile.level > initialLevel) {
                 setLevelUpData({ newLevel: updatedProfile.level, rewards: {} });
                 setIsLevelUpModalOpen(true);
                 await addNotificationToUser(String(userProfile.id), `恭喜！你的等級提升到了 ${updatedProfile.level} 等，獲得 10 酒幣獎勵！`, '等級提升');
             }

             await addNotificationToUser(String(userProfile.id), `任務完成：「${missionToClaim.title}」！`, '任務通知');

             setSelectedMission(null);

         } catch (error) {
             console.error("Failed to claim reward:", error);
             alert("領取獎勵失敗，請稍後再試。");
         } finally {
             setIsClaiming(false);
         }
    };


    const filteredMissions = missions.filter(mission => {
        const isComplete = mission.progress >= mission.goal;
        if (filter === 'all') {
            return !isComplete && !mission.claimed;
        }
        if (filter === 'completed') {
            return isComplete && !mission.claimed;
        }
        return false;
    });

    const sortedMissions = [...filteredMissions].sort((a, b) => {
        const aVal = (a.reward.points || 0) + a.reward.xp;
        const bVal = (b.reward.points || 0) + b.reward.xp;
        if ((a.reward.points || 0) > 0 && !((b.reward.points || 0) > 0)) return 1;
        if (!((a.reward.points || 0) > 0) && (b.reward.points || 0) > 0) return -1;
        return aVal - bVal;
    });
    
    if (loading) return <div className="text-center p-10 text-brand-accent">讀取任務中...</div>;

    return (
        <>
            <div className="animate-fade-in space-y-6">
                <div className="text-center">
                    <h2 className="text-sm font-bold text-brand-accent">歡迎來到任務中心～</h2>
                    <p className="text-sm text-brand-muted">完成任務可獲得經驗值與酒幣，用來提升等級並兌換獨家獎勵！</p>
                </div>
                <div className="flex justify-center gap-2">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold transition-transform duration-200 ${filter === 'all' ? 'bg-brand-accent text-brand-primary scale-105 shadow-lg' : 'bg-brand-secondary text-brand-muted hover:bg-brand-primary'}`}>全部任務</button>
                    <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg font-semibold transition-transform duration-200 ${filter === 'completed' ? 'bg-brand-accent text-brand-primary scale-105 shadow-lg' : 'bg-brand-secondary text-brand-muted hover:bg-brand-primary'}`}>完成任務</button>
                </div>

                <div className="space-y-4">
                    {sortedMissions.map(mission => (
                        <div key={mission.id} onClick={() => setSelectedMission(mission)} className="bg-brand-secondary p-4 rounded-lg flex items-center gap-4 cursor-pointer border-2 border-brand-accent/30 hover:border-brand-accent hover:shadow-lg hover:shadow-brand-accent/20">
                             <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-brand-light">{mission.title}</h3>
                                    <span className="text-xs font-bold text-brand-accent bg-brand-accent/10 px-2 py-1 rounded-full whitespace-nowrap">
                                        {mission.reward.xp} XP {mission.reward.points ? `+ ${mission.reward.points} 酒幣` : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-brand-muted mt-1 line-clamp-1">{mission.description}</p>
                                 <div className="w-full bg-brand-primary rounded-full h-2 my-2 border border-brand-accent/20 mt-3">
                                     <div className="bg-brand-accent h-1.5 rounded-full" style={{ width: `${Math.min((mission.progress / mission.goal) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <MissionDetailModal mission={selectedMission} isOpen={!!selectedMission} onClose={() => setSelectedMission(null)} onClaim={handleClaimReward} isClaiming={isClaiming} />
            <LevelUpModal isOpen={isLevelUpModalOpen} onClose={() => setIsLevelUpModalOpen(false)} levelUpData={levelUpData} />
        </>
    );
};

export default MissionsPage;