

import React, { useState, useEffect } from 'react';
import { MOCK_MISSIONS, MOCK_USER_PROFILE } from '../constants';
import { Mission, UserProfile } from '../types';
import { XIcon, SparklesIcon } from '../components/icons/ActionIcons';

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

const MissionDetailModal: React.FC<{
    mission: Mission | null;
    isOpen: boolean;
    onClose: () => void;
    onClaimReward: (id: number) => void;
}> = ({ mission, isOpen, onClose, onClaimReward }) => {
    if (!isOpen || !mission) return null;

    const progressPercentage = (mission.progress / mission.goal) * 100;
    const isComplete = mission.progress >= mission.goal;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in">
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
                        <button disabled className="w-full bg-brand-muted/50 text-brand-light py-3 px-4 rounded-lg cursor-not-allowed">
                            任務進行中
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const MissionCard: React.FC<{ mission: Mission; onSelect: (mission: Mission) => void; }> = ({ mission, onSelect }) => {
    const progressPercentage = (mission.progress / mission.goal) * 100;
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
        <div className="fixed inset-0 bg-black/80 z-[60] flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in">
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

    useEffect(() => {
        setTimeout(() => {
            const savedMissions = localStorage.getItem('missions');
            setMissions(savedMissions ? JSON.parse(savedMissions) : MOCK_MISSIONS);
            
            const savedProfile = localStorage.getItem('userProfile');
            setProfile(savedProfile ? JSON.parse(savedProfile) : MOCK_USER_PROFILE);
            
            setLoading(false);
        }, 500);
    }, []);

    const handleSelectMission = (mission: Mission) => {
        setSelectedMission(mission);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMission(null);
    };

    const handleClaimReward = (id: number) => {
        const missionToClaim = missions.find(m => m.id === id);
        if (!missionToClaim || missionToClaim.claimed || !profile) return;

        const { xp = 0, points = 0 } = missionToClaim.reward;
        const initialLevel = profile.level;
        let levelUpPoints = 0;

        const updatedProfile: UserProfile = { 
            ...profile, 
            xp: profile.xp + xp,
            points: profile.points + points,
            missionsCompleted: profile.missionsCompleted + 1,
        };
        
        while (updatedProfile.xp >= updatedProfile.xpToNextLevel) {
            updatedProfile.level += 1;
            updatedProfile.points += 10;
            levelUpPoints += 10;
            updatedProfile.xp -= updatedProfile.xpToNextLevel;
            updatedProfile.xpToNextLevel = Math.floor(updatedProfile.xpToNextLevel * 1.2); 
        }

        const updatedMissions = missions.map(m => 
            m.id === id ? { ...m, claimed: true } : m
        );

        setProfile(updatedProfile);
        setMissions(updatedMissions);

        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        localStorage.setItem('missions', JSON.stringify(updatedMissions));
        
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
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">準備今日挑戰...</div>;
    }

    return (
        <>
            <div className="space-y-4">
                <p className="text-center text-brand-muted mb-6 px-4">
                    完成任務可獲得經驗值與酒幣，用來提升等級並兌換獨家獎勵。
                </p>
                {missions.map(mission => (
                    <MissionCard 
                        key={mission.id} 
                        mission={mission} 
                        onSelect={handleSelectMission}
                    />
                ))}
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