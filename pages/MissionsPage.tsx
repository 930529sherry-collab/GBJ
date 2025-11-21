
import React, { useState, useEffect } from 'react';
import { MOCK_MISSIONS, MOCK_USER_PROFILE, MOCK_STORES } from '../constants';
import { Mission, UserProfile, Notification, FeedItem, JournalEntry, Store } from '../types';
import { XIcon, SparklesIcon } from '../components/icons/ActionIcons';
import { useNavigate } from 'react-router-dom';
import { useGuestGuard } from '../context/GuestGuardContext';
import { updateUserProfile, getUserFeed } from '../utils/api';

const formatReward = (reward: { xp?: number; points?: number }): string => {
    const parts: string[] = [];
    if (reward.xp) {
        parts.push(`+${reward.xp} XP`);
    }
    if (reward.points) {
        parts.push(`+${reward.points} 酒幣`);
    }
    return parts.join(' & ');
};

const getMissionAction = (missionId: number): { path: string; label: string } => {
    switch (missionId) {
        case 2: // Cocktail Connoisseur
        case 6: // Whisky Expert
            return { path: '/journal', label: '去寫筆記' };
        case 3: // Beer Buddy
        case 7: // Social Butterfly
            return { path: '/feed', label: '去揪朋友' };
        case 9: // Reviewer
            return { path: '/list', label: '去寫評論' };
        case 11: // Early Bird
            return { path: '/deals', label: '查看優惠' };
        case 1: // Explorer
        case 4: // First Check-in
        case 5: // Loyal Customer
        case 8: // Friday Fever
        case 10: // Speakeasy Hunter
        case 12: // Ultimate Explorer
        default:
            return { path: '/feed', label: '前往打卡' };
    }
};

