

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_REDEEM_ITEMS, MOCK_USER_PROFILE } from '../constants';
import { RedeemItem, UserProfile } from '../types';
import { BackIcon, CoinIcon } from '../components/icons/ActionIcons';

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
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in">
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
                        <p className="text-brand-muted mt-2">獎勵已發送至您的帳戶。</p>
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

    useEffect(() => {
        const savedProfile = localStorage.getItem('userProfile');
        setProfile(savedProfile ? JSON.parse(savedProfile) : MOCK_USER_PROFILE);
    }, []);

    const handleOpenModal = (item: RedeemItem) => {
        if (!profile || profile.points < item.cost || redeemedIds.includes(item.id)) return;
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleConfirmRedemption = (itemId: number) => {
        const item = MOCK_REDEEM_ITEMS.find(i => i.id === itemId);
        if (!item || !profile || profile.points < item.cost) return;

        const updatedProfile = { ...profile, points: profile.points - item.cost };
        setProfile(updatedProfile);
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        setRedeemedIds(prev => [...prev, item.id]);
    };

    if (!profile) {
        return <div className="text-center p-10 text-brand-accent">讀取中...</div>;
    }

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
                    {MOCK_REDEEM_ITEMS.map(item => {
                        const canAfford = profile.points >= item.cost;
                        const isRedeemed = redeemedIds.includes(item.id);

                        return (
                            <div key={item.id} className="bg-brand-secondary p-4 rounded-lg flex items-center justify-between gap-4 border-2 border-brand-accent/20">
                                <div className="flex-grow">
                                    <h4 className="font-bold text-brand-light">{item.title}</h4>
                                    <p className="text-sm text-brand-muted mt-1">{item.description}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <CoinIcon className="w-4 h-4 text-yellow-500" />
                                        <span className="text-sm font-semibold text-brand-accent">{item.cost} 酒幣</span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        disabled={!canAfford || isRedeemed}
                                        className={`w-24 text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
                                            isRedeemed 
                                            ? 'bg-brand-primary text-brand-muted cursor-not-allowed'
                                            : canAfford 
                                            ? 'bg-brand-accent text-brand-primary hover:bg-opacity-80' 
                                            : 'bg-brand-muted/20 text-brand-muted cursor-not-allowed'
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
        </>
    );
};

export default RedeemPage;