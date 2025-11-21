
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MenuItem, Review, UserProfile } from '../types';
import { BackIcon, HeartIcon, LocationMarkerIcon, StarIcon, PhoneIcon, ClockIcon, CurrencyDollarIcon } from './icons/ActionIcons';
import { useGuestGuard } from '../context/GuestGuardContext';

const availabilityStyles = {
    Available: { color: 'bg-green-500', text: '有空位' },
    Busy: { color: 'bg-yellow-500', text: '有點忙' },
    Full: { color: 'bg-red-500', text: '已客滿' },
};

type Tab = 'info' | 'menu' | 'reviews';

const StoreDetail: React.FC<{ 
    store: Store; 
    onBack: () => void;
    onReserveClick: (store: Store) => void;
    currentUser: UserProfile | null;
    onUpdateReviews: (newReview: Review) => void;
}> = ({ store, onBack, onReserveClick, currentUser, onUpdateReviews }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('info');
    const navigate = useNavigate();
    const { checkGuest } = useGuestGuard();

    useEffect(() => {
        const favoriteStoreIds = JSON.parse(localStorage.getItem('favoriteStoreIds') || '[]') as number[];
        setIsFavorite(favoriteStoreIds.includes(store.id));
    }, [store.id]);

    const handleToggleFavorite = () => {
        checkGuest(() => {
            const favoriteStoreIds = JSON.parse(localStorage.getItem('favoriteStoreIds') || '[]') as number[];
            const storeId = store.id;
            let updatedIds;

            if (favoriteStoreIds.includes(storeId)) {
                updatedIds = favoriteStoreIds.filter((id: number) => id !== storeId);
            } else {
                updatedIds = [...favoriteStoreIds, storeId];
            }
            
            localStorage.setItem('favoriteStoreIds', JSON.stringify(updatedIds));
            setIsFavorite(!isFavorite);
        });
    };

    const status = availabilityStyles[store.availability];
    const showReserveButton = store.availability === 'Available' || store.availability === 'Busy';

    const handleReserveClick = () => {
        onReserveClick(store);
    }

    return (
        <div className="animate-fade-in">
            {/* Header Image and Back Button */}
            <div className="relative">
                <img src={store.imageUrl} alt={store.name} className="w-full h-48 object-cover rounded-t-lg" />
                <button 
                    onClick={onBack} 
                    className="absolute top-4 left-4 bg-brand-secondary/80 text-brand-light p-2 rounded-full hover:bg-brand-secondary transition-colors"
                    aria-label="Back to list"
                >
                    <BackIcon />
                </button>
            </div>

            <div className="bg-brand-secondary p-4 rounded-b-lg border-x-2 border-b-2 border-brand-accent/30">
                {/* Store Name and Favorite Button */}
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-brand-accent">{store.name}</h2>
                    <button onClick={handleToggleFavorite} className="text-red-500" aria-label="Toggle favorite">
                        <HeartIcon filled={isFavorite} />
                    </button>
                </div>
                
                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-brand-muted mb-4">
                    <span>{store.type}</span>
                    <span>&bull;</span>
                    <span>{store.distance}</span>
                    <span>&bull;</span>
                    <span className="flex items-center">
                        <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                        {store.rating}
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex border-b-2 border-brand-accent/20 mb-4">
                    <TabButton name="店家資訊" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                    <TabButton name="菜單" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
                    <TabButton name="評論" active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} />
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'info' && <InfoTab store={store} status={status} showReserveButton={showReserveButton} onReserveClick={handleReserveClick} />}
                    {activeTab === 'menu' && <MenuTab menu={store.menu} />}
                    {activeTab === 'reviews' && <ReviewsTab reviews={store.reviews} currentUser={currentUser} onUpdateReviews={onUpdateReviews} />}
                </div>
            </div>
        </div>
    );
};

