

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MOCK_USER_PROFILE } from '../constants';
import { UserProfile } from '../types';
import { CoinIcon } from '../components/icons/ActionIcons';

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState('');
    const location = useLocation();

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                setProfile(JSON.parse(savedProfile));
            } else {
                setProfile(MOCK_USER_PROFILE);
            }
            setLoading(false);
        }, 500);
    }, [location]);
    
    const handleCopyFriendCode = () => {
        if (!profile || !profile.friendCode) return;
        navigator.clipboard.writeText(profile.friendCode).then(() => {
            setCopySuccess('已複製！');
            setTimeout(() => setCopySuccess(''), 2000); // Reset after 2 seconds
        }, (err) => {
            setCopySuccess('複製失敗');
            console.error('Could not copy text: ', err);
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    if (loading || !profile) {
        return <div className="text-center p-10 text-brand-accent">讀取個人檔案...</div>;
    }
    
    const xpPercentage = (profile.xp / profile.xpToNextLevel) * 100;

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center space-y-2 p-6 bg-brand-secondary rounded-2xl border-2 border-brand-accent/20">
                <img src={profile.avatarUrl} alt={profile.name} className="w-28 h-28 rounded-full object-cover border-4 border-brand-accent shadow-lg shadow-brand-accent/30 mb-2" />
                <h2 className="text-3xl font-bold text-brand-light">{profile.name}</h2>

                <div className="flex items-center gap-2 bg-brand-primary px-3 py-1 rounded-full border border-brand-accent/30">
                    <CoinIcon className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-brand-accent text-lg">{profile.points}</span>
                    <span className="text-sm text-brand-muted">酒幣</span>
                </div>

                <div className="text-center text-sm text-brand-muted mb-2 pt-2">
                    {profile.email && <p>{profile.email}</p>}
                    {profile.phone && <p>{profile.phone}</p>}
                </div>

                {profile.friendCode && (
                    <div className="w-full text-center pt-4">
                        <p className="text-sm text-brand-muted mb-2">你的好友ID</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="bg-brand-primary border border-brand-accent/30 text-brand-accent font-mono text-lg px-4 py-2 rounded-lg">
                                {profile.friendCode}
                            </span>
                            <button
                                onClick={handleCopyFriendCode}
                                className="bg-brand-button-bg text-brand-light font-semibold py-2 px-4 rounded-lg hover:bg-brand-button-bg-hover transition-colors w-24"
                            >
                                {copySuccess || '複製'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="w-full text-center pt-4">
                    <p className="text-brand-accent font-semibold">等級 {profile.level}</p>
                    <div className="w-full bg-brand-primary rounded-full h-2.5 my-2 border border-brand-accent/20">
                         <div className="bg-brand-accent h-2 rounded-full m-px" style={{ width: `calc(${xpPercentage}% - 2px)` }}></div>
                    </div>
                    <p className="text-xs text-brand-muted">{profile.xp} / {profile.xpToNextLevel} 經驗值</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/20">
                    <p className="text-2xl font-bold text-brand-accent">{profile.missionsCompleted}</p>
                    <p className="text-sm text-brand-muted">完成任務</p>
                </div>
                <Link to="/friends-list" className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/20 hover:border-brand-accent/50 transition-colors">
                    <p className="text-2xl font-bold text-brand-accent">{profile.friends.length}</p>
                    <p className="text-sm text-brand-muted">位好友</p>
                </Link>
                <div className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/20">
                    <p className="text-2xl font-bold text-brand-accent">{profile.checkIns}</p>
                    <p className="text-sm text-brand-muted">打卡次數</p>
                </div>
            </div>

            <div className="bg-brand-secondary rounded-lg overflow-hidden border-2 border-brand-accent/20">
                <Link to="/profile/edit" className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    編輯個人檔案
                </Link>
                <div className="h-px bg-brand-accent/10"></div>
                <Link to="/orders" className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    我的訂單
                </Link>
                <div className="h-px bg-brand-accent/10"></div>
                <Link to="/friends-list" className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    我的好友
                </Link>
                <div className="h-px bg-brand-accent/10"></div>
                <Link to="/journal" className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    我的品飲筆記
                </Link>
                <div className="h-px bg-brand-accent/10"></div>
                <Link to="/redeem" className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    積分兌換
                </Link>
                <div className="h-px bg-brand-accent/10"></div>
                <Link to="/coupons" className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    我的優惠券
                </Link>
                <div className="h-px bg-brand-accent/10"></div>
                <Link to="/profile/privacy" className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    隱私設定
                </Link>
                <div className="h-px bg-brand-accent/10"></div>
                <Link to="/profile/notifications" className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    通知設定
                </Link>
                <div className="h-px bg-brand-accent/10"></div>
                <Link to="/logout" className="block w-full text-left p-4 text-red-500 font-semibold hover:bg-red-500/10 transition-colors">
                    登出
                </Link>
            </div>
        </div>
    );
};

export default ProfilePage;