const MissionDetailModal: React.FC<{
    mission: Mission | null;
    isOpen: boolean;
    onClose: () => void;
    onClaimReward: (id: number) => void;
}> = ({ mission, isOpen, onClose, onClaimReward }) => {
    const navigate = useNavigate();

    if (!isOpen || !mission) return null;

    const progressPercentage = Math.min((mission.progress / mission.goal) * 100, 100);
    const isComplete = mission.progress >= mission.goal;
    const action = getMissionAction(mission.id);

    const handleActionClick = () => {
        onClose();
        navigate(action.path);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="relative bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10">
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-muted hover:text-brand-light transition-colors" aria-label="Close">
                    <XIcon />
                </button>

                <h2 className="text-2xl font-bold text-brand-accent mb-1">{mission.title}</h2>
                <p className="text-brand-muted mb-4 font-semibold">{formatReward(mission.reward)}</p>
                <p className="text-brand-light leading-relaxed my-6">{mission.description}</p>
                
                <div>
                    <div className="w-full bg-brand-primary rounded-full h-2.5 border border-brand-accent/20">
                        <div
                            className="bg-brand-accent h-2 rounded-full m-px transition-all duration-500"
                            style={{ width: `calc(${progressPercentage}% - 2px)` }}
                        ></div>
                    </div>
                    <p className="text-right text-xs text-brand-muted mt-1">{mission.progress} / {mission.goal}</p>
                </div>

                <div className="mt-8">
                    {isComplete ? (
                        mission.claimed ? (
                            <button disabled className="w-full bg-brand-primary border-2 border-brand-accent/20 text-brand-muted py-3 px-4 rounded-lg cursor-not-allowed">
                                已領取獎勵
                            </button>
                        ) : (
                            <button
                                onClick={() => onClaimReward(mission.id)}
                                className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-transform hover:scale-105"
                            >
                                領取獎勵
                            </button>
                        )
                    ) : (
                        <button 
                            onClick={handleActionClick}
                            className="w-full bg-brand-brown-cta text-brand-text-on-accent font-bold py-3 px-4 rounded-lg hover:bg-brand-brown-cta-hover transition-colors"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const MissionCard: React.FC<{ mission: Mission; onSelect: (mission: Mission) => void; }> = ({ mission, onSelect }) => {
    const progressPercentage = Math.min((mission.progress / mission.goal) * 100, 100);
    const isComplete = mission.progress >= mission.goal;

    return (
        <button
            onClick={() => onSelect(mission)}
            className={`w-full text-left bg-brand-secondary p-5 rounded-xl border-2 ${isComplete ? 'border-brand-accent/80' : 'border-brand-accent/20'} shadow-lg shadow-brand-accent/10 space-y-3 transition-transform hover:scale-[1.02] hover:border-brand-accent`}
        >
            <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                    <h3 className={`text-xl font-bold ${isComplete ? 'text-brand-accent' : 'text-brand-light'}`}>{mission.title}</h3>
                    <p className="text-sm text-brand-muted">{mission.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-brand-accent">{formatReward(mission.reward)}</p>
                    {isComplete && (
                        <div className="mt-1">
                            {mission.claimed ? (
                                <span className="text-sm font-bold px-3 py-1 rounded-full bg-brand-primary border-2 border-brand-accent/20 text-brand-muted">
                                    已領取
                                </span>
                            ) : (
                                <span className="text-sm font-bold px-3 py-1 rounded-full bg-brand-accent text-brand-primary animate-pulse">
                                    可領取
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div>
                <div className="w-full bg-brand-primary rounded-full h-2.5 border border-brand-accent/20">
                    <div
                        className="bg-brand-accent h-2 rounded-full m-px transition-all duration-500"
                        style={{ width: `calc(${progressPercentage}% - 2px)` }}
                    ></div>
                </div>
                <p className="text-right text-xs text-brand-muted mt-1">{mission.progress} / {mission.goal}</p>
            </div>
        </button>
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
                <div className="absolute -top-4 -left-4 w-12 h-12 text-yellow-300">
                    <SparklesIcon />
                </div>
                 <div className="absolute -bottom-5 -right-3 w-16 h-16 text-yellow-300 opacity-80">
                    <SparklesIcon />
                </div>
                
                <h2 className="text-4xl font-black text-brand-accent tracking-wider mb-2">等級提升！</h2>
                <p className="text-brand-light mb-6 text-lg">恭喜你達到了</p>
                <div className="flex items-center justify-center mb-8">
                     <span className="text-7xl font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                        {levelUpData.newLevel}
                    </span>
                    <span className="text-3xl font-bold text-brand-accent ml-2">等</span>
                </div>
               
                <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent/20 mb-8">
                     <h3 className="font-bold text-brand-light mb-3">獲得獎勵</h3>
                     <div className="flex justify-center items-center gap-6 text-brand-light">
                        {levelUpData.rewards.xp > 0 && (
                             <div className="text-center">
                                <p className="text-2xl font-bold text-brand-accent">+{levelUpData.rewards.xp}</p>
                                <p className="text-sm text-brand-muted">經驗值</p>
                            </div>
                        )}
                        {levelUpData.rewards.points > 0 && (
                            <div className="text-center">
                                <p className="text-2xl font-bold text-brand-accent">+{levelUpData.rewards.points}</p>
                                <p className="text-sm text-brand-muted">酒幣</p>
                            </div>
                        )}
                     </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-transform hover:scale-105"
                >
                    太棒了！
                </button>
            </div>
        </div>
    );
};


const MissionsPage: React.FC = () => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
    const [levelUpData, setLevelUpData] = useState<{ newLevel: number; rewards: { xp?: number; points?: number } } | null>(null);
    const [filter, setFilter] = useState<'all' | 'completed'>('all');
    const { checkGuest } = useGuestGuard();

    // Helper to parse flexible date formats
    const parseDate = (timestamp: any): Date => {
        if (timestamp === '剛剛') return new Date();
        const d = new Date(timestamp);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            
            const savedProfile = localStorage.getItem('userProfile');
            const userProfile: UserProfile = savedProfile ? JSON.parse(savedProfile) : MOCK_USER_PROFILE;
            setProfile(userProfile);

            // 1. Load all necessary data sources for "Smart Calculation"
            let feedItems: FeedItem[] = [];
            let journalEntries: JournalEntry[] = [];
            let stores: Store[] = [];

            try {
                // Feed
                feedItems = await getUserFeed(userProfile.id);
                
                // Journal
                const savedJournal = localStorage.getItem('journalEntries');
                journalEntries = savedJournal ? JSON.parse(savedJournal) : [];
                
                // Stores (for reviews and types)
                const savedStores = localStorage.getItem('stores');
                stores = savedStores ? JSON.parse(savedStores) : MOCK_STORES;
            } catch (e) {
                console.error("Error loading mission data sources", e);
            }

            // 2. Aggregate ALL Check-in Records (Posts AND Comments)
            interface CheckInRecord {
                storeName: string;
                timestamp: Date;
            }
            const checkInRecords: CheckInRecord[] = [];

            feedItems.forEach(item => {
                // A. From Post itself
                if (item.type === 'check-in' && item.storeName) {
                    checkInRecords.push({
                        storeName: item.storeName,
                        timestamp: parseDate(item.timestamp)
                    });
                }
                
                // B. From Comments on the post
                if (item.comments && item.comments.length > 0) {
                    item.comments.forEach(c => {
                        // Check if comment is by me (by ID or Name fallback)
                        // Cast authorId as it might be added dynamically in api.ts
                        const commentAuthorId = (c as any).authorId;
                        const isMyComment = String(commentAuthorId) === String(userProfile.id) || c.authorName === userProfile.name;

                        if (isMyComment && c.storeName) {
                            checkInRecords.push({
                                storeName: c.storeName,
                                timestamp: parseDate(c.timestamp)
                            });
                        }
                    });
                }
            });

            
            // 3. Pre-calculate stats based on Aggregated Records
            
            // Count my reviews across all stores
            let myReviewCount = 0;
            stores.forEach(s => {
                if (s.reviews && s.reviews.some(r => r.author === userProfile.name)) {
                    myReviewCount += s.reviews.filter(r => r.author === userProfile.name).length;
                }
            });

            // Group check-ins by date for "Explorer"
            const checkInsByDate: { [date: string]: Set<string> } = {};
            const checkInsByStore: { [store: string]: number } = {};
            const uniqueStores = new Set<string>();
            
            let hasSpeakeasyCheckIn = false;
            let hasFridayCheckIn = false;
            let hasEarlyBirdCheckIn = false;

            checkInRecords.forEach(record => {
                const d = record.timestamp;
                const dateKey = d.toDateString(); // Simple grouping by day
                const storeName = record.storeName;
                
                if (!checkInsByDate[dateKey]) checkInsByDate[dateKey] = new Set();
                
                checkInsByDate[dateKey].add(storeName);
                checkInsByStore[storeName] = (checkInsByStore[storeName] || 0) + 1;
                uniqueStores.add(storeName);

                // Check Store Type
                const storeObj = stores.find(s => s.name === storeName);
                if (storeObj) {
                        if (storeObj.type.toLowerCase().includes('speakeasy')) hasSpeakeasyCheckIn = true;
                }

                // Check Day of Week (5 is Friday)
                if (d.getDay() === 5) hasFridayCheckIn = true;

                // Check Time (17:00 - 19:00)
                const hour = d.getHours();
                if (hour >= 17 && hour < 19) hasEarlyBirdCheckIn = true;
            });

            // Calc max unique stores in one day
            let maxStoresOneDay = 0;
            Object.values(checkInsByDate).forEach(set => {
                if (set.size > maxStoresOneDay) maxStoresOneDay = set.size;
            });

            // Calc max visits to a single store
            const maxVisitsSameStore = Math.max(0, ...Object.values(checkInsByStore));


            // 4. Map & Calculate Missions
            const completedIds = userProfile.completedMissionIds || [];
            const rawMissions = [...MOCK_MISSIONS];

            const calculatedMissions = rawMissions.map(m => {
                let progress = 0;

                switch (m.id) {
                    case 1: // Explorer (3 diff bars in one night)
                        progress = maxStoresOneDay;
                        break;
                    case 2: // Cocktail Connoisseur (5 journal notes)
                    case 6: // Whisky Expert (Assume general notes for now or filter by string)
                        progress = (journalEntries || []).length;
                        break;
                    case 3: // Beer Buddy (Post with Photo)
                        // Check: Posts with an image url (Strictly from posts, comments don't usually have large images)
                        progress = (feedItems || []).filter(item => item.imageUrl).length; 
                        break;
                    case 4: // First Check-in
                        progress = checkInRecords.length > 0 ? 1 : 0;
                        break;
                    case 5: // Loyal Customer (5 times same bar)
                        progress = maxVisitsSameStore;
                        break;
                    case 7: // Social Butterfly (5 friends or 5 posts)
                        progress = (userProfile.friends || []).length;
                        break;
                    case 8: // Friday Fever
                        progress = hasFridayCheckIn ? 1 : 0;
                        break;
                    case 9: // Reviewer
                        progress = myReviewCount;
                        break;
                    case 10: // Speakeasy Hunter
                        progress = hasSpeakeasyCheckIn ? 1 : 0;
                        break;
                    case 11: // Early Bird
                        progress = hasEarlyBirdCheckIn ? 1 : 0;
                        break;
                    case 12: // Ultimate Explorer (10 unique bars)
                        progress = uniqueStores.size;
                        break;
                    default:
                        progress = 0;
                }

                // Cap progress
                if (progress > m.goal) progress = m.goal;

                return {
                    ...m,
                    progress: progress,
                    claimed: completedIds.includes(m.id)
                };
            });

             // Sort: Completed -> Has Points -> Value
            calculatedMissions.sort((a, b) => {
                const hasPointsA = (a.reward.points || 0) > 0 ? 1 : 0;
                const hasPointsB = (b.reward.points || 0) > 0 ? 1 : 0;
                if (hasPointsA !== hasPointsB) return hasPointsA - hasPointsB;
                
                const rewardA = (a.reward.xp || 0) + (a.reward.points || 0);
                const rewardB = (b.reward.xp || 0) + (b.reward.points || 0);
                return rewardA - rewardB;
            });

            setMissions(calculatedMissions);
            setLoading(false);
        };

        loadData();
    }, []);

    const handleSelectMission = (mission: Mission) => {
        setSelectedMission(mission);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMission(null);
    };

    const handleClaimReward = async (id: number) => {
        checkGuest(async () => {
            if (!profile) return;

            const missionToClaim = missions.find(m => m.id === id);
            if (!missionToClaim || missionToClaim.claimed) return;

            const { xp = 0, points = 0 } = missionToClaim.reward;
            const initialLevel = profile.level;
            let levelUpPoints = 0;
            
            const newNotification: Notification = {
                id: `mission-${Date.now()}`,
                type: '任務完成',
                message: `恭喜完成「${missionToClaim.title}」，獲得 ${formatReward(missionToClaim.reward)}！`,
                timestamp: new Date(),
                read: false,
            };
            
            const updatedNotifications = [newNotification, ...(profile.notifications || [])];
            const updatedCompletedMissionIds = [...(profile.completedMissionIds || []), id];

            const updatedProfile: UserProfile = { 
                ...profile, 
                xp: profile.xp + xp,
                points: profile.points + points,
                missionsCompleted: profile.missionsCompleted + 1,
                // updatedNotifications is updated again in the loop below if leveled up
                completedMissionIds: updatedCompletedMissionIds
            };
            
            while (updatedProfile.xp >= updatedProfile.xpToNextLevel) {
                updatedProfile.level += 1;
                updatedProfile.points += 10;
                levelUpPoints += 10;
                updatedProfile.xp -= updatedProfile.xpToNextLevel;
                updatedProfile.xpToNextLevel = Math.floor(updatedProfile.xpToNextLevel * 1.2);

                // Generate Level Up Notification
                const levelUpNotification: Notification = {
                    id: `levelup-${Date.now()}-${updatedProfile.level}`,
                    type: '等級提升',
                    message: `恭喜！你的等級提升到了 ${updatedProfile.level} 等，獲得 10 酒幣獎勵！`,
                    timestamp: new Date(),
                    read: false,
                };
                updatedNotifications.unshift(levelUpNotification);
            }
            
            // Assign the final notification list to profile
            updatedProfile.notifications = updatedNotifications;

            const updatedMissions = missions.map(m => 
                m.id === id ? { ...m, claimed: true } : m
            );

            setProfile(updatedProfile);
            setMissions(updatedMissions);

            // Save locally
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
            
            // Persist to Firestore
            if (profile.id !== 0) {
                 await updateUserProfile(String(profile.id), {
                     xp: updatedProfile.xp,
                     points: updatedProfile.points,
                     level: updatedProfile.level,
                     missionsCompleted: updatedProfile.missionsCompleted,
                     xpToNextLevel: updatedProfile.xpToNextLevel,
                     completedMissionIds: updatedCompletedMissionIds,
                     notifications: updatedNotifications
                 });
            }
            
            handleCloseModal();

            if (updatedProfile.level > initialLevel) {
                setLevelUpData({
                    newLevel: updatedProfile.level,
                    rewards: {
                        xp,
                        points: points + levelUpPoints,
                    },
                });
                setIsLevelUpModalOpen(true);
            }
        });
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">準備今日挑戰...</div>;
    }

    const filteredMissions = missions.filter(m => {
        const isTargetReached = m.progress >= m.goal;

        if (filter === 'all') {
            // 'All' now shows INCOMPLETE tasks (Tasks to do)
            return !isTargetReached;
        }
        if (filter === 'completed') {
            // 'Completed' now shows COMPLETED BUT NOT CLAIMED tasks (Tasks to claim)
            // Once claimed (m.claimed === true), they disappear from this list too.
            return isTargetReached && !m.claimed;
        }
        return false;
    });

    return (
        <>
            <div className="space-y-4">
                <div className="text-center mb-6 px-4">
                    <h2 className="text-sm font-normal text-brand-accent mb-1">歡迎來到任務中心～</h2>
                    <p className="text-brand-muted text-sm">
                        完成任務可獲得經驗值與酒幣，用來提升等級並兌換獨家獎勵！
                    </p>
                </div>

                <div className="flex justify-center gap-3 mb-2">
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                            filter === 'completed'
                                ? 'bg-brand-accent text-brand-primary shadow-brand-accent/20 scale-105'
                                : 'bg-brand-secondary text-brand-muted border border-brand-accent/20 hover:border-brand-accent/50'
                        }`}
                    >
                        完成任務
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                            filter === 'all'
                                ? 'bg-brand-accent text-brand-primary shadow-brand-accent/20 scale-105'
                                : 'bg-brand-secondary text-brand-muted border border-brand-accent/20 hover:border-brand-accent/50'
                        }`}
                    >
                        全部任務
                    </button>
                </div>

                {filteredMissions.length > 0 ? (
                    filteredMissions.map(mission => (
                        <MissionCard 
                            key={mission.id} 
                            mission={mission} 
                            onSelect={handleSelectMission} 
                        />
                    ))
                ) : (
                    <div className="text-center py-12 opacity-50">
                        <p className="text-lg font-bold text-brand-muted mb-2">
                            {filter === 'completed' ? '目前沒有可領取的獎勵' : '暫無進行中的任務'}
                        </p>
                        {filter === 'all' && <p className="text-sm">太厲害了！你已經完成了所有任務。</p>}
                        {filter === 'completed' && <p className="text-sm">快去完成任務來解鎖獎勵吧！</p>}
                    </div>
                )}
            </div>
            <MissionDetailModal
                mission={selectedMission}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onClaimReward={handleClaimReward}
            />
            <LevelUpModal
                isOpen={isLevelUpModalOpen}
                onClose={() => setIsLevelUpModalOpen(false)}
                levelUpData={levelUpData}
            />
        </>
    );
};

export default MissionsPage;