// Tab Button Component
const TabButton: React.FC<{ name: string, active: boolean, onClick: () => void }> = ({ name, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 font-semibold transition-colors duration-200 ${
            active 
                ? 'border-b-2 border-brand-accent text-brand-accent' 
                : 'text-brand-muted hover:text-brand-light'
        }`}
    >
        {name}
    </button>
);

// Info Tab Content
const InfoTab: React.FC<{ 
    store: Store, 
    status: { color: string, text: string },
    showReserveButton: boolean,
    onReserveClick: () => void
}> = ({ store, status, showReserveButton, onReserveClick }) => (
    <div className="space-y-4">
        <p className="text-brand-light leading-relaxed">{store.description}</p>
        
        <div className="border-t border-brand-accent/10 pt-4 space-y-3">
            <div className="flex items-center text-brand-light">
                <LocationMarkerIcon className="w-5 h-5 mr-3 text-brand-muted flex-shrink-0" />
                <span>{store.address}</span>
            </div>
             {store.phone && (
                <div className="flex items-center text-brand-light">
                    <PhoneIcon className="w-5 h-5 mr-3 text-brand-muted flex-shrink-0" />
                    <a href={`tel:${store.phone}`} className="hover:underline">{store.phone}</a>
                </div>
            )}
            {store.hours && (
                <div className="flex items-start text-brand-light">
                    <ClockIcon className="w-5 h-5 mr-3 text-brand-muted flex-shrink-0 mt-0.5" />
                    <span>{store.hours}</span>
                </div>
            )}
            {store.priceRange && (
                <div className="flex items-center text-brand-light">
                    <CurrencyDollarIcon className="w-5 h-5 mr-3 text-brand-muted flex-shrink-0" />
                    <span>{store.priceRange}</span>
                </div>
            )}
        </div>

        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
            <span className="font-semibold text-brand-light">{status.text}</span>
        </div>
        
        {showReserveButton && (
            <div className="pt-2">
                <button 
                    onClick={onReserveClick}
                    className="w-full bg-brand-brown-cta text-brand-text-on-accent font-bold py-3 px-4 rounded-lg hover:bg-brand-brown-cta-hover transition-colors"
                >
                    預約訂位
                </button>
            </div>
        )}
    </div>
);

// Menu Tab Content
const MenuTab: React.FC<{ menu: MenuItem[] }> = ({ menu }) => (
    <div className="space-y-3">
        {menu.length > 0 ? menu.map(item => (
            <div key={item.id} className="flex justify-between items-start bg-brand-primary p-3 rounded-md border border-brand-accent/20">
                <div>
                    <p className="font-semibold text-brand-light">{item.name}</p>
                    {item.description && <p className="text-sm text-brand-muted">{item.description}</p>}
                </div>
                <p className="font-semibold text-brand-light whitespace-nowrap pl-4">{item.price}</p>
            </div>
        )) : (
            <p className="text-brand-muted text-center py-4">店家尚未提供菜單。</p>
        )}
    </div>
);

// Reviews Tab Content
const ReviewsTab: React.FC<{ 
    reviews: Review[];
    currentUser: UserProfile | null;
    onUpdateReviews: (newReview: Review) => void;
}> = ({ reviews, currentUser, onUpdateReviews }) => {
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const { checkGuest } = useGuestGuard();
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        checkGuest(() => {
            if (!currentUser || newRating === 0 || newComment.trim() === '') return;
            
            const newReview: Review = {
                id: Date.now(),
                author: currentUser.name,
                rating: newRating,
                comment: newComment.trim(),
            };
            
            onUpdateReviews(newReview);

            // Reset form
            setNewRating(0);
            setNewComment('');
        });
    };

    const sortedReviews = [...reviews].sort((a, b) => b.id - a.id);

    return (
        <div className="space-y-4">
            {/* Always show form to allow clicks, handle restriction in submit */}
            <form onSubmit={handleSubmit} className="bg-brand-primary p-4 rounded-lg border-2 border-brand-accent/20">
                <h4 className="font-bold text-brand-light mb-2">新增你的評論</h4>
                <div className="flex items-center mb-3">
                    <span className="text-brand-muted text-sm mr-2">評分:</span>
                    {[...Array(5)].map((_, i) => (
                        <button type="button" key={i} onClick={() => setNewRating(i + 1)} aria-label={`Rate ${i + 1} stars`}>
                            <StarIcon className={`w-7 h-7 cursor-pointer transition-colors ${i < newRating ? 'text-yellow-400' : 'text-brand-muted/40 hover:text-yellow-300'}`} />
                        </button>
                    ))}
                </div>
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="分享你的體驗..."
                    className="w-full bg-brand-secondary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent mb-3"
                />
                <button 
                    type="submit" 
                    className="w-full bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
                >
                    送出評論
                </button>
            </form>

            {sortedReviews.length > 0 ? sortedReviews.map(review => (
                <div key={review.id} className="bg-brand-primary p-3 rounded-md border border-brand-accent/20">
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold text-brand-light">{review.author}</p>
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-brand-muted/50'}`} />
                            ))}
                        </div>
                    </div>
                    <p className="text-brand-light text-sm">{review.comment}</p>
                </div>
            )) : (
                <p className="text-brand-muted text-center py-4">成為第一個留下評論的人！</p>
            )}
        </div>
    );
};


export default StoreDetail;
