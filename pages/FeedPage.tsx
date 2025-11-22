
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_STORES } from '../constants';
import { FeedItem, Store, Comment, UserProfile } from '../types';
import FeedCard from '../components/FeedCard';
import { PencilSquareIcon, XIcon, ArrowPathIcon, ChevronDownIcon } from '../components/icons/ActionIcons';
import { FeedIcon } from '../components/icons/NavIcons';
import { feedApi, subscribeToFeed, userApi, updateUserProfile, addNotificationToUser } from '../utils/api';
import { useGuestGuard } from '../context/GuestGuardContext';

const CheckInModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onPost: (content: string, store: Store, imageUrl?: string, visibility?: 'public' | 'friends' | 'private') => void;
}> = ({ isOpen, onClose, onPost }) => {
    const [content, setContent] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isStoreListExpanded, setIsStoreListExpanded] = useState(true); // State for collapsible list

    const [stores] = useState<Store[]>(() => {
        const savedStores = localStorage.getItem('stores');
        const allStores = savedStores ? JSON.parse(savedStores) : MOCK_STORES;
        return allStores.filter((store: Store) => store.address.includes('台北市'));
    });

    useEffect(() => {
        if (!isOpen) {
            setContent('');
            setSelectedStoreId(null);
            setImagePreview(null);
            setVisibility('public');
            setIsStoreListExpanded(true); // Reset on close
        }
    }, [isOpen]);

    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            if (file.size > 10 * 1024 * 1024) {
                alert('圖片檔案過大，請選擇小於 10MB 的圖片。');
                return;
            }

            setIsProcessingImage(true);
            try {
                const resizedImage = await resizeImage(file);
                setImagePreview(resizedImage);
            } catch (error) {
                console.error("Image processing failed:", error);
                alert("圖片處理失敗，請稍後再試。");
            } finally {
                setIsProcessingImage(false);
            }
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
            onPost(content, store, imagePreview || undefined, visibility);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center px-4 pt-4 pb-20 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10 flex flex-col max-h-[85vh] overflow-y-auto">
                <div className="p-6 space-y-4">
                    <h2 className="text-xl font-bold text-brand-accent text-center">建立新動態</h2>
                    
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="分享你的心情...(選填)"
                        className="w-full h-24 bg-brand-primary border-2 border-brand-accent/50 rounded-lg p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors"
                    />
                    
                    <div>
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
                            disabled={isProcessingImage}
                        >
                            {isProcessingImage ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-brand-muted border-t-brand-light rounded-full animate-spin"></div>
                                    <span>處理中...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span>上傳照片</span>
                                </>
                            )}
                        </button>
                        
                        {imagePreview && (
                            <div className="mt-4 relative">
                                <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-40 rounded-lg object-cover" />
                                <button onClick={removeImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div>
                       <label className="block text-sm font-medium text-brand-light mb-2">隱私設定</label>
                       <div className="flex bg-brand-primary rounded-lg p-1 border border-brand-accent/20">
                           <button
                               onClick={() => setVisibility('public')}
                               className={`flex-1 py-1.5 rounded-md text-sm transition-colors font-medium ${visibility === 'public' ? 'bg-brand-accent text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-light'}`}
                           >
                              公開
                           </button>
                           <button
                               onClick={() => setVisibility('friends')}
                               className={`flex-1 py-1.5 rounded-md text-sm transition-colors font-medium ${visibility === 'friends' ? 'bg-brand-accent text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-light'}`}
                           >
                              僅好友
                           </button>
                           <button
                               onClick={() => setVisibility('private')}
                               className={`flex-1 py-1.5 rounded-md text-sm transition-colors font-medium ${visibility === 'private' ? 'bg-brand-accent text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-light'}`}
                           >
                              私人
                           </button>
                       </div>
                    </div>

                    <div>
                        <button 
                            type="button" 
                            onClick={() => setIsStoreListExpanded(!isStoreListExpanded)}
                            className="w-full flex justify-between items-center py-2"
                        >
                            <h3 className="font-semibold text-brand-light">選擇店家 (必填)</h3>
                            <ChevronDownIcon className={`w-6 h-6 text-brand-muted transition-transform duration-300 ${isStoreListExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isStoreListExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="border-2 border-brand-accent/20 rounded-lg bg-brand-primary p-2 space-y-2 max-h-[280px] overflow-y-auto">
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
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handlePostClick}
                            className="flex-1 bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
                        >
                            發佈
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeedPage: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Refresh Logic State
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [touchStart, setTouchStart] = useState(0);

    const navigate = useNavigate();
    const { checkGuest } = useGuestGuard();

    // Trigger refresh when prop changes (from Header button)
    useEffect(() => {
        if (refreshTrigger !== undefined && refreshTrigger > 0) {
            handleManualRefresh();
        }
    }, [refreshTrigger]);

    useEffect(() => {
        const savedStores = localStorage.getItem('stores');
        setStores(savedStores ? JSON.parse(savedStores) : MOCK_STORES);

        const profileData = localStorage.getItem('userProfile');
        const userProfile: UserProfile | null = profileData ? JSON.parse(profileData) : null;
        setCurrentUser(userProfile);
        
        if (userProfile) {
             setLoading(true);
             const unsubscribe = subscribeToFeed(String(userProfile.id), (items) => {
                 // Filter items based on visibility
                 const visibleItems = items.filter(item => {
                     const isAuthor = String(item.authorId) === String(userProfile.id);
                     if (item.visibility === 'private') {
                         return isAuthor;
                     }
                     if (item.visibility === 'friends') {
                         const isFriend = (userProfile.friends || []).some(fId => String(fId) === String(item.authorId));
                         return isAuthor || isFriend;
                     }
                     // Public items are visible to everyone
                     return true;
                 });

                 setFeedItems(visibleItems);
                 setLoading(false);
                 
                 // Delay clearing refreshing state slightly for better visual feedback
                 if (isRefreshing) {
                     setTimeout(() => {
                         setIsRefreshing(false);
                         setPullDistance(0);
                     }, 500);
                 }
             });
             return () => unsubscribe();
        } else {
             setLoading(false);
        }
    }, [refreshKey]); // Re-run when refreshKey changes


    const handlePost = async (content: string, store: Store, imageUrl?: string, visibility: 'public' | 'friends' | 'private' = 'public') => {
        if (!currentUser) return;
        setIsModalOpen(false);

        try {
            // 呼叫後端 API 建立貼文
            // 我們傳遞 content, storeName, imageUrl, visibility
            await userApi.createPost(content, store.name, imageUrl, visibility);

            // 更新本地狀態 (打卡數+1)
            const updatedCheckIns = (currentUser.checkIns || 0) + 1;
            const updatedProfile = { ...currentUser, checkIns: updatedCheckIns };
            setCurrentUser(updatedProfile);
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
            
            if (!currentUser.isGuest && currentUser.id !== 0) {
                await updateUserProfile(String(currentUser.id), { checkIns: updatedCheckIns });
                // 發送即時通知
                addNotificationToUser(String(currentUser.id), "發布成功：您的動態已發布。", "動態通知");
            }

            // 強制重新整理列表以顯示新貼文
            handleManualRefresh();

        } catch (e) {
            console.error("Post failed", e);
            alert("發布失敗，請檢查網路連線。");
        }
    };

    const handleToggleLike = async (itemId: number | string) => {
        checkGuest(async () => {
            if (!currentUser) return;
            const currentItem = feedItems.find(item => String(item.id) === String(itemId));
            const isCurrentlyLiked = currentItem?.isLiked || false;
            setFeedItems(prev => prev.map(item => String(item.id) === String(itemId) ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 } : item));
            await feedApi.toggleLike(itemId, currentUser.id, isCurrentlyLiked);
        });
    };

    const handleAddComment = async (itemId: number | string, commentText: string, storeName?: string) => {
        checkGuest(async () => {
            if (!currentUser) return;
            
            const newComment: Comment = {
                id: `local-${Date.now()}`,
                authorName: currentUser.name,
                authorAvatarUrl: currentUser.avatarUrl,
                text: commentText,
                timestamp: new Date().toISOString(),
                storeName,
            };

             setFeedItems(prev => prev.map(item => String(item.id) === String(itemId) ? { ...item, comments: [...(item.comments || []), newComment] } : item));

             if (storeName) {
                const updatedCheckIns = (currentUser.checkIns || 0) + 1;
                const updatedProfile = { ...currentUser, checkIns: updatedCheckIns };
                setCurrentUser(updatedProfile);
                localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                if (!currentUser.isGuest) {
                    await updateUserProfile(String(currentUser.id), { checkIns: updatedCheckIns });
                }
             }

            await feedApi.addComment(itemId, newComment);
            
            // Instant Notification for User
            const targetPost = feedItems.find(i => String(i.id) === String(itemId));
            if (targetPost) {
                const authorName = targetPost.friendName || "用戶";
                addNotificationToUser(String(currentUser.id), `留言成功：您在 ${authorName} 的貼文中留言。`, "社群互動");
            }
        });
    };

    // Refresh Handlers
    const handleManualRefresh = () => {
        setIsRefreshing(true);
        setRefreshKey(prev => prev + 1);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only enable pull to refresh if we are at the top of the scroll
        if (window.scrollY === 0) {
            setTouchStart(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStart > 0 && window.scrollY === 0) {
            const touchY = e.touches[0].clientY;
            const diff = touchY - touchStart;
            
            // Only trigger if pulling down
            if (diff > 0) {
                // Add resistance/damping
                const dampedDiff = Math.min(diff * 0.5, 150); // Max 150px visual pull
                setPullDistance(dampedDiff);
            }
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 80) { // Threshold to trigger refresh
            setIsRefreshing(true);
            setPullDistance(80); // Snap to loading position
            setRefreshKey(prev => prev + 1);
        } else {
            // Snap back
            setPullDistance(0);
        }
        setTouchStart(0);
    };

    if (loading && !isRefreshing && feedItems.length === 0) {
        return <div className="text-center p-10 text-brand-accent">載入動態中...</div>;
    }

    return (
        <div 
            className="space-y-6 relative min-h-[calc(100vh-150px)]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to Refresh Indicator */}
            <div 
                className="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none transition-transform duration-200"
                style={{ 
                    transform: `translateY(${pullDistance > 0 ? pullDistance - 40 : -40}px)`,
                    opacity: pullDistance > 0 ? Math.min(pullDistance / 40, 1) : 0
                }}
            >
                <div className="bg-brand-secondary rounded-full p-2 shadow-md border border-brand-accent/20">
                    <ArrowPathIcon className={`w-6 h-6 text-brand-accent ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
                </div>
            </div>

            {/* Feed Content with Transform */}
            <div 
                className="transition-transform duration-200 ease-out"
                style={{ transform: `translateY(${pullDistance}px)` }}
            >
                {feedItems.length > 0 ? (
                    <div className="space-y-4 pb-20 pt-2">
                        {feedItems.map(item => (
                            <FeedCard 
                                key={item.clientSideId || item.id} 
                                item={item} 
                                onToggleLike={handleToggleLike} 
                                onAddComment={handleAddComment}
                                currentUserProfile={currentUser}
                                stores={stores}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 flex flex-col items-center justify-center h-full opacity-50 min-h-[50vh]">
                        <FeedIcon />
                        <p className="mt-4 text-brand-muted">目前沒有動態</p>
                        <button onClick={handleManualRefresh} className="mt-4 text-brand-accent hover:underline">
                            重新整理
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => checkGuest(() => setIsModalOpen(true))}
                className="fixed bottom-24 right-6 w-14 h-14 bg-brand-accent text-brand-primary rounded-full shadow-xl flex items-center justify-center hover:bg-opacity-90 transition-transform hover:scale-110 z-20"
                aria-label="新增動態"
            >
                <PencilSquareIcon className="w-6 h-6" />
            </button>

            <CheckInModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPost={handlePost}
            />
        </div>
    );
};

export default FeedPage;
