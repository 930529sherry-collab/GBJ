
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FriendProfile, UserProfile, FeedItem, Comment, Store } from '../types';
import { BackIcon, XIcon } from '../components/icons/ActionIcons';
import FeedCard from '../components/FeedCard';
import { MOCK_STORES } from '../constants';
import { getFriends, getUserFeed, feedApi, getUserProfile, userApi, addNotificationToUser, addCheckInRecord, updateAllMissionProgress, getStores } from '../utils/api';

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
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

const FriendProfilePage: React.FC = () => {
    const { uid } = useParams<{ uid: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [friendFeed, setFriendFeed] = useState<FeedItem[]>([]);
    const [canViewProfile, setCanViewProfile] = useState(false);
    const [visibilityMessage, setVisibilityMessage] = useState('');
    const [pendingFriendIds, setPendingFriendIds] = useState<Array<string|number>>([]);
    const [requestError, setRequestError] = useState('');

    // Delete Modal State
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | number | null>(null);

    useEffect(() => {
        const fetchFriendProfile = async () => {
            setLoading(true);
            const friendId = uid || '0';
            const currentUserData = localStorage.getItem('userProfile');
            
            const currentUserProfile: UserProfile | null = currentUserData ? JSON.parse(currentUserData) : null;
            setCurrentUser(currentUserProfile);

            if (currentUserProfile) {
                try {
                    const viewedProfile = await getUserProfile(friendId);
                    
                    if (viewedProfile) {
                        const owner = viewedProfile;
                        const viewer = currentUserProfile;

                        let isAllowed = false;
                        let message = '';
                        
                        const isOwner = String(owner.id) === String(viewer.id);
                        const visibility = owner.profileVisibility || 'friends';

                        if (isOwner) {
                            isAllowed = true;
                        } else {
                            if (visibility === 'public') {
                                isAllowed = true;
                            } else if (visibility === 'friends') {
                                const isFriend = (owner.friends || []).some(fId => String(fId) === String(viewer.id));
                                if (isFriend) {
                                    isAllowed = true;
                                } else {
                                    message = '此用戶的檔案僅限好友觀看。';
                                }
                            } else {
                                message = '此用戶的檔案為私密。';
                            }
                        }

                        setCanViewProfile(isAllowed);
                        setVisibilityMessage(message);

                        if (isAllowed) {
                            const friendActivity = await getUserFeed(friendId);
                            setFriendFeed(friendActivity);
                        } else {
                            setFriendFeed([]);
                        }
                        
                        setProfile(owner);
                    } else {
                        setProfile(null);
                    }
                } catch (error: any) {
                    const errorMessage = error.message || String(error);
                    if (errorMessage.includes("User profile not found")) {
                        console.warn("Friend profile not found (invalid ID or deleted user)");
                    } else {
                        console.error("Failed to fetch friend profile:", error);
                    }
                    setProfile(null);
                }
            }
            setLoading(false);
        };
        fetchFriendProfile();
    }, [uid]);
    
    const handleToggleLike = async (itemId: number | string) => {
        if (currentUser) {
             const currentItem = friendFeed.find(item => String(item.id) === String(itemId));
             if (!currentItem) return;
             const isLiked = currentItem.isLiked || false;

             setFriendFeed(prev => prev.map(item => 
                item.id === itemId 
                    ? { ...item, likes: item.isLiked ? item.likes - 1 : item.likes + 1, isLiked: !item.isLiked } 
                    : item
             ));

             await feedApi.toggleLike(currentItem, String(currentUser.id), isLiked);
        }
    };

    const handleAddComment = async (itemId: number | string, commentText: string, storeName?: string) => {
        if (!currentUser) return;

        if (storeName) {
            try {
                const stores = await getStores();
                const store = stores.find(s => s.name === storeName);
                if (store) {
                    await addCheckInRecord(String(currentUser.id), store.id, store.name);
                }
            } catch (error) {
                console.error("Failed to fetch stores for check-in record:", error);
            }
        }
        
        const newComment: Comment = {
            id: Date.now(),
            authorId: currentUser.id,
            authorName: currentUser.displayName || currentUser.name || '用戶',
            authorAvatarUrl: currentUser.avatarUrl,
            text: commentText,
            timestamp: new Date().toISOString(),
            storeName,
        };
        
        setFriendFeed(prev => prev.map(item => 
            item.id === itemId 
                ? { ...item, comments: [...(item.comments || []), newComment] } 
                : item
        ));
        
        const item = friendFeed.find(item => item.id === itemId);
        if (item) {
            await feedApi.addComment(item, newComment);
        }

        if (!currentUser.isGuest) {
            await updateAllMissionProgress(currentUser.id);
        }
    };

    const handleAddFriend = async (friendId: string | number) => {
        if (!currentUser || !profile || pendingFriendIds.includes(friendId)) return;
        
        setPendingFriendIds(prev => [...prev, friendId]);
        setRequestError('');

        try {
// @-fix: Argument of type 'string | number' is not assignable to parameter of type 'string'.
            await userApi.sendFriendRequest(String(friendId));
            
            const friendName = profile.displayName || profile.name || '該用戶';
            await addNotificationToUser(
                String(currentUser.id),
                `好友邀請已發送給 ${friendName}。`,
                '好友通知'
            );

        } catch (error: any) {
            console.error('Failed to send friend request from profile:', error);
            const errorMessage = (error.message || String(error)).toLowerCase();

            if (errorMessage.includes('request already sent') || errorMessage.includes('already pending')) {
                setRequestError('邀請已在等待對方確認中。');
            } else {
                setRequestError('發送邀請失敗，請稍後再試。');
                setPendingFriendIds(prev => prev.filter(id => id !== friendId));
            }
            setTimeout(() => setRequestError(''), 3000);
        }
    };
    
    const handleDeleteRequest = (itemId: string | number) => {
        setPostToDelete(itemId);
        setDeleteModalOpen(true);
    };
    
    const handleConfirmDelete = async () => {
        if (!postToDelete || !currentUser) return;
        
        try {
            await feedApi.deletePost(String(postToDelete));
            setFriendFeed(prev => prev.filter(item => item.id !== postToDelete));

            await addNotificationToUser(String(currentUser.id), '您的貼文已成功刪除。', '系統通知');

        } catch (error) {
            console.error("Failed to delete post:", error);
            alert("刪除失敗，請稍後再試。");
        } finally {
            setPostToDelete(null);
            setDeleteModalOpen(false);
        }
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">讀取檔案中...</div>;
    }

    if (!profile) {
        return (
            <div className="text-center p-10 text-brand-muted">
                <p>找不到這位用戶的檔案。</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-brand-accent font-semibold">返回</button>
            </div>
        );
    }
    
    const xpPercentage = (profile.xp / profile.xpToNextLevel) * 100;
    const isFriend = currentUser?.friends.some(fid => String(fid) === String(profile.id));
    const isSelf = String(currentUser?.id) === String(profile.id);
    const isPending = pendingFriendIds.includes(profile.id);

    return (
        <div className="animate-fade-in">
            <div className="mb-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>
            <div className="space-y-6">
                <div className="flex flex-col items-center space-y-2 p-6 bg-brand-secondary rounded-2xl border-2 border-brand-accent/20 relative">
                    {!isFriend && !isSelf && (
                        <span className="absolute top-4 right-4 text-xs font-bold bg-brand-primary px-2 py-1 rounded text-brand-muted border border-brand-accent/20">
                            非好友
                        </span>
                    )}
                    <img src={profile.avatarUrl} alt={profile.name} className="w-28 h-28 rounded-full object-cover border-4 border-brand-accent shadow-lg shadow-brand-accent/30 mb-2" />
                    <h2 className="text-3xl font-bold text-brand-light">
                        {profile.displayName || profile.name || (profile.email && typeof profile.email === 'string' ? profile.email.split('@')[0] : '用戶')}
                    </h2>

                    {!isSelf && !isFriend && (
                        <div className="mt-4 w-full max-w-xs">
                            <button
                                onClick={() => handleAddFriend(profile.id)}
                                disabled={isPending || !!requestError}
                                className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted disabled:cursor-wait"
                            >
                                {isPending ? '已邀請' : (requestError ? '邀請待確認' : '新增好友')}
                            </button>
                            {requestError && <p className="text-center text-sm text-yellow-500 mt-2">{requestError}</p>}
                        </div>
                    )}

                    {canViewProfile ? (
                        <>
                             <div className="text-center text-sm text-brand-muted mb-2">
                                 {profile.email && <p>{profile.email}</p>}
                                 {profile.phone && <p>{profile.phone}</p>}
                            </div>
                            <div className="w-full text-center pt-4">
                                <p className="text-brand-accent font-semibold">等級 {profile.level}</p>
                                <div className="w-full bg-brand-primary rounded-full h-2.5 my-2 border border-brand-accent/20">
                                     <div className="bg-brand-accent h-2 rounded-full m-px" style={{ width: `calc(${xpPercentage}% - 2px)` }}></div>
                                </div>
                                <p className="text-xs text-brand-muted">{profile.xp} / {profile.xpToNextLevel} 經驗值</p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-brand-muted p-4 my-4 bg-brand-primary rounded-lg border border-brand-accent/20">
                            {visibilityMessage}
                        </div>
                    )}

                </div>

                {canViewProfile && (
                    <>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/20">
                                <p className="text-2xl font-bold text-brand-accent">{profile.missionsCompleted}</p>
                                <p className="text-sm text-brand-muted">完成任務</p>
                            </div>
                            <div className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/20">
                                <p className="text-2xl font-bold text-brand-accent">{(profile.friends || []).length}</p>
                                <p className="text-sm text-brand-muted">位好友</p>
                            </div>
                            <div className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/20">
                                <p className="text-2xl font-bold text-brand-accent">{profile.checkIns}</p>
                                <p className="text-sm text-brand-muted">打卡次數</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-brand-light mb-4 px-2">最近動態</h3>
                            <div className="space-y-4">
                                {friendFeed.length > 0 ? friendFeed.map(item => (
                                    <FeedCard
                                        key={item.id}
                                        item={item}
                                        isLink={false}
                                        onToggleLike={handleToggleLike}
                                        onAddComment={handleAddComment}
                                        currentUserProfile={currentUser}
                                        onDeleteRequest={handleDeleteRequest}
                                    />
                                )) : (
                                    <p className="text-center text-brand-muted py-8">這位用戶還沒有任何動態。</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

             <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default FriendProfilePage;
