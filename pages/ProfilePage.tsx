

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MOCK_USER_PROFILE, MISSIONS_FOR_IMPORT } from '../constants';
import { UserProfile, Mission } from '../types';
import { CoinIcon } from '../components/icons/ActionIcons';
import { useGuestGuard } from '../context/GuestGuardContext';
import { db } from '../firebase/config';
import { writeBatch, collection, getDocs, doc } from "firebase/firestore";

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState('');
    const location = useLocation();
    const { checkGuest } = useGuestGuard();
    const navigate = useNavigate();

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
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            setCopySuccess('複製失敗');
            console.error('Could not copy text: ', err);
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    const handleRestrictedClick = (path: string) => {
        checkGuest(() => {
            navigate(path);
        });
    };

    const handleImportMissions = async () => {
        const confirm = window.confirm("確定要將最新的任務定義匯入資料庫嗎？這會覆蓋 system_missions 集合。");
        if (!confirm || !db) return;
    
        try {
            const batch = writeBatch(db);
            const missionsCollection = collection(db, 'system_missions');
    
            // Optional: Clear existing missions first
            const existingDocs = await getDocs(missionsCollection);
            existingDocs.forEach(doc => batch.delete(doc.ref));
    
            MISSIONS_FOR_IMPORT.forEach((mission) => {
                const docRef = doc(missionsCollection, mission.id);
                
                // We are importing the master definition, so no 'current' or 'status'
                const { id, ...missionData } = mission;
                const finalData = { ...missionData, isActive: true };
                
                batch.set(docRef, finalData);
            });
    
            await batch.commit();
            alert("任務匯入成功！請至 Firebase Console 的 system_missions 集合檢查。");
        } catch (error) {
            console.error("任務匯入失敗:", error);
            alert("匯入失敗，請查看 console 裡的錯誤訊息。");
        }
    };
    
    if (loading || !profile) {
        return <div className="text-center p-10 text-brand-accent">讀取個人檔案...</div>;
    }
    
    const xpPercentage = (profile.xp / profile.xpToNextLevel) * 100;
    const isGuest = profile.id === 0 || profile.isGuest;

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center space-y-2 p-6 bg-brand-secondary rounded-2xl border-2 border-brand-accent/20">
                <img src={profile.avatarUrl} alt={profile.name} className="w-28 h-28 rounded-full object-cover border-4 border-brand-accent shadow-lg shadow-brand-accent/30 mb-2" />
                <h2 className="text-3xl font-bold text-brand-light">
                    {profile.displayName || profile.name || (profile.email && typeof profile.email === 'string' ? profile.email.split('@')[0] : '用戶')}
                </h2>

                <div className="flex items-center gap-2 bg-brand-primary px-3 py-1 rounded-full border border-brand-accent/30">
                    <CoinIcon className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-brand-accent text-lg">{profile.points}</span>
                    <span className="text-sm text-brand-muted">酒幣</span>
                </div>

                <div className="text-center text-sm text-brand-muted mb-2 pt-2">
                    {profile.email && <p>{profile.email}</p>}
                    {profile.phone && <p>{profile.phone}</p>}
                </div>

                {!isGuest && profile.friendCode && (
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
                <div onClick={() => handleRestrictedClick('/friends-list')} className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/20 hover:border-brand-accent/50 transition-colors cursor-pointer">
                    <p className="text-2xl font-bold text-brand-accent">{(profile.friends || []).length}</p>
                    <p className="text-sm text-brand-muted">位好友</p>
                </div>
                <div className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/20">
                    <p className="text-2xl font-bold text-brand-accent">{profile.checkIns}</p>
                    <p className="text-sm text-brand-muted">打卡次數</p>
                </div>
            </div>

            <div className="bg-brand-secondary rounded-lg overflow-hidden border-2 border-brand-accent/20">
                <button onClick={() => handleRestrictedClick('/profile/edit')} className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    編輯個人檔案
                </button>
                <div className="h-px bg-brand-accent/10"></div>
                <button onClick={() => handleRestrictedClick('/orders')} className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    我的訂單
                </button>
                <div className="h-px bg-brand-accent/10"></div>
                <button onClick={() => handleRestrictedClick('/friends-list')} className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    我的好友
                </button>
                <div className="h-px bg-brand-accent/10"></div>
                <button onClick={() => handleRestrictedClick('/profile/check-ins')} className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    我的打卡紀錄
                </button>
                <div className="h-px bg-brand-accent/10"></div>
                <Link to="/journal" className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    我的品飲筆記
                </Link>
                <div className="h-px bg-brand-accent/10"></div>
                <button onClick={() => handleRestrictedClick('/redeem')} className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    積分兌換
                </button>
                <div className="h-px bg-brand-accent/10"></div>
                <button onClick={() => handleRestrictedClick('/coupons')} className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    我的優惠券
                </button>
                <div className="h-px bg-brand-accent/10"></div>
                <button onClick={() => handleRestrictedClick('/profile/privacy')} className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    隱私設定
                </button>
                <div className="h-px bg-brand-accent/10"></div>
                <button onClick={() => handleRestrictedClick('/profile/notifications')} className="block w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    通知設定
                </button>
                <div className="h-px bg-brand-accent/10"></div>
                <Link to="/logout" className="block w-full text-left p-4 text-red-500 font-semibold hover:bg-red-500/10 transition-colors">
                    {isGuest ? '註冊 / 登入' : '登出'}
                </Link>
            </div>
             {/* Temporary Admin Button */}
             <div className="mt-8">
                <button 
                    onClick={handleImportMissions}
                    className="w-full bg-red-800 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-red-900 transition-colors"
                >
                    [管理員] 一鍵匯入任務到資料庫
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;