import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MOCK_STORES, MOCK_ORDERS } from '../constants';
import { Store, Order } from '../types';
import { PlusIcon, ChevronDownIcon } from '../components/icons/ActionIcons';
import { useGeolocation } from '../context/GeolocationContext';
import { getDistance } from '../utils/distance';

const availabilityStyles = {
    Available: { color: 'bg-green-500', text: '有空位' },
    Busy: { color: 'bg-yellow-500', text: '有點忙' },
    Full: { color: 'bg-red-500', text: '已客滿' },
};

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
    useEffect(() => { if (isOpen) { setDate(today); setTime('19:00'); setPeople(2); setStep('form'); } }, [isOpen, today]);
    const handleConfirm = () => {
        if (!store) return;
        const newOrder: Order = { id: `ORD${Date.now()}`, storeName: store.name, date, time, people, status: 'Confirmed' };
        const existingOrdersString = localStorage.getItem('orders');
        const existingOrders: Order[] = existingOrdersString ? JSON.parse(existingOrdersString) : MOCK_ORDERS;
        const updatedOrders = [newOrder, ...existingOrders];
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        setStep('success');
        setTimeout(onClose, 2000);
    };
    if (!isOpen || !store) return null;
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10">
                {step === 'form' && (
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
                )}
                {step === 'success' && (
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

const StoreCard: React.FC<{ store: Store; onSelect: (store: Store) => void; onReserveClick: (store: Store) => void; }> = ({ store, onSelect, onReserveClick }) => {
    const status = availabilityStyles[store.availability];
    const showReserveButton = store.availability === 'Available' || store.availability === 'Busy';
    const handleReserveClick = (e: React.MouseEvent) => { e.stopPropagation(); onReserveClick(store); };
    return (
        <div className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/50 shadow-lg shadow-brand-accent/10 cursor-pointer transform transition-transform hover:scale-[1.02]" onClick={() => onSelect(store)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(store)}>
            <img src={store.imageUrl} alt={store.name} className="w-full h-32 object-cover rounded-md mb-3" />
            <h3 className="text-lg font-bold text-brand-accent">{store.name}</h3>
            <p className="text-brand-muted text-sm">{store.type} {store.priceRange && `• ${store.priceRange}`}</p>
            <div className="flex justify-between items-center mt-2 text-sm">
                <div className="flex items-center gap-4">
                    <span>{store.distance}</span>
                    <span className="flex items-center"><svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>{store.rating}</span>
                </div>
                <span className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${status.color}`}></div><span className="font-semibold">{status.text}</span></span>
            </div>
            {showReserveButton && (<div className="mt-4"><button onClick={handleReserveClick} className="w-full bg-brand-brown-cta text-brand-text-on-accent font-bold py-2 px-4 rounded-lg hover:bg-brand-brown-cta-hover transition-colors">預約訂位</button></div>)}
        </div>
    );
};

const HomePage: React.FC = () => {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [storeToReserve, setStoreToReserve] = useState<Store | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isStoreListOpen, setIsStoreListOpen] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;
    
    const location = useLocation();
    const navigate = useNavigate();
    const { position: userPosition, error: userError } = useGeolocation();
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredStores = useMemo(() => {
        return stores.filter(store => {
            const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [stores, searchTerm]);

    const totalPages = Math.ceil(filteredStores.length / ITEMS_PER_PAGE);
    const paginatedStores = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredStores.slice(startIndex, endIndex);
    }, [filteredStores, currentPage]);

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    useEffect(() => {
        setLoading(true);
        
        setTimeout(() => {
            const savedStores = localStorage.getItem('stores');
            let allStores: Store[];
            if (savedStores) {
                allStores = JSON.parse(savedStores);
            } else {
                allStores = MOCK_STORES;
                localStorage.setItem('stores', JSON.stringify(MOCK_STORES));
            }
            
            const taipeiStores = allStores.filter(store => store.address.includes('台北市'));

            if (userPosition) {
                const storesWithDistance = taipeiStores.map(store => {
                    const distance = getDistance(userPosition.lat, userPosition.lng, store.latlng.lat, store.latlng.lng);
                    return { ...store, distance: `${distance.toFixed(1)} 公里` };
                }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
                setStores(storesWithDistance);
            } else {
                 setStores(taipeiStores);
            }

            setLoading(false);
        }, 500);
    }, [location, userPosition]);

    const handleOpenModal = (store: Store) => { setStoreToReserve(store); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setStoreToReserve(null); };
    
    const handleSelectStore = (store: Store) => {
        navigate(`/store/${store.id}`);
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在尋找台北市的酒吧...</div>;
    }

    return (
        <>
            <div className="animate-fade-in flex flex-col h-full">
                {userError && (
                    <div className="text-center text-sm text-red-500 bg-red-500/10 p-2 rounded-lg mb-4">
                        無法取得您的位置：{userError}。距離計算可能不準確。
                    </div>
                )}
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-6 pb-32">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => setIsStoreListOpen(!isStoreListOpen)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-brand-secondary transition-colors">
                                <h3 className="text-lg font-bold text-brand-light">所有酒吧</h3>
                                <ChevronDownIcon className={`w-6 h-6 text-brand-muted transition-transform duration-300 ${isStoreListOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <Link 
                                to="/add-store" 
                                className="flex items-center gap-2 bg-brand-button-bg text-brand-light font-semibold text-sm py-2 px-3 rounded-lg hover:bg-brand-button-bg-hover transition-colors" 
                                aria-label="新增酒吧">
                                <PlusIcon className="w-5 h-5"/>
                                <span>新增酒吧</span>
                            </Link>
                        </div>
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isStoreListOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="relative mb-4">
                                <input type="text" placeholder="搜尋店家名稱..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-brand-secondary border-2 border-brand-accent/50 rounded-lg p-3 pl-10 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors" />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><svg className="w-5 h-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                            </div>

                            {paginatedStores.length > 0 ? (
                                <div className="space-y-4">
                                    {paginatedStores.map(store => <StoreCard key={store.id} store={store} onSelect={handleSelectStore} onReserveClick={handleOpenModal} />)}
                                </div>
                            ) : (
                                <div className="text-center p-10 text-brand-muted bg-brand-secondary rounded-lg border-2 border-brand-accent/20">
                                    <p>{`找不到${searchTerm ? `符合「${searchTerm}」的` : ''}店家。`}</p>
                                    <p className="text-sm mt-2">試試看其他的關鍵字吧！</p>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-6">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="bg-brand-button-bg text-brand-light font-semibold py-2 px-4 rounded-lg hover:bg-brand-button-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        上一頁
                                    </button>
                                    <span className="text-brand-muted font-semibold">
                                        第 {currentPage} / {totalPages} 頁
                                    </span>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="bg-brand-button-bg text-brand-light font-semibold py-2 px-4 rounded-lg hover:bg-brand-button-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        下一頁
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ReservationModal store={storeToReserve} isOpen={isModalOpen} onClose={handleCloseModal} />
        </>
    );
};

export default HomePage;