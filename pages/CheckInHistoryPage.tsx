
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeedItem, UserProfile } from '../types';
import { BackIcon } from '../components/icons/ActionIcons';
import { MapPinIcon } from '../components/icons/NavIcons';
import { getUserFeed } from '../utils/api';

const CheckInHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [checkIns, setCheckIns] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const profileData = localStorage.getItem('userProfile');
            const currentUser: UserProfile | null = profileData ? JSON.parse(profileData) : null;
            
            if (currentUser) {
                try {
                    const history = await getUserFeed(currentUser.id);
                    // Filter for check-ins only
                    const myCheckIns = history.filter(item => item.type === 'check-in');
                    setCheckIns(myCheckIns);
                } catch (e) {
                    console.error("Error loading check-in history:", e);
                }
            }
            setLoading(false);
        };
        fetchHistory();
    }, []);

    const formatCheckInDate = (timestamp: string | number) => {
        // Timestamp from API is already formatted string 'YYYY/MM/DD...' or '剛剛'
        // If it's '剛剛', show current date.
        if (timestamp === '剛剛') {
            return new Date().toLocaleString('zh-TW', {
                 year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        return timestamp;
    };

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
                {checkIns.length > 0 ? (
                    checkIns.map(item => (
                        <div key={item.id} className="bg-brand-secondary p-4 rounded-xl border-2 border-brand-accent/20 shadow-lg shadow-brand-accent/10 flex gap-4 items-start">
                            <div className="bg-brand-primary p-2 rounded-full border border-brand-accent/10 flex-shrink-0 mt-1">
                                <MapPinIcon className="w-6 h-6 text-brand-map-pin" />
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-brand-accent text-lg">{item.storeName || '未知地點'}</h3>
                                </div>
                                <p className="text-xs text-brand-muted mb-2">{formatCheckInDate(item.timestamp)}</p>
                                {item.content && (
                                    <p className="text-brand-light bg-brand-primary/50 p-2 rounded-lg border border-brand-accent/10 text-sm">
                                        {item.content}
                                    </p>
                                )}
                                {item.imageUrl && (
                                    <div className="mt-2">
                                        <img src={item.imageUrl} alt="Check-in" className="w-24 h-24 object-cover rounded-lg border border-brand-accent/20" />
                                    </div>
                                )}
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
