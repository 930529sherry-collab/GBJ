

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_REDEEM_ITEMS, MOCK_USER_PROFILE, MOCK_COUPONS, formatDate, addDays } from '../constants';
import { RedeemItem, UserProfile, Coupon, Notification } from '../types';
import { BackIcon, CoinIcon, XIcon } from '../components/icons/ActionIcons';
import { useGuestGuard } from '../context/GuestGuardContext';

const InsufficientPointsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    missingPoints: number;
}> = ({ isOpen, onClose, missingPoints }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
                    <CoinIcon className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-brand-accent mb-2">積分不足！</h2>
                <p className="text-brand-muted mb-6">
                    您目前的酒幣不足以兌換此商品。<br />
                    還差 <span className="font-bold text-red-500 text-lg">{missingPoints}</span> 酒幣。
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors font-semibold"
                    >
                        知道了
                    </button>
                    <button
                        onClick={() => { onClose(); navigate('/missions'); }}
                        className="flex-1 bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
                    >
                        去賺酒幣
                    </button>
                </div>
            </div>
        </div>
    );
};

const RedeemModal: React.FC<{
    item: RedeemItem | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (itemId: number) => void;
}> = ({ item, isOpen, onClose, onConfirm }) => {
    const [step, setStep] = useState<'confirm' | 'success'>('confirm');

    useEffect(() => {
        if (isOpen) {
            setStep('confirm');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!item) return;
        onConfirm(item.id);
        setStep('success');
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10">
                {step === 'confirm' && (
                    <>
                        <h2 className="text-xl font-bold text-brand-accent mb-1">確認兌換</h2>
                        <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent/20 my-4">
                            <h3 className="font-bold text-brand-light">{item.title}</h3>
                            <p className="text-sm text-brand-muted mt-1">{item.description}</p>
                        </div>
                        <p className="text-center text-sm text-yellow-600 bg-yellow-400/10 p-3 rounded-md border border-yellow-500/30">
                            這將會從您的帳戶扣除 <span className="font-bold">{item.cost} 酒幣</span>。此操作無法復原。
                        </p>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
                            >
                                確認兌換
                            </button>
                        </div>
                    </>
                )}
                {step === 'success' && (
                    <div className="text-center py-8">
                        <svg className="w-16 h-16 text-brand-accent mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-brand-accent">兌換成功！</h2>
                        <p className="text-brand-muted mt-2">優惠券已匯入您的帳戶。</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const RedeemPage: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [redeemedIds, setRedeemedIds] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<RedeemItem | null>(null);
    
    // Insufficient Points Modal State
    const [isInsufficientModalOpen, setIsInsufficientModalOpen] = useState(false);
    const [missingPoints, setMissingPoints] = useState(0);

    const { checkGuest } = useGuestGuard();

    useEffect(() => {
        const savedProfile = localStorage.getItem('userProfile');
        setProfile(savedProfile ? JSON.parse(savedProfile) : MOCK_USER_PROFILE);
    }, []);

    const sortedItems = useMemo(() => {
        return [...MOCK_REDEEM_ITEMS].sort((a, b) => a.cost - b.cost);
    }, []);

    const handleOpenModal = (item: RedeemItem) => {
        if (!profile) return;

        checkGuest(() => {
            // Affordability Check
            if (profile.points < item.cost) {
                setMissingPoints(item.cost - profile.points);
                setIsInsufficientModalOpen(true);
                return;
            }
            // Already Redeemed Check
            if (redeemedIds.includes(item.id)) return;

            setSelectedItem(item);
            setIsModalOpen(true);
        });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleConfirmRedemption = (itemId: number) => {
        const item = MOCK_REDEEM_ITEMS.find(i => i.id === itemId);
        if (!item || !profile || profile.points < item.cost) return;

        const newNotification: Notification = {
            id: `redeem-${Date.now()}`,
            type: '兌換成功',
            message: `成功兌換「${item.title}」，已扣除 ${item.cost} 酒幣。`,
            timestamp: new Date(),
            read: false,
        };

        const updatedNotifications = [newNotification, ...(profile.notifications || [])];
        const updatedProfile = { 
            ...profile, 
            points: profile.points - item.cost,
            notifications: updatedNotifications
        };

        setProfile(updatedProfile);
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        
        setRedeemedIds(prev => [...prev, item.id]);

        const storeNameMatch = item.description.match(/「(.*?)」/);
        const storeName = storeNameMatch ? storeNameMatch[1] : '乾不揪獎勵';

        const newCoupon: Coupon = {
            id: Date.now(),
            storeName: storeName,
            title: item.title,
            description: item.description,
            expiry: formatDate(addDays(new Date(), 30)),
            status: 'valid'
        };

        const existingCouponsStr = localStorage.getItem('userCoupons');
        let currentCoupons: Coupon[] = [];
        
        if (existingCouponsStr) {
            currentCoupons = JSON.parse(existingCouponsStr);
        } else {
            currentCoupons = [...MOCK_COUPONS];
        }

        const updatedCoupons = [newCoupon, ...currentCoupons];
        localStorage.setItem('userCoupons', JSON.stringify(updatedCoupons));
    };

    if (!profile) {
        return <div className="text-center p-10 text-brand-accent">讀取中...</div>;
    }
    
    // @-fix: Corrected unintentional type comparison from '0' (number) to "'0'" (string).
    const isGuest = profile.id === '0' || profile.isGuest;

    return (
        <>
            <div className="animate-fade-in space-y-6">
                <div className="relative flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                        <BackIcon />
                        <span>返回</span>
                    </button>
                </div>
                
                {/* User Points Display */}
                <div className="bg-brand-secondary p-4 rounded-xl border-2 border-brand-accent/20 flex items-center justify-between shadow-lg shadow-brand-accent/10">
                    <h2 className="text-lg font-bold text-brand-light">我的酒幣</h2>
                    <div className="flex items-center gap-2">
                        <CoinIcon className="w-6 h-6 text-yellow-500" />
                        <span className="font-bold text-brand-accent text-2xl">{profile.points}</span>
                    </div>
                </div>

                {/* Redeemable Items */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-brand-light">可兌換獎勵</h3>
                    {sortedItems.map(item => {
                        const isRedeemed = redeemedIds.includes(item.id);
                        const canAfford = profile.points >= item.cost;
                        
                        return (
                            <div key={item.id} className="bg-brand-secondary p-4 rounded-lg flex items-center justify-between gap-4 border-2 border-brand-accent/20">
                                <div className="flex-grow">
                                    <h4 className="font-bold text-brand-light">{item.title}</h4>
                                    <p className="text-sm text-brand-muted mt-1">{item.description}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <CoinIcon className="w-4 h-4 text-yellow-500" />
                                        <span className={`text-sm font-semibold ${!isGuest && !canAfford ? 'text-red-500' : 'text-brand-accent'}`}>
                                            {item.cost} 酒幣
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        disabled={isRedeemed}
                                        className={`w-24 text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
                                            isRedeemed 
                                            ? 'bg-brand-primary text-brand-muted cursor-not-allowed'
                                            : 'bg-brand-accent text-brand-primary hover:bg-opacity-80' 
                                        }`}
                                    >
                                        {isRedeemed ? '已兌換' : '兌換'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <RedeemModal
                item={selectedItem}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmRedemption}
            />
            <InsufficientPointsModal 
                isOpen={isInsufficientModalOpen}
                onClose={() => setIsInsufficientModalOpen(false)}
                missingPoints={missingPoints}
            />
        </>
    );
};

export default RedeemPage;