

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOCK_FEED_ITEMS, MOCK_STORES, MOCK_MISSIONS } from '../constants';
import { FeedItem, Store, Comment, UserProfile, Mission } from '../types';
import FeedCard from '../components/FeedCard';
import { PencilSquareIcon, XIcon } from '../components/icons/ActionIcons';
import { FeedIcon } from '../components/icons/NavIcons';

const CheckInModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onPost: (content: string, store: Store, imageUrl?: string) => void;
}> = ({ isOpen, onClose, onPost }) => {
    const [content, setContent] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stores] = useState<Store[]>(() => {
        const savedStores = localStorage.getItem('stores');
        const allStores = savedStores ? JSON.parse(savedStores) : MOCK_STORES;
        return allStores.filter(store => store.address.includes('台北市'));
    });

    useEffect(() => {
        if (!isOpen) {
            setContent('');
            setSelectedStoreId(null);
            setImagePreview(null);
        }
    }, [isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const removeImage = () => {
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handlePostClick = () => {
        const store = stores.find(s => s.id === selectedStoreId);
        if (store) {
            onPost(content, store, imagePreview || undefined);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10 flex flex-col max-h-[90vh]">
                <>
                    <h2 className="text-xl font-bold text-brand-accent mb-4 text-center">建立新動態</h2>
                    
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="分享你的心情...(選填)"
                        className="w-full h-24 bg-brand-primary border-2 border-brand-accent/50 rounded-lg p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors mb-4"
                    />
                    
                    <div className="mb-4">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            className="hidden" 
                            accept="image/*" 
                        />
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 bg-brand-primary border-2 border-brand-accent/50 text-brand-light py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            上傳照片
                        </button>
                        <p className="text-xs text-center text-brand-muted mt-2">大小僅限1:1之圖像</p>
                        {imagePreview && (
                            <div className="mt-4 relative">
                                <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-40 rounded-lg object-cover" />
                                <button onClick={removeImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>


                    <h3 className="font-semibold text-brand-light mb-2">選擇店家 (必填)</h3>
                    <div className="flex-grow overflow-y-auto border-2 border-brand-accent/20 rounded-lg bg-brand-primary p-2 space-y-2 mb-4">
                        {stores.map(store => (
                            <label key={store.id} className="flex items-center p-2 rounded-md hover:bg-brand-accent/10 cursor-pointer">
                                <input
                                    type="radio"
                                    name="store"
                                    checked={selectedStoreId === store.id}
                                    onChange={() => setSelectedStoreId(store.id)}
                                    className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-brand-muted"
                                />
                                <span className="ml-3 text-brand-light">{store.name}</span>
                            </label>
                        ))}
                    </div>

                    <div className="flex gap-4 mt-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handlePostClick}
                            disabled={!selectedStoreId}
                            className="flex-1 bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted/50"
                        >
                            發佈
                        </button>
                    </div>
                </>
            </div>
        </div>
    );
};

const FeedPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    const [stores] = useState<Store[]>(() => {
        const savedStores = localStorage.getItem('stores');
        const allStores = savedStores ? JSON.parse(savedStores) : MOCK_STORES;
        return allStores.filter(store => store.address.includes('台北市'));
    });

    useEffect(() => {
        const profileData = localStorage.getItem('userProfile');
        const user = profileData ? JSON.parse(profileData) : null;
        setCurrentUser(user);

        // Filter feed items based on the current user's friend list
        const friendIds = user ? [...user.friends, user.id] : []; // Include user's own posts
        const savedFeedItems = localStorage.getItem('feedItems');
        const allFeedItems = savedFeedItems ? JSON.parse(savedFeedItems) : MOCK_FEED_ITEMS;
        
        const relevantFeed = allFeedItems.filter((item: FeedItem) => friendIds.includes(item.friendId))
            .sort((a: FeedItem, b: FeedItem) => b.id - a.id); // Sort by newest first

        setFeedItems(relevantFeed);
        setLoading(false);
    }, [location]);

    const updateGlobalFeed = (updater: (feed: FeedItem[]) => FeedItem[]) => {
        const allFeedItems = localStorage.getItem('feedItems') ? JSON.parse(localStorage.getItem('feedItems')!) : MOCK_FEED_ITEMS;
        const updatedAllFeedItems = updater(allFeedItems);
        localStorage.setItem('feedItems', JSON.stringify(updatedAllFeedItems));
        setFeedItems(prev => updater(prev).sort((a,b) => b.id - a.id));
    };

    const handleToggleLike = (itemId: number) => {
        updateGlobalFeed(allFeedItems =>
            allFeedItems.map(item =>
                item.id === itemId
                    ? {
                        ...item,
                        isLiked: !item.isLiked,
                        likes: item.isLiked ? item.likes - 1 : item.likes + 1,
                      }
                    : item
            )
        );
    };

    const handleAddComment = (itemId: number, commentText: string, storeName?: string) => {
        if (!currentUser) return;
        const newComment: Comment = {
            id: Date.now(),
            authorName: currentUser.name,
            authorAvatarUrl: currentUser.avatarUrl,
            text: commentText,
            timestamp: '剛剛',
            storeName,
        };

        updateGlobalFeed(allFeedItems =>
            allFeedItems.map(item =>
                item.id === itemId
                    ? { ...item, comments: [...item.comments, newComment] }
                    : item
            )
        );
    };

    const updateMissionProgress = (checkInItem: FeedItem, checkedInStore: Store) => {
        if (!currentUser) return;

        const missions: Mission[] = JSON.parse(localStorage.getItem('missions') || JSON.stringify(MOCK_MISSIONS));
        const allFeedItems: FeedItem[] = JSON.parse(localStorage.getItem('feedItems') || '[]');
        let userProfile: UserProfile = JSON.parse(localStorage.getItem('userProfile')!);

        userProfile.checkIns += 1;

        const userCheckIns = allFeedItems.filter(
            item => item.friendId === currentUser.id && item.type === 'check-in'
        );
        
        const updatedMissions = missions.map(mission => {
            if (mission.claimed) return mission;

            let newProgress = mission.progress;

            switch (mission.id) {
                case 1: // '探險家': 一晚在3家不同的酒吧打卡。
                    {
                        const today = new Date(checkInItem.id).toDateString();
                        const checkInsToday = userCheckIns.filter(
                            item => new Date(item.id).toDateString() === today
                        );
                        const uniqueStoresToday = new Set(checkInsToday.map(item => item.storeName));
                        newProgress = uniqueStoresToday.size;
                    }
                    break;
                case 4: // '初來乍到': 完成你的第一次酒吧打卡。
                    {
                        // This is the first check-in ever for the user
                        if (userCheckIns.length === 1) {
                            newProgress = 1;
                        }
                    }
                    break;
                case 5: // '忠實顧客': 在同一家酒吧打卡 5 次。
                    {
                        const countForThisStore = userCheckIns.filter(
                            item => item.storeName === checkedInStore.name
                        ).length;
                        newProgress = countForThisStore;
                    }
                    break;
                case 8: // '週五狂熱夜': 在週五晚上打卡。
                    {
                        const checkInDay = new Date(checkInItem.id).getDay(); // 0=Sun, 5=Fri
                        if (checkInDay === 5 && newProgress < mission.goal) {
                            newProgress = 1;
                        }
                    }
                    break;
                case 10: // 'Speakeasy 獵人': 在任一 Speakeasy 酒吧打卡。
                    {
                        if (checkedInStore.type.toLowerCase().includes('speakeasy') && newProgress < mission.goal) {
                            newProgress = 1;
                        }
                    }
                    break;
                case 11: // '早鳥優惠': 在歡樂時光 (Happy Hour) 期間打卡。
                    {
                        const checkInHour = new Date(checkInItem.id).getHours();
                        // Assuming happy hour is 5pm to 7pm (17:00-19:00)
                        if (checkInHour >= 17 && checkInHour < 19 && newProgress < mission.goal) {
                            newProgress = 1;
                        }
                    }
                    break;
                case 12: // '終極探險家': 總共在 10 家不同的酒吧打卡。
                    {
                        const uniqueStoresTotal = new Set(userCheckIns.map(item => item.storeName));
                        newProgress = uniqueStoresTotal.size;
                    }
                    break;
                default:
                    break;
            }
            
            return { ...mission, progress: Math.min(newProgress, mission.goal) };
        });

        localStorage.setItem('missions', JSON.stringify(updatedMissions));
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
    };

    const handlePost = (content: string, store: Store, imageUrl?: string) => {
        if (!currentUser) return;

        const newFeedItem: FeedItem = {
            id: Date.now(),
            friendId: currentUser.id, // User's own post
            friendName: currentUser.name,
            friendAvatarUrl: currentUser.avatarUrl,
            type: 'check-in',
            content: content.trim(),
            storeName: store.name,
            imageUrl,
            timestamp: '剛剛',
            likes: 0,
            isLiked: false,
            comments: [],
        };
        
        const allFeedItems = localStorage.getItem('feedItems') ? JSON.parse(localStorage.getItem('feedItems')!) : MOCK_FEED_ITEMS;
        const updatedFeed = [newFeedItem, ...allFeedItems];
        localStorage.setItem('feedItems', JSON.stringify(updatedFeed));

        setFeedItems(prev => [newFeedItem, ...prev].sort((a,b) => b.id - a.id));
        
        updateMissionProgress(newFeedItem, store);
        
        setIsModalOpen(false);
    };

    if (loading || !currentUser) {
        return <div className="text-center p-10 text-brand-accent">正在載入好友動態...</div>;
    }

    return (
        <div className="space-y-4">
            <div 
              className="bg-brand-secondary p-4 rounded-xl border-2 border-brand-accent/20 shadow-lg shadow-brand-accent/10 flex items-center gap-4 cursor-pointer hover:bg-brand-primary/80 transition-all duration-200"
              onClick={() => setIsModalOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
              aria-label="Create new post"
            >
              <img src={currentUser.avatarUrl} alt="Your avatar" className="w-12 h-12 rounded-full object-cover" />
              <div className="flex-grow text-brand-muted">今天喝什麼？分享你的動態...</div>
              <PencilSquareIcon className="w-8 h-8 text-brand-accent flex-shrink-0" />
            </div>

            {feedItems.length > 0 ? (
                feedItems.map(item => (
                    <FeedCard 
                        key={item.id} 
                        item={item} 
                        onToggleLike={handleToggleLike}
                        onAddComment={handleAddComment}
                        currentUserProfile={currentUser}
                        stores={stores}
                    />
                ))
            ) : (
                <div className="text-center p-10 flex flex-col items-center justify-center h-full animate-fade-in bg-brand-secondary rounded-xl border-2 border-brand-accent/20">
                    <FeedIcon />
                    <h2 className="text-xl font-bold text-brand-light mt-4 mb-2">動態牆空空如也</h2>
                    <p className="text-brand-muted mb-6">新增一些好友，看看他們都在做什麼吧！</p>
                    <button
                        onClick={() => navigate('/add-friend')}
                        className="bg-brand-accent text-brand-primary font-bold py-2 px-6 rounded-lg hover:bg-opacity-80 transition-colors"
                    >
                        去找朋友
                    </button>
                </div>
            )}
            
            <CheckInModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPost={handlePost}
            />
        </div>
    );
};

export default FeedPage;