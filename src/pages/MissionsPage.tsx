
import React, { useState, useEffect } from 'react';
import { UserProfile, Mission, Notification } from '../types';
import { userApi, updateUserProfile, addNotificationToUser } from '../utils/api';
import { auth, db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { CheckCircleIcon, StarIcon, CalendarIcon, ListBulletIcon } from '../components/icons/NavIcons';
import { SparklesIcon, XIcon } from '../components/icons/ActionIcons';

type TabType = 'all' | 'daily' | 'special' | 'completed';

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
    const [user, setUser] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [loading, setLoading] = useState(true);
    const [isClaiming, setIsClaiming] = useState<string | null>(null);

    // Level Up Modal State
    const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
    const [levelUpData, setLevelUpData] = useState<{ newLevel: number; rewards: { xp?: number; points?: number } } | null>(null);

    useEffect(() => {
        let unsubscribe = () => {};
        
        const fetchUserAndCheckReset = async () => {
            if (auth.currentUser) {
                try {
                    // V9 Syntax: onSnapshot(doc(db, 'users', uid), callback)
                    const userRef = doc(db, 'users', auth.currentUser.uid);
                    unsubscribe = onSnapshot(userRef, (docSnap) => { 
                        if (docSnap.exists()) {
                            setUser(docSnap.data() as UserProfile);
                        }
                        setLoading(false);
                    });
                } catch (error) {
                    console.error("Error setting up missions listener:", error);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchUserAndCheckReset();
        return () => unsubscribe();
    }, []);

    const handleClaimReward = async (missionId: string) => {
        if (!user || isClaiming) return;
        setIsClaiming(missionId);

        const missionToClaim = (user.missions || []).find(m => m.id === missionId);
        if (!missionToClaim || missionToClaim.status !== 'completed' || missionToClaim.claimed) {
            setIsClaiming(null);
            return;
        }

        const initialLevel = user.level;
        const { xpReward = 0, pointsReward = 0 } = missionToClaim;
        
        const updatedUser: UserProfile = { ...user, xp: user.xp + xpReward, points: (user.points || 0) + pointsReward };

        // Handle level up
        while (updatedUser.xp >= updatedUser.xpToNextLevel) {
            updatedUser.level += 1;
            updatedUser.xp -= updatedUser.xpToNextLevel;
            updatedUser.xpToNextLevel = Math.floor(updatedUser.xpToNextLevel * 1.2);
        }

        const updatedMissions = updatedUser.missions.map(m => {
            if (m.id === missionId) {
                // All missions are now permanently claimed, no more daily resets.
                return { ...m, claimed: true };
            }
            return m;
        });

        updatedUser.missions = updatedMissions;

        try {
            await updateUserProfile(String(user.id), updatedUser);
            
            // Send notifications
            addNotificationToUser(String(user.id), `任務完成：「${missionToClaim.title}」！`, '任務通知');
            if(updatedUser.level > initialLevel) {
                 addNotificationToUser(String(user.id), `恭喜！你的等級提升到了 ${updatedUser.level} 等！`, '等級提升');
                 setLevelUpData({ newLevel: updatedUser.level, rewards: {} });
                 setIsLevelUpModalOpen(true);
            }
        } catch (error) {
            console.error("Failed to claim reward:", error);
            alert("領取獎勵失敗，請稍後再試。");
        } finally {
            setIsClaiming(null);
        }
    };

    const getFilteredMissions = () => {
        if (!user?.missions) return [];
        const missions = user.missions || [];

        return missions.filter((mission: Mission) => {
            if (mission.claimed) return false; // Hide permanently claimed missions
            
            if (activeTab === 'completed') {
                return mission.status === 'completed';
            }
            if (activeTab === 'daily') {
                return mission.type === 'daily' && mission.status === 'ongoing';
            }
            if (activeTab === 'special') {
                return mission.type === 'special' && mission.status === 'ongoing';
            }
            if (activeTab === 'all') {
                return mission.status === 'ongoing';
            }
            return false;
        });
    };

    const filteredMissions = getFilteredMissions();

    const TabButton = ({ id, label, icon }: { id: TabType, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === id
                    ? 'border-brand-accent text-brand-accent bg-brand-accent/5'
                    : 'border-transparent text-brand-muted hover:text-brand-light'
            }`}
        >
            <div className="mb-1">{icon}</div>
            {label}
        </button>
    );

    if (loading) return <div className="p-10 text-center text-brand-accent">載入任務中...</div>;

    return (
        <>
            <div className="animate-fade-in pb-24">
                <h1 className="text-2xl font-bold text-brand-light px-6 pt-6 mb-4">任務中心</h1>

                <div className="flex bg-brand-secondary border-b border-brand-accent/10 sticky top-0 z-10">
                    <TabButton id="all" label="全部" icon={<ListBulletIcon className="w-5 h-5"/>} />
                    <TabButton id="daily" label="每日" icon={<CalendarIcon className="w-5 h-5"/>} />
                    <TabButton id="special" label="特殊" icon={<StarIcon className="w-5 h-5"/>} />
                    <TabButton id="completed" label="待領取" icon={<CheckCircleIcon className="w-5 h-5"/>} />
                </div>

                <div className="p-4 space-y-4">
                    {filteredMissions.length > 0 ? (
                        filteredMissions.map((mission) => {
                            const isCompleted = mission.status === 'completed';
                            return (
                                <div key={mission.id} className="bg-brand-secondary p-4 rounded-xl border border-brand-accent/20 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mission.type === 'daily' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                        {mission.type === 'daily' ? <CalendarIcon className="w-6 h-6" /> : <StarIcon className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-brand-light">{mission.title}</h3>
                                            <span className="text-xs font-bold text-brand-accent bg-brand-accent/10 px-2 py-1 rounded-full">
                                                +{mission.xpReward} XP {mission.pointsReward ? `& ${mission.pointsReward} 酒幣` : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-brand-muted mt-1">{mission.description}</p>
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-brand-muted mb-1">
                                                <span>進度</span>
                                                <span>{mission.current} / {mission.target}</span>
                                            </div>
                                            <div className="w-full bg-brand-primary h-2 rounded-full overflow-hidden border border-brand-accent/10">
                                                <div 
                                                    className="bg-brand-accent h-full transition-all duration-500"
                                                    style={{ width: `${Math.min((mission.current / mission.target) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        {isCompleted && (
                                             <div className="mt-3">
                                                 <button
                                                     onClick={() => handleClaimReward(mission.id)}
                                                     disabled={isClaiming === mission.id}
                                                     className="w-full bg-brand-accent text-brand-primary font-bold py-2 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted"
                                                 >
                                                     {isClaiming === mission.id ? "領取中..." : "領取獎勵"}
                                                 </button>
                                             </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 text-brand-muted">
                            {activeTab === 'completed' ? '目前沒有可領取的獎勵。' : '目前沒有此類型的任務。'}
                        </div>
                    )}
                </div>
            </div>
            <LevelUpModal
                isOpen={isLevelUpModalOpen}
                onClose={() => setIsLevelUpModalOpen(false)}
                levelUpData={levelUpData}
            />
        </>
    );
};

export default MissionsPage;
