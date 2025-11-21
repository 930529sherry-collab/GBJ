
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_COUPONS, MOCK_REDEMPTION_CODES, formatDate, addDays } from '../constants';
import { Coupon } from '../types';
import { BackIcon } from '../components/icons/ActionIcons';
import { TicketIcon } from '../components/icons/NavIcons';

type CouponStatus = 'valid' | 'used' | 'expired';

const statusMap: Record<CouponStatus, string> = {
    valid: '可使用',
    used: '已使用',
    expired: '已過期',
};

const RedemptionModal: React.FC<{
    coupon: Coupon | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (couponId: number) => void;
}> = ({ coupon, isOpen, onClose, onConfirm }) => {
    const [step, setStep] = useState<'confirm' | 'success'>('confirm');

    useEffect(() => {
        if (isOpen) {
            setStep('confirm');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!coupon) return;
        onConfirm(coupon.id);
        setStep('success');
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    if (!isOpen || !coupon) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10">
                {step === 'confirm' && (
                    <>
                        <h2 className="text-xl font-bold text-brand-accent mb-1">確認兌換</h2>
                        <p className="text-brand-muted mb-4">店家：{coupon.storeName}</p>
                        
                        <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent/20 my-4">
                            <h3 className="font-bold text-brand-light">{coupon.title}</h3>
                            <p className="text-sm text-brand-muted mt-1">{coupon.description}</p>
                        </div>
                        
                        <p className="text-center text-sm text-yellow-600 bg-yellow-400/10 p-3 rounded-md border border-yellow-500/30">
                            請在店家人員面前出示此畫面並進行兌換。一經確認，優惠券將被標記為已使用。
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
                        <p className="text-brand-muted mt-2">請向店家出示此畫面。</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const CouponCard: React.FC<{ coupon: Coupon; onClick?: () => void }> = ({ coupon, onClick }) => {
    const isInactive = coupon.status === 'used' || coupon.status === 'expired';
    
    const cardContent = (
        <div className={`bg-brand-secondary rounded-xl border-2 border-brand-accent/20 overflow-hidden shadow-lg shadow-brand-accent/10 flex transition-opacity ${isInactive ? 'opacity-60' : 'hover:border-brand-accent/50'}`}>
            <div className="flex-shrink-0 w-16 bg-brand-primary border-r-2 border-dashed border-brand-accent/20 flex items-center justify-center">
                <TicketIcon />
            </div>
            <div className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-semibold text-brand-muted">{coupon.storeName}</p>
                        <h3 className="text-lg font-bold text-brand-accent">{coupon.title}</h3>
                    </div>
                    {isInactive && (
                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${coupon.status === 'used' ? 'bg-blue-400/10 text-blue-400' : 'bg-red-400/10 text-red-400'}`}>
                            {statusMap[coupon.status]}
                        </span>
                    )}
                </div>
                <p className="text-brand-light text-sm mt-2">{coupon.description}</p>
                <p className="text-xs text-brand-muted mt-3">到期日：{coupon.expiry}</p>
            </div>
        </div>
    );

    if (coupon.status === 'valid' && onClick) {
        return (
            <button onClick={onClick} className="w-full text-left transform transition-transform hover:scale-[1.02]">
                {cardContent}
            </button>
        )
    }

    return cardContent;
};


const CouponsPage: React.FC = () => {
    const navigate = useNavigate();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [activeTab, setActiveTab] = useState<CouponStatus>('valid');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

    const [redemptionCode, setRedemptionCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemMessage, setRedeemMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


    useEffect(() => {
        // Simulate data fetching
        setTimeout(() => {
            // Load from localStorage or mock if not available
            const savedCoupons = localStorage.getItem('userCoupons');
            if (savedCoupons) {
                setCoupons(JSON.parse(savedCoupons));
            } else {
                setCoupons(MOCK_COUPONS);
            }
            setLoading(false);
        }, 300);
    }, []);

    const handleOpenModal = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCoupon(null);
    };

    const handleConfirmRedemption = (couponId: number) => {
        const updatedCoupons = coupons.map(c => 
            c.id === couponId ? { ...c, status: 'used' as CouponStatus } : c
        );
        setCoupons(updatedCoupons);
        localStorage.setItem('userCoupons', JSON.stringify(updatedCoupons));
    };

    const handleRedeemCode = () => {
        if (!redemptionCode.trim()) return;
    
        setIsRedeeming(true);
        setRedeemMessage(null);
    
        setTimeout(() => { // Simulate API call
            const codeData = MOCK_REDEMPTION_CODES[redemptionCode];
    
            const alreadyExists = codeData && coupons.some(
                c => c.title === codeData.couponTemplate.title && c.storeName === codeData.couponTemplate.storeName
            );
    
            if (codeData && !alreadyExists) {
                const newCoupon: Coupon = {
                    id: Date.now(), // simple unique id
                    ...codeData.couponTemplate,
                    expiry: formatDate(addDays(new Date(), codeData.daysValid)),
                    status: 'valid',
                };
    
                const updatedCoupons = [newCoupon, ...coupons];
                setCoupons(updatedCoupons);
                localStorage.setItem('userCoupons', JSON.stringify(updatedCoupons));
                
                setRedeemMessage({ type: 'success', text: `成功兌換：「${newCoupon.title}」！` });
                setRedemptionCode('');
            } else if (alreadyExists) {
                setRedeemMessage({ type: 'error', text: '您已經兌換過此優惠碼了。' });
            } else {
                setRedeemMessage({ type: 'error', text: '無效的兌換碼，請再試一次。' });
            }
    
            setIsRedeeming(false);
            // Clear message after 3 seconds
            setTimeout(() => setRedeemMessage(null), 3000);
        }, 1000);
    };

    const filteredCoupons = useMemo(() => {
        return coupons.filter(coupon => coupon.status === activeTab);
    }, [activeTab, coupons]);

    return (
        <div className="animate-fade-in space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                <BackIcon />
                <span>返回個人檔案</span>
            </button>

            {/* Redeem Code Section */}
            <div className="bg-brand-secondary p-4 rounded-xl border-2 border-brand-accent/20 space-y-3 shadow-lg shadow-brand-accent/10">
                <h3 className="text-lg font-bold text-brand-light">兌換優惠碼</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        placeholder="請輸入兌換碼 (例如 WELCOME2024)"
                        value={redemptionCode}
                        onChange={(e) => {
                            setRedemptionCode(e.target.value.toUpperCase());
                            if (redeemMessage) setRedeemMessage(null);
                        }}
                        className="flex-grow bg-brand-primary border-2 border-brand-accent/50 rounded-lg p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors"
                    />
                    <button
                        onClick={handleRedeemCode}
                        disabled={!redemptionCode || isRedeeming}
                        className="bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted/50 disabled:cursor-not-allowed"
                    >
                        {isRedeeming ? '兌換中...' : '兌換'}
                    </button>
                </div>
                {redeemMessage && (
                    <p className={`text-sm mt-2 animate-fade-in ${redeemMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        {redeemMessage.text}
                    </p>
                )}
            </div>
            
            {/* Tabs */}
            <div className="flex border-b-2 border-brand-accent/20">
                {(Object.keys(statusMap) as CouponStatus[]).map(status => (
                    <button 
                        key={status}
                        onClick={() => setActiveTab(status)}
                        className={`px-4 py-2 font-semibold transition-colors duration-200 ${
                            activeTab === status
                                ? 'border-b-2 border-brand-accent text-brand-accent' 
                                : 'text-brand-muted hover:text-brand-light'
                        }`}
                    >
                        {statusMap[status]}
                    </button>
                ))}
            </div>

            {/* Coupons List */}
            {loading ? (
                 <div className="text-center p-10 text-brand-accent">正在讀取優惠券...</div>
            ) : filteredCoupons.length > 0 ? (
                <div className="space-y-4">
                    {filteredCoupons.map(coupon => (
                        <CouponCard 
                            key={coupon.id} 
                            coupon={coupon} 
                            onClick={coupon.status === 'valid' ? () => handleOpenModal(coupon) : undefined} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center p-10 text-brand-muted">
                    <p>這個分類中沒有任何優惠券。</p>
                </div>
            )}
            
            <RedemptionModal 
                coupon={selectedCoupon}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmRedemption}
            />
        </div>
    );
};

export default CouponsPage;
