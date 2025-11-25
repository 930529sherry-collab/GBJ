
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { BackIcon } from '../components/icons/ActionIcons';
import { MapPinIcon } from '../components/icons/NavIcons';
import { formatDateTime } from '../constants';

// Define the type for a single check-in record from the history
type CheckInHistoryItem = {
    storeName: string;
    timestamp: string;
};

const CheckInHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<CheckInHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = () => {
            const profileData = localStorage.getItem('userProfile');
            const currentUser: UserProfile | null = profileData ? JSON.parse(profileData) : null;
            
            if (currentUser && currentUser.checkInHistory) {
                // Sort the permanent history, newest first
                const sortedHistory = [...currentUser.checkInHistory].sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                setHistory(sortedHistory);
            }
            setLoading(false);
        };
        fetchHistory();
    }, []);

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">讀取紀錄中...</div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-2 mb-4">
                 <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>
            
            <h2 className="text-2xl font-bold text-brand-light mb-4 px-2">我的打卡紀錄</h2>

            <div className="space-y-4">
                {history.length > 0 ? (
                    history.map((item, index) => (
                        <div key={index} className="bg-brand-secondary p-4 rounded-xl border-2 border-brand-accent/20 shadow-lg shadow-brand-accent/10 flex gap-4 items-start">
                            <div className="bg-brand-primary p-2 rounded-full border border-brand-accent/10 flex-shrink-0 mt-1">
                                <MapPinIcon className="w-6 h-6 text-brand-map-pin" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-bold text-brand-accent text-lg">{item.storeName || '未知地點'}</h3>
                                <p className="text-xs text-brand-muted mt-1">{formatDateTime(item.timestamp)}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-10 flex flex-col items-center justify-center h-full bg-brand-secondary rounded-xl border-2 border-brand-accent/10">
                        <MapPinIcon className="w-16 h-16 text-brand-muted mb-4" />
                        <h2 className="text-xl font-bold text-brand-light mt-4 mb-2">尚未有打卡紀錄</h2>
                        <p className="text-brand-muted mb-6">快去地圖探索酒吧，留下你的足跡吧！</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-brand-accent text-brand-primary font-bold py-2 px-6 rounded-lg hover:bg-opacity-80 transition-colors"
                        >
                            前往地圖
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckInHistoryPage;
