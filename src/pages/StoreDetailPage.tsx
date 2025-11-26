
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_STORES, MOCK_ORDERS } from '../constants';
import { Store, Order, UserProfile, Review } from '../types';
import StoreDetail from '../components/StoreDetail';
import { useGuestGuard } from '../context/GuestGuardContext';
import { getStores, addNotificationToUser, userApi } from '../utils/api';

const ReservationModal: React.FC<{
    store: Store | null;
    isOpen: boolean;
    onClose: () => void;
}> = ({ store, isOpen, onClose }) => {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('19:00');
    const [people, setPeople] = useState(2);
    const today = new Date().toISOString().split('T')[0];
    
    useEffect(() => { 
        if (isOpen) { 
            setDate(today); 
            setTime('19:00'); 
            setPeople(2); 
            setStep('form'); 
        } 
    }, [isOpen, today]);

    const handleConfirm = () => {
        if (!store) return;
        
        const profileData = localStorage.getItem('userProfile');
        const profile: UserProfile | null = profileData ? JSON.parse(profileData) : null;
        const userId = profile ? profile.id : 0;

        const newOrder: Order = { 
            id: `ORD${Date.now()}`, 
            userId,
            storeName: store.name, 
            date, 
            time, 
            people, 
            status: 'Confirmed' 
        };
        const existingOrdersString = localStorage.getItem('orders');
        const existingOrders: Order[] = existingOrdersString ? JSON.parse(existingOrdersString) : MOCK_ORDERS;
        const updatedOrders = [newOrder, ...existingOrders];
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        
        // Send notification
        if (profile && !profile.isGuest) {
            addNotificationToUser(
                String(profile.id),
                `您在 ${store.name} 的預約已確認 (${date} ${time})。`,
                '訂單通知'
            );
        }

        setStep('success');
        setTimeout(onClose, 2000);
    };

    if (!isOpen || !store) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10">
                {step === 'form' ? (
                    <>
                        <h2 className="text-xl font-bold text-brand-accent mb-1">預約訂位</h2>
                        <p className="text-brand-muted mb-6">店家：{store.name}</p>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-brand-light mb-1">預約日期</label>
                                <input type="date" id="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent" />
                            </div>
                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-brand-light mb-1">預計到達時間</label>
                                <select id="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent">
                                    <option>18:00</option> <option>19:00</option> <option>20:00</option> <option>21:00</option> <option>22:00</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="people" className="block text-sm font-medium text-brand-light mb-1">人數</label>
                                <select id="people" value={people} onChange={(e) => setPeople(Number(e.target.value))} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent">
                                    {[...Array(8).keys()].map(i => <option key={i + 1} value={i + 1}>{i + 1} 人</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={onClose} className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors">取消</button>
                            <button onClick={handleConfirm} className="flex-1 bg-brand-brown-cta text-brand-text-on-accent font-bold py-2 px-4 rounded-lg hover:bg-brand-brown-cta-hover transition-colors">確認預約</button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <svg className="w-16 h-16 text-brand-accent mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h2 className="text-2xl font-bold text-brand-accent">預約成功！</h2>
                        <p className="text-brand-muted mt-2">已為您保留座位，請準時抵達。</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const StoreDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const { checkGuest } = useGuestGuard();

    useEffect(() => {
        const fetchStoreData = async () => {
            setLoading(true);
            const profile = localStorage.getItem('userProfile');
            if (profile) setCurrentUser(JSON.parse(profile));

            try {
                // Fetch stores from API ensuring we get the latest data including Firestore ones
                const allStores = await getStores();
                
                // Find store matching the ID. 
                // Store.id can be string or number, id param is string. Use string comparison.
                const foundStore = allStores.find(s => String(s.id) === id);
                
                if (foundStore) {
                    setStore(foundStore);
                } else {
                    setStore(null);
                }
            } catch (error) {
                console.error("Error loading store details:", error);
                setStore(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchStoreData();
        } else {
            setLoading(false);
        }
    }, [id]);
    
    const handleUpdateReviews = (newReview: Review) => {
        if (!store) return;

        const updatedReviews = [newReview, ...store.reviews];
        const updatedStore = { ...store, reviews: updatedReviews };

        setStore(updatedStore);

        // Since we are not using localStorage for stores anymore, this local update is just for UI.
        // The review addition to backend is handled in StoreDetail component via onUpdateReviews calling addReview (if implemented there) or we should call API here.
        // For now, just UI update is fine as the user requested removing localStorage fallback for reading.
        
        // New Trigger for Mission Progress
        if (currentUser && !currentUser.isGuest) {
            userApi.triggerMissionUpdate('review_added');
        }
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">載入店家資訊...</div>;
    }

    if (!store) {
        return (
            <div className="text-center p-10 text-brand-muted">
                <p>找不到此店家資訊。</p>
                <button onClick={() => navigate('/')} className="mt-4 text-brand-accent font-semibold">回到地圖</button>
            </div>
        );
    }

    return (
        <>
            <StoreDetail 
                store={store} 
                onBack={() => navigate(-1)} 
                onReserveClick={() => {
                    checkGuest(() => setIsModalOpen(true));
                }}
                currentUser={currentUser}
                onUpdateReviews={handleUpdateReviews}
            />
            <ReservationModal 
                store={store}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default StoreDetailPage;
