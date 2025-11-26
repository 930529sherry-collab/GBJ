import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeedItem, Store, Comment, UserProfile } from '../types';
import FeedCard from '../components/FeedCard';
import { PencilSquareIcon, XIcon, ArrowPathIcon, ChevronDownIcon } from '../components/icons/ActionIcons';
import { FeedIcon } from '../components/icons/NavIcons';
import { feedApi, subscribeToFeed, userApi, updateUserProfile, addNotificationToUser, updateAllMissionProgress, getStores, addCheckInRecord } from '../utils/api';
import { useGuestGuard } from '../context/GuestGuardContext';

const CheckInModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onPost: (content: string, store: Store, imageUrl?: string, visibility?: 'public' | 'friends' | 'private') => void;
}> = ({ isOpen, onClose, onPost }) => {
    const [content, setContent] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState<number | string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isStoreListExpanded, setIsStoreListExpanded] = useState(true);

    const [stores, setStores] = useState<Store[]>([]);

    useEffect(() => {
        if (isOpen) {
            getStores().then(fetchedStores => {
                setStores(fetchedStores);
            }).catch(err => {
                console.error("Failed to load stores for check-in modal", err);
                setStores([]);
            });
        } else {
            // Reset state when modal closes
            setContent(''); setSelectedStoreId(null); setImagePreview(null); setVisibility('public'); setIsStoreListExpanded(true);
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
                        return reject(new Error('Failed to get canvas context'));
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Looser check here because we are resizing
            if (file.size > 10 * 1024 * 1024) { // 10MB
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="分享你的心情...(選填)" className="w-full h-24 bg-brand-primary border-2 border-brand-accent/50 rounded-lg p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors" />
                    <div>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-brand-primary border-2 border-brand-accent/50 text-brand-light py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors" disabled={isProcessingImage}>
                            {isProcessingImage ? '處理中...' : (imagePreview ? '更換照片' : '上傳照片')}
                        </button>
                        {imagePreview && (
                            <div className="mt-4 relative">
                                <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-40 rounded-lg object-cover" />
                                <button onClick={removeImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"><XIcon className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-brand-light mb-2">隱私設定</label>
                       <div className="flex bg-brand-primary rounded-lg p-1 border border-brand-accent/20">
                           <button onClick={() => setVisibility('public')} className={`flex-1 py-1.5 rounded-md text-sm transition-colors font-medium ${visibility === 'public' ? 'bg-brand-accent text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-light'}`}>公開</button>
                           <button onClick={() => setVisibility('friends')} className={`flex-1 py-1.5 rounded-md text-sm transition-colors font-medium ${visibility === 'friends' ? 'bg-brand-accent text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-light'}`}>僅好友</button>
                           <button onClick={() => setVisibility('private')} className={`flex-1 py-1.5 rounded-md text-sm transition-colors font-medium ${visibility === 'private' ? 'bg-brand-accent text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-light'}`}>私人</button>
                       </div>
                    </div>
                    <div>
                        <button type="button" onClick={() => setIsStoreListExpanded(!isStoreListExpanded)} className="w-full flex justify-between items-center py-2">
                            <h3 className="font-semibold text-brand-light">選擇店家 (必填)</h3>
                            <ChevronDownIcon className={`w-6 h-6 text-brand-muted transition-transform duration-300 ${isStoreListExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isStoreListExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="border-2 border-brand-accent/20 rounded-lg bg-brand-primary p-2 space-y-2 max-h-[280px] overflow-y-auto">
                                {stores.map(store => (<label key={store.id} className="flex items-center p-2 rounded-md hover:bg-brand-accent/10 cursor-pointer"><input type="radio" name="store" checked={selectedStoreId === store.id} onChange={() => setSelectedStoreId(store.id)} className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-brand-muted" /><span className="ml-3 text-brand-light">{store.name}</span></label>))}
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-4">
                        <button onClick={onClose} className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors">取消</button>
                        <button onClick={handlePostClick} disabled={!selectedStoreId} className="flex-1 bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted/50 disabled:cursor-not-allowed">發佈</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; }> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10">
                <h2 className="text-xl font-bold text-brand-accent mb-4 text-center">刪除貼文</h2>
                <p className="text-brand-muted mb-6 text-center">確定要刪除這則貼文嗎？<br/>此操作無法復原。</p>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light font-semibold py-2 px-4 rounded-lg hover:bg-brand-accent/10">
                        取消
                    </button>
                    <button onClick={onConfirm} className="flex-1 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">
                        確認刪除
                    </button>
                </div>
            </div>
        </div>
    );
};

const FeedPage: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | number | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [touchStart, setTouchStart] = useState(0);

    const { checkGuest } = useGuestGuard();

    useEffect(() => { if (refreshTrigger !== undefined && refreshTrigger > 0) handleManualRefresh(); }, [refreshTrigger]);
    
    useEffect(() => {
        const profileData = localStorage.getItem('userProfile');
        const userProfile: UserProfile | null = profileData ? JSON.parse(profileData) : null;
        setCurrentUser(userProfile);
        if (userProfile) {
             setLoading(true);
             const unsubscribe = subscribeToFeed(String(userProfile.id), (items) => {
                 setFeedItems(items); setLoading(false);
                 if (isRefreshing) setTimeout(() => { setIsRefreshing(false); setPullDistance(0); }, 500);
             });
             return () => unsubscribe();
        } else { setLoading(false); }
    }, [refreshKey]);

    const handlePost = async (content: string, store: Store, imageUrl?: string, visibility: 'public' | 'friends' | 'private' = 'public') => {
        if (!currentUser) return;
        setIsModalOpen(false);
        try {
            await userApi.createPost(currentUser, content, store, imageUrl, visibility);
            
            await addCheckInRecord(String(currentUser.id), store.id, store.name);
            
            if (!currentUser.isGuest) {
                await addNotificationToUser(String(currentUser.id), "發布成功：您的動態已發布。", "動態通知");
                await updateAllMissionProgress(currentUser.id);
            }
            handleManualRefresh();
        } catch (e: any) {
            console.error("Post failed", e);
            alert(`發布失敗：${e.message || "請稍後再試"}`);
        }
    };

    const handleToggleLike = async (itemId: number | string) => {
        checkGuest(async () => {
            const item = feedItems.find(i => i.id === itemId);
            if (!item || !currentUser) return;
            const isCurrentlyLiked = item.isLiked;
            setFeedItems(prev => prev.map(i => i.id === itemId ? { ...i, isLiked: !i.isLiked, likes: i.isLiked ? i.likes - 1 : i.likes + 1 } : i));
            await feedApi.toggleLike(item, String(currentUser.id), isCurrentlyLiked);
        });
    };
    
    const handleAddComment = async (itemId: number | string, commentText: string, storeName?: string) => {
        checkGuest(async () => {
            const item = feedItems.find(i => i.id === itemId);
            if (!item || !currentUser) return;
            
            if (storeName) {
                const stores = await getStores();
                const store = stores.find(s => s.name === storeName);
                if (store) {
                    await addCheckInRecord(String(currentUser.id), store.id, store.name);
                }
            }

            const newComment: Comment = {
                id: `local-${Date.now()}`, authorId: currentUser.id,
                authorName: currentUser.displayName || currentUser.name || '用戶',
                authorAvatarUrl: currentUser.avatarUrl, text: commentText,
                timestamp: new Date().toISOString(), storeName,
            };
            setFeedItems(prev => prev.map(i => i.id === itemId ? { ...i, comments: [...(i.comments || []), newComment] } : i));
            await feedApi.addComment(item, newComment);
            
            if (!currentUser.isGuest) {
                 await updateAllMissionProgress(currentUser.id);
            }
        });
    };
    
    const handleDeleteRequest = (itemId: string | number) => {
        setPostToDelete(itemId);
        setDeleteModalOpen(true);
    };
    
    const handleConfirmDelete = async () => {
        if (!postToDelete || !currentUser) return;
        try {
            await feedApi.deletePost(String(postToDelete));
            setFeedItems(prev => prev.filter(item => item.id !== postToDelete));
            await addNotificationToUser(String(currentUser.id), '您的貼文已成功刪除。', '系統通知');
        } catch (error) {
            console.error("Failed to delete post:", error);
            alert("刪除失敗，請稍後再試。");
        } finally {
            setPostToDelete(null);
            setDeleteModalOpen(false);
        }
    };
    
    const handleManualRefresh = () => { setIsRefreshing(true); setRefreshKey(prev => prev + 1); };
    
    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            setTouchStart(e.touches[0].clientY);
        }
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        const pullDist = e.touches[0].clientY - touchStart;
        if (pullDist > 0 && touchStart > 0) {
            e.preventDefault();
            const dampenedPull = Math.pow(pullDist, 0.7);
            setPullDistance(dampenedPull);
        }
    };
    
    const handleTouchEnd = () => {
        setTouchStart(0);
        if (pullDistance > 80) {
            setIsRefreshing(true);
            setRefreshKey(prev => prev + 1);
        } else {
            setPullDistance(0);
        }
    };

    if (loading && !isRefreshing && feedItems.length === 0) return <div className="text-center p-10 text-brand-accent">載入動態中...</div>;

    return (
        <div className="space-y-6 relative min-h-[calc(100vh-150px)]" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
             <div className={`fixed top-16 left-0 right-0 h-12 flex justify-center items-center transition-opacity duration-300 ${isRefreshing && pullDistance > 0 ? 'opacity-100' : 'opacity-0'}`} style={{ transform: `translateY(${Math.min(pullDistance, 50) - 50}px)` }}>
                <ArrowPathIcon className="w-6 h-6 text-brand-accent animate-spin" />
            </div>
            <div className="transition-transform duration-200 ease-out" style={{ transform: `translateY(${pullDistance}px)` }}>
                {feedItems.length > 0 ? (
                    <div className="space-y-4 pb-20 pt-2">
                        {feedItems.map(item => (
                            <FeedCard key={item.clientSideId || item.id} item={item} onToggleLike={handleToggleLike} onAddComment={handleAddComment} currentUserProfile={currentUser} onDeleteRequest={handleDeleteRequest} />
                        ))}
                    </div>
                ) : ( <div className="text-center p-10 opacity-50 min-h-[50vh]"><FeedIcon /><p className="mt-4 text-brand-muted">目前沒有動態</p></div> )}
            </div>
            <button onClick={() => checkGuest(() => setIsModalOpen(true))} className="fixed bottom-24 right-6 w-14 h-14 bg-brand-accent text-brand-primary rounded-full shadow-xl flex items-center justify-center hover:bg-opacity-90 transition-transform hover:scale-110 z-20" aria-label="新增動態"><PencilSquareIcon className="w-6 h-6" /></button>
            <CheckInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPost={handlePost} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleConfirmDelete} />
        </div>
    );
};

export default FeedPage;